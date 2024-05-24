// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// TODO(kt3k): Write test when pty is supported in Deno
// See: https://github.com/denoland/deno/issues/3994
const encoder = new TextEncoder();
const LINE_CLEAR = encoder.encode("\r\u001b[K"); // From cli/prompt_secret.ts
const COLOR_RESET = "\u001b[0m";
const DEFAULT_INTERVAL = 75;
const DEFAULT_SPINNER = [
  "⠋",
  "⠙",
  "⠹",
  "⠸",
  "⠼",
  "⠴",
  "⠦",
  "⠧",
  "⠇",
  "⠏"
];
const COLORS = {
  black: "\u001b[30m",
  red: "\u001b[31m",
  green: "\u001b[32m",
  yellow: "\u001b[33m",
  blue: "\u001b[34m",
  magenta: "\u001b[35m",
  cyan: "\u001b[36m",
  white: "\u001b[37m",
  gray: "\u001b[90m"
};
/**
 * A spinner that can be used to indicate that something is loading.
 */ export class Spinner {
  #spinner;
  /** The message to display next to the spinner. */ message;
  #interval;
  #color;
  #intervalId;
  #active = false;
  /**
   * Creates a new spinner.
   *
   * @example
   * ```ts
   * import { Spinner } from "@std/cli/spinner";
   *
   * const spinner = new Spinner({ message: "Loading..." });
   * ```
   */ constructor({ spinner = DEFAULT_SPINNER, message = "", interval = DEFAULT_INTERVAL, color } = {}){
    this.#spinner = spinner;
    this.message = message;
    this.#interval = interval;
    this.color = color;
  }
  /**
   * Set the color of the spinner. This defaults to the default terminal color.
   * This can be changed while the spinner is active.
   */ set color(value) {
    this.#color = value ? COLORS[value] : undefined;
  }
  get color() {
    return this.#color;
  }
  /**
   * Starts the spinner.
   *
   * @example
   * ```ts
   * import { Spinner } from "@std/cli/spinner";
   *
   * const spinner = new Spinner({ message: "Loading..." });
   * spinner.start();
   * ```
   */ start() {
    if (this.#active || Deno.stdout.writable.locked) return;
    this.#active = true;
    let i = 0;
    const noColor = Deno.noColor;
    // Updates the spinner after the given interval.
    const updateFrame = ()=>{
      const color = this.#color ?? "";
      Deno.stdout.writeSync(LINE_CLEAR);
      const frame = encoder.encode(noColor ? this.#spinner[i] + " " + this.message : color + this.#spinner[i] + COLOR_RESET + " " + this.message);
      Deno.stdout.writeSync(frame);
      i = (i + 1) % this.#spinner.length;
    };
    this.#intervalId = setInterval(updateFrame, this.#interval);
  }
  /**
   * Stops the spinner.
   *
   * @example
   * ```ts
   * import { Spinner } from "@std/cli/spinner";
   *
   * const spinner = new Spinner({ message: "Loading..." });
   * spinner.start();
   *
   * setTimeout(() => {
   *  spinner.stop();
   *  console.log("Finished loading!");
   * }, 3000);
   * ```
   */ stop() {
    if (this.#intervalId && this.#active) {
      clearInterval(this.#intervalId);
      Deno.stdout.writeSync(LINE_CLEAR); // Clear the current line
      this.#active = false;
    }
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0BzdGQvY2xpLzAuMjI0LjIvc3Bpbm5lci50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDI0IHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuXG4vLyBUT0RPKGt0M2spOiBXcml0ZSB0ZXN0IHdoZW4gcHR5IGlzIHN1cHBvcnRlZCBpbiBEZW5vXG4vLyBTZWU6IGh0dHBzOi8vZ2l0aHViLmNvbS9kZW5vbGFuZC9kZW5vL2lzc3Vlcy8zOTk0XG5cbmNvbnN0IGVuY29kZXIgPSBuZXcgVGV4dEVuY29kZXIoKTtcblxuY29uc3QgTElORV9DTEVBUiA9IGVuY29kZXIuZW5jb2RlKFwiXFxyXFx1MDAxYltLXCIpOyAvLyBGcm9tIGNsaS9wcm9tcHRfc2VjcmV0LnRzXG5jb25zdCBDT0xPUl9SRVNFVCA9IFwiXFx1MDAxYlswbVwiO1xuY29uc3QgREVGQVVMVF9JTlRFUlZBTCA9IDc1O1xuY29uc3QgREVGQVVMVF9TUElOTkVSID0gW1wi4qCLXCIsIFwi4qCZXCIsIFwi4qC5XCIsIFwi4qC4XCIsIFwi4qC8XCIsIFwi4qC0XCIsIFwi4qCmXCIsIFwi4qCnXCIsIFwi4qCHXCIsIFwi4qCPXCJdO1xuXG4vKipcbiAqIFRoaXMgaXMgYSBoYWNrIHRvIGFsbG93IHVzIHRvIHVzZSB0aGUgc2FtZSB0eXBlIGZvciBib3RoIHRoZSBjb2xvciBuYW1lIGFuZFxuICogYW4gQU5TSSBlc2NhcGUgY29kZS5cbiAqXG4gKiBAc2VlIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vbWljcm9zb2Z0L1R5cGVTY3JpcHQvaXNzdWVzLzI5NzI5I2lzc3VlY29tbWVudC00NjAzNDY0MjF9XG4gKlxuICogQGludGVybmFsXG4gKi9cbi8vIGRlbm8tbGludC1pZ25vcmUgYmFuLXR5cGVzXG5leHBvcnQgdHlwZSBBbnNpID0gc3RyaW5nICYge307XG5cbi8qKiBDb2xvciBvcHRpb25zIGZvciB7QGxpbmtjb2RlIFNwaW5uZXJPcHRpb25zLmNvbG9yfS4gKi9cbmV4cG9ydCB0eXBlIENvbG9yID1cbiAgfCBcImJsYWNrXCJcbiAgfCBcInJlZFwiXG4gIHwgXCJncmVlblwiXG4gIHwgXCJ5ZWxsb3dcIlxuICB8IFwiYmx1ZVwiXG4gIHwgXCJtYWdlbnRhXCJcbiAgfCBcImN5YW5cIlxuICB8IFwid2hpdGVcIlxuICB8IFwiZ3JheVwiXG4gIHwgQW5zaTtcblxuY29uc3QgQ09MT1JTOiBSZWNvcmQ8Q29sb3IsIHN0cmluZz4gPSB7XG4gIGJsYWNrOiBcIlxcdTAwMWJbMzBtXCIsXG4gIHJlZDogXCJcXHUwMDFiWzMxbVwiLFxuICBncmVlbjogXCJcXHUwMDFiWzMybVwiLFxuICB5ZWxsb3c6IFwiXFx1MDAxYlszM21cIixcbiAgYmx1ZTogXCJcXHUwMDFiWzM0bVwiLFxuICBtYWdlbnRhOiBcIlxcdTAwMWJbMzVtXCIsXG4gIGN5YW46IFwiXFx1MDAxYlszNm1cIixcbiAgd2hpdGU6IFwiXFx1MDAxYlszN21cIixcbiAgZ3JheTogXCJcXHUwMDFiWzkwbVwiLFxufTtcblxuLyoqIE9wdGlvbnMgZm9yIHtAbGlua2NvZGUgU3Bpbm5lcn0uICovXG5leHBvcnQgaW50ZXJmYWNlIFNwaW5uZXJPcHRpb25zIHtcbiAgLyoqXG4gICAqIFRoZSBzZXF1ZW5jZSBvZiBjaGFyYWN0ZXJzIHRvIGJlIGl0ZXJhdGVkIHRocm91Z2ggZm9yIGFuaW1hdGlvbi5cbiAgICpcbiAgICogQGRlZmF1bHQge1tcIuKgi1wiLCBcIuKgmVwiLCBcIuKguVwiLCBcIuKguFwiLCBcIuKgvFwiLCBcIuKgtFwiLCBcIuKgplwiLCBcIuKgp1wiLCBcIuKgh1wiLCBcIuKgj1wiXX1cbiAgICovXG4gIHNwaW5uZXI/OiBzdHJpbmdbXTtcbiAgLyoqXG4gICAqIFRoZSBtZXNzYWdlIHRvIGRpc3BsYXkgbmV4dCB0byB0aGUgc3Bpbm5lci4gVGhpcyBjYW4gYmUgY2hhbmdlZCB3aGlsZSB0aGVcbiAgICogc3Bpbm5lciBpcyBhY3RpdmUuXG4gICAqL1xuICBtZXNzYWdlPzogc3RyaW5nO1xuICAvKipcbiAgICogVGhlIHRpbWUgYmV0d2VlbiBlYWNoIGZyYW1lIG9mIHRoZSBzcGlubmVyIGluIG1pbGxpc2Vjb25kcy5cbiAgICpcbiAgICogQGRlZmF1bHQgezc1fVxuICAgKi9cbiAgaW50ZXJ2YWw/OiBudW1iZXI7XG4gIC8qKlxuICAgKiBUaGUgY29sb3Igb2YgdGhlIHNwaW5uZXIuIERlZmF1bHRzIHRvIHRoZSBkZWZhdWx0IHRlcm1pbmFsIGNvbG9yLlxuICAgKiBUaGlzIGNhbiBiZSBjaGFuZ2VkIHdoaWxlIHRoZSBzcGlubmVyIGlzIGFjdGl2ZS5cbiAgICovXG4gIGNvbG9yPzogQ29sb3I7XG59XG5cbi8qKlxuICogQSBzcGlubmVyIHRoYXQgY2FuIGJlIHVzZWQgdG8gaW5kaWNhdGUgdGhhdCBzb21ldGhpbmcgaXMgbG9hZGluZy5cbiAqL1xuZXhwb3J0IGNsYXNzIFNwaW5uZXIge1xuICAjc3Bpbm5lcjogc3RyaW5nW107XG4gIC8qKiBUaGUgbWVzc2FnZSB0byBkaXNwbGF5IG5leHQgdG8gdGhlIHNwaW5uZXIuICovXG4gIG1lc3NhZ2U6IHN0cmluZztcbiAgI2ludGVydmFsOiBudW1iZXI7XG4gICNjb2xvcj86IENvbG9yO1xuICAjaW50ZXJ2YWxJZDogbnVtYmVyIHwgdW5kZWZpbmVkO1xuICAjYWN0aXZlID0gZmFsc2U7XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgc3Bpbm5lci5cbiAgICpcbiAgICogQGV4YW1wbGVcbiAgICogYGBgdHNcbiAgICogaW1wb3J0IHsgU3Bpbm5lciB9IGZyb20gXCJAc3RkL2NsaS9zcGlubmVyXCI7XG4gICAqXG4gICAqIGNvbnN0IHNwaW5uZXIgPSBuZXcgU3Bpbm5lcih7IG1lc3NhZ2U6IFwiTG9hZGluZy4uLlwiIH0pO1xuICAgKiBgYGBcbiAgICovXG4gIGNvbnN0cnVjdG9yKFxuICAgIHtcbiAgICAgIHNwaW5uZXIgPSBERUZBVUxUX1NQSU5ORVIsXG4gICAgICBtZXNzYWdlID0gXCJcIixcbiAgICAgIGludGVydmFsID0gREVGQVVMVF9JTlRFUlZBTCxcbiAgICAgIGNvbG9yLFxuICAgIH06IFNwaW5uZXJPcHRpb25zID0ge30sXG4gICkge1xuICAgIHRoaXMuI3NwaW5uZXIgPSBzcGlubmVyO1xuICAgIHRoaXMubWVzc2FnZSA9IG1lc3NhZ2U7XG4gICAgdGhpcy4jaW50ZXJ2YWwgPSBpbnRlcnZhbDtcbiAgICB0aGlzLmNvbG9yID0gY29sb3I7XG4gIH1cblxuICAvKipcbiAgICogU2V0IHRoZSBjb2xvciBvZiB0aGUgc3Bpbm5lci4gVGhpcyBkZWZhdWx0cyB0byB0aGUgZGVmYXVsdCB0ZXJtaW5hbCBjb2xvci5cbiAgICogVGhpcyBjYW4gYmUgY2hhbmdlZCB3aGlsZSB0aGUgc3Bpbm5lciBpcyBhY3RpdmUuXG4gICAqL1xuICBzZXQgY29sb3IodmFsdWU6IENvbG9yIHwgdW5kZWZpbmVkKSB7XG4gICAgdGhpcy4jY29sb3IgPSB2YWx1ZSA/IENPTE9SU1t2YWx1ZV0gOiB1bmRlZmluZWQ7XG4gIH1cblxuICBnZXQgY29sb3IoKTogQ29sb3IgfCB1bmRlZmluZWQge1xuICAgIHJldHVybiB0aGlzLiNjb2xvcjtcbiAgfVxuXG4gIC8qKlxuICAgKiBTdGFydHMgdGhlIHNwaW5uZXIuXG4gICAqXG4gICAqIEBleGFtcGxlXG4gICAqIGBgYHRzXG4gICAqIGltcG9ydCB7IFNwaW5uZXIgfSBmcm9tIFwiQHN0ZC9jbGkvc3Bpbm5lclwiO1xuICAgKlxuICAgKiBjb25zdCBzcGlubmVyID0gbmV3IFNwaW5uZXIoeyBtZXNzYWdlOiBcIkxvYWRpbmcuLi5cIiB9KTtcbiAgICogc3Bpbm5lci5zdGFydCgpO1xuICAgKiBgYGBcbiAgICovXG4gIHN0YXJ0KCkge1xuICAgIGlmICh0aGlzLiNhY3RpdmUgfHwgRGVuby5zdGRvdXQud3JpdGFibGUubG9ja2VkKSByZXR1cm47XG4gICAgdGhpcy4jYWN0aXZlID0gdHJ1ZTtcbiAgICBsZXQgaSA9IDA7XG4gICAgY29uc3Qgbm9Db2xvciA9IERlbm8ubm9Db2xvcjtcbiAgICAvLyBVcGRhdGVzIHRoZSBzcGlubmVyIGFmdGVyIHRoZSBnaXZlbiBpbnRlcnZhbC5cbiAgICBjb25zdCB1cGRhdGVGcmFtZSA9ICgpID0+IHtcbiAgICAgIGNvbnN0IGNvbG9yID0gdGhpcy4jY29sb3IgPz8gXCJcIjtcbiAgICAgIERlbm8uc3Rkb3V0LndyaXRlU3luYyhMSU5FX0NMRUFSKTtcbiAgICAgIGNvbnN0IGZyYW1lID0gZW5jb2Rlci5lbmNvZGUoXG4gICAgICAgIG5vQ29sb3JcbiAgICAgICAgICA/IHRoaXMuI3NwaW5uZXJbaV0gKyBcIiBcIiArIHRoaXMubWVzc2FnZVxuICAgICAgICAgIDogY29sb3IgKyB0aGlzLiNzcGlubmVyW2ldICsgQ09MT1JfUkVTRVQgKyBcIiBcIiArIHRoaXMubWVzc2FnZSxcbiAgICAgICk7XG4gICAgICBEZW5vLnN0ZG91dC53cml0ZVN5bmMoZnJhbWUpO1xuICAgICAgaSA9IChpICsgMSkgJSB0aGlzLiNzcGlubmVyLmxlbmd0aDtcbiAgICB9O1xuICAgIHRoaXMuI2ludGVydmFsSWQgPSBzZXRJbnRlcnZhbCh1cGRhdGVGcmFtZSwgdGhpcy4jaW50ZXJ2YWwpO1xuICB9XG4gIC8qKlxuICAgKiBTdG9wcyB0aGUgc3Bpbm5lci5cbiAgICpcbiAgICogQGV4YW1wbGVcbiAgICogYGBgdHNcbiAgICogaW1wb3J0IHsgU3Bpbm5lciB9IGZyb20gXCJAc3RkL2NsaS9zcGlubmVyXCI7XG4gICAqXG4gICAqIGNvbnN0IHNwaW5uZXIgPSBuZXcgU3Bpbm5lcih7IG1lc3NhZ2U6IFwiTG9hZGluZy4uLlwiIH0pO1xuICAgKiBzcGlubmVyLnN0YXJ0KCk7XG4gICAqXG4gICAqIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgKiAgc3Bpbm5lci5zdG9wKCk7XG4gICAqICBjb25zb2xlLmxvZyhcIkZpbmlzaGVkIGxvYWRpbmchXCIpO1xuICAgKiB9LCAzMDAwKTtcbiAgICogYGBgXG4gICAqL1xuICBzdG9wKCkge1xuICAgIGlmICh0aGlzLiNpbnRlcnZhbElkICYmIHRoaXMuI2FjdGl2ZSkge1xuICAgICAgY2xlYXJJbnRlcnZhbCh0aGlzLiNpbnRlcnZhbElkKTtcbiAgICAgIERlbm8uc3Rkb3V0LndyaXRlU3luYyhMSU5FX0NMRUFSKTsgLy8gQ2xlYXIgdGhlIGN1cnJlbnQgbGluZVxuICAgICAgdGhpcy4jYWN0aXZlID0gZmFsc2U7XG4gICAgfVxuICB9XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsMEVBQTBFO0FBRTFFLHVEQUF1RDtBQUN2RCxvREFBb0Q7QUFFcEQsTUFBTSxVQUFVLElBQUk7QUFFcEIsTUFBTSxhQUFhLFFBQVEsTUFBTSxDQUFDLGVBQWUsNEJBQTRCO0FBQzdFLE1BQU0sY0FBYztBQUNwQixNQUFNLG1CQUFtQjtBQUN6QixNQUFNLGtCQUFrQjtFQUFDO0VBQUs7RUFBSztFQUFLO0VBQUs7RUFBSztFQUFLO0VBQUs7RUFBSztFQUFLO0NBQUk7QUEwQjFFLE1BQU0sU0FBZ0M7RUFDcEMsT0FBTztFQUNQLEtBQUs7RUFDTCxPQUFPO0VBQ1AsUUFBUTtFQUNSLE1BQU07RUFDTixTQUFTO0VBQ1QsTUFBTTtFQUNOLE9BQU87RUFDUCxNQUFNO0FBQ1I7QUE0QkE7O0NBRUMsR0FDRCxPQUFPLE1BQU07RUFDWCxDQUFDLE9BQU8sQ0FBVztFQUNuQixnREFBZ0QsR0FDaEQsUUFBZ0I7RUFDaEIsQ0FBQyxRQUFRLENBQVM7RUFDbEIsQ0FBQyxLQUFLLENBQVM7RUFDZixDQUFDLFVBQVUsQ0FBcUI7RUFDaEMsQ0FBQyxNQUFNLEdBQUcsTUFBTTtFQUVoQjs7Ozs7Ozs7O0dBU0MsR0FDRCxZQUNFLEVBQ0UsVUFBVSxlQUFlLEVBQ3pCLFVBQVUsRUFBRSxFQUNaLFdBQVcsZ0JBQWdCLEVBQzNCLEtBQUssRUFDVSxHQUFHLENBQUMsQ0FBQyxDQUN0QjtJQUNBLElBQUksQ0FBQyxDQUFDLE9BQU8sR0FBRztJQUNoQixJQUFJLENBQUMsT0FBTyxHQUFHO0lBQ2YsSUFBSSxDQUFDLENBQUMsUUFBUSxHQUFHO0lBQ2pCLElBQUksQ0FBQyxLQUFLLEdBQUc7RUFDZjtFQUVBOzs7R0FHQyxHQUNELElBQUksTUFBTSxLQUF3QixFQUFFO0lBQ2xDLElBQUksQ0FBQyxDQUFDLEtBQUssR0FBRyxRQUFRLE1BQU0sQ0FBQyxNQUFNLEdBQUc7RUFDeEM7RUFFQSxJQUFJLFFBQTJCO0lBQzdCLE9BQU8sSUFBSSxDQUFDLENBQUMsS0FBSztFQUNwQjtFQUVBOzs7Ozs7Ozs7O0dBVUMsR0FDRCxRQUFRO0lBQ04sSUFBSSxJQUFJLENBQUMsQ0FBQyxNQUFNLElBQUksS0FBSyxNQUFNLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRTtJQUNqRCxJQUFJLENBQUMsQ0FBQyxNQUFNLEdBQUc7SUFDZixJQUFJLElBQUk7SUFDUixNQUFNLFVBQVUsS0FBSyxPQUFPO0lBQzVCLGdEQUFnRDtJQUNoRCxNQUFNLGNBQWM7TUFDbEIsTUFBTSxRQUFRLElBQUksQ0FBQyxDQUFDLEtBQUssSUFBSTtNQUM3QixLQUFLLE1BQU0sQ0FBQyxTQUFTLENBQUM7TUFDdEIsTUFBTSxRQUFRLFFBQVEsTUFBTSxDQUMxQixVQUNJLElBQUksQ0FBQyxDQUFDLE9BQU8sQ0FBQyxFQUFFLEdBQUcsTUFBTSxJQUFJLENBQUMsT0FBTyxHQUNyQyxRQUFRLElBQUksQ0FBQyxDQUFDLE9BQU8sQ0FBQyxFQUFFLEdBQUcsY0FBYyxNQUFNLElBQUksQ0FBQyxPQUFPO01BRWpFLEtBQUssTUFBTSxDQUFDLFNBQVMsQ0FBQztNQUN0QixJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksSUFBSSxDQUFDLENBQUMsT0FBTyxDQUFDLE1BQU07SUFDcEM7SUFDQSxJQUFJLENBQUMsQ0FBQyxVQUFVLEdBQUcsWUFBWSxhQUFhLElBQUksQ0FBQyxDQUFDLFFBQVE7RUFDNUQ7RUFDQTs7Ozs7Ozs7Ozs7Ozs7O0dBZUMsR0FDRCxPQUFPO0lBQ0wsSUFBSSxJQUFJLENBQUMsQ0FBQyxVQUFVLElBQUksSUFBSSxDQUFDLENBQUMsTUFBTSxFQUFFO01BQ3BDLGNBQWMsSUFBSSxDQUFDLENBQUMsVUFBVTtNQUM5QixLQUFLLE1BQU0sQ0FBQyxTQUFTLENBQUMsYUFBYSx5QkFBeUI7TUFDNUQsSUFBSSxDQUFDLENBQUMsTUFBTSxHQUFHO0lBQ2pCO0VBQ0Y7QUFDRiJ9