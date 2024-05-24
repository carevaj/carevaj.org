const envVars = new Map();
export function setEnv(name, value) {
  // Deno Deploy doesn't support permissions.requestSync
  // https://github.com/denoland/deploy_feedback/issues/527
  if (Deno.permissions.querySync?.({
    name: "env"
  }).state === "granted") {
    Deno.env.set(name, value);
  } else {
    envVars.set(name, value);
  }
}
export function env(name) {
  if (envVars.has(name)) {
    return envVars.get(name);
  }
  // Deno Deploy doesn't support permissions.requestSync
  // https://github.com/denoland/deploy_feedback/issues/527
  const allowed = !Deno.permissions.requestSync || Deno.permissions.requestSync({
    name: "env"
  }).state === "granted";
  if (!allowed) {
    return undefined;
  }
  const value = envVars.has(name) ? envVars.get(name) : Deno.env.get(name);
  if (typeof value === "undefined") {
    return undefined;
  }
  switch(value.toLowerCase()){
    case "true":
    case "on":
    case "1":
      return true;
    case "false":
    case "off":
    case "0":
      return false;
    default:
      return value;
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvbHVtZUB2Mi4yLjAvY29yZS91dGlscy9lbnYudHMiXSwic291cmNlc0NvbnRlbnQiOlsiY29uc3QgZW52VmFycyA9IG5ldyBNYXA8c3RyaW5nLCBzdHJpbmc+KCk7XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXRFbnYobmFtZTogc3RyaW5nLCB2YWx1ZTogc3RyaW5nKSB7XG4gIC8vIERlbm8gRGVwbG95IGRvZXNuJ3Qgc3VwcG9ydCBwZXJtaXNzaW9ucy5yZXF1ZXN0U3luY1xuICAvLyBodHRwczovL2dpdGh1Yi5jb20vZGVub2xhbmQvZGVwbG95X2ZlZWRiYWNrL2lzc3Vlcy81MjdcbiAgaWYgKERlbm8ucGVybWlzc2lvbnMucXVlcnlTeW5jPy4oeyBuYW1lOiBcImVudlwiIH0pLnN0YXRlID09PSBcImdyYW50ZWRcIikge1xuICAgIERlbm8uZW52LnNldChuYW1lLCB2YWx1ZSk7XG4gIH0gZWxzZSB7XG4gICAgZW52VmFycy5zZXQobmFtZSwgdmFsdWUpO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBlbnY8VD4obmFtZTogc3RyaW5nKTogVCB8IHVuZGVmaW5lZCB7XG4gIGlmIChlbnZWYXJzLmhhcyhuYW1lKSkge1xuICAgIHJldHVybiBlbnZWYXJzLmdldChuYW1lKSBhcyBUO1xuICB9XG5cbiAgLy8gRGVubyBEZXBsb3kgZG9lc24ndCBzdXBwb3J0IHBlcm1pc3Npb25zLnJlcXVlc3RTeW5jXG4gIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9kZW5vbGFuZC9kZXBsb3lfZmVlZGJhY2svaXNzdWVzLzUyN1xuICBjb25zdCBhbGxvd2VkID0gIURlbm8ucGVybWlzc2lvbnMucmVxdWVzdFN5bmMgfHxcbiAgICBEZW5vLnBlcm1pc3Npb25zLnJlcXVlc3RTeW5jKHsgbmFtZTogXCJlbnZcIiB9KS5zdGF0ZSA9PT0gXCJncmFudGVkXCI7XG5cbiAgaWYgKCFhbGxvd2VkKSB7XG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxuXG4gIGNvbnN0IHZhbHVlID0gZW52VmFycy5oYXMobmFtZSkgPyBlbnZWYXJzLmdldChuYW1lKSA6IERlbm8uZW52LmdldChuYW1lKTtcblxuICBpZiAodHlwZW9mIHZhbHVlID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxuXG4gIHN3aXRjaCAodmFsdWUudG9Mb3dlckNhc2UoKSkge1xuICAgIGNhc2UgXCJ0cnVlXCI6XG4gICAgY2FzZSBcIm9uXCI6XG4gICAgY2FzZSBcIjFcIjpcbiAgICAgIHJldHVybiB0cnVlIGFzIFQ7XG5cbiAgICBjYXNlIFwiZmFsc2VcIjpcbiAgICBjYXNlIFwib2ZmXCI6XG4gICAgY2FzZSBcIjBcIjpcbiAgICAgIHJldHVybiBmYWxzZSBhcyBUO1xuXG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiB2YWx1ZSBhcyBUO1xuICB9XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsTUFBTSxVQUFVLElBQUk7QUFFcEIsT0FBTyxTQUFTLE9BQU8sSUFBWSxFQUFFLEtBQWE7RUFDaEQsc0RBQXNEO0VBQ3RELHlEQUF5RDtFQUN6RCxJQUFJLEtBQUssV0FBVyxDQUFDLFNBQVMsR0FBRztJQUFFLE1BQU07RUFBTSxHQUFHLFVBQVUsV0FBVztJQUNyRSxLQUFLLEdBQUcsQ0FBQyxHQUFHLENBQUMsTUFBTTtFQUNyQixPQUFPO0lBQ0wsUUFBUSxHQUFHLENBQUMsTUFBTTtFQUNwQjtBQUNGO0FBRUEsT0FBTyxTQUFTLElBQU8sSUFBWTtFQUNqQyxJQUFJLFFBQVEsR0FBRyxDQUFDLE9BQU87SUFDckIsT0FBTyxRQUFRLEdBQUcsQ0FBQztFQUNyQjtFQUVBLHNEQUFzRDtFQUN0RCx5REFBeUQ7RUFDekQsTUFBTSxVQUFVLENBQUMsS0FBSyxXQUFXLENBQUMsV0FBVyxJQUMzQyxLQUFLLFdBQVcsQ0FBQyxXQUFXLENBQUM7SUFBRSxNQUFNO0VBQU0sR0FBRyxLQUFLLEtBQUs7RUFFMUQsSUFBSSxDQUFDLFNBQVM7SUFDWixPQUFPO0VBQ1Q7RUFFQSxNQUFNLFFBQVEsUUFBUSxHQUFHLENBQUMsUUFBUSxRQUFRLEdBQUcsQ0FBQyxRQUFRLEtBQUssR0FBRyxDQUFDLEdBQUcsQ0FBQztFQUVuRSxJQUFJLE9BQU8sVUFBVSxhQUFhO0lBQ2hDLE9BQU87RUFDVDtFQUVBLE9BQVEsTUFBTSxXQUFXO0lBQ3ZCLEtBQUs7SUFDTCxLQUFLO0lBQ0wsS0FBSztNQUNILE9BQU87SUFFVCxLQUFLO0lBQ0wsS0FBSztJQUNMLEtBQUs7TUFDSCxPQUFPO0lBRVQ7TUFDRSxPQUFPO0VBQ1g7QUFDRiJ9