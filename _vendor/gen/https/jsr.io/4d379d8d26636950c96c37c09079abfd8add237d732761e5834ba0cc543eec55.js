// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
const input = Deno.stdin;
const output = Deno.stdout;
const encoder = new TextEncoder();
const decoder = new TextDecoder();
const LF = "\n".charCodeAt(0); // ^J - Enter on Linux
const CR = "\r".charCodeAt(0); // ^M - Enter on macOS and Windows (CRLF)
const BS = "\b".charCodeAt(0); // ^H - Backspace on Linux and Windows
const DEL = 0x7f; // ^? - Backspace on macOS
const CLR = encoder.encode("\r\u001b[K"); // Clear the current line
// The `cbreak` option is not supported on Windows
const setRawOptions = Deno.build.os === "windows" ? undefined : {
  cbreak: true
};
/**
 * Shows the given message and waits for the user's input. Returns the user's input as string.
 * This is similar to `prompt()` but it print user's input as `*` to prevent password from being shown.
 * Use an empty `mask` if you don't want to show any character.
 */ export function promptSecret(message = "Secret", { mask = "*", clear } = {}) {
  if (!input.isTerminal()) {
    return null;
  }
  // Make the output consistent with the built-in prompt()
  message += " ";
  const callback = !mask ? undefined : (n)=>{
    output.writeSync(CLR);
    output.writeSync(encoder.encode(`${message}${mask.repeat(n)}`));
  };
  output.writeSync(encoder.encode(message));
  Deno.stdin.setRaw(true, setRawOptions);
  try {
    return readLineFromStdinSync(callback);
  } finally{
    if (clear) {
      output.writeSync(CLR);
    } else {
      output.writeSync(encoder.encode("\n"));
    }
    Deno.stdin.setRaw(false);
  }
}
// Slightly modified from Deno's runtime/js/41_prompt.js
// This implementation immediately break on CR or LF and accept callback.
// The original version waits LF when CR is received.
// https://github.com/denoland/deno/blob/e4593873a9c791238685dfbb45e64b4485884174/runtime/js/41_prompt.js#L52-L77
function readLineFromStdinSync(callback) {
  const c = new Uint8Array(1);
  const buf = [];
  while(true){
    const n = input.readSync(c);
    if (n === null || n === 0) {
      break;
    }
    if (c[0] === CR || c[0] === LF) {
      break;
    }
    if (c[0] === BS || c[0] === DEL) {
      buf.pop();
    } else {
      buf.push(c[0]);
    }
    if (callback) callback(buf.length);
  }
  return decoder.decode(new Uint8Array(buf));
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0BzdGQvY2xpLzAuMjI0LjIvcHJvbXB0X3NlY3JldC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDI0IHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuXG5jb25zdCBpbnB1dCA9IERlbm8uc3RkaW47XG5jb25zdCBvdXRwdXQgPSBEZW5vLnN0ZG91dDtcbmNvbnN0IGVuY29kZXIgPSBuZXcgVGV4dEVuY29kZXIoKTtcbmNvbnN0IGRlY29kZXIgPSBuZXcgVGV4dERlY29kZXIoKTtcbmNvbnN0IExGID0gXCJcXG5cIi5jaGFyQ29kZUF0KDApOyAvLyBeSiAtIEVudGVyIG9uIExpbnV4XG5jb25zdCBDUiA9IFwiXFxyXCIuY2hhckNvZGVBdCgwKTsgLy8gXk0gLSBFbnRlciBvbiBtYWNPUyBhbmQgV2luZG93cyAoQ1JMRilcbmNvbnN0IEJTID0gXCJcXGJcIi5jaGFyQ29kZUF0KDApOyAvLyBeSCAtIEJhY2tzcGFjZSBvbiBMaW51eCBhbmQgV2luZG93c1xuY29uc3QgREVMID0gMHg3ZjsgLy8gXj8gLSBCYWNrc3BhY2Ugb24gbWFjT1NcbmNvbnN0IENMUiA9IGVuY29kZXIuZW5jb2RlKFwiXFxyXFx1MDAxYltLXCIpOyAvLyBDbGVhciB0aGUgY3VycmVudCBsaW5lXG5cbi8vIFRoZSBgY2JyZWFrYCBvcHRpb24gaXMgbm90IHN1cHBvcnRlZCBvbiBXaW5kb3dzXG5jb25zdCBzZXRSYXdPcHRpb25zID0gRGVuby5idWlsZC5vcyA9PT0gXCJ3aW5kb3dzXCJcbiAgPyB1bmRlZmluZWRcbiAgOiB7IGNicmVhazogdHJ1ZSB9O1xuXG4vKiogT3B0aW9ucyBmb3Ige0BsaW5rY29kZSBwcm9tcHRTZWNyZXR9LiAqL1xuZXhwb3J0IHR5cGUgUHJvbXB0U2VjcmV0T3B0aW9ucyA9IHtcbiAgLyoqIEEgY2hhcmFjdGVyIHRvIHByaW50IGluc3RlYWQgb2YgdGhlIHVzZXIncyBpbnB1dC4gKi9cbiAgbWFzaz86IHN0cmluZztcbiAgLyoqIENsZWFyIHRoZSBjdXJyZW50IGxpbmUgYWZ0ZXIgdGhlIHVzZXIncyBpbnB1dC4gKi9cbiAgY2xlYXI/OiBib29sZWFuO1xufTtcblxuLyoqXG4gKiBTaG93cyB0aGUgZ2l2ZW4gbWVzc2FnZSBhbmQgd2FpdHMgZm9yIHRoZSB1c2VyJ3MgaW5wdXQuIFJldHVybnMgdGhlIHVzZXIncyBpbnB1dCBhcyBzdHJpbmcuXG4gKiBUaGlzIGlzIHNpbWlsYXIgdG8gYHByb21wdCgpYCBidXQgaXQgcHJpbnQgdXNlcidzIGlucHV0IGFzIGAqYCB0byBwcmV2ZW50IHBhc3N3b3JkIGZyb20gYmVpbmcgc2hvd24uXG4gKiBVc2UgYW4gZW1wdHkgYG1hc2tgIGlmIHlvdSBkb24ndCB3YW50IHRvIHNob3cgYW55IGNoYXJhY3Rlci5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHByb21wdFNlY3JldChcbiAgbWVzc2FnZSA9IFwiU2VjcmV0XCIsXG4gIHsgbWFzayA9IFwiKlwiLCBjbGVhciB9OiBQcm9tcHRTZWNyZXRPcHRpb25zID0ge30sXG4pOiBzdHJpbmcgfCBudWxsIHtcbiAgaWYgKCFpbnB1dC5pc1Rlcm1pbmFsKCkpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIC8vIE1ha2UgdGhlIG91dHB1dCBjb25zaXN0ZW50IHdpdGggdGhlIGJ1aWx0LWluIHByb21wdCgpXG4gIG1lc3NhZ2UgKz0gXCIgXCI7XG4gIGNvbnN0IGNhbGxiYWNrID0gIW1hc2sgPyB1bmRlZmluZWQgOiAobjogbnVtYmVyKSA9PiB7XG4gICAgb3V0cHV0LndyaXRlU3luYyhDTFIpO1xuICAgIG91dHB1dC53cml0ZVN5bmMoZW5jb2Rlci5lbmNvZGUoYCR7bWVzc2FnZX0ke21hc2sucmVwZWF0KG4pfWApKTtcbiAgfTtcbiAgb3V0cHV0LndyaXRlU3luYyhlbmNvZGVyLmVuY29kZShtZXNzYWdlKSk7XG5cbiAgRGVuby5zdGRpbi5zZXRSYXcodHJ1ZSwgc2V0UmF3T3B0aW9ucyk7XG4gIHRyeSB7XG4gICAgcmV0dXJuIHJlYWRMaW5lRnJvbVN0ZGluU3luYyhjYWxsYmFjayk7XG4gIH0gZmluYWxseSB7XG4gICAgaWYgKGNsZWFyKSB7XG4gICAgICBvdXRwdXQud3JpdGVTeW5jKENMUik7XG4gICAgfSBlbHNlIHtcbiAgICAgIG91dHB1dC53cml0ZVN5bmMoZW5jb2Rlci5lbmNvZGUoXCJcXG5cIikpO1xuICAgIH1cbiAgICBEZW5vLnN0ZGluLnNldFJhdyhmYWxzZSk7XG4gIH1cbn1cblxuLy8gU2xpZ2h0bHkgbW9kaWZpZWQgZnJvbSBEZW5vJ3MgcnVudGltZS9qcy80MV9wcm9tcHQuanNcbi8vIFRoaXMgaW1wbGVtZW50YXRpb24gaW1tZWRpYXRlbHkgYnJlYWsgb24gQ1Igb3IgTEYgYW5kIGFjY2VwdCBjYWxsYmFjay5cbi8vIFRoZSBvcmlnaW5hbCB2ZXJzaW9uIHdhaXRzIExGIHdoZW4gQ1IgaXMgcmVjZWl2ZWQuXG4vLyBodHRwczovL2dpdGh1Yi5jb20vZGVub2xhbmQvZGVuby9ibG9iL2U0NTkzODczYTljNzkxMjM4Njg1ZGZiYjQ1ZTY0YjQ0ODU4ODQxNzQvcnVudGltZS9qcy80MV9wcm9tcHQuanMjTDUyLUw3N1xuZnVuY3Rpb24gcmVhZExpbmVGcm9tU3RkaW5TeW5jKGNhbGxiYWNrPzogKG46IG51bWJlcikgPT4gdm9pZCk6IHN0cmluZyB7XG4gIGNvbnN0IGMgPSBuZXcgVWludDhBcnJheSgxKTtcbiAgY29uc3QgYnVmID0gW107XG5cbiAgd2hpbGUgKHRydWUpIHtcbiAgICBjb25zdCBuID0gaW5wdXQucmVhZFN5bmMoYyk7XG4gICAgaWYgKG4gPT09IG51bGwgfHwgbiA9PT0gMCkge1xuICAgICAgYnJlYWs7XG4gICAgfVxuICAgIGlmIChjWzBdID09PSBDUiB8fCBjWzBdID09PSBMRikge1xuICAgICAgYnJlYWs7XG4gICAgfVxuICAgIGlmIChjWzBdID09PSBCUyB8fCBjWzBdID09PSBERUwpIHtcbiAgICAgIGJ1Zi5wb3AoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgYnVmLnB1c2goY1swXSEpO1xuICAgIH1cbiAgICBpZiAoY2FsbGJhY2spIGNhbGxiYWNrKGJ1Zi5sZW5ndGgpO1xuICB9XG4gIHJldHVybiBkZWNvZGVyLmRlY29kZShuZXcgVWludDhBcnJheShidWYpKTtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSwwRUFBMEU7QUFFMUUsTUFBTSxRQUFRLEtBQUssS0FBSztBQUN4QixNQUFNLFNBQVMsS0FBSyxNQUFNO0FBQzFCLE1BQU0sVUFBVSxJQUFJO0FBQ3BCLE1BQU0sVUFBVSxJQUFJO0FBQ3BCLE1BQU0sS0FBSyxLQUFLLFVBQVUsQ0FBQyxJQUFJLHNCQUFzQjtBQUNyRCxNQUFNLEtBQUssS0FBSyxVQUFVLENBQUMsSUFBSSx5Q0FBeUM7QUFDeEUsTUFBTSxLQUFLLEtBQUssVUFBVSxDQUFDLElBQUksc0NBQXNDO0FBQ3JFLE1BQU0sTUFBTSxNQUFNLDBCQUEwQjtBQUM1QyxNQUFNLE1BQU0sUUFBUSxNQUFNLENBQUMsZUFBZSx5QkFBeUI7QUFFbkUsa0RBQWtEO0FBQ2xELE1BQU0sZ0JBQWdCLEtBQUssS0FBSyxDQUFDLEVBQUUsS0FBSyxZQUNwQyxZQUNBO0VBQUUsUUFBUTtBQUFLO0FBVW5COzs7O0NBSUMsR0FDRCxPQUFPLFNBQVMsYUFDZCxVQUFVLFFBQVEsRUFDbEIsRUFBRSxPQUFPLEdBQUcsRUFBRSxLQUFLLEVBQXVCLEdBQUcsQ0FBQyxDQUFDO0VBRS9DLElBQUksQ0FBQyxNQUFNLFVBQVUsSUFBSTtJQUN2QixPQUFPO0VBQ1Q7RUFFQSx3REFBd0Q7RUFDeEQsV0FBVztFQUNYLE1BQU0sV0FBVyxDQUFDLE9BQU8sWUFBWSxDQUFDO0lBQ3BDLE9BQU8sU0FBUyxDQUFDO0lBQ2pCLE9BQU8sU0FBUyxDQUFDLFFBQVEsTUFBTSxDQUFDLENBQUMsRUFBRSxRQUFRLEVBQUUsS0FBSyxNQUFNLENBQUMsR0FBRyxDQUFDO0VBQy9EO0VBQ0EsT0FBTyxTQUFTLENBQUMsUUFBUSxNQUFNLENBQUM7RUFFaEMsS0FBSyxLQUFLLENBQUMsTUFBTSxDQUFDLE1BQU07RUFDeEIsSUFBSTtJQUNGLE9BQU8sc0JBQXNCO0VBQy9CLFNBQVU7SUFDUixJQUFJLE9BQU87TUFDVCxPQUFPLFNBQVMsQ0FBQztJQUNuQixPQUFPO01BQ0wsT0FBTyxTQUFTLENBQUMsUUFBUSxNQUFNLENBQUM7SUFDbEM7SUFDQSxLQUFLLEtBQUssQ0FBQyxNQUFNLENBQUM7RUFDcEI7QUFDRjtBQUVBLHdEQUF3RDtBQUN4RCx5RUFBeUU7QUFDekUscURBQXFEO0FBQ3JELGlIQUFpSDtBQUNqSCxTQUFTLHNCQUFzQixRQUE4QjtFQUMzRCxNQUFNLElBQUksSUFBSSxXQUFXO0VBQ3pCLE1BQU0sTUFBTSxFQUFFO0VBRWQsTUFBTyxLQUFNO0lBQ1gsTUFBTSxJQUFJLE1BQU0sUUFBUSxDQUFDO0lBQ3pCLElBQUksTUFBTSxRQUFRLE1BQU0sR0FBRztNQUN6QjtJQUNGO0lBQ0EsSUFBSSxDQUFDLENBQUMsRUFBRSxLQUFLLE1BQU0sQ0FBQyxDQUFDLEVBQUUsS0FBSyxJQUFJO01BQzlCO0lBQ0Y7SUFDQSxJQUFJLENBQUMsQ0FBQyxFQUFFLEtBQUssTUFBTSxDQUFDLENBQUMsRUFBRSxLQUFLLEtBQUs7TUFDL0IsSUFBSSxHQUFHO0lBQ1QsT0FBTztNQUNMLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFO0lBQ2Y7SUFDQSxJQUFJLFVBQVUsU0FBUyxJQUFJLE1BQU07RUFDbkM7RUFDQSxPQUFPLFFBQVEsTUFBTSxDQUFDLElBQUksV0FBVztBQUN2QyJ9