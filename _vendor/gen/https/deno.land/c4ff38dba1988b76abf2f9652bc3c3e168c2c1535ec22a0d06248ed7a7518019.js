import { format, formatDistanceToNow, formatDistanceToNowStrict } from "../deps/date.ts";
import { merge } from "../core/utils/object.ts";
// Default options
export const defaults = {
  name: "date",
  locales: {},
  formats: {
    ATOM: "yyyy-MM-dd'T'HH:mm:ssXXX",
    DATE: "yyyy-MM-dd",
    DATETIME: "yyyy-MM-dd HH:mm:ss",
    TIME: "HH:mm:ss",
    HUMAN_DATE: "PPP",
    HUMAN_DATETIME: "PPPppp"
  }
};
/** A plugin to format Date values */ export default function(userOptions) {
  const options = merge(defaults, userOptions);
  return (site)=>{
    const defaultLocale = Object.keys(options.locales).shift();
    site.filter(options.name, filter);
    function filter(date, pattern = "DATE", lang = defaultLocale) {
      if (!date) {
        return;
      }
      if (date === "now") {
        date = new Date();
      } else if (!(date instanceof Date)) {
        date = new Date(date);
      }
      const patt = options.formats[pattern] || pattern;
      const locale = lang ? options.locales[lang] : undefined;
      if (pattern === "HUMAN_SINCE") {
        return formatDistanceToNow(date, {
          locale
        });
      } else if (pattern === "HUMAN_SINCE_STRICT") {
        return formatDistanceToNowStrict(date, {
          locale
        });
      } else {
        return format(date, patt, {
          locale
        });
      }
    }
  };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvbHVtZUB2Mi4yLjAvcGx1Z2lucy9kYXRlLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7XG4gIGZvcm1hdCxcbiAgZm9ybWF0RGlzdGFuY2VUb05vdyxcbiAgZm9ybWF0RGlzdGFuY2VUb05vd1N0cmljdCxcbn0gZnJvbSBcIi4uL2RlcHMvZGF0ZS50c1wiO1xuaW1wb3J0IHsgbWVyZ2UgfSBmcm9tIFwiLi4vY29yZS91dGlscy9vYmplY3QudHNcIjtcblxuaW1wb3J0IHR5cGUgU2l0ZSBmcm9tIFwiLi4vY29yZS9zaXRlLnRzXCI7XG5pbXBvcnQgdHlwZSB7IExvY2FsZSB9IGZyb20gXCIuLi9kZXBzL2RhdGUudHNcIjtcblxuZXhwb3J0IGludGVyZmFjZSBPcHRpb25zIHtcbiAgLyoqIFRoZSBuYW1lIG9mIHRoZSBoZWxwZXIgKi9cbiAgbmFtZT86IHN0cmluZztcblxuICAvKiogVGhlIGxvYWRlZCBsb2NhbGVzICovXG4gIGxvY2FsZXM/OiBSZWNvcmQ8c3RyaW5nLCBMb2NhbGU+O1xuXG4gIC8qKiBDdXN0b20gZGF0ZSBmb3JtYXRzICovXG4gIGZvcm1hdHM/OiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+O1xufVxuXG4vLyBEZWZhdWx0IG9wdGlvbnNcbmV4cG9ydCBjb25zdCBkZWZhdWx0czogT3B0aW9ucyA9IHtcbiAgbmFtZTogXCJkYXRlXCIsXG4gIGxvY2FsZXM6IHt9LFxuICBmb3JtYXRzOiB7XG4gICAgQVRPTTogXCJ5eXl5LU1NLWRkJ1QnSEg6bW06c3NYWFhcIixcbiAgICBEQVRFOiBcInl5eXktTU0tZGRcIixcbiAgICBEQVRFVElNRTogXCJ5eXl5LU1NLWRkIEhIOm1tOnNzXCIsXG4gICAgVElNRTogXCJISDptbTpzc1wiLFxuICAgIEhVTUFOX0RBVEU6IFwiUFBQXCIsXG4gICAgSFVNQU5fREFURVRJTUU6IFwiUFBQcHBwXCIsXG4gIH0sXG59O1xuXG4vKiogQSBwbHVnaW4gdG8gZm9ybWF0IERhdGUgdmFsdWVzICovXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiAodXNlck9wdGlvbnM/OiBPcHRpb25zKSB7XG4gIGNvbnN0IG9wdGlvbnMgPSBtZXJnZShkZWZhdWx0cywgdXNlck9wdGlvbnMpO1xuXG4gIHJldHVybiAoc2l0ZTogU2l0ZSkgPT4ge1xuICAgIGNvbnN0IGRlZmF1bHRMb2NhbGUgPSBPYmplY3Qua2V5cyhvcHRpb25zLmxvY2FsZXMpLnNoaWZ0KCk7XG5cbiAgICBzaXRlLmZpbHRlcihvcHRpb25zLm5hbWUsIGZpbHRlcik7XG5cbiAgICBmdW5jdGlvbiBmaWx0ZXIoXG4gICAgICBkYXRlOiBzdHJpbmcgfCBEYXRlLFxuICAgICAgcGF0dGVybiA9IFwiREFURVwiLFxuICAgICAgbGFuZyA9IGRlZmF1bHRMb2NhbGUsXG4gICAgKTogc3RyaW5nIHwgdW5kZWZpbmVkIHtcbiAgICAgIGlmICghZGF0ZSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGlmIChkYXRlID09PSBcIm5vd1wiKSB7XG4gICAgICAgIGRhdGUgPSBuZXcgRGF0ZSgpO1xuICAgICAgfSBlbHNlIGlmICghKGRhdGUgaW5zdGFuY2VvZiBEYXRlKSkge1xuICAgICAgICBkYXRlID0gbmV3IERhdGUoZGF0ZSk7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHBhdHQgPSBvcHRpb25zLmZvcm1hdHNbcGF0dGVybl0gfHwgcGF0dGVybjtcbiAgICAgIGNvbnN0IGxvY2FsZSA9IGxhbmcgPyBvcHRpb25zLmxvY2FsZXNbbGFuZ10gOiB1bmRlZmluZWQ7XG5cbiAgICAgIGlmIChwYXR0ZXJuID09PSBcIkhVTUFOX1NJTkNFXCIpIHtcbiAgICAgICAgcmV0dXJuIGZvcm1hdERpc3RhbmNlVG9Ob3coZGF0ZSwgeyBsb2NhbGUgfSk7XG4gICAgICB9IGVsc2UgaWYgKHBhdHRlcm4gPT09IFwiSFVNQU5fU0lOQ0VfU1RSSUNUXCIpIHtcbiAgICAgICAgcmV0dXJuIGZvcm1hdERpc3RhbmNlVG9Ob3dTdHJpY3QoZGF0ZSwgeyBsb2NhbGUgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gZm9ybWF0KGRhdGUsIHBhdHQsIHsgbG9jYWxlIH0pO1xuICAgICAgfVxuICAgIH1cbiAgfTtcbn1cblxuLyoqIEV4dGVuZHMgSGVscGVycyBpbnRlcmZhY2UgKi9cbmRlY2xhcmUgZ2xvYmFsIHtcbiAgbmFtZXNwYWNlIEx1bWUge1xuICAgIGV4cG9ydCBpbnRlcmZhY2UgSGVscGVycyB7XG4gICAgICAvKiogQHNlZSBodHRwczovL2x1bWUubGFuZC9wbHVnaW5zL2RhdGUvICovXG4gICAgICBkYXRlOiAoXG4gICAgICAgIGRhdGU6IHN0cmluZyB8IERhdGUsXG4gICAgICAgIHBhdHRlcm4/OiBzdHJpbmcsXG4gICAgICAgIGxhbmc/OiBzdHJpbmcsXG4gICAgICApID0+IHN0cmluZyB8IHVuZGVmaW5lZDtcbiAgICB9XG4gIH1cbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxTQUNFLE1BQU0sRUFDTixtQkFBbUIsRUFDbkIseUJBQXlCLFFBQ3BCLGtCQUFrQjtBQUN6QixTQUFTLEtBQUssUUFBUSwwQkFBMEI7QUFnQmhELGtCQUFrQjtBQUNsQixPQUFPLE1BQU0sV0FBb0I7RUFDL0IsTUFBTTtFQUNOLFNBQVMsQ0FBQztFQUNWLFNBQVM7SUFDUCxNQUFNO0lBQ04sTUFBTTtJQUNOLFVBQVU7SUFDVixNQUFNO0lBQ04sWUFBWTtJQUNaLGdCQUFnQjtFQUNsQjtBQUNGLEVBQUU7QUFFRixtQ0FBbUMsR0FDbkMsZUFBZSxTQUFVLFdBQXFCO0VBQzVDLE1BQU0sVUFBVSxNQUFNLFVBQVU7RUFFaEMsT0FBTyxDQUFDO0lBQ04sTUFBTSxnQkFBZ0IsT0FBTyxJQUFJLENBQUMsUUFBUSxPQUFPLEVBQUUsS0FBSztJQUV4RCxLQUFLLE1BQU0sQ0FBQyxRQUFRLElBQUksRUFBRTtJQUUxQixTQUFTLE9BQ1AsSUFBbUIsRUFDbkIsVUFBVSxNQUFNLEVBQ2hCLE9BQU8sYUFBYTtNQUVwQixJQUFJLENBQUMsTUFBTTtRQUNUO01BQ0Y7TUFFQSxJQUFJLFNBQVMsT0FBTztRQUNsQixPQUFPLElBQUk7TUFDYixPQUFPLElBQUksQ0FBQyxDQUFDLGdCQUFnQixJQUFJLEdBQUc7UUFDbEMsT0FBTyxJQUFJLEtBQUs7TUFDbEI7TUFFQSxNQUFNLE9BQU8sUUFBUSxPQUFPLENBQUMsUUFBUSxJQUFJO01BQ3pDLE1BQU0sU0FBUyxPQUFPLFFBQVEsT0FBTyxDQUFDLEtBQUssR0FBRztNQUU5QyxJQUFJLFlBQVksZUFBZTtRQUM3QixPQUFPLG9CQUFvQixNQUFNO1VBQUU7UUFBTztNQUM1QyxPQUFPLElBQUksWUFBWSxzQkFBc0I7UUFDM0MsT0FBTywwQkFBMEIsTUFBTTtVQUFFO1FBQU87TUFDbEQsT0FBTztRQUNMLE9BQU8sT0FBTyxNQUFNLE1BQU07VUFBRTtRQUFPO01BQ3JDO0lBQ0Y7RUFDRjtBQUNGIn0=