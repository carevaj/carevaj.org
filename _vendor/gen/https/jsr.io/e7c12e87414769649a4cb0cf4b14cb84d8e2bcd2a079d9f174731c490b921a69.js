// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
/**
 * Contains the {@linkcode STATUS_CODE} object which contains standard HTTP
 * status codes and provides several type guards for handling status codes
 * with type safety.
 *
 * @example
 * ```ts
 * import {
 *   STATUS_CODE,
 *   STATUS_TEXT,
 * } from "@std/http/status";
 *
 * console.log(STATUS_CODE.NotFound); // Returns 404
 * console.log(STATUS_TEXT[STATUS_CODE.NotFound]); // Returns "Not Found"
 * ```
 *
 * @example
 * ```ts
 * import { isErrorStatus } from "@std/http/status";
 *
 * const res = await fetch("https://example.com/");
 *
 * if (isErrorStatus(res.status)) {
 *   // error handling here...
 * }
 * ```
 *
 * @module
 */ export const STATUS_CODE = {
  /** RFC 7231, 6.2.1 */ Continue: 100,
  /** RFC 7231, 6.2.2 */ SwitchingProtocols: 101,
  /** RFC 2518, 10.1 */ Processing: 102,
  /** RFC 8297 **/ EarlyHints: 103,
  /** RFC 7231, 6.3.1 */ OK: 200,
  /** RFC 7231, 6.3.2 */ Created: 201,
  /** RFC 7231, 6.3.3 */ Accepted: 202,
  /** RFC 7231, 6.3.4 */ NonAuthoritativeInfo: 203,
  /** RFC 7231, 6.3.5 */ NoContent: 204,
  /** RFC 7231, 6.3.6 */ ResetContent: 205,
  /** RFC 7233, 4.1 */ PartialContent: 206,
  /** RFC 4918, 11.1 */ MultiStatus: 207,
  /** RFC 5842, 7.1 */ AlreadyReported: 208,
  /** RFC 3229, 10.4.1 */ IMUsed: 226,
  /** RFC 7231, 6.4.1 */ MultipleChoices: 300,
  /** RFC 7231, 6.4.2 */ MovedPermanently: 301,
  /** RFC 7231, 6.4.3 */ Found: 302,
  /** RFC 7231, 6.4.4 */ SeeOther: 303,
  /** RFC 7232, 4.1 */ NotModified: 304,
  /** RFC 7231, 6.4.5 */ UseProxy: 305,
  /** RFC 7231, 6.4.7 */ TemporaryRedirect: 307,
  /** RFC 7538, 3 */ PermanentRedirect: 308,
  /** RFC 7231, 6.5.1 */ BadRequest: 400,
  /** RFC 7235, 3.1 */ Unauthorized: 401,
  /** RFC 7231, 6.5.2 */ PaymentRequired: 402,
  /** RFC 7231, 6.5.3 */ Forbidden: 403,
  /** RFC 7231, 6.5.4 */ NotFound: 404,
  /** RFC 7231, 6.5.5 */ MethodNotAllowed: 405,
  /** RFC 7231, 6.5.6 */ NotAcceptable: 406,
  /** RFC 7235, 3.2 */ ProxyAuthRequired: 407,
  /** RFC 7231, 6.5.7 */ RequestTimeout: 408,
  /** RFC 7231, 6.5.8 */ Conflict: 409,
  /** RFC 7231, 6.5.9 */ Gone: 410,
  /** RFC 7231, 6.5.10 */ LengthRequired: 411,
  /** RFC 7232, 4.2 */ PreconditionFailed: 412,
  /** RFC 7231, 6.5.11 */ ContentTooLarge: 413,
  /** RFC 7231, 6.5.12 */ URITooLong: 414,
  /** RFC 7231, 6.5.13 */ UnsupportedMediaType: 415,
  /** RFC 7233, 4.4 */ RangeNotSatisfiable: 416,
  /** RFC 7231, 6.5.14 */ ExpectationFailed: 417,
  /** RFC 7168, 2.3.3 */ Teapot: 418,
  /** RFC 7540, 9.1.2 */ MisdirectedRequest: 421,
  /** RFC 4918, 11.2 */ UnprocessableEntity: 422,
  /** RFC 4918, 11.3 */ Locked: 423,
  /** RFC 4918, 11.4 */ FailedDependency: 424,
  /** RFC 8470, 5.2 */ TooEarly: 425,
  /** RFC 7231, 6.5.15 */ UpgradeRequired: 426,
  /** RFC 6585, 3 */ PreconditionRequired: 428,
  /** RFC 6585, 4 */ TooManyRequests: 429,
  /** RFC 6585, 5 */ RequestHeaderFieldsTooLarge: 431,
  /** RFC 7725, 3 */ UnavailableForLegalReasons: 451,
  /** RFC 7231, 6.6.1 */ InternalServerError: 500,
  /** RFC 7231, 6.6.2 */ NotImplemented: 501,
  /** RFC 7231, 6.6.3 */ BadGateway: 502,
  /** RFC 7231, 6.6.4 */ ServiceUnavailable: 503,
  /** RFC 7231, 6.6.5 */ GatewayTimeout: 504,
  /** RFC 7231, 6.6.6 */ HTTPVersionNotSupported: 505,
  /** RFC 2295, 8.1 */ VariantAlsoNegotiates: 506,
  /** RFC 4918, 11.5 */ InsufficientStorage: 507,
  /** RFC 5842, 7.2 */ LoopDetected: 508,
  /** RFC 2774, 7 */ NotExtended: 510,
  /** RFC 6585, 6 */ NetworkAuthenticationRequired: 511
};
/** A record of all the status codes text. */ export const STATUS_TEXT = {
  [STATUS_CODE.Accepted]: "Accepted",
  [STATUS_CODE.AlreadyReported]: "Already Reported",
  [STATUS_CODE.BadGateway]: "Bad Gateway",
  [STATUS_CODE.BadRequest]: "Bad Request",
  [STATUS_CODE.Conflict]: "Conflict",
  [STATUS_CODE.Continue]: "Continue",
  [STATUS_CODE.Created]: "Created",
  [STATUS_CODE.EarlyHints]: "Early Hints",
  [STATUS_CODE.ExpectationFailed]: "Expectation Failed",
  [STATUS_CODE.FailedDependency]: "Failed Dependency",
  [STATUS_CODE.Forbidden]: "Forbidden",
  [STATUS_CODE.Found]: "Found",
  [STATUS_CODE.GatewayTimeout]: "Gateway Timeout",
  [STATUS_CODE.Gone]: "Gone",
  [STATUS_CODE.HTTPVersionNotSupported]: "HTTP Version Not Supported",
  [STATUS_CODE.IMUsed]: "IM Used",
  [STATUS_CODE.InsufficientStorage]: "Insufficient Storage",
  [STATUS_CODE.InternalServerError]: "Internal Server Error",
  [STATUS_CODE.LengthRequired]: "Length Required",
  [STATUS_CODE.Locked]: "Locked",
  [STATUS_CODE.LoopDetected]: "Loop Detected",
  [STATUS_CODE.MethodNotAllowed]: "Method Not Allowed",
  [STATUS_CODE.MisdirectedRequest]: "Misdirected Request",
  [STATUS_CODE.MovedPermanently]: "Moved Permanently",
  [STATUS_CODE.MultiStatus]: "Multi Status",
  [STATUS_CODE.MultipleChoices]: "Multiple Choices",
  [STATUS_CODE.NetworkAuthenticationRequired]: "Network Authentication Required",
  [STATUS_CODE.NoContent]: "No Content",
  [STATUS_CODE.NonAuthoritativeInfo]: "Non Authoritative Info",
  [STATUS_CODE.NotAcceptable]: "Not Acceptable",
  [STATUS_CODE.NotExtended]: "Not Extended",
  [STATUS_CODE.NotFound]: "Not Found",
  [STATUS_CODE.NotImplemented]: "Not Implemented",
  [STATUS_CODE.NotModified]: "Not Modified",
  [STATUS_CODE.OK]: "OK",
  [STATUS_CODE.PartialContent]: "Partial Content",
  [STATUS_CODE.PaymentRequired]: "Payment Required",
  [STATUS_CODE.PermanentRedirect]: "Permanent Redirect",
  [STATUS_CODE.PreconditionFailed]: "Precondition Failed",
  [STATUS_CODE.PreconditionRequired]: "Precondition Required",
  [STATUS_CODE.Processing]: "Processing",
  [STATUS_CODE.ProxyAuthRequired]: "Proxy Auth Required",
  [STATUS_CODE.ContentTooLarge]: "Content Too Large",
  [STATUS_CODE.RequestHeaderFieldsTooLarge]: "Request Header Fields Too Large",
  [STATUS_CODE.RequestTimeout]: "Request Timeout",
  [STATUS_CODE.URITooLong]: "URI Too Long",
  [STATUS_CODE.RangeNotSatisfiable]: "Range Not Satisfiable",
  [STATUS_CODE.ResetContent]: "Reset Content",
  [STATUS_CODE.SeeOther]: "See Other",
  [STATUS_CODE.ServiceUnavailable]: "Service Unavailable",
  [STATUS_CODE.SwitchingProtocols]: "Switching Protocols",
  [STATUS_CODE.Teapot]: "I'm a teapot",
  [STATUS_CODE.TemporaryRedirect]: "Temporary Redirect",
  [STATUS_CODE.TooEarly]: "Too Early",
  [STATUS_CODE.TooManyRequests]: "Too Many Requests",
  [STATUS_CODE.Unauthorized]: "Unauthorized",
  [STATUS_CODE.UnavailableForLegalReasons]: "Unavailable For Legal Reasons",
  [STATUS_CODE.UnprocessableEntity]: "Unprocessable Entity",
  [STATUS_CODE.UnsupportedMediaType]: "Unsupported Media Type",
  [STATUS_CODE.UpgradeRequired]: "Upgrade Required",
  [STATUS_CODE.UseProxy]: "Use Proxy",
  [STATUS_CODE.VariantAlsoNegotiates]: "Variant Also Negotiates"
};
/** Returns whether the provided number is a valid HTTP status code. */ export function isStatus(status) {
  return Object.values(STATUS_CODE).includes(status);
}
/** A type guard that determines if the status code is informational. */ export function isInformationalStatus(status) {
  return isStatus(status) && status >= 100 && status < 200;
}
/** A type guard that determines if the status code is successful. */ export function isSuccessfulStatus(status) {
  return isStatus(status) && status >= 200 && status < 300;
}
/** A type guard that determines if the status code is a redirection. */ export function isRedirectStatus(status) {
  return isStatus(status) && status >= 300 && status < 400;
}
/** A type guard that determines if the status code is a client error. */ export function isClientErrorStatus(status) {
  return isStatus(status) && status >= 400 && status < 500;
}
/** A type guard that determines if the status code is a server error. */ export function isServerErrorStatus(status) {
  return isStatus(status) && status >= 500 && status < 600;
}
/** A type guard that determines if the status code is an error. */ export function isErrorStatus(status) {
  return isStatus(status) && status >= 400 && status < 600;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0BzdGQvaHR0cC8wLjIyNC4wL3N0YXR1cy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDI0IHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuLy8gVGhpcyBtb2R1bGUgaXMgYnJvd3NlciBjb21wYXRpYmxlLlxuXG4vKipcbiAqIENvbnRhaW5zIHRoZSB7QGxpbmtjb2RlIFNUQVRVU19DT0RFfSBvYmplY3Qgd2hpY2ggY29udGFpbnMgc3RhbmRhcmQgSFRUUFxuICogc3RhdHVzIGNvZGVzIGFuZCBwcm92aWRlcyBzZXZlcmFsIHR5cGUgZ3VhcmRzIGZvciBoYW5kbGluZyBzdGF0dXMgY29kZXNcbiAqIHdpdGggdHlwZSBzYWZldHkuXG4gKlxuICogQGV4YW1wbGVcbiAqIGBgYHRzXG4gKiBpbXBvcnQge1xuICogICBTVEFUVVNfQ09ERSxcbiAqICAgU1RBVFVTX1RFWFQsXG4gKiB9IGZyb20gXCJAc3RkL2h0dHAvc3RhdHVzXCI7XG4gKlxuICogY29uc29sZS5sb2coU1RBVFVTX0NPREUuTm90Rm91bmQpOyAvLyBSZXR1cm5zIDQwNFxuICogY29uc29sZS5sb2coU1RBVFVTX1RFWFRbU1RBVFVTX0NPREUuTm90Rm91bmRdKTsgLy8gUmV0dXJucyBcIk5vdCBGb3VuZFwiXG4gKiBgYGBcbiAqXG4gKiBAZXhhbXBsZVxuICogYGBgdHNcbiAqIGltcG9ydCB7IGlzRXJyb3JTdGF0dXMgfSBmcm9tIFwiQHN0ZC9odHRwL3N0YXR1c1wiO1xuICpcbiAqIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKFwiaHR0cHM6Ly9leGFtcGxlLmNvbS9cIik7XG4gKlxuICogaWYgKGlzRXJyb3JTdGF0dXMocmVzLnN0YXR1cykpIHtcbiAqICAgLy8gZXJyb3IgaGFuZGxpbmcgaGVyZS4uLlxuICogfVxuICogYGBgXG4gKlxuICogQG1vZHVsZVxuICovXG5cbmV4cG9ydCBjb25zdCBTVEFUVVNfQ09ERSA9IHtcbiAgLyoqIFJGQyA3MjMxLCA2LjIuMSAqL1xuICBDb250aW51ZTogMTAwLFxuICAvKiogUkZDIDcyMzEsIDYuMi4yICovXG4gIFN3aXRjaGluZ1Byb3RvY29sczogMTAxLFxuICAvKiogUkZDIDI1MTgsIDEwLjEgKi9cbiAgUHJvY2Vzc2luZzogMTAyLFxuICAvKiogUkZDIDgyOTcgKiovXG4gIEVhcmx5SGludHM6IDEwMyxcblxuICAvKiogUkZDIDcyMzEsIDYuMy4xICovXG4gIE9LOiAyMDAsXG4gIC8qKiBSRkMgNzIzMSwgNi4zLjIgKi9cbiAgQ3JlYXRlZDogMjAxLFxuICAvKiogUkZDIDcyMzEsIDYuMy4zICovXG4gIEFjY2VwdGVkOiAyMDIsXG4gIC8qKiBSRkMgNzIzMSwgNi4zLjQgKi9cbiAgTm9uQXV0aG9yaXRhdGl2ZUluZm86IDIwMyxcbiAgLyoqIFJGQyA3MjMxLCA2LjMuNSAqL1xuICBOb0NvbnRlbnQ6IDIwNCxcbiAgLyoqIFJGQyA3MjMxLCA2LjMuNiAqL1xuICBSZXNldENvbnRlbnQ6IDIwNSxcbiAgLyoqIFJGQyA3MjMzLCA0LjEgKi9cbiAgUGFydGlhbENvbnRlbnQ6IDIwNixcbiAgLyoqIFJGQyA0OTE4LCAxMS4xICovXG4gIE11bHRpU3RhdHVzOiAyMDcsXG4gIC8qKiBSRkMgNTg0MiwgNy4xICovXG4gIEFscmVhZHlSZXBvcnRlZDogMjA4LFxuICAvKiogUkZDIDMyMjksIDEwLjQuMSAqL1xuICBJTVVzZWQ6IDIyNixcblxuICAvKiogUkZDIDcyMzEsIDYuNC4xICovXG4gIE11bHRpcGxlQ2hvaWNlczogMzAwLFxuICAvKiogUkZDIDcyMzEsIDYuNC4yICovXG4gIE1vdmVkUGVybWFuZW50bHk6IDMwMSxcbiAgLyoqIFJGQyA3MjMxLCA2LjQuMyAqL1xuICBGb3VuZDogMzAyLFxuICAvKiogUkZDIDcyMzEsIDYuNC40ICovXG4gIFNlZU90aGVyOiAzMDMsXG4gIC8qKiBSRkMgNzIzMiwgNC4xICovXG4gIE5vdE1vZGlmaWVkOiAzMDQsXG4gIC8qKiBSRkMgNzIzMSwgNi40LjUgKi9cbiAgVXNlUHJveHk6IDMwNSxcbiAgLyoqIFJGQyA3MjMxLCA2LjQuNyAqL1xuICBUZW1wb3JhcnlSZWRpcmVjdDogMzA3LFxuICAvKiogUkZDIDc1MzgsIDMgKi9cbiAgUGVybWFuZW50UmVkaXJlY3Q6IDMwOCxcblxuICAvKiogUkZDIDcyMzEsIDYuNS4xICovXG4gIEJhZFJlcXVlc3Q6IDQwMCxcbiAgLyoqIFJGQyA3MjM1LCAzLjEgKi9cbiAgVW5hdXRob3JpemVkOiA0MDEsXG4gIC8qKiBSRkMgNzIzMSwgNi41LjIgKi9cbiAgUGF5bWVudFJlcXVpcmVkOiA0MDIsXG4gIC8qKiBSRkMgNzIzMSwgNi41LjMgKi9cbiAgRm9yYmlkZGVuOiA0MDMsXG4gIC8qKiBSRkMgNzIzMSwgNi41LjQgKi9cbiAgTm90Rm91bmQ6IDQwNCxcbiAgLyoqIFJGQyA3MjMxLCA2LjUuNSAqL1xuICBNZXRob2ROb3RBbGxvd2VkOiA0MDUsXG4gIC8qKiBSRkMgNzIzMSwgNi41LjYgKi9cbiAgTm90QWNjZXB0YWJsZTogNDA2LFxuICAvKiogUkZDIDcyMzUsIDMuMiAqL1xuICBQcm94eUF1dGhSZXF1aXJlZDogNDA3LFxuICAvKiogUkZDIDcyMzEsIDYuNS43ICovXG4gIFJlcXVlc3RUaW1lb3V0OiA0MDgsXG4gIC8qKiBSRkMgNzIzMSwgNi41LjggKi9cbiAgQ29uZmxpY3Q6IDQwOSxcbiAgLyoqIFJGQyA3MjMxLCA2LjUuOSAqL1xuICBHb25lOiA0MTAsXG4gIC8qKiBSRkMgNzIzMSwgNi41LjEwICovXG4gIExlbmd0aFJlcXVpcmVkOiA0MTEsXG4gIC8qKiBSRkMgNzIzMiwgNC4yICovXG4gIFByZWNvbmRpdGlvbkZhaWxlZDogNDEyLFxuICAvKiogUkZDIDcyMzEsIDYuNS4xMSAqL1xuICBDb250ZW50VG9vTGFyZ2U6IDQxMyxcbiAgLyoqIFJGQyA3MjMxLCA2LjUuMTIgKi9cbiAgVVJJVG9vTG9uZzogNDE0LFxuICAvKiogUkZDIDcyMzEsIDYuNS4xMyAqL1xuICBVbnN1cHBvcnRlZE1lZGlhVHlwZTogNDE1LFxuICAvKiogUkZDIDcyMzMsIDQuNCAqL1xuICBSYW5nZU5vdFNhdGlzZmlhYmxlOiA0MTYsXG4gIC8qKiBSRkMgNzIzMSwgNi41LjE0ICovXG4gIEV4cGVjdGF0aW9uRmFpbGVkOiA0MTcsXG4gIC8qKiBSRkMgNzE2OCwgMi4zLjMgKi9cbiAgVGVhcG90OiA0MTgsXG4gIC8qKiBSRkMgNzU0MCwgOS4xLjIgKi9cbiAgTWlzZGlyZWN0ZWRSZXF1ZXN0OiA0MjEsXG4gIC8qKiBSRkMgNDkxOCwgMTEuMiAqL1xuICBVbnByb2Nlc3NhYmxlRW50aXR5OiA0MjIsXG4gIC8qKiBSRkMgNDkxOCwgMTEuMyAqL1xuICBMb2NrZWQ6IDQyMyxcbiAgLyoqIFJGQyA0OTE4LCAxMS40ICovXG4gIEZhaWxlZERlcGVuZGVuY3k6IDQyNCxcbiAgLyoqIFJGQyA4NDcwLCA1LjIgKi9cbiAgVG9vRWFybHk6IDQyNSxcbiAgLyoqIFJGQyA3MjMxLCA2LjUuMTUgKi9cbiAgVXBncmFkZVJlcXVpcmVkOiA0MjYsXG4gIC8qKiBSRkMgNjU4NSwgMyAqL1xuICBQcmVjb25kaXRpb25SZXF1aXJlZDogNDI4LFxuICAvKiogUkZDIDY1ODUsIDQgKi9cbiAgVG9vTWFueVJlcXVlc3RzOiA0MjksXG4gIC8qKiBSRkMgNjU4NSwgNSAqL1xuICBSZXF1ZXN0SGVhZGVyRmllbGRzVG9vTGFyZ2U6IDQzMSxcbiAgLyoqIFJGQyA3NzI1LCAzICovXG4gIFVuYXZhaWxhYmxlRm9yTGVnYWxSZWFzb25zOiA0NTEsXG5cbiAgLyoqIFJGQyA3MjMxLCA2LjYuMSAqL1xuICBJbnRlcm5hbFNlcnZlckVycm9yOiA1MDAsXG4gIC8qKiBSRkMgNzIzMSwgNi42LjIgKi9cbiAgTm90SW1wbGVtZW50ZWQ6IDUwMSxcbiAgLyoqIFJGQyA3MjMxLCA2LjYuMyAqL1xuICBCYWRHYXRld2F5OiA1MDIsXG4gIC8qKiBSRkMgNzIzMSwgNi42LjQgKi9cbiAgU2VydmljZVVuYXZhaWxhYmxlOiA1MDMsXG4gIC8qKiBSRkMgNzIzMSwgNi42LjUgKi9cbiAgR2F0ZXdheVRpbWVvdXQ6IDUwNCxcbiAgLyoqIFJGQyA3MjMxLCA2LjYuNiAqL1xuICBIVFRQVmVyc2lvbk5vdFN1cHBvcnRlZDogNTA1LFxuICAvKiogUkZDIDIyOTUsIDguMSAqL1xuICBWYXJpYW50QWxzb05lZ290aWF0ZXM6IDUwNixcbiAgLyoqIFJGQyA0OTE4LCAxMS41ICovXG4gIEluc3VmZmljaWVudFN0b3JhZ2U6IDUwNyxcbiAgLyoqIFJGQyA1ODQyLCA3LjIgKi9cbiAgTG9vcERldGVjdGVkOiA1MDgsXG4gIC8qKiBSRkMgMjc3NCwgNyAqL1xuICBOb3RFeHRlbmRlZDogNTEwLFxuICAvKiogUkZDIDY1ODUsIDYgKi9cbiAgTmV0d29ya0F1dGhlbnRpY2F0aW9uUmVxdWlyZWQ6IDUxMSxcbn0gYXMgY29uc3Q7XG5cbi8qKiBBbiBIVFRQIHN0YXR1cyBjb2RlLiAqL1xuZXhwb3J0IHR5cGUgU3RhdHVzQ29kZSA9IHR5cGVvZiBTVEFUVVNfQ09ERVtrZXlvZiB0eXBlb2YgU1RBVFVTX0NPREVdO1xuXG4vKiogQSByZWNvcmQgb2YgYWxsIHRoZSBzdGF0dXMgY29kZXMgdGV4dC4gKi9cbmV4cG9ydCBjb25zdCBTVEFUVVNfVEVYVCA9IHtcbiAgW1NUQVRVU19DT0RFLkFjY2VwdGVkXTogXCJBY2NlcHRlZFwiLFxuICBbU1RBVFVTX0NPREUuQWxyZWFkeVJlcG9ydGVkXTogXCJBbHJlYWR5IFJlcG9ydGVkXCIsXG4gIFtTVEFUVVNfQ09ERS5CYWRHYXRld2F5XTogXCJCYWQgR2F0ZXdheVwiLFxuICBbU1RBVFVTX0NPREUuQmFkUmVxdWVzdF06IFwiQmFkIFJlcXVlc3RcIixcbiAgW1NUQVRVU19DT0RFLkNvbmZsaWN0XTogXCJDb25mbGljdFwiLFxuICBbU1RBVFVTX0NPREUuQ29udGludWVdOiBcIkNvbnRpbnVlXCIsXG4gIFtTVEFUVVNfQ09ERS5DcmVhdGVkXTogXCJDcmVhdGVkXCIsXG4gIFtTVEFUVVNfQ09ERS5FYXJseUhpbnRzXTogXCJFYXJseSBIaW50c1wiLFxuICBbU1RBVFVTX0NPREUuRXhwZWN0YXRpb25GYWlsZWRdOiBcIkV4cGVjdGF0aW9uIEZhaWxlZFwiLFxuICBbU1RBVFVTX0NPREUuRmFpbGVkRGVwZW5kZW5jeV06IFwiRmFpbGVkIERlcGVuZGVuY3lcIixcbiAgW1NUQVRVU19DT0RFLkZvcmJpZGRlbl06IFwiRm9yYmlkZGVuXCIsXG4gIFtTVEFUVVNfQ09ERS5Gb3VuZF06IFwiRm91bmRcIixcbiAgW1NUQVRVU19DT0RFLkdhdGV3YXlUaW1lb3V0XTogXCJHYXRld2F5IFRpbWVvdXRcIixcbiAgW1NUQVRVU19DT0RFLkdvbmVdOiBcIkdvbmVcIixcbiAgW1NUQVRVU19DT0RFLkhUVFBWZXJzaW9uTm90U3VwcG9ydGVkXTogXCJIVFRQIFZlcnNpb24gTm90IFN1cHBvcnRlZFwiLFxuICBbU1RBVFVTX0NPREUuSU1Vc2VkXTogXCJJTSBVc2VkXCIsXG4gIFtTVEFUVVNfQ09ERS5JbnN1ZmZpY2llbnRTdG9yYWdlXTogXCJJbnN1ZmZpY2llbnQgU3RvcmFnZVwiLFxuICBbU1RBVFVTX0NPREUuSW50ZXJuYWxTZXJ2ZXJFcnJvcl06IFwiSW50ZXJuYWwgU2VydmVyIEVycm9yXCIsXG4gIFtTVEFUVVNfQ09ERS5MZW5ndGhSZXF1aXJlZF06IFwiTGVuZ3RoIFJlcXVpcmVkXCIsXG4gIFtTVEFUVVNfQ09ERS5Mb2NrZWRdOiBcIkxvY2tlZFwiLFxuICBbU1RBVFVTX0NPREUuTG9vcERldGVjdGVkXTogXCJMb29wIERldGVjdGVkXCIsXG4gIFtTVEFUVVNfQ09ERS5NZXRob2ROb3RBbGxvd2VkXTogXCJNZXRob2QgTm90IEFsbG93ZWRcIixcbiAgW1NUQVRVU19DT0RFLk1pc2RpcmVjdGVkUmVxdWVzdF06IFwiTWlzZGlyZWN0ZWQgUmVxdWVzdFwiLFxuICBbU1RBVFVTX0NPREUuTW92ZWRQZXJtYW5lbnRseV06IFwiTW92ZWQgUGVybWFuZW50bHlcIixcbiAgW1NUQVRVU19DT0RFLk11bHRpU3RhdHVzXTogXCJNdWx0aSBTdGF0dXNcIixcbiAgW1NUQVRVU19DT0RFLk11bHRpcGxlQ2hvaWNlc106IFwiTXVsdGlwbGUgQ2hvaWNlc1wiLFxuICBbU1RBVFVTX0NPREUuTmV0d29ya0F1dGhlbnRpY2F0aW9uUmVxdWlyZWRdOlxuICAgIFwiTmV0d29yayBBdXRoZW50aWNhdGlvbiBSZXF1aXJlZFwiLFxuICBbU1RBVFVTX0NPREUuTm9Db250ZW50XTogXCJObyBDb250ZW50XCIsXG4gIFtTVEFUVVNfQ09ERS5Ob25BdXRob3JpdGF0aXZlSW5mb106IFwiTm9uIEF1dGhvcml0YXRpdmUgSW5mb1wiLFxuICBbU1RBVFVTX0NPREUuTm90QWNjZXB0YWJsZV06IFwiTm90IEFjY2VwdGFibGVcIixcbiAgW1NUQVRVU19DT0RFLk5vdEV4dGVuZGVkXTogXCJOb3QgRXh0ZW5kZWRcIixcbiAgW1NUQVRVU19DT0RFLk5vdEZvdW5kXTogXCJOb3QgRm91bmRcIixcbiAgW1NUQVRVU19DT0RFLk5vdEltcGxlbWVudGVkXTogXCJOb3QgSW1wbGVtZW50ZWRcIixcbiAgW1NUQVRVU19DT0RFLk5vdE1vZGlmaWVkXTogXCJOb3QgTW9kaWZpZWRcIixcbiAgW1NUQVRVU19DT0RFLk9LXTogXCJPS1wiLFxuICBbU1RBVFVTX0NPREUuUGFydGlhbENvbnRlbnRdOiBcIlBhcnRpYWwgQ29udGVudFwiLFxuICBbU1RBVFVTX0NPREUuUGF5bWVudFJlcXVpcmVkXTogXCJQYXltZW50IFJlcXVpcmVkXCIsXG4gIFtTVEFUVVNfQ09ERS5QZXJtYW5lbnRSZWRpcmVjdF06IFwiUGVybWFuZW50IFJlZGlyZWN0XCIsXG4gIFtTVEFUVVNfQ09ERS5QcmVjb25kaXRpb25GYWlsZWRdOiBcIlByZWNvbmRpdGlvbiBGYWlsZWRcIixcbiAgW1NUQVRVU19DT0RFLlByZWNvbmRpdGlvblJlcXVpcmVkXTogXCJQcmVjb25kaXRpb24gUmVxdWlyZWRcIixcbiAgW1NUQVRVU19DT0RFLlByb2Nlc3NpbmddOiBcIlByb2Nlc3NpbmdcIixcbiAgW1NUQVRVU19DT0RFLlByb3h5QXV0aFJlcXVpcmVkXTogXCJQcm94eSBBdXRoIFJlcXVpcmVkXCIsXG4gIFtTVEFUVVNfQ09ERS5Db250ZW50VG9vTGFyZ2VdOiBcIkNvbnRlbnQgVG9vIExhcmdlXCIsXG4gIFtTVEFUVVNfQ09ERS5SZXF1ZXN0SGVhZGVyRmllbGRzVG9vTGFyZ2VdOiBcIlJlcXVlc3QgSGVhZGVyIEZpZWxkcyBUb28gTGFyZ2VcIixcbiAgW1NUQVRVU19DT0RFLlJlcXVlc3RUaW1lb3V0XTogXCJSZXF1ZXN0IFRpbWVvdXRcIixcbiAgW1NUQVRVU19DT0RFLlVSSVRvb0xvbmddOiBcIlVSSSBUb28gTG9uZ1wiLFxuICBbU1RBVFVTX0NPREUuUmFuZ2VOb3RTYXRpc2ZpYWJsZV06IFwiUmFuZ2UgTm90IFNhdGlzZmlhYmxlXCIsXG4gIFtTVEFUVVNfQ09ERS5SZXNldENvbnRlbnRdOiBcIlJlc2V0IENvbnRlbnRcIixcbiAgW1NUQVRVU19DT0RFLlNlZU90aGVyXTogXCJTZWUgT3RoZXJcIixcbiAgW1NUQVRVU19DT0RFLlNlcnZpY2VVbmF2YWlsYWJsZV06IFwiU2VydmljZSBVbmF2YWlsYWJsZVwiLFxuICBbU1RBVFVTX0NPREUuU3dpdGNoaW5nUHJvdG9jb2xzXTogXCJTd2l0Y2hpbmcgUHJvdG9jb2xzXCIsXG4gIFtTVEFUVVNfQ09ERS5UZWFwb3RdOiBcIkknbSBhIHRlYXBvdFwiLFxuICBbU1RBVFVTX0NPREUuVGVtcG9yYXJ5UmVkaXJlY3RdOiBcIlRlbXBvcmFyeSBSZWRpcmVjdFwiLFxuICBbU1RBVFVTX0NPREUuVG9vRWFybHldOiBcIlRvbyBFYXJseVwiLFxuICBbU1RBVFVTX0NPREUuVG9vTWFueVJlcXVlc3RzXTogXCJUb28gTWFueSBSZXF1ZXN0c1wiLFxuICBbU1RBVFVTX0NPREUuVW5hdXRob3JpemVkXTogXCJVbmF1dGhvcml6ZWRcIixcbiAgW1NUQVRVU19DT0RFLlVuYXZhaWxhYmxlRm9yTGVnYWxSZWFzb25zXTogXCJVbmF2YWlsYWJsZSBGb3IgTGVnYWwgUmVhc29uc1wiLFxuICBbU1RBVFVTX0NPREUuVW5wcm9jZXNzYWJsZUVudGl0eV06IFwiVW5wcm9jZXNzYWJsZSBFbnRpdHlcIixcbiAgW1NUQVRVU19DT0RFLlVuc3VwcG9ydGVkTWVkaWFUeXBlXTogXCJVbnN1cHBvcnRlZCBNZWRpYSBUeXBlXCIsXG4gIFtTVEFUVVNfQ09ERS5VcGdyYWRlUmVxdWlyZWRdOiBcIlVwZ3JhZGUgUmVxdWlyZWRcIixcbiAgW1NUQVRVU19DT0RFLlVzZVByb3h5XTogXCJVc2UgUHJveHlcIixcbiAgW1NUQVRVU19DT0RFLlZhcmlhbnRBbHNvTmVnb3RpYXRlc106IFwiVmFyaWFudCBBbHNvIE5lZ290aWF0ZXNcIixcbn0gYXMgY29uc3Q7XG5cbi8qKiBBbiBIVFRQIHN0YXR1cyB0ZXh0LiAqL1xuZXhwb3J0IHR5cGUgU3RhdHVzVGV4dCA9IHR5cGVvZiBTVEFUVVNfVEVYVFtrZXlvZiB0eXBlb2YgU1RBVFVTX1RFWFRdO1xuXG4vKiogQW4gSFRUUCBzdGF0dXMgdGhhdCBpcyBhIGluZm9ybWF0aW9uYWwgKDFYWCkuICovXG5leHBvcnQgdHlwZSBJbmZvcm1hdGlvbmFsU3RhdHVzID1cbiAgfCB0eXBlb2YgU1RBVFVTX0NPREUuQ29udGludWVcbiAgfCB0eXBlb2YgU1RBVFVTX0NPREUuU3dpdGNoaW5nUHJvdG9jb2xzXG4gIHwgdHlwZW9mIFNUQVRVU19DT0RFLlByb2Nlc3NpbmdcbiAgfCB0eXBlb2YgU1RBVFVTX0NPREUuRWFybHlIaW50cztcblxuLyoqIEFuIEhUVFAgc3RhdHVzIHRoYXQgaXMgYSBzdWNjZXNzICgyWFgpLiAqL1xuZXhwb3J0IHR5cGUgU3VjY2Vzc2Z1bFN0YXR1cyA9XG4gIHwgdHlwZW9mIFNUQVRVU19DT0RFLk9LXG4gIHwgdHlwZW9mIFNUQVRVU19DT0RFLkNyZWF0ZWRcbiAgfCB0eXBlb2YgU1RBVFVTX0NPREUuQWNjZXB0ZWRcbiAgfCB0eXBlb2YgU1RBVFVTX0NPREUuTm9uQXV0aG9yaXRhdGl2ZUluZm9cbiAgfCB0eXBlb2YgU1RBVFVTX0NPREUuTm9Db250ZW50XG4gIHwgdHlwZW9mIFNUQVRVU19DT0RFLlJlc2V0Q29udGVudFxuICB8IHR5cGVvZiBTVEFUVVNfQ09ERS5QYXJ0aWFsQ29udGVudFxuICB8IHR5cGVvZiBTVEFUVVNfQ09ERS5NdWx0aVN0YXR1c1xuICB8IHR5cGVvZiBTVEFUVVNfQ09ERS5BbHJlYWR5UmVwb3J0ZWRcbiAgfCB0eXBlb2YgU1RBVFVTX0NPREUuSU1Vc2VkO1xuXG4vKiogQW4gSFRUUCBzdGF0dXMgdGhhdCBpcyBhIHJlZGlyZWN0ICgzWFgpLiAqL1xuZXhwb3J0IHR5cGUgUmVkaXJlY3RTdGF0dXMgPVxuICB8IHR5cGVvZiBTVEFUVVNfQ09ERS5NdWx0aXBsZUNob2ljZXMgLy8gMzAwXG4gIHwgdHlwZW9mIFNUQVRVU19DT0RFLk1vdmVkUGVybWFuZW50bHkgLy8gMzAxXG4gIHwgdHlwZW9mIFNUQVRVU19DT0RFLkZvdW5kIC8vIDMwMlxuICB8IHR5cGVvZiBTVEFUVVNfQ09ERS5TZWVPdGhlciAvLyAzMDNcbiAgfCB0eXBlb2YgU1RBVFVTX0NPREUuVXNlUHJveHkgLy8gMzA1IC0gREVQUkVDQVRFRFxuICB8IHR5cGVvZiBTVEFUVVNfQ09ERS5UZW1wb3JhcnlSZWRpcmVjdCAvLyAzMDdcbiAgfCB0eXBlb2YgU1RBVFVTX0NPREUuUGVybWFuZW50UmVkaXJlY3Q7IC8vIDMwOFxuXG4vKiogQW4gSFRUUCBzdGF0dXMgdGhhdCBpcyBhIGNsaWVudCBlcnJvciAoNFhYKS4gKi9cbmV4cG9ydCB0eXBlIENsaWVudEVycm9yU3RhdHVzID1cbiAgfCB0eXBlb2YgU1RBVFVTX0NPREUuQmFkUmVxdWVzdFxuICB8IHR5cGVvZiBTVEFUVVNfQ09ERS5VbmF1dGhvcml6ZWRcbiAgfCB0eXBlb2YgU1RBVFVTX0NPREUuUGF5bWVudFJlcXVpcmVkXG4gIHwgdHlwZW9mIFNUQVRVU19DT0RFLkZvcmJpZGRlblxuICB8IHR5cGVvZiBTVEFUVVNfQ09ERS5Ob3RGb3VuZFxuICB8IHR5cGVvZiBTVEFUVVNfQ09ERS5NZXRob2ROb3RBbGxvd2VkXG4gIHwgdHlwZW9mIFNUQVRVU19DT0RFLk5vdEFjY2VwdGFibGVcbiAgfCB0eXBlb2YgU1RBVFVTX0NPREUuUHJveHlBdXRoUmVxdWlyZWRcbiAgfCB0eXBlb2YgU1RBVFVTX0NPREUuUmVxdWVzdFRpbWVvdXRcbiAgfCB0eXBlb2YgU1RBVFVTX0NPREUuQ29uZmxpY3RcbiAgfCB0eXBlb2YgU1RBVFVTX0NPREUuR29uZVxuICB8IHR5cGVvZiBTVEFUVVNfQ09ERS5MZW5ndGhSZXF1aXJlZFxuICB8IHR5cGVvZiBTVEFUVVNfQ09ERS5QcmVjb25kaXRpb25GYWlsZWRcbiAgfCB0eXBlb2YgU1RBVFVTX0NPREUuQ29udGVudFRvb0xhcmdlXG4gIHwgdHlwZW9mIFNUQVRVU19DT0RFLlVSSVRvb0xvbmdcbiAgfCB0eXBlb2YgU1RBVFVTX0NPREUuVW5zdXBwb3J0ZWRNZWRpYVR5cGVcbiAgfCB0eXBlb2YgU1RBVFVTX0NPREUuUmFuZ2VOb3RTYXRpc2ZpYWJsZVxuICB8IHR5cGVvZiBTVEFUVVNfQ09ERS5FeHBlY3RhdGlvbkZhaWxlZFxuICB8IHR5cGVvZiBTVEFUVVNfQ09ERS5UZWFwb3RcbiAgfCB0eXBlb2YgU1RBVFVTX0NPREUuTWlzZGlyZWN0ZWRSZXF1ZXN0XG4gIHwgdHlwZW9mIFNUQVRVU19DT0RFLlVucHJvY2Vzc2FibGVFbnRpdHlcbiAgfCB0eXBlb2YgU1RBVFVTX0NPREUuTG9ja2VkXG4gIHwgdHlwZW9mIFNUQVRVU19DT0RFLkZhaWxlZERlcGVuZGVuY3lcbiAgfCB0eXBlb2YgU1RBVFVTX0NPREUuVXBncmFkZVJlcXVpcmVkXG4gIHwgdHlwZW9mIFNUQVRVU19DT0RFLlByZWNvbmRpdGlvblJlcXVpcmVkXG4gIHwgdHlwZW9mIFNUQVRVU19DT0RFLlRvb01hbnlSZXF1ZXN0c1xuICB8IHR5cGVvZiBTVEFUVVNfQ09ERS5SZXF1ZXN0SGVhZGVyRmllbGRzVG9vTGFyZ2VcbiAgfCB0eXBlb2YgU1RBVFVTX0NPREUuVW5hdmFpbGFibGVGb3JMZWdhbFJlYXNvbnM7XG5cbi8qKiBBbiBIVFRQIHN0YXR1cyB0aGF0IGlzIGEgc2VydmVyIGVycm9yICg1WFgpLiAqL1xuZXhwb3J0IHR5cGUgU2VydmVyRXJyb3JTdGF0dXMgPVxuICB8IHR5cGVvZiBTVEFUVVNfQ09ERS5JbnRlcm5hbFNlcnZlckVycm9yXG4gIHwgdHlwZW9mIFNUQVRVU19DT0RFLk5vdEltcGxlbWVudGVkXG4gIHwgdHlwZW9mIFNUQVRVU19DT0RFLkJhZEdhdGV3YXlcbiAgfCB0eXBlb2YgU1RBVFVTX0NPREUuU2VydmljZVVuYXZhaWxhYmxlXG4gIHwgdHlwZW9mIFNUQVRVU19DT0RFLkdhdGV3YXlUaW1lb3V0XG4gIHwgdHlwZW9mIFNUQVRVU19DT0RFLkhUVFBWZXJzaW9uTm90U3VwcG9ydGVkXG4gIHwgdHlwZW9mIFNUQVRVU19DT0RFLlZhcmlhbnRBbHNvTmVnb3RpYXRlc1xuICB8IHR5cGVvZiBTVEFUVVNfQ09ERS5JbnN1ZmZpY2llbnRTdG9yYWdlXG4gIHwgdHlwZW9mIFNUQVRVU19DT0RFLkxvb3BEZXRlY3RlZFxuICB8IHR5cGVvZiBTVEFUVVNfQ09ERS5Ob3RFeHRlbmRlZFxuICB8IHR5cGVvZiBTVEFUVVNfQ09ERS5OZXR3b3JrQXV0aGVudGljYXRpb25SZXF1aXJlZDtcblxuLyoqIEFuIEhUVFAgc3RhdHVzIHRoYXQgaXMgYW4gZXJyb3IgKDRYWCBhbmQgNVhYKS4gKi9cbmV4cG9ydCB0eXBlIEVycm9yU3RhdHVzID0gQ2xpZW50RXJyb3JTdGF0dXMgfCBTZXJ2ZXJFcnJvclN0YXR1cztcblxuLyoqIFJldHVybnMgd2hldGhlciB0aGUgcHJvdmlkZWQgbnVtYmVyIGlzIGEgdmFsaWQgSFRUUCBzdGF0dXMgY29kZS4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpc1N0YXR1cyhzdGF0dXM6IG51bWJlcik6IHN0YXR1cyBpcyBTdGF0dXNDb2RlIHtcbiAgcmV0dXJuIE9iamVjdC52YWx1ZXMoU1RBVFVTX0NPREUpLmluY2x1ZGVzKHN0YXR1cyBhcyBTdGF0dXNDb2RlKTtcbn1cblxuLyoqIEEgdHlwZSBndWFyZCB0aGF0IGRldGVybWluZXMgaWYgdGhlIHN0YXR1cyBjb2RlIGlzIGluZm9ybWF0aW9uYWwuICovXG5leHBvcnQgZnVuY3Rpb24gaXNJbmZvcm1hdGlvbmFsU3RhdHVzKFxuICBzdGF0dXM6IG51bWJlcixcbik6IHN0YXR1cyBpcyBJbmZvcm1hdGlvbmFsU3RhdHVzIHtcbiAgcmV0dXJuIGlzU3RhdHVzKHN0YXR1cykgJiYgc3RhdHVzID49IDEwMCAmJiBzdGF0dXMgPCAyMDA7XG59XG5cbi8qKiBBIHR5cGUgZ3VhcmQgdGhhdCBkZXRlcm1pbmVzIGlmIHRoZSBzdGF0dXMgY29kZSBpcyBzdWNjZXNzZnVsLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzU3VjY2Vzc2Z1bFN0YXR1cyhcbiAgc3RhdHVzOiBudW1iZXIsXG4pOiBzdGF0dXMgaXMgU3VjY2Vzc2Z1bFN0YXR1cyB7XG4gIHJldHVybiBpc1N0YXR1cyhzdGF0dXMpICYmIHN0YXR1cyA+PSAyMDAgJiYgc3RhdHVzIDwgMzAwO1xufVxuXG4vKiogQSB0eXBlIGd1YXJkIHRoYXQgZGV0ZXJtaW5lcyBpZiB0aGUgc3RhdHVzIGNvZGUgaXMgYSByZWRpcmVjdGlvbi4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpc1JlZGlyZWN0U3RhdHVzKHN0YXR1czogbnVtYmVyKTogc3RhdHVzIGlzIFJlZGlyZWN0U3RhdHVzIHtcbiAgcmV0dXJuIGlzU3RhdHVzKHN0YXR1cykgJiYgc3RhdHVzID49IDMwMCAmJiBzdGF0dXMgPCA0MDA7XG59XG5cbi8qKiBBIHR5cGUgZ3VhcmQgdGhhdCBkZXRlcm1pbmVzIGlmIHRoZSBzdGF0dXMgY29kZSBpcyBhIGNsaWVudCBlcnJvci4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpc0NsaWVudEVycm9yU3RhdHVzKFxuICBzdGF0dXM6IG51bWJlcixcbik6IHN0YXR1cyBpcyBDbGllbnRFcnJvclN0YXR1cyB7XG4gIHJldHVybiBpc1N0YXR1cyhzdGF0dXMpICYmIHN0YXR1cyA+PSA0MDAgJiYgc3RhdHVzIDwgNTAwO1xufVxuXG4vKiogQSB0eXBlIGd1YXJkIHRoYXQgZGV0ZXJtaW5lcyBpZiB0aGUgc3RhdHVzIGNvZGUgaXMgYSBzZXJ2ZXIgZXJyb3IuICovXG5leHBvcnQgZnVuY3Rpb24gaXNTZXJ2ZXJFcnJvclN0YXR1cyhcbiAgc3RhdHVzOiBudW1iZXIsXG4pOiBzdGF0dXMgaXMgU2VydmVyRXJyb3JTdGF0dXMge1xuICByZXR1cm4gaXNTdGF0dXMoc3RhdHVzKSAmJiBzdGF0dXMgPj0gNTAwICYmIHN0YXR1cyA8IDYwMDtcbn1cblxuLyoqIEEgdHlwZSBndWFyZCB0aGF0IGRldGVybWluZXMgaWYgdGhlIHN0YXR1cyBjb2RlIGlzIGFuIGVycm9yLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzRXJyb3JTdGF0dXMoc3RhdHVzOiBudW1iZXIpOiBzdGF0dXMgaXMgRXJyb3JTdGF0dXMge1xuICByZXR1cm4gaXNTdGF0dXMoc3RhdHVzKSAmJiBzdGF0dXMgPj0gNDAwICYmIHN0YXR1cyA8IDYwMDtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSwwRUFBMEU7QUFDMUUscUNBQXFDO0FBRXJDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0NBNEJDLEdBRUQsT0FBTyxNQUFNLGNBQWM7RUFDekIsb0JBQW9CLEdBQ3BCLFVBQVU7RUFDVixvQkFBb0IsR0FDcEIsb0JBQW9CO0VBQ3BCLG1CQUFtQixHQUNuQixZQUFZO0VBQ1osY0FBYyxHQUNkLFlBQVk7RUFFWixvQkFBb0IsR0FDcEIsSUFBSTtFQUNKLG9CQUFvQixHQUNwQixTQUFTO0VBQ1Qsb0JBQW9CLEdBQ3BCLFVBQVU7RUFDVixvQkFBb0IsR0FDcEIsc0JBQXNCO0VBQ3RCLG9CQUFvQixHQUNwQixXQUFXO0VBQ1gsb0JBQW9CLEdBQ3BCLGNBQWM7RUFDZCxrQkFBa0IsR0FDbEIsZ0JBQWdCO0VBQ2hCLG1CQUFtQixHQUNuQixhQUFhO0VBQ2Isa0JBQWtCLEdBQ2xCLGlCQUFpQjtFQUNqQixxQkFBcUIsR0FDckIsUUFBUTtFQUVSLG9CQUFvQixHQUNwQixpQkFBaUI7RUFDakIsb0JBQW9C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