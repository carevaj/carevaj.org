// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
import { isWindows } from "./_os.ts";
import { join as posixJoin } from "./posix/join.ts";
import { join as windowsJoin } from "./windows/join.ts";
/**
 * Join all given a sequence of `paths`,then normalizes the resulting path.
 * @param paths to be joined and normalized
 */ export function join(...paths) {
  return isWindows ? windowsJoin(...paths) : posixJoin(...paths);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0BzdGQvcGF0aC8wLjIyNS4xL2pvaW4udHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgtMjAyNCB0aGUgRGVubyBhdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLiBNSVQgbGljZW5zZS5cbi8vIFRoaXMgbW9kdWxlIGlzIGJyb3dzZXIgY29tcGF0aWJsZS5cblxuaW1wb3J0IHsgaXNXaW5kb3dzIH0gZnJvbSBcIi4vX29zLnRzXCI7XG5pbXBvcnQgeyBqb2luIGFzIHBvc2l4Sm9pbiB9IGZyb20gXCIuL3Bvc2l4L2pvaW4udHNcIjtcbmltcG9ydCB7IGpvaW4gYXMgd2luZG93c0pvaW4gfSBmcm9tIFwiLi93aW5kb3dzL2pvaW4udHNcIjtcblxuLyoqXG4gKiBKb2luIGFsbCBnaXZlbiBhIHNlcXVlbmNlIG9mIGBwYXRoc2AsdGhlbiBub3JtYWxpemVzIHRoZSByZXN1bHRpbmcgcGF0aC5cbiAqIEBwYXJhbSBwYXRocyB0byBiZSBqb2luZWQgYW5kIG5vcm1hbGl6ZWRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGpvaW4oLi4ucGF0aHM6IHN0cmluZ1tdKTogc3RyaW5nIHtcbiAgcmV0dXJuIGlzV2luZG93cyA/IHdpbmRvd3NKb2luKC4uLnBhdGhzKSA6IHBvc2l4Sm9pbiguLi5wYXRocyk7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsMEVBQTBFO0FBQzFFLHFDQUFxQztBQUVyQyxTQUFTLFNBQVMsUUFBUSxXQUFXO0FBQ3JDLFNBQVMsUUFBUSxTQUFTLFFBQVEsa0JBQWtCO0FBQ3BELFNBQVMsUUFBUSxXQUFXLFFBQVEsb0JBQW9CO0FBRXhEOzs7Q0FHQyxHQUNELE9BQU8sU0FBUyxLQUFLLEdBQUcsS0FBZTtFQUNyQyxPQUFPLFlBQVksZUFBZSxTQUFTLGFBQWE7QUFDMUQifQ==