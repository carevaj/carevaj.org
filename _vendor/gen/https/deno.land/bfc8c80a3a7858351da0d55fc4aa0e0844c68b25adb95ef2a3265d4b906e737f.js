import lume from "../mod.ts";
import { toFileUrl } from "../deps/path.ts";
import { isUrl } from "../core/utils/path.ts";
import { getConfigFile } from "../core/utils/lume_config.ts";
import { log } from "../core/utils/log.ts";
/** Run one or more custom scripts */ export async function run(config, scripts) {
  const site = await createSite(config);
  for (const script of scripts){
    const success = await site.run(script);
    if (!success) {
      addEventListener("unload", ()=>Deno.exit(1));
      break;
    }
  }
}
/** Create a site instance */ export async function createSite(config) {
  let url;
  if (config && isUrl(config)) {
    url = config;
  } else {
    const path = await getConfigFile(config);
    if (path) {
      url = toFileUrl(path).href;
    }
  }
  if (url) {
    log.info(`Loading config file <gray>${url}</gray>`);
    const mod = await import(url);
    if (!mod.default) {
      log.critical(`[Lume] Missing Site instance! Ensure your config file does export the Site instance as default.`);
      throw new Error("Site instance is not found");
    }
    return mod.default;
  }
  return lume();
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvbHVtZUB2Mi4yLjAvY2xpL3J1bi50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgbHVtZSBmcm9tIFwiLi4vbW9kLnRzXCI7XG5pbXBvcnQgeyB0b0ZpbGVVcmwgfSBmcm9tIFwiLi4vZGVwcy9wYXRoLnRzXCI7XG5pbXBvcnQgeyBpc1VybCB9IGZyb20gXCIuLi9jb3JlL3V0aWxzL3BhdGgudHNcIjtcbmltcG9ydCB7IGdldENvbmZpZ0ZpbGUgfSBmcm9tIFwiLi4vY29yZS91dGlscy9sdW1lX2NvbmZpZy50c1wiO1xuaW1wb3J0IHsgbG9nIH0gZnJvbSBcIi4uL2NvcmUvdXRpbHMvbG9nLnRzXCI7XG5cbmltcG9ydCB0eXBlIFNpdGUgZnJvbSBcIi4uL2NvcmUvc2l0ZS50c1wiO1xuXG4vKiogUnVuIG9uZSBvciBtb3JlIGN1c3RvbSBzY3JpcHRzICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcnVuKFxuICBjb25maWc6IHN0cmluZyB8IHVuZGVmaW5lZCxcbiAgc2NyaXB0czogc3RyaW5nW10sXG4pIHtcbiAgY29uc3Qgc2l0ZSA9IGF3YWl0IGNyZWF0ZVNpdGUoY29uZmlnKTtcblxuICBmb3IgKGNvbnN0IHNjcmlwdCBvZiBzY3JpcHRzKSB7XG4gICAgY29uc3Qgc3VjY2VzcyA9IGF3YWl0IHNpdGUucnVuKHNjcmlwdCk7XG5cbiAgICBpZiAoIXN1Y2Nlc3MpIHtcbiAgICAgIGFkZEV2ZW50TGlzdGVuZXIoXCJ1bmxvYWRcIiwgKCkgPT4gRGVuby5leGl0KDEpKTtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxufVxuXG4vKiogQ3JlYXRlIGEgc2l0ZSBpbnN0YW5jZSAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGNyZWF0ZVNpdGUoY29uZmlnPzogc3RyaW5nKTogUHJvbWlzZTxTaXRlPiB7XG4gIGxldCB1cmw6IHN0cmluZyB8IHVuZGVmaW5lZDtcblxuICBpZiAoY29uZmlnICYmIGlzVXJsKGNvbmZpZykpIHtcbiAgICB1cmwgPSBjb25maWc7XG4gIH0gZWxzZSB7XG4gICAgY29uc3QgcGF0aCA9IGF3YWl0IGdldENvbmZpZ0ZpbGUoY29uZmlnKTtcblxuICAgIGlmIChwYXRoKSB7XG4gICAgICB1cmwgPSB0b0ZpbGVVcmwocGF0aCkuaHJlZjtcbiAgICB9XG4gIH1cblxuICBpZiAodXJsKSB7XG4gICAgbG9nLmluZm8oYExvYWRpbmcgY29uZmlnIGZpbGUgPGdyYXk+JHt1cmx9PC9ncmF5PmApO1xuICAgIGNvbnN0IG1vZCA9IGF3YWl0IGltcG9ydCh1cmwpO1xuICAgIGlmICghbW9kLmRlZmF1bHQpIHtcbiAgICAgIGxvZy5jcml0aWNhbChcbiAgICAgICAgYFtMdW1lXSBNaXNzaW5nIFNpdGUgaW5zdGFuY2UhIEVuc3VyZSB5b3VyIGNvbmZpZyBmaWxlIGRvZXMgZXhwb3J0IHRoZSBTaXRlIGluc3RhbmNlIGFzIGRlZmF1bHQuYCxcbiAgICAgICk7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJTaXRlIGluc3RhbmNlIGlzIG5vdCBmb3VuZFwiKTtcbiAgICB9XG4gICAgcmV0dXJuIG1vZC5kZWZhdWx0O1xuICB9XG5cbiAgcmV0dXJuIGx1bWUoKTtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLFVBQVUsWUFBWTtBQUM3QixTQUFTLFNBQVMsUUFBUSxrQkFBa0I7QUFDNUMsU0FBUyxLQUFLLFFBQVEsd0JBQXdCO0FBQzlDLFNBQVMsYUFBYSxRQUFRLCtCQUErQjtBQUM3RCxTQUFTLEdBQUcsUUFBUSx1QkFBdUI7QUFJM0MsbUNBQW1DLEdBQ25DLE9BQU8sZUFBZSxJQUNwQixNQUEwQixFQUMxQixPQUFpQjtFQUVqQixNQUFNLE9BQU8sTUFBTSxXQUFXO0VBRTlCLEtBQUssTUFBTSxVQUFVLFFBQVM7SUFDNUIsTUFBTSxVQUFVLE1BQU0sS0FBSyxHQUFHLENBQUM7SUFFL0IsSUFBSSxDQUFDLFNBQVM7TUFDWixpQkFBaUIsVUFBVSxJQUFNLEtBQUssSUFBSSxDQUFDO01BQzNDO0lBQ0Y7RUFDRjtBQUNGO0FBRUEsMkJBQTJCLEdBQzNCLE9BQU8sZUFBZSxXQUFXLE1BQWU7RUFDOUMsSUFBSTtFQUVKLElBQUksVUFBVSxNQUFNLFNBQVM7SUFDM0IsTUFBTTtFQUNSLE9BQU87SUFDTCxNQUFNLE9BQU8sTUFBTSxjQUFjO0lBRWpDLElBQUksTUFBTTtNQUNSLE1BQU0sVUFBVSxNQUFNLElBQUk7SUFDNUI7RUFDRjtFQUVBLElBQUksS0FBSztJQUNQLElBQUksSUFBSSxDQUFDLENBQUMsMEJBQTBCLEVBQUUsSUFBSSxPQUFPLENBQUM7SUFDbEQsTUFBTSxNQUFNLE1BQU0sTUFBTSxDQUFDO0lBQ3pCLElBQUksQ0FBQyxJQUFJLE9BQU8sRUFBRTtNQUNoQixJQUFJLFFBQVEsQ0FDVixDQUFDLCtGQUErRixDQUFDO01BRW5HLE1BQU0sSUFBSSxNQUFNO0lBQ2xCO0lBQ0EsT0FBTyxJQUFJLE9BQU87RUFDcEI7RUFFQSxPQUFPO0FBQ1QifQ==