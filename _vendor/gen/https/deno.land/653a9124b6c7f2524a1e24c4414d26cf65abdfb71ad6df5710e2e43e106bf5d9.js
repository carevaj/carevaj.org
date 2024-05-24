import { Provider } from "../provider.ts";
import { bold, brightBlue } from "../../deps.ts";
export class GithubProvider extends Provider {
  name = "github";
  repositoryUrl = "https://github.com/";
  registryUrl = "https://raw.githubusercontent.com/";
  apiUrl = "https://api.github.com/repos/";
  repositoryName;
  listBranches;
  githubToken;
  constructor({ repository, branches = true, token }){
    super();
    this.repositoryName = repository;
    this.listBranches = branches;
    this.githubToken = token;
  }
  async getVersions(_name) {
    const [tags, branches] = await Promise.all([
      this.gitFetch("git/refs/tags"),
      this.gitFetch("branches")
    ]);
    const tagNames = tags.map((tag)=>tag.ref.replace(/^refs\/tags\//, "")).reverse();
    const branchNames = branches.sort((a, b)=>a.protected === b.protected ? 0 : a.protected ? 1 : -1).map((tag)=>`${tag.name} ${tag.protected ? `(${bold("Protected")})` : ""}`).reverse();
    return {
      versions: [
        ...tagNames,
        ...branchNames
      ],
      latest: tagNames[0],
      tags: tagNames,
      branches: branchNames
    };
  }
  getRepositoryUrl(_name) {
    return new URL(`${this.repositoryName}/`, this.repositoryUrl).href;
  }
  getRegistryUrl(_name, version) {
    return new URL(`${this.repositoryName}/${version}/`, this.registryUrl).href;
  }
  async listVersions(name, currentVersion) {
    const { tags, branches } = await this.getVersions(name);
    const showBranches = !!this.listBranches && branches.length > 0;
    const indent = showBranches ? 2 : 0;
    if (showBranches) {
      console.log("\n" + " ".repeat(indent) + bold(brightBlue("Tags:\n")));
    }
    super.printVersions(tags, currentVersion, {
      indent
    });
    if (showBranches) {
      console.log("\n" + " ".repeat(indent) + bold(brightBlue("Branches:\n")));
      super.printVersions(branches, currentVersion, {
        maxCols: 5,
        indent
      });
      console.log();
    }
  }
  getApiUrl(endpoint) {
    return new URL(`${this.repositoryName}/${endpoint}`, this.apiUrl).href;
  }
  async gitFetch(endpoint) {
    const headers = new Headers({
      "Content-Type": "application/json"
    });
    if (this.githubToken) {
      headers.set("Authorization", this.githubToken ? `token ${this.githubToken}` : "");
    }
    const response = await fetch(this.getApiUrl(endpoint), {
      method: "GET",
      cache: "default",
      headers
    });
    if (!response.status) {
      throw new Error("couldn't fetch versions - try again after sometime");
    }
    const data = await response.json();
    if (typeof data === "object" && "message" in data && "documentation_url" in data) {
      throw new Error(data.message + " " + data.documentation_url);
    }
    return data;
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvY2xpZmZ5QHYwLjI1LjcvY29tbWFuZC91cGdyYWRlL3Byb3ZpZGVyL2dpdGh1Yi50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBQcm92aWRlciwgVmVyc2lvbnMgfSBmcm9tIFwiLi4vcHJvdmlkZXIudHNcIjtcbmltcG9ydCB7IGJvbGQsIGJyaWdodEJsdWUgfSBmcm9tIFwiLi4vLi4vZGVwcy50c1wiO1xuXG5leHBvcnQgaW50ZXJmYWNlIEdpdGh1YlByb3ZpZGVyT3B0aW9ucyB7XG4gIHJlcG9zaXRvcnk6IHN0cmluZztcbiAgYnJhbmNoZXM/OiBib29sZWFuO1xuICB0b2tlbj86IHN0cmluZztcbn1cblxuZXhwb3J0IGludGVyZmFjZSBHaXRodWJWZXJzaW9ucyBleHRlbmRzIFZlcnNpb25zIHtcbiAgdGFnczogQXJyYXk8c3RyaW5nPjtcbiAgYnJhbmNoZXM6IEFycmF5PHN0cmluZz47XG59XG5cbmV4cG9ydCBjbGFzcyBHaXRodWJQcm92aWRlciBleHRlbmRzIFByb3ZpZGVyIHtcbiAgbmFtZSA9IFwiZ2l0aHViXCI7XG4gIHByaXZhdGUgcmVhZG9ubHkgcmVwb3NpdG9yeVVybCA9IFwiaHR0cHM6Ly9naXRodWIuY29tL1wiO1xuICBwcml2YXRlIHJlYWRvbmx5IHJlZ2lzdHJ5VXJsID0gXCJodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vXCI7XG4gIHByaXZhdGUgcmVhZG9ubHkgYXBpVXJsID0gXCJodHRwczovL2FwaS5naXRodWIuY29tL3JlcG9zL1wiO1xuICBwcml2YXRlIHJlYWRvbmx5IHJlcG9zaXRvcnlOYW1lOiBzdHJpbmc7XG4gIHByaXZhdGUgcmVhZG9ubHkgbGlzdEJyYW5jaGVzPzogYm9vbGVhbjtcbiAgcHJpdmF0ZSByZWFkb25seSBnaXRodWJUb2tlbj86IHN0cmluZztcblxuICBjb25zdHJ1Y3Rvcih7IHJlcG9zaXRvcnksIGJyYW5jaGVzID0gdHJ1ZSwgdG9rZW4gfTogR2l0aHViUHJvdmlkZXJPcHRpb25zKSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLnJlcG9zaXRvcnlOYW1lID0gcmVwb3NpdG9yeTtcbiAgICB0aGlzLmxpc3RCcmFuY2hlcyA9IGJyYW5jaGVzO1xuICAgIHRoaXMuZ2l0aHViVG9rZW4gPSB0b2tlbjtcbiAgfVxuXG4gIGFzeW5jIGdldFZlcnNpb25zKFxuICAgIF9uYW1lOiBzdHJpbmcsXG4gICk6IFByb21pc2U8R2l0aHViVmVyc2lvbnM+IHtcbiAgICBjb25zdCBbdGFncywgYnJhbmNoZXNdID0gYXdhaXQgUHJvbWlzZS5hbGwoW1xuICAgICAgdGhpcy5naXRGZXRjaDxBcnJheTx7IHJlZjogc3RyaW5nIH0+PihcImdpdC9yZWZzL3RhZ3NcIiksXG4gICAgICB0aGlzLmdpdEZldGNoPEFycmF5PHsgbmFtZTogc3RyaW5nOyBwcm90ZWN0ZWQ6IGJvb2xlYW4gfT4+KFwiYnJhbmNoZXNcIiksXG4gICAgXSk7XG5cbiAgICBjb25zdCB0YWdOYW1lcyA9IHRhZ3NcbiAgICAgIC5tYXAoKHRhZykgPT4gdGFnLnJlZi5yZXBsYWNlKC9ecmVmc1xcL3RhZ3NcXC8vLCBcIlwiKSlcbiAgICAgIC5yZXZlcnNlKCk7XG5cbiAgICBjb25zdCBicmFuY2hOYW1lcyA9IGJyYW5jaGVzXG4gICAgICAuc29ydCgoYSwgYikgPT5cbiAgICAgICAgKGEucHJvdGVjdGVkID09PSBiLnByb3RlY3RlZCkgPyAwIDogKGEucHJvdGVjdGVkID8gMSA6IC0xKVxuICAgICAgKVxuICAgICAgLm1hcCgodGFnKSA9PlxuICAgICAgICBgJHt0YWcubmFtZX0gJHt0YWcucHJvdGVjdGVkID8gYCgke2JvbGQoXCJQcm90ZWN0ZWRcIil9KWAgOiBcIlwifWBcbiAgICAgIClcbiAgICAgIC5yZXZlcnNlKCk7XG5cbiAgICByZXR1cm4ge1xuICAgICAgdmVyc2lvbnM6IFtcbiAgICAgICAgLi4udGFnTmFtZXMsXG4gICAgICAgIC4uLmJyYW5jaE5hbWVzLFxuICAgICAgXSxcbiAgICAgIGxhdGVzdDogdGFnTmFtZXNbMF0sXG4gICAgICB0YWdzOiB0YWdOYW1lcyxcbiAgICAgIGJyYW5jaGVzOiBicmFuY2hOYW1lcyxcbiAgICB9O1xuICB9XG5cbiAgZ2V0UmVwb3NpdG9yeVVybChfbmFtZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgICByZXR1cm4gbmV3IFVSTChgJHt0aGlzLnJlcG9zaXRvcnlOYW1lfS9gLCB0aGlzLnJlcG9zaXRvcnlVcmwpLmhyZWY7XG4gIH1cblxuICBnZXRSZWdpc3RyeVVybChfbmFtZTogc3RyaW5nLCB2ZXJzaW9uOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIHJldHVybiBuZXcgVVJMKGAke3RoaXMucmVwb3NpdG9yeU5hbWV9LyR7dmVyc2lvbn0vYCwgdGhpcy5yZWdpc3RyeVVybCkuaHJlZjtcbiAgfVxuXG4gIGFzeW5jIGxpc3RWZXJzaW9ucyhuYW1lOiBzdHJpbmcsIGN1cnJlbnRWZXJzaW9uPzogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgeyB0YWdzLCBicmFuY2hlcyB9ID0gYXdhaXQgdGhpcy5nZXRWZXJzaW9ucyhuYW1lKTtcbiAgICBjb25zdCBzaG93QnJhbmNoZXM6IGJvb2xlYW4gPSAhIXRoaXMubGlzdEJyYW5jaGVzICYmIGJyYW5jaGVzLmxlbmd0aCA+IDA7XG4gICAgY29uc3QgaW5kZW50ID0gc2hvd0JyYW5jaGVzID8gMiA6IDA7XG4gICAgaWYgKHNob3dCcmFuY2hlcykge1xuICAgICAgY29uc29sZS5sb2coXCJcXG5cIiArIFwiIFwiLnJlcGVhdChpbmRlbnQpICsgYm9sZChicmlnaHRCbHVlKFwiVGFnczpcXG5cIikpKTtcbiAgICB9XG4gICAgc3VwZXIucHJpbnRWZXJzaW9ucyh0YWdzLCBjdXJyZW50VmVyc2lvbiwgeyBpbmRlbnQgfSk7XG4gICAgaWYgKHNob3dCcmFuY2hlcykge1xuICAgICAgY29uc29sZS5sb2coXCJcXG5cIiArIFwiIFwiLnJlcGVhdChpbmRlbnQpICsgYm9sZChicmlnaHRCbHVlKFwiQnJhbmNoZXM6XFxuXCIpKSk7XG4gICAgICBzdXBlci5wcmludFZlcnNpb25zKGJyYW5jaGVzLCBjdXJyZW50VmVyc2lvbiwgeyBtYXhDb2xzOiA1LCBpbmRlbnQgfSk7XG4gICAgICBjb25zb2xlLmxvZygpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgZ2V0QXBpVXJsKGVuZHBvaW50OiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIHJldHVybiBuZXcgVVJMKGAke3RoaXMucmVwb3NpdG9yeU5hbWV9LyR7ZW5kcG9pbnR9YCwgdGhpcy5hcGlVcmwpLmhyZWY7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGdpdEZldGNoPFQ+KGVuZHBvaW50OiBzdHJpbmcpOiBQcm9taXNlPFQ+IHtcbiAgICBjb25zdCBoZWFkZXJzID0gbmV3IEhlYWRlcnMoeyBcIkNvbnRlbnQtVHlwZVwiOiBcImFwcGxpY2F0aW9uL2pzb25cIiB9KTtcbiAgICBpZiAodGhpcy5naXRodWJUb2tlbikge1xuICAgICAgaGVhZGVycy5zZXQoXG4gICAgICAgIFwiQXV0aG9yaXphdGlvblwiLFxuICAgICAgICB0aGlzLmdpdGh1YlRva2VuID8gYHRva2VuICR7dGhpcy5naXRodWJUb2tlbn1gIDogXCJcIixcbiAgICAgICk7XG4gICAgfVxuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2goXG4gICAgICB0aGlzLmdldEFwaVVybChlbmRwb2ludCksXG4gICAgICB7XG4gICAgICAgIG1ldGhvZDogXCJHRVRcIixcbiAgICAgICAgY2FjaGU6IFwiZGVmYXVsdFwiLFxuICAgICAgICBoZWFkZXJzLFxuICAgICAgfSxcbiAgICApO1xuXG4gICAgaWYgKCFyZXNwb25zZS5zdGF0dXMpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgXCJjb3VsZG4ndCBmZXRjaCB2ZXJzaW9ucyAtIHRyeSBhZ2FpbiBhZnRlciBzb21ldGltZVwiLFxuICAgICAgKTtcbiAgICB9XG5cbiAgICBjb25zdCBkYXRhOiBHaXRodWJSZXNwb25zZSAmIFQgPSBhd2FpdCByZXNwb25zZS5qc29uKCk7XG5cbiAgICBpZiAoXG4gICAgICB0eXBlb2YgZGF0YSA9PT0gXCJvYmplY3RcIiAmJiBcIm1lc3NhZ2VcIiBpbiBkYXRhICYmXG4gICAgICBcImRvY3VtZW50YXRpb25fdXJsXCIgaW4gZGF0YVxuICAgICkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGRhdGEubWVzc2FnZSArIFwiIFwiICsgZGF0YS5kb2N1bWVudGF0aW9uX3VybCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGRhdGE7XG4gIH1cbn1cblxuaW50ZXJmYWNlIEdpdGh1YlJlc3BvbnNlIHtcbiAgbWVzc2FnZTogc3RyaW5nO1xuICAvLyBkZW5vLWxpbnQtaWdub3JlIGNhbWVsY2FzZVxuICBkb2N1bWVudGF0aW9uX3VybDogc3RyaW5nO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFNBQVMsUUFBUSxRQUFrQixpQkFBaUI7QUFDcEQsU0FBUyxJQUFJLEVBQUUsVUFBVSxRQUFRLGdCQUFnQjtBQWFqRCxPQUFPLE1BQU0sdUJBQXVCO0VBQ2xDLE9BQU8sU0FBUztFQUNDLGdCQUFnQixzQkFBc0I7RUFDdEMsY0FBYyxxQ0FBcUM7RUFDbkQsU0FBUyxnQ0FBZ0M7RUFDekMsZUFBdUI7RUFDdkIsYUFBdUI7RUFDdkIsWUFBcUI7RUFFdEMsWUFBWSxFQUFFLFVBQVUsRUFBRSxXQUFXLElBQUksRUFBRSxLQUFLLEVBQXlCLENBQUU7SUFDekUsS0FBSztJQUNMLElBQUksQ0FBQyxjQUFjLEdBQUc7SUFDdEIsSUFBSSxDQUFDLFlBQVksR0FBRztJQUNwQixJQUFJLENBQUMsV0FBVyxHQUFHO0VBQ3JCO0VBRUEsTUFBTSxZQUNKLEtBQWEsRUFDWTtJQUN6QixNQUFNLENBQUMsTUFBTSxTQUFTLEdBQUcsTUFBTSxRQUFRLEdBQUcsQ0FBQztNQUN6QyxJQUFJLENBQUMsUUFBUSxDQUF5QjtNQUN0QyxJQUFJLENBQUMsUUFBUSxDQUE4QztLQUM1RDtJQUVELE1BQU0sV0FBVyxLQUNk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