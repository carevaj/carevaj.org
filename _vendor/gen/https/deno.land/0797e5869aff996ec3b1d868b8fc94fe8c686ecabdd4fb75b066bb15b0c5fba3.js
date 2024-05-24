// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
import { isWindows } from "./_os.ts";
import { parse as posixParse } from "./posix/parse.ts";
import { parse as windowsParse } from "./windows/parse.ts";
/**
 * Return a `ParsedPath` object of the `path`. Use `format` to reverse the result.
 *
 * @example
 * ```ts
 * import { parse } from "https://deno.land/std@$STD_VERSION/path/mod.ts";
 *
 * const parsedPathObj = parse("/path/to/dir/script.ts");
 * parsedPathObj.root; // "/"
 * parsedPathObj.dir; // "/path/to/dir"
 * parsedPathObj.base; // "script.ts"
 * parsedPathObj.ext; // ".ts"
 * parsedPathObj.name; // "script"
 * ```
 * @param path to process
 */ export function parse(path) {
  return isWindows ? windowsParse(path) : posixParse(path);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjIyMS4wL3BhdGgvcGFyc2UudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgtMjAyNCB0aGUgRGVubyBhdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLiBNSVQgbGljZW5zZS5cbi8vIFRoaXMgbW9kdWxlIGlzIGJyb3dzZXIgY29tcGF0aWJsZS5cblxuaW1wb3J0IHsgaXNXaW5kb3dzIH0gZnJvbSBcIi4vX29zLnRzXCI7XG5pbXBvcnQgdHlwZSB7IFBhcnNlZFBhdGggfSBmcm9tIFwiLi9faW50ZXJmYWNlLnRzXCI7XG5pbXBvcnQgeyBwYXJzZSBhcyBwb3NpeFBhcnNlIH0gZnJvbSBcIi4vcG9zaXgvcGFyc2UudHNcIjtcbmltcG9ydCB7IHBhcnNlIGFzIHdpbmRvd3NQYXJzZSB9IGZyb20gXCIuL3dpbmRvd3MvcGFyc2UudHNcIjtcblxuLyoqXG4gKiBSZXR1cm4gYSBgUGFyc2VkUGF0aGAgb2JqZWN0IG9mIHRoZSBgcGF0aGAuIFVzZSBgZm9ybWF0YCB0byByZXZlcnNlIHRoZSByZXN1bHQuXG4gKlxuICogQGV4YW1wbGVcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyBwYXJzZSB9IGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC9zdGRAJFNURF9WRVJTSU9OL3BhdGgvbW9kLnRzXCI7XG4gKlxuICogY29uc3QgcGFyc2VkUGF0aE9iaiA9IHBhcnNlKFwiL3BhdGgvdG8vZGlyL3NjcmlwdC50c1wiKTtcbiAqIHBhcnNlZFBhdGhPYmoucm9vdDsgLy8gXCIvXCJcbiAqIHBhcnNlZFBhdGhPYmouZGlyOyAvLyBcIi9wYXRoL3RvL2RpclwiXG4gKiBwYXJzZWRQYXRoT2JqLmJhc2U7IC8vIFwic2NyaXB0LnRzXCJcbiAqIHBhcnNlZFBhdGhPYmouZXh0OyAvLyBcIi50c1wiXG4gKiBwYXJzZWRQYXRoT2JqLm5hbWU7IC8vIFwic2NyaXB0XCJcbiAqIGBgYFxuICogQHBhcmFtIHBhdGggdG8gcHJvY2Vzc1xuICovXG5leHBvcnQgZnVuY3Rpb24gcGFyc2UocGF0aDogc3RyaW5nKTogUGFyc2VkUGF0aCB7XG4gIHJldHVybiBpc1dpbmRvd3MgPyB3aW5kb3dzUGFyc2UocGF0aCkgOiBwb3NpeFBhcnNlKHBhdGgpO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLDBFQUEwRTtBQUMxRSxxQ0FBcUM7QUFFckMsU0FBUyxTQUFTLFFBQVEsV0FBVztBQUVyQyxTQUFTLFNBQVMsVUFBVSxRQUFRLG1CQUFtQjtBQUN2RCxTQUFTLFNBQVMsWUFBWSxRQUFRLHFCQUFxQjtBQUUzRDs7Ozs7Ozs7Ozs7Ozs7O0NBZUMsR0FDRCxPQUFPLFNBQVMsTUFBTSxJQUFZO0VBQ2hDLE9BQU8sWUFBWSxhQUFhLFFBQVEsV0FBVztBQUNyRCJ9