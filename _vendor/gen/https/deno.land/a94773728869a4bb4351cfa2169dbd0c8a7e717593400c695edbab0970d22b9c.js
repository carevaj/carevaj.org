/**
 * Base class for custom types.
 *
 * **Custom type example:**
 * ```
 * export class ColorType extends Type<string> {
 *   public parse({ label, name, value, type }: ArgumentValue): string {
 *     if (["red", "blue"].includes(value)) {
 *       trow new Error(
 *         `${label} "${name}" must be of type "${type}", but got "${value}".` +
 *         "Valid colors are: red, blue"
 *       );
 *     }
 *     return value;
 *   }
 *
 *   public complete(): string[] {
 *     return ["red", "blue"];
 *   }
 * }
 * ```
 */ export class Type {
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvY2xpZmZ5QHYwLjI1LjcvY29tbWFuZC90eXBlLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB0eXBlIHsgQ29tbWFuZCB9IGZyb20gXCIuL2NvbW1hbmQudHNcIjtcbmltcG9ydCB7IFR5cGVPclR5cGVIYW5kbGVyIH0gZnJvbSBcIi4vdHlwZXMudHNcIjtcbmltcG9ydCB0eXBlIHtcbiAgQXJndW1lbnRWYWx1ZSxcbiAgQ29tcGxldGVIYW5kbGVyUmVzdWx0LFxuICBWYWx1ZXNIYW5kbGVyUmVzdWx0LFxufSBmcm9tIFwiLi90eXBlcy50c1wiO1xuXG4vKipcbiAqIEJhc2UgY2xhc3MgZm9yIGN1c3RvbSB0eXBlcy5cbiAqXG4gKiAqKkN1c3RvbSB0eXBlIGV4YW1wbGU6KipcbiAqIGBgYFxuICogZXhwb3J0IGNsYXNzIENvbG9yVHlwZSBleHRlbmRzIFR5cGU8c3RyaW5nPiB7XG4gKiAgIHB1YmxpYyBwYXJzZSh7IGxhYmVsLCBuYW1lLCB2YWx1ZSwgdHlwZSB9OiBBcmd1bWVudFZhbHVlKTogc3RyaW5nIHtcbiAqICAgICBpZiAoW1wicmVkXCIsIFwiYmx1ZVwiXS5pbmNsdWRlcyh2YWx1ZSkpIHtcbiAqICAgICAgIHRyb3cgbmV3IEVycm9yKFxuICogICAgICAgICBgJHtsYWJlbH0gXCIke25hbWV9XCIgbXVzdCBiZSBvZiB0eXBlIFwiJHt0eXBlfVwiLCBidXQgZ290IFwiJHt2YWx1ZX1cIi5gICtcbiAqICAgICAgICAgXCJWYWxpZCBjb2xvcnMgYXJlOiByZWQsIGJsdWVcIlxuICogICAgICAgKTtcbiAqICAgICB9XG4gKiAgICAgcmV0dXJuIHZhbHVlO1xuICogICB9XG4gKlxuICogICBwdWJsaWMgY29tcGxldGUoKTogc3RyaW5nW10ge1xuICogICAgIHJldHVybiBbXCJyZWRcIiwgXCJibHVlXCJdO1xuICogICB9XG4gKiB9XG4gKiBgYGBcbiAqL1xuZXhwb3J0IGFic3RyYWN0IGNsYXNzIFR5cGU8VFZhbHVlPiB7XG4gIHB1YmxpYyBhYnN0cmFjdCBwYXJzZSh0eXBlOiBBcmd1bWVudFZhbHVlKTogVFZhbHVlO1xuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHZhbHVlcyBkaXNwbGF5ZWQgaW4gaGVscCB0ZXh0LiBJZiBubyBjb21wbGV0ZSBtZXRob2QgaXMgcHJvdmlkZWQsXG4gICAqIHRoZXNlIHZhbHVlcyBhcmUgYWxzbyB1c2VkIGZvciBzaGVsbCBjb21wbGV0aW9ucy5cbiAgICovXG4gIHB1YmxpYyB2YWx1ZXM/KFxuICAgIGNtZDogQ29tbWFuZCxcbiAgICBwYXJlbnQ/OiBDb21tYW5kLFxuICApOiBWYWx1ZXNIYW5kbGVyUmVzdWx0O1xuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHNoZWxsIGNvbXBsZXRpb24gdmFsdWVzLiBJZiBubyBjb21wbGV0ZSBtZXRob2QgaXMgcHJvdmlkZWQsXG4gICAqIHZhbHVlcyBmcm9tIHRoZSB2YWx1ZXMgbWV0aG9kIGFyZSB1c2VkLlxuICAgKi9cbiAgcHVibGljIGNvbXBsZXRlPyhcbiAgICBjbWQ6IENvbW1hbmQsXG4gICAgcGFyZW50PzogQ29tbWFuZCxcbiAgKTogQ29tcGxldGVIYW5kbGVyUmVzdWx0O1xufVxuXG4vLyBkZW5vLWxpbnQtaWdub3JlIG5vLW5hbWVzcGFjZVxuZXhwb3J0IG5hbWVzcGFjZSBUeXBlIHtcbiAgZXhwb3J0IHR5cGUgaW5mZXI8VFR5cGUsIFREZWZhdWx0ID0gVFR5cGU+ID0gVFR5cGUgZXh0ZW5kc1xuICAgIFR5cGVPclR5cGVIYW5kbGVyPGluZmVyIFZhbHVlPiA/IFZhbHVlIDogVERlZmF1bHQ7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBUUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztDQXFCQyxHQUNELE9BQU8sTUFBZTtBQW9CdEIifQ==