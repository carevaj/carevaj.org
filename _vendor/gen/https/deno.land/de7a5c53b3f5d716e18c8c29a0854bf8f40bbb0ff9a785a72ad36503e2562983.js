import { posix } from "../deps/path.ts";
import modifyUrls from "./modify_urls.ts";
import { normalizePath } from "../core/utils/path.ts";
/** A plugin to convert links to source files to the final page */ export default function() {
  return (site)=>{
    const cache = new Map();
    site.addEventListener("beforeUpdate", ()=>cache.clear());
    site.use(modifyUrls({
      fn (url, page) {
        // It's a pretty url or absolute url, so we don't need to do anything
        if (ignore(url)) {
          return url;
        }
        let [file, rest] = getPathInfo(url);
        if (!file.startsWith("~")) {
          file = posix.resolve(posix.dirname(normalizePath(page.src.path)), file);
        }
        if (cache.has(file)) {
          const cached = cache.get(file);
          return cached ? cached + rest : url;
        }
        try {
          const resolved = file.startsWith("~") ? site.url(file) : site.url(`~${file}`);
          cache.set(file, resolved);
          return resolved + rest;
        } catch  {
          cache.set(file, null);
        }
        return url;
      }
    }));
  };
}
/**
 * Split the filename and the extra content (query or hash) from a path
 * Example: "/foo.md?hello=world" => ["/foo.md", "?hello=world"]
 * Example: "/foo.md#hello=world" => ["/foo.md", "#hello=world"]
 */ export function getPathInfo(path) {
  let file = path, rest = "";
  if (path.includes("?")) {
    [file, rest] = path.split("?", 2);
    rest = `?${rest}`;
  } else if (path.includes("#")) {
    [file, rest] = path.split("#", 2);
    rest = `#${rest}`;
  }
  return [
    file,
    rest
  ];
}
function ignore(url) {
  return !url || url.startsWith("?") || url.startsWith("#") || url.startsWith("data:") || url.includes("//") || url.endsWith("/") && !url.startsWith("~"); // Pretty url
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvbHVtZUB2Mi4yLjAvcGx1Z2lucy9yZXNvbHZlX3VybHMudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgcG9zaXggfSBmcm9tIFwiLi4vZGVwcy9wYXRoLnRzXCI7XG5pbXBvcnQgbW9kaWZ5VXJscyBmcm9tIFwiLi9tb2RpZnlfdXJscy50c1wiO1xuaW1wb3J0IHsgbm9ybWFsaXplUGF0aCB9IGZyb20gXCIuLi9jb3JlL3V0aWxzL3BhdGgudHNcIjtcblxuaW1wb3J0IHR5cGUgU2l0ZSBmcm9tIFwiLi4vY29yZS9zaXRlLnRzXCI7XG5cbi8qKiBBIHBsdWdpbiB0byBjb252ZXJ0IGxpbmtzIHRvIHNvdXJjZSBmaWxlcyB0byB0aGUgZmluYWwgcGFnZSAqL1xuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gKCkge1xuICByZXR1cm4gKHNpdGU6IFNpdGUpID0+IHtcbiAgICBjb25zdCBjYWNoZSA9IG5ldyBNYXA8c3RyaW5nLCBzdHJpbmcgfCBudWxsPigpO1xuXG4gICAgc2l0ZS5hZGRFdmVudExpc3RlbmVyKFwiYmVmb3JlVXBkYXRlXCIsICgpID0+IGNhY2hlLmNsZWFyKCkpO1xuXG4gICAgc2l0ZS51c2UobW9kaWZ5VXJscyh7XG4gICAgICBmbih1cmwsIHBhZ2UpIHtcbiAgICAgICAgLy8gSXQncyBhIHByZXR0eSB1cmwgb3IgYWJzb2x1dGUgdXJsLCBzbyB3ZSBkb24ndCBuZWVkIHRvIGRvIGFueXRoaW5nXG4gICAgICAgIGlmIChpZ25vcmUodXJsKSkge1xuICAgICAgICAgIHJldHVybiB1cmw7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgW2ZpbGUsIHJlc3RdID0gZ2V0UGF0aEluZm8odXJsKTtcblxuICAgICAgICBpZiAoIWZpbGUuc3RhcnRzV2l0aChcIn5cIikpIHtcbiAgICAgICAgICBmaWxlID0gcG9zaXgucmVzb2x2ZShcbiAgICAgICAgICAgIHBvc2l4LmRpcm5hbWUobm9ybWFsaXplUGF0aChwYWdlLnNyYy5wYXRoKSksXG4gICAgICAgICAgICBmaWxlLFxuICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoY2FjaGUuaGFzKGZpbGUpKSB7XG4gICAgICAgICAgY29uc3QgY2FjaGVkID0gY2FjaGUuZ2V0KGZpbGUpO1xuICAgICAgICAgIHJldHVybiBjYWNoZWQgPyBjYWNoZWQgKyByZXN0IDogdXJsO1xuICAgICAgICB9XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBjb25zdCByZXNvbHZlZCA9IGZpbGUuc3RhcnRzV2l0aChcIn5cIilcbiAgICAgICAgICAgID8gc2l0ZS51cmwoZmlsZSlcbiAgICAgICAgICAgIDogc2l0ZS51cmwoYH4ke2ZpbGV9YCk7XG5cbiAgICAgICAgICBjYWNoZS5zZXQoZmlsZSwgcmVzb2x2ZWQpO1xuICAgICAgICAgIHJldHVybiByZXNvbHZlZCArIHJlc3Q7XG4gICAgICAgIH0gY2F0Y2gge1xuICAgICAgICAgIGNhY2hlLnNldChmaWxlLCBudWxsKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB1cmw7XG4gICAgICB9LFxuICAgIH0pKTtcbiAgfTtcbn1cblxuLyoqXG4gKiBTcGxpdCB0aGUgZmlsZW5hbWUgYW5kIHRoZSBleHRyYSBjb250ZW50IChxdWVyeSBvciBoYXNoKSBmcm9tIGEgcGF0aFxuICogRXhhbXBsZTogXCIvZm9vLm1kP2hlbGxvPXdvcmxkXCIgPT4gW1wiL2Zvby5tZFwiLCBcIj9oZWxsbz13b3JsZFwiXVxuICogRXhhbXBsZTogXCIvZm9vLm1kI2hlbGxvPXdvcmxkXCIgPT4gW1wiL2Zvby5tZFwiLCBcIiNoZWxsbz13b3JsZFwiXVxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0UGF0aEluZm8ocGF0aDogc3RyaW5nKTogW3N0cmluZywgc3RyaW5nXSB7XG4gIGxldCBmaWxlID0gcGF0aCwgcmVzdCA9IFwiXCI7XG5cbiAgaWYgKHBhdGguaW5jbHVkZXMoXCI/XCIpKSB7XG4gICAgW2ZpbGUsIHJlc3RdID0gcGF0aC5zcGxpdChcIj9cIiwgMik7XG4gICAgcmVzdCA9IGA/JHtyZXN0fWA7XG4gIH0gZWxzZSBpZiAocGF0aC5pbmNsdWRlcyhcIiNcIikpIHtcbiAgICBbZmlsZSwgcmVzdF0gPSBwYXRoLnNwbGl0KFwiI1wiLCAyKTtcbiAgICByZXN0ID0gYCMke3Jlc3R9YDtcbiAgfVxuXG4gIHJldHVybiBbZmlsZSwgcmVzdF07XG59XG5cbmZ1bmN0aW9uIGlnbm9yZSh1cmw6IHN0cmluZykge1xuICByZXR1cm4gIXVybCB8fFxuICAgIHVybC5zdGFydHNXaXRoKFwiP1wiKSB8fFxuICAgIHVybC5zdGFydHNXaXRoKFwiI1wiKSB8fFxuICAgIHVybC5zdGFydHNXaXRoKFwiZGF0YTpcIikgfHxcbiAgICB1cmwuaW5jbHVkZXMoXCIvL1wiKSB8fFxuICAgICh1cmwuZW5kc1dpdGgoXCIvXCIpICYmICF1cmwuc3RhcnRzV2l0aChcIn5cIikpOyAvLyBQcmV0dHkgdXJsXG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsU0FBUyxLQUFLLFFBQVEsa0JBQWtCO0FBQ3hDLE9BQU8sZ0JBQWdCLG1CQUFtQjtBQUMxQyxTQUFTLGFBQWEsUUFBUSx3QkFBd0I7QUFJdEQsZ0VBQWdFLEdBQ2hFLGVBQWU7RUFDYixPQUFPLENBQUM7SUFDTixNQUFNLFFBQVEsSUFBSTtJQUVsQixLQUFLLGdCQUFnQixDQUFDLGdCQUFnQixJQUFNLE1BQU0sS0FBSztJQUV2RCxLQUFLLEdBQUcsQ0FBQyxXQUFXO01BQ2xCLElBQUcsR0FBRyxFQUFFLElBQUk7UUFDVixxRUFBcUU7UUFDckUsSUFBSSxPQUFPLE1BQU07VUFDZixPQUFPO1FBQ1Q7UUFFQSxJQUFJLENBQUMsTUFBTSxLQUFLLEdBQUcsWUFBWTtRQUUvQixJQUFJLENBQUMsS0FBSyxVQUFVLENBQUMsTUFBTTtVQUN6QixPQUFPLE1BQU0sT0FBTyxDQUNsQixNQUFNLE9BQU8sQ0FBQyxjQUFjLEtBQUssR0FBRyxDQUFDLElBQUksSUFDekM7UUFFSjtRQUVBLElBQUksTUFBTSxHQUFHLENBQUMsT0FBTztVQUNuQixNQUFNLFNBQVMsTUFBTSxHQUFHLENBQUM7VUFDekIsT0FBTyxTQUFTLFNBQVMsT0FBTztRQUNsQztRQUVBLElBQUk7VUFDRixNQUFNLFdBQVcsS0FBSyxVQUFVLENBQUMsT0FDN0IsS0FBSyxHQUFHLENBQUMsUUFDVCxLQUFLLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxLQUFLLENBQUM7VUFFdkIsTUFBTSxHQUFHLENBQUMsTUFBTTtVQUNoQixPQUFPLFdBQVc7UUFDcEIsRUFBRSxPQUFNO1VBQ04sTUFBTSxHQUFHLENBQUMsTUFBTTtRQUNsQjtRQUVBLE9BQU87TUFDVDtJQUNGO0VBQ0Y7QUFDRjtBQUVBOzs7O0NBSUMsR0FDRCxPQUFPLFNBQVMsWUFBWSxJQUFZO0VBQ3RDLElBQUksT0FBTyxNQUFNLE9BQU87RUFFeEIsSUFBSSxLQUFLLFFBQVEsQ0FBQyxNQUFNO0lBQ3RCLENBQUMsTUFBTSxLQUFLLEdBQUcsS0FBSyxLQUFLLENBQUMsS0FBSztJQUMvQixPQUFPLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQztFQUNuQixPQUFPLElBQUksS0FBSyxRQUFRLENBQUMsTUFBTTtJQUM3QixDQUFDLE1BQU0sS0FBSyxHQUFHLEtBQUssS0FBSyxDQUFDLEtBQUs7SUFDL0IsT0FBTyxDQUFDLENBQUMsRUFBRSxLQUFLLENBQUM7RUFDbkI7RUFFQSxPQUFPO0lBQUM7SUFBTTtHQUFLO0FBQ3JCO0FBRUEsU0FBUyxPQUFPLEdBQVc7RUFDekIsT0FBTyxDQUFDLE9BQ04sSUFBSSxVQUFVLENBQUMsUUFDZixJQUFJLFVBQVUsQ0FBQyxRQUNmLElBQUksVUFBVSxDQUFDLFlBQ2YsSUFBSSxRQUFRLENBQUMsU0FDWixJQUFJLFFBQVEsQ0FBQyxRQUFRLENBQUMsSUFBSSxVQUFVLENBQUMsTUFBTyxhQUFhO0FBQzlEIn0=