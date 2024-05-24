/**
 * Get the value of a page data
 * For example, if the value is "=title", it returns the value of the page data "title"
 * If the value is "$.title", it will return the value of the element with the selector ".title"
 */ export function getDataValue(data, value) {
  // Get the value from the page data
  if (typeof value === "string") {
    if (value.startsWith("=")) {
      const key = value.slice(1);
      if (!key.includes(".")) {
        return data[key];
      }
      const keys = key.split(".");
      let val = data;
      for (const key of keys){
        val = val?.[key];
      }
      return val;
    }
    if (value.startsWith("$")) {
      return queryCss(value, data.page?.document);
    }
  }
  if (typeof value === "function") {
    return value(data);
  }
  return value;
}
function queryCss(value, document) {
  // https://regexr.com/7qnot
  const checkForAttrPattern = /^\$(.+)\s+(?:attr\(([\w\-]+)\))$/;
  const checkResult = value.match(checkForAttrPattern);
  const hasAttr = checkResult?.[0];
  if (hasAttr) {
    const [_, query, name] = checkResult;
    return document?.querySelector(query)?.getAttribute(name);
  }
  const query = value.slice(1);
  return document?.querySelector(query)?.innerHTML;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvbHVtZUB2Mi4yLjAvY29yZS91dGlscy9kYXRhX3ZhbHVlcy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgdHlwZSB7IERhdGEgfSBmcm9tIFwiLi4vZmlsZS50c1wiO1xuXG4vKipcbiAqIEdldCB0aGUgdmFsdWUgb2YgYSBwYWdlIGRhdGFcbiAqIEZvciBleGFtcGxlLCBpZiB0aGUgdmFsdWUgaXMgXCI9dGl0bGVcIiwgaXQgcmV0dXJucyB0aGUgdmFsdWUgb2YgdGhlIHBhZ2UgZGF0YSBcInRpdGxlXCJcbiAqIElmIHRoZSB2YWx1ZSBpcyBcIiQudGl0bGVcIiwgaXQgd2lsbCByZXR1cm4gdGhlIHZhbHVlIG9mIHRoZSBlbGVtZW50IHdpdGggdGhlIHNlbGVjdG9yIFwiLnRpdGxlXCJcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldERhdGFWYWx1ZShkYXRhOiBQYXJ0aWFsPERhdGE+LCB2YWx1ZT86IHVua25vd24pIHtcbiAgLy8gR2V0IHRoZSB2YWx1ZSBmcm9tIHRoZSBwYWdlIGRhdGFcbiAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gXCJzdHJpbmdcIikge1xuICAgIGlmICh2YWx1ZS5zdGFydHNXaXRoKFwiPVwiKSkge1xuICAgICAgY29uc3Qga2V5ID0gdmFsdWUuc2xpY2UoMSk7XG5cbiAgICAgIGlmICgha2V5LmluY2x1ZGVzKFwiLlwiKSkge1xuICAgICAgICByZXR1cm4gZGF0YVtrZXldO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBrZXlzID0ga2V5LnNwbGl0KFwiLlwiKTtcbiAgICAgIGxldCB2YWwgPSBkYXRhO1xuICAgICAgZm9yIChjb25zdCBrZXkgb2Yga2V5cykge1xuICAgICAgICB2YWwgPSB2YWw/LltrZXldO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHZhbDtcbiAgICB9XG5cbiAgICBpZiAodmFsdWUuc3RhcnRzV2l0aChcIiRcIikpIHtcbiAgICAgIHJldHVybiBxdWVyeUNzcyh2YWx1ZSwgZGF0YS5wYWdlPy5kb2N1bWVudCk7XG4gICAgfVxuICB9XG5cbiAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgcmV0dXJuIHZhbHVlKGRhdGEpO1xuICB9XG5cbiAgcmV0dXJuIHZhbHVlO1xufVxuXG5mdW5jdGlvbiBxdWVyeUNzcyh2YWx1ZTogc3RyaW5nLCBkb2N1bWVudD86IERvY3VtZW50KSB7XG4gIC8vIGh0dHBzOi8vcmVnZXhyLmNvbS83cW5vdFxuICBjb25zdCBjaGVja0ZvckF0dHJQYXR0ZXJuID0gL15cXCQoLispXFxzKyg/OmF0dHJcXCgoW1xcd1xcLV0rKVxcKSkkLztcbiAgY29uc3QgY2hlY2tSZXN1bHQgPSB2YWx1ZS5tYXRjaChjaGVja0ZvckF0dHJQYXR0ZXJuKTtcblxuICBjb25zdCBoYXNBdHRyID0gY2hlY2tSZXN1bHQ/LlswXTtcbiAgaWYgKGhhc0F0dHIpIHtcbiAgICBjb25zdCBbXywgcXVlcnksIG5hbWVdID0gY2hlY2tSZXN1bHQ7XG4gICAgcmV0dXJuIGRvY3VtZW50Py5xdWVyeVNlbGVjdG9yKHF1ZXJ5KT8uZ2V0QXR0cmlidXRlKG5hbWUpO1xuICB9XG5cbiAgY29uc3QgcXVlcnkgPSB2YWx1ZS5zbGljZSgxKTtcbiAgcmV0dXJuIGRvY3VtZW50Py5xdWVyeVNlbGVjdG9yKHF1ZXJ5KT8uaW5uZXJIVE1MO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUVBOzs7O0NBSUMsR0FDRCxPQUFPLFNBQVMsYUFBYSxJQUFtQixFQUFFLEtBQWU7RUFDL0QsbUNBQW1DO0VBQ25DLElBQUksT0FBTyxVQUFVLFVBQVU7SUFDN0IsSUFBSSxNQUFNLFVBQVUsQ0FBQyxNQUFNO01BQ3pCLE1BQU0sTUFBTSxNQUFNLEtBQUssQ0FBQztNQUV4QixJQUFJLENBQUMsSUFBSSxRQUFRLENBQUMsTUFBTTtRQUN0QixPQUFPLElBQUksQ0FBQyxJQUFJO01BQ2xCO01BRUEsTUFBTSxPQUFPLElBQUksS0FBSyxDQUFDO01BQ3ZCLElBQUksTUFBTTtNQUNWLEtBQUssTUFBTSxPQUFPLEtBQU07UUFDdEIsTUFBTSxLQUFLLENBQUMsSUFBSTtNQUNsQjtNQUNBLE9BQU87SUFDVDtJQUVBLElBQUksTUFBTSxVQUFVLENBQUMsTUFBTTtNQUN6QixPQUFPLFNBQVMsT0FBTyxLQUFLLElBQUksRUFBRTtJQUNwQztFQUNGO0VBRUEsSUFBSSxPQUFPLFVBQVUsWUFBWTtJQUMvQixPQUFPLE1BQU07RUFDZjtFQUVBLE9BQU87QUFDVDtBQUVBLFNBQVMsU0FBUyxLQUFhLEVBQUUsUUFBbUI7RUFDbEQsMkJBQTJCO0VBQzNCLE1BQU0sc0JBQXNCO0VBQzVCLE1BQU0sY0FBYyxNQUFNLEtBQUssQ0FBQztFQUVoQyxNQUFNLFVBQVUsYUFBYSxDQUFDLEVBQUU7RUFDaEMsSUFBSSxTQUFTO0lBQ1gsTUFBTSxDQUFDLEdBQUcsT0FBTyxLQUFLLEdBQUc7SUFDekIsT0FBTyxVQUFVLGNBQWMsUUFBUSxhQUFhO0VBQ3REO0VBRUEsTUFBTSxRQUFRLE1BQU0sS0FBSyxDQUFDO0VBQzFCLE9BQU8sVUFBVSxjQUFjLFFBQVE7QUFDekMifQ==