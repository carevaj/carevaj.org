const reactElement = Symbol.for("react.element");
const objectConstructor = {}.constructor;
/** Check if the argument passed is a plain object */ export function isPlainObject(obj) {
  return typeof obj === "object" && obj !== null && obj.constructor === objectConstructor && // @ts-ignore: Check if the argument passed is a React element
  obj["$$typeof"] !== reactElement && // @ts-ignore: Check if the argument passed is a Page.data object
  obj !== obj.page?.data;
}
/**
 * Merge two objects recursively.
 * It's used to merge user options with default options.
 */ export function merge(defaults, user) {
  const merged = {
    ...defaults
  };
  if (!user) {
    return merged;
  }
  for (const [key, value] of Object.entries(user)){
    if (value === undefined) {
      continue;
    }
    // @ts-ignore: No index signature with a parameter of type 'string' was found on type 'unknown'
    if (isPlainObject(merged[key]) && isPlainObject(value)) {
      // @ts-ignore: Type 'string' cannot be used to index type 'Type'
      merged[key] = merge(merged[key], value);
      continue;
    }
    // @ts-ignore: Type 'string' cannot be used to index type 'Type'
    merged[key] = value;
  }
  return merged;
}
/**
 * Merge two objects recursively.
 * It's like merge() but it mutates the first value.
 */ export function assign(target, override) {
  if (!override) {
    return;
  }
  for (const [key, value] of Object.entries(override)){
    if (value === undefined) {
      continue;
    }
    // @ts-ignore: No index signature with a parameter of type 'string' was found on type 'unknown'
    if (isPlainObject(target[key]) && isPlainObject(value)) {
      // @ts-ignore: Type 'string' cannot be used to index type 'Type'
      target[key] = {
        ...target[key]
      };
      // @ts-ignore: Type 'string' cannot be used to index type 'Type'
      assign(target[key], value);
      continue;
    }
    // @ts-ignore: Type 'string' cannot be used to index type 'Type'
    target[key] = value;
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvbHVtZUB2Mi4yLjAvY29yZS91dGlscy9vYmplY3QudHMiXSwic291cmNlc0NvbnRlbnQiOlsiY29uc3QgcmVhY3RFbGVtZW50ID0gU3ltYm9sLmZvcihcInJlYWN0LmVsZW1lbnRcIik7XG5jb25zdCBvYmplY3RDb25zdHJ1Y3RvciA9IHt9LmNvbnN0cnVjdG9yO1xuXG4vKiogVHlwZVNjcmlwdCBoZWxwZXIgdG8gY3JlYXRlIG9wdGlvbmFsIHByb3BlcnRpZXMgcmVjdXJzaXZlbHkgKi9cbmV4cG9ydCB0eXBlIERlZXBQYXJ0aWFsPFQ+ID0gVCBleHRlbmRzIG9iamVjdCA/IHtcbiAgICBbUCBpbiBrZXlvZiBUXT86IERlZXBQYXJ0aWFsPFRbUF0+O1xuICB9XG4gIDogVDtcblxuLyoqIENoZWNrIGlmIHRoZSBhcmd1bWVudCBwYXNzZWQgaXMgYSBwbGFpbiBvYmplY3QgKi9cbmV4cG9ydCBmdW5jdGlvbiBpc1BsYWluT2JqZWN0KG9iajogdW5rbm93bik6IG9iaiBpcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiB7XG4gIHJldHVybiB0eXBlb2Ygb2JqID09PSBcIm9iamVjdFwiICYmIG9iaiAhPT0gbnVsbCAmJlxuICAgIG9iai5jb25zdHJ1Y3RvciA9PT0gb2JqZWN0Q29uc3RydWN0b3IgJiZcbiAgICAvLyBAdHMtaWdub3JlOiBDaGVjayBpZiB0aGUgYXJndW1lbnQgcGFzc2VkIGlzIGEgUmVhY3QgZWxlbWVudFxuICAgIG9ialtcIiQkdHlwZW9mXCJdICE9PSByZWFjdEVsZW1lbnQgJiZcbiAgICAvLyBAdHMtaWdub3JlOiBDaGVjayBpZiB0aGUgYXJndW1lbnQgcGFzc2VkIGlzIGEgUGFnZS5kYXRhIG9iamVjdFxuICAgIG9iaiAhPT0gb2JqLnBhZ2U/LmRhdGE7XG59XG5cbi8qKlxuICogTWVyZ2UgdHdvIG9iamVjdHMgcmVjdXJzaXZlbHkuXG4gKiBJdCdzIHVzZWQgdG8gbWVyZ2UgdXNlciBvcHRpb25zIHdpdGggZGVmYXVsdCBvcHRpb25zLlxuICovXG5leHBvcnQgZnVuY3Rpb24gbWVyZ2U8VHlwZT4oXG4gIGRlZmF1bHRzOiBUeXBlLFxuICB1c2VyPzogVHlwZSxcbik6IFJlcXVpcmVkPFR5cGU+IHtcbiAgY29uc3QgbWVyZ2VkID0geyAuLi5kZWZhdWx0cyB9O1xuXG4gIGlmICghdXNlcikge1xuICAgIHJldHVybiBtZXJnZWQgYXMgdW5rbm93biBhcyBSZXF1aXJlZDxUeXBlPjtcbiAgfVxuXG4gIGZvciAoY29uc3QgW2tleSwgdmFsdWVdIG9mIE9iamVjdC5lbnRyaWVzKHVzZXIpKSB7XG4gICAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIC8vIEB0cy1pZ25vcmU6IE5vIGluZGV4IHNpZ25hdHVyZSB3aXRoIGEgcGFyYW1ldGVyIG9mIHR5cGUgJ3N0cmluZycgd2FzIGZvdW5kIG9uIHR5cGUgJ3Vua25vd24nXG4gICAgaWYgKGlzUGxhaW5PYmplY3QobWVyZ2VkW2tleV0pICYmIGlzUGxhaW5PYmplY3QodmFsdWUpKSB7XG4gICAgICAvLyBAdHMtaWdub3JlOiBUeXBlICdzdHJpbmcnIGNhbm5vdCBiZSB1c2VkIHRvIGluZGV4IHR5cGUgJ1R5cGUnXG4gICAgICBtZXJnZWRba2V5XSA9IG1lcmdlKG1lcmdlZFtrZXldLCB2YWx1ZSk7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICAvLyBAdHMtaWdub3JlOiBUeXBlICdzdHJpbmcnIGNhbm5vdCBiZSB1c2VkIHRvIGluZGV4IHR5cGUgJ1R5cGUnXG4gICAgbWVyZ2VkW2tleV0gPSB2YWx1ZTtcbiAgfVxuXG4gIHJldHVybiBtZXJnZWQgYXMgdW5rbm93biBhcyBSZXF1aXJlZDxUeXBlPjtcbn1cblxuLyoqXG4gKiBNZXJnZSB0d28gb2JqZWN0cyByZWN1cnNpdmVseS5cbiAqIEl0J3MgbGlrZSBtZXJnZSgpIGJ1dCBpdCBtdXRhdGVzIHRoZSBmaXJzdCB2YWx1ZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFzc2lnbjxUeXBlPihcbiAgdGFyZ2V0OiBUeXBlLFxuICBvdmVycmlkZT86IFR5cGUsXG4pIHtcbiAgaWYgKCFvdmVycmlkZSkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGZvciAoY29uc3QgW2tleSwgdmFsdWVdIG9mIE9iamVjdC5lbnRyaWVzKG92ZXJyaWRlKSkge1xuICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICAvLyBAdHMtaWdub3JlOiBObyBpbmRleCBzaWduYXR1cmUgd2l0aCBhIHBhcmFtZXRlciBvZiB0eXBlICdzdHJpbmcnIHdhcyBmb3VuZCBvbiB0eXBlICd1bmtub3duJ1xuICAgIGlmIChpc1BsYWluT2JqZWN0KHRhcmdldFtrZXldKSAmJiBpc1BsYWluT2JqZWN0KHZhbHVlKSkge1xuICAgICAgLy8gQHRzLWlnbm9yZTogVHlwZSAnc3RyaW5nJyBjYW5ub3QgYmUgdXNlZCB0byBpbmRleCB0eXBlICdUeXBlJ1xuICAgICAgdGFyZ2V0W2tleV0gPSB7IC4uLnRhcmdldFtrZXldIH07XG4gICAgICAvLyBAdHMtaWdub3JlOiBUeXBlICdzdHJpbmcnIGNhbm5vdCBiZSB1c2VkIHRvIGluZGV4IHR5cGUgJ1R5cGUnXG4gICAgICBhc3NpZ24odGFyZ2V0W2tleV0sIHZhbHVlKTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIC8vIEB0cy1pZ25vcmU6IFR5cGUgJ3N0cmluZycgY2Fubm90IGJlIHVzZWQgdG8gaW5kZXggdHlwZSAnVHlwZSdcbiAgICB0YXJnZXRba2V5XSA9IHZhbHVlO1xuICB9XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsTUFBTSxlQUFlLE9BQU8sR0FBRyxDQUFDO0FBQ2hDLE1BQU0sb0JBQW9CLENBQUMsRUFBRSxXQUFXO0FBUXhDLG1EQUFtRCxHQUNuRCxPQUFPLFNBQVMsY0FBYyxHQUFZO0VBQ3hDLE9BQU8sT0FBTyxRQUFRLFlBQVksUUFBUSxRQUN4QyxJQUFJLFdBQVcsS0FBSyxxQkFDcEIsOERBQThEO0VBQzlELEdBQUcsQ0FBQyxXQUFXLEtBQUssZ0JBQ3BCLGlFQUFpRTtFQUNqRSxRQUFRLElBQUksSUFBSSxFQUFFO0FBQ3RCO0FBRUE7OztDQUdDLEdBQ0QsT0FBTyxTQUFTLE1BQ2QsUUFBYyxFQUNkLElBQVc7RUFFWCxNQUFNLFNBQVM7SUFBRSxHQUFHLFFBQVE7RUFBQztFQUU3QixJQUFJLENBQUMsTUFBTTtJQUNULE9BQU87RUFDVDtFQUVBLEtBQUssTUFBTSxDQUFDLEtBQUssTUFBTSxJQUFJLE9BQU8sT0FBTyxDQUFDLE1BQU87SUFDL0MsSUFBSSxVQUFVLFdBQVc7TUFDdkI7SUFDRjtJQUVBLCtGQUErRjtJQUMvRixJQUFJLGNBQWMsTUFBTSxDQUFDLElBQUksS0FBSyxjQUFjLFFBQVE7TUFDdEQsZ0VBQWdFO01BQ2hFLE1BQU0sQ0FBQyxJQUFJLEdBQUcsTUFBTSxNQUFNLENBQUMsSUFBSSxFQUFFO01BQ2pDO0lBQ0Y7SUFFQSxnRUFBZ0U7SUFDaEUsTUFBTSxDQUFDLElBQUksR0FBRztFQUNoQjtFQUVBLE9BQU87QUFDVDtBQUVBOzs7Q0FHQyxHQUNELE9BQU8sU0FBUyxPQUNkLE1BQVksRUFDWixRQUFlO0VBRWYsSUFBSSxDQUFDLFVBQVU7SUFDYjtFQUNGO0VBRUEsS0FBSyxNQUFNLENBQUMsS0FBSyxNQUFNLElBQUksT0FBTyxPQUFPLENBQUMsVUFBVztJQUNuRCxJQUFJLFVBQVUsV0FBVztNQUN2QjtJQUNGO0lBRUEsK0ZBQStGO0lBQy9GLElBQUksY0FBYyxNQUFNLENBQUMsSUFBSSxLQUFLLGNBQWMsUUFBUTtNQUN0RCxnRUFBZ0U7TUFDaEUsTUFBTSxDQUFDLElBQUksR0FBRztRQUFFLEdBQUcsTUFBTSxDQUFDLElBQUk7TUFBQztNQUMvQixnRUFBZ0U7TUFDaEUsT0FBTyxNQUFNLENBQUMsSUFBSSxFQUFFO01BQ3BCO0lBQ0Y7SUFFQSxnRUFBZ0U7SUFDaEUsTUFBTSxDQUFDLElBQUksR0FBRztFQUNoQjtBQUNGIn0=