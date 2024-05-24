import { Provider } from "../provider.ts";
export class DenoLandProvider extends Provider {
  name = "deno.land";
  repositoryUrl = "https://deno.land/x/";
  registryUrl = "https://deno.land/x/";
  moduleName;
  constructor({ name } = {}){
    super();
    this.moduleName = name;
  }
  async getVersions(name) {
    const response = await fetch(`https://cdn.deno.land/${this.moduleName ?? name}/meta/versions.json`);
    if (!response.ok) {
      throw new Error("couldn't fetch the latest version - try again after sometime");
    }
    return await response.json();
  }
  getRepositoryUrl(name) {
    return new URL(`${this.moduleName ?? name}/`, this.repositoryUrl).href;
  }
  getRegistryUrl(name, version) {
    return new URL(`${this.moduleName ?? name}@${version}/`, this.registryUrl).href;
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvY2xpZmZ5QHYwLjI1LjcvY29tbWFuZC91cGdyYWRlL3Byb3ZpZGVyL2Rlbm9fbGFuZC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBQcm92aWRlciwgVmVyc2lvbnMgfSBmcm9tIFwiLi4vcHJvdmlkZXIudHNcIjtcblxuZXhwb3J0IGludGVyZmFjZSBEZW5vTGFuZFByb3ZpZGVyT3B0aW9ucyB7XG4gIG5hbWU/OiBzdHJpbmc7XG59XG5cbmV4cG9ydCBjbGFzcyBEZW5vTGFuZFByb3ZpZGVyIGV4dGVuZHMgUHJvdmlkZXIge1xuICBuYW1lID0gXCJkZW5vLmxhbmRcIjtcbiAgcHJpdmF0ZSByZWFkb25seSByZXBvc2l0b3J5VXJsID0gXCJodHRwczovL2Rlbm8ubGFuZC94L1wiO1xuICBwcml2YXRlIHJlYWRvbmx5IHJlZ2lzdHJ5VXJsID0gXCJodHRwczovL2Rlbm8ubGFuZC94L1wiO1xuICBwcml2YXRlIHJlYWRvbmx5IG1vZHVsZU5hbWU/OiBzdHJpbmc7XG5cbiAgY29uc3RydWN0b3IoeyBuYW1lIH06IERlbm9MYW5kUHJvdmlkZXJPcHRpb25zID0ge30pIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMubW9kdWxlTmFtZSA9IG5hbWU7XG4gIH1cblxuICBhc3luYyBnZXRWZXJzaW9ucyhcbiAgICBuYW1lOiBzdHJpbmcsXG4gICk6IFByb21pc2U8VmVyc2lvbnM+IHtcbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoKFxuICAgICAgYGh0dHBzOi8vY2RuLmRlbm8ubGFuZC8ke3RoaXMubW9kdWxlTmFtZSA/PyBuYW1lfS9tZXRhL3ZlcnNpb25zLmpzb25gLFxuICAgICk7XG4gICAgaWYgKCFyZXNwb25zZS5vaykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICBcImNvdWxkbid0IGZldGNoIHRoZSBsYXRlc3QgdmVyc2lvbiAtIHRyeSBhZ2FpbiBhZnRlciBzb21ldGltZVwiLFxuICAgICAgKTtcbiAgICB9XG5cbiAgICByZXR1cm4gYXdhaXQgcmVzcG9uc2UuanNvbigpO1xuICB9XG5cbiAgZ2V0UmVwb3NpdG9yeVVybChuYW1lOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIHJldHVybiBuZXcgVVJMKGAke3RoaXMubW9kdWxlTmFtZSA/PyBuYW1lfS9gLCB0aGlzLnJlcG9zaXRvcnlVcmwpLmhyZWY7XG4gIH1cblxuICBnZXRSZWdpc3RyeVVybChuYW1lOiBzdHJpbmcsIHZlcnNpb246IHN0cmluZyk6IHN0cmluZyB7XG4gICAgcmV0dXJuIG5ldyBVUkwoYCR7dGhpcy5tb2R1bGVOYW1lID8/IG5hbWV9QCR7dmVyc2lvbn0vYCwgdGhpcy5yZWdpc3RyeVVybClcbiAgICAgIC5ocmVmO1xuICB9XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsU0FBUyxRQUFRLFFBQWtCLGlCQUFpQjtBQU1wRCxPQUFPLE1BQU0seUJBQXlCO0VBQ3BDLE9BQU8sWUFBWTtFQUNGLGdCQUFnQix1QkFBdUI7RUFDdkMsY0FBYyx1QkFBdUI7RUFDckMsV0FBb0I7RUFFckMsWUFBWSxFQUFFLElBQUksRUFBMkIsR0FBRyxDQUFDLENBQUMsQ0FBRTtJQUNsRCxLQUFLO0lBQ0wsSUFBSSxDQUFDLFVBQVUsR0FBRztFQUNwQjtFQUVBLE1BQU0sWUFDSixJQUFZLEVBQ087SUFDbkIsTUFBTSxXQUFXLE1BQU0sTUFDckIsQ0FBQyxzQkFBc0IsRUFBRSxJQUFJLENBQUMsVUFBVSxJQUFJLEtBQUssbUJBQW1CLENBQUM7SUFFdkUsSUFBSSxDQUFDLFNBQVMsRUFBRSxFQUFFO01BQ2hCLE1BQU0sSUFBSSxNQUNSO0lBRUo7SUFFQSxPQUFPLE1BQU0sU0FBUyxJQUFJO0VBQzVCO0VBRUEsaUJBQWlCLElBQVksRUFBVTtJQUNyQyxPQUFPLElBQUksSUFBSSxDQUFDLEVBQUUsSUFBSSxDQUFDLFVBQVUsSUFBSSxLQUFLLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxhQUFhLEVBQUUsSUFBSTtFQUN4RTtFQUVBLGVBQWUsSUFBWSxFQUFFLE9BQWUsRUFBVTtJQUNwRCxPQUFPLElBQUksSUFBSSxDQUFDLEVBQUUsSUFBSSxDQUFDLFVBQVUsSUFBSSxLQUFLLENBQUMsRUFBRSxRQUFRLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxXQUFXLEVBQ3RFLElBQUk7RUFDVDtBQUNGIn0=