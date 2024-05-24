import { posix } from "../deps/path.ts";
import modifyUrls from "./modify_urls.ts";
/** A plugin to convert all internal URLs to relative */ export default function() {
  return (site)=>{
    const basePath = site.options.location.pathname;
    site.use(modifyUrls({
      fn (url, page) {
        if (!url.startsWith("/") || url.startsWith("//")) {
          return url;
        }
        if (!url.startsWith(basePath)) {
          url = posix.join(basePath, url);
        }
        const from = site.url(page.outputPath);
        return posix.relative(posix.dirname(from), url);
      }
    }));
  };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvbHVtZUB2Mi4yLjAvcGx1Z2lucy9yZWxhdGl2ZV91cmxzLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IHBvc2l4IH0gZnJvbSBcIi4uL2RlcHMvcGF0aC50c1wiO1xuaW1wb3J0IG1vZGlmeVVybHMgZnJvbSBcIi4vbW9kaWZ5X3VybHMudHNcIjtcblxuaW1wb3J0IHR5cGUgU2l0ZSBmcm9tIFwiLi4vY29yZS9zaXRlLnRzXCI7XG5cbi8qKiBBIHBsdWdpbiB0byBjb252ZXJ0IGFsbCBpbnRlcm5hbCBVUkxzIHRvIHJlbGF0aXZlICovXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiAoc2l0ZTogU2l0ZSkgPT4ge1xuICAgIGNvbnN0IGJhc2VQYXRoID0gc2l0ZS5vcHRpb25zLmxvY2F0aW9uLnBhdGhuYW1lO1xuXG4gICAgc2l0ZS51c2UobW9kaWZ5VXJscyh7XG4gICAgICBmbih1cmwsIHBhZ2UpIHtcbiAgICAgICAgaWYgKCF1cmwuc3RhcnRzV2l0aChcIi9cIikgfHwgdXJsLnN0YXJ0c1dpdGgoXCIvL1wiKSkge1xuICAgICAgICAgIHJldHVybiB1cmw7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIXVybC5zdGFydHNXaXRoKGJhc2VQYXRoKSkge1xuICAgICAgICAgIHVybCA9IHBvc2l4LmpvaW4oYmFzZVBhdGgsIHVybCk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBmcm9tID0gc2l0ZS51cmwocGFnZS5vdXRwdXRQYXRoKTtcbiAgICAgICAgcmV0dXJuIHBvc2l4LnJlbGF0aXZlKHBvc2l4LmRpcm5hbWUoZnJvbSksIHVybCk7XG4gICAgICB9LFxuICAgIH0pKTtcbiAgfTtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxTQUFTLEtBQUssUUFBUSxrQkFBa0I7QUFDeEMsT0FBTyxnQkFBZ0IsbUJBQW1CO0FBSTFDLHNEQUFzRCxHQUN0RCxlQUFlO0VBQ2IsT0FBTyxDQUFDO0lBQ04sTUFBTSxXQUFXLEtBQUssT0FBTyxDQUFDLFFBQVEsQ0FBQyxRQUFRO0lBRS9DLEtBQUssR0FBRyxDQUFDLFdBQVc7TUFDbEIsSUFBRyxHQUFHLEVBQUUsSUFBSTtRQUNWLElBQUksQ0FBQyxJQUFJLFVBQVUsQ0FBQyxRQUFRLElBQUksVUFBVSxDQUFDLE9BQU87VUFDaEQsT0FBTztRQUNUO1FBRUEsSUFBSSxDQUFDLElBQUksVUFBVSxDQUFDLFdBQVc7VUFDN0IsTUFBTSxNQUFNLElBQUksQ0FBQyxVQUFVO1FBQzdCO1FBRUEsTUFBTSxPQUFPLEtBQUssR0FBRyxDQUFDLEtBQUssVUFBVTtRQUNyQyxPQUFPLE1BQU0sUUFBUSxDQUFDLE1BQU0sT0FBTyxDQUFDLE9BQU87TUFDN0M7SUFDRjtFQUNGO0FBQ0YifQ==