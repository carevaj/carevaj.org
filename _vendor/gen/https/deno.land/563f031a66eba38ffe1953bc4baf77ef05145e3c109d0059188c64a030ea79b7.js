import { Cell } from "./cell.ts";
import { Row } from "./row.ts";
import { consumeWords, longest, strLength } from "./utils.ts";
/** Table layout renderer. */ export class TableLayout {
  table;
  options;
  /**
   * Table layout constructor.
   * @param table   Table instance.
   * @param options Render options.
   */ constructor(table, options){
    this.table = table;
    this.options = options;
  }
  /** Generate table string. */ toString() {
    const opts = this.createLayout();
    return opts.rows.length ? this.renderRows(opts) : "";
  }
  /**
   * Generates table layout including row and col span, converts all none
   * Cell/Row values to Cells and Rows and returns the layout rendering
   * settings.
   */ createLayout() {
    Object.keys(this.options.chars).forEach((key)=>{
      if (typeof this.options.chars[key] !== "string") {
        this.options.chars[key] = "";
      }
    });
    const hasBodyBorder = this.table.getBorder() || this.table.hasBodyBorder();
    const hasHeaderBorder = this.table.hasHeaderBorder();
    const hasBorder = hasHeaderBorder || hasBodyBorder;
    const rows = this.#getRows();
    const columns = Math.max(...rows.map((row)=>row.length));
    for (const row of rows){
      const length = row.length;
      if (length < columns) {
        const diff = columns - length;
        for(let i = 0; i < diff; i++){
          row.push(this.createCell(null, row));
        }
      }
    }
    const padding = [];
    const width = [];
    for(let colIndex = 0; colIndex < columns; colIndex++){
      const minColWidth = Array.isArray(this.options.minColWidth) ? this.options.minColWidth[colIndex] : this.options.minColWidth;
      const maxColWidth = Array.isArray(this.options.maxColWidth) ? this.options.maxColWidth[colIndex] : this.options.maxColWidth;
      const colWidth = longest(colIndex, rows, maxColWidth);
      width[colIndex] = Math.min(maxColWidth, Math.max(minColWidth, colWidth));
      padding[colIndex] = Array.isArray(this.options.padding) ? this.options.padding[colIndex] : this.options.padding;
    }
    return {
      padding,
      width,
      rows,
      columns,
      hasBorder,
      hasBodyBorder,
      hasHeaderBorder
    };
  }
  #getRows() {
    const header = this.table.getHeader();
    const rows = header ? [
      header,
      ...this.table
    ] : this.table.slice();
    const hasSpan = rows.some((row)=>row.some((cell)=>cell instanceof Cell && (cell.getColSpan() > 1 || cell.getRowSpan() > 1)));
    if (hasSpan) {
      return this.spanRows(rows);
    }
    return rows.map((row)=>{
      const newRow = this.createRow(row);
      for(let i = 0; i < row.length; i++){
        newRow[i] = this.createCell(row[i], newRow);
      }
      return newRow;
    });
  }
  /**
   * Fills rows and cols by specified row/col span with a reference of the
   * original cell.
   */ spanRows(rows) {
    const rowSpan = [];
    let colSpan = 1;
    let rowIndex = -1;
    while(true){
      rowIndex++;
      if (rowIndex === rows.length && rowSpan.every((span)=>span === 1)) {
        break;
      }
      const row = rows[rowIndex] = this.createRow(rows[rowIndex] || []);
      let colIndex = -1;
      while(true){
        colIndex++;
        if (colIndex === row.length && colIndex === rowSpan.length && colSpan === 1) {
          break;
        }
        if (colSpan > 1) {
          colSpan--;
          rowSpan[colIndex] = rowSpan[colIndex - 1];
          row.splice(colIndex, this.getDeleteCount(rows, rowIndex, colIndex), row[colIndex - 1]);
          continue;
        }
        if (rowSpan[colIndex] > 1) {
          rowSpan[colIndex]--;
          rows[rowIndex].splice(colIndex, this.getDeleteCount(rows, rowIndex, colIndex), rows[rowIndex - 1][colIndex]);
          continue;
        }
        const cell = row[colIndex] = this.createCell(row[colIndex] || null, row);
        colSpan = cell.getColSpan();
        rowSpan[colIndex] = cell.getRowSpan();
      }
    }
    return rows;
  }
  getDeleteCount(rows, rowIndex, colIndex) {
    return colIndex <= rows[rowIndex].length - 1 && typeof rows[rowIndex][colIndex] === "undefined" ? 1 : 0;
  }
  /**
   * Create a new row from existing row or cell array.
   * @param row Original row.
   */ createRow(row) {
    return Row.from(row).border(this.table.getBorder(), false).align(this.table.getAlign(), false);
  }
  /**
   * Create a new cell from existing cell or cell value.
   * @param cell  Original cell.
   * @param row   Parent row.
   */ createCell(cell, row) {
    return Cell.from(cell ?? "").border(row.getBorder(), false).align(row.getAlign(), false);
  }
  /**
   * Render table layout.
   * @param opts Render options.
   */ renderRows(opts) {
    let result = "";
    const rowSpan = new Array(opts.columns).fill(1);
    for(let rowIndex = 0; rowIndex < opts.rows.length; rowIndex++){
      result += this.renderRow(rowSpan, rowIndex, opts);
    }
    return result.slice(0, -1);
  }
  /**
   * Render row.
   * @param rowSpan     Current row span.
   * @param rowIndex    Current row index.
   * @param opts        Render options.
   * @param isMultiline Is multiline row.
   */ renderRow(rowSpan, rowIndex, opts, isMultiline) {
    const row = opts.rows[rowIndex];
    const prevRow = opts.rows[rowIndex - 1];
    const nextRow = opts.rows[rowIndex + 1];
    let result = "";
    let colSpan = 1;
    // border top row
    if (!isMultiline && rowIndex === 0 && row.hasBorder()) {
      result += this.renderBorderRow(undefined, row, rowSpan, opts);
    }
    let isMultilineRow = false;
    result += " ".repeat(this.options.indent || 0);
    for(let colIndex = 0; colIndex < opts.columns; colIndex++){
      if (colSpan > 1) {
        colSpan--;
        rowSpan[colIndex] = rowSpan[colIndex - 1];
        continue;
      }
      result += this.renderCell(colIndex, row, opts);
      if (rowSpan[colIndex] > 1) {
        if (!isMultiline) {
          rowSpan[colIndex]--;
        }
      } else if (!prevRow || prevRow[colIndex] !== row[colIndex]) {
        rowSpan[colIndex] = row[colIndex].getRowSpan();
      }
      colSpan = row[colIndex].getColSpan();
      if (rowSpan[colIndex] === 1 && row[colIndex].length) {
        isMultilineRow = true;
      }
    }
    if (opts.columns > 0) {
      if (row[opts.columns - 1].getBorder()) {
        result += this.options.chars.right;
      } else if (opts.hasBorder) {
        result += " ";
      }
    }
    result += "\n";
    if (isMultilineRow) {
      return result + this.renderRow(rowSpan, rowIndex, opts, isMultilineRow);
    }
    // border mid row
    if (rowIndex === 0 && opts.hasHeaderBorder || rowIndex < opts.rows.length - 1 && opts.hasBodyBorder) {
      result += this.renderBorderRow(row, nextRow, rowSpan, opts);
    }
    // border bottom row
    if (rowIndex === opts.rows.length - 1 && row.hasBorder()) {
      result += this.renderBorderRow(row, undefined, rowSpan, opts);
    }
    return result;
  }
  /**
   * Render cell.
   * @param colIndex  Current col index.
   * @param row       Current row.
   * @param opts      Render options.
   * @param noBorder  Disable border.
   */ renderCell(colIndex, row, opts, noBorder) {
    let result = "";
    const prevCell = row[colIndex - 1];
    const cell = row[colIndex];
    if (!noBorder) {
      if (colIndex === 0) {
        if (cell.getBorder()) {
          result += this.options.chars.left;
        } else if (opts.hasBorder) {
          result += " ";
        }
      } else {
        if (cell.getBorder() || prevCell?.getBorder()) {
          result += this.options.chars.middle;
        } else if (opts.hasBorder) {
          result += " ";
        }
      }
    }
    let maxLength = opts.width[colIndex];
    const colSpan = cell.getColSpan();
    if (colSpan > 1) {
      for(let o = 1; o < colSpan; o++){
        // add padding and with of next cell
        maxLength += opts.width[colIndex + o] + opts.padding[colIndex + o];
        if (opts.hasBorder) {
          // add padding again and border with
          maxLength += opts.padding[colIndex + o] + 1;
        }
      }
    }
    const { current, next } = this.renderCellValue(cell, maxLength);
    row[colIndex].setValue(next);
    if (opts.hasBorder) {
      result += " ".repeat(opts.padding[colIndex]);
    }
    result += current;
    if (opts.hasBorder || colIndex < opts.columns - 1) {
      result += " ".repeat(opts.padding[colIndex]);
    }
    return result;
  }
  /**
   * Render specified length of cell. Returns the rendered value and a new cell
   * with the rest value.
   * @param cell      Cell to render.
   * @param maxLength Max length of content to render.
   */ renderCellValue(cell, maxLength) {
    const length = Math.min(maxLength, strLength(cell.toString()));
    let words = consumeWords(length, cell.toString());
    // break word if word is longer than max length
    const breakWord = strLength(words) > length;
    if (breakWord) {
      words = words.slice(0, length);
    }
    // get next content and remove leading space if breakWord is not true
    const next = cell.toString().slice(words.length + (breakWord ? 0 : 1));
    const fillLength = maxLength - strLength(words);
    // Align content
    const align = cell.getAlign();
    let current;
    if (fillLength === 0) {
      current = words;
    } else if (align === "left") {
      current = words + " ".repeat(fillLength);
    } else if (align === "center") {
      current = " ".repeat(Math.floor(fillLength / 2)) + words + " ".repeat(Math.ceil(fillLength / 2));
    } else if (align === "right") {
      current = " ".repeat(fillLength) + words;
    } else {
      throw new Error("Unknown direction: " + align);
    }
    return {
      current,
      next: cell.clone(next)
    };
  }
  /**
   * Render border row.
   * @param prevRow Previous row.
   * @param nextRow Next row.
   * @param rowSpan Current row span.
   * @param opts    Render options.
   */ renderBorderRow(prevRow, nextRow, rowSpan, opts) {
    let result = "";
    let colSpan = 1;
    for(let colIndex = 0; colIndex < opts.columns; colIndex++){
      if (rowSpan[colIndex] > 1) {
        if (!nextRow) {
          throw new Error("invalid layout");
        }
        if (colSpan > 1) {
          colSpan--;
          continue;
        }
      }
      result += this.renderBorderCell(colIndex, prevRow, nextRow, rowSpan, opts);
      colSpan = nextRow?.[colIndex].getColSpan() ?? 1;
    }
    return result.length ? " ".repeat(this.options.indent) + result + "\n" : "";
  }
  /**
   * Render border cell.
   * @param colIndex  Current index.
   * @param prevRow   Previous row.
   * @param nextRow   Next row.
   * @param rowSpan   Current row span.
   * @param opts      Render options.
   */ renderBorderCell(colIndex, prevRow, nextRow, rowSpan, opts) {
    // a1 | b1
    // -------
    // a2 | b2
    const a1 = prevRow?.[colIndex - 1];
    const a2 = nextRow?.[colIndex - 1];
    const b1 = prevRow?.[colIndex];
    const b2 = nextRow?.[colIndex];
    const a1Border = !!a1?.getBorder();
    const a2Border = !!a2?.getBorder();
    const b1Border = !!b1?.getBorder();
    const b2Border = !!b2?.getBorder();
    const hasColSpan = (cell)=>(cell?.getColSpan() ?? 1) > 1;
    const hasRowSpan = (cell)=>(cell?.getRowSpan() ?? 1) > 1;
    let result = "";
    if (colIndex === 0) {
      if (rowSpan[colIndex] > 1) {
        if (b1Border) {
          result += this.options.chars.left;
        } else {
          result += " ";
        }
      } else if (b1Border && b2Border) {
        result += this.options.chars.leftMid;
      } else if (b1Border) {
        result += this.options.chars.bottomLeft;
      } else if (b2Border) {
        result += this.options.chars.topLeft;
      } else {
        result += " ";
      }
    } else if (colIndex < opts.columns) {
      if (a1Border && b2Border || b1Border && a2Border) {
        const a1ColSpan = hasColSpan(a1);
        const a2ColSpan = hasColSpan(a2);
        const b1ColSpan = hasColSpan(b1);
        const b2ColSpan = hasColSpan(b2);
        const a1RowSpan = hasRowSpan(a1);
        const a2RowSpan = hasRowSpan(a2);
        const b1RowSpan = hasRowSpan(b1);
        const b2RowSpan = hasRowSpan(b2);
        const hasAllBorder = a1Border && b2Border && b1Border && a2Border;
        const hasAllRowSpan = a1RowSpan && b1RowSpan && a2RowSpan && b2RowSpan;
        const hasAllColSpan = a1ColSpan && b1ColSpan && a2ColSpan && b2ColSpan;
        if (hasAllRowSpan && hasAllBorder) {
          result += this.options.chars.middle;
        } else if (hasAllColSpan && hasAllBorder && a1 === b1 && a2 === b2) {
          result += this.options.chars.mid;
        } else if (a1ColSpan && b1ColSpan && a1 === b1) {
          result += this.options.chars.topMid;
        } else if (a2ColSpan && b2ColSpan && a2 === b2) {
          result += this.options.chars.bottomMid;
        } else if (a1RowSpan && a2RowSpan && a1 === a2) {
          result += this.options.chars.leftMid;
        } else if (b1RowSpan && b2RowSpan && b1 === b2) {
          result += this.options.chars.rightMid;
        } else {
          result += this.options.chars.midMid;
        }
      } else if (a1Border && b1Border) {
        if (hasColSpan(a1) && hasColSpan(b1) && a1 === b1) {
          result += this.options.chars.bottom;
        } else {
          result += this.options.chars.bottomMid;
        }
      } else if (b1Border && b2Border) {
        if (rowSpan[colIndex] > 1) {
          result += this.options.chars.left;
        } else {
          result += this.options.chars.leftMid;
        }
      } else if (b2Border && a2Border) {
        if (hasColSpan(a2) && hasColSpan(b2) && a2 === b2) {
          result += this.options.chars.top;
        } else {
          result += this.options.chars.topMid;
        }
      } else if (a1Border && a2Border) {
        if (hasRowSpan(a1) && a1 === a2) {
          result += this.options.chars.right;
        } else {
          result += this.options.chars.rightMid;
        }
      } else if (a1Border) {
        result += this.options.chars.bottomRight;
      } else if (b1Border) {
        result += this.options.chars.bottomLeft;
      } else if (a2Border) {
        result += this.options.chars.topRight;
      } else if (b2Border) {
        result += this.options.chars.topLeft;
      } else {
        result += " ";
      }
    }
    const length = opts.padding[colIndex] + opts.width[colIndex] + opts.padding[colIndex];
    if (rowSpan[colIndex] > 1 && nextRow) {
      result += this.renderCell(colIndex, nextRow, opts, true);
      if (nextRow[colIndex] === nextRow[nextRow.length - 1]) {
        if (b1Border) {
          result += this.options.chars.right;
        } else {
          result += " ";
        }
        return result;
      }
    } else if (b1Border && b2Border) {
      result += this.options.chars.mid.repeat(length);
    } else if (b1Border) {
      result += this.options.chars.bottom.repeat(length);
    } else if (b2Border) {
      result += this.options.chars.top.repeat(length);
    } else {
      result += " ".repeat(length);
    }
    if (colIndex === opts.columns - 1) {
      if (b1Border && b2Border) {
        result += this.options.chars.rightMid;
      } else if (b1Border) {
        result += this.options.chars.bottomRight;
      } else if (b2Border) {
        result += this.options.chars.topRight;
      } else {
        result += " ";
      }
    }
    return result;
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvY2xpZmZ5QHYwLjI1LjcvdGFibGUvbGF5b3V0LnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENlbGwsIERpcmVjdGlvbiwgSUNlbGwgfSBmcm9tIFwiLi9jZWxsLnRzXCI7XG5pbXBvcnQgeyBJUm93LCBSb3cgfSBmcm9tIFwiLi9yb3cudHNcIjtcbmltcG9ydCB0eXBlIHsgSUJvcmRlck9wdGlvbnMsIElUYWJsZVNldHRpbmdzLCBUYWJsZSB9IGZyb20gXCIuL3RhYmxlLnRzXCI7XG5pbXBvcnQgeyBjb25zdW1lV29yZHMsIGxvbmdlc3QsIHN0ckxlbmd0aCB9IGZyb20gXCIuL3V0aWxzLnRzXCI7XG5cbi8qKiBMYXlvdXQgcmVuZGVyIHNldHRpbmdzLiAqL1xuaW50ZXJmYWNlIElSZW5kZXJTZXR0aW5ncyB7XG4gIHBhZGRpbmc6IG51bWJlcltdO1xuICB3aWR0aDogbnVtYmVyW107XG4gIGNvbHVtbnM6IG51bWJlcjtcbiAgaGFzQm9yZGVyOiBib29sZWFuO1xuICBoYXNIZWFkZXJCb3JkZXI6IGJvb2xlYW47XG4gIGhhc0JvZHlCb3JkZXI6IGJvb2xlYW47XG4gIHJvd3M6IFJvdzxDZWxsPltdO1xufVxuXG4vKiogVGFibGUgbGF5b3V0IHJlbmRlcmVyLiAqL1xuZXhwb3J0IGNsYXNzIFRhYmxlTGF5b3V0IHtcbiAgLyoqXG4gICAqIFRhYmxlIGxheW91dCBjb25zdHJ1Y3Rvci5cbiAgICogQHBhcmFtIHRhYmxlICAgVGFibGUgaW5zdGFuY2UuXG4gICAqIEBwYXJhbSBvcHRpb25zIFJlbmRlciBvcHRpb25zLlxuICAgKi9cbiAgcHVibGljIGNvbnN0cnVjdG9yKFxuICAgIHByaXZhdGUgdGFibGU6IFRhYmxlLFxuICAgIHByaXZhdGUgb3B0aW9uczogSVRhYmxlU2V0dGluZ3MsXG4gICkge31cblxuICAvKiogR2VuZXJhdGUgdGFibGUgc3RyaW5nLiAqL1xuICBwdWJsaWMgdG9TdHJpbmcoKTogc3RyaW5nIHtcbiAgICBjb25zdCBvcHRzOiBJUmVuZGVyU2V0dGluZ3MgPSB0aGlzLmNyZWF0ZUxheW91dCgpO1xuICAgIHJldHVybiBvcHRzLnJvd3MubGVuZ3RoID8gdGhpcy5yZW5kZXJSb3dzKG9wdHMpIDogXCJcIjtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZW5lcmF0ZXMgdGFibGUgbGF5b3V0IGluY2x1ZGluZyByb3cgYW5kIGNvbCBzcGFuLCBjb252ZXJ0cyBhbGwgbm9uZVxuICAgKiBDZWxsL1JvdyB2YWx1ZXMgdG8gQ2VsbHMgYW5kIFJvd3MgYW5kIHJldHVybnMgdGhlIGxheW91dCByZW5kZXJpbmdcbiAgICogc2V0dGluZ3MuXG4gICAqL1xuICBwcm90ZWN0ZWQgY3JlYXRlTGF5b3V0KCk6IElSZW5kZXJTZXR0aW5ncyB7XG4gICAgT2JqZWN0LmtleXModGhpcy5vcHRpb25zLmNoYXJzKS5mb3JFYWNoKChrZXk6IHN0cmluZykgPT4ge1xuICAgICAgaWYgKHR5cGVvZiB0aGlzLm9wdGlvbnMuY2hhcnNba2V5IGFzIGtleW9mIElCb3JkZXJPcHRpb25zXSAhPT0gXCJzdHJpbmdcIikge1xuICAgICAgICB0aGlzLm9wdGlvbnMuY2hhcnNba2V5IGFzIGtleW9mIElCb3JkZXJPcHRpb25zXSA9IFwiXCI7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBjb25zdCBoYXNCb2R5Qm9yZGVyOiBib29sZWFuID0gdGhpcy50YWJsZS5nZXRCb3JkZXIoKSB8fFxuICAgICAgdGhpcy50YWJsZS5oYXNCb2R5Qm9yZGVyKCk7XG4gICAgY29uc3QgaGFzSGVhZGVyQm9yZGVyOiBib29sZWFuID0gdGhpcy50YWJsZS5oYXNIZWFkZXJCb3JkZXIoKTtcbiAgICBjb25zdCBoYXNCb3JkZXI6IGJvb2xlYW4gPSBoYXNIZWFkZXJCb3JkZXIgfHwgaGFzQm9keUJvcmRlcjtcblxuICAgIGNvbnN0IHJvd3MgPSB0aGlzLiNnZXRSb3dzKCk7XG5cbiAgICBjb25zdCBjb2x1bW5zOiBudW1iZXIgPSBNYXRoLm1heCguLi5yb3dzLm1hcCgocm93KSA9PiByb3cubGVuZ3RoKSk7XG4gICAgZm9yIChjb25zdCByb3cgb2Ygcm93cykge1xuICAgICAgY29uc3QgbGVuZ3RoOiBudW1iZXIgPSByb3cubGVuZ3RoO1xuICAgICAgaWYgKGxlbmd0aCA8IGNvbHVtbnMpIHtcbiAgICAgICAgY29uc3QgZGlmZiA9IGNvbHVtbnMgLSBsZW5ndGg7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZGlmZjsgaSsrKSB7XG4gICAgICAgICAgcm93LnB1c2godGhpcy5jcmVhdGVDZWxsKG51bGwsIHJvdykpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc3QgcGFkZGluZzogbnVtYmVyW10gPSBbXTtcbiAgICBjb25zdCB3aWR0aDogbnVtYmVyW10gPSBbXTtcbiAgICBmb3IgKGxldCBjb2xJbmRleCA9IDA7IGNvbEluZGV4IDwgY29sdW1uczsgY29sSW5kZXgrKykge1xuICAgICAgY29uc3QgbWluQ29sV2lkdGg6IG51bWJlciA9IEFycmF5LmlzQXJyYXkodGhpcy5vcHRpb25zLm1pbkNvbFdpZHRoKVxuICAgICAgICA/IHRoaXMub3B0aW9ucy5taW5Db2xXaWR0aFtjb2xJbmRleF1cbiAgICAgICAgOiB0aGlzLm9wdGlvbnMubWluQ29sV2lkdGg7XG4gICAgICBjb25zdCBtYXhDb2xXaWR0aDogbnVtYmVyID0gQXJyYXkuaXNBcnJheSh0aGlzLm9wdGlvbnMubWF4Q29sV2lkdGgpXG4gICAgICAgID8gdGhpcy5vcHRpb25zLm1heENvbFdpZHRoW2NvbEluZGV4XVxuICAgICAgICA6IHRoaXMub3B0aW9ucy5tYXhDb2xXaWR0aDtcbiAgICAgIGNvbnN0IGNvbFdpZHRoOiBudW1iZXIgPSBsb25nZXN0KGNvbEluZGV4LCByb3dzLCBtYXhDb2xXaWR0aCk7XG4gICAgICB3aWR0aFtjb2xJbmRleF0gPSBNYXRoLm1pbihtYXhDb2xXaWR0aCwgTWF0aC5tYXgobWluQ29sV2lkdGgsIGNvbFdpZHRoKSk7XG4gICAgICBwYWRkaW5nW2NvbEluZGV4XSA9IEFycmF5LmlzQXJyYXkodGhpcy5vcHRpb25zLnBhZGRpbmcpXG4gICAgICAgID8gdGhpcy5vcHRpb25zLnBhZGRpbmdbY29sSW5kZXhdXG4gICAgICAgIDogdGhpcy5vcHRpb25zLnBhZGRpbmc7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIHBhZGRpbmcsXG4gICAgICB3aWR0aCxcbiAgICAgIHJvd3MsXG4gICAgICBjb2x1bW5zLFxuICAgICAgaGFzQm9yZGVyLFxuICAgICAgaGFzQm9keUJvcmRlcixcbiAgICAgIGhhc0hlYWRlckJvcmRlcixcbiAgICB9O1xuICB9XG5cbiAgI2dldFJvd3MoKTogQXJyYXk8Um93PENlbGw+PiB7XG4gICAgY29uc3QgaGVhZGVyOiBSb3cgfCB1bmRlZmluZWQgPSB0aGlzLnRhYmxlLmdldEhlYWRlcigpO1xuICAgIGNvbnN0IHJvd3MgPSBoZWFkZXIgPyBbaGVhZGVyLCAuLi50aGlzLnRhYmxlXSA6IHRoaXMudGFibGUuc2xpY2UoKTtcbiAgICBjb25zdCBoYXNTcGFuID0gcm93cy5zb21lKChyb3cpID0+XG4gICAgICByb3cuc29tZSgoY2VsbCkgPT5cbiAgICAgICAgY2VsbCBpbnN0YW5jZW9mIENlbGwgJiYgKGNlbGwuZ2V0Q29sU3BhbigpID4gMSB8fCBjZWxsLmdldFJvd1NwYW4oKSA+IDEpXG4gICAgICApXG4gICAgKTtcblxuICAgIGlmIChoYXNTcGFuKSB7XG4gICAgICByZXR1cm4gdGhpcy5zcGFuUm93cyhyb3dzKTtcbiAgICB9XG5cbiAgICByZXR1cm4gcm93cy5tYXAoKHJvdykgPT4ge1xuICAgICAgY29uc3QgbmV3Um93ID0gdGhpcy5jcmVhdGVSb3cocm93KTtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcm93Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIG5ld1Jvd1tpXSA9IHRoaXMuY3JlYXRlQ2VsbChyb3dbaV0sIG5ld1Jvdyk7XG4gICAgICB9XG4gICAgICByZXR1cm4gbmV3Um93O1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEZpbGxzIHJvd3MgYW5kIGNvbHMgYnkgc3BlY2lmaWVkIHJvdy9jb2wgc3BhbiB3aXRoIGEgcmVmZXJlbmNlIG9mIHRoZVxuICAgKiBvcmlnaW5hbCBjZWxsLlxuICAgKi9cbiAgcHJvdGVjdGVkIHNwYW5Sb3dzKHJvd3M6IEFycmF5PElSb3c+KSB7XG4gICAgY29uc3Qgcm93U3BhbjogQXJyYXk8bnVtYmVyPiA9IFtdO1xuICAgIGxldCBjb2xTcGFuID0gMTtcbiAgICBsZXQgcm93SW5kZXggPSAtMTtcblxuICAgIHdoaWxlICh0cnVlKSB7XG4gICAgICByb3dJbmRleCsrO1xuICAgICAgaWYgKHJvd0luZGV4ID09PSByb3dzLmxlbmd0aCAmJiByb3dTcGFuLmV2ZXJ5KChzcGFuKSA9PiBzcGFuID09PSAxKSkge1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGNvbnN0IHJvdyA9IHJvd3Nbcm93SW5kZXhdID0gdGhpcy5jcmVhdGVSb3cocm93c1tyb3dJbmRleF0gfHwgW10pO1xuICAgICAgbGV0IGNvbEluZGV4ID0gLTE7XG5cbiAgICAgIHdoaWxlICh0cnVlKSB7XG4gICAgICAgIGNvbEluZGV4Kys7XG4gICAgICAgIGlmIChcbiAgICAgICAgICBjb2xJbmRleCA9PT0gcm93Lmxlbmd0aCAmJlxuICAgICAgICAgIGNvbEluZGV4ID09PSByb3dTcGFuLmxlbmd0aCAmJiBjb2xTcGFuID09PSAxXG4gICAgICAgICkge1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGNvbFNwYW4gPiAxKSB7XG4gICAgICAgICAgY29sU3Bhbi0tO1xuICAgICAgICAgIHJvd1NwYW5bY29sSW5kZXhdID0gcm93U3Bhbltjb2xJbmRleCAtIDFdO1xuICAgICAgICAgIHJvdy5zcGxpY2UoXG4gICAgICAgICAgICBjb2xJbmRleCxcbiAgICAgICAgICAgIHRoaXMuZ2V0RGVsZXRlQ291bnQocm93cywgcm93SW5kZXgsIGNvbEluZGV4KSxcbiAgICAgICAgICAgIHJvd1tjb2xJbmRleCAtIDFdLFxuICAgICAgICAgICk7XG5cbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChyb3dTcGFuW2NvbEluZGV4XSA+IDEpIHtcbiAgICAgICAgICByb3dTcGFuW2NvbEluZGV4XS0tO1xuICAgICAgICAgIHJvd3Nbcm93SW5kZXhdLnNwbGljZShcbiAgICAgICAgICAgIGNvbEluZGV4LFxuICAgICAgICAgICAgdGhpcy5nZXREZWxldGVDb3VudChyb3dzLCByb3dJbmRleCwgY29sSW5kZXgpLFxuICAgICAgICAgICAgcm93c1tyb3dJbmRleCAtIDFdW2NvbEluZGV4XSxcbiAgICAgICAgICApO1xuXG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBjZWxsID0gcm93W2NvbEluZGV4XSA9IHRoaXMuY3JlYXRlQ2VsbChcbiAgICAgICAgICByb3dbY29sSW5kZXhdIHx8IG51bGwsXG4gICAgICAgICAgcm93LFxuICAgICAgICApO1xuXG4gICAgICAgIGNvbFNwYW4gPSBjZWxsLmdldENvbFNwYW4oKTtcbiAgICAgICAgcm93U3Bhbltjb2xJbmRleF0gPSBjZWxsLmdldFJvd1NwYW4oKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gcm93cyBhcyBBcnJheTxSb3c8Q2VsbD4+O1xuICB9XG5cbiAgcHJvdGVjdGVkIGdldERlbGV0ZUNvdW50KFxuICAgIHJvd3M6IEFycmF5PEFycmF5PHVua25vd24+PixcbiAgICByb3dJbmRleDogbnVtYmVyLFxuICAgIGNvbEluZGV4OiBudW1iZXIsXG4gICkge1xuICAgIHJldHVybiBjb2xJbmRleCA8PSByb3dzW3Jvd0luZGV4XS5sZW5ndGggLSAxICYmXG4gICAgICAgIHR5cGVvZiByb3dzW3Jvd0luZGV4XVtjb2xJbmRleF0gPT09IFwidW5kZWZpbmVkXCJcbiAgICAgID8gMVxuICAgICAgOiAwO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBhIG5ldyByb3cgZnJvbSBleGlzdGluZyByb3cgb3IgY2VsbCBhcnJheS5cbiAgICogQHBhcmFtIHJvdyBPcmlnaW5hbCByb3cuXG4gICAqL1xuICBwcm90ZWN0ZWQgY3JlYXRlUm93KHJvdzogSVJvdyk6IFJvdzxDZWxsPiB7XG4gICAgcmV0dXJuIFJvdy5mcm9tKHJvdylcbiAgICAgIC5ib3JkZXIodGhpcy50YWJsZS5nZXRCb3JkZXIoKSwgZmFsc2UpXG4gICAgICAuYWxpZ24odGhpcy50YWJsZS5nZXRBbGlnbigpLCBmYWxzZSkgYXMgUm93PENlbGw+O1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBhIG5ldyBjZWxsIGZyb20gZXhpc3RpbmcgY2VsbCBvciBjZWxsIHZhbHVlLlxuICAgKiBAcGFyYW0gY2VsbCAgT3JpZ2luYWwgY2VsbC5cbiAgICogQHBhcmFtIHJvdyAgIFBhcmVudCByb3cuXG4gICAqL1xuICBwcm90ZWN0ZWQgY3JlYXRlQ2VsbChjZWxsOiBJQ2VsbCB8IG51bGwgfCB1bmRlZmluZWQsIHJvdzogUm93KTogQ2VsbCB7XG4gICAgcmV0dXJuIENlbGwuZnJvbShjZWxsID8/IFwiXCIpXG4gICAgICAuYm9yZGVyKHJvdy5nZXRCb3JkZXIoKSwgZmFsc2UpXG4gICAgICAuYWxpZ24ocm93LmdldEFsaWduKCksIGZhbHNlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZW5kZXIgdGFibGUgbGF5b3V0LlxuICAgKiBAcGFyYW0gb3B0cyBSZW5kZXIgb3B0aW9ucy5cbiAgICovXG4gIHByb3RlY3RlZCByZW5kZXJSb3dzKG9wdHM6IElSZW5kZXJTZXR0aW5ncyk6IHN0cmluZyB7XG4gICAgbGV0IHJlc3VsdCA9IFwiXCI7XG4gICAgY29uc3Qgcm93U3BhbjogbnVtYmVyW10gPSBuZXcgQXJyYXkob3B0cy5jb2x1bW5zKS5maWxsKDEpO1xuXG4gICAgZm9yIChsZXQgcm93SW5kZXggPSAwOyByb3dJbmRleCA8IG9wdHMucm93cy5sZW5ndGg7IHJvd0luZGV4KyspIHtcbiAgICAgIHJlc3VsdCArPSB0aGlzLnJlbmRlclJvdyhyb3dTcGFuLCByb3dJbmRleCwgb3B0cyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlc3VsdC5zbGljZSgwLCAtMSk7XG4gIH1cblxuICAvKipcbiAgICogUmVuZGVyIHJvdy5cbiAgICogQHBhcmFtIHJvd1NwYW4gICAgIEN1cnJlbnQgcm93IHNwYW4uXG4gICAqIEBwYXJhbSByb3dJbmRleCAgICBDdXJyZW50IHJvdyBpbmRleC5cbiAgICogQHBhcmFtIG9wdHMgICAgICAgIFJlbmRlciBvcHRpb25zLlxuICAgKiBAcGFyYW0gaXNNdWx0aWxpbmUgSXMgbXVsdGlsaW5lIHJvdy5cbiAgICovXG4gIHByb3RlY3RlZCByZW5kZXJSb3coXG4gICAgcm93U3BhbjogbnVtYmVyW10sXG4gICAgcm93SW5kZXg6IG51bWJlcixcbiAgICBvcHRzOiBJUmVuZGVyU2V0dGluZ3MsXG4gICAgaXNNdWx0aWxpbmU/OiBib29sZWFuLFxuICApOiBzdHJpbmcge1xuICAgIGNvbnN0IHJvdzogUm93PENlbGw+ID0gb3B0cy5yb3dzW3Jvd0luZGV4XTtcbiAgICBjb25zdCBwcmV2Um93OiBSb3c8Q2VsbD4gfCB1bmRlZmluZWQgPSBvcHRzLnJvd3Nbcm93SW5kZXggLSAxXTtcbiAgICBjb25zdCBuZXh0Um93OiBSb3c8Q2VsbD4gfCB1bmRlZmluZWQgPSBvcHRzLnJvd3Nbcm93SW5kZXggKyAxXTtcbiAgICBsZXQgcmVzdWx0ID0gXCJcIjtcblxuICAgIGxldCBjb2xTcGFuID0gMTtcblxuICAgIC8vIGJvcmRlciB0b3Agcm93XG4gICAgaWYgKCFpc011bHRpbGluZSAmJiByb3dJbmRleCA9PT0gMCAmJiByb3cuaGFzQm9yZGVyKCkpIHtcbiAgICAgIHJlc3VsdCArPSB0aGlzLnJlbmRlckJvcmRlclJvdyh1bmRlZmluZWQsIHJvdywgcm93U3Bhbiwgb3B0cyk7XG4gICAgfVxuXG4gICAgbGV0IGlzTXVsdGlsaW5lUm93ID0gZmFsc2U7XG5cbiAgICByZXN1bHQgKz0gXCIgXCIucmVwZWF0KHRoaXMub3B0aW9ucy5pbmRlbnQgfHwgMCk7XG5cbiAgICBmb3IgKGxldCBjb2xJbmRleCA9IDA7IGNvbEluZGV4IDwgb3B0cy5jb2x1bW5zOyBjb2xJbmRleCsrKSB7XG4gICAgICBpZiAoY29sU3BhbiA+IDEpIHtcbiAgICAgICAgY29sU3Bhbi0tO1xuICAgICAgICByb3dTcGFuW2NvbEluZGV4XSA9IHJvd1NwYW5bY29sSW5kZXggLSAxXTtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIHJlc3VsdCArPSB0aGlzLnJlbmRlckNlbGwoY29sSW5kZXgsIHJvdywgb3B0cyk7XG5cbiAgICAgIGlmIChyb3dTcGFuW2NvbEluZGV4XSA+IDEpIHtcbiAgICAgICAgaWYgKCFpc011bHRpbGluZSkge1xuICAgICAgICAgIHJvd1NwYW5bY29sSW5kZXhdLS07XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoIXByZXZSb3cgfHwgcHJldlJvd1tjb2xJbmRleF0gIT09IHJvd1tjb2xJbmRleF0pIHtcbiAgICAgICAgcm93U3Bhbltjb2xJbmRleF0gPSByb3dbY29sSW5kZXhdLmdldFJvd1NwYW4oKTtcbiAgICAgIH1cblxuICAgICAgY29sU3BhbiA9IHJvd1tjb2xJbmRleF0uZ2V0Q29sU3BhbigpO1xuXG4gICAgICBpZiAocm93U3Bhbltjb2xJbmRleF0gPT09IDEgJiYgcm93W2NvbEluZGV4XS5sZW5ndGgpIHtcbiAgICAgICAgaXNNdWx0aWxpbmVSb3cgPSB0cnVlO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChvcHRzLmNvbHVtbnMgPiAwKSB7XG4gICAgICBpZiAocm93W29wdHMuY29sdW1ucyAtIDFdLmdldEJvcmRlcigpKSB7XG4gICAgICAgIHJlc3VsdCArPSB0aGlzLm9wdGlvbnMuY2hhcnMucmlnaHQ7XG4gICAgICB9IGVsc2UgaWYgKG9wdHMuaGFzQm9yZGVyKSB7XG4gICAgICAgIHJlc3VsdCArPSBcIiBcIjtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXN1bHQgKz0gXCJcXG5cIjtcblxuICAgIGlmIChpc011bHRpbGluZVJvdykgeyAvLyBza2lwIGJvcmRlclxuICAgICAgcmV0dXJuIHJlc3VsdCArIHRoaXMucmVuZGVyUm93KHJvd1NwYW4sIHJvd0luZGV4LCBvcHRzLCBpc011bHRpbGluZVJvdyk7XG4gICAgfVxuXG4gICAgLy8gYm9yZGVyIG1pZCByb3dcbiAgICBpZiAoXG4gICAgICAocm93SW5kZXggPT09IDAgJiYgb3B0cy5oYXNIZWFkZXJCb3JkZXIpIHx8XG4gICAgICAocm93SW5kZXggPCBvcHRzLnJvd3MubGVuZ3RoIC0gMSAmJiBvcHRzLmhhc0JvZHlCb3JkZXIpXG4gICAgKSB7XG4gICAgICByZXN1bHQgKz0gdGhpcy5yZW5kZXJCb3JkZXJSb3cocm93LCBuZXh0Um93LCByb3dTcGFuLCBvcHRzKTtcbiAgICB9XG5cbiAgICAvLyBib3JkZXIgYm90dG9tIHJvd1xuICAgIGlmIChyb3dJbmRleCA9PT0gb3B0cy5yb3dzLmxlbmd0aCAtIDEgJiYgcm93Lmhhc0JvcmRlcigpKSB7XG4gICAgICByZXN1bHQgKz0gdGhpcy5yZW5kZXJCb3JkZXJSb3cocm93LCB1bmRlZmluZWQsIHJvd1NwYW4sIG9wdHMpO1xuICAgIH1cblxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICAvKipcbiAgICogUmVuZGVyIGNlbGwuXG4gICAqIEBwYXJhbSBjb2xJbmRleCAgQ3VycmVudCBjb2wgaW5kZXguXG4gICAqIEBwYXJhbSByb3cgICAgICAgQ3VycmVudCByb3cuXG4gICAqIEBwYXJhbSBvcHRzICAgICAgUmVuZGVyIG9wdGlvbnMuXG4gICAqIEBwYXJhbSBub0JvcmRlciAgRGlzYWJsZSBib3JkZXIuXG4gICAqL1xuICBwcm90ZWN0ZWQgcmVuZGVyQ2VsbChcbiAgICBjb2xJbmRleDogbnVtYmVyLFxuICAgIHJvdzogUm93PENlbGw+LFxuICAgIG9wdHM6IElSZW5kZXJTZXR0aW5ncyxcbiAgICBub0JvcmRlcj86IGJvb2xlYW4sXG4gICk6IHN0cmluZyB7XG4gICAgbGV0IHJlc3VsdCA9IFwiXCI7XG4gICAgY29uc3QgcHJldkNlbGw6IENlbGwgfCB1bmRlZmluZWQgPSByb3dbY29sSW5kZXggLSAxXTtcblxuICAgIGNvbnN0IGNlbGw6IENlbGwgPSByb3dbY29sSW5kZXhdO1xuXG4gICAgaWYgKCFub0JvcmRlcikge1xuICAgICAgaWYgKGNvbEluZGV4ID09PSAwKSB7XG4gICAgICAgIGlmIChjZWxsLmdldEJvcmRlcigpKSB7XG4gICAgICAgICAgcmVzdWx0ICs9IHRoaXMub3B0aW9ucy5jaGFycy5sZWZ0O1xuICAgICAgICB9IGVsc2UgaWYgKG9wdHMuaGFzQm9yZGVyKSB7XG4gICAgICAgICAgcmVzdWx0ICs9IFwiIFwiO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoY2VsbC5nZXRCb3JkZXIoKSB8fCBwcmV2Q2VsbD8uZ2V0Qm9yZGVyKCkpIHtcbiAgICAgICAgICByZXN1bHQgKz0gdGhpcy5vcHRpb25zLmNoYXJzLm1pZGRsZTtcbiAgICAgICAgfSBlbHNlIGlmIChvcHRzLmhhc0JvcmRlcikge1xuICAgICAgICAgIHJlc3VsdCArPSBcIiBcIjtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGxldCBtYXhMZW5ndGg6IG51bWJlciA9IG9wdHMud2lkdGhbY29sSW5kZXhdO1xuXG4gICAgY29uc3QgY29sU3BhbjogbnVtYmVyID0gY2VsbC5nZXRDb2xTcGFuKCk7XG4gICAgaWYgKGNvbFNwYW4gPiAxKSB7XG4gICAgICBmb3IgKGxldCBvID0gMTsgbyA8IGNvbFNwYW47IG8rKykge1xuICAgICAgICAvLyBhZGQgcGFkZGluZyBhbmQgd2l0aCBvZiBuZXh0IGNlbGxcbiAgICAgICAgbWF4TGVuZ3RoICs9IG9wdHMud2lkdGhbY29sSW5kZXggKyBvXSArIG9wdHMucGFkZGluZ1tjb2xJbmRleCArIG9dO1xuICAgICAgICBpZiAob3B0cy5oYXNCb3JkZXIpIHtcbiAgICAgICAgICAvLyBhZGQgcGFkZGluZyBhZ2FpbiBhbmQgYm9yZGVyIHdpdGhcbiAgICAgICAgICBtYXhMZW5ndGggKz0gb3B0cy5wYWRkaW5nW2NvbEluZGV4ICsgb10gKyAxO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc3QgeyBjdXJyZW50LCBuZXh0IH0gPSB0aGlzLnJlbmRlckNlbGxWYWx1ZShjZWxsLCBtYXhMZW5ndGgpO1xuXG4gICAgcm93W2NvbEluZGV4XS5zZXRWYWx1ZShuZXh0KTtcblxuICAgIGlmIChvcHRzLmhhc0JvcmRlcikge1xuICAgICAgcmVzdWx0ICs9IFwiIFwiLnJlcGVhdChvcHRzLnBhZGRpbmdbY29sSW5kZXhdKTtcbiAgICB9XG5cbiAgICByZXN1bHQgKz0gY3VycmVudDtcblxuICAgIGlmIChvcHRzLmhhc0JvcmRlciB8fCBjb2xJbmRleCA8IG9wdHMuY29sdW1ucyAtIDEpIHtcbiAgICAgIHJlc3VsdCArPSBcIiBcIi5yZXBlYXQob3B0cy5wYWRkaW5nW2NvbEluZGV4XSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZW5kZXIgc3BlY2lmaWVkIGxlbmd0aCBvZiBjZWxsLiBSZXR1cm5zIHRoZSByZW5kZXJlZCB2YWx1ZSBhbmQgYSBuZXcgY2VsbFxuICAgKiB3aXRoIHRoZSByZXN0IHZhbHVlLlxuICAgKiBAcGFyYW0gY2VsbCAgICAgIENlbGwgdG8gcmVuZGVyLlxuICAgKiBAcGFyYW0gbWF4TGVuZ3RoIE1heCBsZW5ndGggb2YgY29udGVudCB0byByZW5kZXIuXG4gICAqL1xuICBwcm90ZWN0ZWQgcmVuZGVyQ2VsbFZhbHVlKFxuICAgIGNlbGw6IENlbGwsXG4gICAgbWF4TGVuZ3RoOiBudW1iZXIsXG4gICk6IHsgY3VycmVudDogc3RyaW5nOyBuZXh0OiBDZWxsIH0ge1xuICAgIGNvbnN0IGxlbmd0aDogbnVtYmVyID0gTWF0aC5taW4oXG4gICAgICBtYXhMZW5ndGgsXG4gICAgICBzdHJMZW5ndGgoY2VsbC50b1N0cmluZygpKSxcbiAgICApO1xuICAgIGxldCB3b3Jkczogc3RyaW5nID0gY29uc3VtZVdvcmRzKGxlbmd0aCwgY2VsbC50b1N0cmluZygpKTtcblxuICAgIC8vIGJyZWFrIHdvcmQgaWYgd29yZCBpcyBsb25nZXIgdGhhbiBtYXggbGVuZ3RoXG4gICAgY29uc3QgYnJlYWtXb3JkID0gc3RyTGVuZ3RoKHdvcmRzKSA+IGxlbmd0aDtcbiAgICBpZiAoYnJlYWtXb3JkKSB7XG4gICAgICB3b3JkcyA9IHdvcmRzLnNsaWNlKDAsIGxlbmd0aCk7XG4gICAgfVxuXG4gICAgLy8gZ2V0IG5leHQgY29udGVudCBhbmQgcmVtb3ZlIGxlYWRpbmcgc3BhY2UgaWYgYnJlYWtXb3JkIGlzIG5vdCB0cnVlXG4gICAgY29uc3QgbmV4dCA9IGNlbGwudG9TdHJpbmcoKS5zbGljZSh3b3Jkcy5sZW5ndGggKyAoYnJlYWtXb3JkID8gMCA6IDEpKTtcbiAgICBjb25zdCBmaWxsTGVuZ3RoID0gbWF4TGVuZ3RoIC0gc3RyTGVuZ3RoKHdvcmRzKTtcblxuICAgIC8vIEFsaWduIGNvbnRlbnRcbiAgICBjb25zdCBhbGlnbjogRGlyZWN0aW9uID0gY2VsbC5nZXRBbGlnbigpO1xuICAgIGxldCBjdXJyZW50OiBzdHJpbmc7XG4gICAgaWYgKGZpbGxMZW5ndGggPT09IDApIHtcbiAgICAgIGN1cnJlbnQgPSB3b3JkcztcbiAgICB9IGVsc2UgaWYgKGFsaWduID09PSBcImxlZnRcIikge1xuICAgICAgY3VycmVudCA9IHdvcmRzICsgXCIgXCIucmVwZWF0KGZpbGxMZW5ndGgpO1xuICAgIH0gZWxzZSBpZiAoYWxpZ24gPT09IFwiY2VudGVyXCIpIHtcbiAgICAgIGN1cnJlbnQgPSBcIiBcIi5yZXBlYXQoTWF0aC5mbG9vcihmaWxsTGVuZ3RoIC8gMikpICsgd29yZHMgK1xuICAgICAgICBcIiBcIi5yZXBlYXQoTWF0aC5jZWlsKGZpbGxMZW5ndGggLyAyKSk7XG4gICAgfSBlbHNlIGlmIChhbGlnbiA9PT0gXCJyaWdodFwiKSB7XG4gICAgICBjdXJyZW50ID0gXCIgXCIucmVwZWF0KGZpbGxMZW5ndGgpICsgd29yZHM7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIlVua25vd24gZGlyZWN0aW9uOiBcIiArIGFsaWduKTtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgY3VycmVudCxcbiAgICAgIG5leHQ6IGNlbGwuY2xvbmUobmV4dCksXG4gICAgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZW5kZXIgYm9yZGVyIHJvdy5cbiAgICogQHBhcmFtIHByZXZSb3cgUHJldmlvdXMgcm93LlxuICAgKiBAcGFyYW0gbmV4dFJvdyBOZXh0IHJvdy5cbiAgICogQHBhcmFtIHJvd1NwYW4gQ3VycmVudCByb3cgc3Bhbi5cbiAgICogQHBhcmFtIG9wdHMgICAgUmVuZGVyIG9wdGlvbnMuXG4gICAqL1xuICBwcm90ZWN0ZWQgcmVuZGVyQm9yZGVyUm93KFxuICAgIHByZXZSb3c6IFJvdzxDZWxsPiB8IHVuZGVmaW5lZCxcbiAgICBuZXh0Um93OiBSb3c8Q2VsbD4gfCB1bmRlZmluZWQsXG4gICAgcm93U3BhbjogbnVtYmVyW10sXG4gICAgb3B0czogSVJlbmRlclNldHRpbmdzLFxuICApOiBzdHJpbmcge1xuICAgIGxldCByZXN1bHQgPSBcIlwiO1xuXG4gICAgbGV0IGNvbFNwYW4gPSAxO1xuICAgIGZvciAobGV0IGNvbEluZGV4ID0gMDsgY29sSW5kZXggPCBvcHRzLmNvbHVtbnM7IGNvbEluZGV4KyspIHtcbiAgICAgIGlmIChyb3dTcGFuW2NvbEluZGV4XSA+IDEpIHtcbiAgICAgICAgaWYgKCFuZXh0Um93KSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiaW52YWxpZCBsYXlvdXRcIik7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGNvbFNwYW4gPiAxKSB7XG4gICAgICAgICAgY29sU3Bhbi0tO1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXN1bHQgKz0gdGhpcy5yZW5kZXJCb3JkZXJDZWxsKFxuICAgICAgICBjb2xJbmRleCxcbiAgICAgICAgcHJldlJvdyxcbiAgICAgICAgbmV4dFJvdyxcbiAgICAgICAgcm93U3BhbixcbiAgICAgICAgb3B0cyxcbiAgICAgICk7XG4gICAgICBjb2xTcGFuID0gbmV4dFJvdz8uW2NvbEluZGV4XS5nZXRDb2xTcGFuKCkgPz8gMTtcbiAgICB9XG5cbiAgICByZXR1cm4gcmVzdWx0Lmxlbmd0aCA/IFwiIFwiLnJlcGVhdCh0aGlzLm9wdGlvbnMuaW5kZW50KSArIHJlc3VsdCArIFwiXFxuXCIgOiBcIlwiO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlbmRlciBib3JkZXIgY2VsbC5cbiAgICogQHBhcmFtIGNvbEluZGV4ICBDdXJyZW50IGluZGV4LlxuICAgKiBAcGFyYW0gcHJldlJvdyAgIFByZXZpb3VzIHJvdy5cbiAgICogQHBhcmFtIG5leHRSb3cgICBOZXh0IHJvdy5cbiAgICogQHBhcmFtIHJvd1NwYW4gICBDdXJyZW50IHJvdyBzcGFuLlxuICAgKiBAcGFyYW0gb3B0cyAgICAgIFJlbmRlciBvcHRpb25zLlxuICAgKi9cbiAgcHJvdGVjdGVkIHJlbmRlckJvcmRlckNlbGwoXG4gICAgY29sSW5kZXg6IG51bWJlcixcbiAgICBwcmV2Um93OiBSb3c8Q2VsbD4gfCB1bmRlZmluZWQsXG4gICAgbmV4dFJvdzogUm93PENlbGw+IHwgdW5kZWZpbmVkLFxuICAgIHJvd1NwYW46IG51bWJlcltdLFxuICAgIG9wdHM6IElSZW5kZXJTZXR0aW5ncyxcbiAgKTogc3RyaW5nIHtcbiAgICAvLyBhMSB8IGIxXG4gICAgLy8gLS0tLS0tLVxuICAgIC8vIGEyIHwgYjJcblxuICAgIGNvbnN0IGExOiBDZWxsIHwgdW5kZWZpbmVkID0gcHJldlJvdz8uW2NvbEluZGV4IC0gMV07XG4gICAgY29uc3QgYTI6IENlbGwgfCB1bmRlZmluZWQgPSBuZXh0Um93Py5bY29sSW5kZXggLSAxXTtcbiAgICBjb25zdCBiMTogQ2VsbCB8IHVuZGVmaW5lZCA9IHByZXZSb3c/Lltjb2xJbmRleF07XG4gICAgY29uc3QgYjI6IENlbGwgfCB1bmRlZmluZWQgPSBuZXh0Um93Py5bY29sSW5kZXhdO1xuXG4gICAgY29uc3QgYTFCb3JkZXIgPSAhIWExPy5nZXRCb3JkZXIoKTtcbiAgICBjb25zdCBhMkJvcmRlciA9ICEhYTI/LmdldEJvcmRlcigpO1xuICAgIGNvbnN0IGIxQm9yZGVyID0gISFiMT8uZ2V0Qm9yZGVyKCk7XG4gICAgY29uc3QgYjJCb3JkZXIgPSAhIWIyPy5nZXRCb3JkZXIoKTtcblxuICAgIGNvbnN0IGhhc0NvbFNwYW4gPSAoY2VsbDogQ2VsbCB8IHVuZGVmaW5lZCk6IGJvb2xlYW4gPT5cbiAgICAgIChjZWxsPy5nZXRDb2xTcGFuKCkgPz8gMSkgPiAxO1xuICAgIGNvbnN0IGhhc1Jvd1NwYW4gPSAoY2VsbDogQ2VsbCB8IHVuZGVmaW5lZCk6IGJvb2xlYW4gPT5cbiAgICAgIChjZWxsPy5nZXRSb3dTcGFuKCkgPz8gMSkgPiAxO1xuXG4gICAgbGV0IHJlc3VsdCA9IFwiXCI7XG5cbiAgICBpZiAoY29sSW5kZXggPT09IDApIHtcbiAgICAgIGlmIChyb3dTcGFuW2NvbEluZGV4XSA+IDEpIHtcbiAgICAgICAgaWYgKGIxQm9yZGVyKSB7XG4gICAgICAgICAgcmVzdWx0ICs9IHRoaXMub3B0aW9ucy5jaGFycy5sZWZ0O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJlc3VsdCArPSBcIiBcIjtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChiMUJvcmRlciAmJiBiMkJvcmRlcikge1xuICAgICAgICByZXN1bHQgKz0gdGhpcy5vcHRpb25zLmNoYXJzLmxlZnRNaWQ7XG4gICAgICB9IGVsc2UgaWYgKGIxQm9yZGVyKSB7XG4gICAgICAgIHJlc3VsdCArPSB0aGlzLm9wdGlvbnMuY2hhcnMuYm90dG9tTGVmdDtcbiAgICAgIH0gZWxzZSBpZiAoYjJCb3JkZXIpIHtcbiAgICAgICAgcmVzdWx0ICs9IHRoaXMub3B0aW9ucy5jaGFycy50b3BMZWZ0O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmVzdWx0ICs9IFwiIFwiO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoY29sSW5kZXggPCBvcHRzLmNvbHVtbnMpIHtcbiAgICAgIGlmICgoYTFCb3JkZXIgJiYgYjJCb3JkZXIpIHx8IChiMUJvcmRlciAmJiBhMkJvcmRlcikpIHtcbiAgICAgICAgY29uc3QgYTFDb2xTcGFuOiBib29sZWFuID0gaGFzQ29sU3BhbihhMSk7XG4gICAgICAgIGNvbnN0IGEyQ29sU3BhbjogYm9vbGVhbiA9IGhhc0NvbFNwYW4oYTIpO1xuICAgICAgICBjb25zdCBiMUNvbFNwYW46IGJvb2xlYW4gPSBoYXNDb2xTcGFuKGIxKTtcbiAgICAgICAgY29uc3QgYjJDb2xTcGFuOiBib29sZWFuID0gaGFzQ29sU3BhbihiMik7XG5cbiAgICAgICAgY29uc3QgYTFSb3dTcGFuOiBib29sZWFuID0gaGFzUm93U3BhbihhMSk7XG4gICAgICAgIGNvbnN0IGEyUm93U3BhbjogYm9vbGVhbiA9IGhhc1Jvd1NwYW4oYTIpO1xuICAgICAgICBjb25zdCBiMVJvd1NwYW46IGJvb2xlYW4gPSBoYXNSb3dTcGFuKGIxKTtcbiAgICAgICAgY29uc3QgYjJSb3dTcGFuOiBib29sZWFuID0gaGFzUm93U3BhbihiMik7XG5cbiAgICAgICAgY29uc3QgaGFzQWxsQm9yZGVyID0gYTFCb3JkZXIgJiYgYjJCb3JkZXIgJiYgYjFCb3JkZXIgJiYgYTJCb3JkZXI7XG4gICAgICAgIGNvbnN0IGhhc0FsbFJvd1NwYW4gPSBhMVJvd1NwYW4gJiYgYjFSb3dTcGFuICYmIGEyUm93U3BhbiAmJiBiMlJvd1NwYW47XG4gICAgICAgIGNvbnN0IGhhc0FsbENvbFNwYW4gPSBhMUNvbFNwYW4gJiYgYjFDb2xTcGFuICYmIGEyQ29sU3BhbiAmJiBiMkNvbFNwYW47XG5cbiAgICAgICAgaWYgKGhhc0FsbFJvd1NwYW4gJiYgaGFzQWxsQm9yZGVyKSB7XG4gICAgICAgICAgcmVzdWx0ICs9IHRoaXMub3B0aW9ucy5jaGFycy5taWRkbGU7XG4gICAgICAgIH0gZWxzZSBpZiAoaGFzQWxsQ29sU3BhbiAmJiBoYXNBbGxCb3JkZXIgJiYgYTEgPT09IGIxICYmIGEyID09PSBiMikge1xuICAgICAgICAgIHJlc3VsdCArPSB0aGlzLm9wdGlvbnMuY2hhcnMubWlkO1xuICAgICAgICB9IGVsc2UgaWYgKGExQ29sU3BhbiAmJiBiMUNvbFNwYW4gJiYgYTEgPT09IGIxKSB7XG4gICAgICAgICAgcmVzdWx0ICs9IHRoaXMub3B0aW9ucy5jaGFycy50b3BNaWQ7XG4gICAgICAgIH0gZWxzZSBpZiAoYTJDb2xTcGFuICYmIGIyQ29sU3BhbiAmJiBhMiA9PT0gYjIpIHtcbiAgICAgICAgICByZXN1bHQgKz0gdGhpcy5vcHRpb25zLmNoYXJzLmJvdHRvbU1pZDtcbiAgICAgICAgfSBlbHNlIGlmIChhMVJvd1NwYW4gJiYgYTJSb3dTcGFuICYmIGExID09PSBhMikge1xuICAgICAgICAgIHJlc3VsdCArPSB0aGlzLm9wdGlvbnMuY2hhcnMubGVmdE1pZDtcbiAgICAgICAgfSBlbHNlIGlmIChiMVJvd1NwYW4gJiYgYjJSb3dTcGFuICYmIGIxID09PSBiMikge1xuICAgICAgICAgIHJlc3VsdCArPSB0aGlzLm9wdGlvbnMuY2hhcnMucmlnaHRNaWQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmVzdWx0ICs9IHRoaXMub3B0aW9ucy5jaGFycy5taWRNaWQ7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoYTFCb3JkZXIgJiYgYjFCb3JkZXIpIHtcbiAgICAgICAgaWYgKGhhc0NvbFNwYW4oYTEpICYmIGhhc0NvbFNwYW4oYjEpICYmIGExID09PSBiMSkge1xuICAgICAgICAgIHJlc3VsdCArPSB0aGlzLm9wdGlvbnMuY2hhcnMuYm90dG9tO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJlc3VsdCArPSB0aGlzLm9wdGlvbnMuY2hhcnMuYm90dG9tTWlkO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKGIxQm9yZGVyICYmIGIyQm9yZGVyKSB7XG4gICAgICAgIGlmIChyb3dTcGFuW2NvbEluZGV4XSA+IDEpIHtcbiAgICAgICAgICByZXN1bHQgKz0gdGhpcy5vcHRpb25zLmNoYXJzLmxlZnQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmVzdWx0ICs9IHRoaXMub3B0aW9ucy5jaGFycy5sZWZ0TWlkO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKGIyQm9yZGVyICYmIGEyQm9yZGVyKSB7XG4gICAgICAgIGlmIChoYXNDb2xTcGFuKGEyKSAmJiBoYXNDb2xTcGFuKGIyKSAmJiBhMiA9PT0gYjIpIHtcbiAgICAgICAgICByZXN1bHQgKz0gdGhpcy5vcHRpb25zLmNoYXJzLnRvcDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXN1bHQgKz0gdGhpcy5vcHRpb25zLmNoYXJzLnRvcE1pZDtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChhMUJvcmRlciAmJiBhMkJvcmRlcikge1xuICAgICAgICBpZiAoaGFzUm93U3BhbihhMSkgJiYgYTEgPT09IGEyKSB7XG4gICAgICAgICAgcmVzdWx0ICs9IHRoaXMub3B0aW9ucy5jaGFycy5yaWdodDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXN1bHQgKz0gdGhpcy5vcHRpb25zLmNoYXJzLnJpZ2h0TWlkO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKGExQm9yZGVyKSB7XG4gICAgICAgIHJlc3VsdCArPSB0aGlzLm9wdGlvbnMuY2hhcnMuYm90dG9tUmlnaHQ7XG4gICAgICB9IGVsc2UgaWYgKGIxQm9yZGVyKSB7XG4gICAgICAgIHJlc3VsdCArPSB0aGlzLm9wdGlvbnMuY2hhcnMuYm90dG9tTGVmdDtcbiAgICAgIH0gZWxzZSBpZiAoYTJCb3JkZXIpIHtcbiAgICAgICAgcmVzdWx0ICs9IHRoaXMub3B0aW9ucy5jaGFycy50b3BSaWdodDtcbiAgICAgIH0gZWxzZSBpZiAoYjJCb3JkZXIpIHtcbiAgICAgICAgcmVzdWx0ICs9IHRoaXMub3B0aW9ucy5jaGFycy50b3BMZWZ0O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmVzdWx0ICs9IFwiIFwiO1xuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IGxlbmd0aCA9IG9wdHMucGFkZGluZ1tjb2xJbmRleF0gKyBvcHRzLndpZHRoW2NvbEluZGV4XSArXG4gICAgICBvcHRzLnBhZGRpbmdbY29sSW5kZXhdO1xuXG4gICAgaWYgKHJvd1NwYW5bY29sSW5kZXhdID4gMSAmJiBuZXh0Um93KSB7XG4gICAgICByZXN1bHQgKz0gdGhpcy5yZW5kZXJDZWxsKFxuICAgICAgICBjb2xJbmRleCxcbiAgICAgICAgbmV4dFJvdyxcbiAgICAgICAgb3B0cyxcbiAgICAgICAgdHJ1ZSxcbiAgICAgICk7XG4gICAgICBpZiAobmV4dFJvd1tjb2xJbmRleF0gPT09IG5leHRSb3dbbmV4dFJvdy5sZW5ndGggLSAxXSkge1xuICAgICAgICBpZiAoYjFCb3JkZXIpIHtcbiAgICAgICAgICByZXN1bHQgKz0gdGhpcy5vcHRpb25zLmNoYXJzLnJpZ2h0O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJlc3VsdCArPSBcIiBcIjtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoYjFCb3JkZXIgJiYgYjJCb3JkZXIpIHtcbiAgICAgIHJlc3VsdCArPSB0aGlzLm9wdGlvbnMuY2hhcnMubWlkLnJlcGVhdChsZW5ndGgpO1xuICAgIH0gZWxzZSBpZiAoYjFCb3JkZXIpIHtcbiAgICAgIHJlc3VsdCArPSB0aGlzLm9wdGlvbnMuY2hhcnMuYm90dG9tLnJlcGVhdChsZW5ndGgpO1xuICAgIH0gZWxzZSBpZiAoYjJCb3JkZXIpIHtcbiAgICAgIHJlc3VsdCArPSB0aGlzLm9wdGlvbnMuY2hhcnMudG9wLnJlcGVhdChsZW5ndGgpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXN1bHQgKz0gXCIgXCIucmVwZWF0KGxlbmd0aCk7XG4gICAgfVxuXG4gICAgaWYgKGNvbEluZGV4ID09PSBvcHRzLmNvbHVtbnMgLSAxKSB7XG4gICAgICBpZiAoYjFCb3JkZXIgJiYgYjJCb3JkZXIpIHtcbiAgICAgICAgcmVzdWx0ICs9IHRoaXMub3B0aW9ucy5jaGFycy5yaWdodE1pZDtcbiAgICAgIH0gZWxzZSBpZiAoYjFCb3JkZXIpIHtcbiAgICAgICAgcmVzdWx0ICs9IHRoaXMub3B0aW9ucy5jaGFycy5ib3R0b21SaWdodDtcbiAgICAgIH0gZWxzZSBpZiAoYjJCb3JkZXIpIHtcbiAgICAgICAgcmVzdWx0ICs9IHRoaXMub3B0aW9ucy5jaGFycy50b3BSaWdodDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJlc3VsdCArPSBcIiBcIjtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsU0FBUyxJQUFJLFFBQTBCLFlBQVk7QUFDbkQsU0FBZSxHQUFHLFFBQVEsV0FBVztBQUVyQyxTQUFTLFlBQVksRUFBRSxPQUFPLEVBQUUsU0FBUyxRQUFRLGFBQWE7QUFhOUQsMkJBQTJCLEdBQzNCLE9BQU8sTUFBTTs7O0VBQ1g7Ozs7R0FJQyxHQUNELFlBQ0UsQUFBUSxLQUFZLEVBQ3BCLEFBQVEsT0FBdUIsQ0FDL0I7U0FGUSxRQUFBO1NBQ0EsVUFBQTtFQUNQO0VBRUgsMkJBQTJCLEdBQzNCLEFBQU8sV0FBbUI7SUFDeEIsTUFBTSxPQUF3QixJQUFJLENBQUMsWUFBWTtJQUMvQyxPQUFPLEtBQUssSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLFFBQVE7RUFDcEQ7RUFFQTs7OztHQUlDLEdBQ0QsQUFBVSxlQUFnQztJQUN4QyxPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxPQUFPLENBQUMsQ0FBQztNQUN2QyxJQUFJLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsSUFBNEIsS0FBSyxVQUFVO1FBQ3ZFLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLElBQTRCLEdBQUc7TUFDcEQ7SUFDRjtJQUVBLE1BQU0sZ0JBQXlCLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxNQUNqRCxJQUFJLENBQUMsS0FBSyxDQUFDLGFBQWE7SUFDMUIsTUFBTSxrQkFBMkIsSUFBSSxDQUFDLEtBQUssQ0FBQyxlQUFlO0lBQzNELE1BQU0sWUFBcUIsbUJBQW1CO0lBRTlDLE1BQU0sT0FBTyxJQUFJLENBQUMsQ0FBQyxPQUFPO0lBRTFCLE1BQU0sVUFBa0IsS0FBSyxHQUFHLElBQUksS0FBSyxHQUFHLENBQUMsQ0FBQyxNQUFRLElBQUksTUFBTTtJQUNoRSxLQUFLLE1BQU0sT0FBTyxLQUFNO01BQ3RCLE1BQU0sU0FBaUIsSUFBSSxNQUFNO01BQ2pDLElBQUksU0FBUyxTQUFTO1FBQ3BCLE1BQU0sT0FBTyxVQUFVO1FBQ3ZCLElBQUssSUFBSSxJQUFJLEdBQUcsSUFBSSxNQUFNLElBQUs7VUFDN0IsSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxNQUFNO1FBQ2pDO01BQ0Y7SUFDRjtJQUVBLE1BQU0sVUFBb0IsRUFBRTtJQUM1QixNQUFNLFFBQWtCLEVBQUU7SUFDMUIsSUFBSyxJQUFJLFdBQVcsR0FBRyxXQUFXLFNBQVMsV0FBWTtNQUNyRCxNQUFNLGNBQXNCLE1BQU0sT0FBTyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsV0FBVyxJQUM5RCxJQUFJLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxTQUFTLEdBQ2xDLElBQUksQ0FBQyxPQUFPLENBQUMsV0FBVztNQUM1QixNQUFNLGNBQXNCLE1BQU0sT0FBTyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsV0FBVyxJQUM5RCxJQUFJLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxTQUFTLEdBQ2xDLElBQUksQ0FBQyxPQUFPLENBQUMsV0FBVztNQUM1QixNQUFNLFdBQW1CLFFBQVEsVUFBVSxNQUFNO01BQ2pELEtBQUssQ0FBQyxTQUFTLEdBQUcsS0FBSyxHQUFHLENBQUMsYUFBYSxLQUFLLEdBQUcsQ0FBQyxhQUFhO01BQzlELE9BQU8sQ0FBQyxTQUFTLEdBQUcsTUFBTSxPQUFPLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLElBQ2xELElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLFNBQVMsR0FDOUIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPO0lBQzFCO0lBRUEsT0FBTztNQUNMO01BQ0E7TUFDQTtNQUNBO01BQ0E7TUFDQTtNQUNBO0lBQ0Y7RUFDRjtFQUVBLENBQUMsT0FBTztJQUNOLE1BQU0sU0FBMEIsSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTO0lBQ3BELE1BQU0sT0FBTyxTQUFTO01BQUM7U0FBVyxJQUFJLENBQUMsS0FBSztLQUFDLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLO0lBQ2hFLE1BQU0sVUFBVSxLQUFLLElBQUksQ0FBQyxDQUFDLE1BQ3pCLElBQUksSUFBSSxDQUFDLENBQUMsT0FDUixnQkFBZ0IsUUFBUSxDQUFDLEtBQUssVUFBVSxLQUFLLEtBQUssS0FBSyxVQUFVLEtBQUssQ0FBQztJQUkzRSxJQUFJLFNBQVM7TUFDWCxPQUFPLElBQUksQ0FBQyxRQUFRLENBQUM7SUFDdkI7SUFFQSxPQUFPLEtBQUssR0FBRyxDQUFDLENBQUM7TUFDZixNQUFNLFNBQVMsSUFBSSxDQUFDLFNBQVMsQ0FBQztNQUM5QixJQUFLLElBQUksSUFBSSxHQUFHLElBQUksSUFBSSxNQUFNLEVBQUUsSUFBSztRQUNuQyxNQUFNLENBQUMsRUFBRSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLEVBQUUsRUFBRTtNQUN0QztNQUNBLE9BQU87SUFDVDtFQUNGO0VBRUE7OztHQUdDLEdBQ0QsQUFBVSxTQUFTLElBQWlCLEVBQUU7SUFDcEMsTUFBTSxVQUF5QixFQUFFO0lBQ2pDLElBQUksVUFBVTtJQUNkLElBQUksV0FBVyxDQUFDO0lBRWhCLE1BQU8sS0FBTTtNQUNYO01BQ0EsSUFBSSxhQUFhLEtBQUssTUFBTSxJQUFJLFFBQVEsS0FBSyxDQUFDLENBQUMsT0FBUyxTQUFTLElBQUk7UUFDbkU7TUFDRjtNQUNBLE1BQU0sTUFBTSxJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLFNBQVMsSUFBSSxFQUFFO01BQ2hFLElBQUksV0FBVyxDQUFDO01BRWhCLE1BQU8sS0FBTTtRQUNYO1FBQ0EsSUFDRSxhQUFhLElBQUksTUFBTSxJQUN2QixhQUFhLFFBQVEsTUFBTSxJQUFJLFlBQVksR0FDM0M7VUFDQTtRQUNGO1FBRUEsSUFBSSxVQUFVLEdBQUc7VUFDZjtVQUNBLE9BQU8sQ0FBQyxTQUFTLEdBQUcsT0FBTyxDQUFDLFdBQVcsRUFBRTtVQUN6QyxJQUFJLE1BQU0sQ0FDUixVQUNBLElBQUksQ0FBQyxjQUFjLENBQUMsTUFBTSxVQUFVLFdBQ3BDLEdBQUcsQ0FBQyxXQUFXLEVBQUU7VUFHbkI7UUFDRjtRQUVBLElBQUksT0FBTyxDQUFDLFNBQVMsR0FBRyxHQUFHO1VBQ3pCLE9BQU8sQ0FBQyxTQUFTO1VBQ2pCLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUNuQixVQUNBLElBQUksQ0FBQyxjQUFjLENBQUMsTUFBTSxVQUFVLFdBQ3BDLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQyxTQUFTO1VBRzlCO1FBQ0Y7UUFFQSxNQUFNLE9BQU8sR0FBRyxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUMxQyxHQUFHLENBQUMsU0FBUyxJQUFJLE1BQ2pCO1FBR0YsVUFBVSxLQUFLLFVBQVU7UUFDekIsT0FBTyxDQUFDLFNBQVMsR0FBRyxLQUFLLFVBQVU7TUFDckM7SUFDRjtJQUVBLE9BQU87RUFDVDtFQUVVLGVBQ1IsSUFBMkIsRUFDM0IsUUFBZ0IsRUFDaEIsUUFBZ0IsRUFDaEI7SUFDQSxPQUFPLFlBQVksSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLEdBQUcsS0FDdkMsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDLFNBQVMsS0FBSyxjQUNwQyxJQUNBO0VBQ047RUFFQTs7O0dBR0MsR0FDRCxBQUFVLFVBQVUsR0FBUyxFQUFhO0lBQ3hDLE9BQU8sSUFBSSxJQUFJLENBQUMsS0FDYixNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLElBQUksT0FDL0IsS0FBSyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxJQUFJO0VBQ2xDO0VBRUE7Ozs7R0FJQyxHQUNELEFBQVUsV0FBVyxJQUE4QixFQUFFLEdBQVEsRUFBUTtJQUNuRSxPQUFPLEtBQUssSUFBSSxDQUFDLFFBQVEsSUFDdEIsTUFBTSxDQUFDLElBQUksU0FBUyxJQUFJLE9BQ3hCLEtBQUssQ0FBQyxJQUFJLFFBQVEsSUFBSTtFQUMzQjtFQUVBOzs7R0FHQyxHQUNELEFBQVUsV0FBVyxJQUFxQixFQUFVO0lBQ2xELElBQUksU0FBUztJQUNiLE1BQU0sVUFBb0IsSUFBSSxNQUFNLEtBQUssT0FBTyxFQUFFLElBQUksQ0FBQztJQUV2RCxJQUFLLElBQUksV0FBVyxHQUFHLFdBQVcsS0FBSyxJQUFJLENBQUMsTUFBTSxFQUFFLFdBQVk7TUFDOUQsVUFBVSxJQUFJLENBQUMsU0FBUyxDQUFDLFNBQVMsVUFBVTtJQUM5QztJQUVBLE9BQU8sT0FBTyxLQUFLLENBQUMsR0FBRyxDQUFDO0VBQzFCO0VBRUE7Ozs7OztHQU1DLEdBQ0QsQUFBVSxVQUNSLE9BQWlCLEVBQ2pCLFFBQWdCLEVBQ2hCLElBQXFCLEVBQ3JCLFdBQXFCLEVBQ2I7SUFDUixNQUFNLE1BQWlCLEtBQUssSUFBSSxDQUFDLFNBQVM7SUFDMUMsTUFBTSxVQUFpQyxLQUFLLElBQUksQ0FBQyxXQUFXLEVBQUU7SUFDOUQsTUFBTSxVQUFpQyxLQUFLLElBQUksQ0FBQyxXQUFXLEVBQUU7SUFDOUQsSUFBSSxTQUFTO0lBRWIsSUFBSSxVQUFVO0lBRWQsaUJBQWlCO0lBQ2pCLElBQUksQ0FBQyxlQUFlLGFBQWEsS0FBSyxJQUFJLFNBQVMsSUFBSTtNQUNyRCxVQUFVLElBQUksQ0FBQyxlQUFlLENBQUMsV0FBVyxLQUFLLFNBQVM7SUFDMUQ7SUFFQSxJQUFJLGlCQUFpQjtJQUVyQixVQUFVLElBQUksTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxJQUFJO0lBRTVDLElBQUssSUFBSSxXQUFXLEdBQUcsV0FBVyxLQUFLLE9BQU8sRUFBRSxXQUFZO01BQzFELElBQUksVUFBVSxHQUFHO1FBQ2Y7UUFDQSxPQUFPLENBQUMsU0FBUyxHQUFHLE9BQU8sQ0FBQyxXQUFXLEVBQUU7UUFDekM7TUFDRjtNQUVBLFVBQVUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxVQUFVLEtBQUs7TUFFekMsSUFBSSxPQUFPLENBQUMsU0FBUyxHQUFHLEdBQUc7UUFDekIsSUFBSSxDQUFDLGFBQWE7VUFDaEIsT0FBTyxDQUFDLFNBQVM7UUFDbkI7TUFDRixPQUFPLElBQUksQ0FBQyxXQUFXLE9BQU8sQ0FBQyxTQUFTLEtBQUssR0FBRyxDQUFDLFNBQVMsRUFBRTtRQUMxRCxPQUFPLENBQUMsU0FBUyxHQUFHLEdBQUcsQ0FBQyxTQUFTLENBQUMsVUFBVTtNQUM5QztNQUVBLFVBQVUsR0FBRyxDQUFDLFNBQVMsQ0FBQyxVQUFVO01BRWxDLElBQUksT0FBTyxDQUFDLFNBQVMsS0FBSyxLQUFLLEdBQUcsQ0FBQyxTQUFTLENBQUMsTUFBTSxFQUFFO1FBQ25ELGlCQUFpQjtNQUNuQjtJQUNGO0lBRUEsSUFBSSxLQUFLLE9BQU8sR0FBRyxHQUFHO01BQ3BCLElBQUksR0FBRyxDQUFDLEtBQUssT0FBTyxHQUFHLEVBQUUsQ0FBQyxTQUFTLElBQUk7UUFDckMsVUFBVSxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxLQUFLO01BQ3BDLE9BQU8sSUFBSSxLQUFLLFNBQVMsRUFBRTtRQUN6QixVQUFVO01BQ1o7SUFDRjtJQUVBLFVBQVU7SUFFVixJQUFJLGdCQUFnQjtNQUNsQixPQUFPLFNBQVMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxTQUFTLFVBQVUsTUFBTTtJQUMxRDtJQUVBLGlCQUFpQjtJQUNqQixJQUNFLEFBQUMsYUFBYSxLQUFLLEtBQUssZUFBZSxJQUN0QyxXQUFXLEtBQUssSUFBSSxDQUFDLE1BQU0sR0FBRyxLQUFLLEtBQUssYUFBYSxFQUN0RDtNQUNBLFVBQVUsSUFBSSxDQUFDLGVBQWUsQ0FBQyxLQUFLLFNBQVMsU0FBUztJQUN4RDtJQUVBLG9CQUFvQjtJQUNwQixJQUFJLGFBQWEsS0FBSyxJQUFJLENBQUMsTUFBTSxHQUFHLEtBQUssSUFBSSxTQUFTLElBQUk7TUFDeEQsVUFBVSxJQUFJLENBQUMsZUFBZSxDQUFDLEtBQUssV0FBVyxTQUFTO0lBQzFEO0lBRUEsT0FBTztFQUNUO0VBRUE7Ozs7OztHQU1DLEdBQ0QsQUFBVSxXQUNSLFFBQWdCLEVBQ2hCLEdBQWMsRUFDZCxJQUFxQixFQUNyQixRQUFrQixFQUNWO0lBQ1IsSUFBSSxTQUFTO0lBQ2IsTUFBTSxXQUE2QixHQUFHLENBQUMsV0FBVyxFQUFFO0lBRXBELE1BQU0sT0FBYSxHQUFHLENBQUMsU0FBUztJQUVoQyxJQUFJLENBQUMsVUFBVTtNQUNiLElBQUksYUFBYSxHQUFHO1FBQ2xCLElBQUksS0FBSyxTQUFTLElBQUk7VUFDcEIsVUFBVSxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxJQUFJO1FBQ25DLE9BQU8sSUFBSSxLQUFLLFNBQVMsRUFBRTtVQUN6QixVQUFVO1FBQ1o7TUFDRixPQUFPO1FBQ0wsSUFBSSxLQUFLLFNBQVMsTUFBTSxVQUFVLGFBQWE7VUFDN0MsVUFBVSxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxNQUFNO1FBQ3JDLE9BQU8sSUFBSSxLQUFLLFNBQVMsRUFBRTtVQUN6QixVQUFVO1FBQ1o7TUFDRjtJQUNGO0lBRUEsSUFBSSxZQUFvQixLQUFLLEtBQUssQ0FBQyxTQUFTO0lBRTVDLE1BQU0sVUFBa0IsS0FBSyxVQUFVO0lBQ3ZDLElBQUksVUFBVSxHQUFHO01BQ2YsSUFBSyxJQUFJLElBQUksR0FBRyxJQUFJLFNBQVMsSUFBSztRQUNoQyxvQ0FBb0M7UUFDcEMsYUFBYSxLQUFLLEtBQUssQ0FBQyxXQUFXLEVBQUUsR0FBRyxLQUFLLE9BQU8sQ0FBQyxXQUFXLEVBQUU7UUFDbEUsSUFBSSxLQUFLLFNBQVMsRUFBRTtVQUNsQixvQ0FBb0M7VUFDcEMsYUFBYSxLQUFLLE9BQU8sQ0FBQyxXQUFXLEVBQUUsR0FBRztRQUM1QztNQUNGO0lBQ0Y7SUFFQSxNQUFNLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxHQUFHLElBQUksQ0FBQyxlQUFlLENBQUMsTUFBTTtJQUVyRCxHQUFHLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQztJQUV2QixJQUFJLEtBQUssU0FBUyxFQUFFO01BQ2xCLFVBQVUsSUFBSSxNQUFNLENBQUMsS0FBSyxPQUFPLENBQUMsU0FBUztJQUM3QztJQUVBLFVBQVU7SUFFVixJQUFJLEtBQUssU0FBUyxJQUFJLFdBQVcsS0FBSyxPQUFPLEdBQUcsR0FBRztNQUNqRCxVQUFVLElBQUksTUFBTSxDQUFDLEtBQUssT0FBTyxDQUFDLFNBQVM7SUFDN0M7SUFFQSxPQUFPO0VBQ1Q7RUFFQTs7Ozs7R0FLQyxHQUNELEFBQVUsZ0JBQ1IsSUFBVSxFQUNWLFNBQWlCLEVBQ2dCO0lBQ2pDLE1BQU0sU0FBaUIsS0FBSyxHQUFHLENBQzdCLFdBQ0EsVUFBVSxLQUFLLFFBQVE7SUFFekIsSUFBSSxRQUFnQixhQUFhLFFBQVEsS0FBSyxRQUFRO0lBRXRELCtDQUErQztJQUMvQyxNQUFNLFlBQVksVUFBVSxTQUFTO0lBQ3JDLElBQUksV0FBVztNQUNiLFFBQVEsTUFBTSxLQUFLLENBQUMsR0FBRztJQUN6QjtJQUVBLHFFQUFxRTtJQUNyRSxNQUFNLE9BQU8sS0FBSyxRQUFRLEdBQUcsS0FBSyxDQUFDLE1BQU0sTUFBTSxHQUFHLENBQUMsWUFBWSxJQUFJLENBQUM7SUFDcEUsTUFBTSxhQUFhLFlBQVksVUFBVTtJQUV6QyxnQkFBZ0I7SUFDaEIsTUFBTSxRQUFtQixLQUFLLFFBQVE7SUFDdEMsSUFBSTtJQUNKLElBQUksZUFBZSxHQUFHO01BQ3BCLFVBQVU7SUFDWixPQUFPLElBQUksVUFBVSxRQUFRO01BQzNCLFVBQVUsUUFBUSxJQUFJLE1BQU0sQ0FBQztJQUMvQixPQUFPLElBQUksVUFBVSxVQUFVO01BQzdCLFVBQVUsSUFBSSxNQUFNLENBQUMsS0FBSyxLQUFLLENBQUMsYUFBYSxNQUFNLFFBQ2pELElBQUksTUFBTSxDQUFDLEtBQUssSUFBSSxDQUFDLGFBQWE7SUFDdEMsT0FBTyxJQUFJLFVBQVUsU0FBUztNQUM1QixVQUFVLElBQUksTUFBTSxDQUFDLGNBQWM7SUFDckMsT0FBTztNQUNMLE1BQU0sSUFBSSxNQUFNLHdCQUF3QjtJQUMxQztJQUVBLE9BQU87TUFDTDtNQUNBLE1BQU0sS0FBSyxLQUFLLENBQUM7SUFDbkI7RUFDRjtFQUVBOzs7Ozs7R0FNQyxHQUNELEFBQVUsZ0JBQ1IsT0FBOEIsRUFDOUIsT0FBOEIsRUFDOUIsT0FBaUIsRUFDakIsSUFBcUIsRUFDYjtJQUNSLElBQUksU0FBUztJQUViLElBQUksVUFBVTtJQUNkLElBQUssSUFBSSxXQUFXLEdBQUcsV0FBVyxLQUFLLE9BQU8sRUFBRSxXQUFZO01BQzFELElBQUksT0FBTyxDQUFDLFNBQVMsR0FBRyxHQUFHO1FBQ3pCLElBQUksQ0FBQyxTQUFTO1VBQ1osTUFBTSxJQUFJLE1BQU07UUFDbEI7UUFDQSxJQUFJLFVBQVUsR0FBRztVQUNmO1VBQ0E7UUFDRjtNQUNGO01BQ0EsVUFBVSxJQUFJLENBQUMsZ0JBQWdCLENBQzdCLFVBQ0EsU0FDQSxTQUNBLFNBQ0E7TUFFRixVQUFVLFNBQVMsQ0FBQyxTQUFTLENBQUMsZ0JBQWdCO0lBQ2hEO0lBRUEsT0FBTyxPQUFPLE1BQU0sR0FBRyxJQUFJLE1BQU0sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sSUFBSSxTQUFTLE9BQU87RUFDM0U7RUFFQTs7Ozs7OztHQU9DLEdBQ0QsQUFBVSxpQkFDUixRQUFnQixFQUNoQixPQUE4QixFQUM5QixPQUE4QixFQUM5QixPQUFpQixFQUNqQixJQUFxQixFQUNiO0lBQ1IsVUFBVTtJQUNWLFVBQVU7SUFDVixVQUFVO0lBRVYsTUFBTSxLQUF1QixTQUFTLENBQUMsV0FBVyxFQUFFO0lBQ3BELE1BQU0sS0FBdUIsU0FBUyxDQUFDLFdBQVcsRUFBRTtJQUNwRCxNQUFNLEtBQXVCLFNBQVMsQ0FBQyxTQUFTO0lBQ2hELE1BQU0sS0FBdUIsU0FBUyxDQUFDLFNBQVM7SUFFaEQsTUFBTSxXQUFXLENBQUMsQ0FBQyxJQUFJO0lBQ3ZCLE1BQU0sV0FBVyxDQUFDLENBQUMsSUFBSTtJQUN2QixNQUFNLFdBQVcsQ0FBQyxDQUFDLElBQUk7SUFDdkIsTUFBTSxXQUFXLENBQUMsQ0FBQyxJQUFJO0lBRXZCLE1BQU0sYUFBYSxDQUFDLE9BQ2xCLENBQUMsTUFBTSxnQkFBZ0IsQ0FBQyxJQUFJO0lBQzlCLE1BQU0sYUFBYSxDQUFDLE9BQ2xCLENBQUMsTUFBTSxnQkFBZ0IsQ0FBQyxJQUFJO0lBRTlCLElBQUksU0FBUztJQUViLElBQUksYUFBYSxHQUFHO01BQ2xCLElBQUksT0FBTyxDQUFDLFNBQVMsR0FBRyxHQUFHO1FBQ3pCLElBQUksVUFBVTtVQUNaLFVBQVUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsSUFBSTtRQUNuQyxPQUFPO1VBQ0wsVUFBVTtRQUNaO01BQ0YsT0FBTyxJQUFJLFlBQVksVUFBVTtRQUMvQixVQUFVLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLE9BQU87TUFDdEMsT0FBTyxJQUFJLFVBQVU7UUFDbkIsVUFBVSxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxVQUFVO01BQ3pDLE9BQU8sSUFBSSxVQUFVO1FBQ25CLFVBQVUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsT0FBTztNQUN0QyxPQUFPO1FBQ0wsVUFBVTtNQUNaO0lBQ0YsT0FBTyxJQUFJLFdBQVcsS0FBSyxPQUFPLEVBQUU7TUFDbEMsSUFBSSxBQUFDLFlBQVksWUFBYyxZQUFZLFVBQVc7UUFDcEQsTUFBTSxZQUFxQixXQUFXO1FBQ3RDLE1BQU0sWUFBcUIsV0FBVztRQUN0QyxNQUFNLFlBQXFCLFdBQVc7UUFDdEMsTUFBTSxZQUFxQixXQUFXO1FBRXRDLE1BQU0sWUFBcUIsV0FBVztRQUN0QyxNQUFNLFlBQXFCLFdBQVc7UUFDdEMsTUFBTSxZQUFxQixXQUFXO1FBQ3RDLE1BQU0sWUFBcUIsV0FBVztRQUV0QyxNQUFNLGVBQWUsWUFBWSxZQUFZLFlBQVk7UUFDekQsTUFBTSxnQkFBZ0IsYUFBYSxhQUFhLGFBQWE7UUFDN0QsTUFBTSxnQkFBZ0IsYUFBYSxhQUFhLGFBQWE7UUFFN0QsSUFBSSxpQkFBaUIsY0FBYztVQUNqQyxVQUFVLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLE1BQU07UUFDckMsT0FBTyxJQUFJLGlCQUFpQixnQkFBZ0IsT0FBTyxNQUFNLE9BQU8sSUFBSTtVQUNsRSxVQUFVLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEdBQUc7UUFDbEMsT0FBTyxJQUFJLGFBQWEsYUFBYSxPQUFPLElBQUk7VUFDOUMsVUFBVSxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxNQUFNO1FBQ3JDLE9BQU8sSUFBSSxhQUFhLGFBQWEsT0FBTyxJQUFJO1VBQzlDLFVBQVUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsU0FBUztRQUN4QyxPQUFPLElBQUksYUFBYSxhQUFhLE9BQU8sSUFBSTtVQUM5QyxVQUFVLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLE9BQU87UUFDdEMsT0FBTyxJQUFJLGFBQWEsYUFBYSxPQUFPLElBQUk7VUFDOUMsVUFBVSxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxRQUFRO1FBQ3ZDLE9BQU87VUFDTCxVQUFVLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLE1BQU07UUFDckM7TUFDRixPQUFPLElBQUksWUFBWSxVQUFVO1FBQy9CLElBQUksV0FBVyxPQUFPLFdBQVcsT0FBTyxPQUFPLElBQUk7VUFDakQsVUFBVSxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxNQUFNO1FBQ3JDLE9BQU87VUFDTCxVQUFVLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLFNBQVM7UUFDeEM7TUFDRixPQUFPLElBQUksWUFBWSxVQUFVO1FBQy9CLElBQUksT0FBTyxDQUFDLFNBQVMsR0FBRyxHQUFHO1VBQ3pCLFVBQVUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsSUFBSTtRQUNuQyxPQUFPO1VBQ0wsVUFBVSxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxPQUFPO1FBQ3RDO01BQ0YsT0FBTyxJQUFJLFlBQVksVUFBVTtRQUMvQixJQUFJLFdBQVcsT0FBTyxXQUFXLE9BQU8sT0FBTyxJQUFJO1VBQ2pELFVBQVUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsR0FBRztRQUNsQyxPQUFPO1VBQ0wsVUFBVSxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxNQUFNO1FBQ3JDO01BQ0YsT0FBTyxJQUFJLFlBQVksVUFBVTtRQUMvQixJQUFJLFdBQVcsT0FBTyxPQUFPLElBQUk7VUFDL0IsVUFBVSxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxLQUFLO1FBQ3BDLE9BQU87VUFDTCxVQUFVLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLFFBQVE7UUFDdkM7TUFDRixPQUFPLElBQUksVUFBVTtRQUNuQixVQUFVLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLFdBQVc7TUFDMUMsT0FBTyxJQUFJLFVBQVU7UUFDbkIsVUFBVSxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxVQUFVO01BQ3pDLE9BQU8sSUFBSSxVQUFVO1FBQ25CLFVBQVUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsUUFBUTtNQUN2QyxPQUFPLElBQUksVUFBVTtRQUNuQixVQUFVLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLE9BQU87TUFDdEMsT0FBTztRQUNMLFVBQVU7TUFDWjtJQUNGO0lBRUEsTUFBTSxTQUFTLEtBQUssT0FBTyxDQUFDLFNBQVMsR0FBRyxLQUFLLEtBQUssQ0FBQyxTQUFTLEdBQzFELEtBQUssT0FBTyxDQUFDLFNBQVM7SUFFeEIsSUFBSSxPQUFPLENBQUMsU0FBUyxHQUFHLEtBQUssU0FBUztNQUNwQyxVQUFVLElBQUksQ0FBQyxVQUFVLENBQ3ZCLFVBQ0EsU0FDQSxNQUNBO01BRUYsSUFBSSxPQUFPLENBQUMsU0FBUyxLQUFLLE9BQU8sQ0FBQyxRQUFRLE1BQU0sR0FBRyxFQUFFLEVBQUU7UUFDckQsSUFBSSxVQUFVO1VBQ1osVUFBVSxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxLQUFLO1FBQ3BDLE9BQU87VUFDTCxVQUFVO1FBQ1o7UUFDQSxPQUFPO01BQ1Q7SUFDRixPQUFPLElBQUksWUFBWSxVQUFVO01BQy9CLFVBQVUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQztJQUMxQyxPQUFPLElBQUksVUFBVTtNQUNuQixVQUFVLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUM7SUFDN0MsT0FBTyxJQUFJLFVBQVU7TUFDbkIsVUFBVSxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDO0lBQzFDLE9BQU87TUFDTCxVQUFVLElBQUksTUFBTSxDQUFDO0lBQ3ZCO0lBRUEsSUFBSSxhQUFhLEtBQUssT0FBTyxHQUFHLEdBQUc7TUFDakMsSUFBSSxZQUFZLFVBQVU7UUFDeEIsVUFBVSxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxRQUFRO01BQ3ZDLE9BQU8sSUFBSSxVQUFVO1FBQ25CLFVBQVUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsV0FBVztNQUMxQyxPQUFPLElBQUksVUFBVTtRQUNuQixVQUFVLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLFFBQVE7TUFDdkMsT0FBTztRQUNMLFVBQVU7TUFDWjtJQUNGO0lBRUEsT0FBTztFQUNUO0FBQ0YifQ==