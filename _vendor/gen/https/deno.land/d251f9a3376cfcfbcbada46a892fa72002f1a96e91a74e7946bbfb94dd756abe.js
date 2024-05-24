// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
// Copyright the Browserify authors. MIT License.
// Ported from https://github.com/browserify/path-browserify/
// This module is browser compatible.
import { CHAR_BACKWARD_SLASH, CHAR_DOT, CHAR_FORWARD_SLASH, CHAR_LOWERCASE_A, CHAR_LOWERCASE_Z, CHAR_UPPERCASE_A, CHAR_UPPERCASE_Z } from "./_constants.ts";
export function assertPath(path) {
  if (typeof path !== "string") {
    throw new TypeError(`Path must be a string. Received ${JSON.stringify(path)}`);
  }
}
export function isPosixPathSeparator(code) {
  return code === CHAR_FORWARD_SLASH;
}
export function isPathSeparator(code) {
  return isPosixPathSeparator(code) || code === CHAR_BACKWARD_SLASH;
}
export function isWindowsDeviceRoot(code) {
  return code >= CHAR_LOWERCASE_A && code <= CHAR_LOWERCASE_Z || code >= CHAR_UPPERCASE_A && code <= CHAR_UPPERCASE_Z;
}
// Resolves . and .. elements in a path with directory names
export function normalizeString(path, allowAboveRoot, separator, isPathSeparator) {
  let res = "";
  let lastSegmentLength = 0;
  let lastSlash = -1;
  let dots = 0;
  let code;
  for(let i = 0, len = path.length; i <= len; ++i){
    if (i < len) code = path.charCodeAt(i);
    else if (isPathSeparator(code)) break;
    else code = CHAR_FORWARD_SLASH;
    if (isPathSeparator(code)) {
      if (lastSlash === i - 1 || dots === 1) {
      // NOOP
      } else if (lastSlash !== i - 1 && dots === 2) {
        if (res.length < 2 || lastSegmentLength !== 2 || res.charCodeAt(res.length - 1) !== CHAR_DOT || res.charCodeAt(res.length - 2) !== CHAR_DOT) {
          if (res.length > 2) {
            const lastSlashIndex = res.lastIndexOf(separator);
            if (lastSlashIndex === -1) {
              res = "";
              lastSegmentLength = 0;
            } else {
              res = res.slice(0, lastSlashIndex);
              lastSegmentLength = res.length - 1 - res.lastIndexOf(separator);
            }
            lastSlash = i;
            dots = 0;
            continue;
          } else if (res.length === 2 || res.length === 1) {
            res = "";
            lastSegmentLength = 0;
            lastSlash = i;
            dots = 0;
            continue;
          }
        }
        if (allowAboveRoot) {
          if (res.length > 0) res += `${separator}..`;
          else res = "..";
          lastSegmentLength = 2;
        }
      } else {
        if (res.length > 0) res += separator + path.slice(lastSlash + 1, i);
        else res = path.slice(lastSlash + 1, i);
        lastSegmentLength = i - lastSlash - 1;
      }
      lastSlash = i;
      dots = 0;
    } else if (code === CHAR_DOT && dots !== -1) {
      ++dots;
    } else {
      dots = -1;
    }
  }
  return res;
}
export function _format(sep, pathObject) {
  const dir = pathObject.dir || pathObject.root;
  const base = pathObject.base || (pathObject.name || "") + (pathObject.ext || "");
  if (!dir) return base;
  if (dir === pathObject.root) return dir + base;
  return dir + sep + base;
}
const WHITESPACE_ENCODINGS = {
  "\u0009": "%09",
  "\u000A": "%0A",
  "\u000B": "%0B",
  "\u000C": "%0C",
  "\u000D": "%0D",
  "\u0020": "%20"
};
export function encodeWhitespace(string) {
  return string.replaceAll(/[\s]/g, (c)=>{
    return WHITESPACE_ENCODINGS[c] ?? c;
  });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE3MC4wL3BhdGgvX3V0aWwudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgtMjAyMiB0aGUgRGVubyBhdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLiBNSVQgbGljZW5zZS5cbi8vIENvcHlyaWdodCB0aGUgQnJvd3NlcmlmeSBhdXRob3JzLiBNSVQgTGljZW5zZS5cbi8vIFBvcnRlZCBmcm9tIGh0dHBzOi8vZ2l0aHViLmNvbS9icm93c2VyaWZ5L3BhdGgtYnJvd3NlcmlmeS9cbi8vIFRoaXMgbW9kdWxlIGlzIGJyb3dzZXIgY29tcGF0aWJsZS5cblxuaW1wb3J0IHR5cGUgeyBGb3JtYXRJbnB1dFBhdGhPYmplY3QgfSBmcm9tIFwiLi9faW50ZXJmYWNlLnRzXCI7XG5pbXBvcnQge1xuICBDSEFSX0JBQ0tXQVJEX1NMQVNILFxuICBDSEFSX0RPVCxcbiAgQ0hBUl9GT1JXQVJEX1NMQVNILFxuICBDSEFSX0xPV0VSQ0FTRV9BLFxuICBDSEFSX0xPV0VSQ0FTRV9aLFxuICBDSEFSX1VQUEVSQ0FTRV9BLFxuICBDSEFSX1VQUEVSQ0FTRV9aLFxufSBmcm9tIFwiLi9fY29uc3RhbnRzLnRzXCI7XG5cbmV4cG9ydCBmdW5jdGlvbiBhc3NlcnRQYXRoKHBhdGg6IHN0cmluZykge1xuICBpZiAodHlwZW9mIHBhdGggIT09IFwic3RyaW5nXCIpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFxuICAgICAgYFBhdGggbXVzdCBiZSBhIHN0cmluZy4gUmVjZWl2ZWQgJHtKU09OLnN0cmluZ2lmeShwYXRoKX1gLFxuICAgICk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzUG9zaXhQYXRoU2VwYXJhdG9yKGNvZGU6IG51bWJlcik6IGJvb2xlYW4ge1xuICByZXR1cm4gY29kZSA9PT0gQ0hBUl9GT1JXQVJEX1NMQVNIO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNQYXRoU2VwYXJhdG9yKGNvZGU6IG51bWJlcik6IGJvb2xlYW4ge1xuICByZXR1cm4gaXNQb3NpeFBhdGhTZXBhcmF0b3IoY29kZSkgfHwgY29kZSA9PT0gQ0hBUl9CQUNLV0FSRF9TTEFTSDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzV2luZG93c0RldmljZVJvb3QoY29kZTogbnVtYmVyKTogYm9vbGVhbiB7XG4gIHJldHVybiAoXG4gICAgKGNvZGUgPj0gQ0hBUl9MT1dFUkNBU0VfQSAmJiBjb2RlIDw9IENIQVJfTE9XRVJDQVNFX1opIHx8XG4gICAgKGNvZGUgPj0gQ0hBUl9VUFBFUkNBU0VfQSAmJiBjb2RlIDw9IENIQVJfVVBQRVJDQVNFX1opXG4gICk7XG59XG5cbi8vIFJlc29sdmVzIC4gYW5kIC4uIGVsZW1lbnRzIGluIGEgcGF0aCB3aXRoIGRpcmVjdG9yeSBuYW1lc1xuZXhwb3J0IGZ1bmN0aW9uIG5vcm1hbGl6ZVN0cmluZyhcbiAgcGF0aDogc3RyaW5nLFxuICBhbGxvd0Fib3ZlUm9vdDogYm9vbGVhbixcbiAgc2VwYXJhdG9yOiBzdHJpbmcsXG4gIGlzUGF0aFNlcGFyYXRvcjogKGNvZGU6IG51bWJlcikgPT4gYm9vbGVhbixcbik6IHN0cmluZyB7XG4gIGxldCByZXMgPSBcIlwiO1xuICBsZXQgbGFzdFNlZ21lbnRMZW5ndGggPSAwO1xuICBsZXQgbGFzdFNsYXNoID0gLTE7XG4gIGxldCBkb3RzID0gMDtcbiAgbGV0IGNvZGU6IG51bWJlciB8IHVuZGVmaW5lZDtcbiAgZm9yIChsZXQgaSA9IDAsIGxlbiA9IHBhdGgubGVuZ3RoOyBpIDw9IGxlbjsgKytpKSB7XG4gICAgaWYgKGkgPCBsZW4pIGNvZGUgPSBwYXRoLmNoYXJDb2RlQXQoaSk7XG4gICAgZWxzZSBpZiAoaXNQYXRoU2VwYXJhdG9yKGNvZGUhKSkgYnJlYWs7XG4gICAgZWxzZSBjb2RlID0gQ0hBUl9GT1JXQVJEX1NMQVNIO1xuXG4gICAgaWYgKGlzUGF0aFNlcGFyYXRvcihjb2RlISkpIHtcbiAgICAgIGlmIChsYXN0U2xhc2ggPT09IGkgLSAxIHx8IGRvdHMgPT09IDEpIHtcbiAgICAgICAgLy8gTk9PUFxuICAgICAgfSBlbHNlIGlmIChsYXN0U2xhc2ggIT09IGkgLSAxICYmIGRvdHMgPT09IDIpIHtcbiAgICAgICAgaWYgKFxuICAgICAgICAgIHJlcy5sZW5ndGggPCAyIHx8XG4gICAgICAgICAgbGFzdFNlZ21lbnRMZW5ndGggIT09IDIgfHxcbiAgICAgICAgICByZXMuY2hhckNvZGVBdChyZXMubGVuZ3RoIC0gMSkgIT09IENIQVJfRE9UIHx8XG4gICAgICAgICAgcmVzLmNoYXJDb2RlQXQocmVzLmxlbmd0aCAtIDIpICE9PSBDSEFSX0RPVFxuICAgICAgICApIHtcbiAgICAgICAgICBpZiAocmVzLmxlbmd0aCA+IDIpIHtcbiAgICAgICAgICAgIGNvbnN0IGxhc3RTbGFzaEluZGV4ID0gcmVzLmxhc3RJbmRleE9mKHNlcGFyYXRvcik7XG4gICAgICAgICAgICBpZiAobGFzdFNsYXNoSW5kZXggPT09IC0xKSB7XG4gICAgICAgICAgICAgIHJlcyA9IFwiXCI7XG4gICAgICAgICAgICAgIGxhc3RTZWdtZW50TGVuZ3RoID0gMDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHJlcyA9IHJlcy5zbGljZSgwLCBsYXN0U2xhc2hJbmRleCk7XG4gICAgICAgICAgICAgIGxhc3RTZWdtZW50TGVuZ3RoID0gcmVzLmxlbmd0aCAtIDEgLSByZXMubGFzdEluZGV4T2Yoc2VwYXJhdG9yKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGxhc3RTbGFzaCA9IGk7XG4gICAgICAgICAgICBkb3RzID0gMDtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgIH0gZWxzZSBpZiAocmVzLmxlbmd0aCA9PT0gMiB8fCByZXMubGVuZ3RoID09PSAxKSB7XG4gICAgICAgICAgICByZXMgPSBcIlwiO1xuICAgICAgICAgICAgbGFzdFNlZ21lbnRMZW5ndGggPSAwO1xuICAgICAgICAgICAgbGFzdFNsYXNoID0gaTtcbiAgICAgICAgICAgIGRvdHMgPSAwO1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChhbGxvd0Fib3ZlUm9vdCkge1xuICAgICAgICAgIGlmIChyZXMubGVuZ3RoID4gMCkgcmVzICs9IGAke3NlcGFyYXRvcn0uLmA7XG4gICAgICAgICAgZWxzZSByZXMgPSBcIi4uXCI7XG4gICAgICAgICAgbGFzdFNlZ21lbnRMZW5ndGggPSAyO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAocmVzLmxlbmd0aCA+IDApIHJlcyArPSBzZXBhcmF0b3IgKyBwYXRoLnNsaWNlKGxhc3RTbGFzaCArIDEsIGkpO1xuICAgICAgICBlbHNlIHJlcyA9IHBhdGguc2xpY2UobGFzdFNsYXNoICsgMSwgaSk7XG4gICAgICAgIGxhc3RTZWdtZW50TGVuZ3RoID0gaSAtIGxhc3RTbGFzaCAtIDE7XG4gICAgICB9XG4gICAgICBsYXN0U2xhc2ggPSBpO1xuICAgICAgZG90cyA9IDA7XG4gICAgfSBlbHNlIGlmIChjb2RlID09PSBDSEFSX0RPVCAmJiBkb3RzICE9PSAtMSkge1xuICAgICAgKytkb3RzO1xuICAgIH0gZWxzZSB7XG4gICAgICBkb3RzID0gLTE7XG4gICAgfVxuICB9XG4gIHJldHVybiByZXM7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBfZm9ybWF0KFxuICBzZXA6IHN0cmluZyxcbiAgcGF0aE9iamVjdDogRm9ybWF0SW5wdXRQYXRoT2JqZWN0LFxuKTogc3RyaW5nIHtcbiAgY29uc3QgZGlyOiBzdHJpbmcgfCB1bmRlZmluZWQgPSBwYXRoT2JqZWN0LmRpciB8fCBwYXRoT2JqZWN0LnJvb3Q7XG4gIGNvbnN0IGJhc2U6IHN0cmluZyA9IHBhdGhPYmplY3QuYmFzZSB8fFxuICAgIChwYXRoT2JqZWN0Lm5hbWUgfHwgXCJcIikgKyAocGF0aE9iamVjdC5leHQgfHwgXCJcIik7XG4gIGlmICghZGlyKSByZXR1cm4gYmFzZTtcbiAgaWYgKGRpciA9PT0gcGF0aE9iamVjdC5yb290KSByZXR1cm4gZGlyICsgYmFzZTtcbiAgcmV0dXJuIGRpciArIHNlcCArIGJhc2U7XG59XG5cbmNvbnN0IFdISVRFU1BBQ0VfRU5DT0RJTkdTOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0ge1xuICBcIlxcdTAwMDlcIjogXCIlMDlcIixcbiAgXCJcXHUwMDBBXCI6IFwiJTBBXCIsXG4gIFwiXFx1MDAwQlwiOiBcIiUwQlwiLFxuICBcIlxcdTAwMENcIjogXCIlMENcIixcbiAgXCJcXHUwMDBEXCI6IFwiJTBEXCIsXG4gIFwiXFx1MDAyMFwiOiBcIiUyMFwiLFxufTtcblxuZXhwb3J0IGZ1bmN0aW9uIGVuY29kZVdoaXRlc3BhY2Uoc3RyaW5nOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gc3RyaW5nLnJlcGxhY2VBbGwoL1tcXHNdL2csIChjKSA9PiB7XG4gICAgcmV0dXJuIFdISVRFU1BBQ0VfRU5DT0RJTkdTW2NdID8/IGM7XG4gIH0pO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLDBFQUEwRTtBQUMxRSxpREFBaUQ7QUFDakQsNkRBQTZEO0FBQzdELHFDQUFxQztBQUdyQyxTQUNFLG1CQUFtQixFQUNuQixRQUFRLEVBQ1Isa0JBQWtCLEVBQ2xCLGdCQUFnQixFQUNoQixnQkFBZ0IsRUFDaEIsZ0JBQWdCLEVBQ2hCLGdCQUFnQixRQUNYLGtCQUFrQjtBQUV6QixPQUFPLFNBQVMsV0FBVyxJQUFZO0VBQ3JDLElBQUksT0FBTyxTQUFTLFVBQVU7SUFDNUIsTUFBTSxJQUFJLFVBQ1IsQ0FBQyxnQ0FBZ0MsRUFBRSxLQUFLLFNBQVMsQ0FBQyxNQUFNLENBQUM7RUFFN0Q7QUFDRjtBQUVBLE9BQU8sU0FBUyxxQkFBcUIsSUFBWTtFQUMvQyxPQUFPLFNBQVM7QUFDbEI7QUFFQSxPQUFPLFNBQVMsZ0JBQWdCLElBQVk7RUFDMUMsT0FBTyxxQkFBcUIsU0FBUyxTQUFTO0FBQ2hEO0FBRUEsT0FBTyxTQUFTLG9CQUFvQixJQUFZO0VBQzlDLE9B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