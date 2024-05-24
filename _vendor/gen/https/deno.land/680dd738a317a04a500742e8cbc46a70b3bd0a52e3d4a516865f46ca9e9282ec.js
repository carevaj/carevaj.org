import * as logger from "../../deps/log.ts";
import { env } from "./env.ts";
import { bold, brightGreen, cyan, gray, red, strikethrough, yellow } from "../../deps/colors.ts";
// Get the log level from the environment variable LUME_LOGS
let level = env("LUME_LOGS")?.toUpperCase();
if (!level || level === "NOTSET") {
  level = "INFO";
}
/**
 * This is the default logger. It will output color coded log messages to the
 * console via `console.log()`.
 */ class ConsoleHandler extends logger.BaseHandler {
  format(logRecord) {
    let { msg } = logRecord;
    switch(logRecord.level){
      case logger.LogLevels.WARN:
        msg = `<yellow>WARN</yellow> ${msg}`;
        break;
      case logger.LogLevels.ERROR:
        msg = `<red>ERROR</red> ${msg}`;
        break;
      case logger.LogLevels.CRITICAL:
        msg = `<Red>CRITICAL</Red> ${msg}`;
        break;
    }
    return msg.replaceAll(/<(\w+)>([^<]+)<\/\1>/g, (_, name, content)=>logFormats[name](content));
  }
  log(msg) {
    console.log(msg);
  }
}
logger.setup({
  handlers: {
    console: new ConsoleHandler("DEBUG")
  },
  loggers: {
    lume: {
      level: level,
      handlers: [
        "console"
      ]
    }
  }
});
export const log = logger.getLogger("lume");
const logFormats = {
  cyan,
  Cyan: (str)=>bold(cyan(str)),
  red,
  Red: (str)=>bold(red(str)),
  gray,
  Gray: (str)=>bold(gray(str)),
  green: brightGreen,
  Green: (str)=>bold(brightGreen(str)),
  yellow: yellow,
  Yellow: (str)=>bold(yellow(str)),
  del: (str)=>strikethrough(gray(str))
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvbHVtZUB2Mi4yLjAvY29yZS91dGlscy9sb2cudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgbG9nZ2VyIGZyb20gXCIuLi8uLi9kZXBzL2xvZy50c1wiO1xuaW1wb3J0IHsgZW52IH0gZnJvbSBcIi4vZW52LnRzXCI7XG5pbXBvcnQge1xuICBib2xkLFxuICBicmlnaHRHcmVlbixcbiAgY3lhbixcbiAgZ3JheSxcbiAgcmVkLFxuICBzdHJpa2V0aHJvdWdoLFxuICB5ZWxsb3csXG59IGZyb20gXCIuLi8uLi9kZXBzL2NvbG9ycy50c1wiO1xuXG5pbXBvcnQgdHlwZSB7IExldmVsTmFtZSwgTG9nUmVjb3JkIH0gZnJvbSBcIi4uLy4uL2RlcHMvbG9nLnRzXCI7XG5cbi8vIEdldCB0aGUgbG9nIGxldmVsIGZyb20gdGhlIGVudmlyb25tZW50IHZhcmlhYmxlIExVTUVfTE9HU1xubGV0IGxldmVsID0gZW52PExldmVsTmFtZT4oXCJMVU1FX0xPR1NcIik/LnRvVXBwZXJDYXNlKCkgYXNcbiAgfCBMZXZlbE5hbWVcbiAgfCB1bmRlZmluZWQ7XG5cbmlmICghbGV2ZWwgfHwgbGV2ZWwgPT09IFwiTk9UU0VUXCIpIHtcbiAgbGV2ZWwgPSBcIklORk9cIjtcbn1cblxuLyoqXG4gKiBUaGlzIGlzIHRoZSBkZWZhdWx0IGxvZ2dlci4gSXQgd2lsbCBvdXRwdXQgY29sb3IgY29kZWQgbG9nIG1lc3NhZ2VzIHRvIHRoZVxuICogY29uc29sZSB2aWEgYGNvbnNvbGUubG9nKClgLlxuICovXG5jbGFzcyBDb25zb2xlSGFuZGxlciBleHRlbmRzIGxvZ2dlci5CYXNlSGFuZGxlciB7XG4gIG92ZXJyaWRlIGZvcm1hdChsb2dSZWNvcmQ6IExvZ1JlY29yZCk6IHN0cmluZyB7XG4gICAgbGV0IHsgbXNnIH0gPSBsb2dSZWNvcmQ7XG5cbiAgICBzd2l0Y2ggKGxvZ1JlY29yZC5sZXZlbCkge1xuICAgICAgY2FzZSBsb2dnZXIuTG9nTGV2ZWxzLldBUk46XG4gICAgICAgIG1zZyA9IGA8eWVsbG93PldBUk48L3llbGxvdz4gJHttc2d9YDtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIGxvZ2dlci5Mb2dMZXZlbHMuRVJST1I6XG4gICAgICAgIG1zZyA9IGA8cmVkPkVSUk9SPC9yZWQ+ICR7bXNnfWA7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBsb2dnZXIuTG9nTGV2ZWxzLkNSSVRJQ0FMOlxuICAgICAgICBtc2cgPSBgPFJlZD5DUklUSUNBTDwvUmVkPiAke21zZ31gO1xuICAgICAgICBicmVhaztcbiAgICB9XG5cbiAgICByZXR1cm4gbXNnLnJlcGxhY2VBbGwoXG4gICAgICAvPChcXHcrKT4oW148XSspPFxcL1xcMT4vZyxcbiAgICAgIChfLCBuYW1lLCBjb250ZW50KSA9PiBsb2dGb3JtYXRzW25hbWVdIShjb250ZW50KSxcbiAgICApO1xuICB9XG5cbiAgb3ZlcnJpZGUgbG9nKG1zZzogc3RyaW5nKSB7XG4gICAgY29uc29sZS5sb2cobXNnKTtcbiAgfVxufVxuXG5sb2dnZXIuc2V0dXAoe1xuICBoYW5kbGVyczoge1xuICAgIGNvbnNvbGU6IG5ldyBDb25zb2xlSGFuZGxlcihcIkRFQlVHXCIpLFxuICB9LFxuICBsb2dnZXJzOiB7XG4gICAgbHVtZToge1xuICAgICAgbGV2ZWw6IGxldmVsIGFzIExldmVsTmFtZSxcbiAgICAgIGhhbmRsZXJzOiBbXCJjb25zb2xlXCJdLFxuICAgIH0sXG4gIH0sXG59KTtcblxuZXhwb3J0IGNvbnN0IGxvZyA9IGxvZ2dlci5nZXRMb2dnZXIoXCJsdW1lXCIpO1xuXG5jb25zdCBsb2dGb3JtYXRzOiBSZWNvcmQ8c3RyaW5nLCAoc3RyOiBzdHJpbmcpID0+IHN0cmluZz4gPSB7XG4gIGN5YW4sXG4gIEN5YW46IChzdHI6IHN0cmluZykgPT4gYm9sZChjeWFuKHN0cikpLFxuICByZWQsXG4gIFJlZDogKHN0cjogc3RyaW5nKSA9PiBib2xkKHJlZChzdHIpKSxcbiAgZ3JheSxcbiAgR3JheTogKHN0cjogc3RyaW5nKSA9PiBib2xkKGdyYXkoc3RyKSksXG4gIGdyZWVuOiBicmlnaHRHcmVlbixcbiAgR3JlZW46IChzdHI6IHN0cmluZykgPT4gYm9sZChicmlnaHRHcmVlbihzdHIpKSxcbiAgeWVsbG93OiB5ZWxsb3csXG4gIFllbGxvdzogKHN0cjogc3RyaW5nKSA9PiBib2xkKHllbGxvdyhzdHIpKSxcbiAgZGVsOiAoc3RyOiBzdHJpbmcpID0+IHN0cmlrZXRocm91Z2goZ3JheShzdHIpKSxcbn07XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxZQUFZLG9CQUFvQjtBQUM1QyxTQUFTLEdBQUcsUUFBUSxXQUFXO0FBQy9CLFNBQ0UsSUFBSSxFQUNKLFdBQVcsRUFDWCxJQUFJLEVBQ0osSUFBSSxFQUNKLEdBQUcsRUFDSCxhQUFhLEVBQ2IsTUFBTSxRQUNELHVCQUF1QjtBQUk5Qiw0REFBNEQ7QUFDNUQsSUFBSSxRQUFRLElBQWUsY0FBYztBQUl6QyxJQUFJLENBQUMsU0FBUyxVQUFVLFVBQVU7RUFDaEMsUUFBUTtBQUNWO0FBRUE7OztDQUdDLEdBQ0QsTUFBTSx1QkFBdUIsT0FBTyxXQUFXO0VBQ3BDLE9BQU8sU0FBb0IsRUFBVTtJQUM1QyxJQUFJLEVBQUUsR0FBRyxFQUFFLEdBQUc7SUFFZCxPQUFRLFVBQVUsS0FBSztNQUNyQixLQUFLLE9BQU8sU0FBUyxDQUFDLElBQUk7UUFDeEIsTUFBTSxDQUFDLHNCQUFzQixFQUFFLElBQUksQ0FBQztRQUNwQztNQUNGLEtBQUssT0FBTyxTQUFTLENBQUMsS0FBSztRQUN6QixNQUFNLENBQUMsaUJBQWlCLEVBQUUsSUFBSSxDQUFDO1FBQy9CO01BQ0YsS0FBSyxPQUFPLFNBQVMsQ0FBQyxRQUFRO1FBQzVCLE1BQU0sQ0FBQyxvQkFBb0IsRUFBRSxJQUFJLENBQUM7UUFDbEM7SUFDSjtJQUVBLE9BQU8sSUFBSSxVQUFVLENBQ25CLHlCQUNBLENBQUMsR0FBRyxNQUFNLFVBQVksVUFBVSxDQUFDLEtBQUssQ0FBRTtFQUU1QztFQUVTLElBQUksR0FBVyxFQUFFO0lBQ3hCLFFBQVEsR0FBRyxDQUFDO0VBQ2Q7QUFDRjtBQUVBLE9BQU8sS0FBSyxDQUFDO0VBQ1gsVUFBVTtJQUNSLFNBQVMsSUFBSSxlQUFlO0VBQzlCO0VBQ0EsU0FBUztJQUNQLE1BQU07TUFDSixPQUFPO01BQ1AsVUFBVTtRQUFDO09BQVU7SUFDdkI7RUFDRjtBQUNGO0FBRUEsT0FBTyxNQUFNLE1BQU0sT0FBTyxTQUFTLENBQUMsUUFBUTtBQUU1QyxNQUFNLGFBQXNEO0VBQzFEO0VBQ0EsTUFBTSxDQUFDLE1BQWdCLEtBQUssS0FBSztFQUNqQztFQUNBLEtBQUssQ0FBQyxNQUFnQixLQUFLLElBQUk7RUFDL0I7RUFDQSxNQUFNLENBQUMsTUFBZ0IsS0FBSyxLQUFLO0VBQ2pDLE9BQU87RUFDUCxPQUFPLENBQUMsTUFBZ0IsS0FBSyxZQUFZO0VBQ3pDLFFBQVE7RUFDUixRQUFRLENBQUMsTUFBZ0IsS0FBSyxPQUFPO0VBQ3JDLEtBQUssQ0FBQyxNQUFnQixjQUFjLEtBQUs7QUFDM0MifQ==