/**
 * Plugin adapted from https://github.com/nagaozen/markdown-it-toc-done-right
 * Copyright (c) 2018 Fabio Zendhi Nagao
 */ // deno-lint-ignore-file no-explicit-any
import { headerLink } from "./anchors.ts";
import { getRawText } from "../utils.ts";
export const defaults = {
  level: 2,
  key: "toc",
  anchor: headerLink(),
  slugify,
  tabIndex: -1
};
export default function toc(md, userOptions = {}) {
  const options = Object.assign({}, defaults, userOptions);
  function headings2ast(state, pageUrl) {
    const tokens = state.tokens;
    const ast = {
      level: 0,
      text: "",
      slug: "",
      url: "",
      children: []
    };
    const stack = [
      ast
    ];
    const slugs = new Set();
    for(let i = 0; i < tokens.length; i++){
      const token = tokens[i];
      if (token.type !== "heading_open") {
        continue;
      }
      // Calculate the level
      const level = parseInt(token.tag.substr(1), 10);
      if (level < options.level) {
        continue;
      }
      // Get the text
      const text = getRawText(tokens[i + 1].children);
      // Get the slug
      let slug = token.attrGet("id") || options.slugify(text);
      // Make sure the slug is unique
      while(slugs.has(slug)){
        slug += "-1";
      }
      slugs.add(slug);
      token.attrSet("id", slug);
      if (options.tabIndex !== false) {
        token.attrSet("tabindex", `${options.tabIndex}`);
      }
      if (options.anchor) {
        options.anchor(slug, state, i);
      }
      // A permalink renderer could modify the `tokens` array so
      // make sure to get the up-to-date index on each iteration.
      i = tokens.indexOf(token);
      // Create the node
      const url = pageUrl ? `${pageUrl}#${slug}` : `#${slug}`;
      // Save the node in the tree
      const node = {
        level,
        text,
        slug,
        url,
        children: []
      };
      if (node.level > stack[0].level) {
        stack[0].children.push(node);
        stack.unshift(node);
        continue;
      }
      if (node.level === stack[0].level) {
        stack[1].children.push(node);
        stack[0] = node;
        continue;
      }
      while(node.level <= stack[0].level){
        stack.shift();
      }
      stack[0].children.push(node);
      stack.unshift(node);
    }
    return ast.children;
  }
  md.core.ruler.push("generateTocAst", function(state) {
    const data = state.env.data?.page?.data;
    if (!data) {
      return;
    }
    data[options.key] = headings2ast(state, data.url);
  });
}
function slugify(x) {
  return encodeURIComponent(String(x).trim().toLowerCase().replace(/\s+/g, "-"));
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvbHVtZV9tYXJrZG93bl9wbHVnaW5zQHYwLjcuMC90b2MvbW9kLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogUGx1Z2luIGFkYXB0ZWQgZnJvbSBodHRwczovL2dpdGh1Yi5jb20vbmFnYW96ZW4vbWFya2Rvd24taXQtdG9jLWRvbmUtcmlnaHRcbiAqIENvcHlyaWdodCAoYykgMjAxOCBGYWJpbyBaZW5kaGkgTmFnYW9cbiAqL1xuXG4vLyBkZW5vLWxpbnQtaWdub3JlLWZpbGUgbm8tZXhwbGljaXQtYW55XG5pbXBvcnQgeyBoZWFkZXJMaW5rIH0gZnJvbSBcIi4vYW5jaG9ycy50c1wiO1xuaW1wb3J0IHsgZ2V0UmF3VGV4dCB9IGZyb20gXCIuLi91dGlscy50c1wiO1xuXG5leHBvcnQgaW50ZXJmYWNlIE9wdGlvbnMge1xuICAvKiogTWluaW11bSBsZXZlbCB0byBhcHBseSBhbmNob3JzLiAqL1xuICBsZXZlbDogbnVtYmVyO1xuXG4gIC8qKiBLZXkgdG8gc2F2ZSB0aGUgdG9jIGluIHRoZSBwYWdlIGRhdGEgKi9cbiAga2V5OiBzdHJpbmc7XG5cbiAgLyoqIEFuY2hvciB0eXBlICovXG4gIGFuY2hvcjogZmFsc2UgfCAoKHNsdWc6IHN0cmluZywgc3RhdGU6IGFueSwgaWR4OiBudW1iZXIpID0+IHZvaWQpO1xuXG4gIC8qKiBTbHVnaWZ5IGZ1bmN0aW9uICovXG4gIHNsdWdpZnk6ICh4OiBzdHJpbmcpID0+IHN0cmluZztcblxuICAvKiogVmFsdWUgb2YgdGhlIHRhYmluZGV4IGF0dHJpYnV0ZSBvbiBoZWFkaW5ncywgc2V0IHRvIGZhbHNlIHRvIGRpc2FibGUuICovXG4gIHRhYkluZGV4OiBudW1iZXIgfCBmYWxzZTtcbn1cblxuZXhwb3J0IGNvbnN0IGRlZmF1bHRzOiBPcHRpb25zID0ge1xuICBsZXZlbDogMixcbiAga2V5OiBcInRvY1wiLFxuICBhbmNob3I6IGhlYWRlckxpbmsoKSxcbiAgc2x1Z2lmeSxcbiAgdGFiSW5kZXg6IC0xLFxufTtcblxuZXhwb3J0IGludGVyZmFjZSBOb2RlIHtcbiAgbGV2ZWw6IG51bWJlcjtcbiAgdGV4dDogc3RyaW5nO1xuICBzbHVnOiBzdHJpbmc7XG4gIHVybDogc3RyaW5nO1xuICBjaGlsZHJlbjogTm9kZVtdO1xufVxuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiB0b2MobWQ6IGFueSwgdXNlck9wdGlvbnM6IFBhcnRpYWw8T3B0aW9ucz4gPSB7fSkge1xuICBjb25zdCBvcHRpb25zID0gT2JqZWN0LmFzc2lnbih7fSwgZGVmYXVsdHMsIHVzZXJPcHRpb25zKSBhcyBPcHRpb25zO1xuXG4gIGZ1bmN0aW9uIGhlYWRpbmdzMmFzdChzdGF0ZTogYW55LCBwYWdlVXJsPzogc3RyaW5nKTogTm9kZVtdIHtcbiAgICBjb25zdCB0b2tlbnM6IGFueVtdID0gc3RhdGUudG9rZW5zO1xuICAgIGNvbnN0IGFzdDogTm9kZSA9IHsgbGV2ZWw6IDAsIHRleHQ6IFwiXCIsIHNsdWc6IFwiXCIsIHVybDogXCJcIiwgY2hpbGRyZW46IFtdIH07XG4gICAgY29uc3Qgc3RhY2sgPSBbYXN0XTtcbiAgICBjb25zdCBzbHVncyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0b2tlbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IHRva2VuID0gdG9rZW5zW2ldO1xuXG4gICAgICBpZiAodG9rZW4udHlwZSAhPT0gXCJoZWFkaW5nX29wZW5cIikge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgLy8gQ2FsY3VsYXRlIHRoZSBsZXZlbFxuICAgICAgY29uc3QgbGV2ZWwgPSBwYXJzZUludCh0b2tlbi50YWcuc3Vic3RyKDEpLCAxMCk7XG5cbiAgICAgIGlmIChsZXZlbCA8IG9wdGlvbnMubGV2ZWwpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIC8vIEdldCB0aGUgdGV4dFxuICAgICAgY29uc3QgdGV4dCA9IGdldFJhd1RleHQodG9rZW5zW2kgKyAxXS5jaGlsZHJlbik7XG5cbiAgICAgIC8vIEdldCB0aGUgc2x1Z1xuICAgICAgbGV0IHNsdWcgPSB0b2tlbi5hdHRyR2V0KFwiaWRcIikgfHwgb3B0aW9ucy5zbHVnaWZ5KHRleHQpO1xuXG4gICAgICAvLyBNYWtlIHN1cmUgdGhlIHNsdWcgaXMgdW5pcXVlXG4gICAgICB3aGlsZSAoc2x1Z3MuaGFzKHNsdWcpKSB7XG4gICAgICAgIHNsdWcgKz0gXCItMVwiO1xuICAgICAgfVxuICAgICAgc2x1Z3MuYWRkKHNsdWcpO1xuXG4gICAgICB0b2tlbi5hdHRyU2V0KFwiaWRcIiwgc2x1Zyk7XG5cbiAgICAgIGlmIChvcHRpb25zLnRhYkluZGV4ICE9PSBmYWxzZSkge1xuICAgICAgICB0b2tlbi5hdHRyU2V0KFwidGFiaW5kZXhcIiwgYCR7b3B0aW9ucy50YWJJbmRleH1gKTtcbiAgICAgIH1cblxuICAgICAgaWYgKG9wdGlvbnMuYW5jaG9yKSB7XG4gICAgICAgIG9wdGlvbnMuYW5jaG9yKHNsdWcsIHN0YXRlLCBpKTtcbiAgICAgIH1cblxuICAgICAgLy8gQSBwZXJtYWxpbmsgcmVuZGVyZXIgY291bGQgbW9kaWZ5IHRoZSBgdG9rZW5zYCBhcnJheSBzb1xuICAgICAgLy8gbWFrZSBzdXJlIHRvIGdldCB0aGUgdXAtdG8tZGF0ZSBpbmRleCBvbiBlYWNoIGl0ZXJhdGlvbi5cbiAgICAgIGkgPSB0b2tlbnMuaW5kZXhPZih0b2tlbik7XG5cbiAgICAgIC8vIENyZWF0ZSB0aGUgbm9kZVxuICAgICAgY29uc3QgdXJsID0gcGFnZVVybCA/IGAke3BhZ2VVcmx9IyR7c2x1Z31gIDogYCMke3NsdWd9YDtcblxuICAgICAgLy8gU2F2ZSB0aGUgbm9kZSBpbiB0aGUgdHJlZVxuICAgICAgY29uc3Qgbm9kZTogTm9kZSA9IHsgbGV2ZWwsIHRleHQsIHNsdWcsIHVybCwgY2hpbGRyZW46IFtdIH07XG5cbiAgICAgIGlmIChub2RlLmxldmVsID4gc3RhY2tbMF0ubGV2ZWwpIHtcbiAgICAgICAgc3RhY2tbMF0uY2hpbGRyZW4ucHVzaChub2RlKTtcbiAgICAgICAgc3RhY2sudW5zaGlmdChub2RlKTtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIGlmIChub2RlLmxldmVsID09PSBzdGFja1swXS5sZXZlbCkge1xuICAgICAgICBzdGFja1sxXS5jaGlsZHJlbi5wdXNoKG5vZGUpO1xuICAgICAgICBzdGFja1swXSA9IG5vZGU7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICB3aGlsZSAobm9kZS5sZXZlbCA8PSBzdGFja1swXS5sZXZlbCkge1xuICAgICAgICBzdGFjay5zaGlmdCgpO1xuICAgICAgfVxuICAgICAgc3RhY2tbMF0uY2hpbGRyZW4ucHVzaChub2RlKTtcbiAgICAgIHN0YWNrLnVuc2hpZnQobm9kZSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGFzdC5jaGlsZHJlbjtcbiAgfVxuXG4gIG1kLmNvcmUucnVsZXIucHVzaChcImdlbmVyYXRlVG9jQXN0XCIsIGZ1bmN0aW9uIChzdGF0ZTogYW55KSB7XG4gICAgY29uc3QgZGF0YSA9IHN0YXRlLmVudi5kYXRhPy5wYWdlPy5kYXRhO1xuXG4gICAgaWYgKCFkYXRhKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgZGF0YVtvcHRpb25zLmtleV0gPSBoZWFkaW5nczJhc3Qoc3RhdGUsIGRhdGEudXJsKTtcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIHNsdWdpZnkoeDogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIGVuY29kZVVSSUNvbXBvbmVudChcbiAgICBTdHJpbmcoeCkudHJpbSgpLnRvTG93ZXJDYXNlKCkucmVwbGFjZSgvXFxzKy9nLCBcIi1cIiksXG4gICk7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztDQUdDLEdBRUQsd0NBQXdDO0FBQ3hDLFNBQVMsVUFBVSxRQUFRLGVBQWU7QUFDMUMsU0FBUyxVQUFVLFFBQVEsY0FBYztB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