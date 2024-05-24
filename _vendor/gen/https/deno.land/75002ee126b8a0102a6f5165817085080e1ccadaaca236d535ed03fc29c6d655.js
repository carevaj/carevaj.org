export default function analyze(source, visitor) {
  const length = source.length;
  const statuses = [];
  let index = 0;
  while(index < length){
    const char = source.charAt(index++);
    switch(char){
      // Detect start brackets
      case "{":
        {
          const status = statuses[0];
          if (status === "literal" && source.charAt(index - 2) === "$") {
            statuses.unshift("bracket");
          } else if (status !== "comment" && status !== "single-quote" && status !== "double-quote" && status !== "literal" && status !== "regex" && status !== "line-comment") {
            if (statuses.length === 0 && visitor("open-bracket", index) === false) {
              return;
            }
            statuses.unshift("bracket");
          }
          break;
        }
      // Detect end brackets
      case "}":
        {
          const status = statuses[0];
          if (status === "bracket") {
            statuses.shift();
            if (statuses.length === 0 && visitor("close", index) === false) {
              return;
            }
          }
          break;
        }
      // Detect double quotes
      case '"':
        {
          const status = statuses[0];
          if (status === "double-quote") {
            statuses.shift();
          } else if (status !== "comment" && status !== "single-quote" && status !== "literal" && status !== "regex" && status !== "line-comment") {
            statuses.unshift("double-quote");
          }
          break;
        }
      // Detect single quotes
      case "'":
        {
          const status = statuses[0];
          if (status === "single-quote") {
            statuses.shift();
          } else if (status !== "comment" && status !== "double-quote" && status !== "literal" && status !== "regex" && status !== "line-comment") {
            statuses.unshift("single-quote");
          }
          break;
        }
      // Detect literals
      case "`":
        {
          const status = statuses[0];
          if (status === "literal") {
            statuses.shift();
          } else if (status !== "comment" && status !== "double-quote" && status !== "single-quote" && status !== "regex" && status !== "line-comment") {
            statuses.unshift("literal");
          }
          break;
        }
      // Detect comments and regex
      case "/":
        {
          const status = statuses[0];
          if (status === "single-quote" || status === "double-quote" || status === "literal" || status === "line-comment") {
            break;
          }
          // We are in a comment: close or ignore
          if (status === "comment") {
            if (source.charAt(index - 2) === "*") {
              statuses.shift();
            }
            break;
          }
          // We are in a regex: close or ignore
          if (status === "regex") {
            if (source.charAt(index - 2) !== "\\") {
              statuses.shift();
            }
            break;
          }
          // Start a new comment
          if (source.charAt(index) === "*") {
            statuses.unshift("comment");
            break;
          }
          // Start a new line comment
          if (source.charAt(index - 2) === "/") {
            statuses.unshift("line-comment");
            break;
          }
          // Start a new regex
          const prev = prevChar(source, index - 1);
          if (prev === "(" || prev === "=" || prev === ":" || prev === ",") {
            statuses.unshift("regex");
          }
          break;
        }
      // Detect end of line comments
      case "\n":
        {
          const status = statuses[0];
          if (status === "line-comment") {
            statuses.shift();
          }
          break;
        }
      // Detect filters
      case "|":
        {
          const status = statuses[0];
          if (status === "bracket" && source.charAt(index) === ">" && visitor("new-filter", index + 1) === false) {
            return;
          }
          break;
        }
    }
  }
  if (statuses.length > 0) {
    visitor("unclosed", index);
  }
}
// Get the previous character in a string ignoring spaces, line breaks and tabs
function prevChar(source, index) {
  while(index > 0){
    const char = source.charAt(--index);
    if (char !== " " && char !== "\n" && char !== "\r" && char !== "\t") {
      return char;
    }
  }
  return "";
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvdmVudG9AdjAuMTIuNS9zcmMvanMudHMiXSwic291cmNlc0NvbnRlbnQiOlsidHlwZSBicmVha3BvaW50cyA9XG4gIHwgXCJuZXctZmlsdGVyXCJcbiAgfCBcIm9wZW4tYnJhY2tldFwiXG4gIHwgXCJjbG9zZVwiXG4gIHwgXCJ1bmNsb3NlZFwiO1xuXG50eXBlIHN0YXR1cyA9XG4gIHwgXCJzaW5nbGUtcXVvdGVcIlxuICB8IFwiZG91YmxlLXF1b3RlXCJcbiAgfCBcInJlZ2V4XCJcbiAgfCBcImxpdGVyYWxcIlxuICB8IFwiYnJhY2tldFwiXG4gIHwgXCJjb21tZW50XCJcbiAgfCBcImxpbmUtY29tbWVudFwiO1xuXG50eXBlIFZpc2l0b3IgPSAodHlwZTogYnJlYWtwb2ludHMsIGluZGV4OiBudW1iZXIpID0+IGZhbHNlIHwgdm9pZDtcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gYW5hbHl6ZShzb3VyY2U6IHN0cmluZywgdmlzaXRvcjogVmlzaXRvcikge1xuICBjb25zdCBsZW5ndGggPSBzb3VyY2UubGVuZ3RoO1xuICBjb25zdCBzdGF0dXNlczogc3RhdHVzW10gPSBbXTtcbiAgbGV0IGluZGV4ID0gMDtcblxuICB3aGlsZSAoaW5kZXggPCBsZW5ndGgpIHtcbiAgICBjb25zdCBjaGFyID0gc291cmNlLmNoYXJBdChpbmRleCsrKTtcblxuICAgIHN3aXRjaCAoY2hhcikge1xuICAgICAgLy8gRGV0ZWN0IHN0YXJ0IGJyYWNrZXRzXG4gICAgICBjYXNlIFwie1wiOiB7XG4gICAgICAgIGNvbnN0IHN0YXR1cyA9IHN0YXR1c2VzWzBdO1xuXG4gICAgICAgIGlmIChzdGF0dXMgPT09IFwibGl0ZXJhbFwiICYmIHNvdXJjZS5jaGFyQXQoaW5kZXggLSAyKSA9PT0gXCIkXCIpIHtcbiAgICAgICAgICBzdGF0dXNlcy51bnNoaWZ0KFwiYnJhY2tldFwiKTtcbiAgICAgICAgfSBlbHNlIGlmIChcbiAgICAgICAgICBzdGF0dXMgIT09IFwiY29tbWVudFwiICYmIHN0YXR1cyAhPT0gXCJzaW5nbGUtcXVvdGVcIiAmJlxuICAgICAgICAgIHN0YXR1cyAhPT0gXCJkb3VibGUtcXVvdGVcIiAmJiBzdGF0dXMgIT09IFwibGl0ZXJhbFwiICYmXG4gICAgICAgICAgc3RhdHVzICE9PSBcInJlZ2V4XCIgJiYgc3RhdHVzICE9PSBcImxpbmUtY29tbWVudFwiXG4gICAgICAgICkge1xuICAgICAgICAgIGlmIChcbiAgICAgICAgICAgIHN0YXR1c2VzLmxlbmd0aCA9PT0gMCAmJiB2aXNpdG9yKFwib3Blbi1icmFja2V0XCIsIGluZGV4KSA9PT0gZmFsc2VcbiAgICAgICAgICApIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgICAgc3RhdHVzZXMudW5zaGlmdChcImJyYWNrZXRcIik7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG5cbiAgICAgIC8vIERldGVjdCBlbmQgYnJhY2tldHNcbiAgICAgIGNhc2UgXCJ9XCI6IHtcbiAgICAgICAgY29uc3Qgc3RhdHVzID0gc3RhdHVzZXNbMF07XG5cbiAgICAgICAgaWYgKHN0YXR1cyA9PT0gXCJicmFja2V0XCIpIHtcbiAgICAgICAgICBzdGF0dXNlcy5zaGlmdCgpO1xuXG4gICAgICAgICAgaWYgKHN0YXR1c2VzLmxlbmd0aCA9PT0gMCAmJiB2aXNpdG9yKFwiY2xvc2VcIiwgaW5kZXgpID09PSBmYWxzZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIH1cblxuICAgICAgLy8gRGV0ZWN0IGRvdWJsZSBxdW90ZXNcbiAgICAgIGNhc2UgJ1wiJzoge1xuICAgICAgICBjb25zdCBzdGF0dXMgPSBzdGF0dXNlc1swXTtcbiAgICAgICAgaWYgKHN0YXR1cyA9PT0gXCJkb3VibGUtcXVvdGVcIikge1xuICAgICAgICAgIHN0YXR1c2VzLnNoaWZ0KCk7XG4gICAgICAgIH0gZWxzZSBpZiAoXG4gICAgICAgICAgc3RhdHVzICE9PSBcImNvbW1lbnRcIiAmJlxuICAgICAgICAgIHN0YXR1cyAhPT0gXCJzaW5nbGUtcXVvdGVcIiAmJlxuICAgICAgICAgIHN0YXR1cyAhPT0gXCJsaXRlcmFsXCIgJiZcbiAgICAgICAgICBzdGF0dXMgIT09IFwicmVnZXhcIiAmJlxuICAgICAgICAgIHN0YXR1cyAhPT0gXCJsaW5lLWNvbW1lbnRcIlxuICAgICAgICApIHtcbiAgICAgICAgICBzdGF0dXNlcy51bnNoaWZ0KFwiZG91YmxlLXF1b3RlXCIpO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuXG4gICAgICAvLyBEZXRlY3Qgc2luZ2xlIHF1b3Rlc1xuICAgICAgY2FzZSBcIidcIjoge1xuICAgICAgICBjb25zdCBzdGF0dXMgPSBzdGF0dXNlc1swXTtcbiAgICAgICAgaWYgKHN0YXR1cyA9PT0gXCJzaW5nbGUtcXVvdGVcIikge1xuICAgICAgICAgIHN0YXR1c2VzLnNoaWZ0KCk7XG4gICAgICAgIH0gZWxzZSBpZiAoXG4gICAgICAgICAgc3RhdHVzICE9PSBcImNvbW1lbnRcIiAmJlxuICAgICAgICAgIHN0YXR1cyAhPT0gXCJkb3VibGUtcXVvdGVcIiAmJlxuICAgICAgICAgIHN0YXR1cyAhPT0gXCJsaXRlcmFsXCIgJiZcbiAgICAgICAgICBzdGF0dXMgIT09IFwicmVnZXhcIiAmJlxuICAgICAgICAgIHN0YXR1cyAhPT0gXCJsaW5lLWNvbW1lbnRcIlxuICAgICAgICApIHtcbiAgICAgICAgICBzdGF0dXNlcy51bnNoaWZ0KFwic2luZ2xlLXF1b3RlXCIpO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuXG4gICAgICAvLyBEZXRlY3QgbGl0ZXJhbHNcbiAgICAgIGNhc2UgXCJgXCI6IHtcbiAgICAgICAgY29uc3Qgc3RhdHVzID0gc3RhdHVzZXNbMF07XG4gICAgICAgIGlmIChzdGF0dXMgPT09IFwibGl0ZXJhbFwiKSB7XG4gICAgICAgICAgc3RhdHVzZXMuc2hpZnQoKTtcbiAgICAgICAgfSBlbHNlIGlmIChcbiAgICAgICAgICBzdGF0dXMgIT09IFwiY29tbWVudFwiICYmXG4gICAgICAgICAgc3RhdHVzICE9PSBcImRvdWJsZS1xdW90ZVwiICYmXG4gICAgICAgICAgc3RhdHVzICE9PSBcInNpbmdsZS1xdW90ZVwiICYmXG4gICAgICAgICAgc3RhdHVzICE9PSBcInJlZ2V4XCIgJiZcbiAgICAgICAgICBzdGF0dXMgIT09IFwibGluZS1jb21tZW50XCJcbiAgICAgICAgKSB7XG4gICAgICAgICAgc3RhdHVzZXMudW5zaGlmdChcImxpdGVyYWxcIik7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG5cbiAgICAgIC8vIERldGVjdCBjb21tZW50cyBhbmQgcmVnZXhcbiAgICAgIGNhc2UgXCIvXCI6IHtcbiAgICAgICAgY29uc3Qgc3RhdHVzID0gc3RhdHVzZXNbMF07XG4gICAgICAgIGlmIChcbiAgICAgICAgICBzdGF0dXMgPT09IFwic2luZ2xlLXF1b3RlXCIgfHwgc3RhdHVzID09PSBcImRvdWJsZS1xdW90ZVwiIHx8XG4gICAgICAgICAgc3RhdHVzID09PSBcImxpdGVyYWxcIiB8fCBzdGF0dXMgPT09IFwibGluZS1jb21tZW50XCJcbiAgICAgICAgKSB7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBXZSBhcmUgaW4gYSBjb21tZW50OiBjbG9zZSBvciBpZ25vcmVcbiAgICAgICAgaWYgKHN0YXR1cyA9PT0gXCJjb21tZW50XCIpIHtcbiAgICAgICAgICBpZiAoc291cmNlLmNoYXJBdChpbmRleCAtIDIpID09PSBcIipcIikge1xuICAgICAgICAgICAgc3RhdHVzZXMuc2hpZnQoKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBXZSBhcmUgaW4gYSByZWdleDogY2xvc2Ugb3IgaWdub3JlXG4gICAgICAgIGlmIChzdGF0dXMgPT09IFwicmVnZXhcIikge1xuICAgICAgICAgIGlmIChzb3VyY2UuY2hhckF0KGluZGV4IC0gMikgIT09IFwiXFxcXFwiKSB7XG4gICAgICAgICAgICBzdGF0dXNlcy5zaGlmdCgpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFN0YXJ0IGEgbmV3IGNvbW1lbnRcbiAgICAgICAgaWYgKHNvdXJjZS5jaGFyQXQoaW5kZXgpID09PSBcIipcIikge1xuICAgICAgICAgIHN0YXR1c2VzLnVuc2hpZnQoXCJjb21tZW50XCIpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gU3RhcnQgYSBuZXcgbGluZSBjb21tZW50XG4gICAgICAgIGlmIChzb3VyY2UuY2hhckF0KGluZGV4IC0gMikgPT09IFwiL1wiKSB7XG4gICAgICAgICAgc3RhdHVzZXMudW5zaGlmdChcImxpbmUtY29tbWVudFwiKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFN0YXJ0IGEgbmV3IHJlZ2V4XG4gICAgICAgIGNvbnN0IHByZXYgPSBwcmV2Q2hhcihzb3VyY2UsIGluZGV4IC0gMSk7XG4gICAgICAgIGlmIChwcmV2ID09PSBcIihcIiB8fCBwcmV2ID09PSBcIj1cIiB8fCBwcmV2ID09PSBcIjpcIiB8fCBwcmV2ID09PSBcIixcIikge1xuICAgICAgICAgIHN0YXR1c2VzLnVuc2hpZnQoXCJyZWdleFwiKTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIH1cblxuICAgICAgLy8gRGV0ZWN0IGVuZCBvZiBsaW5lIGNvbW1lbnRzXG4gICAgICBjYXNlIFwiXFxuXCI6IHtcbiAgICAgICAgY29uc3Qgc3RhdHVzID0gc3RhdHVzZXNbMF07XG4gICAgICAgIGlmIChzdGF0dXMgPT09IFwibGluZS1jb21tZW50XCIpIHtcbiAgICAgICAgICBzdGF0dXNlcy5zaGlmdCgpO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuXG4gICAgICAvLyBEZXRlY3QgZmlsdGVyc1xuICAgICAgY2FzZSBcInxcIjoge1xuICAgICAgICBjb25zdCBzdGF0dXMgPSBzdGF0dXNlc1swXTtcbiAgICAgICAgaWYgKFxuICAgICAgICAgIHN0YXR1cyA9PT0gXCJicmFja2V0XCIgJiYgc291cmNlLmNoYXJBdChpbmRleCkgPT09IFwiPlwiICYmXG4gICAgICAgICAgdmlzaXRvcihcIm5ldy1maWx0ZXJcIiwgaW5kZXggKyAxKSA9PT0gZmFsc2VcbiAgICAgICAgKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGlmIChzdGF0dXNlcy5sZW5ndGggPiAwKSB7XG4gICAgdmlzaXRvcihcInVuY2xvc2VkXCIsIGluZGV4KTtcbiAgfVxufVxuXG4vLyBHZXQgdGhlIHByZXZpb3VzIGNoYXJhY3RlciBpbiBhIHN0cmluZyBpZ25vcmluZyBzcGFjZXMsIGxpbmUgYnJlYWtzIGFuZCB0YWJzXG5mdW5jdGlvbiBwcmV2Q2hhcihzb3VyY2U6IHN0cmluZywgaW5kZXg6IG51bWJlcikge1xuICB3aGlsZSAoaW5kZXggPiAwKSB7XG4gICAgY29uc3QgY2hhciA9IHNvdXJjZS5jaGFyQXQoLS1pbmRleCk7XG4gICAgaWYgKGNoYXIgIT09IFwiIFwiICYmIGNoYXIgIT09IFwiXFxuXCIgJiYgY2hhciAhPT0gXCJcXHJcIiAmJiBjaGFyICE9PSBcIlxcdFwiKSB7XG4gICAgICByZXR1cm4gY2hhcjtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIFwiXCI7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBaUJBLGVBQWUsU0FBUyxRQUFRLE1BQWMsRUFBRSxPQUFnQjtFQUM5RCxNQUFNLFNBQVMsT0FBTyxNQUFNO0VBQzVCLE1BQU0sV0FBcUIsRUFBRTtFQUM3QixJQUFJLFFBQVE7RUFFWixNQUFPLFFBQVEsT0FBUTtJQUNy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