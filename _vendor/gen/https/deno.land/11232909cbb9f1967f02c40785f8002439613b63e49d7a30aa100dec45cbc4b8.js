import { join, posix } from "../deps/path.ts";
import { merge } from "../core/utils/object.ts";
export const defaults = {
  root: `${Deno.cwd()}/_site`,
  page404: "/404.html",
  directoryIndex: false
};
/** Show a 404 page */ export default function notFound(userOptions) {
  const options = merge(defaults, userOptions);
  let { root, page404, directoryIndex } = options;
  if (page404.endsWith("/")) {
    page404 += "index.html";
  }
  return async (request, next)=>{
    const response = await next(request);
    if (response.status === 404) {
      const { headers, status } = response;
      headers.set("content-type", "text/html; charset=utf-8");
      try {
        const body = await Deno.readFile(join(root, page404));
        return new Response(body, {
          status,
          headers
        });
      } catch  {
        if (directoryIndex) {
          const { pathname } = new URL(request.url);
          const body = await getDirectoryIndex(root, pathname);
          return new Response(body, {
            status,
            headers
          });
        }
      }
    }
    return response;
  };
}
/** Generate the default body for a 404 response */ async function getDirectoryIndex(root, file) {
  const folders = [];
  const files = [];
  try {
    for await (const info of Deno.readDir(join(root, file))){
      info.isDirectory ? folders.push([
        `${info.name}/`,
        `📁 ${info.name}/`
      ]) : files.push([
        info.name === "index.html" ? "./" : info.name,
        `📄 ${info.name}`
      ]);
    }
  } catch  {
    // It's not a directory, so scan the parent directory
    try {
      const base = posix.dirname(file);
      for await (const info of Deno.readDir(join(root, base))){
        info.isDirectory ? folders.push([
          posix.join(base, `${info.name}/`),
          `📁 ${info.name}/`
        ]) : files.push([
          posix.join(base, info.name === "index.html" ? "./" : info.name),
          `📄 ${info.name}`
        ]);
      }
    } catch  {
    // Ignore
    }
  }
  const content = folders.concat(files);
  if (file.match(/.+\/.+/)) {
    content.unshift([
      "../",
      ".."
    ]);
  }
  return `
  <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>404 - Not found</title>
      <style> body { font-family: sans-serif; max-width: 40em; margin: auto; padding: 2em; line-height: 1.5; }</style>
    </head>
    <body>
      <h1>404 - Not found</h1>
      <p>The URL <code>${file}</code> does not exist</p>
      <ul>
    ${content.map(([url, name])=>`
      <li>
        <a href="${url}">
          ${name}
        </a>
      </li>`).join("\n")}
      </ul>
    </body>
  </html>`;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvbHVtZUB2Mi4yLjAvbWlkZGxld2FyZXMvbm90X2ZvdW5kLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGpvaW4sIHBvc2l4IH0gZnJvbSBcIi4uL2RlcHMvcGF0aC50c1wiO1xuaW1wb3J0IHsgbWVyZ2UgfSBmcm9tIFwiLi4vY29yZS91dGlscy9vYmplY3QudHNcIjtcblxuaW1wb3J0IHR5cGUgeyBNaWRkbGV3YXJlIH0gZnJvbSBcIi4uL2NvcmUvc2VydmVyLnRzXCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgT3B0aW9ucyB7XG4gIHJvb3Q6IHN0cmluZztcbiAgcGFnZTQwNDogc3RyaW5nO1xuICBkaXJlY3RvcnlJbmRleD86IGJvb2xlYW47XG59XG5cbmV4cG9ydCBjb25zdCBkZWZhdWx0czogT3B0aW9ucyA9IHtcbiAgcm9vdDogYCR7RGVuby5jd2QoKX0vX3NpdGVgLFxuICBwYWdlNDA0OiBcIi80MDQuaHRtbFwiLFxuICBkaXJlY3RvcnlJbmRleDogZmFsc2UsXG59O1xuXG4vKiogU2hvdyBhIDQwNCBwYWdlICovXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBub3RGb3VuZCh1c2VyT3B0aW9ucz86IFBhcnRpYWw8T3B0aW9ucz4pOiBNaWRkbGV3YXJlIHtcbiAgY29uc3Qgb3B0aW9ucyA9IG1lcmdlKGRlZmF1bHRzLCB1c2VyT3B0aW9ucyk7XG4gIGxldCB7IHJvb3QsIHBhZ2U0MDQsIGRpcmVjdG9yeUluZGV4IH0gPSBvcHRpb25zO1xuXG4gIGlmIChwYWdlNDA0LmVuZHNXaXRoKFwiL1wiKSkge1xuICAgIHBhZ2U0MDQgKz0gXCJpbmRleC5odG1sXCI7XG4gIH1cblxuICByZXR1cm4gYXN5bmMgKHJlcXVlc3QsIG5leHQpID0+IHtcbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IG5leHQocmVxdWVzdCk7XG5cbiAgICBpZiAocmVzcG9uc2Uuc3RhdHVzID09PSA0MDQpIHtcbiAgICAgIGNvbnN0IHsgaGVhZGVycywgc3RhdHVzIH0gPSByZXNwb25zZTtcbiAgICAgIGhlYWRlcnMuc2V0KFwiY29udGVudC10eXBlXCIsIFwidGV4dC9odG1sOyBjaGFyc2V0PXV0Zi04XCIpO1xuXG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCBib2R5ID0gYXdhaXQgRGVuby5yZWFkRmlsZShqb2luKHJvb3QsIHBhZ2U0MDQpKTtcbiAgICAgICAgcmV0dXJuIG5ldyBSZXNwb25zZShib2R5LCB7IHN0YXR1cywgaGVhZGVycyB9KTtcbiAgICAgIH0gY2F0Y2gge1xuICAgICAgICBpZiAoZGlyZWN0b3J5SW5kZXgpIHtcbiAgICAgICAgICBjb25zdCB7IHBhdGhuYW1lIH0gPSBuZXcgVVJMKHJlcXVlc3QudXJsKTtcbiAgICAgICAgICBjb25zdCBib2R5ID0gYXdhaXQgZ2V0RGlyZWN0b3J5SW5kZXgocm9vdCwgcGF0aG5hbWUpO1xuICAgICAgICAgIHJldHVybiBuZXcgUmVzcG9uc2UoYm9keSwgeyBzdGF0dXMsIGhlYWRlcnMgfSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gcmVzcG9uc2U7XG4gIH07XG59XG5cbi8qKiBHZW5lcmF0ZSB0aGUgZGVmYXVsdCBib2R5IGZvciBhIDQwNCByZXNwb25zZSAqL1xuYXN5bmMgZnVuY3Rpb24gZ2V0RGlyZWN0b3J5SW5kZXgocm9vdDogc3RyaW5nLCBmaWxlOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICBjb25zdCBmb2xkZXJzOiBbc3RyaW5nLCBzdHJpbmddW10gPSBbXTtcbiAgY29uc3QgZmlsZXM6IFtzdHJpbmcsIHN0cmluZ11bXSA9IFtdO1xuXG4gIHRyeSB7XG4gICAgZm9yIGF3YWl0IChjb25zdCBpbmZvIG9mIERlbm8ucmVhZERpcihqb2luKHJvb3QsIGZpbGUpKSkge1xuICAgICAgaW5mby5pc0RpcmVjdG9yeVxuICAgICAgICA/IGZvbGRlcnMucHVzaChbYCR7aW5mby5uYW1lfS9gLCBg8J+TgSAke2luZm8ubmFtZX0vYF0pXG4gICAgICAgIDogZmlsZXMucHVzaChbXG4gICAgICAgICAgaW5mby5uYW1lID09PSBcImluZGV4Lmh0bWxcIiA/IFwiLi9cIiA6IGluZm8ubmFtZSxcbiAgICAgICAgICBg8J+ThCAke2luZm8ubmFtZX1gLFxuICAgICAgICBdKTtcbiAgICB9XG4gIH0gY2F0Y2gge1xuICAgIC8vIEl0J3Mgbm90IGEgZGlyZWN0b3J5LCBzbyBzY2FuIHRoZSBwYXJlbnQgZGlyZWN0b3J5XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGJhc2UgPSBwb3NpeC5kaXJuYW1lKGZpbGUpO1xuICAgICAgZm9yIGF3YWl0IChjb25zdCBpbmZvIG9mIERlbm8ucmVhZERpcihqb2luKHJvb3QsIGJhc2UpKSkge1xuICAgICAgICBpbmZvLmlzRGlyZWN0b3J5XG4gICAgICAgICAgPyBmb2xkZXJzLnB1c2goW1xuICAgICAgICAgICAgcG9zaXguam9pbihiYXNlLCBgJHtpbmZvLm5hbWV9L2ApLFxuICAgICAgICAgICAgYPCfk4EgJHtpbmZvLm5hbWV9L2AsXG4gICAgICAgICAgXSlcbiAgICAgICAgICA6IGZpbGVzLnB1c2goW1xuICAgICAgICAgICAgcG9zaXguam9pbihiYXNlLCBpbmZvLm5hbWUgPT09IFwiaW5kZXguaHRtbFwiID8gXCIuL1wiIDogaW5mby5uYW1lKSxcbiAgICAgICAgICAgIGDwn5OEICR7aW5mby5uYW1lfWAsXG4gICAgICAgICAgXSk7XG4gICAgICB9XG4gICAgfSBjYXRjaCB7XG4gICAgICAvLyBJZ25vcmVcbiAgICB9XG4gIH1cblxuICBjb25zdCBjb250ZW50ID0gZm9sZGVycy5jb25jYXQoZmlsZXMpO1xuXG4gIGlmIChmaWxlLm1hdGNoKC8uK1xcLy4rLykpIHtcbiAgICBjb250ZW50LnVuc2hpZnQoW1wiLi4vXCIsIFwiLi5cIl0pO1xuICB9XG5cbiAgcmV0dXJuIGBcbiAgPCFET0NUWVBFIGh0bWw+XG4gICAgPGh0bWwgbGFuZz1cImVuXCI+XG4gICAgPGhlYWQ+XG4gICAgICA8bWV0YSBjaGFyc2V0PVwiVVRGLThcIj5cbiAgICAgIDxtZXRhIG5hbWU9XCJ2aWV3cG9ydFwiIGNvbnRlbnQ9XCJ3aWR0aD1kZXZpY2Utd2lkdGgsIGluaXRpYWwtc2NhbGU9MS4wXCI+XG4gICAgICA8dGl0bGU+NDA0IC0gTm90IGZvdW5kPC90aXRsZT5cbiAgICAgIDxzdHlsZT4gYm9keSB7IGZvbnQtZmFtaWx5OiBzYW5zLXNlcmlmOyBtYXgtd2lkdGg6IDQwZW07IG1hcmdpbjogYXV0bzsgcGFkZGluZzogMmVtOyBsaW5lLWhlaWdodDogMS41OyB9PC9zdHlsZT5cbiAgICA8L2hlYWQ+XG4gICAgPGJvZHk+XG4gICAgICA8aDE+NDA0IC0gTm90IGZvdW5kPC9oMT5cbiAgICAgIDxwPlRoZSBVUkwgPGNvZGU+JHtmaWxlfTwvY29kZT4gZG9lcyBub3QgZXhpc3Q8L3A+XG4gICAgICA8dWw+XG4gICAgJHtcbiAgICBjb250ZW50Lm1hcCgoW3VybCwgbmFtZV0pID0+IGBcbiAgICAgIDxsaT5cbiAgICAgICAgPGEgaHJlZj1cIiR7dXJsfVwiPlxuICAgICAgICAgICR7bmFtZX1cbiAgICAgICAgPC9hPlxuICAgICAgPC9saT5gKS5qb2luKFwiXFxuXCIpXG4gIH1cbiAgICAgIDwvdWw+XG4gICAgPC9ib2R5PlxuICA8L2h0bWw+YDtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxTQUFTLElBQUksRUFBRSxLQUFLLFFBQVEsa0JBQWtCO0FBQzlDLFNBQVMsS0FBSyxRQUFRLDBCQUEwQjtBQVVoRCxPQUFPLE1BQU0sV0FBb0I7RUFDL0IsTUFBTSxDQUFDLEVBQUUsS0FBSyxHQUFHLEdBQUcsTUFBTSxDQUFDO0VBQzNCLFNBQVM7RUFDVCxnQkFBZ0I7QUFDbEIsRUFBRTtBQUVGLG9CQUFvQixHQUNwQixlQUFlLFNBQVMsU0FBUyxXQUE4QjtFQUM3RCxNQUFNLFVBQVUsTUFBTSxVQUFVO0VBQ2hDLElBQUksRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLGNBQWMsRUFBRSxHQUFHO0VBRXhDLElB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