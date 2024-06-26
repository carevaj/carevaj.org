import { string } from "../../flags/types/string.ts";
import { Type } from "../type.ts";
/** String type. Allows any value. */ export class StringType extends Type {
  /** Complete string type. */ parse(type) {
    return string(type);
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvY2xpZmZ5QHYwLjI1LjcvY29tbWFuZC90eXBlcy9zdHJpbmcudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgc3RyaW5nIH0gZnJvbSBcIi4uLy4uL2ZsYWdzL3R5cGVzL3N0cmluZy50c1wiO1xuaW1wb3J0IHsgVHlwZSB9IGZyb20gXCIuLi90eXBlLnRzXCI7XG5pbXBvcnQgdHlwZSB7IEFyZ3VtZW50VmFsdWUgfSBmcm9tIFwiLi4vdHlwZXMudHNcIjtcblxuLyoqIFN0cmluZyB0eXBlLiBBbGxvd3MgYW55IHZhbHVlLiAqL1xuZXhwb3J0IGNsYXNzIFN0cmluZ1R5cGUgZXh0ZW5kcyBUeXBlPHN0cmluZz4ge1xuICAvKiogQ29tcGxldGUgc3RyaW5nIHR5cGUuICovXG4gIHB1YmxpYyBwYXJzZSh0eXBlOiBBcmd1bWVudFZhbHVlKTogc3RyaW5nIHtcbiAgICByZXR1cm4gc3RyaW5nKHR5cGUpO1xuICB9XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsU0FBUyxNQUFNLFFBQVEsOEJBQThCO0FBQ3JELFNBQVMsSUFBSSxRQUFRLGFBQWE7QUFHbEMsbUNBQW1DLEdBQ25DLE9BQU8sTUFBTSxtQkFBbUI7RUFDOUIsMEJBQTBCLEdBQzFCLEFBQU8sTUFBTSxJQUFtQixFQUFVO0lBQ3hDLE9BQU8sT0FBTztFQUNoQjtBQUNGIn0=