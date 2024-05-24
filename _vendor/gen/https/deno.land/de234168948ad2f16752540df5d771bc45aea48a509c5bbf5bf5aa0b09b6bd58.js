/**
 * Get next words from the beginning of [content] until all words have a length lower or equal then [length].
 *
 * @param length    Max length of all words.
 * @param content   The text content.
 */ import { Cell } from "./cell.ts";
import { stripColor } from "./deps.ts";
export function consumeWords(length, content) {
  let consumed = "";
  const words = content.split("\n")[0]?.split(/ /g);
  for(let i = 0; i < words.length; i++){
    const word = words[i];
    // consume minimum one word
    if (consumed) {
      const nextLength = strLength(word);
      const consumedLength = strLength(consumed);
      if (consumedLength + nextLength >= length) {
        break;
      }
    }
    consumed += (i > 0 ? " " : "") + word;
  }
  return consumed;
}
/**
 * Get longest cell from given row index.
 */ export function longest(index, rows, maxWidth) {
  const cellLengths = rows.map((row)=>{
    const cell = row[index];
    const cellValue = cell instanceof Cell && cell.getColSpan() > 1 ? "" : cell?.toString() || "";
    return cellValue.split("\n").map((line)=>{
      const str = typeof maxWidth === "undefined" ? line : consumeWords(maxWidth, line);
      return strLength(str) || 0;
    });
  }).flat();
  return Math.max(...cellLengths);
}
export const strLength = (str)=>{
  str = stripColor(str);
  let length = 0;
  for(let i = 0; i < str.length; i++){
    const charCode = str.charCodeAt(i);
    // Check for chinese characters: \u4e00 - \u9fa5
    if (charCode >= 19968 && charCode <= 40869) {
      length += 2;
    } else {
      length += 1;
    }
  }
  return length;
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvY2xpZmZ5QHYwLjI1LjcvdGFibGUvdXRpbHMudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBHZXQgbmV4dCB3b3JkcyBmcm9tIHRoZSBiZWdpbm5pbmcgb2YgW2NvbnRlbnRdIHVudGlsIGFsbCB3b3JkcyBoYXZlIGEgbGVuZ3RoIGxvd2VyIG9yIGVxdWFsIHRoZW4gW2xlbmd0aF0uXG4gKlxuICogQHBhcmFtIGxlbmd0aCAgICBNYXggbGVuZ3RoIG9mIGFsbCB3b3Jkcy5cbiAqIEBwYXJhbSBjb250ZW50ICAgVGhlIHRleHQgY29udGVudC5cbiAqL1xuaW1wb3J0IHsgQ2VsbCwgSUNlbGwgfSBmcm9tIFwiLi9jZWxsLnRzXCI7XG5pbXBvcnQgeyBzdHJpcENvbG9yIH0gZnJvbSBcIi4vZGVwcy50c1wiO1xuXG5leHBvcnQgZnVuY3Rpb24gY29uc3VtZVdvcmRzKGxlbmd0aDogbnVtYmVyLCBjb250ZW50OiBzdHJpbmcpOiBzdHJpbmcge1xuICBsZXQgY29uc3VtZWQgPSBcIlwiO1xuICBjb25zdCB3b3Jkczogc3RyaW5nW10gPSBjb250ZW50LnNwbGl0KFwiXFxuXCIpWzBdPy5zcGxpdCgvIC9nKTtcblxuICBmb3IgKGxldCBpID0gMDsgaSA8IHdvcmRzLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3Qgd29yZDogc3RyaW5nID0gd29yZHNbaV07XG5cbiAgICAvLyBjb25zdW1lIG1pbmltdW0gb25lIHdvcmRcbiAgICBpZiAoY29uc3VtZWQpIHtcbiAgICAgIGNvbnN0IG5leHRMZW5ndGggPSBzdHJMZW5ndGgod29yZCk7XG4gICAgICBjb25zdCBjb25zdW1lZExlbmd0aCA9IHN0ckxlbmd0aChjb25zdW1lZCk7XG4gICAgICBpZiAoY29uc3VtZWRMZW5ndGggKyBuZXh0TGVuZ3RoID49IGxlbmd0aCkge1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdW1lZCArPSAoaSA+IDAgPyBcIiBcIiA6IFwiXCIpICsgd29yZDtcbiAgfVxuXG4gIHJldHVybiBjb25zdW1lZDtcbn1cblxuLyoqXG4gKiBHZXQgbG9uZ2VzdCBjZWxsIGZyb20gZ2l2ZW4gcm93IGluZGV4LlxuICovXG5leHBvcnQgZnVuY3Rpb24gbG9uZ2VzdChcbiAgaW5kZXg6IG51bWJlcixcbiAgcm93czogSUNlbGxbXVtdLFxuICBtYXhXaWR0aD86IG51bWJlcixcbik6IG51bWJlciB7XG4gIGNvbnN0IGNlbGxMZW5ndGhzID0gcm93cy5tYXAoKHJvdykgPT4ge1xuICAgIGNvbnN0IGNlbGwgPSByb3dbaW5kZXhdO1xuICAgIGNvbnN0IGNlbGxWYWx1ZSA9IGNlbGwgaW5zdGFuY2VvZiBDZWxsICYmIGNlbGwuZ2V0Q29sU3BhbigpID4gMVxuICAgICAgPyBcIlwiXG4gICAgICA6IGNlbGw/LnRvU3RyaW5nKCkgfHwgXCJcIjtcblxuICAgIHJldHVybiBjZWxsVmFsdWVcbiAgICAgIC5zcGxpdChcIlxcblwiKVxuICAgICAgLm1hcCgobGluZTogc3RyaW5nKSA9PiB7XG4gICAgICAgIGNvbnN0IHN0ciA9IHR5cGVvZiBtYXhXaWR0aCA9PT0gXCJ1bmRlZmluZWRcIlxuICAgICAgICAgID8gbGluZVxuICAgICAgICAgIDogY29uc3VtZVdvcmRzKG1heFdpZHRoLCBsaW5lKTtcblxuICAgICAgICByZXR1cm4gc3RyTGVuZ3RoKHN0cikgfHwgMDtcbiAgICAgIH0pO1xuICB9KS5mbGF0KCk7XG5cbiAgcmV0dXJuIE1hdGgubWF4KC4uLmNlbGxMZW5ndGhzKTtcbn1cblxuZXhwb3J0IGNvbnN0IHN0ckxlbmd0aCA9IChzdHI6IHN0cmluZyk6IG51bWJlciA9PiB7XG4gIHN0ciA9IHN0cmlwQ29sb3Ioc3RyKTtcbiAgbGV0IGxlbmd0aCA9IDA7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgc3RyLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3QgY2hhckNvZGUgPSBzdHIuY2hhckNvZGVBdChpKTtcbiAgICAvLyBDaGVjayBmb3IgY2hpbmVzZSBjaGFyYWN0ZXJzOiBcXHU0ZTAwIC0gXFx1OWZhNVxuICAgIGlmIChjaGFyQ29kZSA+PSAxOTk2OCAmJiBjaGFyQ29kZSA8PSA0MDg2OSkge1xuICAgICAgbGVuZ3RoICs9IDI7XG4gICAgfSBlbHNlIHtcbiAgICAgIGxlbmd0aCArPSAxO1xuICAgIH1cbiAgfVxuICByZXR1cm4gbGVuZ3RoO1xufTtcbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Q0FLQyxHQUNELFNBQVMsSUFBSSxRQUFlLFlBQVk7QUFDeEMsU0FBUyxVQUFVLFFBQVEsWUFBWTtBQUV2QyxPQUFPLFNBQVMsYUFBYSxNQUFjLEVBQUUsT0FBZTtFQUMxRCxJQUFJLFdBQVc7RUFDZixNQUFNLFFBQWtCLFFBQVEsS0FBSyxDQUFDLEtBQUssQ0FBQyxFQUFFLEVBQUUsTUFBTTtFQUV0RCxJQUFLLElBQUksSUFBSSxHQUFHLElBQUksTUFBTSxNQUFNLEVBQUUsSUFBSztJQUNyQyxNQUFNLE9BQWUsS0FBSyxDQUFDLEVBQUU7SUFFN0IsMkJBQTJCO0lBQzNCLElBQUksVUFBVTtNQUNaLE1BQU0sYUFBYSxVQUFVO01BQzdCLE1BQU0saUJBQWlCLFVBQVU7TUFDakMsSUFBSSxpQkFBaUIsY0FBYyxRQUFRO1FBQ3pDO01BQ0Y7SUFDRjtJQUVBLFlBQVksQ0FBQyxJQUFJLElBQUksTUFBTSxFQUFFLElBQUk7RUFDbkM7RUFFQSxPQUFPO0FBQ1Q7QUFFQTs7Q0FFQyxHQUNELE9BQU8sU0FBUyxRQUNkLEtBQWEsRUFDYixJQUFlLEVBQ2YsUUFBaUI7RUFFakIsTUFBTSxjQUFjLEtBQUssR0FBRyxDQUFDLENBQUM7SUFDNUIsTUFBTSxPQUFPLEdBQUcsQ0FBQyxNQUFNO0lBQ3ZCLE1BQU0sWUFBWSxnQkFBZ0IsUUFBUSxLQUFLLFVBQVUsS0FBSyxJQUMxRCxLQUNBLE1BQU0sY0FBYztJQUV4QixPQUFPLFVBQ0osS0FBSyxDQUFDLE1BQ04sR0FBRyxDQUFDLENBQUM7TUFDSixNQUFNLE1BQU0sT0FBTyxhQUFhLGNBQzVCLE9BQ0EsYUFBYSxVQUFVO01BRTNCLE9BQU8sVUFBVSxRQUFRO0lBQzNCO0VBQ0osR0FBRyxJQUFJO0VBRVAsT0FBTyxLQUFLLEdBQUcsSUFBSTtBQUNyQjtBQUVBLE9BQU8sTUFBTSxZQUFZLENBQUM7RUFDeEIsTUFBTSxXQUFXO0VBQ2pCLElBQUksU0FBUztFQUNiLElBQUssSUFBSSxJQUFJLEdBQUcsSUFBSSxJQUFJLE1BQU0sRUFBRSxJQUFLO0lBQ25DLE1BQU0sV0FBVyxJQUFJLFVBQVUsQ0FBQztJQUNoQyxnREFBZ0Q7SUFDaEQsSUFBSSxZQUFZLFNBQVMsWUFBWSxPQUFPO01BQzFDLFVBQVU7SUFDWixPQUFPO01BQ0wsVUFBVTtJQUNaO0VBQ0Y7RUFDQSxPQUFPO0FBQ1QsRUFBRSJ9