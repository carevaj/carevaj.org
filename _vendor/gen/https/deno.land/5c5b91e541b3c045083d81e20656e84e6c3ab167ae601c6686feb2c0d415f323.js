import { log } from "../core/utils/log.ts";
import { localIp } from "../core/utils/net.ts";
import { setEnv } from "../core/utils/env.ts";
import Server from "../core/server.ts";
import { SiteWatcher } from "../core/watcher.ts";
import logger from "../middlewares/logger.ts";
import noCache from "../middlewares/no_cache.ts";
import notFound from "../middlewares/not_found.ts";
import reload from "../middlewares/reload.ts";
import { createSite } from "./run.ts";
/** Build the website and optionally watch changes and serve the site */ export async function build(config, serve, watch) {
  const site = await createSite(config);
  performance.mark("start");
  await site.build();
  performance.mark("end");
  log.info(`🍾 Site built into <gray>${site.options.dest}</gray>`);
  const duration = performance.measure("duration", "start", "end").duration / 1000;
  const total = site.pages.length + site.files.length;
  log.info(`  <gray>${total} files generated in ${duration.toFixed(2)} seconds</gray>`);
  if (!serve && !watch) {
    // Prevent possible timers to keep the process alive forever (wait preventively 10 seconds)
    const id = setTimeout(()=>{
      log.warn("After waiting 10 seconds, there are some timers that avoid ending the process.");
      log.warn("They have been forcibly closed.");
      Deno.exit(0);
    }, 10000);
    Deno.unrefTimer(id);
    return;
  }
  // Set the live reload environment variable to add hash to the URLs in the module loader
  setEnv("LUME_LIVE_RELOAD", "true");
  // Start the watcher
  const watcher = site.getWatcher();
  watcher.addEventListener("change", (event)=>{
    const files = event.files;
    log.info("Changes detected:");
    files.forEach((file)=>log.info(`- <gray>${file}</gray>`));
    return site.update(files);
  });
  watcher.addEventListener("error", (event)=>{
    console.error(Deno.inspect(event.error, {
      colors: true
    }));
  });
  watcher.start();
  if (!serve) {
    return;
  }
  // Start the local server
  const { port, open, page404, middlewares } = site.options.server;
  const root = site.options.server.root || site.dest();
  const server = new Server({
    root,
    port
  });
  server.addEventListener("start", ()=>{
    const ipAddr = localIp();
    log.info("  Server started at:");
    log.info(`  <green>http://localhost:${port}/</green> (local)`);
    if (ipAddr) {
      log.info(`  <green>http://${ipAddr}:${port}/</green> (network)`);
    }
    if (open) {
      const commands = {
        darwin: "open",
        linux: "xdg-open",
        freebsd: "xdg-open",
        netbsd: "xdg-open",
        aix: "xdg-open",
        solaris: "xdg-open",
        illumos: "xdg-open",
        windows: "explorer"
      };
      new Deno.Command(commands[Deno.build.os], {
        args: [
          `http://localhost:${port}/`
        ],
        stdout: "inherit",
        stderr: "inherit"
      }).output();
    }
    site.dispatchEvent({
      type: "afterStartServer"
    });
  });
  if (log.level === 0) {
    server.use(logger());
  }
  server.use(reload({
    watcher: new SiteWatcher(site)
  }), noCache(), notFound({
    root,
    page404,
    directoryIndex: true
  }));
  if (middlewares) {
    server.use(...middlewares);
  }
  server.start();
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvbHVtZUB2Mi4yLjAvY2xpL2J1aWxkLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGxvZyB9IGZyb20gXCIuLi9jb3JlL3V0aWxzL2xvZy50c1wiO1xuaW1wb3J0IHsgbG9jYWxJcCB9IGZyb20gXCIuLi9jb3JlL3V0aWxzL25ldC50c1wiO1xuaW1wb3J0IHsgc2V0RW52IH0gZnJvbSBcIi4uL2NvcmUvdXRpbHMvZW52LnRzXCI7XG5pbXBvcnQgU2VydmVyIGZyb20gXCIuLi9jb3JlL3NlcnZlci50c1wiO1xuaW1wb3J0IHsgU2l0ZVdhdGNoZXIgfSBmcm9tIFwiLi4vY29yZS93YXRjaGVyLnRzXCI7XG5pbXBvcnQgbG9nZ2VyIGZyb20gXCIuLi9taWRkbGV3YXJlcy9sb2dnZXIudHNcIjtcbmltcG9ydCBub0NhY2hlIGZyb20gXCIuLi9taWRkbGV3YXJlcy9ub19jYWNoZS50c1wiO1xuaW1wb3J0IG5vdEZvdW5kIGZyb20gXCIuLi9taWRkbGV3YXJlcy9ub3RfZm91bmQudHNcIjtcbmltcG9ydCByZWxvYWQgZnJvbSBcIi4uL21pZGRsZXdhcmVzL3JlbG9hZC50c1wiO1xuaW1wb3J0IHsgY3JlYXRlU2l0ZSB9IGZyb20gXCIuL3J1bi50c1wiO1xuXG4vKiogQnVpbGQgdGhlIHdlYnNpdGUgYW5kIG9wdGlvbmFsbHkgd2F0Y2ggY2hhbmdlcyBhbmQgc2VydmUgdGhlIHNpdGUgKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBidWlsZChcbiAgY29uZmlnOiBzdHJpbmcgfCB1bmRlZmluZWQsXG4gIHNlcnZlPzogYm9vbGVhbixcbiAgd2F0Y2g/OiBib29sZWFuLFxuKSB7XG4gIGNvbnN0IHNpdGUgPSBhd2FpdCBjcmVhdGVTaXRlKGNvbmZpZyk7XG5cbiAgcGVyZm9ybWFuY2UubWFyayhcInN0YXJ0XCIpO1xuICBhd2FpdCBzaXRlLmJ1aWxkKCk7XG4gIHBlcmZvcm1hbmNlLm1hcmsoXCJlbmRcIik7XG5cbiAgbG9nLmluZm8oYPCfjb4gU2l0ZSBidWlsdCBpbnRvIDxncmF5PiR7c2l0ZS5vcHRpb25zLmRlc3R9PC9ncmF5PmApO1xuICBjb25zdCBkdXJhdGlvbiA9IHBlcmZvcm1hbmNlLm1lYXN1cmUoXCJkdXJhdGlvblwiLCBcInN0YXJ0XCIsIFwiZW5kXCIpLmR1cmF0aW9uIC9cbiAgICAxMDAwO1xuICBjb25zdCB0b3RhbCA9IHNpdGUucGFnZXMubGVuZ3RoICsgc2l0ZS5maWxlcy5sZW5ndGg7XG4gIGxvZy5pbmZvKFxuICAgIGAgIDxncmF5PiR7dG90YWx9IGZpbGVzIGdlbmVyYXRlZCBpbiAke2R1cmF0aW9uLnRvRml4ZWQoMil9IHNlY29uZHM8L2dyYXk+YCxcbiAgKTtcblxuICBpZiAoIXNlcnZlICYmICF3YXRjaCkge1xuICAgIC8vIFByZXZlbnQgcG9zc2libGUgdGltZXJzIHRvIGtlZXAgdGhlIHByb2Nlc3MgYWxpdmUgZm9yZXZlciAod2FpdCBwcmV2ZW50aXZlbHkgMTAgc2Vjb25kcylcbiAgICBjb25zdCBpZCA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgbG9nLndhcm4oXG4gICAgICAgIFwiQWZ0ZXIgd2FpdGluZyAxMCBzZWNvbmRzLCB0aGVyZSBhcmUgc29tZSB0aW1lcnMgdGhhdCBhdm9pZCBlbmRpbmcgdGhlIHByb2Nlc3MuXCIsXG4gICAgICApO1xuICAgICAgbG9nLndhcm4oXCJUaGV5IGhhdmUgYmVlbiBmb3JjaWJseSBjbG9zZWQuXCIpO1xuICAgICAgRGVuby5leGl0KDApO1xuICAgIH0sIDEwMDAwKTtcblxuICAgIERlbm8udW5yZWZUaW1lcihpZCk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgLy8gU2V0IHRoZSBsaXZlIHJlbG9hZCBlbnZpcm9ubWVudCB2YXJpYWJsZSB0byBhZGQgaGFzaCB0byB0aGUgVVJMcyBpbiB0aGUgbW9kdWxlIGxvYWRlclxuICBzZXRFbnYoXCJMVU1FX0xJVkVfUkVMT0FEXCIsIFwidHJ1ZVwiKTtcblxuICAvLyBTdGFydCB0aGUgd2F0Y2hlclxuICBjb25zdCB3YXRjaGVyID0gc2l0ZS5nZXRXYXRjaGVyKCk7XG5cbiAgd2F0Y2hlci5hZGRFdmVudExpc3RlbmVyKFwiY2hhbmdlXCIsIChldmVudCkgPT4ge1xuICAgIGNvbnN0IGZpbGVzID0gZXZlbnQuZmlsZXMhO1xuXG4gICAgbG9nLmluZm8oXCJDaGFuZ2VzIGRldGVjdGVkOlwiKTtcbiAgICBmaWxlcy5mb3JFYWNoKChmaWxlKSA9PiBsb2cuaW5mbyhgLSA8Z3JheT4ke2ZpbGV9PC9ncmF5PmApKTtcbiAgICByZXR1cm4gc2l0ZS51cGRhdGUoZmlsZXMpO1xuICB9KTtcblxuICB3YXRjaGVyLmFkZEV2ZW50TGlzdGVuZXIoXCJlcnJvclwiLCAoZXZlbnQpID0+IHtcbiAgICBjb25zb2xlLmVycm9yKERlbm8uaW5zcGVjdChldmVudC5lcnJvciwgeyBjb2xvcnM6IHRydWUgfSkpO1xuICB9KTtcblxuICB3YXRjaGVyLnN0YXJ0KCk7XG5cbiAgaWYgKCFzZXJ2ZSkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIC8vIFN0YXJ0IHRoZSBsb2NhbCBzZXJ2ZXJcbiAgY29uc3QgeyBwb3J0LCBvcGVuLCBwYWdlNDA0LCBtaWRkbGV3YXJlcyB9ID0gc2l0ZS5vcHRpb25zLnNlcnZlcjtcbiAgY29uc3Qgcm9vdCA9IHNpdGUub3B0aW9ucy5zZXJ2ZXIucm9vdCB8fCBzaXRlLmRlc3QoKTtcbiAgY29uc3Qgc2VydmVyID0gbmV3IFNlcnZlcih7IHJvb3QsIHBvcnQgfSk7XG5cbiAgc2VydmVyLmFkZEV2ZW50TGlzdGVuZXIoXCJzdGFydFwiLCAoKSA9PiB7XG4gICAgY29uc3QgaXBBZGRyID0gbG9jYWxJcCgpO1xuXG4gICAgbG9nLmluZm8oXCIgIFNlcnZlciBzdGFydGVkIGF0OlwiKTtcbiAgICBsb2cuaW5mbyhgICA8Z3JlZW4+aHR0cDovL2xvY2FsaG9zdDoke3BvcnR9LzwvZ3JlZW4+IChsb2NhbClgKTtcblxuICAgIGlmIChpcEFkZHIpIHtcbiAgICAgIGxvZy5pbmZvKGAgIDxncmVlbj5odHRwOi8vJHtpcEFkZHJ9OiR7cG9ydH0vPC9ncmVlbj4gKG5ldHdvcmspYCk7XG4gICAgfVxuXG4gICAgaWYgKG9wZW4pIHtcbiAgICAgIGNvbnN0IGNvbW1hbmRzOiBSZWNvcmQ8dHlwZW9mIERlbm8uYnVpbGQub3MsIHN0cmluZz4gPSB7XG4gICAgICAgIGRhcndpbjogXCJvcGVuXCIsXG4gICAgICAgIGxpbnV4OiBcInhkZy1vcGVuXCIsXG4gICAgICAgIGZyZWVic2Q6IFwieGRnLW9wZW5cIixcbiAgICAgICAgbmV0YnNkOiBcInhkZy1vcGVuXCIsXG4gICAgICAgIGFpeDogXCJ4ZGctb3BlblwiLFxuICAgICAgICBzb2xhcmlzOiBcInhkZy1vcGVuXCIsXG4gICAgICAgIGlsbHVtb3M6IFwieGRnLW9wZW5cIixcbiAgICAgICAgd2luZG93czogXCJleHBsb3JlclwiLFxuICAgICAgfTtcblxuICAgICAgbmV3IERlbm8uQ29tbWFuZChjb21tYW5kc1tEZW5vLmJ1aWxkLm9zXSwge1xuICAgICAgICBhcmdzOiBbYGh0dHA6Ly9sb2NhbGhvc3Q6JHtwb3J0fS9gXSxcbiAgICAgICAgc3Rkb3V0OiBcImluaGVyaXRcIixcbiAgICAgICAgc3RkZXJyOiBcImluaGVyaXRcIixcbiAgICAgIH0pLm91dHB1dCgpO1xuICAgIH1cblxuICAgIHNpdGUuZGlzcGF0Y2hFdmVudCh7IHR5cGU6IFwiYWZ0ZXJTdGFydFNlcnZlclwiIH0pO1xuICB9KTtcblxuICBpZiAobG9nLmxldmVsID09PSAwKSB7XG4gICAgc2VydmVyLnVzZShsb2dnZXIoKSk7XG4gIH1cblxuICBzZXJ2ZXIudXNlKFxuICAgIHJlbG9hZCh7IHdhdGNoZXI6IG5ldyBTaXRlV2F0Y2hlcihzaXRlKSB9KSxcbiAgICBub0NhY2hlKCksXG4gICAgbm90Rm91bmQoe1xuICAgICAgcm9vdCxcbiAgICAgIHBhZ2U0MDQsXG4gICAgICBkaXJlY3RvcnlJbmRleDogdHJ1ZSxcbiAgICB9KSxcbiAgKTtcblxuICBpZiAobWlkZGxld2FyZXMpIHtcbiAgICBzZXJ2ZXIudXNlKC4uLm1pZGRsZXdhcmVzKTtcbiAgfVxuXG4gIHNlcnZlci5zdGFydCgpO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFNBQVMsR0FBRyxRQUFRLHVCQUF1QjtBQUMzQyxTQUFTLE9BQU8sUUFBUSx1QkFBdUI7QUFDL0MsU0FBUyxNQUFNLFFBQVEsdUJBQXVCO0FBQzlDLE9BQU8sWUFBWSxvQkFBb0I7QUFDdkMsU0FBUyxXQUFXLFFBQVEscUJBQXFCO0FBQ2pELE9BQU8sWUFBWSwyQkFBMkI7QUFDOUMsT0FBTyxhQUFhLDZCQUE2QjtBQUNqRCxPQUFPLGNBQWMsOEJBQThCO0FBQ25ELE9BQU8sWUFBWSwyQkFBMkI7QUFDOUMsU0FBUyxVQUFVLFFBQVEsV0FBVztBQUV0QyxzRUFBc0UsR0FDdEUsT0FBTyxlQUFlLE1BQ3BCLE1BQTBCLEVBQzFCLEtBQWUsRUFDZixLQUFlO0VBRWYsTUFBTSxPQUFPLE1BQU0sV0FBVztFQUU5QixZQUFZLElBQUksQ0FBQztFQUNqQixNQUFNLEtBQUssS0FBSztFQUNoQixZQUFZLElBQUksQ0FBQztFQUVqQixJQUFJLElBQUksQ0FBQyxDQUFDLHlCQUF5QixFQUFFLEtBQUssT0FBTyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUM7RUFDL0QsTUFBTSxXQUFXLFlBQVksT0FBTyxDQUFDLFlBQVksU0FBUyxPQUFPLFFBQVEsR0FDdkU7RUFDRixNQUFNLFFBQVEsS0FBSyxLQUFLLENBQUMsTUFBTSxHQUFHLEtBQUssS0FBSyxDQUFDLE1BQU07RUFDbkQsSUFBSSxJQUFJLENBQ04sQ0FBQyxRQUFRLEVBQUUsTUFBTSxvQkFBb0IsRUFBRSxTQUFTLE9BQU8sQ0FBQyxHQUFHLGVBQWUsQ0FBQztFQUc3RSxJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU87SUFDcEIsMkZBQTJGO0lBQzNGLE1BQU0sS0FBSyxXQUFXO01BQ3BCLElBQUksSUFBSSxDQUNOO01BRUYsSUFBSSxJQUFJLENBQUM7TUFDVCxLQUFLLElBQUksQ0FBQztJQUNaLEdBQUc7SUFFSCxLQUFLLFVBQVUsQ0FBQztJQUNoQjtFQUNGO0VBRUEsd0ZBQXdGO0VBQ3hGLE9BQU8sb0JBQW9CO0VBRTNCLG9CQUFvQjtFQUNwQixNQUFNLFVBQVUsS0FBSyxVQUFVO0VBRS9CLFFBQVEsZ0JBQWdCLENBQUMsVUFBVSxDQUFDO0lBQ2xDLE1BQU0sUUFBUSxNQUFNLEtBQUs7SUFFekIsSUFBSSxJQUFJLENBQUM7SUFDVCxNQUFNLE9BQU8sQ0FBQyxDQUFDLE9BQVMsSUFBSSxJQUFJLENBQUMsQ0FBQyxRQUFRLEVBQUUsS0FBSyxPQUFPLENBQUM7SUFDekQsT0FBTyxLQUFLLE1BQU0sQ0FBQztFQUNyQjtFQUVBLFFBQVEsZ0JBQWdCLENBQUMsU0FBUyxDQUFDO0lBQ2pDLFFBQVEsS0FBSyxDQUFDLEtBQUssT0FBTyxDQUFDLE1BQU0sS0FBSyxFQUFFO01BQUUsUUFBUTtJQUFLO0VBQ3pEO0VBRUEsUUFBUSxLQUFLO0VBRWIsSUFBSSxDQUFDLE9BQU87SUFDVjtFQUNGO0VBRUEseUJBQXlCO0VBQ3pCLE1BQU0sRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxXQUFXLEVBQUUsR0FBRyxLQUFLLE9BQU8sQ0FBQyxNQUFNO0VBQ2hFLE1BQU0sT0FBTyxLQUFLLE9BQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSxJQUFJLEtBQUssSUFBSTtFQUNsRCxNQUFNLFNBQVMsSUFBSSxPQUFPO0lBQUU7SUFBTTtFQUFLO0VBRXZDLE9BQU8sZ0JBQWdCLENBQUMsU0FBUztJQUMvQixNQUFNLFNBQVM7SUFFZixJQUFJLElBQUksQ0FBQztJQUNULElBQUksSUFBSSxDQUFDLENBQUMsMEJBQTBCLEVBQUUsS0FBSyxpQkFBaUIsQ0FBQztJQUU3RCxJQUFJLFFBQVE7TUFDVixJQUFJLElBQUksQ0FBQyxDQUFDLGdCQUFnQixFQUFFLE9BQU8sQ0FBQyxFQUFFLEtBQUssbUJBQW1CLENBQUM7SUFDakU7SUFFQSxJQUFJLE1BQU07TUFDUixNQUFNLFdBQWlEO1FBQ3JELFFBQVE7UUFDUixPQUFPO1FBQ1AsU0FBUztRQUNULFFBQVE7UUFDUixLQUFLO1FBQ0wsU0FBUztRQUNULFNBQVM7UUFDVCxTQUFTO01BQ1g7TUFFQSxJQUFJLEtBQUssT0FBTyxDQUFDLFFBQVEsQ0FBQyxLQUFLLEtBQUssQ0FBQyxFQUFFLENBQUMsRUFBRTtRQUN4QyxNQUFNO1VBQUMsQ0FBQyxpQkFBaUIsRUFBRSxLQUFLLENBQUMsQ0FBQztTQUFDO1FBQ25DLFFBQVE7UUFDUixRQUFRO01BQ1YsR0FBRyxNQUFNO0lBQ1g7SUFFQSxLQUFLLGFBQWEsQ0FBQztNQUFFLE1BQU07SUFBbUI7RUFDaEQ7RUFFQSxJQUFJLElBQUksS0FBSyxLQUFLLEdBQUc7SUFDbkIsT0FBTyxHQUFHLENBQUM7RUFDYjtFQUVBLE9BQU8sR0FBRyxDQUNSLE9BQU87SUFBRSxTQUFTLElBQUksWUFBWTtFQUFNLElBQ3hDLFdBQ0EsU0FBUztJQUNQO0lBQ0E7SUFDQSxnQkFBZ0I7RUFDbEI7RUFHRixJQUFJLGFBQWE7SUFDZixPQUFPLEdBQUcsSUFBSTtFQUNoQjtFQUVBLE9BQU8sS0FBSztBQUNkIn0=