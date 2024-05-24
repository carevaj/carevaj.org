// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
/**
 * Tools for creating interactive command line tools.
 *
 * ```ts
 * // $ deno run example.ts --foo --bar=baz ./quux.txt
 * import { parseArgs } from "@std/cli/parse-args";
 *
 * const parsedArgs = parseArgs(Deno.args);
 * parsedArgs; // { foo: true, bar: "baz", _: ["./quux.txt"] }
 * ```
 *
 * @module
 */ export * from "./parse_args.ts";
export * from "./prompt_secret.ts";
export * from "./spinner.ts";
export * from "./unicode_width.ts";
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0BzdGQvY2xpLzAuMjI0LjIvbW9kLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjQgdGhlIERlbm8gYXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gTUlUIGxpY2Vuc2UuXG5cbi8qKlxuICogVG9vbHMgZm9yIGNyZWF0aW5nIGludGVyYWN0aXZlIGNvbW1hbmQgbGluZSB0b29scy5cbiAqXG4gKiBgYGB0c1xuICogLy8gJCBkZW5vIHJ1biBleGFtcGxlLnRzIC0tZm9vIC0tYmFyPWJheiAuL3F1dXgudHh0XG4gKiBpbXBvcnQgeyBwYXJzZUFyZ3MgfSBmcm9tIFwiQHN0ZC9jbGkvcGFyc2UtYXJnc1wiO1xuICpcbiAqIGNvbnN0IHBhcnNlZEFyZ3MgPSBwYXJzZUFyZ3MoRGVuby5hcmdzKTtcbiAqIHBhcnNlZEFyZ3M7IC8vIHsgZm9vOiB0cnVlLCBiYXI6IFwiYmF6XCIsIF86IFtcIi4vcXV1eC50eHRcIl0gfVxuICogYGBgXG4gKlxuICogQG1vZHVsZVxuICovXG5cbmV4cG9ydCAqIGZyb20gXCIuL3BhcnNlX2FyZ3MudHNcIjtcbmV4cG9ydCAqIGZyb20gXCIuL3Byb21wdF9zZWNyZXQudHNcIjtcbmV4cG9ydCAqIGZyb20gXCIuL3NwaW5uZXIudHNcIjtcbmV4cG9ydCAqIGZyb20gXCIuL3VuaWNvZGVfd2lkdGgudHNcIjtcbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSwwRUFBMEU7QUFFMUU7Ozs7Ozs7Ozs7OztDQVlDLEdBRUQsY0FBYyxrQkFBa0I7QUFDaEMsY0FBYyxxQkFBcUI7QUFDbkMsY0FBYyxlQUFlO0FBQzdCLGNBQWMscUJBQXFCIn0=