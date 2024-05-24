import { cursorPosition } from "./ansi_escapes.ts";
/**
 * Get cursor position.
 * @param options  Options.
 * ```
 * const cursor: Cursor = getCursorPosition();
 * console.log(cursor); // { x: 0, y: 14}
 * ```
 */ export function getCursorPosition({ stdin = Deno.stdin, stdout = Deno.stdout } = {}) {
  const data = new Uint8Array(8);
  Deno.stdin.setRaw(true);
  stdout.writeSync(new TextEncoder().encode(cursorPosition));
  stdin.readSync(data);
  Deno.stdin.setRaw(false);
  const [y, x] = new TextDecoder().decode(data).match(/\[(\d+);(\d+)R/)?.slice(1, 3).map(Number) ?? [
    0,
    0
  ];
  return {
    x,
    y
  };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvY2xpZmZ5QHYwLjI1LjcvYW5zaS9jdXJzb3JfcG9zaXRpb24udHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgY3Vyc29yUG9zaXRpb24gfSBmcm9tIFwiLi9hbnNpX2VzY2FwZXMudHNcIjtcblxuLyoqIEN1cnNvciBwb3NpdGlvbi4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgQ3Vyc29yIHtcbiAgeDogbnVtYmVyO1xuICB5OiBudW1iZXI7XG59XG5cbi8qKiBDdXJzb3IgcG9zaXRpb24gb3B0aW9ucy4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgQ3Vyc29yUG9zaXRpb25PcHRpb25zIHtcbiAgc3Rkb3V0PzogRGVuby5Xcml0ZXJTeW5jO1xuICBzdGRpbj86IERlbm8uUmVhZGVyU3luYyAmIHsgcmlkOiBudW1iZXIgfTtcbn1cblxuLyoqXG4gKiBHZXQgY3Vyc29yIHBvc2l0aW9uLlxuICogQHBhcmFtIG9wdGlvbnMgIE9wdGlvbnMuXG4gKiBgYGBcbiAqIGNvbnN0IGN1cnNvcjogQ3Vyc29yID0gZ2V0Q3Vyc29yUG9zaXRpb24oKTtcbiAqIGNvbnNvbGUubG9nKGN1cnNvcik7IC8vIHsgeDogMCwgeTogMTR9XG4gKiBgYGBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldEN1cnNvclBvc2l0aW9uKFxuICB7XG4gICAgc3RkaW4gPSBEZW5vLnN0ZGluLFxuICAgIHN0ZG91dCA9IERlbm8uc3Rkb3V0LFxuICB9OiBDdXJzb3JQb3NpdGlvbk9wdGlvbnMgPSB7fSxcbik6IEN1cnNvciB7XG4gIGNvbnN0IGRhdGEgPSBuZXcgVWludDhBcnJheSg4KTtcblxuICBEZW5vLnN0ZGluLnNldFJhdyh0cnVlKTtcbiAgc3Rkb3V0LndyaXRlU3luYyhuZXcgVGV4dEVuY29kZXIoKS5lbmNvZGUoY3Vyc29yUG9zaXRpb24pKTtcbiAgc3RkaW4ucmVhZFN5bmMoZGF0YSk7XG4gIERlbm8uc3RkaW4uc2V0UmF3KGZhbHNlKTtcblxuICBjb25zdCBbeSwgeF0gPSBuZXcgVGV4dERlY29kZXIoKVxuICAgIC5kZWNvZGUoZGF0YSlcbiAgICAubWF0Y2goL1xcWyhcXGQrKTsoXFxkKylSLylcbiAgICA/LnNsaWNlKDEsIDMpXG4gICAgLm1hcChOdW1iZXIpID8/IFswLCAwXTtcblxuICByZXR1cm4geyB4LCB5IH07XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsU0FBUyxjQUFjLFFBQVEsb0JBQW9CO0FBY25EOzs7Ozs7O0NBT0MsR0FDRCxPQUFPLFNBQVMsa0JBQ2QsRUFDRSxRQUFRLEtBQUssS0FBSyxFQUNsQixTQUFTLEtBQUssTUFBTSxFQUNFLEdBQUcsQ0FBQyxDQUFDO0VBRTdCLE1BQU0sT0FBTyxJQUFJLFdBQVc7RUFFNUIsS0FBSyxLQUFLLENBQUMsTUFBTSxDQUFDO0VBQ2xCLE9BQU8sU0FBUyxDQUFDLElBQUksY0FBYyxNQUFNLENBQUM7RUFDMUMsTUFBTSxRQUFRLENBQUM7RUFDZixLQUFLLEtBQUssQ0FBQyxNQUFNLENBQUM7RUFFbEIsTUFBTSxDQUFDLEdBQUcsRUFBRSxHQUFHLElBQUksY0FDaEIsTUFBTSxDQUFDLE1BQ1AsS0FBSyxDQUFDLG1CQUNMLE1BQU0sR0FBRyxHQUNWLElBQUksV0FBVztJQUFDO0lBQUc7R0FBRTtFQUV4QixPQUFPO0lBQUU7SUFBRztFQUFFO0FBQ2hCIn0=