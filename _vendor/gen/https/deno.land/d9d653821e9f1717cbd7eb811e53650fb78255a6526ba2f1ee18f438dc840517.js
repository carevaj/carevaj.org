import { Type } from "../type.ts";
import { integer } from "../../flags/types/integer.ts";
/** Integer type. */ export class IntegerType extends Type {
  /** Parse integer type. */ parse(type) {
    return integer(type);
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvY2xpZmZ5QHYwLjI1LjcvY29tbWFuZC90eXBlcy9pbnRlZ2VyLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFR5cGUgfSBmcm9tIFwiLi4vdHlwZS50c1wiO1xuaW1wb3J0IHR5cGUgeyBBcmd1bWVudFZhbHVlIH0gZnJvbSBcIi4uL3R5cGVzLnRzXCI7XG5pbXBvcnQgeyBpbnRlZ2VyIH0gZnJvbSBcIi4uLy4uL2ZsYWdzL3R5cGVzL2ludGVnZXIudHNcIjtcblxuLyoqIEludGVnZXIgdHlwZS4gKi9cbmV4cG9ydCBjbGFzcyBJbnRlZ2VyVHlwZSBleHRlbmRzIFR5cGU8bnVtYmVyPiB7XG4gIC8qKiBQYXJzZSBpbnRlZ2VyIHR5cGUuICovXG4gIHB1YmxpYyBwYXJzZSh0eXBlOiBBcmd1bWVudFZhbHVlKTogbnVtYmVyIHtcbiAgICByZXR1cm4gaW50ZWdlcih0eXBlKTtcbiAgfVxufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFNBQVMsSUFBSSxRQUFRLGFBQWE7QUFFbEMsU0FBUyxPQUFPLFFBQVEsK0JBQStCO0FBRXZELGtCQUFrQixHQUNsQixPQUFPLE1BQU0sb0JBQW9CO0VBQy9CLHdCQUF3QixHQUN4QixBQUFPLE1BQU0sSUFBbUIsRUFBVTtJQUN4QyxPQUFPLFFBQVE7RUFDakI7QUFDRiJ9