// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
/**
 * {@linkcode parse} and {@linkcode stringify} for handling
 * {@link https://toml.io/en/latest | TOML} encoded data. Be sure to read the supported
 * types as not every spec is supported at the moment and the handling in
 * TypeScript side is a bit different.
 *
 * ## Supported types and handling
 *
 * - [x] [Keys](https://toml.io/en/latest#keys)
 * - [ ] [String](https://toml.io/en/latest#string)
 * - [x] [Multiline String](https://toml.io/en/latest#string)
 * - [x] [Literal String](https://toml.io/en/latest#string)
 * - [ ] [Integer](https://toml.io/en/latest#integer)
 * - [x] [Float](https://toml.io/en/latest#float)
 * - [x] [Boolean](https://toml.io/en/latest#boolean)
 * - [x] [Offset Date-time](https://toml.io/en/latest#offset-date-time)
 * - [x] [Local Date-time](https://toml.io/en/latest#local-date-time)
 * - [x] [Local Date](https://toml.io/en/latest#local-date)
 * - [ ] [Local Time](https://toml.io/en/latest#local-time)
 * - [x] [Table](https://toml.io/en/latest#table)
 * - [x] [Inline Table](https://toml.io/en/latest#inline-table)
 * - [ ] [Array of Tables](https://toml.io/en/latest#array-of-tables)
 *
 * _Supported with warnings see [Warning](#Warning)._
 *
 * ### Warning
 *
 * #### String
 *
 * - Regex: Due to the spec, there is no flag to detect regex properly in a TOML
 *   declaration. So the regex is stored as string.
 *
 * #### Integer
 *
 * For **Binary** / **Octal** / **Hexadecimal** numbers, they are stored as string
 * to be not interpreted as Decimal.
 *
 * #### Local Time
 *
 * Because local time does not exist in JavaScript, the local time is stored as a
 * string.
 *
 * #### Inline Table
 *
 * Inline tables are supported. See below:
 *
 * ```toml
 * animal = { type = { name = "pug" } }
 * ## Output { animal: { type: { name: "pug" } } }
 * animal = { type.name = "pug" }
 * ## Output { animal: { type : { name : "pug" } }
 * animal.as.leaders = "tosin"
 * ## Output { animal: { as: { leaders: "tosin" } } }
 * "tosin.abasi" = "guitarist"
 * ## Output { tosin.abasi: "guitarist" }
 * ```
 *
 * #### Array of Tables
 *
 * At the moment only simple declarations like below are supported:
 *
 * ```toml
 * [[bin]]
 * name = "deno"
 * path = "cli/main.rs"
 *
 * [[bin]]
 * name = "deno_core"
 * path = "src/foo.rs"
 *
 * [[nib]]
 * name = "node"
 * path = "not_found"
 * ```
 *
 * will output:
 *
 * ```json
 * {
 *   "bin": [
 *     { "name": "deno", "path": "cli/main.rs" },
 *     { "name": "deno_core", "path": "src/foo.rs" }
 *   ],
 *   "nib": [{ "name": "node", "path": "not_found" }]
 * }
 * ```
 *
 * This module is browser compatible.
 *
 * @example
 * ```ts
 * import {
 *   parse,
 *   stringify,
 * } from "@std/toml";
 * const obj = {
 *   bin: [
 *     { name: "deno", path: "cli/main.rs" },
 *     { name: "deno_core", path: "src/foo.rs" },
 *   ],
 *   nib: [{ name: "node", path: "not_found" }],
 * };
 * const tomlString = stringify(obj);
 * console.log(tomlString);
 *
 * // =>
 * // [[bin]]
 * // name = "deno"
 * // path = "cli/main.rs"
 *
 * // [[bin]]
 * // name = "deno_core"
 * // path = "src/foo.rs"
 *
 * // [[nib]]
 * // name = "node"
 * // path = "not_found"
 *
 * const tomlObject = parse(tomlString);
 * console.log(tomlObject);
 *
 * // =>
 * // {
 * //   bin: [
 * //     { name: "deno", path: "cli/main.rs" },
 * //     { name: "deno_core", path: "src/foo.rs" }
 * //   ],
 * //   nib: [ { name: "node", path: "not_found" } ]
 * // }
 * ```
 *
 * @module
 */ export * from "./stringify.ts";
