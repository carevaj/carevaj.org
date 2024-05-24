import { distance } from "../_utils/distance.ts";
/** Convert param case string to camel case. */ export function paramCaseToCamelCase(str) {
  return str.replace(/-([a-z])/g, (g)=>g[1].toUpperCase());
}
/** Convert underscore case string to camel case. */ export function underscoreToCamelCase(str) {
  return str.replace(/([a-z])([A-Z])/g, "$1_$2").toLowerCase().replace(/_([a-z])/g, (g)=>g[1].toUpperCase());
}
/**
 * Find option by flag, name or alias.
 *
 * @param flags Source options array.
 * @param name  Name of the option.
 */ export function getOption(flags, name) {
  while(name[0] === "-"){
    name = name.slice(1);
  }
  for (const flag of flags){
    if (isOption(flag, name)) {
      return flag;
    }
  }
  return;
}
export function didYouMeanOption(option, options) {
  const optionNames = options.map((option)=>[
      option.name,
      ...option.aliases ?? []
    ]).flat().map((option)=>getFlag(option));
  return didYouMean(" Did you mean option", getFlag(option), optionNames);
}
export function didYouMeanType(type, types) {
  return didYouMean(" Did you mean type", type, types);
}
export function didYouMean(message, type, types) {
  const match = closest(type, types);
  return match ? `${message} "${match}"?` : "";
}
export function getFlag(name) {
  if (name.startsWith("-")) {
    return name;
  }
  if (name.length > 1) {
    return `--${name}`;
  }
  return `-${name}`;
}
/**
 * Check if option has name or alias.
 *
 * @param option    The option to check.
 * @param name      The option name or alias.
 */ function isOption(option, name) {
  return option.name === name || option.aliases && option.aliases.indexOf(name) !== -1;
}
export function matchWildCardOptions(name, flags) {
  for (const option of flags){
    if (option.name.indexOf("*") === -1) {
      continue;
    }
    let matched = matchWildCardOption(name, option);
    if (matched) {
      matched = {
        ...matched,
        name
      };
      flags.push(matched);
      return matched;
    }
  }
}
function matchWildCardOption(name, option) {
  const parts = option.name.split(".");
  const parts2 = name.split(".");
  if (parts.length !== parts2.length) {
    return false;
  }
  const count = Math.max(parts.length, parts2.length);
  for(let i = 0; i < count; i++){
    if (parts[i] !== parts2[i] && parts[i] !== "*") {
      return false;
    }
  }
  return option;
}
function closest(str, arr) {
  let minDistance = Infinity;
  let minIndex = 0;
  for(let i = 0; i < arr.length; i++){
    const dist = distance(str, arr[i]);
    if (dist < minDistance) {
      minDistance = dist;
      minIndex = i;
    }
  }
  return arr[minIndex];
}
export function getDefaultValue(option) {
  return typeof option.default === "function" ? option.default() : option.default;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvY2xpZmZ5QHYwLjI1LjcvZmxhZ3MvX3V0aWxzLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB0eXBlIHsgRmxhZ09wdGlvbnMgfSBmcm9tIFwiLi90eXBlcy50c1wiO1xuaW1wb3J0IHsgZGlzdGFuY2UgfSBmcm9tIFwiLi4vX3V0aWxzL2Rpc3RhbmNlLnRzXCI7XG5cbi8qKiBDb252ZXJ0IHBhcmFtIGNhc2Ugc3RyaW5nIHRvIGNhbWVsIGNhc2UuICovXG5leHBvcnQgZnVuY3Rpb24gcGFyYW1DYXNlVG9DYW1lbENhc2Uoc3RyOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gc3RyLnJlcGxhY2UoXG4gICAgLy0oW2Etel0pL2csXG4gICAgKGcpID0+IGdbMV0udG9VcHBlckNhc2UoKSxcbiAgKTtcbn1cblxuLyoqIENvbnZlcnQgdW5kZXJzY29yZSBjYXNlIHN0cmluZyB0byBjYW1lbCBjYXNlLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHVuZGVyc2NvcmVUb0NhbWVsQ2FzZShzdHI6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBzdHJcbiAgICAucmVwbGFjZSgvKFthLXpdKShbQS1aXSkvZywgXCIkMV8kMlwiKVxuICAgIC50b0xvd2VyQ2FzZSgpXG4gICAgLnJlcGxhY2UoXG4gICAgICAvXyhbYS16XSkvZyxcbiAgICAgIChnKSA9PiBnWzFdLnRvVXBwZXJDYXNlKCksXG4gICAgKTtcbn1cblxuLyoqXG4gKiBGaW5kIG9wdGlvbiBieSBmbGFnLCBuYW1lIG9yIGFsaWFzLlxuICpcbiAqIEBwYXJhbSBmbGFncyBTb3VyY2Ugb3B0aW9ucyBhcnJheS5cbiAqIEBwYXJhbSBuYW1lICBOYW1lIG9mIHRoZSBvcHRpb24uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRPcHRpb248TyBleHRlbmRzIEZsYWdPcHRpb25zPihcbiAgZmxhZ3M6IEFycmF5PE8+LFxuICBuYW1lOiBzdHJpbmcsXG4pOiBPIHwgdW5kZWZpbmVkIHtcbiAgd2hpbGUgKG5hbWVbMF0gPT09IFwiLVwiKSB7XG4gICAgbmFtZSA9IG5hbWUuc2xpY2UoMSk7XG4gIH1cblxuICBmb3IgKGNvbnN0IGZsYWcgb2YgZmxhZ3MpIHtcbiAgICBpZiAoaXNPcHRpb24oZmxhZywgbmFtZSkpIHtcbiAgICAgIHJldHVybiBmbGFnO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGRpZFlvdU1lYW5PcHRpb24oXG4gIG9wdGlvbjogc3RyaW5nLFxuICBvcHRpb25zOiBBcnJheTxGbGFnT3B0aW9ucz4sXG4pOiBzdHJpbmcge1xuICBjb25zdCBvcHRpb25OYW1lcyA9IG9wdGlvbnNcbiAgICAubWFwKChvcHRpb24pID0+IFtvcHRpb24ubmFtZSwgLi4uKG9wdGlvbi5hbGlhc2VzID8/IFtdKV0pXG4gICAgLmZsYXQoKVxuICAgIC5tYXAoKG9wdGlvbikgPT4gZ2V0RmxhZyhvcHRpb24pKTtcbiAgcmV0dXJuIGRpZFlvdU1lYW4oXCIgRGlkIHlvdSBtZWFuIG9wdGlvblwiLCBnZXRGbGFnKG9wdGlvbiksIG9wdGlvbk5hbWVzKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGRpZFlvdU1lYW5UeXBlKHR5cGU6IHN0cmluZywgdHlwZXM6IEFycmF5PHN0cmluZz4pOiBzdHJpbmcge1xuICByZXR1cm4gZGlkWW91TWVhbihcIiBEaWQgeW91IG1lYW4gdHlwZVwiLCB0eXBlLCB0eXBlcyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBkaWRZb3VNZWFuKFxuICBtZXNzYWdlOiBzdHJpbmcsXG4gIHR5cGU6IHN0cmluZyxcbiAgdHlwZXM6IEFycmF5PHN0cmluZz4sXG4pOiBzdHJpbmcge1xuICBjb25zdCBtYXRjaDogc3RyaW5nIHwgdW5kZWZpbmVkID0gY2xvc2VzdCh0eXBlLCB0eXBlcyk7XG4gIHJldHVybiBtYXRjaCA/IGAke21lc3NhZ2V9IFwiJHttYXRjaH1cIj9gIDogXCJcIjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEZsYWcobmFtZTogc3RyaW5nKSB7XG4gIGlmIChuYW1lLnN0YXJ0c1dpdGgoXCItXCIpKSB7XG4gICAgcmV0dXJuIG5hbWU7XG4gIH1cbiAgaWYgKG5hbWUubGVuZ3RoID4gMSkge1xuICAgIHJldHVybiBgLS0ke25hbWV9YDtcbiAgfVxuICByZXR1cm4gYC0ke25hbWV9YDtcbn1cblxuLyoqXG4gKiBDaGVjayBpZiBvcHRpb24gaGFzIG5hbWUgb3IgYWxpYXMuXG4gKlxuICogQHBhcmFtIG9wdGlvbiAgICBUaGUgb3B0aW9uIHRvIGNoZWNrLlxuICogQHBhcmFtIG5hbWUgICAgICBUaGUgb3B0aW9uIG5hbWUgb3IgYWxpYXMuXG4gKi9cbmZ1bmN0aW9uIGlzT3B0aW9uKG9wdGlvbjogRmxhZ09wdGlvbnMsIG5hbWU6IHN0cmluZykge1xuICByZXR1cm4gb3B0aW9uLm5hbWUgPT09IG5hbWUgfHxcbiAgICAob3B0aW9uLmFsaWFzZXMgJiYgb3B0aW9uLmFsaWFzZXMuaW5kZXhPZihuYW1lKSAhPT0gLTEpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbWF0Y2hXaWxkQ2FyZE9wdGlvbnMoXG4gIG5hbWU6IHN0cmluZyxcbiAgZmxhZ3M6IEFycmF5PEZsYWdPcHRpb25zPixcbik6IEZsYWdPcHRpb25zIHwgdW5kZWZpbmVkIHtcbiAgZm9yIChjb25zdCBvcHRpb24gb2YgZmxhZ3MpIHtcbiAgICBpZiAob3B0aW9uLm5hbWUuaW5kZXhPZihcIipcIikgPT09IC0xKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gICAgbGV0IG1hdGNoZWQgPSBtYXRjaFdpbGRDYXJkT3B0aW9uKG5hbWUsIG9wdGlvbik7XG4gICAgaWYgKG1hdGNoZWQpIHtcbiAgICAgIG1hdGNoZWQgPSB7IC4uLm1hdGNoZWQsIG5hbWUgfTtcbiAgICAgIGZsYWdzLnB1c2gobWF0Y2hlZCk7XG4gICAgICByZXR1cm4gbWF0Y2hlZDtcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gbWF0Y2hXaWxkQ2FyZE9wdGlvbihcbiAgbmFtZTogc3RyaW5nLFxuICBvcHRpb246IEZsYWdPcHRpb25zLFxuKTogRmxhZ09wdGlvbnMgfCBmYWxzZSB7XG4gIGNvbnN0IHBhcnRzID0gb3B0aW9uLm5hbWUuc3BsaXQoXCIuXCIpO1xuICBjb25zdCBwYXJ0czIgPSBuYW1lLnNwbGl0KFwiLlwiKTtcbiAgaWYgKHBhcnRzLmxlbmd0aCAhPT0gcGFydHMyLmxlbmd0aCkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBjb25zdCBjb3VudCA9IE1hdGgubWF4KHBhcnRzLmxlbmd0aCwgcGFydHMyLmxlbmd0aCk7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgY291bnQ7IGkrKykge1xuICAgIGlmIChwYXJ0c1tpXSAhPT0gcGFydHMyW2ldICYmIHBhcnRzW2ldICE9PSBcIipcIikge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuICByZXR1cm4gb3B0aW9uO1xufVxuXG5mdW5jdGlvbiBjbG9zZXN0KHN0cjogc3RyaW5nLCBhcnI6IHN0cmluZ1tdKTogc3RyaW5nIHwgdW5kZWZpbmVkIHtcbiAgbGV0IG1pbkRpc3RhbmNlID0gSW5maW5pdHk7XG4gIGxldCBtaW5JbmRleCA9IDA7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgYXJyLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3QgZGlzdCA9IGRpc3RhbmNlKHN0ciwgYXJyW2ldKTtcbiAgICBpZiAoZGlzdCA8IG1pbkRpc3RhbmNlKSB7XG4gICAgICBtaW5EaXN0YW5jZSA9IGRpc3Q7XG4gICAgICBtaW5JbmRleCA9IGk7XG4gICAgfVxuICB9XG4gIHJldHVybiBhcnJbbWluSW5kZXhdO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0RGVmYXVsdFZhbHVlKG9wdGlvbjogRmxhZ09wdGlvbnMpOiB1bmtub3duIHtcbiAgcmV0dXJuIHR5cGVvZiBvcHRpb24uZGVmYXVsdCA9PT0gXCJmdW5jdGlvblwiXG4gICAgPyBvcHRpb24uZGVmYXVsdCgpXG4gICAgOiBvcHRpb24uZGVmYXVsdDtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFDQSxTQUFTLFFBQVEsUUFBUSx3QkFBd0I7QUFFakQsNkNBQTZDLEdBQzdDLE9BQU8sU0FBUyxxQkFBcUIsR0FBVztFQUM5QyxPQUFPLElBQUksT0FBTyxDQUNoQixhQUNBLENBQUMsSUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLFdBQVc7QUFFM0I7QUFFQSxrREFBa0QsR0FDbEQsT0FBTyxTQUFTLHNCQUFzQixHQUFXO0VBQy9DLE9BQU8sSUFDSixPQUFPLENBQUMsbUJBQW1CLFNBQzNCLFdBQVcsR0FDWCxPQUFPLENBQ04sYUFDQSxDQUFDLElBQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxXQUFXO0FBRTdCO0FBRUE7Ozs7O0NBS0MsR0FDRCxPQUFPLFNBQVMsVUFDZCxLQUFlLEVBQ2YsSUFBWTtFQUVaLE1BQU8sSUFBSSxDQUFDLEVBQUUsS0FBSyxJQUFLO0lBQ3RCLE9BQU8sS0FBSyxLQUFLLENBQUM7RUFDcEI7RUFFQSxLQUFLLE1BQU0sUUFBUSxNQUFPO0lBQ3hCLElBQUksU0FBUyxNQUFNLE9BQU87TUFDeEIsT0FBTztJQUNUO0VBQ0Y7RUFFQTtBQUNGO0FBRUEsT0FBTyxTQUFTLGlCQUNkLE1BQWMsRUFDZCxPQUEyQjtFQUUzQixNQUFNLGNBQWMsUUFDakIsR0FBRyxDQUFDLENBQUMsU0FBVztNQUFDLE9BQU8sSUFBSTtTQUFNLE9BQU8sT0FBTyxJQUFJLEVBQUU7S0FBRSxFQUN4RCxJQUFJLEdBQ0osR0FBRyxDQUFDLENBQUMsU0FBVyxRQUFRO0VBQzNCLE9BQU8sV0FBVyx3QkFBd0IsUUFBUSxTQUFTO0FBQzdEO0FBRUEsT0FBTyxTQUFTLGVBQWUsSUFBWSxFQUFFLEtBQW9CO0VBQy9ELE9BQU8sV0FBVyxzQkFBc0IsTUFBTTtBQUNoRDtBQUVBLE9BQU8sU0FBUyxXQUNkLE9BQWUsRUFDZixJQUFZLEVBQ1osS0FBb0I7RUFFcEIsTUFBTSxRQUE0QixRQUFRLE1BQU07RUFDaEQsT0FBTyxRQUFRLENBQUMsRUFBRSxRQUFRLEVBQUUsRUFBRSxNQUFNLEVBQUUsQ0FBQyxHQUFHO0FBQzVDO0FBRUEsT0FBTyxTQUFTLFFBQVEsSUFBWTtFQUNsQyxJQUFJLEtBQUssVUFBVSxDQUFDLE1BQU07SUFDeEIsT0FBTztFQUNUO0VBQ0EsSUFBSSxLQUFLLE1BQU0sR0FBRyxHQUFHO0lBQ25CLE9BQU8sQ0FBQyxFQUFFLEVBQUUsS0FBSyxDQUFDO0VBQ3BCO0VBQ0EsT0FBTyxDQUFDLENBQUMsRUFBRSxLQUFLLENBQUM7QUFDbkI7QUFFQTs7Ozs7Q0FLQyxHQUNELFNBQVMsU0FBUyxNQUFtQixFQUFFLElBQVk7RUFDakQsT0FBTyxPQUFPLElBQUksS0FBSyxRQUNwQixPQUFPLE9BQU8sSUFBSSxPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDO0FBQ3pEO0FBRUEsT0FBTyxTQUFTLHFCQUNkLElBQVksRUFDWixLQUF5QjtFQUV6QixLQUFLLE1BQU0sVUFBVSxNQUFPO0lBQzFCLElBQUksT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxHQUFHO01BQ25DO0lBQ0Y7SUFDQSxJQUFJLFVBQVUsb0JBQW9CLE1BQU07SUFDeEMsSUFBSSxTQUFTO01BQ1gsVUFBVTtRQUFFLEdBQUcsT0FBTztRQUFFO01BQUs7TUFDN0IsTUFBTSxJQUFJLENBQUM7TUFDWCxPQUFPO0lBQ1Q7RUFDRjtBQUNGO0FBRUEsU0FBUyxvQkFDUCxJQUFZLEVBQ1osTUFBbUI7RUFFbkIsTUFBTSxRQUFRLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQztFQUNoQyxNQUFNLFNBQVMsS0FBSyxLQUFLLENBQUM7RUFDMUIsSUFBSSxNQUFNLE1BQU0sS0FBSyxPQUFPLE1BQU0sRUFBRTtJQUNsQyxPQUFPO0VBQ1Q7RUFDQSxNQUFNLFFBQVEsS0FBSyxHQUFHLENBQUMsTUFBTSxNQUFNLEVBQUUsT0FBTyxNQUFNO0VBQ2xELElBQUssSUFBSSxJQUFJLEdBQUcsSUFBSSxPQUFPLElBQUs7SUFDOUIsSUFBSSxLQUFLLENBQUMsRUFBRSxLQUFLLE1BQU0sQ0FBQyxFQUFFLElBQUksS0FBSyxDQUFDLEVBQUUsS0FBSyxLQUFLO01BQzlDLE9BQU87SUFDVDtFQUNGO0VBQ0EsT0FBTztBQUNUO0FBRUEsU0FBUyxRQUFRLEdBQVcsRUFBRSxHQUFhO0VBQ3pDLElBQUksY0FBYztFQUNsQixJQUFJLFdBQVc7RUFDZixJQUFLLElBQUksSUFBSSxHQUFHLElBQUksSUFBSSxNQUFNLEVBQUUsSUFBSztJQUNuQyxNQUFNLE9BQU8sU0FBUyxLQUFLLEdBQUcsQ0FBQyxFQUFFO0lBQ2pDLElBQUksT0FBTyxhQUFhO01BQ3RCLGNBQWM7TUFDZCxXQUFXO0lBQ2I7RUFDRjtFQUNBLE9BQU8sR0FBRyxDQUFDLFNBQVM7QUFDdEI7QUFFQSxPQUFPLFNBQVMsZ0JBQWdCLE1BQW1CO0VBQ2pELE9BQU8sT0FBTyxPQUFPLE9BQU8sS0FBSyxhQUM3QixPQUFPLE9BQU8sS0FDZCxPQUFPLE9BQU87QUFDcEIifQ==