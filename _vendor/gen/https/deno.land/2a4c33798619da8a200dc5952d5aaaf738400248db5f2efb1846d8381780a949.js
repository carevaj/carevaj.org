import { GenericPrompt } from "./_generic_prompt.ts";
import { GenericSuggestions } from "./_generic_suggestions.ts";
import { brightBlue, dim, yellow } from "./deps.ts";
import { Figures } from "./figures.ts";
/** Confirm prompt representation. */ export class Confirm extends GenericSuggestions {
  /** Execute the prompt and show cursor on end. */ static prompt(options) {
    if (typeof options === "string") {
      options = {
        message: options
      };
    }
    return new this({
      pointer: brightBlue(Figures.POINTER_SMALL),
      prefix: yellow("? "),
      indent: " ",
      listPointer: brightBlue(Figures.POINTER),
      maxRows: 8,
      active: "Yes",
      inactive: "No",
      ...options,
      files: false,
      complete: undefined,
      suggestions: [
        options.active ?? "Yes",
        options.inactive ?? "No"
      ],
      list: false,
      info: false
    }).prompt();
  }
  /**
   * Inject prompt value. Can be used for unit tests or pre selections.
   * @param value Input value.
   */ static inject(value) {
    GenericPrompt.inject(value);
  }
  defaults() {
    let defaultMessage = "";
    if (this.settings.default === true) {
      defaultMessage += this.settings.active[0].toUpperCase() + "/" + this.settings.inactive[0].toLowerCase();
    } else if (this.settings.default === false) {
      defaultMessage += this.settings.active[0].toLowerCase() + "/" + this.settings.inactive[0].toUpperCase();
    } else {
      defaultMessage += this.settings.active[0].toLowerCase() + "/" + this.settings.inactive[0].toLowerCase();
    }
    return defaultMessage ? dim(` (${defaultMessage})`) : "";
  }
  success(value) {
    this.saveSuggestions(this.format(value));
    return super.success(value);
  }
  /** Get input input. */ getValue() {
    return this.inputValue;
  }
  /**
   * Validate input value.
   * @param value User input value.
   * @return True on success, false or error message on error.
   */ validate(value) {
    return typeof value === "string" && [
      this.settings.active[0].toLowerCase(),
      this.settings.active.toLowerCase(),
      this.settings.inactive[0].toLowerCase(),
      this.settings.inactive.toLowerCase()
    ].indexOf(value.toLowerCase()) !== -1;
  }
  /**
   * Map input value to output value.
   * @param value Input value.
   * @return Output value.
   */ transform(value) {
    switch(value.toLowerCase()){
      case this.settings.active[0].toLowerCase():
      case this.settings.active.toLowerCase():
        return true;
      case this.settings.inactive[0].toLowerCase():
      case this.settings.inactive.toLowerCase():
        return false;
    }
    return;
  }
  /**
   * Format output value.
   * @param value Output value.
   */ format(value) {
    return value ? this.settings.active : this.settings.inactive;
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvY2xpZmZ5QHYwLjI1LjcvcHJvbXB0L2NvbmZpcm0udHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgR2VuZXJpY1Byb21wdCB9IGZyb20gXCIuL19nZW5lcmljX3Byb21wdC50c1wiO1xuaW1wb3J0IHtcbiAgR2VuZXJpY1N1Z2dlc3Rpb25zLFxuICBHZW5lcmljU3VnZ2VzdGlvbnNLZXlzLFxuICBHZW5lcmljU3VnZ2VzdGlvbnNPcHRpb25zLFxuICBHZW5lcmljU3VnZ2VzdGlvbnNTZXR0aW5ncyxcbn0gZnJvbSBcIi4vX2dlbmVyaWNfc3VnZ2VzdGlvbnMudHNcIjtcbmltcG9ydCB7IGJyaWdodEJsdWUsIGRpbSwgeWVsbG93IH0gZnJvbSBcIi4vZGVwcy50c1wiO1xuaW1wb3J0IHsgRmlndXJlcyB9IGZyb20gXCIuL2ZpZ3VyZXMudHNcIjtcblxuZXhwb3J0IHR5cGUgQ29uZmlybUtleXMgPSBHZW5lcmljU3VnZ2VzdGlvbnNLZXlzO1xuXG50eXBlIFVuc3VwcG9ydGVkT3B0aW9ucyA9XG4gIHwgXCJmaWxlc1wiXG4gIHwgXCJjb21wbGV0ZVwiXG4gIHwgXCJzdWdnZXN0aW9uc1wiXG4gIHwgXCJsaXN0XCJcbiAgfCBcImluZm9cIjtcblxuLyoqIENvbmZpcm0gcHJvbXB0IG9wdGlvbnMuICovXG5leHBvcnQgaW50ZXJmYWNlIENvbmZpcm1PcHRpb25zXG4gIGV4dGVuZHMgT21pdDxHZW5lcmljU3VnZ2VzdGlvbnNPcHRpb25zPGJvb2xlYW4sIHN0cmluZz4sIFVuc3VwcG9ydGVkT3B0aW9ucz4ge1xuICBhY3RpdmU/OiBzdHJpbmc7XG4gIGluYWN0aXZlPzogc3RyaW5nO1xuICBrZXlzPzogQ29uZmlybUtleXM7XG59XG5cbi8qKiBDb25maXJtIHByb21wdCBzZXR0aW5ncy4gKi9cbmludGVyZmFjZSBDb25maXJtU2V0dGluZ3MgZXh0ZW5kcyBHZW5lcmljU3VnZ2VzdGlvbnNTZXR0aW5nczxib29sZWFuLCBzdHJpbmc+IHtcbiAgYWN0aXZlOiBzdHJpbmc7XG4gIGluYWN0aXZlOiBzdHJpbmc7XG4gIGtleXM/OiBDb25maXJtS2V5cztcbn1cblxuLyoqIENvbmZpcm0gcHJvbXB0IHJlcHJlc2VudGF0aW9uLiAqL1xuZXhwb3J0IGNsYXNzIENvbmZpcm1cbiAgZXh0ZW5kcyBHZW5lcmljU3VnZ2VzdGlvbnM8Ym9vbGVhbiwgc3RyaW5nLCBDb25maXJtU2V0dGluZ3M+IHtcbiAgLyoqIEV4ZWN1dGUgdGhlIHByb21wdCBhbmQgc2hvdyBjdXJzb3Igb24gZW5kLiAqL1xuICBwdWJsaWMgc3RhdGljIHByb21wdChcbiAgICBvcHRpb25zOiBzdHJpbmcgfCBDb25maXJtT3B0aW9ucyxcbiAgKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgaWYgKHR5cGVvZiBvcHRpb25zID09PSBcInN0cmluZ1wiKSB7XG4gICAgICBvcHRpb25zID0geyBtZXNzYWdlOiBvcHRpb25zIH07XG4gICAgfVxuXG4gICAgcmV0dXJuIG5ldyB0aGlzKHtcbiAgICAgIHBvaW50ZXI6IGJyaWdodEJsdWUoRmlndXJlcy5QT0lOVEVSX1NNQUxMKSxcbiAgICAgIHByZWZpeDogeWVsbG93KFwiPyBcIiksXG4gICAgICBpbmRlbnQ6IFwiIFwiLFxuICAgICAgbGlzdFBvaW50ZXI6IGJyaWdodEJsdWUoRmlndXJlcy5QT0lOVEVSKSxcbiAgICAgIG1heFJvd3M6IDgsXG4gICAgICBhY3RpdmU6IFwiWWVzXCIsXG4gICAgICBpbmFjdGl2ZTogXCJOb1wiLFxuICAgICAgLi4ub3B0aW9ucyxcbiAgICAgIGZpbGVzOiBmYWxzZSxcbiAgICAgIGNvbXBsZXRlOiB1bmRlZmluZWQsXG4gICAgICBzdWdnZXN0aW9uczogW1xuICAgICAgICBvcHRpb25zLmFjdGl2ZSA/PyBcIlllc1wiLFxuICAgICAgICBvcHRpb25zLmluYWN0aXZlID8/IFwiTm9cIixcbiAgICAgIF0sXG4gICAgICBsaXN0OiBmYWxzZSxcbiAgICAgIGluZm86IGZhbHNlLFxuICAgIH0pLnByb21wdCgpO1xuICB9XG5cbiAgLyoqXG4gICAqIEluamVjdCBwcm9tcHQgdmFsdWUuIENhbiBiZSB1c2VkIGZvciB1bml0IHRlc3RzIG9yIHByZSBzZWxlY3Rpb25zLlxuICAgKiBAcGFyYW0gdmFsdWUgSW5wdXQgdmFsdWUuXG4gICAqL1xuICBwdWJsaWMgc3RhdGljIGluamVjdCh2YWx1ZTogc3RyaW5nKTogdm9pZCB7XG4gICAgR2VuZXJpY1Byb21wdC5pbmplY3QodmFsdWUpO1xuICB9XG5cbiAgcHJvdGVjdGVkIGRlZmF1bHRzKCk6IHN0cmluZyB7XG4gICAgbGV0IGRlZmF1bHRNZXNzYWdlID0gXCJcIjtcblxuICAgIGlmICh0aGlzLnNldHRpbmdzLmRlZmF1bHQgPT09IHRydWUpIHtcbiAgICAgIGRlZmF1bHRNZXNzYWdlICs9IHRoaXMuc2V0dGluZ3MuYWN0aXZlWzBdLnRvVXBwZXJDYXNlKCkgKyBcIi9cIiArXG4gICAgICAgIHRoaXMuc2V0dGluZ3MuaW5hY3RpdmVbMF0udG9Mb3dlckNhc2UoKTtcbiAgICB9IGVsc2UgaWYgKHRoaXMuc2V0dGluZ3MuZGVmYXVsdCA9PT0gZmFsc2UpIHtcbiAgICAgIGRlZmF1bHRNZXNzYWdlICs9IHRoaXMuc2V0dGluZ3MuYWN0aXZlWzBdLnRvTG93ZXJDYXNlKCkgKyBcIi9cIiArXG4gICAgICAgIHRoaXMuc2V0dGluZ3MuaW5hY3RpdmVbMF0udG9VcHBlckNhc2UoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZGVmYXVsdE1lc3NhZ2UgKz0gdGhpcy5zZXR0aW5ncy5hY3RpdmVbMF0udG9Mb3dlckNhc2UoKSArIFwiL1wiICtcbiAgICAgICAgdGhpcy5zZXR0aW5ncy5pbmFjdGl2ZVswXS50b0xvd2VyQ2FzZSgpO1xuICAgIH1cblxuICAgIHJldHVybiBkZWZhdWx0TWVzc2FnZSA/IGRpbShgICgke2RlZmF1bHRNZXNzYWdlfSlgKSA6IFwiXCI7XG4gIH1cblxuICBwcm90ZWN0ZWQgc3VjY2Vzcyh2YWx1ZTogYm9vbGVhbik6IHN0cmluZyB8IHVuZGVmaW5lZCB7XG4gICAgdGhpcy5zYXZlU3VnZ2VzdGlvbnModGhpcy5mb3JtYXQodmFsdWUpKTtcbiAgICByZXR1cm4gc3VwZXIuc3VjY2Vzcyh2YWx1ZSk7XG4gIH1cblxuICAvKiogR2V0IGlucHV0IGlucHV0LiAqL1xuICBwcm90ZWN0ZWQgZ2V0VmFsdWUoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy5pbnB1dFZhbHVlO1xuICB9XG5cbiAgLyoqXG4gICAqIFZhbGlkYXRlIGlucHV0IHZhbHVlLlxuICAgKiBAcGFyYW0gdmFsdWUgVXNlciBpbnB1dCB2YWx1ZS5cbiAgICogQHJldHVybiBUcnVlIG9uIHN1Y2Nlc3MsIGZhbHNlIG9yIGVycm9yIG1lc3NhZ2Ugb24gZXJyb3IuXG4gICAqL1xuICBwcm90ZWN0ZWQgdmFsaWRhdGUodmFsdWU6IHN0cmluZyk6IGJvb2xlYW4gfCBzdHJpbmcge1xuICAgIHJldHVybiB0eXBlb2YgdmFsdWUgPT09IFwic3RyaW5nXCIgJiZcbiAgICAgIFtcbiAgICAgICAgICB0aGlzLnNldHRpbmdzLmFjdGl2ZVswXS50b0xvd2VyQ2FzZSgpLFxuICAgICAgICAgIHRoaXMuc2V0dGluZ3MuYWN0aXZlLnRvTG93ZXJDYXNlKCksXG4gICAgICAgICAgdGhpcy5zZXR0aW5ncy5pbmFjdGl2ZVswXS50b0xvd2VyQ2FzZSgpLFxuICAgICAgICAgIHRoaXMuc2V0dGluZ3MuaW5hY3RpdmUudG9Mb3dlckNhc2UoKSxcbiAgICAgICAgXS5pbmRleE9mKHZhbHVlLnRvTG93ZXJDYXNlKCkpICE9PSAtMTtcbiAgfVxuXG4gIC8qKlxuICAgKiBNYXAgaW5wdXQgdmFsdWUgdG8gb3V0cHV0IHZhbHVlLlxuICAgKiBAcGFyYW0gdmFsdWUgSW5wdXQgdmFsdWUuXG4gICAqIEByZXR1cm4gT3V0cHV0IHZhbHVlLlxuICAgKi9cbiAgcHJvdGVjdGVkIHRyYW5zZm9ybSh2YWx1ZTogc3RyaW5nKTogYm9vbGVhbiB8IHVuZGVmaW5lZCB7XG4gICAgc3dpdGNoICh2YWx1ZS50b0xvd2VyQ2FzZSgpKSB7XG4gICAgICBjYXNlIHRoaXMuc2V0dGluZ3MuYWN0aXZlWzBdLnRvTG93ZXJDYXNlKCk6XG4gICAgICBjYXNlIHRoaXMuc2V0dGluZ3MuYWN0aXZlLnRvTG93ZXJDYXNlKCk6XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgY2FzZSB0aGlzLnNldHRpbmdzLmluYWN0aXZlWzBdLnRvTG93ZXJDYXNlKCk6XG4gICAgICBjYXNlIHRoaXMuc2V0dGluZ3MuaW5hY3RpdmUudG9Mb3dlckNhc2UoKTpcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm47XG4gIH1cblxuICAvKipcbiAgICogRm9ybWF0IG91dHB1dCB2YWx1ZS5cbiAgICogQHBhcmFtIHZhbHVlIE91dHB1dCB2YWx1ZS5cbiAgICovXG4gIHByb3RlY3RlZCBmb3JtYXQodmFsdWU6IGJvb2xlYW4pOiBzdHJpbmcge1xuICAgIHJldHVybiB2YWx1ZSA/IHRoaXMuc2V0dGluZ3MuYWN0aXZlIDogdGhpcy5zZXR0aW5ncy5pbmFjdGl2ZTtcbiAgfVxufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFNBQVMsYUFBYSxRQUFRLHVCQUF1QjtBQUNyRCxTQUNFLGtCQUFrQixRQUliLDRCQUE0QjtBQUNuQyxTQUFTLFVBQVUsRUFBRSxHQUFHLEVBQUUsTUFBTSxRQUFRLFlBQVk7QUFDcEQsU0FBUyxPQUFPLFFBQVEsZUFBZTtBQTBCdkMsbUNBQW1DLEdBQ25DLE9BQU8sTUFBTSxnQkFDSDtFQUNSLCtDQUErQyxHQUMvQyxPQUFjLE9BQ1osT0FBZ0MsRUFDZDtJQUNsQixJQUFJLE9BQU8sWUFBWSxVQUFVO01BQy9CLFVBQVU7UUFBRSxTQUFTO01BQVE7SUFDL0I7SUFFQSxPQUFPLElBQUksSUFBSSxDQUFDO01BQ2QsU0FBUyxXQUFXLFFBQVEsYUFBYTtNQUN6QyxRQUFRLE9BQU87TUFDZixRQUFRO01BQ1IsYUFBYSxXQUFXLFFBQVEsT0FBTztNQUN2QyxTQUFTO01BQ1QsUUFBUTtNQUNSLFVB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