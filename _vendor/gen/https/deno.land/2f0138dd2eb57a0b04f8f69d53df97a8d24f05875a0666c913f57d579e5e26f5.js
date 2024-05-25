import { assign, merge } from "../core/utils/object.ts";
import { log } from "../core/utils/log.ts";
// Default options
export const defaults = {
  extensions: [
    ".html"
  ],
  languages: []
};
export default function multilanguage(userOptions) {
  const options = merge(defaults, userOptions);
  return (site)=>{
    // Configure the merged keys
    options.languages.forEach((lang)=>site.mergeKey(lang, "object"));
    /**
     * Preprocessor to setup multilanguage pages
     *
     * + prevent incorrect data type of "page.data.lang"
     * + display guidance (warning log) to some bug-potential cases
     * + convert "page.data.lang" array type page (if yes) to string type page
     */ site.preprocess(options.extensions, (filteredPages, allPages)=>{
      for (const page of filteredPages){
        const { data } = page;
        const languages = data.lang;
        // If the "lang" variable is not defined, use the default language
        if (languages === undefined) {
          data.lang = options.defaultLanguage;
          continue;
        }
        // If the "lang" variable is a string, check if it's a valid language
        if (typeof languages === "string") {
          if (!options.languages.includes(languages)) {
            log.warn(`[multilanguage plugin] The language "${languages}" in the page ${page.sourcePath} is not defined in the "languages" option.`);
          }
          continue;
        }
        // The "lang" variable of the pages must be an array
        if (!Array.isArray(languages)) {
          throw new Error(`Invalid "lang" variable in ${page.sourcePath}`);
        }
        // Check if these "languages" are all valid language codes
        if (languages.some((lang)=>!options.languages.includes(lang))) {
          log.warn(`[multilanguage plugin] One or more languages in the page ${page.sourcePath} are not defined in the "languages" option.`);
          continue;
        }
        // Create a new page per language
        const newPages = [];
        const id = data.id ?? page.src.path.slice(1);
        for (const lang of languages){
          const newData = {
            ...data,
            lang,
            id
          };
          const newPage = page.duplicate(undefined, newData);
          newPages.push(newPage);
        }
        // Replace the current page with the multiple language versions
        allPages.splice(allPages.indexOf(page), 1, ...newPages);
      }
    });
    /**
     * Preprocessor to process the multilanguage data
     *
     * + convert plain url to language url
     * + create the alternates
     * + sort the alternates
     */ site.preprocess(options.extensions, (pages)=>{
      for (const page of pages){
        const { data } = page;
        const { lang } = data;
        // Resolve the language data
        for (const key of options.languages){
          if (key in data) {
            if (key === lang) {
              assign(data, data[key]);
            }
            delete data[key];
          }
        }
        const { url } = data;
        const isLangUrl = url.startsWith(`/${lang}/`);
        const isDefaultLang = lang === options.defaultLanguage;
        if (!isLangUrl && !isDefaultLang) {
          // Preprocess to prefix all urls with the language code
          data.url = `/${lang}${url}`;
        } else if (isLangUrl && isDefaultLang) {
          // Preprocess to unprefix all urls with the default language code
          data.url = url.slice(lang.length + 1);
        }
        // Create the alternates object if it doesn't exist
        const { id, type } = data;
        if (data.alternates || id === undefined) {
          data.alternates ??= [
            data
          ];
          continue;
        }
        const alternates = [];
        const ids = new Map();
        pages.filter((page)=>page.data.id == id && page.data.type === type).forEach((page)=>{
          const id = `${page.data.lang}-${page.data.id}-${page.data.type}`;
          const existing = ids.get(id);
          if (existing) {
            log.warn(`[multilanguage plugin] The pages ${existing.sourcePath} and ${page.sourcePath} have the same id, type and language.`);
          }
          ids.set(id, page);
          alternates.push(page.data);
          page.data.alternates = alternates;
        });
        // Sort the alternates by language
        alternates.sort((a, b)=>options.languages.indexOf(a.lang) - options.languages.indexOf(b.lang));
      }
    });
    /**
     * Preprocessor to process the Unmatched Language URL
     *
     * + convert unmatchedLangUrl any value to URL string value
     */ site.preprocess(options.extensions, (pages)=>{
      for (const page of pages){
        page.data.unmatchedLangUrl = getUnmatchedLangPath(page, pages);
      }
    });
    // Include automatically the <link rel="alternate"> elements
    // with the other languages
    site.process(options.extensions, (pages)=>{
      for (const page of pages){
        const { document } = page;
        const alternates = page.data.alternates;
        const lang = page.data.lang;
        if (!document || !alternates || !lang) {
          continue;
        }
        // Include <html lang="${lang}"> attribute element if it's missing
        if (!document.documentElement?.getAttribute("lang")) {
          document.documentElement?.setAttribute("lang", lang);
        }
        // Insert the <link> elements automatically
        for (const data of alternates){
          const meta = document.createElement("link");
          meta.setAttribute("rel", "alternate");
          meta.setAttribute("hreflang", data.lang);
          meta.setAttribute("href", site.url(data.url, true));
          document.head.appendChild(meta);
          document.head.appendChild(document.createTextNode("\n"));
        }
        if (page.data.unmatchedLangUrl) {
          appendHreflang("x-default", site.url(page.data.unmatchedLangUrl, true), document);
        }
      }
    });
  };
}
function getUnmatchedLangPath(currentPage, filteredPages) {
  const { sourcePath } = currentPage;
  const { unmatchedLangUrl, alternates } = currentPage.data;
  if (!unmatchedLangUrl) return void 0;
  // If unmatchedLang is an external URL string
  if (URL.canParse(unmatchedLangUrl)) {
    return unmatchedLangUrl;
  }
  // If unmatchedLang is an source path string
  if (unmatchedLangUrl.startsWith("/")) {
    const langSelectorPage = filteredPages.some((page)=>page.data.url === unmatchedLangUrl);
    if (!langSelectorPage) {
      log.warn(`[multilanguage plugin] The URL <cyan>${unmatchedLangUrl}</cyan> of unmatchedLangUrl option is not found in ${sourcePath}.`);
    }
    return langSelectorPage ? unmatchedLangUrl : void 0;
  }
  // If unmatchedLang is language code → resolve to URL of that language
  const lang = alternates?.find((data)=>data.lang === unmatchedLangUrl);
  if (!lang) {
    log.warn(`[multilanguage plugin] The URL for lang code "${unmatchedLangUrl}" of unmatchedLangUrl option is not found in ${sourcePath}.`);
  }
  return lang?.url;
}
function appendHreflang(lang, url, document) {
  const meta = document.createElement("link");
  meta.setAttribute("rel", "alternate");
  meta.setAttribute("hreflang", lang);
  meta.setAttribute("href", url);
  document.head.appendChild(meta);
  document.head.appendChild(document.createTextNode("\n"));
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvbHVtZUB2Mi4yLjAvcGx1Z2lucy9tdWx0aWxhbmd1YWdlLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFBhZ2UgfSBmcm9tIFwiLi4vY29yZS9maWxlLnRzXCI7XG5pbXBvcnQgeyBhc3NpZ24sIG1lcmdlIH0gZnJvbSBcIi4uL2NvcmUvdXRpbHMvb2JqZWN0LnRzXCI7XG5pbXBvcnQgeyBsb2cgfSBmcm9tIFwiLi4vY29yZS91dGlscy9sb2cudHNcIjtcblxuaW1wb3J0IHR5cGUgU2l0ZSBmcm9tIFwiLi4vY29yZS9zaXRlLnRzXCI7XG5pbXBvcnQgdHlwZSB7IERhdGEgfSBmcm9tIFwiLi4vY29yZS9maWxlLnRzXCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgT3B0aW9ucyB7XG4gIC8qKiBUaGUgbGlzdCBvZiBleHRlbnNpb25zIHVzZWQgZm9yIHRoaXMgcGx1Z2luICovXG4gIGV4dGVuc2lvbnM/OiBzdHJpbmdbXTtcblxuICAvKiogQXZhaWxhYmxlIGxhbmd1YWdlcyAqL1xuICBsYW5ndWFnZXM6IHN0cmluZ1tdO1xuXG4gIC8qKiBBIHByZWZpeC1mcmVlIGxhbmd1YWdlICovXG4gIGRlZmF1bHRMYW5ndWFnZT86IHN0cmluZztcbn1cblxuLy8gRGVmYXVsdCBvcHRpb25zXG5leHBvcnQgY29uc3QgZGVmYXVsdHM6IE9wdGlvbnMgPSB7XG4gIGV4dGVuc2lvbnM6IFtcIi5odG1sXCJdLFxuICBsYW5ndWFnZXM6IFtdLFxufTtcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gbXVsdGlsYW5ndWFnZSh1c2VyT3B0aW9uczogT3B0aW9ucykge1xuICBjb25zdCBvcHRpb25zID0gbWVyZ2UoZGVmYXVsdHMsIHVzZXJPcHRpb25zKTtcblxuICByZXR1cm4gKHNpdGU6IFNpdGUpID0+IHtcbiAgICAvLyBDb25maWd1cmUgdGhlIG1lcmdlZCBrZXlzXG4gICAgb3B0aW9ucy5sYW5ndWFnZXMuZm9yRWFjaCgobGFuZykgPT4gc2l0ZS5tZXJnZUtleShsYW5nLCBcIm9iamVjdFwiKSk7XG5cbiAgICAvKipcbiAgICAgKiBQcmVwcm9jZXNzb3IgdG8gc2V0dXAgbXVsdGlsYW5ndWFnZSBwYWdlc1xuICAgICAqXG4gICAgICogKyBwcmV2ZW50IGluY29ycmVjdCBkYXRhIHR5cGUgb2YgXCJwYWdlLmRhdGEubGFuZ1wiXG4gICAgICogKyBkaXNwbGF5IGd1aWRhbmNlICh3YXJuaW5nIGxvZykgdG8gc29tZSBidWctcG90ZW50aWFsIGNhc2VzXG4gICAgICogKyBjb252ZXJ0IFwicGFnZS5kYXRhLmxhbmdcIiBhcnJheSB0eXBlIHBhZ2UgKGlmIHllcykgdG8gc3RyaW5nIHR5cGUgcGFnZVxuICAgICAqL1xuICAgIHNpdGUucHJlcHJvY2VzcyhvcHRpb25zLmV4dGVuc2lvbnMsIChmaWx0ZXJlZFBhZ2VzLCBhbGxQYWdlcykgPT4ge1xuICAgICAgZm9yIChjb25zdCBwYWdlIG9mIGZpbHRlcmVkUGFnZXMpIHtcbiAgICAgICAgY29uc3QgeyBkYXRhIH0gPSBwYWdlO1xuICAgICAgICBjb25zdCBsYW5ndWFnZXMgPSBkYXRhLmxhbmcgYXMgc3RyaW5nIHwgc3RyaW5nW10gfCB1bmRlZmluZWQ7XG5cbiAgICAgICAgLy8gSWYgdGhlIFwibGFuZ1wiIHZhcmlhYmxlIGlzIG5vdCBkZWZpbmVkLCB1c2UgdGhlIGRlZmF1bHQgbGFuZ3VhZ2VcbiAgICAgICAgaWYgKGxhbmd1YWdlcyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgZGF0YS5sYW5nID0gb3B0aW9ucy5kZWZhdWx0TGFuZ3VhZ2U7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBJZiB0aGUgXCJsYW5nXCIgdmFyaWFibGUgaXMgYSBzdHJpbmcsIGNoZWNrIGlmIGl0J3MgYSB2YWxpZCBsYW5ndWFnZVxuICAgICAgICBpZiAodHlwZW9mIGxhbmd1YWdlcyA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgIGlmICghb3B0aW9ucy5sYW5ndWFnZXMuaW5jbHVkZXMobGFuZ3VhZ2VzKSkge1xuICAgICAgICAgICAgbG9nLndhcm4oXG4gICAgICAgICAgICAgIGBbbXVsdGlsYW5ndWFnZSBwbHVnaW5dIFRoZSBsYW5ndWFnZSBcIiR7bGFuZ3VhZ2VzfVwiIGluIHRoZSBwYWdlICR7cGFnZS5zb3VyY2VQYXRofSBpcyBub3QgZGVmaW5lZCBpbiB0aGUgXCJsYW5ndWFnZXNcIiBvcHRpb24uYCxcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gVGhlIFwibGFuZ1wiIHZhcmlhYmxlIG9mIHRoZSBwYWdlcyBtdXN0IGJlIGFuIGFycmF5XG4gICAgICAgIGlmICghQXJyYXkuaXNBcnJheShsYW5ndWFnZXMpKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIFwibGFuZ1wiIHZhcmlhYmxlIGluICR7cGFnZS5zb3VyY2VQYXRofWApO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQ2hlY2sgaWYgdGhlc2UgXCJsYW5ndWFnZXNcIiBhcmUgYWxsIHZhbGlkIGxhbmd1YWdlIGNvZGVzXG4gICAgICAgIGlmIChsYW5ndWFnZXMuc29tZSgobGFuZykgPT4gIW9wdGlvbnMubGFuZ3VhZ2VzLmluY2x1ZGVzKGxhbmcpKSkge1xuICAgICAgICAgIGxvZy53YXJuKFxuICAgICAgICAgICAgYFttdWx0aWxhbmd1YWdlIHBsdWdpbl0gT25lIG9yIG1vcmUgbGFuZ3VhZ2VzIGluIHRoZSBwYWdlICR7cGFnZS5zb3VyY2VQYXRofSBhcmUgbm90IGRlZmluZWQgaW4gdGhlIFwibGFuZ3VhZ2VzXCIgb3B0aW9uLmAsXG4gICAgICAgICAgKTtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIENyZWF0ZSBhIG5ldyBwYWdlIHBlciBsYW5ndWFnZVxuICAgICAgICBjb25zdCBuZXdQYWdlczogUGFnZVtdID0gW107XG4gICAgICAgIGNvbnN0IGlkID0gZGF0YS5pZCA/PyBwYWdlLnNyYy5wYXRoLnNsaWNlKDEpO1xuXG4gICAgICAgIGZvciAoY29uc3QgbGFuZyBvZiBsYW5ndWFnZXMpIHtcbiAgICAgICAgICBjb25zdCBuZXdEYXRhOiBEYXRhID0geyAuLi5kYXRhLCBsYW5nLCBpZCB9O1xuICAgICAgICAgIGNvbnN0IG5ld1BhZ2UgPSBwYWdlLmR1cGxpY2F0ZSh1bmRlZmluZWQsIG5ld0RhdGEpO1xuICAgICAgICAgIG5ld1BhZ2VzLnB1c2gobmV3UGFnZSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBSZXBsYWNlIHRoZSBjdXJyZW50IHBhZ2Ugd2l0aCB0aGUgbXVsdGlwbGUgbGFuZ3VhZ2UgdmVyc2lvbnNcbiAgICAgICAgYWxsUGFnZXMuc3BsaWNlKGFsbFBhZ2VzLmluZGV4T2YocGFnZSksIDEsIC4uLm5ld1BhZ2VzKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIC8qKlxuICAgICAqIFByZXByb2Nlc3NvciB0byBwcm9jZXNzIHRoZSBtdWx0aWxhbmd1YWdlIGRhdGFcbiAgICAgKlxuICAgICAqICsgY29udmVydCBwbGFpbiB1cmwgdG8gbGFuZ3VhZ2UgdXJsXG4gICAgICogKyBjcmVhdGUgdGhlIGFsdGVybmF0ZXNcbiAgICAgKiArIHNvcnQgdGhlIGFsdGVybmF0ZXNcbiAgICAgKi9cbiAgICBzaXRlLnByZXByb2Nlc3Mob3B0aW9ucy5leHRlbnNpb25zLCAocGFnZXMpID0+IHtcbiAgICAgIGZvciAoY29uc3QgcGFnZSBvZiBwYWdlcykge1xuICAgICAgICBjb25zdCB7IGRhdGEgfSA9IHBhZ2U7XG4gICAgICAgIGNvbnN0IHsgbGFuZyB9ID0gZGF0YTtcblxuICAgICAgICAvLyBSZXNvbHZlIHRoZSBsYW5ndWFnZSBkYXRhXG4gICAgICAgIGZvciAoY29uc3Qga2V5IG9mIG9wdGlvbnMubGFuZ3VhZ2VzKSB7XG4gICAgICAgICAgaWYgKGtleSBpbiBkYXRhKSB7XG4gICAgICAgICAgICBpZiAoa2V5ID09PSBsYW5nKSB7XG4gICAgICAgICAgICAgIGFzc2lnbihkYXRhLCBkYXRhW2tleV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZGVsZXRlIGRhdGFba2V5XTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCB7IHVybCB9ID0gZGF0YTtcbiAgICAgICAgY29uc3QgaXNMYW5nVXJsID0gdXJsLnN0YXJ0c1dpdGgoYC8ke2xhbmd9L2ApO1xuICAgICAgICBjb25zdCBpc0RlZmF1bHRMYW5nID0gbGFuZyA9PT0gb3B0aW9ucy5kZWZhdWx0TGFuZ3VhZ2U7XG4gICAgICAgIGlmICghaXNMYW5nVXJsICYmICFpc0RlZmF1bHRMYW5nKSB7XG4gICAgICAgICAgLy8gUHJlcHJvY2VzcyB0byBwcmVmaXggYWxsIHVybHMgd2l0aCB0aGUgbGFuZ3VhZ2UgY29kZVxuICAgICAgICAgIGRhdGEudXJsID0gYC8ke2xhbmd9JHt1cmx9YDtcbiAgICAgICAgfSBlbHNlIGlmIChpc0xhbmdVcmwgJiYgaXNEZWZhdWx0TGFuZykge1xuICAgICAgICAgIC8vIFByZXByb2Nlc3MgdG8gdW5wcmVmaXggYWxsIHVybHMgd2l0aCB0aGUgZGVmYXVsdCBsYW5ndWFnZSBjb2RlXG4gICAgICAgICAgZGF0YS51cmwgPSB1cmwuc2xpY2UobGFuZy5sZW5ndGggKyAxKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIENyZWF0ZSB0aGUgYWx0ZXJuYXRlcyBvYmplY3QgaWYgaXQgZG9lc24ndCBleGlzdFxuICAgICAgICBjb25zdCB7IGlkLCB0eXBlIH0gPSBkYXRhO1xuICAgICAgICBpZiAoZGF0YS5hbHRlcm5hdGVzIHx8IGlkID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICBkYXRhLmFsdGVybmF0ZXMgPz89IFtkYXRhXTtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGFsdGVybmF0ZXM6IERhdGFbXSA9IFtdO1xuICAgICAgICBjb25zdCBpZHMgPSBuZXcgTWFwPHN0cmluZywgUGFnZT4oKTtcblxuICAgICAgICBwYWdlcy5maWx0ZXIoKHBhZ2UpID0+IHBhZ2UuZGF0YS5pZCA9PSBpZCAmJiBwYWdlLmRhdGEudHlwZSA9PT0gdHlwZSlcbiAgICAgICAgICAuZm9yRWFjaCgocGFnZSkgPT4ge1xuICAgICAgICAgICAgY29uc3QgaWQgPSBgJHtwYWdlLmRhdGEubGFuZ30tJHtwYWdlLmRhdGEuaWR9LSR7cGFnZS5kYXRhLnR5cGV9YDtcbiAgICAgICAgICAgIGNvbnN0IGV4aXN0aW5nID0gaWRzLmdldChpZCk7XG4gICAgICAgICAgICBpZiAoZXhpc3RpbmcpIHtcbiAgICAgICAgICAgICAgbG9nLndhcm4oXG4gICAgICAgICAgICAgICAgYFttdWx0aWxhbmd1YWdlIHBsdWdpbl0gVGhlIHBhZ2VzICR7ZXhpc3Rpbmcuc291cmNlUGF0aH0gYW5kICR7cGFnZS5zb3VyY2VQYXRofSBoYXZlIHRoZSBzYW1lIGlkLCB0eXBlIGFuZCBsYW5ndWFnZS5gLFxuICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWRzLnNldChpZCwgcGFnZSk7XG4gICAgICAgICAgICBhbHRlcm5hdGVzLnB1c2gocGFnZS5kYXRhKTtcbiAgICAgICAgICAgIHBhZ2UuZGF0YS5hbHRlcm5hdGVzID0gYWx0ZXJuYXRlcztcbiAgICAgICAgICB9KTtcblxuICAgICAgICAvLyBTb3J0IHRoZSBhbHRlcm5hdGVzIGJ5IGxhbmd1YWdlXG4gICAgICAgIGFsdGVybmF0ZXMuc29ydCgoYSwgYikgPT5cbiAgICAgICAgICBvcHRpb25zLmxhbmd1YWdlcy5pbmRleE9mKGEubGFuZyEpIC1cbiAgICAgICAgICBvcHRpb25zLmxhbmd1YWdlcy5pbmRleE9mKGIubGFuZyEpXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICAvKipcbiAgICAgKiBQcmVwcm9jZXNzb3IgdG8gcHJvY2VzcyB0aGUgVW5tYXRjaGVkIExhbmd1YWdlIFVSTFxuICAgICAqXG4gICAgICogKyBjb252ZXJ0IHVubWF0Y2hlZExhbmdVcmwgYW55IHZhbHVlIHRvIFVSTCBzdHJpbmcgdmFsdWVcbiAgICAgKi9cbiAgICBzaXRlLnByZXByb2Nlc3Mob3B0aW9ucy5leHRlbnNpb25zLCAocGFnZXMpID0+IHtcbiAgICAgIGZvciAoY29uc3QgcGFnZSBvZiBwYWdlcykge1xuICAgICAgICBwYWdlLmRhdGEudW5tYXRjaGVkTGFuZ1VybCA9IGdldFVubWF0Y2hlZExhbmdQYXRoKFxuICAgICAgICAgIHBhZ2UsXG4gICAgICAgICAgcGFnZXMsXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICAvLyBJbmNsdWRlIGF1dG9tYXRpY2FsbHkgdGhlIDxsaW5rIHJlbD1cImFsdGVybmF0ZVwiPiBlbGVtZW50c1xuICAgIC8vIHdpdGggdGhlIG90aGVyIGxhbmd1YWdlc1xuICAgIHNpdGUucHJvY2VzcyhvcHRpb25zLmV4dGVuc2lvbnMsIChwYWdlcykgPT4ge1xuICAgICAgZm9yIChjb25zdCBwYWdlIG9mIHBhZ2VzKSB7XG4gICAgICAgIGNvbnN0IHsgZG9jdW1lbnQgfSA9IHBhZ2U7XG4gICAgICAgIGNvbnN0IGFsdGVybmF0ZXMgPSBwYWdlLmRhdGEuYWx0ZXJuYXRlcztcbiAgICAgICAgY29uc3QgbGFuZyA9IHBhZ2UuZGF0YS5sYW5nIGFzIHN0cmluZyB8IHVuZGVmaW5lZDtcblxuICAgICAgICBpZiAoIWRvY3VtZW50IHx8ICFhbHRlcm5hdGVzIHx8ICFsYW5nKSB7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBJbmNsdWRlIDxodG1sIGxhbmc9XCIke2xhbmd9XCI+IGF0dHJpYnV0ZSBlbGVtZW50IGlmIGl0J3MgbWlzc2luZ1xuICAgICAgICBpZiAoIWRvY3VtZW50LmRvY3VtZW50RWxlbWVudD8uZ2V0QXR0cmlidXRlKFwibGFuZ1wiKSkge1xuICAgICAgICAgIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudD8uc2V0QXR0cmlidXRlKFwibGFuZ1wiLCBsYW5nKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEluc2VydCB0aGUgPGxpbms+IGVsZW1lbnRzIGF1dG9tYXRpY2FsbHlcbiAgICAgICAgZm9yIChjb25zdCBkYXRhIG9mIGFsdGVybmF0ZXMpIHtcbiAgICAgICAgICBjb25zdCBtZXRhID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImxpbmtcIik7XG4gICAgICAgICAgbWV0YS5zZXRBdHRyaWJ1dGUoXCJyZWxcIiwgXCJhbHRlcm5hdGVcIik7XG4gICAgICAgICAgbWV0YS5zZXRBdHRyaWJ1dGUoXCJocmVmbGFuZ1wiLCBkYXRhLmxhbmcgYXMgc3RyaW5nKTtcbiAgICAgICAgICBtZXRhLnNldEF0dHJpYnV0ZShcImhyZWZcIiwgc2l0ZS51cmwoZGF0YS51cmwsIHRydWUpKTtcbiAgICAgICAgICBkb2N1bWVudC5oZWFkLmFwcGVuZENoaWxkKG1ldGEpO1xuICAgICAgICAgIGRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoXCJcXG5cIikpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHBhZ2UuZGF0YS51bm1hdGNoZWRMYW5nVXJsKSB7XG4gICAgICAgICAgYXBwZW5kSHJlZmxhbmcoXG4gICAgICAgICAgICBcIngtZGVmYXVsdFwiLFxuICAgICAgICAgICAgc2l0ZS51cmwocGFnZS5kYXRhLnVubWF0Y2hlZExhbmdVcmwsIHRydWUpLFxuICAgICAgICAgICAgZG9jdW1lbnQsXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuICB9O1xufVxuXG5mdW5jdGlvbiBnZXRVbm1hdGNoZWRMYW5nUGF0aChcbiAgY3VycmVudFBhZ2U6IFBhZ2U8RGF0YT4sXG4gIGZpbHRlcmVkUGFnZXM6IFBhZ2U8RGF0YT5bXSxcbik6IHN0cmluZyB8IHVuZGVmaW5lZCB7XG4gIGNvbnN0IHsgc291cmNlUGF0aCB9ID0gY3VycmVudFBhZ2U7XG4gIGNvbnN0IHsgdW5tYXRjaGVkTGFuZ1VybCwgYWx0ZXJuYXRlcyB9ID0gY3VycmVudFBhZ2UuZGF0YTtcblxuICBpZiAoIXVubWF0Y2hlZExhbmdVcmwpIHJldHVybiB2b2lkIDA7XG5cbiAgLy8gSWYgdW5tYXRjaGVkTGFuZyBpcyBhbiBleHRlcm5hbCBVUkwgc3RyaW5nXG4gIGlmIChVUkwuY2FuUGFyc2UodW5tYXRjaGVkTGFuZ1VybCkpIHtcbiAgICByZXR1cm4gdW5tYXRjaGVkTGFuZ1VybDtcbiAgfVxuXG4gIC8vIElmIHVubWF0Y2hlZExhbmcgaXMgYW4gc291cmNlIHBhdGggc3RyaW5nXG4gIGlmICh1bm1hdGNoZWRMYW5nVXJsLnN0YXJ0c1dpdGgoXCIvXCIpKSB7XG4gICAgY29uc3QgbGFuZ1NlbGVjdG9yUGFnZSA9IGZpbHRlcmVkUGFnZXMuc29tZShcbiAgICAgIChwYWdlKSA9PiBwYWdlLmRhdGEudXJsID09PSB1bm1hdGNoZWRMYW5nVXJsLFxuICAgICk7XG5cbiAgICBpZiAoIWxhbmdTZWxlY3RvclBhZ2UpIHtcbiAgICAgIGxvZy53YXJuKFxuICAgICAgICBgW211bHRpbGFuZ3VhZ2UgcGx1Z2luXSBUaGUgVVJMIDxjeWFuPiR7dW5tYXRjaGVkTGFuZ1VybH08L2N5YW4+IG9mIHVubWF0Y2hlZExhbmdVcmwgb3B0aW9uIGlzIG5vdCBmb3VuZCBpbiAke3NvdXJjZVBhdGh9LmAsXG4gICAgICApO1xuICAgIH1cbiAgICByZXR1cm4gbGFuZ1NlbGVjdG9yUGFnZSA/IHVubWF0Y2hlZExhbmdVcmwgOiB2b2lkIDA7XG4gIH1cblxuICAvLyBJZiB1bm1hdGNoZWRMYW5nIGlzIGxhbmd1YWdlIGNvZGUg4oaSIHJlc29sdmUgdG8gVVJMIG9mIHRoYXQgbGFuZ3VhZ2VcbiAgY29uc3QgbGFuZyA9IGFsdGVybmF0ZXM/LmZpbmQoKGRhdGEpID0+IGRhdGEubGFuZyA9PT0gdW5tYXRjaGVkTGFuZ1VybCk7XG4gIGlmICghbGFuZykge1xuICAgIGxvZy53YXJuKFxuICAgICAgYFttdWx0aWxhbmd1YWdlIHBsdWdpbl0gVGhlIFVSTCBmb3IgbGFuZyBjb2RlIFwiJHt1bm1hdGNoZWRMYW5nVXJsfVwiIG9mIHVubWF0Y2hlZExhbmdVcmwgb3B0aW9uIGlzIG5vdCBmb3VuZCBpbiAke3NvdXJjZVBhdGh9LmAsXG4gICAgKTtcbiAgfVxuICByZXR1cm4gbGFuZz8udXJsO1xufVxuXG5mdW5jdGlvbiBhcHBlbmRIcmVmbGFuZyhsYW5nOiBzdHJpbmcsIHVybDogc3RyaW5nLCBkb2N1bWVudDogRG9jdW1lbnQpIHtcbiAgY29uc3QgbWV0YSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJsaW5rXCIpO1xuICBtZXRhLnNldEF0dHJpYnV0ZShcInJlbFwiLCBcImFsdGVybmF0ZVwiKTtcbiAgbWV0YS5zZXRBdHRyaWJ1dGUoXCJocmVmbGFuZ1wiLCBsYW5nKTtcbiAgbWV0YS5zZXRBdHRyaWJ1dGUoXCJocmVmXCIsIHVybCk7XG4gIGRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQobWV0YSk7XG4gIGRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoXCJcXG5cIikpO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNBLFNBQVMsTUFBTSxFQUFFLEtBQUssUUFBUSwwQkFBMEI7QUFDeEQsU0FBUyxHQUFHLFFBQVEsdUJBQXVCO0FBZ0IzQyxrQkFBa0I7QUFDbEIsT0FBTyxNQUFNLFdBQW9CO0VBQy9CLFlBQVk7SUFBQztHQUFRO0VBQ3JCLFdBQVcsRUFBRTtBQUNmLEVBQUU7QUFFRixlQUFlLFNBQVMsY0FBYyxXQUFvQjtFQUN4RCxNQUFNLFVBQVUsTUFBTSxVQUFVO0VBRWhDLE9BQU8sQ0FBQztJQUNOLDRCQUE0QjtJQUM1QixRQUFRLFNBQVMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxPQUFTLEtBQUssUUFBUSxDQUFDLE1BQU07SUFFeEQ7Ozs7OztLQU1DLEdBQ0QsS0FBSyxVQUFVLENBQUMsUUFBUSxVQUFVLEVBQUUsQ0FBQyxlQUFlO01BQ2xELEtBQUssTUFBTSxR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