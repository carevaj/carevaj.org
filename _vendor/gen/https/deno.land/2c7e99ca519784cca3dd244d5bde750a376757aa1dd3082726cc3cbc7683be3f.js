import { astring, meriyah, walker } from "../deps.ts";
// List of identifiers that are in globalThis
// but should be accessed as templateState.identifier
const INCLUDE_GLOBAL = [
  "name"
];
// List of identifiers that should be ignored
// when transforming the code
const DEFAULT_EXCLUDES = [
  "globalThis",
  "self",
  "global",
  "this",
  "undefined",
  "null"
];
// Tracks the scope of the code
// and the variables that should be ignored
class ScopeTracker {
  scopes = [];
  // The index of the global/function scope
  globalScope = 0;
  includes(val) {
    for(let i = this.scopes.length - 1; i >= 0; i--){
      if (this.scopes[i].stack.includes(val)) {
        return true;
      }
    }
    return false;
  }
  pushScope(global) {
    if (global) {
      this.globalScope = this.scopes.length;
    }
    const newScope = {
      globalScope: this.globalScope,
      stack: []
    };
    this.scopes.push(newScope);
  }
  popScope() {
    this.globalScope = this.scopes[this.scopes.length - 1].globalScope;
    this.scopes.pop();
  }
  pushBinding(val, global) {
    if (this.scopes.length === 0) {
      this.scopes.push({
        globalScope: this.globalScope,
        stack: []
      });
    }
    if (global) {
      this.scopes[this.globalScope].stack.push(val);
    } else {
      this.scopes[this.scopes.length - 1].stack.push(val);
    }
  }
  pushPatternBinding(pattern, global) {
    switch(pattern.type){
      case "Identifier":
        this.pushBinding(pattern.name, global);
        break;
      case "RestElement":
        this.pushPatternBinding(pattern.argument, global);
        break;
      case "ArrayPattern":
        for (const element of pattern.elements){
          if (element) {
            this.pushPatternBinding(element, global);
          }
        }
        break;
      case "ObjectPattern":
        for (const prop of pattern.properties){
          if (prop.type === "RestElement") {
            this.pushPatternBinding(prop.argument, global);
          } else {
            this.pushPatternBinding(prop.value, global);
          }
        }
        break;
      case "AssignmentPattern":
        this.pushPatternBinding(pattern.left, global);
        break;
    }
  }
  pushPatternBindings(patterns, global) {
    for (const pattern of patterns){
      this.pushPatternBinding(pattern, global);
    }
  }
}
export function transformTemplateCode(code, templateState) {
  if (!code.trim()) {
    return code;
  }
  const parsed = meriyah.parseScript(code, {
    module: true
  });
  const tracker = new ScopeTracker();
  const exclude = [
    templateState,
    ...DEFAULT_EXCLUDES
  ];
  if (parsed.type !== "Program") {
    throw new Error("Expected a program");
  }
  if (parsed.body.length === 0) {
    throw new Error("Empty program");
  }
  // Transforms an identifier to a MemberExpression
  // if it's not in the exclude list
  //
  // Example:
  // Transforms {{ name }} to {{ id.name }}
  function transformIdentifier(id) {
    if (!INCLUDE_GLOBAL.includes(id.name) && globalThis[id.name] !== undefined || exclude.includes(id.name) || tracker.includes(id.name) || id.name.startsWith("__")) {
      return id;
    }
    return {
      type: "MemberExpression",
      object: {
        type: "Identifier",
        name: templateState
      },
      optional: false,
      computed: false,
      property: id
    };
  }
  walker.walk(parsed, {
    enter (node) {
      switch(node.type){
        // Track variable declarations
        case "VariableDeclaration":
          // "var" declarations are scoped to the function/global scope.
          tracker.pushPatternBindings(node.declarations.map((d)=>d.id), node.kind === "var");
          break;
        // Track function declarations, and
        // function parameters.
        // Also track the scope.
        case "FunctionDeclaration":
        case "FunctionExpression":
          if (node.id) {
            tracker.pushBinding(node.id.name);
          }
          tracker.pushScope(true);
          tracker.pushPatternBindings(node.params);
          break;
        case "ArrowFunctionExpression":
          tracker.pushScope();
          tracker.pushPatternBindings(node.params);
          break;
        case "Property":
          if (node.shorthand && node.key.type === "Identifier") {
            this.replace({
              type: "Property",
              key: node.key,
              value: transformIdentifier(node.key),
              kind: "init",
              computed: false,
              method: false,
              shorthand: false
            });
          }
          break;
      }
    },
    leave (node, parent) {
      switch(node.type){
        // Pop the scope when leaving a function
        case "FunctionDeclaration":
        case "FunctionExpression":
        case "ArrowFunctionExpression":
          tracker.popScope();
          break;
        case "Identifier":
          // Don't transform identifiers that aren't at the start of a MemberExpression
          // ie. don't transform `bar` or `baz` in `foo.bar.baz`
          // MemberExpression nodes can also take on a computed property
          // which means it is an array-like access, so we do transform those.
          if (parent?.type === "MemberExpression" && parent.property === node && parent.computed === false) {
            return;
          }
          // Don't transform identifiers that are keys in an object
          if (parent?.type === "Property" && parent.key === node) {
            return;
          }
          this.replace(transformIdentifier(node));
          break;
      }
    }
  });
  const generated = astring.generate(parsed);
  return generated;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvdmVudG9AdjAuMTIuNS9zcmMvdHJhbnNmb3JtZXIudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgYXN0cmluZywgRVNUcmVlLCBtZXJpeWFoLCB3YWxrZXIgfSBmcm9tIFwiLi4vZGVwcy50c1wiO1xuXG4vLyBMaXN0IG9mIGlkZW50aWZpZXJzIHRoYXQgYXJlIGluIGdsb2JhbFRoaXNcbi8vIGJ1dCBzaG91bGQgYmUgYWNjZXNzZWQgYXMgdGVtcGxhdGVTdGF0ZS5pZGVudGlmaWVyXG5jb25zdCBJTkNMVURFX0dMT0JBTCA9IFtcbiAgXCJuYW1lXCIsXG5dO1xuXG4vLyBMaXN0IG9mIGlkZW50aWZpZXJzIHRoYXQgc2hvdWxkIGJlIGlnbm9yZWRcbi8vIHdoZW4gdHJhbnNmb3JtaW5nIHRoZSBjb2RlXG5jb25zdCBERUZBVUxUX0VYQ0xVREVTID0gW1xuICBcImdsb2JhbFRoaXNcIixcbiAgXCJzZWxmXCIsXG4gIFwiZ2xvYmFsXCIsXG4gIFwidGhpc1wiLFxuICBcInVuZGVmaW5lZFwiLFxuICBcIm51bGxcIixcbl07XG5cbnR5cGUgU2NvcGUgPSB7XG4gIGdsb2JhbFNjb3BlOiBudW1iZXI7XG4gIHN0YWNrOiBzdHJpbmdbXTtcbn07XG5cbi8vIFRyYWNrcyB0aGUgc2NvcGUgb2YgdGhlIGNvZGVcbi8vIGFuZCB0aGUgdmFyaWFibGVzIHRoYXQgc2hvdWxkIGJlIGlnbm9yZWRcbmNsYXNzIFNjb3BlVHJhY2tlciB7XG4gIHByaXZhdGUgc2NvcGVzOiBTY29wZVtdID0gW107XG5cbiAgLy8gVGhlIGluZGV4IG9mIHRoZSBnbG9iYWwvZnVuY3Rpb24gc2NvcGVcbiAgcHJpdmF0ZSBnbG9iYWxTY29wZSA9IDA7XG5cbiAgaW5jbHVkZXModmFsOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICBmb3IgKGxldCBpID0gdGhpcy5zY29wZXMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgIGlmICh0aGlzLnNjb3Blc1tpXS5zdGFjay5pbmNsdWRlcyh2YWwpKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIHB1c2hTY29wZShnbG9iYWw/OiBib29sZWFuKSB7XG4gICAgaWYgKGdsb2JhbCkge1xuICAgICAgdGhpcy5nbG9iYWxTY29wZSA9IHRoaXMuc2NvcGVzLmxlbmd0aDtcbiAgICB9XG5cbiAgICBjb25zdCBuZXdTY29wZTogU2NvcGUgPSB7XG4gICAgICBnbG9iYWxTY29wZTogdGhpcy5nbG9iYWxTY29wZSxcbiAgICAgIHN0YWNrOiBbXSxcbiAgICB9O1xuXG4gICAgdGhpcy5zY29wZXMucHVzaChuZXdTY29wZSk7XG4gIH1cblxuICBwb3BTY29wZSgpIHtcbiAgICB0aGlzLmdsb2JhbFNjb3BlID0gdGhpcy5zY29wZXNbdGhpcy5zY29wZXMubGVuZ3RoIC0gMV0uZ2xvYmFsU2NvcGU7XG4gICAgdGhpcy5zY29wZXMucG9wKCk7XG4gIH1cblxuICBwdXNoQmluZGluZyh2YWw6IHN0cmluZywgZ2xvYmFsPzogYm9vbGVhbikge1xuICAgIGlmICh0aGlzLnNjb3Blcy5sZW5ndGggPT09IDApIHtcbiAgICAgIHRoaXMuc2NvcGVzLnB1c2goeyBnbG9iYWxTY29wZTogdGhpcy5nbG9iYWxTY29wZSwgc3RhY2s6IFtdIH0pO1xuICAgIH1cblxuICAgIGlmIChnbG9iYWwpIHtcbiAgICAgIHRoaXMuc2NvcGVzW3RoaXMuZ2xvYmFsU2NvcGVdLnN0YWNrLnB1c2godmFsKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5zY29wZXNbdGhpcy5zY29wZXMubGVuZ3RoIC0gMV0uc3RhY2sucHVzaCh2YWwpO1xuICAgIH1cbiAgfVxuXG4gIHB1c2hQYXR0ZXJuQmluZGluZyhwYXR0ZXJuOiBFU1RyZWUuUGF0dGVybiwgZ2xvYmFsPzogYm9vbGVhbikge1xuICAgIHN3aXRjaCAocGF0dGVybi50eXBlKSB7XG4gICAgICBjYXNlIFwiSWRlbnRpZmllclwiOlxuICAgICAgICB0aGlzLnB1c2hCaW5kaW5nKHBhdHRlcm4ubmFtZSwgZ2xvYmFsKTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgXCJSZXN0RWxlbWVudFwiOlxuICAgICAgICB0aGlzLnB1c2hQYXR0ZXJuQmluZGluZyhwYXR0ZXJuLmFyZ3VtZW50LCBnbG9iYWwpO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSBcIkFycmF5UGF0dGVyblwiOlxuICAgICAgICBmb3IgKGNvbnN0IGVsZW1lbnQgb2YgcGF0dGVybi5lbGVtZW50cykge1xuICAgICAgICAgIGlmIChlbGVtZW50KSB7XG4gICAgICAgICAgICB0aGlzLnB1c2hQYXR0ZXJuQmluZGluZyhlbGVtZW50LCBnbG9iYWwpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSBcIk9iamVjdFBhdHRlcm5cIjpcbiAgICAgICAgZm9yIChjb25zdCBwcm9wIG9mIHBhdHRlcm4ucHJvcGVydGllcykge1xuICAgICAgICAgIGlmIChwcm9wLnR5cGUgPT09IFwiUmVzdEVsZW1lbnRcIikge1xuICAgICAgICAgICAgdGhpcy5wdXNoUGF0dGVybkJpbmRpbmcocHJvcC5hcmd1bWVudCwgZ2xvYmFsKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5wdXNoUGF0dGVybkJpbmRpbmcocHJvcC52YWx1ZSwgZ2xvYmFsKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgXCJBc3NpZ25tZW50UGF0dGVyblwiOlxuICAgICAgICB0aGlzLnB1c2hQYXR0ZXJuQmluZGluZyhwYXR0ZXJuLmxlZnQsIGdsb2JhbCk7XG4gICAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuXG4gIHB1c2hQYXR0ZXJuQmluZGluZ3MocGF0dGVybnM6IEVTVHJlZS5QYXR0ZXJuW10sIGdsb2JhbD86IGJvb2xlYW4pIHtcbiAgICBmb3IgKGNvbnN0IHBhdHRlcm4gb2YgcGF0dGVybnMpIHtcbiAgICAgIHRoaXMucHVzaFBhdHRlcm5CaW5kaW5nKHBhdHRlcm4sIGdsb2JhbCk7XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB0cmFuc2Zvcm1UZW1wbGF0ZUNvZGUoXG4gIGNvZGU6IHN0cmluZyxcbiAgdGVtcGxhdGVTdGF0ZTogc3RyaW5nLFxuKTogc3RyaW5nIHtcbiAgaWYgKCFjb2RlLnRyaW0oKSkge1xuICAgIHJldHVybiBjb2RlO1xuICB9XG5cbiAgY29uc3QgcGFyc2VkID0gbWVyaXlhaC5wYXJzZVNjcmlwdChjb2RlLCB7IG1vZHVsZTogdHJ1ZSB9KSBhcyBFU1RyZWUuUHJvZ3JhbTtcbiAgY29uc3QgdHJhY2tlciA9IG5ldyBTY29wZVRyYWNrZXIoKTtcblxuICBjb25zdCBleGNsdWRlID0gW1xuICAgIHRlbXBsYXRlU3RhdGUsXG4gICAgLi4uREVGQVVMVF9FWENMVURFUyxcbiAgXTtcblxuICBpZiAocGFyc2VkLnR5cGUgIT09IFwiUHJvZ3JhbVwiKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiRXhwZWN0ZWQgYSBwcm9ncmFtXCIpO1xuICB9XG5cbiAgaWYgKHBhcnNlZC5ib2R5Lmxlbmd0aCA9PT0gMCkge1xuICAgIHRocm93IG5ldyBFcnJvcihcIkVtcHR5IHByb2dyYW1cIik7XG4gIH1cblxuICAvLyBUcmFuc2Zvcm1zIGFuIGlkZW50aWZpZXIgdG8gYSBNZW1iZXJFeHByZXNzaW9uXG4gIC8vIGlmIGl0J3Mgbm90IGluIHRoZSBleGNsdWRlIGxpc3RcbiAgLy9cbiAgLy8gRXhhbXBsZTpcbiAgLy8gVHJhbnNmb3JtcyB7eyBuYW1lIH19IHRvIHt7IGlkLm5hbWUgfX1cbiAgZnVuY3Rpb24gdHJhbnNmb3JtSWRlbnRpZmllcihcbiAgICBpZDogRVNUcmVlLklkZW50aWZpZXIsXG4gICk6IEVTVHJlZS5NZW1iZXJFeHByZXNzaW9uIHwgRVNUcmVlLklkZW50aWZpZXIge1xuICAgIGlmIChcbiAgICAgICghSU5DTFVERV9HTE9CQUwuaW5jbHVkZXMoaWQubmFtZSkgJiZcbiAgICAgICAgZ2xvYmFsVGhpc1tpZC5uYW1lIGFzIGtleW9mIHR5cGVvZiBnbG9iYWxUaGlzXSAhPT0gdW5kZWZpbmVkKSB8fFxuICAgICAgZXhjbHVkZS5pbmNsdWRlcyhpZC5uYW1lKSB8fFxuICAgICAgdHJhY2tlci5pbmNsdWRlcyhpZC5uYW1lKSB8fFxuICAgICAgaWQubmFtZS5zdGFydHNXaXRoKFwiX19cIilcbiAgICApIHtcbiAgICAgIHJldHVybiBpZDtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgdHlwZTogXCJNZW1iZXJFeHByZXNzaW9uXCIsXG4gICAgICBvYmplY3Q6IHtcbiAgICAgICAgdHlwZTogXCJJZGVudGlmaWVyXCIsXG4gICAgICAgIG5hbWU6IHRlbXBsYXRlU3RhdGUsXG4gICAgICB9LFxuICAgICAgb3B0aW9uYWw6IGZhbHNlLFxuICAgICAgY29tcHV0ZWQ6IGZhbHNlLFxuICAgICAgcHJvcGVydHk6IGlkLFxuICAgIH07XG4gIH1cblxuICB3YWxrZXIud2FsayhwYXJzZWQsIHtcbiAgICBlbnRlcihub2RlKSB7XG4gICAgICBzd2l0Y2ggKG5vZGUudHlwZSkge1xuICAgICAgICAvLyBUcmFjayB2YXJpYWJsZSBkZWNsYXJhdGlvbnNcbiAgICAgICAgY2FzZSBcIlZhcmlhYmxlRGVjbGFyYXRpb25cIjpcbiAgICAgICAgICAvLyBcInZhclwiIGRlY2xhcmF0aW9ucyBhcmUgc2NvcGVkIHRvIHRoZSBmdW5jdGlvbi9nbG9iYWwgc2NvcGUuXG4gICAgICAgICAgdHJhY2tlci5wdXNoUGF0dGVybkJpbmRpbmdzKFxuICAgICAgICAgICAgbm9kZS5kZWNsYXJhdGlvbnMubWFwKChkKSA9PiBkLmlkKSxcbiAgICAgICAgICAgIG5vZGUua2luZCA9PT0gXCJ2YXJcIixcbiAgICAgICAgICApO1xuICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgIC8vIFRyYWNrIGZ1bmN0aW9uIGRlY2xhcmF0aW9ucywgYW5kXG4gICAgICAgIC8vIGZ1bmN0aW9uIHBhcmFtZXRlcnMuXG4gICAgICAgIC8vIEFsc28gdHJhY2sgdGhlIHNjb3BlLlxuICAgICAgICBjYXNlIFwiRnVuY3Rpb25EZWNsYXJhdGlvblwiOlxuICAgICAgICBjYXNlIFwiRnVuY3Rpb25FeHByZXNzaW9uXCI6XG4gICAgICAgICAgaWYgKG5vZGUuaWQpIHtcbiAgICAgICAgICAgIHRyYWNrZXIucHVzaEJpbmRpbmcobm9kZS5pZC5uYW1lKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdHJhY2tlci5wdXNoU2NvcGUodHJ1ZSk7XG4gICAgICAgICAgdHJhY2tlci5wdXNoUGF0dGVybkJpbmRpbmdzKG5vZGUucGFyYW1zKTtcbiAgICAgICAgICBicmVhaztcblxuICAgICAgICBjYXNlIFwiQXJyb3dGdW5jdGlvbkV4cHJlc3Npb25cIjpcbiAgICAgICAgICB0cmFja2VyLnB1c2hTY29wZSgpO1xuICAgICAgICAgIHRyYWNrZXIucHVzaFBhdHRlcm5CaW5kaW5ncyhub2RlLnBhcmFtcyk7XG4gICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgY2FzZSBcIlByb3BlcnR5XCI6XG4gICAgICAgICAgaWYgKG5vZGUuc2hvcnRoYW5kICYmIG5vZGUua2V5LnR5cGUgPT09IFwiSWRlbnRpZmllclwiKSB7XG4gICAgICAgICAgICB0aGlzLnJlcGxhY2Uoe1xuICAgICAgICAgICAgICB0eXBlOiBcIlByb3BlcnR5XCIsXG4gICAgICAgICAgICAgIGtleTogbm9kZS5rZXksXG4gICAgICAgICAgICAgIHZhbHVlOiB0cmFuc2Zvcm1JZGVudGlmaWVyKG5vZGUua2V5KSxcbiAgICAgICAgICAgICAga2luZDogXCJpbml0XCIsXG4gICAgICAgICAgICAgIGNvbXB1dGVkOiBmYWxzZSxcbiAgICAgICAgICAgICAgbWV0aG9kOiBmYWxzZSxcbiAgICAgICAgICAgICAgc2hvcnRoYW5kOiBmYWxzZSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9LFxuICAgIGxlYXZlKG5vZGUsIHBhcmVudCkge1xuICAgICAgc3dpdGNoIChub2RlLnR5cGUpIHtcbiAgICAgICAgLy8gUG9wIHRoZSBzY29wZSB3aGVuIGxlYXZpbmcgYSBmdW5jdGlvblxuICAgICAgICBjYXNlIFwiRnVuY3Rpb25EZWNsYXJhdGlvblwiOlxuICAgICAgICBjYXNlIFwiRnVuY3Rpb25FeHByZXNzaW9uXCI6XG4gICAgICAgIGNhc2UgXCJBcnJvd0Z1bmN0aW9uRXhwcmVzc2lvblwiOlxuICAgICAgICAgIHRyYWNrZXIucG9wU2NvcGUoKTtcbiAgICAgICAgICBicmVhaztcblxuICAgICAgICBjYXNlIFwiSWRlbnRpZmllclwiOlxuICAgICAgICAgIC8vIERvbid0IHRyYW5zZm9ybSBpZGVudGlmaWVycyB0aGF0IGFyZW4ndCBhdCB0aGUgc3RhcnQgb2YgYSBNZW1iZXJFeHByZXNzaW9uXG4gICAgICAgICAgLy8gaWUuIGRvbid0IHRyYW5zZm9ybSBgYmFyYCBvciBgYmF6YCBpbiBgZm9vLmJhci5iYXpgXG4gICAgICAgICAgLy8gTWVtYmVyRXhwcmVzc2lvbiBub2RlcyBjYW4gYWxzbyB0YWtlIG9uIGEgY29tcHV0ZWQgcHJvcGVydHlcbiAgICAgICAgICAvLyB3aGljaCBtZWFucyBpdCBpcyBhbiBhcnJheS1saWtlIGFjY2Vzcywgc28gd2UgZG8gdHJhbnNmb3JtIHRob3NlLlxuICAgICAgICAgIGlmIChcbiAgICAgICAgICAgIHBhcmVudD8udHlwZSA9PT0gXCJNZW1iZXJFeHByZXNzaW9uXCIgJiYgcGFyZW50LnByb3BlcnR5ID09PSBub2RlICYmXG4gICAgICAgICAgICBwYXJlbnQuY29tcHV0ZWQgPT09IGZhbHNlXG4gICAgICAgICAgKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gRG9uJ3QgdHJhbnNmb3JtIGlkZW50aWZpZXJzIHRoYXQgYXJlIGtleXMgaW4gYW4gb2JqZWN0XG4gICAgICAgICAgaWYgKHBhcmVudD8udHlwZSA9PT0gXCJQcm9wZXJ0eVwiICYmIHBhcmVudC5rZXkgPT09IG5vZGUpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy5yZXBsYWNlKHRyYW5zZm9ybUlkZW50aWZpZXIobm9kZSkpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH0sXG4gIH0pO1xuXG4gIGNvbnN0IGdlbmVyYXRlZCA9IGFzdHJpbmcuZ2VuZXJhdGUocGFyc2VkKTtcblxuICByZXR1cm4gZ2VuZXJhdGVkO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFNBQVMsT0FBTyxFQUFVLE9BQU8sRUFBRSxNQUFNLFFBQVEsYUFBYTtBQUU5RCw2Q0FBNkM7QUFDN0MscURBQXFEO0FBQ3JELE1BQU0saUJBQWlCO0VBQ3JCO0NBQ0Q7QUFFRCw2Q0FBNkM7QUFDN0MsNkJBQTZCO0FBQzdCLE1BQU0sbUJBQW1CO0VBQ3ZCO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtDQUNEO0FBT0QsK0JBQStCO0FBQy9CLDJDQUEyQztBQUMzQyxNQUFNO0VBQ0ksU0FBa0IsRUFBRSxDQUFDO0VBRTdCLHlDQUF5QztFQUNqQyxjQUFjLEVBQUU7RUFFeEIsU0FBUyxHQUFXLEVBQVc7SUFDN0IsSUFBSyxJQUFJLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEdBQUcsR0FBRyxLQUFLLEdBQUcsSUFBSztNQUNoRCxJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsTUFBTTtRQUN0QyxPQUFPO01BQ1Q7SUFDRjtJQUVBLE9BQU87RUFDVDtFQUVBLFVBQVUsTUFBZ0IsRUFBRTtJQUMxQixJQUFJLFFBQVE7TUFDVixJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTTtJQUN2QztJQUVBLE1BQU0sV0FBa0I7TUFDdEIsYUFBYSxJQUFJLENBQUMsV0FBVztNQUM3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