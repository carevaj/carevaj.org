import * as ansiEscapes from "./ansi_escapes.ts";
/**
 * Chainable ansi escape sequences.
 * If invoked as method, a new Ansi instance will be returned.
 * ```
 * await Deno.stdout.write(
 *   new TextEncoder().encode(
 *     ansi.cursorTo(0, 0).eraseScreen(),
 *   ),
 * );
 * ```
 * Or shorter:
 * ```
 * await Deno.stdout.write(
 *   ansi.cursorTo(0, 0).eraseScreen.toBuffer(),
 * );
 * ```
 */ export const ansi = factory();
function factory() {
  let result = [];
  let stack = [];
  const ansi = function(...args) {
    if (this) {
      if (args.length) {
        update(args);
        return this;
      }
      return this.toString();
    }
    return factory();
  };
  ansi.text = function(text) {
    stack.push([
      text,
      []
    ]);
    return this;
  };
  ansi.toString = function() {
    update();
    const str = result.join("");
    result = [];
    return str;
  };
  ansi.toBuffer = function() {
    return new TextEncoder().encode(this.toString());
  };
  const methodList = Object.entries(ansiEscapes);
  for (const [name, method] of methodList){
    Object.defineProperty(ansi, name, {
      get () {
        stack.push([
          method,
          []
        ]);
        return this;
      }
    });
  }
  return ansi;
  function update(args) {
    if (!stack.length) {
      return;
    }
    if (args) {
      stack[stack.length - 1][1] = args;
    }
    result.push(...stack.map(([prop, args])=>typeof prop === "string" ? prop : prop.call(ansi, ...args)));
    stack = [];
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvY2xpZmZ5QHYwLjI1LjcvYW5zaS9hbnNpLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGFuc2lFc2NhcGVzIGZyb20gXCIuL2Fuc2lfZXNjYXBlcy50c1wiO1xuaW1wb3J0IHR5cGUgeyBDaGFpbiB9IGZyb20gXCIuL2NoYWluLnRzXCI7XG5cbnR5cGUgQXJncyA9IEFycmF5PHVua25vd24+O1xudHlwZSBFeGVjdXRvciA9ICh0aGlzOiBBbnNpQ2hhaW4sIC4uLmFyZ3M6IEFyZ3MpID0+IHN0cmluZztcbnR5cGUgUHJvcGVydHkgPSBzdHJpbmcgfCBFeGVjdXRvcjtcbnR5cGUgUHJvcGVydHlOYW1lcyA9IGtleW9mIENoYWluPEFuc2lDaGFpbj47XG5cbi8qKiBBbnNpIGluc3RhbmNlIHJldHVybmVkIGJ5IGFsbCBhbnNpIGVzY2FwZSBwcm9wZXJ0aWVzLiAqL1xuZXhwb3J0IGludGVyZmFjZSBBbnNpQ2hhaW4gZXh0ZW5kcyBDaGFpbjxBbnNpQ2hhaW4+IHtcbiAgLyoqIEdldCBhbnNpIGVzY2FwZSBzZXF1ZW5jZS4gKi9cbiAgKCk6IHN0cmluZztcbiAgLyoqIEdldCBhbnNpIGVzY2FwZSBzZXF1ZW5jZS4gKi9cbiAgdG9TdHJpbmcoKTogc3RyaW5nO1xuICAvKiogR2V0IGFuc2kgZXNjYXBlIHNlcXVlbmNlIGFzIFVpbnQ4QXJyYXkuICovXG4gIHRvQnVmZmVyKCk6IFVpbnQ4QXJyYXk7XG59XG5cbi8qKiBDcmVhdGUgbmV3IGBBbnNpYCBpbnN0YW5jZS4gKi9cbmV4cG9ydCB0eXBlIEFuc2lGYWN0b3J5ID0gKCkgPT4gQW5zaTtcblxuLyoqXG4gKiBDaGFpbmFibGUgYW5zaSBlc2NhcGUgc2VxdWVuY2VzLlxuICogSWYgaW52b2tlZCBhcyBtZXRob2QsIGEgbmV3IEFuc2kgaW5zdGFuY2Ugd2lsbCBiZSByZXR1cm5lZC5cbiAqL1xuZXhwb3J0IHR5cGUgQW5zaSA9IEFuc2lGYWN0b3J5ICYgQW5zaUNoYWluO1xuXG4vKipcbiAqIENoYWluYWJsZSBhbnNpIGVzY2FwZSBzZXF1ZW5jZXMuXG4gKiBJZiBpbnZva2VkIGFzIG1ldGhvZCwgYSBuZXcgQW5zaSBpbnN0YW5jZSB3aWxsIGJlIHJldHVybmVkLlxuICogYGBgXG4gKiBhd2FpdCBEZW5vLnN0ZG91dC53cml0ZShcbiAqICAgbmV3IFRleHRFbmNvZGVyKCkuZW5jb2RlKFxuICogICAgIGFuc2kuY3Vyc29yVG8oMCwgMCkuZXJhc2VTY3JlZW4oKSxcbiAqICAgKSxcbiAqICk7XG4gKiBgYGBcbiAqIE9yIHNob3J0ZXI6XG4gKiBgYGBcbiAqIGF3YWl0IERlbm8uc3Rkb3V0LndyaXRlKFxuICogICBhbnNpLmN1cnNvclRvKDAsIDApLmVyYXNlU2NyZWVuLnRvQnVmZmVyKCksXG4gKiApO1xuICogYGBgXG4gKi9cbmV4cG9ydCBjb25zdCBhbnNpOiBBbnNpID0gZmFjdG9yeSgpO1xuXG5mdW5jdGlvbiBmYWN0b3J5KCk6IEFuc2kge1xuICBsZXQgcmVzdWx0OiBBcnJheTxzdHJpbmc+ID0gW107XG4gIGxldCBzdGFjazogQXJyYXk8W1Byb3BlcnR5LCBBcmdzXT4gPSBbXTtcblxuICBjb25zdCBhbnNpOiBBbnNpID0gZnVuY3Rpb24gKFxuICAgIHRoaXM6IEFuc2lDaGFpbiB8IHVuZGVmaW5lZCxcbiAgICAuLi5hcmdzOiBBcmdzXG4gICk6IHN0cmluZyB8IEFuc2lDaGFpbiB7XG4gICAgaWYgKHRoaXMpIHtcbiAgICAgIGlmIChhcmdzLmxlbmd0aCkge1xuICAgICAgICB1cGRhdGUoYXJncyk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXMudG9TdHJpbmcoKTtcbiAgICB9XG4gICAgcmV0dXJuIGZhY3RvcnkoKTtcbiAgfSBhcyBBbnNpO1xuXG4gIGFuc2kudGV4dCA9IGZ1bmN0aW9uICh0ZXh0OiBzdHJpbmcpOiBBbnNpQ2hhaW4ge1xuICAgIHN0YWNrLnB1c2goW3RleHQsIFtdXSk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH07XG5cbiAgYW5zaS50b1N0cmluZyA9IGZ1bmN0aW9uICgpOiBzdHJpbmcge1xuICAgIHVwZGF0ZSgpO1xuICAgIGNvbnN0IHN0cjogc3RyaW5nID0gcmVzdWx0LmpvaW4oXCJcIik7XG4gICAgcmVzdWx0ID0gW107XG4gICAgcmV0dXJuIHN0cjtcbiAgfTtcblxuICBhbnNpLnRvQnVmZmVyID0gZnVuY3Rpb24gKCk6IFVpbnQ4QXJyYXkge1xuICAgIHJldHVybiBuZXcgVGV4dEVuY29kZXIoKS5lbmNvZGUodGhpcy50b1N0cmluZygpKTtcbiAgfTtcblxuICBjb25zdCBtZXRob2RMaXN0OiBBcnJheTxbUHJvcGVydHlOYW1lcywgUHJvcGVydHldPiA9IE9iamVjdC5lbnRyaWVzKFxuICAgIGFuc2lFc2NhcGVzLFxuICApIGFzIEFycmF5PFtQcm9wZXJ0eU5hbWVzLCBQcm9wZXJ0eV0+O1xuXG4gIGZvciAoY29uc3QgW25hbWUsIG1ldGhvZF0gb2YgbWV0aG9kTGlzdCkge1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShhbnNpLCBuYW1lLCB7XG4gICAgICBnZXQodGhpczogQW5zaUNoYWluKSB7XG4gICAgICAgIHN0YWNrLnB1c2goW21ldGhvZCwgW11dKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICB9LFxuICAgIH0pO1xuICB9XG5cbiAgcmV0dXJuIGFuc2k7XG5cbiAgZnVuY3Rpb24gdXBkYXRlKGFyZ3M/OiBBcmdzKSB7XG4gICAgaWYgKCFzdGFjay5sZW5ndGgpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKGFyZ3MpIHtcbiAgICAgIHN0YWNrW3N0YWNrLmxlbmd0aCAtIDFdWzFdID0gYXJncztcbiAgICB9XG4gICAgcmVzdWx0LnB1c2goXG4gICAgICAuLi5zdGFjay5tYXAoKFtwcm9wLCBhcmdzXTogW1Byb3BlcnR5LCBBcmdzXSkgPT5cbiAgICAgICAgdHlwZW9mIHByb3AgPT09IFwic3RyaW5nXCIgPyBwcm9wIDogcHJvcC5jYWxsKGFuc2ksIC4uLmFyZ3MpXG4gICAgICApLFxuICAgICk7XG4gICAgc3RhY2sgPSBbXTtcbiAgfVxufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFlBQVksaUJBQWlCLG9CQUFvQjtBQTJCakQ7Ozs7Ozs7Ozs7Ozs7Ozs7Q0FnQkMsR0FDRCxPQUFPLE1BQU0sT0FBYSxVQUFVO0FBRXBDLFNBQVM7RUFDUCxJQUFJLFNBQXdCLEVBQUU7RUFDOUIsSUFBSSxRQUFpQyxFQUFFO0VBRXZDLE1BQU0sT0FBYSxTQUVqQixHQUFHLElBQVU7SUFFYixJQUFJLElBQUksRUFBRTtNQUNSLElBQUksS0FBSyxNQUFNLEVBQUU7UUFDZixPQUFPO1FBQ1AsT0FBTyxJQUFJO01BQ2I7TUFDQSxPQUFPLElBQUksQ0FBQyxRQUFRO0lBQ3RCO0lBQ0EsT0FBTztFQUNUO0VBRUEsS0FBSyxJQUFJLEdBQUcsU0FBVSxJQUFZO0lBQ2hDLE1BQU0sSUFBSSxDQUFDO01BQUM7TUFBTSxFQUFFO0tBQUM7SUFDckIsT0FBTyxJQUFJO0VBQ2I7RUFFQSxLQUFLLFFBQVEsR0FBRztJQUNkO0lBQ0EsTUFBTSxNQUFjLE9BQU8sSUFBSSxDQUFDO0lBQ2hDLFNBQVMsRUFBRTtJQUNYLE9BQU87RUFDVDtFQUVBLEtBQUssUUFBUSxHQUFHO0lBQ2QsT0FBTyxJQUFJLGNBQWMsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRO0VBQy9DO0VBRUEsTUFBTSxhQUErQyxPQUFPLE9BQU8sQ0FDakU7RUFHRixLQUFLLE1BQU0sQ0FBQyxNQUFNLE9BQU8sSUFBSSxXQUFZO0lBQ3ZDLE9BQU8sY0FBYyxDQUFDLE1BQU0sTUFBTTtNQUNoQztRQUNFLE1BQU0sSUFBSSxDQUFDO1VBQUM7VUFBUSxFQUFFO1NBQUM7UUFDdkIsT0FBTyxJQUFJO01BQ2I7SUFDRjtFQUNGO0VBRUEsT0FBTztFQUVQLFNBQVMsT0FBTyxJQUFXO0lBQ3pCLElBQUksQ0FBQyxNQUFNLE1BQU0sRUFBRTtNQUNqQjtJQUNGO0lBQ0EsSUFBSSxNQUFNO01BQ1IsS0FBSyxDQUFDLE1BQU0sTUFBTSxHQUFHLEVBQUUsQ0FBQyxFQUFFLEdBQUc7SUFDL0I7SUFDQSxPQUFPLElBQUksSUFDTixNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsTUFBTSxLQUF1QixHQUMxQyxPQUFPLFNBQVMsV0FBVyxPQUFPLEtBQUssSUFBSSxDQUFDLFNBQVM7SUFHekQsUUFBUSxFQUFFO0VBQ1o7QUFDRiJ9