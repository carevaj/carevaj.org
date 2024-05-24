import { posix } from "../../deps/path.ts";
/** Returns the final URL assigned to a page */ export function getPageUrl(page, prettyUrls, parentPath) {
  const data = page.data;
  let { url } = data;
  if (url === false) {
    return false;
  }
  if (typeof url === "function") {
    page.data.url = getDefaultUrl(page, parentPath, prettyUrls);
    url = url(page);
  }
  if (url === false) {
    return false;
  }
  if (typeof url === "string") {
    // Relative URL
    if (url.startsWith("./") || url.startsWith("../")) {
      return normalizeUrl(posix.join(parentPath, url));
    }
    if (url.startsWith("/")) {
      return normalizeUrl(url);
    }
    throw new Error(`The url variable for the page ${page.sourcePath} (${url}) must start with "/", "./" or "../" `);
  }
  // If the user has provided a value which hasn't yielded a string then it is an invalid url.
  if (url !== undefined) {
    throw new Error(`The url variable for the page ${page.sourcePath} is not correct. If specified, it should either be a string, or a function which returns a string. The provided url is of type: ${typeof url}.`);
  }
  return getDefaultUrl(page, parentPath, prettyUrls);
}
/** Returns the default URL for a page */ function getDefaultUrl(page, parentPath, prettyUrls) {
  // Calculate the URL from the path
  const url = posix.join(parentPath, page.data.basename);
  if (page.src.asset) {
    return url + page.src.ext;
  }
  // Pretty URLs affects to all pages but 404
  if (prettyUrls && url !== "/404") {
    if (posix.basename(url) === "index") {
      return posix.join(posix.dirname(url), "/");
    }
    return posix.join(url, "/");
  }
  return `${url}.html`;
}
/** Remove the /index.html part if exist and replace spaces */ function normalizeUrl(url) {
  url = encodeURI(url);
  if (url.endsWith("/index.html")) {
    return url.slice(0, -10);
  }
  return url;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvbHVtZUB2Mi4yLjAvY29yZS91dGlscy9wYWdlX3VybC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBwb3NpeCB9IGZyb20gXCIuLi8uLi9kZXBzL3BhdGgudHNcIjtcblxuaW1wb3J0IHR5cGUgeyBQYWdlLCBSYXdEYXRhIH0gZnJvbSBcIi4uL2ZpbGUudHNcIjtcblxuLyoqIFJldHVybnMgdGhlIGZpbmFsIFVSTCBhc3NpZ25lZCB0byBhIHBhZ2UgKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRQYWdlVXJsKFxuICBwYWdlOiBQYWdlLFxuICBwcmV0dHlVcmxzOiBib29sZWFuLFxuICBwYXJlbnRQYXRoOiBzdHJpbmcsXG4pOiBzdHJpbmcgfCBmYWxzZSB7XG4gIGNvbnN0IGRhdGEgPSBwYWdlLmRhdGEgYXMgUmF3RGF0YTtcbiAgbGV0IHsgdXJsIH0gPSBkYXRhO1xuXG4gIGlmICh1cmwgPT09IGZhbHNlKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgaWYgKHR5cGVvZiB1cmwgPT09IFwiZnVuY3Rpb25cIikge1xuICAgIHBhZ2UuZGF0YS51cmwgPSBnZXREZWZhdWx0VXJsKHBhZ2UsIHBhcmVudFBhdGgsIHByZXR0eVVybHMpO1xuICAgIHVybCA9IHVybChwYWdlKTtcbiAgfVxuXG4gIGlmICh1cmwgPT09IGZhbHNlKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgaWYgKHR5cGVvZiB1cmwgPT09IFwic3RyaW5nXCIpIHtcbiAgICAvLyBSZWxhdGl2ZSBVUkxcbiAgICBpZiAodXJsLnN0YXJ0c1dpdGgoXCIuL1wiKSB8fCB1cmwuc3RhcnRzV2l0aChcIi4uL1wiKSkge1xuICAgICAgcmV0dXJuIG5vcm1hbGl6ZVVybChwb3NpeC5qb2luKHBhcmVudFBhdGgsIHVybCkpO1xuICAgIH1cblxuICAgIGlmICh1cmwuc3RhcnRzV2l0aChcIi9cIikpIHtcbiAgICAgIHJldHVybiBub3JtYWxpemVVcmwodXJsKTtcbiAgICB9XG5cbiAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICBgVGhlIHVybCB2YXJpYWJsZSBmb3IgdGhlIHBhZ2UgJHtwYWdlLnNvdXJjZVBhdGh9ICgke3VybH0pIG11c3Qgc3RhcnQgd2l0aCBcIi9cIiwgXCIuL1wiIG9yIFwiLi4vXCIgYCxcbiAgICApO1xuICB9XG5cbiAgLy8gSWYgdGhlIHVzZXIgaGFzIHByb3ZpZGVkIGEgdmFsdWUgd2hpY2ggaGFzbid0IHlpZWxkZWQgYSBzdHJpbmcgdGhlbiBpdCBpcyBhbiBpbnZhbGlkIHVybC5cbiAgaWYgKHVybCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgYFRoZSB1cmwgdmFyaWFibGUgZm9yIHRoZSBwYWdlICR7cGFnZS5zb3VyY2VQYXRofSBpcyBub3QgY29ycmVjdC4gSWYgc3BlY2lmaWVkLCBpdCBzaG91bGQgZWl0aGVyIGJlIGEgc3RyaW5nLCBvciBhIGZ1bmN0aW9uIHdoaWNoIHJldHVybnMgYSBzdHJpbmcuIFRoZSBwcm92aWRlZCB1cmwgaXMgb2YgdHlwZTogJHt0eXBlb2YgdXJsfS5gLFxuICAgICk7XG4gIH1cblxuICByZXR1cm4gZ2V0RGVmYXVsdFVybChwYWdlLCBwYXJlbnRQYXRoLCBwcmV0dHlVcmxzKTtcbn1cblxuLyoqIFJldHVybnMgdGhlIGRlZmF1bHQgVVJMIGZvciBhIHBhZ2UgKi9cbmZ1bmN0aW9uIGdldERlZmF1bHRVcmwoXG4gIHBhZ2U6IFBhZ2UsXG4gIHBhcmVudFBhdGg6IHN0cmluZyxcbiAgcHJldHR5VXJsczogYm9vbGVhbixcbik6IHN0cmluZyB7XG4gIC8vIENhbGN1bGF0ZSB0aGUgVVJMIGZyb20gdGhlIHBhdGhcbiAgY29uc3QgdXJsID0gcG9zaXguam9pbihwYXJlbnRQYXRoLCBwYWdlLmRhdGEuYmFzZW5hbWUpO1xuXG4gIGlmIChwYWdlLnNyYy5hc3NldCkge1xuICAgIHJldHVybiB1cmwgKyBwYWdlLnNyYy5leHQ7XG4gIH1cblxuICAvLyBQcmV0dHkgVVJMcyBhZmZlY3RzIHRvIGFsbCBwYWdlcyBidXQgNDA0XG4gIGlmIChwcmV0dHlVcmxzICYmIHVybCAhPT0gXCIvNDA0XCIpIHtcbiAgICBpZiAocG9zaXguYmFzZW5hbWUodXJsKSA9PT0gXCJpbmRleFwiKSB7XG4gICAgICByZXR1cm4gcG9zaXguam9pbihwb3NpeC5kaXJuYW1lKHVybCksIFwiL1wiKTtcbiAgICB9XG4gICAgcmV0dXJuIHBvc2l4LmpvaW4odXJsLCBcIi9cIik7XG4gIH1cblxuICByZXR1cm4gYCR7dXJsfS5odG1sYDtcbn1cblxuLyoqIFJlbW92ZSB0aGUgL2luZGV4Lmh0bWwgcGFydCBpZiBleGlzdCBhbmQgcmVwbGFjZSBzcGFjZXMgKi9cbmZ1bmN0aW9uIG5vcm1hbGl6ZVVybCh1cmw6IHN0cmluZyk6IHN0cmluZyB7XG4gIHVybCA9IGVuY29kZVVSSSh1cmwpO1xuXG4gIGlmICh1cmwuZW5kc1dpdGgoXCIvaW5kZXguaHRtbFwiKSkge1xuICAgIHJldHVybiB1cmwuc2xpY2UoMCwgLTEwKTtcbiAgfVxuXG4gIHJldHVybiB1cmw7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsU0FBUyxLQUFLLFFBQVEscUJBQXFCO0FBSTNDLDZDQUE2QyxHQUM3QyxPQUFPLFNBQVMsV0FDZCxJQUFVLEVBQ1YsVUFBbUIsRUFDbkIsVUFBa0I7RUFFbEIsTUFBTSxPQUFPLEtBQUssSUFBSTtFQUN0QixJQUFJLEVBQUUsR0FBRyxFQUFFLEdBQUc7RUFFZCxJQUFJLFFBQVEsT0FBTztJQUNqQixPQUFPO0VBQ1Q7RUFFQSxJQUFJLE9BQU8sUUFBUSxZQUFZO0lBQzdCLEtBQUssSUFBSSxDQUFDLEdBQUcsR0FBRyxjQUFjLE1BQU0sWUFBWTtJQUNoRCxNQUFNLElBQUk7RUFDWjtFQUVBLElBQUksUUFBUSxPQUFPO0lBQ2pCLE9BQU87RUFDVDtFQUVBLElBQUksT0FBTyxRQUFRLFVBQVU7SUFDM0IsZUFBZTtJQUNmLElBQUksSUFBSSxVQUFVLENBQUMsU0FBUyxJQUFJLFVBQVUsQ0FBQyxRQUFRO01BQ2pELE9BQU8sYUFBYSxNQUFNLElBQUksQ0FBQyxZQUFZO0lBQzdDO0lBRUEsSUFBSSxJQUFJLFVBQVUsQ0FBQyxNQUFNO01BQ3ZCLE9BQU8sYUFBYTtJQUN0QjtJQUVBLE1BQU0sSUFBSSxNQUNSLENBQUMsOEJBQThCLEVBQUUsS0FBSyxVQUFVLENBQUMsRUFBRSxFQUFFLElBQUkscUNBQXFDLENBQUM7RUFFbkc7RUFFQSw0RkFBNEY7RUFDNUYsSUFBSSxRQUFRLFdBQVc7SUFDckIsTUFBTSxJQUFJLE1BQ1IsQ0FBQyw4QkFBOEIsRUFBRSxLQUFLLFVBQVUsQ0FBQyxnSUFBZ0ksRUFBRSxPQUFPLElBQUksQ0FBQyxDQUFDO0VBRXBNO0VBRUEsT0FBTyxjQUFjLE1BQU0sWUFBWTtBQUN6QztBQUVBLHVDQUF1QyxHQUN2QyxTQUFTLGNBQ1AsSUFBVSxFQUNWLFVBQWtCLEVBQ2xCLFVBQW1CO0VBRW5CLGtDQUFrQztFQUNsQyxNQUFNLE1BQU0sTUFBTSxJQUFJLENBQUMsWUFBWSxLQUFLLElBQUksQ0FBQyxRQUFRO0VBRXJELElBQUksS0FBSyxHQUFHLENBQUMsS0FBSyxFQUFFO0lBQ2xCLE9BQU8sTUFBTSxLQUFLLEdBQUcsQ0FBQyxHQUFHO0VBQzNCO0VBRUEsMkNBQTJDO0VBQzNDLElBQUksY0FBYyxRQUFRLFFBQVE7SUFDaEMsSUFBSSxNQUFNLFFBQVEsQ0FBQyxTQUFTLFNBQVM7TUFDbkMsT0FBTyxNQUFNLElBQUksQ0FBQyxNQUFNLE9BQU8sQ0FBQyxNQUFNO0lBQ3hDO0lBQ0EsT0FBTyxNQUFNLElBQUksQ0FBQyxLQUFLO0VBQ3pCO0VBRUEsT0FBTyxDQUFDLEVBQUUsSUFBSSxLQUFLLENBQUM7QUFDdEI7QUFFQSw0REFBNEQsR0FDNUQsU0FBUyxhQUFhLEdBQVc7RUFDL0IsTUFBTSxVQUFVO0VBRWhCLElBQUksSUFBSSxRQUFRLENBQUMsZ0JBQWdCO0lBQy9CLE9BQU8sSUFBSSxLQUFLLENBQUMsR0FBRyxDQUFDO0VBQ3ZCO0VBRUEsT0FBTztBQUNUIn0=