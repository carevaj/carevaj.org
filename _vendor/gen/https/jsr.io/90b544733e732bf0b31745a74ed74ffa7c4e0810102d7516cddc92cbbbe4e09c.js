// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import { createExtractor } from "./create_extractor.ts";
import { parse as parseYAML } from "jsr:/@std/yaml@^0.224.0/parse";
import { parse as parseTOML } from "jsr:/@std/toml@^0.224.0/parse";
/**
 * Extracts and parses {@link https://yaml.org | YAML}, {@link https://toml.io |
 * TOML}, or {@link https://www.json.org/ | JSON} from the metadata of front
 * matter content, depending on the format.
 *
 * @example
 * ```ts
 * import { extract } from "@std/front-matter/any";
 *
 * const output = `---json
 * {
 *   "title": "Three dashes marks the spot"
 * }
 * ---
 * Hello, world!`;
 * const result = extract(output);
 *
 * result.frontMatter; // '{\n "title": "Three dashes marks the spot"\n}'
 * result.body; // "Hello, world!"
 * result.attrs; // { title: "Three dashes marks the spot" }
 * ```
 */ export const extract = createExtractor({
  yaml: parseYAML,
  toml: parseTOML,
  json: JSON.parse
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0BzdGQvZnJvbnQtbWF0dGVyLzAuMjI0LjAvYW55LnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjQgdGhlIERlbm8gYXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gTUlUIGxpY2Vuc2UuXG5cbmltcG9ydCB7XG4gIGNyZWF0ZUV4dHJhY3RvcixcbiAgdHlwZSBFeHRyYWN0b3IsXG4gIHR5cGUgUGFyc2VyLFxufSBmcm9tIFwiLi9jcmVhdGVfZXh0cmFjdG9yLnRzXCI7XG5pbXBvcnQgeyBwYXJzZSBhcyBwYXJzZVlBTUwgfSBmcm9tIFwianNyOi9Ac3RkL3lhbWxAXjAuMjI0LjAvcGFyc2VcIjtcbmltcG9ydCB7IHBhcnNlIGFzIHBhcnNlVE9NTCB9IGZyb20gXCJqc3I6L0BzdGQvdG9tbEBeMC4yMjQuMC9wYXJzZVwiO1xuXG4vKipcbiAqIEV4dHJhY3RzIGFuZCBwYXJzZXMge0BsaW5rIGh0dHBzOi8veWFtbC5vcmcgfCBZQU1MfSwge0BsaW5rIGh0dHBzOi8vdG9tbC5pbyB8XG4gKiBUT01MfSwgb3Ige0BsaW5rIGh0dHBzOi8vd3d3Lmpzb24ub3JnLyB8IEpTT059IGZyb20gdGhlIG1ldGFkYXRhIG9mIGZyb250XG4gKiBtYXR0ZXIgY29udGVudCwgZGVwZW5kaW5nIG9uIHRoZSBmb3JtYXQuXG4gKlxuICogQGV4YW1wbGVcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyBleHRyYWN0IH0gZnJvbSBcIkBzdGQvZnJvbnQtbWF0dGVyL2FueVwiO1xuICpcbiAqIGNvbnN0IG91dHB1dCA9IGAtLS1qc29uXG4gKiB7XG4gKiAgIFwidGl0bGVcIjogXCJUaHJlZSBkYXNoZXMgbWFya3MgdGhlIHNwb3RcIlxuICogfVxuICogLS0tXG4gKiBIZWxsbywgd29ybGQhYDtcbiAqIGNvbnN0IHJlc3VsdCA9IGV4dHJhY3Qob3V0cHV0KTtcbiAqXG4gKiByZXN1bHQuZnJvbnRNYXR0ZXI7IC8vICd7XFxuIFwidGl0bGVcIjogXCJUaHJlZSBkYXNoZXMgbWFya3MgdGhlIHNwb3RcIlxcbn0nXG4gKiByZXN1bHQuYm9keTsgLy8gXCJIZWxsbywgd29ybGQhXCJcbiAqIHJlc3VsdC5hdHRyczsgLy8geyB0aXRsZTogXCJUaHJlZSBkYXNoZXMgbWFya3MgdGhlIHNwb3RcIiB9XG4gKiBgYGBcbiAqL1xuZXhwb3J0IGNvbnN0IGV4dHJhY3Q6IEV4dHJhY3RvciA9IGNyZWF0ZUV4dHJhY3Rvcih7XG4gIHlhbWw6IHBhcnNlWUFNTCBhcyBQYXJzZXIsXG4gIHRvbWw6IHBhcnNlVE9NTCBhcyBQYXJzZXIsXG4gIGpzb246IEpTT04ucGFyc2UgYXMgUGFyc2VyLFxufSk7XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsMEVBQTBFO0FBRTFFLFNBQ0UsZUFBZSxRQUdWLHdCQUF3QjtBQUMvQixTQUFTLFNBQVMsU0FBUyxRQUFRLGdDQUFnQztBQUNuRSxTQUFTLFNBQVMsU0FBUyxRQUFRLGdDQUFnQztBQUVuRTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0NBcUJDLEdBQ0QsT0FBTyxNQUFNLFVBQXFCLGdCQUFnQjtFQUNoRCxNQUFNO0VBQ04sTUFBTTtFQUNOLE1BQU0sS0FBSyxLQUFLO0FBQ2xCLEdBQUcifQ==