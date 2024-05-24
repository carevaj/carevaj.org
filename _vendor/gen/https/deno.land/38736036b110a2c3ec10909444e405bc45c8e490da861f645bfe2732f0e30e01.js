import { join, relative } from "../deps/path.ts";
import { normalizePath } from "./utils/path.ts";
import Events from "./events.ts";
export default class FSWatcher {
  events = new Events();
  options;
  constructor(options){
    this.options = options;
  }
  /** Add a listener to an event */ addEventListener(type, listener, options) {
    this.events.addEventListener(type, listener, options);
    return this;
  }
  /** Dispatch an event */ dispatchEvent(event) {
    return this.events.dispatchEvent(event);
  }
  /** Start the file watcher */ async start() {
    const { root, ignore, debounce } = this.options;
    const watcher = Deno.watchFs(root);
    const changes = new Set();
    let timer = 0;
    let runningCallback = false;
    await this.dispatchEvent({
      type: "start"
    });
    const callback = async ()=>{
      if (!changes.size || runningCallback) {
        return;
      }
      const files = new Set(changes);
      changes.clear();
      runningCallback = true;
      try {
        const result = await this.dispatchEvent({
          type: "change",
          files
        });
        if (false === result) {
          return watcher.close();
        }
      } catch (error) {
        await this.dispatchEvent({
          type: "error",
          error
        });
      }
      runningCallback = false;
    };
    for await (const event of watcher){
      let paths = event.paths.map((path)=>normalizePath(path));
      // Filter ignored paths
      paths = paths.filter((path)=>ignore ? !ignore.some((ignore)=>typeof ignore === "string" ? path.startsWith(normalizePath(join(root, ignore, "/"))) || path === normalizePath(join(root, ignore)) : ignore(path)) : true);
      if (!paths.length) {
        continue;
      }
      paths.forEach((path)=>changes.add(normalizePath(relative(root, path))));
      // Debounce
      clearTimeout(timer);
      timer = setTimeout(callback, debounce ?? 100);
    }
  }
}
export class SiteWatcher {
  site;
  events = new Events();
  constructor(site){
    this.site = site;
  }
  /** Add a listener to an event */ addEventListener(type, listener, options) {
    this.events.addEventListener(type, listener, options);
    return this;
  }
  /** Dispatch an event */ dispatchEvent(event) {
    return this.events.dispatchEvent(event);
  }
  /** Start the watcher */ async start() {
    await this.dispatchEvent({
      type: "start"
    });
    this.site.addEventListener("afterUpdate", (event)=>{
      const files = new Set([
        ...event.pages.map((page)=>page.outputPath),
        ...event.staticFiles.map((file)=>file.outputPath)
      ]);
      this.dispatchEvent({
        type: "change",
        files
      });
    });
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvbHVtZUB2Mi4yLjAvY29yZS93YXRjaGVyLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGpvaW4sIHJlbGF0aXZlIH0gZnJvbSBcIi4uL2RlcHMvcGF0aC50c1wiO1xuaW1wb3J0IHsgbm9ybWFsaXplUGF0aCB9IGZyb20gXCIuL3V0aWxzL3BhdGgudHNcIjtcbmltcG9ydCBFdmVudHMgZnJvbSBcIi4vZXZlbnRzLnRzXCI7XG5cbmltcG9ydCB0eXBlIFNpdGUgZnJvbSBcIi4vc2l0ZS50c1wiO1xuaW1wb3J0IHR5cGUgeyBFdmVudCwgRXZlbnRMaXN0ZW5lciwgRXZlbnRPcHRpb25zIH0gZnJvbSBcIi4vZXZlbnRzLnRzXCI7XG5cbi8qKiBUaGUgb3B0aW9ucyB0byBjb25maWd1cmUgdGhlIGxvY2FsIHNlcnZlciAqL1xuZXhwb3J0IGludGVyZmFjZSBPcHRpb25zIHtcbiAgLyoqIFRoZSBmb2xkZXIgcm9vdCB0byB3YXRjaCAqL1xuICByb290OiBzdHJpbmc7XG5cbiAgLyoqIFBhdGhzIGlnbm9yZWQgYnkgdGhlIHdhdGNoZXIgKi9cbiAgaWdub3JlPzogKHN0cmluZyB8ICgocGF0aDogc3RyaW5nKSA9PiBib29sZWFuKSlbXTtcblxuICAvKiogVGhlIGRlYm91bmNlIHdhaXRpbmcgdGltZSAqL1xuICBkZWJvdW5jZT86IG51bWJlcjtcbn1cblxuLyoqIEN1c3RvbSBldmVudHMgZm9yIHNlcnZlciAqL1xuZXhwb3J0IGludGVyZmFjZSBXYXRjaEV2ZW50IGV4dGVuZHMgRXZlbnQge1xuICAvKiogVGhlIGV2ZW50IHR5cGUgKi9cbiAgdHlwZTogV2F0Y2hFdmVudFR5cGU7XG5cbiAgLyoqIFRoZSBsaXN0IG9mIGNoYW5nZWQgZmlsZXMgKG9ubHkgZm9yIFwiY2hhbmdlXCIgZXZlbnRzKSAqL1xuICBmaWxlcz86IFNldDxzdHJpbmc+O1xuXG4gIC8qKiBUaGUgZXJyb3Igb2JqZWN0IChvbmx5IGZvciBcImVycm9yXCIgZXZlbnRzKSAqL1xuICBlcnJvcj86IEVycm9yO1xufVxuXG4vKiogVGhlIGF2YWlsYWJsZSBldmVudCB0eXBlcyAqL1xuZXhwb3J0IHR5cGUgV2F0Y2hFdmVudFR5cGUgPVxuICB8IFwic3RhcnRcIlxuICB8IFwiY2hhbmdlXCJcbiAgfCBcImVycm9yXCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgV2F0Y2hlciB7XG4gIC8qKiBBZGQgYSBsaXN0ZW5lciB0byBhbiBldmVudCAqL1xuICBhZGRFdmVudExpc3RlbmVyKFxuICAgIHR5cGU6IFdhdGNoRXZlbnRUeXBlLFxuICAgIGxpc3RlbmVyOiBFdmVudExpc3RlbmVyPFdhdGNoRXZlbnQ+LFxuICAgIG9wdGlvbnM/OiBFdmVudE9wdGlvbnMsXG4gICk6IHRoaXM7XG5cbiAgLyoqIERpc3BhdGNoIGFuIGV2ZW50ICovXG4gIGRpc3BhdGNoRXZlbnQoZXZlbnQ6IFdhdGNoRXZlbnQpOiBQcm9taXNlPGJvb2xlYW4+O1xuXG4gIC8qKiBTdGFydCB0aGUgd2F0Y2hlciAqL1xuICBzdGFydCgpOiBQcm9taXNlPHZvaWQ+O1xufVxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBGU1dhdGNoZXIgaW1wbGVtZW50cyBXYXRjaGVyIHtcbiAgZXZlbnRzOiBFdmVudHM8V2F0Y2hFdmVudD4gPSBuZXcgRXZlbnRzPFdhdGNoRXZlbnQ+KCk7XG4gIG9wdGlvbnM6IE9wdGlvbnM7XG5cbiAgY29uc3RydWN0b3Iob3B0aW9uczogT3B0aW9ucykge1xuICAgIHRoaXMub3B0aW9ucyA9IG9wdGlvbnM7XG4gIH1cblxuICAvKiogQWRkIGEgbGlzdGVuZXIgdG8gYW4gZXZlbnQgKi9cbiAgYWRkRXZlbnRMaXN0ZW5lcihcbiAgICB0eXBlOiBXYXRjaEV2ZW50VHlwZSxcbiAgICBsaXN0ZW5lcjogRXZlbnRMaXN0ZW5lcjxXYXRjaEV2ZW50PixcbiAgICBvcHRpb25zPzogRXZlbnRPcHRpb25zLFxuICApIHtcbiAgICB0aGlzLmV2ZW50cy5hZGRFdmVudExpc3RlbmVyKHR5cGUsIGxpc3RlbmVyLCBvcHRpb25zKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKiBEaXNwYXRjaCBhbiBldmVudCAqL1xuICBkaXNwYXRjaEV2ZW50KGV2ZW50OiBXYXRjaEV2ZW50KSB7XG4gICAgcmV0dXJuIHRoaXMuZXZlbnRzLmRpc3BhdGNoRXZlbnQoZXZlbnQpO1xuICB9XG5cbiAgLyoqIFN0YXJ0IHRoZSBmaWxlIHdhdGNoZXIgKi9cbiAgYXN5bmMgc3RhcnQoKSB7XG4gICAgY29uc3QgeyByb290LCBpZ25vcmUsIGRlYm91bmNlIH0gPSB0aGlzLm9wdGlvbnM7XG4gICAgY29uc3Qgd2F0Y2hlciA9IERlbm8ud2F0Y2hGcyhyb290KTtcbiAgICBjb25zdCBjaGFuZ2VzID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gICAgbGV0IHRpbWVyID0gMDtcbiAgICBsZXQgcnVubmluZ0NhbGxiYWNrID0gZmFsc2U7XG5cbiAgICBhd2FpdCB0aGlzLmRpc3BhdGNoRXZlbnQoeyB0eXBlOiBcInN0YXJ0XCIgfSk7XG5cbiAgICBjb25zdCBjYWxsYmFjayA9IGFzeW5jICgpID0+IHtcbiAgICAgIGlmICghY2hhbmdlcy5zaXplIHx8IHJ1bm5pbmdDYWxsYmFjaykge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGZpbGVzID0gbmV3IFNldChjaGFuZ2VzKTtcbiAgICAgIGNoYW5nZXMuY2xlYXIoKTtcblxuICAgICAgcnVubmluZ0NhbGxiYWNrID0gdHJ1ZTtcblxuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5kaXNwYXRjaEV2ZW50KHsgdHlwZTogXCJjaGFuZ2VcIiwgZmlsZXMgfSk7XG4gICAgICAgIGlmIChmYWxzZSA9PT0gcmVzdWx0KSB7XG4gICAgICAgICAgcmV0dXJuIHdhdGNoZXIuY2xvc2UoKTtcbiAgICAgICAgfVxuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgYXdhaXQgdGhpcy5kaXNwYXRjaEV2ZW50KHsgdHlwZTogXCJlcnJvclwiLCBlcnJvciB9KTtcbiAgICAgIH1cbiAgICAgIHJ1bm5pbmdDYWxsYmFjayA9IGZhbHNlO1xuICAgIH07XG5cbiAgICBmb3IgYXdhaXQgKGNvbnN0IGV2ZW50IG9mIHdhdGNoZXIpIHtcbiAgICAgIGxldCBwYXRocyA9IGV2ZW50LnBhdGhzLm1hcCgocGF0aCkgPT4gbm9ybWFsaXplUGF0aChwYXRoKSk7XG5cbiAgICAgIC8vIEZpbHRlciBpZ25vcmVkIHBhdGhzXG4gICAgICBwYXRocyA9IHBhdGhzLmZpbHRlcigocGF0aCkgPT5cbiAgICAgICAgaWdub3JlXG4gICAgICAgICAgPyAhaWdub3JlLnNvbWUoKGlnbm9yZSkgPT5cbiAgICAgICAgICAgIHR5cGVvZiBpZ25vcmUgPT09IFwic3RyaW5nXCJcbiAgICAgICAgICAgICAgPyAocGF0aC5zdGFydHNXaXRoKG5vcm1hbGl6ZVBhdGgoam9pbihyb290LCBpZ25vcmUsIFwiL1wiKSkpIHx8XG4gICAgICAgICAgICAgICAgcGF0aCA9PT0gbm9ybWFsaXplUGF0aChqb2luKHJvb3QsIGlnbm9yZSkpKVxuICAgICAgICAgICAgICA6IGlnbm9yZShwYXRoKVxuICAgICAgICAgIClcbiAgICAgICAgICA6IHRydWVcbiAgICAgICk7XG5cbiAgICAgIGlmICghcGF0aHMubGVuZ3RoKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICBwYXRocy5mb3JFYWNoKChwYXRoKSA9PiBjaGFuZ2VzLmFkZChub3JtYWxpemVQYXRoKHJlbGF0aXZlKHJvb3QsIHBhdGgpKSkpO1xuXG4gICAgICAvLyBEZWJvdW5jZVxuICAgICAgY2xlYXJUaW1lb3V0KHRpbWVyKTtcbiAgICAgIHRpbWVyID0gc2V0VGltZW91dChjYWxsYmFjaywgZGVib3VuY2UgPz8gMTAwKTtcbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIFNpdGVXYXRjaGVyIGltcGxlbWVudHMgV2F0Y2hlciB7XG4gIHNpdGU6IFNpdGU7XG4gIGV2ZW50czogRXZlbnRzPFdhdGNoRXZlbnQ+ID0gbmV3IEV2ZW50czxXYXRjaEV2ZW50PigpO1xuXG4gIGNvbnN0cnVjdG9yKHNpdGU6IFNpdGUpIHtcbiAgICB0aGlzLnNpdGUgPSBzaXRlO1xuICB9XG5cbiAgLyoqIEFkZCBhIGxpc3RlbmVyIHRvIGFuIGV2ZW50ICovXG4gIGFkZEV2ZW50TGlzdGVuZXIoXG4gICAgdHlwZTogV2F0Y2hFdmVudFR5cGUsXG4gICAgbGlzdGVuZXI6IEV2ZW50TGlzdGVuZXI8V2F0Y2hFdmVudD4sXG4gICAgb3B0aW9ucz86IEV2ZW50T3B0aW9ucyxcbiAgKSB7XG4gICAgdGhpcy5ldmVudHMuYWRkRXZlbnRMaXN0ZW5lcih0eXBlLCBsaXN0ZW5lciwgb3B0aW9ucyk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKiogRGlzcGF0Y2ggYW4gZXZlbnQgKi9cbiAgZGlzcGF0Y2hFdmVudChldmVudDogV2F0Y2hFdmVudCkge1xuICAgIHJldHVybiB0aGlzLmV2ZW50cy5kaXNwYXRjaEV2ZW50KGV2ZW50KTtcbiAgfVxuXG4gIC8qKiBTdGFydCB0aGUgd2F0Y2hlciAqL1xuICBhc3luYyBzdGFydCgpIHtcbiAgICBhd2FpdCB0aGlzLmRpc3BhdGNoRXZlbnQoeyB0eXBlOiBcInN0YXJ0XCIgfSk7XG4gICAgdGhpcy5zaXRlLmFkZEV2ZW50TGlzdGVuZXIoXCJhZnRlclVwZGF0ZVwiLCAoZXZlbnQpID0+IHtcbiAgICAgIGNvbnN0IGZpbGVzID0gbmV3IFNldChbXG4gICAgICAgIC4uLmV2ZW50LnBhZ2VzLm1hcCgocGFnZSkgPT4gcGFnZS5vdXRwdXRQYXRoKSxcbiAgICAgICAgLi4uZXZlbnQuc3RhdGljRmlsZXMubWFwKChmaWxlKSA9PiBmaWxlLm91dHB1dFBhdGgpLFxuICAgICAgXSk7XG4gICAgICB0aGlzLmRpc3BhdGNoRXZlbnQoeyB0eXBlOiBcImNoYW5nZVwiLCBmaWxlcyB9KTtcbiAgICB9KTtcbiAgfVxufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3Mi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