// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
// Ported from unicode_width rust crate, Copyright (c) 2015 The Rust Project Developers. MIT license.
import data from "./_data.json" with {
  type: "json"
};
import { runLengthDecode } from "./_run_length.ts";
let tables = null;
function lookupWidth(cp) {
  if (!tables) tables = data.tables.map(runLengthDecode);
  const t1Offset = tables[0][cp >> 13 & 0xff];
  const t2Offset = tables[1][128 * t1Offset + (cp >> 6 & 0x7f)];
  const packedWidths = tables[2][16 * t2Offset + (cp >> 2 & 0xf)];
  const width = packedWidths >> 2 * (cp & 0b11) & 0b11;
  return width === 3 ? 1 : width;
}
const cache = new Map();
function charWidth(ch) {
  if (cache.has(ch)) return cache.get(ch);
  const cp = ch.codePointAt(0);
  let v = null;
  if (cp < 0x7f) {
    v = cp >= 0x20 ? 1 : cp === 0 ? 0 : null;
  } else if (cp >= 0xa0) {
    v = lookupWidth(cp);
  } else {
    v = null;
  }
  cache.set(ch, v);
  return v;
}
/**
 * Calculate the physical width of a string in a TTY-like environment. This is
 * useful for cases such as calculating where a line-wrap will occur and
 * underlining strings.
 *
 * The physical width is given by the number of columns required to display
 * the string. The number of columns a given unicode character occupies can
 * vary depending on the character itself.
 *
 * @param str The string to measure.
 * @returns The unicode width of the string.
 *
 * @example Calculating the unicode width of a string
 * ```ts
 * import { unicodeWidth } from "@std/cli/unicode-width";
 *
 * unicodeWidth("hello world"); // 11
 * unicodeWidth("天地玄黃宇宙洪荒"); // 16
 * unicodeWidth("ｆｕｌｌｗｉｄｔｈ"); // 18
 * ```
 *
 * @example Calculating the unicode width of a color-encoded string
 * ```ts
 * import { unicodeWidth } from "@std/cli/unicode-width";
 * import { stripAnsiCode } from "@std/fmt/colors";
 *
 * unicodeWidth(stripAnsiCode("\x1b[36mголубой\x1b[39m")); // 7
 * unicodeWidth(stripAnsiCode("\x1b[31m紅色\x1b[39m")); // 4
 * unicodeWidth(stripAnsiCode("\x1B]8;;https://deno.land\x07🦕\x1B]8;;\x07")); // 2
 * ```
 *
 * Use
 * {@linkcode https://jsr.io/@std/fmt/doc/colors/~/stripAnsiCode | stripAnsiCode}
 * to remove ANSI escape codes from a string before passing it to
 * {@linkcode unicodeWidth}.
 */ export function unicodeWidth(str) {
  return [
    ...str
  ].map((ch)=>charWidth(ch) ?? 0).reduce((a, b)=>a + b, 0);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0BzdGQvY2xpLzAuMjI0LjIvdW5pY29kZV93aWR0aC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDI0IHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuLy8gVGhpcyBtb2R1bGUgaXMgYnJvd3NlciBjb21wYXRpYmxlLlxuLy8gUG9ydGVkIGZyb20gdW5pY29kZV93aWR0aCBydXN0IGNyYXRlLCBDb3B5cmlnaHQgKGMpIDIwMTUgVGhlIFJ1c3QgUHJvamVjdCBEZXZlbG9wZXJzLiBNSVQgbGljZW5zZS5cblxuaW1wb3J0IGRhdGEgZnJvbSBcIi4vX2RhdGEuanNvblwiIHdpdGggeyB0eXBlOiBcImpzb25cIiB9O1xuaW1wb3J0IHsgcnVuTGVuZ3RoRGVjb2RlIH0gZnJvbSBcIi4vX3J1bl9sZW5ndGgudHNcIjtcblxubGV0IHRhYmxlczogVWludDhBcnJheVtdIHwgbnVsbCA9IG51bGw7XG5mdW5jdGlvbiBsb29rdXBXaWR0aChjcDogbnVtYmVyKSB7XG4gIGlmICghdGFibGVzKSB0YWJsZXMgPSBkYXRhLnRhYmxlcy5tYXAocnVuTGVuZ3RoRGVjb2RlKTtcblxuICBjb25zdCB0MU9mZnNldCA9ICh0YWJsZXNbMF0gYXMgVWludDhBcnJheSlbKGNwID4+IDEzKSAmIDB4ZmZdIGFzIG51bWJlcjtcbiAgY29uc3QgdDJPZmZzZXQgPVxuICAgICh0YWJsZXNbMV0gYXMgVWludDhBcnJheSlbMTI4ICogdDFPZmZzZXQgKyAoKGNwID4+IDYpICYgMHg3ZildIGFzIG51bWJlcjtcbiAgY29uc3QgcGFja2VkV2lkdGhzID1cbiAgICAodGFibGVzWzJdIGFzIFVpbnQ4QXJyYXkpWzE2ICogdDJPZmZzZXQgKyAoKGNwID4+IDIpICYgMHhmKV0gYXMgbnVtYmVyO1xuXG4gIGNvbnN0IHdpZHRoID0gKHBhY2tlZFdpZHRocyA+PiAoMiAqIChjcCAmIDBiMTEpKSkgJiAwYjExO1xuXG4gIHJldHVybiB3aWR0aCA9PT0gMyA/IDEgOiB3aWR0aDtcbn1cblxuY29uc3QgY2FjaGUgPSBuZXcgTWFwPHN0cmluZywgbnVtYmVyIHwgbnVsbD4oKTtcbmZ1bmN0aW9uIGNoYXJXaWR0aChjaDogc3RyaW5nKSB7XG4gIGlmIChjYWNoZS5oYXMoY2gpKSByZXR1cm4gY2FjaGUuZ2V0KGNoKSE7XG5cbiAgY29uc3QgY3AgPSBjaC5jb2RlUG9pbnRBdCgwKSE7XG4gIGxldCB2OiBudW1iZXIgfCBudWxsID0gbnVsbDtcblxuICBpZiAoY3AgPCAweDdmKSB7XG4gICAgdiA9IGNwID49IDB4MjAgPyAxIDogY3AgPT09IDAgPyAwIDogbnVsbDtcbiAgfSBlbHNlIGlmIChjcCA+PSAweGEwKSB7XG4gICAgdiA9IGxvb2t1cFdpZHRoKGNwKTtcbiAgfSBlbHNlIHtcbiAgICB2ID0gbnVsbDtcbiAgfVxuXG4gIGNhY2hlLnNldChjaCwgdik7XG4gIHJldHVybiB2O1xufVxuXG4vKipcbiAqIENhbGN1bGF0ZSB0aGUgcGh5c2ljYWwgd2lkdGggb2YgYSBzdHJpbmcgaW4gYSBUVFktbGlrZSBlbnZpcm9ubWVudC4gVGhpcyBpc1xuICogdXNlZnVsIGZvciBjYXNlcyBzdWNoIGFzIGNhbGN1bGF0aW5nIHdoZXJlIGEgbGluZS13cmFwIHdpbGwgb2NjdXIgYW5kXG4gKiB1bmRlcmxpbmluZyBzdHJpbmdzLlxuICpcbiAqIFRoZSBwaHlzaWNhbCB3aWR0aCBpcyBnaXZlbiBieSB0aGUgbnVtYmVyIG9mIGNvbHVtbnMgcmVxdWlyZWQgdG8gZGlzcGxheVxuICogdGhlIHN0cmluZy4gVGhlIG51bWJlciBvZiBjb2x1bW5zIGEgZ2l2ZW4gdW5pY29kZSBjaGFyYWN0ZXIgb2NjdXBpZXMgY2FuXG4gKiB2YXJ5IGRlcGVuZGluZyBvbiB0aGUgY2hhcmFjdGVyIGl0c2VsZi5cbiAqXG4gKiBAcGFyYW0gc3RyIFRoZSBzdHJpbmcgdG8gbWVhc3VyZS5cbiAqIEByZXR1cm5zIFRoZSB1bmljb2RlIHdpZHRoIG9mIHRoZSBzdHJpbmcuXG4gKlxuICogQGV4YW1wbGUgQ2FsY3VsYXRpbmcgdGhlIHVuaWNvZGUgd2lkdGggb2YgYSBzdHJpbmdcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyB1bmljb2RlV2lkdGggfSBmcm9tIFwiQHN0ZC9jbGkvdW5pY29kZS13aWR0aFwiO1xuICpcbiAqIHVuaWNvZGVXaWR0aChcImhlbGxvIHdvcmxkXCIpOyAvLyAxMVxuICogdW5pY29kZVdpZHRoKFwi5aSp5Zyw546E6buD5a6H5a6Z5rSq6I2SXCIpOyAvLyAxNlxuICogdW5pY29kZVdpZHRoKFwi772G772V772M772M772X772J772E772U772IXCIpOyAvLyAxOFxuICogYGBgXG4gKlxuICogQGV4YW1wbGUgQ2FsY3VsYXRpbmcgdGhlIHVuaWNvZGUgd2lkdGggb2YgYSBjb2xvci1lbmNvZGVkIHN0cmluZ1xuICogYGBgdHNcbiAqIGltcG9ydCB7IHVuaWNvZGVXaWR0aCB9IGZyb20gXCJAc3RkL2NsaS91bmljb2RlLXdpZHRoXCI7XG4gKiBpbXBvcnQgeyBzdHJpcEFuc2lDb2RlIH0gZnJvbSBcIkBzdGQvZm10L2NvbG9yc1wiO1xuICpcbiAqIHVuaWNvZGVXaWR0aChzdHJpcEFuc2lDb2RlKFwiXFx4MWJbMzZt0LPQvtC70YPQsdC+0LlcXHgxYlszOW1cIikpOyAvLyA3XG4gKiB1bmljb2RlV2lkdGgoc3RyaXBBbnNpQ29kZShcIlxceDFiWzMxbee0heiJslxceDFiWzM5bVwiKSk7IC8vIDRcbiAqIHVuaWNvZGVXaWR0aChzdHJpcEFuc2lDb2RlKFwiXFx4MUJdODs7aHR0cHM6Ly9kZW5vLmxhbmRcXHgwN/CfppVcXHgxQl04OztcXHgwN1wiKSk7IC8vIDJcbiAqIGBgYFxuICpcbiAqIFVzZVxuICoge0BsaW5rY29kZSBodHRwczovL2pzci5pby9Ac3RkL2ZtdC9kb2MvY29sb3JzL34vc3RyaXBBbnNpQ29kZSB8IHN0cmlwQW5zaUNvZGV9XG4gKiB0byByZW1vdmUgQU5TSSBlc2NhcGUgY29kZXMgZnJvbSBhIHN0cmluZyBiZWZvcmUgcGFzc2luZyBpdCB0b1xuICoge0BsaW5rY29kZSB1bmljb2RlV2lkdGh9LlxuICovXG5leHBvcnQgZnVuY3Rpb24gdW5pY29kZVdpZHRoKHN0cjogc3RyaW5nKTogbnVtYmVyIHtcbiAgcmV0dXJuIFsuLi5zdHJdLm1hcCgoY2gpID0+IGNoYXJXaWR0aChjaCkgPz8gMCkucmVkdWNlKChhLCBiKSA9PiBhICsgYiwgMCk7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsMEVBQTBFO0FBQzFFLHFDQUFxQztBQUNyQyxxR0FBcUc7QUFFckcsT0FBTyxVQUFVLG9CQUFvQjtFQUFFLE1BQU07QUFBTyxFQUFFO0FBQ3RELFNBQVMsZUFBZSxRQUFRLG1CQUFtQjtBQUVuRCxJQUFJLFNBQThCO0FBQ2xDLFNBQVMsWUFBWSxFQUFVO0VBQzdCLElBQUksQ0FBQyxRQUFRLFNBQVMsS0FBSyxNQUFNLENBQUMsR0FBRyxDQUFDO0VBRXRDLE1BQU0sV0FBVyxBQUFDLE1BQU0sQ0FBQyxFQUFFLEFBQWUsQ0FBQyxBQUFDLE1BQU0sS0FBTSxLQUFLO0VBQzdELE1BQU0sV0FDSixBQUFDLE1BQU0sQ0FBQyxFQUFFLEFBQWUsQ0FBQyxNQUFNLFdBQVcsQ0FBQyxBQUFDLE1BQU0sSUFBSyxJQUFJLEVBQUU7RUFDaEUsTUFBTSxlQUNKLEFBQUMsTUFBTSxDQUFDLEVBQUUsQUFBZSxDQUFDLEtBQUssV0FBVyxDQUFDLEFBQUMsTUFBTSxJQUFLLEdBQUcsRUFBRTtFQUU5RCxNQUFNLFFBQVEsQUFBQyxnQkFBaUIsSUFBSSxDQUFDLEtBQUssSUFBSSxJQUFNO0VBRXBELE9BQU8sVUFBVSxJQUFJLElBQUk7QUFDM0I7QUFFQSxNQUFNLFFBQVEsSUFBSTtBQUNsQixTQUFTLFVBQVUsRUFBVTtFQUMzQixJQUFJLE1BQU0sR0FBRyxDQUFDLEtBQUssT0FBTyxNQUFNLEdBQUcsQ0FBQztFQUVwQyxNQUFNLEtBQUssR0FBRyxXQUFXLENBQUM7RUFDMUIsSUFBSSxJQUFtQjtFQUV2QixJQUFJLEtBQUssTUFBTTtJQUNiLElBQUksTUFBTSxPQUFPLElBQUksT0FBTyxJQUFJLElBQUk7RUFDdEMsT0FBTyxJQUFJLE1BQU0sTUFBTTtJQUNyQixJQUFJLFlBQVk7RUFDbEIsT0FBTztJQUNMLElBQUk7RUFDTjtFQUVBLE1BQU0sR0FBRyxDQUFDLElBQUk7RUFDZCxPQUFPO0FBQ1Q7QUFFQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0FtQ0MsR0FDRCxPQUFPLFNBQVMsYUFBYSxHQUFXO0VBQ3RDLE9BQU87T0FBSTtHQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsS0FBTyxVQUFVLE9BQU8sR0FBRyxNQUFNLENBQUMsQ0FBQyxHQUFHLElBQU0sSUFBSSxHQUFHO0FBQzFFIn0=