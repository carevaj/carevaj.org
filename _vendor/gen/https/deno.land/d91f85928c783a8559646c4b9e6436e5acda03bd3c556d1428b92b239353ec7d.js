import tokenize from "./tokenizer.ts";
import { transformTemplateCode } from "./transformer.ts";
export class Environment {
  cache = new Map();
  options;
  tags = [];
  tokenPreprocessors = [];
  filters = {};
  utils = {};
  constructor(options){
    this.options = options;
  }
  use(plugin) {
    plugin(this);
  }
  async run(file, data, from) {
    const template = await this.load(file, from);
    return await template(data);
  }
  async runString(source, data, file) {
    if (file) {
      const cached = this.cache.get(file);
      if (cached) {
        return await cached(data);
      }
      const template = this.compile(source, file);
      this.cache.set(file, template);
      return await template(data);
    }
    const template = this.compile(source, file);
    return await template(data);
  }
  runStringSync(source, data) {
    const template = this.compile(source, "", {}, true);
    return template(data);
  }
  compile(source, path, defaults, sync = false) {
    const tokens = this.tokenize(source, path);
    let code = this.compileTokens(tokens).join("\n");
    const { dataVarname, useWith } = this.options;
    if (useWith) {
      code = transformTemplateCode(code, dataVarname);
    }
    const constructor = new Function("__file", "__env", "__defaults", `return${sync ? "" : " async"} function (${dataVarname}) {
        let __pos = 0;
        try {
          ${dataVarname} = Object.assign({}, __defaults, ${dataVarname});
          const __exports = { content: "" };
          ${code}
          return __exports;
        } catch (cause) {
          const template = __env.cache.get(__file);
          throw __env.createError(__file, template?.source || "", __pos, cause);
        }
      }
      `);
    const template = constructor(path, this, defaults);
    template.file = path;
    template.code = code;
    template.source = source;
    return template;
  }
  tokenize(source, path) {
    const result = tokenize(source);
    let { tokens } = result;
    const { position, error } = result;
    if (error) {
      throw this.createError(path || "unknown", source, position, error);
    }
    for (const tokenPreprocessor of this.tokenPreprocessors){
      const result = tokenPreprocessor(this, tokens, path);
      if (result !== undefined) {
        tokens = result;
      }
    }
    return tokens;
  }
  async load(file, from) {
    const path = from ? this.options.loader.resolve(from, file) : file;
    if (!this.cache.has(path)) {
      // Remove query and hash params from path before loading
      const cleanPath = path.split("?")[0].split("#")[0];
      const { source, data } = await this.options.loader.load(cleanPath);
      const template = this.compile(source, path, data);
      this.cache.set(path, template);
    }
    return this.cache.get(path);
  }
  compileTokens(tokens, outputVar = "__exports.content", stopAt) {
    const compiled = [];
    tokens: while(tokens.length > 0){
      if (stopAt && tokens[0][0] === "tag" && stopAt.includes(tokens[0][1])) {
        break;
      }
      const [type, code, pos] = tokens.shift();
      if (type === "comment") {
        continue;
      }
      if (type === "string") {
        if (code !== "") {
          compiled.push(`${outputVar} += ${JSON.stringify(code)};`);
        }
        continue;
      }
      if (type === "tag") {
        compiled.push(`__pos = ${pos};`);
        for (const tag of this.tags){
          const compiledTag = tag(this, code, outputVar, tokens);
          if (typeof compiledTag === "string") {
            compiled.push(compiledTag);
            continue tokens;
          }
        }
        // Unknown tag, just print it
        const expression = this.compileFilters(tokens, code, this.options.autoescape);
        compiled.push(`${outputVar} += (${expression}) ?? "";`);
        continue;
      }
      throw new Error(`Unknown token type "${type}"`);
    }
    return compiled;
  }
  compileFilters(tokens, output, autoescape = false) {
    let unescaped = false;
    while(tokens.length > 0 && tokens[0][0] === "filter"){
      const [, code] = tokens.shift();
      const match = code.match(/^(await\s+)?([\w.]+)(?:\((.*)\))?$/);
      if (!match) {
        throw new Error(`Invalid filter: ${code}`);
      }
      const [_, isAsync, name, args] = match;
      if (!this.filters[name]) {
        if (name === "safe") {
          unescaped = true;
        } else if (isGlobal(name)) {
          // If a global function
          output = `${isAsync ? "await " : ""}${name}(${output}${args ? `, ${args}` : ""})`;
        } else {
          // It's a prototype's method (e.g. `String.toUpperCase()`)
          output = `${isAsync ? "await " : ""}(${output})?.${name}?.(${args ? args : ""})`;
        }
      } else {
        // It's a filter (e.g. filters.upper())
        const { dataVarname } = this.options;
        output = `${isAsync || checkAsync(this.filters[name]) ? "await " : ""}__env.filters.${name}.call({data:${dataVarname},env:__env}, ${output}${args ? `, ${args}` : ""})`;
      }
    }
    // Escape by default
    if (autoescape && !unescaped) {
      output = `__env.filters.escape(${output})`;
    }
    return output;
  }
  createError(path, source, position, cause) {
    if (!source) {
      return cause;
    }
    const [line, column, code] = errorLine(source, position);
    return new Error(`Error in the template ${path}:${line}:${column}\n\n${code.trim()}\n\n> ${cause.message}\n`, {
      cause
    });
  }
}
function isGlobal(name) {
  // @ts-ignore TS doesn't know about globalThis
  if (globalThis[name]) {
    return true;
  }
  if (name.includes(".")) {
    const [obj, prop] = name.split(".");
    // @ts-ignore TS doesn't know about globalThis
    return typeof globalThis[obj]?.[prop] === "function";
  }
}
/** Returns the number and code of the errored line */ export function errorLine(source, pos) {
  let line = 1;
  let column = 1;
  for(let index = 0; index < pos; index++){
    if (source[index] === "\n" || source[index] === "\r" && source[index + 1] === "\n") {
      line++;
      column = 1;
      if (source[index] === "\r") {
        index++;
      }
    } else {
      column++;
    }
  }
  return [
    line,
    column,
    source.split("\n")[line - 1]
  ];
}
function checkAsync(fn) {
  return fn.constructor?.name === "AsyncFunction";
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvdmVudG9AdjAuMTIuNS9zcmMvZW52aXJvbm1lbnQudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHRva2VuaXplLCB7IFRva2VuIH0gZnJvbSBcIi4vdG9rZW5pemVyLnRzXCI7XG5cbmltcG9ydCB0eXBlIHsgTG9hZGVyIH0gZnJvbSBcIi4vbG9hZGVyLnRzXCI7XG5pbXBvcnQgeyB0cmFuc2Zvcm1UZW1wbGF0ZUNvZGUgfSBmcm9tIFwiLi90cmFuc2Zvcm1lci50c1wiO1xuXG5leHBvcnQgaW50ZXJmYWNlIFRlbXBsYXRlUmVzdWx0IHtcbiAgY29udGVudDogc3RyaW5nO1xuICBba2V5OiBzdHJpbmddOiB1bmtub3duO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFRlbXBsYXRlIHtcbiAgKGRhdGE/OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPik6IFByb21pc2U8VGVtcGxhdGVSZXN1bHQ+O1xuICBzb3VyY2U6IHN0cmluZztcbiAgY29kZTogc3RyaW5nO1xuICBmaWxlPzogc3RyaW5nO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFRlbXBsYXRlU3luYyB7XG4gIChkYXRhPzogUmVjb3JkPHN0cmluZywgdW5rbm93bj4pOiBUZW1wbGF0ZVJlc3VsdDtcbiAgc291cmNlOiBzdHJpbmc7XG4gIGNvZGU6IHN0cmluZztcbiAgZmlsZT86IHN0cmluZztcbn1cblxuZXhwb3J0IHR5cGUgVG9rZW5QcmVwcm9jZXNzb3IgPSAoXG4gIGVudjogRW52aXJvbm1lbnQsXG4gIHRva2VuczogVG9rZW5bXSxcbiAgcGF0aD86IHN0cmluZyxcbikgPT4gVG9rZW5bXSB8IHZvaWQ7XG5cbmV4cG9ydCB0eXBlIFRhZyA9IChcbiAgZW52OiBFbnZpcm9ubWVudCxcbiAgY29kZTogc3RyaW5nLFxuICBvdXRwdXQ6IHN0cmluZyxcbiAgdG9rZW5zOiBUb2tlbltdLFxuKSA9PiBzdHJpbmcgfCB1bmRlZmluZWQ7XG5cbmV4cG9ydCB0eXBlIEZpbHRlclRoaXMgPSB7XG4gIGRhdGE6IFJlY29yZDxzdHJpbmcsIHVua25vd24+O1xuICBlbnY6IEVudmlyb25tZW50O1xufTtcblxuLy8gZGVuby1saW50LWlnbm9yZSBuby1leHBsaWNpdC1hbnlcbmV4cG9ydCB0eXBlIEZpbHRlciA9ICh0aGlzOiBGaWx0ZXJUaGlzLCAuLi5hcmdzOiBhbnlbXSkgPT4gYW55O1xuXG5leHBvcnQgdHlwZSBQbHVnaW4gPSAoZW52OiBFbnZpcm9ubWVudCkgPT4gdm9pZDtcblxuZXhwb3J0IGludGVyZmFjZSBPcHRpb25zIHtcbiAgbG9hZGVyOiBMb2FkZXI7XG4gIGRhdGFWYXJuYW1lOiBzdHJpbmc7XG4gIGF1dG9lc2NhcGU6IGJvb2xlYW47XG4gIHVzZVdpdGg6IGJvb2xlYW47XG59XG5cbmV4cG9ydCBjbGFzcyBFbnZpcm9ubWVudCB7XG4gIGNhY2hlID0gbmV3IE1hcDxzdHJpbmcsIFRlbXBsYXRlPigpO1xuICBvcHRpb25zOiBPcHRpb25zO1xuICB0YWdzOiBUYWdbXSA9IFtdO1xuICB0b2tlblByZXByb2Nlc3NvcnM6IFRva2VuUHJlcHJvY2Vzc29yW10gPSBbXTtcbiAgZmlsdGVyczogUmVjb3JkPHN0cmluZywgRmlsdGVyPiA9IHt9O1xuICB1dGlsczogUmVjb3JkPHN0cmluZywgdW5rbm93bj4gPSB7fTtcblxuICBjb25zdHJ1Y3RvcihvcHRpb25zOiBPcHRpb25zKSB7XG4gICAgdGhpcy5vcHRpb25zID0gb3B0aW9ucztcbiAgfVxuXG4gIHVzZShwbHVnaW46IFBsdWdpbikge1xuICAgIHBsdWdpbih0aGlzKTtcbiAgfVxuXG4gIGFzeW5jIHJ1bihcbiAgICBmaWxlOiBzdHJpbmcsXG4gICAgZGF0YTogUmVjb3JkPHN0cmluZywgdW5rbm93bj4sXG4gICAgZnJvbT86IHN0cmluZyxcbiAgKTogUHJvbWlzZTxUZW1wbGF0ZVJlc3VsdD4ge1xuICAgIGNvbnN0IHRlbXBsYXRlID0gYXdhaXQgdGhpcy5sb2FkKGZpbGUsIGZyb20pO1xuICAgIHJldHVybiBhd2FpdCB0ZW1wbGF0ZShkYXRhKTtcbiAgfVxuXG4gIGFzeW5jIHJ1blN0cmluZyhcbiAgICBzb3VyY2U6IHN0cmluZyxcbiAgICBkYXRhPzogUmVjb3JkPHN0cmluZywgdW5rbm93bj4sXG4gICAgZmlsZT86IHN0cmluZyxcbiAgKTogUHJvbWlzZTxUZW1wbGF0ZVJlc3VsdD4ge1xuICAgIGlmIChmaWxlKSB7XG4gICAgICBjb25zdCBjYWNoZWQgPSB0aGlzLmNhY2hlLmdldChmaWxlKTtcblxuICAgICAgaWYgKGNhY2hlZCkge1xuICAgICAgICByZXR1cm4gYXdhaXQgY2FjaGVkKGRhdGEpO1xuICAgICAgfVxuXG4gICAgICBjb25zdCB0ZW1wbGF0ZSA9IHRoaXMuY29tcGlsZShzb3VyY2UsIGZpbGUpO1xuICAgICAgdGhpcy5jYWNoZS5zZXQoZmlsZSwgdGVtcGxhdGUpO1xuXG4gICAgICByZXR1cm4gYXdhaXQgdGVtcGxhdGUoZGF0YSk7XG4gICAgfVxuXG4gICAgY29uc3QgdGVtcGxhdGUgPSB0aGlzLmNvbXBpbGUoc291cmNlLCBmaWxlKTtcbiAgICByZXR1cm4gYXdhaXQgdGVtcGxhdGUoZGF0YSk7XG4gIH1cblxuICBydW5TdHJpbmdTeW5jKFxuICAgIHNvdXJjZTogc3RyaW5nLFxuICAgIGRhdGE/OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPixcbiAgKTogVGVtcGxhdGVSZXN1bHQge1xuICAgIGNvbnN0IHRlbXBsYXRlID0gdGhpcy5jb21waWxlKHNvdXJjZSwgXCJcIiwge30sIHRydWUpO1xuICAgIHJldHVybiB0ZW1wbGF0ZShkYXRhKTtcbiAgfVxuXG4gIGNvbXBpbGUoXG4gICAgc291cmNlOiBzdHJpbmcsXG4gICAgcGF0aD86IHN0cmluZyxcbiAgICBkZWZhdWx0cz86IFJlY29yZDxzdHJpbmcsIHVua25vd24+LFxuICAgIHN5bmM/OiBmYWxzZSxcbiAgKTogVGVtcGxhdGU7XG4gIGNvbXBpbGUoXG4gICAgc291cmNlOiBzdHJpbmcsXG4gICAgcGF0aD86IHN0cmluZyxcbiAgICBkZWZhdWx0cz86IFJlY29yZDxzdHJpbmcsIHVua25vd24+LFxuICAgIHN5bmM/OiB0cnVlLFxuICApOiBUZW1wbGF0ZVN5bmM7XG4gIGNvbXBpbGUoXG4gICAgc291cmNlOiBzdHJpbmcsXG4gICAgcGF0aD86IHN0cmluZyxcbiAgICBkZWZhdWx0cz86IFJlY29yZDxzdHJpbmcsIHVua25vd24+LFxuICAgIHN5bmMgPSBmYWxzZSxcbiAgKTogVGVtcGxhdGUgfCBUZW1wbGF0ZVN5bmMge1xuICAgIGNvbnN0IHRva2VucyA9IHRoaXMudG9rZW5pemUoc291cmNlLCBwYXRoKTtcbiAgICBsZXQgY29kZSA9IHRoaXMuY29tcGlsZVRva2Vucyh0b2tlbnMpLmpvaW4oXCJcXG5cIik7XG5cbiAgICBjb25zdCB7IGRhdGFWYXJuYW1lLCB1c2VXaXRoIH0gPSB0aGlzLm9wdGlvbnM7XG5cbiAgICBpZiAodXNlV2l0aCkge1xuICAgICAgY29kZSA9IHRyYW5zZm9ybVRlbXBsYXRlQ29kZShjb2RlLCBkYXRhVmFybmFtZSk7XG4gICAgfVxuXG4gICAgY29uc3QgY29uc3RydWN0b3IgPSBuZXcgRnVuY3Rpb24oXG4gICAgICBcIl9fZmlsZVwiLFxuICAgICAgXCJfX2VudlwiLFxuICAgICAgXCJfX2RlZmF1bHRzXCIsXG4gICAgICBgcmV0dXJuJHtzeW5jID8gXCJcIiA6IFwiIGFzeW5jXCJ9IGZ1bmN0aW9uICgke2RhdGFWYXJuYW1lfSkge1xuICAgICAgICBsZXQgX19wb3MgPSAwO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICR7ZGF0YVZhcm5hbWV9ID0gT2JqZWN0LmFzc2lnbih7fSwgX19kZWZhdWx0cywgJHtkYXRhVmFybmFtZX0pO1xuICAgICAgICAgIGNvbnN0IF9fZXhwb3J0cyA9IHsgY29udGVudDogXCJcIiB9O1xuICAgICAgICAgICR7Y29kZX1cbiAgICAgICAgICByZXR1cm4gX19leHBvcnRzO1xuICAgICAgICB9IGNhdGNoIChjYXVzZSkge1xuICAgICAgICAgIGNvbnN0IHRlbXBsYXRlID0gX19lbnYuY2FjaGUuZ2V0KF9fZmlsZSk7XG4gICAgICAgICAgdGhyb3cgX19lbnYuY3JlYXRlRXJyb3IoX19maWxlLCB0ZW1wbGF0ZT8uc291cmNlIHx8IFwiXCIsIF9fcG9zLCBjYXVzZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGAsXG4gICAgKTtcblxuICAgIGNvbnN0IHRlbXBsYXRlOiBUZW1wbGF0ZSA9IGNvbnN0cnVjdG9yKHBhdGgsIHRoaXMsIGRlZmF1bHRzKTtcbiAgICB0ZW1wbGF0ZS5maWxlID0gcGF0aDtcbiAgICB0ZW1wbGF0ZS5jb2RlID0gY29kZTtcbiAgICB0ZW1wbGF0ZS5zb3VyY2UgPSBzb3VyY2U7XG4gICAgcmV0dXJuIHRlbXBsYXRlO1xuICB9XG5cbiAgdG9rZW5pemUoc291cmNlOiBzdHJpbmcsIHBhdGg/OiBzdHJpbmcpOiBUb2tlbltdIHtcbiAgICBjb25zdCByZXN1bHQgPSB0b2tlbml6ZShzb3VyY2UpO1xuICAgIGxldCB7IHRva2VucyB9ID0gcmVzdWx0O1xuICAgIGNvbnN0IHsgcG9zaXRpb24sIGVycm9yIH0gPSByZXN1bHQ7XG5cbiAgICBpZiAoZXJyb3IpIHtcbiAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3IocGF0aCB8fCBcInVua25vd25cIiwgc291cmNlLCBwb3NpdGlvbiwgZXJyb3IpO1xuICAgIH1cblxuICAgIGZvciAoY29uc3QgdG9rZW5QcmVwcm9jZXNzb3Igb2YgdGhpcy50b2tlblByZXByb2Nlc3NvcnMpIHtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IHRva2VuUHJlcHJvY2Vzc29yKHRoaXMsIHRva2VucywgcGF0aCk7XG5cbiAgICAgIGlmIChyZXN1bHQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICB0b2tlbnMgPSByZXN1bHQ7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHRva2VucztcbiAgfVxuXG4gIGFzeW5jIGxvYWQoZmlsZTogc3RyaW5nLCBmcm9tPzogc3RyaW5nKTogUHJvbWlzZTxUZW1wbGF0ZT4ge1xuICAgIGNvbnN0IHBhdGggPSBmcm9tID8gdGhpcy5vcHRpb25zLmxvYWRlci5yZXNvbHZlKGZyb20sIGZpbGUpIDogZmlsZTtcblxuICAgIGlmICghdGhpcy5jYWNoZS5oYXMocGF0aCkpIHtcbiAgICAgIC8vIFJlbW92ZSBxdWVyeSBhbmQgaGFzaCBwYXJhbXMgZnJvbSBwYXRoIGJlZm9yZSBsb2FkaW5nXG4gICAgICBjb25zdCBjbGVhblBhdGggPSBwYXRoXG4gICAgICAgIC5zcGxpdChcIj9cIilbMF1cbiAgICAgICAgLnNwbGl0KFwiI1wiKVswXTtcblxuICAgICAgY29uc3QgeyBzb3VyY2UsIGRhdGEgfSA9IGF3YWl0IHRoaXMub3B0aW9ucy5sb2FkZXIubG9hZChjbGVhblBhdGgpO1xuICAgICAgY29uc3QgdGVtcGxhdGUgPSB0aGlzLmNvbXBpbGUoc291cmNlLCBwYXRoLCBkYXRhKTtcblxuICAgICAgdGhpcy5jYWNoZS5zZXQocGF0aCwgdGVtcGxhdGUpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLmNhY2hlLmdldChwYXRoKSE7XG4gIH1cblxuICBjb21waWxlVG9rZW5zKFxuICAgIHRva2VuczogVG9rZW5bXSxcbiAgICBvdXRwdXRWYXIgPSBcIl9fZXhwb3J0cy5jb250ZW50XCIsXG4gICAgc3RvcEF0Pzogc3RyaW5nW10sXG4gICk6IHN0cmluZ1tdIHtcbiAgICBjb25zdCBjb21waWxlZDogc3RyaW5nW10gPSBbXTtcblxuICAgIHRva2VuczpcbiAgICB3aGlsZSAodG9rZW5zLmxlbmd0aCA+IDApIHtcbiAgICAgIGlmIChzdG9wQXQgJiYgdG9rZW5zWzBdWzBdID09PSBcInRhZ1wiICYmIHN0b3BBdC5pbmNsdWRlcyh0b2tlbnNbMF1bMV0pKSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBbdHlwZSwgY29kZSwgcG9zXSA9IHRva2Vucy5zaGlmdCgpITtcblxuICAgICAgaWYgKHR5cGUgPT09IFwiY29tbWVudFwiKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICBpZiAodHlwZSA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICBpZiAoY29kZSAhPT0gXCJcIikge1xuICAgICAgICAgIGNvbXBpbGVkLnB1c2goYCR7b3V0cHV0VmFyfSArPSAke0pTT04uc3RyaW5naWZ5KGNvZGUpfTtgKTtcbiAgICAgICAgfVxuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgaWYgKHR5cGUgPT09IFwidGFnXCIpIHtcbiAgICAgICAgY29tcGlsZWQucHVzaChgX19wb3MgPSAke3Bvc307YCk7XG4gICAgICAgIGZvciAoY29uc3QgdGFnIG9mIHRoaXMudGFncykge1xuICAgICAgICAgIGNvbnN0IGNvbXBpbGVkVGFnID0gdGFnKHRoaXMsIGNvZGUsIG91dHB1dFZhciwgdG9rZW5zKTtcblxuICAgICAgICAgIGlmICh0eXBlb2YgY29tcGlsZWRUYWcgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgIGNvbXBpbGVkLnB1c2goY29tcGlsZWRUYWcpO1xuICAgICAgICAgICAgY29udGludWUgdG9rZW5zO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFVua25vd24gdGFnLCBqdXN0IHByaW50IGl0XG4gICAgICAgIGNvbnN0IGV4cHJlc3Npb24gPSB0aGlzLmNvbXBpbGVGaWx0ZXJzKFxuICAgICAgICAgIHRva2VucyxcbiAgICAgICAgICBjb2RlLFxuICAgICAgICAgIHRoaXMub3B0aW9ucy5hdXRvZXNjYXBlLFxuICAgICAgICApO1xuICAgICAgICBjb21waWxlZC5wdXNoKGAke291dHB1dFZhcn0gKz0gKCR7ZXhwcmVzc2lvbn0pID8/IFwiXCI7YCk7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYFVua25vd24gdG9rZW4gdHlwZSBcIiR7dHlwZX1cImApO1xuICAgIH1cblxuICAgIHJldHVybiBjb21waWxlZDtcbiAgfVxuXG4gIGNvbXBpbGVGaWx0ZXJzKHRva2VuczogVG9rZW5bXSwgb3V0cHV0OiBzdHJpbmcsIGF1dG9lc2NhcGUgPSBmYWxzZSk6IHN0cmluZyB7XG4gICAgbGV0IHVuZXNjYXBlZCA9IGZhbHNlO1xuXG4gICAgd2hpbGUgKHRva2Vucy5sZW5ndGggPiAwICYmIHRva2Vuc1swXVswXSA9PT0gXCJmaWx0ZXJcIikge1xuICAgICAgY29uc3QgWywgY29kZV0gPSB0b2tlbnMuc2hpZnQoKSE7XG5cbiAgICAgIGNvbnN0IG1hdGNoID0gY29kZS5tYXRjaCgvXihhd2FpdFxccyspPyhbXFx3Ll0rKSg/OlxcKCguKilcXCkpPyQvKTtcblxuICAgICAgaWYgKCFtYXRjaCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgZmlsdGVyOiAke2NvZGV9YCk7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IFtfLCBpc0FzeW5jLCBuYW1lLCBhcmdzXSA9IG1hdGNoO1xuXG4gICAgICBpZiAoIXRoaXMuZmlsdGVyc1tuYW1lXSkge1xuICAgICAgICBpZiAobmFtZSA9PT0gXCJzYWZlXCIpIHtcbiAgICAgICAgICB1bmVzY2FwZWQgPSB0cnVlO1xuICAgICAgICB9IGVsc2UgaWYgKGlzR2xvYmFsKG5hbWUpKSB7XG4gICAgICAgICAgLy8gSWYgYSBnbG9iYWwgZnVuY3Rpb25cbiAgICAgICAgICBvdXRwdXQgPSBgJHtpc0FzeW5jID8gXCJhd2FpdCBcIiA6IFwiXCJ9JHtuYW1lfSgke291dHB1dH0ke1xuICAgICAgICAgICAgYXJncyA/IGAsICR7YXJnc31gIDogXCJcIlxuICAgICAgICAgIH0pYDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBJdCdzIGEgcHJvdG90eXBlJ3MgbWV0aG9kIChlLmcuIGBTdHJpbmcudG9VcHBlckNhc2UoKWApXG4gICAgICAgICAgb3V0cHV0ID0gYCR7aXNBc3luYyA/IFwiYXdhaXQgXCIgOiBcIlwifSgke291dHB1dH0pPy4ke25hbWV9Py4oJHtcbiAgICAgICAgICAgIGFyZ3MgPyBhcmdzIDogXCJcIlxuICAgICAgICAgIH0pYDtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gSXQncyBhIGZpbHRlciAoZS5nLiBmaWx0ZXJzLnVwcGVyKCkpXG4gICAgICAgIGNvbnN0IHsgZGF0YVZhcm5hbWUgfSA9IHRoaXMub3B0aW9ucztcbiAgICAgICAgb3V0cHV0ID0gYCR7XG4gICAgICAgICAgKGlzQXN5bmMgfHwgY2hlY2tBc3luYyh0aGlzLmZpbHRlcnNbbmFtZV0pKSA/IFwiYXdhaXQgXCIgOiBcIlwiXG4gICAgICAgIH1fX2Vudi5maWx0ZXJzLiR7bmFtZX0uY2FsbCh7ZGF0YToke2RhdGFWYXJuYW1lfSxlbnY6X19lbnZ9LCAke291dHB1dH0ke1xuICAgICAgICAgIGFyZ3MgPyBgLCAke2FyZ3N9YCA6IFwiXCJcbiAgICAgICAgfSlgO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIEVzY2FwZSBieSBkZWZhdWx0XG4gICAgaWYgKGF1dG9lc2NhcGUgJiYgIXVuZXNjYXBlZCkge1xuICAgICAgb3V0cHV0ID0gYF9fZW52LmZpbHRlcnMuZXNjYXBlKCR7b3V0cHV0fSlgO1xuICAgIH1cblxuICAgIHJldHVybiBvdXRwdXQ7XG4gIH1cblxuICBjcmVhdGVFcnJvcihcbiAgICBwYXRoOiBzdHJpbmcsXG4gICAgc291cmNlOiBzdHJpbmcsXG4gICAgcG9zaXRpb246IG51bWJlcixcbiAgICBjYXVzZTogRXJyb3IsXG4gICk6IEVycm9yIHtcbiAgICBpZiAoIXNvdXJjZSkge1xuICAgICAgcmV0dXJuIGNhdXNlO1xuICAgIH1cblxuICAgIGNvbnN0IFtsaW5lLCBjb2x1bW4sIGNvZGVdID0gZXJyb3JMaW5lKHNvdXJjZSwgcG9zaXRpb24pO1xuXG4gICAgcmV0dXJuIG5ldyBFcnJvcihcbiAgICAgIGBFcnJvciBpbiB0aGUgdGVtcGxhdGUgJHtwYXRofToke2xpbmV9OiR7Y29sdW1ufVxcblxcbiR7Y29kZS50cmltKCl9XFxuXFxuPiAke2NhdXNlLm1lc3NhZ2V9XFxuYCxcbiAgICAgIHsgY2F1c2UgfSxcbiAgICApO1xuICB9XG59XG5cbmZ1bmN0aW9uIGlzR2xvYmFsKG5hbWU6IHN0cmluZykge1xuICAvLyBAdHMtaWdub3JlIFRTIGRvZXNuJ3Qga25vdyBhYm91dCBnbG9iYWxUaGlzXG4gIGlmIChnbG9iYWxUaGlzW25hbWVdKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICBpZiAobmFtZS5pbmNsdWRlcyhcIi5cIikpIHtcbiAgICBjb25zdCBbb2JqLCBwcm9wXSA9IG5hbWUuc3BsaXQoXCIuXCIpO1xuICAgIC8vIEB0cy1pZ25vcmUgVFMgZG9lc24ndCBrbm93IGFib3V0IGdsb2JhbFRoaXNcbiAgICByZXR1cm4gdHlwZW9mIGdsb2JhbFRoaXNbb2JqXT8uW3Byb3BdID09PSBcImZ1bmN0aW9uXCI7XG4gIH1cbn1cblxuLyoqIFJldHVybnMgdGhlIG51bWJlciBhbmQgY29kZSBvZiB0aGUgZXJyb3JlZCBsaW5lICovXG5leHBvcnQgZnVuY3Rpb24gZXJyb3JMaW5lKFxuICBzb3VyY2U6IHN0cmluZyxcbiAgcG9zOiBudW1iZXIsXG4pOiBbbnVtYmVyLCBudW1iZXIsIHN0cmluZ10ge1xuICBsZXQgbGluZSA9IDE7XG4gIGxldCBjb2x1bW4gPSAxO1xuXG4gIGZvciAobGV0IGluZGV4ID0gMDsgaW5kZXggPCBwb3M7IGluZGV4KyspIHtcbiAgICBpZiAoXG4gICAgICBzb3VyY2VbaW5kZXhdID09PSBcIlxcblwiIHx8XG4gICAgICAoc291cmNlW2luZGV4XSA9PT0gXCJcXHJcIiAmJiBzb3VyY2VbaW5kZXggKyAxXSA9PT0gXCJcXG5cIilcbiAgICApIHtcbiAgICAgIGxpbmUrKztcbiAgICAgIGNvbHVtbiA9IDE7XG5cbiAgICAgIGlmIChzb3VyY2VbaW5kZXhdID09PSBcIlxcclwiKSB7XG4gICAgICAgIGluZGV4Kys7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbHVtbisrO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBbbGluZSwgY29sdW1uLCBzb3VyY2Uuc3BsaXQoXCJcXG5cIilbbGluZSAtIDFdXTtcbn1cblxuZnVuY3Rpb24gY2hlY2tBc3luYyhmbjogKCkgPT4gdW5rbm93bik6IGJvb2xlYW4ge1xuICByZXR1cm4gZm4uY29uc3RydWN0b3I/Lm5hbWUgPT09IFwiQXN5bmNGdW5jdGlvblwiO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sY0FBeUIsaUJBQWlCO0FBR2pELFNBQVMscUJBQXFCLFFBQVEsbUJBQW1CO0FBbUR6RCxPQUFPLE1BQU07RUFDWCxRQUFRLElBQUksTUFBd0I7RUFDcEMsUUFBaUI7RUFDakIsT0FBYyxFQUFFLENBQUM7RUFDakIscUJBQTBDLEVBQUUsQ0FBQztFQUM3QyxVQUFrQyxDQUFDLEVBQUU7RUFDckMsUUFBaUMsQ0FBQyxFQUFFO0VBRXBDLFlBQVksT0FBZ0IsQ0FBRTtJQUM1QixJQUFJLENBQUMsT0FBTyxHQUFHO0VBQ2pCO0VBRUEsSUFBSSxNQUFjLEVBQUU7SUFDbEIsT0FBTyxJQUFJO0VBQ2I7RUFFQSxNQUFNLElBQ0osSUFBWSxFQUNaLElBQTZCLEVBQzdCLElBQWEsRUFDWTtJQUN6QixNQUFNLFdBQVcsTUFBTSxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU07SUFDdkMsT0FBTyxNQUFNLFNBQVM7RUFDeEI7RUFFQSxNQUFNLFVBQ0osTUFBYyxFQUNkLElBQThCLEVBQzlCLElBQWEsRUFDWTtJQUN6QixJQUFJLE1BQU07TUFDUixNQUFNLFNBQVMsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUM7TUFFOUIsSUFBSSxRQUFRO1FBQ1YsT0FBTyxNQUFNLE9BQU87TUFDdEI7TUFFQSxNQUFNLFdBQVcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRO01BQ3RDLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLE1BQU07TUFFckIsT0FBTyxNQUFNLFNBQVM7SUFDeEI7SUFFQSxNQUFNLFdBQVcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRO0lBQ3RDLE9BQU8sTUFBTSxTQUFT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