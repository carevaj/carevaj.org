// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// Copyright the Browserify authors. MIT License.
// Ported mostly from https://github.com/browserify/path-browserify/
// This module is browser compatible.
/**
 * Utilities for working with OS-specific file paths.
 *
 * Functions from this module will automatically switch to support the path style
 * of the current OS, either `windows` for Microsoft Windows, or `posix` for
 * every other operating system, eg. Linux, MacOS, BSD etc.
 *
 * To use functions for a specific path style regardless of the current OS
 * import the modules from the platform sub directory instead.
 *
 * Example, for `posix`:
 *
 * ```ts
 * import { fromFileUrl } from "https://deno.land/std@$STD_VERSION/path/posix/from_file_url.ts";
 * const p = fromFileUrl("file:///home/foo");
 * console.log(p); // "/home/foo"
 * ```
 *
 * or, for `windows`:
 *
 * ```ts
 * import { fromFileUrl } from "https://deno.land/std@$STD_VERSION/path/windows/from_file_url.ts";
 * const p = fromFileUrl("file:///home/foo");
 * console.log(p); // "\\home\\foo"
 * ```
 *
 * This module is browser compatible.
 *
 * @module
 */ import * as _windows from "./windows/mod.ts";
import * as _posix from "./posix/mod.ts";
/** @deprecated (will be removed after 1.0.0) Import from {@link https://deno.land/std/path/windows/mod.ts} instead. */ export const win32 = _windows;
/** @deprecated (will be removed after 1.0.0) Import from {@link https://deno.land/std/path/posix/mod.ts} instead. */ export const posix = _posix;
export * from "./basename.ts";
export * from "./constants.ts";
export * from "./dirname.ts";
export * from "./extname.ts";
export * from "./format.ts";
export * from "./from_file_url.ts";
export * from "./is_absolute.ts";
export * from "./join.ts";
export * from "./normalize.ts";
export * from "./parse.ts";
export * from "./relative.ts";
export * from "./resolve.ts";
export * from "./to_file_url.ts";
export * from "./to_namespaced_path.ts";
export * from "./common.ts";
export * from "./_interface.ts";
export * from "./glob_to_regexp.ts";
export * from "./is_glob.ts";
export * from "./join_globs.ts";
export * from "./normalize_glob.ts";
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjIyMS4wL3BhdGgvbW9kLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjQgdGhlIERlbm8gYXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gTUlUIGxpY2Vuc2UuXG4vLyBDb3B5cmlnaHQgdGhlIEJyb3dzZXJpZnkgYXV0aG9ycy4gTUlUIExpY2Vuc2UuXG4vLyBQb3J0ZWQgbW9zdGx5IGZyb20gaHR0cHM6Ly9naXRodWIuY29tL2Jyb3dzZXJpZnkvcGF0aC1icm93c2VyaWZ5L1xuLy8gVGhpcyBtb2R1bGUgaXMgYnJvd3NlciBjb21wYXRpYmxlLlxuXG4vKipcbiAqIFV0aWxpdGllcyBmb3Igd29ya2luZyB3aXRoIE9TLXNwZWNpZmljIGZpbGUgcGF0aHMuXG4gKlxuICogRnVuY3Rpb25zIGZyb20gdGhpcyBtb2R1bGUgd2lsbCBhdXRvbWF0aWNhbGx5IHN3aXRjaCB0byBzdXBwb3J0IHRoZSBwYXRoIHN0eWxlXG4gKiBvZiB0aGUgY3VycmVudCBPUywgZWl0aGVyIGB3aW5kb3dzYCBmb3IgTWljcm9zb2Z0IFdpbmRvd3MsIG9yIGBwb3NpeGAgZm9yXG4gKiBldmVyeSBvdGhlciBvcGVyYXRpbmcgc3lzdGVtLCBlZy4gTGludXgsIE1hY09TLCBCU0QgZXRjLlxuICpcbiAqIFRvIHVzZSBmdW5jdGlvbnMgZm9yIGEgc3BlY2lmaWMgcGF0aCBzdHlsZSByZWdhcmRsZXNzIG9mIHRoZSBjdXJyZW50IE9TXG4gKiBpbXBvcnQgdGhlIG1vZHVsZXMgZnJvbSB0aGUgcGxhdGZvcm0gc3ViIGRpcmVjdG9yeSBpbnN0ZWFkLlxuICpcbiAqIEV4YW1wbGUsIGZvciBgcG9zaXhgOlxuICpcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyBmcm9tRmlsZVVybCB9IGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC9zdGRAJFNURF9WRVJTSU9OL3BhdGgvcG9zaXgvZnJvbV9maWxlX3VybC50c1wiO1xuICogY29uc3QgcCA9IGZyb21GaWxlVXJsKFwiZmlsZTovLy9ob21lL2Zvb1wiKTtcbiAqIGNvbnNvbGUubG9nKHApOyAvLyBcIi9ob21lL2Zvb1wiXG4gKiBgYGBcbiAqXG4gKiBvciwgZm9yIGB3aW5kb3dzYDpcbiAqXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgZnJvbUZpbGVVcmwgfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQCRTVERfVkVSU0lPTi9wYXRoL3dpbmRvd3MvZnJvbV9maWxlX3VybC50c1wiO1xuICogY29uc3QgcCA9IGZyb21GaWxlVXJsKFwiZmlsZTovLy9ob21lL2Zvb1wiKTtcbiAqIGNvbnNvbGUubG9nKHApOyAvLyBcIlxcXFxob21lXFxcXGZvb1wiXG4gKiBgYGBcbiAqXG4gKiBUaGlzIG1vZHVsZSBpcyBicm93c2VyIGNvbXBhdGlibGUuXG4gKlxuICogQG1vZHVsZVxuICovXG5cbmltcG9ydCAqIGFzIF93aW5kb3dzIGZyb20gXCIuL3dpbmRvd3MvbW9kLnRzXCI7XG5pbXBvcnQgKiBhcyBfcG9zaXggZnJvbSBcIi4vcG9zaXgvbW9kLnRzXCI7XG5cbi8qKiBAZGVwcmVjYXRlZCAod2lsbCBiZSByZW1vdmVkIGFmdGVyIDEuMC4wKSBJbXBvcnQgZnJvbSB7QGxpbmsgaHR0cHM6Ly9kZW5vLmxhbmQvc3RkL3BhdGgvd2luZG93cy9tb2QudHN9IGluc3RlYWQuICovXG5leHBvcnQgY29uc3Qgd2luMzI6IHR5cGVvZiBfd2luZG93cyA9IF93aW5kb3dzO1xuXG4vKiogQGRlcHJlY2F0ZWQgKHdpbGwgYmUgcmVtb3ZlZCBhZnRlciAxLjAuMCkgSW1wb3J0IGZyb20ge0BsaW5rIGh0dHBzOi8vZGVuby5sYW5kL3N0ZC9wYXRoL3Bvc2l4L21vZC50c30gaW5zdGVhZC4gKi9cbmV4cG9ydCBjb25zdCBwb3NpeDogdHlwZW9mIF9wb3NpeCA9IF9wb3NpeDtcblxuZXhwb3J0ICogZnJvbSBcIi4vYmFzZW5hbWUudHNcIjtcbmV4cG9ydCAqIGZyb20gXCIuL2NvbnN0YW50cy50c1wiO1xuZXhwb3J0ICogZnJvbSBcIi4vZGlybmFtZS50c1wiO1xuZXhwb3J0ICogZnJvbSBcIi4vZXh0bmFtZS50c1wiO1xuZXhwb3J0ICogZnJvbSBcIi4vZm9ybWF0LnRzXCI7XG5leHBvcnQgKiBmcm9tIFwiLi9mcm9tX2ZpbGVfdXJsLnRzXCI7XG5leHBvcnQgKiBmcm9tIFwiLi9pc19hYnNvbHV0ZS50c1wiO1xuZXhwb3J0ICogZnJvbSBcIi4vam9pbi50c1wiO1xuZXhwb3J0ICogZnJvbSBcIi4vbm9ybWFsaXplLnRzXCI7XG5leHBvcnQgKiBmcm9tIFwiLi9wYXJzZS50c1wiO1xuZXhwb3J0ICogZnJvbSBcIi4vcmVsYXRpdmUudHNcIjtcbmV4cG9ydCAqIGZyb20gXCIuL3Jlc29sdmUudHNcIjtcbmV4cG9ydCAqIGZyb20gXCIuL3RvX2ZpbGVfdXJsLnRzXCI7XG5leHBvcnQgKiBmcm9tIFwiLi90b19uYW1lc3BhY2VkX3BhdGgudHNcIjtcbmV4cG9ydCAqIGZyb20gXCIuL2NvbW1vbi50c1wiO1xuZXhwb3J0ICogZnJvbSBcIi4vX2ludGVyZmFjZS50c1wiO1xuZXhwb3J0ICogZnJvbSBcIi4vZ2xvYl90b19yZWdleHAudHNcIjtcbmV4cG9ydCAqIGZyb20gXCIuL2lzX2dsb2IudHNcIjtcbmV4cG9ydCAqIGZyb20gXCIuL2pvaW5fZ2xvYnMudHNcIjtcbmV4cG9ydCAqIGZyb20gXCIuL25vcm1hbGl6ZV9nbG9iLnRzXCI7XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsMEVBQTBFO0FBQzFFLGlEQUFpRDtBQUNqRCxvRUFBb0U7QUFDcEUscUNBQXFDO0FBRXJDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztDQTZCQyxHQUVELFlBQVksY0FBYyxtQkFBbUI7QUFDN0MsWUFBWSxZQUFZLGlCQUFpQjtBQUV6QyxxSEFBcUgsR0FDckgsT0FBTyxNQUFNLFFBQXlCLFNBQVM7QUFFL0MsbUhBQW1ILEdBQ25ILE9BQU8sTUFBTSxRQUF1QixPQUFPO0FBRTNDLGNBQWMsZ0JBQWdCO0FBQzlCLGNBQWMsaUJBQWlCO0FBQy9CLGNBQWMsZUFBZTtBQUM3QixjQUFjLGVBQWU7QUFDN0IsY0FBYyxjQUFjO0FBQzVCLGNBQWMscUJBQXFCO0FBQ25DLGNBQWMsbUJBQW1CO0FBQ2pDLGNBQWMsWUFBWTtBQUMxQixjQUFjLGlCQUFpQjtBQUMvQixjQUFjLGFBQWE7QUFDM0IsY0FBYyxnQkFBZ0I7QUFDOUIsY0FBYyxlQUFlO0FBQzdCLGNBQWMsbUJBQW1CO0FBQ2pDLGNBQWMsMEJBQTBCO0FBQ3hDLGNBQWMsY0FBYztBQUM1QixjQUFjLGtCQUFrQjtBQUNoQyxjQUFjLHNCQUFzQjtBQUNwQyxjQUFjLGVBQWU7QUFDN0IsY0FBYyxrQkFBa0I7QUFDaEMsY0FBYyxzQkFBc0IifQ==