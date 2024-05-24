// Ported from js-yaml v3.13.1:
// https://github.com/nodeca/js-yaml/commit/665aadda42349dcae869f12040d9b10ef18d12da
// Copyright 2011-2015 by Vitaly Puzrin. All rights reserved. MIT license.
// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import { Type } from "../type.ts";
export const map = new Type("tag:yaml.org,2002:map", {
  construct (data) {
    return data !== null ? data : {};
  },
  kind: "mapping"
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0BzdGQveWFtbC8wLjIyNC4wL190eXBlL21hcC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBQb3J0ZWQgZnJvbSBqcy15YW1sIHYzLjEzLjE6XG4vLyBodHRwczovL2dpdGh1Yi5jb20vbm9kZWNhL2pzLXlhbWwvY29tbWl0LzY2NWFhZGRhNDIzNDlkY2FlODY5ZjEyMDQwZDliMTBlZjE4ZDEyZGFcbi8vIENvcHlyaWdodCAyMDExLTIwMTUgYnkgVml0YWx5IFB1enJpbi4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gTUlUIGxpY2Vuc2UuXG4vLyBDb3B5cmlnaHQgMjAxOC0yMDI0IHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuXG5pbXBvcnQgeyBUeXBlIH0gZnJvbSBcIi4uL3R5cGUudHNcIjtcbmltcG9ydCB0eXBlIHsgQW55IH0gZnJvbSBcIi4uL191dGlscy50c1wiO1xuXG5leHBvcnQgY29uc3QgbWFwID0gbmV3IFR5cGUoXCJ0YWc6eWFtbC5vcmcsMjAwMjptYXBcIiwge1xuICBjb25zdHJ1Y3QoZGF0YSk6IEFueSB7XG4gICAgcmV0dXJuIGRhdGEgIT09IG51bGwgPyBkYXRhIDoge307XG4gIH0sXG4gIGtpbmQ6IFwibWFwcGluZ1wiLFxufSk7XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsK0JBQStCO0FBQy9CLG9GQUFvRjtBQUNwRiwwRUFBMEU7QUFDMUUsMEVBQTBFO0FBRTFFLFNBQVMsSUFBSSxRQUFRLGFBQWE7QUFHbEMsT0FBTyxNQUFNLE1BQU0sSUFBSSxLQUFLLHlCQUF5QjtFQUNuRCxXQUFVLElBQUk7SUFDWixPQUFPLFNBQVMsT0FBTyxPQUFPLENBQUM7RUFDakM7RUFDQSxNQUFNO0FBQ1IsR0FBRyJ9