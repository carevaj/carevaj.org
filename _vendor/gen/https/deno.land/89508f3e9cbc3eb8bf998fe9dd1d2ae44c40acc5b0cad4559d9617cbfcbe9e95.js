export default function() {
  return (env)=>{
    env.tags.push(importTag);
  };
}
function importTag(env, code) {
  if (!code.startsWith("import ")) {
    return;
  }
  const match = code?.match(/^import\s+(\{[\s|\S]*\}|\w+)\s+from\s+(.+)$/);
  if (!match) {
    throw new Error(`Invalid import: ${code}`);
  }
  const [, vars, file] = match;
  const { dataVarname } = env.options;
  return `let ${vars} = await __env.run(${file}, {...${dataVarname}}, __file);`;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvdmVudG9AdjAuMTIuNS9wbHVnaW5zL2ltcG9ydC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgdHlwZSB7IEVudmlyb25tZW50IH0gZnJvbSBcIi4uL3NyYy9lbnZpcm9ubWVudC50c1wiO1xuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiAoZW52OiBFbnZpcm9ubWVudCkgPT4ge1xuICAgIGVudi50YWdzLnB1c2goaW1wb3J0VGFnKTtcbiAgfTtcbn1cblxuZnVuY3Rpb24gaW1wb3J0VGFnKFxuICBlbnY6IEVudmlyb25tZW50LFxuICBjb2RlOiBzdHJpbmcsXG4pOiBzdHJpbmcgfCB1bmRlZmluZWQge1xuICBpZiAoIWNvZGUuc3RhcnRzV2l0aChcImltcG9ydCBcIikpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICBjb25zdCBtYXRjaCA9IGNvZGU/Lm1hdGNoKFxuICAgIC9eaW1wb3J0XFxzKyhcXHtbXFxzfFxcU10qXFx9fFxcdyspXFxzK2Zyb21cXHMrKC4rKSQvLFxuICApO1xuXG4gIGlmICghbWF0Y2gpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgaW1wb3J0OiAke2NvZGV9YCk7XG4gIH1cblxuICBjb25zdCBbLCB2YXJzLCBmaWxlXSA9IG1hdGNoO1xuICBjb25zdCB7IGRhdGFWYXJuYW1lIH0gPSBlbnYub3B0aW9ucztcbiAgcmV0dXJuIGBsZXQgJHt2YXJzfSA9IGF3YWl0IF9fZW52LnJ1bigke2ZpbGV9LCB7Li4uJHtkYXRhVmFybmFtZX19LCBfX2ZpbGUpO2A7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBRUEsZUFBZTtFQUNiLE9BQU8sQ0FBQztJQUNOLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQztFQUNoQjtBQUNGO0FBRUEsU0FBUyxVQUNQLEdBQWdCLEVBQ2hCLElBQVk7RUFFWixJQUFJLENBQUMsS0FBSyxVQUFVLENBQUMsWUFBWTtJQUMvQjtFQUNGO0VBRUEsTUFBTSxRQUFRLE1BQU0sTUFDbEI7RUFHRixJQUFJLENBQUMsT0FBTztJQUNWLE1BQU0sSUFBSSxNQUFNLENBQUMsZ0JBQWdCLEVBQUUsS0FBSyxDQUFDO0VBQzNDO0VBRUEsTUFBTSxHQUFHLE1BQU0sS0FBSyxHQUFHO0VBQ3ZCLE1BQU0sRUFBRSxXQUFXLEVBQUUsR0FBRyxJQUFJLE9BQU87RUFDbkMsT0FBTyxDQUFDLElBQUksRUFBRSxLQUFLLG1CQUFtQixFQUFFLEtBQUssTUFBTSxFQUFFLFlBQVksV0FBVyxDQUFDO0FBQy9FIn0=