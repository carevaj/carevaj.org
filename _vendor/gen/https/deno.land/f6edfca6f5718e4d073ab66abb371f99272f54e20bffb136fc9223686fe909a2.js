/**
 * Define independent updates scopes
 * This optimize the update process after any change
 */ export default class Scopes {
  scopes = new Set();
  /** Returns a function to filter the pages that must be rebuild */ getFilter(changedFiles) {
    // There's no any scope, so rebuild all pages
    if (this.scopes.size === 0) {
      return ()=>true;
    }
    let noScoped = false;
    const changed = new Set();
    for (const file of changedFiles){
      let found = false;
      for (const scopeFn of this.scopes){
        if (scopeFn(file)) {
          changed.add(scopeFn);
          found = true;
          break;
        }
      }
      if (!found) {
        noScoped = true;
      }
    }
    // Calculate scoped extensions that didn't change
    const notChanged = [];
    for (const scopeFn of this.scopes){
      if (!changed.has(scopeFn)) {
        notChanged.push(scopeFn);
      }
    }
    // Generate the filter function
    return function(entry) {
      // Ignore directories
      if (entry.type === "directory") {
        return true;
      }
      // It matches with any scope that has changed
      for (const scopeFn of changed){
        if (scopeFn(entry.path)) {
          return true;
        }
      }
      // It's not scoped
      return noScoped && notChanged.every((scopeFn)=>!scopeFn(entry.path));
    };
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvbHVtZUB2Mi4yLjAvY29yZS9zY29wZXMudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHR5cGUgeyBFbnRyeSB9IGZyb20gXCIuL2ZzLnRzXCI7XG5cbi8qKlxuICogRGVmaW5lIGluZGVwZW5kZW50IHVwZGF0ZXMgc2NvcGVzXG4gKiBUaGlzIG9wdGltaXplIHRoZSB1cGRhdGUgcHJvY2VzcyBhZnRlciBhbnkgY2hhbmdlXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFNjb3BlcyB7XG4gIHNjb3BlcyA9IG5ldyBTZXQ8U2NvcGVGaWx0ZXI+KCk7XG5cbiAgLyoqIFJldHVybnMgYSBmdW5jdGlvbiB0byBmaWx0ZXIgdGhlIHBhZ2VzIHRoYXQgbXVzdCBiZSByZWJ1aWxkICovXG4gIGdldEZpbHRlcihjaGFuZ2VkRmlsZXM6IEl0ZXJhYmxlPHN0cmluZz4pOiAoZW50cnk6IEVudHJ5KSA9PiBib29sZWFuIHtcbiAgICAvLyBUaGVyZSdzIG5vIGFueSBzY29wZSwgc28gcmVidWlsZCBhbGwgcGFnZXNcbiAgICBpZiAodGhpcy5zY29wZXMuc2l6ZSA9PT0gMCkge1xuICAgICAgcmV0dXJuICgpID0+IHRydWU7XG4gICAgfVxuXG4gICAgbGV0IG5vU2NvcGVkID0gZmFsc2U7XG4gICAgY29uc3QgY2hhbmdlZCA9IG5ldyBTZXQ8U2NvcGVGaWx0ZXI+KCk7XG5cbiAgICBmb3IgKGNvbnN0IGZpbGUgb2YgY2hhbmdlZEZpbGVzKSB7XG4gICAgICBsZXQgZm91bmQgPSBmYWxzZTtcbiAgICAgIGZvciAoY29uc3Qgc2NvcGVGbiBvZiB0aGlzLnNjb3Blcykge1xuICAgICAgICBpZiAoc2NvcGVGbihmaWxlKSkge1xuICAgICAgICAgIGNoYW5nZWQuYWRkKHNjb3BlRm4pO1xuICAgICAgICAgIGZvdW5kID0gdHJ1ZTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoIWZvdW5kKSB7XG4gICAgICAgIG5vU2NvcGVkID0gdHJ1ZTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBDYWxjdWxhdGUgc2NvcGVkIGV4dGVuc2lvbnMgdGhhdCBkaWRuJ3QgY2hhbmdlXG4gICAgY29uc3Qgbm90Q2hhbmdlZDogU2NvcGVGaWx0ZXJbXSA9IFtdO1xuXG4gICAgZm9yIChjb25zdCBzY29wZUZuIG9mIHRoaXMuc2NvcGVzKSB7XG4gICAgICBpZiAoIWNoYW5nZWQuaGFzKHNjb3BlRm4pKSB7XG4gICAgICAgIG5vdENoYW5nZWQucHVzaChzY29wZUZuKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBHZW5lcmF0ZSB0aGUgZmlsdGVyIGZ1bmN0aW9uXG4gICAgcmV0dXJuIGZ1bmN0aW9uIChlbnRyeSkge1xuICAgICAgLy8gSWdub3JlIGRpcmVjdG9yaWVzXG4gICAgICBpZiAoZW50cnkudHlwZSA9PT0gXCJkaXJlY3RvcnlcIikge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cblxuICAgICAgLy8gSXQgbWF0Y2hlcyB3aXRoIGFueSBzY29wZSB0aGF0IGhhcyBjaGFuZ2VkXG4gICAgICBmb3IgKGNvbnN0IHNjb3BlRm4gb2YgY2hhbmdlZCkge1xuICAgICAgICBpZiAoc2NvcGVGbihlbnRyeS5wYXRoKSkge1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIEl0J3Mgbm90IHNjb3BlZFxuICAgICAgcmV0dXJuIG5vU2NvcGVkICYmIG5vdENoYW5nZWQuZXZlcnkoKHNjb3BlRm4pID0+ICFzY29wZUZuKGVudHJ5LnBhdGgpKTtcbiAgICB9O1xuICB9XG59XG5cbmV4cG9ydCB0eXBlIFNjb3BlRmlsdGVyID0gKHBhdGg6IHN0cmluZykgPT4gYm9vbGVhbjtcbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFFQTs7O0NBR0MsR0FDRCxlQUFlLE1BQU07RUFDbkIsU0FBUyxJQUFJLE1BQW1CO0VBRWhDLGdFQUFnRSxHQUNoRSxVQUFVLFlBQThCLEVBQTZCO0lBQ25FLDZDQUE2QztJQUM3QyxJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxLQUFLLEdBQUc7TUFDMUIsT0FBTyxJQUFNO0lBQ2Y7SUFFQSxJQUFJLFdBQVc7SUFDZixNQUFNLFVBQVUsSUFBSTtJQUVwQixLQUFLLE1BQU0sUUFBUSxhQUFjO01BQy9CLElBQUksUUFBUTtNQUNaLEtBQUssTUFBTSxXQUFXLElBQUksQ0FBQyxNQUFNLENBQUU7UUFDakMsSUFBSSxRQUFRLE9BQU87VUFDakIsUUFBUSxHQUFHLENBQUM7VUFDWixRQUFRO1VBQ1I7UUFDRjtNQUNGO01BRUEsSUFBSSxDQUFDLE9BQU87UUFDVixXQUFXO01BQ2I7SUFDRjtJQUVBLGlEQUFpRDtJQUNqRCxNQUFNLGFBQTRCLEVBQUU7SUFFcEMsS0FBSyxNQUFNLFdBQVcsSUFBSSxDQUFDLE1BQU0sQ0FBRTtNQUNqQyxJQUFJLENBQUMsUUFBUSxHQUFHLENBQUMsVUFBVTtRQUN6QixXQUFXLElBQUksQ0FBQztNQUNsQjtJQUNGO0lBRUEsK0JBQStCO0lBQy9CLE9BQU8sU0FBVSxLQUFLO01BQ3BCLHFCQUFxQjtNQUNyQixJQUFJLE1BQU0sSUFBSSxLQUFLLGFBQWE7UUFDOUIsT0FBTztNQUNUO01BRUEsNkNBQTZDO01BQzdDLEtBQUssTUFBTSxXQUFXLFFBQVM7UUFDN0IsSUFBSSxRQUFRLE1BQU0sSUFBSSxHQUFHO1VBQ3ZCLE9BQU87UUFDVDtNQUNGO01BRUEsa0JBQWtCO01BQ2xCLE9BQU8sWUFBWSxXQUFXLEtBQUssQ0FBQyxDQUFDLFVBQVksQ0FBQyxRQUFRLE1BQU0sSUFBSTtJQUN0RTtFQUNGO0FBQ0YifQ==