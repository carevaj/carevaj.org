import { boolean } from "../../flags/types/boolean.ts";
import { Type } from "../type.ts";
/** Boolean type with auto completion. Allows `true`, `false`, `0` and `1`. */ export class BooleanType extends Type {
  /** Parse boolean type. */ parse(type) {
    return boolean(type);
  }
  /** Complete boolean type. */ complete() {
    return [
      "true",
      "false"
    ];
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvY2xpZmZ5QHYwLjI1LjcvY29tbWFuZC90eXBlcy9ib29sZWFuLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGJvb2xlYW4gfSBmcm9tIFwiLi4vLi4vZmxhZ3MvdHlwZXMvYm9vbGVhbi50c1wiO1xuaW1wb3J0IHR5cGUgeyBBcmd1bWVudFZhbHVlIH0gZnJvbSBcIi4uL3R5cGVzLnRzXCI7XG5pbXBvcnQgeyBUeXBlIH0gZnJvbSBcIi4uL3R5cGUudHNcIjtcblxuLyoqIEJvb2xlYW4gdHlwZSB3aXRoIGF1dG8gY29tcGxldGlvbi4gQWxsb3dzIGB0cnVlYCwgYGZhbHNlYCwgYDBgIGFuZCBgMWAuICovXG5leHBvcnQgY2xhc3MgQm9vbGVhblR5cGUgZXh0ZW5kcyBUeXBlPGJvb2xlYW4+IHtcbiAgLyoqIFBhcnNlIGJvb2xlYW4gdHlwZS4gKi9cbiAgcHVibGljIHBhcnNlKHR5cGU6IEFyZ3VtZW50VmFsdWUpOiBib29sZWFuIHtcbiAgICByZXR1cm4gYm9vbGVhbih0eXBlKTtcbiAgfVxuXG4gIC8qKiBDb21wbGV0ZSBib29sZWFuIHR5cGUuICovXG4gIHB1YmxpYyBjb21wbGV0ZSgpOiBzdHJpbmdbXSB7XG4gICAgcmV0dXJuIFtcInRydWVcIiwgXCJmYWxzZVwiXTtcbiAgfVxufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFNBQVMsT0FBTyxRQUFRLCtCQUErQjtBQUV2RCxTQUFTLElBQUksUUFBUSxhQUFhO0FBRWxDLDRFQUE0RSxHQUM1RSxPQUFPLE1BQU0sb0JBQW9CO0VBQy9CLHdCQUF3QixHQUN4QixBQUFPLE1BQU0sSUFBbUIsRUFBVztJQUN6QyxPQUFPLFFBQVE7RUFDakI7RUFFQSwyQkFBMkIsR0FDM0IsQUFBTyxXQUFxQjtJQUMxQixPQUFPO01BQUM7TUFBUTtLQUFRO0VBQzFCO0FBQ0YifQ==