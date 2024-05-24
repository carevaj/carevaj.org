import { posix } from "../deps/path.ts";
export class Entry {
  name;
  path;
  type;
  src;
  children = new Map();
  flags = new Set();
  #content = new Map();
  #info;
  constructor(name, path, type, src){
    this.name = name;
    this.path = path;
    this.type = type;
    this.src = src;
  }
  removeCache() {
    this.#content.clear();
    this.#info = undefined;
    this.flags.clear();
  }
  getContent(loader) {
    if (!this.#content.has(loader)) {
      this.#content.set(loader, loader(this.src));
    }
    return this.#content.get(loader);
  }
  getInfo() {
    if (!this.#info) {
      this.#info = this.src.includes("://") ? createFileInfo(this.type) : Deno.statSync(this.src);
    }
    return this.#info;
  }
}
/** Virtual file system used to load and cache files (local and remote) */ export default class FS {
  options;
  entries = new Map();
  remoteFiles = new Map();
  tree;
  constructor(options){
    this.options = options;
    this.tree = new Entry("", "/", "directory", options.root);
    this.entries.set("/", this.tree);
  }
  init() {
    this.#walkFs(this.tree);
    this.#walkRemote();
  }
  /** Update the entry and returns it if it was removed */ update(path) {
    const exist = this.entries.get(path);
    const entry = exist || this.addEntry({
      path
    });
    // New directory, walk it
    if (!exist && entry.type === "directory") {
      this.#walkFs(entry);
      return;
    }
    try {
      entry.removeCache();
      entry.getInfo();
    } catch (error) {
      // Remove if it doesn't exist
      if (error instanceof Deno.errors.NotFound) {
        this.removeEntry(path);
        return exist;
      }
    }
  }
  #isValid(path) {
    const { ignore } = this.options;
    return ignore ? !ignore.some((ignore)=>typeof ignore === "string" ? path.startsWith(posix.join(ignore, "/")) || path === ignore : ignore(path)) : true;
  }
  #walkFs(dir) {
    const dirPath = posix.join(this.options.root, dir.path);
    for (const dirEntry of Deno.readDirSync(dirPath)){
      const path = posix.join(dir.path, dirEntry.name);
      if (dirEntry.isSymlink) {
        this.#walkLink(dir, dirEntry.name);
        continue;
      }
      if (!this.#isValid(path)) {
        continue;
      }
      const entry = new Entry(dirEntry.name, path, dirEntry.isDirectory ? "directory" : "file", posix.join(this.options.root, path));
      dir.children.set(dirEntry.name, entry);
      this.entries.set(path, entry);
      if (entry.type === "directory") {
        this.#walkFs(entry);
      }
    }
  }
  #walkLink(dir, name) {
    const src = posix.join(dir.src, name);
    const info = Deno.statSync(src);
    const type = info.isDirectory ? "directory" : "file";
    const entry = new Entry(name, posix.join(dir.path, name), type, Deno.realPathSync(src));
    dir.children.set(name, entry);
    this.entries.set(entry.path, entry);
    if (type === "directory") {
      this.#walkFs(entry);
    }
  }
  #walkRemote() {
    // Read from remote files
    for (const [path, src] of this.remoteFiles){
      if (this.entries.has(path)) {
        continue;
      }
      this.addEntry({
        path,
        type: "file",
        src
      }).flags.add("remote");
    }
  }
  addEntry(data) {
    const pieces = data.path.split("/").filter((p)=>p);
    let parent = this.tree;
    if (!data.src) {
      data.src = posix.join(this.options.root, data.path);
    }
    if (!data.type) {
      try {
        const info = Deno.statSync(data.src);
        data.type = info.isDirectory ? "directory" : "file";
      } catch  {
        data.type = "file";
      }
    }
    while(pieces.length > 1){
      const name = pieces.shift();
      const children = parent.children;
      const path = posix.join(parent.path, name);
      if (!this.#isValid(path)) {
        break;
      }
      parent = children.get(name) || new Entry(name, path, "directory", this.options.root + path);
      children.set(name, parent);
      this.entries.set(parent.path, parent);
    }
    const name = pieces.shift();
    const children = parent.children;
    const entry = new Entry(name, data.path, data.type, data.src);
    children.set(name, entry);
    this.entries.set(entry.path, entry);
    return entry;
  }
  removeEntry(path) {
    const entry = this.entries.get(path);
    const isFolder = entry?.type === "directory";
    this.entries.delete(path);
    const parent = this.entries.get(posix.dirname(path));
    const name = posix.basename(path);
    parent.children.delete(name);
    if (isFolder) {
      const prefix = posix.join(path, "/");
      for (const childPath of this.entries.keys()){
        if (childPath.startsWith(prefix)) {
          this.entries.delete(childPath);
        }
      }
    }
  }
}
function createFileInfo(type) {
  return {
    isFile: type === "file",
    isDirectory: type === "directory",
    isSymlink: false,
    isBlockDevice: null,
    isCharDevice: null,
    isSocket: null,
    isFifo: null,
    size: 0,
    mtime: new Date(),
    atime: new Date(),
    birthtime: new Date(),
    dev: 0,
    ino: null,
    mode: null,
    nlink: null,
    uid: null,
    gid: null,
    rdev: null,
    blksize: null,
    blocks: null
  };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvbHVtZUB2Mi4yLjAvY29yZS9mcy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBwb3NpeCB9IGZyb20gXCIuLi9kZXBzL3BhdGgudHNcIjtcblxuaW1wb3J0IHR5cGUgeyBSYXdEYXRhIH0gZnJvbSBcIi4vZmlsZS50c1wiO1xuaW1wb3J0IHR5cGUgeyBMb2FkZXIgfSBmcm9tIFwiLi9sb2FkZXJzL21vZC50c1wiO1xuXG50eXBlIEVudHJ5VHlwZSA9IFwiZmlsZVwiIHwgXCJkaXJlY3RvcnlcIjtcblxuZXhwb3J0IGludGVyZmFjZSBPcHRpb25zIHtcbiAgcm9vdDogc3RyaW5nO1xuICBpZ25vcmU/OiAoc3RyaW5nIHwgKChwYXRoOiBzdHJpbmcpID0+IGJvb2xlYW4pKVtdO1xufVxuXG5leHBvcnQgY2xhc3MgRW50cnkge1xuICBuYW1lOiBzdHJpbmc7XG4gIHBhdGg6IHN0cmluZztcbiAgdHlwZTogRW50cnlUeXBlO1xuICBzcmM6IHN0cmluZztcbiAgY2hpbGRyZW4gPSBuZXcgTWFwPHN0cmluZywgRW50cnk+KCk7XG4gIGZsYWdzID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gICNjb250ZW50ID0gbmV3IE1hcDxMb2FkZXIsIFByb21pc2U8UmF3RGF0YT4gfCBSYXdEYXRhPigpO1xuICAjaW5mbz86IERlbm8uRmlsZUluZm87XG5cbiAgY29uc3RydWN0b3IobmFtZTogc3RyaW5nLCBwYXRoOiBzdHJpbmcsIHR5cGU6IEVudHJ5VHlwZSwgc3JjOiBzdHJpbmcpIHtcbiAgICB0aGlzLm5hbWUgPSBuYW1lO1xuICAgIHRoaXMucGF0aCA9IHBhdGg7XG4gICAgdGhpcy50eXBlID0gdHlwZTtcbiAgICB0aGlzLnNyYyA9IHNyYztcbiAgfVxuXG4gIHJlbW92ZUNhY2hlKCkge1xuICAgIHRoaXMuI2NvbnRlbnQuY2xlYXIoKTtcbiAgICB0aGlzLiNpbmZvID0gdW5kZWZpbmVkO1xuICAgIHRoaXMuZmxhZ3MuY2xlYXIoKTtcbiAgfVxuXG4gIGdldENvbnRlbnQobG9hZGVyOiBMb2FkZXIpOiBQcm9taXNlPFJhd0RhdGE+IHwgUmF3RGF0YSB7XG4gICAgaWYgKCF0aGlzLiNjb250ZW50Lmhhcyhsb2FkZXIpKSB7XG4gICAgICB0aGlzLiNjb250ZW50LnNldChsb2FkZXIsIGxvYWRlcih0aGlzLnNyYykpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLiNjb250ZW50LmdldChsb2FkZXIpITtcbiAgfVxuXG4gIGdldEluZm8oKSB7XG4gICAgaWYgKCF0aGlzLiNpbmZvKSB7XG4gICAgICB0aGlzLiNpbmZvID0gdGhpcy5zcmMuaW5jbHVkZXMoXCI6Ly9cIilcbiAgICAgICAgPyBjcmVhdGVGaWxlSW5mbyh0aGlzLnR5cGUpXG4gICAgICAgIDogRGVuby5zdGF0U3luYyh0aGlzLnNyYyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuI2luZm87XG4gIH1cbn1cblxuLyoqIFZpcnR1YWwgZmlsZSBzeXN0ZW0gdXNlZCB0byBsb2FkIGFuZCBjYWNoZSBmaWxlcyAobG9jYWwgYW5kIHJlbW90ZSkgKi9cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEZTIHtcbiAgb3B0aW9uczogT3B0aW9ucztcbiAgZW50cmllcyA9IG5ldyBNYXA8c3RyaW5nLCBFbnRyeT4oKTtcbiAgcmVtb3RlRmlsZXMgPSBuZXcgTWFwPHN0cmluZywgc3RyaW5nPigpO1xuICB0cmVlOiBFbnRyeTtcblxuICBjb25zdHJ1Y3RvcihvcHRpb25zOiBPcHRpb25zKSB7XG4gICAgdGhpcy5vcHRpb25zID0gb3B0aW9ucztcbiAgICB0aGlzLnRyZWUgPSBuZXcgRW50cnkoXCJcIiwgXCIvXCIsIFwiZGlyZWN0b3J5XCIsIG9wdGlvbnMucm9vdCk7XG4gICAgdGhpcy5lbnRyaWVzLnNldChcIi9cIiwgdGhpcy50cmVlKTtcbiAgfVxuXG4gIGluaXQoKSB7XG4gICAgdGhpcy4jd2Fsa0ZzKHRoaXMudHJlZSk7XG4gICAgdGhpcy4jd2Fsa1JlbW90ZSgpO1xuICB9XG5cbiAgLyoqIFVwZGF0ZSB0aGUgZW50cnkgYW5kIHJldHVybnMgaXQgaWYgaXQgd2FzIHJlbW92ZWQgKi9cbiAgdXBkYXRlKHBhdGg6IHN0cmluZyk6IEVudHJ5IHwgdW5kZWZpbmVkIHtcbiAgICBjb25zdCBleGlzdCA9IHRoaXMuZW50cmllcy5nZXQocGF0aCk7XG4gICAgY29uc3QgZW50cnkgPSBleGlzdCB8fCB0aGlzLmFkZEVudHJ5KHsgcGF0aCB9KTtcblxuICAgIC8vIE5ldyBkaXJlY3RvcnksIHdhbGsgaXRcbiAgICBpZiAoIWV4aXN0ICYmIGVudHJ5LnR5cGUgPT09IFwiZGlyZWN0b3J5XCIpIHtcbiAgICAgIHRoaXMuI3dhbGtGcyhlbnRyeSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdHJ5IHtcbiAgICAgIGVudHJ5LnJlbW92ZUNhY2hlKCk7XG4gICAgICBlbnRyeS5nZXRJbmZvKCk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIC8vIFJlbW92ZSBpZiBpdCBkb2Vzbid0IGV4aXN0XG4gICAgICBpZiAoZXJyb3IgaW5zdGFuY2VvZiBEZW5vLmVycm9ycy5Ob3RGb3VuZCkge1xuICAgICAgICB0aGlzLnJlbW92ZUVudHJ5KHBhdGgpO1xuICAgICAgICByZXR1cm4gZXhpc3Q7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgI2lzVmFsaWQocGF0aDogc3RyaW5nKSB7XG4gICAgY29uc3QgeyBpZ25vcmUgfSA9IHRoaXMub3B0aW9ucztcblxuICAgIHJldHVybiBpZ25vcmVcbiAgICAgID8gIWlnbm9yZS5zb21lKChpZ25vcmUpID0+XG4gICAgICAgIHR5cGVvZiBpZ25vcmUgPT09IFwic3RyaW5nXCJcbiAgICAgICAgICA/IChwYXRoLnN0YXJ0c1dpdGgocG9zaXguam9pbihpZ25vcmUsIFwiL1wiKSkgfHxcbiAgICAgICAgICAgIHBhdGggPT09IGlnbm9yZSlcbiAgICAgICAgICA6IGlnbm9yZShwYXRoKVxuICAgICAgKVxuICAgICAgOiB0cnVlO1xuICB9XG5cbiAgI3dhbGtGcyhkaXI6IEVudHJ5KSB7XG4gICAgY29uc3QgZGlyUGF0aCA9IHBvc2l4LmpvaW4odGhpcy5vcHRpb25zLnJvb3QsIGRpci5wYXRoKTtcblxuICAgIGZvciAoY29uc3QgZGlyRW50cnkgb2YgRGVuby5yZWFkRGlyU3luYyhkaXJQYXRoKSkge1xuICAgICAgY29uc3QgcGF0aCA9IHBvc2l4LmpvaW4oZGlyLnBhdGgsIGRpckVudHJ5Lm5hbWUpO1xuXG4gICAgICBpZiAoZGlyRW50cnkuaXNTeW1saW5rKSB7XG4gICAgICAgIHRoaXMuI3dhbGtMaW5rKGRpciwgZGlyRW50cnkubmFtZSk7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICBpZiAoIXRoaXMuI2lzVmFsaWQocGF0aCkpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGVudHJ5ID0gbmV3IEVudHJ5KFxuICAgICAgICBkaXJFbnRyeS5uYW1lLFxuICAgICAgICBwYXRoLFxuICAgICAgICBkaXJFbnRyeS5pc0RpcmVjdG9yeSA/IFwiZGlyZWN0b3J5XCIgOiBcImZpbGVcIixcbiAgICAgICAgcG9zaXguam9pbih0aGlzLm9wdGlvbnMucm9vdCwgcGF0aCksXG4gICAgICApO1xuXG4gICAgICBkaXIuY2hpbGRyZW4uc2V0KGRpckVudHJ5Lm5hbWUsIGVudHJ5KTtcbiAgICAgIHRoaXMuZW50cmllcy5zZXQocGF0aCwgZW50cnkpO1xuXG4gICAgICBpZiAoZW50cnkudHlwZSA9PT0gXCJkaXJlY3RvcnlcIikge1xuICAgICAgICB0aGlzLiN3YWxrRnMoZW50cnkpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gICN3YWxrTGluayhkaXI6IEVudHJ5LCBuYW1lOiBzdHJpbmcpIHtcbiAgICBjb25zdCBzcmMgPSBwb3NpeC5qb2luKGRpci5zcmMsIG5hbWUpO1xuICAgIGNvbnN0IGluZm8gPSBEZW5vLnN0YXRTeW5jKHNyYyk7XG4gICAgY29uc3QgdHlwZSA9IGluZm8uaXNEaXJlY3RvcnkgPyBcImRpcmVjdG9yeVwiIDogXCJmaWxlXCI7XG5cbiAgICBjb25zdCBlbnRyeSA9IG5ldyBFbnRyeShcbiAgICAgIG5hbWUsXG4gICAgICBwb3NpeC5qb2luKGRpci5wYXRoLCBuYW1lKSxcbiAgICAgIHR5cGUsXG4gICAgICBEZW5vLnJlYWxQYXRoU3luYyhzcmMpLFxuICAgICk7XG5cbiAgICBkaXIuY2hpbGRyZW4uc2V0KG5hbWUsIGVudHJ5KTtcbiAgICB0aGlzLmVudHJpZXMuc2V0KGVudHJ5LnBhdGgsIGVudHJ5KTtcblxuICAgIGlmICh0eXBlID09PSBcImRpcmVjdG9yeVwiKSB7XG4gICAgICB0aGlzLiN3YWxrRnMoZW50cnkpO1xuICAgIH1cbiAgfVxuXG4gICN3YWxrUmVtb3RlKCkge1xuICAgIC8vIFJlYWQgZnJvbSByZW1vdGUgZmlsZXNcbiAgICBmb3IgKGNvbnN0IFtwYXRoLCBzcmNdIG9mIHRoaXMucmVtb3RlRmlsZXMpIHtcbiAgICAgIGlmICh0aGlzLmVudHJpZXMuaGFzKHBhdGgpKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICB0aGlzLmFkZEVudHJ5KHtcbiAgICAgICAgcGF0aCxcbiAgICAgICAgdHlwZTogXCJmaWxlXCIsXG4gICAgICAgIHNyYyxcbiAgICAgIH0pLmZsYWdzLmFkZChcInJlbW90ZVwiKTtcbiAgICB9XG4gIH1cblxuICBhZGRFbnRyeShkYXRhOiB7IHBhdGg6IHN0cmluZzsgdHlwZT86IEVudHJ5VHlwZTsgc3JjPzogc3RyaW5nIH0pOiBFbnRyeSB7XG4gICAgY29uc3QgcGllY2VzID0gZGF0YS5wYXRoLnNwbGl0KFwiL1wiKS5maWx0ZXIoKHApID0+IHApO1xuICAgIGxldCBwYXJlbnQgPSB0aGlzLnRyZWU7XG5cbiAgICBpZiAoIWRhdGEuc3JjKSB7XG4gICAgICBkYXRhLnNyYyA9IHBvc2l4LmpvaW4odGhpcy5vcHRpb25zLnJvb3QsIGRhdGEucGF0aCk7XG4gICAgfVxuXG4gICAgaWYgKCFkYXRhLnR5cGUpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IGluZm8gPSBEZW5vLnN0YXRTeW5jKGRhdGEuc3JjKTtcbiAgICAgICAgZGF0YS50eXBlID0gaW5mby5pc0RpcmVjdG9yeSA/IFwiZGlyZWN0b3J5XCIgOiBcImZpbGVcIjtcbiAgICAgIH0gY2F0Y2gge1xuICAgICAgICBkYXRhLnR5cGUgPSBcImZpbGVcIjtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB3aGlsZSAocGllY2VzLmxlbmd0aCA+IDEpIHtcbiAgICAgIGNvbnN0IG5hbWUgPSBwaWVjZXMuc2hpZnQoKSE7XG4gICAgICBjb25zdCBjaGlsZHJlbiA9IHBhcmVudC5jaGlsZHJlbjtcbiAgICAgIGNvbnN0IHBhdGggPSBwb3NpeC5qb2luKHBhcmVudC5wYXRoLCBuYW1lKTtcblxuICAgICAgaWYgKCF0aGlzLiNpc1ZhbGlkKHBhdGgpKSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuXG4gICAgICBwYXJlbnQgPSBjaGlsZHJlbi5nZXQobmFtZSkgfHwgbmV3IEVudHJ5KFxuICAgICAgICBuYW1lLFxuICAgICAgICBwYXRoLFxuICAgICAgICBcImRpcmVjdG9yeVwiLFxuICAgICAgICB0aGlzLm9wdGlvbnMucm9vdCArIHBhdGgsXG4gICAgICApO1xuXG4gICAgICBjaGlsZHJlbi5zZXQobmFtZSwgcGFyZW50KTtcbiAgICAgIHRoaXMuZW50cmllcy5zZXQocGFyZW50LnBhdGgsIHBhcmVudCk7XG4gICAgfVxuXG4gICAgY29uc3QgbmFtZSA9IHBpZWNlcy5zaGlmdCgpITtcbiAgICBjb25zdCBjaGlsZHJlbiA9IHBhcmVudC5jaGlsZHJlbjtcbiAgICBjb25zdCBlbnRyeSA9IG5ldyBFbnRyeShcbiAgICAgIG5hbWUsXG4gICAgICBkYXRhLnBhdGgsXG4gICAgICBkYXRhLnR5cGUsXG4gICAgICBkYXRhLnNyYyxcbiAgICApO1xuICAgIGNoaWxkcmVuLnNldChuYW1lLCBlbnRyeSk7XG4gICAgdGhpcy5lbnRyaWVzLnNldChlbnRyeS5wYXRoLCBlbnRyeSk7XG4gICAgcmV0dXJuIGVudHJ5O1xuICB9XG5cbiAgcmVtb3ZlRW50cnkocGF0aDogc3RyaW5nKSB7XG4gICAgY29uc3QgZW50cnkgPSB0aGlzLmVudHJpZXMuZ2V0KHBhdGgpO1xuICAgIGNvbnN0IGlzRm9sZGVyID0gZW50cnk/LnR5cGUgPT09IFwiZGlyZWN0b3J5XCI7XG5cbiAgICB0aGlzLmVudHJpZXMuZGVsZXRlKHBhdGgpO1xuICAgIGNvbnN0IHBhcmVudCA9IHRoaXMuZW50cmllcy5nZXQocG9zaXguZGlybmFtZShwYXRoKSkhO1xuICAgIGNvbnN0IG5hbWUgPSBwb3NpeC5iYXNlbmFtZShwYXRoKTtcbiAgICBwYXJlbnQuY2hpbGRyZW4uZGVsZXRlKG5hbWUpO1xuXG4gICAgaWYgKGlzRm9sZGVyKSB7XG4gICAgICBjb25zdCBwcmVmaXggPSBwb3NpeC5qb2luKHBhdGgsIFwiL1wiKTtcbiAgICAgIGZvciAoY29uc3QgY2hpbGRQYXRoIG9mIHRoaXMuZW50cmllcy5rZXlzKCkpIHtcbiAgICAgICAgaWYgKGNoaWxkUGF0aC5zdGFydHNXaXRoKHByZWZpeCkpIHtcbiAgICAgICAgICB0aGlzLmVudHJpZXMuZGVsZXRlKGNoaWxkUGF0aCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gY3JlYXRlRmlsZUluZm8odHlwZTogRW50cnlUeXBlKTogRGVuby5GaWxlSW5mbyB7XG4gIHJldHVybiB7XG4gICAgaXNGaWxlOiB0eXBlID09PSBcImZpbGVcIixcbiAgICBpc0RpcmVjdG9yeTogdHlwZSA9PT0gXCJkaXJlY3RvcnlcIixcbiAgICBpc1N5bWxpbms6IGZhbHNlLFxuICAgIGlzQmxvY2tEZXZpY2U6IG51bGwsXG4gICAgaXNDaGFyRGV2aWNlOiBudWxsLFxuICAgIGlzU29ja2V0OiBudWxsLFxuICAgIGlzRmlmbzogbnVsbCxcbiAgICBzaXplOiAwLFxuICAgIG10aW1lOiBuZXcgRGF0ZSgpLFxuICAgIGF0aW1lOiBuZXcgRGF0ZSgpLFxuICAgIGJpcnRodGltZTogbmV3IERhdGUoKSxcbiAgICBkZXY6IDAsXG4gICAgaW5vOiBudWxsLFxuICAgIG1vZGU6IG51bGwsXG4gICAgbmxpbms6IG51bGwsXG4gICAgdWlkOiBudWxsLFxuICAgIGdpZDogbnVsbCxcbiAgICByZGV2OiBudWxsLFxuICAgIGJsa3NpemU6IG51bGwsXG4gICAgYmxvY2tzOiBudWxsLFxuICB9O1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFNBQVMsS0FBSyxRQUFRLGtCQUFrQjtBQVl4QyxPQUFPLE1BQU07RUFDWCxLQUFhO0VBQ2IsS0FBYTtFQUNiLEtBQWdCO0VBQ2hCLElBQVk7RUFDWixXQUFXLElBQUksTUFBcUI7RUFDcEMsUUFBUSxJQUFJLE1BQWM7RUFDMUIsQ0FBQyxPQUFPLEdBQUcsSUFBSSxNQUEwQztFQUN6RCxDQUFDLElBQUksQ0FBaUI7RUFFdEIsWUFBWSxJQUFZLEVBQUUsSUFBWSxFQUFFLElBQWUsRUFBRSxHQUFXLENBQUU7SUFDcEUsSUFBSSxDQUFDLElBQUksR0FBRztJQUNaLElBQUksQ0FBQyxJQUFJLEdBQUc7SUFDWixJQUFJLENBQUMsSUFBSSxHQUFHO0lBQ1osSUFBSSxDQUFDLEdBQUcsR0FBRztFQUNiO0VBRUEsY0FBYztJQUNaLElBQUksQ0FBQyxDQUFDLE9BQU8sQ0FBQyxLQUFLO0lBQ25CLElBQUksQ0FBQyxDQUFDLElBQUksR0FBRztJQUNiLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSztFQUNsQjtFQUVBLFdBQVcsTUFBYyxFQUE4QjtJQUNyRCxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxTQUFTO01BQzlCLElBQUksQ0FBQyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsUUFBUSxPQUFPLElBQUksQ0FBQyxHQUFHO0lBQzNDO0lBRUEsT0FBTyxJQUFJLENBQUMsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDO0VBQzNCO0VBRUEsVUFBVTtJQUNSLElBQUksQ0FBQyxJQUFJLENB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