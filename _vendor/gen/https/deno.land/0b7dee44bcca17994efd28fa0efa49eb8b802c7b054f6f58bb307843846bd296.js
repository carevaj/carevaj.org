import { minify } from "../deps/terser.ts";
import { merge } from "../core/utils/object.ts";
import { prepareAsset, saveAsset } from "./source_maps.ts";
// Default options
export const defaults = {
  extensions: [
    ".js"
  ],
  options: {
    module: true,
    compress: true,
    mangle: true
  }
};
/** A plugin to load all JavaScript files and minify them using Terser */ export default function(userOptions) {
  const options = merge(defaults, userOptions);
  return (site)=>{
    site.loadAssets(options.extensions);
    site.process(options.extensions, (pages)=>pages.forEach(terser));
    site.filter("terser", filter, true);
    async function terser(page) {
      const { content, filename, sourceMap, enableSourceMap } = prepareAsset(site, page);
      const terserOptions = {
        ...options.options,
        sourceMap: enableSourceMap ? {
          content: JSON.stringify(sourceMap),
          filename: filename
        } : undefined
      };
      try {
        const output = await minify({
          [filename]: content
        }, terserOptions);
        saveAsset(site, page, output.code, // @ts-expect-error: terser uses @jridgewell/gen-mapping, which incorrectly has typed some types as nullable: https://github.com/jridgewell/gen-mapping/pull/9
        output.map);
      } catch (cause) {
        throw new Error(`Error processing the file: ${filename} by the Terser plugin.`, {
          cause
        });
      }
    }
    async function filter(code) {
      const output = await minify(code, options.options);
      return output.code;
    }
  };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvbHVtZUB2Mi4yLjAvcGx1Z2lucy90ZXJzZXIudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgbWluaWZ5IH0gZnJvbSBcIi4uL2RlcHMvdGVyc2VyLnRzXCI7XG5pbXBvcnQgeyBtZXJnZSB9IGZyb20gXCIuLi9jb3JlL3V0aWxzL29iamVjdC50c1wiO1xuaW1wb3J0IHsgUGFnZSB9IGZyb20gXCIuLi9jb3JlL2ZpbGUudHNcIjtcbmltcG9ydCB7IHByZXBhcmVBc3NldCwgc2F2ZUFzc2V0IH0gZnJvbSBcIi4vc291cmNlX21hcHMudHNcIjtcblxuaW1wb3J0IHR5cGUgU2l0ZSBmcm9tIFwiLi4vY29yZS9zaXRlLnRzXCI7XG5pbXBvcnQgdHlwZSB7IE1pbmlmeU9wdGlvbnMgfSBmcm9tIFwiLi4vZGVwcy90ZXJzZXIudHNcIjtcblxuZXhwb3J0IGludGVyZmFjZSBPcHRpb25zIHtcbiAgLyoqIFRoZSBsaXN0IG9mIGV4dGVuc2lvbnMgdGhpcyBwbHVnaW4gYXBwbGllcyB0byAqL1xuICBleHRlbnNpb25zPzogc3RyaW5nW107XG5cbiAgLyoqXG4gICAqIE9wdGlvbnMgcGFzc2VkIHRvIGB0ZXJzZXJgXG4gICAqIEBzZWUgaHR0cHM6Ly90ZXJzZXIub3JnL2RvY3MvYXBpLXJlZmVyZW5jZS8jbWluaWZ5LW9wdGlvbnNcbiAgICovXG4gIG9wdGlvbnM/OiBNaW5pZnlPcHRpb25zO1xufVxuXG4vLyBEZWZhdWx0IG9wdGlvbnNcbmV4cG9ydCBjb25zdCBkZWZhdWx0czogT3B0aW9ucyA9IHtcbiAgZXh0ZW5zaW9uczogW1wiLmpzXCJdLFxuICBvcHRpb25zOiB7XG4gICAgbW9kdWxlOiB0cnVlLFxuICAgIGNvbXByZXNzOiB0cnVlLFxuICAgIG1hbmdsZTogdHJ1ZSxcbiAgfSxcbn07XG5cbi8qKiBBIHBsdWdpbiB0byBsb2FkIGFsbCBKYXZhU2NyaXB0IGZpbGVzIGFuZCBtaW5pZnkgdGhlbSB1c2luZyBUZXJzZXIgKi9cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uICh1c2VyT3B0aW9ucz86IE9wdGlvbnMpIHtcbiAgY29uc3Qgb3B0aW9ucyA9IG1lcmdlKGRlZmF1bHRzLCB1c2VyT3B0aW9ucyk7XG5cbiAgcmV0dXJuIChzaXRlOiBTaXRlKSA9PiB7XG4gICAgc2l0ZS5sb2FkQXNzZXRzKG9wdGlvbnMuZXh0ZW5zaW9ucyk7XG4gICAgc2l0ZS5wcm9jZXNzKG9wdGlvbnMuZXh0ZW5zaW9ucywgKHBhZ2VzKSA9PiBwYWdlcy5mb3JFYWNoKHRlcnNlcikpO1xuICAgIHNpdGUuZmlsdGVyKFwidGVyc2VyXCIsIGZpbHRlciwgdHJ1ZSk7XG5cbiAgICBhc3luYyBmdW5jdGlvbiB0ZXJzZXIocGFnZTogUGFnZSkge1xuICAgICAgY29uc3QgeyBjb250ZW50LCBmaWxlbmFtZSwgc291cmNlTWFwLCBlbmFibGVTb3VyY2VNYXAgfSA9IHByZXBhcmVBc3NldChcbiAgICAgICAgc2l0ZSxcbiAgICAgICAgcGFnZSxcbiAgICAgICk7XG5cbiAgICAgIGNvbnN0IHRlcnNlck9wdGlvbnMgPSB7XG4gICAgICAgIC4uLm9wdGlvbnMub3B0aW9ucyxcbiAgICAgICAgc291cmNlTWFwOiBlbmFibGVTb3VyY2VNYXBcbiAgICAgICAgICA/IHtcbiAgICAgICAgICAgIGNvbnRlbnQ6IEpTT04uc3RyaW5naWZ5KHNvdXJjZU1hcCksXG4gICAgICAgICAgICBmaWxlbmFtZTogZmlsZW5hbWUsXG4gICAgICAgICAgfVxuICAgICAgICAgIDogdW5kZWZpbmVkLFxuICAgICAgfTtcblxuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3Qgb3V0cHV0ID0gYXdhaXQgbWluaWZ5KHsgW2ZpbGVuYW1lXTogY29udGVudCB9LCB0ZXJzZXJPcHRpb25zKTtcbiAgICAgICAgc2F2ZUFzc2V0KFxuICAgICAgICAgIHNpdGUsXG4gICAgICAgICAgcGFnZSxcbiAgICAgICAgICBvdXRwdXQuY29kZSEsXG4gICAgICAgICAgLy8gQHRzLWV4cGVjdC1lcnJvcjogdGVyc2VyIHVzZXMgQGpyaWRnZXdlbGwvZ2VuLW1hcHBpbmcsIHdoaWNoIGluY29ycmVjdGx5IGhhcyB0eXBlZCBzb21lIHR5cGVzIGFzIG51bGxhYmxlOiBodHRwczovL2dpdGh1Yi5jb20vanJpZGdld2VsbC9nZW4tbWFwcGluZy9wdWxsLzlcbiAgICAgICAgICBvdXRwdXQubWFwLFxuICAgICAgICApO1xuICAgICAgfSBjYXRjaCAoY2F1c2UpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgIGBFcnJvciBwcm9jZXNzaW5nIHRoZSBmaWxlOiAke2ZpbGVuYW1lfSBieSB0aGUgVGVyc2VyIHBsdWdpbi5gLFxuICAgICAgICAgIHsgY2F1c2UgfSxcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBhc3luYyBmdW5jdGlvbiBmaWx0ZXIoY29kZTogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmcgfCB1bmRlZmluZWQ+IHtcbiAgICAgIGNvbnN0IG91dHB1dCA9IGF3YWl0IG1pbmlmeShjb2RlLCBvcHRpb25zLm9wdGlvbnMpO1xuICAgICAgcmV0dXJuIG91dHB1dC5jb2RlO1xuICAgIH1cbiAgfTtcbn1cblxuLyoqIEV4dGVuZHMgSGVscGVycyBpbnRlcmZhY2UgKi9cbmRlY2xhcmUgZ2xvYmFsIHtcbiAgbmFtZXNwYWNlIEx1bWUge1xuICAgIGV4cG9ydCBpbnRlcmZhY2UgSGVscGVycyB7XG4gICAgICAvKiogQHNlZSBodHRwczovL2x1bWUubGFuZC9wbHVnaW5zL3RlcnNlci8jdGhlLXRlcnNlci1maWx0ZXIgKi9cbiAgICAgIHRlcnNlcjogKGNvZGU6IHN0cmluZykgPT4gUHJvbWlzZTxzdHJpbmcgfCB1bmRlZmluZWQ+O1xuICAgIH1cbiAgfVxufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFNBQVMsTUFBTSxRQUFRLG9CQUFvQjtBQUMzQyxTQUFTLEtBQUssUUFBUSwwQkFBMEI7QUFFaEQsU0FBUyxZQUFZLEVBQUUsU0FBUyxRQUFRLG1CQUFtQjtBQWdCM0Qsa0JBQWtCO0FBQ2xCLE9BQU8sTUFBTSxXQUFvQjtFQUMvQixZQUFZO0lBQUM7R0FBTTtFQUNuQixTQUFTO0lBQ1AsUUFBUTtJQUNSLFVBQVU7SUFDVixRQUFRO0VBQ1Y7QUFDRixFQUFFO0FBRUYsdUVBQXVFLEdBQ3ZFLGVBQWUsU0FBVSxXQUFxQjtFQUM1QyxNQUFNLFVBQVUsTUFBTSxVQUFVO0VBRWhDLE9BQU8sQ0FBQztJQUNOLEtBQUssVUFBVSxDQUFDLFFBQVEsVUFBVTtJQUNsQyxLQUFLLE9BQU8sQ0FBQyxRQUFRLFVBQVUsRUFBRSxDQUFDLFFBQVUsTUFBTSxPQUFPLENBQUM7SUFDMUQsS0FBSyxNQUFNLENBQUMsVUFBVSxRQUFRO0lBRTlCLGVBQWUsT0FBTyxJQUFVO01BQzlCLE1BQU0sRUFBRSxPQUFPLEVBQUUsUUFBUSxFQUFFLFNBQVMsRUFBRSxlQUFlLEVBQUUsR0FBRyxhQUN4RCxNQUNBO01BR0YsTUFBTSxnQkFBZ0I7UUFDcEIsR0FBRyxRQUFRLE9BQU87UUFDbEIsV0FBVyxrQkFDUDtVQUNBLFNBQVMsS0FBSyxTQUFTLENBQUM7VUFDeEIsVUFBVTtRQUNaLElBQ0U7TUFDTjtNQUVBLElBQUk7UUFDRixNQUFNLFNBQVMsTUFBTSxPQUFPO1VBQUUsQ0FBQyxTQUFTLEVBQUU7UUFBUSxHQUFHO1FBQ3JELFVBQ0UsTUFDQSxNQUNBLE9BQU8sSUFBSSxFQUNYLDhKQUE4SjtRQUM5SixPQUFPLEdBQUc7TUFFZCxFQUFFLE9BQU8sT0FBTztRQUNkLE1BQU0sSUFBSSxNQUNSLENBQUMsMkJBQTJCLEVBQUUsU0FBUyxzQkFBc0IsQ0FBQyxFQUM5RDtVQUFFO1FBQU07TUFFWjtJQUNGO0lBRUEsZUFBZSxPQUFPLElBQVk7TUFDaEMsTUFBTSxTQUFTLE1BQU0sT0FBTyxNQUFNLFFBQVEsT0FBTztNQUNqRCxPQUFPLE9BQU8sSUFBSTtJQUNwQjtFQUNGO0FBQ0YifQ==