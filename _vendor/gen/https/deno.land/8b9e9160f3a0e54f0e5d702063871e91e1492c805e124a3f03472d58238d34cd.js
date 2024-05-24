import { Cell } from "./cell.ts";
/**
 * Row representation.
 */ export class Row extends Array {
  options = {};
  /**
   * Create a new row. If cells is a row, all cells and options of the row will
   * be copied to the new row.
   * @param cells Cells or row.
   */ static from(cells) {
    const row = new this(...cells);
    if (cells instanceof Row) {
      row.options = {
        ...cells.options
      };
    }
    return row;
  }
  /** Clone row recursively with all options. */ clone() {
    const row = new Row(...this.map((cell)=>cell instanceof Cell ? cell.clone() : cell));
    row.options = {
      ...this.options
    };
    return row;
  }
  /**
   * Setter:
   */ /**
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
   * Align row content.
   * @param direction Align direction.
   * @param override  Override existing value.
   */ align(direction, override = true) {
    if (override || typeof this.options.align === "undefined") {
      this.options.align = direction;
    }
    return this;
  }
  /**
   * Getter:
   */ /** Check if row has border. */ getBorder() {
    return this.options.border === true;
  }
  /** Check if row or any child cell has border. */ hasBorder() {
    return this.getBorder() || this.some((cell)=>cell instanceof Cell && cell.getBorder());
  }
  /** Get row alignment. */ getAlign() {
    return this.options.align ?? "left";
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvY2xpZmZ5QHYwLjI1LjcvdGFibGUvcm93LnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENlbGwsIERpcmVjdGlvbiwgSUNlbGwgfSBmcm9tIFwiLi9jZWxsLnRzXCI7XG5cbi8qKiBSb3cgdHlwZSAqL1xuZXhwb3J0IHR5cGUgSVJvdzxUIGV4dGVuZHMgSUNlbGwgfCB1bmRlZmluZWQgPSBJQ2VsbCB8IHVuZGVmaW5lZD4gPVxuICB8IFRbXVxuICB8IFJvdzxUPjtcbi8qKiBKc29uIHJvdy4gKi9cbmV4cG9ydCB0eXBlIElEYXRhUm93ID0gUmVjb3JkPHN0cmluZywgc3RyaW5nIHwgbnVtYmVyPjtcblxuLyoqIFJvdyBvcHRpb25zLiAqL1xuZXhwb3J0IGludGVyZmFjZSBJUm93T3B0aW9ucyB7XG4gIGluZGVudD86IG51bWJlcjtcbiAgYm9yZGVyPzogYm9vbGVhbjtcbiAgYWxpZ24/OiBEaXJlY3Rpb247XG59XG5cbi8qKlxuICogUm93IHJlcHJlc2VudGF0aW9uLlxuICovXG5leHBvcnQgY2xhc3MgUm93PFQgZXh0ZW5kcyBJQ2VsbCB8IHVuZGVmaW5lZCA9IElDZWxsIHwgdW5kZWZpbmVkPlxuICBleHRlbmRzIEFycmF5PFQ+IHtcbiAgcHJvdGVjdGVkIG9wdGlvbnM6IElSb3dPcHRpb25zID0ge307XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBhIG5ldyByb3cuIElmIGNlbGxzIGlzIGEgcm93LCBhbGwgY2VsbHMgYW5kIG9wdGlvbnMgb2YgdGhlIHJvdyB3aWxsXG4gICAqIGJlIGNvcGllZCB0byB0aGUgbmV3IHJvdy5cbiAgICogQHBhcmFtIGNlbGxzIENlbGxzIG9yIHJvdy5cbiAgICovXG4gIHB1YmxpYyBzdGF0aWMgZnJvbTxUIGV4dGVuZHMgSUNlbGwgfCB1bmRlZmluZWQ+KFxuICAgIGNlbGxzOiBJUm93PFQ+LFxuICApOiBSb3c8VD4ge1xuICAgIGNvbnN0IHJvdyA9IG5ldyB0aGlzKC4uLmNlbGxzKTtcbiAgICBpZiAoY2VsbHMgaW5zdGFuY2VvZiBSb3cpIHtcbiAgICAgIHJvdy5vcHRpb25zID0geyAuLi4oY2VsbHMgYXMgUm93KS5vcHRpb25zIH07XG4gICAgfVxuICAgIHJldHVybiByb3c7XG4gIH1cblxuICAvKiogQ2xvbmUgcm93IHJlY3Vyc2l2ZWx5IHdpdGggYWxsIG9wdGlvbnMuICovXG4gIHB1YmxpYyBjbG9uZSgpOiBSb3cge1xuICAgIGNvbnN0IHJvdyA9IG5ldyBSb3coXG4gICAgICAuLi50aGlzLm1hcCgoY2VsbDogVCkgPT4gY2VsbCBpbnN0YW5jZW9mIENlbGwgPyBjZWxsLmNsb25lKCkgOiBjZWxsKSxcbiAgICApO1xuICAgIHJvdy5vcHRpb25zID0geyAuLi50aGlzLm9wdGlvbnMgfTtcbiAgICByZXR1cm4gcm93O1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHRlcjpcbiAgICovXG5cbiAgLyoqXG4gICAqIEVuYWJsZS9kaXNhYmxlIGNlbGwgYm9yZGVyLlxuICAgKiBAcGFyYW0gZW5hYmxlICAgIEVuYWJsZS9kaXNhYmxlIGNlbGwgYm9yZGVyLlxuICAgKiBAcGFyYW0gb3ZlcnJpZGUgIE92ZXJyaWRlIGV4aXN0aW5nIHZhbHVlLlxuICAgKi9cbiAgcHVibGljIGJvcmRlcihlbmFibGU6IGJvb2xlYW4sIG92ZXJyaWRlID0gdHJ1ZSk6IHRoaXMge1xuICAgIGlmIChvdmVycmlkZSB8fCB0eXBlb2YgdGhpcy5vcHRpb25zLmJvcmRlciA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgdGhpcy5vcHRpb25zLmJvcmRlciA9IGVuYWJsZTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogQWxpZ24gcm93IGNvbnRlbnQuXG4gICAqIEBwYXJhbSBkaXJlY3Rpb24gQWxpZ24gZGlyZWN0aW9uLlxuICAgKiBAcGFyYW0gb3ZlcnJpZGUgIE92ZXJyaWRlIGV4aXN0aW5nIHZhbHVlLlxuICAgKi9cbiAgcHVibGljIGFsaWduKGRpcmVjdGlvbjogRGlyZWN0aW9uLCBvdmVycmlkZSA9IHRydWUpOiB0aGlzIHtcbiAgICBpZiAob3ZlcnJpZGUgfHwgdHlwZW9mIHRoaXMub3B0aW9ucy5hbGlnbiA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgdGhpcy5vcHRpb25zLmFsaWduID0gZGlyZWN0aW9uO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXR0ZXI6XG4gICAqL1xuXG4gIC8qKiBDaGVjayBpZiByb3cgaGFzIGJvcmRlci4gKi9cbiAgcHVibGljIGdldEJvcmRlcigpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5vcHRpb25zLmJvcmRlciA9PT0gdHJ1ZTtcbiAgfVxuXG4gIC8qKiBDaGVjayBpZiByb3cgb3IgYW55IGNoaWxkIGNlbGwgaGFzIGJvcmRlci4gKi9cbiAgcHVibGljIGhhc0JvcmRlcigpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5nZXRCb3JkZXIoKSB8fFxuICAgICAgdGhpcy5zb21lKChjZWxsKSA9PiBjZWxsIGluc3RhbmNlb2YgQ2VsbCAmJiBjZWxsLmdldEJvcmRlcigpKTtcbiAgfVxuXG4gIC8qKiBHZXQgcm93IGFsaWdubWVudC4gKi9cbiAgcHVibGljIGdldEFsaWduKCk6IERpcmVjdGlvbiB7XG4gICAgcmV0dXJuIHRoaXMub3B0aW9ucy5hbGlnbiA/PyBcImxlZnRcIjtcbiAgfVxufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFNBQVMsSUFBSSxRQUEwQixZQUFZO0FBZ0JuRDs7Q0FFQyxHQUNELE9BQU8sTUFBTSxZQUNIO0VBQ0UsVUFBdUIsQ0FBQyxFQUFFO0VBRXBDOzs7O0dBSUMsR0FDRCxPQUFjLEtBQ1osS0FBYyxFQUNOO0lBQ1IsTUFBTSxNQUFNLElBQUksSUFBSSxJQUFJO0lBQ3hCLElBQUksaUJBQWlCLEtBQUs7TUFDeEIsSUFBSSxPQUFPLEdBQUc7UUFBRSxHQUFHLEFBQUMsTUFBYyxPQUFPO01BQUM7SUFDNUM7SUFDQSxPQUFPO0VBQ1Q7RUFFQSw0Q0FBNEMsR0FDNUMsQUFBTyxRQUFhO0lBQ2xCLE1BQU0sTUFBTSxJQUFJLE9BQ1gsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLE9BQVksZ0JBQWdCLE9BQU8sS0FBSyxLQUFLLEtBQUs7SUFFakUsSUFBSSxPQUFPLEdBQUc7TUFBRSxHQUFHLElBQUksQ0FBQyxPQUFPO0lBQUM7SUFDaEMsT0FBTztFQUNUO0VBRUE7O0dBRUMsR0FFRDs7OztHQUlDLEdBQ0QsQUFBTyxPQUFPLE1BQWUsRUFBRSxXQUFXLElBQUksRUFBUTtJQUNwRCxJQUFJLFlBQVksT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sS0FBSyxhQUFhO01BQzFELElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxHQUFHO0lBQ3hCO0lBQ0EsT0FBTyxJQUFJO0VBQ2I7RUFFQTs7OztHQUlDLEdBQ0QsQUFBTyxNQUFNLFNBQW9CLEVBQUUsV0FBVyxJQUFJLEVBQVE7SUFDeEQsSUFBSSxZQUFZLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEtBQUssYUFBYTtNQUN6RCxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssR0FBRztJQUN2QjtJQUNBLE9BQU8sSUFBSTtFQUNiO0VBRUE7O0dBRUMsR0FFRCw2QkFBNkIsR0FDN0IsQUFBTyxZQUFxQjtJQUMxQixPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxLQUFLO0VBQ2pDO0VBRUEsK0NBQStDLEdBQy9DLEFBQU8sWUFBcUI7SUFDMUIsT0FBTyxJQUFJLENBQUMsU0FBUyxNQUNuQixJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsT0FBUyxnQkFBZ0IsUUFBUSxLQUFLLFNBQVM7RUFDOUQ7RUFFQSx1QkFBdUIsR0FDdkIsQUFBTyxXQUFzQjtJQUMzQixPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxJQUFJO0VBQy9CO0FBQ0YifQ==