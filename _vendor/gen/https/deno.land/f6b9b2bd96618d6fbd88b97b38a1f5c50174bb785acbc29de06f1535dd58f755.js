import { Provider } from "../provider.ts";
export class NestLandProvider extends Provider {
  name = "nest.land";
  repositoryUrl = "https://nest.land/package/";
  registryUrl = "https://x.nest.land/";
  moduleName;
  constructor({ name } = {}){
    super();
    this.moduleName = name;
  }
  async getVersions(name) {
    const response = await fetch(`https://nest.land/api/package-client`, {
      method: "post",
      body: JSON.stringify({
        data: {
          name: this.moduleName ?? name
        }
      }),
      headers: {
        "Content-Type": "application/json"
      }
    });
    if (!response.ok) {
      throw new Error("couldn't fetch the latest version - try again after sometime");
    }
    const { body: { latestVersion, packageUploadNames } } = await response.json();
    return {
      latest: latestVersion,
      versions: packageUploadNames.map((version)=>version.replace(new RegExp(`^${this.moduleName ?? name}@`), "")).reverse()
    };
  }
  getRepositoryUrl(name) {
    return new URL(`${this.moduleName ?? name}/`, this.repositoryUrl).href;
  }
  getRegistryUrl(name, version) {
    return new URL(`${this.moduleName ?? name}@${version}/`, this.registryUrl).href;
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvY2xpZmZ5QHYwLjI1LjcvY29tbWFuZC91cGdyYWRlL3Byb3ZpZGVyL25lc3RfbGFuZC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBQcm92aWRlciwgVmVyc2lvbnMgfSBmcm9tIFwiLi4vcHJvdmlkZXIudHNcIjtcblxuZXhwb3J0IGludGVyZmFjZSBOZXN0TGFuZFByb3ZpZGVyT3B0aW9ucyB7XG4gIG5hbWU/OiBzdHJpbmc7XG59XG5cbmV4cG9ydCBjbGFzcyBOZXN0TGFuZFByb3ZpZGVyIGV4dGVuZHMgUHJvdmlkZXIge1xuICBuYW1lID0gXCJuZXN0LmxhbmRcIjtcbiAgcHJpdmF0ZSByZWFkb25seSByZXBvc2l0b3J5VXJsID0gXCJodHRwczovL25lc3QubGFuZC9wYWNrYWdlL1wiO1xuICBwcml2YXRlIHJlYWRvbmx5IHJlZ2lzdHJ5VXJsID0gXCJodHRwczovL3gubmVzdC5sYW5kL1wiO1xuICBwcml2YXRlIHJlYWRvbmx5IG1vZHVsZU5hbWU/OiBzdHJpbmc7XG5cbiAgY29uc3RydWN0b3IoeyBuYW1lIH06IE5lc3RMYW5kUHJvdmlkZXJPcHRpb25zID0ge30pIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMubW9kdWxlTmFtZSA9IG5hbWU7XG4gIH1cblxuICBhc3luYyBnZXRWZXJzaW9ucyhcbiAgICBuYW1lOiBzdHJpbmcsXG4gICk6IFByb21pc2U8VmVyc2lvbnM+IHtcbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoKGBodHRwczovL25lc3QubGFuZC9hcGkvcGFja2FnZS1jbGllbnRgLCB7XG4gICAgICBtZXRob2Q6IFwicG9zdFwiLFxuICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBkYXRhOiB7IG5hbWU6IHRoaXMubW9kdWxlTmFtZSA/PyBuYW1lIH0gfSksXG4gICAgICBoZWFkZXJzOiB7IFwiQ29udGVudC1UeXBlXCI6IFwiYXBwbGljYXRpb24vanNvblwiIH0sXG4gICAgfSk7XG4gICAgaWYgKCFyZXNwb25zZS5vaykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICBcImNvdWxkbid0IGZldGNoIHRoZSBsYXRlc3QgdmVyc2lvbiAtIHRyeSBhZ2FpbiBhZnRlciBzb21ldGltZVwiLFxuICAgICAgKTtcbiAgICB9XG5cbiAgICBjb25zdCB7IGJvZHk6IHsgbGF0ZXN0VmVyc2lvbiwgcGFja2FnZVVwbG9hZE5hbWVzIH0gfSA9IGF3YWl0IHJlc3BvbnNlXG4gICAgICAuanNvbigpO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIGxhdGVzdDogbGF0ZXN0VmVyc2lvbixcbiAgICAgIHZlcnNpb25zOiBwYWNrYWdlVXBsb2FkTmFtZXMubWFwKFxuICAgICAgICAodmVyc2lvbjogc3RyaW5nKSA9PlxuICAgICAgICAgIHZlcnNpb24ucmVwbGFjZShuZXcgUmVnRXhwKGBeJHt0aGlzLm1vZHVsZU5hbWUgPz8gbmFtZX1AYCksIFwiXCIpLFxuICAgICAgKS5yZXZlcnNlKCksXG4gICAgfTtcbiAgfVxuXG4gIGdldFJlcG9zaXRvcnlVcmwobmFtZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgICByZXR1cm4gbmV3IFVSTChgJHt0aGlzLm1vZHVsZU5hbWUgPz8gbmFtZX0vYCwgdGhpcy5yZXBvc2l0b3J5VXJsKS5ocmVmO1xuICB9XG5cbiAgZ2V0UmVnaXN0cnlVcmwobmFtZTogc3RyaW5nLCB2ZXJzaW9uOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIHJldHVybiBuZXcgVVJMKGAke3RoaXMubW9kdWxlTmFtZSA/PyBuYW1lfUAke3ZlcnNpb259L2AsIHRoaXMucmVnaXN0cnlVcmwpXG4gICAgICAuaHJlZjtcbiAgfVxufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFNBQVMsUUFBUSxRQUFrQixpQkFBaUI7QUFNcEQsT0FBTyxNQUFNLHlCQUF5QjtFQUNwQyxPQUFPLFlBQVk7RUFDRixnQkFBZ0IsNkJBQTZCO0VBQzdDLGNBQWMsdUJBQXVCO0VBQ3JDLFdBQW9CO0VBRXJDLFlBQVksRUFBRSxJQUFJLEVBQTJCLEdBQUcsQ0FBQyxDQUFDLENBQUU7SUFDbEQsS0FBSztJQUNMLElBQUksQ0FBQyxVQUFVLEdBQUc7RUFDcEI7RUFFQSxNQUFNLFlBQ0osSUFBWSxFQUNPO0lBQ25CLE1BQU0sV0FBVyxNQUFNLE1BQU0sQ0FBQyxvQ0FBb0MsQ0FBQyxFQUFFO01BQ25FLFFBQVE7TUFDUixNQUFNLEtBQUssU0FBUyxDQUFDO1FBQUUsTUFBTTtVQUFFLE1BQU0sSUFBSSxDQUFDLFVBQVUsSUFBSTtRQUFLO01BQUU7TUFDL0QsU0FBUztRQUFFLGdCQUFnQjtNQUFtQjtJQUNoRDtJQUNBLElBQUksQ0FBQyxTQUFTLEVBQUUsRUFBRTtNQUNoQixNQUFNLElBQUksTUFDUjtJQUVKO0lBRUEsTUFBTSxFQUFFLE1BQU0sRUFBRSxhQUFhLEVBQUUsa0JBQWtCLEVBQUUsRUFBRSxHQUFHLE1BQU0sU0FDM0QsSUFBSTtJQUVQLE9BQU87TUFDTCxRQUFRO01BQ1IsVUFBVSxtQkFBbUIsR0FBRyxDQUM5QixDQUFDLFVBQ0MsUUFBUSxPQUFPLENBQUMsSUFBSSxPQUFPLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxVQUFVLElBQUksS0FBSyxDQUFDLENBQUMsR0FBRyxLQUM5RCxPQUFPO0lBQ1g7RUFDRjtFQUVBLGlCQUFpQixJQUFZLEVBQVU7SUFDckMsT0FBTyxJQUFJLElBQUksQ0FBQyxFQUFFLElBQUksQ0FBQyxVQUFVLElBQUksS0FBSyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsYUFBYSxFQUFFLElBQUk7RUFDeEU7RUFFQSxlQUFlLElBQVksRUFBRSxPQUFlLEVBQVU7SUFDcEQsT0FBTyxJQUFJLElBQUksQ0FBQyxFQUFFLElBQUksQ0FBQyxVQUFVLElBQUksS0FBSyxDQUFDLEVBQUUsUUFBUSxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsV0FBVyxFQUN0RSxJQUFJO0VBQ1Q7QUFDRiJ9