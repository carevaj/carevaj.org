export default function() {
  return (env)=>{
    env.tags.push(setTag);
  };
}
function setTag(env, code, _output, tokens) {
  if (!code.startsWith("set ")) {
    return;
  }
  const expression = code.replace(/^set\s+/, "");
  const { dataVarname } = env.options;
  // Value is set (e.g. {{ set foo = "bar" }})
  if (expression.includes("=")) {
    const match = code.match(/^set\s+([\w]+)\s*=\s*([\s\S]+)$/);
    if (!match) {
      throw new Error(`Invalid set tag: ${code}`);
    }
    const [, variable, value] = match;
    const val = env.compileFilters(tokens, value);
    return `
    ${dataVarname}["${variable}"] = ${val};
    var ${variable} = ${val};
    `;
  }
  // Value is captured (eg: {{ set foo }}bar{{ /set }})
  const compiled = [];
  const compiledFilters = env.compileFilters(tokens, expression);
  compiled.push(`if (${dataVarname}.hasOwnProperty("${expression}")) {
    ${expression} = "";
  } else {
    var ${expression} = "";
  }
  `);
  compiled.push(...env.compileTokens(tokens, expression, [
    "/set"
  ]));
  if (tokens.length && (tokens[0][0] !== "tag" || tokens[0][1] !== "/set")) {
    throw new Error(`Missing closing tag for set tag: ${code}`);
  }
  tokens.shift();
  compiled.push(`${expression} = ${compiledFilters};`);
  compiled.push(`${dataVarname}["${expression.trim()}"] = ${expression};`);
  return compiled.join("\n");
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvdmVudG9AdjAuMTIuNS9wbHVnaW5zL3NldC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgdHlwZSB7IFRva2VuIH0gZnJvbSBcIi4uL3NyYy90b2tlbml6ZXIudHNcIjtcbmltcG9ydCB0eXBlIHsgRW52aXJvbm1lbnQgfSBmcm9tIFwiLi4vc3JjL2Vudmlyb25tZW50LnRzXCI7XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIChlbnY6IEVudmlyb25tZW50KSA9PiB7XG4gICAgZW52LnRhZ3MucHVzaChzZXRUYWcpO1xuICB9O1xufVxuXG5mdW5jdGlvbiBzZXRUYWcoXG4gIGVudjogRW52aXJvbm1lbnQsXG4gIGNvZGU6IHN0cmluZyxcbiAgX291dHB1dDogc3RyaW5nLFxuICB0b2tlbnM6IFRva2VuW10sXG4pOiBzdHJpbmcgfCB1bmRlZmluZWQge1xuICBpZiAoIWNvZGUuc3RhcnRzV2l0aChcInNldCBcIikpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICBjb25zdCBleHByZXNzaW9uID0gY29kZS5yZXBsYWNlKC9ec2V0XFxzKy8sIFwiXCIpO1xuICBjb25zdCB7IGRhdGFWYXJuYW1lIH0gPSBlbnYub3B0aW9ucztcblxuICAvLyBWYWx1ZSBpcyBzZXQgKGUuZy4ge3sgc2V0IGZvbyA9IFwiYmFyXCIgfX0pXG4gIGlmIChleHByZXNzaW9uLmluY2x1ZGVzKFwiPVwiKSkge1xuICAgIGNvbnN0IG1hdGNoID0gY29kZS5tYXRjaCgvXnNldFxccysoW1xcd10rKVxccyo9XFxzKihbXFxzXFxTXSspJC8pO1xuXG4gICAgaWYgKCFtYXRjaCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIHNldCB0YWc6ICR7Y29kZX1gKTtcbiAgICB9XG5cbiAgICBjb25zdCBbLCB2YXJpYWJsZSwgdmFsdWVdID0gbWF0Y2g7XG4gICAgY29uc3QgdmFsID0gZW52LmNvbXBpbGVGaWx0ZXJzKHRva2VucywgdmFsdWUpO1xuXG4gICAgcmV0dXJuIGBcbiAgICAke2RhdGFWYXJuYW1lfVtcIiR7dmFyaWFibGV9XCJdID0gJHt2YWx9O1xuICAgIHZhciAke3ZhcmlhYmxlfSA9ICR7dmFsfTtcbiAgICBgO1xuICB9XG5cbiAgLy8gVmFsdWUgaXMgY2FwdHVyZWQgKGVnOiB7eyBzZXQgZm9vIH19YmFye3sgL3NldCB9fSlcbiAgY29uc3QgY29tcGlsZWQ6IHN0cmluZ1tdID0gW107XG4gIGNvbnN0IGNvbXBpbGVkRmlsdGVycyA9IGVudi5jb21waWxlRmlsdGVycyh0b2tlbnMsIGV4cHJlc3Npb24pO1xuXG4gIGNvbXBpbGVkLnB1c2goYGlmICgke2RhdGFWYXJuYW1lfS5oYXNPd25Qcm9wZXJ0eShcIiR7ZXhwcmVzc2lvbn1cIikpIHtcbiAgICAke2V4cHJlc3Npb259ID0gXCJcIjtcbiAgfSBlbHNlIHtcbiAgICB2YXIgJHtleHByZXNzaW9ufSA9IFwiXCI7XG4gIH1cbiAgYCk7XG5cbiAgY29tcGlsZWQucHVzaCguLi5lbnYuY29tcGlsZVRva2Vucyh0b2tlbnMsIGV4cHJlc3Npb24sIFtcIi9zZXRcIl0pKTtcblxuICBpZiAodG9rZW5zLmxlbmd0aCAmJiAodG9rZW5zWzBdWzBdICE9PSBcInRhZ1wiIHx8IHRva2Vuc1swXVsxXSAhPT0gXCIvc2V0XCIpKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBNaXNzaW5nIGNsb3NpbmcgdGFnIGZvciBzZXQgdGFnOiAke2NvZGV9YCk7XG4gIH1cblxuICB0b2tlbnMuc2hpZnQoKTtcbiAgY29tcGlsZWQucHVzaChgJHtleHByZXNzaW9ufSA9ICR7Y29tcGlsZWRGaWx0ZXJzfTtgKTtcbiAgY29tcGlsZWQucHVzaChgJHtkYXRhVmFybmFtZX1bXCIke2V4cHJlc3Npb24udHJpbSgpfVwiXSA9ICR7ZXhwcmVzc2lvbn07YCk7XG4gIHJldHVybiBjb21waWxlZC5qb2luKFwiXFxuXCIpO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUdBLGVBQWU7RUFDYixPQUFPLENBQUM7SUFDTixJQUFJLElBQUksQ0FBQyxJQUFJLENBQUM7RUFDaEI7QUFDRjtBQUVBLFNBQVMsT0FDUCxHQUFnQixFQUNoQixJQUFZLEVBQ1osT0FBZSxFQUNmLE1BQWU7RUFFZixJQUFJLENBQUMsS0FBSyxVQUFVLENBQUMsU0FBUztJQUM1QjtFQUNGO0VBRUEsTUFBTSxhQUFhLEtBQUssT0FBTyxDQUFDLFdBQVc7RUFDM0MsTUFBTSxFQUFFLFdBQVcsRUFBRSxHQUFHLElBQUksT0FBTztFQUVuQyw0Q0FBNEM7RUFDNUMsSUFBSSxXQUFXLFFBQVEsQ0FBQyxNQUFNO0lBQzVCLE1BQU0sUUFBUSxLQUFLLEtBQUssQ0FBQztJQUV6QixJQUFJLENBQUMsT0FBTztNQUNWLE1BQU0sSUFBSSxNQUFNLENBQUMsaUJBQWlCLEVBQUUsS0FBSyxDQUFDO0lBQzVDO0lBRUEsTUFBTSxHQUFHLFVBQVUsTUFBTSxHQUFHO0lBQzVCLE1BQU0sTUFBTSxJQUFJLGNBQWMsQ0FBQyxRQUFRO0lBRXZDLE9BQU8sQ0FBQztJQUNSLEVBQUUsWUFBWSxFQUFFLEVBQUUsU0FBUyxLQUFLLEVBQUUsSUFBSTtRQUNsQyxFQUFFLFNBQVMsR0FBRyxFQUFFLElBQUk7SUFDeEIsQ0FBQztFQUNIO0VBRUEscURBQXFEO0VBQ3JELE1BQU0sV0FBcUIsRUFBRTtFQUM3QixNQUFNLGtCQUFrQixJQUFJLGNBQWMsQ0FBQyxRQUFRO0VBRW5ELFNBQVMsSUFBSSxDQUFDLENBQUMsSUFBSSxFQUFFLFlBQVksaUJBQWlCLEVBQUUsV0FBVztJQUM3RCxFQUFFLFdBQVc7O1FBRVQsRUFBRSxXQUFXOztFQUVuQixDQUFDO0VBRUQsU0FBUyxJQUFJLElBQUksSUFBSSxhQUFhLENBQUMsUUFBUSxZQUFZO0lBQUM7R0FBTztFQUUvRCxJQUFJLE9BQU8sTUFBTSxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEtBQUssU0FBUyxNQUFNLENBQUMsRUFBRSxDQUFDLEVBQUUsS0FBSyxNQUFNLEdBQUc7SUFDeEUsTUFBTSxJQUFJLE1BQU0sQ0FBQyxpQ0FBaUMsRUFBRSxLQUFLLENBQUM7RUFDNUQ7RUFFQSxPQUFPLEtBQUs7RUFDWixTQUFTLElBQUksQ0FBQyxDQUFDLEVBQUUsV0FBVyxHQUFHLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQztFQUNuRCxTQUFTLElBQUksQ0FBQyxDQUFDLEVBQUUsWUFBWSxFQUFFLEVBQUUsV0FBVyxJQUFJLEdBQUcsS0FBSyxFQUFFLFdBQVcsQ0FBQyxDQUFDO0VBQ3ZFLE9BQU8sU0FBUyxJQUFJLENBQUM7QUFDdkIifQ==