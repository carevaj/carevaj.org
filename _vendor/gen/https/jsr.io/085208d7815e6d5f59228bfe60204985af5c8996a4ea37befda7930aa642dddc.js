// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import { assert } from "jsr:/@std/assert@^0.225.2/assert";
export function runLengthEncode(arr) {
  const data = [];
  const runLengths = [];
  let prev = Symbol("none");
  for (const x of arr){
    if (x === prev) {
      ++runLengths[runLengths.length - 1];
    } else {
      prev = x;
      data.push(x);
      runLengths.push(1);
    }
  }
  assert(runLengths.every((r)=>r < 0x100));
  return {
    d: btoa(String.fromCharCode(...data)),
    r: btoa(String.fromCharCode(...runLengths))
  };
}
export function runLengthDecode({ d, r }) {
  const data = atob(d);
  const runLengths = atob(r);
  let out = "";
  for (const [i, ch] of [
    ...runLengths
  ].entries()){
    out += data[i].repeat(ch.codePointAt(0));
  }
  return Uint8Array.from([
    ...out
  ].map((x)=>x.codePointAt(0)));
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0BzdGQvY2xpLzAuMjI0LjIvX3J1bl9sZW5ndGgudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgtMjAyNCB0aGUgRGVubyBhdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLiBNSVQgbGljZW5zZS5cblxuaW1wb3J0IHsgYXNzZXJ0IH0gZnJvbSBcImpzcjovQHN0ZC9hc3NlcnRAXjAuMjI1LjIvYXNzZXJ0XCI7XG5cbmV4cG9ydCBmdW5jdGlvbiBydW5MZW5ndGhFbmNvZGUoYXJyOiBudW1iZXJbXSkge1xuICBjb25zdCBkYXRhOiBudW1iZXJbXSA9IFtdO1xuICBjb25zdCBydW5MZW5ndGhzOiBudW1iZXJbXSA9IFtdO1xuXG4gIGxldCBwcmV2OiBzeW1ib2wgfCBudW1iZXIgPSBTeW1ib2woXCJub25lXCIpO1xuXG4gIGZvciAoY29uc3QgeCBvZiBhcnIpIHtcbiAgICBpZiAoeCA9PT0gcHJldikge1xuICAgICAgKytydW5MZW5ndGhzW3J1bkxlbmd0aHMubGVuZ3RoIC0gMV07XG4gICAgfSBlbHNlIHtcbiAgICAgIHByZXYgPSB4O1xuICAgICAgZGF0YS5wdXNoKHgpO1xuICAgICAgcnVuTGVuZ3Rocy5wdXNoKDEpO1xuICAgIH1cbiAgfVxuXG4gIGFzc2VydChydW5MZW5ndGhzLmV2ZXJ5KChyKSA9PiByIDwgMHgxMDApKTtcblxuICByZXR1cm4ge1xuICAgIGQ6IGJ0b2EoU3RyaW5nLmZyb21DaGFyQ29kZSguLi5kYXRhKSksXG4gICAgcjogYnRvYShTdHJpbmcuZnJvbUNoYXJDb2RlKC4uLnJ1bkxlbmd0aHMpKSxcbiAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJ1bkxlbmd0aERlY29kZSh7IGQsIHIgfTogeyBkOiBzdHJpbmc7IHI6IHN0cmluZyB9KSB7XG4gIGNvbnN0IGRhdGEgPSBhdG9iKGQpO1xuICBjb25zdCBydW5MZW5ndGhzID0gYXRvYihyKTtcbiAgbGV0IG91dCA9IFwiXCI7XG5cbiAgZm9yIChjb25zdCBbaSwgY2hdIG9mIFsuLi5ydW5MZW5ndGhzXS5lbnRyaWVzKCkpIHtcbiAgICBvdXQgKz0gZGF0YVtpXSEucmVwZWF0KGNoLmNvZGVQb2ludEF0KDApISk7XG4gIH1cblxuICByZXR1cm4gVWludDhBcnJheS5mcm9tKFsuLi5vdXRdLm1hcCgoeCkgPT4geC5jb2RlUG9pbnRBdCgwKSEpKTtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSwwRUFBMEU7QUFFMUUsU0FBUyxNQUFNLFFBQVEsbUNBQW1DO0FBRTFELE9BQU8sU0FBUyxnQkFBZ0IsR0FBYTtFQUMzQyxNQUFNLE9BQWlCLEVBQUU7RUFDekIsTUFBTSxhQUF1QixFQUFFO0VBRS9CLElBQUksT0FBd0IsT0FBTztFQUVuQyxLQUFLLE1BQU0sS0FBSyxJQUFLO0lBQ25CLElBQUksTUFBTSxNQUFNO01BQ2QsRUFBRSxVQUFVLENBQUMsV0FBVyxNQUFNLEdBQUcsRUFBRTtJQUNyQyxPQUFPO01BQ0wsT0FBTztNQUNQLEtBQUssSUFBSSxDQUFDO01BQ1YsV0FBVyxJQUFJLENBQUM7SUFDbEI7RUFDRjtFQUVBLE9BQU8sV0FBVyxLQUFLLENBQUMsQ0FBQyxJQUFNLElBQUk7RUFFbkMsT0FBTztJQUNMLEdBQUcsS0FBSyxPQUFPLFlBQVksSUFBSTtJQUMvQixHQUFHLEtBQUssT0FBTyxZQUFZLElBQUk7RUFDakM7QUFDRjtBQUVBLE9BQU8sU0FBUyxnQkFBZ0IsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUE0QjtFQUNoRSxNQUFNLE9BQU8sS0FBSztFQUNsQixNQUFNLGFBQWEsS0FBSztFQUN4QixJQUFJLE1BQU07RUFFVixLQUFLLE1BQU0sQ0FBQyxHQUFHLEdBQUcsSUFBSTtPQUFJO0dBQVcsQ0FBQyxPQUFPLEdBQUk7SUFDL0MsT0FBTyxJQUFJLENBQUMsRUFBRSxDQUFFLE1BQU0sQ0FBQyxHQUFHLFdBQVcsQ0FBQztFQUN4QztFQUVBLE9BQU8sV0FBVyxJQUFJLENBQUM7T0FBSTtHQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBTSxFQUFFLFdBQVcsQ0FBQztBQUMzRCJ9