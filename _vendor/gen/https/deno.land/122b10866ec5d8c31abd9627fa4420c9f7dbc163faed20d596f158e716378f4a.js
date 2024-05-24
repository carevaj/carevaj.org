/**
 * Check if the content variable is a generator.
 */ export function isGenerator(content) {
  if (typeof content !== "function") {
    return false;
  }
  const name = content.constructor.name;
  return name === "GeneratorFunction" || name === "AsyncGeneratorFunction";
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvbHVtZUB2Mi4yLjAvY29yZS91dGlscy9nZW5lcmF0b3IudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBDaGVjayBpZiB0aGUgY29udGVudCB2YXJpYWJsZSBpcyBhIGdlbmVyYXRvci5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzR2VuZXJhdG9yKFxuICBjb250ZW50OiB1bmtub3duLFxuKTogY29udGVudCBpcyBHZW5lcmF0b3JGdW5jdGlvbiB8IEFzeW5jR2VuZXJhdG9yRnVuY3Rpb24ge1xuICBpZiAodHlwZW9mIGNvbnRlbnQgIT09IFwiZnVuY3Rpb25cIikge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGNvbnN0IG5hbWUgPSBjb250ZW50LmNvbnN0cnVjdG9yLm5hbWU7XG4gIHJldHVybiAobmFtZSA9PT0gXCJHZW5lcmF0b3JGdW5jdGlvblwiIHx8IG5hbWUgPT09IFwiQXN5bmNHZW5lcmF0b3JGdW5jdGlvblwiKTtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Q0FFQyxHQUNELE9BQU8sU0FBUyxZQUNkLE9BQWdCO0VBRWhCLElBQUksT0FBTyxZQUFZLFlBQVk7SUFDakMsT0FBTztFQUNUO0VBRUEsTUFBTSxPQUFPLFFBQVEsV0FBVyxDQUFDLElBQUk7RUFDckMsT0FBUSxTQUFTLHVCQUF1QixTQUFTO0FBQ25EIn0=