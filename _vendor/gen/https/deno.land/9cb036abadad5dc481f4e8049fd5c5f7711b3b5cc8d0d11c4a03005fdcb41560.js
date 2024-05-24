import * as stdColors from "https://deno.land/std@0.170.0/fmt/colors.ts";
const proto = Object.create(null);
const methodNames = Object.keys(stdColors);
for (const name of methodNames){
  if (name === "setColorEnabled" || name === "getColorEnabled") {
    continue;
  }
  Object.defineProperty(proto, name, {
    get () {
      return factory([
        ...this._stack,
        name
      ]);
    }
  });
}
export const colors = factory();
/**
 * Chainable colors module.
 * ```
 * console.log(colors.blue.bgRed.bold('Welcome to Deno.Land!'));
 * ```
 * If invoked as method, a new Ansi instance will be returned.
 * ```
 * const myColors: Colors = colors();
 * console.log(myColors.blue.bgRed.bold('Welcome to Deno.Land!'));
 * ```
 */ function factory(stack = []) {
  const colors = function(str, ...args) {
    if (str) {
      const lastIndex = stack.length - 1;
      return stack.reduce((str, name, index)=>index === lastIndex ? stdColors[name](str, ...args) : stdColors[name](str), str);
    }
    const tmp = stack.slice();
    stack = [];
    return factory(tmp);
  };
  Object.setPrototypeOf(colors, proto);
  colors._stack = stack;
  return colors;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvY2xpZmZ5QHYwLjI1LjcvYW5zaS9jb2xvcnMudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgc3RkQ29sb3JzIGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC9zdGRAMC4xNzAuMC9mbXQvY29sb3JzLnRzXCI7XG5cbnR5cGUgRXhjbHVkZWRDb2xvck1ldGhvZHMgPSBcInNldENvbG9yRW5hYmxlZFwiIHwgXCJnZXRDb2xvckVuYWJsZWRcIjtcbnR5cGUgUHJvcGVydHlOYW1lcyA9IGtleW9mIHR5cGVvZiBzdGRDb2xvcnM7XG50eXBlIENvbG9yTWV0aG9kID0gKHN0cjogc3RyaW5nLCAuLi5hcmdzOiBBcnJheTx1bmtub3duPikgPT4gc3RyaW5nO1xudHlwZSBDb2xvck1ldGhvZHMgPSBFeGNsdWRlPFByb3BlcnR5TmFtZXMsIEV4Y2x1ZGVkQ29sb3JNZXRob2RzPjtcbnR5cGUgQ2hhaW5hYmxlPFQsIEUgZXh0ZW5kcyBrZXlvZiBUIHwgbnVsbCA9IG51bGw+ID0ge1xuICBbUCBpbiBrZXlvZiBUXTogUCBleHRlbmRzIEUgPyBUW1BdIDogQ2hhaW5hYmxlPFQsIEU+ICYgVFtQXTtcbn07XG5cbi8qKiBDaGFpbmFibGUgY29sb3JzIGluc3RhbmNlIHJldHVybmVkIGJ5IGFsbCBhbnNpIGVzY2FwZSBwcm9wZXJ0aWVzLiAqL1xuZXhwb3J0IHR5cGUgQ29sb3JzQ2hhaW4gPVxuICAmIENoYWluYWJsZTx0eXBlb2Ygc3RkQ29sb3JzLCBFeGNsdWRlZENvbG9yTWV0aG9kcz5cbiAgJiB7IF9zdGFjazogQXJyYXk8Q29sb3JNZXRob2RzPiB9O1xuXG4vKiogQ3JlYXRlIG5ldyBgQ29sb3JzYCBpbnN0YW5jZS4gKi9cbmV4cG9ydCB0eXBlIENvbG9yc0ZhY3RvcnkgPSAoKSA9PiBDb2xvcnM7XG5cbi8qKlxuICogQ2hhaW5hYmxlIGNvbG9ycyBtb2R1bGUuXG4gKiBJZiBpbnZva2VkIGFzIG1ldGhvZCwgYSBuZXcgYENvbG9yc2AgaW5zdGFuY2Ugd2lsbCBiZSByZXR1cm5lZC5cbiAqL1xuZXhwb3J0IHR5cGUgQ29sb3JzID0gQ29sb3JzRmFjdG9yeSAmIENvbG9yc0NoYWluO1xuXG5jb25zdCBwcm90byA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG5jb25zdCBtZXRob2ROYW1lcyA9IE9iamVjdC5rZXlzKHN0ZENvbG9ycykgYXMgQXJyYXk8UHJvcGVydHlOYW1lcz47XG5mb3IgKGNvbnN0IG5hbWUgb2YgbWV0aG9kTmFtZXMpIHtcbiAgaWYgKG5hbWUgPT09IFwic2V0Q29sb3JFbmFibGVkXCIgfHwgbmFtZSA9PT0gXCJnZXRDb2xvckVuYWJsZWRcIikge1xuICAgIGNvbnRpbnVlO1xuICB9XG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShwcm90bywgbmFtZSwge1xuICAgIGdldCh0aGlzOiBDb2xvcnNDaGFpbikge1xuICAgICAgcmV0dXJuIGZhY3RvcnkoWy4uLnRoaXMuX3N0YWNrLCBuYW1lXSk7XG4gICAgfSxcbiAgfSk7XG59XG5cbmV4cG9ydCBjb25zdCBjb2xvcnM6IENvbG9ycyA9IGZhY3RvcnkoKTtcblxuLyoqXG4gKiBDaGFpbmFibGUgY29sb3JzIG1vZHVsZS5cbiAqIGBgYFxuICogY29uc29sZS5sb2coY29sb3JzLmJsdWUuYmdSZWQuYm9sZCgnV2VsY29tZSB0byBEZW5vLkxhbmQhJykpO1xuICogYGBgXG4gKiBJZiBpbnZva2VkIGFzIG1ldGhvZCwgYSBuZXcgQW5zaSBpbnN0YW5jZSB3aWxsIGJlIHJldHVybmVkLlxuICogYGBgXG4gKiBjb25zdCBteUNvbG9yczogQ29sb3JzID0gY29sb3JzKCk7XG4gKiBjb25zb2xlLmxvZyhteUNvbG9ycy5ibHVlLmJnUmVkLmJvbGQoJ1dlbGNvbWUgdG8gRGVuby5MYW5kIScpKTtcbiAqIGBgYFxuICovXG5mdW5jdGlvbiBmYWN0b3J5KHN0YWNrOiBBcnJheTxDb2xvck1ldGhvZHM+ID0gW10pOiBDb2xvcnMge1xuICBjb25zdCBjb2xvcnM6IENvbG9ycyA9IGZ1bmN0aW9uIChcbiAgICB0aGlzOiBDb2xvcnNDaGFpbiB8IHVuZGVmaW5lZCxcbiAgICBzdHI/OiBzdHJpbmcsXG4gICAgLi4uYXJnczogQXJyYXk8dW5rbm93bj5cbiAgKTogc3RyaW5nIHwgQ29sb3JzQ2hhaW4ge1xuICAgIGlmIChzdHIpIHtcbiAgICAgIGNvbnN0IGxhc3RJbmRleCA9IHN0YWNrLmxlbmd0aCAtIDE7XG4gICAgICByZXR1cm4gc3RhY2sucmVkdWNlKFxuICAgICAgICAoc3RyOiBzdHJpbmcsIG5hbWU6IFByb3BlcnR5TmFtZXMsIGluZGV4OiBudW1iZXIpID0+XG4gICAgICAgICAgaW5kZXggPT09IGxhc3RJbmRleFxuICAgICAgICAgICAgPyAoc3RkQ29sb3JzW25hbWVdIGFzIENvbG9yTWV0aG9kKShzdHIsIC4uLmFyZ3MpXG4gICAgICAgICAgICA6IChzdGRDb2xvcnNbbmFtZV0gYXMgQ29sb3JNZXRob2QpKHN0ciksXG4gICAgICAgIHN0cixcbiAgICAgICk7XG4gICAgfVxuICAgIGNvbnN0IHRtcCA9IHN0YWNrLnNsaWNlKCk7XG4gICAgc3RhY2sgPSBbXTtcbiAgICByZXR1cm4gZmFjdG9yeSh0bXApO1xuICB9IGFzIENvbG9ycztcblxuICBPYmplY3Quc2V0UHJvdG90eXBlT2YoY29sb3JzLCBwcm90byk7XG4gIGNvbG9ycy5fc3RhY2sgPSBzdGFjaztcbiAgcmV0dXJuIGNvbG9ycztcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxZQUFZLGVBQWUsOENBQThDO0FBd0J6RSxNQUFNLFFBQVEsT0FBTyxNQUFNLENBQUM7QUFDNUIsTUFBTSxjQUFjLE9BQU8sSUFBSSxDQUFDO0FBQ2hDLEtBQUssTUFBTSxRQUFRLFlBQWE7RUFDOUIsSUFBSSxTQUFTLHFCQUFxQixTQUFTLG1CQUFtQjtJQUM1RDtFQUNGO0VBQ0EsT0FBTyxjQUFjLENBQUMsT0FBTyxNQUFNO0lBQ2pDO01BQ0UsT0FBTyxRQUFRO1dBQUksSUFBSSxDQUFDLE1BQU07UUFBRTtPQUFLO0lBQ3ZDO0VBQ0Y7QUFDRjtBQUVBLE9BQU8sTUFBTSxTQUFpQixVQUFVO0FBRXhDOzs7Ozs7Ozs7O0NBVUMsR0FDRCxTQUFTLFFBQVEsUUFBNkIsRUFBRTtFQUM5QyxNQUFNLFNBQWlCLFNBRXJCLEdBQVksRUFDWixHQUFHLElBQW9CO0lBRXZCLElBQUksS0FBSztNQUNQLE1BQU0sWUFBWSxNQUFNLE1BQU0sR0FBRztNQUNqQyxPQUFPLE1BQU0sTUFBTSxDQUNqQixDQUFDLEtBQWEsTUFBcUIsUUFDakMsVUFBVSxZQUNOLEFBQUMsU0FBUyxDQUFDLEtBQUssQ0FBaUIsUUFBUSxRQUN6QyxBQUFDLFNBQVMsQ0FBQyxLQUFLLENBQWlCLE1BQ3ZDO0lBRUo7SUFDQSxNQUFNLE1BQU0sTUFBTSxLQUFLO0lBQ3ZCLFFBQVEsRUFBRTtJQUNWLE9BQU8sUUFBUTtFQUNqQjtFQUVBLE9BQU8sY0FBYyxDQUFDLFFBQVE7RUFDOUIsT0FBTyxNQUFNLEdBQUc7RUFDaEIsT0FBTztBQUNUIn0=