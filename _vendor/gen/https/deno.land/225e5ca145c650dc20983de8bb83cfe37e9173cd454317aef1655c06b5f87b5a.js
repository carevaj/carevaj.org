import { globToRegExp } from "../deps/path.ts";
import { normalizePath } from "./utils/path.ts";
/** Search helper */ export default class Searcher {
  #pages;
  #files;
  #sourceData;
  #cache = new Map();
  #filters;
  constructor(options){
    this.#pages = options.pages;
    this.#files = options.files;
    this.#sourceData = options.sourceData;
    this.#filters = options.filters || [];
  }
  /** Clear the cache (used after a change in watch mode) */ deleteCache() {
    this.#cache.clear();
  }
  /**
   * Return the data in the scope of a path (file or folder)
   */ data(path = "/") {
    const normalized = normalizePath(path);
    const dirData = this.#sourceData.get(normalized);
    if (dirData) {
      return dirData;
    }
    const result = this.#pages.find((page)=>page.data.url === normalized);
    if (result) {
      return result.data;
    }
  }
  /** Search pages */ pages(query, sort, limit) {
    const result = this.#searchPages(query, sort);
    if (!limit) {
      return result;
    }
    return limit < 0 ? result.slice(limit) : result.slice(0, limit);
  }
  /** Search and return the first page */ page(query, sort) {
    return this.pages(query, sort)[0];
  }
  /** Search files using a glob */ files(globOrRegexp) {
    const files = this.#files.map((file)=>file.outputPath);
    const pages = this.#pages.map((page)=>page.outputPath);
    const allFiles = [
      ...files,
      ...pages
    ];
    if (!globOrRegexp) {
      return allFiles;
    }
    const regexp = typeof globOrRegexp === "string" ? globToRegExp(globOrRegexp) : globOrRegexp;
    return allFiles.filter((file)=>regexp.test(file));
  }
  /** Returns all values from the same key of a search */ values(key, query) {
    const values = new Set();
    this.#searchPages(query).forEach((data)=>{
      const value = data[key];
      if (Array.isArray(value)) {
        value.forEach((v)=>values.add(v));
      } else if (value !== undefined) {
        values.add(value);
      }
    });
    return Array.from(values);
  }
  /** Return the next page of a search */ nextPage(url, query, sort) {
    const pages = this.#searchPages(query, sort);
    const index = pages.findIndex((data)=>data.url === url);
    return index === -1 ? undefined : pages[index + 1];
  }
  /** Return the previous page of a search */ previousPage(url, query, sort) {
    const pages = this.#searchPages(query, sort);
    const index = pages.findIndex((data)=>data.url === url);
    return index <= 0 ? undefined : pages[index - 1];
  }
  #searchPages(query, sort = "date") {
    const id = JSON.stringify([
      query,
      sort
    ]);
    if (this.#cache.has(id)) {
      return [
        ...this.#cache.get(id)
      ];
    }
    const compiledFilter = buildFilter(query);
    const filters = compiledFilter ? this.#filters.concat([
      compiledFilter
    ]) : this.#filters;
    const result = filters.reduce((pages, filter)=>pages.filter(filter), this.#pages.map((page)=>page.data));
    result.sort(buildSort(sort));
    this.#cache.set(id, result);
    return [
      ...result
    ];
  }
}
/**
 * Parse a query string and return a function to filter a search result
 *
 * example: "title=foo level<3"
 * returns: (page) => page.data.title === "foo" && page.data.level < 3
 */ export function buildFilter(query = "") {
  // (?:(not)?(fieldName)(operator))?(value|"value"|'value')
  const matches = query ? query.matchAll(/(?:(!)?([\w.-]+)([!^$*]?=|[<>]=?))?([^'"\s][^\s=<>]*|"[^"]+"|'[^']+')/g) : [];
  const conditions = [];
  for (const match of matches){
    let [, not, key, operator, value] = match;
    if (!key) {
      key = "tags";
      operator = "*=";
      if (value?.startsWith("!")) {
        not = not ? "" : "!";
        value = value.slice(1);
      }
    }
    if (not) {
      operator = "!" + operator;
    }
    conditions.push([
      key,
      operator,
      compileValue(value)
    ]);
  }
  if (conditions.length) {
    return compileFilter(conditions);
  }
}
/**
 * Convert a parsed query to a function
 *
 * example: [["title", "=", "foo"], ["level", "<", 3]]
 * returns: (data) => data.title === "foo" && data.level < 3
 */ function compileFilter(conditions) {
  const filters = [];
  const args = [];
  const values = [];
  conditions.forEach((condition, index)=>{
    const [key, operator, value] = condition;
    const varName = `value${index}`;
    filters.push(compileCondition(key, operator, varName, value));
    args.push(varName);
    values.push(value);
  });
  args.push(`return (data) => ${filters.join(" && ")};`);
  const factory = new Function(...args);
  return factory(...values);
}
/**
 * Convert a parsed condition to a function
 *
 * example: key = "data.title", operator = "=" name = "value0" value = "foo"
 * returns: data.title === value0
 */ function compileCondition(key, operator, name, value) {
  key = key.replaceAll(".", "?.");
  if (value instanceof Date) {
    switch(operator){
      case "=":
        return `data.${key}?.getTime() === ${name}.getTime()`;
      case "!=":
        return `data.${key}?.getTime() !== ${name}.getTime()`;
      case "<":
      case "<=":
      case ">":
      case ">=":
        return `data.${key}?.getTime() ${operator} ${name}.getTime()`;
      case "!<":
      case "!<=":
      case "!>":
      case "!>=":
        return `!(data.${key}?.getTime() ${operator.substring(1)} ${name}.getTime())`;
      default:
        throw new Error(`Operator ${operator} not valid for Date values`);
    }
  }
  if (Array.isArray(value)) {
    switch(operator){
      case "=":
        return `${name}.some((i) => data.${key} === i)`;
      case "!=":
        return `${name}.some((i) => data.${key} !== i)`;
      case "^=":
        return `${name}.some((i) => data.${key}?.startsWith(i))`;
      case "!^=":
        return `!${name}.some((i) => data.${key}?.startsWith(i))`;
      case "$=":
        return `${name}.some((i) => data.${key}?.endsWith(i))`;
      case "!$=":
        return `!${name}.some((i) => data.${key}?.endsWith(i))`;
      case "*=":
        return `${name}.some((i) => data.${key}?.includes(i))`;
      case "!*=":
        return `${name}.some((i) => data.${key}?.includes(i))`;
      case "!<":
      case "!<=":
      case "!>":
      case "!>=":
        return `!${name}.some((i) => data.${key} ${operator.substring(1)} i)`;
      default:
        return `${name}.some((i) => data.${key} ${operator} i)`;
    }
  }
  switch(operator){
    case "=":
      return `data.${key} === ${name}`;
    case "!=":
      return `data.${key} !== ${name}`;
    case "^=":
      return `data.${key}?.startsWith(${name})`;
    case "!^=":
      return `!data.${key}?.startsWith(${name})`;
    case "$=":
      return `data.${key}?.endsWith(${name})`;
    case "!$=":
      return `!data.${key}?.endsWith(${name})`;
    case "*=":
      return `data.${key}?.includes(${name})`;
    case "!*=":
      return `!data.${key}?.includes(${name})`;
    case "!<":
    case "!<=":
    case "!>":
    case "!>=":
      return `!(data.${key} ${operator.substring(1)} ${name})`;
    default:
      return `data.${key} ${operator} ${name}`;
  }
}
/**
 * Compile a value and return the proper type
 *
 * example: "true" => true
 * example: "foo" => "foo"
 * example: "2021-06-12" => new Date(2021, 05, 12)
 */ function compileValue(value) {
  if (!value) {
    return value;
  }
  // Remove quotes
  const quoted = !!value.match(/^('|")(.*)\1$/);
  if (quoted) {
    value = value.slice(1, -1);
  }
  if (value.includes("|")) {
    return value.split("|").map((val)=>compileValue(val));
  }
  if (quoted) {
    return value;
  }
  if (value.toLowerCase() === "true") {
    return true;
  }
  if (value.toLowerCase() === "false") {
    return false;
  }
  if (value.toLowerCase() === "undefined") {
    return undefined;
  }
  if (value.toLowerCase() === "null") {
    return null;
  }
  if (value.match(/^\d+$/)) {
    return Number(value);
  }
  if (typeof value === "number" && isFinite(value)) {
    return Number(value);
  }
  // Date or datetime values:
  // yyyy-mm
  // yyyy-mm-dd
  // yyyy-mm-ddThh
  // yyyy-mm-ddThh:ii
  // yyyy-mm-ddThh:ii:ss
  const match = value.match(/^(\d{4})-(\d\d)(?:-(\d\d))?(?:T(\d\d)(?::(\d\d))?(?::(\d\d))?)?$/i);
  if (match) {
    const [, year, month, day, hour, minute, second] = match;
    return new Date(parseInt(year), parseInt(month) - 1, day ? parseInt(day) : 1, hour ? parseInt(hour) : 0, minute ? parseInt(minute) : 0, second ? parseInt(second) : 0);
  }
  return value;
}
/**
 * Convert a query to sort to a function
 *
 * example: "title=desc"
 * returns: (a, b) => a.title > b.title
 */ export function buildSort(sort) {
  let fn = "0";
  const pieces = sort.split(/\s+/).filter((arg)=>arg);
  pieces.reverse().forEach((arg)=>{
    const match = arg.match(/([\w.-]+)(?:=(asc|desc))?/);
    if (!match) {
      return;
    }
    let [, key, direction] = match;
    key = key.replaceAll(".", "?.");
    const operator = direction === "desc" ? ">" : "<";
    fn = `(a.${key} == b.${key} ? ${fn} : (a.${key} ${operator} b.${key} ? -1 : 1))`;
  });
  return new Function("a", "b", `return ${fn}`);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvbHVtZUB2Mi4yLjAvY29yZS9zZWFyY2hlci50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBnbG9iVG9SZWdFeHAgfSBmcm9tIFwiLi4vZGVwcy9wYXRoLnRzXCI7XG5pbXBvcnQgeyBub3JtYWxpemVQYXRoIH0gZnJvbSBcIi4vdXRpbHMvcGF0aC50c1wiO1xuXG5pbXBvcnQgdHlwZSB7IERhdGEsIFBhZ2UsIFN0YXRpY0ZpbGUgfSBmcm9tIFwiLi9maWxlLnRzXCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgT3B0aW9ucyB7XG4gIC8qKiBUaGUgcGFnZXMgYXJyYXkgKi9cbiAgcGFnZXM6IFBhZ2VbXTtcblxuICAvKiogVGhlIHN0YXRpYyBmaWxlcyBhcnJheSAqL1xuICBmaWxlczogU3RhdGljRmlsZVtdO1xuXG4gIC8qKiBDb250ZXh0IGRhdGEgKi9cbiAgc291cmNlRGF0YTogTWFwPHN0cmluZywgUGFydGlhbDxEYXRhPj47XG5cbiAgLyoqIEZpbHRlcnMgdG8gYXBwbHkgdG8gYWxsIHBhZ2Ugc2VhcmNoZXMgKi9cbiAgZmlsdGVycz86IEZpbHRlcltdO1xufVxuXG50eXBlIEZpbHRlciA9IChkYXRhOiBEYXRhKSA9PiBib29sZWFuO1xudHlwZSBDb25kaXRpb24gPSBbc3RyaW5nLCBzdHJpbmcsIHVua25vd25dO1xuXG4vKiogU2VhcmNoIGhlbHBlciAqL1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgU2VhcmNoZXIge1xuICAjcGFnZXM6IFBhZ2VbXTtcbiAgI2ZpbGVzOiBTdGF0aWNGaWxlW107XG4gICNzb3VyY2VEYXRhOiBNYXA8c3RyaW5nLCBQYXJ0aWFsPERhdGE+PjtcbiAgI2NhY2hlID0gbmV3IE1hcDxzdHJpbmcsIERhdGFbXT4oKTtcbiAgI2ZpbHRlcnM6IEZpbHRlcltdO1xuXG4gIGNvbnN0cnVjdG9yKG9wdGlvbnM6IE9wdGlvbnMpIHtcbiAgICB0aGlzLiNwYWdlcyA9IG9wdGlvbnMucGFnZXM7XG4gICAgdGhpcy4jZmlsZXMgPSBvcHRpb25zLmZpbGVzO1xuICAgIHRoaXMuI3NvdXJjZURhdGEgPSBvcHRpb25zLnNvdXJjZURhdGE7XG4gICAgdGhpcy4jZmlsdGVycyA9IG9wdGlvbnMuZmlsdGVycyB8fCBbXTtcbiAgfVxuXG4gIC8qKiBDbGVhciB0aGUgY2FjaGUgKHVzZWQgYWZ0ZXIgYSBjaGFuZ2UgaW4gd2F0Y2ggbW9kZSkgKi9cbiAgZGVsZXRlQ2FjaGUoKSB7XG4gICAgdGhpcy4jY2FjaGUuY2xlYXIoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm4gdGhlIGRhdGEgaW4gdGhlIHNjb3BlIG9mIGEgcGF0aCAoZmlsZSBvciBmb2xkZXIpXG4gICAqL1xuICBkYXRhPFQ+KHBhdGggPSBcIi9cIik6IFQgJiBQYXJ0aWFsPERhdGE+IHwgdW5kZWZpbmVkIHtcbiAgICBjb25zdCBub3JtYWxpemVkID0gbm9ybWFsaXplUGF0aChwYXRoKTtcbiAgICBjb25zdCBkaXJEYXRhID0gdGhpcy4jc291cmNlRGF0YS5nZXQobm9ybWFsaXplZCk7XG5cbiAgICBpZiAoZGlyRGF0YSkge1xuICAgICAgcmV0dXJuIGRpckRhdGEgYXMgVCAmIFBhcnRpYWw8RGF0YT47XG4gICAgfVxuXG4gICAgY29uc3QgcmVzdWx0ID0gdGhpcy4jcGFnZXMuZmluZCgocGFnZSkgPT4gcGFnZS5kYXRhLnVybCA9PT0gbm9ybWFsaXplZCk7XG5cbiAgICBpZiAocmVzdWx0KSB7XG4gICAgICByZXR1cm4gcmVzdWx0LmRhdGEgYXMgVCAmIFBhcnRpYWw8RGF0YT47XG4gICAgfVxuICB9XG5cbiAgLyoqIFNlYXJjaCBwYWdlcyAqL1xuICBwYWdlczxUPihxdWVyeT86IHN0cmluZywgc29ydD86IHN0cmluZywgbGltaXQ/OiBudW1iZXIpOiAoRGF0YSAmIFQpW10ge1xuICAgIGNvbnN0IHJlc3VsdCA9IHRoaXMuI3NlYXJjaFBhZ2VzPFQ+KHF1ZXJ5LCBzb3J0KTtcblxuICAgIGlmICghbGltaXQpIHtcbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuXG4gICAgcmV0dXJuIChsaW1pdCA8IDApID8gcmVzdWx0LnNsaWNlKGxpbWl0KSA6IHJlc3VsdC5zbGljZSgwLCBsaW1pdCk7XG4gIH1cblxuICAvKiogU2VhcmNoIGFuZCByZXR1cm4gdGhlIGZpcnN0IHBhZ2UgKi9cbiAgcGFnZTxUPihxdWVyeT86IHN0cmluZywgc29ydD86IHN0cmluZyk6IERhdGEgJiBUIHwgdW5kZWZpbmVkIHtcbiAgICByZXR1cm4gdGhpcy5wYWdlczxUPihxdWVyeSwgc29ydClbMF07XG4gIH1cblxuICAvKiogU2VhcmNoIGZpbGVzIHVzaW5nIGEgZ2xvYiAqL1xuICBmaWxlcyhnbG9iT3JSZWdleHA/OiBSZWdFeHAgfCBzdHJpbmcpOiBzdHJpbmdbXSB7XG4gICAgY29uc3QgZmlsZXMgPSB0aGlzLiNmaWxlcy5tYXAoKGZpbGUpID0+IGZpbGUub3V0cHV0UGF0aCk7XG4gICAgY29uc3QgcGFnZXMgPSB0aGlzLiNwYWdlcy5tYXAoKHBhZ2UpID0+IHBhZ2Uub3V0cHV0UGF0aCk7XG4gICAgY29uc3QgYWxsRmlsZXMgPSBbLi4uZmlsZXMsIC4uLnBhZ2VzXTtcblxuICAgIGlmICghZ2xvYk9yUmVnZXhwKSB7XG4gICAgICByZXR1cm4gYWxsRmlsZXM7XG4gICAgfVxuXG4gICAgY29uc3QgcmVnZXhwID0gdHlwZW9mIGdsb2JPclJlZ2V4cCA9PT0gXCJzdHJpbmdcIlxuICAgICAgPyBnbG9iVG9SZWdFeHAoZ2xvYk9yUmVnZXhwKVxuICAgICAgOiBnbG9iT3JSZWdleHA7XG5cbiAgICByZXR1cm4gYWxsRmlsZXMuZmlsdGVyKChmaWxlKSA9PiByZWdleHAudGVzdChmaWxlKSk7XG4gIH1cblxuICAvKiogUmV0dXJucyBhbGwgdmFsdWVzIGZyb20gdGhlIHNhbWUga2V5IG9mIGEgc2VhcmNoICovXG4gIHZhbHVlczxUID0gdW5rbm93bj4oa2V5OiBzdHJpbmcsIHF1ZXJ5Pzogc3RyaW5nKTogVFtdIHtcbiAgICBjb25zdCB2YWx1ZXMgPSBuZXcgU2V0KCk7XG5cbiAgICB0aGlzLiNzZWFyY2hQYWdlcyhxdWVyeSkuZm9yRWFjaCgoZGF0YSkgPT4ge1xuICAgICAgY29uc3QgdmFsdWUgPSBkYXRhW2tleV07XG5cbiAgICAgIGlmIChBcnJheS5pc0FycmF5KHZhbHVlKSkge1xuICAgICAgICB2YWx1ZS5mb3JFYWNoKCh2KSA9PiB2YWx1ZXMuYWRkKHYpKTtcbiAgICAgIH0gZWxzZSBpZiAodmFsdWUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICB2YWx1ZXMuYWRkKHZhbHVlKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHJldHVybiBBcnJheS5mcm9tKHZhbHVlcykgYXMgVFtdO1xuICB9XG5cbiAgLyoqIFJldHVybiB0aGUgbmV4dCBwYWdlIG9mIGEgc2VhcmNoICovXG4gIG5leHRQYWdlPFQgPSB1bmtub3duPihcbiAgICB1cmw6IHN0cmluZyxcbiAgICBxdWVyeT86IHN0cmluZyxcbiAgICBzb3J0Pzogc3RyaW5nLFxuICApOiBEYXRhICYgVCB8IHVuZGVmaW5lZCB7XG4gICAgY29uc3QgcGFnZXMgPSB0aGlzLiNzZWFyY2hQYWdlczxUPihxdWVyeSwgc29ydCk7XG4gICAgY29uc3QgaW5kZXggPSBwYWdlcy5maW5kSW5kZXgoKGRhdGEpID0+IGRhdGEudXJsID09PSB1cmwpO1xuXG4gICAgcmV0dXJuIChpbmRleCA9PT0gLTEpID8gdW5kZWZpbmVkIDogcGFnZXNbaW5kZXggKyAxXTtcbiAgfVxuXG4gIC8qKiBSZXR1cm4gdGhlIHByZXZpb3VzIHBhZ2Ugb2YgYSBzZWFyY2ggKi9cbiAgcHJldmlvdXNQYWdlPFQgPSB1bmtub3duPihcbiAgICB1cmw6IHN0cmluZyxcbiAgICBxdWVyeT86IHN0cmluZyxcbiAgICBzb3J0Pzogc3RyaW5nLFxuICApOiBEYXRhICYgVCB8IHVuZGVmaW5lZCB7XG4gICAgY29uc3QgcGFnZXMgPSB0aGlzLiNzZWFyY2hQYWdlczxUPihxdWVyeSwgc29ydCk7XG4gICAgY29uc3QgaW5kZXggPSBwYWdlcy5maW5kSW5kZXgoKGRhdGEpID0+IGRhdGEudXJsID09PSB1cmwpO1xuXG4gICAgcmV0dXJuIChpbmRleCA8PSAwKSA/IHVuZGVmaW5lZCA6IHBhZ2VzW2luZGV4IC0gMV07XG4gIH1cblxuICAjc2VhcmNoUGFnZXM8VCA9IHVua25vd24+KHF1ZXJ5Pzogc3RyaW5nLCBzb3J0ID0gXCJkYXRlXCIpOiAoRGF0YSAmIFQpW10ge1xuICAgIGNvbnN0IGlkID0gSlNPTi5zdHJpbmdpZnkoW3F1ZXJ5LCBzb3J0XSk7XG5cbiAgICBpZiAodGhpcy4jY2FjaGUuaGFzKGlkKSkge1xuICAgICAgcmV0dXJuIFsuLi50aGlzLiNjYWNoZS5nZXQoaWQpIV0gYXMgKERhdGEgJiBUKVtdO1xuICAgIH1cblxuICAgIGNvbnN0IGNvbXBpbGVkRmlsdGVyID0gYnVpbGRGaWx0ZXIocXVlcnkpO1xuICAgIGNvbnN0IGZpbHRlcnMgPSBjb21waWxlZEZpbHRlclxuICAgICAgPyB0aGlzLiNmaWx0ZXJzLmNvbmNhdChbY29tcGlsZWRGaWx0ZXJdKVxuICAgICAgOiB0aGlzLiNmaWx0ZXJzO1xuICAgIGNvbnN0IHJlc3VsdCA9IGZpbHRlcnMucmVkdWNlKFxuICAgICAgKHBhZ2VzLCBmaWx0ZXIpID0+IHBhZ2VzLmZpbHRlcihmaWx0ZXIpLFxuICAgICAgdGhpcy4jcGFnZXMubWFwKChwYWdlKSA9PiBwYWdlLmRhdGEpLFxuICAgICk7XG5cbiAgICByZXN1bHQuc29ydChidWlsZFNvcnQoc29ydCkpO1xuICAgIHRoaXMuI2NhY2hlLnNldChpZCwgcmVzdWx0KTtcbiAgICByZXR1cm4gWy4uLnJlc3VsdF0gYXMgKERhdGEgJiBUKVtdO1xuICB9XG59XG5cbi8qKlxuICogUGFyc2UgYSBxdWVyeSBzdHJpbmcgYW5kIHJldHVybiBhIGZ1bmN0aW9uIHRvIGZpbHRlciBhIHNlYXJjaCByZXN1bHRcbiAqXG4gKiBleGFtcGxlOiBcInRpdGxlPWZvbyBsZXZlbDwzXCJcbiAqIHJldHVybnM6IChwYWdlKSA9PiBwYWdlLmRhdGEudGl0bGUgPT09IFwiZm9vXCIgJiYgcGFnZS5kYXRhLmxldmVsIDwgM1xuICovXG5leHBvcnQgZnVuY3Rpb24gYnVpbGRGaWx0ZXIocXVlcnkgPSBcIlwiKTogRmlsdGVyIHwgdW5kZWZpbmVkIHtcbiAgLy8gKD86KG5vdCk/KGZpZWxkTmFtZSkob3BlcmF0b3IpKT8odmFsdWV8XCJ2YWx1ZVwifCd2YWx1ZScpXG4gIGNvbnN0IG1hdGNoZXMgPSBxdWVyeVxuICAgID8gcXVlcnkubWF0Y2hBbGwoXG4gICAgICAvKD86KCEpPyhbXFx3Li1dKykoWyFeJCpdPz18Wzw+XT0/KSk/KFteJ1wiXFxzXVteXFxzPTw+XSp8XCJbXlwiXStcInwnW14nXSsnKS9nLFxuICAgIClcbiAgICA6IFtdO1xuXG4gIGNvbnN0IGNvbmRpdGlvbnM6IENvbmRpdGlvbltdID0gW107XG5cbiAgZm9yIChjb25zdCBtYXRjaCBvZiBtYXRjaGVzKSB7XG4gICAgbGV0IFssIG5vdCwga2V5LCBvcGVyYXRvciwgdmFsdWVdID0gbWF0Y2g7XG5cbiAgICBpZiAoIWtleSkge1xuICAgICAga2V5ID0gXCJ0YWdzXCI7XG4gICAgICBvcGVyYXRvciA9IFwiKj1cIjtcblxuICAgICAgaWYgKHZhbHVlPy5zdGFydHNXaXRoKFwiIVwiKSkge1xuICAgICAgICBub3QgPSBub3QgPyBcIlwiIDogXCIhXCI7XG4gICAgICAgIHZhbHVlID0gdmFsdWUuc2xpY2UoMSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKG5vdCkge1xuICAgICAgb3BlcmF0b3IgPSBcIiFcIiArIG9wZXJhdG9yO1xuICAgIH1cblxuICAgIGNvbmRpdGlvbnMucHVzaChba2V5LCBvcGVyYXRvciwgY29tcGlsZVZhbHVlKHZhbHVlKV0pO1xuICB9XG5cbiAgaWYgKGNvbmRpdGlvbnMubGVuZ3RoKSB7XG4gICAgcmV0dXJuIGNvbXBpbGVGaWx0ZXIoY29uZGl0aW9ucyk7XG4gIH1cbn1cblxuLyoqXG4gKiBDb252ZXJ0IGEgcGFyc2VkIHF1ZXJ5IHRvIGEgZnVuY3Rpb25cbiAqXG4gKiBleGFtcGxlOiBbW1widGl0bGVcIiwgXCI9XCIsIFwiZm9vXCJdLCBbXCJsZXZlbFwiLCBcIjxcIiwgM11dXG4gKiByZXR1cm5zOiAoZGF0YSkgPT4gZGF0YS50aXRsZSA9PT0gXCJmb29cIiAmJiBkYXRhLmxldmVsIDwgM1xuICovXG5mdW5jdGlvbiBjb21waWxlRmlsdGVyKGNvbmRpdGlvbnM6IENvbmRpdGlvbltdKSB7XG4gIGNvbnN0IGZpbHRlcnM6IHN0cmluZ1tdID0gW107XG4gIGNvbnN0IGFyZ3M6IHN0cmluZ1tdID0gW107XG4gIGNvbnN0IHZhbHVlczogdW5rbm93bltdID0gW107XG5cbiAgY29uZGl0aW9ucy5mb3JFYWNoKChjb25kaXRpb24sIGluZGV4KSA9PiB7XG4gICAgY29uc3QgW2tleSwgb3BlcmF0b3IsIHZhbHVlXSA9IGNvbmRpdGlvbjtcbiAgICBjb25zdCB2YXJOYW1lID0gYHZhbHVlJHtpbmRleH1gO1xuXG4gICAgZmlsdGVycy5wdXNoKGNvbXBpbGVDb25kaXRpb24oa2V5LCBvcGVyYXRvciwgdmFyTmFtZSwgdmFsdWUpKTtcbiAgICBhcmdzLnB1c2godmFyTmFtZSk7XG4gICAgdmFsdWVzLnB1c2godmFsdWUpO1xuICB9KTtcblxuICBhcmdzLnB1c2goYHJldHVybiAoZGF0YSkgPT4gJHtmaWx0ZXJzLmpvaW4oXCIgJiYgXCIpfTtgKTtcblxuICBjb25zdCBmYWN0b3J5ID0gbmV3IEZ1bmN0aW9uKC4uLmFyZ3MpO1xuXG4gIHJldHVybiBmYWN0b3J5KC4uLnZhbHVlcyk7XG59XG5cbi8qKlxuICogQ29udmVydCBhIHBhcnNlZCBjb25kaXRpb24gdG8gYSBmdW5jdGlvblxuICpcbiAqIGV4YW1wbGU6IGtleSA9IFwiZGF0YS50aXRsZVwiLCBvcGVyYXRvciA9IFwiPVwiIG5hbWUgPSBcInZhbHVlMFwiIHZhbHVlID0gXCJmb29cIlxuICogcmV0dXJuczogZGF0YS50aXRsZSA9PT0gdmFsdWUwXG4gKi9cbmZ1bmN0aW9uIGNvbXBpbGVDb25kaXRpb24oXG4gIGtleTogc3RyaW5nLFxuICBvcGVyYXRvcjogc3RyaW5nLFxuICBuYW1lOiBzdHJpbmcsXG4gIHZhbHVlOiB1bmtub3duLFxuKSB7XG4gIGtleSA9IGtleS5yZXBsYWNlQWxsKFwiLlwiLCBcIj8uXCIpO1xuXG4gIGlmICh2YWx1ZSBpbnN0YW5jZW9mIERhdGUpIHtcbiAgICBzd2l0Y2ggKG9wZXJhdG9yKSB7XG4gICAgICBjYXNlIFwiPVwiOlxuICAgICAgICByZXR1cm4gYGRhdGEuJHtrZXl9Py5nZXRUaW1lKCkgPT09ICR7bmFtZX0uZ2V0VGltZSgpYDtcblxuICAgICAgY2FzZSBcIiE9XCI6XG4gICAgICAgIHJldHVybiBgZGF0YS4ke2tleX0/LmdldFRpbWUoKSAhPT0gJHtuYW1lfS5nZXRUaW1lKClgO1xuXG4gICAgICBjYXNlIFwiPFwiOlxuICAgICAgY2FzZSBcIjw9XCI6XG4gICAgICBjYXNlIFwiPlwiOlxuICAgICAgY2FzZSBcIj49XCI6XG4gICAgICAgIHJldHVybiBgZGF0YS4ke2tleX0/LmdldFRpbWUoKSAke29wZXJhdG9yfSAke25hbWV9LmdldFRpbWUoKWA7XG5cbiAgICAgIGNhc2UgXCIhPFwiOlxuICAgICAgY2FzZSBcIiE8PVwiOlxuICAgICAgY2FzZSBcIiE+XCI6XG4gICAgICBjYXNlIFwiIT49XCI6XG4gICAgICAgIHJldHVybiBgIShkYXRhLiR7a2V5fT8uZ2V0VGltZSgpICR7XG4gICAgICAgICAgb3BlcmF0b3Iuc3Vic3RyaW5nKDEpXG4gICAgICAgIH0gJHtuYW1lfS5nZXRUaW1lKCkpYDtcblxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBPcGVyYXRvciAke29wZXJhdG9yfSBub3QgdmFsaWQgZm9yIERhdGUgdmFsdWVzYCk7XG4gICAgfVxuICB9XG5cbiAgaWYgKEFycmF5LmlzQXJyYXkodmFsdWUpKSB7XG4gICAgc3dpdGNoIChvcGVyYXRvcikge1xuICAgICAgY2FzZSBcIj1cIjpcbiAgICAgICAgcmV0dXJuIGAke25hbWV9LnNvbWUoKGkpID0+IGRhdGEuJHtrZXl9ID09PSBpKWA7XG5cbiAgICAgIGNhc2UgXCIhPVwiOlxuICAgICAgICByZXR1cm4gYCR7bmFtZX0uc29tZSgoaSkgPT4gZGF0YS4ke2tleX0gIT09IGkpYDtcblxuICAgICAgY2FzZSBcIl49XCI6XG4gICAgICAgIHJldHVybiBgJHtuYW1lfS5zb21lKChpKSA9PiBkYXRhLiR7a2V5fT8uc3RhcnRzV2l0aChpKSlgO1xuXG4gICAgICBjYXNlIFwiIV49XCI6XG4gICAgICAgIHJldHVybiBgISR7bmFtZX0uc29tZSgoaSkgPT4gZGF0YS4ke2tleX0/LnN0YXJ0c1dpdGgoaSkpYDtcblxuICAgICAgY2FzZSBcIiQ9XCI6XG4gICAgICAgIHJldHVybiBgJHtuYW1lfS5zb21lKChpKSA9PiBkYXRhLiR7a2V5fT8uZW5kc1dpdGgoaSkpYDtcblxuICAgICAgY2FzZSBcIiEkPVwiOlxuICAgICAgICByZXR1cm4gYCEke25hbWV9LnNvbWUoKGkpID0+IGRhdGEuJHtrZXl9Py5lbmRzV2l0aChpKSlgO1xuXG4gICAgICBjYXNlIFwiKj1cIjpcbiAgICAgICAgcmV0dXJuIGAke25hbWV9LnNvbWUoKGkpID0+IGRhdGEuJHtrZXl9Py5pbmNsdWRlcyhpKSlgO1xuXG4gICAgICBjYXNlIFwiISo9XCI6XG4gICAgICAgIHJldHVybiBgJHtuYW1lfS5zb21lKChpKSA9PiBkYXRhLiR7a2V5fT8uaW5jbHVkZXMoaSkpYDtcblxuICAgICAgY2FzZSBcIiE8XCI6XG4gICAgICBjYXNlIFwiITw9XCI6XG4gICAgICBjYXNlIFwiIT5cIjpcbiAgICAgIGNhc2UgXCIhPj1cIjpcbiAgICAgICAgcmV0dXJuIGAhJHtuYW1lfS5zb21lKChpKSA9PiBkYXRhLiR7a2V5fSAke29wZXJhdG9yLnN1YnN0cmluZygxKX0gaSlgO1xuXG4gICAgICBkZWZhdWx0OiAvLyA8IDw9ID4gPj1cbiAgICAgICAgcmV0dXJuIGAke25hbWV9LnNvbWUoKGkpID0+IGRhdGEuJHtrZXl9ICR7b3BlcmF0b3J9IGkpYDtcbiAgICB9XG4gIH1cblxuICBzd2l0Y2ggKG9wZXJhdG9yKSB7XG4gICAgY2FzZSBcIj1cIjpcbiAgICAgIHJldHVybiBgZGF0YS4ke2tleX0gPT09ICR7bmFtZX1gO1xuXG4gICAgY2FzZSBcIiE9XCI6XG4gICAgICByZXR1cm4gYGRhdGEuJHtrZXl9ICE9PSAke25hbWV9YDtcblxuICAgIGNhc2UgXCJePVwiOlxuICAgICAgcmV0dXJuIGBkYXRhLiR7a2V5fT8uc3RhcnRzV2l0aCgke25hbWV9KWA7XG5cbiAgICBjYXNlIFwiIV49XCI6XG4gICAgICByZXR1cm4gYCFkYXRhLiR7a2V5fT8uc3RhcnRzV2l0aCgke25hbWV9KWA7XG5cbiAgICBjYXNlIFwiJD1cIjpcbiAgICAgIHJldHVybiBgZGF0YS4ke2tleX0/LmVuZHNXaXRoKCR7bmFtZX0pYDtcblxuICAgIGNhc2UgXCIhJD1cIjpcbiAgICAgIHJldHVybiBgIWRhdGEuJHtrZXl9Py5lbmRzV2l0aCgke25hbWV9KWA7XG5cbiAgICBjYXNlIFwiKj1cIjpcbiAgICAgIHJldHVybiBgZGF0YS4ke2tleX0/LmluY2x1ZGVzKCR7bmFtZX0pYDtcblxuICAgIGNhc2UgXCIhKj1cIjpcbiAgICAgIHJldHVybiBgIWRhdGEuJHtrZXl9Py5pbmNsdWRlcygke25hbWV9KWA7XG5cbiAgICBjYXNlIFwiITxcIjpcbiAgICBjYXNlIFwiITw9XCI6XG4gICAgY2FzZSBcIiE+XCI6XG4gICAgY2FzZSBcIiE+PVwiOlxuICAgICAgcmV0dXJuIGAhKGRhdGEuJHtrZXl9ICR7b3BlcmF0b3Iuc3Vic3RyaW5nKDEpfSAke25hbWV9KWA7XG5cbiAgICBkZWZhdWx0OiAvLyA8IDw9ID4gPj1cbiAgICAgIHJldHVybiBgZGF0YS4ke2tleX0gJHtvcGVyYXRvcn0gJHtuYW1lfWA7XG4gIH1cbn1cblxuLyoqXG4gKiBDb21waWxlIGEgdmFsdWUgYW5kIHJldHVybiB0aGUgcHJvcGVyIHR5cGVcbiAqXG4gKiBleGFtcGxlOiBcInRydWVcIiA9PiB0cnVlXG4gKiBleGFtcGxlOiBcImZvb1wiID0+IFwiZm9vXCJcbiAqIGV4YW1wbGU6IFwiMjAyMS0wNi0xMlwiID0+IG5ldyBEYXRlKDIwMjEsIDA1LCAxMilcbiAqL1xuZnVuY3Rpb24gY29tcGlsZVZhbHVlKHZhbHVlOiBzdHJpbmcpOiB1bmtub3duIHtcbiAgaWYgKCF2YWx1ZSkge1xuICAgIHJldHVybiB2YWx1ZTtcbiAgfVxuXG4gIC8vIFJlbW92ZSBxdW90ZXNcbiAgY29uc3QgcXVvdGVkID0gISF2YWx1ZS5tYXRjaCgvXignfFwiKSguKilcXDEkLyk7XG5cbiAgaWYgKHF1b3RlZCkge1xuICAgIHZhbHVlID0gdmFsdWUuc2xpY2UoMSwgLTEpO1xuICB9XG5cbiAgaWYgKHZhbHVlLmluY2x1ZGVzKFwifFwiKSkge1xuICAgIHJldHVybiB2YWx1ZS5zcGxpdChcInxcIikubWFwKCh2YWwpID0+IGNvbXBpbGVWYWx1ZSh2YWwpKTtcbiAgfVxuXG4gIGlmIChxdW90ZWQpIHtcbiAgICByZXR1cm4gdmFsdWU7XG4gIH1cblxuICBpZiAodmFsdWUudG9Mb3dlckNhc2UoKSA9PT0gXCJ0cnVlXCIpIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICBpZiAodmFsdWUudG9Mb3dlckNhc2UoKSA9PT0gXCJmYWxzZVwiKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIGlmICh2YWx1ZS50b0xvd2VyQ2FzZSgpID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxuICBpZiAodmFsdWUudG9Mb3dlckNhc2UoKSA9PT0gXCJudWxsXCIpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuICBpZiAodmFsdWUubWF0Y2goL15cXGQrJC8pKSB7XG4gICAgcmV0dXJuIE51bWJlcih2YWx1ZSk7XG4gIH1cbiAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gXCJudW1iZXJcIiAmJiBpc0Zpbml0ZSh2YWx1ZSkpIHtcbiAgICByZXR1cm4gTnVtYmVyKHZhbHVlKTtcbiAgfVxuICAvLyBEYXRlIG9yIGRhdGV0aW1lIHZhbHVlczpcbiAgLy8geXl5eS1tbVxuICAvLyB5eXl5LW1tLWRkXG4gIC8vIHl5eXktbW0tZGRUaGhcbiAgLy8geXl5eS1tbS1kZFRoaDppaVxuICAvLyB5eXl5LW1tLWRkVGhoOmlpOnNzXG4gIGNvbnN0IG1hdGNoID0gdmFsdWUubWF0Y2goXG4gICAgL14oXFxkezR9KS0oXFxkXFxkKSg/Oi0oXFxkXFxkKSk/KD86VChcXGRcXGQpKD86OihcXGRcXGQpKT8oPzo6KFxcZFxcZCkpPyk/JC9pLFxuICApO1xuXG4gIGlmIChtYXRjaCkge1xuICAgIGNvbnN0IFssIHllYXIsIG1vbnRoLCBkYXksIGhvdXIsIG1pbnV0ZSwgc2Vjb25kXSA9IG1hdGNoO1xuXG4gICAgcmV0dXJuIG5ldyBEYXRlKFxuICAgICAgcGFyc2VJbnQoeWVhciksXG4gICAgICBwYXJzZUludChtb250aCkgLSAxLFxuICAgICAgZGF5ID8gcGFyc2VJbnQoZGF5KSA6IDEsXG4gICAgICBob3VyID8gcGFyc2VJbnQoaG91cikgOiAwLFxuICAgICAgbWludXRlID8gcGFyc2VJbnQobWludXRlKSA6IDAsXG4gICAgICBzZWNvbmQgPyBwYXJzZUludChzZWNvbmQpIDogMCxcbiAgICApO1xuICB9XG5cbiAgcmV0dXJuIHZhbHVlO1xufVxuXG4vKipcbiAqIENvbnZlcnQgYSBxdWVyeSB0byBzb3J0IHRvIGEgZnVuY3Rpb25cbiAqXG4gKiBleGFtcGxlOiBcInRpdGxlPWRlc2NcIlxuICogcmV0dXJuczogKGEsIGIpID0+IGEudGl0bGUgPiBiLnRpdGxlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBidWlsZFNvcnQoc29ydDogc3RyaW5nKTogKGE6IERhdGEsIGI6IERhdGEpID0+IG51bWJlciB7XG4gIGxldCBmbiA9IFwiMFwiO1xuXG4gIGNvbnN0IHBpZWNlcyA9IHNvcnQuc3BsaXQoL1xccysvKS5maWx0ZXIoKGFyZykgPT4gYXJnKTtcblxuICBwaWVjZXMucmV2ZXJzZSgpLmZvckVhY2goKGFyZykgPT4ge1xuICAgIGNvbnN0IG1hdGNoID0gYXJnLm1hdGNoKC8oW1xcdy4tXSspKD86PShhc2N8ZGVzYykpPy8pO1xuXG4gICAgaWYgKCFtYXRjaCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGxldCBbLCBrZXksIGRpcmVjdGlvbl0gPSBtYXRjaDtcbiAgICBrZXkgPSBrZXkucmVwbGFjZUFsbChcIi5cIiwgXCI/LlwiKTtcbiAgICBjb25zdCBvcGVyYXRvciA9IGRpcmVjdGlvbiA9PT0gXCJkZXNjXCIgPyBcIj5cIiA6IFwiPFwiO1xuICAgIGZuID1cbiAgICAgIGAoYS4ke2tleX0gPT0gYi4ke2tleX0gPyAke2ZufSA6IChhLiR7a2V5fSAke29wZXJhdG9yfSBiLiR7a2V5fSA/IC0xIDogMSkpYDtcbiAgfSk7XG5cbiAgcmV0dXJuIG5ldyBGdW5jdGlvbihcImFcIiwgXCJiXCIsIGByZXR1cm4gJHtmbn1gKSBhcyAoYTogRGF0YSwgYjogRGF0YSkgPT4gbnVtYmVyO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFNBQVMsWUFBWSxRQUFRLGtCQUFrQjtBQUMvQyxTQUFTLGFBQWEsUUFBUSxrQkFBa0I7QUFxQmhELGtCQUFrQixHQUNsQixlQUFlLE1BQU07RUFDbkIsQ0FBQyxLQUFLLENBQVM7RUFDZixDQUFDLEtBQUssQ0FBZTtFQUNyQixDQUFDLFVBQVUsQ0FBNkI7RUFDeEMsQ0FBQyxLQUFLLEdBQUcsSUFBSSxNQUFzQjtFQUNuQyxDQUFDLE9BQU8sQ0FBVztFQUVuQixZQUFZLE9BQWdCLENBQUU7SUFDNUIsSUFBSSxDQUFDLENBQUMsS0FBSyxHQUFHLFFBQVEsS0FBSztJQUMzQixJQUFJLENBQUMsQ0FBQyxLQUFLLEdBQUcsUUFBUSxLQUFLO0lBQzNCLElBQUksQ0FBQyxDQUFDLFVBQVUsR0FBRyxRQUFRLFVBQVU7SUFDckMsSUFBSSxDQUFDLENBQUMsT0FBTyxHQUFHLFFBQVEsT0FBTyxJQUFJLEVBQUU7RUFDdkM7RUFFQSx3REFBd0QsR0FDeEQsY0FBYztJQUNaLElBQUksQ0FBQyxDQUFDLEtBQUssQ0FBQyxL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