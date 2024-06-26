// Ported from js-yaml v3.13.1:
// https://github.com/nodeca/js-yaml/commit/665aadda42349dcae869f12040d9b10ef18d12da
// Copyright 2011-2015 by Vitaly Puzrin. All rights reserved. MIT license.
// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import { repeat } from "./_utils.ts";
export class Mark {
  name;
  buffer;
  position;
  line;
  column;
  constructor(name, buffer, position, line, column){
    this.name = name;
    this.buffer = buffer;
    this.position = position;
    this.line = line;
    this.column = column;
  }
  getSnippet(indent = 4, maxLength = 75) {
    if (!this.buffer) return null;
    let head = "";
    let start = this.position;
    while(start > 0 && "\x00\r\n\x85\u2028\u2029".indexOf(this.buffer.charAt(start - 1)) === -1){
      start -= 1;
      if (this.position - start > maxLength / 2 - 1) {
        head = " ... ";
        start += 5;
        break;
      }
    }
    let tail = "";
    let end = this.position;
    while(end < this.buffer.length && "\x00\r\n\x85\u2028\u2029".indexOf(this.buffer.charAt(end)) === -1){
      end += 1;
      if (end - this.position > maxLength / 2 - 1) {
        tail = " ... ";
        end -= 5;
        break;
      }
    }
    const snippet = this.buffer.slice(start, end);
    return `${repeat(" ", indent)}${head}${snippet}${tail}\n${repeat(" ", indent + this.position - start + head.length)}^`;
  }
  toString(compact) {
    let snippet;
    let where = "";
    if (this.name) {
      where += `in "${this.name}" `;
    }
    where += `at line ${this.line + 1}, column ${this.column + 1}`;
    if (!compact) {
      snippet = this.getSnippet();
      if (snippet) {
        where += `:\n${snippet}`;
      }
    }
    return where;
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0BzdGQveWFtbC8wLjIyNC4wL19tYXJrLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIFBvcnRlZCBmcm9tIGpzLXlhbWwgdjMuMTMuMTpcbi8vIGh0dHBzOi8vZ2l0aHViLmNvbS9ub2RlY2EvanMteWFtbC9jb21taXQvNjY1YWFkZGE0MjM0OWRjYWU4NjlmMTIwNDBkOWIxMGVmMThkMTJkYVxuLy8gQ29weXJpZ2h0IDIwMTEtMjAxNSBieSBWaXRhbHkgUHV6cmluLiBBbGwgcmlnaHRzIHJlc2VydmVkLiBNSVQgbGljZW5zZS5cbi8vIENvcHlyaWdodCAyMDE4LTIwMjQgdGhlIERlbm8gYXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gTUlUIGxpY2Vuc2UuXG5cbmltcG9ydCB7IHJlcGVhdCB9IGZyb20gXCIuL191dGlscy50c1wiO1xuXG5leHBvcnQgY2xhc3MgTWFyayB7XG4gIGNvbnN0cnVjdG9yKFxuICAgIHB1YmxpYyBuYW1lOiBzdHJpbmcsXG4gICAgcHVibGljIGJ1ZmZlcjogc3RyaW5nLFxuICAgIHB1YmxpYyBwb3NpdGlvbjogbnVtYmVyLFxuICAgIHB1YmxpYyBsaW5lOiBudW1iZXIsXG4gICAgcHVibGljIGNvbHVtbjogbnVtYmVyLFxuICApIHt9XG5cbiAgcHVibGljIGdldFNuaXBwZXQoaW5kZW50ID0gNCwgbWF4TGVuZ3RoID0gNzUpOiBzdHJpbmcgfCBudWxsIHtcbiAgICBpZiAoIXRoaXMuYnVmZmVyKSByZXR1cm4gbnVsbDtcblxuICAgIGxldCBoZWFkID0gXCJcIjtcbiAgICBsZXQgc3RhcnQgPSB0aGlzLnBvc2l0aW9uO1xuXG4gICAgd2hpbGUgKFxuICAgICAgc3RhcnQgPiAwICYmXG4gICAgICBcIlxceDAwXFxyXFxuXFx4ODVcXHUyMDI4XFx1MjAyOVwiLmluZGV4T2YodGhpcy5idWZmZXIuY2hhckF0KHN0YXJ0IC0gMSkpID09PSAtMVxuICAgICkge1xuICAgICAgc3RhcnQgLT0gMTtcbiAgICAgIGlmICh0aGlzLnBvc2l0aW9uIC0gc3RhcnQgPiBtYXhMZW5ndGggLyAyIC0gMSkge1xuICAgICAgICBoZWFkID0gXCIgLi4uIFwiO1xuICAgICAgICBzdGFydCArPSA1O1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG5cbiAgICBsZXQgdGFpbCA9IFwiXCI7XG4gICAgbGV0IGVuZCA9IHRoaXMucG9zaXRpb247XG5cbiAgICB3aGlsZSAoXG4gICAgICBlbmQgPCB0aGlzLmJ1ZmZlci5sZW5ndGggJiZcbiAgICAgIFwiXFx4MDBcXHJcXG5cXHg4NVxcdTIwMjhcXHUyMDI5XCIuaW5kZXhPZih0aGlzLmJ1ZmZlci5jaGFyQXQoZW5kKSkgPT09IC0xXG4gICAgKSB7XG4gICAgICBlbmQgKz0gMTtcbiAgICAgIGlmIChlbmQgLSB0aGlzLnBvc2l0aW9uID4gbWF4TGVuZ3RoIC8gMiAtIDEpIHtcbiAgICAgICAgdGFpbCA9IFwiIC4uLiBcIjtcbiAgICAgICAgZW5kIC09IDU7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IHNuaXBwZXQgPSB0aGlzLmJ1ZmZlci5zbGljZShzdGFydCwgZW5kKTtcbiAgICByZXR1cm4gYCR7cmVwZWF0KFwiIFwiLCBpbmRlbnQpfSR7aGVhZH0ke3NuaXBwZXR9JHt0YWlsfVxcbiR7XG4gICAgICByZXBlYXQoXG4gICAgICAgIFwiIFwiLFxuICAgICAgICBpbmRlbnQgKyB0aGlzLnBvc2l0aW9uIC0gc3RhcnQgKyBoZWFkLmxlbmd0aCxcbiAgICAgIClcbiAgICB9XmA7XG4gIH1cblxuICBwdWJsaWMgdG9TdHJpbmcoY29tcGFjdD86IGJvb2xlYW4pOiBzdHJpbmcge1xuICAgIGxldCBzbmlwcGV0O1xuICAgIGxldCB3aGVyZSA9IFwiXCI7XG5cbiAgICBpZiAodGhpcy5uYW1lKSB7XG4gICAgICB3aGVyZSArPSBgaW4gXCIke3RoaXMubmFtZX1cIiBgO1xuICAgIH1cblxuICAgIHdoZXJlICs9IGBhdCBsaW5lICR7dGhpcy5saW5lICsgMX0sIGNvbHVtbiAke3RoaXMuY29sdW1uICsgMX1gO1xuXG4gICAgaWYgKCFjb21wYWN0KSB7XG4gICAgICBzbmlwcGV0ID0gdGhpcy5nZXRTbmlwcGV0KCk7XG5cbiAgICAgIGlmIChzbmlwcGV0KSB7XG4gICAgICAgIHdoZXJlICs9IGA6XFxuJHtzbmlwcGV0fWA7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHdoZXJlO1xuICB9XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsK0JBQStCO0FBQy9CLG9GQUFvRjtBQUNwRiwwRUFBMEU7QUFDMUUsMEVBQTBFO0FBRTFFLFNBQVMsTUFBTSxRQUFRLGNBQWM7QUFFckMsT0FBTyxNQUFNOzs7Ozs7RUFDWCxZQUNFLEFBQU8sSUFBWSxFQUNuQixBQUFPLE1BQWMsRUFDckIsQUFBTyxRQUFnQixFQUN2QixBQUFPLElBQVksRUFDbkIsQUFBTyxNQUFjLENBQ3JCO1NBTE8sT0FBQTtTQUNBLFNBQUE7U0FDQSxXQUFBO1NBQ0EsT0FBQTtTQUNBLFNBQUE7RUFDTjtFQUVJLFdBQVcsU0FBUyxDQUFDLEVBQUUsWUFBWSxFQUFFLEVBQWlCO0lBQzNELElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLE9BQU87SUFFekIsSUFBSSxPQUFPO0lBQ1gsSUFBSSxRQUFRLElBQUksQ0FBQyxRQUFRO0lBRXpCLE1BQ0UsUUFBUSxLQUNSLDJCQUEyQixPQUFPLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsUUFBUSxRQUFRLENBQUMsRUFDdkU7TUFDQSxTQUFTO01BQ1QsSUFBSSxJQUFJLENBQUMsUUFBUSxHQUFHLFFBQVEsWUFBWSxJQUFJLEdBQUc7UUFDN0MsT0FBTztRQUNQLFNBQVM7UUFDVDtNQUNGO0lBQ0Y7SUFFQSxJQUFJLE9BQU87SUFDWCxJQUFJLE1BQU0sSUFBSSxDQUFDLFFBQVE7SUFFdkIsTUFDRSxNQUFNLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxJQUN4QiwyQkFBMkIsT0FBTyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxFQUNqRTtNQUNBLE9BQU87TUFDUCxJQUFJLE1BQU0sSUFBSSxDQUFDLFFBQVEsR0FBRyxZQUFZLElBQUksR0FBRztRQUMzQyxPQUFPO1FBQ1AsT0FBTztRQUNQO01BQ0Y7SUFDRjtJQUVBLE1BQU0sVUFBVSxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxPQUFPO0lBQ3pDLE9BQU8sQ0FBQyxFQUFFLE9BQU8sS0FBSyxRQUFRLEVBQUUsS0FBSyxFQUFFLFFBQVEsRUFBRSxLQUFLLEVBQUUsRUFDdEQsT0FDRSxLQUNBLFNBQVMsSUFBSSxDQUFDLFFBQVEsR0FBRyxRQUFRLEtBQUssTUFBTSxFQUUvQyxDQUFDLENBQUM7RUFDTDtFQUVPLFNBQVMsT0FBaUIsRUFBVTtJQUN6QyxJQUFJO0lBQ0osSUFBSSxRQUFRO0lBRVosSUFBSSxJQUFJLENBQUMsSUFBSSxFQUFFO01BQ2IsU0FBUyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztJQUMvQjtJQUVBLFNBQVMsQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLElBQUksR0FBRyxFQUFFLFNBQVMsRUFBRSxJQUFJLENBQUMsTUFBTSxHQUFHLEVBQUUsQ0FBQztJQUU5RCxJQUFJLENBQUMsU0FBUztNQUNaLFVBQVUsSUFBSSxDQUFDLFVBQVU7TUFFekIsSUFBSSxTQUFTO1FBQ1gsU0FBUyxDQUFDLEdBQUcsRUFBRSxRQUFRLENBQUM7TUFDMUI7SUFDRjtJQUVBLE9BQU87RUFDVDtBQUNGIn0=