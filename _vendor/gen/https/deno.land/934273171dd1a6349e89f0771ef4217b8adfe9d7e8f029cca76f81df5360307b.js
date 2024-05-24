import { getGitDate, parseDate } from "./date.ts";
/** Returns the Date instance of a file */ export function getPageDate(page) {
  const data = page.data;
  const { date } = data;
  if (date instanceof Date) {
    return date;
  }
  if (typeof date === "number") {
    return new Date(date);
  }
  const { entry } = page.src;
  const info = entry?.getInfo();
  if (typeof date === "string") {
    if (entry && info) {
      switch(date.toLowerCase()){
        case "git last modified":
          return getGitDate("modified", entry.src) || info.mtime || new Date();
        case "git created":
          return getGitDate("created", entry.src) || info.birthtime || new Date();
      }
    }
    try {
      return parseDate(date);
    } catch  {
      throw new Error(`Invalid date: ${date} (${entry?.src})`);
    }
  }
  return info?.birthtime || info?.mtime || new Date();
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvbHVtZUB2Mi4yLjAvY29yZS91dGlscy9wYWdlX2RhdGUudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgZ2V0R2l0RGF0ZSwgcGFyc2VEYXRlIH0gZnJvbSBcIi4vZGF0ZS50c1wiO1xuXG5pbXBvcnQgdHlwZSB7IFBhZ2UsIFJhd0RhdGEgfSBmcm9tIFwiLi4vZmlsZS50c1wiO1xuXG4vKiogUmV0dXJucyB0aGUgRGF0ZSBpbnN0YW5jZSBvZiBhIGZpbGUgKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRQYWdlRGF0ZShwYWdlOiBQYWdlKTogRGF0ZSB7XG4gIGNvbnN0IGRhdGEgPSBwYWdlLmRhdGEgYXMgUmF3RGF0YTtcbiAgY29uc3QgeyBkYXRlIH0gPSBkYXRhO1xuXG4gIGlmIChkYXRlIGluc3RhbmNlb2YgRGF0ZSkge1xuICAgIHJldHVybiBkYXRlO1xuICB9XG5cbiAgaWYgKHR5cGVvZiBkYXRlID09PSBcIm51bWJlclwiKSB7XG4gICAgcmV0dXJuIG5ldyBEYXRlKGRhdGUpO1xuICB9XG5cbiAgY29uc3QgeyBlbnRyeSB9ID0gcGFnZS5zcmM7XG4gIGNvbnN0IGluZm8gPSBlbnRyeT8uZ2V0SW5mbygpO1xuXG4gIGlmICh0eXBlb2YgZGF0ZSA9PT0gXCJzdHJpbmdcIikge1xuICAgIGlmIChlbnRyeSAmJiBpbmZvKSB7XG4gICAgICBzd2l0Y2ggKGRhdGUudG9Mb3dlckNhc2UoKSkge1xuICAgICAgICBjYXNlIFwiZ2l0IGxhc3QgbW9kaWZpZWRcIjpcbiAgICAgICAgICByZXR1cm4gZ2V0R2l0RGF0ZShcIm1vZGlmaWVkXCIsIGVudHJ5LnNyYykgfHwgaW5mby5tdGltZSB8fCBuZXcgRGF0ZSgpO1xuICAgICAgICBjYXNlIFwiZ2l0IGNyZWF0ZWRcIjpcbiAgICAgICAgICByZXR1cm4gZ2V0R2l0RGF0ZShcImNyZWF0ZWRcIiwgZW50cnkuc3JjKSB8fCBpbmZvLmJpcnRodGltZSB8fFxuICAgICAgICAgICAgbmV3IERhdGUoKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0cnkge1xuICAgICAgcmV0dXJuIHBhcnNlRGF0ZShkYXRlKTtcbiAgICB9IGNhdGNoIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgSW52YWxpZCBkYXRlOiAke2RhdGV9ICgke2VudHJ5Py5zcmN9KWApO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBpbmZvPy5iaXJ0aHRpbWUgfHwgaW5mbz8ubXRpbWUgfHwgbmV3IERhdGUoKTtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxTQUFTLFVBQVUsRUFBRSxTQUFTLFFBQVEsWUFBWTtBQUlsRCx3Q0FBd0MsR0FDeEMsT0FBTyxTQUFTLFlBQVksSUFBVTtFQUNwQyxNQUFNLE9BQU8sS0FBSyxJQUFJO0VBQ3RCLE1BQU0sRUFBRSxJQUFJLEVBQUUsR0FBRztFQUVqQixJQUFJLGdCQUFnQixNQUFNO0lBQ3hCLE9BQU87RUFDVDtFQUVBLElBQUksT0FBTyxTQUFTLFVBQVU7SUFDNUIsT0FBTyxJQUFJLEtBQUs7RUFDbEI7RUFFQSxNQUFNLEVBQUUsS0FBSyxFQUFFLEdBQUcsS0FBSyxHQUFHO0VBQzFCLE1BQU0sT0FBTyxPQUFPO0VBRXBCLElBQUksT0FBTyxTQUFTLFVBQVU7SUFDNUIsSUFBSSxTQUFTLE1BQU07TUFDakIsT0FBUSxLQUFLLFdBQVc7UUFDdEIsS0FBSztVQUNILE9BQU8sV0FBVyxZQUFZLE1BQU0sR0FBRyxLQUFLLEtBQUssS0FBSyxJQUFJLElBQUk7UUFDaEUsS0FBSztVQUNILE9BQU8sV0FBVyxXQUFXLE1BQU0sR0FBRyxLQUFLLEtBQUssU0FBUyxJQUN2RCxJQUFJO01BQ1Y7SUFDRjtJQUVBLElBQUk7TUFDRixPQUFPLFVBQVU7SUFDbkIsRUFBRSxPQUFNO01BQ04sTUFBTSxJQUFJLE1BQU0sQ0FBQyxjQUFjLEVBQUUsS0FBSyxFQUFFLEVBQUUsT0FBTyxJQUFJLENBQUMsQ0FBQztJQUN6RDtFQUNGO0VBRUEsT0FBTyxNQUFNLGFBQWEsTUFBTSxTQUFTLElBQUk7QUFDL0MifQ==