// Ported from js-yaml v3.13.1:
// https://github.com/nodeca/js-yaml/commit/665aadda42349dcae869f12040d9b10ef18d12da
// Copyright 2011-2015 by Vitaly Puzrin. All rights reserved. MIT license.
// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import { State } from "../_state.ts";
export class LoaderState extends State {
  input;
  documents;
  length;
  lineIndent;
  lineStart;
  position;
  line;
  filename;
  onWarning;
  legacy;
  json;
  listener;
  implicitTypes;
  typeMap;
  version;
  checkLineBreaks;
  tagMap;
  anchorMap;
  tag;
  anchor;
  kind;
  result;
  constructor(input, { filename, schema, onWarning, legacy = false, json = false, listener = null }){
    super(schema);
    this.input = input;
    this.documents = [];
    this.lineIndent = 0;
    this.lineStart = 0;
    this.position = 0;
    this.line = 0;
    this.result = "";
    this.filename = filename;
    this.onWarning = onWarning;
    this.legacy = legacy;
    this.json = json;
    this.listener = listener;
    this.implicitTypes = this.schema.compiledImplicit;
    this.typeMap = this.schema.compiledTypeMap;
    this.length = input.length;
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0BzdGQveWFtbC8wLjIyNC4wL19sb2FkZXIvbG9hZGVyX3N0YXRlLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIFBvcnRlZCBmcm9tIGpzLXlhbWwgdjMuMTMuMTpcbi8vIGh0dHBzOi8vZ2l0aHViLmNvbS9ub2RlY2EvanMteWFtbC9jb21taXQvNjY1YWFkZGE0MjM0OWRjYWU4NjlmMTIwNDBkOWIxMGVmMThkMTJkYVxuLy8gQ29weXJpZ2h0IDIwMTEtMjAxNSBieSBWaXRhbHkgUHV6cmluLiBBbGwgcmlnaHRzIHJlc2VydmVkLiBNSVQgbGljZW5zZS5cbi8vIENvcHlyaWdodCAyMDE4LTIwMjQgdGhlIERlbm8gYXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gTUlUIGxpY2Vuc2UuXG5cbmltcG9ydCB0eXBlIHsgWUFNTEVycm9yIH0gZnJvbSBcIi4uL19lcnJvci50c1wiO1xuaW1wb3J0IHR5cGUgeyBTY2hlbWEsIFNjaGVtYURlZmluaXRpb24sIFR5cGVNYXAgfSBmcm9tIFwiLi4vc2NoZW1hLnRzXCI7XG5pbXBvcnQgeyBTdGF0ZSB9IGZyb20gXCIuLi9fc3RhdGUudHNcIjtcbmltcG9ydCB0eXBlIHsgVHlwZSB9IGZyb20gXCIuLi90eXBlLnRzXCI7XG5pbXBvcnQgdHlwZSB7IEFueSwgQXJyYXlPYmplY3QgfSBmcm9tIFwiLi4vX3V0aWxzLnRzXCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgTG9hZGVyU3RhdGVPcHRpb25zIHtcbiAgbGVnYWN5PzogYm9vbGVhbjtcbiAgbGlzdGVuZXI/OiAoKC4uLmFyZ3M6IEFueVtdKSA9PiB2b2lkKSB8IG51bGw7XG4gIC8qKiBzdHJpbmcgdG8gYmUgdXNlZCBhcyBhIGZpbGUgcGF0aCBpbiBlcnJvci93YXJuaW5nIG1lc3NhZ2VzLiAqL1xuICBmaWxlbmFtZT86IHN0cmluZztcbiAgLyoqIHNwZWNpZmllcyBhIHNjaGVtYSB0byB1c2UuICovXG4gIHNjaGVtYT86IFNjaGVtYURlZmluaXRpb247XG4gIC8qKiBjb21wYXRpYmlsaXR5IHdpdGggSlNPTi5wYXJzZSBiZWhhdmlvdXIuICovXG4gIGpzb24/OiBib29sZWFuO1xuICAvKiogZnVuY3Rpb24gdG8gY2FsbCBvbiB3YXJuaW5nIG1lc3NhZ2VzLiAqL1xuICBvbldhcm5pbmc/KHRoaXM6IG51bGwsIGU/OiBZQU1MRXJyb3IpOiB2b2lkO1xufVxuXG4vLyBkZW5vLWxpbnQtaWdub3JlIG5vLWV4cGxpY2l0LWFueVxuZXhwb3J0IHR5cGUgUmVzdWx0VHlwZSA9IGFueVtdIHwgUmVjb3JkPHN0cmluZywgYW55PiB8IHN0cmluZztcblxuZXhwb3J0IGNsYXNzIExvYWRlclN0YXRlIGV4dGVuZHMgU3RhdGUge1xuICBwdWJsaWMgZG9jdW1lbnRzOiBBbnlbXSA9IFtdO1xuICBwdWJsaWMgbGVuZ3RoOiBudW1iZXI7XG4gIHB1YmxpYyBsaW5lSW5kZW50ID0gMDtcbiAgcHVibGljIGxpbmVTdGFydCA9IDA7XG4gIHB1YmxpYyBwb3NpdGlvbiA9IDA7XG4gIHB1YmxpYyBsaW5lID0gMDtcbiAgcHVibGljIGZpbGVuYW1lPzogc3RyaW5nO1xuICBwdWJsaWMgb25XYXJuaW5nPzogKC4uLmFyZ3M6IEFueVtdKSA9PiB2b2lkO1xuICBwdWJsaWMgbGVnYWN5OiBib29sZWFuO1xuICBwdWJsaWMganNvbjogYm9vbGVhbjtcbiAgcHVibGljIGxpc3RlbmVyPzogKCguLi5hcmdzOiBBbnlbXSkgPT4gdm9pZCkgfCBudWxsO1xuICBwdWJsaWMgaW1wbGljaXRUeXBlczogVHlwZVtdO1xuICBwdWJsaWMgdHlwZU1hcDogVHlwZU1hcDtcblxuICBwdWJsaWMgdmVyc2lvbj86IHN0cmluZyB8IG51bGw7XG4gIHB1YmxpYyBjaGVja0xpbmVCcmVha3M/OiBib29sZWFuO1xuICBwdWJsaWMgdGFnTWFwPzogQXJyYXlPYmplY3Q7XG4gIHB1YmxpYyBhbmNob3JNYXA/OiBBcnJheU9iamVjdDtcbiAgcHVibGljIHRhZz86IHN0cmluZyB8IG51bGw7XG4gIHB1YmxpYyBhbmNob3I/OiBzdHJpbmcgfCBudWxsO1xuICBwdWJsaWMga2luZD86IHN0cmluZyB8IG51bGw7XG4gIHB1YmxpYyByZXN1bHQ6IFJlc3VsdFR5cGUgfCBudWxsID0gXCJcIjtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBwdWJsaWMgaW5wdXQ6IHN0cmluZyxcbiAgICB7XG4gICAgICBmaWxlbmFtZSxcbiAgICAgIHNjaGVtYSxcbiAgICAgIG9uV2FybmluZyxcbiAgICAgIGxlZ2FjeSA9IGZhbHNlLFxuICAgICAganNvbiA9IGZhbHNlLFxuICAgICAgbGlzdGVuZXIgPSBudWxsLFxuICAgIH06IExvYWRlclN0YXRlT3B0aW9ucyxcbiAgKSB7XG4gICAgc3VwZXIoc2NoZW1hKTtcbiAgICB0aGlzLmZpbGVuYW1lID0gZmlsZW5hbWU7XG4gICAgdGhpcy5vbldhcm5pbmcgPSBvbldhcm5pbmc7XG4gICAgdGhpcy5sZWdhY3kgPSBsZWdhY3k7XG4gICAgdGhpcy5qc29uID0ganNvbjtcbiAgICB0aGlzLmxpc3RlbmVyID0gbGlzdGVuZXI7XG5cbiAgICB0aGlzLmltcGxpY2l0VHlwZXMgPSAodGhpcy5zY2hlbWEgYXMgU2NoZW1hKS5jb21waWxlZEltcGxpY2l0O1xuICAgIHRoaXMudHlwZU1hcCA9ICh0aGlzLnNjaGVtYSBhcyBTY2hlbWEpLmNvbXBpbGVkVHlwZU1hcDtcblxuICAgIHRoaXMubGVuZ3RoID0gaW5wdXQubGVuZ3RoO1xuICB9XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsK0JBQStCO0FBQy9CLG9GQUFvRjtBQUNwRiwwRUFBMEU7QUFDMUUsMEVBQTBFO0FBSTFFLFNBQVMsS0FBSyxRQUFRLGVBQWU7QUFvQnJDLE9BQU8sTUFBTSxvQkFBb0I7O0VBQ3hCLFVBQXNCO0VBQ3RCLE9BQWU7RUFDZixXQUFlO0VBQ2YsVUFBYztFQUNkLFNBQWE7RUFDYixLQUFTO0VBQ1QsU0FBa0I7RUFDbEIsVUFBcUM7RUFDckMsT0FBZ0I7RUFDaEIsS0FBYztFQUNkLFNBQTZDO0VBQzdDLGNBQXNCO0VBQ3RCLFFBQWlCO0VBRWpCLFFBQXdCO0VBQ3hCLGdCQUEwQjtFQUMxQixPQUFxQjtFQUNyQixVQUF3QjtFQUN4QixJQUFvQjtFQUNwQixPQUF1QjtFQUN2QixLQUFxQjtFQUNyQixPQUErQjtFQUV0QyxZQUNFLEFBQU8sS0FBYSxFQUNwQixFQUNFLFFBQVEsRUFDUixNQUFNLEVBQ04sU0FBUyxFQUNULFNBQVMsS0FBSyxFQUNkLE9BQU8sS0FBSyxFQUNaLFdBQVcsSUFBSSxFQUNJLENBQ3JCO0lBQ0EsS0FBSyxDQUFDO1NBVkMsUUFBQTtTQXhCRixZQUFtQixFQUFFO1NBRXJCLGFBQWE7U0FDYixZQUFZO1NBQ1osV0FBVztTQUNYLE9BQU87U0FnQlAsU0FBNEI7SUFjakMsSUFBSSxDQUFDLFFBQVEsR0FBRztJQUNoQixJQUFJLENBQUMsU0FBUyxHQUFHO0lBQ2pCLElBQUksQ0FBQyxNQUFNLEdBQUc7SUFDZCxJQUFJLENBQUMsSUFBSSxHQUFHO0lBQ1osSUFBSSxDQUFDLFFBQVEsR0FBRztJQUVoQixJQUFJLENBQUMsYUFBYSxHQUFHLEFBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBWSxnQkFBZ0I7SUFDN0QsSUFBSSxDQUFDLE9BQU8sR0FBRyxBQUFDLElBQUksQ0FBQyxNQUFNLENBQVksZUFBZTtJQUV0RCxJQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sTUFBTTtFQUM1QjtBQUNGIn0=