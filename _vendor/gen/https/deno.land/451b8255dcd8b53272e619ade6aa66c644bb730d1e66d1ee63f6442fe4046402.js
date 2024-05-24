import { getDescription } from "../_utils.ts";
import { FileType } from "../types/file.ts";
/** Fish completions generator. */ export class FishCompletionsGenerator {
  cmd;
  /** Generates fish completions script for given command. */ static generate(cmd) {
    return new FishCompletionsGenerator(cmd).generate();
  }
  constructor(cmd){
    this.cmd = cmd;
  }
  /** Generates fish completions script. */ generate() {
    const path = this.cmd.getPath();
    const version = this.cmd.getVersion() ? ` v${this.cmd.getVersion()}` : "";
    return `#!/usr/bin/env fish
# fish completion support for ${path}${version}

function __fish_${replaceSpecialChars(this.cmd.getName())}_using_command
  set -l cmds ${getCommandFnNames(this.cmd).join(" ")}
  set -l words (commandline -opc)
  set -l cmd "_"
  for word in $words
    switch $word
      case '-*'
        continue
      case '*'
        set word (string replace -r -a '\\W' '_' $word)
        set -l cmd_tmp $cmd"_$word"
        if contains $cmd_tmp $cmds
          set cmd $cmd_tmp
        end
    end
  end
  if test "$cmd" = "$argv[1]"
    return 0
  end
  return 1
end

${this.generateCompletions(this.cmd).trim()}`;
  }
  generateCompletions(command) {
    const parent = command.getParent();
    let result = ``;
    if (parent) {
      // command
      result += "\n" + this.complete(parent, {
        description: command.getShortDescription(),
        arguments: command.getName()
      });
    }
    // arguments
    const commandArgs = command.getArguments();
    if (commandArgs.length) {
      result += "\n" + this.complete(command, {
        arguments: commandArgs.length ? this.getCompletionCommand(command, commandArgs[0]) : undefined
      });
    }
    // options
    for (const option of command.getOptions(false)){
      result += "\n" + this.completeOption(command, option);
    }
    for (const subCommand of command.getCommands(false)){
      result += this.generateCompletions(subCommand);
    }
    return result;
  }
  completeOption(command, option) {
    const shortOption = option.flags.find((flag)=>flag.length === 2)?.replace(/^(-)+/, "");
    const longOption = option.flags.find((flag)=>flag.length > 2)?.replace(/^(-)+/, "");
    return this.complete(command, {
      description: getDescription(option.description),
      shortOption: shortOption,
      longOption: longOption,
      // required: option.requiredValue,
      required: true,
      standalone: option.standalone,
      arguments: option.args.length ? this.getCompletionCommand(command, option.args[0]) : undefined
    });
  }
  complete(command, options) {
    const cmd = [
      "complete"
    ];
    cmd.push("-c", this.cmd.getName());
    cmd.push("-n", `'__fish_${replaceSpecialChars(this.cmd.getName())}_using_command __${replaceSpecialChars(command.getPath())}'`);
    options.shortOption && cmd.push("-s", options.shortOption);
    options.longOption && cmd.push("-l", options.longOption);
    options.standalone && cmd.push("-x");
    cmd.push("-k");
    cmd.push("-f");
    if (options.arguments) {
      options.required && cmd.push("-r");
      cmd.push("-a", options.arguments);
    }
    if (options.description) {
      const description = getDescription(options.description, true)// escape single quotes
      .replace(/'/g, "\\'");
      cmd.push("-d", `'${description}'`);
    }
    return cmd.join(" ");
  }
  getCompletionCommand(cmd, arg) {
    const type = cmd.getType(arg.type);
    if (type && type.handler instanceof FileType) {
      return `'(__fish_complete_path)'`;
    }
    return `'(${this.cmd.getName()} completions complete ${arg.action + " " + getCompletionsPath(cmd)})'`;
  }
}
function getCommandFnNames(cmd, cmds = []) {
  cmds.push(`__${replaceSpecialChars(cmd.getPath())}`);
  cmd.getCommands(false).forEach((command)=>{
    getCommandFnNames(command, cmds);
  });
  return cmds;
}
function getCompletionsPath(command) {
  return command.getPath().split(" ").slice(1).join(" ");
}
function replaceSpecialChars(str) {
  return str.replace(/[^a-zA-Z0-9]/g, "_");
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvY2xpZmZ5QHYwLjI1LjcvY29tbWFuZC9jb21wbGV0aW9ucy9fZmlzaF9jb21wbGV0aW9uc19nZW5lcmF0b3IudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgZ2V0RGVzY3JpcHRpb24gfSBmcm9tIFwiLi4vX3V0aWxzLnRzXCI7XG5pbXBvcnQgdHlwZSB7IENvbW1hbmQgfSBmcm9tIFwiLi4vY29tbWFuZC50c1wiO1xuaW1wb3J0IHR5cGUgeyBBcmd1bWVudCwgT3B0aW9uIH0gZnJvbSBcIi4uL3R5cGVzLnRzXCI7XG5pbXBvcnQgeyBGaWxlVHlwZSB9IGZyb20gXCIuLi90eXBlcy9maWxlLnRzXCI7XG5cbi8qKiBHZW5lcmF0ZXMgZmlzaCBjb21wbGV0aW9ucyBzY3JpcHQuICovXG5pbnRlcmZhY2UgQ29tcGxldGVPcHRpb25zIHtcbiAgZGVzY3JpcHRpb24/OiBzdHJpbmc7XG4gIHNob3J0T3B0aW9uPzogc3RyaW5nO1xuICBsb25nT3B0aW9uPzogc3RyaW5nO1xuICByZXF1aXJlZD86IGJvb2xlYW47XG4gIHN0YW5kYWxvbmU/OiBib29sZWFuO1xuICBhcmd1bWVudHM/OiBzdHJpbmc7XG59XG5cbi8qKiBGaXNoIGNvbXBsZXRpb25zIGdlbmVyYXRvci4gKi9cbmV4cG9ydCBjbGFzcyBGaXNoQ29tcGxldGlvbnNHZW5lcmF0b3Ige1xuICAvKiogR2VuZXJhdGVzIGZpc2ggY29tcGxldGlvbnMgc2NyaXB0IGZvciBnaXZlbiBjb21tYW5kLiAqL1xuICBwdWJsaWMgc3RhdGljIGdlbmVyYXRlKGNtZDogQ29tbWFuZCkge1xuICAgIHJldHVybiBuZXcgRmlzaENvbXBsZXRpb25zR2VuZXJhdG9yKGNtZCkuZ2VuZXJhdGUoKTtcbiAgfVxuXG4gIHByaXZhdGUgY29uc3RydWN0b3IocHJvdGVjdGVkIGNtZDogQ29tbWFuZCkge31cblxuICAvKiogR2VuZXJhdGVzIGZpc2ggY29tcGxldGlvbnMgc2NyaXB0LiAqL1xuICBwcml2YXRlIGdlbmVyYXRlKCk6IHN0cmluZyB7XG4gICAgY29uc3QgcGF0aCA9IHRoaXMuY21kLmdldFBhdGgoKTtcbiAgICBjb25zdCB2ZXJzaW9uOiBzdHJpbmcgfCB1bmRlZmluZWQgPSB0aGlzLmNtZC5nZXRWZXJzaW9uKClcbiAgICAgID8gYCB2JHt0aGlzLmNtZC5nZXRWZXJzaW9uKCl9YFxuICAgICAgOiBcIlwiO1xuXG4gICAgcmV0dXJuIGAjIS91c3IvYmluL2VudiBmaXNoXG4jIGZpc2ggY29tcGxldGlvbiBzdXBwb3J0IGZvciAke3BhdGh9JHt2ZXJzaW9ufVxuXG5mdW5jdGlvbiBfX2Zpc2hfJHtyZXBsYWNlU3BlY2lhbENoYXJzKHRoaXMuY21kLmdldE5hbWUoKSl9X3VzaW5nX2NvbW1hbmRcbiAgc2V0IC1sIGNtZHMgJHtnZXRDb21tYW5kRm5OYW1lcyh0aGlzLmNtZCkuam9pbihcIiBcIil9XG4gIHNldCAtbCB3b3JkcyAoY29tbWFuZGxpbmUgLW9wYylcbiAgc2V0IC1sIGNtZCBcIl9cIlxuICBmb3Igd29yZCBpbiAkd29yZHNcbiAgICBzd2l0Y2ggJHdvcmRcbiAgICAgIGNhc2UgJy0qJ1xuICAgICAgICBjb250aW51ZVxuICAgICAgY2FzZSAnKidcbiAgICAgICAgc2V0IHdvcmQgKHN0cmluZyByZXBsYWNlIC1yIC1hICdcXFxcVycgJ18nICR3b3JkKVxuICAgICAgICBzZXQgLWwgY21kX3RtcCAkY21kXCJfJHdvcmRcIlxuICAgICAgICBpZiBjb250YWlucyAkY21kX3RtcCAkY21kc1xuICAgICAgICAgIHNldCBjbWQgJGNtZF90bXBcbiAgICAgICAgZW5kXG4gICAgZW5kXG4gIGVuZFxuICBpZiB0ZXN0IFwiJGNtZFwiID0gXCIkYXJndlsxXVwiXG4gICAgcmV0dXJuIDBcbiAgZW5kXG4gIHJldHVybiAxXG5lbmRcblxuJHt0aGlzLmdlbmVyYXRlQ29tcGxldGlvbnModGhpcy5jbWQpLnRyaW0oKX1gO1xuICB9XG5cbiAgcHJpdmF0ZSBnZW5lcmF0ZUNvbXBsZXRpb25zKGNvbW1hbmQ6IENvbW1hbmQpOiBzdHJpbmcge1xuICAgIGNvbnN0IHBhcmVudDogQ29tbWFuZCB8IHVuZGVmaW5lZCA9IGNvbW1hbmQuZ2V0UGFyZW50KCk7XG4gICAgbGV0IHJlc3VsdCA9IGBgO1xuXG4gICAgaWYgKHBhcmVudCkge1xuICAgICAgLy8gY29tbWFuZFxuICAgICAgcmVzdWx0ICs9IFwiXFxuXCIgKyB0aGlzLmNvbXBsZXRlKHBhcmVudCwge1xuICAgICAgICBkZXNjcmlwdGlvbjogY29tbWFuZC5nZXRTaG9ydERlc2NyaXB0aW9uKCksXG4gICAgICAgIGFyZ3VtZW50czogY29tbWFuZC5nZXROYW1lKCksXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyBhcmd1bWVudHNcbiAgICBjb25zdCBjb21tYW5kQXJncyA9IGNvbW1hbmQuZ2V0QXJndW1lbnRzKCk7XG4gICAgaWYgKGNvbW1hbmRBcmdzLmxlbmd0aCkge1xuICAgICAgcmVzdWx0ICs9IFwiXFxuXCIgKyB0aGlzLmNvbXBsZXRlKGNvbW1hbmQsIHtcbiAgICAgICAgYXJndW1lbnRzOiBjb21tYW5kQXJncy5sZW5ndGhcbiAgICAgICAgICA/IHRoaXMuZ2V0Q29tcGxldGlvbkNvbW1hbmQoY29tbWFuZCwgY29tbWFuZEFyZ3NbMF0pXG4gICAgICAgICAgOiB1bmRlZmluZWQsXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyBvcHRpb25zXG4gICAgZm9yIChjb25zdCBvcHRpb24gb2YgY29tbWFuZC5nZXRPcHRpb25zKGZhbHNlKSkge1xuICAgICAgcmVzdWx0ICs9IFwiXFxuXCIgKyB0aGlzLmNvbXBsZXRlT3B0aW9uKGNvbW1hbmQsIG9wdGlvbik7XG4gICAgfVxuXG4gICAgZm9yIChjb25zdCBzdWJDb21tYW5kIG9mIGNvbW1hbmQuZ2V0Q29tbWFuZHMoZmFsc2UpKSB7XG4gICAgICByZXN1bHQgKz0gdGhpcy5nZW5lcmF0ZUNvbXBsZXRpb25zKHN1YkNvbW1hbmQpO1xuICAgIH1cblxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICBwcml2YXRlIGNvbXBsZXRlT3B0aW9uKGNvbW1hbmQ6IENvbW1hbmQsIG9wdGlvbjogT3B0aW9uKSB7XG4gICAgY29uc3Qgc2hvcnRPcHRpb246IHN0cmluZyB8IHVuZGVmaW5lZCA9IG9wdGlvbi5mbGFnc1xuICAgICAgLmZpbmQoKGZsYWcpID0+IGZsYWcubGVuZ3RoID09PSAyKVxuICAgICAgPy5yZXBsYWNlKC9eKC0pKy8sIFwiXCIpO1xuICAgIGNvbnN0IGxvbmdPcHRpb246IHN0cmluZyB8IHVuZGVmaW5lZCA9IG9wdGlvbi5mbGFnc1xuICAgICAgLmZpbmQoKGZsYWcpID0+IGZsYWcubGVuZ3RoID4gMilcbiAgICAgID8ucmVwbGFjZSgvXigtKSsvLCBcIlwiKTtcblxuICAgIHJldHVybiB0aGlzLmNvbXBsZXRlKGNvbW1hbmQsIHtcbiAgICAgIGRlc2NyaXB0aW9uOiBnZXREZXNjcmlwdGlvbihvcHRpb24uZGVzY3JpcHRpb24pLFxuICAgICAgc2hvcnRPcHRpb246IHNob3J0T3B0aW9uLFxuICAgICAgbG9uZ09wdGlvbjogbG9uZ09wdGlvbixcbiAgICAgIC8vIHJlcXVpcmVkOiBvcHRpb24ucmVxdWlyZWRWYWx1ZSxcbiAgICAgIHJlcXVpcmVkOiB0cnVlLFxuICAgICAgc3RhbmRhbG9uZTogb3B0aW9uLnN0YW5kYWxvbmUsXG4gICAgICBhcmd1bWVudHM6IG9wdGlvbi5hcmdzLmxlbmd0aFxuICAgICAgICA/IHRoaXMuZ2V0Q29tcGxldGlvbkNvbW1hbmQoY29tbWFuZCwgb3B0aW9uLmFyZ3NbMF0pXG4gICAgICAgIDogdW5kZWZpbmVkLFxuICAgIH0pO1xuICB9XG5cbiAgcHJpdmF0ZSBjb21wbGV0ZShjb21tYW5kOiBDb21tYW5kLCBvcHRpb25zOiBDb21wbGV0ZU9wdGlvbnMpIHtcbiAgICBjb25zdCBjbWQgPSBbXCJjb21wbGV0ZVwiXTtcbiAgICBjbWQucHVzaChcIi1jXCIsIHRoaXMuY21kLmdldE5hbWUoKSk7XG4gICAgY21kLnB1c2goXG4gICAgICBcIi1uXCIsXG4gICAgICBgJ19fZmlzaF8ke3JlcGxhY2VTcGVjaWFsQ2hhcnModGhpcy5jbWQuZ2V0TmFtZSgpKX1fdXNpbmdfY29tbWFuZCBfXyR7XG4gICAgICAgIHJlcGxhY2VTcGVjaWFsQ2hhcnMoY29tbWFuZC5nZXRQYXRoKCkpXG4gICAgICB9J2AsXG4gICAgKTtcbiAgICBvcHRpb25zLnNob3J0T3B0aW9uICYmIGNtZC5wdXNoKFwiLXNcIiwgb3B0aW9ucy5zaG9ydE9wdGlvbik7XG4gICAgb3B0aW9ucy5sb25nT3B0aW9uICYmIGNtZC5wdXNoKFwiLWxcIiwgb3B0aW9ucy5sb25nT3B0aW9uKTtcbiAgICBvcHRpb25zLnN0YW5kYWxvbmUgJiYgY21kLnB1c2goXCIteFwiKTtcbiAgICBjbWQucHVzaChcIi1rXCIpO1xuICAgIGNtZC5wdXNoKFwiLWZcIik7XG5cbiAgICBpZiAob3B0aW9ucy5hcmd1bWVudHMpIHtcbiAgICAgIG9wdGlvbnMucmVxdWlyZWQgJiYgY21kLnB1c2goXCItclwiKTtcbiAgICAgIGNtZC5wdXNoKFwiLWFcIiwgb3B0aW9ucy5hcmd1bWVudHMpO1xuICAgIH1cblxuICAgIGlmIChvcHRpb25zLmRlc2NyaXB0aW9uKSB7XG4gICAgICBjb25zdCBkZXNjcmlwdGlvbjogc3RyaW5nID0gZ2V0RGVzY3JpcHRpb24ob3B0aW9ucy5kZXNjcmlwdGlvbiwgdHJ1ZSlcbiAgICAgICAgLy8gZXNjYXBlIHNpbmdsZSBxdW90ZXNcbiAgICAgICAgLnJlcGxhY2UoLycvZywgXCJcXFxcJ1wiKTtcblxuICAgICAgY21kLnB1c2goXCItZFwiLCBgJyR7ZGVzY3JpcHRpb259J2ApO1xuICAgIH1cblxuICAgIHJldHVybiBjbWQuam9pbihcIiBcIik7XG4gIH1cblxuICBwcml2YXRlIGdldENvbXBsZXRpb25Db21tYW5kKGNtZDogQ29tbWFuZCwgYXJnOiBBcmd1bWVudCk6IHN0cmluZyB7XG4gICAgY29uc3QgdHlwZSA9IGNtZC5nZXRUeXBlKGFyZy50eXBlKTtcbiAgICBpZiAodHlwZSAmJiB0eXBlLmhhbmRsZXIgaW5zdGFuY2VvZiBGaWxlVHlwZSkge1xuICAgICAgcmV0dXJuIGAnKF9fZmlzaF9jb21wbGV0ZV9wYXRoKSdgO1xuICAgIH1cbiAgICByZXR1cm4gYCcoJHt0aGlzLmNtZC5nZXROYW1lKCl9IGNvbXBsZXRpb25zIGNvbXBsZXRlICR7XG4gICAgICBhcmcuYWN0aW9uICsgXCIgXCIgKyBnZXRDb21wbGV0aW9uc1BhdGgoY21kKVxuICAgIH0pJ2A7XG4gIH1cbn1cblxuZnVuY3Rpb24gZ2V0Q29tbWFuZEZuTmFtZXMoXG4gIGNtZDogQ29tbWFuZCxcbiAgY21kczogQXJyYXk8c3RyaW5nPiA9IFtdLFxuKTogQXJyYXk8c3RyaW5nPiB7XG4gIGNtZHMucHVzaChgX18ke3JlcGxhY2VTcGVjaWFsQ2hhcnMoY21kLmdldFBhdGgoKSl9YCk7XG4gIGNtZC5nZXRDb21tYW5kcyhmYWxzZSkuZm9yRWFjaCgoY29tbWFuZCkgPT4ge1xuICAgIGdldENvbW1hbmRGbk5hbWVzKGNvbW1hbmQsIGNtZHMpO1xuICB9KTtcbiAgcmV0dXJuIGNtZHM7XG59XG5cbmZ1bmN0aW9uIGdldENvbXBsZXRpb25zUGF0aChjb21tYW5kOiBDb21tYW5kKTogc3RyaW5nIHtcbiAgcmV0dXJuIGNvbW1hbmQuZ2V0UGF0aCgpXG4gICAgLnNwbGl0KFwiIFwiKVxuICAgIC5zbGljZSgxKVxuICAgIC5qb2luKFwiIFwiKTtcbn1cblxuZnVuY3Rpb24gcmVwbGFjZVNwZWNpYWxDaGFycyhzdHI6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBzdHIucmVwbGFjZSgvW15hLXpBLVowLTldL2csIFwiX1wiKTtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxTQUFTLGNBQWMsUUFBUSxlQUFlO0FBRzlDLFNBQVMsUUFBUSxRQUFRLG1CQUFtQjtBQVk1QyxnQ0FBZ0MsR0FDaEMsT0FBTyxNQUFNOztFQUNYLHlEQUF5RCxHQUN6RCxPQUFjLFNBQVMsR0FBWSxFQUFFO0lBQ25DLE9BQU8sSUFB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