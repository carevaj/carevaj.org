import { border } from "./border.ts";
import { Cell } from "./cell.ts";
import { TableLayout } from "./layout.ts";
import { Row } from "./row.ts";
/** Table representation. */ export class Table extends Array {
  static _chars = {
    ...border
  };
  options = {
    indent: 0,
    border: false,
    maxColWidth: Infinity,
    minColWidth: 0,
    padding: 1,
    chars: {
      ...Table._chars
    }
  };
  headerRow;
  /**
   * Create a new table. If rows is a table, all rows and options of the table
   * will be copied to the new table.
   * @param rows
   */ static from(rows) {
    const table = new this(...rows);
    if (rows instanceof Table) {
      table.options = {
        ...rows.options
      };
      table.headerRow = rows.headerRow ? Row.from(rows.headerRow) : undefined;
    }
    return table;
  }
  /**
   * Create a new table from an array of json objects. An object represents a
   * row and each property a column.
   * @param rows Array of objects.
   */ static fromJson(rows) {
    return new this().fromJson(rows);
  }
  /**
   * Set global default border characters.
   * @param chars Border options.
   */ static chars(chars) {
    Object.assign(this._chars, chars);
    return this;
  }
  /**
   * Write table or rows to stdout.
   * @param rows Table or rows.
   */ static render(rows) {
    Table.from(rows).render();
  }
  /**
   * Read data from an array of json objects. An object represents a
   * row and each property a column.
   * @param rows Array of objects.
   */ fromJson(rows) {
    this.header(Object.keys(rows[0]));
    this.body(rows.map((row)=>Object.values(row)));
    return this;
  }
  /**
   * Set table header.
   * @param header Header row or cells.
   */ header(header) {
    this.headerRow = header instanceof Row ? header : Row.from(header);
    return this;
  }
  /**
   * Set table body.
   * @param rows Table rows.
   */ body(rows) {
    this.length = 0;
    this.push(...rows);
    return this;
  }
  /** Clone table recursively with header and options. */ clone() {
    const table = new Table(...this.map((row)=>row instanceof Row ? row.clone() : Row.from(row).clone()));
    table.options = {
      ...this.options
    };
    table.headerRow = this.headerRow?.clone();
    return table;
  }
  /** Generate table string. */ toString() {
    return new TableLayout(this, this.options).toString();
  }
  /** Write table to stdout. */ render() {
    console.log(this.toString());
    return this;
  }
  /**
   * Set max col with.
   * @param width     Max col width.
   * @param override  Override existing value.
   */ maxColWidth(width, override = true) {
    if (override || typeof this.options.maxColWidth === "undefined") {
      this.options.maxColWidth = width;
    }
    return this;
  }
  /**
   * Set min col width.
   * @param width     Min col width.
   * @param override  Override existing value.
   */ minColWidth(width, override = true) {
    if (override || typeof this.options.minColWidth === "undefined") {
      this.options.minColWidth = width;
    }
    return this;
  }
  /**
   * Set table indentation.
   * @param width     Indent width.
   * @param override  Override existing value.
   */ indent(width, override = true) {
    if (override || typeof this.options.indent === "undefined") {
      this.options.indent = width;
    }
    return this;
  }
  /**
   * Set cell padding.
   * @param padding   Cell padding.
   * @param override  Override existing value.
   */ padding(padding, override = true) {
    if (override || typeof this.options.padding === "undefined") {
      this.options.padding = padding;
    }
    return this;
  }
  /**
   * Enable/disable cell border.
   * @param enable    Enable/disable cell border.
   * @param override  Override existing value.
   */ border(enable, override = true) {
    if (override || typeof this.options.border === "undefined") {
      this.options.border = enable;
    }
    return this;
  }
  /**
   * Align table content.
   * @param direction Align direction.
   * @param override  Override existing value.
   */ align(direction, override = true) {
    if (override || typeof this.options.align === "undefined") {
      this.options.align = direction;
    }
    return this;
  }
  /**
   * Set border characters.
   * @param chars Border options.
   */ chars(chars) {
    Object.assign(this.options.chars, chars);
    return this;
  }
  /** Get table header. */ getHeader() {
    return this.headerRow;
  }
  /** Get table body. */ getBody() {
    return [
      ...this
    ];
  }
  /** Get mac col widrth. */ getMaxColWidth() {
    return this.options.maxColWidth;
  }
  /** Get min col width. */ getMinColWidth() {
    return this.options.minColWidth;
  }
  /** Get table indentation. */ getIndent() {
    return this.options.indent;
  }
  /** Get cell padding. */ getPadding() {
    return this.options.padding;
  }
  /** Check if table has border. */ getBorder() {
    return this.options.border === true;
  }
  /** Check if header row has border. */ hasHeaderBorder() {
    const hasBorder = this.headerRow?.hasBorder();
    return hasBorder === true || this.getBorder() && hasBorder !== false;
  }
  /** Check if table bordy has border. */ hasBodyBorder() {
    return this.getBorder() || this.some((row)=>row instanceof Row ? row.hasBorder() : row.some((cell)=>cell instanceof Cell ? cell.getBorder : false));
  }
  /** Check if table header or body has border. */ hasBorder() {
    return this.hasHeaderBorder() || this.hasBodyBorder();
  }
  /** Get table alignment. */ getAlign() {
    return this.options.align ?? "left";
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvY2xpZmZ5QHYwLjI1LjcvdGFibGUvdGFibGUudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgYm9yZGVyLCBJQm9yZGVyIH0gZnJvbSBcIi4vYm9yZGVyLnRzXCI7XG5pbXBvcnQgeyBDZWxsLCBEaXJlY3Rpb24gfSBmcm9tIFwiLi9jZWxsLnRzXCI7XG5pbXBvcnQgeyBUYWJsZUxheW91dCB9IGZyb20gXCIuL2xheW91dC50c1wiO1xuaW1wb3J0IHsgSURhdGFSb3csIElSb3csIFJvdyB9IGZyb20gXCIuL3Jvdy50c1wiO1xuXG4vKiogQm9yZGVyIGNoYXJhY3RlcnMgc2V0dGluZ3MuICovXG5leHBvcnQgdHlwZSBJQm9yZGVyT3B0aW9ucyA9IFBhcnRpYWw8SUJvcmRlcj47XG5cbi8qKiBUYWJsZSBvcHRpb25zLiAqL1xuZXhwb3J0IGludGVyZmFjZSBJVGFibGVPcHRpb25zIHtcbiAgaW5kZW50PzogbnVtYmVyO1xuICBib3JkZXI/OiBib29sZWFuO1xuICBhbGlnbj86IERpcmVjdGlvbjtcbiAgbWF4Q29sV2lkdGg/OiBudW1iZXIgfCBudW1iZXJbXTtcbiAgbWluQ29sV2lkdGg/OiBudW1iZXIgfCBudW1iZXJbXTtcbiAgcGFkZGluZz86IG51bWJlciB8IG51bWJlcltdO1xuICBjaGFycz86IElCb3JkZXJPcHRpb25zO1xufVxuXG4vKiogVGFibGUgc2V0dGluZ3MuICovXG5leHBvcnQgaW50ZXJmYWNlIElUYWJsZVNldHRpbmdzIGV4dGVuZHMgUmVxdWlyZWQ8T21pdDxJVGFibGVPcHRpb25zLCBcImFsaWduXCI+PiB7XG4gIGNoYXJzOiBJQm9yZGVyO1xuICBhbGlnbj86IERpcmVjdGlvbjtcbn1cblxuLyoqIFRhYmxlIHR5cGUuICovXG5leHBvcnQgdHlwZSBJVGFibGU8VCBleHRlbmRzIElSb3cgPSBJUm93PiA9IFRbXSB8IFRhYmxlPFQ+O1xuXG4vKiogVGFibGUgcmVwcmVzZW50YXRpb24uICovXG5leHBvcnQgY2xhc3MgVGFibGU8VCBleHRlbmRzIElSb3cgPSBJUm93PiBleHRlbmRzIEFycmF5PFQ+IHtcbiAgcHJvdGVjdGVkIHN0YXRpYyBfY2hhcnM6IElCb3JkZXIgPSB7IC4uLmJvcmRlciB9O1xuICBwcm90ZWN0ZWQgb3B0aW9uczogSVRhYmxlU2V0dGluZ3MgPSB7XG4gICAgaW5kZW50OiAwLFxuICAgIGJvcmRlcjogZmFsc2UsXG4gICAgbWF4Q29sV2lkdGg6IEluZmluaXR5LFxuICAgIG1pbkNvbFdpZHRoOiAwLFxuICAgIHBhZGRpbmc6IDEsXG4gICAgY2hhcnM6IHsgLi4uVGFibGUuX2NoYXJzIH0sXG4gIH07XG4gIHByaXZhdGUgaGVhZGVyUm93PzogUm93O1xuXG4gIC8qKlxuICAgKiBDcmVhdGUgYSBuZXcgdGFibGUuIElmIHJvd3MgaXMgYSB0YWJsZSwgYWxsIHJvd3MgYW5kIG9wdGlvbnMgb2YgdGhlIHRhYmxlXG4gICAqIHdpbGwgYmUgY29waWVkIHRvIHRoZSBuZXcgdGFibGUuXG4gICAqIEBwYXJhbSByb3dzXG4gICAqL1xuICBwdWJsaWMgc3RhdGljIGZyb208VCBleHRlbmRzIElSb3c+KHJvd3M6IElUYWJsZTxUPik6IFRhYmxlPFQ+IHtcbiAgICBjb25zdCB0YWJsZSA9IG5ldyB0aGlzKC4uLnJvd3MpO1xuICAgIGlmIChyb3dzIGluc3RhbmNlb2YgVGFibGUpIHtcbiAgICAgIHRhYmxlLm9wdGlvbnMgPSB7IC4uLihyb3dzIGFzIFRhYmxlKS5vcHRpb25zIH07XG4gICAgICB0YWJsZS5oZWFkZXJSb3cgPSByb3dzLmhlYWRlclJvdyA/IFJvdy5mcm9tKHJvd3MuaGVhZGVyUm93KSA6IHVuZGVmaW5lZDtcbiAgICB9XG4gICAgcmV0dXJuIHRhYmxlO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBhIG5ldyB0YWJsZSBmcm9tIGFuIGFycmF5IG9mIGpzb24gb2JqZWN0cy4gQW4gb2JqZWN0IHJlcHJlc2VudHMgYVxuICAgKiByb3cgYW5kIGVhY2ggcHJvcGVydHkgYSBjb2x1bW4uXG4gICAqIEBwYXJhbSByb3dzIEFycmF5IG9mIG9iamVjdHMuXG4gICAqL1xuICBwdWJsaWMgc3RhdGljIGZyb21Kc29uKHJvd3M6IElEYXRhUm93W10pOiBUYWJsZSB7XG4gICAgcmV0dXJuIG5ldyB0aGlzKCkuZnJvbUpzb24ocm93cyk7XG4gIH1cblxuICAvKipcbiAgICogU2V0IGdsb2JhbCBkZWZhdWx0IGJvcmRlciBjaGFyYWN0ZXJzLlxuICAgKiBAcGFyYW0gY2hhcnMgQm9yZGVyIG9wdGlvbnMuXG4gICAqL1xuICBwdWJsaWMgc3RhdGljIGNoYXJzKGNoYXJzOiBJQm9yZGVyT3B0aW9ucyk6IHR5cGVvZiBUYWJsZSB7XG4gICAgT2JqZWN0LmFzc2lnbih0aGlzLl9jaGFycywgY2hhcnMpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIFdyaXRlIHRhYmxlIG9yIHJvd3MgdG8gc3Rkb3V0LlxuICAgKiBAcGFyYW0gcm93cyBUYWJsZSBvciByb3dzLlxuICAgKi9cbiAgcHVibGljIHN0YXRpYyByZW5kZXI8VCBleHRlbmRzIElSb3c+KHJvd3M6IElUYWJsZTxUPik6IHZvaWQge1xuICAgIFRhYmxlLmZyb20ocm93cykucmVuZGVyKCk7XG4gIH1cblxuICAvKipcbiAgICogUmVhZCBkYXRhIGZyb20gYW4gYXJyYXkgb2YganNvbiBvYmplY3RzLiBBbiBvYmplY3QgcmVwcmVzZW50cyBhXG4gICAqIHJvdyBhbmQgZWFjaCBwcm9wZXJ0eSBhIGNvbHVtbi5cbiAgICogQHBhcmFtIHJvd3MgQXJyYXkgb2Ygb2JqZWN0cy5cbiAgICovXG4gIHB1YmxpYyBmcm9tSnNvbihyb3dzOiBJRGF0YVJvd1tdKTogdGhpcyB7XG4gICAgdGhpcy5oZWFkZXIoT2JqZWN0LmtleXMocm93c1swXSkpO1xuICAgIHRoaXMuYm9keShyb3dzLm1hcCgocm93KSA9PiBPYmplY3QudmFsdWVzKHJvdykgYXMgVCkpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldCB0YWJsZSBoZWFkZXIuXG4gICAqIEBwYXJhbSBoZWFkZXIgSGVhZGVyIHJvdyBvciBjZWxscy5cbiAgICovXG4gIHB1YmxpYyBoZWFkZXIoaGVhZGVyOiBJUm93KTogdGhpcyB7XG4gICAgdGhpcy5oZWFkZXJSb3cgPSBoZWFkZXIgaW5zdGFuY2VvZiBSb3cgPyBoZWFkZXIgOiBSb3cuZnJvbShoZWFkZXIpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldCB0YWJsZSBib2R5LlxuICAgKiBAcGFyYW0gcm93cyBUYWJsZSByb3dzLlxuICAgKi9cbiAgcHVibGljIGJvZHkocm93czogVFtdKTogdGhpcyB7XG4gICAgdGhpcy5sZW5ndGggPSAwO1xuICAgIHRoaXMucHVzaCguLi5yb3dzKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKiBDbG9uZSB0YWJsZSByZWN1cnNpdmVseSB3aXRoIGhlYWRlciBhbmQgb3B0aW9ucy4gKi9cbiAgcHVibGljIGNsb25lKCk6IFRhYmxlIHtcbiAgICBjb25zdCB0YWJsZSA9IG5ldyBUYWJsZShcbiAgICAgIC4uLnRoaXMubWFwKChyb3c6IFQpID0+XG4gICAgICAgIHJvdyBpbnN0YW5jZW9mIFJvdyA/IHJvdy5jbG9uZSgpIDogUm93LmZyb20ocm93KS5jbG9uZSgpXG4gICAgICApLFxuICAgICk7XG4gICAgdGFibGUub3B0aW9ucyA9IHsgLi4udGhpcy5vcHRpb25zIH07XG4gICAgdGFibGUuaGVhZGVyUm93ID0gdGhpcy5oZWFkZXJSb3c/LmNsb25lKCk7XG4gICAgcmV0dXJuIHRhYmxlO1xuICB9XG5cbiAgLyoqIEdlbmVyYXRlIHRhYmxlIHN0cmluZy4gKi9cbiAgcHVibGljIHRvU3RyaW5nKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIG5ldyBUYWJsZUxheW91dCh0aGlzLCB0aGlzLm9wdGlvbnMpLnRvU3RyaW5nKCk7XG4gIH1cblxuICAvKiogV3JpdGUgdGFibGUgdG8gc3Rkb3V0LiAqL1xuICBwdWJsaWMgcmVuZGVyKCk6IHRoaXMge1xuICAgIGNvbnNvbGUubG9nKHRoaXMudG9TdHJpbmcoKSk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogU2V0IG1heCBjb2wgd2l0aC5cbiAgICogQHBhcmFtIHdpZHRoICAgICBNYXggY29sIHdpZHRoLlxuICAgKiBAcGFyYW0gb3ZlcnJpZGUgIE92ZXJyaWRlIGV4aXN0aW5nIHZhbHVlLlxuICAgKi9cbiAgcHVibGljIG1heENvbFdpZHRoKHdpZHRoOiBudW1iZXIgfCBudW1iZXJbXSwgb3ZlcnJpZGUgPSB0cnVlKTogdGhpcyB7XG4gICAgaWYgKG92ZXJyaWRlIHx8IHR5cGVvZiB0aGlzLm9wdGlvbnMubWF4Q29sV2lkdGggPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgIHRoaXMub3B0aW9ucy5tYXhDb2xXaWR0aCA9IHdpZHRoO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXQgbWluIGNvbCB3aWR0aC5cbiAgICogQHBhcmFtIHdpZHRoICAgICBNaW4gY29sIHdpZHRoLlxuICAgKiBAcGFyYW0gb3ZlcnJpZGUgIE92ZXJyaWRlIGV4aXN0aW5nIHZhbHVlLlxuICAgKi9cbiAgcHVibGljIG1pbkNvbFdpZHRoKHdpZHRoOiBudW1iZXIgfCBudW1iZXJbXSwgb3ZlcnJpZGUgPSB0cnVlKTogdGhpcyB7XG4gICAgaWYgKG92ZXJyaWRlIHx8IHR5cGVvZiB0aGlzLm9wdGlvbnMubWluQ29sV2lkdGggPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgIHRoaXMub3B0aW9ucy5taW5Db2xXaWR0aCA9IHdpZHRoO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXQgdGFibGUgaW5kZW50YXRpb24uXG4gICAqIEBwYXJhbSB3aWR0aCAgICAgSW5kZW50IHdpZHRoLlxuICAgKiBAcGFyYW0gb3ZlcnJpZGUgIE92ZXJyaWRlIGV4aXN0aW5nIHZhbHVlLlxuICAgKi9cbiAgcHVibGljIGluZGVudCh3aWR0aDogbnVtYmVyLCBvdmVycmlkZSA9IHRydWUpOiB0aGlzIHtcbiAgICBpZiAob3ZlcnJpZGUgfHwgdHlwZW9mIHRoaXMub3B0aW9ucy5pbmRlbnQgPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgIHRoaXMub3B0aW9ucy5pbmRlbnQgPSB3aWR0aDtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogU2V0IGNlbGwgcGFkZGluZy5cbiAgICogQHBhcmFtIHBhZGRpbmcgICBDZWxsIHBhZGRpbmcuXG4gICAqIEBwYXJhbSBvdmVycmlkZSAgT3ZlcnJpZGUgZXhpc3RpbmcgdmFsdWUuXG4gICAqL1xuICBwdWJsaWMgcGFkZGluZyhwYWRkaW5nOiBudW1iZXIgfCBudW1iZXJbXSwgb3ZlcnJpZGUgPSB0cnVlKTogdGhpcyB7XG4gICAgaWYgKG92ZXJyaWRlIHx8IHR5cGVvZiB0aGlzLm9wdGlvbnMucGFkZGluZyA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgdGhpcy5vcHRpb25zLnBhZGRpbmcgPSBwYWRkaW5nO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBFbmFibGUvZGlzYWJsZSBjZWxsIGJvcmRlci5cbiAgICogQHBhcmFtIGVuYWJsZSAgICBFbmFibGUvZGlzYWJsZSBjZWxsIGJvcmRlci5cbiAgICogQHBhcmFtIG92ZXJyaWRlICBPdmVycmlkZSBleGlzdGluZyB2YWx1ZS5cbiAgICovXG4gIHB1YmxpYyBib3JkZXIoZW5hYmxlOiBib29sZWFuLCBvdmVycmlkZSA9IHRydWUpOiB0aGlzIHtcbiAgICBpZiAob3ZlcnJpZGUgfHwgdHlwZW9mIHRoaXMub3B0aW9ucy5ib3JkZXIgPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgIHRoaXMub3B0aW9ucy5ib3JkZXIgPSBlbmFibGU7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIEFsaWduIHRhYmxlIGNvbnRlbnQuXG4gICAqIEBwYXJhbSBkaXJlY3Rpb24gQWxpZ24gZGlyZWN0aW9uLlxuICAgKiBAcGFyYW0gb3ZlcnJpZGUgIE92ZXJyaWRlIGV4aXN0aW5nIHZhbHVlLlxuICAgKi9cbiAgcHVibGljIGFsaWduKGRpcmVjdGlvbjogRGlyZWN0aW9uLCBvdmVycmlkZSA9IHRydWUpOiB0aGlzIHtcbiAgICBpZiAob3ZlcnJpZGUgfHwgdHlwZW9mIHRoaXMub3B0aW9ucy5hbGlnbiA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgdGhpcy5vcHRpb25zLmFsaWduID0gZGlyZWN0aW9uO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXQgYm9yZGVyIGNoYXJhY3RlcnMuXG4gICAqIEBwYXJhbSBjaGFycyBCb3JkZXIgb3B0aW9ucy5cbiAgICovXG4gIHB1YmxpYyBjaGFycyhjaGFyczogSUJvcmRlck9wdGlvbnMpOiB0aGlzIHtcbiAgICBPYmplY3QuYXNzaWduKHRoaXMub3B0aW9ucy5jaGFycywgY2hhcnMpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqIEdldCB0YWJsZSBoZWFkZXIuICovXG4gIHB1YmxpYyBnZXRIZWFkZXIoKTogUm93IHwgdW5kZWZpbmVkIHtcbiAgICByZXR1cm4gdGhpcy5oZWFkZXJSb3c7XG4gIH1cblxuICAvKiogR2V0IHRhYmxlIGJvZHkuICovXG4gIHB1YmxpYyBnZXRCb2R5KCk6IFRbXSB7XG4gICAgcmV0dXJuIFsuLi50aGlzXTtcbiAgfVxuXG4gIC8qKiBHZXQgbWFjIGNvbCB3aWRydGguICovXG4gIHB1YmxpYyBnZXRNYXhDb2xXaWR0aCgpOiBudW1iZXIgfCBudW1iZXJbXSB7XG4gICAgcmV0dXJuIHRoaXMub3B0aW9ucy5tYXhDb2xXaWR0aDtcbiAgfVxuXG4gIC8qKiBHZXQgbWluIGNvbCB3aWR0aC4gKi9cbiAgcHVibGljIGdldE1pbkNvbFdpZHRoKCk6IG51bWJlciB8IG51bWJlcltdIHtcbiAgICByZXR1cm4gdGhpcy5vcHRpb25zLm1pbkNvbFdpZHRoO1xuICB9XG5cbiAgLyoqIEdldCB0YWJsZSBpbmRlbnRhdGlvbi4gKi9cbiAgcHVibGljIGdldEluZGVudCgpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLm9wdGlvbnMuaW5kZW50O1xuICB9XG5cbiAgLyoqIEdldCBjZWxsIHBhZGRpbmcuICovXG4gIHB1YmxpYyBnZXRQYWRkaW5nKCk6IG51bWJlciB8IG51bWJlcltdIHtcbiAgICByZXR1cm4gdGhpcy5vcHRpb25zLnBhZGRpbmc7XG4gIH1cblxuICAvKiogQ2hlY2sgaWYgdGFibGUgaGFzIGJvcmRlci4gKi9cbiAgcHVibGljIGdldEJvcmRlcigpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5vcHRpb25zLmJvcmRlciA9PT0gdHJ1ZTtcbiAgfVxuXG4gIC8qKiBDaGVjayBpZiBoZWFkZXIgcm93IGhhcyBib3JkZXIuICovXG4gIHB1YmxpYyBoYXNIZWFkZXJCb3JkZXIoKTogYm9vbGVhbiB7XG4gICAgY29uc3QgaGFzQm9yZGVyID0gdGhpcy5oZWFkZXJSb3c/Lmhhc0JvcmRlcigpO1xuICAgIHJldHVybiBoYXNCb3JkZXIgPT09IHRydWUgfHwgKHRoaXMuZ2V0Qm9yZGVyKCkgJiYgaGFzQm9yZGVyICE9PSBmYWxzZSk7XG4gIH1cblxuICAvKiogQ2hlY2sgaWYgdGFibGUgYm9yZHkgaGFzIGJvcmRlci4gKi9cbiAgcHVibGljIGhhc0JvZHlCb3JkZXIoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0Qm9yZGVyKCkgfHxcbiAgICAgIHRoaXMuc29tZSgocm93KSA9PlxuICAgICAgICByb3cgaW5zdGFuY2VvZiBSb3dcbiAgICAgICAgICA/IHJvdy5oYXNCb3JkZXIoKVxuICAgICAgICAgIDogcm93LnNvbWUoKGNlbGwpID0+IGNlbGwgaW5zdGFuY2VvZiBDZWxsID8gY2VsbC5nZXRCb3JkZXIgOiBmYWxzZSlcbiAgICAgICk7XG4gIH1cblxuICAvKiogQ2hlY2sgaWYgdGFibGUgaGVhZGVyIG9yIGJvZHkgaGFzIGJvcmRlci4gKi9cbiAgcHVibGljIGhhc0JvcmRlcigpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5oYXNIZWFkZXJCb3JkZXIoKSB8fCB0aGlzLmhhc0JvZHlCb3JkZXIoKTtcbiAgfVxuXG4gIC8qKiBHZXQgdGFibGUgYWxpZ25tZW50LiAqL1xuICBwdWJsaWMgZ2V0QWxpZ24oKTogRGlyZWN0aW9uIHtcbiAgICByZXR1cm4gdGhpcy5vcHRpb25zLmFsaWduID8/IFwibGVmdFwiO1xuICB9XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsU0FBUyxNQUFNLFFBQWlCLGNBQWM7QUFDOUMsU0FBUyxJQUFJLFFBQW1CLFlBQVk7QUFDNUMsU0FBUyxXQUFXLFFBQVEsY0FBYztBQUMxQyxTQUF5QixHQUFHLFFBQVEsV0FBVztBQXlCL0MsMEJBQTBCLEdBQzFCLE9BQU8sTUFBTSxjQUFxQztFQUNoRCxPQUFpQixTQUFrQjtJQUFFLEdBQUcsTUFBTTtFQUFDLEVBQUU7RUFDdkMsVUFBMEI7SUFDbEMsUUFBUTtJQUNSLFFBQVE7SUFDUixhQUFhO0lBQ2IsYUFBYTtJQUNiLFNBQVM7SUFDVCxPQUFPO01BQUUsR0FBRyxNQUFNLE1BQU07SUFBQztFQUMzQixFQUFFO0VBQ00sVUFBZ0I7RUFFeEI7Ozs7R0FJQyxHQUNELE9BQWMsS0FBcUIsSUFBZSxFQUFZO0lBQzVELE1BQU0sUUFBUSxJQUFJLElBQUksSUFBSTtJQUMxQixJQUFJLGdCQUFnQixPQUFPO01BQ3pCLE1BQU0sT0FBTyxHQUFHO1FBQUUsR0FBRyxBQUFDLEtBQWUsT0FBTztNQUFDO01BQzdDLE1BQU0sU0FBUyxHQUFHLEtBQUssU0FBUyxHQUFHLElBQUksSUFBSSxDQUFDLEtBQUssU0FBUyxJQUFJO0lBQ2hFO0lBQ0EsT0FBTztFQUNUO0VBRUE7Ozs7R0FJQyxHQUNELE9BQWMsU0FBUyxJQUFnQixFQUFTO0lBQzlDLE9BQU8sSUFBSSxJQUFJLEdBQUcsUUFBUSxDQUFDO0VBQzdCO0VBRUE7OztHQUdDLEdBQ0Qs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