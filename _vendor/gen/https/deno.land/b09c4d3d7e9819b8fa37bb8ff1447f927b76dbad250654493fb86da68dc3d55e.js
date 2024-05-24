const headerLinkDefaults = {
  class: "header-anchor"
};
/**
 * Generate the anchor with the whole header. Example:
 *
 * ```html
 * <h1 id="foo">This is the title</h1>
 * is converted to:
 * <h1 id="foo"><a href="#foo">This is the title</a></h1>
 * ```
 */ export function headerLink(userOptions = {}) {
  const options = Object.assign({}, headerLinkDefaults, userOptions);
  // deno-lint-ignore no-explicit-any
  return function anchor(slug, state, i) {
    const linkOpen = new state.Token("link_open", "a", 1);
    linkOpen.attrSet("href", `#${slug}`);
    if (options.class) {
      linkOpen.attrSet("class", options.class);
    }
    const content = new state.Token("inline", "", 0);
    content.children = [
      linkOpen,
      ...state.tokens[i + 1].children,
      new state.Token("link_close", "a", -1)
    ];
    state.tokens[i + 1] = content;
  };
}
const LinkInsideHeaderOptions = {
  class: "header-anchor",
  placement: "after",
  ariaHidden: false,
  content: "#"
};
/**
 * Generate the anchor inside the header. Example:
 *
 * ```html
 * <h1 id="foo">This is the title</h1>
 * is converted to:
 * <h1 id="foo"><a href="#foo">#</a>This is the title</h1>
 * ```
 */ export function linkInsideHeader(userOptions = {}) {
  const options = Object.assign({}, LinkInsideHeaderOptions, userOptions);
  // deno-lint-ignore no-explicit-any
  return function anchor(slug, state, i) {
    const linkOpen = new state.Token("link_open", "a", 1);
    linkOpen.attrSet("href", `#${slug}`);
    if (options.class) {
      linkOpen.attrSet("class", options.class);
    }
    if (options.ariaHidden) {
      linkOpen.attrSet("aria-hidden", "true");
    }
    const content = new state.Token("html_inline", "", 0);
    content.content = options.content;
    content.meta = {
      isPermalinkSymbol: true
    };
    const linkTokens = [
      linkOpen,
      content,
      new state.Token("link_close", "a", -1)
    ];
    const space = new state.Token("text", "", 0);
    space.content = " ";
    if (options.placement === "after") {
      state.tokens[i + 1].children.push(space, ...linkTokens);
    } else {
      state.tokens[i + 1].children.unshift(...linkTokens, space);
    }
  };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvbHVtZV9tYXJrZG93bl9wbHVnaW5zQHYwLjcuMC90b2MvYW5jaG9ycy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJleHBvcnQgaW50ZXJmYWNlIEhlYWRlckxpbmtPcHRpb25zIHtcbiAgY2xhc3M6IHN0cmluZyB8IGZhbHNlO1xufVxuXG5jb25zdCBoZWFkZXJMaW5rRGVmYXVsdHM6IEhlYWRlckxpbmtPcHRpb25zID0ge1xuICBjbGFzczogXCJoZWFkZXItYW5jaG9yXCIsXG59O1xuXG4vKipcbiAqIEdlbmVyYXRlIHRoZSBhbmNob3Igd2l0aCB0aGUgd2hvbGUgaGVhZGVyLiBFeGFtcGxlOlxuICpcbiAqIGBgYGh0bWxcbiAqIDxoMSBpZD1cImZvb1wiPlRoaXMgaXMgdGhlIHRpdGxlPC9oMT5cbiAqIGlzIGNvbnZlcnRlZCB0bzpcbiAqIDxoMSBpZD1cImZvb1wiPjxhIGhyZWY9XCIjZm9vXCI+VGhpcyBpcyB0aGUgdGl0bGU8L2E+PC9oMT5cbiAqIGBgYFxuICovXG5leHBvcnQgZnVuY3Rpb24gaGVhZGVyTGluayh1c2VyT3B0aW9uczogUGFydGlhbDxIZWFkZXJMaW5rT3B0aW9ucz4gPSB7fSkge1xuICBjb25zdCBvcHRpb25zID0gT2JqZWN0LmFzc2lnbih7fSwgaGVhZGVyTGlua0RlZmF1bHRzLCB1c2VyT3B0aW9ucyk7XG5cbiAgLy8gZGVuby1saW50LWlnbm9yZSBuby1leHBsaWNpdC1hbnlcbiAgcmV0dXJuIGZ1bmN0aW9uIGFuY2hvcihzbHVnOiBzdHJpbmcsIHN0YXRlOiBhbnksIGk6IG51bWJlcikge1xuICAgIGNvbnN0IGxpbmtPcGVuID0gbmV3IHN0YXRlLlRva2VuKFwibGlua19vcGVuXCIsIFwiYVwiLCAxKTtcbiAgICBsaW5rT3Blbi5hdHRyU2V0KFwiaHJlZlwiLCBgIyR7c2x1Z31gKTtcblxuICAgIGlmIChvcHRpb25zLmNsYXNzKSB7XG4gICAgICBsaW5rT3Blbi5hdHRyU2V0KFwiY2xhc3NcIiwgb3B0aW9ucy5jbGFzcyk7XG4gICAgfVxuXG4gICAgY29uc3QgY29udGVudCA9IG5ldyBzdGF0ZS5Ub2tlbihcImlubGluZVwiLCBcIlwiLCAwKTtcbiAgICBjb250ZW50LmNoaWxkcmVuID0gW1xuICAgICAgbGlua09wZW4sXG4gICAgICAuLi5zdGF0ZS50b2tlbnNbaSArIDFdLmNoaWxkcmVuLFxuICAgICAgbmV3IHN0YXRlLlRva2VuKFwibGlua19jbG9zZVwiLCBcImFcIiwgLTEpLFxuICAgIF07XG5cbiAgICBzdGF0ZS50b2tlbnNbaSArIDFdID0gY29udGVudDtcbiAgfTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBMaW5rSW5zaWRlSGVhZGVyT3B0aW9ucyB7XG4gIGNsYXNzOiBzdHJpbmcgfCBmYWxzZTtcbiAgcGxhY2VtZW50OiBcImJlZm9yZVwiIHwgXCJhZnRlclwiO1xuICBhcmlhSGlkZGVuOiBib29sZWFuO1xuICBjb250ZW50OiBzdHJpbmc7XG59XG5cbmNvbnN0IExpbmtJbnNpZGVIZWFkZXJPcHRpb25zOiBMaW5rSW5zaWRlSGVhZGVyT3B0aW9ucyA9IHtcbiAgY2xhc3M6IFwiaGVhZGVyLWFuY2hvclwiLFxuICBwbGFjZW1lbnQ6IFwiYWZ0ZXJcIixcbiAgYXJpYUhpZGRlbjogZmFsc2UsXG4gIGNvbnRlbnQ6IFwiI1wiLFxufTtcblxuLyoqXG4gKiBHZW5lcmF0ZSB0aGUgYW5jaG9yIGluc2lkZSB0aGUgaGVhZGVyLiBFeGFtcGxlOlxuICpcbiAqIGBgYGh0bWxcbiAqIDxoMSBpZD1cImZvb1wiPlRoaXMgaXMgdGhlIHRpdGxlPC9oMT5cbiAqIGlzIGNvbnZlcnRlZCB0bzpcbiAqIDxoMSBpZD1cImZvb1wiPjxhIGhyZWY9XCIjZm9vXCI+IzwvYT5UaGlzIGlzIHRoZSB0aXRsZTwvaDE+XG4gKiBgYGBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGxpbmtJbnNpZGVIZWFkZXIoXG4gIHVzZXJPcHRpb25zOiBQYXJ0aWFsPExpbmtJbnNpZGVIZWFkZXJPcHRpb25zPiA9IHt9LFxuKSB7XG4gIGNvbnN0IG9wdGlvbnMgPSBPYmplY3QuYXNzaWduKHt9LCBMaW5rSW5zaWRlSGVhZGVyT3B0aW9ucywgdXNlck9wdGlvbnMpO1xuXG4gIC8vIGRlbm8tbGludC1pZ25vcmUgbm8tZXhwbGljaXQtYW55XG4gIHJldHVybiBmdW5jdGlvbiBhbmNob3Ioc2x1Zzogc3RyaW5nLCBzdGF0ZTogYW55LCBpOiBudW1iZXIpIHtcbiAgICBjb25zdCBsaW5rT3BlbiA9IG5ldyBzdGF0ZS5Ub2tlbihcImxpbmtfb3BlblwiLCBcImFcIiwgMSk7XG4gICAgbGlua09wZW4uYXR0clNldChcImhyZWZcIiwgYCMke3NsdWd9YCk7XG5cbiAgICBpZiAob3B0aW9ucy5jbGFzcykge1xuICAgICAgbGlua09wZW4uYXR0clNldChcImNsYXNzXCIsIG9wdGlvbnMuY2xhc3MpO1xuICAgIH1cblxuICAgIGlmIChvcHRpb25zLmFyaWFIaWRkZW4pIHtcbiAgICAgIGxpbmtPcGVuLmF0dHJTZXQoXCJhcmlhLWhpZGRlblwiLCBcInRydWVcIik7XG4gICAgfVxuXG4gICAgY29uc3QgY29udGVudCA9IG5ldyBzdGF0ZS5Ub2tlbihcImh0bWxfaW5saW5lXCIsIFwiXCIsIDApO1xuICAgIGNvbnRlbnQuY29udGVudCA9IG9wdGlvbnMuY29udGVudDtcbiAgICBjb250ZW50Lm1ldGEgPSB7IGlzUGVybWFsaW5rU3ltYm9sOiB0cnVlIH07XG5cbiAgICBjb25zdCBsaW5rVG9rZW5zID0gW1xuICAgICAgbGlua09wZW4sXG4gICAgICBjb250ZW50LFxuICAgICAgbmV3IHN0YXRlLlRva2VuKFwibGlua19jbG9zZVwiLCBcImFcIiwgLTEpLFxuICAgIF07XG5cbiAgICBjb25zdCBzcGFjZSA9IG5ldyBzdGF0ZS5Ub2tlbihcInRleHRcIiwgXCJcIiwgMCk7XG4gICAgc3BhY2UuY29udGVudCA9IFwiIFwiO1xuXG4gICAgaWYgKG9wdGlvbnMucGxhY2VtZW50ID09PSBcImFmdGVyXCIpIHtcbiAgICAgIHN0YXRlLnRva2Vuc1tpICsgMV0uY2hpbGRyZW4ucHVzaChzcGFjZSwgLi4ubGlua1Rva2Vucyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0YXRlLnRva2Vuc1tpICsgMV0uY2hpbGRyZW4udW5zaGlmdCguLi5saW5rVG9rZW5zLCBzcGFjZSk7XG4gICAgfVxuICB9O1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUlBLE1BQU0scUJBQXdDO0VBQzVDLE9BQU87QUFDVDtBQUVBOzs7Ozs7OztDQVFDLEdBQ0QsT0FBTyxTQUFTLFdBQVcsY0FBMEMsQ0FBQyxDQUFDO0VBQ3JFLE1BQU0sVUFBVSxPQUFPLE1BQU0sQ0FBQyxDQUFDLEdBQUcsb0JBQW9CO0VBRXRELG1DQUFtQztFQUNuQyxPQUFPLFNBQVMsT0FBTyxJQUFZLEVBQUUsS0FBVSxFQUFFLENBQVM7SUFDeEQsTUFBTSxXQUFXLElBQUksTUFBTSxLQUFLLENBQUMsYUFBYSxLQUFLO0lBQ25ELFNBQVMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDO0lBRW5DLElBQUksUUFBUSxLQUFLLEVBQUU7TUFDakIsU0FBUyxPQUFPLENBQUMsU0FBUyxRQUFRLEtBQUs7SUFDekM7SUFFQSxNQUFNLFVBQVUsSUFBSSxNQUFNLEtBQUssQ0FBQyxVQUFVLElBQUk7SUFDOUMsUUFBUSxRQUFRLEdBQUc7TUFDakI7U0FDRyxNQUFNLE1BQU0sQ0FBQyxJQUFJLEVBQUUsQ0FBQyxRQUFRO01BQy9CLElBQUksTUFBTSxLQUFLLENBQUMsY0FBYyxLQUFLLENBQUM7S0FDckM7SUFFRCxNQUFNLE1BQU0sQ0FBQyxJQUFJLEVBQUUsR0FBRztFQUN4QjtBQUNGO0FBU0EsTUFBTSwwQkFBbUQ7RUFDdkQsT0FBTztFQUNQLFdBQVc7RUFDWCxZQUFZO0VBQ1osU0FBUztBQUNYO0FBRUE7Ozs7Ozs7O0NBUUMsR0FDRCxPQUFPLFNBQVMsaUJBQ2QsY0FBZ0QsQ0FBQyxDQUFDO0VBRWxELE1BQU0sVUFBVSxPQUFPLE1BQU0sQ0FBQyxDQUFDLEdBQUcseUJBQXlCO0VBRTNELG1DQUFtQztFQUNuQyxPQUFPLFNBQVMsT0FBTyxJQUFZLEVBQUUsS0FBVSxFQUFFLENBQVM7SUFDeEQsTUFBTSxXQUFXLElBQUksTUFBTSxLQUFLLENBQUMsYUFBYSxLQUFLO0lBQ25ELFNBQVMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDO0lBRW5DLElBQUksUUFBUSxLQUFLLEVBQUU7TUFDakIsU0FBUyxPQUFPLENBQUMsU0FBUyxRQUFRLEtBQUs7SUFDekM7SUFFQSxJQUFJLFFBQVEsVUFBVSxFQUFFO01BQ3RCLFNBQVMsT0FBTyxDQUFDLGVBQWU7SUFDbEM7SUFFQSxNQUFNLFVBQVUsSUFBSSxNQUFNLEtBQUssQ0FBQyxlQUFlLElBQUk7SUFDbkQsUUFBUSxPQUFPLEdBQUcsUUFBUSxPQUFPO0lBQ2pDLFFBQVEsSUFBSSxHQUFHO01BQUUsbUJBQW1CO0lBQUs7SUFFekMsTUFBTSxhQUFhO01BQ2pCO01BQ0E7TUFDQSxJQUFJLE1BQU0sS0FBSyxDQUFDLGNBQWMsS0FBSyxDQUFDO0tBQ3JDO0lBRUQsTUFBTSxRQUFRLElBQUksTUFBTSxLQUFLLENBQUMsUUFBUSxJQUFJO0lBQzFDLE1BQU0sT0FBTyxHQUFHO0lBRWhCLElBQUksUUFBUSxTQUFTLEtBQUssU0FBUztNQUNqQyxNQUFNLE1BQU0sQ0FBQyxJQUFJLEVBQUUsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLFVBQVU7SUFDOUMsT0FBTztNQUNMLE1BQU0sTUFBTSxDQUFDLElBQUksRUFBRSxDQUFDLFFBQVEsQ0FBQyxPQUFPLElBQUksWUFBWTtJQUN0RDtFQUNGO0FBQ0YifQ==