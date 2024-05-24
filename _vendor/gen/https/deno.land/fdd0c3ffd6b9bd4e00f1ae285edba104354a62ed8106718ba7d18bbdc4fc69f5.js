import { isUrl } from "./path.ts";
import { env } from "./env.ts";
const useCache = env("LUME_NOCACHE") !== true;
export async function read(path, isBinary, init) {
  if (!isUrl(path)) {
    if (path.startsWith("data:")) {
      const response = await fetch(path);
      return isBinary ? new Uint8Array(await response.arrayBuffer()) : response.text();
    }
    return isBinary ? Deno.readFile(path) : Deno.readTextFile(path);
  }
  const url = new URL(path);
  if (url.protocol === "file:") {
    return isBinary ? Deno.readFile(url) : Deno.readTextFile(url);
  }
  if (!useCache) {
    const response = await fetch(url, init);
    if (!response.ok) {
      throw new Error(`Failed to fetch "${url}"`);
    }
    return isBinary ? new Uint8Array(await response.arrayBuffer()) : response.text();
  }
  const cache = await caches.open("lume_remote_files");
  // Prevent https://github.com/denoland/deno/issues/19696
  try {
    const cached = await cache.match(url);
    if (cached) {
      return isBinary ? new Uint8Array(await cached.arrayBuffer()) : cached.text();
    }
  } catch  {
  // ignore
  }
  const response = await fetch(url, init);
  if (!response.ok) {
    throw new Error(`Failed to fetch "${url}"`);
  }
  await cache.put(url, response.clone());
  return isBinary ? new Uint8Array(await response.arrayBuffer()) : response.text();
}
/**
 * Clear the cache of remote files.
 */ export async function clearCache() {
  await caches.delete("lume_remote_files");
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvbHVtZUB2Mi4yLjAvY29yZS91dGlscy9yZWFkLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGlzVXJsIH0gZnJvbSBcIi4vcGF0aC50c1wiO1xuaW1wb3J0IHsgZW52IH0gZnJvbSBcIi4vZW52LnRzXCI7XG5cbmNvbnN0IHVzZUNhY2hlID0gZW52PGJvb2xlYW4+KFwiTFVNRV9OT0NBQ0hFXCIpICE9PSB0cnVlO1xuXG4vKipcbiAqIFJlYWQgYSBsb2NhbCBvciByZW1vdGUgZmlsZSBhbmQgcmV0dXJuIGl0cyBjb250ZW50LlxuICogSWYgdGhlIGZpbGUgaXMgcmVtb3RlLCBpdCB3aWxsIGJlIGNhY2hlZCBpbiB0aGUgYGx1bWVfcmVtb3RlX2ZpbGVzYCBjYWNoZS5cbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJlYWQoXG4gIHBhdGg6IHN0cmluZyxcbiAgaXNCaW5hcnk6IGJvb2xlYW4sXG4pOiBQcm9taXNlPFVpbnQ4QXJyYXkgfCBzdHJpbmc+O1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJlYWQoXG4gIHBhdGg6IHN0cmluZyxcbiAgaXNCaW5hcnk6IHRydWUsXG4gIGluaXQ/OiBSZXF1ZXN0SW5pdCxcbik6IFByb21pc2U8VWludDhBcnJheT47XG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcmVhZChcbiAgcGF0aDogc3RyaW5nLFxuICBpc0JpbmFyeTogZmFsc2UsXG4gIGluaXQ/OiBSZXF1ZXN0SW5pdCxcbik6IFByb21pc2U8c3RyaW5nPjtcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiByZWFkKFxuICBwYXRoOiBzdHJpbmcsXG4gIGlzQmluYXJ5OiBib29sZWFuLFxuICBpbml0PzogUmVxdWVzdEluaXQsXG4pOiBQcm9taXNlPHN0cmluZyB8IFVpbnQ4QXJyYXk+IHtcbiAgaWYgKCFpc1VybChwYXRoKSkge1xuICAgIGlmIChwYXRoLnN0YXJ0c1dpdGgoXCJkYXRhOlwiKSkge1xuICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaChwYXRoKTtcblxuICAgICAgcmV0dXJuIGlzQmluYXJ5XG4gICAgICAgID8gbmV3IFVpbnQ4QXJyYXkoYXdhaXQgcmVzcG9uc2UuYXJyYXlCdWZmZXIoKSlcbiAgICAgICAgOiByZXNwb25zZS50ZXh0KCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGlzQmluYXJ5ID8gRGVuby5yZWFkRmlsZShwYXRoKSA6IERlbm8ucmVhZFRleHRGaWxlKHBhdGgpO1xuICB9XG5cbiAgY29uc3QgdXJsID0gbmV3IFVSTChwYXRoKTtcblxuICBpZiAodXJsLnByb3RvY29sID09PSBcImZpbGU6XCIpIHtcbiAgICByZXR1cm4gaXNCaW5hcnkgPyBEZW5vLnJlYWRGaWxlKHVybCkgOiBEZW5vLnJlYWRUZXh0RmlsZSh1cmwpO1xuICB9XG5cbiAgaWYgKCF1c2VDYWNoZSkge1xuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2godXJsLCBpbml0KTtcblxuICAgIGlmICghcmVzcG9uc2Uub2spIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgRmFpbGVkIHRvIGZldGNoIFwiJHt1cmx9XCJgKTtcbiAgICB9XG5cbiAgICByZXR1cm4gaXNCaW5hcnlcbiAgICAgID8gbmV3IFVpbnQ4QXJyYXkoYXdhaXQgcmVzcG9uc2UuYXJyYXlCdWZmZXIoKSlcbiAgICAgIDogcmVzcG9uc2UudGV4dCgpO1xuICB9XG5cbiAgY29uc3QgY2FjaGUgPSBhd2FpdCBjYWNoZXMub3BlbihcImx1bWVfcmVtb3RlX2ZpbGVzXCIpO1xuXG4gIC8vIFByZXZlbnQgaHR0cHM6Ly9naXRodWIuY29tL2Rlbm9sYW5kL2Rlbm8vaXNzdWVzLzE5Njk2XG4gIHRyeSB7XG4gICAgY29uc3QgY2FjaGVkID0gYXdhaXQgY2FjaGUubWF0Y2godXJsKTtcblxuICAgIGlmIChjYWNoZWQpIHtcbiAgICAgIHJldHVybiBpc0JpbmFyeVxuICAgICAgICA/IG5ldyBVaW50OEFycmF5KGF3YWl0IGNhY2hlZC5hcnJheUJ1ZmZlcigpKVxuICAgICAgICA6IGNhY2hlZC50ZXh0KCk7XG4gICAgfVxuICB9IGNhdGNoIHtcbiAgICAvLyBpZ25vcmVcbiAgfVxuXG4gIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2godXJsLCBpbml0KTtcblxuICBpZiAoIXJlc3BvbnNlLm9rKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBGYWlsZWQgdG8gZmV0Y2ggXCIke3VybH1cImApO1xuICB9XG5cbiAgYXdhaXQgY2FjaGUucHV0KHVybCwgcmVzcG9uc2UuY2xvbmUoKSk7XG5cbiAgcmV0dXJuIGlzQmluYXJ5XG4gICAgPyBuZXcgVWludDhBcnJheShhd2FpdCByZXNwb25zZS5hcnJheUJ1ZmZlcigpKVxuICAgIDogcmVzcG9uc2UudGV4dCgpO1xufVxuXG4vKipcbiAqIENsZWFyIHRoZSBjYWNoZSBvZiByZW1vdGUgZmlsZXMuXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBjbGVhckNhY2hlKCkge1xuICBhd2FpdCBjYWNoZXMuZGVsZXRlKFwibHVtZV9yZW1vdGVfZmlsZXNcIik7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsU0FBUyxLQUFLLFFBQVEsWUFBWTtBQUNsQyxTQUFTLEdBQUcsUUFBUSxXQUFXO0FBRS9CLE1BQU0sV0FBVyxJQUFhLG9CQUFvQjtBQW9CbEQsT0FBTyxlQUFlLEtBQ3BCLElBQVksRUFDWixRQUFpQixFQUNqQixJQUFrQjtFQUVsQixJQUFJLENBQUMsTUFBTSxPQUFPO0lBQ2hCLElBQUksS0FBSyxVQUFVLENBQUMsVUFBVTtNQUM1QixNQUFNLFdBQVcsTUFBTSxNQUFNO01BRTdCLE9BQU8sV0FDSCxJQUFJLFdBQVcsTUFBTSxTQUFTLFdBQVcsTUFDekMsU0FBUyxJQUFJO0lBQ25CO0lBRUEsT0FBTyxXQUFXLEtBQUssUUFBUSxDQUFDLFFBQVEsS0FBSyxZQUFZLENBQUM7RUFDNUQ7RUFFQSxNQUFNLE1BQU0sSUFBSSxJQUFJO0VBRXBCLElBQUksSUFBSSxRQUFRLEtBQUssU0FBUztJQUM1QixPQUFPLFdBQVcsS0FBSyxRQUFRLENBQUMsT0FBTyxLQUFLLFlBQVksQ0FBQztFQUMzRDtFQUVBLElBQUksQ0FBQyxVQUFVO0lBQ2IsTUFBTSxXQUFXLE1BQU0sTUFBTSxLQUFLO0lBRWxDLElBQUksQ0FBQyxTQUFTLEVBQUUsRUFBRTtNQUNoQixNQUFNLElBQUksTUFBTSxDQUFDLGlCQUFpQixFQUFFLElBQUksQ0FBQyxDQUFDO0lBQzVDO0lBRUEsT0FBTyxXQUNILElBQUksV0FBVyxNQUFNLFNBQVMsV0FBVyxNQUN6QyxTQUFTLElBQUk7RUFDbkI7RUFFQSxNQUFNLFFBQVEsTUFBTSxPQUFPLElBQUksQ0FBQztFQUVoQyx3REFBd0Q7RUFDeEQsSUFBSTtJQUNGLE1BQU0sU0FBUyxNQUFNLE1BQU0sS0FBSyxDQUFDO0lBRWpDLElBQUksUUFBUTtNQUNWLE9BQU8sV0FDSCxJQUFJLFdBQVcsTUFBTSxPQUFPLFdBQVcsTUFDdkMsT0FBTyxJQUFJO0lBQ2pCO0VBQ0YsRUFBRSxPQUFNO0VBQ04sU0FBUztFQUNYO0VBRUEsTUFBTSxXQUFXLE1BQU0sTUFBTSxLQUFLO0VBRWxDLElBQUksQ0FBQyxTQUFTLEVBQUUsRUFBRTtJQUNoQixNQUFNLElBQUksTUFBTSxDQUFDLGlCQUFpQixFQUFFLElBQUksQ0FBQyxDQUFDO0VBQzVDO0VBRUEsTUFBTSxNQUFNLEdBQUcsQ0FBQyxLQUFLLFNBQVMsS0FBSztFQUVuQyxPQUFPLFdBQ0gsSUFBSSxXQUFXLE1BQU0sU0FBUyxXQUFXLE1BQ3pDLFNBQVMsSUFBSTtBQUNuQjtBQUVBOztDQUVDLEdBQ0QsT0FBTyxlQUFlO0VBQ3BCLE1BQU0sT0FBTyxNQUFNLENBQUM7QUFDdEIifQ==