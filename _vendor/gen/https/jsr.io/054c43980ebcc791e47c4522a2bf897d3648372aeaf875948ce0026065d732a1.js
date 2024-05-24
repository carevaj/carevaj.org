// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
/**
 * Write all the content of the array buffer (`arr`) to the writer (`w`).
 *
 * @example
 * ```ts
 * import { writeAll } from "@std/io/write-all";

 * // Example writing to stdout
 * let contentBytes = new TextEncoder().encode("Hello World");
 * await writeAll(Deno.stdout, contentBytes);
 *
 * // Example writing to file
 * contentBytes = new TextEncoder().encode("Hello World");
 * using file = await Deno.open('test.file', {write: true});
 * await writeAll(file, contentBytes);
 * ```
 */ export async function writeAll(writer, data) {
  let nwritten = 0;
  while(nwritten < data.length){
    nwritten += await writer.write(data.subarray(nwritten));
  }
}
/**
 * Synchronously write all the content of the array buffer (`arr`) to the
 * writer (`w`).
 *
 * @example
 * ```ts
 * import { writeAllSync } from "@std/io/write-all";
 *
 * // Example writing to stdout
 * let contentBytes = new TextEncoder().encode("Hello World");
 * writeAllSync(Deno.stdout, contentBytes);
 *
 * // Example writing to file
 * contentBytes = new TextEncoder().encode("Hello World");
 * using file = Deno.openSync('test.file', {write: true});
 * writeAllSync(file, contentBytes);
 * ```
 */ export function writeAllSync(writer, data) {
  let nwritten = 0;
  while(nwritten < data.length){
    nwritten += writer.writeSync(data.subarray(nwritten));
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0BzdGQvaW8vMC4yMjQuMC93cml0ZV9hbGwudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgtMjAyNCB0aGUgRGVubyBhdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLiBNSVQgbGljZW5zZS5cbi8vIFRoaXMgbW9kdWxlIGlzIGJyb3dzZXIgY29tcGF0aWJsZS5cblxuaW1wb3J0IHR5cGUgeyBXcml0ZXIsIFdyaXRlclN5bmMgfSBmcm9tIFwiLi90eXBlcy50c1wiO1xuXG4vKipcbiAqIFdyaXRlIGFsbCB0aGUgY29udGVudCBvZiB0aGUgYXJyYXkgYnVmZmVyIChgYXJyYCkgdG8gdGhlIHdyaXRlciAoYHdgKS5cbiAqXG4gKiBAZXhhbXBsZVxuICogYGBgdHNcbiAqIGltcG9ydCB7IHdyaXRlQWxsIH0gZnJvbSBcIkBzdGQvaW8vd3JpdGUtYWxsXCI7XG5cbiAqIC8vIEV4YW1wbGUgd3JpdGluZyB0byBzdGRvdXRcbiAqIGxldCBjb250ZW50Qnl0ZXMgPSBuZXcgVGV4dEVuY29kZXIoKS5lbmNvZGUoXCJIZWxsbyBXb3JsZFwiKTtcbiAqIGF3YWl0IHdyaXRlQWxsKERlbm8uc3Rkb3V0LCBjb250ZW50Qnl0ZXMpO1xuICpcbiAqIC8vIEV4YW1wbGUgd3JpdGluZyB0byBmaWxlXG4gKiBjb250ZW50Qnl0ZXMgPSBuZXcgVGV4dEVuY29kZXIoKS5lbmNvZGUoXCJIZWxsbyBXb3JsZFwiKTtcbiAqIHVzaW5nIGZpbGUgPSBhd2FpdCBEZW5vLm9wZW4oJ3Rlc3QuZmlsZScsIHt3cml0ZTogdHJ1ZX0pO1xuICogYXdhaXQgd3JpdGVBbGwoZmlsZSwgY29udGVudEJ5dGVzKTtcbiAqIGBgYFxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gd3JpdGVBbGwod3JpdGVyOiBXcml0ZXIsIGRhdGE6IFVpbnQ4QXJyYXkpIHtcbiAgbGV0IG53cml0dGVuID0gMDtcbiAgd2hpbGUgKG53cml0dGVuIDwgZGF0YS5sZW5ndGgpIHtcbiAgICBud3JpdHRlbiArPSBhd2FpdCB3cml0ZXIud3JpdGUoZGF0YS5zdWJhcnJheShud3JpdHRlbikpO1xuICB9XG59XG5cbi8qKlxuICogU3luY2hyb25vdXNseSB3cml0ZSBhbGwgdGhlIGNvbnRlbnQgb2YgdGhlIGFycmF5IGJ1ZmZlciAoYGFycmApIHRvIHRoZVxuICogd3JpdGVyIChgd2ApLlxuICpcbiAqIEBleGFtcGxlXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgd3JpdGVBbGxTeW5jIH0gZnJvbSBcIkBzdGQvaW8vd3JpdGUtYWxsXCI7XG4gKlxuICogLy8gRXhhbXBsZSB3cml0aW5nIHRvIHN0ZG91dFxuICogbGV0IGNvbnRlbnRCeXRlcyA9IG5ldyBUZXh0RW5jb2RlcigpLmVuY29kZShcIkhlbGxvIFdvcmxkXCIpO1xuICogd3JpdGVBbGxTeW5jKERlbm8uc3Rkb3V0LCBjb250ZW50Qnl0ZXMpO1xuICpcbiAqIC8vIEV4YW1wbGUgd3JpdGluZyB0byBmaWxlXG4gKiBjb250ZW50Qnl0ZXMgPSBuZXcgVGV4dEVuY29kZXIoKS5lbmNvZGUoXCJIZWxsbyBXb3JsZFwiKTtcbiAqIHVzaW5nIGZpbGUgPSBEZW5vLm9wZW5TeW5jKCd0ZXN0LmZpbGUnLCB7d3JpdGU6IHRydWV9KTtcbiAqIHdyaXRlQWxsU3luYyhmaWxlLCBjb250ZW50Qnl0ZXMpO1xuICogYGBgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB3cml0ZUFsbFN5bmMod3JpdGVyOiBXcml0ZXJTeW5jLCBkYXRhOiBVaW50OEFycmF5KSB7XG4gIGxldCBud3JpdHRlbiA9IDA7XG4gIHdoaWxlIChud3JpdHRlbiA8IGRhdGEubGVuZ3RoKSB7XG4gICAgbndyaXR0ZW4gKz0gd3JpdGVyLndyaXRlU3luYyhkYXRhLnN1YmFycmF5KG53cml0dGVuKSk7XG4gIH1cbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSwwRUFBMEU7QUFDMUUscUNBQXFDO0FBSXJDOzs7Ozs7Ozs7Ozs7Ozs7O0NBZ0JDLEdBQ0QsT0FBTyxlQUFlLFNBQVMsTUFBYyxFQUFFLElBQWdCO0VBQzdELElBQUksV0FBVztFQUNmLE1BQU8sV0FBVyxLQUFLLE1BQU0sQ0FBRTtJQUM3QixZQUFZLE1BQU0sT0FBTyxLQUFLLENBQUMsS0FBSyxRQUFRLENBQUM7RUFDL0M7QUFDRjtBQUVBOzs7Ozs7Ozs7Ozs7Ozs7OztDQWlCQyxHQUNELE9BQU8sU0FBUyxhQUFhLE1BQWtCLEVBQUUsSUFBZ0I7RUFDL0QsSUFBSSxXQUFXO0VBQ2YsTUFBTyxXQUFXLEtBQUssTUFBTSxDQUFFO0lBQzdCLFlBQVksT0FBTyxTQUFTLENBQUMsS0FBSyxRQUFRLENBQUM7RUFDN0M7QUFDRiJ9