export * from "./parse.ts";
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0BzdGQvdG9tbC8wLjIyNC4wL21vZC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDI0IHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuLy8gVGhpcyBtb2R1bGUgaXMgYnJvd3NlciBjb21wYXRpYmxlLlxuXG4vKipcbiAqIHtAbGlua2NvZGUgcGFyc2V9IGFuZCB7QGxpbmtjb2RlIHN0cmluZ2lmeX0gZm9yIGhhbmRsaW5nXG4gKiB7QGxpbmsgaHR0cHM6Ly90b21sLmlvL2VuL2xhdGVzdCB8IFRPTUx9IGVuY29kZWQgZGF0YS4gQmUgc3VyZSB0byByZWFkIHRoZSBzdXBwb3J0ZWRcbiAqIHR5cGVzIGFzIG5vdCBldmVyeSBzcGVjIGlzIHN1cHBvcnRlZCBhdCB0aGUgbW9tZW50IGFuZCB0aGUgaGFuZGxpbmcgaW5cbiAqIFR5cGVTY3JpcHQgc2lkZSBpcyBhIGJpdCBkaWZmZXJlbnQuXG4gKlxuICogIyMgU3VwcG9ydGVkIHR5cGVzIGFuZCBoYW5kbGluZ1xuICpcbiAqIC0gW3hdIFtLZXlzXShodHRwczovL3RvbWwuaW8vZW4vbGF0ZXN0I2tleXMpXG4gKiAtIFsgXSBbU3RyaW5nXShodHRwczovL3RvbWwuaW8vZW4vbGF0ZXN0I3N0cmluZylcbiAqIC0gW3hdIFtNdWx0aWxpbmUgU3RyaW5nXShodHRwczovL3RvbWwuaW8vZW4vbGF0ZXN0I3N0cmluZylcbiAqIC0gW3hdIFtMaXRlcmFsIFN0cmluZ10oaHR0cHM6Ly90b21sLmlvL2VuL2xhdGVzdCNzdHJpbmcpXG4gKiAtIFsgXSBbSW50ZWdlcl0oaHR0cHM6Ly90b21sLmlvL2VuL2xhdGVzdCNpbnRlZ2VyKVxuICogLSBbeF0gW0Zsb2F0XShodHRwczovL3RvbWwuaW8vZW4vbGF0ZXN0I2Zsb2F0KVxuICogLSBbeF0gW0Jvb2xlYW5dKGh0dHBzOi8vdG9tbC5pby9lbi9sYXRlc3QjYm9vbGVhbilcbiAqIC0gW3hdIFtPZmZzZXQgRGF0ZS10aW1lXShodHRwczovL3RvbWwuaW8vZW4vbGF0ZXN0I29mZnNldC1kYXRlLXRpbWUpXG4gKiAtIFt4XSBbTG9jYWwgRGF0ZS10aW1lXShodHRwczovL3RvbWwuaW8vZW4vbGF0ZXN0I2xvY2FsLWRhdGUtdGltZSlcbiAqIC0gW3hdIFtMb2NhbCBEYXRlXShodHRwczovL3RvbWwuaW8vZW4vbGF0ZXN0I2xvY2FsLWRhdGUpXG4gKiAtIFsgXSBbTG9jYWwgVGltZV0oaHR0cHM6Ly90b21sLmlvL2VuL2xhdGVzdCNsb2NhbC10aW1lKVxuICogLSBbeF0gW1RhYmxlXShodHRwczovL3RvbWwuaW8vZW4vbGF0ZXN0I3RhYmxlKVxuICogLSBbeF0gW0lubGluZSBUYWJsZV0oaHR0cHM6Ly90b21sLmlvL2VuL2xhdGVzdCNpbmxpbmUtdGFibGUpXG4gKiAtIFsgXSBbQXJyYXkgb2YgVGFibGVzXShodHRwczovL3RvbWwuaW8vZW4vbGF0ZXN0I2FycmF5LW9mLXRhYmxlcylcbiAqXG4gKiBfU3VwcG9ydGVkIHdpdGggd2FybmluZ3Mgc2VlIFtXYXJuaW5nXSgjV2FybmluZykuX1xuICpcbiAqICMjIyBXYXJuaW5nXG4gKlxuICogIyMjIyBTdHJpbmdcbiAqXG4gKiAtIFJlZ2V4OiBEdWUgdG8gdGhlIHNwZWMsIHRoZXJlIGlzIG5vIGZsYWcgdG8gZGV0ZWN0IHJlZ2V4IHByb3Blcmx5IGluIGEgVE9NTFxuICogICBkZWNsYXJhdGlvbi4gU28gdGhlIHJlZ2V4IGlzIHN0b3JlZCBhcyBzdHJpbmcuXG4gKlxuICogIyMjIyBJbnRlZ2VyXG4gKlxuICogRm9yICoqQmluYXJ5KiogLyAqKk9jdGFsKiogLyAqKkhleGFkZWNpbWFsKiogbnVtYmVycywgdGhleSBhcmUgc3RvcmVkIGFzIHN0cmluZ1xuICogdG8gYmUgbm90IGludGVycHJldGVkIGFzIERlY2ltYWwuXG4gKlxuICogIyMjIyBMb2NhbCBUaW1lXG4gKlxuICogQmVjYXVzZSBsb2NhbCB0aW1lIGRvZXMgbm90IGV4aXN0IGluIEphdmFTY3JpcHQsIHRoZSBsb2NhbCB0aW1lIGlzIHN0b3JlZCBhcyBhXG4gKiBzdHJpbmcuXG4gKlxuICogIyMjIyBJbmxpbmUgVGFibGVcbiAqXG4gKiBJbmxpbmUgdGFibGVzIGFyZSBzdXBwb3J0ZWQuIFNlZSBiZWxvdzpcbiAqXG4gKiBgYGB0b21sXG4gKiBhbmltYWwgPSB7IHR5cGUgPSB7IG5hbWUgPSBcInB1Z1wiIH0gfVxuICogIyMgT3V0cHV0IHsgYW5pbWFsOiB7IHR5cGU6IHsgbmFtZTogXCJwdWdcIiB9IH0gfVxuICogYW5pbWFsID0geyB0eXBlLm5hbWUgPSBcInB1Z1wiIH1cbiAqICMjIE91dHB1dCB7IGFuaW1hbDogeyB0eXBlIDogeyBuYW1lIDogXCJwdWdcIiB9IH1cbiAqIGFuaW1hbC5hcy5sZWFkZXJzID0gXCJ0b3NpblwiXG4gKiAjIyBPdXRwdXQgeyBhbmltYWw6IHsgYXM6IHsgbGVhZGVyczogXCJ0b3NpblwiIH0gfSB9XG4gKiBcInRvc2luLmFiYXNpXCIgPSBcImd1aXRhcmlzdFwiXG4gKiAjIyBPdXRwdXQgeyB0b3Npbi5hYmFzaTogXCJndWl0YXJpc3RcIiB9XG4gKiBgYGBcbiAqXG4gKiAjIyMjIEFycmF5IG9mIFRhYmxlc1xuICpcbiAqIEF0IHRoZSBtb21lbnQgb25seSBzaW1wbGUgZGVjbGFyYXRpb25zIGxpa2UgYmVsb3cgYXJlIHN1cHBvcnRlZDpcbiAqXG4gKiBgYGB0b21sXG4gKiBbW2Jpbl1dXG4gKiBuYW1lID0gXCJkZW5vXCJcbiAqIHBhdGggPSBcImNsaS9tYWluLnJzXCJcbiAqXG4gKiBbW2Jpbl1dXG4gKiBuYW1lID0gXCJkZW5vX2NvcmVcIlxuICogcGF0aCA9IFwic3JjL2Zvby5yc1wiXG4gKlxuICogW1tuaWJdXVxuICogbmFtZSA9IFwibm9kZVwiXG4gKiBwYXRoID0gXCJub3RfZm91bmRcIlxuICogYGBgXG4gKlxuICogd2lsbCBvdXRwdXQ6XG4gKlxuICogYGBganNvblxuICoge1xuICogICBcImJpblwiOiBbXG4gKiAgICAgeyBcIm5hbWVcIjogXCJkZW5vXCIsIFwicGF0aFwiOiBcImNsaS9tYWluLnJzXCIgfSxcbiAqICAgICB7IFwibmFtZVwiOiBcImRlbm9fY29yZVwiLCBcInBhdGhcIjogXCJzcmMvZm9vLnJzXCIgfVxuICogICBdLFxuICogICBcIm5pYlwiOiBbeyBcIm5hbWVcIjogXCJub2RlXCIsIFwicGF0aFwiOiBcIm5vdF9mb3VuZFwiIH1dXG4gKiB9XG4gKiBgYGBcbiAqXG4gKiBUaGlzIG1vZHVsZSBpcyBicm93c2VyIGNvbXBhdGlibGUuXG4gKlxuICogQGV4YW1wbGVcbiAqIGBgYHRzXG4gKiBpbXBvcnQge1xuICogICBwYXJzZSxcbiAqICAgc3RyaW5naWZ5LFxuICogfSBmcm9tIFwiQHN0ZC90b21sXCI7XG4gKiBjb25zdCBvYmogPSB7XG4gKiAgIGJpbjogW1xuICogICAgIHsgbmFtZTogXCJkZW5vXCIsIHBhdGg6IFwiY2xpL21haW4ucnNcIiB9LFxuICogICAgIHsgbmFtZTogXCJkZW5vX2NvcmVcIiwgcGF0aDogXCJzcmMvZm9vLnJzXCIgfSxcbiAqICAgXSxcbiAqICAgbmliOiBbeyBuYW1lOiBcIm5vZGVcIiwgcGF0aDogXCJub3RfZm91bmRcIiB9XSxcbiAqIH07XG4gKiBjb25zdCB0b21sU3RyaW5nID0gc3RyaW5naWZ5KG9iaik7XG4gKiBjb25zb2xlLmxvZyh0b21sU3RyaW5nKTtcbiAqXG4gKiAvLyA9PlxuICogLy8gW1tiaW5dXVxuICogLy8gbmFtZSA9IFwiZGVub1wiXG4gKiAvLyBwYXRoID0gXCJjbGkvbWFpbi5yc1wiXG4gKlxuICogLy8gW1tiaW5dXVxuICogLy8gbmFtZSA9IFwiZGVub19jb3JlXCJcbiAqIC8vIHBhdGggPSBcInNyYy9mb28ucnNcIlxuICpcbiAqIC8vIFtbbmliXV1cbiAqIC8vIG5hbWUgPSBcIm5vZGVcIlxuICogLy8gcGF0aCA9IFwibm90X2ZvdW5kXCJcbiAqXG4gKiBjb25zdCB0b21sT2JqZWN0ID0gcGFyc2UodG9tbFN0cmluZyk7XG4gKiBjb25zb2xlLmxvZyh0b21sT2JqZWN0KTtcbiAqXG4gKiAvLyA9PlxuICogLy8ge1xuICogLy8gICBiaW46IFtcbiAqIC8vICAgICB7IG5hbWU6IFwiZGVub1wiLCBwYXRoOiBcImNsaS9tYWluLnJzXCIgfSxcbiAqIC8vICAgICB7IG5hbWU6IFwiZGVub19jb3JlXCIsIHBhdGg6IFwic3JjL2Zvby5yc1wiIH1cbiAqIC8vICAgXSxcbiAqIC8vICAgbmliOiBbIHsgbmFtZTogXCJub2RlXCIsIHBhdGg6IFwibm90X2ZvdW5kXCIgfSBdXG4gKiAvLyB9XG4gKiBgYGBcbiAqXG4gKiBAbW9kdWxlXG4gKi9cblxuZXhwb3J0ICogZnJvbSBcIi4vc3RyaW5naWZ5LnRzXCI7XG5leHBvcnQgKiBmcm9tIFwiLi9wYXJzZS50c1wiO1xuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLDBFQUEwRTtBQUMxRSxxQ0FBcUM7QUFFckM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztDQW9JQyxHQUVELGNBQWMsaUJBQWlCO0FBQy9CLGNBQWMsYUFBYSJ9