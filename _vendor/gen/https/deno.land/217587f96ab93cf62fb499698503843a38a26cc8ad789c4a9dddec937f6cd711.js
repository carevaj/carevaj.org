// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
import { assertArg } from "../_common/normalize.ts";
import { normalizeString } from "../_common/normalize_string.ts";
import { isPosixPathSeparator } from "./_util.ts";
/**
 * Normalize the `path`, resolving `'..'` and `'.'` segments.
 * Note that resolving these segments does not necessarily mean that all will be eliminated.
 * A `'..'` at the top-level will be preserved, and an empty path is canonically `'.'`.
 * @param path to be normalized
 */ export function normalize(path) {
  assertArg(path);
  const isAbsolute = isPosixPathSeparator(path.charCodeAt(0));
  const trailingSeparator = isPosixPathSeparator(path.charCodeAt(path.length - 1));
  // Normalize the path
  path = normalizeString(path, !isAbsolute, "/", isPosixPathSeparator);
  if (path.length === 0 && !isAbsolute) path = ".";
  if (path.length > 0 && trailingSeparator) path += "/";
  if (isAbsolute) return `/${path}`;
  return path;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjIyMS4wL3BhdGgvcG9zaXgvbm9ybWFsaXplLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjQgdGhlIERlbm8gYXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gTUlUIGxpY2Vuc2UuXG4vLyBUaGlzIG1vZHVsZSBpcyBicm93c2VyIGNvbXBhdGlibGUuXG5cbmltcG9ydCB7IGFzc2VydEFyZyB9IGZyb20gXCIuLi9fY29tbW9uL25vcm1hbGl6ZS50c1wiO1xuaW1wb3J0IHsgbm9ybWFsaXplU3RyaW5nIH0gZnJvbSBcIi4uL19jb21tb24vbm9ybWFsaXplX3N0cmluZy50c1wiO1xuaW1wb3J0IHsgaXNQb3NpeFBhdGhTZXBhcmF0b3IgfSBmcm9tIFwiLi9fdXRpbC50c1wiO1xuXG4vKipcbiAqIE5vcm1hbGl6ZSB0aGUgYHBhdGhgLCByZXNvbHZpbmcgYCcuLidgIGFuZCBgJy4nYCBzZWdtZW50cy5cbiAqIE5vdGUgdGhhdCByZXNvbHZpbmcgdGhlc2Ugc2VnbWVudHMgZG9lcyBub3QgbmVjZXNzYXJpbHkgbWVhbiB0aGF0IGFsbCB3aWxsIGJlIGVsaW1pbmF0ZWQuXG4gKiBBIGAnLi4nYCBhdCB0aGUgdG9wLWxldmVsIHdpbGwgYmUgcHJlc2VydmVkLCBhbmQgYW4gZW1wdHkgcGF0aCBpcyBjYW5vbmljYWxseSBgJy4nYC5cbiAqIEBwYXJhbSBwYXRoIHRvIGJlIG5vcm1hbGl6ZWRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG5vcm1hbGl6ZShwYXRoOiBzdHJpbmcpOiBzdHJpbmcge1xuICBhc3NlcnRBcmcocGF0aCk7XG5cbiAgY29uc3QgaXNBYnNvbHV0ZSA9IGlzUG9zaXhQYXRoU2VwYXJhdG9yKHBhdGguY2hhckNvZGVBdCgwKSk7XG4gIGNvbnN0IHRyYWlsaW5nU2VwYXJhdG9yID0gaXNQb3NpeFBhdGhTZXBhcmF0b3IoXG4gICAgcGF0aC5jaGFyQ29kZUF0KHBhdGgubGVuZ3RoIC0gMSksXG4gICk7XG5cbiAgLy8gTm9ybWFsaXplIHRoZSBwYXRoXG4gIHBhdGggPSBub3JtYWxpemVTdHJpbmcocGF0aCwgIWlzQWJzb2x1dGUsIFwiL1wiLCBpc1Bvc2l4UGF0aFNlcGFyYXRvcik7XG5cbiAgaWYgKHBhdGgubGVuZ3RoID09PSAwICYmICFpc0Fic29sdXRlKSBwYXRoID0gXCIuXCI7XG4gIGlmIChwYXRoLmxlbmd0aCA+IDAgJiYgdHJhaWxpbmdTZXBhcmF0b3IpIHBhdGggKz0gXCIvXCI7XG5cbiAgaWYgKGlzQWJzb2x1dGUpIHJldHVybiBgLyR7cGF0aH1gO1xuICByZXR1cm4gcGF0aDtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSwwRUFBMEU7QUFDMUUscUNBQXFDO0FBRXJDLFNBQVMsU0FBUyxRQUFRLDBCQUEwQjtBQUNwRCxTQUFTLGVBQWUsUUFBUSxpQ0FBaUM7QUFDakUsU0FBUyxvQkFBb0IsUUFBUSxhQUFhO0FBRWxEOzs7OztDQUtDLEdBQ0QsT0FBTyxTQUFTLFVBQVUsSUFBWTtFQUNwQyxVQUFVO0VBRVYsTUFBTSxhQUFhLHFCQUFxQixLQUFLLFVBQVUsQ0FBQztFQUN4RCxNQUFNLG9CQUFvQixxQkFDeEIsS0FBSyxVQUFVLENBQUMsS0FBSyxNQUFNLEdBQUc7RUFHaEMscUJBQXFCO0VBQ3JCLE9BQU8sZ0JBQWdCLE1BQU0sQ0FBQyxZQUFZLEtBQUs7RUFFL0MsSUFBSSxLQUFLLE1BQU0sS0FBSyxLQUFLLENBQUMsWUFBWSxPQUFPO0VBQzdDLElBQUksS0FBSyxNQUFNLEdBQUcsS0FBSyxtQkFBbUIsUUFBUTtFQUVsRCxJQUFJLFlBQVksT0FBTyxDQUFDLENBQUMsRUFBRSxLQUFLLENBQUM7RUFDakMsT0FBTztBQUNUIn0=