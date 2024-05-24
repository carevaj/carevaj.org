// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import { EXTRACT_REGEXP_MAP, RECOGNIZE_REGEXP_MAP } from "./_formats.ts";
function _extract(str, rx, parse) {
  const match = rx.exec(str);
  if (!match || match.index !== 0) {
    throw new TypeError("Unexpected end of input");
  }
  const frontMatter = match.at(-1)?.replace(/^\s+|\s+$/g, "") || "";
  const attrs = parse(frontMatter);
  const body = str.replace(match[0], "");
  return {
    frontMatter,
    body,
    attrs
  };
}
/**
 * Recognizes the format of the front matter in a string. Supports YAML, TOML and JSON.
 *
 * @param str String to recognize.
 * @param formats A list of formats to recognize. Defaults to all supported formats.
 *
 * ```ts
 * import { recognize } from "@std/front-matter";
 * import { assertEquals } from "@std/assert/assert-equals";
 *
 * assertEquals(recognize("---\ntitle: Three dashes marks the spot\n---\n"), "yaml");
 * assertEquals(recognize("---toml\ntitle = 'Three dashes followed by format marks the spot'\n---\n"), "toml");
 * assertEquals(recognize("---json\n{\"title\": \"Three dashes followed by format marks the spot\"}\n---\n"), "json");
 * assertEquals(recognize("---xml\n<title>Three dashes marks the spot</title>\n---\n"), "unknown");
 *
 * assertEquals(recognize("---json\n<title>Three dashes marks the spot</title>\n---\n", ["yaml"]), "unknown");
 */ function recognize(str, formats) {
  if (!formats) {
    formats = Object.keys(RECOGNIZE_REGEXP_MAP);
  }
  const [firstLine] = str.split(/(\r?\n)/);
  for (const format of formats){
    if (format === "unknown") {
      continue;
    }
    if (RECOGNIZE_REGEXP_MAP[format].test(firstLine)) {
      return format;
    }
  }
  return "unknown";
}
/**
 * Factory that creates a function that extracts front matter from a string with the given parsers.
 * Supports YAML, TOML and JSON.
 *
 * @param formats A descriptor containing Format-parser pairs to use for each format.
 * @returns A function that extracts front matter from a string with the given parsers.
 *
 * ```ts
 * import { createExtractor, Parser } from "@std/front-matter";
 * import { assertEquals } from "@std/assert/assert-equals";
 * import { parse as parseYAML } from "@std/yaml/parse";
 * import { parse as parseTOML } from "@std/toml/parse";
 * const extractYAML = createExtractor({ yaml: parseYAML as Parser });
 * const extractTOML = createExtractor({ toml: parseTOML as Parser });
 * const extractJSON = createExtractor({ json: JSON.parse as Parser });
 * const extractYAMLOrJSON = createExtractor({
 *     yaml: parseYAML as Parser,
 *     json: JSON.parse as Parser,
 * });
 *
 * let { attrs, body, frontMatter } = extractYAML<{ title: string }>("---\ntitle: Three dashes marks the spot\n---\nferret");
 * assertEquals(attrs.title, "Three dashes marks the spot");
 * assertEquals(body, "ferret");
 * assertEquals(frontMatter, "title: Three dashes marks the spot");
 *
 * ({ attrs, body, frontMatter } = extractTOML<{ title: string }>("---toml\ntitle = 'Three dashes followed by format marks the spot'\n---\n"));
 * assertEquals(attrs.title, "Three dashes followed by format marks the spot");
 * assertEquals(body, "");
 * assertEquals(frontMatter, "title = 'Three dashes followed by format marks the spot'");
 *
 * ({ attrs, body, frontMatter } = extractJSON<{ title: string }>("---json\n{\"title\": \"Three dashes followed by format marks the spot\"}\n---\ngoat"));
 * assertEquals(attrs.title, "Three dashes followed by format marks the spot");
 * assertEquals(body, "goat");
 * assertEquals(frontMatter, "{\"title\": \"Three dashes followed by format marks the spot\"}");
 *
 * ({ attrs, body, frontMatter } = extractYAMLOrJSON<{ title: string }>("---\ntitle: Three dashes marks the spot\n---\nferret"));
 * assertEquals(attrs.title, "Three dashes marks the spot");
 * assertEquals(body, "ferret");
 * assertEquals(frontMatter, "title: Three dashes marks the spot");
 *
 * ({ attrs, body, frontMatter } = extractYAMLOrJSON<{ title: string }>("---json\n{\"title\": \"Three dashes followed by format marks the spot\"}\n---\ngoat"));
 * assertEquals(attrs.title, "Three dashes followed by format marks the spot");
 * assertEquals(body, "goat");
 * assertEquals(frontMatter, "{\"title\": \"Three dashes followed by format marks the spot\"}");
 * ```
 */ export function createExtractor(formats) {
  const formatKeys = Object.keys(formats);
  return function extract(str) {
    const format = recognize(str, formatKeys);
    const parser = formats[format];
    if (format === "unknown" || !parser) {
      throw new TypeError(`Unsupported front matter format`);
    }
    return _extract(str, EXTRACT_REGEXP_MAP[format], parser);
  };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0BzdGQvZnJvbnQtbWF0dGVyLzAuMjI0LjAvY3JlYXRlX2V4dHJhY3Rvci50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDI0IHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuXG5pbXBvcnQgeyBFWFRSQUNUX1JFR0VYUF9NQVAsIFJFQ09HTklaRV9SRUdFWFBfTUFQIH0gZnJvbSBcIi4vX2Zvcm1hdHMudHNcIjtcblxudHlwZSBGb3JtYXQgPSBcInlhbWxcIiB8IFwidG9tbFwiIHwgXCJqc29uXCIgfCBcInVua25vd25cIjtcblxuLyoqIFJldHVybiB0eXBlIGZvciB7QGxpbmtjb2RlIEV4dHJhY3Rvcn0uICovXG5leHBvcnQgdHlwZSBFeHRyYWN0PFQ+ID0ge1xuICBmcm9udE1hdHRlcjogc3RyaW5nO1xuICBib2R5OiBzdHJpbmc7XG4gIGF0dHJzOiBUO1xufTtcblxuLyoqIEZ1bmN0aW9uIHJldHVybiB0eXBlIGZvciB7QGxpbmtjb2RlIGNyZWF0ZUV4dHJhY3Rvcn0uICovXG5leHBvcnQgdHlwZSBFeHRyYWN0b3IgPSA8VCA9IFJlY29yZDxzdHJpbmcsIHVua25vd24+PihcbiAgc3RyOiBzdHJpbmcsXG4pID0+IEV4dHJhY3Q8VD47XG5cbi8qKiBQYXJzZXIgZnVuY3Rpb24gdHlwZSB1c2VkIGFsb25nc2lkZSB7QGxpbmtjb2RlIGNyZWF0ZUV4dHJhY3Rvcn0uICovXG5leHBvcnQgdHlwZSBQYXJzZXIgPSA8VCA9IFJlY29yZDxzdHJpbmcsIHVua25vd24+PihzdHI6IHN0cmluZykgPT4gVDtcblxuZnVuY3Rpb24gX2V4dHJhY3Q8VD4oXG4gIHN0cjogc3RyaW5nLFxuICByeDogUmVnRXhwLFxuICBwYXJzZTogUGFyc2VyLFxuKTogRXh0cmFjdDxUPiB7XG4gIGNvbnN0IG1hdGNoID0gcnguZXhlYyhzdHIpO1xuICBpZiAoIW1hdGNoIHx8IG1hdGNoLmluZGV4ICE9PSAwKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIlVuZXhwZWN0ZWQgZW5kIG9mIGlucHV0XCIpO1xuICB9XG4gIGNvbnN0IGZyb250TWF0dGVyID0gbWF0Y2guYXQoLTEpPy5yZXBsYWNlKC9eXFxzK3xcXHMrJC9nLCBcIlwiKSB8fCBcIlwiO1xuICBjb25zdCBhdHRycyA9IHBhcnNlKGZyb250TWF0dGVyKSBhcyBUO1xuICBjb25zdCBib2R5ID0gc3RyLnJlcGxhY2UobWF0Y2hbMF0sIFwiXCIpO1xuICByZXR1cm4geyBmcm9udE1hdHRlciwgYm9keSwgYXR0cnMgfTtcbn1cblxuLyoqXG4gKiBSZWNvZ25pemVzIHRoZSBmb3JtYXQgb2YgdGhlIGZyb250IG1hdHRlciBpbiBhIHN0cmluZy4gU3VwcG9ydHMgWUFNTCwgVE9NTCBhbmQgSlNPTi5cbiAqXG4gKiBAcGFyYW0gc3RyIFN0cmluZyB0byByZWNvZ25pemUuXG4gKiBAcGFyYW0gZm9ybWF0cyBBIGxpc3Qgb2YgZm9ybWF0cyB0byByZWNvZ25pemUuIERlZmF1bHRzIHRvIGFsbCBzdXBwb3J0ZWQgZm9ybWF0cy5cbiAqXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgcmVjb2duaXplIH0gZnJvbSBcIkBzdGQvZnJvbnQtbWF0dGVyXCI7XG4gKiBpbXBvcnQgeyBhc3NlcnRFcXVhbHMgfSBmcm9tIFwiQHN0ZC9hc3NlcnQvYXNzZXJ0LWVxdWFsc1wiO1xuICpcbiAqIGFzc2VydEVxdWFscyhyZWNvZ25pemUoXCItLS1cXG50aXRsZTogVGhyZWUgZGFzaGVzIG1hcmtzIHRoZSBzcG90XFxuLS0tXFxuXCIpLCBcInlhbWxcIik7XG4gKiBhc3NlcnRFcXVhbHMocmVjb2duaXplKFwiLS0tdG9tbFxcbnRpdGxlID0gJ1RocmVlIGRhc2hlcyBmb2xsb3dlZCBieSBmb3JtYXQgbWFya3MgdGhlIHNwb3QnXFxuLS0tXFxuXCIpLCBcInRvbWxcIik7XG4gKiBhc3NlcnRFcXVhbHMocmVjb2duaXplKFwiLS0tanNvblxcbntcXFwidGl0bGVcXFwiOiBcXFwiVGhyZWUgZGFzaGVzIGZvbGxvd2VkIGJ5IGZvcm1hdCBtYXJrcyB0aGUgc3BvdFxcXCJ9XFxuLS0tXFxuXCIpLCBcImpzb25cIik7XG4gKiBhc3NlcnRFcXVhbHMocmVjb2duaXplKFwiLS0teG1sXFxuPHRpdGxlPlRocmVlIGRhc2hlcyBtYXJrcyB0aGUgc3BvdDwvdGl0bGU+XFxuLS0tXFxuXCIpLCBcInVua25vd25cIik7XG4gKlxuICogYXNzZXJ0RXF1YWxzKHJlY29nbml6ZShcIi0tLWpzb25cXG48dGl0bGU+VGhyZWUgZGFzaGVzIG1hcmtzIHRoZSBzcG90PC90aXRsZT5cXG4tLS1cXG5cIiwgW1wieWFtbFwiXSksIFwidW5rbm93blwiKTtcbiAqL1xuZnVuY3Rpb24gcmVjb2duaXplKHN0cjogc3RyaW5nLCBmb3JtYXRzPzogRm9ybWF0W10pOiBGb3JtYXQge1xuICBpZiAoIWZvcm1hdHMpIHtcbiAgICBmb3JtYXRzID0gT2JqZWN0LmtleXMoUkVDT0dOSVpFX1JFR0VYUF9NQVApIGFzIEZvcm1hdFtdO1xuICB9XG5cbiAgY29uc3QgW2ZpcnN0TGluZV0gPSBzdHIuc3BsaXQoLyhcXHI/XFxuKS8pIGFzIFtzdHJpbmddO1xuXG4gIGZvciAoY29uc3QgZm9ybWF0IG9mIGZvcm1hdHMpIHtcbiAgICBpZiAoZm9ybWF0ID09PSBcInVua25vd25cIikge1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgaWYgKFJFQ09HTklaRV9SRUdFWFBfTUFQW2Zvcm1hdF0udGVzdChmaXJzdExpbmUpKSB7XG4gICAgICByZXR1cm4gZm9ybWF0O1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBcInVua25vd25cIjtcbn1cblxuLyoqXG4gKiBGYWN0b3J5IHRoYXQgY3JlYXRlcyBhIGZ1bmN0aW9uIHRoYXQgZXh0cmFjdHMgZnJvbnQgbWF0dGVyIGZyb20gYSBzdHJpbmcgd2l0aCB0aGUgZ2l2ZW4gcGFyc2Vycy5cbiAqIFN1cHBvcnRzIFlBTUwsIFRPTUwgYW5kIEpTT04uXG4gKlxuICogQHBhcmFtIGZvcm1hdHMgQSBkZXNjcmlwdG9yIGNvbnRhaW5pbmcgRm9ybWF0LXBhcnNlciBwYWlycyB0byB1c2UgZm9yIGVhY2ggZm9ybWF0LlxuICogQHJldHVybnMgQSBmdW5jdGlvbiB0aGF0IGV4dHJhY3RzIGZyb250IG1hdHRlciBmcm9tIGEgc3RyaW5nIHdpdGggdGhlIGdpdmVuIHBhcnNlcnMuXG4gKlxuICogYGBgdHNcbiAqIGltcG9ydCB7IGNyZWF0ZUV4dHJhY3RvciwgUGFyc2VyIH0gZnJvbSBcIkBzdGQvZnJvbnQtbWF0dGVyXCI7XG4gKiBpbXBvcnQgeyBhc3NlcnRFcXVhbHMgfSBmcm9tIFwiQHN0ZC9hc3NlcnQvYXNzZXJ0LWVxdWFsc1wiO1xuICogaW1wb3J0IHsgcGFyc2UgYXMgcGFyc2VZQU1MIH0gZnJvbSBcIkBzdGQveWFtbC9wYXJzZVwiO1xuICogaW1wb3J0IHsgcGFyc2UgYXMgcGFyc2VUT01MIH0gZnJvbSBcIkBzdGQvdG9tbC9wYXJzZVwiO1xuICogY29uc3QgZXh0cmFjdFlBTUwgPSBjcmVhdGVFeHRyYWN0b3IoeyB5YW1sOiBwYXJzZVlBTUwgYXMgUGFyc2VyIH0pO1xuICogY29uc3QgZXh0cmFjdFRPTUwgPSBjcmVhdGVFeHRyYWN0b3IoeyB0b21sOiBwYXJzZVRPTUwgYXMgUGFyc2VyIH0pO1xuICogY29uc3QgZXh0cmFjdEpTT04gPSBjcmVhdGVFeHRyYWN0b3IoeyBqc29uOiBKU09OLnBhcnNlIGFzIFBhcnNlciB9KTtcbiAqIGNvbnN0IGV4dHJhY3RZQU1MT3JKU09OID0gY3JlYXRlRXh0cmFjdG9yKHtcbiAqICAgICB5YW1sOiBwYXJzZVlBTUwgYXMgUGFyc2VyLFxuICogICAgIGpzb246IEpTT04ucGFyc2UgYXMgUGFyc2VyLFxuICogfSk7XG4gKlxuICogbGV0IHsgYXR0cnMsIGJvZHksIGZyb250TWF0dGVyIH0gPSBleHRyYWN0WUFNTDx7IHRpdGxlOiBzdHJpbmcgfT4oXCItLS1cXG50aXRsZTogVGhyZWUgZGFzaGVzIG1hcmtzIHRoZSBzcG90XFxuLS0tXFxuZmVycmV0XCIpO1xuICogYXNzZXJ0RXF1YWxzKGF0dHJzLnRpdGxlLCBcIlRocmVlIGRhc2hlcyBtYXJrcyB0aGUgc3BvdFwiKTtcbiAqIGFzc2VydEVxdWFscyhib2R5LCBcImZlcnJldFwiKTtcbiAqIGFzc2VydEVxdWFscyhmcm9udE1hdHRlciwgXCJ0aXRsZTogVGhyZWUgZGFzaGVzIG1hcmtzIHRoZSBzcG90XCIpO1xuICpcbiAqICh7IGF0dHJzLCBib2R5LCBmcm9udE1hdHRlciB9ID0gZXh0cmFjdFRPTUw8eyB0aXRsZTogc3RyaW5nIH0+KFwiLS0tdG9tbFxcbnRpdGxlID0gJ1RocmVlIGRhc2hlcyBmb2xsb3dlZCBieSBmb3JtYXQgbWFya3MgdGhlIHNwb3QnXFxuLS0tXFxuXCIpKTtcbiAqIGFzc2VydEVxdWFscyhhdHRycy50aXRsZSwgXCJUaHJlZSBkYXNoZXMgZm9sbG93ZWQgYnkgZm9ybWF0IG1hcmtzIHRoZSBzcG90XCIpO1xuICogYXNzZXJ0RXF1YWxzKGJvZHksIFwiXCIpO1xuICogYXNzZXJ0RXF1YWxzKGZyb250TWF0dGVyLCBcInRpdGxlID0gJ1RocmVlIGRhc2hlcyBmb2xsb3dlZCBieSBmb3JtYXQgbWFya3MgdGhlIHNwb3QnXCIpO1xuICpcbiAqICh7IGF0dHJzLCBib2R5LCBmcm9udE1hdHRlciB9ID0gZXh0cmFjdEpTT048eyB0aXRsZTogc3RyaW5nIH0+KFwiLS0tanNvblxcbntcXFwidGl0bGVcXFwiOiBcXFwiVGhyZWUgZGFzaGVzIGZvbGxvd2VkIGJ5IGZvcm1hdCBtYXJrcyB0aGUgc3BvdFxcXCJ9XFxuLS0tXFxuZ29hdFwiKSk7XG4gKiBhc3NlcnRFcXVhbHMoYXR0cnMudGl0bGUsIFwiVGhyZWUgZGFzaGVzIGZvbGxvd2VkIGJ5IGZvcm1hdCBtYXJrcyB0aGUgc3BvdFwiKTtcbiAqIGFzc2VydEVxdWFscyhib2R5LCBcImdvYXRcIik7XG4gKiBhc3NlcnRFcXVhbHMoZnJvbnRNYXR0ZXIsIFwie1xcXCJ0aXRsZVxcXCI6IFxcXCJUaHJlZSBkYXNoZXMgZm9sbG93ZWQgYnkgZm9ybWF0IG1hcmtzIHRoZSBzcG90XFxcIn1cIik7XG4gKlxuICogKHsgYXR0cnMsIGJvZHksIGZyb250TWF0dGVyIH0gPSBleHRyYWN0WUFNTE9ySlNPTjx7IHRpdGxlOiBzdHJpbmcgfT4oXCItLS1cXG50aXRsZTogVGhyZWUgZGFzaGVzIG1hcmtzIHRoZSBzcG90XFxuLS0tXFxuZmVycmV0XCIpKTtcbiAqIGFzc2VydEVxdWFscyhhdHRycy50aXRsZSwgXCJUaHJlZSBkYXNoZXMgbWFya3MgdGhlIHNwb3RcIik7XG4gKiBhc3NlcnRFcXVhbHMoYm9keSwgXCJmZXJyZXRcIik7XG4gKiBhc3NlcnRFcXVhbHMoZnJvbnRNYXR0ZXIsIFwidGl0bGU6IFRocmVlIGRhc2hlcyBtYXJrcyB0aGUgc3BvdFwiKTtcbiAqXG4gKiAoeyBhdHRycywgYm9keSwgZnJvbnRNYXR0ZXIgfSA9IGV4dHJhY3RZQU1MT3JKU09OPHsgdGl0bGU6IHN0cmluZyB9PihcIi0tLWpzb25cXG57XFxcInRpdGxlXFxcIjogXFxcIlRocmVlIGRhc2hlcyBmb2xsb3dlZCBieSBmb3JtYXQgbWFya3MgdGhlIHNwb3RcXFwifVxcbi0tLVxcbmdvYXRcIikpO1xuICogYXNzZXJ0RXF1YWxzKGF0dHJzLnRpdGxlLCBcIlRocmVlIGRhc2hlcyBmb2xsb3dlZCBieSBmb3JtYXQgbWFya3MgdGhlIHNwb3RcIik7XG4gKiBhc3NlcnRFcXVhbHMoYm9keSwgXCJnb2F0XCIpO1xuICogYXNzZXJ0RXF1YWxzKGZyb250TWF0dGVyLCBcIntcXFwidGl0bGVcXFwiOiBcXFwiVGhyZWUgZGFzaGVzIGZvbGxvd2VkIGJ5IGZvcm1hdCBtYXJrcyB0aGUgc3BvdFxcXCJ9XCIpO1xuICogYGBgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVFeHRyYWN0b3IoXG4gIGZvcm1hdHM6IFBhcnRpYWw8UmVjb3JkPFwieWFtbFwiIHwgXCJ0b21sXCIgfCBcImpzb25cIiB8IFwidW5rbm93blwiLCBQYXJzZXI+Pixcbik6IEV4dHJhY3RvciB7XG4gIGNvbnN0IGZvcm1hdEtleXMgPSBPYmplY3Qua2V5cyhmb3JtYXRzKSBhcyBGb3JtYXRbXTtcblxuICByZXR1cm4gZnVuY3Rpb24gZXh0cmFjdDxUPihzdHI6IHN0cmluZyk6IEV4dHJhY3Q8VD4ge1xuICAgIGNvbnN0IGZvcm1hdCA9IHJlY29nbml6ZShzdHIsIGZvcm1hdEtleXMpO1xuICAgIGNvbnN0IHBhcnNlciA9IGZvcm1hdHNbZm9ybWF0XTtcblxuICAgIGlmIChmb3JtYXQgPT09IFwidW5rbm93blwiIHx8ICFwYXJzZXIpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoYFVuc3VwcG9ydGVkIGZyb250IG1hdHRlciBmb3JtYXRgKTtcbiAgICB9XG5cbiAgICByZXR1cm4gX2V4dHJhY3Qoc3RyLCBFWFRSQUNUX1JFR0VYUF9NQVBbZm9ybWF0XSwgcGFyc2VyKTtcbiAgfTtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSwwRUFBMEU7QUFFMUUsU0FBUyxrQkFBa0IsRUFBRSxvQkFBb0IsUUFBUSxnQkFBZ0I7QUFtQnpFLFNBQVMsU0FDUCxHQUFXLEVBQ1gsRUFBVSxFQUNWLEtBQWE7RUFFYixNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUM7RUFDdEIsSUFBSSxDQUFDLFNBQVMsTUFBTSxLQUFLLEtBQUssR0FBRztJQUMvQixNQUFNLElBQUksVUFBVTtFQUN0QjtFQUNBLE1BQU0sY0FBYyxNQUFNLEVBQUUsQ0FBQyxDQUFDLElBQUksUUFBUSxjQUFjLE9BQU87RUFDL0QsTUFBTSxRQUFRLE1BQU07RUFDcEIsTUFBTSxPQUFPLElBQUksT0FBTyxDQUFDLEtBQUssQ0FBQyxFQUFFLEVBQUU7RUFDbkMsT0FBTztJQUFFO0lBQWE7SUFBTTtFQUFNO0FBQ3BDO0FBRUE7Ozs7Ozs7Ozs7Ozs7Ozs7Q0FnQkMsR0FDRCxTQUFTLFVBQVUsR0FBVyxFQUFFLE9BQWtCO0VBQ2hELElBQUksQ0FBQyxTQUFTO0lBQ1osVUFBVSxPQUFPLElBQUksQ0FBQztFQUN4QjtFQUVBLE1BQU0sQ0FBQyxVQUFVLEdBQUcsSUFBSSxLQUFLLENBQUM7RUFFOUIsS0FBSyxNQUFNLFVBQVUsUUFBUztJQUM1QixJQUFJLFdBQVcsV0FBVztNQUN4QjtJQUNGO0lBRUEsSUFBSSxvQkFBb0IsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLFlBQVk7TUFDaEQsT0FBTztJQUNUO0VBQ0Y7RUFFQSxPQUFPO0FBQ1Q7QUFFQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0NBNkNDLEdBQ0QsT0FBTyxTQUFTLGdCQUNkLE9BQXNFO0VBRXRFLE1BQU0sYUFBYSxPQUFPLElBQUksQ0FBQztFQUUvQixPQUFPLFNBQVMsUUFBVyxHQUFXO0lBQ3BDLE1BQU0sU0FBUyxVQUFVLEtBQUs7SUFDOUIsTUFBTSxTQUFTLE9BQU8sQ0FBQyxPQUFPO0lBRTlCLElBQUksV0FBVyxhQUFhLENBQUMsUUFBUTtNQUNuQyxNQUFNLElBQUksVUFBVSxDQUFDLCtCQUErQixDQUFDO0lBQ3ZEO0lBRUEsT0FBTyxTQUFTLEtBQUssa0JBQWtCLENBQUMsT0FBTyxFQUFFO0VBQ25EO0FBQ0YifQ==