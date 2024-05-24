// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// Copyright the Browserify authors. MIT License.
import { fromFileUrl } from "jsr:/@std/path@^0.225.1/from-file-url";
/**
 * Convert a URL or string to a path
 * @param pathUrl A URL or string to be converted
 */ export function toPathString(pathUrl) {
  return pathUrl instanceof URL ? fromFileUrl(pathUrl) : pathUrl;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0BzdGQvZnMvMC4yMjkuMS9fdG9fcGF0aF9zdHJpbmcudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgtMjAyNCB0aGUgRGVubyBhdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLiBNSVQgbGljZW5zZS5cbi8vIENvcHlyaWdodCB0aGUgQnJvd3NlcmlmeSBhdXRob3JzLiBNSVQgTGljZW5zZS5cblxuaW1wb3J0IHsgZnJvbUZpbGVVcmwgfSBmcm9tIFwianNyOi9Ac3RkL3BhdGhAXjAuMjI1LjEvZnJvbS1maWxlLXVybFwiO1xuXG4vKipcbiAqIENvbnZlcnQgYSBVUkwgb3Igc3RyaW5nIHRvIGEgcGF0aFxuICogQHBhcmFtIHBhdGhVcmwgQSBVUkwgb3Igc3RyaW5nIHRvIGJlIGNvbnZlcnRlZFxuICovXG5leHBvcnQgZnVuY3Rpb24gdG9QYXRoU3RyaW5nKFxuICBwYXRoVXJsOiBzdHJpbmcgfCBVUkwsXG4pOiBzdHJpbmcge1xuICByZXR1cm4gcGF0aFVybCBpbnN0YW5jZW9mIFVSTCA/IGZyb21GaWxlVXJsKHBhdGhVcmwpIDogcGF0aFVybDtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSwwRUFBMEU7QUFDMUUsaURBQWlEO0FBRWpELFNBQVMsV0FBVyxRQUFRLHdDQUF3QztBQUVwRTs7O0NBR0MsR0FDRCxPQUFPLFNBQVMsYUFDZCxPQUFxQjtFQUVyQixPQUFPLG1CQUFtQixNQUFNLFlBQVksV0FBVztBQUN6RCJ9