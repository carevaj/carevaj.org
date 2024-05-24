import { merge } from "../core/utils/object.ts";
import { Page } from "../core/file.ts";
import { stringify } from "../deps/xml.ts";
// Default options
export const defaults = {
  filename: "/sitemap.xml",
  query: "",
  sort: "url=asc",
  lastmod: "date"
};
/** A plugin to generate a sitemap.xml from page files after build */ export default function(userOptions) {
  const options = merge(defaults, userOptions);
  return (site)=>{
    site.addEventListener("beforeSave", async ()=>{
      // Create the sitemap.xml page
      const sitemap = Page.create({
        url: options.filename,
        content: generateSitemap(site.search.pages(options.query, options.sort))
      });
      // Add the sitemap page to pages
      site.pages.push(sitemap);
      // Add or update `robots.txt` with the sitemap url
      const robots = await site.getOrCreatePage("/robots.txt");
      const content = robots.content || `User-agent: *\nAllow: /\n`;
      robots.content = `${content}\nSitemap: ${site.url(options.filename, true)}`;
    });
    function generateSitemap(pages) {
      const sitemap = {
        xml: {
          "@version": "1.0",
          "@encoding": "UTF-8"
        },
        urlset: {
          "@xmlns": "http://www.sitemaps.org/schemas/sitemap/0.9",
          "@xmlns:xhtml": "http://www.w3.org/1999/xhtml",
          url: pages.map((data)=>{
            const node = {
              loc: site.url(data.url, true)
            };
            const lastmod = getValue(data, options.lastmod)?.toISOString();
            if (lastmod) {
              node.lastmod = lastmod;
            }
            const changefreq = getValue(data, options.changefreq);
            if (changefreq) {
              node.changefreq = changefreq;
            }
            const priority = getValue(data, options.priority);
            if (priority) {
              node.priority = priority;
            }
            if (data.alternates?.length) {
              node["xhtml:link"] = data.alternates.map((alternate)=>({
                  "@rel": "alternate",
                  "@hreflang": alternate.lang,
                  "@href": site.url(alternate.url, true)
                }));
            }
            if (data.unmatchedLangUrl) {
              node["xhtml:link"]?.push({
                "@rel": "alternate",
                "@hreflang": "x-default",
                "@href": site.url(data.unmatchedLangUrl, true)
              });
            }
            return node;
          })
        }
      };
      return stringify(sitemap);
    }
  };
}
function getValue(data, key) {
  if (!key) {
    return undefined;
  }
  if (typeof key === "function") {
    return key(data);
  }
  return data[key];
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvbHVtZUB2Mi4yLjAvcGx1Z2lucy9zaXRlbWFwLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IG1lcmdlIH0gZnJvbSBcIi4uL2NvcmUvdXRpbHMvb2JqZWN0LnRzXCI7XG5pbXBvcnQgeyBQYWdlIH0gZnJvbSBcIi4uL2NvcmUvZmlsZS50c1wiO1xuaW1wb3J0IHsgc3RyaW5naWZ5IH0gZnJvbSBcIi4uL2RlcHMveG1sLnRzXCI7XG5cbmltcG9ydCB0eXBlIFNpdGUgZnJvbSBcIi4uL2NvcmUvc2l0ZS50c1wiO1xuaW1wb3J0IHR5cGUgeyBEYXRhIH0gZnJvbSBcIi4uL2NvcmUvZmlsZS50c1wiO1xuXG50eXBlIENoYW5nZUZyZXEgPVxuICB8IFwiYWx3YXlzXCJcbiAgfCBcImhvdXJseVwiXG4gIHwgXCJkYWlseVwiXG4gIHwgXCJ3ZWVrbHlcIlxuICB8IFwibW9udGhseVwiXG4gIHwgXCJ5ZWFybHlcIlxuICB8IFwibmV2ZXJcIjtcblxuZXhwb3J0IGludGVyZmFjZSBPcHRpb25zIHtcbiAgLyoqIFRoZSBzaXRlbWFwIGZpbGUgbmFtZSAqL1xuICBmaWxlbmFtZT86IHN0cmluZztcblxuICAvKiogVGhlIHF1ZXJ5IHRvIHNlYXJjaCBwYWdlcyBpbmNsdWRlZCBpbiB0aGUgc2l0ZW1hcCAqL1xuICBxdWVyeT86IHN0cmluZztcblxuICAvKiogVGhlIHZhbHVlcyB0byBzb3J0IHRoZSBzaXRlbWFwICovXG4gIHNvcnQ/OiBzdHJpbmc7XG5cbiAgLyoqIFRoZSBrZXkgdG8gdXNlIGZvciB0aGUgbGFzdG1vZCBmaWVsZCBvciBhIGN1c3RvbSBmdW5jdGlvbiAqL1xuICBsYXN0bW9kPzogc3RyaW5nIHwgKChkYXRhOiBEYXRhKSA9PiBEYXRlKTtcblxuICAvKiogVGhlIGtleSB0byB1c2UgZm9yIHRoZSBjaGFuZ2VmcmVxIGZpZWxkIG9yIGEgY3VzdG9tIGZ1bmN0aW9uICovXG4gIGNoYW5nZWZyZXE/OiBzdHJpbmcgfCAoKGRhdGE6IERhdGEpID0+IENoYW5nZUZyZXEpO1xuXG4gIC8qKiBUaGUga2V5IHRvIHVzZSBmb3IgdGhlIHByaW9yaXR5IGZpZWxkIG9yIGEgY3VzdG9tIGZ1bmN0aW9uICovXG4gIHByaW9yaXR5Pzogc3RyaW5nIHwgKChkYXRhOiBEYXRhKSA9PiBudW1iZXIpO1xufVxuXG4vLyBEZWZhdWx0IG9wdGlvbnNcbmV4cG9ydCBjb25zdCBkZWZhdWx0czogT3B0aW9ucyA9IHtcbiAgZmlsZW5hbWU6IFwiL3NpdGVtYXAueG1sXCIsXG4gIHF1ZXJ5OiBcIlwiLFxuICBzb3J0OiBcInVybD1hc2NcIixcbiAgbGFzdG1vZDogXCJkYXRlXCIsXG59O1xuXG4vKiogQSBwbHVnaW4gdG8gZ2VuZXJhdGUgYSBzaXRlbWFwLnhtbCBmcm9tIHBhZ2UgZmlsZXMgYWZ0ZXIgYnVpbGQgKi9cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uICh1c2VyT3B0aW9ucz86IE9wdGlvbnMpIHtcbiAgY29uc3Qgb3B0aW9ucyA9IG1lcmdlKGRlZmF1bHRzLCB1c2VyT3B0aW9ucyk7XG5cbiAgcmV0dXJuIChzaXRlOiBTaXRlKSA9PiB7XG4gICAgc2l0ZS5hZGRFdmVudExpc3RlbmVyKFwiYmVmb3JlU2F2ZVwiLCBhc3luYyAoKSA9PiB7XG4gICAgICAvLyBDcmVhdGUgdGhlIHNpdGVtYXAueG1sIHBhZ2VcbiAgICAgIGNvbnN0IHNpdGVtYXAgPSBQYWdlLmNyZWF0ZSh7XG4gICAgICAgIHVybDogb3B0aW9ucy5maWxlbmFtZSxcbiAgICAgICAgY29udGVudDogZ2VuZXJhdGVTaXRlbWFwKFxuICAgICAgICAgIHNpdGUuc2VhcmNoLnBhZ2VzKG9wdGlvbnMucXVlcnksIG9wdGlvbnMuc29ydCksXG4gICAgICAgICksXG4gICAgICB9KTtcblxuICAgICAgLy8gQWRkIHRoZSBzaXRlbWFwIHBhZ2UgdG8gcGFnZXNcbiAgICAgIHNpdGUucGFnZXMucHVzaChzaXRlbWFwKTtcblxuICAgICAgLy8gQWRkIG9yIHVwZGF0ZSBgcm9ib3RzLnR4dGAgd2l0aCB0aGUgc2l0ZW1hcCB1cmxcbiAgICAgIGNvbnN0IHJvYm90cyA9IGF3YWl0IHNpdGUuZ2V0T3JDcmVhdGVQYWdlKFwiL3JvYm90cy50eHRcIik7XG4gICAgICBjb25zdCBjb250ZW50ID0gcm9ib3RzLmNvbnRlbnQgYXMgc3RyaW5nIHx8IGBVc2VyLWFnZW50OiAqXFxuQWxsb3c6IC9cXG5gO1xuICAgICAgcm9ib3RzLmNvbnRlbnQgPSBgJHtjb250ZW50fVxcblNpdGVtYXA6ICR7XG4gICAgICAgIHNpdGUudXJsKG9wdGlvbnMuZmlsZW5hbWUsIHRydWUpXG4gICAgICB9YDtcbiAgICB9KTtcblxuICAgIGZ1bmN0aW9uIGdlbmVyYXRlU2l0ZW1hcChwYWdlczogRGF0YVtdKTogc3RyaW5nIHtcbiAgICAgIGNvbnN0IHNpdGVtYXAgPSB7XG4gICAgICAgIHhtbDoge1xuICAgICAgICAgIFwiQHZlcnNpb25cIjogXCIxLjBcIixcbiAgICAgICAgICBcIkBlbmNvZGluZ1wiOiBcIlVURi04XCIsXG4gICAgICAgIH0sXG4gICAgICAgIHVybHNldDoge1xuICAgICAgICAgIFwiQHhtbG5zXCI6IFwiaHR0cDovL3d3dy5zaXRlbWFwcy5vcmcvc2NoZW1hcy9zaXRlbWFwLzAuOVwiLFxuICAgICAgICAgIFwiQHhtbG5zOnhodG1sXCI6IFwiaHR0cDovL3d3dy53My5vcmcvMTk5OS94aHRtbFwiLFxuICAgICAgICAgIHVybDogcGFnZXMubWFwKChkYXRhKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBub2RlOiBVcmxJdGVtID0ge1xuICAgICAgICAgICAgICBsb2M6IHNpdGUudXJsKGRhdGEudXJsLCB0cnVlKSxcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGNvbnN0IGxhc3Rtb2QgPSBnZXRWYWx1ZTxEYXRlPihkYXRhLCBvcHRpb25zLmxhc3Rtb2QpXG4gICAgICAgICAgICAgID8udG9JU09TdHJpbmcoKTtcbiAgICAgICAgICAgIGlmIChsYXN0bW9kKSB7XG4gICAgICAgICAgICAgIG5vZGUubGFzdG1vZCA9IGxhc3Rtb2Q7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IGNoYW5nZWZyZXEgPSBnZXRWYWx1ZTxDaGFuZ2VGcmVxPihkYXRhLCBvcHRpb25zLmNoYW5nZWZyZXEpO1xuICAgICAgICAgICAgaWYgKGNoYW5nZWZyZXEpIHtcbiAgICAgICAgICAgICAgbm9kZS5jaGFuZ2VmcmVxID0gY2hhbmdlZnJlcTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgcHJpb3JpdHkgPSBnZXRWYWx1ZTxudW1iZXI+KGRhdGEsIG9wdGlvbnMucHJpb3JpdHkpO1xuICAgICAgICAgICAgaWYgKHByaW9yaXR5KSB7XG4gICAgICAgICAgICAgIG5vZGUucHJpb3JpdHkgPSBwcmlvcml0eTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGRhdGEuYWx0ZXJuYXRlcz8ubGVuZ3RoKSB7XG4gICAgICAgICAgICAgIG5vZGVbXCJ4aHRtbDpsaW5rXCJdID0gZGF0YS5hbHRlcm5hdGVzLm1hcCgoYWx0ZXJuYXRlOiBEYXRhKSA9PiAoe1xuICAgICAgICAgICAgICAgIFwiQHJlbFwiOiBcImFsdGVybmF0ZVwiLFxuICAgICAgICAgICAgICAgIFwiQGhyZWZsYW5nXCI6IGFsdGVybmF0ZS5sYW5nISxcbiAgICAgICAgICAgICAgICBcIkBocmVmXCI6IHNpdGUudXJsKGFsdGVybmF0ZS51cmwsIHRydWUpLFxuICAgICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZGF0YS51bm1hdGNoZWRMYW5nVXJsKSB7XG4gICAgICAgICAgICAgIG5vZGVbXCJ4aHRtbDpsaW5rXCJdPy5wdXNoKHtcbiAgICAgICAgICAgICAgICBcIkByZWxcIjogXCJhbHRlcm5hdGVcIixcbiAgICAgICAgICAgICAgICBcIkBocmVmbGFuZ1wiOiBcIngtZGVmYXVsdFwiLFxuICAgICAgICAgICAgICAgIFwiQGhyZWZcIjogc2l0ZS51cmwoZGF0YS51bm1hdGNoZWRMYW5nVXJsLCB0cnVlKSxcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBub2RlO1xuICAgICAgICAgIH0pLFxuICAgICAgICB9LFxuICAgICAgfTtcblxuICAgICAgcmV0dXJuIHN0cmluZ2lmeShzaXRlbWFwKTtcbiAgICB9XG4gIH07XG59XG5cbmludGVyZmFjZSBVcmxJdGVtIHtcbiAgbG9jOiBzdHJpbmc7XG4gIGxhc3Rtb2Q/OiBzdHJpbmc7XG4gIGNoYW5nZWZyZXE/OiBDaGFuZ2VGcmVxO1xuICBwcmlvcml0eT86IG51bWJlcjtcbiAgXCJ4aHRtbDpsaW5rXCI/OiB7XG4gICAgXCJAcmVsXCI6IFwiYWx0ZXJuYXRlXCI7XG4gICAgXCJAaHJlZmxhbmdcIjogc3RyaW5nO1xuICAgIFwiQGhyZWZcIjogc3RyaW5nO1xuICB9W107XG59XG5cbmZ1bmN0aW9uIGdldFZhbHVlPFQ+KFxuICBkYXRhOiBEYXRhLFxuICBrZXk/OiBzdHJpbmcgfCAoKGRhdGE6IERhdGEpID0+IFQpLFxuKTogVCB8IHVuZGVmaW5lZCB7XG4gIGlmICgha2V5KSB7XG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxuXG4gIGlmICh0eXBlb2Yga2V5ID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICByZXR1cm4ga2V5KGRhdGEpO1xuICB9XG5cbiAgcmV0dXJuIGRhdGFba2V5XTtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxTQUFTLEtBQUssUUFBUSwwQkFBMEI7QUFDaEQsU0FBUyxJQUFJLFFBQVEsa0JBQWtCO0FBQ3ZDLFNBQVMsU0FBUyxRQUFRLGlCQUFpQjtBQWtDM0Msa0JBQWtCO0FBQ2xCLE9BQU8sTUFBTSxXQUFvQjtFQUMvQixVQUFVO0VBQ1YsT0FBTztFQUNQLE1BQU07RUFDTixTQUFTO0FBQ1gsRUFBRTtBQUVGLG1FQUFtRSxHQUNuRSxlQUFlLFNBQVUsV0FBcUI7RUFDNUMsTUFBTSxVQUFVLE1BQU0sVUFBVTtFQUVoQyxPQUFPLENBQUM7SUFDTixLQUFLLGdCQUFnQixDQUFDLGNBQWM7TUFDbEMsOEJBQThCO01BQzlCLE1BQU0sVUFBVSxLQUFLLE1BQU0sQ0FBQztRQUMxQixLQUFLLFFBQVEsUUFBUTtRQUNyQixTQUFTLGdCQUNQLEtBQUssTUFBTSxDQUFDLEtBQUssQ0FBQyxRQUFRLEtBQUssRUFBRSxRQUFRLElBQUk7TUFFakQ7TUFFQSxnQ0FBZ0M7TUFDaEMsS0FBSyxLQUFLLENBQUMsSUFBSSxDQUFDO01BRWhCLGtEQUFrRDtNQUNsRCxNQUFNLFNBQVMsTUFBTSxLQUFLLGVBQWUsQ0FBQztNQUMxQyxNQUFNLFVBQVUsT0FBTyxPQUFPLElBQWMsQ0FBQyx5QkFBeUIsQ0FBQztNQUN2RSxPQUFPLE9BQU8sR0FBRyxDQUFDLEVBQUUsUUFBUSxXQUFXLEVBQ3JDLEtBQUssR0FBRyxDQUFDLFFBQVEsUUFBUSxFQUFFLE1BQzVCLENBQUM7SUFDSjtJQUVBLFNBQVMsZ0JBQWdCLEtBQWE7TUFDcEMsTUFBTSxVQUFVO1FBQ2QsS0FBSztVQUNILFlBQVk7VUFDWixhQUFhO1FBQ2Y7UUFDQSxRQUFRO1VBQ04sVUFBVTtVQUNWLGdCQUFnQjtVQUNoQixLQUFLLE1BQU0sR0FBRyxDQUFDLENBQUM7WUFDZCxNQUFNLE9BQWdCO2NBQ3BCLEtBQUssS0FBSyxHQUFHLENBQUMsS0FBSyxHQUFHLEVBQUU7WUFDMUI7WUFFQSxNQUFNLFVBQVUsU0FBZSxNQUFNLFFBQVEsT0FBTyxHQUNoRDtZQUNKLElBQUksU0FBUztjQUNYLEtBQUssT0FBTyxHQUFHO1lBQ2pCO1lBRUEsTUFBTSxhQUFhLFNBQXFCLE1BQU0sUUFBUSxVQUFVO1lBQ2hFLElBQUksWUFBWTtjQUNkLEtBQUssVUFBVSxHQUFHO1lBQ3BCO1lBRUEsTUFBTSxXQUFXLFNBQWlCLE1BQU0sUUFBUSxRQUFRO1lBQ3hELElBQUksVUFBVTtjQUNaLEtBQUssUUFBUSxHQUFHO1lBQ2xCO1lBRUEsSUFBSSxLQUFLLFVBQVUsRUFBRSxRQUFRO2NBQzNCLElBQUksQ0FBQyxhQUFhLEdBQUcsS0FBSyxVQUFVLENBQUMsR0FBRyxDQUFDLENBQUMsWUFBb0IsQ0FBQztrQkFDN0QsUUFBUTtrQkFDUixhQUFhLFVBQVUsSUFBSTtrQkFDM0IsU0FBUyxLQUFLLEdBQUcsQ0FBQyxVQUFVLEdBQUcsRUFBRTtnQkFDbkMsQ0FBQztZQUNIO1lBQ0EsSUFBSSxLQUFLLGdCQUFnQixFQUFFO2NBQ3pCLElBQUksQ0FBQyxhQUFhLEVBQUUsS0FBSztnQkFDdkIsUUFBUTtnQkFDUixhQUFhO2dCQUNiLFNBQVMsS0FBSyxHQUFHLENBQUMsS0FBSyxnQkFBZ0IsRUFBRTtjQUMzQztZQUNGO1lBRUEsT0FBTztVQUNUO1FBQ0Y7TUFDRjtNQUVBLE9BQU8sVUFBVTtJQUNuQjtFQUNGO0FBQ0Y7QUFjQSxTQUFTLFNBQ1AsSUFBVSxFQUNWLEdBQWtDO0VBRWxDLElBQUksQ0FBQyxLQUFLO0lBQ1IsT0FBTztFQUNUO0VBRUEsSUFBSSxPQUFPLFFBQVEsWUFBWTtJQUM3QixPQUFPLElBQUk7RUFDYjtFQUVBLE9BQU8sSUFBSSxDQUFDLElBQUk7QUFDbEIifQ==