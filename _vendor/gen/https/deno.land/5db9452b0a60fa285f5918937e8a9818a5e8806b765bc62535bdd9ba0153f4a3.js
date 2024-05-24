import loader from "../core/loaders/module.ts";
import { merge } from "../core/utils/object.ts";
// Default options
export const defaults = {
  extensions: [
    ".js",
    ".ts"
  ],
  pageSubExtension: ".page"
};
/** Template engine to render js/ts files */ export class ModuleEngine {
  helpers = {};
  includes;
  constructor(includes){
    this.includes = includes;
  }
  deleteCache() {}
  async render(content, data) {
    return typeof content === "function" ? await content(data, this.helpers) : content;
  }
  renderComponent(content, data) {
    return typeof content === "function" ? content(data, this.helpers) : content;
  }
  addHelper(name, fn) {
    this.helpers[name] = fn;
  }
}
/** Register the plugin to load JavaScript/TypeScript modules */ export default function(userOptions) {
  return (site)=>{
    const options = merge({
      ...defaults,
      includes: site.options.includes
    }, userOptions);
    const engine = new ModuleEngine(options.includes);
    // Ignore includes folder
    if (options.includes) {
      site.ignore(options.includes);
    }
    // Load the _data files
    site.loadData(options.extensions, loader);
    // Load the pages and register the engine
    site.loadPages(options.extensions, {
      loader,
      engine,
      pageSubExtension: options.pageSubExtension
    });
  };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvbHVtZUB2Mi4yLjAvcGx1Z2lucy9tb2R1bGVzLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBsb2FkZXIgZnJvbSBcIi4uL2NvcmUvbG9hZGVycy9tb2R1bGUudHNcIjtcbmltcG9ydCB7IG1lcmdlIH0gZnJvbSBcIi4uL2NvcmUvdXRpbHMvb2JqZWN0LnRzXCI7XG5cbmltcG9ydCB0eXBlIFNpdGUgZnJvbSBcIi4uL2NvcmUvc2l0ZS50c1wiO1xuaW1wb3J0IHR5cGUgeyBFbmdpbmUsIEhlbHBlciB9IGZyb20gXCIuLi9jb3JlL3JlbmRlcmVyLnRzXCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgT3B0aW9ucyB7XG4gIC8qKiBUaGUgbGlzdCBvZiBleHRlbnNpb25zIHRoaXMgcGx1Z2luIGFwcGxpZXMgdG8gKi9cbiAgZXh0ZW5zaW9ucz86IHN0cmluZ1tdO1xuXG4gIC8qKiBPcHRpb25hbCBzdWItZXh0ZW5zaW9uIGZvciBwYWdlIGZpbGVzICovXG4gIHBhZ2VTdWJFeHRlbnNpb24/OiBzdHJpbmc7XG5cbiAgLyoqXG4gICAqIEN1c3RvbSBpbmNsdWRlcyBwYXRoXG4gICAqIEBkZWZhdWx0IGBzaXRlLm9wdGlvbnMuaW5jbHVkZXNgXG4gICAqL1xuICBpbmNsdWRlcz86IHN0cmluZztcbn1cblxuLy8gRGVmYXVsdCBvcHRpb25zXG5leHBvcnQgY29uc3QgZGVmYXVsdHM6IE9wdGlvbnMgPSB7XG4gIGV4dGVuc2lvbnM6IFtcIi5qc1wiLCBcIi50c1wiXSxcbiAgcGFnZVN1YkV4dGVuc2lvbjogXCIucGFnZVwiLFxufTtcblxuLyoqIFRlbXBsYXRlIGVuZ2luZSB0byByZW5kZXIganMvdHMgZmlsZXMgKi9cbmV4cG9ydCBjbGFzcyBNb2R1bGVFbmdpbmUgaW1wbGVtZW50cyBFbmdpbmUge1xuICBoZWxwZXJzOiBSZWNvcmQ8c3RyaW5nLCBIZWxwZXI+ID0ge307XG4gIGluY2x1ZGVzOiBzdHJpbmc7XG5cbiAgY29uc3RydWN0b3IoaW5jbHVkZXM6IHN0cmluZykge1xuICAgIHRoaXMuaW5jbHVkZXMgPSBpbmNsdWRlcztcbiAgfVxuXG4gIGRlbGV0ZUNhY2hlKCkge31cblxuICBhc3luYyByZW5kZXIoXG4gICAgY29udGVudDogdW5rbm93bixcbiAgICBkYXRhOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPixcbiAgKTogUHJvbWlzZTx1bmtub3duPiB7XG4gICAgcmV0dXJuIHR5cGVvZiBjb250ZW50ID09PSBcImZ1bmN0aW9uXCJcbiAgICAgID8gYXdhaXQgY29udGVudChkYXRhLCB0aGlzLmhlbHBlcnMpXG4gICAgICA6IGNvbnRlbnQ7XG4gIH1cblxuICByZW5kZXJDb21wb25lbnQoY29udGVudDogdW5rbm93biwgZGF0YTogUmVjb3JkPHN0cmluZywgdW5rbm93bj4pOiBzdHJpbmcge1xuICAgIHJldHVybiB0eXBlb2YgY29udGVudCA9PT0gXCJmdW5jdGlvblwiXG4gICAgICA/IGNvbnRlbnQoZGF0YSwgdGhpcy5oZWxwZXJzKVxuICAgICAgOiBjb250ZW50O1xuICB9XG5cbiAgYWRkSGVscGVyKG5hbWU6IHN0cmluZywgZm46IEhlbHBlcikge1xuICAgIHRoaXMuaGVscGVyc1tuYW1lXSA9IGZuO1xuICB9XG59XG5cbi8qKiBSZWdpc3RlciB0aGUgcGx1Z2luIHRvIGxvYWQgSmF2YVNjcmlwdC9UeXBlU2NyaXB0IG1vZHVsZXMgKi9cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uICh1c2VyT3B0aW9ucz86IE9wdGlvbnMpIHtcbiAgcmV0dXJuIChzaXRlOiBTaXRlKSA9PiB7XG4gICAgY29uc3Qgb3B0aW9ucyA9IG1lcmdlKFxuICAgICAgeyAuLi5kZWZhdWx0cywgaW5jbHVkZXM6IHNpdGUub3B0aW9ucy5pbmNsdWRlcyB9LFxuICAgICAgdXNlck9wdGlvbnMsXG4gICAgKTtcblxuICAgIGNvbnN0IGVuZ2luZSA9IG5ldyBNb2R1bGVFbmdpbmUob3B0aW9ucy5pbmNsdWRlcyk7XG5cbiAgICAvLyBJZ25vcmUgaW5jbHVkZXMgZm9sZGVyXG4gICAgaWYgKG9wdGlvbnMuaW5jbHVkZXMpIHtcbiAgICAgIHNpdGUuaWdub3JlKG9wdGlvbnMuaW5jbHVkZXMpO1xuICAgIH1cblxuICAgIC8vIExvYWQgdGhlIF9kYXRhIGZpbGVzXG4gICAgc2l0ZS5sb2FkRGF0YShvcHRpb25zLmV4dGVuc2lvbnMsIGxvYWRlcik7XG5cbiAgICAvLyBMb2FkIHRoZSBwYWdlcyBhbmQgcmVnaXN0ZXIgdGhlIGVuZ2luZVxuICAgIHNpdGUubG9hZFBhZ2VzKG9wdGlvbnMuZXh0ZW5zaW9ucywge1xuICAgICAgbG9hZGVyLFxuICAgICAgZW5naW5lLFxuICAgICAgcGFnZVN1YkV4dGVuc2lvbjogb3B0aW9ucy5wYWdlU3ViRXh0ZW5zaW9uLFxuICAgIH0pO1xuICB9O1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sWUFBWSw0QkFBNEI7QUFDL0MsU0FBUyxLQUFLLFFBQVEsMEJBQTBCO0FBbUJoRCxrQkFBa0I7QUFDbEIsT0FBTyxNQUFNLFdBQW9CO0VBQy9CLFlBQVk7SUFBQztJQUFPO0dBQU07RUFDMUIsa0JBQWtCO0FBQ3BCLEVBQUU7QUFFRiwwQ0FBMEMsR0FDMUMsT0FBTyxNQUFNO0VBQ1gsVUFBa0MsQ0FBQyxFQUFFO0VBQ3JDLFNBQWlCO0VBRWpCLFlBQVksUUFBZ0IsQ0FBRTtJQUM1QixJQUFJLENBQUMsUUFBUSxHQUFHO0VBQ2xCO0VBRUEsY0FBYyxDQUFDO0VBRWYsTUFBTSxPQUNKLE9BQWdCLEVBQ2hCLElBQTZCLEVBQ1g7SUFDbEIsT0FBTyxPQUFPLFlBQVksYUFDdEIsTUFBTSxRQUFRLE1BQU0sSUFBSSxDQUFDLE9BQU8sSUFDaEM7RUFDTjtFQUVBLGdCQUFnQixPQUFnQixFQUFFLElBQTZCLEVBQVU7SUFDdkUsT0FBTyxPQUFPLFlBQVksYUFDdEIsUUFBUSxNQUFNLElBQUksQ0FBQyxPQUFPLElBQzFCO0VBQ047RUFFQSxVQUFVLElBQVksRUFBRSxFQUFVLEVBQUU7SUFDbEMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEdBQUc7RUFDdkI7QUFDRjtBQUVBLDhEQUE4RCxHQUM5RCxlQUFlLFNBQVUsV0FBcUI7RUFDNUMsT0FBTyxDQUFDO0lBQ04sTUFBTSxVQUFVLE1BQ2Q7TUFBRSxHQUFHLFFBQVE7TUFBRSxVQUFVLEtBQUssT0FBTyxDQUFDLFFBQVE7SUFBQyxHQUMvQztJQUdGLE1BQU0sU0FBUyxJQUFJLGFBQWEsUUFBUSxRQUFRO0lBRWhELHlCQUF5QjtJQUN6QixJQUFJLFFBQVEsUUFBUSxFQUFFO01BQ3BCLEtBQUssTUFBTSxDQUFDLFFBQVEsUUFBUTtJQUM5QjtJQUVBLHVCQUF1QjtJQUN2QixLQUFLLFFBQVEsQ0FBQyxRQUFRLFVBQVUsRUFBRTtJQUVsQyx5Q0FBeUM7SUFDekMsS0FBSyxTQUFTLENBQUMsUUFBUSxVQUFVLEVBQUU7TUFDakM7TUFDQTtNQUNBLGtCQUFrQixRQUFRLGdCQUFnQjtJQUM1QztFQUNGO0FBQ0YifQ==