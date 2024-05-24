/** Class to store loaders, engines and other stuff related with different formats */ export default class Formats {
  entries = new Map();
  get size() {
    return this.entries.size;
  }
  /** Assign a value to a extension */ set(format, override = true) {
    const ext = format.ext.toLowerCase();
    const existing = this.entries.get(ext);
    if (existing) {
      if (override) {
        this.entries.set(ext, {
          ...existing,
          ...format
        });
      } else {
        this.entries.set(ext, {
          ...format,
          ...existing
        });
      }
      return;
    }
    // Simple extension (.ts, .js, .json)
    if (ext.match(/^\.\w+$/)) {
      this.entries.set(ext, format);
      return;
    }
    // Chained extension (.tmpl.js) goes first
    if (ext.match(/^\.\w+\.\w+$/)) {
      const entries = Array.from(this.entries.entries());
      entries.unshift([
        ext,
        format
      ]);
      this.entries = new Map(entries);
      return;
    }
    throw new Error(`Invalid file extension: "${ext}".  It must start with '.'`);
  }
  /** Returns a format by extension */ get(extension) {
    return this.entries.get(extension.toLowerCase());
  }
  /** Delete a format */ delete(extension) {
    this.entries.delete(extension.toLowerCase());
  }
  /** Returns if a format exists */ has(extension) {
    return this.entries.has(extension.toLowerCase());
  }
  /** Search and return the associated format for a path */ search(path) {
    path = path.toLowerCase();
    for (const format of this.entries.values()){
      if (path.endsWith(format.ext)) {
        return format;
      }
    }
  }
  /** Delete a cached template */ deleteCache(file) {
    for (const format of this.entries.values()){
      format.engines?.forEach((engine)=>engine.deleteCache(file));
    }
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvbHVtZUB2Mi4yLjAvY29yZS9mb3JtYXRzLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB0eXBlIHsgRW5naW5lIH0gZnJvbSBcIi4vcmVuZGVyZXIudHNcIjtcbmltcG9ydCB0eXBlIHsgTG9hZGVyIH0gZnJvbSBcIi4vbG9hZGVycy9tb2QudHNcIjtcblxuZXhwb3J0IGludGVyZmFjZSBGb3JtYXQge1xuICAvKiogVGhlIGZpbGUgZXh0ZW5zaW9uIGZvciB0aGlzIGZvcm1hdCAqL1xuICBleHQ6IHN0cmluZztcblxuICAvKiogVGhlIHR5cGUgb2YgcGFnZSAqL1xuICBwYWdlVHlwZT86IFwicGFnZVwiIHwgXCJhc3NldFwiO1xuXG4gIC8qKiBUaGUgZmlsZSBsb2FkZXIgdXNlZCBmb3IgdGhpcyBmb3JtYXQgKHVzZWQgYnkgcGFnZXMsIGluY2x1ZGVzLCBjb21wb25lbnRzLCBldGMpICovXG4gIGxvYWRlcj86IExvYWRlcjtcblxuICAvKiogVGhlIGxvYWRlciB1c2VkIGFzIGFzc2V0ICovXG4gIGFzc2V0TG9hZGVyPzogTG9hZGVyO1xuXG4gIC8qKiBMb2FkZXIgZm9yIF9kYXRhIGZpbGVzIGluIHRoaXMgZm9ybWF0ICovXG4gIGRhdGFMb2FkZXI/OiBMb2FkZXI7XG5cbiAgLyoqXG4gICAqIFRoZSB0ZW1wbGF0ZSBlbmdpbmVzIHVzZWQgdG8gcmVuZGVyIHRoaXMgZm9ybWF0XG4gICAqIFVzZWQgdG8gcmVuZGVyIHRoZSBwYWdlIGFuZCBjb21wb25lbnRzXG4gICAqL1xuICBlbmdpbmVzPzogRW5naW5lW107XG5cbiAgLyoqIFdoZXRoZXIgdGhpcyBmaWxlIG11c3QgYmUgY29waWVkIGluc3RlYWQgbG9hZGVkICovXG4gIGNvcHk/OiBib29sZWFuIHwgKChwYXRoOiBzdHJpbmcpID0+IHN0cmluZyk7XG59XG5cbi8qKiBDbGFzcyB0byBzdG9yZSBsb2FkZXJzLCBlbmdpbmVzIGFuZCBvdGhlciBzdHVmZiByZWxhdGVkIHdpdGggZGlmZmVyZW50IGZvcm1hdHMgKi9cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEZvcm1hdHMge1xuICBlbnRyaWVzID0gbmV3IE1hcDxzdHJpbmcsIEZvcm1hdD4oKTtcblxuICBnZXQgc2l6ZSgpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLmVudHJpZXMuc2l6ZTtcbiAgfVxuXG4gIC8qKiBBc3NpZ24gYSB2YWx1ZSB0byBhIGV4dGVuc2lvbiAqL1xuICBzZXQoZm9ybWF0OiBGb3JtYXQsIG92ZXJyaWRlID0gdHJ1ZSk6IHZvaWQge1xuICAgIGNvbnN0IGV4dCA9IGZvcm1hdC5leHQudG9Mb3dlckNhc2UoKTtcbiAgICBjb25zdCBleGlzdGluZyA9IHRoaXMuZW50cmllcy5nZXQoZXh0KTtcblxuICAgIGlmIChleGlzdGluZykge1xuICAgICAgaWYgKG92ZXJyaWRlKSB7XG4gICAgICAgIHRoaXMuZW50cmllcy5zZXQoZXh0LCB7IC4uLmV4aXN0aW5nLCAuLi5mb3JtYXQgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLmVudHJpZXMuc2V0KGV4dCwgeyAuLi5mb3JtYXQsIC4uLmV4aXN0aW5nIH0pO1xuICAgICAgfVxuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIFNpbXBsZSBleHRlbnNpb24gKC50cywgLmpzLCAuanNvbilcbiAgICBpZiAoZXh0Lm1hdGNoKC9eXFwuXFx3KyQvKSkge1xuICAgICAgdGhpcy5lbnRyaWVzLnNldChleHQsIGZvcm1hdCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gQ2hhaW5lZCBleHRlbnNpb24gKC50bXBsLmpzKSBnb2VzIGZpcnN0XG4gICAgaWYgKGV4dC5tYXRjaCgvXlxcLlxcdytcXC5cXHcrJC8pKSB7XG4gICAgICBjb25zdCBlbnRyaWVzID0gQXJyYXkuZnJvbSh0aGlzLmVudHJpZXMuZW50cmllcygpKTtcbiAgICAgIGVudHJpZXMudW5zaGlmdChbZXh0LCBmb3JtYXRdKTtcbiAgICAgIHRoaXMuZW50cmllcyA9IG5ldyBNYXAoZW50cmllcyk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgYEludmFsaWQgZmlsZSBleHRlbnNpb246IFwiJHtleHR9XCIuICBJdCBtdXN0IHN0YXJ0IHdpdGggJy4nYCxcbiAgICApO1xuICB9XG5cbiAgLyoqIFJldHVybnMgYSBmb3JtYXQgYnkgZXh0ZW5zaW9uICovXG4gIGdldChleHRlbnNpb246IHN0cmluZyk6IEZvcm1hdCB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMuZW50cmllcy5nZXQoZXh0ZW5zaW9uLnRvTG93ZXJDYXNlKCkpO1xuICB9XG5cbiAgLyoqIERlbGV0ZSBhIGZvcm1hdCAqL1xuICBkZWxldGUoZXh0ZW5zaW9uOiBzdHJpbmcpOiB2b2lkIHtcbiAgICB0aGlzLmVudHJpZXMuZGVsZXRlKGV4dGVuc2lvbi50b0xvd2VyQ2FzZSgpKTtcbiAgfVxuXG4gIC8qKiBSZXR1cm5zIGlmIGEgZm9ybWF0IGV4aXN0cyAqL1xuICBoYXMoZXh0ZW5zaW9uOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5lbnRyaWVzLmhhcyhleHRlbnNpb24udG9Mb3dlckNhc2UoKSk7XG4gIH1cblxuICAvKiogU2VhcmNoIGFuZCByZXR1cm4gdGhlIGFzc29jaWF0ZWQgZm9ybWF0IGZvciBhIHBhdGggKi9cbiAgc2VhcmNoKHBhdGg6IHN0cmluZyk6IEZvcm1hdCB8IHVuZGVmaW5lZCB7XG4gICAgcGF0aCA9IHBhdGgudG9Mb3dlckNhc2UoKTtcblxuICAgIGZvciAoY29uc3QgZm9ybWF0IG9mIHRoaXMuZW50cmllcy52YWx1ZXMoKSkge1xuICAgICAgaWYgKHBhdGguZW5kc1dpdGgoZm9ybWF0LmV4dCkpIHtcbiAgICAgICAgcmV0dXJuIGZvcm1hdDtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKiogRGVsZXRlIGEgY2FjaGVkIHRlbXBsYXRlICovXG4gIGRlbGV0ZUNhY2hlKGZpbGU6IHN0cmluZyk6IHZvaWQge1xuICAgIGZvciAoY29uc3QgZm9ybWF0IG9mIHRoaXMuZW50cmllcy52YWx1ZXMoKSkge1xuICAgICAgZm9ybWF0LmVuZ2luZXM/LmZvckVhY2goKGVuZ2luZSkgPT4gZW5naW5lLmRlbGV0ZUNhY2hlKGZpbGUpKTtcbiAgICB9XG4gIH1cbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUE2QkEsbUZBQW1GLEdBQ25GLGVBQWUsTUFBTTtFQUNuQixVQUFVLElBQUksTUFBc0I7RUFFcEMsSUFBSSxPQUFlO0lBQ2pCLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJO0VBQzFCO0VBRUEsa0NBQWtDLEdBQ2xDLElBQUksTUFBYyxFQUFFLFdBQVcsSUFBSSxFQUFRO0lBQ3pDLE1BQU0sTUFBTSxPQUFPLEdBQUcsQ0FBQyxXQUFXO0lBQ2xDLE1BQU0sV0FBVyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQztJQUVsQyxJQUFJLFVBQVU7TUFDWixJQUFJLFVBQVU7UUFDWixJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLO1VBQUUsR0FBRyxRQUFRO1VBQUUsR0FBRyxNQUFNO1FBQUM7TUFDakQsT0FBTztRQUNMLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUs7VUFBRSxHQUFHLE1BQU07VUFBRSxHQUFHLFFBQVE7UUFBQztNQUNqRDtNQUNBO0lBQ0Y7SUFFQSxxQ0FBcUM7SUFDckMsSUFBSSxJQUFJLEtBQUssQ0FBQyxZQUFZO01BQ3hCLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUs7TUFDdEI7SUFDRjtJQUVBLDBDQUEwQztJQUMxQyxJQUFJLElBQUksS0FBSyxDQUFDLGlCQUFpQjtNQUM3QixNQUFNLFVBQVUsTUFBTSxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPO01BQy9DLFFBQVEsT0FBTyxDQUFDO1FBQUM7UUFBSztPQUFPO01BQzdCLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxJQUFJO01BQ3ZCO0lBQ0Y7SUFFQSxNQUFNLElBQUksTUFDUixDQUFDLHlCQUF5QixFQUFFLElBQUksMEJBQTBCLENBQUM7RUFFL0Q7RUFFQSxrQ0FBa0MsR0FDbEMsSUFBSSxTQUFpQixFQUFzQjtJQUN6QyxPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLFVBQVUsV0FBVztFQUMvQztFQUVBLG9CQUFvQixHQUNwQixPQUFPLFNBQWlCLEVBQVE7SUFDOUIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsVUFBVSxXQUFXO0VBQzNDO0VBRUEsK0JBQStCLEdBQy9CLElBQUksU0FBaUIsRUFBVztJQUM5QixPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLFVBQVUsV0FBVztFQUMvQztFQUVBLHVEQUF1RCxHQUN2RCxPQUFPLElBQVksRUFBc0I7SUFDdkMsT0FBTyxLQUFLLFdBQVc7SUFFdkIsS0FBSyxNQUFNLFVBQVUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEdBQUk7TUFDMUMsSUFBSSxLQUFLLFFBQVEsQ0FBQyxPQUFPLEdBQUcsR0FBRztRQUM3QixPQUFPO01BQ1Q7SUFDRjtFQUNGO0VBRUEsNkJBQTZCLEdBQzdCLFlBQVksSUFBWSxFQUFRO0lBQzlCLEtBQUssTUFBTSxVQUFVLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxHQUFJO01BQzFDLE9BQU8sT0FBTyxFQUFFLFFBQVEsQ0FBQyxTQUFXLE9BQU8sV0FBVyxDQUFDO0lBQ3pEO0VBQ0Y7QUFDRiJ9