import { Command } from "../command.ts";
import { dim, italic } from "../deps.ts";
import { FishCompletionsGenerator } from "./_fish_completions_generator.ts";
/** Generates fish completions script. */ export class FishCompletionsCommand extends Command {
  #cmd;
  constructor(cmd){
    super();
    this.#cmd = cmd;
    return this.description(()=>{
      const baseCmd = this.#cmd || this.getMainCommand();
      return `Generate shell completions for fish.

To enable fish completions for this program add following line to your ${dim(italic("~/.config/fish/config.fish"))}:

    ${dim(italic(`source (${baseCmd.getPath()} completions fish | psub)`))}`;
    }).noGlobals().action(()=>{
      const baseCmd = this.#cmd || this.getMainCommand();
      console.log(FishCompletionsGenerator.generate(baseCmd));
    });
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvY2xpZmZ5QHYwLjI1LjcvY29tbWFuZC9jb21wbGV0aW9ucy9maXNoLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENvbW1hbmQgfSBmcm9tIFwiLi4vY29tbWFuZC50c1wiO1xuaW1wb3J0IHsgZGltLCBpdGFsaWMgfSBmcm9tIFwiLi4vZGVwcy50c1wiO1xuaW1wb3J0IHsgRmlzaENvbXBsZXRpb25zR2VuZXJhdG9yIH0gZnJvbSBcIi4vX2Zpc2hfY29tcGxldGlvbnNfZ2VuZXJhdG9yLnRzXCI7XG5cbi8qKiBHZW5lcmF0ZXMgZmlzaCBjb21wbGV0aW9ucyBzY3JpcHQuICovXG5leHBvcnQgY2xhc3MgRmlzaENvbXBsZXRpb25zQ29tbWFuZCBleHRlbmRzIENvbW1hbmQge1xuICAjY21kPzogQ29tbWFuZDtcbiAgcHVibGljIGNvbnN0cnVjdG9yKGNtZD86IENvbW1hbmQpIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMuI2NtZCA9IGNtZDtcbiAgICByZXR1cm4gdGhpc1xuICAgICAgLmRlc2NyaXB0aW9uKCgpID0+IHtcbiAgICAgICAgY29uc3QgYmFzZUNtZCA9IHRoaXMuI2NtZCB8fCB0aGlzLmdldE1haW5Db21tYW5kKCk7XG4gICAgICAgIHJldHVybiBgR2VuZXJhdGUgc2hlbGwgY29tcGxldGlvbnMgZm9yIGZpc2guXG5cblRvIGVuYWJsZSBmaXNoIGNvbXBsZXRpb25zIGZvciB0aGlzIHByb2dyYW0gYWRkIGZvbGxvd2luZyBsaW5lIHRvIHlvdXIgJHtcbiAgICAgICAgICBkaW0oaXRhbGljKFwifi8uY29uZmlnL2Zpc2gvY29uZmlnLmZpc2hcIikpXG4gICAgICAgIH06XG5cbiAgICAke2RpbShpdGFsaWMoYHNvdXJjZSAoJHtiYXNlQ21kLmdldFBhdGgoKX0gY29tcGxldGlvbnMgZmlzaCB8IHBzdWIpYCkpfWA7XG4gICAgICB9KVxuICAgICAgLm5vR2xvYmFscygpXG4gICAgICAuYWN0aW9uKCgpID0+IHtcbiAgICAgICAgY29uc3QgYmFzZUNtZCA9IHRoaXMuI2NtZCB8fCB0aGlzLmdldE1haW5Db21tYW5kKCk7XG4gICAgICAgIGNvbnNvbGUubG9nKEZpc2hDb21wbGV0aW9uc0dlbmVyYXRvci5nZW5lcmF0ZShiYXNlQ21kKSk7XG4gICAgICB9KTtcbiAgfVxufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFNBQVMsT0FBTyxRQUFRLGdCQUFnQjtBQUN4QyxTQUFTLEdBQUcsRUFBRSxNQUFNLFFBQVEsYUFBYTtBQUN6QyxTQUFTLHdCQUF3QixRQUFRLG1DQUFtQztBQUU1RSx1Q0FBdUMsR0FDdkMsT0FBTyxNQUFNLCtCQUErQjtFQUMxQyxDQUFDLEdBQUcsQ0FBVztFQUNmLFlBQW1CLEdBQWEsQ0FBRTtJQUNoQyxLQUFLO0lBQ0wsSUFBSSxDQUFDLENBQUMsR0FBRyxHQUFHO0lBQ1osT0FBTyxJQUFJLENBQ1IsV0FBVyxDQUFDO01BQ1gsTUFBTSxVQUFVLElBQUksQ0FBQyxDQUFDLEdBQUcsSUFBSSxJQUFJLENBQUMsY0FBYztNQUNoRCxPQUFPLENBQUM7O3VFQUV1RCxFQUM3RCxJQUFJLE9BQU8sK0JBQ1o7O0lBRUwsRUFBRSxJQUFJLE9BQU8sQ0FBQyxRQUFRLEVBQUUsUUFBUSxPQUFPLEdBQUcseUJBQXlCLENBQUMsR0FBRyxDQUFDO0lBQ3RFLEdBQ0MsU0FBUyxHQUNULE1BQU0sQ0FBQztNQUNOLE1BQU0sVUFBVSxJQUFJLENBQUMsQ0FBQyxHQUFHLElBQUksSUFBSSxDQUFDLGNBQWM7TUFDaEQsUUFBUSxHQUFHLENBQUMseUJBQXlCLFFBQVEsQ0FBQztJQUNoRDtFQUNKO0FBQ0YifQ==