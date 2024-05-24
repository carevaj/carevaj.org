// deno-lint-ignore-file no-explicit-any
export const defaults = {
  key: "image",
  attribute: "main"
};
export default function image(md, userOptions = {}) {
  const options = Object.assign({}, defaults, userOptions);
  function getImage(tokens, img) {
    for (const token of tokens){
      if (token.type === "image") {
        let src = "";
        let main = false;
        for (const [name, value] of token.attrs){
          if (name === "src") {
            src = value;
          }
          if (name === options.attribute) {
            main = true;
          }
        }
        // Remove main attribute
        const index = token.attrIndex(options.attribute);
        if (index !== -1) {
          token.attrs.splice(index, 1);
        }
        if (src) {
          if (!img.first) {
            img.first = src;
          }
          if (main) {
            img.main = src;
            return img;
          }
        }
        continue;
      }
      if (token.children) {
        img = getImage(token.children, img);
        if (img.main) {
          return img;
        }
      }
    }
    return img;
  }
  md.core.ruler.push("getImage", function(state) {
    const data = state.env.data?.page?.data;
    if (!data || data[options.key]) {
      return;
    }
    const img = getImage(state.tokens, {});
    data[options.key] = img.main || img.first;
  });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvbHVtZV9tYXJrZG93bl9wbHVnaW5zQHYwLjcuMC9pbWFnZS9tb2QudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gZGVuby1saW50LWlnbm9yZS1maWxlIG5vLWV4cGxpY2l0LWFueVxuZXhwb3J0IGludGVyZmFjZSBPcHRpb25zIHtcbiAgLyoqIEtleSB0byBzYXZlIHRoZSBpbWFnZSBpbiB0aGUgcGFnZSBkYXRhICovXG4gIGtleTogc3RyaW5nO1xuICBhdHRyaWJ1dGU6IHN0cmluZztcbn1cblxuZXhwb3J0IGNvbnN0IGRlZmF1bHRzOiBPcHRpb25zID0ge1xuICBrZXk6IFwiaW1hZ2VcIixcbiAgYXR0cmlidXRlOiBcIm1haW5cIixcbn07XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGltYWdlKG1kOiBhbnksIHVzZXJPcHRpb25zOiBQYXJ0aWFsPE9wdGlvbnM+ID0ge30pIHtcbiAgY29uc3Qgb3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oe30sIGRlZmF1bHRzLCB1c2VyT3B0aW9ucykgYXMgT3B0aW9ucztcblxuICBmdW5jdGlvbiBnZXRJbWFnZSh0b2tlbnM6IGFueVtdLCBpbWc6IFBhZ2VJbWFnZSk6IFBhZ2VJbWFnZSB7XG4gICAgZm9yIChjb25zdCB0b2tlbiBvZiB0b2tlbnMpIHtcbiAgICAgIGlmICh0b2tlbi50eXBlID09PSBcImltYWdlXCIpIHtcbiAgICAgICAgbGV0IHNyYyA9IFwiXCI7XG4gICAgICAgIGxldCBtYWluID0gZmFsc2U7XG4gICAgICAgIGZvciAoY29uc3QgW25hbWUsIHZhbHVlXSBvZiB0b2tlbi5hdHRycykge1xuICAgICAgICAgIGlmIChuYW1lID09PSBcInNyY1wiKSB7XG4gICAgICAgICAgICBzcmMgPSB2YWx1ZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKG5hbWUgPT09IG9wdGlvbnMuYXR0cmlidXRlKSB7XG4gICAgICAgICAgICBtYWluID0gdHJ1ZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgLy8gUmVtb3ZlIG1haW4gYXR0cmlidXRlXG4gICAgICAgIGNvbnN0IGluZGV4ID0gdG9rZW4uYXR0ckluZGV4KG9wdGlvbnMuYXR0cmlidXRlKTtcblxuICAgICAgICBpZiAoaW5kZXggIT09IC0xKSB7XG4gICAgICAgICAgdG9rZW4uYXR0cnMuc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChzcmMpIHtcbiAgICAgICAgICBpZiAoIWltZy5maXJzdCkge1xuICAgICAgICAgICAgaW1nLmZpcnN0ID0gc3JjO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAobWFpbikge1xuICAgICAgICAgICAgaW1nLm1haW4gPSBzcmM7XG4gICAgICAgICAgICByZXR1cm4gaW1nO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgaWYgKHRva2VuLmNoaWxkcmVuKSB7XG4gICAgICAgIGltZyA9IGdldEltYWdlKHRva2VuLmNoaWxkcmVuLCBpbWcpO1xuXG4gICAgICAgIGlmIChpbWcubWFpbikge1xuICAgICAgICAgIHJldHVybiBpbWc7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gaW1nO1xuICB9XG5cbiAgbWQuY29yZS5ydWxlci5wdXNoKFwiZ2V0SW1hZ2VcIiwgZnVuY3Rpb24gKHN0YXRlOiBhbnkpIHtcbiAgICBjb25zdCBkYXRhID0gc3RhdGUuZW52LmRhdGE/LnBhZ2U/LmRhdGE7XG5cbiAgICBpZiAoIWRhdGEgfHwgZGF0YVtvcHRpb25zLmtleV0pIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBpbWcgPSBnZXRJbWFnZShzdGF0ZS50b2tlbnMsIHt9KTtcbiAgICBkYXRhW29wdGlvbnMua2V5XSA9IGltZy5tYWluIHx8IGltZy5maXJzdDtcbiAgfSk7XG59XG5cbmludGVyZmFjZSBQYWdlSW1hZ2Uge1xuICBmaXJzdD86IHN0cmluZztcbiAgbWFpbj86IHN0cmluZztcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSx3Q0FBd0M7QUFPeEMsT0FBTyxNQUFNLFdBQW9CO0VBQy9CLEtBQUs7RUFDTCxXQUFXO0FBQ2IsRUFBRTtBQUVGLGVBQWUsU0FBUyxNQUFNLEVBQU8sRUFBRSxjQUFnQyxDQUFDLENBQUM7RUFDdkUsTUFBTSxVQUFVLE9BQU8sTUFBTSxDQUFDLENBQUMsR0FBRyxVQUFVO0VBRTVDLFNBQVMsU0FBUyxNQUFhLEVBQUUsR0FBYztJQUM3QyxLQUFLLE1BQU0sU0FBUyxPQUFRO01BQzFCLElBQUksTUFBTSxJQUFJLEtBQUssU0FBUztRQUMxQixJQUFJLE1BQU07UUFDVixJQUFJLE9BQU87UUFDWCxLQUFLLE1BQU0sQ0FBQyxNQUFNLE1BQU0sSUFBSSxNQUFNLEtBQUssQ0FBRTtVQUN2QyxJQUFJLFNBQVMsT0FBTztZQUNsQixNQUFNO1VBQ1I7VUFDQSxJQUFJLFNBQVMsUUFBUSxTQUFTLEVBQUU7WUFDOUIsT0FBTztVQUNUO1FBQ0Y7UUFDQSx3QkFBd0I7UUFDeEIsTUFBTSxRQUFRLE1BQU0sU0FBUyxDQUFDLFFBQVEsU0FBUztRQUUvQyxJQUFJLFVBQVUsQ0FBQyxHQUFHO1VBQ2hCLE1BQU0sS0FBSyxDQUFDLE1BQU0sQ0FBQyxPQUFPO1FBQzVCO1FBRUEsSUFBSSxLQUFLO1VBQ1AsSUFBSSxDQUFDLElBQUksS0FBSyxFQUFFO1lBQ2QsSUFBSSxLQUFLLEdBQUc7VUFDZDtVQUNBLElBQUksTUFBTTtZQUNSLElBQUksSUFBSSxHQUFHO1lBQ1gsT0FBTztVQUNUO1FBQ0Y7UUFDQTtNQUNGO01BRUEsSUFBSSxNQUFNLFFBQVEsRUFBRTtRQUNsQixNQUFNLFNBQVMsTUFBTSxRQUFRLEVBQUU7UUFFL0IsSUFBSSxJQUFJLElBQUksRUFBRTtVQUNaLE9BQU87UUFDVDtNQUNGO0lBQ0Y7SUFFQSxPQUFPO0VBQ1Q7RUFFQSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLFlBQVksU0FBVSxLQUFVO0lBQ2pELE1BQU0sT0FBTyxNQUFNLEdBQUcsQ0FBQyxJQUFJLEVBQUUsTUFBTTtJQUVuQyxJQUFJLENBQUMsUUFBUSxJQUFJLENBQUMsUUFBUSxHQUFHLENBQUMsRUFBRTtNQUM5QjtJQUNGO0lBRUEsTUFBTSxNQUFNLFNBQVMsTUFBTSxNQUFNLEVBQUUsQ0FBQztJQUNwQyxJQUFJLENBQUMsUUFBUSxHQUFHLENBQUMsR0FBRyxJQUFJLElBQUksSUFBSSxJQUFJLEtBQUs7RUFDM0M7QUFDRiJ9