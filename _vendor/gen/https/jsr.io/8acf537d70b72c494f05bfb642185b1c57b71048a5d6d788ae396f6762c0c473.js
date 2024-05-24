// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import { LogLevels } from "./levels.ts";
import { BaseHandler } from "./base_handler.ts";
import { writeAllSync } from "jsr:/@std/io@^0.224.0/write-all";
/**
 * This handler will output to a file using an optional mode (default is `a`,
 * e.g. append). The file will grow indefinitely. It uses a buffer for writing
 * to file. Logs can be manually flushed with `fileHandler.flush()`. Log
 * messages with a log level greater than error are immediately flushed. Logs
 * are also flushed on process completion.
 *
 * Behavior of the log modes is as follows:
 *
 * - `'a'` - Default mode. Appends new log messages to the end of an existing log
 *   file, or create a new log file if none exists.
 * - `'w'` - Upon creation of the handler, any existing log file will be removed
 *   and a new one created.
 * - `'x'` - This will create a new log file and throw an error if one already
 *   exists.
 *
 * This handler requires `--allow-write` permission on the log file.
 */ export class FileHandler extends BaseHandler {
  _file;
  _buf;
  _pointer = 0;
  _filename;
  _mode;
  _openOptions;
  _encoder = new TextEncoder();
  #unloadCallback = (()=>{
    this.destroy();
  }).bind(this);
  constructor(levelName, options){
    super(levelName, options);
    this._filename = options.filename;
    // default to append mode, write only
    this._mode = options.mode ? options.mode : "a";
    this._openOptions = {
      createNew: this._mode === "x",
      create: this._mode !== "x",
      append: this._mode === "a",
      truncate: this._mode !== "a",
      write: true
    };
    this._buf = new Uint8Array(options.bufferSize ?? 4096);
  }
  setup() {
    this._file = Deno.openSync(this._filename, this._openOptions);
    this.#resetBuffer();
    addEventListener("unload", this.#unloadCallback);
  }
  handle(logRecord) {
    super.handle(logRecord);
    // Immediately flush if log level is higher than ERROR
    if (logRecord.level > LogLevels.ERROR) {
      this.flush();
    }
  }
  log(msg) {
    const bytes = this._encoder.encode(msg + "\n");
    if (bytes.byteLength > this._buf.byteLength - this._pointer) {
      this.flush();
    }
    if (bytes.byteLength > this._buf.byteLength) {
      writeAllSync(this._file, bytes);
    } else {
      this._buf.set(bytes, this._pointer);
      this._pointer += bytes.byteLength;
    }
  }
  flush() {
    if (this._pointer > 0 && this._file) {
      let written = 0;
      while(written < this._pointer){
        written += this._file.writeSync(this._buf.subarray(written, this._pointer));
      }
      this.#resetBuffer();
    }
  }
  #resetBuffer() {
    this._pointer = 0;
  }
  destroy() {
    this.flush();
    this._file?.close();
    this._file = undefined;
    removeEventListener("unload", this.#unloadCallback);
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0BzdGQvbG9nLzAuMjI0LjEvZmlsZV9oYW5kbGVyLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjQgdGhlIERlbm8gYXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gTUlUIGxpY2Vuc2UuXG5pbXBvcnQgeyB0eXBlIExldmVsTmFtZSwgTG9nTGV2ZWxzIH0gZnJvbSBcIi4vbGV2ZWxzLnRzXCI7XG5pbXBvcnQgdHlwZSB7IExvZ1JlY29yZCB9IGZyb20gXCIuL2xvZ2dlci50c1wiO1xuaW1wb3J0IHsgQmFzZUhhbmRsZXIsIHR5cGUgQmFzZUhhbmRsZXJPcHRpb25zIH0gZnJvbSBcIi4vYmFzZV9oYW5kbGVyLnRzXCI7XG5pbXBvcnQgeyB3cml0ZUFsbFN5bmMgfSBmcm9tIFwianNyOi9Ac3RkL2lvQF4wLjIyNC4wL3dyaXRlLWFsbFwiO1xuXG5leHBvcnQgdHlwZSBMb2dNb2RlID0gXCJhXCIgfCBcIndcIiB8IFwieFwiO1xuXG5leHBvcnQgaW50ZXJmYWNlIEZpbGVIYW5kbGVyT3B0aW9ucyBleHRlbmRzIEJhc2VIYW5kbGVyT3B0aW9ucyB7XG4gIGZpbGVuYW1lOiBzdHJpbmc7XG4gIG1vZGU/OiBMb2dNb2RlO1xuICAvKipcbiAgICogQnVmZmVyIHNpemUgZm9yIHdyaXRpbmcgbG9nIG1lc3NhZ2VzIHRvIGZpbGUsIGluIGJ5dGVzLlxuICAgKlxuICAgKiBAZGVmYXVsdCB7NDA5Nn1cbiAgICovXG4gIGJ1ZmZlclNpemU/OiBudW1iZXI7XG59XG5cbi8qKlxuICogVGhpcyBoYW5kbGVyIHdpbGwgb3V0cHV0IHRvIGEgZmlsZSB1c2luZyBhbiBvcHRpb25hbCBtb2RlIChkZWZhdWx0IGlzIGBhYCxcbiAqIGUuZy4gYXBwZW5kKS4gVGhlIGZpbGUgd2lsbCBncm93IGluZGVmaW5pdGVseS4gSXQgdXNlcyBhIGJ1ZmZlciBmb3Igd3JpdGluZ1xuICogdG8gZmlsZS4gTG9ncyBjYW4gYmUgbWFudWFsbHkgZmx1c2hlZCB3aXRoIGBmaWxlSGFuZGxlci5mbHVzaCgpYC4gTG9nXG4gKiBtZXNzYWdlcyB3aXRoIGEgbG9nIGxldmVsIGdyZWF0ZXIgdGhhbiBlcnJvciBhcmUgaW1tZWRpYXRlbHkgZmx1c2hlZC4gTG9nc1xuICogYXJlIGFsc28gZmx1c2hlZCBvbiBwcm9jZXNzIGNvbXBsZXRpb24uXG4gKlxuICogQmVoYXZpb3Igb2YgdGhlIGxvZyBtb2RlcyBpcyBhcyBmb2xsb3dzOlxuICpcbiAqIC0gYCdhJ2AgLSBEZWZhdWx0IG1vZGUuIEFwcGVuZHMgbmV3IGxvZyBtZXNzYWdlcyB0byB0aGUgZW5kIG9mIGFuIGV4aXN0aW5nIGxvZ1xuICogICBmaWxlLCBvciBjcmVhdGUgYSBuZXcgbG9nIGZpbGUgaWYgbm9uZSBleGlzdHMuXG4gKiAtIGAndydgIC0gVXBvbiBjcmVhdGlvbiBvZiB0aGUgaGFuZGxlciwgYW55IGV4aXN0aW5nIGxvZyBmaWxlIHdpbGwgYmUgcmVtb3ZlZFxuICogICBhbmQgYSBuZXcgb25lIGNyZWF0ZWQuXG4gKiAtIGAneCdgIC0gVGhpcyB3aWxsIGNyZWF0ZSBhIG5ldyBsb2cgZmlsZSBhbmQgdGhyb3cgYW4gZXJyb3IgaWYgb25lIGFscmVhZHlcbiAqICAgZXhpc3RzLlxuICpcbiAqIFRoaXMgaGFuZGxlciByZXF1aXJlcyBgLS1hbGxvdy13cml0ZWAgcGVybWlzc2lvbiBvbiB0aGUgbG9nIGZpbGUuXG4gKi9cbmV4cG9ydCBjbGFzcyBGaWxlSGFuZGxlciBleHRlbmRzIEJhc2VIYW5kbGVyIHtcbiAgcHJvdGVjdGVkIF9maWxlOiBEZW5vLkZzRmlsZSB8IHVuZGVmaW5lZDtcbiAgcHJvdGVjdGVkIF9idWY6IFVpbnQ4QXJyYXk7XG4gIHByb3RlY3RlZCBfcG9pbnRlciA9IDA7XG4gIHByb3RlY3RlZCBfZmlsZW5hbWU6IHN0cmluZztcbiAgcHJvdGVjdGVkIF9tb2RlOiBMb2dNb2RlO1xuICBwcm90ZWN0ZWQgX29wZW5PcHRpb25zOiBEZW5vLk9wZW5PcHRpb25zO1xuICBwcm90ZWN0ZWQgX2VuY29kZXI6IFRleHRFbmNvZGVyID0gbmV3IFRleHRFbmNvZGVyKCk7XG4gICN1bmxvYWRDYWxsYmFjayA9ICgoKSA9PiB7XG4gICAgdGhpcy5kZXN0cm95KCk7XG4gIH0pLmJpbmQodGhpcyk7XG5cbiAgY29uc3RydWN0b3IobGV2ZWxOYW1lOiBMZXZlbE5hbWUsIG9wdGlvbnM6IEZpbGVIYW5kbGVyT3B0aW9ucykge1xuICAgIHN1cGVyKGxldmVsTmFtZSwgb3B0aW9ucyk7XG4gICAgdGhpcy5fZmlsZW5hbWUgPSBvcHRpb25zLmZpbGVuYW1lO1xuICAgIC8vIGRlZmF1bHQgdG8gYXBwZW5kIG1vZGUsIHdyaXRlIG9ubHlcbiAgICB0aGlzLl9tb2RlID0gb3B0aW9ucy5tb2RlID8gb3B0aW9ucy5tb2RlIDogXCJhXCI7XG4gICAgdGhpcy5fb3Blbk9wdGlvbnMgPSB7XG4gICAgICBjcmVhdGVOZXc6IHRoaXMuX21vZGUgPT09IFwieFwiLFxuICAgICAgY3JlYXRlOiB0aGlzLl9tb2RlICE9PSBcInhcIixcbiAgICAgIGFwcGVuZDogdGhpcy5fbW9kZSA9PT0gXCJhXCIsXG4gICAgICB0cnVuY2F0ZTogdGhpcy5fbW9kZSAhPT0gXCJhXCIsXG4gICAgICB3cml0ZTogdHJ1ZSxcbiAgICB9O1xuICAgIHRoaXMuX2J1ZiA9IG5ldyBVaW50OEFycmF5KG9wdGlvbnMuYnVmZmVyU2l6ZSA/PyA0MDk2KTtcbiAgfVxuXG4gIG92ZXJyaWRlIHNldHVwKCkge1xuICAgIHRoaXMuX2ZpbGUgPSBEZW5vLm9wZW5TeW5jKHRoaXMuX2ZpbGVuYW1lLCB0aGlzLl9vcGVuT3B0aW9ucyk7XG4gICAgdGhpcy4jcmVzZXRCdWZmZXIoKTtcblxuICAgIGFkZEV2ZW50TGlzdGVuZXIoXCJ1bmxvYWRcIiwgdGhpcy4jdW5sb2FkQ2FsbGJhY2spO1xuICB9XG5cbiAgb3ZlcnJpZGUgaGFuZGxlKGxvZ1JlY29yZDogTG9nUmVjb3JkKSB7XG4gICAgc3VwZXIuaGFuZGxlKGxvZ1JlY29yZCk7XG5cbiAgICAvLyBJbW1lZGlhdGVseSBmbHVzaCBpZiBsb2cgbGV2ZWwgaXMgaGlnaGVyIHRoYW4gRVJST1JcbiAgICBpZiAobG9nUmVjb3JkLmxldmVsID4gTG9nTGV2ZWxzLkVSUk9SKSB7XG4gICAgICB0aGlzLmZsdXNoKCk7XG4gICAgfVxuICB9XG5cbiAgb3ZlcnJpZGUgbG9nKG1zZzogc3RyaW5nKSB7XG4gICAgY29uc3QgYnl0ZXMgPSB0aGlzLl9lbmNvZGVyLmVuY29kZShtc2cgKyBcIlxcblwiKTtcbiAgICBpZiAoYnl0ZXMuYnl0ZUxlbmd0aCA+IHRoaXMuX2J1Zi5ieXRlTGVuZ3RoIC0gdGhpcy5fcG9pbnRlcikge1xuICAgICAgdGhpcy5mbHVzaCgpO1xuICAgIH1cbiAgICBpZiAoYnl0ZXMuYnl0ZUxlbmd0aCA+IHRoaXMuX2J1Zi5ieXRlTGVuZ3RoKSB7XG4gICAgICB3cml0ZUFsbFN5bmModGhpcy5fZmlsZSEsIGJ5dGVzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fYnVmLnNldChieXRlcywgdGhpcy5fcG9pbnRlcik7XG4gICAgICB0aGlzLl9wb2ludGVyICs9IGJ5dGVzLmJ5dGVMZW5ndGg7XG4gICAgfVxuICB9XG5cbiAgZmx1c2goKSB7XG4gICAgaWYgKHRoaXMuX3BvaW50ZXIgPiAwICYmIHRoaXMuX2ZpbGUpIHtcbiAgICAgIGxldCB3cml0dGVuID0gMDtcbiAgICAgIHdoaWxlICh3cml0dGVuIDwgdGhpcy5fcG9pbnRlcikge1xuICAgICAgICB3cml0dGVuICs9IHRoaXMuX2ZpbGUud3JpdGVTeW5jKFxuICAgICAgICAgIHRoaXMuX2J1Zi5zdWJhcnJheSh3cml0dGVuLCB0aGlzLl9wb2ludGVyKSxcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuI3Jlc2V0QnVmZmVyKCk7XG4gICAgfVxuICB9XG5cbiAgI3Jlc2V0QnVmZmVyKCkge1xuICAgIHRoaXMuX3BvaW50ZXIgPSAwO1xuICB9XG5cbiAgb3ZlcnJpZGUgZGVzdHJveSgpIHtcbiAgICB0aGlzLmZsdXNoKCk7XG4gICAgdGhpcy5fZmlsZT8uY2xvc2UoKTtcbiAgICB0aGlzLl9maWxlID0gdW5kZWZpbmVkO1xuICAgIHJlbW92ZUV2ZW50TGlzdGVuZXIoXCJ1bmxvYWRcIiwgdGhpcy4jdW5sb2FkQ2FsbGJhY2spO1xuICB9XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsMEVBQTBFO0FBQzFFLFNBQXlCLFNBQVMsUUFBUSxjQUFjO0FBRXhELFNBQVMsV0FBVyxRQUFpQyxvQkFBb0I7QUFDekUsU0FBUyxZQUFZLFFBQVEsa0NBQWtDO0FBZS9EOzs7Ozs7Ozs7Ozs7Ozs7OztDQWlCQyxHQUNELE9BQU8sTUFBTSxvQkFBb0I7RUFDckIsTUFBK0I7RUFDL0IsS0FBaUI7RUFDakIsV0FBVyxFQUFFO0VBQ2IsVUFBa0I7RUFDbEIsTUFBZTtFQUNmLGFBQStCO0VBQy9CLFdBQXdCLElBQUksY0FBYztFQUNwRCxDQUFDLGNBQWMsR0FBRyxDQUFDO0lBQ2pCLElBQUksQ0FBQyxPQUFPO0VBQ2QsQ0FBQyxFQUFFLElBQUksQ0FBQyxJQUFJLEVBQUU7RUFFZCxZQUFZLFNBQW9CLEVBQUUsT0FBMkIsQ0FBRTtJQUM3RCxLQUFLLENBQUMsV0FBVztJQUNqQixJQUFJLENBQUMsU0FBUyxHQUFHLFFBQVEsUUFBUTtJQUNqQyxxQ0FBcUM7SUFDckMsSUFBSSxDQUFDLEtBQUssR0FBRyxRQUFRLElBQUksR0FBRyxRQUFRLElBQUksR0FBRztJQUMzQyxJQUFJLENBQUMsWUFBWSxHQUFHO01BQ2xCLFdBQVcsSUFBSSxDQUFDLEtBQUssS0FBSztNQUMxQixRQUFRLElBQUksQ0FBQyxLQUFLLEtBQUs7TUFDdkIsUUFBUSxJQUFJLENBQUMsS0FBSyxLQUFLO01BQ3ZCLFVBQVUsSUFBSSxDQUFDLEtBQUssS0FBSztNQUN6QixPQUFPO0lBQ1Q7SUFDQSxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksV0FBVyxRQUFRLFVBQVUsSUFBSTtFQUNuRDtFQUVTLFFBQVE7SUFDZixJQUFJLENBQUMsS0FBSyxHQUFHLEtBQUssUUFBUSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLFlBQVk7SUFDNUQsSUFBSSxDQUFDLENBQUMsV0FBVztJQUVqQixpQkFBaUIsVUFBVSxJQUFJLENBQUMsQ0FBQyxjQUFjO0VBQ2pEO0VBRVMsT0FBTyxTQUFvQixFQUFFO0lBQ3BDLEtBQUssQ0FBQyxPQUFPO0lBRWIsc0RBQXNEO0lBQ3RELElBQUksVUFBVSxLQUFLLEdBQUcsVUFBVSxLQUFLLEVBQUU7TUFDckMsSUFBSSxDQUFDLEtBQUs7SUFDWjtFQUNGO0VBRVMsSUFBSSxHQUFXLEVBQUU7SUFDeEIsTUFBTSxRQUFRLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLE1BQU07SUFDekMsSUFBSSxNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUMsUUFBUSxFQUFFO01BQzNELElBQUksQ0FBQyxLQUFLO0lBQ1o7SUFDQSxJQUFJLE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFO01BQzNDLGFBQWEsSUFBSSxDQUFDLEtBQUssRUFBRztJQUM1QixPQUFPO01BQ0wsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsT0FBTyxJQUFJLENBQUMsUUFBUTtNQUNsQyxJQUFJLENBQUMsUUFBUSxJQUFJLE1BQU0sVUFBVTtJQUNuQztFQUNGO0VBRUEsUUFBUTtJQUNOLElBQUksSUFBSSxDQUFDLFFBQVEsR0FBRyxLQUFLLElBQUksQ0FBQyxLQUFLLEVBQUU7TUFDbkMsSUFBSSxVQUFVO01BQ2QsTUFBTyxVQUFVLElBQUksQ0FBQyxRQUFRLENBQUU7UUFDOUIsV0FBVyxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FDN0IsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsU0FBUyxJQUFJLENBQUMsUUFBUTtNQUU3QztNQUNBLElBQUksQ0FBQyxDQUFDLFdBQVc7SUFDbkI7RUFDRjtFQUVBLENBQUMsV0FBVztJQUNWLElBQUksQ0FBQyxRQUFRLEdBQUc7RUFDbEI7RUFFUyxVQUFVO0lBQ2pCLElBQUksQ0FBQyxLQUFLO0lBQ1YsSUFBSSxDQUFDLEtBQUssRUFBRTtJQUNaLElBQUksQ0FBQyxLQUFLLEdBQUc7SUFDYixvQkFBb0IsVUFBVSxJQUFJLENBQUMsQ0FBQyxjQUFjO0VBQ3BEO0FBQ0YifQ==