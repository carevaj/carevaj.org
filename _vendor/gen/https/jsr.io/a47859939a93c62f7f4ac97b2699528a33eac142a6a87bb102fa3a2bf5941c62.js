// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
import { assert } from "jsr:/@std/assert@^0.225.1/assert";
import { Logger } from "./logger.ts";
import { state } from "./_state.ts";
/** Get a logger instance. If not specified `name`, get the default logger. */ export function getLogger(name) {
  if (!name) {
    const d = state.loggers.get("default");
    assert(d !== undefined, `"default" logger must be set for getting logger without name`);
    return d;
  }
  const result = state.loggers.get(name);
  if (!result) {
    const logger = new Logger(name, "NOTSET", {
      handlers: []
    });
    state.loggers.set(name, logger);
    return logger;
  }
  return result;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0BzdGQvbG9nLzAuMjI0LjEvZ2V0X2xvZ2dlci50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDI0IHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuLy8gVGhpcyBtb2R1bGUgaXMgYnJvd3NlciBjb21wYXRpYmxlLlxuXG5pbXBvcnQgeyBhc3NlcnQgfSBmcm9tIFwianNyOi9Ac3RkL2Fzc2VydEBeMC4yMjUuMS9hc3NlcnRcIjtcbmltcG9ydCB7IExvZ2dlciB9IGZyb20gXCIuL2xvZ2dlci50c1wiO1xuaW1wb3J0IHsgc3RhdGUgfSBmcm9tIFwiLi9fc3RhdGUudHNcIjtcblxuLyoqIEdldCBhIGxvZ2dlciBpbnN0YW5jZS4gSWYgbm90IHNwZWNpZmllZCBgbmFtZWAsIGdldCB0aGUgZGVmYXVsdCBsb2dnZXIuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0TG9nZ2VyKG5hbWU/OiBzdHJpbmcpOiBMb2dnZXIge1xuICBpZiAoIW5hbWUpIHtcbiAgICBjb25zdCBkID0gc3RhdGUubG9nZ2Vycy5nZXQoXCJkZWZhdWx0XCIpO1xuICAgIGFzc2VydChcbiAgICAgIGQgIT09IHVuZGVmaW5lZCxcbiAgICAgIGBcImRlZmF1bHRcIiBsb2dnZXIgbXVzdCBiZSBzZXQgZm9yIGdldHRpbmcgbG9nZ2VyIHdpdGhvdXQgbmFtZWAsXG4gICAgKTtcbiAgICByZXR1cm4gZDtcbiAgfVxuICBjb25zdCByZXN1bHQgPSBzdGF0ZS5sb2dnZXJzLmdldChuYW1lKTtcbiAgaWYgKCFyZXN1bHQpIHtcbiAgICBjb25zdCBsb2dnZXIgPSBuZXcgTG9nZ2VyKG5hbWUsIFwiTk9UU0VUXCIsIHsgaGFuZGxlcnM6IFtdIH0pO1xuICAgIHN0YXRlLmxvZ2dlcnMuc2V0KG5hbWUsIGxvZ2dlcik7XG4gICAgcmV0dXJuIGxvZ2dlcjtcbiAgfVxuICByZXR1cm4gcmVzdWx0O1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLDBFQUEwRTtBQUMxRSxxQ0FBcUM7QUFFckMsU0FBUyxNQUFNLFFBQVEsbUNBQW1DO0FBQzFELFNBQVMsTUFBTSxRQUFRLGNBQWM7QUFDckMsU0FBUyxLQUFLLFFBQVEsY0FBYztBQUVwQyw0RUFBNEUsR0FDNUUsT0FBTyxTQUFTLFVBQVUsSUFBYTtFQUNyQyxJQUFJLENBQUMsTUFBTTtJQUNULE1BQU0sSUFBSSxNQUFNLE9BQU8sQ0FBQyxHQUFHLENBQUM7SUFDNUIsT0FDRSxNQUFNLFdBQ04sQ0FBQyw0REFBNEQsQ0FBQztJQUVoRSxPQUFPO0VBQ1Q7RUFDQSxNQUFNLFNBQVMsTUFBTSxPQUFPLENBQUMsR0FBRyxDQUFDO0VBQ2pDLElBQUksQ0FBQyxRQUFRO0lBQ1gsTUFBTSxTQUFTLElBQUksT0FBTyxNQUFNLFVBQVU7TUFBRSxVQUFVLEVBQUU7SUFBQztJQUN6RCxNQUFNLE9BQU8sQ0FBQyxHQUFHLENBQUMsTUFBTTtJQUN4QixPQUFPO0VBQ1Q7RUFDQSxPQUFPO0FBQ1QifQ==