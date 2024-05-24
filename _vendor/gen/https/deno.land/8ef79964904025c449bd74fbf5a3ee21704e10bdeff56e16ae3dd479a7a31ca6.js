/**
 * This module contains a stringifier for XML data.
 * @module
 */ //Imports
import { Stringifier } from "./utils/stringifier.ts";
/**
 * XML stringifier
 *
 * Convert a {@link udocument} into a `string`.
 *
 * {@link StringifierOptions} can be used to customize the stringifier behavior.
 *
 * @example
 * ```ts
 * import { stringify } from "./stringify.ts"
 *
 * console.log(stringify({
 *   root: {
 *     "#comment": "This is a comment",
 *     text: "hello",
 *     array: ["world", "monde", "世界", "🌏"],
 *     number: 42,
 *     boolean: true,
 *     complex: {
 *       "@attribute": "value",
 *       "#text": "content",
 *     },
 *   },
 * }))
 * ```
 */ export function stringify(content, options) {
  return new Stringifier(content, options).stringify();
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gveG1sQDQuMC4wL3N0cmluZ2lmeS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIFRoaXMgbW9kdWxlIGNvbnRhaW5zIGEgc3RyaW5naWZpZXIgZm9yIFhNTCBkYXRhLlxuICogQG1vZHVsZVxuICovXG4vL0ltcG9ydHNcbmltcG9ydCB7IFN0cmluZ2lmaWVyIH0gZnJvbSBcIi4vdXRpbHMvc3RyaW5naWZpZXIudHNcIlxuaW1wb3J0IHR5cGUgeyBTdHJpbmdpZmllck9wdGlvbnMsIHVkb2N1bWVudCB9IGZyb20gXCIuL3V0aWxzL3R5cGVzLnRzXCJcblxuLyoqXG4gKiBYTUwgc3RyaW5naWZpZXJcbiAqXG4gKiBDb252ZXJ0IGEge0BsaW5rIHVkb2N1bWVudH0gaW50byBhIGBzdHJpbmdgLlxuICpcbiAqIHtAbGluayBTdHJpbmdpZmllck9wdGlvbnN9IGNhbiBiZSB1c2VkIHRvIGN1c3RvbWl6ZSB0aGUgc3RyaW5naWZpZXIgYmVoYXZpb3IuXG4gKlxuICogQGV4YW1wbGVcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyBzdHJpbmdpZnkgfSBmcm9tIFwiLi9zdHJpbmdpZnkudHNcIlxuICpcbiAqIGNvbnNvbGUubG9nKHN0cmluZ2lmeSh7XG4gKiAgIHJvb3Q6IHtcbiAqICAgICBcIiNjb21tZW50XCI6IFwiVGhpcyBpcyBhIGNvbW1lbnRcIixcbiAqICAgICB0ZXh0OiBcImhlbGxvXCIsXG4gKiAgICAgYXJyYXk6IFtcIndvcmxkXCIsIFwibW9uZGVcIiwgXCLkuJbnlYxcIiwgXCLwn4yPXCJdLFxuICogICAgIG51bWJlcjogNDIsXG4gKiAgICAgYm9vbGVhbjogdHJ1ZSxcbiAqICAgICBjb21wbGV4OiB7XG4gKiAgICAgICBcIkBhdHRyaWJ1dGVcIjogXCJ2YWx1ZVwiLFxuICogICAgICAgXCIjdGV4dFwiOiBcImNvbnRlbnRcIixcbiAqICAgICB9LFxuICogICB9LFxuICogfSkpXG4gKiBgYGBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHN0cmluZ2lmeShjb250ZW50OiB1ZG9jdW1lbnQsIG9wdGlvbnM/OiBTdHJpbmdpZmllck9wdGlvbnMpOiBzdHJpbmcge1xuICByZXR1cm4gbmV3IFN0cmluZ2lmaWVyKGNvbnRlbnQsIG9wdGlvbnMpLnN0cmluZ2lmeSgpXG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztDQUdDLEdBQ0QsU0FBUztBQUNULFNBQVMsV0FBVyxRQUFRLHlCQUF3QjtBQUdwRDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztDQXlCQyxHQUNELE9BQU8sU0FBUyxVQUFVLE9BQWtCLEVBQUUsT0FBNEI7RUFDeEUsT0FBTyxJQUFJLFlBQVksU0FBUyxTQUFTLFNBQVM7QUFDcEQifQ==