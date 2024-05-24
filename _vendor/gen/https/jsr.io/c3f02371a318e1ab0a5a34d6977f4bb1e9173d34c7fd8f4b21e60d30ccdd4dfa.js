// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import { ConsoleHandler } from "./console_handler.ts";
export const DEFAULT_LEVEL = "INFO";
export const DEFAULT_CONFIG = {
  handlers: {
    default: new ConsoleHandler(DEFAULT_LEVEL)
  },
  loggers: {
    default: {
      level: DEFAULT_LEVEL,
      handlers: [
        "default"
      ]
    }
  }
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0BzdGQvbG9nLzAuMjI0LjEvX2NvbmZpZy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDI0IHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuXG5pbXBvcnQgeyBDb25zb2xlSGFuZGxlciB9IGZyb20gXCIuL2NvbnNvbGVfaGFuZGxlci50c1wiO1xuaW1wb3J0IHR5cGUgeyBMb2dDb25maWcgfSBmcm9tIFwiLi9sb2dnZXIudHNcIjtcblxuZXhwb3J0IGNvbnN0IERFRkFVTFRfTEVWRUwgPSBcIklORk9cIjtcblxuZXhwb3J0IGNvbnN0IERFRkFVTFRfQ09ORklHOiBMb2dDb25maWcgPSB7XG4gIGhhbmRsZXJzOiB7XG4gICAgZGVmYXVsdDogbmV3IENvbnNvbGVIYW5kbGVyKERFRkFVTFRfTEVWRUwpLFxuICB9LFxuXG4gIGxvZ2dlcnM6IHtcbiAgICBkZWZhdWx0OiB7XG4gICAgICBsZXZlbDogREVGQVVMVF9MRVZFTCxcbiAgICAgIGhhbmRsZXJzOiBbXCJkZWZhdWx0XCJdLFxuICAgIH0sXG4gIH0sXG59O1xuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLDBFQUEwRTtBQUUxRSxTQUFTLGNBQWMsUUFBUSx1QkFBdUI7QUFHdEQsT0FBTyxNQUFNLGdCQUFnQixPQUFPO0FBRXBDLE9BQU8sTUFBTSxpQkFBNEI7RUFDdkMsVUFBVTtJQUNSLFNBQVMsSUFBSSxlQUFlO0VBQzlCO0VBRUEsU0FBUztJQUNQLFNBQVM7TUFDUCxPQUFPO01BQ1AsVUFBVTtRQUFDO09BQVU7SUFDdkI7RUFDRjtBQUNGLEVBQUUifQ==