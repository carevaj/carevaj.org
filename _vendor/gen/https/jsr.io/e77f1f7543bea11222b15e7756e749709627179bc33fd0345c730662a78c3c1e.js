// Ported from js-yaml v3.13.1:
// https://github.com/nodeca/js-yaml/commit/665aadda42349dcae869f12040d9b10ef18d12da
// Copyright 2011-2015 by Vitaly Puzrin. All rights reserved. MIT license.
// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
import { dump } from "./_dumper/dumper.ts";
/**
 * Serializes `data` as a YAML document.
 *
 * You can disable exceptions by setting the skipInvalid option to true.
 */ export function stringify(data, options) {
  return dump(data, options);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0BzdGQveWFtbC8wLjIyNC4wL3N0cmluZ2lmeS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBQb3J0ZWQgZnJvbSBqcy15YW1sIHYzLjEzLjE6XG4vLyBodHRwczovL2dpdGh1Yi5jb20vbm9kZWNhL2pzLXlhbWwvY29tbWl0LzY2NWFhZGRhNDIzNDlkY2FlODY5ZjEyMDQwZDliMTBlZjE4ZDEyZGFcbi8vIENvcHlyaWdodCAyMDExLTIwMTUgYnkgVml0YWx5IFB1enJpbi4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gTUlUIGxpY2Vuc2UuXG4vLyBDb3B5cmlnaHQgMjAxOC0yMDI0IHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuLy8gVGhpcyBtb2R1bGUgaXMgYnJvd3NlciBjb21wYXRpYmxlLlxuXG5pbXBvcnQgeyBkdW1wIH0gZnJvbSBcIi4vX2R1bXBlci9kdW1wZXIudHNcIjtcbmltcG9ydCB0eXBlIHsgRHVtcGVyU3RhdGVPcHRpb25zIH0gZnJvbSBcIi4vX2R1bXBlci9kdW1wZXJfc3RhdGUudHNcIjtcblxuZXhwb3J0IHR5cGUgRHVtcE9wdGlvbnMgPSBEdW1wZXJTdGF0ZU9wdGlvbnM7XG5cbi8qKlxuICogU2VyaWFsaXplcyBgZGF0YWAgYXMgYSBZQU1MIGRvY3VtZW50LlxuICpcbiAqIFlvdSBjYW4gZGlzYWJsZSBleGNlcHRpb25zIGJ5IHNldHRpbmcgdGhlIHNraXBJbnZhbGlkIG9wdGlvbiB0byB0cnVlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gc3RyaW5naWZ5KFxuICBkYXRhOiB1bmtub3duLFxuICBvcHRpb25zPzogRHVtcE9wdGlvbnMsXG4pOiBzdHJpbmcge1xuICByZXR1cm4gZHVtcChkYXRhLCBvcHRpb25zKTtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSwrQkFBK0I7QUFDL0Isb0ZBQW9GO0FBQ3BGLDBFQUEwRTtBQUMxRSwwRUFBMEU7QUFDMUUscUNBQXFDO0FBRXJDLFNBQVMsSUFBSSxRQUFRLHNCQUFzQjtBQUszQzs7OztDQUlDLEdBQ0QsT0FBTyxTQUFTLFVBQ2QsSUFBYSxFQUNiLE9BQXFCO0VBRXJCLE9BQU8sS0FBSyxNQUFNO0FBQ3BCIn0=