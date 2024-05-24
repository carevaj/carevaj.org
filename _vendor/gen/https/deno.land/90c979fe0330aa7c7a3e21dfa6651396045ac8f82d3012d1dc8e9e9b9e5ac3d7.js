/**
 * This module contains a parser for XML data.
 * @module
 */ //Imports
import { Parser } from "./utils/parser.ts";
import { Stream } from "./utils/stream.ts";
import { Streamable } from "./utils/streamable.ts";
/**
 * XML parser
 *
 * Parse a `string` or a {@link Flux} stream into a {@link document}.
 *
 * Parsed attributes will be prefixed with `@`, while comments will be stored in `#comment` property and content in `#text`.
 * If a node does not possess any attribute or comments, then it will be flattened into its text content for convenience.
 *
 * {@link ParserOptions} can be used to customize the parser behavior.
 *
 * @example
 * ```ts
 * import { parse } from "./parse.ts"
 *
 * console.log(parse(
 * `
 *   <root>
 *     <!-- This is a comment -->
 *     <text>hello</text>
 *     <array>world</array>
 *     <array>monde</array>
 *     <array>世界</array>
 *     <array>🌏</array>
 *     <number>42</number>
 *     <boolean>true</boolean>
 *     <complex attribute="value">content</complex>
 *   </root>
 * `,
 *   { reviveNumbers: true, reviveBooleans: true },
 * ))
 * ```
 */ export function parse(content, options) {
  if (typeof content === "string") {
    content = new Streamable(content);
  }
  return new Parser(new Stream(content), options).parse();
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gveG1sQDQuMC4wL3BhcnNlLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogVGhpcyBtb2R1bGUgY29udGFpbnMgYSBwYXJzZXIgZm9yIFhNTCBkYXRhLlxuICogQG1vZHVsZVxuICovXG4vL0ltcG9ydHNcbmltcG9ydCB7IFBhcnNlciB9IGZyb20gXCIuL3V0aWxzL3BhcnNlci50c1wiXG5pbXBvcnQgeyBTdHJlYW0gfSBmcm9tIFwiLi91dGlscy9zdHJlYW0udHNcIlxuaW1wb3J0IHsgU3RyZWFtYWJsZSB9IGZyb20gXCIuL3V0aWxzL3N0cmVhbWFibGUudHNcIlxuaW1wb3J0IHR5cGUgeyBkb2N1bWVudCwgRmx1eCwgUGFyc2VyT3B0aW9ucyB9IGZyb20gXCIuL3V0aWxzL3R5cGVzLnRzXCJcblxuLyoqXG4gKiBYTUwgcGFyc2VyXG4gKlxuICogUGFyc2UgYSBgc3RyaW5nYCBvciBhIHtAbGluayBGbHV4fSBzdHJlYW0gaW50byBhIHtAbGluayBkb2N1bWVudH0uXG4gKlxuICogUGFyc2VkIGF0dHJpYnV0ZXMgd2lsbCBiZSBwcmVmaXhlZCB3aXRoIGBAYCwgd2hpbGUgY29tbWVudHMgd2lsbCBiZSBzdG9yZWQgaW4gYCNjb21tZW50YCBwcm9wZXJ0eSBhbmQgY29udGVudCBpbiBgI3RleHRgLlxuICogSWYgYSBub2RlIGRvZXMgbm90IHBvc3Nlc3MgYW55IGF0dHJpYnV0ZSBvciBjb21tZW50cywgdGhlbiBpdCB3aWxsIGJlIGZsYXR0ZW5lZCBpbnRvIGl0cyB0ZXh0IGNvbnRlbnQgZm9yIGNvbnZlbmllbmNlLlxuICpcbiAqIHtAbGluayBQYXJzZXJPcHRpb25zfSBjYW4gYmUgdXNlZCB0byBjdXN0b21pemUgdGhlIHBhcnNlciBiZWhhdmlvci5cbiAqXG4gKiBAZXhhbXBsZVxuICogYGBgdHNcbiAqIGltcG9ydCB7IHBhcnNlIH0gZnJvbSBcIi4vcGFyc2UudHNcIlxuICpcbiAqIGNvbnNvbGUubG9nKHBhcnNlKFxuICogYFxuICogICA8cm9vdD5cbiAqICAgICA8IS0tIFRoaXMgaXMgYSBjb21tZW50IC0tPlxuICogICAgIDx0ZXh0PmhlbGxvPC90ZXh0PlxuICogICAgIDxhcnJheT53b3JsZDwvYXJyYXk+XG4gKiAgICAgPGFycmF5Pm1vbmRlPC9hcnJheT5cbiAqICAgICA8YXJyYXk+5LiW55WMPC9hcnJheT5cbiAqICAgICA8YXJyYXk+8J+MjzwvYXJyYXk+XG4gKiAgICAgPG51bWJlcj40MjwvbnVtYmVyPlxuICogICAgIDxib29sZWFuPnRydWU8L2Jvb2xlYW4+XG4gKiAgICAgPGNvbXBsZXggYXR0cmlidXRlPVwidmFsdWVcIj5jb250ZW50PC9jb21wbGV4PlxuICogICA8L3Jvb3Q+XG4gKiBgLFxuICogICB7IHJldml2ZU51bWJlcnM6IHRydWUsIHJldml2ZUJvb2xlYW5zOiB0cnVlIH0sXG4gKiApKVxuICogYGBgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZShjb250ZW50OiBzdHJpbmcgfCBGbHV4LCBvcHRpb25zPzogUGFyc2VyT3B0aW9ucyk6IGRvY3VtZW50IHtcbiAgaWYgKHR5cGVvZiBjb250ZW50ID09PSBcInN0cmluZ1wiKSB7XG4gICAgY29udGVudCA9IG5ldyBTdHJlYW1hYmxlKGNvbnRlbnQpXG4gIH1cbiAgcmV0dXJuIG5ldyBQYXJzZXIobmV3IFN0cmVhbShjb250ZW50KSwgb3B0aW9ucykucGFyc2UoKSBhcyBkb2N1bWVudFxufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Q0FHQyxHQUNELFNBQVM7QUFDVCxTQUFTLE1BQU0sUUFBUSxvQkFBbUI7QUFDMUMsU0FBUyxNQUFNLFFBQVEsb0JBQW1CO0FBQzFDLFNBQVMsVUFBVSxRQUFRLHdCQUF1QjtBQUdsRDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztDQStCQyxHQUNELE9BQU8sU0FBUyxNQUFNLE9BQXNCLEVBQUUsT0FBdUI7RUFDbkUsSUFBSSxPQUFPLFlBQVksVUFBVTtJQUMvQixVQUFVLElBQUksV0FBVztFQUMzQjtFQUNBLE9BQU8sSUFBSSxPQUFPLElBQUksT0FBTyxVQUFVLFNBQVMsS0FBSztBQUN2RCJ9