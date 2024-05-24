export default function() {
  return (env)=>{
    env.tags.push(exportTag);
  };
}
function exportTag(env, code, _output, tokens) {
  if (!code.startsWith("export ")) {
    return;
  }
  const expression = code.replace(/^export\s+/, "");
  const { dataVarname } = env.options;
  // Value is set (e.g. {{ export foo = "bar" }})
  if (expression.includes("=")) {
    const match = code.match(/^export\s+([\w]+)\s*=\s*([\s\S]+)$/);
    if (!match) {
      throw new Error(`Invalid export tag: ${code}`);
    }
    const [, variable, value] = match;
    const val = env.compileFilters(tokens, value);
    return `if (${dataVarname}.hasOwnProperty("${variable}")) {
      ${variable} = ${val};
    } else {
      var ${variable} = ${val};
    }
    ${dataVarname}["${variable}"] = ${variable};
    __exports["${variable}"] = ${variable};
    `;
  }
  // Value is captured (eg: {{ export foo }}bar{{ /export }})
  const compiled = [];
  const compiledFilters = env.compileFilters(tokens, expression);
  compiled.push(`if (${dataVarname}.hasOwnProperty("${expression}")) {
    ${expression} = "";
  } else {
    var ${expression} = "";
  }
  `);
  compiled.push(...env.compileTokens(tokens, expression, [
    "/export"
  ]));
  if (tokens.length && (tokens[0][0] !== "tag" || tokens[0][1] !== "/export")) {
    throw new Error(`Missing closing tag for export tag: ${code}`);
  }
  tokens.shift();
  compiled.push(`${expression} = ${compiledFilters};`);
  compiled.push(`${dataVarname}["${expression.trim()}"] = ${expression};`);
  compiled.push(`__exports["${expression.trim()}"] = ${expression};`);
  return compiled.join("\n");
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvdmVudG9AdjAuMTIuNS9wbHVnaW5zL2V4cG9ydC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgdHlwZSB7IFRva2VuIH0gZnJvbSBcIi4uL3NyYy90b2tlbml6ZXIudHNcIjtcbmltcG9ydCB0eXBlIHsgRW52aXJvbm1lbnQgfSBmcm9tIFwiLi4vc3JjL2Vudmlyb25tZW50LnRzXCI7XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIChlbnY6IEVudmlyb25tZW50KSA9PiB7XG4gICAgZW52LnRhZ3MucHVzaChleHBvcnRUYWcpO1xuICB9O1xufVxuXG5mdW5jdGlvbiBleHBvcnRUYWcoXG4gIGVudjogRW52aXJvbm1lbnQsXG4gIGNvZGU6IHN0cmluZyxcbiAgX291dHB1dDogc3RyaW5nLFxuICB0b2tlbnM6IFRva2VuW10sXG4pOiBzdHJpbmcgfCB1bmRlZmluZWQge1xuICBpZiAoIWNvZGUuc3RhcnRzV2l0aChcImV4cG9ydCBcIikpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICBjb25zdCBleHByZXNzaW9uID0gY29kZS5yZXBsYWNlKC9eZXhwb3J0XFxzKy8sIFwiXCIpO1xuICBjb25zdCB7IGRhdGFWYXJuYW1lIH0gPSBlbnYub3B0aW9ucztcblxuICAvLyBWYWx1ZSBpcyBzZXQgKGUuZy4ge3sgZXhwb3J0IGZvbyA9IFwiYmFyXCIgfX0pXG4gIGlmIChleHByZXNzaW9uLmluY2x1ZGVzKFwiPVwiKSkge1xuICAgIGNvbnN0IG1hdGNoID0gY29kZS5tYXRjaCgvXmV4cG9ydFxccysoW1xcd10rKVxccyo9XFxzKihbXFxzXFxTXSspJC8pO1xuXG4gICAgaWYgKCFtYXRjaCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIGV4cG9ydCB0YWc6ICR7Y29kZX1gKTtcbiAgICB9XG5cbiAgICBjb25zdCBbLCB2YXJpYWJsZSwgdmFsdWVdID0gbWF0Y2g7XG4gICAgY29uc3QgdmFsID0gZW52LmNvbXBpbGVGaWx0ZXJzKHRva2VucywgdmFsdWUpO1xuXG4gICAgcmV0dXJuIGBpZiAoJHtkYXRhVmFybmFtZX0uaGFzT3duUHJvcGVydHkoXCIke3ZhcmlhYmxlfVwiKSkge1xuICAgICAgJHt2YXJpYWJsZX0gPSAke3ZhbH07XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciAke3ZhcmlhYmxlfSA9ICR7dmFsfTtcbiAgICB9XG4gICAgJHtkYXRhVmFybmFtZX1bXCIke3ZhcmlhYmxlfVwiXSA9ICR7dmFyaWFibGV9O1xuICAgIF9fZXhwb3J0c1tcIiR7dmFyaWFibGV9XCJdID0gJHt2YXJpYWJsZX07XG4gICAgYDtcbiAgfVxuXG4gIC8vIFZhbHVlIGlzIGNhcHR1cmVkIChlZzoge3sgZXhwb3J0IGZvbyB9fWJhcnt7IC9leHBvcnQgfX0pXG4gIGNvbnN0IGNvbXBpbGVkOiBzdHJpbmdbXSA9IFtdO1xuICBjb25zdCBjb21waWxlZEZpbHRlcnMgPSBlbnYuY29tcGlsZUZpbHRlcnModG9rZW5zLCBleHByZXNzaW9uKTtcblxuICBjb21waWxlZC5wdXNoKGBpZiAoJHtkYXRhVmFybmFtZX0uaGFzT3duUHJvcGVydHkoXCIke2V4cHJlc3Npb259XCIpKSB7XG4gICAgJHtleHByZXNzaW9ufSA9IFwiXCI7XG4gIH0gZWxzZSB7XG4gICAgdmFyICR7ZXhwcmVzc2lvbn0gPSBcIlwiO1xuICB9XG4gIGApO1xuXG4gIGNvbXBpbGVkLnB1c2goLi4uZW52LmNvbXBpbGVUb2tlbnModG9rZW5zLCBleHByZXNzaW9uLCBbXCIvZXhwb3J0XCJdKSk7XG5cbiAgaWYgKHRva2Vucy5sZW5ndGggJiYgKHRva2Vuc1swXVswXSAhPT0gXCJ0YWdcIiB8fCB0b2tlbnNbMF1bMV0gIT09IFwiL2V4cG9ydFwiKSkge1xuICAgIHRocm93IG5ldyBFcnJvcihgTWlzc2luZyBjbG9zaW5nIHRhZyBmb3IgZXhwb3J0IHRhZzogJHtjb2RlfWApO1xuICB9XG5cbiAgdG9rZW5zLnNoaWZ0KCk7XG4gIGNvbXBpbGVkLnB1c2goYCR7ZXhwcmVzc2lvbn0gPSAke2NvbXBpbGVkRmlsdGVyc307YCk7XG4gIGNvbXBpbGVkLnB1c2goYCR7ZGF0YVZhcm5hbWV9W1wiJHtleHByZXNzaW9uLnRyaW0oKX1cIl0gPSAke2V4cHJlc3Npb259O2ApO1xuICBjb21waWxlZC5wdXNoKGBfX2V4cG9ydHNbXCIke2V4cHJlc3Npb24udHJpbSgpfVwiXSA9ICR7ZXhwcmVzc2lvbn07YCk7XG4gIHJldHVybiBjb21waWxlZC5qb2luKFwiXFxuXCIpO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUdBLGVBQWU7RUFDYixPQUFPLENBQUM7SUFDTixJQUFJLElBQUksQ0FBQyxJQUFJLENBQUM7RUFDaEI7QUFDRjtBQUVBLFNBQVMsVUFDUCxHQUFnQixFQUNoQixJQUFZLEVBQ1osT0FBZSxFQUNmLE1BQWU7RUFFZixJQUFJLENBQUMsS0FBSyxVQUFVLENBQUMsWUFBWTtJQUMvQjtFQUNGO0VBRUEsTUFBTSxhQUFhLEtBQUssT0FBTyxDQUFDLGNBQWM7RUFDOUMsTUFBTSxFQUFFLFdBQVcsRUFBRSxHQUFHLElBQUksT0FBTztFQUVuQywrQ0FBK0M7RUFDL0MsSUFBSSxXQUFXLFFBQVEsQ0FBQyxNQUFNO0lBQzVCLE1BQU0sUUFBUSxLQUFLLEtBQUssQ0FBQztJQUV6QixJQUFJLENBQUMsT0FBTztNQUNWLE1BQU0sSUFBSSxNQUFNLENBQUMsb0JBQW9CLEVBQUUsS0FBSyxDQUFDO0lBQy9DO0lBRUEsTUFBTSxHQUFHLFVBQVUsTUFBTSxHQUFHO0lBQzVCLE1BQU0sTUFBTSxJQUFJLGNBQWMsQ0FBQyxRQUFRO0lBRXZDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsWUFBWSxpQkFBaUIsRUFBRSxTQUFTO01BQ3BELEVBQUUsU0FBUyxHQUFHLEVBQUUsSUFBSTs7VUFFaEIsRUFBRSxTQUFTLEdBQUcsRUFBRSxJQUFJOztJQUUxQixFQUFFLFlBQVksRUFBRSxFQUFFLFNBQVMsS0FBSyxFQUFFLFNBQVM7ZUFDaEMsRUFBRSxTQUFTLEtBQUssRUFBRSxTQUFTO0lBQ3RDLENBQUM7RUFDSDtFQUVBLDJEQUEyRDtFQUMzRCxNQUFNLFdBQXFCLEVBQUU7RUFDN0IsTUFBTSxrQkFBa0IsSUFBSSxjQUFjLENBQUMsUUFBUTtFQUVuRCxTQUFTLElBQUksQ0FBQyxDQUFDLElBQUksRUFBRSxZQUFZLGlCQUFpQixFQUFFLFdBQVc7SUFDN0QsRUFBRSxXQUFXOztRQUVULEVBQUUsV0FBVzs7RUFFbkIsQ0FBQztFQUVELFNBQVMsSUFBSSxJQUFJLElBQUksYUFBYSxDQUFDLFFBQVEsWUFBWTtJQUFDO0dBQVU7RUFFbEUsSUFBSSxPQUFPLE1BQU0sSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsRUFBRSxLQUFLLFNBQVMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEtBQUssU0FBUyxHQUFHO0lBQzNFLE1BQU0sSUFBSSxNQUFNLENBQUMsb0NBQW9DLEVBQUUsS0FBSyxDQUFDO0VBQy9EO0VBRUEsT0FBTyxLQUFLO0VBQ1osU0FBUyxJQUFJLENBQUMsQ0FBQyxFQUFFLFdBQVcsR0FBRyxFQUFFLGdCQUFnQixDQUFDLENBQUM7RUFDbkQsU0FBUyxJQUFJLENBQUMsQ0FBQyxFQUFFLFlBQVksRUFBRSxFQUFFLFdBQVcsSUFBSSxHQUFHLEtBQUssRUFBRSxXQUFXLENBQUMsQ0FBQztFQUN2RSxTQUFTLElBQUksQ0FBQyxDQUFDLFdBQVcsRUFBRSxXQUFXLElBQUksR0FBRyxLQUFLLEVBQUUsV0FBVyxDQUFDLENBQUM7RUFDbEUsT0FBTyxTQUFTLElBQUksQ0FBQztBQUN2QiJ9