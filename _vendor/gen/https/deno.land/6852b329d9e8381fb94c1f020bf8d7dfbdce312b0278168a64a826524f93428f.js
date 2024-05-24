import { posix } from "../deps/path.ts";
import { emptyDir, ensureDir } from "../deps/fs.ts";
import { concurrent } from "./utils/concurrent.ts";
import { sha1 } from "./utils/digest.ts";
import { log } from "./utils/log.ts";
import binaryLoader from "./loaders/binary.ts";
/**
 * Class to write the generated pages and static files
 * in the dest folder.
 */ export class FSWriter {
  dest;
  #outputs = new Map();
  #saveCount = 0;
  constructor(options){
    this.dest = options.dest;
  }
  /**
   * Save the pages in the dest folder
   * Returns an array of pages that have been saved
   */ async savePages(pages) {
    const savedPages = [];
    ++this.#saveCount;
    await concurrent(pages, async (page)=>{
      if (await this.savePage(page)) {
        savedPages.push(page);
      }
    });
    return savedPages;
  }
  /**
   * Save a page in the dest folder
   * Returns a boolean indicating if the page has saved
   */ async savePage(page) {
    const { sourcePath, outputPath, content } = page;
    // Ignore empty pages
    if (!content) {
      log.warn(`[Lume] <cyan>Skipped page</cyan> ${page.data.url} (file content is empty)`);
      return false;
    }
    const filename = posix.join(this.dest, outputPath);
    const id = filename.toLowerCase();
    const hash = await sha1(content);
    const previous = this.#outputs.get(id);
    this.#outputs.set(id, [
      this.#saveCount,
      sourcePath,
      hash
    ]);
    if (previous) {
      const [previousCount, previousSourcePath, previousHash] = previous;
      if (previousCount === this.#saveCount) {
        throw new Error(`The pages ${sourcePath} and ${previousSourcePath} have the same output path "${outputPath}". Use distinct 'url' values to resolve the conflict.`);
      }
      // The page content didn't change
      if (previousHash === hash) {
        return false;
      }
    }
    log.info(`🔥 ${page.data.url} <- <gray>${sourcePath}</gray>`);
    await ensureDir(posix.dirname(filename));
    page.content instanceof Uint8Array ? await Deno.writeFile(filename, page.content) : await Deno.writeTextFile(filename, page.content);
    return true;
  }
  /**
   * Copy the static files in the dest folder
   */ async copyFiles(files) {
    const copyFiles = [];
    await concurrent(files, async (file)=>{
      if (await this.copyFile(file)) {
        copyFiles.push(file);
      }
    });
    return copyFiles;
  }
  /**
   * Copy a static file in the dest folder
   * Returns a boolean indicating if the file has saved
   */ async copyFile(file) {
    const { entry } = file;
    if (entry.flags.has("saved")) {
      return false;
    }
    entry.flags.add("saved");
    const pathTo = posix.join(this.dest, file.outputPath);
    try {
      await ensureDir(posix.dirname(pathTo));
      if (entry.flags.has("remote")) {
        await Deno.writeFile(pathTo, (await entry.getContent(binaryLoader)).content);
      } else {
        // Copy file https://github.com/denoland/deno/issues/19425
        Deno.writeFileSync(pathTo, Deno.readFileSync(entry.src));
      }
      log.info(`🔥 ${file.outputPath} <- <gray>${entry.flags.has("remote") ? entry.src : entry.path}</gray>`);
      return true;
    } catch (error) {
      log.error(`Failed to copy file: ${file.outputPath}: ${error.message}`);
    }
    return false;
  }
  /** Empty the dest folder */ async clear() {
    await emptyDir(this.dest);
    this.#outputs.clear();
  }
  async removeFiles(files) {
    await concurrent(files, async (file)=>{
      try {
        const outputPath = posix.join(this.dest, file);
        this.#outputs.delete(outputPath.toLowerCase());
        await Deno.remove(outputPath);
      } catch  {
      // Ignored
      }
    });
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvbHVtZUB2Mi4yLjAvY29yZS93cml0ZXIudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgcG9zaXggfSBmcm9tIFwiLi4vZGVwcy9wYXRoLnRzXCI7XG5pbXBvcnQgeyBlbXB0eURpciwgZW5zdXJlRGlyIH0gZnJvbSBcIi4uL2RlcHMvZnMudHNcIjtcbmltcG9ydCB7IGNvbmN1cnJlbnQgfSBmcm9tIFwiLi91dGlscy9jb25jdXJyZW50LnRzXCI7XG5pbXBvcnQgeyBzaGExIH0gZnJvbSBcIi4vdXRpbHMvZGlnZXN0LnRzXCI7XG5pbXBvcnQgeyBsb2cgfSBmcm9tIFwiLi91dGlscy9sb2cudHNcIjtcbmltcG9ydCBiaW5hcnlMb2FkZXIgZnJvbSBcIi4vbG9hZGVycy9iaW5hcnkudHNcIjtcblxuaW1wb3J0IHR5cGUgeyBQYWdlLCBTdGF0aWNGaWxlIH0gZnJvbSBcIi4vZmlsZS50c1wiO1xuXG5leHBvcnQgaW50ZXJmYWNlIE9wdGlvbnMge1xuICBkZXN0OiBzdHJpbmc7XG59XG5cbi8qKiBHZW5lcmljIGludGVyZmFjZSBmb3IgV3JpdGVyICovXG5leHBvcnQgaW50ZXJmYWNlIFdyaXRlciB7XG4gIHNhdmVQYWdlcyhwYWdlczogUGFnZVtdKTogUHJvbWlzZTxQYWdlW10+O1xuICBjb3B5RmlsZXMoZmlsZXM6IFN0YXRpY0ZpbGVbXSk6IFByb21pc2U8U3RhdGljRmlsZVtdPjtcbiAgY2xlYXIoKTogUHJvbWlzZTx2b2lkPjtcbiAgcmVtb3ZlRmlsZXMoZmlsZXM6IHN0cmluZ1tdKTogUHJvbWlzZTx2b2lkPjtcbn1cblxuLyoqXG4gKiBDbGFzcyB0byB3cml0ZSB0aGUgZ2VuZXJhdGVkIHBhZ2VzIGFuZCBzdGF0aWMgZmlsZXNcbiAqIGluIHRoZSBkZXN0IGZvbGRlci5cbiAqL1xuZXhwb3J0IGNsYXNzIEZTV3JpdGVyIGltcGxlbWVudHMgV3JpdGVyIHtcbiAgZGVzdDogc3RyaW5nO1xuXG4gICNvdXRwdXRzID0gbmV3IE1hcDxzdHJpbmcsIFtudW1iZXIsIHN0cmluZywgc3RyaW5nXT4oKTtcbiAgI3NhdmVDb3VudCA9IDA7XG5cbiAgY29uc3RydWN0b3Iob3B0aW9uczogT3B0aW9ucykge1xuICAgIHRoaXMuZGVzdCA9IG9wdGlvbnMuZGVzdDtcbiAgfVxuXG4gIC8qKlxuICAgKiBTYXZlIHRoZSBwYWdlcyBpbiB0aGUgZGVzdCBmb2xkZXJcbiAgICogUmV0dXJucyBhbiBhcnJheSBvZiBwYWdlcyB0aGF0IGhhdmUgYmVlbiBzYXZlZFxuICAgKi9cbiAgYXN5bmMgc2F2ZVBhZ2VzKHBhZ2VzOiBQYWdlW10pOiBQcm9taXNlPFBhZ2VbXT4ge1xuICAgIGNvbnN0IHNhdmVkUGFnZXM6IFBhZ2VbXSA9IFtdO1xuICAgICsrdGhpcy4jc2F2ZUNvdW50O1xuXG4gICAgYXdhaXQgY29uY3VycmVudChcbiAgICAgIHBhZ2VzLFxuICAgICAgYXN5bmMgKHBhZ2UpID0+IHtcbiAgICAgICAgaWYgKGF3YWl0IHRoaXMuc2F2ZVBhZ2UocGFnZSkpIHtcbiAgICAgICAgICBzYXZlZFBhZ2VzLnB1c2gocGFnZSk7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgKTtcblxuICAgIHJldHVybiBzYXZlZFBhZ2VzO1xuICB9XG5cbiAgLyoqXG4gICAqIFNhdmUgYSBwYWdlIGluIHRoZSBkZXN0IGZvbGRlclxuICAgKiBSZXR1cm5zIGEgYm9vbGVhbiBpbmRpY2F0aW5nIGlmIHRoZSBwYWdlIGhhcyBzYXZlZFxuICAgKi9cbiAgYXN5bmMgc2F2ZVBhZ2UocGFnZTogUGFnZSk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIGNvbnN0IHsgc291cmNlUGF0aCwgb3V0cHV0UGF0aCwgY29udGVudCB9ID0gcGFnZTtcbiAgICAvLyBJZ25vcmUgZW1wdHkgcGFnZXNcbiAgICBpZiAoIWNvbnRlbnQpIHtcbiAgICAgIGxvZy53YXJuKFxuICAgICAgICBgW0x1bWVdIDxjeWFuPlNraXBwZWQgcGFnZTwvY3lhbj4gJHtwYWdlLmRhdGEudXJsfSAoZmlsZSBjb250ZW50IGlzIGVtcHR5KWAsXG4gICAgICApO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGNvbnN0IGZpbGVuYW1lID0gcG9zaXguam9pbih0aGlzLmRlc3QsIG91dHB1dFBhdGgpO1xuICAgIGNvbnN0IGlkID0gZmlsZW5hbWUudG9Mb3dlckNhc2UoKTtcbiAgICBjb25zdCBoYXNoID0gYXdhaXQgc2hhMShjb250ZW50KTtcbiAgICBjb25zdCBwcmV2aW91cyA9IHRoaXMuI291dHB1dHMuZ2V0KGlkKTtcbiAgICB0aGlzLiNvdXRwdXRzLnNldChpZCwgW3RoaXMuI3NhdmVDb3VudCwgc291cmNlUGF0aCwgaGFzaF0pO1xuXG4gICAgaWYgKHByZXZpb3VzKSB7XG4gICAgICBjb25zdCBbcHJldmlvdXNDb3VudCwgcHJldmlvdXNTb3VyY2VQYXRoLCBwcmV2aW91c0hhc2hdID0gcHJldmlvdXM7XG5cbiAgICAgIGlmIChwcmV2aW91c0NvdW50ID09PSB0aGlzLiNzYXZlQ291bnQpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgIGBUaGUgcGFnZXMgJHtzb3VyY2VQYXRofSBhbmQgJHtwcmV2aW91c1NvdXJjZVBhdGh9IGhhdmUgdGhlIHNhbWUgb3V0cHV0IHBhdGggXCIke291dHB1dFBhdGh9XCIuIFVzZSBkaXN0aW5jdCAndXJsJyB2YWx1ZXMgdG8gcmVzb2x2ZSB0aGUgY29uZmxpY3QuYCxcbiAgICAgICAgKTtcbiAgICAgIH1cblxuICAgICAgLy8gVGhlIHBhZ2UgY29udGVudCBkaWRuJ3QgY2hhbmdlXG4gICAgICBpZiAocHJldmlvdXNIYXNoID09PSBoYXNoKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBsb2cuaW5mbyhg8J+UpSAke3BhZ2UuZGF0YS51cmx9IDwtIDxncmF5PiR7c291cmNlUGF0aH08L2dyYXk+YCk7XG5cbiAgICBhd2FpdCBlbnN1cmVEaXIocG9zaXguZGlybmFtZShmaWxlbmFtZSkpO1xuXG4gICAgcGFnZS5jb250ZW50IGluc3RhbmNlb2YgVWludDhBcnJheVxuICAgICAgPyBhd2FpdCBEZW5vLndyaXRlRmlsZShmaWxlbmFtZSwgcGFnZS5jb250ZW50KVxuICAgICAgOiBhd2FpdCBEZW5vLndyaXRlVGV4dEZpbGUoZmlsZW5hbWUsIHBhZ2UuY29udGVudCBhcyBzdHJpbmcpO1xuXG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICAvKipcbiAgICogQ29weSB0aGUgc3RhdGljIGZpbGVzIGluIHRoZSBkZXN0IGZvbGRlclxuICAgKi9cbiAgYXN5bmMgY29weUZpbGVzKGZpbGVzOiBTdGF0aWNGaWxlW10pOiBQcm9taXNlPFN0YXRpY0ZpbGVbXT4ge1xuICAgIGNvbnN0IGNvcHlGaWxlczogU3RhdGljRmlsZVtdID0gW107XG5cbiAgICBhd2FpdCBjb25jdXJyZW50KFxuICAgICAgZmlsZXMsXG4gICAgICBhc3luYyAoZmlsZSkgPT4ge1xuICAgICAgICBpZiAoYXdhaXQgdGhpcy5jb3B5RmlsZShmaWxlKSkge1xuICAgICAgICAgIGNvcHlGaWxlcy5wdXNoKGZpbGUpO1xuICAgICAgICB9XG4gICAgICB9LFxuICAgICk7XG5cbiAgICByZXR1cm4gY29weUZpbGVzO1xuICB9XG5cbiAgLyoqXG4gICAqIENvcHkgYSBzdGF0aWMgZmlsZSBpbiB0aGUgZGVzdCBmb2xkZXJcbiAgICogUmV0dXJucyBhIGJvb2xlYW4gaW5kaWNhdGluZyBpZiB0aGUgZmlsZSBoYXMgc2F2ZWRcbiAgICovXG4gIGFzeW5jIGNvcHlGaWxlKGZpbGU6IFN0YXRpY0ZpbGUpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICBjb25zdCB7IGVudHJ5IH0gPSBmaWxlO1xuXG4gICAgaWYgKGVudHJ5LmZsYWdzLmhhcyhcInNhdmVkXCIpKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgZW50cnkuZmxhZ3MuYWRkKFwic2F2ZWRcIik7XG4gICAgY29uc3QgcGF0aFRvID0gcG9zaXguam9pbih0aGlzLmRlc3QsIGZpbGUub3V0cHV0UGF0aCk7XG5cbiAgICB0cnkge1xuICAgICAgYXdhaXQgZW5zdXJlRGlyKHBvc2l4LmRpcm5hbWUocGF0aFRvKSk7XG5cbiAgICAgIGlmIChlbnRyeS5mbGFncy5oYXMoXCJyZW1vdGVcIikpIHtcbiAgICAgICAgYXdhaXQgRGVuby53cml0ZUZpbGUoXG4gICAgICAgICAgcGF0aFRvLFxuICAgICAgICAgIChhd2FpdCBlbnRyeS5nZXRDb250ZW50KGJpbmFyeUxvYWRlcikpLmNvbnRlbnQgYXMgVWludDhBcnJheSxcbiAgICAgICAgKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIENvcHkgZmlsZSBodHRwczovL2dpdGh1Yi5jb20vZGVub2xhbmQvZGVuby9pc3N1ZXMvMTk0MjVcbiAgICAgICAgRGVuby53cml0ZUZpbGVTeW5jKHBhdGhUbywgRGVuby5yZWFkRmlsZVN5bmMoZW50cnkuc3JjKSk7XG4gICAgICB9XG4gICAgICBsb2cuaW5mbyhcbiAgICAgICAgYPCflKUgJHtmaWxlLm91dHB1dFBhdGh9IDwtIDxncmF5PiR7XG4gICAgICAgICAgZW50cnkuZmxhZ3MuaGFzKFwicmVtb3RlXCIpID8gZW50cnkuc3JjIDogZW50cnkucGF0aFxuICAgICAgICB9PC9ncmF5PmAsXG4gICAgICApO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGxvZy5lcnJvcihgRmFpbGVkIHRvIGNvcHkgZmlsZTogJHtmaWxlLm91dHB1dFBhdGh9OiAke2Vycm9yLm1lc3NhZ2V9YCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgLyoqIEVtcHR5IHRoZSBkZXN0IGZvbGRlciAqL1xuICBhc3luYyBjbGVhcigpIHtcbiAgICBhd2FpdCBlbXB0eURpcih0aGlzLmRlc3QpO1xuICAgIHRoaXMuI291dHB1dHMuY2xlYXIoKTtcbiAgfVxuXG4gIGFzeW5jIHJlbW92ZUZpbGVzKGZpbGVzOiBzdHJpbmdbXSkge1xuICAgIGF3YWl0IGNvbmN1cnJlbnQoXG4gICAgICBmaWxlcyxcbiAgICAgIGFzeW5jIChmaWxlKSA9PiB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgY29uc3Qgb3V0cHV0UGF0aCA9IHBvc2l4LmpvaW4odGhpcy5kZXN0LCBmaWxlKTtcbiAgICAgICAgICB0aGlzLiNvdXRwdXRzLmRlbGV0ZShvdXRwdXRQYXRoLnRvTG93ZXJDYXNlKCkpO1xuICAgICAgICAgIGF3YWl0IERlbm8ucmVtb3ZlKG91dHB1dFBhdGgpO1xuICAgICAgICB9IGNhdGNoIHtcbiAgICAgICAgICAvLyBJZ25vcmVkXG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgKTtcbiAgfVxufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFNBQVMsS0FBSyxRQUFRLGtCQUFrQjtBQUN4QyxTQUFTLFFBQVEsRUFBRSxTQUFTLFFBQVEsZ0JBQWdCO0FBQ3BELFNBQVMsVUFBVSxRQUFRLHdCQUF3QjtBQUNuRCxTQUFTLElBQUksUUFBUSxvQkFBb0I7QUFDekMsU0FBUyxHQUFHLFFBQVEsaUJBQWlCO0FBQ3JDLE9BQU8sa0JBQWtCLHNCQUFzQjtBQWdCL0M7OztDQUdDLEdBQ0QsT0FBTyxNQUFNO0VBQ1gsS0FBYTtFQUViLENBQUMsT0FBTyxHQUFHLElBQUksTUFBd0M7RUFDdkQsQ0FBQyxTQUFTLEdBQUcsRUFBRTtFQUVmLFlBQVksT0FBZ0IsQ0FBRTtJQUM1QixJQUFJLENBQUMsSUFBSSxHQUFHLFFBQVEsSUFBSTtFQUMxQjtFQUVBOzs7R0FHQyxHQUNELE1BQU0sVUFBVSxLQUFhLEVBQW1CO0lBQzlDLE1BQU0sYUFBcUIsRUFBRTtJQUM3QixFQUFFLElBQUksQ0FBQyxDQUFDLFNBQVM7SUFFakIsTUFBTSxXQUNKLE9BQ0EsT0FBTztNQUNMLElBQUksTUFBTSxJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU87UUFDN0IsV0FBVyxJQUFJLENBQUM7TUFDbEI7SUFDRjtJQUdGLE9BQU87RUFDVDtFQUVBOzs7R0FHQyxHQUNE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