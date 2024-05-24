import { getDescription } from "../_utils.ts";
import { FileType } from "../types/file.ts";
/** Generates zsh completions script. */ export class ZshCompletionsGenerator {
  cmd;
  actions;
  /** Generates zsh completions script for given command. */ static generate(cmd) {
    return new ZshCompletionsGenerator(cmd).generate();
  }
  constructor(cmd){
    this.cmd = cmd;
    this.actions = new Map();
  }
  /** Generates zsh completions code. */ generate() {
    const path = this.cmd.getPath();
    const name = this.cmd.getName();
    const version = this.cmd.getVersion() ? ` v${this.cmd.getVersion()}` : "";
    return `#!/usr/bin/env zsh
# zsh completion support for ${path}${version}

autoload -U is-at-least

# shellcheck disable=SC2154
(( $+functions[__${replaceSpecialChars(name)}_complete] )) ||
function __${replaceSpecialChars(name)}_complete {
  local name="$1"; shift
  local action="$1"; shift
  integer ret=1
  local -a values
  local expl lines
  _tags "$name"
  while _tags; do
    if _requested "$name"; then
      # shellcheck disable=SC2034
      lines="$(${name} completions complete "\${action}" "\${@}")"
      values=("\${(ps:\\n:)lines}")
      if (( \${#values[@]} )); then
        while _next_label "$name" expl "$action"; do
          compadd -S '' "\${expl[@]}" "\${values[@]}"
        done
      fi
    fi
  done
}

${this.generateCompletions(this.cmd).trim()}

# _${replaceSpecialChars(path)} "\${@}"

compdef _${replaceSpecialChars(path)} ${path}`;
  }
  /** Generates zsh completions method for given command and child commands. */ generateCompletions(command, path = "") {
    if (!command.hasCommands(false) && !command.hasOptions(false) && !command.hasArguments()) {
      return "";
    }
    path = (path ? path + " " : "") + command.getName();
    return `# shellcheck disable=SC2154
(( $+functions[_${replaceSpecialChars(path)}] )) ||
function _${replaceSpecialChars(path)}() {` + (!command.getParent() ? `
  local state` : "") + this.generateCommandCompletions(command, path) + this.generateSubCommandCompletions(command, path) + this.generateArgumentCompletions(command, path) + this.generateActions(command) + `\n}\n\n` + command.getCommands(false).filter((subCommand)=>subCommand !== command).map((subCommand)=>this.generateCompletions(subCommand, path)).join("");
  }
  generateCommandCompletions(command, path) {
    const commands = command.getCommands(false);
    let completions = commands.map((subCommand)=>`'${subCommand.getName()}:${subCommand.getShortDescription()// escape single quotes
      .replace(/'/g, "'\"'\"'")}'`).join("\n      ");
    if (completions) {
      completions = `
    local -a commands
    # shellcheck disable=SC2034
    commands=(
      ${completions}
    )
    _describe 'command' commands`;
    }
    // only complete first argument, rest arguments are completed with _arguments.
    if (command.hasArguments()) {
      const completionsPath = path.split(" ").slice(1).join(" ");
      const arg = command.getArguments()[0];
      const action = this.addAction(arg, completionsPath);
      if (action && command.getCompletion(arg.action)) {
        completions += `\n    __${replaceSpecialChars(this.cmd.getName())}_complete ${action.arg.name} ${action.arg.action} ${action.cmd}`;
      }
    }
    if (completions) {
      completions = `\n\n  function _commands() {${completions}\n  }`;
    }
    return completions;
  }
  generateSubCommandCompletions(command, path) {
    if (command.hasCommands(false)) {
      const actions = command.getCommands(false).map((command)=>`${command.getName()}) _${replaceSpecialChars(path + " " + command.getName())} ;;`).join("\n      ");
      return `\n
  function _command_args() {
    case "\${words[1]}" in\n      ${actions}\n    esac
  }`;
    }
    return "";
  }
  generateArgumentCompletions(command, path) {
    /* clear actions from previously parsed command. */ this.actions.clear();
    const options = this.generateOptions(command, path);
    let argIndex = 0;
    // @TODO: add stop early option: -A "-*"
    // http://zsh.sourceforge.net/Doc/Release/Completion-System.html
    let argsCommand = "\n\n  _arguments -w -s -S -C";
    if (command.hasOptions()) {
      argsCommand += ` \\\n    ${options.join(" \\\n    ")}`;
    }
    if (command.hasCommands(false) || command.getArguments().filter((arg)=>command.getCompletion(arg.action)).length) {
      argsCommand += ` \\\n    '${++argIndex}:command:_commands'`;
    }
    if (command.hasArguments() || command.hasCommands(false)) {
      const args = [];
      // first argument is completed together with commands.
      for (const arg of command.getArguments().slice(1)){
        const type = command.getType(arg.type);
        if (type && type.handler instanceof FileType) {
          const fileCompletions = this.getFileCompletions(type);
          if (arg.variadic) {
            argIndex++;
            for(let i = 0; i < 5; i++){
              args.push(`${argIndex + i}${arg.optionalValue ? "::" : ":"}${arg.name}:${fileCompletions}`);
            }
          } else {
            args.push(`${++argIndex}${arg.optionalValue ? "::" : ":"}${arg.name}:${fileCompletions}`);
          }
        } else {
          const completionsPath = path.split(" ").slice(1).join(" ");
          const action = this.addAction(arg, completionsPath);
          args.push(`${++argIndex}${arg.optionalValue ? "::" : ":"}${arg.name}:->${action.name}`);
        }
      }
      argsCommand += args.map((arg)=>`\\\n    '${arg}'`).join("");
      if (command.hasCommands(false)) {
        argsCommand += ` \\\n    '*::sub command:->command_args'`;
      }
    }
    return argsCommand;
  }
  generateOptions(command, path) {
    const options = [];
    const cmdArgs = path.split(" ");
    const _baseName = cmdArgs.shift();
    const completionsPath = cmdArgs.join(" ");
    const excludedFlags = command.getOptions(false).map((option)=>option.standalone ? option.flags : false).flat().filter((flag)=>typeof flag === "string");
    for (const option of command.getOptions(false)){
      options.push(this.generateOption(command, option, completionsPath, excludedFlags));
    }
    return options;
  }
  generateOption(command, option, completionsPath, excludedOptions) {
    let args = "";
    for (const arg of option.args){
      const type = command.getType(arg.type);
      const optionalValue = arg.optionalValue ? "::" : ":";
      if (type && type.handler instanceof FileType) {
        const fileCompletions = this.getFileCompletions(type);
        args += `${optionalValue}${arg.name}:${fileCompletions}`;
      } else {
        const action = this.addAction(arg, completionsPath);
        args += `${optionalValue}${arg.name}:->${action.name}`;
      }
    }
    const description = getDescription(option.description, true)// escape brackets and quotes
    .replace(/\[/g, "\\[").replace(/]/g, "\\]").replace(/"/g, '\\"').replace(/'/g, "'\"'\"'");
    const collect = option.collect ? "*" : "";
    const equalsSign = option.equalsSign ? "=" : "";
    const flags = option.flags.map((flag)=>`${flag}${equalsSign}`);
    let result = "";
    if (option.standalone) {
      result += "'(- *)'";
    } else {
      const excludedFlags = [
        ...excludedOptions
      ];
      if (option.conflicts?.length) {
        excludedFlags.push(...option.conflicts.map((opt)=>"--" + opt.replace(/^--/, "")));
      }
      if (!option.collect) {
        excludedFlags.push(...option.flags);
      }
      if (excludedFlags.length) {
        result += `'(${excludedFlags.join(" ")})'`;
      }
    }
    if (collect || flags.length > 1) {
      result += `{${collect}${flags.join(",")}}`;
    } else {
      result += `${flags.join(",")}`;
    }
    return `${result}'[${description}]${args}'`;
  }
  getFileCompletions(type) {
    if (!(type.handler instanceof FileType)) {
      return "";
    }
    return "_files";
  // const fileOpts = type.handler.getOptions();
  // let fileCompletions = "_files";
  // if (fileOpts.dirsOnly) {
  //   fileCompletions += " -/";
  // }
  // if (fileOpts.pattern) {
  //   fileCompletions += ' -g "' + fileOpts.pattern + '"';
  // }
  // if (fileOpts.ignore) {
  //   fileCompletions += " -F " + fileOpts.ignore;
  // }
  // return fileCompletions;
  }
  addAction(arg, cmd) {
    const action = `${arg.name}-${arg.action}`;
    if (!this.actions.has(action)) {
      this.actions.set(action, {
        arg: arg,
        label: `${arg.name}: ${arg.action}`,
        name: action,
        cmd
      });
    }
    return this.actions.get(action);
  }
  generateActions(command) {
    let actions = [];
    if (this.actions.size) {
      actions = Array.from(this.actions).map(([name, action])=>`${name}) __${replaceSpecialChars(this.cmd.getName())}_complete ${action.arg.name} ${action.arg.action} ${action.cmd} ;;`);
    }
    if (command.hasCommands(false)) {
      actions.unshift(`command_args) _command_args ;;`);
    }
    if (actions.length) {
      return `\n\n  case "$state" in\n    ${actions.join("\n    ")}\n  esac`;
    }
    return "";
  }
}
function replaceSpecialChars(str) {
  return str.replace(/[^a-zA-Z0-9]/g, "_");
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvY2xpZmZ5QHYwLjI1LjcvY29tbWFuZC9jb21wbGV0aW9ucy9fenNoX2NvbXBsZXRpb25zX2dlbmVyYXRvci50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBnZXREZXNjcmlwdGlvbiB9IGZyb20gXCIuLi9fdXRpbHMudHNcIjtcbmltcG9ydCB0eXBlIHsgQ29tbWFuZCB9IGZyb20gXCIuLi9jb21tYW5kLnRzXCI7XG5pbXBvcnQgdHlwZSB7IEFyZ3VtZW50LCBPcHRpb24sIFR5cGVEZWYgfSBmcm9tIFwiLi4vdHlwZXMudHNcIjtcbmltcG9ydCB7IEZpbGVUeXBlIH0gZnJvbSBcIi4uL3R5cGVzL2ZpbGUudHNcIjtcblxuaW50ZXJmYWNlIElDb21wbGV0aW9uQWN0aW9uIHtcbiAgYXJnOiBBcmd1bWVudDtcbiAgbGFiZWw6IHN0cmluZztcbiAgbmFtZTogc3RyaW5nO1xuICBjbWQ6IHN0cmluZztcbn1cblxuLyoqIEdlbmVyYXRlcyB6c2ggY29tcGxldGlvbnMgc2NyaXB0LiAqL1xuZXhwb3J0IGNsYXNzIFpzaENvbXBsZXRpb25zR2VuZXJhdG9yIHtcbiAgcHJpdmF0ZSBhY3Rpb25zOiBNYXA8c3RyaW5nLCBJQ29tcGxldGlvbkFjdGlvbj4gPSBuZXcgTWFwKCk7XG5cbiAgLyoqIEdlbmVyYXRlcyB6c2ggY29tcGxldGlvbnMgc2NyaXB0IGZvciBnaXZlbiBjb21tYW5kLiAqL1xuICBwdWJsaWMgc3RhdGljIGdlbmVyYXRlKGNtZDogQ29tbWFuZCkge1xuICAgIHJldHVybiBuZXcgWnNoQ29tcGxldGlvbnNHZW5lcmF0b3IoY21kKS5nZW5lcmF0ZSgpO1xuICB9XG5cbiAgcHJpdmF0ZSBjb25zdHJ1Y3Rvcihwcm90ZWN0ZWQgY21kOiBDb21tYW5kKSB7fVxuXG4gIC8qKiBHZW5lcmF0ZXMgenNoIGNvbXBsZXRpb25zIGNvZGUuICovXG4gIHByaXZhdGUgZ2VuZXJhdGUoKTogc3RyaW5nIHtcbiAgICBjb25zdCBwYXRoID0gdGhpcy5jbWQuZ2V0UGF0aCgpO1xuICAgIGNvbnN0IG5hbWUgPSB0aGlzLmNtZC5nZXROYW1lKCk7XG4gICAgY29uc3QgdmVyc2lvbjogc3RyaW5nIHwgdW5kZWZpbmVkID0gdGhpcy5jbWQuZ2V0VmVyc2lvbigpXG4gICAgICA/IGAgdiR7dGhpcy5jbWQuZ2V0VmVyc2lvbigpfWBcbiAgICAgIDogXCJcIjtcblxuICAgIHJldHVybiBgIyEvdXNyL2Jpbi9lbnYgenNoXG4jIHpzaCBjb21wbGV0aW9uIHN1cHBvcnQgZm9yICR7cGF0aH0ke3ZlcnNpb259XG5cbmF1dG9sb2FkIC1VIGlzLWF0LWxlYXN0XG5cbiMgc2hlbGxjaGVjayBkaXNhYmxlPVNDMjE1NFxuKCggJCtmdW5jdGlvbnNbX18ke3JlcGxhY2VTcGVjaWFsQ2hhcnMobmFtZSl9X2NvbXBsZXRlXSApKSB8fFxuZnVuY3Rpb24gX18ke3JlcGxhY2VTcGVjaWFsQ2hhcnMobmFtZSl9X2NvbXBsZXRlIHtcbiAgbG9jYWwgbmFtZT1cIiQxXCI7IHNoaWZ0XG4gIGxvY2FsIGFjdGlvbj1cIiQxXCI7IHNoaWZ0XG4gIGludGVnZXIgcmV0PTFcbiAgbG9jYWwgLWEgdmFsdWVzXG4gIGxvY2FsIGV4cGwgbGluZXNcbiAgX3RhZ3MgXCIkbmFtZVwiXG4gIHdoaWxlIF90YWdzOyBkb1xuICAgIGlmIF9yZXF1ZXN0ZWQgXCIkbmFtZVwiOyB0aGVuXG4gICAgICAjIHNoZWxsY2hlY2sgZGlzYWJsZT1TQzIwMzRcbiAgICAgIGxpbmVzPVwiJCgke25hbWV9IGNvbXBsZXRpb25zIGNvbXBsZXRlIFwiXFwke2FjdGlvbn1cIiBcIlxcJHtAfVwiKVwiXG4gICAgICB2YWx1ZXM9KFwiXFwkeyhwczpcXFxcbjopbGluZXN9XCIpXG4gICAgICBpZiAoKCBcXCR7I3ZhbHVlc1tAXX0gKSk7IHRoZW5cbiAgICAgICAgd2hpbGUgX25leHRfbGFiZWwgXCIkbmFtZVwiIGV4cGwgXCIkYWN0aW9uXCI7IGRvXG4gICAgICAgICAgY29tcGFkZCAtUyAnJyBcIlxcJHtleHBsW0BdfVwiIFwiXFwke3ZhbHVlc1tAXX1cIlxuICAgICAgICBkb25lXG4gICAgICBmaVxuICAgIGZpXG4gIGRvbmVcbn1cblxuJHt0aGlzLmdlbmVyYXRlQ29tcGxldGlvbnModGhpcy5jbWQpLnRyaW0oKX1cblxuIyBfJHtyZXBsYWNlU3BlY2lhbENoYXJzKHBhdGgpfSBcIlxcJHtAfVwiXG5cbmNvbXBkZWYgXyR7cmVwbGFjZVNwZWNpYWxDaGFycyhwYXRoKX0gJHtwYXRofWA7XG4gIH1cblxuICAvKiogR2VuZXJhdGVzIHpzaCBjb21wbGV0aW9ucyBtZXRob2QgZm9yIGdpdmVuIGNvbW1hbmQgYW5kIGNoaWxkIGNvbW1hbmRzLiAqL1xuICBwcml2YXRlIGdlbmVyYXRlQ29tcGxldGlvbnMoY29tbWFuZDogQ29tbWFuZCwgcGF0aCA9IFwiXCIpOiBzdHJpbmcge1xuICAgIGlmIChcbiAgICAgICFjb21tYW5kLmhhc0NvbW1hbmRzKGZhbHNlKSAmJiAhY29tbWFuZC5oYXNPcHRpb25zKGZhbHNlKSAmJlxuICAgICAgIWNvbW1hbmQuaGFzQXJndW1lbnRzKClcbiAgICApIHtcbiAgICAgIHJldHVybiBcIlwiO1xuICAgIH1cblxuICAgIHBhdGggPSAocGF0aCA/IHBhdGggKyBcIiBcIiA6IFwiXCIpICsgY29tbWFuZC5nZXROYW1lKCk7XG5cbiAgICByZXR1cm4gYCMgc2hlbGxjaGVjayBkaXNhYmxlPVNDMjE1NFxuKCggJCtmdW5jdGlvbnNbXyR7cmVwbGFjZVNwZWNpYWxDaGFycyhwYXRoKX1dICkpIHx8XG5mdW5jdGlvbiBfJHtyZXBsYWNlU3BlY2lhbENoYXJzKHBhdGgpfSgpIHtgICtcbiAgICAgICghY29tbWFuZC5nZXRQYXJlbnQoKVxuICAgICAgICA/IGBcbiAgbG9jYWwgc3RhdGVgXG4gICAgICAgIDogXCJcIikgK1xuICAgICAgdGhpcy5nZW5lcmF0ZUNvbW1hbmRDb21wbGV0aW9ucyhjb21tYW5kLCBwYXRoKSArXG4gICAgICB0aGlzLmdlbmVyYXRlU3ViQ29tbWFuZENvbXBsZXRpb25zKGNvbW1hbmQsIHBhdGgpICtcbiAgICAgIHRoaXMuZ2VuZXJhdGVBcmd1bWVudENvbXBsZXRpb25zKGNvbW1hbmQsIHBhdGgpICtcbiAgICAgIHRoaXMuZ2VuZXJhdGVBY3Rpb25zKGNvbW1hbmQpICtcbiAgICAgIGBcXG59XFxuXFxuYCArXG4gICAgICBjb21tYW5kLmdldENvbW1hbmRzKGZhbHNlKVxuICAgICAgICAuZmlsdGVyKChzdWJDb21tYW5kOiBDb21tYW5kKSA9PiBzdWJDb21tYW5kICE9PSBjb21tYW5kKVxuICAgICAgICAubWFwKChzdWJDb21tYW5kOiBDb21tYW5kKSA9PlxuICAgICAgICAgIHRoaXMuZ2VuZXJhdGVDb21wbGV0aW9ucyhzdWJDb21tYW5kLCBwYXRoKVxuICAgICAgICApXG4gICAgICAgIC5qb2luKFwiXCIpO1xuICB9XG5cbiAgcHJpdmF0ZSBnZW5lcmF0ZUNvbW1hbmRDb21wbGV0aW9ucyhjb21tYW5kOiBDb21tYW5kLCBwYXRoOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIGNvbnN0IGNvbW1hbmRzID0gY29tbWFuZC5nZXRDb21tYW5kcyhmYWxzZSk7XG5cbiAgICBsZXQgY29tcGxldGlvbnM6IHN0cmluZyA9IGNvbW1hbmRzXG4gICAgICAubWFwKChzdWJDb21tYW5kOiBDb21tYW5kKSA9PlxuICAgICAgICBgJyR7c3ViQ29tbWFuZC5nZXROYW1lKCl9OiR7XG4gICAgICAgICAgc3ViQ29tbWFuZC5nZXRTaG9ydERlc2NyaXB0aW9uKClcbiAgICAgICAgICAgIC8vIGVzY2FwZSBzaW5nbGUgcXVvdGVzXG4gICAgICAgICAgICAucmVwbGFjZSgvJy9nLCBcIidcXFwiJ1xcXCInXCIpXG4gICAgICAgIH0nYFxuICAgICAgKVxuICAgICAgLmpvaW4oXCJcXG4gICAgICBcIik7XG5cbiAgICBpZiAoY29tcGxldGlvbnMpIHtcbiAgICAgIGNvbXBsZXRpb25zID0gYFxuICAgIGxvY2FsIC1hIGNvbW1hbmRzXG4gICAgIyBzaGVsbGNoZWNrIGRpc2FibGU9U0MyMDM0XG4gICAgY29tbWFuZHM9KFxuICAgICAgJHtjb21wbGV0aW9uc31cbiAgICApXG4gICAgX2Rlc2NyaWJlICdjb21tYW5kJyBjb21tYW5kc2A7XG4gICAgfVxuXG4gICAgLy8gb25seSBjb21wbGV0ZSBmaXJzdCBhcmd1bWVudCwgcmVzdCBhcmd1bWVudHMgYXJlIGNvbXBsZXRlZCB3aXRoIF9hcmd1bWVudHMuXG4gICAgaWYgKGNvbW1hbmQuaGFzQXJndW1lbnRzKCkpIHtcbiAgICAgIGNvbnN0IGNvbXBsZXRpb25zUGF0aDogc3RyaW5nID0gcGF0aC5zcGxpdChcIiBcIikuc2xpY2UoMSkuam9pbihcIiBcIik7XG4gICAgICBjb25zdCBhcmc6IEFyZ3VtZW50ID0gY29tbWFuZC5nZXRBcmd1bWVudHMoKVswXTtcbiAgICAgIGNvbnN0IGFjdGlvbiA9IHRoaXMuYWRkQWN0aW9uKGFyZywgY29tcGxldGlvbnNQYXRoKTtcbiAgICAgIGlmIChhY3Rpb24gJiYgY29tbWFuZC5nZXRDb21wbGV0aW9uKGFyZy5hY3Rpb24pKSB7XG4gICAgICAgIGNvbXBsZXRpb25zICs9IGBcXG4gICAgX18ke1xuICAgICAgICAgIHJlcGxhY2VTcGVjaWFsQ2hhcnModGhpcy5jbWQuZ2V0TmFtZSgpKVxuICAgICAgICB9X2NvbXBsZXRlICR7YWN0aW9uLmFyZy5uYW1lfSAke2FjdGlvbi5hcmcuYWN0aW9ufSAke2FjdGlvbi5jbWR9YDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoY29tcGxldGlvbnMpIHtcbiAgICAgIGNvbXBsZXRpb25zID0gYFxcblxcbiAgZnVuY3Rpb24gX2NvbW1hbmRzKCkgeyR7Y29tcGxldGlvbnN9XFxuICB9YDtcbiAgICB9XG5cbiAgICByZXR1cm4gY29tcGxldGlvbnM7XG4gIH1cblxuICBwcml2YXRlIGdlbmVyYXRlU3ViQ29tbWFuZENvbXBsZXRpb25zKFxuICAgIGNvbW1hbmQ6IENvbW1hbmQsXG4gICAgcGF0aDogc3RyaW5nLFxuICApOiBzdHJpbmcge1xuICAgIGlmIChjb21tYW5kLmhhc0NvbW1hbmRzKGZhbHNlKSkge1xuICAgICAgY29uc3QgYWN0aW9uczogc3RyaW5nID0gY29tbWFuZFxuICAgICAgICAuZ2V0Q29tbWFuZHMoZmFsc2UpXG4gICAgICAgIC5tYXAoKGNvbW1hbmQ6IENvbW1hbmQpID0+XG4gICAgICAgICAgYCR7Y29tbWFuZC5nZXROYW1lKCl9KSBfJHtcbiAgICAgICAgICAgIHJlcGxhY2VTcGVjaWFsQ2hhcnMocGF0aCArIFwiIFwiICsgY29tbWFuZC5nZXROYW1lKCkpXG4gICAgICAgICAgfSA7O2BcbiAgICAgICAgKVxuICAgICAgICAuam9pbihcIlxcbiAgICAgIFwiKTtcblxuICAgICAgcmV0dXJuIGBcXG5cbiAgZnVuY3Rpb24gX2NvbW1hbmRfYXJncygpIHtcbiAgICBjYXNlIFwiXFwke3dvcmRzWzFdfVwiIGluXFxuICAgICAgJHthY3Rpb25zfVxcbiAgICBlc2FjXG4gIH1gO1xuICAgIH1cblxuICAgIHJldHVybiBcIlwiO1xuICB9XG5cbiAgcHJpdmF0ZSBnZW5lcmF0ZUFyZ3VtZW50Q29tcGxldGlvbnMoY29tbWFuZDogQ29tbWFuZCwgcGF0aDogc3RyaW5nKTogc3RyaW5nIHtcbiAgICAvKiBjbGVhciBhY3Rpb25zIGZyb20gcHJldmlvdXNseSBwYXJzZWQgY29tbWFuZC4gKi9cbiAgICB0aGlzLmFjdGlvbnMuY2xlYXIoKTtcblxuICAgIGNvbnN0IG9wdGlvbnM6IHN0cmluZ1tdID0gdGhpcy5nZW5lcmF0ZU9wdGlvbnMoY29tbWFuZCwgcGF0aCk7XG5cbiAgICBsZXQgYXJnSW5kZXggPSAwO1xuICAgIC8vIEBUT0RPOiBhZGQgc3RvcCBlYXJseSBvcHRpb246IC1BIFwiLSpcIlxuICAgIC8vIGh0dHA6Ly96c2guc291cmNlZm9yZ2UubmV0L0RvYy9SZWxlYXNlL0NvbXBsZXRpb24tU3lzdGVtLmh0bWxcbiAgICBsZXQgYXJnc0NvbW1hbmQgPSBcIlxcblxcbiAgX2FyZ3VtZW50cyAtdyAtcyAtUyAtQ1wiO1xuXG4gICAgaWYgKGNvbW1hbmQuaGFzT3B0aW9ucygpKSB7XG4gICAgICBhcmdzQ29tbWFuZCArPSBgIFxcXFxcXG4gICAgJHtvcHRpb25zLmpvaW4oXCIgXFxcXFxcbiAgICBcIil9YDtcbiAgICB9XG5cbiAgICBpZiAoXG4gICAgICBjb21tYW5kLmhhc0NvbW1hbmRzKGZhbHNlKSB8fCAoXG4gICAgICAgIGNvbW1hbmQuZ2V0QXJndW1lbnRzKClcbiAgICAgICAgICAuZmlsdGVyKChhcmcpID0+IGNvbW1hbmQuZ2V0Q29tcGxldGlvbihhcmcuYWN0aW9uKSkubGVuZ3RoXG4gICAgICApXG4gICAgKSB7XG4gICAgICBhcmdzQ29tbWFuZCArPSBgIFxcXFxcXG4gICAgJyR7KythcmdJbmRleH06Y29tbWFuZDpfY29tbWFuZHMnYDtcbiAgICB9XG5cbiAgICBpZiAoY29tbWFuZC5oYXNBcmd1bWVudHMoKSB8fCBjb21tYW5kLmhhc0NvbW1hbmRzKGZhbHNlKSkge1xuICAgICAgY29uc3QgYXJnczogc3RyaW5nW10gPSBbXTtcblxuICAgICAgLy8gZmlyc3QgYXJndW1lbnQgaXMgY29tcGxldGVkIHRvZ2V0aGVyIHdpdGggY29tbWFuZHMuXG4gICAgICBmb3IgKGNvbnN0IGFyZyBvZiBjb21tYW5kLmdldEFyZ3VtZW50cygpLnNsaWNlKDEpKSB7XG4gICAgICAgIGNvbnN0IHR5cGUgPSBjb21tYW5kLmdldFR5cGUoYXJnLnR5cGUpO1xuICAgICAgICBpZiAodHlwZSAmJiB0eXBlLmhhbmRsZXIgaW5zdGFuY2VvZiBGaWxlVHlwZSkge1xuICAgICAgICAgIGNvbnN0IGZpbGVDb21wbGV0aW9ucyA9IHRoaXMuZ2V0RmlsZUNvbXBsZXRpb25zKHR5cGUpO1xuICAgICAgICAgIGlmIChhcmcudmFyaWFkaWMpIHtcbiAgICAgICAgICAgIGFyZ0luZGV4Kys7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IDU7IGkrKykge1xuICAgICAgICAgICAgICBhcmdzLnB1c2goXG4gICAgICAgICAgICAgICAgYCR7YXJnSW5kZXggKyBpfSR7XG4gICAgICAgICAgICAgICAgICBhcmcub3B0aW9uYWxWYWx1ZSA/IFwiOjpcIiA6IFwiOlwiXG4gICAgICAgICAgICAgICAgfSR7YXJnLm5hbWV9OiR7ZmlsZUNvbXBsZXRpb25zfWAsXG4gICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGFyZ3MucHVzaChcbiAgICAgICAgICAgICAgYCR7KythcmdJbmRleH0ke1xuICAgICAgICAgICAgICAgIGFyZy5vcHRpb25hbFZhbHVlID8gXCI6OlwiIDogXCI6XCJcbiAgICAgICAgICAgICAgfSR7YXJnLm5hbWV9OiR7ZmlsZUNvbXBsZXRpb25zfWAsXG4gICAgICAgICAgICApO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjb25zdCBjb21wbGV0aW9uc1BhdGg6IHN0cmluZyA9IHBhdGguc3BsaXQoXCIgXCIpLnNsaWNlKDEpLmpvaW4oXCIgXCIpO1xuICAgICAgICAgIGNvbnN0IGFjdGlvbiA9IHRoaXMuYWRkQWN0aW9uKGFyZywgY29tcGxldGlvbnNQYXRoKTtcbiAgICAgICAgICBhcmdzLnB1c2goXG4gICAgICAgICAgICBgJHsrK2FyZ0luZGV4fSR7XG4gICAgICAgICAgICAgIGFyZy5vcHRpb25hbFZhbHVlID8gXCI6OlwiIDogXCI6XCJcbiAgICAgICAgICAgIH0ke2FyZy5uYW1lfTotPiR7YWN0aW9uLm5hbWV9YCxcbiAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGFyZ3NDb21tYW5kICs9IGFyZ3MubWFwKChhcmc6IHN0cmluZykgPT4gYFxcXFxcXG4gICAgJyR7YXJnfSdgKS5qb2luKFwiXCIpO1xuXG4gICAgICBpZiAoY29tbWFuZC5oYXNDb21tYW5kcyhmYWxzZSkpIHtcbiAgICAgICAgYXJnc0NvbW1hbmQgKz0gYCBcXFxcXFxuICAgICcqOjpzdWIgY29tbWFuZDotPmNvbW1hbmRfYXJncydgO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBhcmdzQ29tbWFuZDtcbiAgfVxuXG4gIHByaXZhdGUgZ2VuZXJhdGVPcHRpb25zKGNvbW1hbmQ6IENvbW1hbmQsIHBhdGg6IHN0cmluZykge1xuICAgIGNvbnN0IG9wdGlvbnM6IHN0cmluZ1tdID0gW107XG4gICAgY29uc3QgY21kQXJnczogc3RyaW5nW10gPSBwYXRoLnNwbGl0KFwiIFwiKTtcbiAgICBjb25zdCBfYmFzZU5hbWU6IHN0cmluZyA9IGNtZEFyZ3Muc2hpZnQoKSBhcyBzdHJpbmc7XG4gICAgY29uc3QgY29tcGxldGlvbnNQYXRoOiBzdHJpbmcgPSBjbWRBcmdzLmpvaW4oXCIgXCIpO1xuXG4gICAgY29uc3QgZXhjbHVkZWRGbGFnczogc3RyaW5nW10gPSBjb21tYW5kLmdldE9wdGlvbnMoZmFsc2UpXG4gICAgICAubWFwKChvcHRpb24pID0+IG9wdGlvbi5zdGFuZGFsb25lID8gb3B0aW9uLmZsYWdzIDogZmFsc2UpXG4gICAgICAuZmxhdCgpXG4gICAgICAuZmlsdGVyKChmbGFnKSA9PiB0eXBlb2YgZmxhZyA9PT0gXCJzdHJpbmdcIikgYXMgc3RyaW5nW107XG5cbiAgICBmb3IgKGNvbnN0IG9wdGlvbiBvZiBjb21tYW5kLmdldE9wdGlvbnMoZmFsc2UpKSB7XG4gICAgICBvcHRpb25zLnB1c2goXG4gICAgICAgIHRoaXMuZ2VuZXJhdGVPcHRpb24oY29tbWFuZCwgb3B0aW9uLCBjb21wbGV0aW9uc1BhdGgsIGV4Y2x1ZGVkRmxhZ3MpLFxuICAgICAgKTtcbiAgICB9XG5cbiAgICByZXR1cm4gb3B0aW9ucztcbiAgfVxuXG4gIHByaXZhdGUgZ2VuZXJhdGVPcHRpb24oXG4gICAgY29tbWFuZDogQ29tbWFuZCxcbiAgICBvcHRpb246IE9wdGlvbixcbiAgICBjb21wbGV0aW9uc1BhdGg6IHN0cmluZyxcbiAgICBleGNsdWRlZE9wdGlvbnM6IHN0cmluZ1tdLFxuICApOiBzdHJpbmcge1xuICAgIGxldCBhcmdzID0gXCJcIjtcbiAgICBmb3IgKGNvbnN0IGFyZyBvZiBvcHRpb24uYXJncykge1xuICAgICAgY29uc3QgdHlwZSA9IGNvbW1hbmQuZ2V0VHlwZShhcmcudHlwZSk7XG4gICAgICBjb25zdCBvcHRpb25hbFZhbHVlID0gYXJnLm9wdGlvbmFsVmFsdWUgPyBcIjo6XCIgOiBcIjpcIjtcbiAgICAgIGlmICh0eXBlICYmIHR5cGUuaGFuZGxlciBpbnN0YW5jZW9mIEZpbGVUeXBlKSB7XG4gICAgICAgIGNvbnN0IGZpbGVDb21wbGV0aW9ucyA9IHRoaXMuZ2V0RmlsZUNvbXBsZXRpb25zKHR5cGUpO1xuICAgICAgICBhcmdzICs9IGAke29wdGlvbmFsVmFsdWV9JHthcmcubmFtZX06JHtmaWxlQ29tcGxldGlvbnN9YDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IGFjdGlvbiA9IHRoaXMuYWRkQWN0aW9uKGFyZywgY29tcGxldGlvbnNQYXRoKTtcbiAgICAgICAgYXJncyArPSBgJHtvcHRpb25hbFZhbHVlfSR7YXJnLm5hbWV9Oi0+JHthY3Rpb24ubmFtZX1gO1xuICAgICAgfVxuICAgIH1cbiAgICBjb25zdCBkZXNjcmlwdGlvbjogc3RyaW5nID0gZ2V0RGVzY3JpcHRpb24ob3B0aW9uLmRlc2NyaXB0aW9uLCB0cnVlKVxuICAgICAgLy8gZXNjYXBlIGJyYWNrZXRzIGFuZCBxdW90ZXNcbiAgICAgIC5yZXBsYWNlKC9cXFsvZywgXCJcXFxcW1wiKVxuICAgICAgLnJlcGxhY2UoL10vZywgXCJcXFxcXVwiKVxuICAgICAgLnJlcGxhY2UoL1wiL2csICdcXFxcXCInKVxuICAgICAgLnJlcGxhY2UoLycvZywgXCInXFxcIidcXFwiJ1wiKTtcblxuICAgIGNvbnN0IGNvbGxlY3Q6IHN0cmluZyA9IG9wdGlvbi5jb2xsZWN0ID8gXCIqXCIgOiBcIlwiO1xuICAgIGNvbnN0IGVxdWFsc1NpZ24gPSBvcHRpb24uZXF1YWxzU2lnbiA/IFwiPVwiIDogXCJcIjtcbiAgICBjb25zdCBmbGFncyA9IG9wdGlvbi5mbGFncy5tYXAoKGZsYWcpID0+IGAke2ZsYWd9JHtlcXVhbHNTaWdufWApO1xuICAgIGxldCByZXN1bHQgPSBcIlwiO1xuXG4gICAgaWYgKG9wdGlvbi5zdGFuZGFsb25lKSB7XG4gICAgICByZXN1bHQgKz0gXCInKC0gKiknXCI7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IGV4Y2x1ZGVkRmxhZ3MgPSBbLi4uZXhjbHVkZWRPcHRpb25zXTtcblxuICAgICAgaWYgKG9wdGlvbi5jb25mbGljdHM/Lmxlbmd0aCkge1xuICAgICAgICBleGNsdWRlZEZsYWdzLnB1c2goXG4gICAgICAgICAgLi4ub3B0aW9uLmNvbmZsaWN0cy5tYXAoKG9wdCkgPT4gXCItLVwiICsgb3B0LnJlcGxhY2UoL14tLS8sIFwiXCIpKSxcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICAgIGlmICghb3B0aW9uLmNvbGxlY3QpIHtcbiAgICAgICAgZXhjbHVkZWRGbGFncy5wdXNoKC4uLm9wdGlvbi5mbGFncyk7XG4gICAgICB9XG4gICAgICBpZiAoZXhjbHVkZWRGbGFncy5sZW5ndGgpIHtcbiAgICAgICAgcmVzdWx0ICs9IGAnKCR7ZXhjbHVkZWRGbGFncy5qb2luKFwiIFwiKX0pJ2A7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGNvbGxlY3QgfHwgZmxhZ3MubGVuZ3RoID4gMSkge1xuICAgICAgcmVzdWx0ICs9IGB7JHtjb2xsZWN0fSR7ZmxhZ3Muam9pbihcIixcIil9fWA7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJlc3VsdCArPSBgJHtmbGFncy5qb2luKFwiLFwiKX1gO1xuICAgIH1cblxuICAgIHJldHVybiBgJHtyZXN1bHR9J1ske2Rlc2NyaXB0aW9ufV0ke2FyZ3N9J2A7XG4gIH1cblxuICBwcml2YXRlIGdldEZpbGVDb21wbGV0aW9ucyh0eXBlOiBUeXBlRGVmKSB7XG4gICAgaWYgKCEodHlwZS5oYW5kbGVyIGluc3RhbmNlb2YgRmlsZVR5cGUpKSB7XG4gICAgICByZXR1cm4gXCJcIjtcbiAgICB9XG4gICAgcmV0dXJuIFwiX2ZpbGVzXCI7XG4gICAgLy8gY29uc3QgZmlsZU9wdHMgPSB0eXBlLmhhbmRsZXIuZ2V0T3B0aW9ucygpO1xuICAgIC8vIGxldCBmaWxlQ29tcGxldGlvbnMgPSBcIl9maWxlc1wiO1xuICAgIC8vIGlmIChmaWxlT3B0cy5kaXJzT25seSkge1xuICAgIC8vICAgZmlsZUNvbXBsZXRpb25zICs9IFwiIC0vXCI7XG4gICAgLy8gfVxuICAgIC8vIGlmIChmaWxlT3B0cy5wYXR0ZXJuKSB7XG4gICAgLy8gICBmaWxlQ29tcGxldGlvbnMgKz0gJyAtZyBcIicgKyBmaWxlT3B0cy5wYXR0ZXJuICsgJ1wiJztcbiAgICAvLyB9XG4gICAgLy8gaWYgKGZpbGVPcHRzLmlnbm9yZSkge1xuICAgIC8vICAgZmlsZUNvbXBsZXRpb25zICs9IFwiIC1GIFwiICsgZmlsZU9wdHMuaWdub3JlO1xuICAgIC8vIH1cbiAgICAvLyByZXR1cm4gZmlsZUNvbXBsZXRpb25zO1xuICB9XG5cbiAgcHJpdmF0ZSBhZGRBY3Rpb24oYXJnOiBBcmd1bWVudCwgY21kOiBzdHJpbmcpOiBJQ29tcGxldGlvbkFjdGlvbiB7XG4gICAgY29uc3QgYWN0aW9uID0gYCR7YXJnLm5hbWV9LSR7YXJnLmFjdGlvbn1gO1xuXG4gICAgaWYgKCF0aGlzLmFjdGlvbnMuaGFzKGFjdGlvbikpIHtcbiAgICAgIHRoaXMuYWN0aW9ucy5zZXQoYWN0aW9uLCB7XG4gICAgICAgIGFyZzogYXJnLFxuICAgICAgICBsYWJlbDogYCR7YXJnLm5hbWV9OiAke2FyZy5hY3Rpb259YCxcbiAgICAgICAgbmFtZTogYWN0aW9uLFxuICAgICAgICBjbWQsXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5hY3Rpb25zLmdldChhY3Rpb24pIGFzIElDb21wbGV0aW9uQWN0aW9uO1xuICB9XG5cbiAgcHJpdmF0ZSBnZW5lcmF0ZUFjdGlvbnMoY29tbWFuZDogQ29tbWFuZCk6IHN0cmluZyB7XG4gICAgbGV0IGFjdGlvbnM6IHN0cmluZ1tdID0gW107XG5cbiAgICBpZiAodGhpcy5hY3Rpb25zLnNpemUpIHtcbiAgICAgIGFjdGlvbnMgPSBBcnJheVxuICAgICAgICAuZnJvbSh0aGlzLmFjdGlvbnMpXG4gICAgICAgIC5tYXAoKFtuYW1lLCBhY3Rpb25dKSA9PlxuICAgICAgICAgIGAke25hbWV9KSBfXyR7XG4gICAgICAgICAgICByZXBsYWNlU3BlY2lhbENoYXJzKHRoaXMuY21kLmdldE5hbWUoKSlcbiAgICAgICAgICB9X2NvbXBsZXRlICR7YWN0aW9uLmFyZy5uYW1lfSAke2FjdGlvbi5hcmcuYWN0aW9ufSAke2FjdGlvbi5jbWR9IDs7YFxuICAgICAgICApO1xuICAgIH1cblxuICAgIGlmIChjb21tYW5kLmhhc0NvbW1hbmRzKGZhbHNlKSkge1xuICAgICAgYWN0aW9ucy51bnNoaWZ0KGBjb21tYW5kX2FyZ3MpIF9jb21tYW5kX2FyZ3MgOztgKTtcbiAgICB9XG5cbiAgICBpZiAoYWN0aW9ucy5sZW5ndGgpIHtcbiAgICAgIHJldHVybiBgXFxuXFxuICBjYXNlIFwiJHN0YXRlXCIgaW5cXG4gICAgJHthY3Rpb25zLmpvaW4oXCJcXG4gICAgXCIpfVxcbiAgZXNhY2A7XG4gICAgfVxuXG4gICAgcmV0dXJuIFwiXCI7XG4gIH1cbn1cblxuZnVuY3Rpb24gcmVwbGFjZVNwZWNpYWxDaGFycyhzdHI6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBzdHIucmVwbGFjZSgvW15hLXpBLVowLTldL2csIFwiX1wiKTtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxTQUFTLGNBQWMsUUFBUSxlQUFlO0FBRzlDLFNBQVMsUUFBUSxRQUFRLG1CQUFtQjtBQVM1QyxzQ0FBc0MsR0FDdEMsT0FBTyxNQUFNOztFQUNILFFBQW9EO0VBRTVELHdEQUF3RCxHQUN4RCxPQUFjLFNBQVMsR0FBWSxFQUFFO0lBQ25DLE9BQU8sSUFBSSx3QkFBd0IsS0FBSyxRQUFRO0VBQ2xEO0VBRUEsWUFBb0IsQUFBVSxHQUFZLENBQUU7U0FBZCxNQUFBO1NBUHRCLFVBQTBD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