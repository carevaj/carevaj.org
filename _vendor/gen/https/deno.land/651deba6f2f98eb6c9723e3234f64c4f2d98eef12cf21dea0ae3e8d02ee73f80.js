export default function() {
  return (env)=>{
    env.tags.push(layoutTag);
  };
}
function layoutTag(env, code, output, tokens) {
  if (!code.startsWith("layout ")) {
    return;
  }
  const match = code?.match(/^layout\s+([^{]+|`[^`]+`)+(?:\{([\s|\S]*)\})?$/);
  if (!match) {
    throw new Error(`Invalid wrap: ${code}`);
  }
  const [_, file, data] = match;
  const varname = output.startsWith("__layout") ? output + "_layout" : "__layout";
  const compiled = [];
  const compiledFilters = env.compileFilters(tokens, varname);
  compiled.push("{");
  compiled.push(`let ${varname} = "";`);
  compiled.push(...env.compileTokens(tokens, varname, [
    "/layout"
  ]));
  if (tokens.length && (tokens[0][0] !== "tag" || tokens[0][1] !== "/layout")) {
    throw new Error(`Missing closing tag for layout tag: ${code}`);
  }
  tokens.shift();
  compiled.push(`${varname} = ${compiledFilters};`);
  const { dataVarname } = env.options;
  compiled.push(`const __tmp = await __env.run(${file},
      {...${dataVarname}${data ? `, ${data}` : ""}, content: ${env.compileFilters(tokens, varname)}},
      __file
    );
    ${output} += __tmp.content;`);
  compiled.push("}");
  return compiled.join("\n");
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvdmVudG9AdjAuMTIuNS9wbHVnaW5zL2xheW91dC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgdHlwZSB7IFRva2VuIH0gZnJvbSBcIi4uL3NyYy90b2tlbml6ZXIudHNcIjtcbmltcG9ydCB0eXBlIHsgRW52aXJvbm1lbnQgfSBmcm9tIFwiLi4vc3JjL2Vudmlyb25tZW50LnRzXCI7XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIChlbnY6IEVudmlyb25tZW50KSA9PiB7XG4gICAgZW52LnRhZ3MucHVzaChsYXlvdXRUYWcpO1xuICB9O1xufVxuXG5mdW5jdGlvbiBsYXlvdXRUYWcoXG4gIGVudjogRW52aXJvbm1lbnQsXG4gIGNvZGU6IHN0cmluZyxcbiAgb3V0cHV0OiBzdHJpbmcsXG4gIHRva2VuczogVG9rZW5bXSxcbik6IHN0cmluZyB8IHVuZGVmaW5lZCB7XG4gIGlmICghY29kZS5zdGFydHNXaXRoKFwibGF5b3V0IFwiKSkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGNvbnN0IG1hdGNoID0gY29kZT8ubWF0Y2goXG4gICAgL15sYXlvdXRcXHMrKFtee10rfGBbXmBdK2ApKyg/OlxceyhbXFxzfFxcU10qKVxcfSk/JC8sXG4gICk7XG5cbiAgaWYgKCFtYXRjaCkge1xuICAgIHRocm93IG5ldyBFcnJvcihgSW52YWxpZCB3cmFwOiAke2NvZGV9YCk7XG4gIH1cblxuICBjb25zdCBbXywgZmlsZSwgZGF0YV0gPSBtYXRjaDtcblxuICBjb25zdCB2YXJuYW1lID0gb3V0cHV0LnN0YXJ0c1dpdGgoXCJfX2xheW91dFwiKVxuICAgID8gb3V0cHV0ICsgXCJfbGF5b3V0XCJcbiAgICA6IFwiX19sYXlvdXRcIjtcblxuICBjb25zdCBjb21waWxlZDogc3RyaW5nW10gPSBbXTtcbiAgY29uc3QgY29tcGlsZWRGaWx0ZXJzID0gZW52LmNvbXBpbGVGaWx0ZXJzKHRva2VucywgdmFybmFtZSk7XG5cbiAgY29tcGlsZWQucHVzaChcIntcIik7XG4gIGNvbXBpbGVkLnB1c2goYGxldCAke3Zhcm5hbWV9ID0gXCJcIjtgKTtcbiAgY29tcGlsZWQucHVzaCguLi5lbnYuY29tcGlsZVRva2Vucyh0b2tlbnMsIHZhcm5hbWUsIFtcIi9sYXlvdXRcIl0pKTtcblxuICBpZiAodG9rZW5zLmxlbmd0aCAmJiAodG9rZW5zWzBdWzBdICE9PSBcInRhZ1wiIHx8IHRva2Vuc1swXVsxXSAhPT0gXCIvbGF5b3V0XCIpKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBNaXNzaW5nIGNsb3NpbmcgdGFnIGZvciBsYXlvdXQgdGFnOiAke2NvZGV9YCk7XG4gIH1cblxuICB0b2tlbnMuc2hpZnQoKTtcblxuICBjb21waWxlZC5wdXNoKGAke3Zhcm5hbWV9ID0gJHtjb21waWxlZEZpbHRlcnN9O2ApO1xuICBjb25zdCB7IGRhdGFWYXJuYW1lIH0gPSBlbnYub3B0aW9ucztcblxuICBjb21waWxlZC5wdXNoKFxuICAgIGBjb25zdCBfX3RtcCA9IGF3YWl0IF9fZW52LnJ1bigke2ZpbGV9LFxuICAgICAgey4uLiR7ZGF0YVZhcm5hbWV9JHtkYXRhID8gYCwgJHtkYXRhfWAgOiBcIlwifSwgY29udGVudDogJHtcbiAgICAgIGVudi5jb21waWxlRmlsdGVycyh0b2tlbnMsIHZhcm5hbWUpXG4gICAgfX0sXG4gICAgICBfX2ZpbGVcbiAgICApO1xuICAgICR7b3V0cHV0fSArPSBfX3RtcC5jb250ZW50O2AsXG4gICk7XG5cbiAgY29tcGlsZWQucHVzaChcIn1cIik7XG4gIHJldHVybiBjb21waWxlZC5qb2luKFwiXFxuXCIpO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUdBLGVBQWU7RUFDYixPQUFPLENBQUM7SUFDTixJQUFJLElBQUksQ0FBQyxJQUFJLENBQUM7RUFDaEI7QUFDRjtBQUVBLFNBQVMsVUFDUCxHQUFnQixFQUNoQixJQUFZLEVBQ1osTUFBYyxFQUNkLE1BQWU7RUFFZixJQUFJLENBQUMsS0FBSyxVQUFVLENBQUMsWUFBWTtJQUMvQjtFQUNGO0VBRUEsTUFBTSxRQUFRLE1BQU0sTUFDbEI7RUFHRixJQUFJLENBQUMsT0FBTztJQUNWLE1BQU0sSUFBSSxNQUFNLENBQUMsY0FBYyxFQUFFLEtBQUssQ0FBQztFQUN6QztFQUVBLE1BQU0sQ0FBQyxHQUFHLE1BQU0sS0FBSyxHQUFHO0VBRXhCLE1BQU0sVUFBVSxPQUFPLFVBQVUsQ0FBQyxjQUM5QixTQUFTLFlBQ1Q7RUFFSixNQUFNLFdBQXFCLEVBQUU7RUFDN0IsTUFBTSxrQkFBa0IsSUFBSSxjQUFjLENBQUMsUUFBUTtFQUVuRCxTQUFTLElBQUksQ0FBQztFQUNkLFNBQVMsSUFBSSxDQUFDLENBQUMsSUFBSSxFQUFFLFFBQVEsTUFBTSxDQUFDO0VBQ3BDLFNBQVMsSUFBSSxJQUFJLElBQUksYUFBYSxDQUFDLFFBQVEsU0FBUztJQUFDO0dBQVU7RUFFL0QsSUFBSSxPQUFPLE1BQU0sSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsRUFBRSxLQUFLLFNBQVMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEtBQUssU0FBUyxHQUFHO0lBQzNFLE1BQU0sSUFBSSxNQUFNLENBQUMsb0NBQW9DLEVBQUUsS0FBSyxDQUFDO0VBQy9EO0VBRUEsT0FBTyxLQUFLO0VBRVosU0FBUyxJQUFJLENBQUMsQ0FBQyxFQUFFLFFBQVEsR0FBRyxFQUFFLGdCQUFnQixDQUFDLENBQUM7RUFDaEQsTUFBTSxFQUFFLFdBQVcsRUFBRSxHQUFHLElBQUksT0FBTztFQUVuQyxTQUFTLElBQUksQ0FDWCxDQUFDLDhCQUE4QixFQUFFLEtBQUs7VUFDaEMsRUFBRSxZQUFZLEVBQUUsT0FBTyxDQUFDLEVBQUUsRUFBRSxLQUFLLENBQUMsR0FBRyxHQUFHLFdBQVcsRUFDdkQsSUFBSSxjQUFjLENBQUMsUUFBUSxTQUM1Qjs7O0lBR0QsRUFBRSxPQUFPLGtCQUFrQixDQUFDO0VBRzlCLFNBQVMsSUFBSSxDQUFDO0VBQ2QsT0FBTyxTQUFTLElBQUksQ0FBQztBQUN2QiJ9