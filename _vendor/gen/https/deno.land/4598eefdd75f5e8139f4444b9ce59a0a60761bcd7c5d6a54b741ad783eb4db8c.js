/// <reference lib="deno.unstable" />
// Deno.Server.shutdown() is unstable
import { posix } from "../deps/path.ts";
import Events from "./events.ts";
import { serveFile as HttpServeFile } from "../deps/http.ts";
export const defaults = {
  root: `${Deno.cwd()}/_site`,
  port: 8000
};
export default class Server {
  events = new Events();
  options;
  middlewares = [];
  #server;
  constructor(options = {}){
    this.options = {
      ...defaults,
      ...options
    };
  }
  /** Register one or more middlewares */ use(...middleware) {
    this.middlewares.push(...middleware);
    return this;
  }
  /** Add a listener to an event */ addEventListener(type, listener, options) {
    this.events.addEventListener(type, listener, options);
    return this;
  }
  /** Dispatch an event */ dispatchEvent(event) {
    return this.events.dispatchEvent(event);
  }
  /** Start the server */ start(signal) {
    this.#server = Deno.serve({
      ...this.options,
      signal,
      onListen: ()=>this.dispatchEvent({
          type: "start"
        })
    }, this.handle.bind(this));
  }
  /** Stops the server */ stop() {
    try {
      this.#server?.shutdown();
    } catch (error) {
      this.dispatchEvent({
        type: "error",
        error
      });
    }
  }
  /** Handle a http request event */ async handle(request, info) {
    const middlewares = [
      ...this.middlewares
    ];
    const next = async (request)=>{
      const middleware = middlewares.shift();
      if (middleware) {
        return await middleware(request, next, info);
      }
      return await serveFile(this.options.root, request);
    };
    return await next(request);
  }
}
/** Server a static file */ export async function serveFile(root, request) {
  const url = new URL(request.url);
  const pathname = decodeURIComponent(url.pathname);
  const path = posix.join(root, pathname);
  try {
    const file = path.endsWith("/") ? path + "index.html" : path;
    // Redirect /example to /example/
    const info = await Deno.stat(file);
    if (info.isDirectory) {
      return new Response(null, {
        status: 301,
        headers: {
          location: posix.join(pathname, "/")
        }
      });
    }
    // Serve the static file
    return await HttpServeFile(request, file);
  } catch  {
    try {
      // Exists a HTML file with this name?
      if (!posix.extname(path)) {
        return await HttpServeFile(request, path + ".html");
      }
    } catch  {
    // Continue
    }
    return new Response("Not found", {
      status: 404
    });
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvbHVtZUB2Mi4yLjAvY29yZS9zZXJ2ZXIudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8vIDxyZWZlcmVuY2UgbGliPVwiZGVuby51bnN0YWJsZVwiIC8+XG4vLyBEZW5vLlNlcnZlci5zaHV0ZG93bigpIGlzIHVuc3RhYmxlXG5cbmltcG9ydCB7IHBvc2l4IH0gZnJvbSBcIi4uL2RlcHMvcGF0aC50c1wiO1xuaW1wb3J0IEV2ZW50cyBmcm9tIFwiLi9ldmVudHMudHNcIjtcbmltcG9ydCB7IHNlcnZlRmlsZSBhcyBIdHRwU2VydmVGaWxlIH0gZnJvbSBcIi4uL2RlcHMvaHR0cC50c1wiO1xuXG5pbXBvcnQgdHlwZSB7IEV2ZW50LCBFdmVudExpc3RlbmVyLCBFdmVudE9wdGlvbnMgfSBmcm9tIFwiLi9ldmVudHMudHNcIjtcblxuLyoqIFRoZSBvcHRpb25zIHRvIGNvbmZpZ3VyZSB0aGUgbG9jYWwgc2VydmVyICovXG5leHBvcnQgaW50ZXJmYWNlIE9wdGlvbnMgZXh0ZW5kcyBEZW5vLlNlcnZlT3B0aW9ucyB7XG4gIC8qKiBUaGUgcm9vdCBwYXRoICovXG4gIHJvb3Q6IHN0cmluZztcbn1cblxuZXhwb3J0IGNvbnN0IGRlZmF1bHRzOiBPcHRpb25zID0ge1xuICByb290OiBgJHtEZW5vLmN3ZCgpfS9fc2l0ZWAsXG4gIHBvcnQ6IDgwMDAsXG59O1xuXG5leHBvcnQgdHlwZSBSZXF1ZXN0SGFuZGxlciA9IChyZXE6IFJlcXVlc3QpID0+IFByb21pc2U8UmVzcG9uc2U+O1xuZXhwb3J0IHR5cGUgTWlkZGxld2FyZSA9IChcbiAgcmVxOiBSZXF1ZXN0LFxuICBuZXh0OiBSZXF1ZXN0SGFuZGxlcixcbiAgaW5mbzogRGVuby5TZXJ2ZUhhbmRsZXJJbmZvLFxuKSA9PiBQcm9taXNlPFJlc3BvbnNlPjtcblxuLyoqIEN1c3RvbSBldmVudHMgZm9yIHNlcnZlciAqL1xuZXhwb3J0IGludGVyZmFjZSBTZXJ2ZXJFdmVudCBleHRlbmRzIEV2ZW50IHtcbiAgLyoqIFRoZSBldmVudCB0eXBlICovXG4gIHR5cGU6IFNlcnZlckV2ZW50VHlwZTtcblxuICAvKiogVGhlIHJlcXVlc3Qgb2JqZWN0ICovXG4gIHJlcXVlc3Q/OiBSZXF1ZXN0O1xuXG4gIC8qKiBUaGUgZXJyb3Igb2JqZWN0IChvbmx5IGZvciBcImVycm9yXCIgZXZlbnRzKSAqL1xuICBlcnJvcj86IEVycm9yO1xufVxuXG4vKiogVGhlIGF2YWlsYWJsZSBldmVudCB0eXBlcyAqL1xuZXhwb3J0IHR5cGUgU2VydmVyRXZlbnRUeXBlID1cbiAgfCBcInN0YXJ0XCJcbiAgfCBcImVycm9yXCI7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFNlcnZlciB7XG4gIGV2ZW50czogRXZlbnRzPFNlcnZlckV2ZW50PiA9IG5ldyBFdmVudHM8U2VydmVyRXZlbnQ+KCk7XG4gIG9wdGlvbnM6IE9wdGlvbnM7XG4gIG1pZGRsZXdhcmVzOiBNaWRkbGV3YXJlW10gPSBbXTtcbiAgI3NlcnZlcj86IERlbm8uSHR0cFNlcnZlcjtcblxuICBjb25zdHJ1Y3RvcihvcHRpb25zOiBQYXJ0aWFsPE9wdGlvbnM+ID0ge30pIHtcbiAgICB0aGlzLm9wdGlvbnMgPSB7IC4uLmRlZmF1bHRzLCAuLi5vcHRpb25zIH07XG4gIH1cblxuICAvKiogUmVnaXN0ZXIgb25lIG9yIG1vcmUgbWlkZGxld2FyZXMgKi9cbiAgdXNlKC4uLm1pZGRsZXdhcmU6IE1pZGRsZXdhcmVbXSkge1xuICAgIHRoaXMubWlkZGxld2FyZXMucHVzaCguLi5taWRkbGV3YXJlKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKiBBZGQgYSBsaXN0ZW5lciB0byBhbiBldmVudCAqL1xuICBhZGRFdmVudExpc3RlbmVyKFxuICAgIHR5cGU6IFNlcnZlckV2ZW50VHlwZSxcbiAgICBsaXN0ZW5lcjogRXZlbnRMaXN0ZW5lcjxTZXJ2ZXJFdmVudD4sXG4gICAgb3B0aW9ucz86IEV2ZW50T3B0aW9ucyxcbiAgKSB7XG4gICAgdGhpcy5ldmVudHMuYWRkRXZlbnRMaXN0ZW5lcih0eXBlLCBsaXN0ZW5lciwgb3B0aW9ucyk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKiogRGlzcGF0Y2ggYW4gZXZlbnQgKi9cbiAgZGlzcGF0Y2hFdmVudChldmVudDogU2VydmVyRXZlbnQpIHtcbiAgICByZXR1cm4gdGhpcy5ldmVudHMuZGlzcGF0Y2hFdmVudChldmVudCk7XG4gIH1cblxuICAvKiogU3RhcnQgdGhlIHNlcnZlciAqL1xuICBzdGFydChzaWduYWw/OiBEZW5vLlNlcnZlT3B0aW9uc1tcInNpZ25hbFwiXSkge1xuICAgIHRoaXMuI3NlcnZlciA9IERlbm8uc2VydmUoe1xuICAgICAgLi4udGhpcy5vcHRpb25zLFxuICAgICAgc2lnbmFsLFxuICAgICAgb25MaXN0ZW46ICgpID0+IHRoaXMuZGlzcGF0Y2hFdmVudCh7IHR5cGU6IFwic3RhcnRcIiB9KSxcbiAgICB9LCB0aGlzLmhhbmRsZS5iaW5kKHRoaXMpKTtcbiAgfVxuXG4gIC8qKiBTdG9wcyB0aGUgc2VydmVyICovXG4gIHN0b3AoKSB7XG4gICAgdHJ5IHtcbiAgICAgIHRoaXMuI3NlcnZlcj8uc2h1dGRvd24oKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgdGhpcy5kaXNwYXRjaEV2ZW50KHtcbiAgICAgICAgdHlwZTogXCJlcnJvclwiLFxuICAgICAgICBlcnJvcixcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBIYW5kbGUgYSBodHRwIHJlcXVlc3QgZXZlbnQgKi9cbiAgYXN5bmMgaGFuZGxlKFxuICAgIHJlcXVlc3Q6IFJlcXVlc3QsXG4gICAgaW5mbzogRGVuby5TZXJ2ZUhhbmRsZXJJbmZvLFxuICApOiBQcm9taXNlPFJlc3BvbnNlPiB7XG4gICAgY29uc3QgbWlkZGxld2FyZXMgPSBbLi4udGhpcy5taWRkbGV3YXJlc107XG5cbiAgICBjb25zdCBuZXh0OiBSZXF1ZXN0SGFuZGxlciA9IGFzeW5jIChcbiAgICAgIHJlcXVlc3Q6IFJlcXVlc3QsXG4gICAgKTogUHJvbWlzZTxSZXNwb25zZT4gPT4ge1xuICAgICAgY29uc3QgbWlkZGxld2FyZSA9IG1pZGRsZXdhcmVzLnNoaWZ0KCk7XG5cbiAgICAgIGlmIChtaWRkbGV3YXJlKSB7XG4gICAgICAgIHJldHVybiBhd2FpdCBtaWRkbGV3YXJlKHJlcXVlc3QsIG5leHQsIGluZm8pO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gYXdhaXQgc2VydmVGaWxlKHRoaXMub3B0aW9ucy5yb290LCByZXF1ZXN0KTtcbiAgICB9O1xuXG4gICAgcmV0dXJuIGF3YWl0IG5leHQocmVxdWVzdCk7XG4gIH1cbn1cblxuLyoqIFNlcnZlciBhIHN0YXRpYyBmaWxlICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc2VydmVGaWxlKFxuICByb290OiBzdHJpbmcsXG4gIHJlcXVlc3Q6IFJlcXVlc3QsXG4pOiBQcm9taXNlPFJlc3BvbnNlPiB7XG4gIGNvbnN0IHVybCA9IG5ldyBVUkwocmVxdWVzdC51cmwpO1xuICBjb25zdCBwYXRobmFtZSA9IGRlY29kZVVSSUNvbXBvbmVudCh1cmwucGF0aG5hbWUpO1xuICBjb25zdCBwYXRoID0gcG9zaXguam9pbihyb290LCBwYXRobmFtZSk7XG5cbiAgdHJ5IHtcbiAgICBjb25zdCBmaWxlID0gcGF0aC5lbmRzV2l0aChcIi9cIikgPyBwYXRoICsgXCJpbmRleC5odG1sXCIgOiBwYXRoO1xuXG4gICAgLy8gUmVkaXJlY3QgL2V4YW1wbGUgdG8gL2V4YW1wbGUvXG4gICAgY29uc3QgaW5mbyA9IGF3YWl0IERlbm8uc3RhdChmaWxlKTtcblxuICAgIGlmIChpbmZvLmlzRGlyZWN0b3J5KSB7XG4gICAgICByZXR1cm4gbmV3IFJlc3BvbnNlKG51bGwsIHtcbiAgICAgICAgc3RhdHVzOiAzMDEsXG4gICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICBsb2NhdGlvbjogcG9zaXguam9pbihwYXRobmFtZSwgXCIvXCIpLFxuICAgICAgICB9LFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gU2VydmUgdGhlIHN0YXRpYyBmaWxlXG4gICAgcmV0dXJuIGF3YWl0IEh0dHBTZXJ2ZUZpbGUocmVxdWVzdCwgZmlsZSk7XG4gIH0gY2F0Y2gge1xuICAgIHRyeSB7XG4gICAgICAvLyBFeGlzdHMgYSBIVE1MIGZpbGUgd2l0aCB0aGlzIG5hbWU/XG4gICAgICBpZiAoIXBvc2l4LmV4dG5hbWUocGF0aCkpIHtcbiAgICAgICAgcmV0dXJuIGF3YWl0IEh0dHBTZXJ2ZUZpbGUocmVxdWVzdCwgcGF0aCArIFwiLmh0bWxcIik7XG4gICAgICB9XG4gICAgfSBjYXRjaCB7XG4gICAgICAvLyBDb250aW51ZVxuICAgIH1cblxuICAgIHJldHVybiBuZXcgUmVzcG9uc2UoXG4gICAgICBcIk5vdCBmb3VuZFwiLFxuICAgICAgeyBzdGF0dXM6IDQwNCB9LFxuICAgICk7XG4gIH1cbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxxQ0FBcUM7QUFDckMscUNBQXFDO0FBRXJDLFNBQVMsS0FBSyxRQUFRLGtCQUFrQjtBQUN4QyxPQUFPLFlBQVksY0FBYztBQUNqQyxTQUFTLGFBQWEsYUFBYSxRQUFRLGtCQUFrQjtBQVU3RCxPQUFPLE1BQU0sV0FBb0I7RUFDL0IsTUFBTSxDQUFDLEVBQUUsS0FBSyxHQUFHLEdBQUcsTUFBTSxDQUFDO0VBQzNCLE1BQU07QUFDUixFQUFFO0FBMEJGLGVBQWUsTUFBTTtFQUNuQixTQUE4QixJQUFJLFNBQXNCO0VBQ3hELFFBQWlCO0VBQ2pCLGNBQTRCLEVBQUUsQ0FBQztFQUMvQixDQUFDLE1BQU0sQ0FBbUI7RUFFMUIsWUFBWSxVQUE0QixDQUFDLENBQUMsQ0FBRTtJQUMxQyxJQUFJLENBQUMsT0FBTyxHQUFHO01BQUUsR0FBRyxRQUFRO01BQUUsR0FBRyxPQUFPO0lBQUM7RUFDM0M7RUFFQSxxQ0FBcUMsR0FDckMsSUFBSSxHQUFHLFVBQXdCLEVBQUU7SUFDL0IsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLElBQUk7SUFDekIsT0FBTyxJQUFJO0VBQ2I7RUFFQSwrQkFBK0IsR0FDL0IsaUJBQ0UsSUFBcUIsRUFDckIsUUFBb0MsRUFDcEMsT0FBc0IsRUFDdEI7SUFDQSxJQUFJLENBQUMsTUFBTSxDQUFDLGdCQUFnQixDQUFDLE1BQU0sVUFBVTtJQUM3QyxPQUFPLElBQUk7RUFDYjtFQUVBLHNCQUFzQixHQUN0QixjQUFjLEtBQWtCLEVBQUU7SUFDaEMsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLGFBQWEsQ0FBQztFQUNuQztFQUVBLHFCQUFxQixHQUNyQixNQUFNLE1BQW9DLEVBQUU7SUFDMUMsSUFBSSxDQUFDLENBQUMsTUFBTSxHQUFHLEtBQUssS0FBSyxDQUFDO01BQ3hCLEdBQUcsSUFBSSxDQUFDLE9BQU87TUFDZjtNQUNBLFVBQVUsSUFBTSxJQUFJLENBQUMsYUFBYSxDQUFDO1VBQUUsTUFBTTtRQUFRO0lBQ3JELEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSTtFQUMxQjtFQUVBLHFCQUFxQixHQUNyQixPQUFPO0lBQ0wsSUFBSTtNQUNGLElBQUksQ0FBQyxDQUFDLE1BQU0sRUFBRTtJQUNoQixFQUFFLE9BQU8sT0FBTztNQUNkLElBQUksQ0FBQyxhQUFhLENBQUM7UUFDakIsTUFBTTtRQUNOO01BQ0Y7SUFDRjtFQUNGO0VBRUEsZ0NBQWdDLEdBQ2hDLE1BQU0sT0FDSixPQUFnQixFQUNoQixJQUEyQixFQUNSO0lBQ25CLE1BQU0sY0FBYztTQUFJLElBQUksQ0FBQyxXQUFXO0tBQUM7SUFFekMsTUFBTSxPQUF1QixPQUMzQjtNQUVBLE1BQU0sYUFBYSxZQUFZLEtBQUs7TUFFcEMsSUFBSSxZQUFZO1FBQ2QsT0FBTyxNQUFNLFdBQVcsU0FBUyxNQUFNO01BQ3pDO01BRUEsT0FBTyxNQUFNLFVBQVUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUU7SUFDNUM7SUFFQSxPQUFPLE1BQU0sS0FBSztFQUNwQjtBQUNGO0FBRUEseUJBQXlCLEdBQ3pCLE9BQU8sZUFBZSxVQUNwQixJQUFZLEVBQ1osT0FBZ0I7RUFFaEIsTUFBTSxNQUFNLElBQUksSUFBSSxRQUFRLEdBQUc7RUFDL0IsTUFBTSxXQUFXLG1CQUFtQixJQUFJLFFBQVE7RUFDaEQsTUFBTSxPQUFPLE1BQU0sSUFBSSxDQUFDLE1BQU07RUFFOUIsSUFBSTtJQUNGLE1BQU0sT0FBTyxLQUFLLFFBQVEsQ0FBQyxPQUFPLE9BQU8sZUFBZTtJQUV4RCxpQ0FBaUM7SUFDakMsTUFBTSxPQUFPLE1BQU0sS0FBSyxJQUFJLENBQUM7SUFFN0IsSUFBSSxLQUFLLFdBQVcsRUFBRTtNQUNwQixPQUFPLElBQUksU0FBUyxNQUFNO1FBQ3hCLFFBQVE7UUFDUixTQUFTO1VBQ1AsVUFBVSxNQUFNLElBQUksQ0FBQyxVQUFVO1FBQ2pDO01BQ0Y7SUFDRjtJQUVBLHdCQUF3QjtJQUN4QixPQUFPLE1BQU0sY0FBYyxTQUFTO0VBQ3RDLEVBQUUsT0FBTTtJQUNOLElBQUk7TUFDRixxQ0FBcUM7TUFDckMsSUFBSSxDQUFDLE1BQU0sT0FBTyxDQUFDLE9BQU87UUFDeEIsT0FBTyxNQUFNLGNBQWMsU0FBUyxPQUFPO01BQzdDO0lBQ0YsRUFBRSxPQUFNO0lBQ04sV0FBVztJQUNiO0lBRUEsT0FBTyxJQUFJLFNBQ1QsYUFDQTtNQUFFLFFBQVE7SUFBSTtFQUVsQjtBQUNGIn0=