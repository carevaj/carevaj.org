import { parse } from "../../deps/jsonc.ts";
import { isPlainObject } from "../utils/object.ts";
import { read } from "../utils/read.ts";
/** Load and parse a JSON / JSONC file */ export default async function json(path) {
  const text = await read(path, false);
  const content = path.endsWith(".jsonc") ? parse(text) : JSON.parse(text);
  if (!content) {
    return {};
  }
  if (isPlainObject(content)) {
    return content;
  }
  return {
    content
  };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvbHVtZUB2Mi4yLjAvY29yZS9sb2FkZXJzL2pzb24udHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgcGFyc2UgfSBmcm9tIFwiLi4vLi4vZGVwcy9qc29uYy50c1wiO1xuaW1wb3J0IHsgaXNQbGFpbk9iamVjdCB9IGZyb20gXCIuLi91dGlscy9vYmplY3QudHNcIjtcbmltcG9ydCB7IHJlYWQgfSBmcm9tIFwiLi4vdXRpbHMvcmVhZC50c1wiO1xuXG5pbXBvcnQgdHlwZSB7IFJhd0RhdGEgfSBmcm9tIFwiLi4vZmlsZS50c1wiO1xuXG4vKiogTG9hZCBhbmQgcGFyc2UgYSBKU09OIC8gSlNPTkMgZmlsZSAqL1xuZXhwb3J0IGRlZmF1bHQgYXN5bmMgZnVuY3Rpb24ganNvbihwYXRoOiBzdHJpbmcpOiBQcm9taXNlPFJhd0RhdGE+IHtcbiAgY29uc3QgdGV4dCA9IGF3YWl0IHJlYWQocGF0aCwgZmFsc2UpO1xuICBjb25zdCBjb250ZW50ID0gcGF0aC5lbmRzV2l0aChcIi5qc29uY1wiKSA/IHBhcnNlKHRleHQpIDogSlNPTi5wYXJzZSh0ZXh0KTtcblxuICBpZiAoIWNvbnRlbnQpIHtcbiAgICByZXR1cm4ge307XG4gIH1cblxuICBpZiAoaXNQbGFpbk9iamVjdChjb250ZW50KSkge1xuICAgIHJldHVybiBjb250ZW50IGFzIFJhd0RhdGE7XG4gIH1cblxuICByZXR1cm4geyBjb250ZW50IH07XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsU0FBUyxLQUFLLFFBQVEsc0JBQXNCO0FBQzVDLFNBQVMsYUFBYSxRQUFRLHFCQUFxQjtBQUNuRCxTQUFTLElBQUksUUFBUSxtQkFBbUI7QUFJeEMsdUNBQXVDLEdBQ3ZDLGVBQWUsZUFBZSxLQUFLLElBQVk7RUFDN0MsTUFBTSxPQUFPLE1BQU0sS0FBSyxNQUFNO0VBQzlCLE1BQU0sVUFBVSxLQUFLLFFBQVEsQ0FBQyxZQUFZLE1BQU0sUUFBUSxLQUFLLEtBQUssQ0FBQztFQUVuRSxJQUFJLENBQUMsU0FBUztJQUNaLE9BQU8sQ0FBQztFQUNWO0VBRUEsSUFBSSxjQUFjLFVBQVU7SUFDMUIsT0FBTztFQUNUO0VBRUEsT0FBTztJQUFFO0VBQVE7QUFDbkIifQ==