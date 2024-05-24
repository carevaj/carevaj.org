import { StringType } from "./string.ts";
/** Completion list type. */ export class ActionListType extends StringType {
  cmd;
  constructor(cmd){
    super();
    this.cmd = cmd;
  }
  /** Complete action names. */ complete() {
    return this.cmd.getCompletions().map((type)=>type.name)// filter unique values
    .filter((value, index, self)=>self.indexOf(value) === index);
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvY2xpZmZ5QHYwLjI1LjcvY29tbWFuZC90eXBlcy9hY3Rpb25fbGlzdC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgdHlwZSB7IENvbW1hbmQgfSBmcm9tIFwiLi4vY29tbWFuZC50c1wiO1xuaW1wb3J0IHsgU3RyaW5nVHlwZSB9IGZyb20gXCIuL3N0cmluZy50c1wiO1xuXG4vKiogQ29tcGxldGlvbiBsaXN0IHR5cGUuICovXG5leHBvcnQgY2xhc3MgQWN0aW9uTGlzdFR5cGUgZXh0ZW5kcyBTdHJpbmdUeXBlIHtcbiAgY29uc3RydWN0b3IocHJvdGVjdGVkIGNtZDogQ29tbWFuZCkge1xuICAgIHN1cGVyKCk7XG4gIH1cblxuICAvKiogQ29tcGxldGUgYWN0aW9uIG5hbWVzLiAqL1xuICBwdWJsaWMgY29tcGxldGUoKTogc3RyaW5nW10ge1xuICAgIHJldHVybiB0aGlzLmNtZC5nZXRDb21wbGV0aW9ucygpXG4gICAgICAubWFwKCh0eXBlKSA9PiB0eXBlLm5hbWUpXG4gICAgICAvLyBmaWx0ZXIgdW5pcXVlIHZhbHVlc1xuICAgICAgLmZpbHRlcigodmFsdWUsIGluZGV4LCBzZWxmKSA9PiBzZWxmLmluZGV4T2YodmFsdWUpID09PSBpbmRleCk7XG4gIH1cbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFDQSxTQUFTLFVBQVUsUUFBUSxjQUFjO0FBRXpDLDBCQUEwQixHQUMxQixPQUFPLE1BQU0sdUJBQXVCOztFQUNsQyxZQUFZLEFBQVUsR0FBWSxDQUFFO0lBQ2xDLEtBQUs7U0FEZSxNQUFBO0VBRXRCO0VBRUEsMkJBQTJCLEdBQzNCLEFBQU8sV0FBcUI7SUFDMUIsT0FBTyxJQUFJLENBQUMsR0FBRyxDQUFDLGNBQWMsR0FDM0IsR0FBRyxDQUFDLENBQUMsT0FBUyxLQUFLLElBQUksQ0FDeEIsdUJBQXVCO0tBQ3RCLE1BQU0sQ0FBQyxDQUFDLE9BQU8sT0FBTyxPQUFTLEtBQUssT0FBTyxDQUFDLFdBQVc7RUFDNUQ7QUFDRiJ9