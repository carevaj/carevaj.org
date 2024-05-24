import { posix, SEPARATOR } from "../../deps/path.ts";
/**
 * Convert the Windows paths (that use the separator "\")
 * to Posix paths (with the separator "/")
 * and ensure it starts with "/".
 */ export function normalizePath(path, rootToRemove) {
  if (rootToRemove) {
    path = path.replace(rootToRemove, "");
  }
  if (SEPARATOR !== "/") {
    path = path.replaceAll(SEPARATOR, "/");
    // Is absolute Windows path (C:/...)
    if (path.includes(":/")) {
      if (rootToRemove && path.startsWith(rootToRemove)) {
        return posix.join("/", path.replace(rootToRemove, ""));
      }
      return path;
    }
  }
  const absolute = posix.join("/", path);
  return rootToRemove && absolute.startsWith(rootToRemove) ? posix.join("/", absolute.replace(rootToRemove, "")) : absolute;
}
/** Check if the path is an URL */ export function isUrl(path) {
  return !!path.match(/^(https?|file):\/\//);
}
/** Check if the path is absolute */ export function isAbsolutePath(path) {
  return SEPARATOR !== "/" ? /^\w:[\/\\]/.test(path) : path.startsWith("/");
}
/** Replace the extension of a path */ export function replaceExtension(path, ext) {
  return path.replace(/\.\w+$/, ext);
}
/** Split a path to path + extension */ export function getPathAndExtension(path) {
  const extension = getExtension(path);
  const pathWithoutExtension = path.slice(0, -extension.length);
  return [
    pathWithoutExtension,
    extension
  ];
}
/** Get the extension of a path (this works better than std/path) */ export function getExtension(path) {
  const match = path.match(/\.\w+$/);
  return match ? match[0] : "";
}
export function matchExtension(exts, path) {
  if (exts === "*") {
    return true;
  }
  return exts.some((ext)=>path.endsWith(ext));
}
/**
 * Resolve the path of an included file
 * Used in the template engines and processors
 */ export function resolveInclude(path, includesDir, fromDir, rootToRemove) {
  if (isUrl(path)) {
    return path;
  }
  if (path.startsWith(".")) {
    if (!fromDir) {
      throw new Error(`Cannot load "${path}" without a base directory`);
    }
    return normalizePath(posix.join(fromDir, path), rootToRemove);
  }
  const normalized = normalizePath(path, rootToRemove);
  return normalized.startsWith(normalizePath(posix.join(includesDir, "/"))) ? normalized : normalizePath(posix.join(includesDir, normalized));
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvbHVtZUB2Mi4yLjAvY29yZS91dGlscy9wYXRoLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IHBvc2l4LCBTRVBBUkFUT1IgfSBmcm9tIFwiLi4vLi4vZGVwcy9wYXRoLnRzXCI7XG5cbi8qKlxuICogQ29udmVydCB0aGUgV2luZG93cyBwYXRocyAodGhhdCB1c2UgdGhlIHNlcGFyYXRvciBcIlxcXCIpXG4gKiB0byBQb3NpeCBwYXRocyAod2l0aCB0aGUgc2VwYXJhdG9yIFwiL1wiKVxuICogYW5kIGVuc3VyZSBpdCBzdGFydHMgd2l0aCBcIi9cIi5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG5vcm1hbGl6ZVBhdGgocGF0aDogc3RyaW5nLCByb290VG9SZW1vdmU/OiBzdHJpbmcpIHtcbiAgaWYgKHJvb3RUb1JlbW92ZSkge1xuICAgIHBhdGggPSBwYXRoLnJlcGxhY2Uocm9vdFRvUmVtb3ZlLCBcIlwiKTtcbiAgfVxuXG4gIGlmIChTRVBBUkFUT1IgIT09IFwiL1wiKSB7XG4gICAgcGF0aCA9IHBhdGgucmVwbGFjZUFsbChTRVBBUkFUT1IsIFwiL1wiKTtcblxuICAgIC8vIElzIGFic29sdXRlIFdpbmRvd3MgcGF0aCAoQzovLi4uKVxuICAgIGlmIChwYXRoLmluY2x1ZGVzKFwiOi9cIikpIHtcbiAgICAgIGlmIChyb290VG9SZW1vdmUgJiYgcGF0aC5zdGFydHNXaXRoKHJvb3RUb1JlbW92ZSkpIHtcbiAgICAgICAgcmV0dXJuIHBvc2l4LmpvaW4oXCIvXCIsIHBhdGgucmVwbGFjZShyb290VG9SZW1vdmUsIFwiXCIpKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHBhdGg7XG4gICAgfVxuICB9XG5cbiAgY29uc3QgYWJzb2x1dGUgPSBwb3NpeC5qb2luKFwiL1wiLCBwYXRoKTtcbiAgcmV0dXJuIHJvb3RUb1JlbW92ZSAmJiBhYnNvbHV0ZS5zdGFydHNXaXRoKHJvb3RUb1JlbW92ZSlcbiAgICA/IHBvc2l4LmpvaW4oXCIvXCIsIGFic29sdXRlLnJlcGxhY2Uocm9vdFRvUmVtb3ZlLCBcIlwiKSlcbiAgICA6IGFic29sdXRlO1xufVxuXG4vKiogQ2hlY2sgaWYgdGhlIHBhdGggaXMgYW4gVVJMICovXG5leHBvcnQgZnVuY3Rpb24gaXNVcmwocGF0aDogc3RyaW5nKTogYm9vbGVhbiB7XG4gIHJldHVybiAhIXBhdGgubWF0Y2goL14oaHR0cHM/fGZpbGUpOlxcL1xcLy8pO1xufVxuXG4vKiogQ2hlY2sgaWYgdGhlIHBhdGggaXMgYWJzb2x1dGUgKi9cbmV4cG9ydCBmdW5jdGlvbiBpc0Fic29sdXRlUGF0aChwYXRoOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgcmV0dXJuIFNFUEFSQVRPUiAhPT0gXCIvXCIgPyAvXlxcdzpbXFwvXFxcXF0vLnRlc3QocGF0aCkgOiBwYXRoLnN0YXJ0c1dpdGgoXCIvXCIpO1xufVxuXG4vKiogUmVwbGFjZSB0aGUgZXh0ZW5zaW9uIG9mIGEgcGF0aCAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlcGxhY2VFeHRlbnNpb24oXG4gIHBhdGg6IHN0cmluZyxcbiAgZXh0OiBzdHJpbmcsXG4pOiBzdHJpbmcge1xuICByZXR1cm4gcGF0aC5yZXBsYWNlKC9cXC5cXHcrJC8sIGV4dCk7XG59XG5cbi8qKiBTcGxpdCBhIHBhdGggdG8gcGF0aCArIGV4dGVuc2lvbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldFBhdGhBbmRFeHRlbnNpb24ocGF0aDogc3RyaW5nKTogW3N0cmluZywgc3RyaW5nXSB7XG4gIGNvbnN0IGV4dGVuc2lvbiA9IGdldEV4dGVuc2lvbihwYXRoKTtcbiAgY29uc3QgcGF0aFdpdGhvdXRFeHRlbnNpb24gPSBwYXRoLnNsaWNlKDAsIC1leHRlbnNpb24ubGVuZ3RoKTtcbiAgcmV0dXJuIFtwYXRoV2l0aG91dEV4dGVuc2lvbiwgZXh0ZW5zaW9uXTtcbn1cblxuLyoqIEdldCB0aGUgZXh0ZW5zaW9uIG9mIGEgcGF0aCAodGhpcyB3b3JrcyBiZXR0ZXIgdGhhbiBzdGQvcGF0aCkgKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRFeHRlbnNpb24ocGF0aDogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3QgbWF0Y2ggPSBwYXRoLm1hdGNoKC9cXC5cXHcrJC8pO1xuICByZXR1cm4gbWF0Y2ggPyBtYXRjaFswXSA6IFwiXCI7XG59XG5cbmV4cG9ydCB0eXBlIEV4dGVuc2lvbnMgPSBzdHJpbmdbXSB8IFwiKlwiO1xuXG5leHBvcnQgZnVuY3Rpb24gbWF0Y2hFeHRlbnNpb24oZXh0czogRXh0ZW5zaW9ucywgcGF0aDogc3RyaW5nKTogYm9vbGVhbiB7XG4gIGlmIChleHRzID09PSBcIipcIikge1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgcmV0dXJuIGV4dHMuc29tZSgoZXh0KSA9PiBwYXRoLmVuZHNXaXRoKGV4dCkpO1xufVxuXG4vKipcbiAqIFJlc29sdmUgdGhlIHBhdGggb2YgYW4gaW5jbHVkZWQgZmlsZVxuICogVXNlZCBpbiB0aGUgdGVtcGxhdGUgZW5naW5lcyBhbmQgcHJvY2Vzc29yc1xuICovXG5leHBvcnQgZnVuY3Rpb24gcmVzb2x2ZUluY2x1ZGUoXG4gIHBhdGg6IHN0cmluZyxcbiAgaW5jbHVkZXNEaXI6IHN0cmluZyxcbiAgZnJvbURpcj86IHN0cmluZyxcbiAgcm9vdFRvUmVtb3ZlPzogc3RyaW5nLFxuKTogc3RyaW5nIHtcbiAgaWYgKGlzVXJsKHBhdGgpKSB7XG4gICAgcmV0dXJuIHBhdGg7XG4gIH1cblxuICBpZiAocGF0aC5zdGFydHNXaXRoKFwiLlwiKSkge1xuICAgIGlmICghZnJvbURpcikge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBDYW5ub3QgbG9hZCBcIiR7cGF0aH1cIiB3aXRob3V0IGEgYmFzZSBkaXJlY3RvcnlgKTtcbiAgICB9XG5cbiAgICByZXR1cm4gbm9ybWFsaXplUGF0aChwb3NpeC5qb2luKGZyb21EaXIsIHBhdGgpLCByb290VG9SZW1vdmUpO1xuICB9XG5cbiAgY29uc3Qgbm9ybWFsaXplZCA9IG5vcm1hbGl6ZVBhdGgocGF0aCwgcm9vdFRvUmVtb3ZlKTtcblxuICByZXR1cm4gbm9ybWFsaXplZC5zdGFydHNXaXRoKG5vcm1hbGl6ZVBhdGgocG9zaXguam9pbihpbmNsdWRlc0RpciwgXCIvXCIpKSlcbiAgICA/IG5vcm1hbGl6ZWRcbiAgICA6IG5vcm1hbGl6ZVBhdGgocG9zaXguam9pbihpbmNsdWRlc0Rpciwgbm9ybWFsaXplZCkpO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFNBQVMsS0FBSyxFQUFFLFNBQVMsUUFBUSxxQkFBcUI7QUFFdEQ7Ozs7Q0FJQyxHQUNELE9BQU8sU0FBUyxjQUFjLElBQVksRUFBRSxZQUFxQjtFQUMvRCxJQUFJLGNBQWM7SUFDaEIsT0FBTyxLQUFLLE9BQU8sQ0FBQyxjQUFjO0VBQ3BDO0VBRUEsSUFBSSxjQUFjLEtBQUs7SUFDckIsT0FBTyxLQUFLLFVBQVUsQ0FBQyxXQUFXO0lBRWxDLG9DQUFvQztJQUNwQyxJQUFJLEtBQUssUUFBUSxDQUFDLE9BQU87TUFDdkIsSUFBSSxnQkFBZ0IsS0FBSyxVQUFVLENBQUMsZUFBZTtRQUNqRCxPQUFPLE1BQU0sSUFBSSxDQUFDLEtBQUssS0FBSyxPQUFPLENBQUMsY0FBYztNQUNwRDtNQUVBLE9BQU87SUFDVDtFQUNGO0VBRUEsTUFBTSxXQUFXLE1BQU0sSUFBSSxDQUFDLEtBQUs7RUFDakMsT0FBTyxnQkFBZ0IsU0FBUyxVQUFVLENBQUMsZ0JBQ3ZDLE1BQU0sSUFBSSxDQUFDLEtBQUssU0FBUyxPQUFPLENBQUMsY0FBYyxPQUMvQztBQUNOO0FBRUEsZ0NBQWdDLEdBQ2hDLE9BQU8sU0FBUyxNQUFNLElBQVk7RUFDaEMsT0FBTyxDQUFDLENBQUMsS0FBSyxLQUFLLENBQUM7QUFDdEI7QUFFQSxrQ0FBa0MsR0FDbEMsT0FBTyxTQUFTLGVBQWUsSUFBWTtFQUN6QyxPQUFPLGNBQWMsTUFBTSxhQUFhLElBQUksQ0FBQyxRQUFRLEtBQUssVUFBVSxDQUFDO0FBQ3ZFO0FBRUEsb0NBQW9DLEdBQ3BDLE9BQU8sU0FBUyxpQkFDZCxJQUFZLEVBQ1osR0FBVztFQUVYLE9BQU8sS0FBSyxPQUFPLENBQUMsVUFBVTtBQUNoQztBQUVBLHFDQUFxQyxHQUNyQyxPQUFPLFNBQVMsb0JBQW9CLElBQVk7RUFDOUMsTUFBTSxZQUFZLGFBQWE7RUFDL0IsTUFBTSx1QkFBdUIsS0FBSyxLQUFLLENBQUMsR0FBRyxDQUFDLFVBQVUsTUFBTTtFQUM1RCxPQUFPO0lBQUM7SUFBc0I7R0FBVTtBQUMxQztBQUVBLGtFQUFrRSxHQUNsRSxPQUFPLFNBQVMsYUFBYSxJQUFZO0VBQ3ZDLE1BQU0sUUFBUSxLQUFLLEtBQUssQ0FBQztFQUN6QixPQUFPLFFBQVEsS0FBSyxDQUFDLEVBQUUsR0FBRztBQUM1QjtBQUlBLE9BQU8sU0FBUyxlQUFlLElBQWdCLEVBQUUsSUFBWTtFQUMzRCxJQUFJLFNBQVMsS0FBSztJQUNoQixPQUFPO0VBQ1Q7RUFFQSxPQUFPLEtBQUssSUFBSSxDQUFDLENBQUMsTUFBUSxLQUFLLFFBQVEsQ0FBQztBQUMxQztBQUVBOzs7Q0FHQyxHQUNELE9BQU8sU0FBUyxlQUNkLElBQVksRUFDWixXQUFtQixFQUNuQixPQUFnQixFQUNoQixZQUFxQjtFQUVyQixJQUFJLE1BQU0sT0FBTztJQUNmLE9BQU87RUFDVDtFQUVBLElBQUksS0FBSyxVQUFVLENBQUMsTUFBTTtJQUN4QixJQUFJLENBQUMsU0FBUztNQUNaLE1BQU0sSUFBSSxNQUFNLENBQUMsYUFBYSxFQUFFLEtBQUssMEJBQTBCLENBQUM7SUFDbEU7SUFFQSxPQUFPLGNBQWMsTUFBTSxJQUFJLENBQUMsU0FBUyxPQUFPO0VBQ2xEO0VBRUEsTUFBTSxhQUFhLGNBQWMsTUFBTTtFQUV2QyxPQUFPLFdBQVcsVUFBVSxDQUFDLGNBQWMsTUFBTSxJQUFJLENBQUMsYUFBYSxTQUMvRCxhQUNBLGNBQWMsTUFBTSxJQUFJLENBQUMsYUFBYTtBQUM1QyJ9