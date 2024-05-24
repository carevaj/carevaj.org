import { resolveInclude } from "./utils/path.ts";
import { isGenerator } from "./utils/generator.ts";
import { concurrent } from "./utils/concurrent.ts";
import { mergeData } from "./utils/merge_data.ts";
import { getPageUrl } from "./utils/page_url.ts";
import { getPageDate } from "./utils/page_date.ts";
import { posix } from "../deps/path.ts";
/**
 * The renderer is responsible for rendering the site pages
 * in the right order and using the right template engine.
 */ export default class Renderer {
  /** The default folder to include the layouts */ includes;
  /** The filesystem instance used to read the layouts */ fs;
  /** To convert the urls to pretty /example.html => /example/ */ prettyUrls;
  /** All preprocessors */ preprocessors;
  /** Available file formats */ formats;
  /** The registered helpers */ helpers = new Map();
  constructor(options){
    this.includes = options.includes;
    this.prettyUrls = options.prettyUrls;
    this.preprocessors = options.preprocessors;
    this.formats = options.formats;
    this.fs = options.fs;
  }
  /** Register a new helper used by the template engines */ addHelper(name, fn, options) {
    this.helpers.set(name, [
      fn,
      options
    ]);
    for (const format of this.formats.entries.values()){
      format.engines?.forEach((engine)=>engine.addHelper(name, fn, options));
    }
    return this;
  }
  /** Render the provided pages */ async renderPages(from, to, onDemand) {
    for (const group of this.#groupPages(from)){
      const pages = [];
      const generators = [];
      // Split regular pages and generators
      for (const page of group){
        if (isGenerator(page.data.content)) {
          generators.push(page);
          continue;
        }
        if (page.data.ondemand) {
          onDemand.push(page);
          continue;
        }
        pages.push(page);
      }
      // Preprocess the pages and add them to site.pages
      await this.preprocessors.run(pages);
      to.push(...pages);
      const generatedPages = [];
      for (const page of generators){
        const data = {
          ...page.data
        };
        const { content } = data;
        delete data.content;
        const generator = await this.render(content, data, page.src.path + page.src.ext);
        let index = 0;
        const basePath = posix.dirname(page.data.url);
        for await (const data of generator){
          if (!data.content) {
            data.content = undefined;
          }
          const newPage = page.duplicate(index++, mergeData(page.data, data));
          const url = getPageUrl(newPage, this.prettyUrls, basePath);
          if (!url) {
            continue;
          }
          newPage.data.url = url;
          newPage.data.date = getPageDate(newPage);
          newPage._data.layout = "layout" in data ? data.layout : page._data.layout;
          generatedPages.push(newPage);
        }
      }
      // Preprocess the generators and add them to site.pages
      await this.preprocessors.run(generatedPages);
      to.push(...generatedPages);
      // Render the pages content
      const renderedPages = [];
      await concurrent(pages.concat(generatedPages), async (page)=>{
        try {
          const content = await this.#renderPage(page);
          // Save the children to render the layout later
          // (Only HTML pages and pages with the layout in the frontmatter)
          // This prevents to call the layout for every page (like css, js, etc)
          if (page.outputPath.endsWith(".html") || page._data.layout) {
            page.data.children = content;
            renderedPages.push(page);
          } else {
            page.content = content;
          }
        } catch (cause) {
          throw new Error(`Error rendering the page: ${page.sourcePath}`, {
            cause
          });
        }
      });
      // Render the pages layouts
      await concurrent(renderedPages, async (page)=>{
        try {
          page.content = await this.#renderLayout(page, page.data.children);
          // Ensure all HTML pages have the DOCTYPE declaration
          if (page.outputPath.endsWith(".html") && typeof page.content === "string") {
            const trim = page.content.trim();
            if (trim && !trim.match(/^<!DOCTYPE\s/i)) {
              page.content = `<!DOCTYPE html>\n${page.content}`;
            }
          }
        } catch (cause) {
          throw new Error(`Error rendering the layout of the page ${page.sourcePath}`, {
            cause
          });
        }
      });
    }
  }
  /** Render the provided pages */ async renderPageOnDemand(page) {
    if (isGenerator(page.data.content)) {
      throw new Error(`Cannot render the generator page ${page.sourcePath} on demand.`);
    }
    await this.preprocessors.run([
      page
    ]);
    // The page is type asset
    if (this.formats.get(page.src.ext)?.pageType === "asset") {
      page.content = page.data.content;
    } else {
      const content = await this.#renderPage(page);
      page.content = await this.#renderLayout(page, content);
    }
  }
  /** Render a template */ async render(content, data, filename, isLayout = false) {
    const engines = this.#getEngine(filename, data, isLayout);
    if (engines) {
      for (const engine of engines){
        content = await engine.render(content, data, filename);
      }
    }
    return content;
  }
  /** Group the pages by renderOrder */ #groupPages(pages) {
    const renderOrder = {};
    for (const page of pages){
      const order = page.data.renderOrder || 0;
      renderOrder[order] = renderOrder[order] || [];
      renderOrder[order].push(page);
    }
    return Object.keys(renderOrder).sort().map((order)=>renderOrder[order]);
  }
  /** Render a page */ async #renderPage(page) {
    const data = {
      ...page.data
    };
    const { content } = data;
    delete data.content;
    return await this.render(content, data, page.src.path + page.src.ext);
  }
  /** Render the page layout */ async #renderLayout(page, content) {
    let data = {
      ...page.data
    };
    let path = page.src.path + page.src.ext;
    let layout = data.layout;
    // Render the layouts recursively
    while(layout){
      const format = this.formats.search(layout);
      if (!format || !format.loader) {
        throw new Error(`The layout format "${layout}" doesn't exist`);
      }
      const includesPath = format.engines?.[0].includes;
      if (!includesPath) {
        throw new Error(`The layout format "${layout}" doesn't support includes`);
      }
      const layoutPath = resolveInclude(layout, includesPath, posix.dirname(path));
      const entry = this.fs.entries.get(layoutPath);
      if (!entry) {
        throw new Error(`The layout file "${layoutPath}" doesn't exist`);
      }
      const layoutData = await entry.getContent(format.loader);
      delete data.layout;
      delete data.templateEngine;
      data = {
        ...layoutData,
        ...data,
        content
      };
      content = await this.render(layoutData.content, data, layoutPath, true);
      layout = layoutData.layout;
      path = layoutPath;
    }
    return content;
  }
  /** Get the engines assigned to an extension or configured in the data */ #getEngine(path, data, isLayout) {
    let { templateEngine } = data;
    if (templateEngine) {
      templateEngine = Array.isArray(templateEngine) ? templateEngine : templateEngine.split(",");
      return templateEngine.reduce((engines, name)=>{
        const format = this.formats.get(`.${name.trim()}`);
        if (format?.engines) {
          return engines.concat(format.engines);
        }
        throw new Error(`The template engine "${name}" doesn't exist`);
      }, []);
    }
    const format = this.formats.search(path);
    if (isLayout || format?.pageType === "page") {
      return format?.engines;
    }
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvbHVtZUB2Mi4yLjAvY29yZS9yZW5kZXJlci50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyByZXNvbHZlSW5jbHVkZSB9IGZyb20gXCIuL3V0aWxzL3BhdGgudHNcIjtcbmltcG9ydCB7IGlzR2VuZXJhdG9yIH0gZnJvbSBcIi4vdXRpbHMvZ2VuZXJhdG9yLnRzXCI7XG5pbXBvcnQgeyBjb25jdXJyZW50IH0gZnJvbSBcIi4vdXRpbHMvY29uY3VycmVudC50c1wiO1xuaW1wb3J0IHsgbWVyZ2VEYXRhIH0gZnJvbSBcIi4vdXRpbHMvbWVyZ2VfZGF0YS50c1wiO1xuaW1wb3J0IHsgZ2V0UGFnZVVybCB9IGZyb20gXCIuL3V0aWxzL3BhZ2VfdXJsLnRzXCI7XG5pbXBvcnQgeyBnZXRQYWdlRGF0ZSB9IGZyb20gXCIuL3V0aWxzL3BhZ2VfZGF0ZS50c1wiO1xuaW1wb3J0IHsgUGFnZSB9IGZyb20gXCIuL2ZpbGUudHNcIjtcbmltcG9ydCB7IHBvc2l4IH0gZnJvbSBcIi4uL2RlcHMvcGF0aC50c1wiO1xuXG5pbXBvcnQgdHlwZSB7IENvbnRlbnQsIERhdGEgfSBmcm9tIFwiLi9maWxlLnRzXCI7XG5pbXBvcnQgdHlwZSBQcm9jZXNzb3JzIGZyb20gXCIuL3Byb2Nlc3NvcnMudHNcIjtcbmltcG9ydCB0eXBlIEZvcm1hdHMgZnJvbSBcIi4vZm9ybWF0cy50c1wiO1xuaW1wb3J0IHR5cGUgRlMgZnJvbSBcIi4vZnMudHNcIjtcblxuZXhwb3J0IGludGVyZmFjZSBPcHRpb25zIHtcbiAgaW5jbHVkZXM6IHN0cmluZztcbiAgcHJldHR5VXJsczogYm9vbGVhbjtcbiAgcHJlcHJvY2Vzc29yczogUHJvY2Vzc29ycztcbiAgZm9ybWF0czogRm9ybWF0cztcbiAgZnM6IEZTO1xufVxuXG4vKipcbiAqIFRoZSByZW5kZXJlciBpcyByZXNwb25zaWJsZSBmb3IgcmVuZGVyaW5nIHRoZSBzaXRlIHBhZ2VzXG4gKiBpbiB0aGUgcmlnaHQgb3JkZXIgYW5kIHVzaW5nIHRoZSByaWdodCB0ZW1wbGF0ZSBlbmdpbmUuXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFJlbmRlcmVyIHtcbiAgLyoqIFRoZSBkZWZhdWx0IGZvbGRlciB0byBpbmNsdWRlIHRoZSBsYXlvdXRzICovXG4gIGluY2x1ZGVzOiBzdHJpbmc7XG5cbiAgLyoqIFRoZSBmaWxlc3lzdGVtIGluc3RhbmNlIHVzZWQgdG8gcmVhZCB0aGUgbGF5b3V0cyAqL1xuICBmczogRlM7XG5cbiAgLyoqIFRvIGNvbnZlcnQgdGhlIHVybHMgdG8gcHJldHR5IC9leGFtcGxlLmh0bWwgPT4gL2V4YW1wbGUvICovXG4gIHByZXR0eVVybHM6IGJvb2xlYW47XG5cbiAgLyoqIEFsbCBwcmVwcm9jZXNzb3JzICovXG4gIHByZXByb2Nlc3NvcnM6IFByb2Nlc3NvcnM7XG5cbiAgLyoqIEF2YWlsYWJsZSBmaWxlIGZvcm1hdHMgKi9cbiAgZm9ybWF0czogRm9ybWF0cztcblxuICAvKiogVGhlIHJlZ2lzdGVyZWQgaGVscGVycyAqL1xuICBoZWxwZXJzID0gbmV3IE1hcDxzdHJpbmcsIFtIZWxwZXIsIEhlbHBlck9wdGlvbnNdPigpO1xuXG4gIGNvbnN0cnVjdG9yKG9wdGlvbnM6IE9wdGlvbnMpIHtcbiAgICB0aGlzLmluY2x1ZGVzID0gb3B0aW9ucy5pbmNsdWRlcztcbiAgICB0aGlzLnByZXR0eVVybHMgPSBvcHRpb25zLnByZXR0eVVybHM7XG4gICAgdGhpcy5wcmVwcm9jZXNzb3JzID0gb3B0aW9ucy5wcmVwcm9jZXNzb3JzO1xuICAgIHRoaXMuZm9ybWF0cyA9IG9wdGlvbnMuZm9ybWF0cztcbiAgICB0aGlzLmZzID0gb3B0aW9ucy5mcztcbiAgfVxuXG4gIC8qKiBSZWdpc3RlciBhIG5ldyBoZWxwZXIgdXNlZCBieSB0aGUgdGVtcGxhdGUgZW5naW5lcyAqL1xuICBhZGRIZWxwZXIobmFtZTogc3RyaW5nLCBmbjogSGVscGVyLCBvcHRpb25zOiBIZWxwZXJPcHRpb25zKSB7XG4gICAgdGhpcy5oZWxwZXJzLnNldChuYW1lLCBbZm4sIG9wdGlvbnNdKTtcblxuICAgIGZvciAoY29uc3QgZm9ybWF0IG9mIHRoaXMuZm9ybWF0cy5lbnRyaWVzLnZhbHVlcygpKSB7XG4gICAgICBmb3JtYXQuZW5naW5lcz8uZm9yRWFjaCgoZW5naW5lKSA9PiBlbmdpbmUuYWRkSGVscGVyKG5hbWUsIGZuLCBvcHRpb25zKSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKiogUmVuZGVyIHRoZSBwcm92aWRlZCBwYWdlcyAqL1xuICBhc3luYyByZW5kZXJQYWdlcyhmcm9tOiBQYWdlW10sIHRvOiBQYWdlW10sIG9uRGVtYW5kOiBQYWdlW10pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBmb3IgKGNvbnN0IGdyb3VwIG9mIHRoaXMuI2dyb3VwUGFnZXMoZnJvbSkpIHtcbiAgICAgIGNvbnN0IHBhZ2VzOiBQYWdlW10gPSBbXTtcbiAgICAgIGNvbnN0IGdlbmVyYXRvcnM6IFBhZ2VbXSA9IFtdO1xuXG4gICAgICAvLyBTcGxpdCByZWd1bGFyIHBhZ2VzIGFuZCBnZW5lcmF0b3JzXG4gICAgICBmb3IgKGNvbnN0IHBhZ2Ugb2YgZ3JvdXApIHtcbiAgICAgICAgaWYgKGlzR2VuZXJhdG9yKHBhZ2UuZGF0YS5jb250ZW50KSkge1xuICAgICAgICAgIGdlbmVyYXRvcnMucHVzaChwYWdlKTtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChwYWdlLmRhdGEub25kZW1hbmQpIHtcbiAgICAgICAgICBvbkRlbWFuZC5wdXNoKHBhZ2UpO1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICAgIHBhZ2VzLnB1c2gocGFnZSk7XG4gICAgICB9XG5cbiAgICAgIC8vIFByZXByb2Nlc3MgdGhlIHBhZ2VzIGFuZCBhZGQgdGhlbSB0byBzaXRlLnBhZ2VzXG4gICAgICBhd2FpdCB0aGlzLnByZXByb2Nlc3NvcnMucnVuKHBhZ2VzKTtcbiAgICAgIHRvLnB1c2goLi4ucGFnZXMpO1xuXG4gICAgICBjb25zdCBnZW5lcmF0ZWRQYWdlczogUGFnZVtdID0gW107XG4gICAgICBmb3IgKGNvbnN0IHBhZ2Ugb2YgZ2VuZXJhdG9ycykge1xuICAgICAgICBjb25zdCBkYXRhID0geyAuLi5wYWdlLmRhdGEgfTtcbiAgICAgICAgY29uc3QgeyBjb250ZW50IH0gPSBkYXRhO1xuICAgICAgICBkZWxldGUgZGF0YS5jb250ZW50O1xuXG4gICAgICAgIGNvbnN0IGdlbmVyYXRvciA9IGF3YWl0IHRoaXMucmVuZGVyPEdlbmVyYXRvcjxEYXRhLCBEYXRhPj4oXG4gICAgICAgICAgY29udGVudCxcbiAgICAgICAgICBkYXRhLFxuICAgICAgICAgIHBhZ2Uuc3JjLnBhdGggKyBwYWdlLnNyYy5leHQsXG4gICAgICAgICk7XG5cbiAgICAgICAgbGV0IGluZGV4ID0gMDtcbiAgICAgICAgY29uc3QgYmFzZVBhdGggPSBwb3NpeC5kaXJuYW1lKHBhZ2UuZGF0YS51cmwpO1xuXG4gICAgICAgIGZvciBhd2FpdCAoY29uc3QgZGF0YSBvZiBnZW5lcmF0b3IpIHtcbiAgICAgICAgICBpZiAoIWRhdGEuY29udGVudCkge1xuICAgICAgICAgICAgZGF0YS5jb250ZW50ID0gdW5kZWZpbmVkO1xuICAgICAgICAgIH1cbiAgICAgICAgICBjb25zdCBuZXdQYWdlID0gcGFnZS5kdXBsaWNhdGUoXG4gICAgICAgICAgICBpbmRleCsrLFxuICAgICAgICAgICAgbWVyZ2VEYXRhKHBhZ2UuZGF0YSwgZGF0YSkgYXMgRGF0YSxcbiAgICAgICAgICApO1xuICAgICAgICAgIGNvbnN0IHVybCA9IGdldFBhZ2VVcmwobmV3UGFnZSwgdGhpcy5wcmV0dHlVcmxzLCBiYXNlUGF0aCk7XG4gICAgICAgICAgaWYgKCF1cmwpIHtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgICBuZXdQYWdlLmRhdGEudXJsID0gdXJsO1xuICAgICAgICAgIG5ld1BhZ2UuZGF0YS5kYXRlID0gZ2V0UGFnZURhdGUobmV3UGFnZSk7XG4gICAgICAgICAgbmV3UGFnZS5fZGF0YS5sYXlvdXQgPSBcImxheW91dFwiIGluIGRhdGFcbiAgICAgICAgICAgID8gZGF0YS5sYXlvdXRcbiAgICAgICAgICAgIDogcGFnZS5fZGF0YS5sYXlvdXQ7XG4gICAgICAgICAgZ2VuZXJhdGVkUGFnZXMucHVzaChuZXdQYWdlKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBQcmVwcm9jZXNzIHRoZSBnZW5lcmF0b3JzIGFuZCBhZGQgdGhlbSB0byBzaXRlLnBhZ2VzXG4gICAgICBhd2FpdCB0aGlzLnByZXByb2Nlc3NvcnMucnVuKGdlbmVyYXRlZFBhZ2VzKTtcbiAgICAgIHRvLnB1c2goLi4uZ2VuZXJhdGVkUGFnZXMpO1xuXG4gICAgICAvLyBSZW5kZXIgdGhlIHBhZ2VzIGNvbnRlbnRcbiAgICAgIGNvbnN0IHJlbmRlcmVkUGFnZXM6IFBhZ2VbXSA9IFtdO1xuICAgICAgYXdhaXQgY29uY3VycmVudChcbiAgICAgICAgcGFnZXMuY29uY2F0KGdlbmVyYXRlZFBhZ2VzKSxcbiAgICAgICAgYXN5bmMgKHBhZ2UpID0+IHtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgY29udGVudCA9IGF3YWl0IHRoaXMuI3JlbmRlclBhZ2UocGFnZSk7XG5cbiAgICAgICAgICAgIC8vIFNhdmUgdGhlIGNoaWxkcmVuIHRvIHJlbmRlciB0aGUgbGF5b3V0IGxhdGVyXG4gICAgICAgICAgICAvLyAoT25seSBIVE1MIHBhZ2VzIGFuZCBwYWdlcyB3aXRoIHRoZSBsYXlvdXQgaW4gdGhlIGZyb250bWF0dGVyKVxuICAgICAgICAgICAgLy8gVGhpcyBwcmV2ZW50cyB0byBjYWxsIHRoZSBsYXlvdXQgZm9yIGV2ZXJ5IHBhZ2UgKGxpa2UgY3NzLCBqcywgZXRjKVxuICAgICAgICAgICAgaWYgKHBhZ2Uub3V0cHV0UGF0aC5lbmRzV2l0aChcIi5odG1sXCIpIHx8IHBhZ2UuX2RhdGEubGF5b3V0KSB7XG4gICAgICAgICAgICAgIHBhZ2UuZGF0YS5jaGlsZHJlbiA9IGNvbnRlbnQ7XG4gICAgICAgICAgICAgIHJlbmRlcmVkUGFnZXMucHVzaChwYWdlKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHBhZ2UuY29udGVudCA9IGNvbnRlbnQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBjYXRjaCAoY2F1c2UpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgRXJyb3IgcmVuZGVyaW5nIHRoZSBwYWdlOiAke3BhZ2Uuc291cmNlUGF0aH1gLCB7XG4gICAgICAgICAgICAgIGNhdXNlLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgKTtcblxuICAgICAgLy8gUmVuZGVyIHRoZSBwYWdlcyBsYXlvdXRzXG4gICAgICBhd2FpdCBjb25jdXJyZW50KFxuICAgICAgICByZW5kZXJlZFBhZ2VzLFxuICAgICAgICBhc3luYyAocGFnZSkgPT4ge1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICBwYWdlLmNvbnRlbnQgPSBhd2FpdCB0aGlzLiNyZW5kZXJMYXlvdXQoXG4gICAgICAgICAgICAgIHBhZ2UsXG4gICAgICAgICAgICAgIHBhZ2UuZGF0YS5jaGlsZHJlbiBhcyBDb250ZW50LFxuICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgLy8gRW5zdXJlIGFsbCBIVE1MIHBhZ2VzIGhhdmUgdGhlIERPQ1RZUEUgZGVjbGFyYXRpb25cbiAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgcGFnZS5vdXRwdXRQYXRoLmVuZHNXaXRoKFwiLmh0bWxcIikgJiZcbiAgICAgICAgICAgICAgdHlwZW9mIHBhZ2UuY29udGVudCA9PT0gXCJzdHJpbmdcIlxuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgIGNvbnN0IHRyaW0gPSBwYWdlLmNvbnRlbnQudHJpbSgpO1xuXG4gICAgICAgICAgICAgIGlmICh0cmltICYmICF0cmltLm1hdGNoKC9ePCFET0NUWVBFXFxzL2kpKSB7XG4gICAgICAgICAgICAgICAgcGFnZS5jb250ZW50ID0gYDwhRE9DVFlQRSBodG1sPlxcbiR7cGFnZS5jb250ZW50fWA7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGNhdGNoIChjYXVzZSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgICAgICBgRXJyb3IgcmVuZGVyaW5nIHRoZSBsYXlvdXQgb2YgdGhlIHBhZ2UgJHtwYWdlLnNvdXJjZVBhdGh9YCxcbiAgICAgICAgICAgICAgeyBjYXVzZSB9LFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICApO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBSZW5kZXIgdGhlIHByb3ZpZGVkIHBhZ2VzICovXG4gIGFzeW5jIHJlbmRlclBhZ2VPbkRlbWFuZChwYWdlOiBQYWdlKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKGlzR2VuZXJhdG9yKHBhZ2UuZGF0YS5jb250ZW50KSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICBgQ2Fubm90IHJlbmRlciB0aGUgZ2VuZXJhdG9yIHBhZ2UgJHtwYWdlLnNvdXJjZVBhdGh9IG9uIGRlbWFuZC5gLFxuICAgICAgKTtcbiAgICB9XG5cbiAgICBhd2FpdCB0aGlzLnByZXByb2Nlc3NvcnMucnVuKFtwYWdlXSk7XG5cbiAgICAvLyBUaGUgcGFnZSBpcyB0eXBlIGFzc2V0XG4gICAgaWYgKHRoaXMuZm9ybWF0cy5nZXQocGFnZS5zcmMuZXh0KT8ucGFnZVR5cGUgPT09IFwiYXNzZXRcIikge1xuICAgICAgcGFnZS5jb250ZW50ID0gcGFnZS5kYXRhLmNvbnRlbnQgYXMgQ29udGVudDtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgY29udGVudCA9IGF3YWl0IHRoaXMuI3JlbmRlclBhZ2UocGFnZSk7XG4gICAgICBwYWdlLmNvbnRlbnQgPSBhd2FpdCB0aGlzLiNyZW5kZXJMYXlvdXQocGFnZSwgY29udGVudCk7XG4gICAgfVxuICB9XG5cbiAgLyoqIFJlbmRlciBhIHRlbXBsYXRlICovXG4gIGFzeW5jIHJlbmRlcjxUPihcbiAgICBjb250ZW50OiB1bmtub3duLFxuICAgIGRhdGE6IFJlY29yZDxzdHJpbmcsIHVua25vd24+LFxuICAgIGZpbGVuYW1lOiBzdHJpbmcsXG4gICAgaXNMYXlvdXQgPSBmYWxzZSxcbiAgKTogUHJvbWlzZTxUPiB7XG4gICAgY29uc3QgZW5naW5lcyA9IHRoaXMuI2dldEVuZ2luZShmaWxlbmFtZSwgZGF0YSwgaXNMYXlvdXQpO1xuXG4gICAgaWYgKGVuZ2luZXMpIHtcbiAgICAgIGZvciAoY29uc3QgZW5naW5lIG9mIGVuZ2luZXMpIHtcbiAgICAgICAgY29udGVudCA9IGF3YWl0IGVuZ2luZS5yZW5kZXIoY29udGVudCwgZGF0YSwgZmlsZW5hbWUpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBjb250ZW50IGFzIFQ7XG4gIH1cblxuICAvKiogR3JvdXAgdGhlIHBhZ2VzIGJ5IHJlbmRlck9yZGVyICovXG4gICNncm91cFBhZ2VzKHBhZ2VzOiBQYWdlW10pOiBQYWdlW11bXSB7XG4gICAgY29uc3QgcmVuZGVyT3JkZXI6IFJlY29yZDxudW1iZXIgfCBzdHJpbmcsIFBhZ2VbXT4gPSB7fTtcblxuICAgIGZvciAoY29uc3QgcGFnZSBvZiBwYWdlcykge1xuICAgICAgY29uc3Qgb3JkZXIgPSBwYWdlLmRhdGEucmVuZGVyT3JkZXIgfHwgMDtcbiAgICAgIHJlbmRlck9yZGVyW29yZGVyXSA9IHJlbmRlck9yZGVyW29yZGVyXSB8fCBbXTtcbiAgICAgIHJlbmRlck9yZGVyW29yZGVyXS5wdXNoKHBhZ2UpO1xuICAgIH1cblxuICAgIHJldHVybiBPYmplY3Qua2V5cyhyZW5kZXJPcmRlcikuc29ydCgpLm1hcCgob3JkZXIpID0+IHJlbmRlck9yZGVyW29yZGVyXSk7XG4gIH1cblxuICAvKiogUmVuZGVyIGEgcGFnZSAqL1xuICBhc3luYyAjcmVuZGVyUGFnZShwYWdlOiBQYWdlKTogUHJvbWlzZTxDb250ZW50PiB7XG4gICAgY29uc3QgZGF0YSA9IHsgLi4ucGFnZS5kYXRhIH07XG4gICAgY29uc3QgeyBjb250ZW50IH0gPSBkYXRhO1xuICAgIGRlbGV0ZSBkYXRhLmNvbnRlbnQ7XG5cbiAgICByZXR1cm4gYXdhaXQgdGhpcy5yZW5kZXI8Q29udGVudD4oXG4gICAgICBjb250ZW50LFxuICAgICAgZGF0YSxcbiAgICAgIHBhZ2Uuc3JjLnBhdGggKyBwYWdlLnNyYy5leHQsXG4gICAgKTtcbiAgfVxuXG4gIC8qKiBSZW5kZXIgdGhlIHBhZ2UgbGF5b3V0ICovXG4gIGFzeW5jICNyZW5kZXJMYXlvdXQocGFnZTogUGFnZSwgY29udGVudDogQ29udGVudCk6IFByb21pc2U8Q29udGVudD4ge1xuICAgIGxldCBkYXRhID0geyAuLi5wYWdlLmRhdGEgfTtcbiAgICBsZXQgcGF0aCA9IHBhZ2Uuc3JjLnBhdGggKyBwYWdlLnNyYy5leHQ7XG4gICAgbGV0IGxheW91dCA9IGRhdGEubGF5b3V0O1xuXG4gICAgLy8gUmVuZGVyIHRoZSBsYXlvdXRzIHJlY3Vyc2l2ZWx5XG4gICAgd2hpbGUgKGxheW91dCkge1xuICAgICAgY29uc3QgZm9ybWF0ID0gdGhpcy5mb3JtYXRzLnNlYXJjaChsYXlvdXQpO1xuXG4gICAgICBpZiAoIWZvcm1hdCB8fCAhZm9ybWF0LmxvYWRlcikge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFRoZSBsYXlvdXQgZm9ybWF0IFwiJHtsYXlvdXR9XCIgZG9lc24ndCBleGlzdGApO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBpbmNsdWRlc1BhdGggPSBmb3JtYXQuZW5naW5lcz8uWzBdLmluY2x1ZGVzO1xuXG4gICAgICBpZiAoIWluY2x1ZGVzUGF0aCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgYFRoZSBsYXlvdXQgZm9ybWF0IFwiJHtsYXlvdXR9XCIgZG9lc24ndCBzdXBwb3J0IGluY2x1ZGVzYCxcbiAgICAgICAgKTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgbGF5b3V0UGF0aCA9IHJlc29sdmVJbmNsdWRlKFxuICAgICAgICBsYXlvdXQsXG4gICAgICAgIGluY2x1ZGVzUGF0aCxcbiAgICAgICAgcG9zaXguZGlybmFtZShwYXRoKSxcbiAgICAgICk7XG4gICAgICBjb25zdCBlbnRyeSA9IHRoaXMuZnMuZW50cmllcy5nZXQobGF5b3V0UGF0aCk7XG5cbiAgICAgIGlmICghZW50cnkpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBUaGUgbGF5b3V0IGZpbGUgXCIke2xheW91dFBhdGh9XCIgZG9lc24ndCBleGlzdGApO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBsYXlvdXREYXRhID0gYXdhaXQgZW50cnkuZ2V0Q29udGVudChmb3JtYXQubG9hZGVyKTtcblxuICAgICAgZGVsZXRlIGRhdGEubGF5b3V0O1xuICAgICAgZGVsZXRlIGRhdGEudGVtcGxhdGVFbmdpbmU7XG5cbiAgICAgIGRhdGEgPSB7XG4gICAgICAgIC4uLmxheW91dERhdGEsXG4gICAgICAgIC4uLmRhdGEsXG4gICAgICAgIGNvbnRlbnQsXG4gICAgICB9O1xuXG4gICAgICBjb250ZW50ID0gYXdhaXQgdGhpcy5yZW5kZXI8Q29udGVudD4oXG4gICAgICAgIGxheW91dERhdGEuY29udGVudCxcbiAgICAgICAgZGF0YSxcbiAgICAgICAgbGF5b3V0UGF0aCxcbiAgICAgICAgdHJ1ZSxcbiAgICAgICk7XG4gICAgICBsYXlvdXQgPSBsYXlvdXREYXRhLmxheW91dDtcbiAgICAgIHBhdGggPSBsYXlvdXRQYXRoO1xuICAgIH1cblxuICAgIHJldHVybiBjb250ZW50O1xuICB9XG5cbiAgLyoqIEdldCB0aGUgZW5naW5lcyBhc3NpZ25lZCB0byBhbiBleHRlbnNpb24gb3IgY29uZmlndXJlZCBpbiB0aGUgZGF0YSAqL1xuICAjZ2V0RW5naW5lKFxuICAgIHBhdGg6IHN0cmluZyxcbiAgICBkYXRhOiBQYXJ0aWFsPERhdGE+LFxuICAgIGlzTGF5b3V0OiBib29sZWFuLFxuICApOiBFbmdpbmVbXSB8IHVuZGVmaW5lZCB7XG4gICAgbGV0IHsgdGVtcGxhdGVFbmdpbmUgfSA9IGRhdGE7XG5cbiAgICBpZiAodGVtcGxhdGVFbmdpbmUpIHtcbiAgICAgIHRlbXBsYXRlRW5naW5lID0gQXJyYXkuaXNBcnJheSh0ZW1wbGF0ZUVuZ2luZSlcbiAgICAgICAgPyB0ZW1wbGF0ZUVuZ2luZVxuICAgICAgICA6IHRlbXBsYXRlRW5naW5lLnNwbGl0KFwiLFwiKTtcblxuICAgICAgcmV0dXJuIHRlbXBsYXRlRW5naW5lLnJlZHVjZSgoZW5naW5lcywgbmFtZSkgPT4ge1xuICAgICAgICBjb25zdCBmb3JtYXQgPSB0aGlzLmZvcm1hdHMuZ2V0KGAuJHtuYW1lLnRyaW0oKX1gKTtcblxuICAgICAgICBpZiAoZm9ybWF0Py5lbmdpbmVzKSB7XG4gICAgICAgICAgcmV0dXJuIGVuZ2luZXMuY29uY2F0KGZvcm1hdC5lbmdpbmVzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgVGhlIHRlbXBsYXRlIGVuZ2luZSBcIiR7bmFtZX1cIiBkb2Vzbid0IGV4aXN0YCk7XG4gICAgICB9LCBbXSBhcyBFbmdpbmVbXSk7XG4gICAgfVxuXG4gICAgY29uc3QgZm9ybWF0ID0gdGhpcy5mb3JtYXRzLnNlYXJjaChwYXRoKTtcblxuICAgIGlmIChpc0xheW91dCB8fCBmb3JtYXQ/LnBhZ2VUeXBlID09PSBcInBhZ2VcIikge1xuICAgICAgcmV0dXJuIGZvcm1hdD8uZW5naW5lcztcbiAgICB9XG4gIH1cbn1cblxuLyoqIEFuIGludGVyZmFjZSB1c2VkIGJ5IGFsbCB0ZW1wbGF0ZSBlbmdpbmVzICovXG5leHBvcnQgaW50ZXJmYWNlIEVuZ2luZTxUID0gc3RyaW5nIHwgeyB0b1N0cmluZygpOiBzdHJpbmcgfT4ge1xuICAvKiogVGhlIGZvbGRlciBuYW1lIG9mIHRoZSBpbmNsdWRlcyAqL1xuICBpbmNsdWRlcz86IHN0cmluZztcblxuICAvKiogRGVsZXRlIGEgY2FjaGVkIHRlbXBsYXRlICovXG4gIGRlbGV0ZUNhY2hlKGZpbGU6IHN0cmluZyk6IHZvaWQ7XG5cbiAgLyoqIFJlbmRlciBhIHRlbXBsYXRlICh1c2VkIHRvIHJlbmRlciBwYWdlcykgKi9cbiAgcmVuZGVyKFxuICAgIGNvbnRlbnQ6IHVua25vd24sXG4gICAgZGF0YT86IFJlY29yZDxzdHJpbmcsIHVua25vd24+LFxuICAgIGZpbGVuYW1lPzogc3RyaW5nLFxuICApOiBUIHwgUHJvbWlzZTxUPjtcblxuICAvKiogUmVuZGVyIGEgY29tcG9uZW50IChpdCBtdXN0IGJlIHN5bmNocm9ub3VzKSAqL1xuICByZW5kZXJDb21wb25lbnQoXG4gICAgY29udGVudDogdW5rbm93bixcbiAgICBkYXRhPzogUmVjb3JkPHN0cmluZywgdW5rbm93bj4sXG4gICAgZmlsZW5hbWU/OiBzdHJpbmcsXG4gICk6IFQ7XG5cbiAgLyoqIEFkZCBhIGhlbHBlciB0byB0aGUgdGVtcGxhdGUgZW5naW5lICovXG4gIGFkZEhlbHBlcihcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgZm46IEhlbHBlcixcbiAgICBvcHRpb25zOiBIZWxwZXJPcHRpb25zLFxuICApOiB2b2lkO1xufVxuXG4vKiogQSBnZW5lcmljIGhlbHBlciB0byBiZSB1c2VkIGluIHRlbXBsYXRlIGVuZ2luZXMgKi9cbmV4cG9ydCBpbnRlcmZhY2UgSGVscGVyVGhpcyB7XG4gIGRhdGE6IERhdGE7XG59XG5cbi8vIGRlbm8tbGludC1pZ25vcmUgbm8tZXhwbGljaXQtYW55XG5leHBvcnQgdHlwZSBIZWxwZXIgPSAodGhpczogSGVscGVyVGhpcyB8IHZvaWQsIC4uLmFyZ3M6IGFueVtdKSA9PiBhbnk7XG5cbi8qKiBUaGUgb3B0aW9ucyBmb3IgYSB0ZW1wbGF0ZSBoZWxwZXIgKi9cbmV4cG9ydCBpbnRlcmZhY2UgSGVscGVyT3B0aW9ucyB7XG4gIC8qKiBUaGUgdHlwZSBvZiB0aGUgaGVscGVyICh0YWcsIGZpbHRlciwgZXRjKSAqL1xuICB0eXBlOiBzdHJpbmc7XG5cbiAgLyoqIFdoZXRoZXIgdGhlIGhlbHBlciByZXR1cm5zIGFuIGluc3RhbmNlIG9yIG5vdCAqL1xuICBhc3luYz86IGJvb2xlYW47XG5cbiAgLyoqIFdoZXRoZXIgdGhlIGhlbHBlciBoYXMgYSBib2R5IG9yIG5vdCAodXNlZCBmb3IgdGFnIHR5cGVzKSAqL1xuICBib2R5PzogYm9vbGVhbjtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxTQUFTLGNBQWMsUUFBUSxrQkFBa0I7QUFDakQsU0FBUyxXQUFXLFFBQVEsdUJBQXVCO0FBQ25ELFNBQVMsVUFBVSxRQUFRLHdCQUF3QjtBQUNuRCxTQUFTLFNBQVMsUUFBUSx3QkFBd0I7QUFDbEQsU0FBUyxVQUFVLFFBQVEsc0JBQXNCO0FBQ2pELFNBQVMsV0FBVyxRQUFRLHVCQUF1QjtBQUVuRCxTQUFTLEtBQUssUUFBUSxrQkFBa0I7QUFleEM7OztDQUdDLEdBQ0QsZUFBZSxNQUFNO0VBQ25CLDhDQUE4QyxHQUM5QyxTQUFpQjtFQUVqQixxREFBcUQsR0FDckQsR0FBTztFQUVQLDZEQUE2RCxHQUM3RCxXQUFvQjtFQUVwQixzQkFBc0IsR0FDdEIsY0FBMEI7RUFFMUIsMkJBQTJCLEdBQzNCLFFBQWlCO0VBRWpCLDJCQUEyQixHQUMzQixVQUFVLElBQUksTUFBdUM7RUFFckQsWUFBWSxPQUFnQixDQUFFO0lBQzVCLElBQUksQ0FBQyxRQUFRLEdBQUcsUUFBUSxRQUFRO0lBQ2hDLElBQUksQ0FBQyxVQUFVLEdBQUcsUUFBUSxVQUFVO0lBQ3BDLElBQUksQ0FBQyxhQUFhLEdBQUcsUUFBUSxhQUFhO0lBQzFDLElBQUksQ0FBQyxPQUFPLEdBQUcsUUFBUSxPQUFPO0lBQzlCLElBQUksQ0FBQyxFQUFFLEdBQUcsUUFBUSxFQUFFO0VBQ3RCO0VBRUEsdURBQXVELEdBQ3ZELFVBQVUsSUFBWSxFQUFFLEVBQVUsRUFBRSxPQUFzQixFQUFFO0lBQzFELElBQUksQ0FBQyxPQUFPLENB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