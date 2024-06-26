import { Type } from "../type.ts";
import { InvalidTypeError } from "../../flags/_errors.ts";
/** Enum type. Allows only provided values. */ export class EnumType extends Type {
  allowedValues;
  constructor(values){
    super();
    this.allowedValues = Array.isArray(values) ? values : Object.values(values);
  }
  parse(type) {
    for (const value of this.allowedValues){
      if (value.toString() === type.value) {
        return value;
      }
    }
    throw new InvalidTypeError(type, this.allowedValues.slice());
  }
  values() {
    return this.allowedValues.slice();
  }
  complete() {
    return this.values();
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvY2xpZmZ5QHYwLjI1LjcvY29tbWFuZC90eXBlcy9lbnVtLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFR5cGUgfSBmcm9tIFwiLi4vdHlwZS50c1wiO1xuaW1wb3J0IHR5cGUgeyBBcmd1bWVudFZhbHVlIH0gZnJvbSBcIi4uL3R5cGVzLnRzXCI7XG5pbXBvcnQgeyBJbnZhbGlkVHlwZUVycm9yIH0gZnJvbSBcIi4uLy4uL2ZsYWdzL19lcnJvcnMudHNcIjtcblxuLyoqIEVudW0gdHlwZS4gQWxsb3dzIG9ubHkgcHJvdmlkZWQgdmFsdWVzLiAqL1xuZXhwb3J0IGNsYXNzIEVudW1UeXBlPFRWYWx1ZSBleHRlbmRzIHN0cmluZyB8IG51bWJlciB8IGJvb2xlYW4+XG4gIGV4dGVuZHMgVHlwZTxUVmFsdWU+IHtcbiAgcHJpdmF0ZSByZWFkb25seSBhbGxvd2VkVmFsdWVzOiBSZWFkb25seUFycmF5PFRWYWx1ZT47XG5cbiAgY29uc3RydWN0b3IodmFsdWVzOiBSZWFkb25seUFycmF5PFRWYWx1ZT4gfCBSZWNvcmQ8c3RyaW5nLCBUVmFsdWU+KSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLmFsbG93ZWRWYWx1ZXMgPSBBcnJheS5pc0FycmF5KHZhbHVlcykgPyB2YWx1ZXMgOiBPYmplY3QudmFsdWVzKHZhbHVlcyk7XG4gIH1cblxuICBwdWJsaWMgcGFyc2UodHlwZTogQXJndW1lbnRWYWx1ZSk6IFRWYWx1ZSB7XG4gICAgZm9yIChjb25zdCB2YWx1ZSBvZiB0aGlzLmFsbG93ZWRWYWx1ZXMpIHtcbiAgICAgIGlmICh2YWx1ZS50b1N0cmluZygpID09PSB0eXBlLnZhbHVlKSB7XG4gICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aHJvdyBuZXcgSW52YWxpZFR5cGVFcnJvcih0eXBlLCB0aGlzLmFsbG93ZWRWYWx1ZXMuc2xpY2UoKSk7XG4gIH1cblxuICBwdWJsaWMgb3ZlcnJpZGUgdmFsdWVzKCk6IEFycmF5PFRWYWx1ZT4ge1xuICAgIHJldHVybiB0aGlzLmFsbG93ZWRWYWx1ZXMuc2xpY2UoKTtcbiAgfVxuXG4gIHB1YmxpYyBvdmVycmlkZSBjb21wbGV0ZSgpOiBBcnJheTxUVmFsdWU+IHtcbiAgICByZXR1cm4gdGhpcy52YWx1ZXMoKTtcbiAgfVxufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFNBQVMsSUFBSSxRQUFRLGFBQWE7QUFFbEMsU0FBUyxnQkFBZ0IsUUFBUSx5QkFBeUI7QUFFMUQsNENBQTRDLEdBQzVDLE9BQU8sTUFBTSxpQkFDSDtFQUNTLGNBQXFDO0VBRXRELFlBQVksTUFBc0QsQ0FBRTtJQUNsRSxLQUFLO0lBQ0wsSUFBSSxDQUFDLGFBQWEsR0FBRyxNQUFNLE9BQU8sQ0FBQyxVQUFVLFNBQVMsT0FBTyxNQUFNLENBQUM7RUFDdEU7RUFFTyxNQUFNLElBQW1CLEVBQVU7SUFDeEMsS0FBSyxNQUFNLFNBQVMsSUFBSSxDQUFDLGFBQWEsQ0FBRTtNQUN0QyxJQUFJLE1BQU0sUUFBUSxPQUFPLEtBQUssS0FBSyxFQUFFO1FBQ25DLE9BQU87TUFDVDtJQUNGO0lBRUEsTUFBTSxJQUFJLGlCQUFpQixNQUFNLElBQUksQ0FBQyxhQUFhLENBQUMsS0FBSztFQUMzRDtFQUVnQixTQUF3QjtJQUN0QyxPQUFPLElBQUksQ0FBQyxhQUFhLENBQUMsS0FBSztFQUNqQztFQUVnQixXQUEwQjtJQUN4QyxPQUFPLElBQUksQ0FBQyxNQUFNO0VBQ3BCO0FBQ0YifQ==