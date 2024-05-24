// deno-lint-ignore-file no-unused-vars
// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// Copyright (c) Jason Campbell. MIT license
/**
 * Extracts
 * {@link https://daily-dev-tips.com/posts/what-exactly-is-frontmatter/ | front matter}
 * from strings. Adapted from
 * {@link https://github.com/jxson/front-matter/blob/36f139ef797bd9e5196a9ede03ef481d7fbca18e/index.js | jxson/front-matter}.
 *
 * ## Supported formats
 *
 * ### JSON
 *
 * ```ts
 * import { test } from "@std/front-matter/test";
 * import { extract } from "@std/front-matter/json";
 *
 * const str = "---json\n{\"and\": \"this\"}\n---\ndeno is awesome";
 * const result = extract(str);
 *
 * test(str); // true
 * result.frontMatter; // "{\"and\": \"this\"}"
 * result.body; // "deno is awesome"
 * result.attrs; // { and: "this" }
 * ```
 *
 * {@linkcode extractJson | extract} and {@linkcode test} support the following delimiters.
 *
 * ```markdown
 * ---json
 * {
 *   "and": "this"
 * }
 * ---
 * ```
 *
 * ```markdown
 * {
 *   "is": "JSON"
 * }
 * ```
 *
 * ### TOML
 *
 * ```ts
 * import { test } from "@std/front-matter/test";
 * import { extract } from "@std/front-matter/toml";
 *
 * const str = "---toml\nmodule = 'front_matter'\n---\ndeno is awesome";
 * const result = extract(str);
 *
 * test(str); // true
 * result.frontMatter; // "module = 'front_matter'"
 * result.body; // "deno is awesome"
 * result.attrs; // { module: "front_matter" }
 * ```
 *
 * {@linkcode extractToml | extract} and {@linkcode test} support the following delimiters.
 *
 * ```markdown
 * ---toml
 * this = 'is'
 * ---
 * ```
 *
 * ```markdown
 * = toml =
 * parsed = 'as'
 * toml = 'data'
 * = toml =
 * ```
 *
 * ```markdown
 * +++
 * is = 'that'
 * not = 'cool?'
 * +++
 * ```
 *
 * ### YAML
 *
 * ```ts
 * import { test } from "@std/front-matter/test";
 * import { extract } from "@std/front-matter/yaml";
 *
 * const str = "---yaml\nmodule: front_matter\n---\ndeno is awesome";
 * const result = extract(str);
 *
 * test(str); // true
 * result.frontMatter; // "module: front_matter"
 * result.body; // "deno is awesome"
 * result.attrs; // { module: "front_matter" }
 * ```
 *
 * {@linkcode extractYaml | extract} and {@linkcode test} support the following delimiters.
 *
 * ```front_matter
 * ---
 * these: are
 * ---
 * ```
 *
 * ```markdown
 * ---yaml
 * all: recognized
 * ---
 * ```
 *
 * ```markdown
 * = yaml =
 * as: yaml
 * = yaml =
 * ```
 *
 * @module
 */ export * from "./create_extractor.ts";
