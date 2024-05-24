import { unidecode } from "../deps/unidecode.ts";
import { merge } from "./utils/object.ts";
export const defaults = {
  lowercase: true,
  alphanumeric: true,
  separator: "-",
  replace: {
    "Ð": "D",
    "ð": "d",
    "Đ": "D",
    "đ": "d",
    "ø": "o",
    "ß": "ss",
    "æ": "ae",
    "œ": "oe"
  },
  stopWords: []
};
export default function createSlugifier(userOptions) {
  const options = merge(defaults, userOptions);
  const { lowercase, alphanumeric, separator, replace, stopWords } = options;
  return function(string) {
    string = decodeURI(string);
    if (lowercase) {
      string = string.toLowerCase();
    }
    string = string.replaceAll(/[^a-z\d/.-]/giu, (char)=>{
      if (char in replace) {
        return replace[char];
      }
      if (alphanumeric) {
        char = char.normalize("NFKD").replaceAll(/[\u0300-\u036F]/g, "");
        char = unidecode(char).trim();
      }
      char = /[\p{L}\u0300-\u036F]+/u.test(char) ? char : "-";
      return alphanumeric && /[^\w-]+/.test(char) ? "" : char;
    });
    if (lowercase) {
      string = string.toLowerCase();
    }
    // remove stop words
    string = string.trim().split(/-+/).filter((word)=>stopWords.indexOf(word) === -1).join("-");
    // clean url
    string = string.replaceAll(/(?<=^|[/.])-+(?=[^/.-])|(?<=[^/.-])-+(?=$|[/.])/g, "");
    // replace dash with separator
    return encodeURI(string.replaceAll("-", separator));
  };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvbHVtZUB2Mi4yLjAvY29yZS9zbHVnaWZpZXIudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgdW5pZGVjb2RlIH0gZnJvbSBcIi4uL2RlcHMvdW5pZGVjb2RlLnRzXCI7XG5pbXBvcnQgeyBtZXJnZSB9IGZyb20gXCIuL3V0aWxzL29iamVjdC50c1wiO1xuXG5leHBvcnQgaW50ZXJmYWNlIE9wdGlvbnMge1xuICAvKiogQ29udmVydCB0aGUgcGF0aHMgdG8gbG93ZXIgY2FzZSAqL1xuICBsb3dlcmNhc2U/OiBib29sZWFuO1xuXG4gIC8qKiBSZW1vdmUgYWxsIG5vbi1hbHBoYW51bWVyaWMgY2hhcmFjdGVycyAqL1xuICBhbHBoYW51bWVyaWM/OiBib29sZWFuO1xuXG4gIC8qKiBDaGFyYWN0ZXIgdXNlZCBhcyB3b3JkIHNlcGFyYXRvciAqL1xuICBzZXBhcmF0b3I/OiBzdHJpbmc7XG5cbiAgLyoqIENoYXJhY3RlcnMgdG8gcmVwbGFjZSAqL1xuICByZXBsYWNlPzoge1xuICAgIFtpbmRleDogc3RyaW5nXTogc3RyaW5nO1xuICB9O1xuXG4gIC8qKiBXb3JkcyB0byByZW1vdmUgKi9cbiAgc3RvcFdvcmRzPzogc3RyaW5nW107XG59XG5cbmV4cG9ydCBjb25zdCBkZWZhdWx0czogT3B0aW9ucyA9IHtcbiAgbG93ZXJjYXNlOiB0cnVlLFxuICBhbHBoYW51bWVyaWM6IHRydWUsXG4gIHNlcGFyYXRvcjogXCItXCIsXG4gIHJlcGxhY2U6IHtcbiAgICBcIsOQXCI6IFwiRFwiLCAvLyBldGhcbiAgICBcIsOwXCI6IFwiZFwiLFxuICAgIFwixJBcIjogXCJEXCIsIC8vIGNyb3NzZWQgRFxuICAgIFwixJFcIjogXCJkXCIsXG4gICAgXCLDuFwiOiBcIm9cIixcbiAgICBcIsOfXCI6IFwic3NcIixcbiAgICBcIsOmXCI6IFwiYWVcIixcbiAgICBcIsWTXCI6IFwib2VcIixcbiAgfSxcbiAgc3RvcFdvcmRzOiBbXSxcbn07XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGNyZWF0ZVNsdWdpZmllcihcbiAgdXNlck9wdGlvbnM/OiBPcHRpb25zLFxuKTogKHN0cmluZzogc3RyaW5nKSA9PiBzdHJpbmcge1xuICBjb25zdCBvcHRpb25zID0gbWVyZ2UoZGVmYXVsdHMsIHVzZXJPcHRpb25zKTtcbiAgY29uc3QgeyBsb3dlcmNhc2UsIGFscGhhbnVtZXJpYywgc2VwYXJhdG9yLCByZXBsYWNlLCBzdG9wV29yZHMgfSA9IG9wdGlvbnM7XG5cbiAgcmV0dXJuIGZ1bmN0aW9uIChzdHJpbmcpIHtcbiAgICBzdHJpbmcgPSBkZWNvZGVVUkkoc3RyaW5nKTtcblxuICAgIGlmIChsb3dlcmNhc2UpIHtcbiAgICAgIHN0cmluZyA9IHN0cmluZy50b0xvd2VyQ2FzZSgpO1xuICAgIH1cblxuICAgIHN0cmluZyA9IHN0cmluZy5yZXBsYWNlQWxsKC9bXmEtelxcZC8uLV0vZ2l1LCAoY2hhcikgPT4ge1xuICAgICAgaWYgKGNoYXIgaW4gcmVwbGFjZSkge1xuICAgICAgICByZXR1cm4gcmVwbGFjZVtjaGFyXTtcbiAgICAgIH1cblxuICAgICAgaWYgKGFscGhhbnVtZXJpYykge1xuICAgICAgICBjaGFyID0gY2hhci5ub3JtYWxpemUoXCJORktEXCIpLnJlcGxhY2VBbGwoL1tcXHUwMzAwLVxcdTAzNkZdL2csIFwiXCIpO1xuICAgICAgICBjaGFyID0gdW5pZGVjb2RlKGNoYXIpLnRyaW0oKTtcbiAgICAgIH1cblxuICAgICAgY2hhciA9IC9bXFxwe0x9XFx1MDMwMC1cXHUwMzZGXSsvdS50ZXN0KGNoYXIpID8gY2hhciA6IFwiLVwiO1xuXG4gICAgICByZXR1cm4gYWxwaGFudW1lcmljICYmIC9bXlxcdy1dKy8udGVzdChjaGFyKSA/IFwiXCIgOiBjaGFyO1xuICAgIH0pO1xuXG4gICAgaWYgKGxvd2VyY2FzZSkge1xuICAgICAgc3RyaW5nID0gc3RyaW5nLnRvTG93ZXJDYXNlKCk7XG4gICAgfVxuXG4gICAgLy8gcmVtb3ZlIHN0b3Agd29yZHNcbiAgICBzdHJpbmcgPSBzdHJpbmcudHJpbSgpLnNwbGl0KC8tKy8pLmZpbHRlcigod29yZCkgPT5cbiAgICAgIHN0b3BXb3Jkcy5pbmRleE9mKHdvcmQpID09PSAtMVxuICAgICkuam9pbihcIi1cIik7XG5cbiAgICAvLyBjbGVhbiB1cmxcbiAgICBzdHJpbmcgPSBzdHJpbmcucmVwbGFjZUFsbChcbiAgICAgIC8oPzw9XnxbLy5dKS0rKD89W14vLi1dKXwoPzw9W14vLi1dKS0rKD89JHxbLy5dKS9nLFxuICAgICAgXCJcIixcbiAgICApO1xuXG4gICAgLy8gcmVwbGFjZSBkYXNoIHdpdGggc2VwYXJhdG9yXG4gICAgcmV0dXJuIGVuY29kZVVSSShzdHJpbmcucmVwbGFjZUFsbChcIi1cIiwgc2VwYXJhdG9yKSk7XG4gIH07XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsU0FBUyxTQUFTLFFBQVEsdUJBQXVCO0FBQ2pELFNBQVMsS0FBSyxRQUFRLG9CQUFvQjtBQXFCMUMsT0FBTyxNQUFNLFdBQW9CO0VBQy9CLFdBQVc7RUFDWCxjQUFjO0VBQ2QsV0FBVztFQUNYLFNBQVM7SUFDUCxLQUFLO0lBQ0wsS0FBSztJQUNMLEtBQUs7SUFDTCxLQUFLO0lBQ0wsS0FBSztJQUNMLEtBQUs7SUFDTCxLQUFLO0lBQ0wsS0FBSztFQUNQO0VBQ0EsV0FBVyxFQUFFO0FBQ2YsRUFBRTtBQUVGLGVBQWUsU0FBUyxnQkFDdEIsV0FBcUI7RUFFckIsTUFBTSxVQUFVLE1BQU0sVUFBVTtFQUNoQyxNQUFNLEVBQUUsU0FBUyxFQUFFLFlBQVksRUFBRSxTQUFTLEVBQUUsT0FBTyxFQUFFLFNBQVMsRUFBRSxHQUFHO0VBRW5FLE9BQU8sU0FBVSxNQUFNO0lBQ3JCLFNBQVMsVUFBVTtJQUVuQixJQUFJLFdBQVc7TUFDYixTQUFTLE9BQU8sV0FBVztJQUM3QjtJQUVBLFNBQVMsT0FBTyxVQUFVLENBQUMsa0JBQWtCLENBQUM7TUFDNUMsSUFBSSxRQUFRLFNBQVM7UUFDbkIsT0FBTyxPQUFPLENBQUMsS0FBSztNQUN0QjtNQUVBLElBQUksY0FBYztRQUNoQixPQUFPLEtBQUssU0FBUyxDQUFDLFFBQVEsVUFBVSxDQUFDLG9CQUFvQjtRQUM3RCxPQUFPLFVBQVUsTUFBTSxJQUFJO01BQzdCO01BRUEsT0FBTyx5QkFBeUIsSUFBSSxDQUFDLFFBQVEsT0FBTztNQUVwRCxPQUFPLGdCQUFnQixVQUFVLElBQUksQ0FBQyxRQUFRLEtBQUs7SUFDckQ7SUFFQSxJQUFJLFdBQVc7TUFDYixTQUFTLE9BQU8sV0FBVztJQUM3QjtJQUVBLG9CQUFvQjtJQUNwQixTQUFTLE9BQU8sSUFBSSxHQUFHLEtBQUssQ0FBQyxNQUFNLE1BQU0sQ0FBQyxDQUFDLE9BQ3pDLFVBQVUsT0FBTyxDQUFDLFVBQVUsQ0FBQyxHQUM3QixJQUFJLENBQUM7SUFFUCxZQUFZO0lBQ1osU0FBUyxPQUFPLFVBQVUsQ0FDeEIsb0RBQ0E7SUFHRiw4QkFBOEI7SUFDOUIsT0FBTyxVQUFVLE9BQU8sVUFBVSxDQUFDLEtBQUs7RUFDMUM7QUFDRiJ9