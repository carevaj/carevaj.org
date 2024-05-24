// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
import { assert } from "jsr:/@std/assert@^0.225.3/assert";
/**
 * A transform stream that only transforms from the zero-indexed `start` and
 * `end` bytes (both inclusive).
 *
 * @example
 * ```ts
 * import { ByteSliceStream } from "@std/streams/byte-slice-stream";
 *
 * const response = await fetch("https://example.com");
 * const rangedStream = response.body!
 *   .pipeThrough(new ByteSliceStream(3, 8));
 * ```
 */ export class ByteSliceStream extends TransformStream {
  #offsetStart = 0;
  #offsetEnd = 0;
  /** Constructs a new instance. */ constructor(start = 0, end = Infinity){
    super({
      start: ()=>{
        assert(start >= 0, "`start` must be greater than 0");
        end += 1;
      },
      transform: (chunk, controller)=>{
        this.#offsetStart = this.#offsetEnd;
        this.#offsetEnd += chunk.byteLength;
        if (this.#offsetEnd > start) {
          if (this.#offsetStart < start) {
            chunk = chunk.slice(start - this.#offsetStart);
          }
          if (this.#offsetEnd >= end) {
            chunk = chunk.slice(0, chunk.byteLength - this.#offsetEnd + end);
            controller.enqueue(chunk);
            controller.terminate();
          } else {
            controller.enqueue(chunk);
          }
        }
      }
    });
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0BzdGQvc3RyZWFtcy8wLjIyNC4xL2J5dGVfc2xpY2Vfc3RyZWFtLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjQgdGhlIERlbm8gYXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gTUlUIGxpY2Vuc2UuXG4vLyBUaGlzIG1vZHVsZSBpcyBicm93c2VyIGNvbXBhdGlibGUuXG5cbmltcG9ydCB7IGFzc2VydCB9IGZyb20gXCJqc3I6L0BzdGQvYXNzZXJ0QF4wLjIyNS4zL2Fzc2VydFwiO1xuXG4vKipcbiAqIEEgdHJhbnNmb3JtIHN0cmVhbSB0aGF0IG9ubHkgdHJhbnNmb3JtcyBmcm9tIHRoZSB6ZXJvLWluZGV4ZWQgYHN0YXJ0YCBhbmRcbiAqIGBlbmRgIGJ5dGVzIChib3RoIGluY2x1c2l2ZSkuXG4gKlxuICogQGV4YW1wbGVcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyBCeXRlU2xpY2VTdHJlYW0gfSBmcm9tIFwiQHN0ZC9zdHJlYW1zL2J5dGUtc2xpY2Utc3RyZWFtXCI7XG4gKlxuICogY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaChcImh0dHBzOi8vZXhhbXBsZS5jb21cIik7XG4gKiBjb25zdCByYW5nZWRTdHJlYW0gPSByZXNwb25zZS5ib2R5IVxuICogICAucGlwZVRocm91Z2gobmV3IEJ5dGVTbGljZVN0cmVhbSgzLCA4KSk7XG4gKiBgYGBcbiAqL1xuZXhwb3J0IGNsYXNzIEJ5dGVTbGljZVN0cmVhbSBleHRlbmRzIFRyYW5zZm9ybVN0cmVhbTxVaW50OEFycmF5LCBVaW50OEFycmF5PiB7XG4gICNvZmZzZXRTdGFydCA9IDA7XG4gICNvZmZzZXRFbmQgPSAwO1xuXG4gIC8qKiBDb25zdHJ1Y3RzIGEgbmV3IGluc3RhbmNlLiAqL1xuICBjb25zdHJ1Y3RvcihzdGFydCA9IDAsIGVuZDogbnVtYmVyID0gSW5maW5pdHkpIHtcbiAgICBzdXBlcih7XG4gICAgICBzdGFydDogKCkgPT4ge1xuICAgICAgICBhc3NlcnQoc3RhcnQgPj0gMCwgXCJgc3RhcnRgIG11c3QgYmUgZ3JlYXRlciB0aGFuIDBcIik7XG4gICAgICAgIGVuZCArPSAxO1xuICAgICAgfSxcbiAgICAgIHRyYW5zZm9ybTogKGNodW5rLCBjb250cm9sbGVyKSA9PiB7XG4gICAgICAgIHRoaXMuI29mZnNldFN0YXJ0ID0gdGhpcy4jb2Zmc2V0RW5kO1xuICAgICAgICB0aGlzLiNvZmZzZXRFbmQgKz0gY2h1bmsuYnl0ZUxlbmd0aDtcbiAgICAgICAgaWYgKHRoaXMuI29mZnNldEVuZCA+IHN0YXJ0KSB7XG4gICAgICAgICAgaWYgKHRoaXMuI29mZnNldFN0YXJ0IDwgc3RhcnQpIHtcbiAgICAgICAgICAgIGNodW5rID0gY2h1bmsuc2xpY2Uoc3RhcnQgLSB0aGlzLiNvZmZzZXRTdGFydCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmICh0aGlzLiNvZmZzZXRFbmQgPj0gZW5kKSB7XG4gICAgICAgICAgICBjaHVuayA9IGNodW5rLnNsaWNlKDAsIGNodW5rLmJ5dGVMZW5ndGggLSB0aGlzLiNvZmZzZXRFbmQgKyBlbmQpO1xuICAgICAgICAgICAgY29udHJvbGxlci5lbnF1ZXVlKGNodW5rKTtcbiAgICAgICAgICAgIGNvbnRyb2xsZXIudGVybWluYXRlKCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnRyb2xsZXIuZW5xdWV1ZShjaHVuayk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9LFxuICAgIH0pO1xuICB9XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsMEVBQTBFO0FBQzFFLHFDQUFxQztBQUVyQyxTQUFTLE1BQU0sUUFBUSxtQ0FBbUM7QUFFMUQ7Ozs7Ozs7Ozs7OztDQVlDLEdBQ0QsT0FBTyxNQUFNLHdCQUF3QjtFQUNuQyxDQUFDLFdBQVcsR0FBRyxFQUFFO0VBQ2pCLENBQUMsU0FBUyxHQUFHLEVBQUU7RUFFZiwrQkFBK0IsR0FDL0IsWUFBWSxRQUFRLENBQUMsRUFBRSxNQUFjLFFBQVEsQ0FBRTtJQUM3QyxLQUFLLENBQUM7TUFDSixPQUFPO1FBQ0wsT0FBTyxTQUFTLEdBQUc7UUFDbkIsT0FBTztNQUNUO01BQ0EsV0FBVyxDQUFDLE9BQU87UUFDakIsSUFBSSxDQUFDLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQyxDQUFDLFNBQVM7UUFDbkMsSUFBSSxDQUFDLENBQUMsU0FBUyxJQUFJLE1BQU0sVUFBVTtRQUNuQyxJQUFJLElBQUksQ0FBQyxDQUFDLFNBQVMsR0FBRyxPQUFPO1VBQzNCLElBQUksSUFBSSxDQUFDLENBQUMsV0FBVyxHQUFHLE9BQU87WUFDN0IsUUFBUSxNQUFNLEtBQUssQ0FBQyxRQUFRLElBQUksQ0FBQyxDQUFDLFdBQVc7VUFDL0M7VUFDQSxJQUFJLElBQUksQ0FBQyxDQUFDLFNBQVMsSUFBSSxLQUFLO1lBQzFCLFFBQVEsTUFBTSxLQUFLLENBQUMsR0FBRyxNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsQ0FBQyxTQUFTLEdBQUc7WUFDNUQsV0FBVyxPQUFPLENBQUM7WUFDbkIsV0FBVyxTQUFTO1VBQ3RCLE9BQU87WUFDTCxXQUFXLE9BQU8sQ0FBQztVQUNyQjtRQUNGO01BQ0Y7SUFDRjtFQUNGO0FBQ0YifQ==