import { tty } from "../ansi/tty.ts";
import { parse } from "../keycode/key_code.ts";
import { bold, brightBlue, dim, green, italic, red, stripColor } from "./deps.ts";
import { Figures } from "./figures.ts";
/** Generic prompt representation. */ export class GenericPrompt {
  static injectedValue;
  settings;
  tty = tty;
  indent;
  cursor = {
    x: 0,
    y: 0
  };
  #value;
  #lastError;
  #isFirstRun = true;
  #encoder = new TextEncoder();
  /**
   * Inject prompt value. Can be used for unit tests or pre selections.
   * @param value Input value.
   */ static inject(value) {
    GenericPrompt.injectedValue = value;
  }
  constructor(settings){
    this.settings = {
      ...settings,
      keys: {
        submit: [
          "enter",
          "return"
        ],
        ...settings.keys ?? {}
      }
    };
    this.indent = this.settings.indent ?? " ";
  }
  /** Execute the prompt and show cursor on end. */ async prompt() {
    try {
      return await this.#execute();
    } finally{
      this.tty.cursorShow();
    }
  }
  /** Clear prompt output. */ clear() {
    this.tty.cursorLeft.eraseDown();
  }
  /** Execute the prompt. */ #execute = async ()=>{
    // Throw errors on unit tests.
    if (typeof GenericPrompt.injectedValue !== "undefined" && this.#lastError) {
      throw new Error(this.error());
    }
    await this.render();
    this.#lastError = undefined;
    if (!await this.read()) {
      return this.#execute();
    }
    if (typeof this.#value === "undefined") {
      throw new Error("internal error: failed to read value");
    }
    this.clear();
    const successMessage = this.success(this.#value);
    if (successMessage) {
      console.log(successMessage);
    }
    GenericPrompt.injectedValue = undefined;
    this.tty.cursorShow();
    return this.#value;
  };
  /** Render prompt. */ async render() {
    const result = await Promise.all([
      this.message(),
      this.body?.(),
      this.footer()
    ]);
    const content = result.filter(Boolean).join("\n");
    const lines = content.split("\n");
    const columns = getColumns();
    const linesCount = columns ? lines.reduce((prev, next)=>{
      const length = stripColor(next).length;
      return prev + (length > columns ? Math.ceil(length / columns) : 1);
    }, 0) : content.split("\n").length;
    const y = linesCount - this.cursor.y - 1;
    if (!this.#isFirstRun || this.#lastError) {
      this.clear();
    }
    this.#isFirstRun = false;
    if (Deno.build.os === "windows") {
      console.log(content);
      this.tty.cursorUp();
    } else {
      Deno.stdout.writeSync(this.#encoder.encode(content));
    }
    if (y) {
      this.tty.cursorUp(y);
    }
    this.tty.cursorTo(this.cursor.x);
  }
  /** Read user input from stdin, handle events and validate user input. */ async read() {
    if (typeof GenericPrompt.injectedValue !== "undefined") {
      const value = GenericPrompt.injectedValue;
      await this.#validateValue(value);
    } else {
      const events = await this.#readKey();
      if (!events.length) {
        return false;
      }
      for (const event of events){
        await this.handleEvent(event);
      }
    }
    return typeof this.#value !== "undefined";
  }
  submit() {
    return this.#validateValue(this.getValue());
  }
  message() {
    return `${this.settings.indent}${this.settings.prefix}` + bold(this.settings.message) + this.defaults();
  }
  defaults() {
    let defaultMessage = "";
    if (typeof this.settings.default !== "undefined" && !this.settings.hideDefault) {
      defaultMessage += dim(` (${this.format(this.settings.default)})`);
    }
    return defaultMessage;
  }
  /** Get prompt success message. */ success(value) {
    return `${this.settings.indent}${this.settings.prefix}` + bold(this.settings.message) + this.defaults() + " " + this.settings.pointer + " " + green(this.format(value));
  }
  footer() {
    return this.error() ?? this.hint();
  }
  error() {
    return this.#lastError ? this.settings.indent + red(bold(`${Figures.CROSS} `) + this.#lastError) : undefined;
  }
  hint() {
    return this.settings.hint ? this.settings.indent + italic(brightBlue(dim(`${Figures.POINTER} `) + this.settings.hint)) : undefined;
  }
  setErrorMessage(message) {
    this.#lastError = message;
  }
  /**
   * Handle user input event.
   * @param event Key event.
   */ async handleEvent(event) {
    switch(true){
      case event.name === "c" && event.ctrl:
        this.clear();
        this.tty.cursorShow();
        Deno.exit(130);
        return;
      case this.isKey(this.settings.keys, "submit", event):
        await this.submit();
        break;
    }
  }
  /** Read user input from stdin and pars ansi codes. */ #readKey = async ()=>{
    const data = await this.#readChar();
    return data.length ? parse(data) : [];
  };
  /** Read user input from stdin. */ #readChar = async ()=>{
    const buffer = new Uint8Array(8);
    const isTty = Deno.isatty(Deno.stdin.rid);
    if (isTty) {
      // cbreak is only supported on deno >= 1.6.0, suppress ts-error.
      Deno.stdin.setRaw(true, {
        cbreak: this.settings.cbreak === true
      });
    }
    const nread = await Deno.stdin.read(buffer);
    if (isTty) {
      Deno.stdin.setRaw(false);
    }
    if (nread === null) {
      return buffer;
    }
    return buffer.subarray(0, nread);
  };
  /**
   * Map input value to output value. If a custom transform handler ist set, the
   * custom handler will be executed, otherwise the default transform handler
   * from the prompt will be executed.
   * @param value The value to transform.
   */ #transformValue = (value)=>{
    return this.settings.transform ? this.settings.transform(value) : this.transform(value);
  };
  /**
   * Validate input value. Set error message if validation fails and transform
   * output value on success.
   * If a default value is set, the default will be used as value without any
   * validation.
   * If a custom validation handler ist set, the custom handler will
   * be executed, otherwise a prompt specific default validation handler will be
   * executed.
   * @param value The value to validate.
   */ #validateValue = async (value)=>{
    if (!value && typeof this.settings.default !== "undefined") {
      this.#value = this.settings.default;
      return;
    }
    this.#value = undefined;
    this.#lastError = undefined;
    const validation = await (this.settings.validate ? this.settings.validate(value) : this.validate(value));
    if (validation === false) {
      this.#lastError = `Invalid answer.`;
    } else if (typeof validation === "string") {
      this.#lastError = validation;
    } else {
      this.#value = this.#transformValue(value);
    }
  };
  /**
   * Check if key event has given name or sequence.
   * @param keys  Key map.
   * @param name  Key name.
   * @param event Key event.
   */ isKey(keys, name, event) {
    // deno-lint-ignore no-explicit-any
    const keyNames = keys?.[name];
    return typeof keyNames !== "undefined" && (typeof event.name !== "undefined" && keyNames.indexOf(event.name) !== -1 || typeof event.sequence !== "undefined" && keyNames.indexOf(event.sequence) !== -1);
  }
}
function getColumns() {
  try {
    // Catch error in none tty mode: Inappropriate ioctl for device (os error 25)
    // And keep backwards compatibility for deno < 1.27.0.
    // deno-lint-ignore no-explicit-any
    return Deno.consoleSize(Deno.stdout.rid).columns;
  } catch (_error) {
    return null;
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvY2xpZmZ5QHYwLjI1LjcvcHJvbXB0L19nZW5lcmljX3Byb21wdC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgdHlwZSB7IEN1cnNvciB9IGZyb20gXCIuLi9hbnNpL2N1cnNvcl9wb3NpdGlvbi50c1wiO1xuaW1wb3J0IHsgdHR5IH0gZnJvbSBcIi4uL2Fuc2kvdHR5LnRzXCI7XG5pbXBvcnQgeyBLZXlDb2RlLCBwYXJzZSB9IGZyb20gXCIuLi9rZXljb2RlL2tleV9jb2RlLnRzXCI7XG5pbXBvcnQge1xuICBib2xkLFxuICBicmlnaHRCbHVlLFxuICBkaW0sXG4gIGdyZWVuLFxuICBpdGFsaWMsXG4gIHJlZCxcbiAgc3RyaXBDb2xvcixcbn0gZnJvbSBcIi4vZGVwcy50c1wiO1xuaW1wb3J0IHsgRmlndXJlcyB9IGZyb20gXCIuL2ZpZ3VyZXMudHNcIjtcblxuLyoqIFByb21wdCB2YWxpZGF0aW9uIHJldHVybiB0YXBlLiAqL1xuZXhwb3J0IHR5cGUgVmFsaWRhdGVSZXN1bHQgPSBzdHJpbmcgfCBib29sZWFuIHwgUHJvbWlzZTxzdHJpbmcgfCBib29sZWFuPjtcblxuLyoqIElucHV0IGtleXMgb3B0aW9ucy4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgR2VuZXJpY1Byb21wdEtleXMge1xuICBzdWJtaXQ/OiBBcnJheTxzdHJpbmc+O1xufVxuXG4vKiogR2VuZXJpYyBwcm9tcHQgb3B0aW9ucy4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgR2VuZXJpY1Byb21wdE9wdGlvbnM8VFZhbHVlLCBUUmF3VmFsdWU+IHtcbiAgbWVzc2FnZTogc3RyaW5nO1xuICBkZWZhdWx0PzogVFZhbHVlO1xuICBoaWRlRGVmYXVsdD86IGJvb2xlYW47XG4gIHZhbGlkYXRlPzogKHZhbHVlOiBUUmF3VmFsdWUpID0+IFZhbGlkYXRlUmVzdWx0O1xuICB0cmFuc2Zvcm0/OiAodmFsdWU6IFRSYXdWYWx1ZSkgPT4gVFZhbHVlIHwgdW5kZWZpbmVkO1xuICBoaW50Pzogc3RyaW5nO1xuICBwb2ludGVyPzogc3RyaW5nO1xuICBpbmRlbnQ/OiBzdHJpbmc7XG4gIGtleXM/OiBHZW5lcmljUHJvbXB0S2V5cztcbiAgY2JyZWFrPzogYm9vbGVhbjtcbiAgcHJlZml4Pzogc3RyaW5nO1xufVxuXG4vKiogR2VuZXJpYyBwcm9tcHQgc2V0dGluZ3MuICovXG5leHBvcnQgaW50ZXJmYWNlIEdlbmVyaWNQcm9tcHRTZXR0aW5nczxUVmFsdWUsIFRSYXdWYWx1ZT5cbiAgZXh0ZW5kcyBHZW5lcmljUHJvbXB0T3B0aW9uczxUVmFsdWUsIFRSYXdWYWx1ZT4ge1xuICBwb2ludGVyOiBzdHJpbmc7XG4gIGluZGVudDogc3RyaW5nO1xuICBwcmVmaXg6IHN0cmluZztcbn1cblxuLyoqIFN0YXRpYyBnZW5lcmljIHByb21wdCBpbnRlcmZhY2UuICovXG5leHBvcnQgaW50ZXJmYWNlIFN0YXRpY0dlbmVyaWNQcm9tcHQ8XG4gIFRWYWx1ZSxcbiAgVFJhd1ZhbHVlLFxuICBUT3B0aW9ucyBleHRlbmRzIEdlbmVyaWNQcm9tcHRPcHRpb25zPFRWYWx1ZSwgVFJhd1ZhbHVlPixcbiAgVFNldHRpbmdzIGV4dGVuZHMgR2VuZXJpY1Byb21wdFNldHRpbmdzPFRWYWx1ZSwgVFJhd1ZhbHVlPixcbiAgVFByb21wdCBleHRlbmRzIEdlbmVyaWNQcm9tcHQ8VFZhbHVlLCBUUmF3VmFsdWUsIFRTZXR0aW5ncz4sXG4+IHtcbiAgaW5qZWN0Pyh2YWx1ZTogVFZhbHVlKTogdm9pZDtcblxuICBwcm9tcHQob3B0aW9uczogVE9wdGlvbnMpOiBQcm9taXNlPFRWYWx1ZT47XG59XG5cbi8qKiBHZW5lcmljIHByb21wdCByZXByZXNlbnRhdGlvbi4gKi9cbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBHZW5lcmljUHJvbXB0PFxuICBUVmFsdWUsXG4gIFRSYXdWYWx1ZSxcbiAgVFNldHRpbmdzIGV4dGVuZHMgR2VuZXJpY1Byb21wdFNldHRpbmdzPFRWYWx1ZSwgVFJhd1ZhbHVlPixcbj4ge1xuICBwcm90ZWN0ZWQgc3RhdGljIGluamVjdGVkVmFsdWU6IHVua25vd24gfCB1bmRlZmluZWQ7XG4gIHByb3RlY3RlZCByZWFkb25seSBzZXR0aW5nczogVFNldHRpbmdzO1xuICBwcm90ZWN0ZWQgcmVhZG9ubHkgdHR5ID0gdHR5O1xuICBwcm90ZWN0ZWQgcmVhZG9ubHkgaW5kZW50OiBzdHJpbmc7XG4gIHByb3RlY3RlZCByZWFkb25seSBjdXJzb3I6IEN1cnNvciA9IHtcbiAgICB4OiAwLFxuICAgIHk6IDAsXG4gIH07XG4gICN2YWx1ZTogVFZhbHVlIHwgdW5kZWZpbmVkO1xuICAjbGFzdEVycm9yOiBzdHJpbmcgfCB1bmRlZmluZWQ7XG4gICNpc0ZpcnN0UnVuID0gdHJ1ZTtcbiAgI2VuY29kZXIgPSBuZXcgVGV4dEVuY29kZXIoKTtcblxuICAvKipcbiAgICogSW5qZWN0IHByb21wdCB2YWx1ZS4gQ2FuIGJlIHVzZWQgZm9yIHVuaXQgdGVzdHMgb3IgcHJlIHNlbGVjdGlvbnMuXG4gICAqIEBwYXJhbSB2YWx1ZSBJbnB1dCB2YWx1ZS5cbiAgICovXG4gIHB1YmxpYyBzdGF0aWMgaW5qZWN0KHZhbHVlOiB1bmtub3duKTogdm9pZCB7XG4gICAgR2VuZXJpY1Byb21wdC5pbmplY3RlZFZhbHVlID0gdmFsdWU7XG4gIH1cblxuICBwcm90ZWN0ZWQgY29uc3RydWN0b3Ioc2V0dGluZ3M6IFRTZXR0aW5ncykge1xuICAgIHRoaXMuc2V0dGluZ3MgPSB7XG4gICAgICAuLi5zZXR0aW5ncyxcbiAgICAgIGtleXM6IHtcbiAgICAgICAgc3VibWl0OiBbXCJlbnRlclwiLCBcInJldHVyblwiXSxcbiAgICAgICAgLi4uKHNldHRpbmdzLmtleXMgPz8ge30pLFxuICAgICAgfSxcbiAgICB9O1xuICAgIHRoaXMuaW5kZW50ID0gdGhpcy5zZXR0aW5ncy5pbmRlbnQgPz8gXCIgXCI7XG4gIH1cblxuICAvKiogRXhlY3V0ZSB0aGUgcHJvbXB0IGFuZCBzaG93IGN1cnNvciBvbiBlbmQuICovXG4gIHB1YmxpYyBhc3luYyBwcm9tcHQoKTogUHJvbWlzZTxUVmFsdWU+IHtcbiAgICB0cnkge1xuICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuI2V4ZWN1dGUoKTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgdGhpcy50dHkuY3Vyc29yU2hvdygpO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBDbGVhciBwcm9tcHQgb3V0cHV0LiAqL1xuICBwcm90ZWN0ZWQgY2xlYXIoKTogdm9pZCB7XG4gICAgdGhpcy50dHkuY3Vyc29yTGVmdC5lcmFzZURvd24oKTtcbiAgfVxuXG4gIC8qKiBFeGVjdXRlIHRoZSBwcm9tcHQuICovXG4gICNleGVjdXRlID0gYXN5bmMgKCk6IFByb21pc2U8VFZhbHVlPiA9PiB7XG4gICAgLy8gVGhyb3cgZXJyb3JzIG9uIHVuaXQgdGVzdHMuXG4gICAgaWYgKHR5cGVvZiBHZW5lcmljUHJvbXB0LmluamVjdGVkVmFsdWUgIT09IFwidW5kZWZpbmVkXCIgJiYgdGhpcy4jbGFzdEVycm9yKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IodGhpcy5lcnJvcigpKTtcbiAgICB9XG5cbiAgICBhd2FpdCB0aGlzLnJlbmRlcigpO1xuICAgIHRoaXMuI2xhc3RFcnJvciA9IHVuZGVmaW5lZDtcblxuICAgIGlmICghYXdhaXQgdGhpcy5yZWFkKCkpIHtcbiAgICAgIHJldHVybiB0aGlzLiNleGVjdXRlKCk7XG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiB0aGlzLiN2YWx1ZSA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiaW50ZXJuYWwgZXJyb3I6IGZhaWxlZCB0byByZWFkIHZhbHVlXCIpO1xuICAgIH1cblxuICAgIHRoaXMuY2xlYXIoKTtcbiAgICBjb25zdCBzdWNjZXNzTWVzc2FnZTogc3RyaW5nIHwgdW5kZWZpbmVkID0gdGhpcy5zdWNjZXNzKFxuICAgICAgdGhpcy4jdmFsdWUsXG4gICAgKTtcbiAgICBpZiAoc3VjY2Vzc01lc3NhZ2UpIHtcbiAgICAgIGNvbnNvbGUubG9nKHN1Y2Nlc3NNZXNzYWdlKTtcbiAgICB9XG5cbiAgICBHZW5lcmljUHJvbXB0LmluamVjdGVkVmFsdWUgPSB1bmRlZmluZWQ7XG4gICAgdGhpcy50dHkuY3Vyc29yU2hvdygpO1xuXG4gICAgcmV0dXJuIHRoaXMuI3ZhbHVlO1xuICB9O1xuXG4gIC8qKiBSZW5kZXIgcHJvbXB0LiAqL1xuICBwcm90ZWN0ZWQgYXN5bmMgcmVuZGVyKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IHJlc3VsdDogW3N0cmluZywgc3RyaW5nIHwgdW5kZWZpbmVkLCBzdHJpbmcgfCB1bmRlZmluZWRdID1cbiAgICAgIGF3YWl0IFByb21pc2UuYWxsKFtcbiAgICAgICAgdGhpcy5tZXNzYWdlKCksXG4gICAgICAgIHRoaXMuYm9keT8uKCksXG4gICAgICAgIHRoaXMuZm9vdGVyKCksXG4gICAgICBdKTtcblxuICAgIGNvbnN0IGNvbnRlbnQ6IHN0cmluZyA9IHJlc3VsdC5maWx0ZXIoQm9vbGVhbikuam9pbihcIlxcblwiKTtcbiAgICBjb25zdCBsaW5lcyA9IGNvbnRlbnQuc3BsaXQoXCJcXG5cIik7XG5cbiAgICBjb25zdCBjb2x1bW5zID0gZ2V0Q29sdW1ucygpO1xuICAgIGNvbnN0IGxpbmVzQ291bnQ6IG51bWJlciA9IGNvbHVtbnNcbiAgICAgID8gbGluZXMucmVkdWNlKChwcmV2LCBuZXh0KSA9PiB7XG4gICAgICAgIGNvbnN0IGxlbmd0aCA9IHN0cmlwQ29sb3IobmV4dCkubGVuZ3RoO1xuICAgICAgICByZXR1cm4gcHJldiArIChsZW5ndGggPiBjb2x1bW5zID8gTWF0aC5jZWlsKGxlbmd0aCAvIGNvbHVtbnMpIDogMSk7XG4gICAgICB9LCAwKVxuICAgICAgOiBjb250ZW50LnNwbGl0KFwiXFxuXCIpLmxlbmd0aDtcblxuICAgIGNvbnN0IHk6IG51bWJlciA9IGxpbmVzQ291bnQgLSB0aGlzLmN1cnNvci55IC0gMTtcblxuICAgIGlmICghdGhpcy4jaXNGaXJzdFJ1biB8fCB0aGlzLiNsYXN0RXJyb3IpIHtcbiAgICAgIHRoaXMuY2xlYXIoKTtcbiAgICB9XG4gICAgdGhpcy4jaXNGaXJzdFJ1biA9IGZhbHNlO1xuXG4gICAgaWYgKERlbm8uYnVpbGQub3MgPT09IFwid2luZG93c1wiKSB7XG4gICAgICBjb25zb2xlLmxvZyhjb250ZW50KTtcbiAgICAgIHRoaXMudHR5LmN1cnNvclVwKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIERlbm8uc3Rkb3V0LndyaXRlU3luYyh0aGlzLiNlbmNvZGVyLmVuY29kZShjb250ZW50KSk7XG4gICAgfVxuXG4gICAgaWYgKHkpIHtcbiAgICAgIHRoaXMudHR5LmN1cnNvclVwKHkpO1xuICAgIH1cbiAgICB0aGlzLnR0eS5jdXJzb3JUbyh0aGlzLmN1cnNvci54KTtcbiAgfVxuXG4gIC8qKiBSZWFkIHVzZXIgaW5wdXQgZnJvbSBzdGRpbiwgaGFuZGxlIGV2ZW50cyBhbmQgdmFsaWRhdGUgdXNlciBpbnB1dC4gKi9cbiAgcHJvdGVjdGVkIGFzeW5jIHJlYWQoKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgaWYgKHR5cGVvZiBHZW5lcmljUHJvbXB0LmluamVjdGVkVmFsdWUgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgIGNvbnN0IHZhbHVlOiBUUmF3VmFsdWUgPSBHZW5lcmljUHJvbXB0LmluamVjdGVkVmFsdWUgYXMgVFJhd1ZhbHVlO1xuICAgICAgYXdhaXQgdGhpcy4jdmFsaWRhdGVWYWx1ZSh2YWx1ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IGV2ZW50czogQXJyYXk8S2V5Q29kZT4gPSBhd2FpdCB0aGlzLiNyZWFkS2V5KCk7XG5cbiAgICAgIGlmICghZXZlbnRzLmxlbmd0aCkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG5cbiAgICAgIGZvciAoY29uc3QgZXZlbnQgb2YgZXZlbnRzKSB7XG4gICAgICAgIGF3YWl0IHRoaXMuaGFuZGxlRXZlbnQoZXZlbnQpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB0eXBlb2YgdGhpcy4jdmFsdWUgIT09IFwidW5kZWZpbmVkXCI7XG4gIH1cblxuICBwcm90ZWN0ZWQgc3VibWl0KCk6IFByb21pc2U8dm9pZD4ge1xuICAgIHJldHVybiB0aGlzLiN2YWxpZGF0ZVZhbHVlKHRoaXMuZ2V0VmFsdWUoKSk7XG4gIH1cblxuICBwcm90ZWN0ZWQgbWVzc2FnZSgpOiBzdHJpbmcge1xuICAgIHJldHVybiBgJHt0aGlzLnNldHRpbmdzLmluZGVudH0ke3RoaXMuc2V0dGluZ3MucHJlZml4fWAgK1xuICAgICAgYm9sZCh0aGlzLnNldHRpbmdzLm1lc3NhZ2UpICsgdGhpcy5kZWZhdWx0cygpO1xuICB9XG5cbiAgcHJvdGVjdGVkIGRlZmF1bHRzKCk6IHN0cmluZyB7XG4gICAgbGV0IGRlZmF1bHRNZXNzYWdlID0gXCJcIjtcbiAgICBpZiAoXG4gICAgICB0eXBlb2YgdGhpcy5zZXR0aW5ncy5kZWZhdWx0ICE9PSBcInVuZGVmaW5lZFwiICYmICF0aGlzLnNldHRpbmdzLmhpZGVEZWZhdWx0XG4gICAgKSB7XG4gICAgICBkZWZhdWx0TWVzc2FnZSArPSBkaW0oYCAoJHt0aGlzLmZvcm1hdCh0aGlzLnNldHRpbmdzLmRlZmF1bHQpfSlgKTtcbiAgICB9XG4gICAgcmV0dXJuIGRlZmF1bHRNZXNzYWdlO1xuICB9XG5cbiAgLyoqIEdldCBwcm9tcHQgc3VjY2VzcyBtZXNzYWdlLiAqL1xuICBwcm90ZWN0ZWQgc3VjY2Vzcyh2YWx1ZTogVFZhbHVlKTogc3RyaW5nIHwgdW5kZWZpbmVkIHtcbiAgICByZXR1cm4gYCR7dGhpcy5zZXR0aW5ncy5pbmRlbnR9JHt0aGlzLnNldHRpbmdzLnByZWZpeH1gICtcbiAgICAgIGJvbGQodGhpcy5zZXR0aW5ncy5tZXNzYWdlKSArIHRoaXMuZGVmYXVsdHMoKSArXG4gICAgICBcIiBcIiArIHRoaXMuc2V0dGluZ3MucG9pbnRlciArXG4gICAgICBcIiBcIiArIGdyZWVuKHRoaXMuZm9ybWF0KHZhbHVlKSk7XG4gIH1cblxuICBwcm90ZWN0ZWQgYm9keT8oKTogc3RyaW5nIHwgdW5kZWZpbmVkIHwgUHJvbWlzZTxzdHJpbmcgfCB1bmRlZmluZWQ+O1xuXG4gIHByb3RlY3RlZCBmb290ZXIoKTogc3RyaW5nIHwgdW5kZWZpbmVkIHtcbiAgICByZXR1cm4gdGhpcy5lcnJvcigpID8/IHRoaXMuaGludCgpO1xuICB9XG5cbiAgcHJvdGVjdGVkIGVycm9yKCk6IHN0cmluZyB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMuI2xhc3RFcnJvclxuICAgICAgPyB0aGlzLnNldHRpbmdzLmluZGVudCArIHJlZChib2xkKGAke0ZpZ3VyZXMuQ1JPU1N9IGApICsgdGhpcy4jbGFzdEVycm9yKVxuICAgICAgOiB1bmRlZmluZWQ7XG4gIH1cblxuICBwcm90ZWN0ZWQgaGludCgpOiBzdHJpbmcgfCB1bmRlZmluZWQge1xuICAgIHJldHVybiB0aGlzLnNldHRpbmdzLmhpbnRcbiAgICAgID8gdGhpcy5zZXR0aW5ncy5pbmRlbnQgK1xuICAgICAgICBpdGFsaWMoYnJpZ2h0Qmx1ZShkaW0oYCR7RmlndXJlcy5QT0lOVEVSfSBgKSArIHRoaXMuc2V0dGluZ3MuaGludCkpXG4gICAgICA6IHVuZGVmaW5lZDtcbiAgfVxuXG4gIHByb3RlY3RlZCBzZXRFcnJvck1lc3NhZ2UobWVzc2FnZTogc3RyaW5nKSB7XG4gICAgdGhpcy4jbGFzdEVycm9yID0gbWVzc2FnZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBIYW5kbGUgdXNlciBpbnB1dCBldmVudC5cbiAgICogQHBhcmFtIGV2ZW50IEtleSBldmVudC5cbiAgICovXG4gIHByb3RlY3RlZCBhc3luYyBoYW5kbGVFdmVudChldmVudDogS2V5Q29kZSk6IFByb21pc2U8dm9pZD4ge1xuICAgIHN3aXRjaCAodHJ1ZSkge1xuICAgICAgY2FzZSBldmVudC5uYW1lID09PSBcImNcIiAmJiBldmVudC5jdHJsOlxuICAgICAgICB0aGlzLmNsZWFyKCk7XG4gICAgICAgIHRoaXMudHR5LmN1cnNvclNob3coKTtcbiAgICAgICAgRGVuby5leGl0KDEzMCk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIGNhc2UgdGhpcy5pc0tleSh0aGlzLnNldHRpbmdzLmtleXMsIFwic3VibWl0XCIsIGV2ZW50KTpcbiAgICAgICAgYXdhaXQgdGhpcy5zdWJtaXQoKTtcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIE1hcCBpbnB1dCB2YWx1ZSB0byBvdXRwdXQgdmFsdWUuXG4gICAqIEBwYXJhbSB2YWx1ZSBJbnB1dCB2YWx1ZS5cbiAgICogQHJldHVybiBPdXRwdXQgdmFsdWUuXG4gICAqL1xuICBwcm90ZWN0ZWQgYWJzdHJhY3QgdHJhbnNmb3JtKHZhbHVlOiBUUmF3VmFsdWUpOiBUVmFsdWUgfCB1bmRlZmluZWQ7XG5cbiAgLyoqXG4gICAqIFZhbGlkYXRlIGlucHV0IHZhbHVlLlxuICAgKiBAcGFyYW0gdmFsdWUgVXNlciBpbnB1dCB2YWx1ZS5cbiAgICogQHJldHVybiBUcnVlIG9uIHN1Y2Nlc3MsIGZhbHNlIG9yIGVycm9yIG1lc3NhZ2Ugb24gZXJyb3IuXG4gICAqL1xuICBwcm90ZWN0ZWQgYWJzdHJhY3QgdmFsaWRhdGUodmFsdWU6IFRSYXdWYWx1ZSk6IFZhbGlkYXRlUmVzdWx0O1xuXG4gIC8qKlxuICAgKiBGb3JtYXQgb3V0cHV0IHZhbHVlLlxuICAgKiBAcGFyYW0gdmFsdWUgT3V0cHV0IHZhbHVlLlxuICAgKi9cbiAgcHJvdGVjdGVkIGFic3RyYWN0IGZvcm1hdCh2YWx1ZTogVFZhbHVlKTogc3RyaW5nO1xuXG4gIC8qKiBHZXQgaW5wdXQgdmFsdWUuICovXG4gIHByb3RlY3RlZCBhYnN0cmFjdCBnZXRWYWx1ZSgpOiBUUmF3VmFsdWU7XG5cbiAgLyoqIFJlYWQgdXNlciBpbnB1dCBmcm9tIHN0ZGluIGFuZCBwYXJzIGFuc2kgY29kZXMuICovXG4gICNyZWFkS2V5ID0gYXN5bmMgKCk6IFByb21pc2U8QXJyYXk8S2V5Q29kZT4+ID0+IHtcbiAgICBjb25zdCBkYXRhOiBVaW50OEFycmF5ID0gYXdhaXQgdGhpcy4jcmVhZENoYXIoKTtcblxuICAgIHJldHVybiBkYXRhLmxlbmd0aCA/IHBhcnNlKGRhdGEpIDogW107XG4gIH07XG5cbiAgLyoqIFJlYWQgdXNlciBpbnB1dCBmcm9tIHN0ZGluLiAqL1xuICAjcmVhZENoYXIgPSBhc3luYyAoKTogUHJvbWlzZTxVaW50OEFycmF5PiA9PiB7XG4gICAgY29uc3QgYnVmZmVyID0gbmV3IFVpbnQ4QXJyYXkoOCk7XG4gICAgY29uc3QgaXNUdHkgPSBEZW5vLmlzYXR0eShEZW5vLnN0ZGluLnJpZCk7XG5cbiAgICBpZiAoaXNUdHkpIHtcbiAgICAgIC8vIGNicmVhayBpcyBvbmx5IHN1cHBvcnRlZCBvbiBkZW5vID49IDEuNi4wLCBzdXBwcmVzcyB0cy1lcnJvci5cbiAgICAgIChEZW5vLnN0ZGluLnNldFJhdyBhcyBzZXRSYXcpKFxuICAgICAgICB0cnVlLFxuICAgICAgICB7IGNicmVhazogdGhpcy5zZXR0aW5ncy5jYnJlYWsgPT09IHRydWUgfSxcbiAgICAgICk7XG4gICAgfVxuICAgIGNvbnN0IG5yZWFkOiBudW1iZXIgfCBudWxsID0gYXdhaXQgRGVuby5zdGRpbi5yZWFkKGJ1ZmZlcik7XG5cbiAgICBpZiAoaXNUdHkpIHtcbiAgICAgIERlbm8uc3RkaW4uc2V0UmF3KGZhbHNlKTtcbiAgICB9XG5cbiAgICBpZiAobnJlYWQgPT09IG51bGwpIHtcbiAgICAgIHJldHVybiBidWZmZXI7XG4gICAgfVxuXG4gICAgcmV0dXJuIGJ1ZmZlci5zdWJhcnJheSgwLCBucmVhZCk7XG4gIH07XG5cbiAgLyoqXG4gICAqIE1hcCBpbnB1dCB2YWx1ZSB0byBvdXRwdXQgdmFsdWUuIElmIGEgY3VzdG9tIHRyYW5zZm9ybSBoYW5kbGVyIGlzdCBzZXQsIHRoZVxuICAgKiBjdXN0b20gaGFuZGxlciB3aWxsIGJlIGV4ZWN1dGVkLCBvdGhlcndpc2UgdGhlIGRlZmF1bHQgdHJhbnNmb3JtIGhhbmRsZXJcbiAgICogZnJvbSB0aGUgcHJvbXB0IHdpbGwgYmUgZXhlY3V0ZWQuXG4gICAqIEBwYXJhbSB2YWx1ZSBUaGUgdmFsdWUgdG8gdHJhbnNmb3JtLlxuICAgKi9cbiAgI3RyYW5zZm9ybVZhbHVlID0gKHZhbHVlOiBUUmF3VmFsdWUpOiBUVmFsdWUgfCB1bmRlZmluZWQgPT4ge1xuICAgIHJldHVybiB0aGlzLnNldHRpbmdzLnRyYW5zZm9ybVxuICAgICAgPyB0aGlzLnNldHRpbmdzLnRyYW5zZm9ybSh2YWx1ZSlcbiAgICAgIDogdGhpcy50cmFuc2Zvcm0odmFsdWUpO1xuICB9O1xuXG4gIC8qKlxuICAgKiBWYWxpZGF0ZSBpbnB1dCB2YWx1ZS4gU2V0IGVycm9yIG1lc3NhZ2UgaWYgdmFsaWRhdGlvbiBmYWlscyBhbmQgdHJhbnNmb3JtXG4gICAqIG91dHB1dCB2YWx1ZSBvbiBzdWNjZXNzLlxuICAgKiBJZiBhIGRlZmF1bHQgdmFsdWUgaXMgc2V0LCB0aGUgZGVmYXVsdCB3aWxsIGJlIHVzZWQgYXMgdmFsdWUgd2l0aG91dCBhbnlcbiAgICogdmFsaWRhdGlvbi5cbiAgICogSWYgYSBjdXN0b20gdmFsaWRhdGlvbiBoYW5kbGVyIGlzdCBzZXQsIHRoZSBjdXN0b20gaGFuZGxlciB3aWxsXG4gICAqIGJlIGV4ZWN1dGVkLCBvdGhlcndpc2UgYSBwcm9tcHQgc3BlY2lmaWMgZGVmYXVsdCB2YWxpZGF0aW9uIGhhbmRsZXIgd2lsbCBiZVxuICAgKiBleGVjdXRlZC5cbiAgICogQHBhcmFtIHZhbHVlIFRoZSB2YWx1ZSB0byB2YWxpZGF0ZS5cbiAgICovXG4gICN2YWxpZGF0ZVZhbHVlID0gYXN5bmMgKHZhbHVlOiBUUmF3VmFsdWUpOiBQcm9taXNlPHZvaWQ+ID0+IHtcbiAgICBpZiAoIXZhbHVlICYmIHR5cGVvZiB0aGlzLnNldHRpbmdzLmRlZmF1bHQgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgIHRoaXMuI3ZhbHVlID0gdGhpcy5zZXR0aW5ncy5kZWZhdWx0O1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuI3ZhbHVlID0gdW5kZWZpbmVkO1xuICAgIHRoaXMuI2xhc3RFcnJvciA9IHVuZGVmaW5lZDtcblxuICAgIGNvbnN0IHZhbGlkYXRpb24gPVxuICAgICAgYXdhaXQgKHRoaXMuc2V0dGluZ3MudmFsaWRhdGVcbiAgICAgICAgPyB0aGlzLnNldHRpbmdzLnZhbGlkYXRlKHZhbHVlKVxuICAgICAgICA6IHRoaXMudmFsaWRhdGUodmFsdWUpKTtcblxuICAgIGlmICh2YWxpZGF0aW9uID09PSBmYWxzZSkge1xuICAgICAgdGhpcy4jbGFzdEVycm9yID0gYEludmFsaWQgYW5zd2VyLmA7XG4gICAgfSBlbHNlIGlmICh0eXBlb2YgdmFsaWRhdGlvbiA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgdGhpcy4jbGFzdEVycm9yID0gdmFsaWRhdGlvbjtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy4jdmFsdWUgPSB0aGlzLiN0cmFuc2Zvcm1WYWx1ZSh2YWx1ZSk7XG4gICAgfVxuICB9O1xuXG4gIC8qKlxuICAgKiBDaGVjayBpZiBrZXkgZXZlbnQgaGFzIGdpdmVuIG5hbWUgb3Igc2VxdWVuY2UuXG4gICAqIEBwYXJhbSBrZXlzICBLZXkgbWFwLlxuICAgKiBAcGFyYW0gbmFtZSAgS2V5IG5hbWUuXG4gICAqIEBwYXJhbSBldmVudCBLZXkgZXZlbnQuXG4gICAqL1xuICBwcm90ZWN0ZWQgaXNLZXk8VEtleSBleHRlbmRzIHVua25vd24sIFROYW1lIGV4dGVuZHMga2V5b2YgVEtleT4oXG4gICAga2V5czogVEtleSB8IHVuZGVmaW5lZCxcbiAgICBuYW1lOiBUTmFtZSxcbiAgICBldmVudDogS2V5Q29kZSxcbiAgKTogYm9vbGVhbiB7XG4gICAgLy8gZGVuby1saW50LWlnbm9yZSBuby1leHBsaWNpdC1hbnlcbiAgICBjb25zdCBrZXlOYW1lczogQXJyYXk8dW5rbm93bj4gfCB1bmRlZmluZWQgPSBrZXlzPy5bbmFtZV0gYXMgYW55O1xuICAgIHJldHVybiB0eXBlb2Yga2V5TmFtZXMgIT09IFwidW5kZWZpbmVkXCIgJiYgKFxuICAgICAgKHR5cGVvZiBldmVudC5uYW1lICE9PSBcInVuZGVmaW5lZFwiICYmXG4gICAgICAgIGtleU5hbWVzLmluZGV4T2YoZXZlbnQubmFtZSkgIT09IC0xKSB8fFxuICAgICAgKHR5cGVvZiBldmVudC5zZXF1ZW5jZSAhPT0gXCJ1bmRlZmluZWRcIiAmJlxuICAgICAgICBrZXlOYW1lcy5pbmRleE9mKGV2ZW50LnNlcXVlbmNlKSAhPT0gLTEpXG4gICAgKTtcbiAgfVxufVxuXG50eXBlIHNldFJhdyA9IChcbiAgbW9kZTogYm9vbGVhbixcbiAgb3B0aW9ucz86IHsgY2JyZWFrPzogYm9vbGVhbiB9LFxuKSA9PiB2b2lkO1xuXG5mdW5jdGlvbiBnZXRDb2x1bW5zKCk6IG51bWJlciB8IG51bGwge1xuICB0cnkge1xuICAgIC8vIENhdGNoIGVycm9yIGluIG5vbmUgdHR5IG1vZGU6IEluYXBwcm9wcmlhdGUgaW9jdGwgZm9yIGRldmljZSAob3MgZXJyb3IgMjUpXG4gICAgLy8gQW5kIGtlZXAgYmFja3dhcmRzIGNvbXBhdGliaWxpdHkgZm9yIGRlbm8gPCAxLjI3LjAuXG4gICAgLy8gZGVuby1saW50LWlnbm9yZSBuby1leHBsaWNpdC1hbnlcbiAgICByZXR1cm4gKERlbm8gYXMgYW55KS5jb25zb2xlU2l6ZShEZW5vLnN0ZG91dC5yaWQpLmNvbHVtbnM7XG4gIH0gY2F0Y2ggKF9lcnJvcikge1xuICAgIHJldHVybiBudWxsO1xuICB9XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0EsU0FBUyxHQUFHLFFBQVEsaUJBQWlCO0FBQ3JDLFNBQWtCLEtBQUssUUFBUSx5QkFBeUI7QUFDeEQsU0FDRSxJQUFJLEVBQ0osVUFBVSxFQUNWLEdBQUcsRUFDSCxLQUFLLEVBQ0wsTUFBTSxFQUNOLEdBQUcsRUFDSCxVQUFVLFFBQ0wsWUFBWTtBQUNuQixTQUFTLE9BQU8sUUFBUSxlQUFlO0FBOEN2QyxtQ0FBbUMsR0FDbkMsT0FBTyxNQUFlO0VBS3BCLE9BQWlCLGNBQW1DO0VBQ2pDLFNBQW9CO0VBQ3BCLE1BQU0sSUFBSTtFQUNW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