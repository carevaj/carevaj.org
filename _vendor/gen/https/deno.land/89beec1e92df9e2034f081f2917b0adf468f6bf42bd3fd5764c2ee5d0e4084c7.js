/** Return the latest stable version from the deno.land/x repository */ export async function getLatestVersion() {
  const response = await fetch("https://cdn.deno.land/lume/meta/versions.json");
  const versions = await response.json();
  return versions.latest;
}
/** Return the hash of the latest commit from the GitHub repository */ export async function getLatestDevelopmentVersion() {
  const response = await fetch(`https://api.github.com/repos/lumeland/lume/commits/main`);
  const commits = await response.json();
  return commits.sha;
}
/** Return the current installed version */ export function getCurrentVersion(url = new URL(import.meta.resolve("../"))) {
  const { pathname } = url;
  return pathname.match(/@([^/]+)/)?.[1] ?? `local (${pathname})`;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvbHVtZUB2Mi4yLjAvY29yZS91dGlscy9sdW1lX3ZlcnNpb24udHMiXSwic291cmNlc0NvbnRlbnQiOlsiLyoqIFJldHVybiB0aGUgbGF0ZXN0IHN0YWJsZSB2ZXJzaW9uIGZyb20gdGhlIGRlbm8ubGFuZC94IHJlcG9zaXRvcnkgKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRMYXRlc3RWZXJzaW9uKCk6IFByb21pc2U8c3RyaW5nPiB7XG4gIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2goXCJodHRwczovL2Nkbi5kZW5vLmxhbmQvbHVtZS9tZXRhL3ZlcnNpb25zLmpzb25cIik7XG4gIGNvbnN0IHZlcnNpb25zID0gYXdhaXQgcmVzcG9uc2UuanNvbigpO1xuICByZXR1cm4gdmVyc2lvbnMubGF0ZXN0O1xufVxuXG4vKiogUmV0dXJuIHRoZSBoYXNoIG9mIHRoZSBsYXRlc3QgY29tbWl0IGZyb20gdGhlIEdpdEh1YiByZXBvc2l0b3J5ICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0TGF0ZXN0RGV2ZWxvcG1lbnRWZXJzaW9uKCk6IFByb21pc2U8c3RyaW5nPiB7XG4gIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2goXG4gICAgYGh0dHBzOi8vYXBpLmdpdGh1Yi5jb20vcmVwb3MvbHVtZWxhbmQvbHVtZS9jb21taXRzL21haW5gLFxuICApO1xuICBjb25zdCBjb21taXRzID0gYXdhaXQgcmVzcG9uc2UuanNvbigpO1xuICByZXR1cm4gY29tbWl0cy5zaGE7XG59XG5cbi8qKiBSZXR1cm4gdGhlIGN1cnJlbnQgaW5zdGFsbGVkIHZlcnNpb24gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRDdXJyZW50VmVyc2lvbihcbiAgdXJsID0gbmV3IFVSTChpbXBvcnQubWV0YS5yZXNvbHZlKFwiLi4vXCIpKSxcbik6IHN0cmluZyB7XG4gIGNvbnN0IHsgcGF0aG5hbWUgfSA9IHVybDtcbiAgcmV0dXJuIHBhdGhuYW1lLm1hdGNoKC9AKFteL10rKS8pPy5bMV0gPz8gYGxvY2FsICgke3BhdGhuYW1lfSlgO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLHFFQUFxRSxHQUNyRSxPQUFPLGVBQWU7RUFDcEIsTUFBTSxXQUFXLE1BQU0sTUFBTTtFQUM3QixNQUFNLFdBQVcsTUFBTSxTQUFTLElBQUk7RUFDcEMsT0FBTyxTQUFTLE1BQU07QUFDeEI7QUFFQSxvRUFBb0UsR0FDcEUsT0FBTyxlQUFlO0VBQ3BCLE1BQU0sV0FBVyxNQUFNLE1BQ3JCLENBQUMsdURBQXVELENBQUM7RUFFM0QsTUFBTSxVQUFVLE1BQU0sU0FBUyxJQUFJO0VBQ25DLE9BQU8sUUFBUSxHQUFHO0FBQ3BCO0FBRUEseUNBQXlDLEdBQ3pDLE9BQU8sU0FBUyxrQkFDZCxNQUFNLElBQUksSUFBSSxZQUFZLE9BQU8sQ0FBQyxPQUFPO0VBRXpDLE1BQU0sRUFBRSxRQUFRLEVBQUUsR0FBRztFQUNyQixPQUFPLFNBQVMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxFQUFFLElBQUksQ0FBQyxPQUFPLEVBQUUsU0FBUyxDQUFDLENBQUM7QUFDakUifQ==