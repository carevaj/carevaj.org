export default function() {
  return (env)=>{
    env.tags.push(forTag);
    env.utils.toIterator = toIterator;
  };
}
function forTag(env, code, output, tokens) {
  if (!code.startsWith("for ")) {
    return;
  }
  const compiled = [];
  const match = code.match(/^for\s+(await\s+)?(\w+)(?:,\s*(\w+))?\s+of\s+([\s|\S]+)$/);
  if (!match) {
    throw new Error(`Invalid for loop: ${code}`);
  }
  const [_, aw, var1, var2, collection] = match;
  if (var2) {
    compiled.push(`for ${aw || ""}(let [${var1}, ${var2}] of __env.utils.toIterator(${env.compileFilters(tokens, collection)}, true)) {`);
  } else {
    compiled.push(`for ${aw || ""}(let ${var1} of __env.utils.toIterator(${env.compileFilters(tokens, collection)})) {`);
  }
  compiled.push(...env.compileTokens(tokens, output, [
    "/for"
  ]));
  tokens.shift();
  compiled.push("}");
  return compiled.join("\n");
}
function toIterator(// deno-lint-ignore no-explicit-any
item, withKeys = false) {
  if (item === undefined || item === null) {
    return [];
  }
  if (Array.isArray(item)) {
    return withKeys ? Object.entries(item) : item;
  }
  if (typeof item === "function") {
    return toIterator(item(), withKeys);
  }
  if (typeof item === "object" && item !== null) {
    if (typeof item[Symbol.iterator] === "function") {
      if (withKeys) {
        return iterableToEntries(item);
      }
      return item;
    }
    if (typeof item[Symbol.asyncIterator] === "function") {
      if (withKeys) {
        return asyncIterableToEntries(item);
      }
      return item;
    }
    return withKeys ? Object.entries(item) : Object.values(item);
  }
  if (typeof item === "string") {
    return toIterator(item.split(""), withKeys);
  }
  if (typeof item === "number") {
    return toIterator(new Array(item).fill(0).map((_, i)=>i + 1), withKeys);
  }
  return toIterator([
    item
  ], withKeys);
}
function* iterableToEntries(iterator) {
  let i = 0;
  for (const value of iterator){
    yield [
      i++,
      value
    ];
  }
}
async function* asyncIterableToEntries(iterator) {
  let i = 0;
  for await (const value of iterator){
    yield [
      i++,
      value
    ];
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvdmVudG9AdjAuMTIuNS9wbHVnaW5zL2Zvci50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgdHlwZSB7IFRva2VuIH0gZnJvbSBcIi4uL3NyYy90b2tlbml6ZXIudHNcIjtcbmltcG9ydCB0eXBlIHsgRW52aXJvbm1lbnQgfSBmcm9tIFwiLi4vc3JjL2Vudmlyb25tZW50LnRzXCI7XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIChlbnY6IEVudmlyb25tZW50KSA9PiB7XG4gICAgZW52LnRhZ3MucHVzaChmb3JUYWcpO1xuICAgIGVudi51dGlscy50b0l0ZXJhdG9yID0gdG9JdGVyYXRvcjtcbiAgfTtcbn1cblxuZnVuY3Rpb24gZm9yVGFnKFxuICBlbnY6IEVudmlyb25tZW50LFxuICBjb2RlOiBzdHJpbmcsXG4gIG91dHB1dDogc3RyaW5nLFxuICB0b2tlbnM6IFRva2VuW10sXG4pOiBzdHJpbmcgfCB1bmRlZmluZWQge1xuICBpZiAoIWNvZGUuc3RhcnRzV2l0aChcImZvciBcIikpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICBjb25zdCBjb21waWxlZDogc3RyaW5nW10gPSBbXTtcbiAgY29uc3QgbWF0Y2ggPSBjb2RlLm1hdGNoKFxuICAgIC9eZm9yXFxzKyhhd2FpdFxccyspPyhcXHcrKSg/OixcXHMqKFxcdyspKT9cXHMrb2ZcXHMrKFtcXHN8XFxTXSspJC8sXG4gICk7XG5cbiAgaWYgKCFtYXRjaCkge1xuICAgIHRocm93IG5ldyBFcnJvcihgSW52YWxpZCBmb3IgbG9vcDogJHtjb2RlfWApO1xuICB9XG4gIGNvbnN0IFtfLCBhdywgdmFyMSwgdmFyMiwgY29sbGVjdGlvbl0gPSBtYXRjaDtcblxuICBpZiAodmFyMikge1xuICAgIGNvbXBpbGVkLnB1c2goXG4gICAgICBgZm9yICR7YXcgfHwgXCJcIn0obGV0IFske3ZhcjF9LCAke3ZhcjJ9XSBvZiBfX2Vudi51dGlscy50b0l0ZXJhdG9yKCR7XG4gICAgICAgIGVudi5jb21waWxlRmlsdGVycyh0b2tlbnMsIGNvbGxlY3Rpb24pXG4gICAgICB9LCB0cnVlKSkge2AsXG4gICAgKTtcbiAgfSBlbHNlIHtcbiAgICBjb21waWxlZC5wdXNoKFxuICAgICAgYGZvciAke2F3IHx8IFwiXCJ9KGxldCAke3ZhcjF9IG9mIF9fZW52LnV0aWxzLnRvSXRlcmF0b3IoJHtcbiAgICAgICAgZW52LmNvbXBpbGVGaWx0ZXJzKHRva2VucywgY29sbGVjdGlvbilcbiAgICAgIH0pKSB7YCxcbiAgICApO1xuICB9XG5cbiAgY29tcGlsZWQucHVzaCguLi5lbnYuY29tcGlsZVRva2Vucyh0b2tlbnMsIG91dHB1dCwgW1wiL2ZvclwiXSkpO1xuICB0b2tlbnMuc2hpZnQoKTtcbiAgY29tcGlsZWQucHVzaChcIn1cIik7XG5cbiAgcmV0dXJuIGNvbXBpbGVkLmpvaW4oXCJcXG5cIik7XG59XG5cbmZ1bmN0aW9uIHRvSXRlcmF0b3IoXG4gIC8vIGRlbm8tbGludC1pZ25vcmUgbm8tZXhwbGljaXQtYW55XG4gIGl0ZW06IGFueSxcbiAgd2l0aEtleXMgPSBmYWxzZSxcbik6IEl0ZXJhYmxlPHVua25vd24+IHwgQXN5bmNJdGVyYWJsZTx1bmtub3duPiB8IEFycmF5PHVua25vd24+IHtcbiAgaWYgKGl0ZW0gPT09IHVuZGVmaW5lZCB8fCBpdGVtID09PSBudWxsKSB7XG4gICAgcmV0dXJuIFtdO1xuICB9XG5cbiAgaWYgKEFycmF5LmlzQXJyYXkoaXRlbSkpIHtcbiAgICByZXR1cm4gd2l0aEtleXMgPyBPYmplY3QuZW50cmllcyhpdGVtKSA6IGl0ZW07XG4gIH1cblxuICBpZiAodHlwZW9mIGl0ZW0gPT09IFwiZnVuY3Rpb25cIikge1xuICAgIHJldHVybiB0b0l0ZXJhdG9yKGl0ZW0oKSwgd2l0aEtleXMpO1xuICB9XG5cbiAgaWYgKHR5cGVvZiBpdGVtID09PSBcIm9iamVjdFwiICYmIGl0ZW0gIT09IG51bGwpIHtcbiAgICBpZiAodHlwZW9mIGl0ZW1bU3ltYm9sLml0ZXJhdG9yXSA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICBpZiAod2l0aEtleXMpIHtcbiAgICAgICAgcmV0dXJuIGl0ZXJhYmxlVG9FbnRyaWVzKGl0ZW0gYXMgSXRlcmFibGU8dW5rbm93bj4pO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGl0ZW0gYXMgSXRlcmFibGU8dW5rbm93bj47XG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBpdGVtW1N5bWJvbC5hc3luY0l0ZXJhdG9yXSA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICBpZiAod2l0aEtleXMpIHtcbiAgICAgICAgcmV0dXJuIGFzeW5jSXRlcmFibGVUb0VudHJpZXMoaXRlbSBhcyBBc3luY0l0ZXJhYmxlPHVua25vd24+KTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGl0ZW0gYXMgQXN5bmNJdGVyYWJsZTx1bmtub3duPjtcbiAgICB9XG5cbiAgICByZXR1cm4gd2l0aEtleXMgPyBPYmplY3QuZW50cmllcyhpdGVtKSA6IE9iamVjdC52YWx1ZXMoaXRlbSk7XG4gIH1cblxuICBpZiAodHlwZW9mIGl0ZW0gPT09IFwic3RyaW5nXCIpIHtcbiAgICByZXR1cm4gdG9JdGVyYXRvcihpdGVtLnNwbGl0KFwiXCIpLCB3aXRoS2V5cyk7XG4gIH1cblxuICBpZiAodHlwZW9mIGl0ZW0gPT09IFwibnVtYmVyXCIpIHtcbiAgICByZXR1cm4gdG9JdGVyYXRvcihuZXcgQXJyYXkoaXRlbSkuZmlsbCgwKS5tYXAoKF8sIGkpID0+IGkgKyAxKSwgd2l0aEtleXMpO1xuICB9XG5cbiAgcmV0dXJuIHRvSXRlcmF0b3IoW2l0ZW1dLCB3aXRoS2V5cyk7XG59XG5cbmZ1bmN0aW9uKiBpdGVyYWJsZVRvRW50cmllcyhcbiAgaXRlcmF0b3I6IEl0ZXJhYmxlPHVua25vd24+LFxuKTogR2VuZXJhdG9yPFtudW1iZXIsIHVua25vd25dPiB7XG4gIGxldCBpID0gMDtcbiAgZm9yIChjb25zdCB2YWx1ZSBvZiBpdGVyYXRvcikge1xuICAgIHlpZWxkIFtpKyssIHZhbHVlXTtcbiAgfVxufVxuXG5hc3luYyBmdW5jdGlvbiogYXN5bmNJdGVyYWJsZVRvRW50cmllcyhcbiAgaXRlcmF0b3I6IEFzeW5jSXRlcmFibGU8dW5rbm93bj4sXG4pOiBBc3luY0dlbmVyYXRvcjxbbnVtYmVyLCB1bmtub3duXT4ge1xuICBsZXQgaSA9IDA7XG4gIGZvciBhd2FpdCAoY29uc3QgdmFsdWUgb2YgaXRlcmF0b3IpIHtcbiAgICB5aWVsZCBbaSsrLCB2YWx1ZV07XG4gIH1cbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFHQSxlQUFlO0VBQ2IsT0FBTyxDQUFDO0lBQ04sSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDO0lBQ2QsSUFBSSxLQUFLLENBQUMsVUFBVSxHQUFHO0VBQ3pCO0FBQ0Y7QUFFQSxTQUFTLE9BQ1AsR0FBZ0IsRUFDaEIsSUFBWSxFQUNaLE1BQWMsRUFDZCxNQUFlO0VBRWYsSUFBSSxDQUFDLEtBQUssVUFBVSxDQUFDLFNBQVM7SUFDNUI7RUFDRjtFQUVBLE1BQU0sV0FBcUIsRUFBRTtFQUM3QixNQUFNLFFBQVEsS0FBSyxLQUFLLENBQ3RCO0VBR0YsSUFBSSxDQUFDLE9BQU87SUFDVixNQUFNLElBQUksTUFBTSxDQUFDLGtCQUFrQixFQUFFLEtBQUssQ0FBQztFQUM3QztFQUNBLE1BQU0sQ0FBQyxHQUFHLElBQUksTUFBTSxNQUFNLFdBQVcsR0FBRztFQUV4QyxJQUFJLE1BQU07SUFDUixTQUFTLElBQUksQ0FDWCxDQUFDLElBQUksRUFBRSxNQUFNLEdBQUcsTUFBTSxFQUFFLEtBQUssRUFBRSxFQUFFLEtBQUssNEJBQTRCLEVBQ2hFLElBQUksY0FBYyxDQUFDLFFBQVEsWUFDNUIsVUFBVSxDQUFDO0VBRWhCLE9BQU87SUFDTCxTQUFTLElBQUksQ0FDWCxDQUFDLElBQUksRUFBRSxNQUFNLEdBQUcsS0FBSyxFQUFFLEtBQUssMkJBQTJCLEVBQ3JELElBQUksY0FBYyxDQUFDLFFBQVEsWUFDNUIsSUFBSSxDQUFDO0VBRVY7RUFFQSxTQUFTLElBQUksSUFBSSxJQUFJLGFBQWEsQ0FBQyxRQUFRLFFBQVE7SUFBQztHQUFPO0VBQzNELE9BQU8sS0FBSztFQUNaLFNBQVMsSUFBSSxDQUFDO0VBRWQsT0FBTyxTQUFTLElBQUksQ0FBQztBQUN2QjtBQUVBLFNBQVMsV0FDUCxtQ0FBbUM7QUFDbkMsSUFBUyxFQUNULFdBQVcsS0FBSztFQUVoQixJQUFJLFNBQVMsYUFBYSxTQUFTLE1BQU07SUFDdkMsT0FBTyxFQUFFO0VBQ1g7RUFFQSxJQUFJLE1BQU0sT0FBTyxDQUFDLE9BQU87SUFDdkIsT0FBTyxXQUFXLE9BQU8sT0FBTyxDQUFDLFFBQVE7RUFDM0M7RUFFQSxJQUFJLE9BQU8sU0FBUyxZQUFZO0lBQzlCLE9BQU8sV0FBVyxRQUFRO0VBQzVCO0VBRUEsSUFBSSxPQUFPLFNBQVMsWUFBWSxTQUFTLE1BQU07SUFDN0MsSUFBSSxPQUFPLElBQUksQ0FBQyxPQUFPLFFBQVEsQ0FBQyxLQUFLLFlBQVk7TUFDL0MsSUFBSSxVQUFVO1FBQ1osT0FBTyxrQkFBa0I7TUFDM0I7TUFDQSxPQUFPO0lBQ1Q7SUFFQSxJQUFJLE9BQU8sSUFBSSxDQUFDLE9BQU8sYUFBYSxDQUFDLEtBQUssWUFBWTtNQUNwRCxJQUFJLFVBQVU7UUFDWixPQUFPLHVCQUF1QjtNQUNoQztNQUVBLE9BQU87SUFDVDtJQUVBLE9BQU8sV0FBVyxPQUFPLE9BQU8sQ0FBQyxRQUFRLE9BQU8sTUFBTSxDQUFDO0VBQ3pEO0VBRUEsSUFBSSxPQUFPLFNBQVMsVUFBVTtJQUM1QixPQUFPLFdBQVcsS0FBSyxLQUFLLENBQUMsS0FBSztFQUNwQztFQUVBLElBQUksT0FBTyxTQUFTLFVBQVU7SUFDNUIsT0FBTyxXQUFXLElBQUksTUFBTSxNQUFNLElBQUksQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBTSxJQUFJLElBQUk7RUFDbEU7RUFFQSxPQUFPLFdBQVc7SUFBQztHQUFLLEVBQUU7QUFDNUI7QUFFQSxVQUFVLGtCQUNSLFFBQTJCO0VBRTNCLElBQUksSUFBSTtFQUNSLEtBQUssTUFBTSxTQUFTLFNBQVU7SUFDNUIsTUFBTTtNQUFDO01BQUs7S0FBTTtFQUNwQjtBQUNGO0FBRUEsZ0JBQWdCLHVCQUNkLFFBQWdDO0VBRWhDLElBQUksSUFBSTtFQUNSLFdBQVcsTUFBTSxTQUFTLFNBQVU7SUFDbEMsTUFBTTtNQUFDO01BQUs7S0FBTTtFQUNwQjtBQUNGIn0=