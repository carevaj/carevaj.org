import { InvalidTypeError } from "../_errors.ts";
/** Boolean type handler. Excepts `true`, `false`, `1`, `0` */ export const boolean = (type)=>{
  if (~[
    "1",
    "true"
  ].indexOf(type.value)) {
    return true;
  }
  if (~[
    "0",
    "false"
  ].indexOf(type.value)) {
    return false;
  }
  throw new InvalidTypeError(type, [
    "true",
    "false",
    "1",
    "0"
  ]);
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvY2xpZmZ5QHYwLjI1LjcvZmxhZ3MvdHlwZXMvYm9vbGVhbi50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgdHlwZSB7IEFyZ3VtZW50VmFsdWUsIFR5cGVIYW5kbGVyIH0gZnJvbSBcIi4uL3R5cGVzLnRzXCI7XG5pbXBvcnQgeyBJbnZhbGlkVHlwZUVycm9yIH0gZnJvbSBcIi4uL19lcnJvcnMudHNcIjtcblxuLyoqIEJvb2xlYW4gdHlwZSBoYW5kbGVyLiBFeGNlcHRzIGB0cnVlYCwgYGZhbHNlYCwgYDFgLCBgMGAgKi9cbmV4cG9ydCBjb25zdCBib29sZWFuOiBUeXBlSGFuZGxlcjxib29sZWFuPiA9IChcbiAgdHlwZTogQXJndW1lbnRWYWx1ZSxcbik6IGJvb2xlYW4gPT4ge1xuICBpZiAofltcIjFcIiwgXCJ0cnVlXCJdLmluZGV4T2YodHlwZS52YWx1ZSkpIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIGlmICh+W1wiMFwiLCBcImZhbHNlXCJdLmluZGV4T2YodHlwZS52YWx1ZSkpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICB0aHJvdyBuZXcgSW52YWxpZFR5cGVFcnJvcih0eXBlLCBbXCJ0cnVlXCIsIFwiZmFsc2VcIiwgXCIxXCIsIFwiMFwiXSk7XG59O1xuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNBLFNBQVMsZ0JBQWdCLFFBQVEsZ0JBQWdCO0FBRWpELDREQUE0RCxHQUM1RCxPQUFPLE1BQU0sVUFBZ0MsQ0FDM0M7RUFFQSxJQUFJLENBQUM7SUFBQztJQUFLO0dBQU8sQ0FBQyxPQUFPLENBQUMsS0FBSyxLQUFLLEdBQUc7SUFDdEMsT0FBTztFQUNUO0VBRUEsSUFBSSxDQUFDO0lBQUM7SUFBSztHQUFRLENBQUMsT0FBTyxDQUFDLEtBQUssS0FBSyxHQUFHO0lBQ3ZDLE9BQU87RUFDVDtFQUVBLE1BQU0sSUFBSSxpQkFBaUIsTUFBTTtJQUFDO0lBQVE7SUFBUztJQUFLO0dBQUk7QUFDOUQsRUFBRSJ9