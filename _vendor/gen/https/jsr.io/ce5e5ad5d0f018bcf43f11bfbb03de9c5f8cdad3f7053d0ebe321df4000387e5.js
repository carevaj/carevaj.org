// Copyright 2009 The Go Authors. All rights reserved.
// https://github.com/golang/go/blob/master/LICENSE
// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
/**
 * Port of the Go
 * {@link https://github.com/golang/go/blob/go1.12.5/src/encoding/hex/hex.go | encoding/hex}
 * library.
 *
 * This module is browser compatible.
 *
 * ```ts
 * import {
 *   decodeHex,
 *   encodeHex,
 * } from "@std/encoding/hex";
 *
 * const encoded = encodeHex("abc"); // "616263"
 *
 * decodeHex(encoded); // Uint8Array(3) [ 97, 98, 99 ]
 * ```
 *
 * @module
 */ import { validateBinaryLike } from "./_util.ts";
const hexTable = new TextEncoder().encode("0123456789abcdef");
const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();
function errInvalidByte(byte) {
  return new TypeError(`Invalid byte '${String.fromCharCode(byte)}'`);
}
function errLength() {
  return new RangeError("Odd length hex string");
}
/** Converts a hex character into its value. */ function fromHexChar(byte) {
  // '0' <= byte && byte <= '9'
  if (48 <= byte && byte <= 57) return byte - 48;
  // 'a' <= byte && byte <= 'f'
  if (97 <= byte && byte <= 102) return byte - 97 + 10;
  // 'A' <= byte && byte <= 'F'
  if (65 <= byte && byte <= 70) return byte - 65 + 10;
  throw errInvalidByte(byte);
}
/**
 * Converts data into a hex-encoded string.
 *
 * @example
 * ```ts
 * import { encodeHex } from "@std/encoding/hex";
 *
 * encodeHex("abc"); // "616263"
 * ```
 */ export function encodeHex(src) {
  const u8 = validateBinaryLike(src);
  const dst = new Uint8Array(u8.length * 2);
  for(let i = 0; i < dst.length; i++){
    const v = u8[i];
    dst[i * 2] = hexTable[v >> 4];
    dst[i * 2 + 1] = hexTable[v & 0x0f];
  }
  return textDecoder.decode(dst);
}
/**
 * Decodes the given hex-encoded string. If the input is malformed, an error is
 * thrown.
 *
 * @example
 * ```ts
 * import { decodeHex } from "@std/encoding/hex";
 *
 * decodeHex("616263"); // Uint8Array(3) [ 97, 98, 99 ]
 * ```
 */ export function decodeHex(src) {
  const u8 = textEncoder.encode(src);
  const dst = new Uint8Array(u8.length / 2);
  for(let i = 0; i < dst.length; i++){
    const a = fromHexChar(u8[i * 2]);
    const b = fromHexChar(u8[i * 2 + 1]);
    dst[i] = a << 4 | b;
  }
  if (u8.length % 2 === 1) {
    // Check for invalid char before reporting bad length,
    // since the invalid char (if present) is an earlier problem.
    fromHexChar(u8[dst.length * 2]);
    throw errLength();
  }
  return dst;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0BzdGQvZW5jb2RpbmcvMC4yMjQuMS9oZXgudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMDkgVGhlIEdvIEF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4vLyBodHRwczovL2dpdGh1Yi5jb20vZ29sYW5nL2dvL2Jsb2IvbWFzdGVyL0xJQ0VOU0Vcbi8vIENvcHlyaWdodCAyMDE4LTIwMjQgdGhlIERlbm8gYXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gTUlUIGxpY2Vuc2UuXG4vLyBUaGlzIG1vZHVsZSBpcyBicm93c2VyIGNvbXBhdGlibGUuXG5cbi8qKlxuICogUG9ydCBvZiB0aGUgR29cbiAqIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZ29sYW5nL2dvL2Jsb2IvZ28xLjEyLjUvc3JjL2VuY29kaW5nL2hleC9oZXguZ28gfCBlbmNvZGluZy9oZXh9XG4gKiBsaWJyYXJ5LlxuICpcbiAqIFRoaXMgbW9kdWxlIGlzIGJyb3dzZXIgY29tcGF0aWJsZS5cbiAqXG4gKiBgYGB0c1xuICogaW1wb3J0IHtcbiAqICAgZGVjb2RlSGV4LFxuICogICBlbmNvZGVIZXgsXG4gKiB9IGZyb20gXCJAc3RkL2VuY29kaW5nL2hleFwiO1xuICpcbiAqIGNvbnN0IGVuY29kZWQgPSBlbmNvZGVIZXgoXCJhYmNcIik7IC8vIFwiNjE2MjYzXCJcbiAqXG4gKiBkZWNvZGVIZXgoZW5jb2RlZCk7IC8vIFVpbnQ4QXJyYXkoMykgWyA5NywgOTgsIDk5IF1cbiAqIGBgYFxuICpcbiAqIEBtb2R1bGVcbiAqL1xuXG5pbXBvcnQgeyB2YWxpZGF0ZUJpbmFyeUxpa2UgfSBmcm9tIFwiLi9fdXRpbC50c1wiO1xuXG5jb25zdCBoZXhUYWJsZSA9IG5ldyBUZXh0RW5jb2RlcigpLmVuY29kZShcIjAxMjM0NTY3ODlhYmNkZWZcIik7XG5jb25zdCB0ZXh0RW5jb2RlciA9IG5ldyBUZXh0RW5jb2RlcigpO1xuY29uc3QgdGV4dERlY29kZXIgPSBuZXcgVGV4dERlY29kZXIoKTtcblxuZnVuY3Rpb24gZXJySW52YWxpZEJ5dGUoYnl0ZTogbnVtYmVyKSB7XG4gIHJldHVybiBuZXcgVHlwZUVycm9yKGBJbnZhbGlkIGJ5dGUgJyR7U3RyaW5nLmZyb21DaGFyQ29kZShieXRlKX0nYCk7XG59XG5cbmZ1bmN0aW9uIGVyckxlbmd0aCgpIHtcbiAgcmV0dXJuIG5ldyBSYW5nZUVycm9yKFwiT2RkIGxlbmd0aCBoZXggc3RyaW5nXCIpO1xufVxuXG4vKiogQ29udmVydHMgYSBoZXggY2hhcmFjdGVyIGludG8gaXRzIHZhbHVlLiAqL1xuZnVuY3Rpb24gZnJvbUhleENoYXIoYnl0ZTogbnVtYmVyKTogbnVtYmVyIHtcbiAgLy8gJzAnIDw9IGJ5dGUgJiYgYnl0ZSA8PSAnOSdcbiAgaWYgKDQ4IDw9IGJ5dGUgJiYgYnl0ZSA8PSA1NykgcmV0dXJuIGJ5dGUgLSA0ODtcbiAgLy8gJ2EnIDw9IGJ5dGUgJiYgYnl0ZSA8PSAnZidcbiAgaWYgKDk3IDw9IGJ5dGUgJiYgYnl0ZSA8PSAxMDIpIHJldHVybiBieXRlIC0gOTcgKyAxMDtcbiAgLy8gJ0EnIDw9IGJ5dGUgJiYgYnl0ZSA8PSAnRidcbiAgaWYgKDY1IDw9IGJ5dGUgJiYgYnl0ZSA8PSA3MCkgcmV0dXJuIGJ5dGUgLSA2NSArIDEwO1xuXG4gIHRocm93IGVyckludmFsaWRCeXRlKGJ5dGUpO1xufVxuXG4vKipcbiAqIENvbnZlcnRzIGRhdGEgaW50byBhIGhleC1lbmNvZGVkIHN0cmluZy5cbiAqXG4gKiBAZXhhbXBsZVxuICogYGBgdHNcbiAqIGltcG9ydCB7IGVuY29kZUhleCB9IGZyb20gXCJAc3RkL2VuY29kaW5nL2hleFwiO1xuICpcbiAqIGVuY29kZUhleChcImFiY1wiKTsgLy8gXCI2MTYyNjNcIlxuICogYGBgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlbmNvZGVIZXgoc3JjOiBzdHJpbmcgfCBVaW50OEFycmF5IHwgQXJyYXlCdWZmZXIpOiBzdHJpbmcge1xuICBjb25zdCB1OCA9IHZhbGlkYXRlQmluYXJ5TGlrZShzcmMpO1xuXG4gIGNvbnN0IGRzdCA9IG5ldyBVaW50OEFycmF5KHU4Lmxlbmd0aCAqIDIpO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGRzdC5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IHYgPSB1OFtpXSE7XG4gICAgZHN0W2kgKiAyXSA9IGhleFRhYmxlW3YgPj4gNF0hO1xuICAgIGRzdFtpICogMiArIDFdID0gaGV4VGFibGVbdiAmIDB4MGZdITtcbiAgfVxuICByZXR1cm4gdGV4dERlY29kZXIuZGVjb2RlKGRzdCk7XG59XG5cbi8qKlxuICogRGVjb2RlcyB0aGUgZ2l2ZW4gaGV4LWVuY29kZWQgc3RyaW5nLiBJZiB0aGUgaW5wdXQgaXMgbWFsZm9ybWVkLCBhbiBlcnJvciBpc1xuICogdGhyb3duLlxuICpcbiAqIEBleGFtcGxlXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgZGVjb2RlSGV4IH0gZnJvbSBcIkBzdGQvZW5jb2RpbmcvaGV4XCI7XG4gKlxuICogZGVjb2RlSGV4KFwiNjE2MjYzXCIpOyAvLyBVaW50OEFycmF5KDMpIFsgOTcsIDk4LCA5OSBdXG4gKiBgYGBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRlY29kZUhleChzcmM6IHN0cmluZyk6IFVpbnQ4QXJyYXkge1xuICBjb25zdCB1OCA9IHRleHRFbmNvZGVyLmVuY29kZShzcmMpO1xuICBjb25zdCBkc3QgPSBuZXcgVWludDhBcnJheSh1OC5sZW5ndGggLyAyKTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBkc3QubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCBhID0gZnJvbUhleENoYXIodThbaSAqIDJdISk7XG4gICAgY29uc3QgYiA9IGZyb21IZXhDaGFyKHU4W2kgKiAyICsgMV0hKTtcbiAgICBkc3RbaV0gPSAoYSA8PCA0KSB8IGI7XG4gIH1cblxuICBpZiAodTgubGVuZ3RoICUgMiA9PT0gMSkge1xuICAgIC8vIENoZWNrIGZvciBpbnZhbGlkIGNoYXIgYmVmb3JlIHJlcG9ydGluZyBiYWQgbGVuZ3RoLFxuICAgIC8vIHNpbmNlIHRoZSBpbnZhbGlkIGNoYXIgKGlmIHByZXNlbnQpIGlzIGFuIGVhcmxpZXIgcHJvYmxlbS5cbiAgICBmcm9tSGV4Q2hhcih1OFtkc3QubGVuZ3RoICogMl0hKTtcbiAgICB0aHJvdyBlcnJMZW5ndGgoKTtcbiAgfVxuXG4gIHJldHVybiBkc3Q7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsc0RBQXNEO0FBQ3RELG1EQUFtRDtBQUNuRCwwRUFBMEU7QUFDMUUscUNBQXFDO0FBRXJDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O0NBbUJDLEdBRUQsU0FBUyxrQkFBa0IsUUFBUSxhQUFhO0FBRWhELE1BQU0sV0FBVyxJQUFJLGNBQWMsTUFBTSxDQUFDO0FBQzFDLE1BQU0sY0FBYyxJQUFJO0FBQ3hCLE1BQU0sY0FBYyxJQUFJO0FBRXhCLFNBQVMsZUFBZSxJQUFZO0VBQ2xDLE9BQU8sSUFBSSxVQUFVLENBQUMsY0FBYyxFQUFFLE9BQU8sWUFBWSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQ3BFO0FBRUEsU0FBUztFQUNQLE9BQU8sSUFBSSxXQUFXO0FBQ3hCO0FBRUEsNkNBQTZDLEdBQzdDLFNBQVMsWUFBWSxJQUFZO0VBQy9CLDZCQUE2QjtFQUM3QixJQUFJLE1BQU0sUUFBUSxRQUFRLElBQUksT0FBTyxPQUFPO0VBQzVDLDZCQUE2QjtFQUM3QixJQUFJLE1BQU0sUUFBUSxRQUFRLEtBQUssT0FBTyxPQUFPLEtBQUs7RUFDbEQsNkJBQTZCO0VBQzdCLElBQUksTUFBTSxRQUFRLFFBQVEsSUFBSSxPQUFPLE9BQU8sS0FBSztFQUVqRCxNQUFNLGVBQWU7QUFDdkI7QUFFQTs7Ozs7Ozs7O0NBU0MsR0FDRCxPQUFPLFNBQVMsVUFBVSxHQUFzQztFQUM5RCxNQUFNLEtBQUssbUJBQW1CO0VBRTlCLE1BQU0sTUFBTSxJQUFJLFdBQVcsR0FBRyxNQUFNLEdBQUc7RUFDdkMsSUFBSyxJQUFJLElBQUksR0FBRyxJQUFJLElBQUksTUFBTSxFQUFFLElBQUs7SUFDbkMsTUFBTSxJQUFJLEVBQUUsQ0FBQyxFQUFFO0lBQ2YsR0FBRyxDQUFDLElBQUksRUFBRSxHQUFHLFFBQVEsQ0FBQyxLQUFLLEVBQUU7SUFDN0IsR0FBRyxDQUFDLElBQUksSUFBSSxFQUFFLEdBQUcsUUFBUSxDQUFDLElBQUksS0FBSztFQUNyQztFQUNBLE9BQU8sWUFBWSxNQUFNLENBQUM7QUFDNUI7QUFFQTs7Ozs7Ozs7OztDQVVDLEdBQ0QsT0FBTyxTQUFTLFVBQVUsR0FBVztFQUNuQyxNQUFNLEtBQUssWUFBWSxNQUFNLENBQUM7RUFDOUIsTUFBTSxNQUFNLElBQUksV0FBVyxHQUFHLE1BQU0sR0FBRztFQUN2QyxJQUFLLElBQUksSUFBSSxHQUFHLElBQUksSUFBSSxNQUFNLEVBQUUsSUFBSztJQUNuQyxNQUFNLElBQUksWUFBWSxFQUFFLENBQUMsSUFBSSxFQUFFO0lBQy9CLE1BQU0sSUFBSSxZQUFZLEVBQUUsQ0FBQyxJQUFJLElBQUksRUFBRTtJQUNuQyxHQUFHLENBQUMsRUFBRSxHQUFHLEFBQUMsS0FBSyxJQUFLO0VBQ3RCO0VBRUEsSUFBSSxHQUFHLE1BQU0sR0FBRyxNQUFNLEdBQUc7SUFDdkIsc0RBQXNEO0lBQ3RELDZEQUE2RDtJQUM3RCxZQUFZLEVBQUUsQ0FBQyxJQUFJLE1BQU0sR0FBRyxFQUFFO0lBQzlCLE1BQU07RUFDUjtFQUVBLE9BQU87QUFDVCJ9