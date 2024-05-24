import { Command } from "../command.ts";
import { UnknownCommandError } from "../_errors.ts";
import { CommandType } from "../types/command.ts";
/** Generates well formatted and colored help output for specified command. */ export class HelpCommand extends Command {
  constructor(cmd){
    super();
    return this.type("command", new CommandType()).arguments("[command:command]").description("Show this help or the help of a sub-command.").noGlobals().action(async (_, name)=>{
      if (!cmd) {
        cmd = name ? this.getGlobalParent()?.getBaseCommand(name) : this.getGlobalParent();
      }
      if (!cmd) {
        const cmds = this.getGlobalParent()?.getCommands();
        throw new UnknownCommandError(name ?? "", cmds ?? [], [
          this.getName(),
          ...this.getAliases()
        ]);
      }
      await cmd.checkVersion();
      cmd.showHelp();
      if (this.shouldExit()) {
        Deno.exit(0);
      }
    });
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvY2xpZmZ5QHYwLjI1LjcvY29tbWFuZC9oZWxwL21vZC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDb21tYW5kIH0gZnJvbSBcIi4uL2NvbW1hbmQudHNcIjtcbmltcG9ydCB7IFVua25vd25Db21tYW5kRXJyb3IgfSBmcm9tIFwiLi4vX2Vycm9ycy50c1wiO1xuaW1wb3J0IHsgQ29tbWFuZFR5cGUgfSBmcm9tIFwiLi4vdHlwZXMvY29tbWFuZC50c1wiO1xuXG4vKiogR2VuZXJhdGVzIHdlbGwgZm9ybWF0dGVkIGFuZCBjb2xvcmVkIGhlbHAgb3V0cHV0IGZvciBzcGVjaWZpZWQgY29tbWFuZC4gKi9cbmV4cG9ydCBjbGFzcyBIZWxwQ29tbWFuZFxuICBleHRlbmRzIENvbW1hbmQ8dm9pZCwgdm9pZCwgdm9pZCwgW2NvbW1hbmROYW1lPzogQ29tbWFuZFR5cGVdPiB7XG4gIHB1YmxpYyBjb25zdHJ1Y3RvcihjbWQ/OiBDb21tYW5kKSB7XG4gICAgc3VwZXIoKTtcbiAgICByZXR1cm4gdGhpc1xuICAgICAgLnR5cGUoXCJjb21tYW5kXCIsIG5ldyBDb21tYW5kVHlwZSgpKVxuICAgICAgLmFyZ3VtZW50cyhcIltjb21tYW5kOmNvbW1hbmRdXCIpXG4gICAgICAuZGVzY3JpcHRpb24oXCJTaG93IHRoaXMgaGVscCBvciB0aGUgaGVscCBvZiBhIHN1Yi1jb21tYW5kLlwiKVxuICAgICAgLm5vR2xvYmFscygpXG4gICAgICAuYWN0aW9uKGFzeW5jIChfLCBuYW1lPzogc3RyaW5nKSA9PiB7XG4gICAgICAgIGlmICghY21kKSB7XG4gICAgICAgICAgY21kID0gbmFtZVxuICAgICAgICAgICAgPyB0aGlzLmdldEdsb2JhbFBhcmVudCgpPy5nZXRCYXNlQ29tbWFuZChuYW1lKVxuICAgICAgICAgICAgOiB0aGlzLmdldEdsb2JhbFBhcmVudCgpO1xuICAgICAgICB9XG4gICAgICAgIGlmICghY21kKSB7XG4gICAgICAgICAgY29uc3QgY21kcyA9IHRoaXMuZ2V0R2xvYmFsUGFyZW50KCk/LmdldENvbW1hbmRzKCk7XG4gICAgICAgICAgdGhyb3cgbmV3IFVua25vd25Db21tYW5kRXJyb3IobmFtZSA/PyBcIlwiLCBjbWRzID8/IFtdLCBbXG4gICAgICAgICAgICB0aGlzLmdldE5hbWUoKSxcbiAgICAgICAgICAgIC4uLnRoaXMuZ2V0QWxpYXNlcygpLFxuICAgICAgICAgIF0pO1xuICAgICAgICB9XG4gICAgICAgIGF3YWl0IGNtZC5jaGVja1ZlcnNpb24oKTtcbiAgICAgICAgY21kLnNob3dIZWxwKCk7XG4gICAgICAgIGlmICh0aGlzLnNob3VsZEV4aXQoKSkge1xuICAgICAgICAgIERlbm8uZXhpdCgwKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gIH1cbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxTQUFTLE9BQU8sUUFBUSxnQkFBZ0I7QUFDeEMsU0FBUyxtQkFBbUIsUUFBUSxnQkFBZ0I7QUFDcEQsU0FBUyxXQUFXLFFBQVEsc0JBQXNCO0FBRWxELDRFQUE0RSxHQUM1RSxPQUFPLE1BQU0sb0JBQ0g7RUFDUixZQUFtQixHQUFhLENBQUU7SUFDaEMsS0FBSztJQUNMLE9BQU8sSUFBSSxDQUNSLElBQUksQ0FBQyxXQUFXLElBQUksZUFDcEIsU0FBUyxDQUFDLHFCQUNWLFdBQVcsQ0FBQyxnREFDWixTQUFTLEdBQ1QsTUFBTSxDQUFDLE9BQU8sR0FBRztNQUNoQixJQUFJLENBQUMsS0FBSztRQUNSLE1BQU0sT0FDRixJQUFJLENBQUMsZUFBZSxJQUFJLGVBQWUsUUFDdkMsSUFBSSxDQUFDLGVBQWU7TUFDMUI7TUFDQSxJQUFJLENBQUMsS0FBSztRQUNSLE1BQU0sT0FBTyxJQUFJLENBQUMsZUFBZSxJQUFJO1FBQ3JDLE1BQU0sSUFBSSxvQkFBb0IsUUFBUSxJQUFJLFFBQVEsRUFBRSxFQUFFO1VBQ3BELElBQUksQ0FBQyxPQUFPO2FBQ1QsSUFBSSxDQUFDLFVBQVU7U0FDbkI7TUFDSDtNQUNBLE1BQU0sSUFBSSxZQUFZO01BQ3RCLElBQUksUUFBUTtNQUNaLElBQUksSUFBSSxDQUFDLFVBQVUsSUFBSTtRQUNyQixLQUFLLElBQUksQ0FBQztNQUNaO0lBQ0Y7RUFDSjtBQUNGIn0=