// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
import { isWindows } from "./_os.ts";
import { joinGlobs as posixJoinGlobs } from "./posix/join_globs.ts";
import { joinGlobs as windowsJoinGlobs } from "./windows/join_globs.ts";
/** Like join(), but doesn't collapse "**\/.." when `globstar` is true. */ export function joinGlobs(globs, options = {}) {
  return isWindows ? windowsJoinGlobs(globs, options) : posixJoinGlobs(globs, options);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0BzdGQvcGF0aC8wLjIyNS4xL2pvaW5fZ2xvYnMudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgtMjAyNCB0aGUgRGVubyBhdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLiBNSVQgbGljZW5zZS5cbi8vIFRoaXMgbW9kdWxlIGlzIGJyb3dzZXIgY29tcGF0aWJsZS5cblxuaW1wb3J0IHR5cGUgeyBHbG9iT3B0aW9ucyB9IGZyb20gXCIuL19jb21tb24vZ2xvYl90b19yZWdfZXhwLnRzXCI7XG5pbXBvcnQgeyBpc1dpbmRvd3MgfSBmcm9tIFwiLi9fb3MudHNcIjtcbmltcG9ydCB7IGpvaW5HbG9icyBhcyBwb3NpeEpvaW5HbG9icyB9IGZyb20gXCIuL3Bvc2l4L2pvaW5fZ2xvYnMudHNcIjtcbmltcG9ydCB7IGpvaW5HbG9icyBhcyB3aW5kb3dzSm9pbkdsb2JzIH0gZnJvbSBcIi4vd2luZG93cy9qb2luX2dsb2JzLnRzXCI7XG5cbmV4cG9ydCB0eXBlIHsgR2xvYk9wdGlvbnMgfTtcblxuLyoqIExpa2Ugam9pbigpLCBidXQgZG9lc24ndCBjb2xsYXBzZSBcIioqXFwvLi5cIiB3aGVuIGBnbG9ic3RhcmAgaXMgdHJ1ZS4gKi9cbmV4cG9ydCBmdW5jdGlvbiBqb2luR2xvYnMoXG4gIGdsb2JzOiBzdHJpbmdbXSxcbiAgb3B0aW9uczogR2xvYk9wdGlvbnMgPSB7fSxcbik6IHN0cmluZyB7XG4gIHJldHVybiBpc1dpbmRvd3NcbiAgICA/IHdpbmRvd3NKb2luR2xvYnMoZ2xvYnMsIG9wdGlvbnMpXG4gICAgOiBwb3NpeEpvaW5HbG9icyhnbG9icywgb3B0aW9ucyk7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsMEVBQTBFO0FBQzFFLHFDQUFxQztBQUdyQyxTQUFTLFNBQVMsUUFBUSxXQUFXO0FBQ3JDLFNBQVMsYUFBYSxjQUFjLFFBQVEsd0JBQXdCO0FBQ3BFLFNBQVMsYUFBYSxnQkFBZ0IsUUFBUSwwQkFBMEI7QUFJeEUsd0VBQXdFLEdBQ3hFLE9BQU8sU0FBUyxVQUNkLEtBQWUsRUFDZixVQUF1QixDQUFDLENBQUM7RUFFekIsT0FBTyxZQUNILGlCQUFpQixPQUFPLFdBQ3hCLGVBQWUsT0FBTztBQUM1QiJ9