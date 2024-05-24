/** A list of the available plugins not installed by default */ export const pluginNames = [
  "attributes",
  "base_path",
  "code_highlight",
  "date",
  "decap_cms",
  "esbuild",
  "eta",
  "favicon",
  "feed",
  "fff",
  "filter_pages",
  "inline",
  "jsx",
  "jsx_preact",
  "katex",
  "lightningcss",
  "liquid",
  "mdx",
  "metas",
  "minify_html",
  "modify_urls",
  "multilanguage",
  "nav",
  "nunjucks",
  "og_images",
  "on_demand",
  "pagefind",
  "picture",
  "postcss",
  "prism",
  "pug",
  "reading_info",
  "redirects",
  "relations",
  "relative_urls",
  "remark",
  "resolve_urls",
  "robots",
  "sass",
  "sheets",
  "sitemap",
  "slugify_urls",
  "source_maps",
  "svgo",
  "tailwindcss",
  "terser",
  "transform_images",
  "toml",
  "unocss"
];
/** Returns the _config file of a site */ export async function getConfigFile(path, defaultPaths = [
  "_config.js",
  "_config.ts"
]) {
  if (path) {
    try {
      return await Deno.realPath(path);
    } catch  {
      throw new Error(`Config file not found (${path})`);
    }
  }
  for (const path of defaultPaths){
    try {
      return await Deno.realPath(path);
    } catch  {
    // Ignore
    }
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvbHVtZUB2Mi4yLjAvY29yZS91dGlscy9sdW1lX2NvbmZpZy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKiogQSBsaXN0IG9mIHRoZSBhdmFpbGFibGUgcGx1Z2lucyBub3QgaW5zdGFsbGVkIGJ5IGRlZmF1bHQgKi9cbmV4cG9ydCBjb25zdCBwbHVnaW5OYW1lcyA9IFtcbiAgXCJhdHRyaWJ1dGVzXCIsXG4gIFwiYmFzZV9wYXRoXCIsXG4gIFwiY29kZV9oaWdobGlnaHRcIixcbiAgXCJkYXRlXCIsXG4gIFwiZGVjYXBfY21zXCIsXG4gIFwiZXNidWlsZFwiLFxuICBcImV0YVwiLFxuICBcImZhdmljb25cIixcbiAgXCJmZWVkXCIsXG4gIFwiZmZmXCIsXG4gIFwiZmlsdGVyX3BhZ2VzXCIsXG4gIFwiaW5saW5lXCIsXG4gIFwianN4XCIsXG4gIFwianN4X3ByZWFjdFwiLFxuICBcImthdGV4XCIsXG4gIFwibGlnaHRuaW5nY3NzXCIsXG4gIFwibGlxdWlkXCIsXG4gIFwibWR4XCIsXG4gIFwibWV0YXNcIixcbiAgXCJtaW5pZnlfaHRtbFwiLFxuICBcIm1vZGlmeV91cmxzXCIsXG4gIFwibXVsdGlsYW5ndWFnZVwiLFxuICBcIm5hdlwiLFxuICBcIm51bmp1Y2tzXCIsXG4gIFwib2dfaW1hZ2VzXCIsXG4gIFwib25fZGVtYW5kXCIsXG4gIFwicGFnZWZpbmRcIixcbiAgXCJwaWN0dXJlXCIsXG4gIFwicG9zdGNzc1wiLFxuICBcInByaXNtXCIsXG4gIFwicHVnXCIsXG4gIFwicmVhZGluZ19pbmZvXCIsXG4gIFwicmVkaXJlY3RzXCIsXG4gIFwicmVsYXRpb25zXCIsXG4gIFwicmVsYXRpdmVfdXJsc1wiLFxuICBcInJlbWFya1wiLFxuICBcInJlc29sdmVfdXJsc1wiLFxuICBcInJvYm90c1wiLFxuICBcInNhc3NcIixcbiAgXCJzaGVldHNcIixcbiAgXCJzaXRlbWFwXCIsXG4gIFwic2x1Z2lmeV91cmxzXCIsXG4gIFwic291cmNlX21hcHNcIixcbiAgXCJzdmdvXCIsXG4gIFwidGFpbHdpbmRjc3NcIixcbiAgXCJ0ZXJzZXJcIixcbiAgXCJ0cmFuc2Zvcm1faW1hZ2VzXCIsXG4gIFwidG9tbFwiLFxuICBcInVub2Nzc1wiLFxuXTtcblxuLyoqIFJldHVybnMgdGhlIF9jb25maWcgZmlsZSBvZiBhIHNpdGUgKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRDb25maWdGaWxlKFxuICBwYXRoPzogc3RyaW5nLFxuICBkZWZhdWx0UGF0aHM6IHN0cmluZ1tdID0gW1wiX2NvbmZpZy5qc1wiLCBcIl9jb25maWcudHNcIl0sXG4pOiBQcm9taXNlPHN0cmluZyB8IHVuZGVmaW5lZD4ge1xuICBpZiAocGF0aCkge1xuICAgIHRyeSB7XG4gICAgICByZXR1cm4gYXdhaXQgRGVuby5yZWFsUGF0aChwYXRoKTtcbiAgICB9IGNhdGNoIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgQ29uZmlnIGZpbGUgbm90IGZvdW5kICgke3BhdGh9KWApO1xuICAgIH1cbiAgfVxuXG4gIGZvciAoY29uc3QgcGF0aCBvZiBkZWZhdWx0UGF0aHMpIHtcbiAgICB0cnkge1xuICAgICAgcmV0dXJuIGF3YWl0IERlbm8ucmVhbFBhdGgocGF0aCk7XG4gICAgfSBjYXRjaCB7XG4gICAgICAvLyBJZ25vcmVcbiAgICB9XG4gIH1cbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSw2REFBNkQsR0FDN0QsT0FBTyxNQUFNLGNBQWM7RUFDekI7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7Q0FDRCxDQUFDO0FBRUYsdUNBQXVDLEdBQ3ZDLE9BQU8sZUFBZSxjQUNwQixJQUFhLEVBQ2IsZUFBeUI7RUFBQztFQUFjO0NBQWE7RUFFckQsSUFBSSxNQUFNO0lBQ1IsSUFBSTtNQUNGLE9BQU8sTUFBTSxLQUFLLFFBQVEsQ0FBQztJQUM3QixFQUFFLE9BQU07TUFDTixNQUFNLElBQUksTUFBTSxDQUFDLHVCQUF1QixFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQ25EO0VBQ0Y7RUFFQSxLQUFLLE1BQU0sUUFBUSxhQUFjO0lBQy9CLElBQUk7TUFDRixPQUFPLE1BQU0sS0FBSyxRQUFRLENBQUM7SUFDN0IsRUFBRSxPQUFNO0lBQ04sU0FBUztJQUNYO0VBQ0Y7QUFDRiJ9