export * from "./test.ts";
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0BzdGQvZnJvbnQtbWF0dGVyLzAuMjI0LjAvbW9kLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIGRlbm8tbGludC1pZ25vcmUtZmlsZSBuby11bnVzZWQtdmFyc1xuLy8gQ29weXJpZ2h0IDIwMTgtMjAyNCB0aGUgRGVubyBhdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLiBNSVQgbGljZW5zZS5cbi8vIENvcHlyaWdodCAoYykgSmFzb24gQ2FtcGJlbGwuIE1JVCBsaWNlbnNlXG5cbi8qKlxuICogRXh0cmFjdHNcbiAqIHtAbGluayBodHRwczovL2RhaWx5LWRldi10aXBzLmNvbS9wb3N0cy93aGF0LWV4YWN0bHktaXMtZnJvbnRtYXR0ZXIvIHwgZnJvbnQgbWF0dGVyfVxuICogZnJvbSBzdHJpbmdzLiBBZGFwdGVkIGZyb21cbiAqIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vanhzb24vZnJvbnQtbWF0dGVyL2Jsb2IvMzZmMTM5ZWY3OTdiZDllNTE5NmE5ZWRlMDNlZjQ4MWQ3ZmJjYTE4ZS9pbmRleC5qcyB8IGp4c29uL2Zyb250LW1hdHRlcn0uXG4gKlxuICogIyMgU3VwcG9ydGVkIGZvcm1hdHNcbiAqXG4gKiAjIyMgSlNPTlxuICpcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyB0ZXN0IH0gZnJvbSBcIkBzdGQvZnJvbnQtbWF0dGVyL3Rlc3RcIjtcbiAqIGltcG9ydCB7IGV4dHJhY3QgfSBmcm9tIFwiQHN0ZC9mcm9udC1tYXR0ZXIvanNvblwiO1xuICpcbiAqIGNvbnN0IHN0ciA9IFwiLS0tanNvblxcbntcXFwiYW5kXFxcIjogXFxcInRoaXNcXFwifVxcbi0tLVxcbmRlbm8gaXMgYXdlc29tZVwiO1xuICogY29uc3QgcmVzdWx0ID0gZXh0cmFjdChzdHIpO1xuICpcbiAqIHRlc3Qoc3RyKTsgLy8gdHJ1ZVxuICogcmVzdWx0LmZyb250TWF0dGVyOyAvLyBcIntcXFwiYW5kXFxcIjogXFxcInRoaXNcXFwifVwiXG4gKiByZXN1bHQuYm9keTsgLy8gXCJkZW5vIGlzIGF3ZXNvbWVcIlxuICogcmVzdWx0LmF0dHJzOyAvLyB7IGFuZDogXCJ0aGlzXCIgfVxuICogYGBgXG4gKlxuICoge0BsaW5rY29kZSBleHRyYWN0SnNvbiB8IGV4dHJhY3R9IGFuZCB7QGxpbmtjb2RlIHRlc3R9IHN1cHBvcnQgdGhlIGZvbGxvd2luZyBkZWxpbWl0ZXJzLlxuICpcbiAqIGBgYG1hcmtkb3duXG4gKiAtLS1qc29uXG4gKiB7XG4gKiAgIFwiYW5kXCI6IFwidGhpc1wiXG4gKiB9XG4gKiAtLS1cbiAqIGBgYFxuICpcbiAqIGBgYG1hcmtkb3duXG4gKiB7XG4gKiAgIFwiaXNcIjogXCJKU09OXCJcbiAqIH1cbiAqIGBgYFxuICpcbiAqICMjIyBUT01MXG4gKlxuICogYGBgdHNcbiAqIGltcG9ydCB7IHRlc3QgfSBmcm9tIFwiQHN0ZC9mcm9udC1tYXR0ZXIvdGVzdFwiO1xuICogaW1wb3J0IHsgZXh0cmFjdCB9IGZyb20gXCJAc3RkL2Zyb250LW1hdHRlci90b21sXCI7XG4gKlxuICogY29uc3Qgc3RyID0gXCItLS10b21sXFxubW9kdWxlID0gJ2Zyb250X21hdHRlcidcXG4tLS1cXG5kZW5vIGlzIGF3ZXNvbWVcIjtcbiAqIGNvbnN0IHJlc3VsdCA9IGV4dHJhY3Qoc3RyKTtcbiAqXG4gKiB0ZXN0KHN0cik7IC8vIHRydWVcbiAqIHJlc3VsdC5mcm9udE1hdHRlcjsgLy8gXCJtb2R1bGUgPSAnZnJvbnRfbWF0dGVyJ1wiXG4gKiByZXN1bHQuYm9keTsgLy8gXCJkZW5vIGlzIGF3ZXNvbWVcIlxuICogcmVzdWx0LmF0dHJzOyAvLyB7IG1vZHVsZTogXCJmcm9udF9tYXR0ZXJcIiB9XG4gKiBgYGBcbiAqXG4gKiB7QGxpbmtjb2RlIGV4dHJhY3RUb21sIHwgZXh0cmFjdH0gYW5kIHtAbGlua2NvZGUgdGVzdH0gc3VwcG9ydCB0aGUgZm9sbG93aW5nIGRlbGltaXRlcnMuXG4gKlxuICogYGBgbWFya2Rvd25cbiAqIC0tLXRvbWxcbiAqIHRoaXMgPSAnaXMnXG4gKiAtLS1cbiAqIGBgYFxuICpcbiAqIGBgYG1hcmtkb3duXG4gKiA9IHRvbWwgPVxuICogcGFyc2VkID0gJ2FzJ1xuICogdG9tbCA9ICdkYXRhJ1xuICogPSB0b21sID1cbiAqIGBgYFxuICpcbiAqIGBgYG1hcmtkb3duXG4gKiArKytcbiAqIGlzID0gJ3RoYXQnXG4gKiBub3QgPSAnY29vbD8nXG4gKiArKytcbiAqIGBgYFxuICpcbiAqICMjIyBZQU1MXG4gKlxuICogYGBgdHNcbiAqIGltcG9ydCB7IHRlc3QgfSBmcm9tIFwiQHN0ZC9mcm9udC1tYXR0ZXIvdGVzdFwiO1xuICogaW1wb3J0IHsgZXh0cmFjdCB9IGZyb20gXCJAc3RkL2Zyb250LW1hdHRlci95YW1sXCI7XG4gKlxuICogY29uc3Qgc3RyID0gXCItLS15YW1sXFxubW9kdWxlOiBmcm9udF9tYXR0ZXJcXG4tLS1cXG5kZW5vIGlzIGF3ZXNvbWVcIjtcbiAqIGNvbnN0IHJlc3VsdCA9IGV4dHJhY3Qoc3RyKTtcbiAqXG4gKiB0ZXN0KHN0cik7IC8vIHRydWVcbiAqIHJlc3VsdC5mcm9udE1hdHRlcjsgLy8gXCJtb2R1bGU6IGZyb250X21hdHRlclwiXG4gKiByZXN1bHQuYm9keTsgLy8gXCJkZW5vIGlzIGF3ZXNvbWVcIlxuICogcmVzdWx0LmF0dHJzOyAvLyB7IG1vZHVsZTogXCJmcm9udF9tYXR0ZXJcIiB9XG4gKiBgYGBcbiAqXG4gKiB7QGxpbmtjb2RlIGV4dHJhY3RZYW1sIHwgZXh0cmFjdH0gYW5kIHtAbGlua2NvZGUgdGVzdH0gc3VwcG9ydCB0aGUgZm9sbG93aW5nIGRlbGltaXRlcnMuXG4gKlxuICogYGBgZnJvbnRfbWF0dGVyXG4gKiAtLS1cbiAqIHRoZXNlOiBhcmVcbiAqIC0tLVxuICogYGBgXG4gKlxuICogYGBgbWFya2Rvd25cbiAqIC0tLXlhbWxcbiAqIGFsbDogcmVjb2duaXplZFxuICogLS0tXG4gKiBgYGBcbiAqXG4gKiBgYGBtYXJrZG93blxuICogPSB5YW1sID1cbiAqIGFzOiB5YW1sXG4gKiA9IHlhbWwgPVxuICogYGBgXG4gKlxuICogQG1vZHVsZVxuICovXG5pbXBvcnQgdHlwZSB7IGV4dHJhY3QgYXMgZXh0cmFjdEpzb24gfSBmcm9tIFwiLi9qc29uLnRzXCI7XG5pbXBvcnQgdHlwZSB7IGV4dHJhY3QgYXMgZXh0cmFjdFRvbWwgfSBmcm9tIFwiLi90b21sLnRzXCI7XG5pbXBvcnQgdHlwZSB7IGV4dHJhY3QgYXMgZXh0cmFjdFlhbWwgfSBmcm9tIFwiLi95YW1sLnRzXCI7XG5cbmV4cG9ydCAqIGZyb20gXCIuL2NyZWF0ZV9leHRyYWN0b3IudHNcIjtcbmV4cG9ydCAqIGZyb20gXCIuL3Rlc3QudHNcIjtcbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSx1Q0FBdUM7QUFDdkMsMEVBQTBFO0FBQzFFLDRDQUE0QztBQUU1Qzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztDQWdIQyxHQUtELGNBQWMsd0JBQXdCO0FBQ3RDLGNBQWMsWUFBWSJ9