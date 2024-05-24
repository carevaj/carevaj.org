// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import { existsSync } from "jsr:/@std/fs@^0.229.0/exists";
import { FileHandler } from "./file_handler.ts";
/**
 * This handler extends the functionality of the {@linkcode FileHandler} by
 * "rotating" the log file when it reaches a certain size. `maxBytes` specifies
 * the maximum size in bytes that the log file can grow to before rolling over
 * to a new one. If the size of the new log message plus the current log file
 * size exceeds `maxBytes` then a roll-over is triggered. When a roll-over
 * occurs, before the log message is written, the log file is renamed and
 * appended with `.1`. If a `.1` version already existed, it would have been
 * renamed `.2` first and so on. The maximum number of log files to keep is
 * specified by `maxBackupCount`. After the renames are complete the log message
 * is written to the original, now blank, file.
 *
 * Example: Given `log.txt`, `log.txt.1`, `log.txt.2` and `log.txt.3`, a
 * `maxBackupCount` of 3 and a new log message which would cause `log.txt` to
 * exceed `maxBytes`, then `log.txt.2` would be renamed to `log.txt.3` (thereby
 * discarding the original contents of `log.txt.3` since 3 is the maximum number
 * of backups to keep), `log.txt.1` would be renamed to `log.txt.2`, `log.txt`
 * would be renamed to `log.txt.1` and finally `log.txt` would be created from
 * scratch where the new log message would be written.
 *
 * This handler uses a buffer for writing log messages to file. Logs can be
 * manually flushed with `fileHandler.flush()`. Log messages with a log level
 * greater than ERROR are immediately flushed. Logs are also flushed on process
 * completion.
 *
 * Additional notes on `mode` as described above:
 *
 * - `'a'` Default mode. As above, this will pick up where the logs left off in
 *   rotation, or create a new log file if it doesn't exist.
 * - `'w'` in addition to starting with a clean `filename`, this mode will also
 *   cause any existing backups (up to `maxBackupCount`) to be deleted on setup
 *   giving a fully clean slate.
 * - `'x'` requires that neither `filename`, nor any backups (up to
 *   `maxBackupCount`), exist before setup.
 *
 * This handler requires both `--allow-read` and `--allow-write` permissions on
 * the log files.
 */ export class RotatingFileHandler extends FileHandler {
  #maxBytes;
  #maxBackupCount;
  #currentFileSize = 0;
  constructor(levelName, options){
    super(levelName, options);
    this.#maxBytes = options.maxBytes;
    this.#maxBackupCount = options.maxBackupCount;
  }
  setup() {
    if (this.#maxBytes < 1) {
      this.destroy();
      throw new Error("maxBytes cannot be less than 1");
    }
    if (this.#maxBackupCount < 1) {
      this.destroy();
      throw new Error("maxBackupCount cannot be less than 1");
    }
    super.setup();
    if (this._mode === "w") {
      // Remove old backups too as it doesn't make sense to start with a clean
      // log file, but old backups
      for(let i = 1; i <= this.#maxBackupCount; i++){
        try {
          Deno.removeSync(this._filename + "." + i);
        } catch (error) {
          if (!(error instanceof Deno.errors.NotFound)) {
            throw error;
          }
        }
      }
    } else if (this._mode === "x") {
      // Throw if any backups also exist
      for(let i = 1; i <= this.#maxBackupCount; i++){
        if (existsSync(this._filename + "." + i)) {
          this.destroy();
          throw new Deno.errors.AlreadyExists("Backup log file " + this._filename + "." + i + " already exists");
        }
      }
    } else {
      this.#currentFileSize = Deno.statSync(this._filename).size;
    }
  }
  log(msg) {
    const msgByteLength = this._encoder.encode(msg).byteLength + 1;
    if (this.#currentFileSize + msgByteLength > this.#maxBytes) {
      this.rotateLogFiles();
      this.#currentFileSize = 0;
    }
    super.log(msg);
    this.#currentFileSize += msgByteLength;
  }
  rotateLogFiles() {
    this.flush();
    this._file.close();
    for(let i = this.#maxBackupCount - 1; i >= 0; i--){
      const source = this._filename + (i === 0 ? "" : "." + i);
      const dest = this._filename + "." + (i + 1);
      if (existsSync(source)) {
        Deno.renameSync(source, dest);
      }
    }
    this._file = Deno.openSync(this._filename, this._openOptions);
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0BzdGQvbG9nLzAuMjI0LjEvcm90YXRpbmdfZmlsZV9oYW5kbGVyLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjQgdGhlIERlbm8gYXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gTUlUIGxpY2Vuc2UuXG5pbXBvcnQgdHlwZSB7IExldmVsTmFtZSB9IGZyb20gXCIuL2xldmVscy50c1wiO1xuaW1wb3J0IHsgZXhpc3RzU3luYyB9IGZyb20gXCJqc3I6L0BzdGQvZnNAXjAuMjI5LjAvZXhpc3RzXCI7XG5pbXBvcnQgeyBGaWxlSGFuZGxlciwgdHlwZSBGaWxlSGFuZGxlck9wdGlvbnMgfSBmcm9tIFwiLi9maWxlX2hhbmRsZXIudHNcIjtcblxuaW50ZXJmYWNlIFJvdGF0aW5nRmlsZUhhbmRsZXJPcHRpb25zIGV4dGVuZHMgRmlsZUhhbmRsZXJPcHRpb25zIHtcbiAgbWF4Qnl0ZXM6IG51bWJlcjtcbiAgbWF4QmFja3VwQ291bnQ6IG51bWJlcjtcbn1cblxuLyoqXG4gKiBUaGlzIGhhbmRsZXIgZXh0ZW5kcyB0aGUgZnVuY3Rpb25hbGl0eSBvZiB0aGUge0BsaW5rY29kZSBGaWxlSGFuZGxlcn0gYnlcbiAqIFwicm90YXRpbmdcIiB0aGUgbG9nIGZpbGUgd2hlbiBpdCByZWFjaGVzIGEgY2VydGFpbiBzaXplLiBgbWF4Qnl0ZXNgIHNwZWNpZmllc1xuICogdGhlIG1heGltdW0gc2l6ZSBpbiBieXRlcyB0aGF0IHRoZSBsb2cgZmlsZSBjYW4gZ3JvdyB0byBiZWZvcmUgcm9sbGluZyBvdmVyXG4gKiB0byBhIG5ldyBvbmUuIElmIHRoZSBzaXplIG9mIHRoZSBuZXcgbG9nIG1lc3NhZ2UgcGx1cyB0aGUgY3VycmVudCBsb2cgZmlsZVxuICogc2l6ZSBleGNlZWRzIGBtYXhCeXRlc2AgdGhlbiBhIHJvbGwtb3ZlciBpcyB0cmlnZ2VyZWQuIFdoZW4gYSByb2xsLW92ZXJcbiAqIG9jY3VycywgYmVmb3JlIHRoZSBsb2cgbWVzc2FnZSBpcyB3cml0dGVuLCB0aGUgbG9nIGZpbGUgaXMgcmVuYW1lZCBhbmRcbiAqIGFwcGVuZGVkIHdpdGggYC4xYC4gSWYgYSBgLjFgIHZlcnNpb24gYWxyZWFkeSBleGlzdGVkLCBpdCB3b3VsZCBoYXZlIGJlZW5cbiAqIHJlbmFtZWQgYC4yYCBmaXJzdCBhbmQgc28gb24uIFRoZSBtYXhpbXVtIG51bWJlciBvZiBsb2cgZmlsZXMgdG8ga2VlcCBpc1xuICogc3BlY2lmaWVkIGJ5IGBtYXhCYWNrdXBDb3VudGAuIEFmdGVyIHRoZSByZW5hbWVzIGFyZSBjb21wbGV0ZSB0aGUgbG9nIG1lc3NhZ2VcbiAqIGlzIHdyaXR0ZW4gdG8gdGhlIG9yaWdpbmFsLCBub3cgYmxhbmssIGZpbGUuXG4gKlxuICogRXhhbXBsZTogR2l2ZW4gYGxvZy50eHRgLCBgbG9nLnR4dC4xYCwgYGxvZy50eHQuMmAgYW5kIGBsb2cudHh0LjNgLCBhXG4gKiBgbWF4QmFja3VwQ291bnRgIG9mIDMgYW5kIGEgbmV3IGxvZyBtZXNzYWdlIHdoaWNoIHdvdWxkIGNhdXNlIGBsb2cudHh0YCB0b1xuICogZXhjZWVkIGBtYXhCeXRlc2AsIHRoZW4gYGxvZy50eHQuMmAgd291bGQgYmUgcmVuYW1lZCB0byBgbG9nLnR4dC4zYCAodGhlcmVieVxuICogZGlzY2FyZGluZyB0aGUgb3JpZ2luYWwgY29udGVudHMgb2YgYGxvZy50eHQuM2Agc2luY2UgMyBpcyB0aGUgbWF4aW11bSBudW1iZXJcbiAqIG9mIGJhY2t1cHMgdG8ga2VlcCksIGBsb2cudHh0LjFgIHdvdWxkIGJlIHJlbmFtZWQgdG8gYGxvZy50eHQuMmAsIGBsb2cudHh0YFxuICogd291bGQgYmUgcmVuYW1lZCB0byBgbG9nLnR4dC4xYCBhbmQgZmluYWxseSBgbG9nLnR4dGAgd291bGQgYmUgY3JlYXRlZCBmcm9tXG4gKiBzY3JhdGNoIHdoZXJlIHRoZSBuZXcgbG9nIG1lc3NhZ2Ugd291bGQgYmUgd3JpdHRlbi5cbiAqXG4gKiBUaGlzIGhhbmRsZXIgdXNlcyBhIGJ1ZmZlciBmb3Igd3JpdGluZyBsb2cgbWVzc2FnZXMgdG8gZmlsZS4gTG9ncyBjYW4gYmVcbiAqIG1hbnVhbGx5IGZsdXNoZWQgd2l0aCBgZmlsZUhhbmRsZXIuZmx1c2goKWAuIExvZyBtZXNzYWdlcyB3aXRoIGEgbG9nIGxldmVsXG4gKiBncmVhdGVyIHRoYW4gRVJST1IgYXJlIGltbWVkaWF0ZWx5IGZsdXNoZWQuIExvZ3MgYXJlIGFsc28gZmx1c2hlZCBvbiBwcm9jZXNzXG4gKiBjb21wbGV0aW9uLlxuICpcbiAqIEFkZGl0aW9uYWwgbm90ZXMgb24gYG1vZGVgIGFzIGRlc2NyaWJlZCBhYm92ZTpcbiAqXG4gKiAtIGAnYSdgIERlZmF1bHQgbW9kZS4gQXMgYWJvdmUsIHRoaXMgd2lsbCBwaWNrIHVwIHdoZXJlIHRoZSBsb2dzIGxlZnQgb2ZmIGluXG4gKiAgIHJvdGF0aW9uLCBvciBjcmVhdGUgYSBuZXcgbG9nIGZpbGUgaWYgaXQgZG9lc24ndCBleGlzdC5cbiAqIC0gYCd3J2AgaW4gYWRkaXRpb24gdG8gc3RhcnRpbmcgd2l0aCBhIGNsZWFuIGBmaWxlbmFtZWAsIHRoaXMgbW9kZSB3aWxsIGFsc29cbiAqICAgY2F1c2UgYW55IGV4aXN0aW5nIGJhY2t1cHMgKHVwIHRvIGBtYXhCYWNrdXBDb3VudGApIHRvIGJlIGRlbGV0ZWQgb24gc2V0dXBcbiAqICAgZ2l2aW5nIGEgZnVsbHkgY2xlYW4gc2xhdGUuXG4gKiAtIGAneCdgIHJlcXVpcmVzIHRoYXQgbmVpdGhlciBgZmlsZW5hbWVgLCBub3IgYW55IGJhY2t1cHMgKHVwIHRvXG4gKiAgIGBtYXhCYWNrdXBDb3VudGApLCBleGlzdCBiZWZvcmUgc2V0dXAuXG4gKlxuICogVGhpcyBoYW5kbGVyIHJlcXVpcmVzIGJvdGggYC0tYWxsb3ctcmVhZGAgYW5kIGAtLWFsbG93LXdyaXRlYCBwZXJtaXNzaW9ucyBvblxuICogdGhlIGxvZyBmaWxlcy5cbiAqL1xuZXhwb3J0IGNsYXNzIFJvdGF0aW5nRmlsZUhhbmRsZXIgZXh0ZW5kcyBGaWxlSGFuZGxlciB7XG4gICNtYXhCeXRlczogbnVtYmVyO1xuICAjbWF4QmFja3VwQ291bnQ6IG51bWJlcjtcbiAgI2N1cnJlbnRGaWxlU2l6ZSA9IDA7XG5cbiAgY29uc3RydWN0b3IobGV2ZWxOYW1lOiBMZXZlbE5hbWUsIG9wdGlvbnM6IFJvdGF0aW5nRmlsZUhhbmRsZXJPcHRpb25zKSB7XG4gICAgc3VwZXIobGV2ZWxOYW1lLCBvcHRpb25zKTtcbiAgICB0aGlzLiNtYXhCeXRlcyA9IG9wdGlvbnMubWF4Qnl0ZXM7XG4gICAgdGhpcy4jbWF4QmFja3VwQ291bnQgPSBvcHRpb25zLm1heEJhY2t1cENvdW50O1xuICB9XG5cbiAgb3ZlcnJpZGUgc2V0dXAoKSB7XG4gICAgaWYgKHRoaXMuI21heEJ5dGVzIDwgMSkge1xuICAgICAgdGhpcy5kZXN0cm95KCk7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJtYXhCeXRlcyBjYW5ub3QgYmUgbGVzcyB0aGFuIDFcIik7XG4gICAgfVxuICAgIGlmICh0aGlzLiNtYXhCYWNrdXBDb3VudCA8IDEpIHtcbiAgICAgIHRoaXMuZGVzdHJveSgpO1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwibWF4QmFja3VwQ291bnQgY2Fubm90IGJlIGxlc3MgdGhhbiAxXCIpO1xuICAgIH1cbiAgICBzdXBlci5zZXR1cCgpO1xuXG4gICAgaWYgKHRoaXMuX21vZGUgPT09IFwid1wiKSB7XG4gICAgICAvLyBSZW1vdmUgb2xkIGJhY2t1cHMgdG9vIGFzIGl0IGRvZXNuJ3QgbWFrZSBzZW5zZSB0byBzdGFydCB3aXRoIGEgY2xlYW5cbiAgICAgIC8vIGxvZyBmaWxlLCBidXQgb2xkIGJhY2t1cHNcbiAgICAgIGZvciAobGV0IGkgPSAxOyBpIDw9IHRoaXMuI21heEJhY2t1cENvdW50OyBpKyspIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBEZW5vLnJlbW92ZVN5bmModGhpcy5fZmlsZW5hbWUgKyBcIi5cIiArIGkpO1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgIGlmICghKGVycm9yIGluc3RhbmNlb2YgRGVuby5lcnJvcnMuTm90Rm91bmQpKSB7XG4gICAgICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKHRoaXMuX21vZGUgPT09IFwieFwiKSB7XG4gICAgICAvLyBUaHJvdyBpZiBhbnkgYmFja3VwcyBhbHNvIGV4aXN0XG4gICAgICBmb3IgKGxldCBpID0gMTsgaSA8PSB0aGlzLiNtYXhCYWNrdXBDb3VudDsgaSsrKSB7XG4gICAgICAgIGlmIChleGlzdHNTeW5jKHRoaXMuX2ZpbGVuYW1lICsgXCIuXCIgKyBpKSkge1xuICAgICAgICAgIHRoaXMuZGVzdHJveSgpO1xuICAgICAgICAgIHRocm93IG5ldyBEZW5vLmVycm9ycy5BbHJlYWR5RXhpc3RzKFxuICAgICAgICAgICAgXCJCYWNrdXAgbG9nIGZpbGUgXCIgKyB0aGlzLl9maWxlbmFtZSArIFwiLlwiICsgaSArIFwiIGFscmVhZHkgZXhpc3RzXCIsXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLiNjdXJyZW50RmlsZVNpemUgPSAoRGVuby5zdGF0U3luYyh0aGlzLl9maWxlbmFtZSkpLnNpemU7XG4gICAgfVxuICB9XG5cbiAgb3ZlcnJpZGUgbG9nKG1zZzogc3RyaW5nKSB7XG4gICAgY29uc3QgbXNnQnl0ZUxlbmd0aCA9IHRoaXMuX2VuY29kZXIuZW5jb2RlKG1zZykuYnl0ZUxlbmd0aCArIDE7XG5cbiAgICBpZiAodGhpcy4jY3VycmVudEZpbGVTaXplICsgbXNnQnl0ZUxlbmd0aCA+IHRoaXMuI21heEJ5dGVzKSB7XG4gICAgICB0aGlzLnJvdGF0ZUxvZ0ZpbGVzKCk7XG4gICAgICB0aGlzLiNjdXJyZW50RmlsZVNpemUgPSAwO1xuICAgIH1cblxuICAgIHN1cGVyLmxvZyhtc2cpO1xuXG4gICAgdGhpcy4jY3VycmVudEZpbGVTaXplICs9IG1zZ0J5dGVMZW5ndGg7XG4gIH1cblxuICByb3RhdGVMb2dGaWxlcygpIHtcbiAgICB0aGlzLmZsdXNoKCk7XG4gICAgdGhpcy5fZmlsZSEuY2xvc2UoKTtcblxuICAgIGZvciAobGV0IGkgPSB0aGlzLiNtYXhCYWNrdXBDb3VudCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICBjb25zdCBzb3VyY2UgPSB0aGlzLl9maWxlbmFtZSArIChpID09PSAwID8gXCJcIiA6IFwiLlwiICsgaSk7XG4gICAgICBjb25zdCBkZXN0ID0gdGhpcy5fZmlsZW5hbWUgKyBcIi5cIiArIChpICsgMSk7XG5cbiAgICAgIGlmIChleGlzdHNTeW5jKHNvdXJjZSkpIHtcbiAgICAgICAgRGVuby5yZW5hbWVTeW5jKHNvdXJjZSwgZGVzdCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5fZmlsZSA9IERlbm8ub3BlblN5bmModGhpcy5fZmlsZW5hbWUsIHRoaXMuX29wZW5PcHRpb25zKTtcbiAgfVxufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLDBFQUEwRTtBQUUxRSxTQUFTLFVBQVUsUUFBUSwrQkFBK0I7QUFDMUQsU0FBUyxXQUFXLFFBQWlDLG9CQUFvQjtBQU96RTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztDQXFDQyxHQUNELE9BQU8sTUFBTSw0QkFBNEI7RUFDdkMsQ0FBQyxRQUFRLENBQVM7RUFDbEIsQ0FBQyxjQUFjLENBQVM7RUFDeEIsQ0FBQyxlQUFlLEdBQUcsRUFBRTtFQUVyQixZQUFZLFNBQW9CLEVBQUUsT0FBbUMsQ0FBRTtJQUNyRSxLQUFLLENBQUMsV0FBVztJQUNqQixJQUFJLENBQUMsQ0FBQyxRQUFRLEdBQUcsUUFBUSxRQUFRO0lBQ2pDLElBQUksQ0FBQyxDQUFDLGNBQWMsR0FBRyxRQUFRLGNBQWM7RUFDL0M7RUFFUyxRQUFRO0lBQ2YsSUFBSSxJQUFJLENBQUMsQ0FBQyxRQUFRLEdBQUcsR0FBRztNQUN0QixJQUFJLENBQUMsT0FBTztNQUNaLE1BQU0sSUFBSSxNQUFNO0lBQ2xCO0lBQ0EsSUFBSSxJQUFJLENBQUMsQ0FBQyxjQUFjLEdBQUcsR0FBRztNQUM1QixJQUFJLENBQUMsT0FBTztNQUNaLE1BQU0sSUFBSSxNQUFNO0lBQ2xCO0lBQ0EsS0FBSyxDQUFDO0lBRU4sSUFBSSxJQUFJLENBQUMsS0FBSyxLQUFLLEtBQUs7TUFDdEIsd0VBQXdFO01BQ3hFLDRCQUE0QjtNQUM1QixJQUFLLElBQUksSUFBSSxHQUFHLEtBQUssSUFBSSxDQUFDLENBQUMsY0FBYyxFQUFFLElBQUs7UUFDOUMsSUFBSTtVQUNGLEtBQUssVUFBVSxDQUFDLElBQUksQ0FBQyxTQUFTLEdBQUcsTUFBTTtRQUN6QyxFQUFFLE9BQU8sT0FBTztVQUNkLElBQUksQ0FBQyxDQUFDLGlCQUFpQixLQUFLLE1BQU0sQ0FBQyxRQUFRLEdBQUc7WUFDNUMsTUFBTTtVQUNSO1FBQ0Y7TUFDRjtJQUNGLE9BQU8sSUFBSSxJQUFJLENBQUMsS0FBSyxLQUFLLEtBQUs7TUFDN0Isa0NBQWtDO01BQ2xDLElBQUssSUFBSSxJQUFJLEdBQUcsS0FBSyxJQUFJLENBQUMsQ0FBQyxjQUFjLEVBQUUsSUFBSztRQUM5QyxJQUFJLFdBQVcsSUFBSSxDQUFDLFNBQVMsR0FBRyxNQUFNLElBQUk7VUFDeEMsSUFBSSxDQUFDLE9BQU87VUFDWixNQUFNLElBQUksS0FBSyxNQUFNLENBQUMsYUFBYSxDQUNqQyxxQkFBcUIsSUFBSSxDQUFDLFNBQVMsR0FBRyxNQUFNLElBQUk7UUFFcEQ7TUFDRjtJQUNGLE9BQU87TUFDTCxJQUFJLENBQUMsQ0FBQyxlQUFlLEdBQUcsQUFBQyxLQUFLLFFBQVEsQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFHLElBQUk7SUFDOUQ7RUFDRjtFQUVTLElBQUksR0FBVyxFQUFFO0lBQ3hCLE1BQU0sZ0JBQWdCLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLEtBQUssVUFBVSxHQUFHO0lBRTdELElBQUksSUFBSSxDQUFDLENBQUMsZUFBZSxHQUFHLGdCQUFnQixJQUFJLENBQUMsQ0FBQyxRQUFRLEVBQUU7TUFDMUQsSUFBSSxDQUFDLGNBQWM7TUFDbkIsSUFBSSxDQUFDLENBQUMsZUFBZSxHQUFHO0lBQzFCO0lBRUEsS0FBSyxDQUFDLElBQUk7SUFFVixJQUFJLENBQUMsQ0FBQyxlQUFlLElBQUk7RUFDM0I7RUFFQSxpQkFBaUI7SUFDZixJQUFJLENBQUMsS0FBSztJQUNWLElBQUksQ0FBQyxLQUFLLENBQUUsS0FBSztJQUVqQixJQUFLLElBQUksSUFBSSxJQUFJLENBQUMsQ0FBQyxjQUFjLEdBQUcsR0FBRyxLQUFLLEdBQUcsSUFBSztNQUNsRCxNQUFNLFNBQVMsSUFBSSxDQUFDLFNBQVMsR0FBRyxDQUFDLE1BQU0sSUFBSSxLQUFLLE1BQU0sQ0FBQztNQUN2RCxNQUFNLE9BQU8sSUFBSSxDQUFDLFNBQVMsR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDO01BRTFDLElBQUksV0FBVyxTQUFTO1FBQ3RCLEtBQUssVUFBVSxDQUFDLFFBQVE7TUFDMUI7SUFDRjtJQUVBLElBQUksQ0FBQyxLQUFLLEdBQUcsS0FBSyxRQUFRLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsWUFBWTtFQUM5RDtBQUNGIn0=