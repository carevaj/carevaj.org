import { getExtension } from "../core/utils/path.ts";
import { merge } from "../core/utils/object.ts";
import { getCurrentVersion } from "../core/utils/lume_version.ts";
import { getDataValue } from "../core/utils/data_values.ts";
import { $XML, stringify } from "../deps/xml.ts";
import { Page } from "../core/file.ts";
export const defaults = {
  /** The output filenames */ output: "/feed.rss",
  /** The query to search the pages */ query: "",
  /** The sort order */ sort: "date=desc",
  /** The maximum number of items */ limit: 10,
  /** The feed info */ info: {
    title: "My RSS Feed",
    published: new Date(),
    description: "",
    lang: "en",
    generator: true
  },
  items: {
    title: "=title",
    description: "=description",
    published: "=date",
    content: "=children",
    lang: "=lang"
  }
};
const defaultGenerator = `Lume ${getCurrentVersion()}`;
export default function(userOptions) {
  const options = merge(defaults, userOptions);
  return (site)=>{
    site.addEventListener("beforeSave", ()=>{
      const output = Array.isArray(options.output) ? options.output : [
        options.output
      ];
      const pages = site.search.pages(options.query, options.sort, options.limit);
      const { info, items } = options;
      const rootData = site.source.data.get("/") || {};
      const feed = {
        title: getDataValue(rootData, info.title),
        description: getDataValue(rootData, info.description),
        published: getDataValue(rootData, info.published),
        lang: getDataValue(rootData, info.lang),
        url: site.url("", true),
        generator: info.generator === true ? defaultGenerator : info.generator || undefined,
        items: pages.map((data)=>{
          const content = getDataValue(data, items.content)?.toString();
          const pageUrl = site.url(data.url, true);
          const fixedContent = fixUrls(new URL(pageUrl), content || "");
          const imagePath = getDataValue(data, items.image);
          const image = imagePath !== undefined ? site.url(imagePath, true) : undefined;
          return {
            title: getDataValue(data, items.title),
            url: site.url(data.url, true),
            description: getDataValue(data, items.description),
            published: getDataValue(data, items.published),
            updated: getDataValue(data, items.updated),
            content: fixedContent,
            lang: getDataValue(data, items.lang),
            image
          };
        })
      };
      for (const filename of output){
        const format = getExtension(filename).slice(1);
        const file = site.url(filename, true);
        switch(format){
          case "rss":
          case "feed":
          case "xml":
            site.pages.push(Page.create({
              url: filename,
              content: generateRss(feed, file)
            }));
            break;
          case "json":
            site.pages.push(Page.create({
              url: filename,
              content: generateJson(feed, file)
            }));
            break;
          default:
            throw new Error(`Invalid Feed format "${format}"`);
        }
      }
    });
  };
}
function fixUrls(base, html) {
  return html.replaceAll(/\s(href|src)="([^"]+)"/g, (_match, attr, value)=>` ${attr}="${new URL(value, base).href}"`);
}
function generateRss(data, file) {
  const feed = {
    [$XML]: {
      cdata: [
        [
          "rss",
          "channel",
          "item",
          "content:encoded"
        ]
      ]
    },
    xml: {
      "@version": "1.0",
      "@encoding": "UTF-8"
    },
    rss: {
      "@xmlns:content": "http://purl.org/rss/1.0/modules/content/",
      "@xmlns:wfw": "http://wellformedweb.org/CommentAPI/",
      "@xmlns:dc": "http://purl.org/dc/elements/1.1/",
      "@xmlns:atom": "http://www.w3.org/2005/Atom",
      "@xmlns:sy": "http://purl.org/rss/1.0/modules/syndication/",
      "@xmlns:slash": "http://purl.org/rss/1.0/modules/slash/",
      "@version": "2.0",
      channel: clean({
        title: data.title,
        link: data.url,
        "atom:link": {
          "@href": file,
          "@rel": "self",
          "@type": "application/rss+xml"
        },
        description: data.description,
        lastBuildDate: data.published.toUTCString(),
        language: data.lang,
        generator: data.generator,
        item: data.items.map((item)=>clean({
            title: item.title,
            link: item.url,
            guid: {
              "@isPermaLink": false,
              "#text": item.url
            },
            description: item.description,
            "content:encoded": item.content,
            pubDate: item.published.toUTCString(),
            "atom:updated": item.updated?.toISOString(),
            meta: item.image ? {
              "@property": "og:image",
              "@content": item.image
            } : undefined
          }))
      })
    }
  };
  return stringify(feed);
}
function generateJson(data, file) {
  const feed = clean({
    version: "https://jsonfeed.org/version/1",
    title: data.title,
    home_page_url: data.url,
    feed_url: file,
    description: data.description,
    items: data.items.map((item)=>clean({
        id: item.url,
        url: item.url,
        title: item.title,
        content_html: item.content,
        date_published: item.published.toUTCString(),
        date_modified: item.updated?.toUTCString(),
        image: item.image
      }))
  });
  return JSON.stringify(feed);
}
/** Remove undefined values of an object */ function clean(obj) {
  return Object.fromEntries(Object.entries(obj).filter(([, value])=>value !== undefined));
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvbHVtZUB2Mi4yLjAvcGx1Z2lucy9mZWVkLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGdldEV4dGVuc2lvbiB9IGZyb20gXCIuLi9jb3JlL3V0aWxzL3BhdGgudHNcIjtcbmltcG9ydCB7IG1lcmdlIH0gZnJvbSBcIi4uL2NvcmUvdXRpbHMvb2JqZWN0LnRzXCI7XG5pbXBvcnQgeyBnZXRDdXJyZW50VmVyc2lvbiB9IGZyb20gXCIuLi9jb3JlL3V0aWxzL2x1bWVfdmVyc2lvbi50c1wiO1xuaW1wb3J0IHsgZ2V0RGF0YVZhbHVlIH0gZnJvbSBcIi4uL2NvcmUvdXRpbHMvZGF0YV92YWx1ZXMudHNcIjtcbmltcG9ydCB7ICRYTUwsIHN0cmluZ2lmeSB9IGZyb20gXCIuLi9kZXBzL3htbC50c1wiO1xuaW1wb3J0IHsgUGFnZSB9IGZyb20gXCIuLi9jb3JlL2ZpbGUudHNcIjtcblxuaW1wb3J0IHR5cGUgU2l0ZSBmcm9tIFwiLi4vY29yZS9zaXRlLnRzXCI7XG5pbXBvcnQgdHlwZSB7IERhdGEgfSBmcm9tIFwiLi4vY29yZS9maWxlLnRzXCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgT3B0aW9ucyB7XG4gIC8qKiBUaGUgb3V0cHV0IGZpbGVuYW1lcyAqL1xuICBvdXRwdXQ/OiBzdHJpbmcgfCBzdHJpbmdbXTtcblxuICAvKiogVGhlIHF1ZXJ5IHRvIHNlYXJjaCB0aGUgcGFnZXMgKi9cbiAgcXVlcnk/OiBzdHJpbmc7XG5cbiAgLyoqIFRoZSBzb3J0IG9yZGVyICovXG4gIHNvcnQ/OiBzdHJpbmc7XG5cbiAgLyoqIFRoZSBtYXhpbXVtIG51bWJlciBvZiBpdGVtcyAqL1xuICBsaW1pdD86IG51bWJlcjtcblxuICAvKiogVGhlIGZlZWQgaW5mbyAqL1xuICBpbmZvPzogRmVlZEluZm9PcHRpb25zO1xuXG4gIC8qKiBUaGUgZmVlZCBpdGVtcyBjb25maWd1cmF0aW9uICovXG4gIGl0ZW1zPzogRmVlZEl0ZW1PcHRpb25zO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEZlZWRJbmZvT3B0aW9ucyB7XG4gIC8qKiBUaGUgZmVlZCB0aXRsZSAqL1xuICB0aXRsZT86IHN0cmluZztcblxuICAvKiogVGhlIGZlZWQgc3VidGl0bGUgKi9cbiAgc3VidGl0bGU/OiBzdHJpbmc7XG5cbiAgLyoqXG4gICAqIFRoZSBmZWVkIHB1Ymxpc2hlZCBkYXRlXG4gICAqIEBkZWZhdWx0IGBuZXcgRGF0ZSgpYFxuICAgKi9cbiAgcHVibGlzaGVkPzogRGF0ZTtcblxuICAvKiogVGhlIGZlZWQgZGVzY3JpcHRpb24gKi9cbiAgZGVzY3JpcHRpb24/OiBzdHJpbmc7XG5cbiAgLyoqIFRoZSBmZWVkIGxhbmd1YWdlICovXG4gIGxhbmc/OiBzdHJpbmc7XG5cbiAgLyoqIFRoZSBmZWVkIGdlbmVyYXRvci4gU2V0IGB0cnVlYCB0byBnZW5lcmF0ZSBhdXRvbWF0aWNhbGx5ICovXG4gIGdlbmVyYXRvcj86IHN0cmluZyB8IGJvb2xlYW47XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgRmVlZEl0ZW1PcHRpb25zIHtcbiAgLyoqIFRoZSBpdGVtIHRpdGxlICovXG4gIHRpdGxlPzogc3RyaW5nIHwgKChkYXRhOiBEYXRhKSA9PiBzdHJpbmcgfCB1bmRlZmluZWQpO1xuXG4gIC8qKiBUaGUgaXRlbSBkZXNjcmlwdGlvbiAqL1xuICBkZXNjcmlwdGlvbj86IHN0cmluZyB8ICgoZGF0YTogRGF0YSkgPT4gc3RyaW5nIHwgdW5kZWZpbmVkKTtcblxuICAvKiogVGhlIGl0ZW0gcHVibGlzaGVkIGRhdGUgKi9cbiAgcHVibGlzaGVkPzogc3RyaW5nIHwgKChkYXRhOiBEYXRhKSA9PiBEYXRlIHwgdW5kZWZpbmVkKTtcblxuICAvKiogVGhlIGl0ZW0gdXBkYXRlZCBkYXRlICovXG4gIHVwZGF0ZWQ/OiBzdHJpbmcgfCAoKGRhdGE6IERhdGEpID0+IERhdGUgfCB1bmRlZmluZWQpO1xuXG4gIC8qKiBUaGUgaXRlbSBjb250ZW50ICovXG4gIGNvbnRlbnQ/OiBzdHJpbmcgfCAoKGRhdGE6IERhdGEpID0+IHN0cmluZyB8IHVuZGVmaW5lZCk7XG5cbiAgLyoqIFRoZSBpdGVtIGxhbmd1YWdlICovXG4gIGxhbmc/OiBzdHJpbmcgfCAoKGRhdGE6IERhdGEpID0+IHN0cmluZyB8IHVuZGVmaW5lZCk7XG5cbiAgLyoqIFRoZSBpdGVtIGltYWdlICovXG4gIGltYWdlPzogc3RyaW5nIHwgKChkYXRhOiBEYXRhKSA9PiBzdHJpbmcgfCB1bmRlZmluZWQpO1xufVxuXG5leHBvcnQgY29uc3QgZGVmYXVsdHM6IE9wdGlvbnMgPSB7XG4gIC8qKiBUaGUgb3V0cHV0IGZpbGVuYW1lcyAqL1xuICBvdXRwdXQ6IFwiL2ZlZWQucnNzXCIsXG5cbiAgLyoqIFRoZSBxdWVyeSB0byBzZWFyY2ggdGhlIHBhZ2VzICovXG4gIHF1ZXJ5OiBcIlwiLFxuXG4gIC8qKiBUaGUgc29ydCBvcmRlciAqL1xuICBzb3J0OiBcImRhdGU9ZGVzY1wiLFxuXG4gIC8qKiBUaGUgbWF4aW11bSBudW1iZXIgb2YgaXRlbXMgKi9cbiAgbGltaXQ6IDEwLFxuXG4gIC8qKiBUaGUgZmVlZCBpbmZvICovXG4gIGluZm86IHtcbiAgICB0aXRsZTogXCJNeSBSU1MgRmVlZFwiLFxuICAgIHB1Ymxpc2hlZDogbmV3IERhdGUoKSxcbiAgICBkZXNjcmlwdGlvbjogXCJcIixcbiAgICBsYW5nOiBcImVuXCIsXG4gICAgZ2VuZXJhdG9yOiB0cnVlLFxuICB9LFxuICBpdGVtczoge1xuICAgIHRpdGxlOiBcIj10aXRsZVwiLFxuICAgIGRlc2NyaXB0aW9uOiBcIj1kZXNjcmlwdGlvblwiLFxuICAgIHB1Ymxpc2hlZDogXCI9ZGF0ZVwiLFxuICAgIGNvbnRlbnQ6IFwiPWNoaWxkcmVuXCIsXG4gICAgbGFuZzogXCI9bGFuZ1wiLFxuICB9LFxufTtcblxuZXhwb3J0IGludGVyZmFjZSBGZWVkRGF0YSB7XG4gIHRpdGxlOiBzdHJpbmc7XG4gIHVybDogc3RyaW5nO1xuICBkZXNjcmlwdGlvbjogc3RyaW5nO1xuICBwdWJsaXNoZWQ6IERhdGU7XG4gIGxhbmc6IHN0cmluZztcbiAgZ2VuZXJhdG9yPzogc3RyaW5nO1xuICBpdGVtczogRmVlZEl0ZW1bXTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBGZWVkSXRlbSB7XG4gIHRpdGxlOiBzdHJpbmc7XG4gIHVybDogc3RyaW5nO1xuICBkZXNjcmlwdGlvbjogc3RyaW5nO1xuICBwdWJsaXNoZWQ6IERhdGU7XG4gIHVwZGF0ZWQ/OiBEYXRlO1xuICBjb250ZW50OiBzdHJpbmc7XG4gIGxhbmc6IHN0cmluZztcbiAgaW1hZ2U/OiBzdHJpbmc7XG59XG5cbmNvbnN0IGRlZmF1bHRHZW5lcmF0b3IgPSBgTHVtZSAke2dldEN1cnJlbnRWZXJzaW9uKCl9YDtcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gKHVzZXJPcHRpb25zPzogT3B0aW9ucykge1xuICBjb25zdCBvcHRpb25zID0gbWVyZ2UoZGVmYXVsdHMsIHVzZXJPcHRpb25zKTtcblxuICByZXR1cm4gKHNpdGU6IFNpdGUpID0+IHtcbiAgICBzaXRlLmFkZEV2ZW50TGlzdGVuZXIoXCJiZWZvcmVTYXZlXCIsICgpID0+IHtcbiAgICAgIGNvbnN0IG91dHB1dCA9IEFycmF5LmlzQXJyYXkob3B0aW9ucy5vdXRwdXQpXG4gICAgICAgID8gb3B0aW9ucy5vdXRwdXRcbiAgICAgICAgOiBbb3B0aW9ucy5vdXRwdXRdO1xuXG4gICAgICBjb25zdCBwYWdlcyA9IHNpdGUuc2VhcmNoLnBhZ2VzKFxuICAgICAgICBvcHRpb25zLnF1ZXJ5LFxuICAgICAgICBvcHRpb25zLnNvcnQsXG4gICAgICAgIG9wdGlvbnMubGltaXQsXG4gICAgICApIGFzIERhdGFbXTtcblxuICAgICAgY29uc3QgeyBpbmZvLCBpdGVtcyB9ID0gb3B0aW9ucztcbiAgICAgIGNvbnN0IHJvb3REYXRhID0gc2l0ZS5zb3VyY2UuZGF0YS5nZXQoXCIvXCIpIHx8IHt9O1xuXG4gICAgICBjb25zdCBmZWVkOiBGZWVkRGF0YSA9IHtcbiAgICAgICAgdGl0bGU6IGdldERhdGFWYWx1ZShyb290RGF0YSwgaW5mby50aXRsZSksXG4gICAgICAgIGRlc2NyaXB0aW9uOiBnZXREYXRhVmFsdWUocm9vdERhdGEsIGluZm8uZGVzY3JpcHRpb24pLFxuICAgICAgICBwdWJsaXNoZWQ6IGdldERhdGFWYWx1ZShyb290RGF0YSwgaW5mby5wdWJsaXNoZWQpLFxuICAgICAgICBsYW5nOiBnZXREYXRhVmFsdWUocm9vdERhdGEsIGluZm8ubGFuZyksXG4gICAgICAgIHVybDogc2l0ZS51cmwoXCJcIiwgdHJ1ZSksXG4gICAgICAgIGdlbmVyYXRvcjogaW5mby5nZW5lcmF0b3IgPT09IHRydWVcbiAgICAgICAgICA/IGRlZmF1bHRHZW5lcmF0b3JcbiAgICAgICAgICA6IGluZm8uZ2VuZXJhdG9yIHx8IHVuZGVmaW5lZCxcbiAgICAgICAgaXRlbXM6IHBhZ2VzLm1hcCgoZGF0YSk6IEZlZWRJdGVtID0+IHtcbiAgICAgICAgICBjb25zdCBjb250ZW50ID0gZ2V0RGF0YVZhbHVlKGRhdGEsIGl0ZW1zLmNvbnRlbnQpPy50b1N0cmluZygpO1xuICAgICAgICAgIGNvbnN0IHBhZ2VVcmwgPSBzaXRlLnVybChkYXRhLnVybCwgdHJ1ZSk7XG4gICAgICAgICAgY29uc3QgZml4ZWRDb250ZW50ID0gZml4VXJscyhuZXcgVVJMKHBhZ2VVcmwpLCBjb250ZW50IHx8IFwiXCIpO1xuICAgICAgICAgIGNvbnN0IGltYWdlUGF0aCA9IGdldERhdGFWYWx1ZShkYXRhLCBpdGVtcy5pbWFnZSk7XG4gICAgICAgICAgY29uc3QgaW1hZ2UgPSBpbWFnZVBhdGggIT09IHVuZGVmaW5lZFxuICAgICAgICAgICAgPyBzaXRlLnVybChpbWFnZVBhdGgsIHRydWUpXG4gICAgICAgICAgICA6IHVuZGVmaW5lZDtcblxuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB0aXRsZTogZ2V0RGF0YVZhbHVlKGRhdGEsIGl0ZW1zLnRpdGxlKSxcbiAgICAgICAgICAgIHVybDogc2l0ZS51cmwoZGF0YS51cmwsIHRydWUpLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246IGdldERhdGFWYWx1ZShkYXRhLCBpdGVtcy5kZXNjcmlwdGlvbiksXG4gICAgICAgICAgICBwdWJsaXNoZWQ6IGdldERhdGFWYWx1ZShkYXRhLCBpdGVtcy5wdWJsaXNoZWQpLFxuICAgICAgICAgICAgdXBkYXRlZDogZ2V0RGF0YVZhbHVlKGRhdGEsIGl0ZW1zLnVwZGF0ZWQpLFxuICAgICAgICAgICAgY29udGVudDogZml4ZWRDb250ZW50LFxuICAgICAgICAgICAgbGFuZzogZ2V0RGF0YVZhbHVlKGRhdGEsIGl0ZW1zLmxhbmcpLFxuICAgICAgICAgICAgaW1hZ2UsXG4gICAgICAgICAgfTtcbiAgICAgICAgfSksXG4gICAgICB9O1xuXG4gICAgICBmb3IgKGNvbnN0IGZpbGVuYW1lIG9mIG91dHB1dCkge1xuICAgICAgICBjb25zdCBmb3JtYXQgPSBnZXRFeHRlbnNpb24oZmlsZW5hbWUpLnNsaWNlKDEpO1xuICAgICAgICBjb25zdCBmaWxlID0gc2l0ZS51cmwoZmlsZW5hbWUsIHRydWUpO1xuXG4gICAgICAgIHN3aXRjaCAoZm9ybWF0KSB7XG4gICAgICAgICAgY2FzZSBcInJzc1wiOlxuICAgICAgICAgIGNhc2UgXCJmZWVkXCI6XG4gICAgICAgICAgY2FzZSBcInhtbFwiOlxuICAgICAgICAgICAgc2l0ZS5wYWdlcy5wdXNoKFxuICAgICAgICAgICAgICBQYWdlLmNyZWF0ZSh7IHVybDogZmlsZW5hbWUsIGNvbnRlbnQ6IGdlbmVyYXRlUnNzKGZlZWQsIGZpbGUpIH0pLFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgY2FzZSBcImpzb25cIjpcbiAgICAgICAgICAgIHNpdGUucGFnZXMucHVzaChcbiAgICAgICAgICAgICAgUGFnZS5jcmVhdGUoeyB1cmw6IGZpbGVuYW1lLCBjb250ZW50OiBnZW5lcmF0ZUpzb24oZmVlZCwgZmlsZSkgfSksXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIEZlZWQgZm9ybWF0IFwiJHtmb3JtYXR9XCJgKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuICB9O1xufVxuXG5mdW5jdGlvbiBmaXhVcmxzKGJhc2U6IFVSTCwgaHRtbDogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIGh0bWwucmVwbGFjZUFsbChcbiAgICAvXFxzKGhyZWZ8c3JjKT1cIihbXlwiXSspXCIvZyxcbiAgICAoX21hdGNoLCBhdHRyLCB2YWx1ZSkgPT4gYCAke2F0dHJ9PVwiJHtuZXcgVVJMKHZhbHVlLCBiYXNlKS5ocmVmfVwiYCxcbiAgKTtcbn1cblxuZnVuY3Rpb24gZ2VuZXJhdGVSc3MoZGF0YTogRmVlZERhdGEsIGZpbGU6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IGZlZWQgPSB7XG4gICAgWyRYTUxdOiB7IGNkYXRhOiBbW1wicnNzXCIsIFwiY2hhbm5lbFwiLCBcIml0ZW1cIiwgXCJjb250ZW50OmVuY29kZWRcIl1dIH0sXG4gICAgeG1sOiB7XG4gICAgICBcIkB2ZXJzaW9uXCI6IFwiMS4wXCIsXG4gICAgICBcIkBlbmNvZGluZ1wiOiBcIlVURi04XCIsXG4gICAgfSxcbiAgICByc3M6IHtcbiAgICAgIFwiQHhtbG5zOmNvbnRlbnRcIjogXCJodHRwOi8vcHVybC5vcmcvcnNzLzEuMC9tb2R1bGVzL2NvbnRlbnQvXCIsXG4gICAgICBcIkB4bWxuczp3ZndcIjogXCJodHRwOi8vd2VsbGZvcm1lZHdlYi5vcmcvQ29tbWVudEFQSS9cIixcbiAgICAgIFwiQHhtbG5zOmRjXCI6IFwiaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS9cIixcbiAgICAgIFwiQHhtbG5zOmF0b21cIjogXCJodHRwOi8vd3d3LnczLm9yZy8yMDA1L0F0b21cIixcbiAgICAgIFwiQHhtbG5zOnN5XCI6IFwiaHR0cDovL3B1cmwub3JnL3Jzcy8xLjAvbW9kdWxlcy9zeW5kaWNhdGlvbi9cIixcbiAgICAgIFwiQHhtbG5zOnNsYXNoXCI6IFwiaHR0cDovL3B1cmwub3JnL3Jzcy8xLjAvbW9kdWxlcy9zbGFzaC9cIixcbiAgICAgIFwiQHZlcnNpb25cIjogXCIyLjBcIixcbiAgICAgIGNoYW5uZWw6IGNsZWFuKHtcbiAgICAgICAgdGl0bGU6IGRhdGEudGl0bGUsXG4gICAgICAgIGxpbms6IGRhdGEudXJsLFxuICAgICAgICBcImF0b206bGlua1wiOiB7XG4gICAgICAgICAgXCJAaHJlZlwiOiBmaWxlLFxuICAgICAgICAgIFwiQHJlbFwiOiBcInNlbGZcIixcbiAgICAgICAgICBcIkB0eXBlXCI6IFwiYXBwbGljYXRpb24vcnNzK3htbFwiLFxuICAgICAgICB9LFxuICAgICAgICBkZXNjcmlwdGlvbjogZGF0YS5kZXNjcmlwdGlvbixcbiAgICAgICAgbGFzdEJ1aWxkRGF0ZTogZGF0YS5wdWJsaXNoZWQudG9VVENTdHJpbmcoKSxcbiAgICAgICAgbGFuZ3VhZ2U6IGRhdGEubGFuZyxcbiAgICAgICAgZ2VuZXJhdG9yOiBkYXRhLmdlbmVyYXRvcixcbiAgICAgICAgaXRlbTogZGF0YS5pdGVtcy5tYXAoKGl0ZW0pID0+XG4gICAgICAgICAgY2xlYW4oe1xuICAgICAgICAgICAgdGl0bGU6IGl0ZW0udGl0bGUsXG4gICAgICAgICAgICBsaW5rOiBpdGVtLnVybCxcbiAgICAgICAgICAgIGd1aWQ6IHtcbiAgICAgICAgICAgICAgXCJAaXNQZXJtYUxpbmtcIjogZmFsc2UsXG4gICAgICAgICAgICAgIFwiI3RleHRcIjogaXRlbS51cmwsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZGVzY3JpcHRpb246IGl0ZW0uZGVzY3JpcHRpb24sXG4gICAgICAgICAgICBcImNvbnRlbnQ6ZW5jb2RlZFwiOiBpdGVtLmNvbnRlbnQsXG4gICAgICAgICAgICBwdWJEYXRlOiBpdGVtLnB1Ymxpc2hlZC50b1VUQ1N0cmluZygpLFxuICAgICAgICAgICAgXCJhdG9tOnVwZGF0ZWRcIjogaXRlbS51cGRhdGVkPy50b0lTT1N0cmluZygpLFxuICAgICAgICAgICAgbWV0YTogaXRlbS5pbWFnZVxuICAgICAgICAgICAgICA/IHsgXCJAcHJvcGVydHlcIjogXCJvZzppbWFnZVwiLCBcIkBjb250ZW50XCI6IGl0ZW0uaW1hZ2UgfVxuICAgICAgICAgICAgICA6IHVuZGVmaW5lZCxcbiAgICAgICAgICB9KVxuICAgICAgICApLFxuICAgICAgfSksXG4gICAgfSxcbiAgfTtcblxuICByZXR1cm4gc3RyaW5naWZ5KGZlZWQpO1xufVxuXG5mdW5jdGlvbiBnZW5lcmF0ZUpzb24oZGF0YTogRmVlZERhdGEsIGZpbGU6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IGZlZWQgPSBjbGVhbih7XG4gICAgdmVyc2lvbjogXCJodHRwczovL2pzb25mZWVkLm9yZy92ZXJzaW9uLzFcIixcbiAgICB0aXRsZTogZGF0YS50aXRsZSxcbiAgICBob21lX3BhZ2VfdXJsOiBkYXRhLnVybCxcbiAgICBmZWVkX3VybDogZmlsZSxcbiAgICBkZXNjcmlwdGlvbjogZGF0YS5kZXNjcmlwdGlvbixcbiAgICBpdGVtczogZGF0YS5pdGVtcy5tYXAoKGl0ZW0pID0+XG4gICAgICBjbGVhbih7XG4gICAgICAgIGlkOiBpdGVtLnVybCxcbiAgICAgICAgdXJsOiBpdGVtLnVybCxcbiAgICAgICAgdGl0bGU6IGl0ZW0udGl0bGUsXG4gICAgICAgIGNvbnRlbnRfaHRtbDogaXRlbS5jb250ZW50LFxuICAgICAgICBkYXRlX3B1Ymxpc2hlZDogaXRlbS5wdWJsaXNoZWQudG9VVENTdHJpbmcoKSxcbiAgICAgICAgZGF0ZV9tb2RpZmllZDogaXRlbS51cGRhdGVkPy50b1VUQ1N0cmluZygpLFxuICAgICAgICBpbWFnZTogaXRlbS5pbWFnZSxcbiAgICAgIH0pXG4gICAgKSxcbiAgfSk7XG5cbiAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KGZlZWQpO1xufVxuXG4vKiogUmVtb3ZlIHVuZGVmaW5lZCB2YWx1ZXMgb2YgYW4gb2JqZWN0ICovXG5mdW5jdGlvbiBjbGVhbihvYmo6IFJlY29yZDxzdHJpbmcsIHVua25vd24+KSB7XG4gIHJldHVybiBPYmplY3QuZnJvbUVudHJpZXMoXG4gICAgT2JqZWN0LmVudHJpZXMob2JqKS5maWx0ZXIoKFssIHZhbHVlXSkgPT4gdmFsdWUgIT09IHVuZGVmaW5lZCksXG4gICk7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsU0FBUyxZQUFZLFFBQVEsd0JBQXdCO0FBQ3JELFNBQVMsS0FBSyxRQUFRLDBCQUEwQjtBQUNoRCxTQUFTLGlCQUFpQixRQUFRLGdDQUFnQztBQUNsRSxTQUFTLFlBQVksUUFBUSwrQkFBK0I7QUFDNUQsU0FBUyxJQUFJLEVBQUUsU0FBUyxRQUFRLGlCQUFpQjtBQUNqRCxTQUFTLElBQUksUUFBUSxrQkFBa0I7QUF1RXZDLE9BQU8sTUFBTSxXQUFvQjtFQUMvQix5QkFBeUIsR0FDekIsUUFBUTtFQUVSLGtDQUFrQyxHQUNsQyxPQUFPO0VBRVAsbUJBQW1CLEdBQ25CLE1BQU07RUFFTixnQ0FBZ0MsR0FDaEMsT0FBTztFQUVQLGtCQUFrQixHQUNsQixNQUFNO0lBQ0osT0FBTztJQUNQLFdBQVcsSUFBSTtJQUNmLGFBQWE7SUFDYixNQUFNO0lBQ04sV0FBVztFQUNiO0VBQ0EsT0FBTztJQUNMLE9BQU87SUFDUCxhQUFhO0lBQ2IsV0FBVztJQUNYLFNBQVM7SUFDVCxNQUFNO0VBQ1I7QUFDRixFQUFFO0FBdUJGLE1BQU0sbUJBQW1CLENBQUMsS0FBSyxFQUFFLG9CQUFvQixDQUFDO0FBRXRELGVBQWUsU0FBVSxXQUFxQjtFQUM1QyxNQUFNLFVBQVUsTUFBTSxVQUFVO0VBRWhDLE9BQU8sQ0FBQztJQUNOLEtBQUssZ0JBQWdCLENBQUMsY0FBYztNQUNsQyxNQUFNLFNBQVMsTUFBTSxPQUFPLENBQUMsUUFBUSxNQUFNLElBQ3ZDLFFBQVEsTUFBTSxHQUNkO1FBQUMsUUFBUSxNQUFNO09BQUM7TUFFcEIsTUFBTSxRQUFRLEtBQUssTUFBTSxDQUFDLEtBQUssQ0FDN0IsUUFBUSxLQUFLLEVBQ2IsUUFBUSxJQUFJLEVBQ1osUUFBUSxLQUFLO01BR2YsTUFBTSxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsR0FBRztNQUN4QixNQUFNLFdBQVcsS0FBSyxNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUM7TUFFL0MsTUFBTSxPQUFpQjtRQUNyQixPQUFPLGFBQWEsVUFBVSxLQUFLLEtBQUs7UUFDeEMsYUFBYSxhQUFhLFVBQVUsS0FBSyxXQUFXO1FBQ3BELFdBQVcsYUFBYSxVQUFVLEtBQUssU0FBUztRQUNoRCxNQUFNLGFBQWEsVUFBVSxLQUFLLElBQUk7UUFDdEMsS0FBSyxLQUFLLEdBQUcsQ0FBQyxJQUFJO1FBQ2xCLFdBQVcsS0FBSyxTQUFTLEtBQUssT0FDMUIsbUJBQ0EsS0FBSyxTQUFTLElBQUk7UUFDdEIsT0FBTyxNQUFNLEdBQUcsQ0FBQyxDQUFDO1VBQ2hCLE1BQU0sVUFBVSxhQUFhLE1BQU0sTUFBTSxPQUFPLEdBQUc7VUFDbkQsTUFBTSxVQUFVLEtBQUssR0FBRyxDQUFDLEtBQUssR0FBRyxFQUFFO1VBQ25DLE1BQU0sZUFBZSxRQUFRLElBQUksSUFBSSxVQUFVLFdBQVc7VUFDMUQsTUFBTSxZQUFZLGFBQWEsTUFBTSxNQUFNLEtBQUs7VUFDaEQsTUFBTSxRQUFRLGNBQWMsWUFDeEIsS0FBSyxHQUFHLENBQUMsV0FBVyxRQUNwQjtVQUVKLE9BQU87WUFDTCxPQUFPLGFBQWEsTUFBTSxNQUFNLEtBQUs7WUFDckMsS0FBSyxLQUFLLEdBQUcsQ0FBQyxLQUFLLEdBQUcsRUFBRTtZQUN4QixhQUFhLGFBQWEsTUFBTSxNQUFNLFdBQVc7WUFDakQsV0FBVyxhQUFhLE1BQU0sTUFBTSxTQUFTO1lBQzdDLFNBQVMsYUFBYSxNQUFNLE1BQU0sT0FBTztZQUN6QyxTQUFTO1lBQ1QsTUFBTSxhQUFhLE1BQU0sTUFBTSxJQUFJO1lBQ25DO1VBQ0Y7UUFDRjtNQUNGO01BRUEsS0FBSyxNQUFNLFlBQVksT0FBUTtRQUM3QixNQUFNLFNBQVMsYUFBYSxVQUFVLEtBQUssQ0FBQztRQUM1QyxNQUFNLE9BQU8sS0FBSyxHQUFHLENBQUMsVUFBVTtRQUVoQyxPQUFRO1VBQ04sS0FBSztVQUNMLEtBQUs7VUFDTCxLQUFLO1lBQ0gsS0FBSyxLQUFLLENBQUMsSUFBSSxDQUNiLEtBQUssTUFBTSxDQUFDO2NBQUUsS0FBSztjQUFVLFNBQVMsWUFBWSxNQUFNO1lBQU07WUFFaEU7VUFFRixLQUFLO1lBQ0gsS0FBSyxLQUFLLENBQUMsSUFBSSxDQUNiLEtBQUssTUFBTSxDQUFDO2NBQUUsS0FBSztjQUFVLFNBQVMsYUFBYSxNQUFNO1lBQU07WUFFakU7VUFFRjtZQUNFLE1BQU0sSUFBSSxNQUFNLENBQUMscUJBQXFCLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDckQ7TUFDRjtJQUNGO0VBQ0Y7QUFDRjtBQUVBLFNBQVMsUUFBUSxJQUFTLEVBQUUsSUFBWTtFQUN0QyxPQUFPLEtBQUssVUFBVSxDQUNwQiwyQkFDQSxDQUFDLFFBQVEsTUFBTSxRQUFVLENBQUMsQ0FBQyxFQUFFLEtBQUssRUFBRSxFQUFFLElBQUksSUFBSSxPQUFPLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FBQztBQUV0RTtBQUVBLFNBQVMsWUFBWSxJQUFjLEVBQUUsSUFBWTtFQUMvQyxNQUFNLE9BQU87SUFDWCxDQUFDLEtBQUssRUFBRTtNQUFFLE9BQU87UUFBQztVQUFDO1VBQU87VUFBVztVQUFRO1NBQWtCO09BQUM7SUFBQztJQUNqRSxLQUFLO01BQ0gsWUFBWTtNQUNaLGFBQWE7SUFDZjtJQUNBLEtBQUs7TUFDSCxrQkFBa0I7TUFDbEIsY0FBYztNQUNkLGFBQWE7TUFDYixlQUFlO01BQ2YsYUFBYTtNQUNiLGdCQUFnQjtNQUNoQixZQUFZO01BQ1osU0FBUyxNQUFNO1FBQ2IsT0FBTyxLQUFLLEtBQUs7UUFDakIsTUFBTSxLQUFLLEdBQUc7UUFDZCxhQUFhO1VBQ1gsU0FBUztVQUNULFFBQVE7VUFDUixTQUFTO1FBQ1g7UUFDQSxhQUFhLEtBQUssV0FBVztRQUM3QixlQUFlLEtBQUssU0FBUyxDQUFDLFdBQVc7UUFDekMsVUFBVSxLQUFLLElBQUk7UUFDbkIsV0FBVyxLQUFLLFNBQVM7UUFDekIsTUFBTSxLQUFLLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxPQUNwQixNQUFNO1lBQ0osT0FBTyxLQUFLLEtBQUs7WUFDakIsTUFBTSxLQUFLLEdBQUc7WUFDZCxNQUFNO2NBQ0osZ0JBQWdCO2NBQ2hCLFNBQVMsS0FBSyxHQUFHO1lBQ25CO1lBQ0EsYUFBYSxLQUFLLFdBQVc7WUFDN0IsbUJBQW1CLEtBQUssT0FBTztZQUMvQixTQUFTLEtBQUssU0FBUyxDQUFDLFdBQVc7WUFDbkMsZ0JBQWdCLEtBQUssT0FBTyxFQUFFO1lBQzlCLE1BQU0sS0FBSyxLQUFLLEdBQ1o7Y0FBRSxhQUFhO2NBQVksWUFBWSxLQUFLLEtBQUs7WUFBQyxJQUNsRDtVQUNOO01BRUo7SUFDRjtFQUNGO0VBRUEsT0FBTyxVQUFVO0FBQ25CO0FBRUEsU0FBUyxhQUFhLElBQWMsRUFBRSxJQUFZO0VBQ2hELE1BQU0sT0FBTyxNQUFNO0lBQ2pCLFNBQVM7SUFDVCxPQUFPLEtBQUssS0FBSztJQUNqQixlQUFlLEtBQUssR0FBRztJQUN2QixVQUFVO0lBQ1YsYUFBYSxLQUFLLFdBQVc7SUFDN0IsT0FBTyxLQUFLLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxPQUNyQixNQUFNO1FBQ0osSUFBSSxLQUFLLEdBQUc7UUFDWixLQUFLLEtBQUssR0FBRztRQUNiLE9BQU8sS0FBSyxLQUFLO1FBQ2pCLGNBQWMsS0FBSyxPQUFPO1FBQzFCLGdCQUFnQixLQUFLLFNBQVMsQ0FBQyxXQUFXO1FBQzFDLGVBQWUsS0FBSyxPQUFPLEVBQUU7UUFDN0IsT0FBTyxLQUFLLEtBQUs7TUFDbkI7RUFFSjtFQUVBLE9BQU8sS0FBSyxTQUFTLENBQUM7QUFDeEI7QUFFQSx5Q0FBeUMsR0FDekMsU0FBUyxNQUFNLEdBQTRCO0VBQ3pDLE9BQU8sT0FBTyxXQUFXLENBQ3ZCLE9BQU8sT0FBTyxDQUFDLEtBQUssTUFBTSxDQUFDLENBQUMsR0FBRyxNQUFNLEdBQUssVUFBVTtBQUV4RCJ9