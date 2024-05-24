// Ported from js-yaml v3.13.1:
// https://github.com/nodeca/js-yaml/commit/665aadda42349dcae869f12040d9b10ef18d12da
// Copyright 2011-2015 by Vitaly Puzrin. All rights reserved. MIT license.
// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
function checkTagFormat(tag) {
  return tag;
}
export class Type {
  tag;
  kind = null;
  instanceOf;
  predicate;
  represent;
  defaultStyle;
  styleAliases;
  loadKind;
  constructor(tag, options){
    this.tag = checkTagFormat(tag);
    if (options) {
      this.kind = options.kind;
      this.resolve = options.resolve || (()=>true);
      this.construct = options.construct || ((data)=>data);
      this.instanceOf = options.instanceOf;
      this.predicate = options.predicate;
      this.represent = options.represent;
      this.defaultStyle = options.defaultStyle;
      this.styleAliases = options.styleAliases;
    }
  }
  resolve = ()=>true;
  construct = (data)=>data;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0BzdGQveWFtbC8wLjIyNC4wL3R5cGUudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gUG9ydGVkIGZyb20ganMteWFtbCB2My4xMy4xOlxuLy8gaHR0cHM6Ly9naXRodWIuY29tL25vZGVjYS9qcy15YW1sL2NvbW1pdC82NjVhYWRkYTQyMzQ5ZGNhZTg2OWYxMjA0MGQ5YjEwZWYxOGQxMmRhXG4vLyBDb3B5cmlnaHQgMjAxMS0yMDE1IGJ5IFZpdGFseSBQdXpyaW4uIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuLy8gQ29weXJpZ2h0IDIwMTgtMjAyNCB0aGUgRGVubyBhdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLiBNSVQgbGljZW5zZS5cbi8vIFRoaXMgbW9kdWxlIGlzIGJyb3dzZXIgY29tcGF0aWJsZS5cblxuaW1wb3J0IHR5cGUgeyBBbnksIEFycmF5T2JqZWN0IH0gZnJvbSBcIi4vX3V0aWxzLnRzXCI7XG5cbmV4cG9ydCB0eXBlIEtpbmRUeXBlID0gXCJzZXF1ZW5jZVwiIHwgXCJzY2FsYXJcIiB8IFwibWFwcGluZ1wiO1xuZXhwb3J0IHR5cGUgU3R5bGVWYXJpYW50ID0gXCJsb3dlcmNhc2VcIiB8IFwidXBwZXJjYXNlXCIgfCBcImNhbWVsY2FzZVwiIHwgXCJkZWNpbWFsXCI7XG5leHBvcnQgdHlwZSBSZXByZXNlbnRGbiA9IChkYXRhOiBBbnksIHN0eWxlPzogU3R5bGVWYXJpYW50KSA9PiBBbnk7XG5cbmludGVyZmFjZSBUeXBlT3B0aW9ucyB7XG4gIGtpbmQ6IEtpbmRUeXBlO1xuICByZXNvbHZlPzogKGRhdGE6IEFueSkgPT4gYm9vbGVhbjtcbiAgY29uc3RydWN0PzogKGRhdGE6IHN0cmluZykgPT4gQW55O1xuICBpbnN0YW5jZU9mPzogQW55O1xuICBwcmVkaWNhdGU/OiAoZGF0YTogUmVjb3JkPHN0cmluZywgdW5rbm93bj4pID0+IGJvb2xlYW47XG4gIHJlcHJlc2VudD86IFJlcHJlc2VudEZuIHwgQXJyYXlPYmplY3Q8UmVwcmVzZW50Rm4+O1xuICBkZWZhdWx0U3R5bGU/OiBTdHlsZVZhcmlhbnQ7XG4gIHN0eWxlQWxpYXNlcz86IEFycmF5T2JqZWN0O1xufVxuXG5mdW5jdGlvbiBjaGVja1RhZ0Zvcm1hdCh0YWc6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiB0YWc7XG59XG5cbmV4cG9ydCBjbGFzcyBUeXBlIHtcbiAgcHVibGljIHRhZzogc3RyaW5nO1xuICBwdWJsaWMga2luZDogS2luZFR5cGUgfCBudWxsID0gbnVsbDtcbiAgcHVibGljIGluc3RhbmNlT2Y6IEFueTtcbiAgcHVibGljIHByZWRpY2F0ZT86IChkYXRhOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPikgPT4gYm9vbGVhbjtcbiAgcHVibGljIHJlcHJlc2VudD86IFJlcHJlc2VudEZuIHwgQXJyYXlPYmplY3Q8UmVwcmVzZW50Rm4+O1xuICBwdWJsaWMgZGVmYXVsdFN0eWxlPzogU3R5bGVWYXJpYW50O1xuICBwdWJsaWMgc3R5bGVBbGlhc2VzPzogQXJyYXlPYmplY3Q7XG4gIHB1YmxpYyBsb2FkS2luZD86IEtpbmRUeXBlO1xuXG4gIGNvbnN0cnVjdG9yKHRhZzogc3RyaW5nLCBvcHRpb25zPzogVHlwZU9wdGlvbnMpIHtcbiAgICB0aGlzLnRhZyA9IGNoZWNrVGFnRm9ybWF0KHRhZyk7XG4gICAgaWYgKG9wdGlvbnMpIHtcbiAgICAgIHRoaXMua2luZCA9IG9wdGlvbnMua2luZDtcbiAgICAgIHRoaXMucmVzb2x2ZSA9IG9wdGlvbnMucmVzb2x2ZSB8fCAoKCkgPT4gdHJ1ZSk7XG4gICAgICB0aGlzLmNvbnN0cnVjdCA9IG9wdGlvbnMuY29uc3RydWN0IHx8ICgoZGF0YTogQW55KTogQW55ID0+IGRhdGEpO1xuICAgICAgdGhpcy5pbnN0YW5jZU9mID0gb3B0aW9ucy5pbnN0YW5jZU9mO1xuICAgICAgdGhpcy5wcmVkaWNhdGUgPSBvcHRpb25zLnByZWRpY2F0ZTtcbiAgICAgIHRoaXMucmVwcmVzZW50ID0gb3B0aW9ucy5yZXByZXNlbnQ7XG4gICAgICB0aGlzLmRlZmF1bHRTdHlsZSA9IG9wdGlvbnMuZGVmYXVsdFN0eWxlO1xuICAgICAgdGhpcy5zdHlsZUFsaWFzZXMgPSBvcHRpb25zLnN0eWxlQWxpYXNlcztcbiAgICB9XG4gIH1cbiAgcHVibGljIHJlc29sdmU6IChkYXRhPzogQW55KSA9PiBib29sZWFuID0gKCk6IGJvb2xlYW4gPT4gdHJ1ZTtcbiAgcHVibGljIGNvbnN0cnVjdDogKGRhdGE/OiBBbnkpID0+IEFueSA9IChkYXRhKTogQW55ID0+IGRhdGE7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsK0JBQStCO0FBQy9CLG9GQUFvRjtBQUNwRiwwRUFBMEU7QUFDMUUsMEVBQTBFO0FBQzFFLHFDQUFxQztBQW1CckMsU0FBUyxlQUFlLEdBQVc7RUFDakMsT0FBTztBQUNUO0FBRUEsT0FBTyxNQUFNO0VBQ0osSUFBWTtFQUNaLE9BQXdCLEtBQUs7RUFDN0IsV0FBZ0I7RUFDaEIsVUFBdUQ7RUFDdkQsVUFBbUQ7RUFDbkQsYUFBNEI7RUFDNUIsYUFBMkI7RUFDM0IsU0FBb0I7RUFFM0IsWUFBWSxHQUFXLEVBQUUsT0FBcUIsQ0FBRTtJQUM5QyxJQUFJLENBQUMsR0FBRyxHQUFHLGVBQWU7SUFDMUIsSUFBSSxTQUFTO01BQ1gsSUFBSSxDQUFDLElBQUksR0FBRyxRQUFRLElBQUk7TUFDeEIsSUFBSSxDQUFDLE9BQU8sR0FBRyxRQUFRLE9BQU8sSUFBSSxDQUFDLElBQU0sSUFBSTtNQUM3QyxJQUFJLENBQUMsU0FBUyxHQUFHLFFBQVEsU0FBUyxJQUFJLENBQUMsQ0FBQyxPQUFtQixJQUFJO01BQy9ELElBQUksQ0FBQyxVQUFVLEdBQUcsUUFBUSxVQUFVO01BQ3BDLElBQUksQ0FBQyxTQUFTLEdBQUcsUUFBUSxTQUFTO01BQ2xDLElBQUksQ0FBQyxTQUFTLEdBQUcsUUFBUSxTQUFTO01BQ2xDLElBQUksQ0FBQyxZQUFZLEdBQUcsUUFBUSxZQUFZO01BQ3hDLElBQUksQ0FBQyxZQUFZLEdBQUcsUUFBUSxZQUFZO0lBQzFDO0VBQ0Y7RUFDTyxVQUFtQyxJQUFlLEtBQUs7RUFDdkQsWUFBaUMsQ0FBQyxPQUFjLEtBQUs7QUFDOUQifQ==