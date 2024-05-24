import analyze from "./js.ts";
export default function tokenize(source) {
  const tokens = [];
  let type = "string";
  let position = 0;
  try {
    while(source.length > 0){
      if (type === "string") {
        const index = source.indexOf("{{");
        const code = index === -1 ? source : source.slice(0, index);
        tokens.push([
          type,
          code,
          position
        ]);
        if (index === -1) {
          break;
        }
        position += index;
        source = source.slice(index);
        type = source.startsWith("{{#") ? "comment" : "tag";
        continue;
      }
      if (type === "comment") {
        source = source.slice(3);
        const index = source.indexOf("#}}");
        const comment = index === -1 ? source : source.slice(0, index);
        tokens.push([
          type,
          comment,
          position
        ]);
        if (index === -1) {
          break;
        }
        position += index + 3;
        source = source.slice(index + 3);
        type = "string";
        continue;
      }
      if (type === "tag") {
        const indexes = parseTag(source);
        const lastIndex = indexes.length - 1;
        let tag;
        indexes.reduce((prev, curr, index)=>{
          const code = source.slice(prev, curr - 2);
          // Tag
          if (index === 1) {
            tag = [
              type,
              code,
              position
            ];
            tokens.push(tag);
            return curr;
          }
          // Filters
          tokens.push([
            "filter",
            code
          ]);
          return curr;
        });
        position += indexes[lastIndex];
        source = source.slice(indexes[lastIndex]);
        type = "string";
        // Search the closing echo tag {{ /echo }}
        if (tag?.[1].match(/^\-?\s*echo\s*\-?$/)) {
          const end = source.match(/{{\-?\s*\/echo\s*\-?}}/);
          if (!end) {
            throw new Error("Unclosed echo tag");
          }
          const rawCode = source.slice(0, end.index);
          tag[1] = `echo ${JSON.stringify(rawCode)}`;
          const length = Number(end.index) + end[0].length;
          source = source.slice(length);
          position += length;
        }
        continue;
      }
    }
  } catch (error) {
    return {
      tokens,
      position,
      error
    };
  }
  return {
    tokens,
    position,
    error: undefined
  };
}
/**
 * Parse a tag and return the indexes of the start and end brackets, and the filters between.
 * For example: {{ tag |> filter1 |> filter2 }} => [2, 9, 20, 31]
 */ export function parseTag(source) {
  const indexes = [
    2
  ];
  analyze(source, (type, index)=>{
    if (type === "close") {
      indexes.push(index);
      return false;
    }
    if (type === "new-filter") {
      indexes.push(index);
    } else if (type === "unclosed") {
      throw new Error("Unclosed tag");
    }
  });
  return indexes;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvdmVudG9AdjAuMTIuNS9zcmMvdG9rZW5pemVyLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBhbmFseXplIGZyb20gXCIuL2pzLnRzXCI7XG5cbmV4cG9ydCB0eXBlIFRva2VuVHlwZSA9IFwic3RyaW5nXCIgfCBcInRhZ1wiIHwgXCJmaWx0ZXJcIiB8IFwiY29tbWVudFwiO1xuZXhwb3J0IHR5cGUgVG9rZW4gPSBbVG9rZW5UeXBlLCBzdHJpbmcsIG51bWJlcj9dO1xuXG5leHBvcnQgaW50ZXJmYWNlIFRva2VuaXplUmVzdWx0IHtcbiAgdG9rZW5zOiBUb2tlbltdO1xuICBwb3NpdGlvbjogbnVtYmVyO1xuICBlcnJvcjogRXJyb3IgfCB1bmRlZmluZWQ7XG59XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIHRva2VuaXplKHNvdXJjZTogc3RyaW5nKTogVG9rZW5pemVSZXN1bHQge1xuICBjb25zdCB0b2tlbnM6IFRva2VuW10gPSBbXTtcbiAgbGV0IHR5cGU6IFRva2VuVHlwZSA9IFwic3RyaW5nXCI7XG4gIGxldCBwb3NpdGlvbiA9IDA7XG5cbiAgdHJ5IHtcbiAgICB3aGlsZSAoc291cmNlLmxlbmd0aCA+IDApIHtcbiAgICAgIGlmICh0eXBlID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgIGNvbnN0IGluZGV4ID0gc291cmNlLmluZGV4T2YoXCJ7e1wiKTtcbiAgICAgICAgY29uc3QgY29kZSA9IGluZGV4ID09PSAtMSA/IHNvdXJjZSA6IHNvdXJjZS5zbGljZSgwLCBpbmRleCk7XG5cbiAgICAgICAgdG9rZW5zLnB1c2goW3R5cGUsIGNvZGUsIHBvc2l0aW9uXSk7XG5cbiAgICAgICAgaWYgKGluZGV4ID09PSAtMSkge1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG5cbiAgICAgICAgcG9zaXRpb24gKz0gaW5kZXg7XG4gICAgICAgIHNvdXJjZSA9IHNvdXJjZS5zbGljZShpbmRleCk7XG4gICAgICAgIHR5cGUgPSBzb3VyY2Uuc3RhcnRzV2l0aChcInt7I1wiKSA/IFwiY29tbWVudFwiIDogXCJ0YWdcIjtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIGlmICh0eXBlID09PSBcImNvbW1lbnRcIikge1xuICAgICAgICBzb3VyY2UgPSBzb3VyY2Uuc2xpY2UoMyk7XG4gICAgICAgIGNvbnN0IGluZGV4ID0gc291cmNlLmluZGV4T2YoXCIjfX1cIik7XG4gICAgICAgIGNvbnN0IGNvbW1lbnQgPSBpbmRleCA9PT0gLTEgPyBzb3VyY2UgOiBzb3VyY2Uuc2xpY2UoMCwgaW5kZXgpO1xuICAgICAgICB0b2tlbnMucHVzaChbdHlwZSwgY29tbWVudCwgcG9zaXRpb25dKTtcblxuICAgICAgICBpZiAoaW5kZXggPT09IC0xKSB7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cblxuICAgICAgICBwb3NpdGlvbiArPSBpbmRleCArIDM7XG4gICAgICAgIHNvdXJjZSA9IHNvdXJjZS5zbGljZShpbmRleCArIDMpO1xuICAgICAgICB0eXBlID0gXCJzdHJpbmdcIjtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIGlmICh0eXBlID09PSBcInRhZ1wiKSB7XG4gICAgICAgIGNvbnN0IGluZGV4ZXMgPSBwYXJzZVRhZyhzb3VyY2UpO1xuICAgICAgICBjb25zdCBsYXN0SW5kZXggPSBpbmRleGVzLmxlbmd0aCAtIDE7XG4gICAgICAgIGxldCB0YWc6IFRva2VuIHwgdW5kZWZpbmVkO1xuXG4gICAgICAgIGluZGV4ZXMucmVkdWNlKChwcmV2LCBjdXJyLCBpbmRleCkgPT4ge1xuICAgICAgICAgIGNvbnN0IGNvZGUgPSBzb3VyY2Uuc2xpY2UocHJldiwgY3VyciAtIDIpO1xuXG4gICAgICAgICAgLy8gVGFnXG4gICAgICAgICAgaWYgKGluZGV4ID09PSAxKSB7XG4gICAgICAgICAgICB0YWcgPSBbdHlwZSwgY29kZSwgcG9zaXRpb25dO1xuICAgICAgICAgICAgdG9rZW5zLnB1c2godGFnKTtcbiAgICAgICAgICAgIHJldHVybiBjdXJyO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIEZpbHRlcnNcbiAgICAgICAgICB0b2tlbnMucHVzaChbXCJmaWx0ZXJcIiwgY29kZV0pO1xuICAgICAgICAgIHJldHVybiBjdXJyO1xuICAgICAgICB9KTtcblxuICAgICAgICBwb3NpdGlvbiArPSBpbmRleGVzW2xhc3RJbmRleF07XG4gICAgICAgIHNvdXJjZSA9IHNvdXJjZS5zbGljZShpbmRleGVzW2xhc3RJbmRleF0pO1xuICAgICAgICB0eXBlID0gXCJzdHJpbmdcIjtcblxuICAgICAgICAvLyBTZWFyY2ggdGhlIGNsb3NpbmcgZWNobyB0YWcge3sgL2VjaG8gfX1cbiAgICAgICAgaWYgKHRhZz8uWzFdLm1hdGNoKC9eXFwtP1xccyplY2hvXFxzKlxcLT8kLykpIHtcbiAgICAgICAgICBjb25zdCBlbmQgPSBzb3VyY2UubWF0Y2goL3t7XFwtP1xccypcXC9lY2hvXFxzKlxcLT99fS8pO1xuXG4gICAgICAgICAgaWYgKCFlbmQpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIlVuY2xvc2VkIGVjaG8gdGFnXCIpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGNvbnN0IHJhd0NvZGUgPSBzb3VyY2Uuc2xpY2UoMCwgZW5kLmluZGV4KTtcbiAgICAgICAgICB0YWdbMV0gPSBgZWNobyAke0pTT04uc3RyaW5naWZ5KHJhd0NvZGUpfWA7XG4gICAgICAgICAgY29uc3QgbGVuZ3RoID0gTnVtYmVyKGVuZC5pbmRleCkgKyBlbmRbMF0ubGVuZ3RoO1xuICAgICAgICAgIHNvdXJjZSA9IHNvdXJjZS5zbGljZShsZW5ndGgpO1xuICAgICAgICAgIHBvc2l0aW9uICs9IGxlbmd0aDtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgIH1cbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICByZXR1cm4geyB0b2tlbnMsIHBvc2l0aW9uLCBlcnJvciB9O1xuICB9XG5cbiAgcmV0dXJuIHsgdG9rZW5zLCBwb3NpdGlvbiwgZXJyb3I6IHVuZGVmaW5lZCB9O1xufVxuXG50eXBlIHN0YXR1cyA9XG4gIHwgXCJzaW5nbGUtcXVvdGVcIlxuICB8IFwiZG91YmxlLXF1b3RlXCJcbiAgfCBcInJlZ2V4XCJcbiAgfCBcImxpdGVyYWxcIlxuICB8IFwiYnJhY2tldFwiXG4gIHwgXCJjb21tZW50XCJcbiAgfCBcImxpbmUtY29tbWVudFwiO1xuXG4vKipcbiAqIFBhcnNlIGEgdGFnIGFuZCByZXR1cm4gdGhlIGluZGV4ZXMgb2YgdGhlIHN0YXJ0IGFuZCBlbmQgYnJhY2tldHMsIGFuZCB0aGUgZmlsdGVycyBiZXR3ZWVuLlxuICogRm9yIGV4YW1wbGU6IHt7IHRhZyB8PiBmaWx0ZXIxIHw+IGZpbHRlcjIgfX0gPT4gWzIsIDksIDIwLCAzMV1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlVGFnKHNvdXJjZTogc3RyaW5nKTogbnVtYmVyW10ge1xuICBjb25zdCBpbmRleGVzOiBudW1iZXJbXSA9IFsyXTtcblxuICBhbmFseXplKHNvdXJjZSwgKHR5cGUsIGluZGV4KSA9PiB7XG4gICAgaWYgKHR5cGUgPT09IFwiY2xvc2VcIikge1xuICAgICAgaW5kZXhlcy5wdXNoKGluZGV4KTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBpZiAodHlwZSA9PT0gXCJuZXctZmlsdGVyXCIpIHtcbiAgICAgIGluZGV4ZXMucHVzaChpbmRleCk7XG4gICAgfSBlbHNlIGlmICh0eXBlID09PSBcInVuY2xvc2VkXCIpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIlVuY2xvc2VkIHRhZ1wiKTtcbiAgICB9XG4gIH0pO1xuXG4gIHJldHVybiBpbmRleGVzO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sYUFBYSxVQUFVO0FBVzlCLGVBQWUsU0FBUyxTQUFTLE1BQWM7RUFDN0MsTUFBTSxTQUFrQixFQUFFO0VBQzFCLElB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