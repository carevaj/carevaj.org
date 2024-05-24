// deno-lint-ignore no-explicit-any
export function getRawText(tokens) {
  let text = "";
  for (const token of tokens){
    switch(token.type){
      case "text":
      case "code_inline":
        text += token.content;
        break;
      case "softbreak":
      case "hardbreak":
        text += " ";
        break;
    }
  }
  return text;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvbHVtZV9tYXJrZG93bl9wbHVnaW5zQHYwLjcuMC91dGlscy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBkZW5vLWxpbnQtaWdub3JlIG5vLWV4cGxpY2l0LWFueVxuZXhwb3J0IGZ1bmN0aW9uIGdldFJhd1RleHQodG9rZW5zOiBhbnlbXSkge1xuICBsZXQgdGV4dCA9IFwiXCI7XG5cbiAgZm9yIChjb25zdCB0b2tlbiBvZiB0b2tlbnMpIHtcbiAgICBzd2l0Y2ggKHRva2VuLnR5cGUpIHtcbiAgICAgIGNhc2UgXCJ0ZXh0XCI6XG4gICAgICBjYXNlIFwiY29kZV9pbmxpbmVcIjpcbiAgICAgICAgdGV4dCArPSB0b2tlbi5jb250ZW50O1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgXCJzb2Z0YnJlYWtcIjpcbiAgICAgIGNhc2UgXCJoYXJkYnJlYWtcIjpcbiAgICAgICAgdGV4dCArPSBcIiBcIjtcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHRleHQ7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsbUNBQW1DO0FBQ25DLE9BQU8sU0FBUyxXQUFXLE1BQWE7RUFDdEMsSUFBSSxPQUFPO0VBRVgsS0FBSyxNQUFNLFNBQVMsT0FBUTtJQUMxQixPQUFRLE1BQU0sSUFBSTtNQUNoQixLQUFLO01BQ0wsS0FBSztRQUNILFFBQVEsTUFBTSxPQUFPO1FBQ3JCO01BQ0YsS0FBSztNQUNMLEtBQUs7UUFDSCxRQUFRO1FBQ1I7SUFDSjtFQUNGO0VBRUEsT0FBTztBQUNUIn0=