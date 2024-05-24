import { join, posix } from "../deps/path.ts";
import { merge } from "./utils/object.ts";
import { normalizePath } from "./utils/path.ts";
import { env } from "./utils/env.ts";
import { log } from "./utils/log.ts";
import FS from "./fs.ts";
import ComponentLoader from "./component_loader.ts";
import DataLoader from "./data_loader.ts";
import Source from "./source.ts";
import Scopes from "./scopes.ts";
import Processors from "./processors.ts";
import Renderer from "./renderer.ts";
import Events from "./events.ts";
import Formats from "./formats.ts";
import Searcher from "./searcher.ts";
import Scripts from "./scripts.ts";
import FSWatcher from "../core/watcher.ts";
import { FSWriter } from "./writer.ts";
import { Page } from "./file.ts";
import textLoader from "./loaders/text.ts";
/** Default options of the site */ const defaults = {
  cwd: Deno.cwd(),
  src: "./",
  dest: "./_site",
  emptyDest: true,
  includes: "_includes",
  location: new URL("http://localhost"),
  prettyUrls: true,
  server: {
    port: 3000,
    open: false,
    page404: "/404.html",
    middlewares: []
  },
  watcher: {
    ignore: [],
    debounce: 100
  },
  components: {
    variable: "comp",
    cssFile: "/components.css",
    jsFile: "/components.js"
  }
};
/**
 * This is the heart of Lume,
 * it contains everything needed to build the site
 */ export default class Site {
  options;
  /** Internal data. Used to save arbitrary data by plugins and processors */ _data = {};
  /** To read the files from the filesystem */ fs;
  /** Info about how to handle different file formats */ formats;
  /** To load all _data files */ dataLoader;
  /** To load reusable components */ componentLoader;
  /** To scan the src folder */ source;
  /** To update pages of the same scope after any change */ scopes;
  /** To store and run the processors */ processors;
  /** To store and run the pre-processors */ preprocessors;
  /** To render the pages using any template engine */ renderer;
  /** To listen and dispatch events */ // deno-lint-ignore no-explicit-any
  events;
  /** To run scripts */ scripts;
  /** To search pages */ search;
  /** To write the generated pages in the dest folder */ writer;
  /** Data assigned with site.data() */ scopedData = new Map([
    [
      "/",
      {}
    ]
  ]);
  /** Pages created with site.page() */ scopedPages = new Map();
  /** Components created with site.component() */ scopedComponents = new Map();
  /** Hooks installed by the plugins */ // deno-lint-ignore no-explicit-any
  hooks = {};
  /** The generated pages are stored here */ pages = [];
  /** Pages that should be rendered on demand */ onDemandPages = [];
  /** The static files to be copied are stored here */ files = [];
  constructor(options = {}){
    this.options = merge(defaults, options);
    const src = this.src();
    const dest = this.dest();
    const { includes, cwd, prettyUrls, components, server } = this.options;
    // To load source files
    const fs = new FS({
      root: src
    });
    const formats = new Formats();
    const dataLoader = new DataLoader({
      formats
    });
    const componentLoader = new ComponentLoader({
      formats
    });
    const source = new Source({
      fs,
      dataLoader,
      componentLoader,
      formats,
      components,
      scopedData: this.scopedData,
      scopedPages: this.scopedPages,
      scopedComponents: this.scopedComponents,
      prettyUrls
    });
    // To render pages
    const scopes = new Scopes();
    const processors = new Processors();
    const preprocessors = new Processors();
    const renderer = new Renderer({
      prettyUrls,
      preprocessors,
      formats,
      fs,
      includes
    });
    // Other stuff
    const events = new Events();
    const scripts = new Scripts({
      cwd
    });
    const writer = new FSWriter({
      dest
    });
    const url404 = server.page404 ? normalizePath(server.page404) : undefined;
    const searcher = new Searcher({
      pages: this.pages,
      files: this.files,
      sourceData: source.data,
      filters: [
        (data)=>data.page.outputPath.endsWith(".html") ?? false,
        (data)=>!url404 || data.url !== url404
      ]
    });
    // Save everything in the site instance
    this.fs = fs;
    this.formats = formats;
    this.componentLoader = componentLoader;
    this.dataLoader = dataLoader;
    this.source = source;
    this.scopes = scopes;
    this.processors = processors;
    this.preprocessors = preprocessors;
    this.renderer = renderer;
    this.events = events;
    this.scripts = scripts;
    this.search = searcher;
    this.writer = writer;
    // Ignore the "dest" directory if it's inside src
    if (this.dest().startsWith(this.src())) {
      this.ignore(this.options.dest);
    }
    // Ignore the dest folder by the watcher
    this.options.watcher.ignore.push(normalizePath(this.options.dest));
    this.fs.options.ignore = this.options.watcher.ignore;
  }
  get globalData() {
    return this.scopedData.get("/");
  }
  /**
   * Returns the full path to the root directory.
   * Use the arguments to return a subpath
   */ root(...path) {
    return normalizePath(join(this.options.cwd, ...path));
  }
  /**
   * Returns the full path to the src directory.
   * Use the arguments to return a subpath
   */ src(...path) {
    return this.root(this.options.src, ...path);
  }
  /**
   * Returns the full path to the dest directory.
   * Use the arguments to return a subpath
   */ dest(...path) {
    return this.root(this.options.dest, ...path);
  }
  /** Add a listener to an event */ addEventListener(type, listener, options) {
    const fn = typeof listener === "string" ? ()=>this.run(listener) : listener;
    this.events.addEventListener(type, fn, options);
    return this;
  }
  /** Dispatch an event */ dispatchEvent(event) {
    return this.events.dispatchEvent(event);
  }
  /** Use a plugin */ use(plugin) {
    plugin(this);
    return this;
  }
  /**
   * Register a script or a function, so it can be executed with
   * lume run <name>
   */ script(name, ...scripts) {
    this.scripts.set(name, ...scripts);
    return this;
  }
  /** Runs a script or function registered previously */ async run(name) {
    return await this.scripts.run(name);
  }
  /**
   * Register a data loader for some extensions
   */ loadData(extensions, dataLoader = textLoader) {
    extensions.forEach((ext)=>{
      this.formats.set({
        ext,
        dataLoader
      });
    });
    return this;
  }
  /**
   * Register a page loader for some extensions
   */ loadPages(extensions, options = {}) {
    if (typeof options === "function") {
      options = {
        loader: options
      };
    }
    const { engine, pageSubExtension } = options;
    const loader = options.loader || textLoader;
    const engines = Array.isArray(engine) ? engine : engine ? [
      engine
    ] : [];
    const pageExtensions = pageSubExtension ? extensions.map((ext)=>pageSubExtension + ext) : extensions;
    pageExtensions.forEach((ext)=>{
      this.formats.set({
        ext,
        loader,
        pageType: "page",
        engines
      });
    });
    if (pageSubExtension) {
      extensions.forEach((ext)=>this.formats.set({
          ext,
          loader,
          engines
        }));
    }
    for (const [name, helper] of this.renderer.helpers){
      engines.forEach((engine)=>engine.addHelper(name, ...helper));
    }
    return this;
  }
  /**
   * Register an assets loader for some extensions
   */ loadAssets(extensions, assetLoader = textLoader) {
    extensions.forEach((ext)=>{
      this.formats.set({
        ext,
        assetLoader,
        pageType: "asset"
      });
    });
    return this;
  }
  /** Register a preprocessor for some extensions */ preprocess(extensions, preprocessor) {
    this.preprocessors.set(extensions, preprocessor);
    return this;
  }
  /** Register a processor for some extensions */ process(extensions, processor) {
    this.processors.set(extensions, processor);
    return this;
  }
  /** Register a template filter */ filter(name, filter, async = false) {
    return this.helper(name, filter, {
      type: "filter",
      async
    });
  }
  /** Register a template helper */ helper(name, fn, options) {
    this.renderer.addHelper(name, fn, options);
    return this;
  }
  /** Register extra data accessible by the layouts */ data(name, value, scope = "/") {
    const data = this.scopedData.get(scope) || {};
    data[name] = value;
    this.scopedData.set(scope, data);
    return this;
  }
  /** Register a page */ page(data, scope = "/") {
    const pages = this.scopedPages.get(scope) || [];
    pages.push(data);
    this.scopedPages.set(scope, pages);
    return this;
  }
  /** Register an extra component accesible by the layouts */ component(context, component, scope = "/") {
    const pieces = context.split(".");
    const scopedComponents = this.scopedComponents.get(scope) || new Map();
    let components = scopedComponents;
    while(pieces.length){
      const name = pieces.shift();
      if (!components.get(name)) {
        components.set(name, new Map());
      }
      components = components.get(name);
    }
    components.set(component.name, component);
    this.scopedComponents.set(scope, scopedComponents);
    return this;
  }
  /** Register a merging strategy for a data key */ mergeKey(key, merge, scope = "/") {
    const data = this.scopedData.get(scope) || {};
    const mergedKeys = data.mergedKeys || {};
    mergedKeys[key] = merge;
    data.mergedKeys = mergedKeys;
    this.scopedData.set(scope, data);
    return this;
  }
  copy(from, to) {
    // File extensions
    if (Array.isArray(from)) {
      if (typeof to === "string") {
        throw new Error(`copy() files by extension expects a function as second argument but got a string "${to}"`);
      }
      from.forEach((ext)=>{
        this.formats.set({
          ext,
          copy: to ? to : true
        });
      });
      return this;
    }
    this.source.addStaticPath(from, to);
    return this;
  }
  /** Copy the remaining files */ copyRemainingFiles(filter = ()=>true) {
    this.source.copyRemainingFiles = filter;
    return this;
  }
  /** Ignore one or several files or directories */ ignore(...paths) {
    paths.forEach((path)=>{
      if (typeof path === "string") {
        this.source.addIgnoredPath(path);
      } else {
        this.source.addIgnoreFilter(path);
      }
    });
    return this;
  }
  /** Define independent scopes to optimize the update process */ scopedUpdates(...scopes) {
    scopes.forEach((scope)=>this.scopes.scopes.add(scope));
    return this;
  }
  /** Define a remote fallback for a missing local file */ remoteFile(filename, url) {
    this.fs.remoteFiles.set(posix.join("/", filename), url);
    return this;
  }
  /** Clear the dest directory and any cache */ async clear() {
    await this.writer.clear();
  }
  /** Build the entire site */ async build() {
    if (await this.dispatchEvent({
      type: "beforeBuild"
    }) === false) {
      return;
    }
    if (this.options.emptyDest) {
      await this.clear();
    }
    performance.mark("start-loadfiles");
    // Load source files
    this.fs.init();
    if (await this.dispatchEvent({
      type: "afterLoad"
    }) === false) {
      return;
    }
    // Get the site content
    const showDrafts = env("LUME_DRAFTS");
    const [_pages, _staticFiles] = await this.source.build((_, page)=>!page?.data.draft || showDrafts === true);
    performance.mark("end-loadfiles");
    log.debug(`Pages loaded in ${(performance.measure("duration", "start-loadfiles", "end-loadfiles").duration / 1000).toFixed(2)} seconds`);
    // Save static files into site.files
    this.files.splice(0, this.files.length, ..._staticFiles);
    // Stop if the build is cancelled
    if (await this.#buildPages(_pages) === false) {
      return;
    }
    // Save the pages and copy static files in the dest folder
    const pages = await this.writer.savePages(this.pages);
    const staticFiles = await this.writer.copyFiles(this.files);
    await this.dispatchEvent({
      type: "afterBuild",
      pages,
      staticFiles
    });
  }
  /** Reload some files that might be changed */ async update(files) {
    if (await this.dispatchEvent({
      type: "beforeUpdate",
      files
    }) === false) {
      return;
    }
    this.search.deleteCache();
    // Reload the changed files
    for (const file of files){
      // Delete the file from the cache
      this.formats.deleteCache(file);
      const entry = this.fs.update(file);
      if (!entry) {
        continue;
      }
      // Remove pages or static files depending on this entry
      const pages = this.pages.filter((page)=>page.src.entry === entry).map((page)=>page.outputPath);
      const files = this.files.filter((file)=>file.entry === entry).map((file)=>file.outputPath);
      await this.writer.removeFiles([
        ...pages,
        ...files
      ]);
    }
    if (await this.dispatchEvent({
      type: "afterLoad"
    }) === false) {
      return;
    }
    // Get the site content
    const showDrafts = env("LUME_DRAFTS");
    const [_pages, _staticFiles] = await this.source.build((_, page)=>!page?.data.draft || showDrafts === true, this.scopes.getFilter(files));
    // Build the pages and save static files into site.files
    this.files.splice(0, this.files.length, ..._staticFiles);
    if (await this.#buildPages(_pages) === false) {
      return;
    }
    // Save the pages and copy static files in the dest folder
    const pages = await this.writer.savePages(this.pages);
    const staticFiles = await this.writer.copyFiles(this.files);
    await this.dispatchEvent({
      type: "afterUpdate",
      files,
      pages,
      staticFiles
    });
  }
  /**
   * Internal function to render pages
   * The common operations of build and update
   */ async #buildPages(pages) {
    if (await this.dispatchEvent({
      type: "beforeRender",
      pages
    }) === false) {
      return false;
    }
    performance.mark("start-render");
    // Render the pages
    this.pages.splice(0);
    this.onDemandPages.splice(0);
    await this.renderer.renderPages(pages, this.pages, this.onDemandPages);
    // Add extra code generated by the components
    for (const extra of this.source.getComponentsExtraCode()){
      const page = await this.getOrCreatePage(extra.data.url);
      if (page.content) {
        page.content += `\n${extra.content}`;
      } else {
        page.content = extra.content;
      }
    }
    // Remove empty pages and ondemand pages
    this.pages.splice(0, this.pages.length, ...this.pages.filter((page)=>{
      if (page.data.ondemand) {
        log.debug(`[Lume] <cyan>Skipped page</cyan> ${page.data.url} (page is build only on demand)`);
        return false;
      }
      if (!page.content) {
        log.warn(`[Lume] <cyan>Skipped page</cyan> ${page.data.url} (file content is empty)`);
        return false;
      }
      return true;
    }));
    performance.mark("end-render");
    log.debug(`Pages rendered in ${(performance.measure("duration", "start-render", "end-render").duration / 1000).toFixed(2)} seconds`);
    performance.mark("start-process");
    if (await this.events.dispatchEvent({
      type: "afterRender",
      pages: this.pages
    }) === false) {
      return false;
    }
    // Run the processors to the pages
    await this.processors.run(this.pages);
    performance.mark("end-process");
    log.debug(`Pages processed in ${(performance.measure("duration", "start-process", "end-process").duration / 1000).toFixed(2)} seconds`);
    return await this.dispatchEvent({
      type: "beforeSave"
    });
  }
  /** Render a single page (used for on demand rendering) */ async renderPage(file, extraData) {
    // Load the page
    this.fs.init();
    // Get the site content
    const [pages] = await this.source.build((entry)=>entry.type === "directory" && file.startsWith(entry.path) || entry.path === file);
    const page = pages[0];
    if (!page) {
      return;
    }
    // Add extra data
    if (extraData) {
      page.data = {
        ...page.data,
        ...extraData
      };
    }
    await this.dispatchEvent({
      type: "beforeRenderOnDemand",
      page
    });
    // Render the page
    await this.renderer.renderPageOnDemand(page);
    // Run the processors to the page
    await this.processors.run([
      page
    ]);
    return page;
  }
  /** Return the URL of a path */ url(path, absolute = false) {
    if (path.startsWith("./") || path.startsWith("../") || path.startsWith("?") || path.startsWith("#") || path.startsWith("//")) {
      return path;
    }
    // It's a source file
    if (path.startsWith("~/")) {
      path = decodeURI(path.slice(1));
      // Has a search query
      const match = path.match(/^(.*)\s*\(([^)]+)\)$/);
      const srcPath = match ? match[1] : path;
      const pages = match ? this.search.pages(match[2]).map((data)=>data.page) : this.pages;
      // It's a page
      const page = pages.find((page)=>page.src.path + page.src.ext === srcPath);
      if (page) {
        path = page.data.url;
      } else {
        // It's a static file
        const file = this.files.find((file)=>file.entry.path === path);
        if (file) {
          path = file.outputPath;
        } else {
          throw new Error(`Source file not found: ${path}`);
        }
      }
    } else {
      // Absolute URLs are returned as is
      try {
        return new URL(path).href;
      } catch  {
      // Ignore error
      }
    }
    if (!path.startsWith(this.options.location.pathname)) {
      path = posix.join(this.options.location.pathname, path);
    }
    return absolute ? this.options.location.origin + path : path;
  }
  async getOrCreatePage(url, loader = textLoader) {
    url = normalizePath(url);
    // It's a page
    const page = this.pages.find((page)=>page.data.url === url);
    if (page) {
      return page;
    }
    // It's a static file
    const index = this.files.findIndex((f)=>f.outputPath === url);
    if (index > -1) {
      const { entry } = this.files.splice(index, 1)[0];
      const data = await entry.getContent(loader);
      const page = Page.create({
        ...data,
        url
      });
      this.pages.push(page);
      return page;
    }
    // Read the source files directly
    const entry = this.fs.entries.get(url);
    if (entry) {
      const data = await entry.getContent(loader);
      const page = Page.create({
        ...data,
        url
      });
      this.pages.push(page);
      return page;
    }
    const newPage = Page.create({
      url
    });
    this.pages.push(newPage);
    return newPage;
  }
  /**
   * Get the content of a file.
   * Resolve the path if it's needed.
   */ async getContent(file, loader) {
    file = normalizePath(file);
    const basePath = this.src();
    if (file.startsWith(basePath)) {
      file = normalizePath(file.slice(basePath.length));
    }
    file = decodeURI(file);
    const url = encodeURI(file);
    // It's a page
    const page = this.pages.find((page)=>page.data.url === url);
    if (page) {
      return page.content;
    }
    // It's a static file
    const staticFile = this.files.find((f)=>f.outputPath === file);
    if (staticFile) {
      return (await staticFile.entry.getContent(loader)).content;
    }
    // Read the source files directly
    try {
      const entry = this.fs.entries.get(file);
      if (entry) {
        return (await entry.getContent(loader)).content;
      }
    } catch  {
    // Ignore error
    }
  }
  /** Returns a File system watcher of the site */ getWatcher() {
    return new FSWatcher({
      root: this.src(),
      ignore: this.options.watcher.ignore,
      debounce: this.options.watcher.debounce
    });
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvbHVtZUB2Mi4yLjAvY29yZS9zaXRlLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGpvaW4sIHBvc2l4IH0gZnJvbSBcIi4uL2RlcHMvcGF0aC50c1wiO1xuaW1wb3J0IHsgbWVyZ2UgfSBmcm9tIFwiLi91dGlscy9vYmplY3QudHNcIjtcbmltcG9ydCB7IG5vcm1hbGl6ZVBhdGggfSBmcm9tIFwiLi91dGlscy9wYXRoLnRzXCI7XG5pbXBvcnQgeyBlbnYgfSBmcm9tIFwiLi91dGlscy9lbnYudHNcIjtcbmltcG9ydCB7IGxvZyB9IGZyb20gXCIuL3V0aWxzL2xvZy50c1wiO1xuXG5pbXBvcnQgRlMgZnJvbSBcIi4vZnMudHNcIjtcbmltcG9ydCBDb21wb25lbnRMb2FkZXIgZnJvbSBcIi4vY29tcG9uZW50X2xvYWRlci50c1wiO1xuaW1wb3J0IERhdGFMb2FkZXIgZnJvbSBcIi4vZGF0YV9sb2FkZXIudHNcIjtcbmltcG9ydCBTb3VyY2UgZnJvbSBcIi4vc291cmNlLnRzXCI7XG5pbXBvcnQgU2NvcGVzIGZyb20gXCIuL3Njb3Blcy50c1wiO1xuaW1wb3J0IFByb2Nlc3NvcnMgZnJvbSBcIi4vcHJvY2Vzc29ycy50c1wiO1xuaW1wb3J0IFJlbmRlcmVyIGZyb20gXCIuL3JlbmRlcmVyLnRzXCI7XG5pbXBvcnQgRXZlbnRzIGZyb20gXCIuL2V2ZW50cy50c1wiO1xuaW1wb3J0IEZvcm1hdHMgZnJvbSBcIi4vZm9ybWF0cy50c1wiO1xuaW1wb3J0IFNlYXJjaGVyIGZyb20gXCIuL3NlYXJjaGVyLnRzXCI7XG5pbXBvcnQgU2NyaXB0cyBmcm9tIFwiLi9zY3JpcHRzLnRzXCI7XG5pbXBvcnQgRlNXYXRjaGVyIGZyb20gXCIuLi9jb3JlL3dhdGNoZXIudHNcIjtcbmltcG9ydCB7IEZTV3JpdGVyIH0gZnJvbSBcIi4vd3JpdGVyLnRzXCI7XG5pbXBvcnQgeyBQYWdlIH0gZnJvbSBcIi4vZmlsZS50c1wiO1xuaW1wb3J0IHRleHRMb2FkZXIgZnJvbSBcIi4vbG9hZGVycy90ZXh0LnRzXCI7XG5pbXBvcnQgdHlwZSB7IExvYWRlciB9IGZyb20gXCIuL2xvYWRlcnMvbW9kLnRzXCI7XG5cbmltcG9ydCB0eXBlIHsgQ29tcG9uZW50LCBDb21wb25lbnRzIH0gZnJvbSBcIi4vY29tcG9uZW50X2xvYWRlci50c1wiO1xuaW1wb3J0IHR5cGUgeyBEYXRhLCBSYXdEYXRhLCBTdGF0aWNGaWxlIH0gZnJvbSBcIi4vZmlsZS50c1wiO1xuaW1wb3J0IHR5cGUgeyBFbmdpbmUsIEhlbHBlciwgSGVscGVyT3B0aW9ucyB9IGZyb20gXCIuL3JlbmRlcmVyLnRzXCI7XG5pbXBvcnQgdHlwZSB7IEV2ZW50LCBFdmVudExpc3RlbmVyLCBFdmVudE9wdGlvbnMgfSBmcm9tIFwiLi9ldmVudHMudHNcIjtcbmltcG9ydCB0eXBlIHsgUHJvY2Vzc29yIH0gZnJvbSBcIi4vcHJvY2Vzc29ycy50c1wiO1xuaW1wb3J0IHR5cGUgeyBFeHRlbnNpb25zIH0gZnJvbSBcIi4vdXRpbHMvcGF0aC50c1wiO1xuaW1wb3J0IHR5cGUgeyBXcml0ZXIgfSBmcm9tIFwiLi93cml0ZXIudHNcIjtcbmltcG9ydCB0eXBlIHsgTWlkZGxld2FyZSB9IGZyb20gXCIuL3NlcnZlci50c1wiO1xuaW1wb3J0IHR5cGUgeyBTY29wZUZpbHRlciB9IGZyb20gXCIuL3Njb3Blcy50c1wiO1xuaW1wb3J0IHR5cGUgeyBTY3JpcHRPckZ1bmN0aW9uIH0gZnJvbSBcIi4vc2NyaXB0cy50c1wiO1xuaW1wb3J0IHR5cGUgeyBXYXRjaGVyIH0gZnJvbSBcIi4vd2F0Y2hlci50c1wiO1xuaW1wb3J0IHR5cGUgeyBNZXJnZVN0cmF0ZWd5IH0gZnJvbSBcIi4vdXRpbHMvbWVyZ2VfZGF0YS50c1wiO1xuXG4vKiogRGVmYXVsdCBvcHRpb25zIG9mIHRoZSBzaXRlICovXG5jb25zdCBkZWZhdWx0czogU2l0ZU9wdGlvbnMgPSB7XG4gIGN3ZDogRGVuby5jd2QoKSxcbiAgc3JjOiBcIi4vXCIsXG4gIGRlc3Q6IFwiLi9fc2l0ZVwiLFxuICBlbXB0eURlc3Q6IHRydWUsXG4gIGluY2x1ZGVzOiBcIl9pbmNsdWRlc1wiLFxuICBsb2NhdGlvbjogbmV3IFVSTChcImh0dHA6Ly9sb2NhbGhvc3RcIiksXG4gIHByZXR0eVVybHM6IHRydWUsXG4gIHNlcnZlcjoge1xuICAgIHBvcnQ6IDMwMDAsXG4gICAgb3BlbjogZmFsc2UsXG4gICAgcGFnZTQwNDogXCIvNDA0Lmh0bWxcIixcbiAgICBtaWRkbGV3YXJlczogW10sXG4gIH0sXG4gIHdhdGNoZXI6IHtcbiAgICBpZ25vcmU6IFtdLFxuICAgIGRlYm91bmNlOiAxMDAsXG4gIH0sXG4gIGNvbXBvbmVudHM6IHtcbiAgICB2YXJpYWJsZTogXCJjb21wXCIsXG4gICAgY3NzRmlsZTogXCIvY29tcG9uZW50cy5jc3NcIixcbiAgICBqc0ZpbGU6IFwiL2NvbXBvbmVudHMuanNcIixcbiAgfSxcbn07XG5cbi8qKlxuICogVGhpcyBpcyB0aGUgaGVhcnQgb2YgTHVtZSxcbiAqIGl0IGNvbnRhaW5zIGV2ZXJ5dGhpbmcgbmVlZGVkIHRvIGJ1aWxkIHRoZSBzaXRlXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFNpdGUge1xuICBvcHRpb25zOiBTaXRlT3B0aW9ucztcblxuICAvKiogSW50ZXJuYWwgZGF0YS4gVXNlZCB0byBzYXZlIGFyYml0cmFyeSBkYXRhIGJ5IHBsdWdpbnMgYW5kIHByb2Nlc3NvcnMgKi9cbiAgX2RhdGE6IFJlY29yZDxzdHJpbmcsIHVua25vd24+ID0ge307XG5cbiAgLyoqIFRvIHJlYWQgdGhlIGZpbGVzIGZyb20gdGhlIGZpbGVzeXN0ZW0gKi9cbiAgZnM6IEZTO1xuXG4gIC8qKiBJbmZvIGFib3V0IGhvdyB0byBoYW5kbGUgZGlmZmVyZW50IGZpbGUgZm9ybWF0cyAqL1xuICBmb3JtYXRzOiBGb3JtYXRzO1xuXG4gIC8qKiBUbyBsb2FkIGFsbCBfZGF0YSBmaWxlcyAqL1xuICBkYXRhTG9hZGVyOiBEYXRhTG9hZGVyO1xuXG4gIC8qKiBUbyBsb2FkIHJldXNhYmxlIGNvbXBvbmVudHMgKi9cbiAgY29tcG9uZW50TG9hZGVyOiBDb21wb25lbnRMb2FkZXI7XG5cbiAgLyoqIFRvIHNjYW4gdGhlIHNyYyBmb2xkZXIgKi9cbiAgc291cmNlOiBTb3VyY2U7XG5cbiAgLyoqIFRvIHVwZGF0ZSBwYWdlcyBvZiB0aGUgc2FtZSBzY29wZSBhZnRlciBhbnkgY2hhbmdlICovXG4gIHNjb3BlczogU2NvcGVzO1xuXG4gIC8qKiBUbyBzdG9yZSBhbmQgcnVuIHRoZSBwcm9jZXNzb3JzICovXG4gIHByb2Nlc3NvcnM6IFByb2Nlc3NvcnM7XG5cbiAgLyoqIFRvIHN0b3JlIGFuZCBydW4gdGhlIHByZS1wcm9jZXNzb3JzICovXG4gIHByZXByb2Nlc3NvcnM6IFByb2Nlc3NvcnM7XG5cbiAgLyoqIFRvIHJlbmRlciB0aGUgcGFnZXMgdXNpbmcgYW55IHRlbXBsYXRlIGVuZ2luZSAqL1xuICByZW5kZXJlcjogUmVuZGVyZXI7XG5cbiAgLyoqIFRvIGxpc3RlbiBhbmQgZGlzcGF0Y2ggZXZlbnRzICovXG4gIC8vIGRlbm8tbGludC1pZ25vcmUgbm8tZXhwbGljaXQtYW55XG4gIGV2ZW50czogRXZlbnRzPGFueT47XG5cbiAgLyoqIFRvIHJ1biBzY3JpcHRzICovXG4gIHNjcmlwdHM6IFNjcmlwdHM7XG5cbiAgLyoqIFRvIHNlYXJjaCBwYWdlcyAqL1xuICBzZWFyY2g6IFNlYXJjaGVyO1xuXG4gIC8qKiBUbyB3cml0ZSB0aGUgZ2VuZXJhdGVkIHBhZ2VzIGluIHRoZSBkZXN0IGZvbGRlciAqL1xuICB3cml0ZXI6IFdyaXRlcjtcblxuICAvKiogRGF0YSBhc3NpZ25lZCB3aXRoIHNpdGUuZGF0YSgpICovXG4gIHNjb3BlZERhdGEgPSBuZXcgTWFwPHN0cmluZywgUmF3RGF0YT4oW1tcIi9cIiwge31dXSk7XG5cbiAgLyoqIFBhZ2VzIGNyZWF0ZWQgd2l0aCBzaXRlLnBhZ2UoKSAqL1xuICBzY29wZWRQYWdlcyA9IG5ldyBNYXA8c3RyaW5nLCBSYXdEYXRhW10+KCk7XG5cbiAgLyoqIENvbXBvbmVudHMgY3JlYXRlZCB3aXRoIHNpdGUuY29tcG9uZW50KCkgKi9cbiAgc2NvcGVkQ29tcG9uZW50cyA9IG5ldyBNYXA8c3RyaW5nLCBDb21wb25lbnRzPigpO1xuXG4gIC8qKiBIb29rcyBpbnN0YWxsZWQgYnkgdGhlIHBsdWdpbnMgKi9cbiAgLy8gZGVuby1saW50LWlnbm9yZSBuby1leHBsaWNpdC1hbnlcbiAgaG9va3M6IFJlY29yZDxzdHJpbmcsICguLi5hcmdzOiBhbnlbXSkgPT4gdm9pZD4gPSB7fTtcblxuICAvKiogVGhlIGdlbmVyYXRlZCBwYWdlcyBhcmUgc3RvcmVkIGhlcmUgKi9cbiAgcmVhZG9ubHkgcGFnZXM6IFBhZ2VbXSA9IFtdO1xuXG4gIC8qKiBQYWdlcyB0aGF0IHNob3VsZCBiZSByZW5kZXJlZCBvbiBkZW1hbmQgKi9cbiAgcmVhZG9ubHkgb25EZW1hbmRQYWdlczogUGFnZVtdID0gW107XG5cbiAgLyoqIFRoZSBzdGF0aWMgZmlsZXMgdG8gYmUgY29waWVkIGFyZSBzdG9yZWQgaGVyZSAqL1xuICByZWFkb25seSBmaWxlczogU3RhdGljRmlsZVtdID0gW107XG5cbiAgY29uc3RydWN0b3Iob3B0aW9uczogUGFydGlhbDxTaXRlT3B0aW9ucz4gPSB7fSkge1xuICAgIHRoaXMub3B0aW9ucyA9IG1lcmdlKGRlZmF1bHRzLCBvcHRpb25zKTtcblxuICAgIGNvbnN0IHNyYyA9IHRoaXMuc3JjKCk7XG4gICAgY29uc3QgZGVzdCA9IHRoaXMuZGVzdCgpO1xuICAgIGNvbnN0IHsgaW5jbHVkZXMsIGN3ZCwgcHJldHR5VXJscywgY29tcG9uZW50cywgc2VydmVyIH0gPSB0aGlzLm9wdGlvbnM7XG5cbiAgICAvLyBUbyBsb2FkIHNvdXJjZSBmaWxlc1xuICAgIGNvbnN0IGZzID0gbmV3IEZTKHsgcm9vdDogc3JjIH0pO1xuICAgIGNvbnN0IGZvcm1hdHMgPSBuZXcgRm9ybWF0cygpO1xuXG4gICAgY29uc3QgZGF0YUxvYWRlciA9IG5ldyBEYXRhTG9hZGVyKHsgZm9ybWF0cyB9KTtcbiAgICBjb25zdCBjb21wb25lbnRMb2FkZXIgPSBuZXcgQ29tcG9uZW50TG9hZGVyKHsgZm9ybWF0cyB9KTtcbiAgICBjb25zdCBzb3VyY2UgPSBuZXcgU291cmNlKHtcbiAgICAgIGZzLFxuICAgICAgZGF0YUxvYWRlcixcbiAgICAgIGNvbXBvbmVudExvYWRlcixcbiAgICAgIGZvcm1hdHMsXG4gICAgICBjb21wb25lbnRzLFxuICAgICAgc2NvcGVkRGF0YTogdGhpcy5zY29wZWREYXRhLFxuICAgICAgc2NvcGVkUGFnZXM6IHRoaXMuc2NvcGVkUGFnZXMsXG4gICAgICBzY29wZWRDb21wb25lbnRzOiB0aGlzLnNjb3BlZENvbXBvbmVudHMsXG4gICAgICBwcmV0dHlVcmxzLFxuICAgIH0pO1xuXG4gICAgLy8gVG8gcmVuZGVyIHBhZ2VzXG4gICAgY29uc3Qgc2NvcGVzID0gbmV3IFNjb3BlcygpO1xuICAgIGNvbnN0IHByb2Nlc3NvcnMgPSBuZXcgUHJvY2Vzc29ycygpO1xuICAgIGNvbnN0IHByZXByb2Nlc3NvcnMgPSBuZXcgUHJvY2Vzc29ycygpO1xuICAgIGNvbnN0IHJlbmRlcmVyID0gbmV3IFJlbmRlcmVyKHtcbiAgICAgIHByZXR0eVVybHMsXG4gICAgICBwcmVwcm9jZXNzb3JzLFxuICAgICAgZm9ybWF0cyxcbiAgICAgIGZzLFxuICAgICAgaW5jbHVkZXMsXG4gICAgfSk7XG5cbiAgICAvLyBPdGhlciBzdHVmZlxuICAgIGNvbnN0IGV2ZW50cyA9IG5ldyBFdmVudHM8U2l0ZUV2ZW50PigpO1xuICAgIGNvbnN0IHNjcmlwdHMgPSBuZXcgU2NyaXB0cyh7IGN3ZCB9KTtcbiAgICBjb25zdCB3cml0ZXIgPSBuZXcgRlNXcml0ZXIoeyBkZXN0IH0pO1xuXG4gICAgY29uc3QgdXJsNDA0ID0gc2VydmVyLnBhZ2U0MDQgPyBub3JtYWxpemVQYXRoKHNlcnZlci5wYWdlNDA0KSA6IHVuZGVmaW5lZDtcbiAgICBjb25zdCBzZWFyY2hlciA9IG5ldyBTZWFyY2hlcih7XG4gICAgICBwYWdlczogdGhpcy5wYWdlcyxcbiAgICAgIGZpbGVzOiB0aGlzLmZpbGVzLFxuICAgICAgc291cmNlRGF0YTogc291cmNlLmRhdGEsXG4gICAgICBmaWx0ZXJzOiBbXG4gICAgICAgIChkYXRhOiBEYXRhKSA9PiBkYXRhLnBhZ2Uub3V0cHV0UGF0aC5lbmRzV2l0aChcIi5odG1sXCIpID8/IGZhbHNlLCAvLyBvbmx5IGh0bWwgcGFnZXNcbiAgICAgICAgKGRhdGE6IERhdGEpID0+ICF1cmw0MDQgfHwgZGF0YS51cmwgIT09IHVybDQwNCwgLy8gbm90IHRoZSA0MDQgcGFnZVxuICAgICAgXSxcbiAgICB9KTtcblxuICAgIC8vIFNhdmUgZXZlcnl0aGluZyBpbiB0aGUgc2l0ZSBpbnN0YW5jZVxuICAgIHRoaXMuZnMgPSBmcztcbiAgICB0aGlzLmZvcm1hdHMgPSBmb3JtYXRzO1xuICAgIHRoaXMuY29tcG9uZW50TG9hZGVyID0gY29tcG9uZW50TG9hZGVyO1xuICAgIHRoaXMuZGF0YUxvYWRlciA9IGRhdGFMb2FkZXI7XG4gICAgdGhpcy5zb3VyY2UgPSBzb3VyY2U7XG4gICAgdGhpcy5zY29wZXMgPSBzY29wZXM7XG4gICAgdGhpcy5wcm9jZXNzb3JzID0gcHJvY2Vzc29ycztcbiAgICB0aGlzLnByZXByb2Nlc3NvcnMgPSBwcmVwcm9jZXNzb3JzO1xuICAgIHRoaXMucmVuZGVyZXIgPSByZW5kZXJlcjtcbiAgICB0aGlzLmV2ZW50cyA9IGV2ZW50cztcbiAgICB0aGlzLnNjcmlwdHMgPSBzY3JpcHRzO1xuICAgIHRoaXMuc2VhcmNoID0gc2VhcmNoZXI7XG4gICAgdGhpcy53cml0ZXIgPSB3cml0ZXI7XG5cbiAgICAvLyBJZ25vcmUgdGhlIFwiZGVzdFwiIGRpcmVjdG9yeSBpZiBpdCdzIGluc2lkZSBzcmNcbiAgICBpZiAodGhpcy5kZXN0KCkuc3RhcnRzV2l0aCh0aGlzLnNyYygpKSkge1xuICAgICAgdGhpcy5pZ25vcmUodGhpcy5vcHRpb25zLmRlc3QpO1xuICAgIH1cblxuICAgIC8vIElnbm9yZSB0aGUgZGVzdCBmb2xkZXIgYnkgdGhlIHdhdGNoZXJcbiAgICB0aGlzLm9wdGlvbnMud2F0Y2hlci5pZ25vcmUucHVzaChub3JtYWxpemVQYXRoKHRoaXMub3B0aW9ucy5kZXN0KSk7XG4gICAgdGhpcy5mcy5vcHRpb25zLmlnbm9yZSA9IHRoaXMub3B0aW9ucy53YXRjaGVyLmlnbm9yZTtcbiAgfVxuXG4gIGdldCBnbG9iYWxEYXRhKCk6IFJhd0RhdGEge1xuICAgIHJldHVybiB0aGlzLnNjb3BlZERhdGEuZ2V0KFwiL1wiKSE7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgZnVsbCBwYXRoIHRvIHRoZSByb290IGRpcmVjdG9yeS5cbiAgICogVXNlIHRoZSBhcmd1bWVudHMgdG8gcmV0dXJuIGEgc3VicGF0aFxuICAgKi9cbiAgcm9vdCguLi5wYXRoOiBzdHJpbmdbXSk6IHN0cmluZyB7XG4gICAgcmV0dXJuIG5vcm1hbGl6ZVBhdGgoam9pbih0aGlzLm9wdGlvbnMuY3dkLCAuLi5wYXRoKSk7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgZnVsbCBwYXRoIHRvIHRoZSBzcmMgZGlyZWN0b3J5LlxuICAgKiBVc2UgdGhlIGFyZ3VtZW50cyB0byByZXR1cm4gYSBzdWJwYXRoXG4gICAqL1xuICBzcmMoLi4ucGF0aDogc3RyaW5nW10pOiBzdHJpbmcge1xuICAgIHJldHVybiB0aGlzLnJvb3QodGhpcy5vcHRpb25zLnNyYywgLi4ucGF0aCk7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgZnVsbCBwYXRoIHRvIHRoZSBkZXN0IGRpcmVjdG9yeS5cbiAgICogVXNlIHRoZSBhcmd1bWVudHMgdG8gcmV0dXJuIGEgc3VicGF0aFxuICAgKi9cbiAgZGVzdCguLi5wYXRoOiBzdHJpbmdbXSk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHRoaXMucm9vdCh0aGlzLm9wdGlvbnMuZGVzdCwgLi4ucGF0aCk7XG4gIH1cblxuICAvKiogQWRkIGEgbGlzdGVuZXIgdG8gYW4gZXZlbnQgKi9cbiAgYWRkRXZlbnRMaXN0ZW5lcjxLIGV4dGVuZHMgU2l0ZUV2ZW50VHlwZT4oXG4gICAgdHlwZTogSyxcbiAgICBsaXN0ZW5lcjogRXZlbnRMaXN0ZW5lcjxFdmVudCAmIFNpdGVFdmVudDxLPj4gfCBzdHJpbmcsXG4gICAgb3B0aW9ucz86IEV2ZW50T3B0aW9ucyxcbiAgKTogdGhpcyB7XG4gICAgY29uc3QgZm4gPSB0eXBlb2YgbGlzdGVuZXIgPT09IFwic3RyaW5nXCJcbiAgICAgID8gKCkgPT4gdGhpcy5ydW4obGlzdGVuZXIpXG4gICAgICA6IGxpc3RlbmVyO1xuXG4gICAgdGhpcy5ldmVudHMuYWRkRXZlbnRMaXN0ZW5lcih0eXBlLCBmbiwgb3B0aW9ucyk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKiogRGlzcGF0Y2ggYW4gZXZlbnQgKi9cbiAgZGlzcGF0Y2hFdmVudChldmVudDogU2l0ZUV2ZW50KTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgcmV0dXJuIHRoaXMuZXZlbnRzLmRpc3BhdGNoRXZlbnQoZXZlbnQpO1xuICB9XG5cbiAgLyoqIFVzZSBhIHBsdWdpbiAqL1xuICB1c2UocGx1Z2luOiBQbHVnaW4pOiB0aGlzIHtcbiAgICBwbHVnaW4odGhpcyk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogUmVnaXN0ZXIgYSBzY3JpcHQgb3IgYSBmdW5jdGlvbiwgc28gaXQgY2FuIGJlIGV4ZWN1dGVkIHdpdGhcbiAgICogbHVtZSBydW4gPG5hbWU+XG4gICAqL1xuICBzY3JpcHQobmFtZTogc3RyaW5nLCAuLi5zY3JpcHRzOiBTY3JpcHRPckZ1bmN0aW9uW10pOiB0aGlzIHtcbiAgICB0aGlzLnNjcmlwdHMuc2V0KG5hbWUsIC4uLnNjcmlwdHMpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqIFJ1bnMgYSBzY3JpcHQgb3IgZnVuY3Rpb24gcmVnaXN0ZXJlZCBwcmV2aW91c2x5ICovXG4gIGFzeW5jIHJ1bihuYW1lOiBzdHJpbmcpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy5zY3JpcHRzLnJ1bihuYW1lKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZWdpc3RlciBhIGRhdGEgbG9hZGVyIGZvciBzb21lIGV4dGVuc2lvbnNcbiAgICovXG4gIGxvYWREYXRhKGV4dGVuc2lvbnM6IHN0cmluZ1tdLCBkYXRhTG9hZGVyOiBMb2FkZXIgPSB0ZXh0TG9hZGVyKTogdGhpcyB7XG4gICAgZXh0ZW5zaW9ucy5mb3JFYWNoKChleHQpID0+IHtcbiAgICAgIHRoaXMuZm9ybWF0cy5zZXQoeyBleHQsIGRhdGFMb2FkZXIgfSk7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBSZWdpc3RlciBhIHBhZ2UgbG9hZGVyIGZvciBzb21lIGV4dGVuc2lvbnNcbiAgICovXG4gIGxvYWRQYWdlcyhcbiAgICBleHRlbnNpb25zOiBzdHJpbmdbXSxcbiAgICBvcHRpb25zOiBMb2FkUGFnZXNPcHRpb25zIHwgTG9hZGVyID0ge30sXG4gICk6IHRoaXMge1xuICAgIGlmICh0eXBlb2Ygb3B0aW9ucyA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICBvcHRpb25zID0geyBsb2FkZXI6IG9wdGlvbnMgfTtcbiAgICB9XG5cbiAgICBjb25zdCB7IGVuZ2luZSwgcGFnZVN1YkV4dGVuc2lvbiB9ID0gb3B0aW9ucztcbiAgICBjb25zdCBsb2FkZXIgPSBvcHRpb25zLmxvYWRlciB8fCB0ZXh0TG9hZGVyO1xuICAgIGNvbnN0IGVuZ2luZXMgPSBBcnJheS5pc0FycmF5KGVuZ2luZSkgPyBlbmdpbmUgOiBlbmdpbmUgPyBbZW5naW5lXSA6IFtdO1xuXG4gICAgY29uc3QgcGFnZUV4dGVuc2lvbnMgPSBwYWdlU3ViRXh0ZW5zaW9uXG4gICAgICA/IGV4dGVuc2lvbnMubWFwKChleHQpID0+IHBhZ2VTdWJFeHRlbnNpb24gKyBleHQpXG4gICAgICA6IGV4dGVuc2lvbnM7XG5cbiAgICBwYWdlRXh0ZW5zaW9ucy5mb3JFYWNoKChleHQpID0+IHtcbiAgICAgIHRoaXMuZm9ybWF0cy5zZXQoe1xuICAgICAgICBleHQsXG4gICAgICAgIGxvYWRlcixcbiAgICAgICAgcGFnZVR5cGU6IFwicGFnZVwiLFxuICAgICAgICBlbmdpbmVzLFxuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBpZiAocGFnZVN1YkV4dGVuc2lvbikge1xuICAgICAgZXh0ZW5zaW9ucy5mb3JFYWNoKChleHQpID0+IHRoaXMuZm9ybWF0cy5zZXQoeyBleHQsIGxvYWRlciwgZW5naW5lcyB9KSk7XG4gICAgfVxuXG4gICAgZm9yIChjb25zdCBbbmFtZSwgaGVscGVyXSBvZiB0aGlzLnJlbmRlcmVyLmhlbHBlcnMpIHtcbiAgICAgIGVuZ2luZXMuZm9yRWFjaCgoZW5naW5lKSA9PiBlbmdpbmUuYWRkSGVscGVyKG5hbWUsIC4uLmhlbHBlcikpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlZ2lzdGVyIGFuIGFzc2V0cyBsb2FkZXIgZm9yIHNvbWUgZXh0ZW5zaW9uc1xuICAgKi9cbiAgbG9hZEFzc2V0cyhleHRlbnNpb25zOiBzdHJpbmdbXSwgYXNzZXRMb2FkZXI6IExvYWRlciA9IHRleHRMb2FkZXIpOiB0aGlzIHtcbiAgICBleHRlbnNpb25zLmZvckVhY2goKGV4dCkgPT4ge1xuICAgICAgdGhpcy5mb3JtYXRzLnNldCh7XG4gICAgICAgIGV4dCxcbiAgICAgICAgYXNzZXRMb2FkZXIsXG4gICAgICAgIHBhZ2VUeXBlOiBcImFzc2V0XCIsXG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqIFJlZ2lzdGVyIGEgcHJlcHJvY2Vzc29yIGZvciBzb21lIGV4dGVuc2lvbnMgKi9cbiAgcHJlcHJvY2VzcyhleHRlbnNpb25zOiBFeHRlbnNpb25zLCBwcmVwcm9jZXNzb3I6IFByb2Nlc3Nvcik6IHRoaXMge1xuICAgIHRoaXMucHJlcHJvY2Vzc29ycy5zZXQoZXh0ZW5zaW9ucywgcHJlcHJvY2Vzc29yKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKiBSZWdpc3RlciBhIHByb2Nlc3NvciBmb3Igc29tZSBleHRlbnNpb25zICovXG4gIHByb2Nlc3MoZXh0ZW5zaW9uczogRXh0ZW5zaW9ucywgcHJvY2Vzc29yOiBQcm9jZXNzb3IpOiB0aGlzIHtcbiAgICB0aGlzLnByb2Nlc3NvcnMuc2V0KGV4dGVuc2lvbnMsIHByb2Nlc3Nvcik7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKiogUmVnaXN0ZXIgYSB0ZW1wbGF0ZSBmaWx0ZXIgKi9cbiAgZmlsdGVyKG5hbWU6IHN0cmluZywgZmlsdGVyOiBIZWxwZXIsIGFzeW5jID0gZmFsc2UpOiB0aGlzIHtcbiAgICByZXR1cm4gdGhpcy5oZWxwZXIobmFtZSwgZmlsdGVyLCB7IHR5cGU6IFwiZmlsdGVyXCIsIGFzeW5jIH0pO1xuICB9XG5cbiAgLyoqIFJlZ2lzdGVyIGEgdGVtcGxhdGUgaGVscGVyICovXG4gIGhlbHBlcihuYW1lOiBzdHJpbmcsIGZuOiBIZWxwZXIsIG9wdGlvbnM6IEhlbHBlck9wdGlvbnMpOiB0aGlzIHtcbiAgICB0aGlzLnJlbmRlcmVyLmFkZEhlbHBlcihuYW1lLCBmbiwgb3B0aW9ucyk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKiogUmVnaXN0ZXIgZXh0cmEgZGF0YSBhY2Nlc3NpYmxlIGJ5IHRoZSBsYXlvdXRzICovXG4gIGRhdGEobmFtZTogc3RyaW5nLCB2YWx1ZTogdW5rbm93biwgc2NvcGUgPSBcIi9cIik6IHRoaXMge1xuICAgIGNvbnN0IGRhdGEgPSB0aGlzLnNjb3BlZERhdGEuZ2V0KHNjb3BlKSB8fCB7fTtcbiAgICBkYXRhW25hbWVdID0gdmFsdWU7XG4gICAgdGhpcy5zY29wZWREYXRhLnNldChzY29wZSwgZGF0YSk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKiogUmVnaXN0ZXIgYSBwYWdlICovXG4gIHBhZ2UoZGF0YTogUGFydGlhbDxEYXRhPiwgc2NvcGUgPSBcIi9cIik6IHRoaXMge1xuICAgIGNvbnN0IHBhZ2VzID0gdGhpcy5zY29wZWRQYWdlcy5nZXQoc2NvcGUpIHx8IFtdO1xuICAgIHBhZ2VzLnB1c2goZGF0YSk7XG4gICAgdGhpcy5zY29wZWRQYWdlcy5zZXQoc2NvcGUsIHBhZ2VzKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKiBSZWdpc3RlciBhbiBleHRyYSBjb21wb25lbnQgYWNjZXNpYmxlIGJ5IHRoZSBsYXlvdXRzICovXG4gIGNvbXBvbmVudChjb250ZXh0OiBzdHJpbmcsIGNvbXBvbmVudDogQ29tcG9uZW50LCBzY29wZSA9IFwiL1wiKTogdGhpcyB7XG4gICAgY29uc3QgcGllY2VzID0gY29udGV4dC5zcGxpdChcIi5cIik7XG4gICAgY29uc3Qgc2NvcGVkQ29tcG9uZW50czogQ29tcG9uZW50cyA9IHRoaXMuc2NvcGVkQ29tcG9uZW50cy5nZXQoc2NvcGUpIHx8XG4gICAgICBuZXcgTWFwKCk7XG4gICAgbGV0IGNvbXBvbmVudHM6IENvbXBvbmVudHMgPSBzY29wZWRDb21wb25lbnRzO1xuXG4gICAgd2hpbGUgKHBpZWNlcy5sZW5ndGgpIHtcbiAgICAgIGNvbnN0IG5hbWUgPSBwaWVjZXMuc2hpZnQoKSE7XG4gICAgICBpZiAoIWNvbXBvbmVudHMuZ2V0KG5hbWUpKSB7XG4gICAgICAgIGNvbXBvbmVudHMuc2V0KG5hbWUsIG5ldyBNYXAoKSk7XG4gICAgICB9XG4gICAgICBjb21wb25lbnRzID0gY29tcG9uZW50cy5nZXQobmFtZSkgYXMgQ29tcG9uZW50cztcbiAgICB9XG5cbiAgICBjb21wb25lbnRzLnNldChjb21wb25lbnQubmFtZSwgY29tcG9uZW50KTtcbiAgICB0aGlzLnNjb3BlZENvbXBvbmVudHMuc2V0KHNjb3BlLCBzY29wZWRDb21wb25lbnRzKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKiBSZWdpc3RlciBhIG1lcmdpbmcgc3RyYXRlZ3kgZm9yIGEgZGF0YSBrZXkgKi9cbiAgbWVyZ2VLZXkoa2V5OiBzdHJpbmcsIG1lcmdlOiBNZXJnZVN0cmF0ZWd5LCBzY29wZSA9IFwiL1wiKTogdGhpcyB7XG4gICAgY29uc3QgZGF0YSA9IHRoaXMuc2NvcGVkRGF0YS5nZXQoc2NvcGUpIHx8IHt9O1xuICAgIGNvbnN0IG1lcmdlZEtleXMgPSBkYXRhLm1lcmdlZEtleXMgfHwge307XG4gICAgbWVyZ2VkS2V5c1trZXldID0gbWVyZ2U7XG4gICAgZGF0YS5tZXJnZWRLZXlzID0gbWVyZ2VkS2V5cztcbiAgICB0aGlzLnNjb3BlZERhdGEuc2V0KHNjb3BlLCBkYXRhKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKiBDb3B5IHN0YXRpYyBmaWxlcyBvciBkaXJlY3RvcmllcyB3aXRob3V0IHByb2Nlc3NpbmcgKi9cbiAgY29weShmcm9tOiBzdHJpbmcsIHRvPzogc3RyaW5nIHwgKChwYXRoOiBzdHJpbmcpID0+IHN0cmluZykpOiB0aGlzO1xuICBjb3B5KGZyb206IHN0cmluZ1tdLCB0bz86IChwYXRoOiBzdHJpbmcpID0+IHN0cmluZyk6IHRoaXM7XG4gIGNvcHkoXG4gICAgZnJvbTogc3RyaW5nIHwgc3RyaW5nW10sXG4gICAgdG8/OiBzdHJpbmcgfCAoKHBhdGg6IHN0cmluZykgPT4gc3RyaW5nKSxcbiAgKTogdGhpcyB7XG4gICAgLy8gRmlsZSBleHRlbnNpb25zXG4gICAgaWYgKEFycmF5LmlzQXJyYXkoZnJvbSkpIHtcbiAgICAgIGlmICh0eXBlb2YgdG8gPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgIGBjb3B5KCkgZmlsZXMgYnkgZXh0ZW5zaW9uIGV4cGVjdHMgYSBmdW5jdGlvbiBhcyBzZWNvbmQgYXJndW1lbnQgYnV0IGdvdCBhIHN0cmluZyBcIiR7dG99XCJgLFxuICAgICAgICApO1xuICAgICAgfVxuXG4gICAgICBmcm9tLmZvckVhY2goKGV4dCkgPT4ge1xuICAgICAgICB0aGlzLmZvcm1hdHMuc2V0KHsgZXh0LCBjb3B5OiB0byA/IHRvIDogdHJ1ZSB9KTtcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgdGhpcy5zb3VyY2UuYWRkU3RhdGljUGF0aChmcm9tLCB0byk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKiogQ29weSB0aGUgcmVtYWluaW5nIGZpbGVzICovXG4gIGNvcHlSZW1haW5pbmdGaWxlcyhcbiAgICBmaWx0ZXI6IChwYXRoOiBzdHJpbmcpID0+IHN0cmluZyB8IGJvb2xlYW4gPSAoKSA9PiB0cnVlLFxuICApOiB0aGlzIHtcbiAgICB0aGlzLnNvdXJjZS5jb3B5UmVtYWluaW5nRmlsZXMgPSBmaWx0ZXI7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKiogSWdub3JlIG9uZSBvciBzZXZlcmFsIGZpbGVzIG9yIGRpcmVjdG9yaWVzICovXG4gIGlnbm9yZSguLi5wYXRoczogKHN0cmluZyB8IFNjb3BlRmlsdGVyKVtdKTogdGhpcyB7XG4gICAgcGF0aHMuZm9yRWFjaCgocGF0aCkgPT4ge1xuICAgICAgaWYgKHR5cGVvZiBwYXRoID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgIHRoaXMuc291cmNlLmFkZElnbm9yZWRQYXRoKHBhdGgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5zb3VyY2UuYWRkSWdub3JlRmlsdGVyKHBhdGgpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqIERlZmluZSBpbmRlcGVuZGVudCBzY29wZXMgdG8gb3B0aW1pemUgdGhlIHVwZGF0ZSBwcm9jZXNzICovXG4gIHNjb3BlZFVwZGF0ZXMoLi4uc2NvcGVzOiBTY29wZUZpbHRlcltdKTogdGhpcyB7XG4gICAgc2NvcGVzLmZvckVhY2goKHNjb3BlKSA9PiB0aGlzLnNjb3Blcy5zY29wZXMuYWRkKHNjb3BlKSk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKiogRGVmaW5lIGEgcmVtb3RlIGZhbGxiYWNrIGZvciBhIG1pc3NpbmcgbG9jYWwgZmlsZSAqL1xuICByZW1vdGVGaWxlKGZpbGVuYW1lOiBzdHJpbmcsIHVybDogc3RyaW5nKTogdGhpcyB7XG4gICAgdGhpcy5mcy5yZW1vdGVGaWxlcy5zZXQocG9zaXguam9pbihcIi9cIiwgZmlsZW5hbWUpLCB1cmwpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqIENsZWFyIHRoZSBkZXN0IGRpcmVjdG9yeSBhbmQgYW55IGNhY2hlICovXG4gIGFzeW5jIGNsZWFyKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMud3JpdGVyLmNsZWFyKCk7XG4gIH1cblxuICAvKiogQnVpbGQgdGhlIGVudGlyZSBzaXRlICovXG4gIGFzeW5jIGJ1aWxkKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmIChhd2FpdCB0aGlzLmRpc3BhdGNoRXZlbnQoeyB0eXBlOiBcImJlZm9yZUJ1aWxkXCIgfSkgPT09IGZhbHNlKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKHRoaXMub3B0aW9ucy5lbXB0eURlc3QpIHtcbiAgICAgIGF3YWl0IHRoaXMuY2xlYXIoKTtcbiAgICB9XG5cbiAgICBwZXJmb3JtYW5jZS5tYXJrKFwic3RhcnQtbG9hZGZpbGVzXCIpO1xuXG4gICAgLy8gTG9hZCBzb3VyY2UgZmlsZXNcbiAgICB0aGlzLmZzLmluaXQoKTtcblxuICAgIGlmIChhd2FpdCB0aGlzLmRpc3BhdGNoRXZlbnQoeyB0eXBlOiBcImFmdGVyTG9hZFwiIH0pID09PSBmYWxzZSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIEdldCB0aGUgc2l0ZSBjb250ZW50XG4gICAgY29uc3Qgc2hvd0RyYWZ0cyA9IGVudjxib29sZWFuPihcIkxVTUVfRFJBRlRTXCIpO1xuICAgIGNvbnN0IFtfcGFnZXMsIF9zdGF0aWNGaWxlc10gPSBhd2FpdCB0aGlzLnNvdXJjZS5idWlsZChcbiAgICAgIChfLCBwYWdlKSA9PiAhcGFnZT8uZGF0YS5kcmFmdCB8fCBzaG93RHJhZnRzID09PSB0cnVlLFxuICAgICk7XG5cbiAgICBwZXJmb3JtYW5jZS5tYXJrKFwiZW5kLWxvYWRmaWxlc1wiKTtcblxuICAgIGxvZy5kZWJ1ZyhcbiAgICAgIGBQYWdlcyBsb2FkZWQgaW4gJHtcbiAgICAgICAgKHBlcmZvcm1hbmNlLm1lYXN1cmUoXCJkdXJhdGlvblwiLCBcInN0YXJ0LWxvYWRmaWxlc1wiLCBcImVuZC1sb2FkZmlsZXNcIilcbiAgICAgICAgICAuZHVyYXRpb24gL1xuICAgICAgICAgIDEwMDApLnRvRml4ZWQoMilcbiAgICAgIH0gc2Vjb25kc2AsXG4gICAgKTtcblxuICAgIC8vIFNhdmUgc3RhdGljIGZpbGVzIGludG8gc2l0ZS5maWxlc1xuICAgIHRoaXMuZmlsZXMuc3BsaWNlKDAsIHRoaXMuZmlsZXMubGVuZ3RoLCAuLi5fc3RhdGljRmlsZXMpO1xuXG4gICAgLy8gU3RvcCBpZiB0aGUgYnVpbGQgaXMgY2FuY2VsbGVkXG4gICAgaWYgKGF3YWl0IHRoaXMuI2J1aWxkUGFnZXMoX3BhZ2VzKSA9PT0gZmFsc2UpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBTYXZlIHRoZSBwYWdlcyBhbmQgY29weSBzdGF0aWMgZmlsZXMgaW4gdGhlIGRlc3QgZm9sZGVyXG4gICAgY29uc3QgcGFnZXMgPSBhd2FpdCB0aGlzLndyaXRlci5zYXZlUGFnZXModGhpcy5wYWdlcyk7XG4gICAgY29uc3Qgc3RhdGljRmlsZXMgPSBhd2FpdCB0aGlzLndyaXRlci5jb3B5RmlsZXModGhpcy5maWxlcyk7XG5cbiAgICBhd2FpdCB0aGlzLmRpc3BhdGNoRXZlbnQoeyB0eXBlOiBcImFmdGVyQnVpbGRcIiwgcGFnZXMsIHN0YXRpY0ZpbGVzIH0pO1xuICB9XG5cbiAgLyoqIFJlbG9hZCBzb21lIGZpbGVzIHRoYXQgbWlnaHQgYmUgY2hhbmdlZCAqL1xuICBhc3luYyB1cGRhdGUoZmlsZXM6IFNldDxzdHJpbmc+KTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKGF3YWl0IHRoaXMuZGlzcGF0Y2hFdmVudCh7IHR5cGU6IFwiYmVmb3JlVXBkYXRlXCIsIGZpbGVzIH0pID09PSBmYWxzZSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuc2VhcmNoLmRlbGV0ZUNhY2hlKCk7XG5cbiAgICAvLyBSZWxvYWQgdGhlIGNoYW5nZWQgZmlsZXNcbiAgICBmb3IgKGNvbnN0IGZpbGUgb2YgZmlsZXMpIHtcbiAgICAgIC8vIERlbGV0ZSB0aGUgZmlsZSBmcm9tIHRoZSBjYWNoZVxuICAgICAgdGhpcy5mb3JtYXRzLmRlbGV0ZUNhY2hlKGZpbGUpO1xuICAgICAgY29uc3QgZW50cnkgPSB0aGlzLmZzLnVwZGF0ZShmaWxlKTtcblxuICAgICAgaWYgKCFlbnRyeSkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgLy8gUmVtb3ZlIHBhZ2VzIG9yIHN0YXRpYyBmaWxlcyBkZXBlbmRpbmcgb24gdGhpcyBlbnRyeVxuICAgICAgY29uc3QgcGFnZXMgPSB0aGlzLnBhZ2VzLmZpbHRlcigocGFnZSkgPT4gcGFnZS5zcmMuZW50cnkgPT09IGVudHJ5KS5tYXAoKFxuICAgICAgICBwYWdlLFxuICAgICAgKSA9PiBwYWdlLm91dHB1dFBhdGgpO1xuICAgICAgY29uc3QgZmlsZXMgPSB0aGlzLmZpbGVzLmZpbHRlcigoZmlsZSkgPT4gZmlsZS5lbnRyeSA9PT0gZW50cnkpLm1hcCgoXG4gICAgICAgIGZpbGUsXG4gICAgICApID0+IGZpbGUub3V0cHV0UGF0aCk7XG4gICAgICBhd2FpdCB0aGlzLndyaXRlci5yZW1vdmVGaWxlcyhbLi4ucGFnZXMsIC4uLmZpbGVzXSk7XG4gICAgfVxuXG4gICAgaWYgKGF3YWl0IHRoaXMuZGlzcGF0Y2hFdmVudCh7IHR5cGU6IFwiYWZ0ZXJMb2FkXCIgfSkgPT09IGZhbHNlKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gR2V0IHRoZSBzaXRlIGNvbnRlbnRcbiAgICBjb25zdCBzaG93RHJhZnRzID0gZW52PGJvb2xlYW4+KFwiTFVNRV9EUkFGVFNcIik7XG4gICAgY29uc3QgW19wYWdlcywgX3N0YXRpY0ZpbGVzXSA9IGF3YWl0IHRoaXMuc291cmNlLmJ1aWxkKFxuICAgICAgKF8sIHBhZ2UpID0+ICFwYWdlPy5kYXRhLmRyYWZ0IHx8IHNob3dEcmFmdHMgPT09IHRydWUsXG4gICAgICB0aGlzLnNjb3Blcy5nZXRGaWx0ZXIoZmlsZXMpLFxuICAgICk7XG5cbiAgICAvLyBCdWlsZCB0aGUgcGFnZXMgYW5kIHNhdmUgc3RhdGljIGZpbGVzIGludG8gc2l0ZS5maWxlc1xuICAgIHRoaXMuZmlsZXMuc3BsaWNlKDAsIHRoaXMuZmlsZXMubGVuZ3RoLCAuLi5fc3RhdGljRmlsZXMpO1xuXG4gICAgaWYgKGF3YWl0IHRoaXMuI2J1aWxkUGFnZXMoX3BhZ2VzKSA9PT0gZmFsc2UpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBTYXZlIHRoZSBwYWdlcyBhbmQgY29weSBzdGF0aWMgZmlsZXMgaW4gdGhlIGRlc3QgZm9sZGVyXG4gICAgY29uc3QgcGFnZXMgPSBhd2FpdCB0aGlzLndyaXRlci5zYXZlUGFnZXModGhpcy5wYWdlcyk7XG4gICAgY29uc3Qgc3RhdGljRmlsZXMgPSBhd2FpdCB0aGlzLndyaXRlci5jb3B5RmlsZXModGhpcy5maWxlcyk7XG5cbiAgICBhd2FpdCB0aGlzLmRpc3BhdGNoRXZlbnQoe1xuICAgICAgdHlwZTogXCJhZnRlclVwZGF0ZVwiLFxuICAgICAgZmlsZXMsXG4gICAgICBwYWdlcyxcbiAgICAgIHN0YXRpY0ZpbGVzLFxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEludGVybmFsIGZ1bmN0aW9uIHRvIHJlbmRlciBwYWdlc1xuICAgKiBUaGUgY29tbW9uIG9wZXJhdGlvbnMgb2YgYnVpbGQgYW5kIHVwZGF0ZVxuICAgKi9cbiAgYXN5bmMgI2J1aWxkUGFnZXMocGFnZXM6IFBhZ2VbXSk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIGlmIChhd2FpdCB0aGlzLmRpc3BhdGNoRXZlbnQoeyB0eXBlOiBcImJlZm9yZVJlbmRlclwiLCBwYWdlcyB9KSA9PT0gZmFsc2UpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgcGVyZm9ybWFuY2UubWFyayhcInN0YXJ0LXJlbmRlclwiKTtcblxuICAgIC8vIFJlbmRlciB0aGUgcGFnZXNcbiAgICB0aGlzLnBhZ2VzLnNwbGljZSgwKTtcbiAgICB0aGlzLm9uRGVtYW5kUGFnZXMuc3BsaWNlKDApO1xuICAgIGF3YWl0IHRoaXMucmVuZGVyZXIucmVuZGVyUGFnZXMocGFnZXMsIHRoaXMucGFnZXMsIHRoaXMub25EZW1hbmRQYWdlcyk7XG5cbiAgICAvLyBBZGQgZXh0cmEgY29kZSBnZW5lcmF0ZWQgYnkgdGhlIGNvbXBvbmVudHNcbiAgICBmb3IgKGNvbnN0IGV4dHJhIG9mIHRoaXMuc291cmNlLmdldENvbXBvbmVudHNFeHRyYUNvZGUoKSkge1xuICAgICAgY29uc3QgcGFnZSA9IGF3YWl0IHRoaXMuZ2V0T3JDcmVhdGVQYWdlKGV4dHJhLmRhdGEudXJsKTtcblxuICAgICAgaWYgKHBhZ2UuY29udGVudCkge1xuICAgICAgICBwYWdlLmNvbnRlbnQgKz0gYFxcbiR7ZXh0cmEuY29udGVudH1gO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcGFnZS5jb250ZW50ID0gZXh0cmEuY29udGVudDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBSZW1vdmUgZW1wdHkgcGFnZXMgYW5kIG9uZGVtYW5kIHBhZ2VzXG4gICAgdGhpcy5wYWdlcy5zcGxpY2UoXG4gICAgICAwLFxuICAgICAgdGhpcy5wYWdlcy5sZW5ndGgsXG4gICAgICAuLi50aGlzLnBhZ2VzLmZpbHRlcigocGFnZSkgPT4ge1xuICAgICAgICBpZiAocGFnZS5kYXRhLm9uZGVtYW5kKSB7XG4gICAgICAgICAgbG9nLmRlYnVnKFxuICAgICAgICAgICAgYFtMdW1lXSA8Y3lhbj5Ta2lwcGVkIHBhZ2U8L2N5YW4+ICR7cGFnZS5kYXRhLnVybH0gKHBhZ2UgaXMgYnVpbGQgb25seSBvbiBkZW1hbmQpYCxcbiAgICAgICAgICApO1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghcGFnZS5jb250ZW50KSB7XG4gICAgICAgICAgbG9nLndhcm4oXG4gICAgICAgICAgICBgW0x1bWVdIDxjeWFuPlNraXBwZWQgcGFnZTwvY3lhbj4gJHtwYWdlLmRhdGEudXJsfSAoZmlsZSBjb250ZW50IGlzIGVtcHR5KWAsXG4gICAgICAgICAgKTtcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH0pLFxuICAgICk7XG5cbiAgICBwZXJmb3JtYW5jZS5tYXJrKFwiZW5kLXJlbmRlclwiKTtcblxuICAgIGxvZy5kZWJ1ZyhcbiAgICAgIGBQYWdlcyByZW5kZXJlZCBpbiAke1xuICAgICAgICAocGVyZm9ybWFuY2UubWVhc3VyZShcImR1cmF0aW9uXCIsIFwic3RhcnQtcmVuZGVyXCIsIFwiZW5kLXJlbmRlclwiKVxuICAgICAgICAgIC5kdXJhdGlvbiAvXG4gICAgICAgICAgMTAwMCkudG9GaXhlZCgyKVxuICAgICAgfSBzZWNvbmRzYCxcbiAgICApO1xuXG4gICAgcGVyZm9ybWFuY2UubWFyayhcInN0YXJ0LXByb2Nlc3NcIik7XG4gICAgaWYgKFxuICAgICAgYXdhaXQgdGhpcy5ldmVudHMuZGlzcGF0Y2hFdmVudCh7XG4gICAgICAgIHR5cGU6IFwiYWZ0ZXJSZW5kZXJcIixcbiAgICAgICAgcGFnZXM6IHRoaXMucGFnZXMsXG4gICAgICB9KSA9PT0gZmFsc2VcbiAgICApIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICAvLyBSdW4gdGhlIHByb2Nlc3NvcnMgdG8gdGhlIHBhZ2VzXG4gICAgYXdhaXQgdGhpcy5wcm9jZXNzb3JzLnJ1bih0aGlzLnBhZ2VzKTtcbiAgICBwZXJmb3JtYW5jZS5tYXJrKFwiZW5kLXByb2Nlc3NcIik7XG5cbiAgICBsb2cuZGVidWcoXG4gICAgICBgUGFnZXMgcHJvY2Vzc2VkIGluICR7XG4gICAgICAgIChwZXJmb3JtYW5jZS5tZWFzdXJlKFwiZHVyYXRpb25cIiwgXCJzdGFydC1wcm9jZXNzXCIsIFwiZW5kLXByb2Nlc3NcIilcbiAgICAgICAgICAuZHVyYXRpb24gL1xuICAgICAgICAgIDEwMDApLnRvRml4ZWQoMilcbiAgICAgIH0gc2Vjb25kc2AsXG4gICAgKTtcblxuICAgIHJldHVybiBhd2FpdCB0aGlzLmRpc3BhdGNoRXZlbnQoeyB0eXBlOiBcImJlZm9yZVNhdmVcIiB9KTtcbiAgfVxuXG4gIC8qKiBSZW5kZXIgYSBzaW5nbGUgcGFnZSAodXNlZCBmb3Igb24gZGVtYW5kIHJlbmRlcmluZykgKi9cbiAgYXN5bmMgcmVuZGVyUGFnZShcbiAgICBmaWxlOiBzdHJpbmcsXG4gICAgZXh0cmFEYXRhPzogUmVjb3JkPHN0cmluZywgdW5rbm93bj4sXG4gICk6IFByb21pc2U8UGFnZSB8IHVuZGVmaW5lZD4ge1xuICAgIC8vIExvYWQgdGhlIHBhZ2VcbiAgICB0aGlzLmZzLmluaXQoKTtcblxuICAgIC8vIEdldCB0aGUgc2l0ZSBjb250ZW50XG4gICAgY29uc3QgW3BhZ2VzXSA9IGF3YWl0IHRoaXMuc291cmNlLmJ1aWxkKFxuICAgICAgKGVudHJ5KSA9PlxuICAgICAgICAoZW50cnkudHlwZSA9PT0gXCJkaXJlY3RvcnlcIiAmJiBmaWxlLnN0YXJ0c1dpdGgoZW50cnkucGF0aCkpIHx8XG4gICAgICAgIGVudHJ5LnBhdGggPT09IGZpbGUsXG4gICAgKTtcblxuICAgIGNvbnN0IHBhZ2UgPSBwYWdlc1swXTtcblxuICAgIGlmICghcGFnZSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIEFkZCBleHRyYSBkYXRhXG4gICAgaWYgKGV4dHJhRGF0YSkge1xuICAgICAgcGFnZS5kYXRhID0geyAuLi5wYWdlLmRhdGEsIC4uLmV4dHJhRGF0YSB9O1xuICAgIH1cblxuICAgIGF3YWl0IHRoaXMuZGlzcGF0Y2hFdmVudCh7IHR5cGU6IFwiYmVmb3JlUmVuZGVyT25EZW1hbmRcIiwgcGFnZSB9KTtcblxuICAgIC8vIFJlbmRlciB0aGUgcGFnZVxuICAgIGF3YWl0IHRoaXMucmVuZGVyZXIucmVuZGVyUGFnZU9uRGVtYW5kKHBhZ2UpO1xuXG4gICAgLy8gUnVuIHRoZSBwcm9jZXNzb3JzIHRvIHRoZSBwYWdlXG4gICAgYXdhaXQgdGhpcy5wcm9jZXNzb3JzLnJ1bihbcGFnZV0pO1xuICAgIHJldHVybiBwYWdlO1xuICB9XG5cbiAgLyoqIFJldHVybiB0aGUgVVJMIG9mIGEgcGF0aCAqL1xuICB1cmwocGF0aDogc3RyaW5nLCBhYnNvbHV0ZSA9IGZhbHNlKTogc3RyaW5nIHtcbiAgICBpZiAoXG4gICAgICBwYXRoLnN0YXJ0c1dpdGgoXCIuL1wiKSB8fCBwYXRoLnN0YXJ0c1dpdGgoXCIuLi9cIikgfHxcbiAgICAgIHBhdGguc3RhcnRzV2l0aChcIj9cIikgfHwgcGF0aC5zdGFydHNXaXRoKFwiI1wiKSB8fCBwYXRoLnN0YXJ0c1dpdGgoXCIvL1wiKVxuICAgICkge1xuICAgICAgcmV0dXJuIHBhdGg7XG4gICAgfVxuXG4gICAgLy8gSXQncyBhIHNvdXJjZSBmaWxlXG4gICAgaWYgKHBhdGguc3RhcnRzV2l0aChcIn4vXCIpKSB7XG4gICAgICBwYXRoID0gZGVjb2RlVVJJKHBhdGguc2xpY2UoMSkpO1xuXG4gICAgICAvLyBIYXMgYSBzZWFyY2ggcXVlcnlcbiAgICAgIGNvbnN0IG1hdGNoID0gcGF0aC5tYXRjaCgvXiguKilcXHMqXFwoKFteKV0rKVxcKSQvKTtcbiAgICAgIGNvbnN0IHNyY1BhdGggPSBtYXRjaCA/IG1hdGNoWzFdIDogcGF0aDtcbiAgICAgIGNvbnN0IHBhZ2VzID0gbWF0Y2hcbiAgICAgICAgPyB0aGlzLnNlYXJjaC5wYWdlcyhtYXRjaFsyXSkubWFwPFBhZ2U+KChkYXRhKSA9PiBkYXRhLnBhZ2UhKVxuICAgICAgICA6IHRoaXMucGFnZXM7XG5cbiAgICAgIC8vIEl0J3MgYSBwYWdlXG4gICAgICBjb25zdCBwYWdlID0gcGFnZXMuZmluZCgocGFnZSkgPT5cbiAgICAgICAgcGFnZS5zcmMucGF0aCArIHBhZ2Uuc3JjLmV4dCA9PT0gc3JjUGF0aFxuICAgICAgKTtcblxuICAgICAgaWYgKHBhZ2UpIHtcbiAgICAgICAgcGF0aCA9IHBhZ2UuZGF0YS51cmw7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBJdCdzIGEgc3RhdGljIGZpbGVcbiAgICAgICAgY29uc3QgZmlsZSA9IHRoaXMuZmlsZXMuZmluZCgoZmlsZSkgPT4gZmlsZS5lbnRyeS5wYXRoID09PSBwYXRoKTtcblxuICAgICAgICBpZiAoZmlsZSkge1xuICAgICAgICAgIHBhdGggPSBmaWxlLm91dHB1dFBhdGg7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBTb3VyY2UgZmlsZSBub3QgZm91bmQ6ICR7cGF0aH1gKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAvLyBBYnNvbHV0ZSBVUkxzIGFyZSByZXR1cm5lZCBhcyBpc1xuICAgICAgdHJ5IHtcbiAgICAgICAgcmV0dXJuIG5ldyBVUkwocGF0aCkuaHJlZjtcbiAgICAgIH0gY2F0Y2gge1xuICAgICAgICAvLyBJZ25vcmUgZXJyb3JcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoIXBhdGguc3RhcnRzV2l0aCh0aGlzLm9wdGlvbnMubG9jYXRpb24ucGF0aG5hbWUpKSB7XG4gICAgICBwYXRoID0gcG9zaXguam9pbih0aGlzLm9wdGlvbnMubG9jYXRpb24ucGF0aG5hbWUsIHBhdGgpO1xuICAgIH1cblxuICAgIHJldHVybiBhYnNvbHV0ZSA/IHRoaXMub3B0aW9ucy5sb2NhdGlvbi5vcmlnaW4gKyBwYXRoIDogcGF0aDtcbiAgfVxuXG4gIGFzeW5jIGdldE9yQ3JlYXRlUGFnZShcbiAgICB1cmw6IHN0cmluZyxcbiAgICBsb2FkZXI6IExvYWRlciA9IHRleHRMb2FkZXIsXG4gICk6IFByb21pc2U8UGFnZT4ge1xuICAgIHVybCA9IG5vcm1hbGl6ZVBhdGgodXJsKTtcblxuICAgIC8vIEl0J3MgYSBwYWdlXG4gICAgY29uc3QgcGFnZSA9IHRoaXMucGFnZXMuZmluZCgocGFnZSkgPT4gcGFnZS5kYXRhLnVybCA9PT0gdXJsKTtcblxuICAgIGlmIChwYWdlKSB7XG4gICAgICByZXR1cm4gcGFnZTtcbiAgICB9XG5cbiAgICAvLyBJdCdzIGEgc3RhdGljIGZpbGVcbiAgICBjb25zdCBpbmRleCA9IHRoaXMuZmlsZXMuZmluZEluZGV4KChmKSA9PiBmLm91dHB1dFBhdGggPT09IHVybCk7XG5cbiAgICBpZiAoaW5kZXggPiAtMSkge1xuICAgICAgY29uc3QgeyBlbnRyeSB9ID0gdGhpcy5maWxlcy5zcGxpY2UoaW5kZXgsIDEpWzBdO1xuICAgICAgY29uc3QgZGF0YSA9IGF3YWl0IGVudHJ5LmdldENvbnRlbnQobG9hZGVyKSBhcyBEYXRhO1xuICAgICAgY29uc3QgcGFnZSA9IFBhZ2UuY3JlYXRlKHsgLi4uZGF0YSwgdXJsIH0pO1xuICAgICAgdGhpcy5wYWdlcy5wdXNoKHBhZ2UpO1xuICAgICAgcmV0dXJuIHBhZ2U7XG4gICAgfVxuXG4gICAgLy8gUmVhZCB0aGUgc291cmNlIGZpbGVzIGRpcmVjdGx5XG4gICAgY29uc3QgZW50cnkgPSB0aGlzLmZzLmVudHJpZXMuZ2V0KHVybCk7XG4gICAgaWYgKGVudHJ5KSB7XG4gICAgICBjb25zdCBkYXRhID0gYXdhaXQgZW50cnkuZ2V0Q29udGVudChsb2FkZXIpIGFzIERhdGE7XG4gICAgICBjb25zdCBwYWdlID0gUGFnZS5jcmVhdGUoeyAuLi5kYXRhLCB1cmwgfSk7XG4gICAgICB0aGlzLnBhZ2VzLnB1c2gocGFnZSk7XG4gICAgICByZXR1cm4gcGFnZTtcbiAgICB9XG5cbiAgICBjb25zdCBuZXdQYWdlID0gUGFnZS5jcmVhdGUoeyB1cmwgfSk7XG4gICAgdGhpcy5wYWdlcy5wdXNoKG5ld1BhZ2UpO1xuICAgIHJldHVybiBuZXdQYWdlO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCB0aGUgY29udGVudCBvZiBhIGZpbGUuXG4gICAqIFJlc29sdmUgdGhlIHBhdGggaWYgaXQncyBuZWVkZWQuXG4gICAqL1xuICBhc3luYyBnZXRDb250ZW50KFxuICAgIGZpbGU6IHN0cmluZyxcbiAgICBsb2FkZXI6IExvYWRlcixcbiAgKTogUHJvbWlzZTxzdHJpbmcgfCBVaW50OEFycmF5IHwgdW5kZWZpbmVkPiB7XG4gICAgZmlsZSA9IG5vcm1hbGl6ZVBhdGgoZmlsZSk7XG4gICAgY29uc3QgYmFzZVBhdGggPSB0aGlzLnNyYygpO1xuXG4gICAgaWYgKGZpbGUuc3RhcnRzV2l0aChiYXNlUGF0aCkpIHtcbiAgICAgIGZpbGUgPSBub3JtYWxpemVQYXRoKGZpbGUuc2xpY2UoYmFzZVBhdGgubGVuZ3RoKSk7XG4gICAgfVxuXG4gICAgZmlsZSA9IGRlY29kZVVSSShmaWxlKTtcbiAgICBjb25zdCB1cmwgPSBlbmNvZGVVUkkoZmlsZSk7XG5cbiAgICAvLyBJdCdzIGEgcGFnZVxuICAgIGNvbnN0IHBhZ2UgPSB0aGlzLnBhZ2VzLmZpbmQoKHBhZ2UpID0+IHBhZ2UuZGF0YS51cmwgPT09IHVybCk7XG5cbiAgICBpZiAocGFnZSkge1xuICAgICAgcmV0dXJuIHBhZ2UuY29udGVudDtcbiAgICB9XG5cbiAgICAvLyBJdCdzIGEgc3RhdGljIGZpbGVcbiAgICBjb25zdCBzdGF0aWNGaWxlID0gdGhpcy5maWxlcy5maW5kKChmKSA9PiBmLm91dHB1dFBhdGggPT09IGZpbGUpO1xuXG4gICAgaWYgKHN0YXRpY0ZpbGUpIHtcbiAgICAgIHJldHVybiAoYXdhaXQgc3RhdGljRmlsZS5lbnRyeS5nZXRDb250ZW50KGxvYWRlcikpLmNvbnRlbnQgYXNcbiAgICAgICAgfCBzdHJpbmdcbiAgICAgICAgfCBVaW50OEFycmF5O1xuICAgIH1cblxuICAgIC8vIFJlYWQgdGhlIHNvdXJjZSBmaWxlcyBkaXJlY3RseVxuICAgIHRyeSB7XG4gICAgICBjb25zdCBlbnRyeSA9IHRoaXMuZnMuZW50cmllcy5nZXQoZmlsZSk7XG4gICAgICBpZiAoZW50cnkpIHtcbiAgICAgICAgcmV0dXJuIChhd2FpdCBlbnRyeS5nZXRDb250ZW50KGxvYWRlcikpLmNvbnRlbnQgYXMgc3RyaW5nIHwgVWludDhBcnJheTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIHtcbiAgICAgIC8vIElnbm9yZSBlcnJvclxuICAgIH1cbiAgfVxuXG4gIC8qKiBSZXR1cm5zIGEgRmlsZSBzeXN0ZW0gd2F0Y2hlciBvZiB0aGUgc2l0ZSAqL1xuICBnZXRXYXRjaGVyKCk6IFdhdGNoZXIge1xuICAgIHJldHVybiBuZXcgRlNXYXRjaGVyKHtcbiAgICAgIHJvb3Q6IHRoaXMuc3JjKCksXG4gICAgICBpZ25vcmU6IHRoaXMub3B0aW9ucy53YXRjaGVyLmlnbm9yZSxcbiAgICAgIGRlYm91bmNlOiB0aGlzLm9wdGlvbnMud2F0Y2hlci5kZWJvdW5jZSxcbiAgICB9KTtcbiAgfVxufVxuXG4vKiogVGhlIG9wdGlvbnMgZm9yIHRoZSByZXNvbHZlIGZ1bmN0aW9uICovXG5leHBvcnQgaW50ZXJmYWNlIFJlc29sdmVPcHRpb25zIHtcbiAgLyoqIFdoZXRoZXIgc2VhcmNoIGluIHRoZSBpbmNsdWRlcyBmb2xkZXIgb3Igbm90ICovXG4gIGluY2x1ZGVzPzogYm9vbGVhbjtcblxuICAvKiogRGVmYXVsdCBsb2FkZXIgKi9cbiAgbG9hZGVyPzogTG9hZGVyO1xufVxuXG4vKiogVGhlIG9wdGlvbnMgdG8gY29uZmlndXJlIHRoZSBzaXRlIGJ1aWxkICovXG5leHBvcnQgaW50ZXJmYWNlIFNpdGVPcHRpb25zIHtcbiAgLyoqIFRoZSBwYXRoIG9mIHRoZSBjdXJyZW50IHdvcmtpbmcgZGlyZWN0b3J5ICovXG4gIGN3ZDogc3RyaW5nO1xuXG4gIC8qKiBUaGUgcGF0aCBvZiB0aGUgc2l0ZSBzb3VyY2UgKi9cbiAgc3JjOiBzdHJpbmc7XG5cbiAgLyoqIFRoZSBwYXRoIG9mIHRoZSBidWlsdCBkZXN0aW5hdGlvbiAqL1xuICBkZXN0OiBzdHJpbmc7XG5cbiAgLyoqIFdoZXRoZXIgdGhlIGVtcHR5IGZvbGRlciBzaG91bGQgYmUgZW1wdGllZCBiZWZvcmUgdGhlIGJ1aWxkICovXG4gIGVtcHR5RGVzdD86IGJvb2xlYW47XG5cbiAgLyoqIFdoZXRoZXIgdGhlIHNpdGUgaXMgaW4gcHJldmlldyBtb2RlICovXG4gIHByZXZpZXc/OiBib29sZWFuO1xuXG4gIC8qKiBUaGUgZGVmYXVsdCBpbmNsdWRlcyBwYXRoICovXG4gIGluY2x1ZGVzOiBzdHJpbmc7XG5cbiAgLyoqIFRoZSBzaXRlIGxvY2F0aW9uICh1c2VkIHRvIGdlbmVyYXRlIGZpbmFsIHVybHMpICovXG4gIGxvY2F0aW9uOiBVUkw7XG5cbiAgLyoqIFNldCB0cnVlIHRvIGdlbmVyYXRlIHByZXR0eSB1cmxzIChgL2Fib3V0LW1lL2ApICovXG4gIHByZXR0eVVybHM6IGJvb2xlYW47XG5cbiAgLyoqIFRoZSBsb2NhbCBzZXJ2ZXIgb3B0aW9ucyAqL1xuICBzZXJ2ZXI6IFNlcnZlck9wdGlvbnM7XG5cbiAgLyoqIFRoZSBsb2NhbCB3YXRjaGVyIG9wdGlvbnMgKi9cbiAgd2F0Y2hlcjogV2F0Y2hlck9wdGlvbnM7XG5cbiAgLyoqIFRoZSBjb21wb25lbnRzIG9wdGlvbnMgKi9cbiAgY29tcG9uZW50czogQ29tcG9uZW50c09wdGlvbnM7XG59XG5cbi8qKiBUaGUgb3B0aW9ucyB0byBjb25maWd1cmUgdGhlIGxvY2FsIHNlcnZlciAqL1xuZXhwb3J0IGludGVyZmFjZSBTZXJ2ZXJPcHRpb25zIHtcbiAgLyoqXG4gICAqIFRoZSByb290IGRpcmVjdG9yeSB0byBzZXJ2ZS5cbiAgICogQnkgZGVmYXVsdCBpcyB0aGUgc2FtZSBhcyB0aGUgc2l0ZSBkZXN0IGZvbGRlci5cbiAgICovXG4gIHJvb3Q/OiBzdHJpbmc7XG5cbiAgLyoqIFRoZSBwb3J0IHRvIGxpc3RlbiBvbiAqL1xuICBwb3J0OiBudW1iZXI7XG5cbiAgLyoqIFRvIG9wZW4gdGhlIHNlcnZlciBpbiBhIGJyb3dzZXIgKi9cbiAgb3BlbjogYm9vbGVhbjtcblxuICAvKiogVGhlIGZpbGUgdG8gc2VydmUgb24gNDA0IGVycm9yICovXG4gIHBhZ2U0MDQ6IHN0cmluZztcblxuICAvKiogT3B0aW9uYWwgZm9yIHRoZSBzZXJ2ZXIgKi9cbiAgbWlkZGxld2FyZXM6IE1pZGRsZXdhcmVbXTtcbn1cblxuLyoqIFRoZSBvcHRpb25zIHRvIGNvbmZpZ3VyZSB0aGUgbG9jYWwgd2F0Y2hlciAqL1xuZXhwb3J0IGludGVyZmFjZSBXYXRjaGVyT3B0aW9ucyB7XG4gIC8qKiBQYXRocyB0byBpZ25vcmUgYnkgdGhlIHdhdGNoZXIgKi9cbiAgaWdub3JlOiAoc3RyaW5nIHwgKChwYXRoOiBzdHJpbmcpID0+IGJvb2xlYW4pKVtdO1xuXG4gIC8qKiBUaGUgaW50ZXJ2YWwgaW4gbWlsbGlzZWNvbmRzIHRvIGNoZWNrIGZvciBjaGFuZ2VzICovXG4gIGRlYm91bmNlOiBudW1iZXI7XG59XG5cbi8qKiBUaGUgb3B0aW9ucyB0byBjb25maWd1cmUgdGhlIGNvbXBvbmVudHMgKi9cbmV4cG9ydCBpbnRlcmZhY2UgQ29tcG9uZW50c09wdGlvbnMge1xuICAvKiogVGhlIHZhcmlhYmxlIG5hbWUgdXNlZCB0byBhY2Nlc3MgdG8gdGhlIGNvbXBvbmVudHMgKi9cbiAgdmFyaWFibGU6IHN0cmluZztcblxuICAvKiogVGhlIG5hbWUgb2YgdGhlIGZpbGUgdG8gc2F2ZSB0aGUgY29tcG9uZW50cyBjc3MgY29kZSAqL1xuICBjc3NGaWxlOiBzdHJpbmc7XG5cbiAgLyoqIFRoZSBuYW1lIG9mIHRoZSBmaWxlIHRvIHNhdmUgdGhlIGNvbXBvbmVudHMgamF2YXNjcmlwdCBjb2RlICovXG4gIGpzRmlsZTogc3RyaW5nO1xufVxuXG5leHBvcnQgdHlwZSBTaXRlRXZlbnRNYXAgPSB7XG4gIC8vIGRlbm8tbGludC1pZ25vcmUgYmFuLXR5cGVzXG4gIGFmdGVyTG9hZDoge307XG4gIGJlZm9yZUJ1aWxkOiB7XG4gICAgLyoqIHRoZSBsaXN0IG9mIHBhZ2VzIHRoYXQgaGF2ZSBiZWVuIHNhdmVkICovXG4gICAgcGFnZXM6IFBhZ2VbXTtcbiAgfTtcbiAgYWZ0ZXJCdWlsZDoge1xuICAgIC8qKiB0aGUgbGlzdCBvZiBwYWdlcyB0aGF0IGhhdmUgYmVlbiBzYXZlZCAqL1xuICAgIHBhZ2VzOiBQYWdlW107XG4gICAgLyoqIGNvbnRhaW5zIHRoZSBsaXN0IG9mIHN0YXRpYyBmaWxlcyB0aGF0IGhhdmUgYmVlbiBjb3BpZWQgKi9cbiAgICBzdGF0aWNGaWxlczogU3RhdGljRmlsZVtdO1xuICB9O1xuICBiZWZvcmVVcGRhdGU6IHtcbiAgICAvKiogdGhlIGZpbGVzIHRoYXQgd2VyZSBjaGFuZ2VkICovXG4gICAgZmlsZXM6IFNldDxzdHJpbmc+O1xuICB9O1xuICBhZnRlclVwZGF0ZToge1xuICAgIC8qKiB0aGUgZmlsZXMgdGhhdCB3ZXJlIGNoYW5nZWQgKi9cbiAgICBmaWxlczogU2V0PHN0cmluZz47XG4gICAgLyoqIHRoZSBsaXN0IG9mIHBhZ2VzIHRoYXQgaGF2ZSBiZWVuIHNhdmVkICovXG4gICAgcGFnZXM6IFBhZ2VbXTtcbiAgICAvKiogY29udGFpbnMgdGhlIGxpc3Qgb2Ygc3RhdGljIGZpbGVzIHRoYXQgaGF2ZSBiZWVuIGNvcGllZCAqL1xuICAgIHN0YXRpY0ZpbGVzOiBTdGF0aWNGaWxlW107XG4gIH07XG4gIGJlZm9yZVJlbmRlcjoge1xuICAgIC8qKiB0aGUgbGlzdCBvZiBwYWdlcyB0aGF0IGFyZSBhYm91dCB0byByZW5kZXIgKi9cbiAgICBwYWdlczogUGFnZVtdO1xuICB9O1xuICBhZnRlclJlbmRlcjoge1xuICAgIC8qKiB0aGUgbGlzdCBvZiBwYWdlcyB0aGF0IGhhdmUgYmVlbiByZW5kZXJlZCAqL1xuICAgIHBhZ2VzOiBQYWdlW107XG4gIH07XG4gIGJlZm9yZVJlbmRlck9uRGVtYW5kOiB7XG4gICAgLyoqIHRoZSBwYWdlIHRoYXQgd2lsbCBiZSByZW5kZXJlZCAqL1xuICAgIHBhZ2U6IFBhZ2U7XG4gIH07XG4gIC8vIGRlbm8tbGludC1pZ25vcmUgYmFuLXR5cGVzXG4gIGJlZm9yZVNhdmU6IHt9O1xuICAvLyBkZW5vLWxpbnQtaWdub3JlIGJhbi10eXBlc1xuICBhZnRlclN0YXJ0U2VydmVyOiB7fTtcbn07XG5cbmV4cG9ydCBpbnRlcmZhY2UgTG9hZFBhZ2VzT3B0aW9ucyB7XG4gIGxvYWRlcj86IExvYWRlcjtcbiAgZW5naW5lPzogRW5naW5lIHwgRW5naW5lW107XG4gIHBhZ2VTdWJFeHRlbnNpb24/OiBzdHJpbmc7XG59XG5cbi8qKiBDdXN0b20gZXZlbnRzIGZvciBzaXRlIGJ1aWxkICovXG5leHBvcnQgdHlwZSBTaXRlRXZlbnQ8VCBleHRlbmRzIFNpdGVFdmVudFR5cGUgPSBTaXRlRXZlbnRUeXBlPiA9XG4gICYgRXZlbnRcbiAgJiBTaXRlRXZlbnRNYXBbVF1cbiAgJiB7IHR5cGU6IFQgfTtcblxuLyoqIFRoZSBhdmFpbGFibGUgZXZlbnQgdHlwZXMgKi9cbmV4cG9ydCB0eXBlIFNpdGVFdmVudFR5cGUgPSBrZXlvZiBTaXRlRXZlbnRNYXA7XG5cbi8qKiBBIGdlbmVyaWMgTHVtZSBwbHVnaW4gKi9cbmV4cG9ydCB0eXBlIFBsdWdpbiA9IChzaXRlOiBTaXRlKSA9PiB2b2lkO1xuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFNBQVMsSUFBSSxFQUFFLEtBQUssUUFBUSxrQkFBa0I7QUFDOUMsU0FBUyxLQUFLLFFBQVEsb0JBQW9CO0FBQzFDLFNBQVMsYUFBYSxRQUFRLGtCQUFrQjtBQUNoRCxTQUFTLEdBQUcsUUFBUSxpQkFBaUI7QUFDckMsU0FBUyxHQUFHLFFBQVEsaUJBQWlCO0FBRXJDLE9BQU8sUUFBUSxVQUFVO0FBQ3pCLE9BQU8scUJBQXFCLHdCQUF3QjtBQUNwRCxPQUFPLGdCQUFnQixtQkFBbUI7QUFDMUMsT0FBTyxZQUFZLGNBQWM7QUFDakMsT0FBTyxZQUFZLGNBQWM7QUFDakMsT0FBTyxnQkFBZ0Isa0JBQWtCO0FBQ3pDLE9BQU8sY0FBYyxnQkFBZ0I7QUFDckMs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