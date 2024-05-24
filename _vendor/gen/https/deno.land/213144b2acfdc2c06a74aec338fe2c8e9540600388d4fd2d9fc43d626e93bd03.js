import { brightBlue, underline, yellow } from "./deps.ts";
import { Figures } from "./figures.ts";
import { GenericList } from "./_generic_list.ts";
import { GenericPrompt } from "./_generic_prompt.ts";
/** Select prompt representation. */ export class Select extends GenericList {
  listIndex = this.getListIndex(this.settings.default);
  /**
   * Inject prompt value. Can be used for unit tests or pre selections.
   * @param value Input value.
   */ static inject(value) {
    GenericPrompt.inject(value);
  }
  /** Execute the prompt and show cursor on end. */ static prompt(options) {
    return new this({
      pointer: brightBlue(Figures.POINTER_SMALL),
      prefix: yellow("? "),
      indent: " ",
      listPointer: brightBlue(Figures.POINTER),
      maxRows: 10,
      searchLabel: brightBlue(Figures.SEARCH),
      ...options,
      options: Select.mapOptions(options)
    }).prompt();
  }
  static mapOptions(options) {
    return options.options.map((item)=>typeof item === "string" ? {
        value: item
      } : item).map((item)=>this.mapOption(item));
  }
  input() {
    return underline(brightBlue(this.inputValue));
  }
  /**
   * Render select option.
   * @param item        Select option settings.
   * @param isSelected  Set to true if option is selected.
   */ getListItem(item, isSelected) {
    let line = this.settings.indent;
    line += isSelected ? `${this.settings.listPointer} ` : "  ";
    line += `${isSelected && !item.disabled ? this.highlight(item.name, (val)=>val) : this.highlight(item.name)}`;
    return line;
  }
  /** Get value of selected option. */ getValue() {
    return this.options[this.listIndex]?.value ?? this.settings.default;
  }
  /**
   * Validate input value.
   * @param value User input value.
   * @return True on success, false or error message on error.
   */ validate(value) {
    return typeof value === "string" && value.length > 0 && this.options.findIndex((option)=>option.value === value) !== -1;
  }
  /**
   * Map input value to output value.
   * @param value Input value.
   * @return Output value.
   */ transform(value) {
    return value.trim();
  }
  /**
   * Format output value.
   * @param value Output value.
   */ format(value) {
    return this.getOptionByValue(value)?.name ?? value;
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvY2xpZmZ5QHYwLjI1LjcvcHJvbXB0L3NlbGVjdC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBicmlnaHRCbHVlLCB1bmRlcmxpbmUsIHllbGxvdyB9IGZyb20gXCIuL2RlcHMudHNcIjtcbmltcG9ydCB7IEZpZ3VyZXMgfSBmcm9tIFwiLi9maWd1cmVzLnRzXCI7XG5pbXBvcnQge1xuICBHZW5lcmljTGlzdCxcbiAgR2VuZXJpY0xpc3RLZXlzLFxuICBHZW5lcmljTGlzdE9wdGlvbixcbiAgR2VuZXJpY0xpc3RPcHRpb25zLFxuICBHZW5lcmljTGlzdE9wdGlvblNldHRpbmdzLFxuICBHZW5lcmljTGlzdFNldHRpbmdzLFxufSBmcm9tIFwiLi9fZ2VuZXJpY19saXN0LnRzXCI7XG5pbXBvcnQgeyBHZW5lcmljUHJvbXB0IH0gZnJvbSBcIi4vX2dlbmVyaWNfcHJvbXB0LnRzXCI7XG5cbi8qKiBTZWxlY3Qga2V5IG9wdGlvbnMuICovXG5leHBvcnQgdHlwZSBTZWxlY3RLZXlzID0gR2VuZXJpY0xpc3RLZXlzO1xuXG4vKiogU2VsZWN0IG9wdGlvbiBvcHRpb25zLiAqL1xuZXhwb3J0IHR5cGUgU2VsZWN0T3B0aW9uID0gR2VuZXJpY0xpc3RPcHRpb247XG5cbi8qKiBTZWxlY3Qgb3B0aW9uIHNldHRpbmdzLiAqL1xuZXhwb3J0IHR5cGUgU2VsZWN0T3B0aW9uU2V0dGluZ3MgPSBHZW5lcmljTGlzdE9wdGlvblNldHRpbmdzO1xuXG4vKiogU2VsZWN0IG9wdGlvbnMgdHlwZS4gKi9cbmV4cG9ydCB0eXBlIFNlbGVjdFZhbHVlT3B0aW9ucyA9IChzdHJpbmcgfCBTZWxlY3RPcHRpb24pW107XG4vKiogU2VsZWN0IG9wdGlvbiBzZXR0aW5ncyB0eXBlLiAqL1xuZXhwb3J0IHR5cGUgU2VsZWN0VmFsdWVTZXR0aW5ncyA9IFNlbGVjdE9wdGlvblNldHRpbmdzW107XG5cbi8qKiBTZWxlY3QgcHJvbXB0IG9wdGlvbnMuICovXG5leHBvcnQgaW50ZXJmYWNlIFNlbGVjdE9wdGlvbnMgZXh0ZW5kcyBHZW5lcmljTGlzdE9wdGlvbnM8c3RyaW5nLCBzdHJpbmc+IHtcbiAgb3B0aW9uczogU2VsZWN0VmFsdWVPcHRpb25zO1xuICBrZXlzPzogU2VsZWN0S2V5cztcbn1cblxuLyoqIFNlbGVjdCBwcm9tcHQgc2V0dGluZ3MuICovXG5leHBvcnQgaW50ZXJmYWNlIFNlbGVjdFNldHRpbmdzIGV4dGVuZHMgR2VuZXJpY0xpc3RTZXR0aW5nczxzdHJpbmcsIHN0cmluZz4ge1xuICBvcHRpb25zOiBTZWxlY3RWYWx1ZVNldHRpbmdzO1xuICBrZXlzPzogU2VsZWN0S2V5cztcbn1cblxuLyoqIFNlbGVjdCBwcm9tcHQgcmVwcmVzZW50YXRpb24uICovXG5leHBvcnQgY2xhc3MgU2VsZWN0PFRTZXR0aW5ncyBleHRlbmRzIFNlbGVjdFNldHRpbmdzID0gU2VsZWN0U2V0dGluZ3M+XG4gIGV4dGVuZHMgR2VuZXJpY0xpc3Q8c3RyaW5nLCBzdHJpbmcsIFRTZXR0aW5ncz4ge1xuICBwcm90ZWN0ZWQgbGlzdEluZGV4OiBudW1iZXIgPSB0aGlzLmdldExpc3RJbmRleCh0aGlzLnNldHRpbmdzLmRlZmF1bHQpO1xuXG4gIC8qKlxuICAgKiBJbmplY3QgcHJvbXB0IHZhbHVlLiBDYW4gYmUgdXNlZCBmb3IgdW5pdCB0ZXN0cyBvciBwcmUgc2VsZWN0aW9ucy5cbiAgICogQHBhcmFtIHZhbHVlIElucHV0IHZhbHVlLlxuICAgKi9cbiAgcHVibGljIHN0YXRpYyBpbmplY3QodmFsdWU6IHN0cmluZyk6IHZvaWQge1xuICAgIEdlbmVyaWNQcm9tcHQuaW5qZWN0KHZhbHVlKTtcbiAgfVxuXG4gIC8qKiBFeGVjdXRlIHRoZSBwcm9tcHQgYW5kIHNob3cgY3Vyc29yIG9uIGVuZC4gKi9cbiAgcHVibGljIHN0YXRpYyBwcm9tcHQob3B0aW9uczogU2VsZWN0T3B0aW9ucyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgcmV0dXJuIG5ldyB0aGlzKHtcbiAgICAgIHBvaW50ZXI6IGJyaWdodEJsdWUoRmlndXJlcy5QT0lOVEVSX1NNQUxMKSxcbiAgICAgIHByZWZpeDogeWVsbG93KFwiPyBcIiksXG4gICAgICBpbmRlbnQ6IFwiIFwiLFxuICAgICAgbGlzdFBvaW50ZXI6IGJyaWdodEJsdWUoRmlndXJlcy5QT0lOVEVSKSxcbiAgICAgIG1heFJvd3M6IDEwLFxuICAgICAgc2VhcmNoTGFiZWw6IGJyaWdodEJsdWUoRmlndXJlcy5TRUFSQ0gpLFxuICAgICAgLi4ub3B0aW9ucyxcbiAgICAgIG9wdGlvbnM6IFNlbGVjdC5tYXBPcHRpb25zKG9wdGlvbnMpLFxuICAgIH0pLnByb21wdCgpO1xuICB9XG5cbiAgcHJvdGVjdGVkIHN0YXRpYyBtYXBPcHRpb25zKG9wdGlvbnM6IFNlbGVjdE9wdGlvbnMpOiBTZWxlY3RWYWx1ZVNldHRpbmdzIHtcbiAgICByZXR1cm4gb3B0aW9ucy5vcHRpb25zXG4gICAgICAubWFwKChpdGVtOiBzdHJpbmcgfCBTZWxlY3RPcHRpb24pID0+XG4gICAgICAgIHR5cGVvZiBpdGVtID09PSBcInN0cmluZ1wiID8geyB2YWx1ZTogaXRlbSB9IDogaXRlbVxuICAgICAgKVxuICAgICAgLm1hcCgoaXRlbSkgPT4gdGhpcy5tYXBPcHRpb24oaXRlbSkpO1xuICB9XG5cbiAgcHJvdGVjdGVkIGlucHV0KCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHVuZGVybGluZShicmlnaHRCbHVlKHRoaXMuaW5wdXRWYWx1ZSkpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlbmRlciBzZWxlY3Qgb3B0aW9uLlxuICAgKiBAcGFyYW0gaXRlbSAgICAgICAgU2VsZWN0IG9wdGlvbiBzZXR0aW5ncy5cbiAgICogQHBhcmFtIGlzU2VsZWN0ZWQgIFNldCB0byB0cnVlIGlmIG9wdGlvbiBpcyBzZWxlY3RlZC5cbiAgICovXG4gIHByb3RlY3RlZCBnZXRMaXN0SXRlbShcbiAgICBpdGVtOiBTZWxlY3RPcHRpb25TZXR0aW5ncyxcbiAgICBpc1NlbGVjdGVkPzogYm9vbGVhbixcbiAgKTogc3RyaW5nIHtcbiAgICBsZXQgbGluZSA9IHRoaXMuc2V0dGluZ3MuaW5kZW50O1xuICAgIGxpbmUgKz0gaXNTZWxlY3RlZCA/IGAke3RoaXMuc2V0dGluZ3MubGlzdFBvaW50ZXJ9IGAgOiBcIiAgXCI7XG4gICAgbGluZSArPSBgJHtcbiAgICAgIGlzU2VsZWN0ZWQgJiYgIWl0ZW0uZGlzYWJsZWRcbiAgICAgICAgPyB0aGlzLmhpZ2hsaWdodChpdGVtLm5hbWUsICh2YWwpID0+IHZhbClcbiAgICAgICAgOiB0aGlzLmhpZ2hsaWdodChpdGVtLm5hbWUpXG4gICAgfWA7XG4gICAgcmV0dXJuIGxpbmU7XG4gIH1cblxuICAvKiogR2V0IHZhbHVlIG9mIHNlbGVjdGVkIG9wdGlvbi4gKi9cbiAgcHJvdGVjdGVkIGdldFZhbHVlKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHRoaXMub3B0aW9uc1t0aGlzLmxpc3RJbmRleF0/LnZhbHVlID8/IHRoaXMuc2V0dGluZ3MuZGVmYXVsdDtcbiAgfVxuXG4gIC8qKlxuICAgKiBWYWxpZGF0ZSBpbnB1dCB2YWx1ZS5cbiAgICogQHBhcmFtIHZhbHVlIFVzZXIgaW5wdXQgdmFsdWUuXG4gICAqIEByZXR1cm4gVHJ1ZSBvbiBzdWNjZXNzLCBmYWxzZSBvciBlcnJvciBtZXNzYWdlIG9uIGVycm9yLlxuICAgKi9cbiAgcHJvdGVjdGVkIHZhbGlkYXRlKHZhbHVlOiBzdHJpbmcpOiBib29sZWFuIHwgc3RyaW5nIHtcbiAgICByZXR1cm4gdHlwZW9mIHZhbHVlID09PSBcInN0cmluZ1wiICYmXG4gICAgICB2YWx1ZS5sZW5ndGggPiAwICYmXG4gICAgICB0aGlzLm9wdGlvbnMuZmluZEluZGV4KChvcHRpb246IFNlbGVjdE9wdGlvblNldHRpbmdzKSA9PlxuICAgICAgICAgIG9wdGlvbi52YWx1ZSA9PT0gdmFsdWVcbiAgICAgICAgKSAhPT0gLTE7XG4gIH1cblxuICAvKipcbiAgICogTWFwIGlucHV0IHZhbHVlIHRvIG91dHB1dCB2YWx1ZS5cbiAgICogQHBhcmFtIHZhbHVlIElucHV0IHZhbHVlLlxuICAgKiBAcmV0dXJuIE91dHB1dCB2YWx1ZS5cbiAgICovXG4gIHByb3RlY3RlZCB0cmFuc2Zvcm0odmFsdWU6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHZhbHVlLnRyaW0oKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBGb3JtYXQgb3V0cHV0IHZhbHVlLlxuICAgKiBAcGFyYW0gdmFsdWUgT3V0cHV0IHZhbHVlLlxuICAgKi9cbiAgcHJvdGVjdGVkIGZvcm1hdCh2YWx1ZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy5nZXRPcHRpb25CeVZhbHVlKHZhbHVlKT8ubmFtZSA/PyB2YWx1ZTtcbiAgfVxufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFNBQVMsVUFBVSxFQUFFLFNBQVMsRUFBRSxNQUFNLFFBQVEsWUFBWTtBQUMxRCxTQUFTLE9BQU8sUUFBUSxlQUFlO0FBQ3ZDLFNBQ0UsV0FBVyxRQU1OLHFCQUFxQjtBQUM1QixTQUFTLGFBQWEsUUFBUSx1QkFBdUI7QUE0QnJELGtDQUFrQyxHQUNsQyxPQUFPLE1BQU0sZUFDSDtFQUNFLFlBQW9CLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLEVBQUU7RUFFdkU7OztHQUdDLEdBQ0QsT0FBYyxPQUFPLEtBQWEsRUFBUTtJQUN4QyxjQUFjLE1BQU0sQ0FBQztFQUN2QjtFQUVBLCtDQUErQyxHQUMvQyxPQUFjLE9BQU8sT0FBc0IsRUFBbUI7SUFDNUQsT0FBTyxJQUFJLElBQUksQ0FBQztNQUNkLFNBQVMsV0FBVyxRQUFRLGFBQWE7TUFDekMsUUFBUSxPQUFPO01BQ2YsUUFBUTtNQUNSLGFBQWEsV0FBVyxRQUFRLE9BQU87TUFDdkMsU0FBUztNQUNULGFBQWEsV0FBVyxRQUFRLE1BQU07TUFDdEMsR0FBRyxPQUFPO01BQ1YsU0FBUyxPQUFPLFVBQVUsQ0FBQztJQUM3QixHQUFHLE1BQU07RUFDWDtFQUVBLE9BQWlCLFdBQVcsT0FBc0IsRUFBdUI7SUFDdkUsT0FBTyxRQUFRLE9BQU8sQ0FDbkIsR0FBRyxDQUFDLENBQUMsT0FDSixPQUFPLFNBQVMsV0FBVztRQUFFLE9BQU87TUFBSyxJQUFJLE1BRTlDLEdBQUcsQ0FBQyxDQUFDLE9BQVMsSUFBSSxDQUFDLFNBQVMsQ0FBQztFQUNsQztFQUVVLFFBQWdCO0lBQ3hCLE9BQU8sVUFBVSxXQUFXLElBQUksQ0FBQyxVQUFVO0VBQzdDO0VBRUE7Ozs7R0FJQyxHQUNELEFBQVUsWUFDUixJQUEwQixFQUMxQixVQUFvQixFQUNaO0lBQ1IsSUFBSSxPQUFPLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTTtJQUMvQixRQUFRLGFBQWEsQ0FBQyxFQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxHQUFHO0lBQ3ZELFFBQVEsQ0FBQyxFQUNQLGNBQWMsQ0FBQyxLQUFLLFFBQVEsR0FDeEIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLElBQUksRUFBRSxDQUFDLE1BQVEsT0FDbkMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLElBQUksRUFDN0IsQ0FBQztJQUNGLE9BQU87RUFDVDtFQUVBLGtDQUFrQyxHQUNsQyxBQUFVLFdBQW1CO0lBQzNCLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLEVBQUUsU0FBUyxJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU87RUFDckU7RUFFQTs7OztHQUlDLEdBQ0QsQUFBVSxTQUFTLEtBQWEsRUFBb0I7SUFDbEQsT0FBTyxPQUFPLFVBQVUsWUFDdEIsTUFBTSxNQUFNLEdBQUcsS0FDZixJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDLFNBQ3BCLE9BQU8sS0FBSyxLQUFLLFdBQ2IsQ0FBQztFQUNiO0VBRUE7Ozs7R0FJQyxHQUNELEFBQVUsVUFBVSxLQUFhLEVBQVU7SUFDekMsT0FBTyxNQUFNLElBQUk7RUFDbkI7RUFFQTs7O0dBR0MsR0FDRCxBQUFVLE9BQU8sS0FBYSxFQUFVO0lBQ3RDLE9BQU8sSUFBSSxDQUFDLGdCQUFnQixDQUFDLFFBQVEsUUFBUTtFQUMvQztBQUNGIn0=