import { engine, FileLoader } from "../deps/vento.ts";
import loader from "../core/loaders/text.ts";
import { merge } from "../core/utils/object.ts";
import { normalizePath } from "../core/utils/path.ts";
// Default options
export const defaults = {
  extensions: [
    ".vento",
    ".vto"
  ],
  options: {
    dataVarname: "it",
    useWith: true,
    autoescape: false
  }
};
class LumeLoader extends FileLoader {
  fs;
  constructor(includes, fs){
    super(includes);
    this.fs = fs;
  }
  async load(file) {
    const entry = this.fs.entries.get(normalizePath(file));
    if (!entry) {
      throw new Error(`File not found: ${file}`);
    }
    const data = await entry.getContent(loader);
    return {
      source: data.content,
      data: data
    };
  }
}
/** Template engine to render Vento files */ export class VentoEngine {
  engine;
  includes;
  constructor(engine, includes){
    this.engine = engine;
    this.includes = includes;
  }
  deleteCache(file) {
    this.engine.cache.delete(file);
  }
  async render(content, data, filename) {
    const result = await this.engine.runString(content, data, filename);
    return result.content;
  }
  renderComponent(content, data) {
    const result = this.engine.runStringSync(content, data);
    return result.content;
  }
  addHelper(name, fn, options) {
    if (options.async) {
      this.engine.filters[name] = async function(...args) {
        return await fn.apply({
          data: this.data
        }, args);
      };
    } else {
      this.engine.filters[name] = function(...args) {
        return fn.apply({
          data: this.data
        }, args);
      };
    }
  }
}
/** Register the plugin to support Vento files */ export default function(userOptions) {
  return (site)=>{
    const options = merge({
      ...defaults,
      includes: site.options.includes
    }, userOptions);
    const vento = engine({
      includes: new LumeLoader(normalizePath(options.includes), site.fs),
      ...options.options
    });
    vento.tags.push(compTag);
    options.plugins?.forEach((plugin)=>vento.use(plugin));
    site.hooks.addVentoPlugin = (plugin)=>{
      vento.use(plugin);
    };
    site.hooks.vento = (callback)=>callback(vento);
    const ventoEngine = new VentoEngine(vento, options.includes);
    // Ignore includes folder
    if (options.includes) {
      site.ignore(options.includes);
    }
    // Load the pages and register the engine
    site.loadPages(options.extensions, {
      loader,
      engine: ventoEngine,
      pageSubExtension: options.pageSubExtension
    });
    site.filter("vto", filter, true);
    async function filter(string, data) {
      const result = await vento.runString(string, {
        ...site.scopedData.get("/"),
        ...data
      });
      return result.content;
    }
  };
}
/** Vento tag to render a component */ function compTag(env, code, output, tokens) {
  if (!code.startsWith("comp ")) {
    return;
  }
  const match = code.match(/^comp\s+([\w.]+)(?:\s+(\{.*\}))?(?:\s+(\/))?$/);
  if (!match) {
    throw new Error(`Invalid component tag: ${code}`);
  }
  const [_, comp, args, closed] = match;
  if (closed) {
    return `${output} += await comp.${comp}(${args || ""});`;
  }
  const compiled = [];
  const tmpOutput = `__content_${tokens.length}`;
  compiled.push("{");
  compiled.push(`let ${tmpOutput} = ""`);
  compiled.push(...env.compileTokens(tokens, tmpOutput, [
    "/comp"
  ]));
  if (tokens.length && (tokens[0][0] !== "tag" || tokens[0][1] !== "/comp")) {
    throw new Error(`Missing closing tag for component tag: ${code}`);
  }
  tokens.shift();
  compiled.push(`${output} += await comp.${comp}({...${args || "{}"}, content: ${tmpOutput}});`);
  compiled.push("}");
  return compiled.join("\n");
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvbHVtZUB2Mi4yLjAvcGx1Z2lucy92ZW50by50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBlbmdpbmUsIEZpbGVMb2FkZXIgfSBmcm9tIFwiLi4vZGVwcy92ZW50by50c1wiO1xuaW1wb3J0IGxvYWRlciBmcm9tIFwiLi4vY29yZS9sb2FkZXJzL3RleHQudHNcIjtcbmltcG9ydCB7IG1lcmdlIH0gZnJvbSBcIi4uL2NvcmUvdXRpbHMvb2JqZWN0LnRzXCI7XG5pbXBvcnQgeyBub3JtYWxpemVQYXRoIH0gZnJvbSBcIi4uL2NvcmUvdXRpbHMvcGF0aC50c1wiO1xuXG5pbXBvcnQgdHlwZSBTaXRlIGZyb20gXCIuLi9jb3JlL3NpdGUudHNcIjtcbmltcG9ydCB0eXBlIHsgRGF0YSB9IGZyb20gXCIuLi9jb3JlL2ZpbGUudHNcIjtcbmltcG9ydCB0eXBlIHsgRW5naW5lLCBIZWxwZXIsIEhlbHBlck9wdGlvbnMgfSBmcm9tIFwiLi4vY29yZS9yZW5kZXJlci50c1wiO1xuaW1wb3J0IHR5cGUgRlMgZnJvbSBcIi4uL2NvcmUvZnMudHNcIjtcbmltcG9ydCB0eXBlIHsgRW52aXJvbm1lbnQsIFBsdWdpbiwgVG9rZW4gfSBmcm9tIFwiLi4vZGVwcy92ZW50by50c1wiO1xuXG5leHBvcnQgaW50ZXJmYWNlIE9wdGlvbnMge1xuICAvKiogVGhlIGxpc3Qgb2YgZXh0ZW5zaW9ucyB0aGlzIHBsdWdpbiBhcHBsaWVzIHRvICovXG4gIGV4dGVuc2lvbnM/OiBzdHJpbmdbXTtcblxuICAvKiogT3B0aW9uYWwgc3ViLWV4dGVuc2lvbiBmb3IgcGFnZSBmaWxlcyAqL1xuICBwYWdlU3ViRXh0ZW5zaW9uPzogc3RyaW5nO1xuXG4gIC8qKlxuICAgKiBDdXN0b20gaW5jbHVkZXMgcGF0aFxuICAgKiBAZGVmYXVsdCBgc2l0ZS5vcHRpb25zLmluY2x1ZGVzYFxuICAgKi9cbiAgaW5jbHVkZXM/OiBzdHJpbmc7XG5cbiAgLyoqXG4gICAqIFBsdWdpbnMgdG8gdXNlIGJ5IHZlbnRvXG4gICAqL1xuICBwbHVnaW5zPzogUGx1Z2luW107XG5cbiAgLyoqXG4gICAqIFRoZSBvcHRpb25zIGZvciB0aGUgVmVudG8gZW5naW5lXG4gICAqIEBzZWUgaHR0cHM6Ly92ZW50by5qcy5vcmcvY29uZmlndXJhdGlvbi9cbiAgICovXG4gIG9wdGlvbnM6IHtcbiAgICAvKiogVGhlIG5hbWUgb2YgdGhlIHZhcmlhYmxlIHRvIGFjY2VzcyB0byB0aGUgZGF0YSBpbiB0aGUgdGVtcGxhdGVzICovXG4gICAgZGF0YVZhcm5hbWU/OiBzdHJpbmc7XG5cbiAgICAvKiogTWFrZSBkYXRhIGF2YWlsYWJsZSBvbiB0aGUgZ2xvYmFsIG9iamVjdCBpbnN0ZWFkIG9mIHZhck5hbWUgKi9cbiAgICB1c2VXaXRoPzogYm9vbGVhbjtcblxuICAgIC8qKiBXaGV0aGVyIG9yIG5vdCB0byBhdXRvbWF0aWNhbGx5IFhNTC1lc2NhcGUgaW50ZXJwb2xhdGlvbnMuICovXG4gICAgYXV0b2VzY2FwZT86IGJvb2xlYW47XG4gIH07XG59XG5cbi8vIERlZmF1bHQgb3B0aW9uc1xuZXhwb3J0IGNvbnN0IGRlZmF1bHRzOiBPcHRpb25zID0ge1xuICBleHRlbnNpb25zOiBbXCIudmVudG9cIiwgXCIudnRvXCJdLFxuICBvcHRpb25zOiB7XG4gICAgZGF0YVZhcm5hbWU6IFwiaXRcIixcbiAgICB1c2VXaXRoOiB0cnVlLFxuICAgIGF1dG9lc2NhcGU6IGZhbHNlLFxuICB9LFxufTtcblxuY2xhc3MgTHVtZUxvYWRlciBleHRlbmRzIEZpbGVMb2FkZXIge1xuICBmczogRlM7XG5cbiAgY29uc3RydWN0b3IoaW5jbHVkZXM6IHN0cmluZywgZnM6IEZTKSB7XG4gICAgc3VwZXIoaW5jbHVkZXMpO1xuICAgIHRoaXMuZnMgPSBmcztcbiAgfVxuXG4gIGFzeW5jIGxvYWQoZmlsZTogc3RyaW5nKSB7XG4gICAgY29uc3QgZW50cnkgPSB0aGlzLmZzLmVudHJpZXMuZ2V0KG5vcm1hbGl6ZVBhdGgoZmlsZSkpO1xuXG4gICAgaWYgKCFlbnRyeSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBGaWxlIG5vdCBmb3VuZDogJHtmaWxlfWApO1xuICAgIH1cblxuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCBlbnRyeS5nZXRDb250ZW50KGxvYWRlcik7XG5cbiAgICByZXR1cm4ge1xuICAgICAgc291cmNlOiBkYXRhLmNvbnRlbnQgYXMgc3RyaW5nLFxuICAgICAgZGF0YTogZGF0YSxcbiAgICB9O1xuICB9XG59XG5cbi8qKiBUZW1wbGF0ZSBlbmdpbmUgdG8gcmVuZGVyIFZlbnRvIGZpbGVzICovXG5leHBvcnQgY2xhc3MgVmVudG9FbmdpbmUgaW1wbGVtZW50cyBFbmdpbmUge1xuICBlbmdpbmU6IEVudmlyb25tZW50O1xuICBpbmNsdWRlczogc3RyaW5nO1xuXG4gIGNvbnN0cnVjdG9yKGVuZ2luZTogRW52aXJvbm1lbnQsIGluY2x1ZGVzOiBzdHJpbmcpIHtcbiAgICB0aGlzLmVuZ2luZSA9IGVuZ2luZTtcbiAgICB0aGlzLmluY2x1ZGVzID0gaW5jbHVkZXM7XG4gIH1cblxuICBkZWxldGVDYWNoZShmaWxlOiBzdHJpbmcpIHtcbiAgICB0aGlzLmVuZ2luZS5jYWNoZS5kZWxldGUoZmlsZSk7XG4gIH1cblxuICBhc3luYyByZW5kZXIoXG4gICAgY29udGVudDogc3RyaW5nLFxuICAgIGRhdGE/OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPixcbiAgICBmaWxlbmFtZT86IHN0cmluZyxcbiAgKSB7XG4gICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5lbmdpbmUucnVuU3RyaW5nKGNvbnRlbnQsIGRhdGEsIGZpbGVuYW1lKTtcbiAgICByZXR1cm4gcmVzdWx0LmNvbnRlbnQ7XG4gIH1cblxuICByZW5kZXJDb21wb25lbnQoY29udGVudDogc3RyaW5nLCBkYXRhPzogUmVjb3JkPHN0cmluZywgdW5rbm93bj4pOiBzdHJpbmcge1xuICAgIGNvbnN0IHJlc3VsdCA9IHRoaXMuZW5naW5lLnJ1blN0cmluZ1N5bmMoY29udGVudCwgZGF0YSk7XG4gICAgcmV0dXJuIHJlc3VsdC5jb250ZW50O1xuICB9XG5cbiAgYWRkSGVscGVyKG5hbWU6IHN0cmluZywgZm46IEhlbHBlciwgb3B0aW9uczogSGVscGVyT3B0aW9ucykge1xuICAgIGlmIChvcHRpb25zLmFzeW5jKSB7XG4gICAgICB0aGlzLmVuZ2luZS5maWx0ZXJzW25hbWVdID0gYXN5bmMgZnVuY3Rpb24gKC4uLmFyZ3M6IHVua25vd25bXSkge1xuICAgICAgICByZXR1cm4gYXdhaXQgZm4uYXBwbHkoeyBkYXRhOiB0aGlzLmRhdGEgYXMgRGF0YSB9LCBhcmdzKTtcbiAgICAgIH07XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuZW5naW5lLmZpbHRlcnNbbmFtZV0gPSBmdW5jdGlvbiAoLi4uYXJnczogdW5rbm93bltdKSB7XG4gICAgICAgIHJldHVybiBmbi5hcHBseSh7IGRhdGE6IHRoaXMuZGF0YSBhcyBEYXRhIH0sIGFyZ3MpO1xuICAgICAgfTtcbiAgICB9XG4gIH1cbn1cblxuLyoqIFJlZ2lzdGVyIHRoZSBwbHVnaW4gdG8gc3VwcG9ydCBWZW50byBmaWxlcyAqL1xuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gKHVzZXJPcHRpb25zPzogT3B0aW9ucykge1xuICByZXR1cm4gKHNpdGU6IFNpdGUpID0+IHtcbiAgICBjb25zdCBvcHRpb25zID0gbWVyZ2UoXG4gICAgICB7IC4uLmRlZmF1bHRzLCBpbmNsdWRlczogc2l0ZS5vcHRpb25zLmluY2x1ZGVzIH0sXG4gICAgICB1c2VyT3B0aW9ucyxcbiAgICApO1xuXG4gICAgY29uc3QgdmVudG8gPSBlbmdpbmUoe1xuICAgICAgaW5jbHVkZXM6IG5ldyBMdW1lTG9hZGVyKG5vcm1hbGl6ZVBhdGgob3B0aW9ucy5pbmNsdWRlcyksIHNpdGUuZnMpLFxuICAgICAgLi4ub3B0aW9ucy5vcHRpb25zLFxuICAgIH0pO1xuXG4gICAgdmVudG8udGFncy5wdXNoKGNvbXBUYWcpO1xuICAgIG9wdGlvbnMucGx1Z2lucz8uZm9yRWFjaCgocGx1Z2luKSA9PiB2ZW50by51c2UocGx1Z2luKSk7XG5cbiAgICBzaXRlLmhvb2tzLmFkZFZlbnRvUGx1Z2luID0gKHBsdWdpbjogUGx1Z2luKSA9PiB7XG4gICAgICB2ZW50by51c2UocGx1Z2luKTtcbiAgICB9O1xuICAgIHNpdGUuaG9va3MudmVudG8gPSAoY2FsbGJhY2spID0+IGNhbGxiYWNrKHZlbnRvKTtcblxuICAgIGNvbnN0IHZlbnRvRW5naW5lID0gbmV3IFZlbnRvRW5naW5lKHZlbnRvLCBvcHRpb25zLmluY2x1ZGVzKTtcblxuICAgIC8vIElnbm9yZSBpbmNsdWRlcyBmb2xkZXJcbiAgICBpZiAob3B0aW9ucy5pbmNsdWRlcykge1xuICAgICAgc2l0ZS5pZ25vcmUob3B0aW9ucy5pbmNsdWRlcyk7XG4gICAgfVxuXG4gICAgLy8gTG9hZCB0aGUgcGFnZXMgYW5kIHJlZ2lzdGVyIHRoZSBlbmdpbmVcbiAgICBzaXRlLmxvYWRQYWdlcyhvcHRpb25zLmV4dGVuc2lvbnMsIHtcbiAgICAgIGxvYWRlcixcbiAgICAgIGVuZ2luZTogdmVudG9FbmdpbmUsXG4gICAgICBwYWdlU3ViRXh0ZW5zaW9uOiBvcHRpb25zLnBhZ2VTdWJFeHRlbnNpb24sXG4gICAgfSk7XG5cbiAgICBzaXRlLmZpbHRlcihcInZ0b1wiLCBmaWx0ZXIgYXMgSGVscGVyLCB0cnVlKTtcblxuICAgIGFzeW5jIGZ1bmN0aW9uIGZpbHRlcihzdHJpbmc6IHN0cmluZywgZGF0YT86IFJlY29yZDxzdHJpbmcsIHVua25vd24+KSB7XG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCB2ZW50by5ydW5TdHJpbmcoc3RyaW5nLCB7XG4gICAgICAgIC4uLnNpdGUuc2NvcGVkRGF0YS5nZXQoXCIvXCIpLFxuICAgICAgICAuLi5kYXRhLFxuICAgICAgfSk7XG4gICAgICByZXR1cm4gcmVzdWx0LmNvbnRlbnQ7XG4gICAgfVxuICB9O1xufVxuXG4vKiogVmVudG8gdGFnIHRvIHJlbmRlciBhIGNvbXBvbmVudCAqL1xuZnVuY3Rpb24gY29tcFRhZyhcbiAgZW52OiBFbnZpcm9ubWVudCxcbiAgY29kZTogc3RyaW5nLFxuICBvdXRwdXQ6IHN0cmluZyxcbiAgdG9rZW5zOiBUb2tlbltdLFxuKTogc3RyaW5nIHwgdW5kZWZpbmVkIHtcbiAgaWYgKCFjb2RlLnN0YXJ0c1dpdGgoXCJjb21wIFwiKSkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGNvbnN0IG1hdGNoID0gY29kZS5tYXRjaChcbiAgICAvXmNvbXBcXHMrKFtcXHcuXSspKD86XFxzKyhcXHsuKlxcfSkpPyg/OlxccysoXFwvKSk/JC8sXG4gICk7XG5cbiAgaWYgKCFtYXRjaCkge1xuICAgIHRocm93IG5ldyBFcnJvcihgSW52YWxpZCBjb21wb25lbnQgdGFnOiAke2NvZGV9YCk7XG4gIH1cblxuICBjb25zdCBbXywgY29tcCwgYXJncywgY2xvc2VkXSA9IG1hdGNoO1xuXG4gIGlmIChjbG9zZWQpIHtcbiAgICByZXR1cm4gYCR7b3V0cHV0fSArPSBhd2FpdCBjb21wLiR7Y29tcH0oJHthcmdzIHx8IFwiXCJ9KTtgO1xuICB9XG5cbiAgY29uc3QgY29tcGlsZWQ6IHN0cmluZ1tdID0gW107XG4gIGNvbnN0IHRtcE91dHB1dCA9IGBfX2NvbnRlbnRfJHt0b2tlbnMubGVuZ3RofWA7XG4gIGNvbXBpbGVkLnB1c2goXCJ7XCIpO1xuICBjb21waWxlZC5wdXNoKGBsZXQgJHt0bXBPdXRwdXR9ID0gXCJcImApO1xuICBjb21waWxlZC5wdXNoKC4uLmVudi5jb21waWxlVG9rZW5zKHRva2VucywgdG1wT3V0cHV0LCBbXCIvY29tcFwiXSkpO1xuXG4gIGlmICh0b2tlbnMubGVuZ3RoICYmICh0b2tlbnNbMF1bMF0gIT09IFwidGFnXCIgfHwgdG9rZW5zWzBdWzFdICE9PSBcIi9jb21wXCIpKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBNaXNzaW5nIGNsb3NpbmcgdGFnIGZvciBjb21wb25lbnQgdGFnOiAke2NvZGV9YCk7XG4gIH1cblxuICB0b2tlbnMuc2hpZnQoKTtcbiAgY29tcGlsZWQucHVzaChcbiAgICBgJHtvdXRwdXR9ICs9IGF3YWl0IGNvbXAuJHtjb21wfSh7Li4uJHtcbiAgICAgIGFyZ3MgfHwgXCJ7fVwiXG4gICAgfSwgY29udGVudDogJHt0bXBPdXRwdXR9fSk7YCxcbiAgKTtcbiAgY29tcGlsZWQucHVzaChcIn1cIik7XG5cbiAgcmV0dXJuIGNvbXBpbGVkLmpvaW4oXCJcXG5cIik7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsU0FBUyxNQUFNLEVBQUUsVUFBVSxRQUFRLG1CQUFtQjtBQUN0RCxPQUFPLFlBQVksMEJBQTBCO0FBQzdDLFNBQVMsS0FBSyxRQUFRLDBCQUEwQjtBQUNoRCxTQUFTLGFBQWEsUUFBUSx3QkFBd0I7QUEwQ3RELGtCQUFrQjtBQUNsQixPQUFPLE1BQU0sV0FBb0I7RUFDL0IsWUFBWTtJQUFDO0lBQVU7R0FBTztFQUM5QixTQUFTO0lBQ1AsYUFBYTtJQUNiLFNBQVM7SUFDVCxZQUFZO0VBQ2Q7QUFDRixFQUFFO0FBRUYsTUFBTSxtQkFBbUI7RUFDdkIsR0FBTztFQUVQLFlBQVksUUFBZ0IsRUFBRSxFQUFNLENBQUU7SUFDcEMsS0FBSyxDQUFDO0lBQ04sSUFBSSxDQUFDLEVBQUUsR0FBRztFQUNaO0VBRUEsTUFBTSxLQUFLLElBQVksRUFBRTtJQUN2QixNQUFNLFFBQVEsSUFBSSxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLGNBQWM7SUFFaEQsSUFBSSxDQUFDLE9BQU87TUFDVixNQUFNLElBQUksTUFBTSxDQUFDLGdCQUFnQixFQUFFLEtBQUssQ0FBQztJQUMzQztJQUVBLE1BQU0sT0FBTyxNQUFNLE1BQU0sVUFBVSxDQUFDO0lBRXBDLE9BQU87TUFDTCxRQUFRLEtBQUssT0FBTztNQUNwQixNQUFNO0lBQ1I7RUFDRjtBQUNGO0FBRUEsMENBQTBDLEdBQzFDLE9BQU8sTUFBTTtFQUNYLE9BQW9CO0VBQ3BCLFNBQWlCO0VBRWpCLFlBQVksTUFBbUIsRUFBRSxRQUFnQixDQUFF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