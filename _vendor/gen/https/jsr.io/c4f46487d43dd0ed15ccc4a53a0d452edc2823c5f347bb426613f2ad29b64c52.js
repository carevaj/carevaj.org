// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
const encoder = new TextEncoder();
function getTypeName(value) {
  const type = typeof value;
  if (type !== "object") {
    return type;
  } else if (value === null) {
    return "null";
  } else {
    return value?.constructor?.name ?? "object";
  }
}
export function validateBinaryLike(source) {
  if (typeof source === "string") {
    return encoder.encode(source);
  } else if (source instanceof Uint8Array) {
    return source;
  } else if (source instanceof ArrayBuffer) {
    return new Uint8Array(source);
  }
  throw new TypeError(`The input must be a Uint8Array, a string, or an ArrayBuffer. Received a value of the type ${getTypeName(source)}.`);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0BzdGQvZW5jb2RpbmcvMC4yMjQuMS9fdXRpbC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDI0IHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuXG5jb25zdCBlbmNvZGVyID0gbmV3IFRleHRFbmNvZGVyKCk7XG5cbmZ1bmN0aW9uIGdldFR5cGVOYW1lKHZhbHVlOiB1bmtub3duKTogc3RyaW5nIHtcbiAgY29uc3QgdHlwZSA9IHR5cGVvZiB2YWx1ZTtcbiAgaWYgKHR5cGUgIT09IFwib2JqZWN0XCIpIHtcbiAgICByZXR1cm4gdHlwZTtcbiAgfSBlbHNlIGlmICh2YWx1ZSA9PT0gbnVsbCkge1xuICAgIHJldHVybiBcIm51bGxcIjtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gdmFsdWU/LmNvbnN0cnVjdG9yPy5uYW1lID8/IFwib2JqZWN0XCI7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHZhbGlkYXRlQmluYXJ5TGlrZShzb3VyY2U6IHVua25vd24pOiBVaW50OEFycmF5IHtcbiAgaWYgKHR5cGVvZiBzb3VyY2UgPT09IFwic3RyaW5nXCIpIHtcbiAgICByZXR1cm4gZW5jb2Rlci5lbmNvZGUoc291cmNlKTtcbiAgfSBlbHNlIGlmIChzb3VyY2UgaW5zdGFuY2VvZiBVaW50OEFycmF5KSB7XG4gICAgcmV0dXJuIHNvdXJjZTtcbiAgfSBlbHNlIGlmIChzb3VyY2UgaW5zdGFuY2VvZiBBcnJheUJ1ZmZlcikge1xuICAgIHJldHVybiBuZXcgVWludDhBcnJheShzb3VyY2UpO1xuICB9XG4gIHRocm93IG5ldyBUeXBlRXJyb3IoXG4gICAgYFRoZSBpbnB1dCBtdXN0IGJlIGEgVWludDhBcnJheSwgYSBzdHJpbmcsIG9yIGFuIEFycmF5QnVmZmVyLiBSZWNlaXZlZCBhIHZhbHVlIG9mIHRoZSB0eXBlICR7XG4gICAgICBnZXRUeXBlTmFtZShzb3VyY2UpXG4gICAgfS5gLFxuICApO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLDBFQUEwRTtBQUUxRSxNQUFNLFVBQVUsSUFBSTtBQUVwQixTQUFTLFlBQVksS0FBYztFQUNqQyxNQUFNLE9BQU8sT0FBTztFQUNwQixJQUFJLFNBQVMsVUFBVTtJQUNyQixPQUFPO0VBQ1QsT0FBTyxJQUFJLFVBQVUsTUFBTTtJQUN6QixPQUFPO0VBQ1QsT0FBTztJQUNMLE9BQU8sT0FBTyxhQUFhLFFBQVE7RUFDckM7QUFDRjtBQUVBLE9BQU8sU0FBUyxtQkFBbUIsTUFBZTtFQUNoRCxJQUFJLE9BQU8sV0FBVyxVQUFVO0lBQzlCLE9BQU8sUUFBUSxNQUFNLENBQUM7RUFDeEIsT0FBTyxJQUFJLGtCQUFrQixZQUFZO0lBQ3ZDLE9BQU87RUFDVCxPQUFPLElBQUksa0JBQWtCLGFBQWE7SUFDeEMsT0FBTyxJQUFJLFdBQVc7RUFDeEI7RUFDQSxNQUFNLElBQUksVUFDUixDQUFDLDBGQUEwRixFQUN6RixZQUFZLFFBQ2IsQ0FBQyxDQUFDO0FBRVAifQ==