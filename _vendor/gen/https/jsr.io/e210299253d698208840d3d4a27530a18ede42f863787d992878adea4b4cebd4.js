// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
/**
 * Provides tools for working with JSONC (JSON with comments). Currently, this
 * module only provides a means of parsing JSONC. JSONC serialization is not
 * yet supported.
 *
 * This module is browser compatible.
 *
 * @example
 * ```ts Parsing JSONC
 * import { parse } from "@std/jsonc";
 *
 * parse('{"foo": "bar", } // comment'); // { foo: "bar" }
 * parse('{"foo": "bar", } /* comment *\/'); // { foo: "bar" }
 * parse('{"foo": "bar" } // comment', {
 *   allowTrailingComma: false,
 * }); // { foo: "bar" }
 * ```
 *
 * @module
 */ export * from "./parse.ts";
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0BzdGQvanNvbmMvMC4yMjQuMC9tb2QudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgtMjAyNCB0aGUgRGVubyBhdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLiBNSVQgbGljZW5zZS5cbi8vIFRoaXMgbW9kdWxlIGlzIGJyb3dzZXIgY29tcGF0aWJsZS5cblxuLyoqXG4gKiBQcm92aWRlcyB0b29scyBmb3Igd29ya2luZyB3aXRoIEpTT05DIChKU09OIHdpdGggY29tbWVudHMpLiBDdXJyZW50bHksIHRoaXNcbiAqIG1vZHVsZSBvbmx5IHByb3ZpZGVzIGEgbWVhbnMgb2YgcGFyc2luZyBKU09OQy4gSlNPTkMgc2VyaWFsaXphdGlvbiBpcyBub3RcbiAqIHlldCBzdXBwb3J0ZWQuXG4gKlxuICogVGhpcyBtb2R1bGUgaXMgYnJvd3NlciBjb21wYXRpYmxlLlxuICpcbiAqIEBleGFtcGxlXG4gKiBgYGB0cyBQYXJzaW5nIEpTT05DXG4gKiBpbXBvcnQgeyBwYXJzZSB9IGZyb20gXCJAc3RkL2pzb25jXCI7XG4gKlxuICogcGFyc2UoJ3tcImZvb1wiOiBcImJhclwiLCB9IC8vIGNvbW1lbnQnKTsgLy8geyBmb286IFwiYmFyXCIgfVxuICogcGFyc2UoJ3tcImZvb1wiOiBcImJhclwiLCB9IC8qIGNvbW1lbnQgKlxcLycpOyAvLyB7IGZvbzogXCJiYXJcIiB9XG4gKiBwYXJzZSgne1wiZm9vXCI6IFwiYmFyXCIgfSAvLyBjb21tZW50Jywge1xuICogICBhbGxvd1RyYWlsaW5nQ29tbWE6IGZhbHNlLFxuICogfSk7IC8vIHsgZm9vOiBcImJhclwiIH1cbiAqIGBgYFxuICpcbiAqIEBtb2R1bGVcbiAqL1xuZXhwb3J0ICogZnJvbSBcIi4vcGFyc2UudHNcIjtcbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSwwRUFBMEU7QUFDMUUscUNBQXFDO0FBRXJDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O0NBbUJDLEdBQ0QsY0FBYyxhQUFhIn0=