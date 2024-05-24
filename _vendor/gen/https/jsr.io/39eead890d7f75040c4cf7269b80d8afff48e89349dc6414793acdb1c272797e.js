// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
import { isWindows } from "./_os.ts";
import { format as posixFormat } from "./posix/format.ts";
import { format as windowsFormat } from "./windows/format.ts";
/**
 * Generate a path from `FormatInputPathObject` object. It does the opposite
 * of `parse`.
 *
 * @param pathObject with path
 */ export function format(pathObject) {
  return isWindows ? windowsFormat(pathObject) : posixFormat(pathObject);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0BzdGQvcGF0aC8wLjIyNS4xL2Zvcm1hdC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDI0IHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuLy8gVGhpcyBtb2R1bGUgaXMgYnJvd3NlciBjb21wYXRpYmxlLlxuXG5pbXBvcnQgeyBpc1dpbmRvd3MgfSBmcm9tIFwiLi9fb3MudHNcIjtcbmltcG9ydCB7IGZvcm1hdCBhcyBwb3NpeEZvcm1hdCB9IGZyb20gXCIuL3Bvc2l4L2Zvcm1hdC50c1wiO1xuaW1wb3J0IHsgZm9ybWF0IGFzIHdpbmRvd3NGb3JtYXQgfSBmcm9tIFwiLi93aW5kb3dzL2Zvcm1hdC50c1wiO1xuaW1wb3J0IHR5cGUgeyBGb3JtYXRJbnB1dFBhdGhPYmplY3QgfSBmcm9tIFwiLi9faW50ZXJmYWNlLnRzXCI7XG5cbi8qKlxuICogR2VuZXJhdGUgYSBwYXRoIGZyb20gYEZvcm1hdElucHV0UGF0aE9iamVjdGAgb2JqZWN0LiBJdCBkb2VzIHRoZSBvcHBvc2l0ZVxuICogb2YgYHBhcnNlYC5cbiAqXG4gKiBAcGFyYW0gcGF0aE9iamVjdCB3aXRoIHBhdGhcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGZvcm1hdChwYXRoT2JqZWN0OiBGb3JtYXRJbnB1dFBhdGhPYmplY3QpOiBzdHJpbmcge1xuICByZXR1cm4gaXNXaW5kb3dzID8gd2luZG93c0Zvcm1hdChwYXRoT2JqZWN0KSA6IHBvc2l4Rm9ybWF0KHBhdGhPYmplY3QpO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLDBFQUEwRTtBQUMxRSxxQ0FBcUM7QUFFckMsU0FBUyxTQUFTLFFBQVEsV0FBVztBQUNyQyxTQUFTLFVBQVUsV0FBVyxRQUFRLG9CQUFvQjtBQUMxRCxTQUFTLFVBQVUsYUFBYSxRQUFRLHNCQUFzQjtBQUc5RDs7Ozs7Q0FLQyxHQUNELE9BQU8sU0FBUyxPQUFPLFVBQWlDO0VBQ3RELE9BQU8sWUFBWSxjQUFjLGNBQWMsWUFBWTtBQUM3RCJ9