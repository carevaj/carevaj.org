import { Command } from "../command.ts";
import { dim, italic } from "../deps.ts";
import { BashCompletionsGenerator } from "./_bash_completions_generator.ts";
/** Generates bash completions script. */ export class BashCompletionsCommand extends Command {
  #cmd;
  constructor(cmd){
    super();
    this.#cmd = cmd;
    return this.description(()=>{
      const baseCmd = this.#cmd || this.getMainCommand();
      return `Generate shell completions for bash.

To enable bash completions for this program add following line to your ${dim(italic("~/.bashrc"))}:

    ${dim(italic(`source <(${baseCmd.getPath()} completions bash)`))}`;
    }).noGlobals().action(()=>{
      const baseCmd = this.#cmd || this.getMainCommand();
      console.log(BashCompletionsGenerator.generate(baseCmd));
    });
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvY2xpZmZ5QHYwLjI1LjcvY29tbWFuZC9jb21wbGV0aW9ucy9iYXNoLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENvbW1hbmQgfSBmcm9tIFwiLi4vY29tbWFuZC50c1wiO1xuaW1wb3J0IHsgZGltLCBpdGFsaWMgfSBmcm9tIFwiLi4vZGVwcy50c1wiO1xuaW1wb3J0IHsgQmFzaENvbXBsZXRpb25zR2VuZXJhdG9yIH0gZnJvbSBcIi4vX2Jhc2hfY29tcGxldGlvbnNfZ2VuZXJhdG9yLnRzXCI7XG5cbi8qKiBHZW5lcmF0ZXMgYmFzaCBjb21wbGV0aW9ucyBzY3JpcHQuICovXG5leHBvcnQgY2xhc3MgQmFzaENvbXBsZXRpb25zQ29tbWFuZCBleHRlbmRzIENvbW1hbmQge1xuICAjY21kPzogQ29tbWFuZDtcbiAgcHVibGljIGNvbnN0cnVjdG9yKGNtZD86IENvbW1hbmQpIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMuI2NtZCA9IGNtZDtcbiAgICByZXR1cm4gdGhpc1xuICAgICAgLmRlc2NyaXB0aW9uKCgpID0+IHtcbiAgICAgICAgY29uc3QgYmFzZUNtZCA9IHRoaXMuI2NtZCB8fCB0aGlzLmdldE1haW5Db21tYW5kKCk7XG4gICAgICAgIHJldHVybiBgR2VuZXJhdGUgc2hlbGwgY29tcGxldGlvbnMgZm9yIGJhc2guXG5cblRvIGVuYWJsZSBiYXNoIGNvbXBsZXRpb25zIGZvciB0aGlzIHByb2dyYW0gYWRkIGZvbGxvd2luZyBsaW5lIHRvIHlvdXIgJHtcbiAgICAgICAgICBkaW0oaXRhbGljKFwifi8uYmFzaHJjXCIpKVxuICAgICAgICB9OlxuXG4gICAgJHtkaW0oaXRhbGljKGBzb3VyY2UgPCgke2Jhc2VDbWQuZ2V0UGF0aCgpfSBjb21wbGV0aW9ucyBiYXNoKWApKX1gO1xuICAgICAgfSlcbiAgICAgIC5ub0dsb2JhbHMoKVxuICAgICAgLmFjdGlvbigoKSA9PiB7XG4gICAgICAgIGNvbnN0IGJhc2VDbWQgPSB0aGlzLiNjbWQgfHwgdGhpcy5nZXRNYWluQ29tbWFuZCgpO1xuICAgICAgICBjb25zb2xlLmxvZyhCYXNoQ29tcGxldGlvbnNHZW5lcmF0b3IuZ2VuZXJhdGUoYmFzZUNtZCkpO1xuICAgICAgfSk7XG4gIH1cbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxTQUFTLE9BQU8sUUFBUSxnQkFBZ0I7QUFDeEMsU0FBUyxHQUFHLEVBQUUsTUFBTSxRQUFRLGFBQWE7QUFDekMsU0FBUyx3QkFBd0IsUUFBUSxtQ0FBbUM7QUFFNUUsdUNBQXVDLEdBQ3ZDLE9BQU8sTUFBTSwrQkFBK0I7RUFDMUMsQ0FBQyxHQUFHLENBQVc7RUFDZixZQUFtQixHQUFhLENBQUU7SUFDaEMsS0FBSztJQUNMLElBQUksQ0FBQyxDQUFDLEdBQUcsR0FBRztJQUNaLE9BQU8sSUFBSSxDQUNSLFdBQVcsQ0FBQztNQUNYLE1BQU0sVUFBVSxJQUFJLENBQUMsQ0FBQyxHQUFHLElBQUksSUFBSSxDQUFDLGNBQWM7TUFDaEQsT0FBTyxDQUFDOzt1RUFFdUQsRUFDN0QsSUFBSSxPQUFPLGNBQ1o7O0lBRUwsRUFBRSxJQUFJLE9BQU8sQ0FBQyxTQUFTLEVBQUUsUUFBUSxPQUFPLEdBQUcsa0JBQWtCLENBQUMsR0FBRyxDQUFDO0lBQ2hFLEdBQ0MsU0FBUyxHQUNULE1BQU0sQ0FBQztNQUNOLE1BQU0sVUFBVSxJQUFJLENBQUMsQ0FBQyxHQUFHLElBQUksSUFBSSxDQUFDLGNBQWM7TUFDaEQsUUFBUSxHQUFHLENBQUMseUJBQXlCLFFBQVEsQ0FBQztJQUNoRDtFQUNKO0FBQ0YifQ==