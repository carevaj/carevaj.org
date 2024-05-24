import { normalizePath } from "../core/utils/path.ts";
import reloadClient from "./reload_client.js";
/** Middleware to hot reload changes */ export default function reload(options) {
  const sockets = new Set();
  const { watcher } = options;
  watcher.addEventListener("change", (event)=>{
    if (!sockets.size) {
      return;
    }
    const files = event.files;
    const urls = Array.from(files).map((file)=>normalizePath(file));
    const message = JSON.stringify(urls);
    sockets.forEach((socket)=>socket.send(message));
    console.log("Changes sent to the browser");
  });
  watcher.start();
  return async (request, next)=>{
    // Is a websocket
    if (request.headers.get("upgrade") === "websocket") {
      const { socket, response } = Deno.upgradeWebSocket(request);
      socket.onopen = ()=>sockets.add(socket);
      socket.onclose = ()=>sockets.delete(socket);
      socket.onerror = (e)=>console.log("Socket errored", e);
      return response;
    }
    // It's a regular request
    const response = await next(request);
    if (!response.body || response.status !== 200) {
      return response;
    }
    // Insert live-reload script in the body
    if (response.headers.get("content-type")?.includes("html")) {
      const reader = response.body.getReader();
      let body = "";
      let result = await reader.read();
      const decoder = new TextDecoder();
      while(!result.done){
        body += decoder.decode(result.value);
        result = await reader.read();
      }
      body += `<script type="module" id="lume-live-reload">${reloadClient}; liveReload();</script>`;
      const { status, statusText, headers } = response;
      return new Response(body, {
        status,
        statusText,
        headers
      });
    }
    return response;
  };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvbHVtZUB2Mi4yLjAvbWlkZGxld2FyZXMvcmVsb2FkLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IG5vcm1hbGl6ZVBhdGggfSBmcm9tIFwiLi4vY29yZS91dGlscy9wYXRoLnRzXCI7XG5pbXBvcnQgcmVsb2FkQ2xpZW50IGZyb20gXCIuL3JlbG9hZF9jbGllbnQuanNcIjtcblxuaW1wb3J0IHR5cGUgeyBNaWRkbGV3YXJlIH0gZnJvbSBcIi4uL2NvcmUvc2VydmVyLnRzXCI7XG5pbXBvcnQgdHlwZSB7IFdhdGNoZXIgfSBmcm9tIFwiLi4vY29yZS93YXRjaGVyLnRzXCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgT3B0aW9ucyB7XG4gIHdhdGNoZXI6IFdhdGNoZXI7XG59XG5cbi8qKiBNaWRkbGV3YXJlIHRvIGhvdCByZWxvYWQgY2hhbmdlcyAqL1xuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gcmVsb2FkKG9wdGlvbnM6IE9wdGlvbnMpOiBNaWRkbGV3YXJlIHtcbiAgY29uc3Qgc29ja2V0cyA9IG5ldyBTZXQ8V2ViU29ja2V0PigpO1xuICBjb25zdCB7IHdhdGNoZXIgfSA9IG9wdGlvbnM7XG5cbiAgd2F0Y2hlci5hZGRFdmVudExpc3RlbmVyKFwiY2hhbmdlXCIsIChldmVudCkgPT4ge1xuICAgIGlmICghc29ja2V0cy5zaXplKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgZmlsZXMgPSBldmVudC5maWxlcyE7XG4gICAgY29uc3QgdXJscyA9IEFycmF5LmZyb20oZmlsZXMpLm1hcCgoZmlsZSkgPT4gbm9ybWFsaXplUGF0aChmaWxlKSk7XG4gICAgY29uc3QgbWVzc2FnZSA9IEpTT04uc3RyaW5naWZ5KHVybHMpO1xuICAgIHNvY2tldHMuZm9yRWFjaCgoc29ja2V0KSA9PiBzb2NrZXQuc2VuZChtZXNzYWdlKSk7XG4gICAgY29uc29sZS5sb2coXCJDaGFuZ2VzIHNlbnQgdG8gdGhlIGJyb3dzZXJcIik7XG4gIH0pO1xuXG4gIHdhdGNoZXIuc3RhcnQoKTtcblxuICByZXR1cm4gYXN5bmMgKHJlcXVlc3QsIG5leHQpID0+IHtcbiAgICAvLyBJcyBhIHdlYnNvY2tldFxuICAgIGlmIChyZXF1ZXN0LmhlYWRlcnMuZ2V0KFwidXBncmFkZVwiKSA9PT0gXCJ3ZWJzb2NrZXRcIikge1xuICAgICAgY29uc3QgeyBzb2NrZXQsIHJlc3BvbnNlIH0gPSBEZW5vLnVwZ3JhZGVXZWJTb2NrZXQocmVxdWVzdCk7XG5cbiAgICAgIHNvY2tldC5vbm9wZW4gPSAoKSA9PiBzb2NrZXRzLmFkZChzb2NrZXQpO1xuICAgICAgc29ja2V0Lm9uY2xvc2UgPSAoKSA9PiBzb2NrZXRzLmRlbGV0ZShzb2NrZXQpO1xuICAgICAgc29ja2V0Lm9uZXJyb3IgPSAoZSkgPT4gY29uc29sZS5sb2coXCJTb2NrZXQgZXJyb3JlZFwiLCBlKTtcblxuICAgICAgcmV0dXJuIHJlc3BvbnNlO1xuICAgIH1cblxuICAgIC8vIEl0J3MgYSByZWd1bGFyIHJlcXVlc3RcbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IG5leHQocmVxdWVzdCk7XG5cbiAgICBpZiAoIXJlc3BvbnNlLmJvZHkgfHwgcmVzcG9uc2Uuc3RhdHVzICE9PSAyMDApIHtcbiAgICAgIHJldHVybiByZXNwb25zZTtcbiAgICB9XG5cbiAgICAvLyBJbnNlcnQgbGl2ZS1yZWxvYWQgc2NyaXB0IGluIHRoZSBib2R5XG4gICAgaWYgKHJlc3BvbnNlLmhlYWRlcnMuZ2V0KFwiY29udGVudC10eXBlXCIpPy5pbmNsdWRlcyhcImh0bWxcIikpIHtcbiAgICAgIGNvbnN0IHJlYWRlciA9IHJlc3BvbnNlLmJvZHkuZ2V0UmVhZGVyKCk7XG5cbiAgICAgIGxldCBib2R5ID0gXCJcIjtcbiAgICAgIGxldCByZXN1bHQgPSBhd2FpdCByZWFkZXIucmVhZCgpO1xuICAgICAgY29uc3QgZGVjb2RlciA9IG5ldyBUZXh0RGVjb2RlcigpO1xuXG4gICAgICB3aGlsZSAoIXJlc3VsdC5kb25lKSB7XG4gICAgICAgIGJvZHkgKz0gZGVjb2Rlci5kZWNvZGUocmVzdWx0LnZhbHVlKTtcbiAgICAgICAgcmVzdWx0ID0gYXdhaXQgcmVhZGVyLnJlYWQoKTtcbiAgICAgIH1cblxuICAgICAgYm9keSArPVxuICAgICAgICBgPHNjcmlwdCB0eXBlPVwibW9kdWxlXCIgaWQ9XCJsdW1lLWxpdmUtcmVsb2FkXCI+JHtyZWxvYWRDbGllbnR9OyBsaXZlUmVsb2FkKCk7PC9zY3JpcHQ+YDtcblxuICAgICAgY29uc3QgeyBzdGF0dXMsIHN0YXR1c1RleHQsIGhlYWRlcnMgfSA9IHJlc3BvbnNlO1xuXG4gICAgICByZXR1cm4gbmV3IFJlc3BvbnNlKGJvZHksIHsgc3RhdHVzLCBzdGF0dXNUZXh0LCBoZWFkZXJzIH0pO1xuICAgIH1cblxuICAgIHJldHVybiByZXNwb25zZTtcbiAgfTtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxTQUFTLGFBQWEsUUFBUSx3QkFBd0I7QUFDdEQsT0FBTyxrQkFBa0IscUJBQXFCO0FBUzlDLHFDQUFxQyxHQUNyQyxlQUFlLFNBQVMsT0FBTyxPQUFnQjtFQUM3QyxNQUFNLFVBQVUsSUFBSTtFQUNwQixNQUFNLEVBQUUsT0FBTyxFQUFFLEdBQUc7RUFFcEIsUUFBUSxnQkFBZ0IsQ0FBQyxVQUFVLENBQUM7SUFDbEMsSUFBSSxDQUFDLFFBQVEsSUFBSSxFQUFFO01BQ2pCO0lBQ0Y7SUFFQSxNQUFNLFFBQVEsTUFBTSxLQUFLO0lBQ3pCLE1BQU0sT0FBTyxNQUFNLElBQUksQ0FBQyxPQUFPLEdBQUcsQ0FBQyxDQUFDLE9BQVMsY0FBYztJQUMzRCxNQUFNLFVBQVUsS0FBSyxTQUFTLENBQUM7SUFDL0IsUUFBUSxPQUFPLENBQUMsQ0FBQyxTQUFXLE9BQU8sSUFBSSxDQUFDO0lBQ3hDLFFBQVEsR0FBRyxDQUFDO0VBQ2Q7RUFFQSxRQUFRLEtBQUs7RUFFYixPQUFPLE9BQU8sU0FBUztJQUNyQixpQkFBaUI7SUFDakIsSUFBSSxRQUFRLE9BQU8sQ0FBQyxHQUFHLENBQUMsZUFBZSxhQUFhO01BQ2xELE1BQU0sRUFBRSxNQUFNLEVBQUUsUUFBUSxFQUFFLEdBQUcsS0FBSyxnQkFBZ0IsQ0FBQztNQUVuRCxPQUFPLE1BQU0sR0FBRyxJQUFNLFFBQVEsR0FBRyxDQUFDO01BQ2xDLE9BQU8sT0FBTyxHQUFHLElBQU0sUUFBUSxNQUFNLENBQUM7TUFDdEMsT0FBTyxPQUFPLEdBQUcsQ0FBQyxJQUFNLFFBQVEsR0FBRyxDQUFDLGtCQUFrQjtNQUV0RCxPQUFPO0lBQ1Q7SUFFQSx5QkFBeUI7SUFDekIsTUFBTSxXQUFXLE1BQU0sS0FBSztJQUU1QixJQUFJLENBQUMsU0FBUyxJQUFJLElBQUksU0FBUyxNQUFNLEtBQUssS0FBSztNQUM3QyxPQUFPO0lBQ1Q7SUFFQSx3Q0FBd0M7SUFDeEMsSUFBSSxTQUFTLE9BQU8sQ0FBQyxHQUFHLENBQUMsaUJBQWlCLFNBQVMsU0FBUztNQUMxRCxNQUFNLFNBQVMsU0FBUyxJQUFJLENBQUMsU0FBUztNQUV0QyxJQUFJLE9BQU87TUFDWCxJQUFJLFNBQVMsTUFBTSxPQUFPLElBQUk7TUFDOUIsTUFBTSxVQUFVLElBQUk7TUFFcEIsTUFBTyxDQUFDLE9BQU8sSUFBSSxDQUFFO1FBQ25CLFFBQVEsUUFBUSxNQUFNLENBQUMsT0FBTyxLQUFLO1FBQ25DLFNBQVMsTUFBTSxPQUFPLElBQUk7TUFDNUI7TUFFQSxRQUNFLENBQUMsNENBQTRDLEVBQUUsYUFBYSx3QkFBd0IsQ0FBQztNQUV2RixNQUFNLEVBQUUsTUFBTSxFQUFFLFVBQVUsRUFBRSxPQUFPLEVBQUUsR0FBRztNQUV4QyxPQUFPLElBQUksU0FBUyxNQUFNO1FBQUU7UUFBUTtRQUFZO01BQVE7SUFDMUQ7SUFFQSxPQUFPO0VBQ1Q7QUFDRiJ9