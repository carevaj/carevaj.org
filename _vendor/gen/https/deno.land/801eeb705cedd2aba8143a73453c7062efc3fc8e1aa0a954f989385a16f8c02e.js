import { Temporal } from "../../deps/temporal.ts";
/**
 * Returns the date of the git commit that created or modified the file.
 * Thanks to https://github.com/11ty/eleventy/blob/8dd2a1012de92c5ee1eab7c37e6bf1b36183927e/src/Util/DateGitLastUpdated.js
 */ export function getGitDate(type, file) {
  const args = type === "created" ? [
    "log",
    "--diff-filter=A",
    "--follow",
    "-1",
    "--format=%at",
    "--",
    file
  ] : [
    "log",
    "-1",
    "--format=%at",
    "--",
    file
  ];
  const { stdout, success } = new Deno.Command("git", {
    args
  }).outputSync();
  if (!success) {
    return;
  }
  const str = new TextDecoder().decode(stdout);
  if (str) {
    return parseDate(parseInt(str) * 1000);
  }
}
/** Parse a string or number (of miliseconds) to UTC Date */ export function parseDate(date) {
  return new Date(getZonedDateTime(date).epochMilliseconds);
}
/** Parse a string or number (of miliseconds) to a zoned datetime */ export function getZonedDateTime(date, timezone = "UTC") {
  if (typeof date === "number") {
    return Temporal.Instant.fromEpochMilliseconds(date).toZonedDateTimeISO(timezone);
  }
  try {
    return Temporal.Instant.from(date).toZonedDateTimeISO(timezone);
  } catch  {
    return Temporal.PlainDateTime.from(date).toZonedDateTime(timezone);
  }
}
/**
 * Parse a date/datetime from a filename.
 *
 * Filenames can be prepended with a date (yyyy-mm-dd) or datetime
 * (yyyy-mm-dd-hh-ii-ss) followed by an underscore (_) or hyphen (-).
 */ export function parseDateFromFilename(filename) {
  const filenameRegex = /^(?<year>\d{4})-(?<month>\d\d)-(?<day>\d\d)(?:-(?<hour>\d\d)-(?<minute>\d\d)(?:-(?<second>\d\d))?)?(?:_|-)(?<basename>.*)/;
  const fileNameParts = filenameRegex.exec(filename)?.groups;
  if (fileNameParts) {
    const { year, month, day, hour = "00", minute = "00", second = "00", basename } = fileNameParts;
    try {
      const date = parseDate(`${year}-${month}-${day} ${hour}:${minute}:${second}`);
      return [
        basename,
        date
      ];
    } catch  {
      throw new Error(`Invalid date: ${filename} (${year}-${month}-${day} ${hour}:${minute}:${second})`);
    }
  }
  return [
    filename,
    undefined
  ];
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvbHVtZUB2Mi4yLjAvY29yZS91dGlscy9kYXRlLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFRlbXBvcmFsIH0gZnJvbSBcIi4uLy4uL2RlcHMvdGVtcG9yYWwudHNcIjtcblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBkYXRlIG9mIHRoZSBnaXQgY29tbWl0IHRoYXQgY3JlYXRlZCBvciBtb2RpZmllZCB0aGUgZmlsZS5cbiAqIFRoYW5rcyB0byBodHRwczovL2dpdGh1Yi5jb20vMTF0eS9lbGV2ZW50eS9ibG9iLzhkZDJhMTAxMmRlOTJjNWVlMWVhYjdjMzdlNmJmMWIzNjE4MzkyN2Uvc3JjL1V0aWwvRGF0ZUdpdExhc3RVcGRhdGVkLmpzXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRHaXREYXRlKFxuICB0eXBlOiBcImNyZWF0ZWRcIiB8IFwibW9kaWZpZWRcIixcbiAgZmlsZTogc3RyaW5nLFxuKTogRGF0ZSB8IHVuZGVmaW5lZCB7XG4gIGNvbnN0IGFyZ3MgPSB0eXBlID09PSBcImNyZWF0ZWRcIlxuICAgID8gW1wibG9nXCIsIFwiLS1kaWZmLWZpbHRlcj1BXCIsIFwiLS1mb2xsb3dcIiwgXCItMVwiLCBcIi0tZm9ybWF0PSVhdFwiLCBcIi0tXCIsIGZpbGVdXG4gICAgOiBbXCJsb2dcIiwgXCItMVwiLCBcIi0tZm9ybWF0PSVhdFwiLCBcIi0tXCIsIGZpbGVdO1xuXG4gIGNvbnN0IHsgc3Rkb3V0LCBzdWNjZXNzIH0gPSBuZXcgRGVuby5Db21tYW5kKFwiZ2l0XCIsIHsgYXJncyB9KS5vdXRwdXRTeW5jKCk7XG5cbiAgaWYgKCFzdWNjZXNzKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIGNvbnN0IHN0ciA9IG5ldyBUZXh0RGVjb2RlcigpLmRlY29kZShzdGRvdXQpO1xuXG4gIGlmIChzdHIpIHtcbiAgICByZXR1cm4gcGFyc2VEYXRlKHBhcnNlSW50KHN0cikgKiAxMDAwKTtcbiAgfVxufVxuXG4vKiogUGFyc2UgYSBzdHJpbmcgb3IgbnVtYmVyIChvZiBtaWxpc2Vjb25kcykgdG8gVVRDIERhdGUgKi9cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZURhdGUoZGF0ZTogc3RyaW5nIHwgbnVtYmVyKTogRGF0ZSB7XG4gIHJldHVybiBuZXcgRGF0ZShnZXRab25lZERhdGVUaW1lKGRhdGUpLmVwb2NoTWlsbGlzZWNvbmRzKTtcbn1cblxuLyoqIFBhcnNlIGEgc3RyaW5nIG9yIG51bWJlciAob2YgbWlsaXNlY29uZHMpIHRvIGEgem9uZWQgZGF0ZXRpbWUgKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRab25lZERhdGVUaW1lKFxuICBkYXRlOiBzdHJpbmcgfCBudW1iZXIsXG4gIHRpbWV6b25lID0gXCJVVENcIixcbik6IFRlbXBvcmFsLlpvbmVkRGF0ZVRpbWUge1xuICBpZiAodHlwZW9mIGRhdGUgPT09IFwibnVtYmVyXCIpIHtcbiAgICByZXR1cm4gVGVtcG9yYWwuSW5zdGFudC5mcm9tRXBvY2hNaWxsaXNlY29uZHMoZGF0ZSkudG9ab25lZERhdGVUaW1lSVNPKFxuICAgICAgdGltZXpvbmUsXG4gICAgKTtcbiAgfVxuXG4gIHRyeSB7XG4gICAgcmV0dXJuIFRlbXBvcmFsLkluc3RhbnQuZnJvbShkYXRlKS50b1pvbmVkRGF0ZVRpbWVJU08odGltZXpvbmUpO1xuICB9IGNhdGNoIHtcbiAgICByZXR1cm4gVGVtcG9yYWwuUGxhaW5EYXRlVGltZS5mcm9tKGRhdGUpLnRvWm9uZWREYXRlVGltZSh0aW1lem9uZSk7XG4gIH1cbn1cblxuLyoqXG4gKiBQYXJzZSBhIGRhdGUvZGF0ZXRpbWUgZnJvbSBhIGZpbGVuYW1lLlxuICpcbiAqIEZpbGVuYW1lcyBjYW4gYmUgcHJlcGVuZGVkIHdpdGggYSBkYXRlICh5eXl5LW1tLWRkKSBvciBkYXRldGltZVxuICogKHl5eXktbW0tZGQtaGgtaWktc3MpIGZvbGxvd2VkIGJ5IGFuIHVuZGVyc2NvcmUgKF8pIG9yIGh5cGhlbiAoLSkuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZURhdGVGcm9tRmlsZW5hbWUoXG4gIGZpbGVuYW1lOiBzdHJpbmcsXG4pOiBbc3RyaW5nLCBEYXRlIHwgdW5kZWZpbmVkXSB7XG4gIGNvbnN0IGZpbGVuYW1lUmVnZXggPVxuICAgIC9eKD88eWVhcj5cXGR7NH0pLSg/PG1vbnRoPlxcZFxcZCktKD88ZGF5PlxcZFxcZCkoPzotKD88aG91cj5cXGRcXGQpLSg/PG1pbnV0ZT5cXGRcXGQpKD86LSg/PHNlY29uZD5cXGRcXGQpKT8pPyg/Ol98LSkoPzxiYXNlbmFtZT4uKikvO1xuICBjb25zdCBmaWxlTmFtZVBhcnRzID0gZmlsZW5hbWVSZWdleC5leGVjKGZpbGVuYW1lKT8uZ3JvdXBzO1xuXG4gIGlmIChmaWxlTmFtZVBhcnRzKSB7XG4gICAgY29uc3Qge1xuICAgICAgeWVhcixcbiAgICAgIG1vbnRoLFxuICAgICAgZGF5LFxuICAgICAgaG91ciA9IFwiMDBcIixcbiAgICAgIG1pbnV0ZSA9IFwiMDBcIixcbiAgICAgIHNlY29uZCA9IFwiMDBcIixcbiAgICAgIGJhc2VuYW1lLFxuICAgIH0gPSBmaWxlTmFtZVBhcnRzO1xuXG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGRhdGUgPSBwYXJzZURhdGUoXG4gICAgICAgIGAke3llYXJ9LSR7bW9udGh9LSR7ZGF5fSAke2hvdXJ9OiR7bWludXRlfToke3NlY29uZH1gLFxuICAgICAgKTtcblxuICAgICAgcmV0dXJuIFtiYXNlbmFtZSwgZGF0ZV07XG4gICAgfSBjYXRjaCB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgIGBJbnZhbGlkIGRhdGU6ICR7ZmlsZW5hbWV9ICgke3llYXJ9LSR7bW9udGh9LSR7ZGF5fSAke2hvdXJ9OiR7bWludXRlfToke3NlY29uZH0pYCxcbiAgICAgICk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIFtmaWxlbmFtZSwgdW5kZWZpbmVkXTtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxTQUFTLFFBQVEsUUFBUSx5QkFBeUI7QUFFbEQ7OztDQUdDLEdBQ0QsT0FBTyxTQUFTLFdBQ2QsSUFBNEIsRUFDNUIsSUFBWTtFQUVaLE1BQU0sT0FBTyxTQUFTLFlBQ2xCO0lBQUM7SUFBTztJQUFtQjtJQUFZO0lBQU07SUFBZ0I7SUFBTTtHQUFLLEdBQ3hFO0lBQUM7SUFBTztJQUFNO0lBQWdCO0lBQU07R0FBSztFQUU3QyxNQUFNLEVBQUUsTUFBTSxFQUFFLE9BQU8sRUFBRSxHQUFHLElBQUksS0FBSyxPQUFPLENBQUMsT0FBTztJQUFFO0VBQUssR0FBRyxVQUFVO0VBRXhFLElBQUksQ0FBQyxTQUFTO0lBQ1o7RUFDRjtFQUNBLE1BQU0sTUFBTSxJQUFJLGNBQWMsTUFBTSxDQUFDO0VBRXJDLElBQUksS0FBSztJQUNQLE9BQU8sVUFBVSxTQUFTLE9BQU87RUFDbkM7QUFDRjtBQUVBLDBEQUEwRCxHQUMxRCxPQUFPLFNBQVMsVUFBVSxJQUFxQjtFQUM3QyxPQUFPLElBQUksS0FBSyxpQkFBaUIsTUFBTSxpQkFBaUI7QUFDMUQ7QUFFQSxrRUFBa0UsR0FDbEUsT0FBTyxTQUFTLGlCQUNkLElBQXFCLEVBQ3JCLFdBQVcsS0FBSztFQUVoQixJQUFJLE9BQU8sU0FBUyxVQUFVO0lBQzVCLE9BQU8sU0FBUyxPQUFPLENBQUMscUJBQXFCLENBQUMsTUFBTSxrQkFBa0IsQ0FDcEU7RUFFSjtFQUVBLElBQUk7SUFDRixPQUFPLFNBQVMsT0FBTyxDQUFDLElBQUksQ0FBQyxNQUFNLGtCQUFrQixDQUFDO0VBQ3hELEVBQUUsT0FBTTtJQUNOLE9BQU8sU0FBUyxhQUFhLENBQUMsSUFBSSxDQUFDLE1BQU0sZUFBZSxDQUFDO0VBQzNEO0FBQ0Y7QUFFQTs7Ozs7Q0FLQyxHQUNELE9BQU8sU0FBUyxzQkFDZCxRQUFnQjtFQUVoQixNQUFNLGdCQUNKO0VBQ0YsTUFBTSxnQkFBZ0IsY0FBYyxJQUFJLENBQUMsV0FBVztFQUVwRCxJQUFJLGVBQWU7SUFDakIsTUFBTSxFQUNKLElBQUksRUFDSixLQUFLLEVBQ0wsR0FBRyxFQUNILE9BQU8sSUFBSSxFQUNYLFNBQVMsSUFBSSxFQUNiLFNBQVMsSUFBSSxFQUNiLFFBQVEsRUFDVCxHQUFHO0lBRUosSUFBSTtNQUNGLE1BQU0sT0FBTyxVQUNYLENBQUMsRUFBRSxLQUFLLENBQUMsRUFBRSxNQUFNLENBQUMsRUFBRSxJQUFJLENBQUMsRUFBRSxLQUFLLENBQUMsRUFBRSxPQUFPLENBQUMsRUFBRSxPQUFPLENBQUM7TUFHdkQsT0FBTztRQUFDO1FBQVU7T0FBSztJQUN6QixFQUFFLE9BQU07TUFDTixNQUFNLElBQUksTUFDUixDQUFDLGNBQWMsRUFBRSxTQUFTLEVBQUUsRUFBRSxLQUFLLENBQUMsRUFBRSxNQUFNLENBQUMsRUFBRSxJQUFJLENBQUMsRUFBRSxLQUFLLENBQUMsRUFBRSxPQUFPLENBQUMsRUFBRSxPQUFPLENBQUMsQ0FBQztJQUVyRjtFQUNGO0VBRUEsT0FBTztJQUFDO0lBQVU7R0FBVTtBQUM5QiJ9