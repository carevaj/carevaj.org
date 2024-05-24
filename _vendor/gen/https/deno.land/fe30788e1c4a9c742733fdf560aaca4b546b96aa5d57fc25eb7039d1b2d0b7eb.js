export default function() {
  return (env)=>{
    env.tags.push(ifTag);
    env.tags.push(elseTag);
  };
}
function ifTag(env, code, output, tokens) {
  if (!code.startsWith("if ")) {
    return;
  }
  const condition = code.replace(/^if\s+/, "").trim();
  const compiled = [];
  compiled.push(`if (${condition}) {`);
  compiled.push(...env.compileTokens(tokens, output, [
    "/if"
  ]));
  tokens.shift();
  compiled.push("}");
  return compiled.join("\n");
}
function elseTag(_env, code) {
  if (!code.startsWith("else ") && code !== "else") {
    return;
  }
  const match = code.match(/^else(\s+if\s+(.*))?$/);
  if (!match) {
    throw new Error(`Invalid else: ${code}`);
  }
  const [_, ifTag, condition] = match;
  if (ifTag) {
    return `} else if (${condition}) {`;
  }
  return "} else {";
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvdmVudG9AdjAuMTIuNS9wbHVnaW5zL2lmLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB0eXBlIHsgVG9rZW4gfSBmcm9tIFwiLi4vc3JjL3Rva2VuaXplci50c1wiO1xuaW1wb3J0IHR5cGUgeyBFbnZpcm9ubWVudCB9IGZyb20gXCIuLi9zcmMvZW52aXJvbm1lbnQudHNcIjtcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gKCkge1xuICByZXR1cm4gKGVudjogRW52aXJvbm1lbnQpID0+IHtcbiAgICBlbnYudGFncy5wdXNoKGlmVGFnKTtcbiAgICBlbnYudGFncy5wdXNoKGVsc2VUYWcpO1xuICB9O1xufVxuXG5mdW5jdGlvbiBpZlRhZyhcbiAgZW52OiBFbnZpcm9ubWVudCxcbiAgY29kZTogc3RyaW5nLFxuICBvdXRwdXQ6IHN0cmluZyxcbiAgdG9rZW5zOiBUb2tlbltdLFxuKTogc3RyaW5nIHwgdW5kZWZpbmVkIHtcbiAgaWYgKCFjb2RlLnN0YXJ0c1dpdGgoXCJpZiBcIikpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgY29uc3QgY29uZGl0aW9uID0gY29kZS5yZXBsYWNlKC9eaWZcXHMrLywgXCJcIikudHJpbSgpO1xuICBjb25zdCBjb21waWxlZDogc3RyaW5nW10gPSBbXTtcblxuICBjb21waWxlZC5wdXNoKGBpZiAoJHtjb25kaXRpb259KSB7YCk7XG4gIGNvbXBpbGVkLnB1c2goLi4uZW52LmNvbXBpbGVUb2tlbnModG9rZW5zLCBvdXRwdXQsIFtcIi9pZlwiXSkpO1xuICB0b2tlbnMuc2hpZnQoKTtcbiAgY29tcGlsZWQucHVzaChcIn1cIik7XG5cbiAgcmV0dXJuIGNvbXBpbGVkLmpvaW4oXCJcXG5cIik7XG59XG5cbmZ1bmN0aW9uIGVsc2VUYWcoXG4gIF9lbnY6IEVudmlyb25tZW50LFxuICBjb2RlOiBzdHJpbmcsXG4pOiBzdHJpbmcgfCB1bmRlZmluZWQge1xuICBpZiAoIWNvZGUuc3RhcnRzV2l0aChcImVsc2UgXCIpICYmIGNvZGUgIT09IFwiZWxzZVwiKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIGNvbnN0IG1hdGNoID0gY29kZS5tYXRjaCgvXmVsc2UoXFxzK2lmXFxzKyguKikpPyQvKTtcblxuICBpZiAoIW1hdGNoKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIGVsc2U6ICR7Y29kZX1gKTtcbiAgfVxuXG4gIGNvbnN0IFtfLCBpZlRhZywgY29uZGl0aW9uXSA9IG1hdGNoO1xuXG4gIGlmIChpZlRhZykge1xuICAgIHJldHVybiBgfSBlbHNlIGlmICgke2NvbmRpdGlvbn0pIHtgO1xuICB9XG5cbiAgcmV0dXJuIFwifSBlbHNlIHtcIjtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFHQSxlQUFlO0VBQ2IsT0FBTyxDQUFDO0lBQ04sSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDO0lBQ2QsSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDO0VBQ2hCO0FBQ0Y7QUFFQSxTQUFTLE1BQ1AsR0FBZ0IsRUFDaEIsSUFBWSxFQUNaLE1BQWMsRUFDZCxNQUFlO0VBRWYsSUFBSSxDQUFDLEtBQUssVUFBVSxDQUFDLFFBQVE7SUFDM0I7RUFDRjtFQUNBLE1BQU0sWUFBWSxLQUFLLE9BQU8sQ0FBQyxVQUFVLElBQUksSUFBSTtFQUNqRCxNQUFNLFdBQXFCLEVBQUU7RUFFN0IsU0FBUyxJQUFJLENBQUMsQ0FBQyxJQUFJLEVBQUUsVUFBVSxHQUFHLENBQUM7RUFDbkMsU0FBUyxJQUFJLElBQUksSUFBSSxhQUFhLENBQUMsUUFBUSxRQUFRO0lBQUM7R0FBTTtFQUMxRCxPQUFPLEtBQUs7RUFDWixTQUFTLElBQUksQ0FBQztFQUVkLE9BQU8sU0FBUyxJQUFJLENBQUM7QUFDdkI7QUFFQSxTQUFTLFFBQ1AsSUFBaUIsRUFDakIsSUFBWTtFQUVaLElBQUksQ0FBQyxLQUFLLFVBQVUsQ0FBQyxZQUFZLFNBQVMsUUFBUTtJQUNoRDtFQUNGO0VBQ0EsTUFBTSxRQUFRLEtBQUssS0FBSyxDQUFDO0VBRXpCLElBQUksQ0FBQyxPQUFPO0lBQ1YsTUFBTSxJQUFJLE1BQU0sQ0FBQyxjQUFjLEVBQUUsS0FBSyxDQUFDO0VBQ3pDO0VBRUEsTUFBTSxDQUFDLEdBQUcsT0FBTyxVQUFVLEdBQUc7RUFFOUIsSUFBSSxPQUFPO0lBQ1QsT0FBTyxDQUFDLFdBQVcsRUFBRSxVQUFVLEdBQUcsQ0FBQztFQUNyQztFQUVBLE9BQU87QUFDVCJ9