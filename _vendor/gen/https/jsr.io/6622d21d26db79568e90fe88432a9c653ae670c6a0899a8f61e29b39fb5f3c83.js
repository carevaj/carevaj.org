// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import { EXTRACT_REGEXP_MAP } from "./_formats.ts";
/**
 * Tests if a string has valid front matter. Supports YAML, TOML and JSON.
 *
 * @param str String to test.
 * @param formats A list of formats to test for. Defaults to all supported formats.
 *
 * ```ts
 * import { test } from "@std/front-matter/test";
 *
 * test("---\ntitle: Three dashes marks the spot\n---\n"); // true
 * test("---toml\ntitle = 'Three dashes followed by format marks the spot'\n---\n"); // true
 * test("---json\n{\"title\": \"Three dashes followed by format marks the spot\"}\n---\n"); // true
 * test("---json\n{\"title\": \"Three dashes followed by format marks the spot\"}\n---\n", ["yaml"]); // false
 * ```
 */ export function test(str, formats) {
  if (!formats) {
    formats = Object.keys(EXTRACT_REGEXP_MAP);
  }
  for (const format of formats){
    if (format === "unknown") {
      throw new TypeError("Unable to test for unknown front matter format");
    }
    const match = EXTRACT_REGEXP_MAP[format].exec(str);
    if (match?.index === 0) {
      return true;
    }
  }
  return false;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0BzdGQvZnJvbnQtbWF0dGVyLzAuMjI0LjAvdGVzdC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDI0IHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuXG5pbXBvcnQgeyBFWFRSQUNUX1JFR0VYUF9NQVAgfSBmcm9tIFwiLi9fZm9ybWF0cy50c1wiO1xuXG5leHBvcnQgdHlwZSBGb3JtYXQgPSBcInlhbWxcIiB8IFwidG9tbFwiIHwgXCJqc29uXCIgfCBcInVua25vd25cIjtcblxuLyoqXG4gKiBUZXN0cyBpZiBhIHN0cmluZyBoYXMgdmFsaWQgZnJvbnQgbWF0dGVyLiBTdXBwb3J0cyBZQU1MLCBUT01MIGFuZCBKU09OLlxuICpcbiAqIEBwYXJhbSBzdHIgU3RyaW5nIHRvIHRlc3QuXG4gKiBAcGFyYW0gZm9ybWF0cyBBIGxpc3Qgb2YgZm9ybWF0cyB0byB0ZXN0IGZvci4gRGVmYXVsdHMgdG8gYWxsIHN1cHBvcnRlZCBmb3JtYXRzLlxuICpcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyB0ZXN0IH0gZnJvbSBcIkBzdGQvZnJvbnQtbWF0dGVyL3Rlc3RcIjtcbiAqXG4gKiB0ZXN0KFwiLS0tXFxudGl0bGU6IFRocmVlIGRhc2hlcyBtYXJrcyB0aGUgc3BvdFxcbi0tLVxcblwiKTsgLy8gdHJ1ZVxuICogdGVzdChcIi0tLXRvbWxcXG50aXRsZSA9ICdUaHJlZSBkYXNoZXMgZm9sbG93ZWQgYnkgZm9ybWF0IG1hcmtzIHRoZSBzcG90J1xcbi0tLVxcblwiKTsgLy8gdHJ1ZVxuICogdGVzdChcIi0tLWpzb25cXG57XFxcInRpdGxlXFxcIjogXFxcIlRocmVlIGRhc2hlcyBmb2xsb3dlZCBieSBmb3JtYXQgbWFya3MgdGhlIHNwb3RcXFwifVxcbi0tLVxcblwiKTsgLy8gdHJ1ZVxuICogdGVzdChcIi0tLWpzb25cXG57XFxcInRpdGxlXFxcIjogXFxcIlRocmVlIGRhc2hlcyBmb2xsb3dlZCBieSBmb3JtYXQgbWFya3MgdGhlIHNwb3RcXFwifVxcbi0tLVxcblwiLCBbXCJ5YW1sXCJdKTsgLy8gZmFsc2VcbiAqIGBgYFxuICovXG5leHBvcnQgZnVuY3Rpb24gdGVzdChcbiAgc3RyOiBzdHJpbmcsXG4gIGZvcm1hdHM/OiBGb3JtYXRbXSxcbik6IGJvb2xlYW4ge1xuICBpZiAoIWZvcm1hdHMpIHtcbiAgICBmb3JtYXRzID0gT2JqZWN0LmtleXMoRVhUUkFDVF9SRUdFWFBfTUFQKSBhcyBGb3JtYXRbXTtcbiAgfVxuXG4gIGZvciAoY29uc3QgZm9ybWF0IG9mIGZvcm1hdHMpIHtcbiAgICBpZiAoZm9ybWF0ID09PSBcInVua25vd25cIikge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIlVuYWJsZSB0byB0ZXN0IGZvciB1bmtub3duIGZyb250IG1hdHRlciBmb3JtYXRcIik7XG4gICAgfVxuXG4gICAgY29uc3QgbWF0Y2ggPSBFWFRSQUNUX1JFR0VYUF9NQVBbZm9ybWF0XS5leGVjKHN0cik7XG4gICAgaWYgKG1hdGNoPy5pbmRleCA9PT0gMCkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGZhbHNlO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLDBFQUEwRTtBQUUxRSxTQUFTLGtCQUFrQixRQUFRLGdCQUFnQjtBQUluRDs7Ozs7Ozs7Ozs7Ozs7Q0FjQyxHQUNELE9BQU8sU0FBUyxLQUNkLEdBQVcsRUFDWCxPQUFrQjtFQUVsQixJQUFJLENBQUMsU0FBUztJQUNaLFVBQVUsT0FBTyxJQUFJLENBQUM7RUFDeEI7RUFFQSxLQUFLLE1BQU0sVUFBVSxRQUFTO0lBQzVCLElBQUksV0FBVyxXQUFXO01BQ3hCLE1BQU0sSUFBSSxVQUFVO0lBQ3RCO0lBRUEsTUFBTSxRQUFRLGtCQUFrQixDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUM7SUFDOUMsSUFBSSxPQUFPLFVBQVUsR0FBRztNQUN0QixPQUFPO0lBQ1Q7RUFDRjtFQUVBLE9BQU87QUFDVCJ9