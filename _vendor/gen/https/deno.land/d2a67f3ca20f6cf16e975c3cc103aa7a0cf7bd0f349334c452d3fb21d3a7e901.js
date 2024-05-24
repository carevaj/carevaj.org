import { FileType } from "../types/file.ts";
/** Generates bash completions script. */ export class BashCompletionsGenerator {
  cmd;
  /** Generates bash completions script for given command. */ static generate(cmd) {
    return new BashCompletionsGenerator(cmd).generate();
  }
  constructor(cmd){
    this.cmd = cmd;
  }
  /** Generates bash completions code. */ generate() {
    const path = this.cmd.getPath();
    const version = this.cmd.getVersion() ? ` v${this.cmd.getVersion()}` : "";
    return `#!/usr/bin/env bash
# bash completion support for ${path}${version}

_${replaceSpecialChars(path)}() {
  local word cur prev listFiles
  local -a opts
  COMPREPLY=()
  cur="\${COMP_WORDS[COMP_CWORD]}"
  prev="\${COMP_WORDS[COMP_CWORD-1]}"
  cmd="_"
  opts=()
  listFiles=0

  _${replaceSpecialChars(this.cmd.getName())}_complete() {
    local action="$1"; shift
    mapfile -t values < <( ${this.cmd.getName()} completions complete "\${action}" "\${@}" )
    for i in "\${values[@]}"; do
      opts+=("$i")
    done
  }

  _${replaceSpecialChars(this.cmd.getName())}_expand() {
    [ "$cur" != "\${cur%\\\\}" ] && cur="$cur\\\\"
  
    # expand ~username type directory specifications
    if [[ "$cur" == \\~*/* ]]; then
      # shellcheck disable=SC2086
      eval cur=$cur
      
    elif [[ "$cur" == \\~* ]]; then
      cur=\${cur#\\~}
      # shellcheck disable=SC2086,SC2207
      COMPREPLY=( $( compgen -P '~' -u $cur ) )
      return \${#COMPREPLY[@]}
    fi
  }

  # shellcheck disable=SC2120
  _${replaceSpecialChars(this.cmd.getName())}_file_dir() {
    listFiles=1
    local IFS=$'\\t\\n' xspec #glob
    _${replaceSpecialChars(this.cmd.getName())}_expand || return 0
  
    if [ "\${1:-}" = -d ]; then
      # shellcheck disable=SC2206,SC2207,SC2086
      COMPREPLY=( \${COMPREPLY[@]:-} $( compgen -d -- $cur ) )
      #eval "$glob"    # restore glob setting.
      return 0
    fi
  
    xspec=\${1:+"!*.$1"}	# set only if glob passed in as $1
    # shellcheck disable=SC2206,SC2207
    COMPREPLY=( \${COMPREPLY[@]:-} $( compgen -f -X "$xspec" -- "$cur" ) \
          $( compgen -d -- "$cur" ) )
  }

  ${this.generateCompletions(this.cmd).trim()}

  for word in "\${COMP_WORDS[@]}"; do
    case "\${word}" in
      -*) ;;
      *)
        cmd_tmp="\${cmd}_\${word//[^[:alnum:]]/_}"
        if type "\${cmd_tmp}" &>/dev/null; then
          cmd="\${cmd_tmp}"
        fi
    esac
  done

  \${cmd}

  if [[ listFiles -eq 1 ]]; then
    return 0
  fi

  if [[ \${#opts[@]} -eq 0 ]]; then
    # shellcheck disable=SC2207
    COMPREPLY=($(compgen -f "\${cur}"))
    return 0
  fi

  local values
  values="$( printf "\\n%s" "\${opts[@]}" )"
  local IFS=$'\\n'
  # shellcheck disable=SC2207
  local result=($(compgen -W "\${values[@]}" -- "\${cur}"))
  if [[ \${#result[@]} -eq 0 ]]; then
    # shellcheck disable=SC2207
    COMPREPLY=($(compgen -f "\${cur}"))
  else
    # shellcheck disable=SC2207
    COMPREPLY=($(printf '%q\\n' "\${result[@]}"))
  fi

  return 0
}

complete -F _${replaceSpecialChars(path)} -o bashdefault -o default ${path}`;
  }
  /** Generates bash completions method for given command and child commands. */ generateCompletions(command, path = "", index = 1) {
    path = (path ? path + " " : "") + command.getName();
    const commandCompletions = this.generateCommandCompletions(command, path, index);
    const childCommandCompletions = command.getCommands(false).filter((subCommand)=>subCommand !== command).map((subCommand)=>this.generateCompletions(subCommand, path, index + 1)).join("");
    return `${commandCompletions}

${childCommandCompletions}`;
  }
  generateCommandCompletions(command, path, index) {
    const flags = this.getFlags(command);
    const childCommandNames = command.getCommands(false).map((childCommand)=>childCommand.getName());
    const completionsPath = ~path.indexOf(" ") ? " " + path.split(" ").slice(1).join(" ") : "";
    const optionArguments = this.generateOptionArguments(command, completionsPath);
    const completionsCmd = this.generateCommandCompletionsCommand(command, completionsPath);
    return `  __${replaceSpecialChars(path)}() {
    opts=(${[
      ...flags,
      ...childCommandNames
    ].join(" ")})
    ${completionsCmd}
    if [[ \${cur} == -* || \${COMP_CWORD} -eq ${index} ]] ; then
      return 0
    fi
    ${optionArguments}
  }`;
  }
  getFlags(command) {
    return command.getOptions(false).map((option)=>option.flags).flat();
  }
  generateOptionArguments(command, completionsPath) {
    let opts = "";
    const options = command.getOptions(false);
    if (options.length) {
      opts += 'case "${prev}" in';
      for (const option of options){
        const flags = option.flags.map((flag)=>flag.trim()).join("|");
        const completionsCmd = this.generateOptionCompletionsCommand(command, option.args, completionsPath, {
          standalone: option.standalone
        });
        opts += `\n      ${flags}) ${completionsCmd} ;;`;
      }
      opts += "\n    esac";
    }
    return opts;
  }
  generateCommandCompletionsCommand(command, path) {
    const args = command.getArguments();
    if (args.length) {
      const type = command.getType(args[0].type);
      if (type && type.handler instanceof FileType) {
        return `_${replaceSpecialChars(this.cmd.getName())}_file_dir`;
      }
      // @TODO: add support for multiple arguments
      return `_${replaceSpecialChars(this.cmd.getName())}_complete ${args[0].action}${path}`;
    }
    return "";
  }
  generateOptionCompletionsCommand(command, args, path, opts) {
    if (args.length) {
      const type = command.getType(args[0].type);
      if (type && type.handler instanceof FileType) {
        return `opts=(); _${replaceSpecialChars(this.cmd.getName())}_file_dir`;
      }
      // @TODO: add support for multiple arguments
      return `opts=(); _${replaceSpecialChars(this.cmd.getName())}_complete ${args[0].action}${path}`;
    }
    if (opts?.standalone) {
      return "opts=()";
    }
    return "";
  }
}
function replaceSpecialChars(str) {
  return str.replace(/[^a-zA-Z0-9]/g, "_");
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvY2xpZmZ5QHYwLjI1LjcvY29tbWFuZC9jb21wbGV0aW9ucy9fYmFzaF9jb21wbGV0aW9uc19nZW5lcmF0b3IudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHR5cGUgeyBDb21tYW5kIH0gZnJvbSBcIi4uL2NvbW1hbmQudHNcIjtcbmltcG9ydCB0eXBlIHsgQXJndW1lbnQgfSBmcm9tIFwiLi4vdHlwZXMudHNcIjtcbmltcG9ydCB7IEZpbGVUeXBlIH0gZnJvbSBcIi4uL3R5cGVzL2ZpbGUudHNcIjtcblxuLyoqIEdlbmVyYXRlcyBiYXNoIGNvbXBsZXRpb25zIHNjcmlwdC4gKi9cbmV4cG9ydCBjbGFzcyBCYXNoQ29tcGxldGlvbnNHZW5lcmF0b3Ige1xuICAvKiogR2VuZXJhdGVzIGJhc2ggY29tcGxldGlvbnMgc2NyaXB0IGZvciBnaXZlbiBjb21tYW5kLiAqL1xuICBwdWJsaWMgc3RhdGljIGdlbmVyYXRlKGNtZDogQ29tbWFuZCkge1xuICAgIHJldHVybiBuZXcgQmFzaENvbXBsZXRpb25zR2VuZXJhdG9yKGNtZCkuZ2VuZXJhdGUoKTtcbiAgfVxuXG4gIHByaXZhdGUgY29uc3RydWN0b3IocHJvdGVjdGVkIGNtZDogQ29tbWFuZCkge31cblxuICAvKiogR2VuZXJhdGVzIGJhc2ggY29tcGxldGlvbnMgY29kZS4gKi9cbiAgcHJpdmF0ZSBnZW5lcmF0ZSgpOiBzdHJpbmcge1xuICAgIGNvbnN0IHBhdGggPSB0aGlzLmNtZC5nZXRQYXRoKCk7XG4gICAgY29uc3QgdmVyc2lvbjogc3RyaW5nIHwgdW5kZWZpbmVkID0gdGhpcy5jbWQuZ2V0VmVyc2lvbigpXG4gICAgICA/IGAgdiR7dGhpcy5jbWQuZ2V0VmVyc2lvbigpfWBcbiAgICAgIDogXCJcIjtcblxuICAgIHJldHVybiBgIyEvdXNyL2Jpbi9lbnYgYmFzaFxuIyBiYXNoIGNvbXBsZXRpb24gc3VwcG9ydCBmb3IgJHtwYXRofSR7dmVyc2lvbn1cblxuXyR7cmVwbGFjZVNwZWNpYWxDaGFycyhwYXRoKX0oKSB7XG4gIGxvY2FsIHdvcmQgY3VyIHByZXYgbGlzdEZpbGVzXG4gIGxvY2FsIC1hIG9wdHNcbiAgQ09NUFJFUExZPSgpXG4gIGN1cj1cIlxcJHtDT01QX1dPUkRTW0NPTVBfQ1dPUkRdfVwiXG4gIHByZXY9XCJcXCR7Q09NUF9XT1JEU1tDT01QX0NXT1JELTFdfVwiXG4gIGNtZD1cIl9cIlxuICBvcHRzPSgpXG4gIGxpc3RGaWxlcz0wXG5cbiAgXyR7cmVwbGFjZVNwZWNpYWxDaGFycyh0aGlzLmNtZC5nZXROYW1lKCkpfV9jb21wbGV0ZSgpIHtcbiAgICBsb2NhbCBhY3Rpb249XCIkMVwiOyBzaGlmdFxuICAgIG1hcGZpbGUgLXQgdmFsdWVzIDwgPCggJHt0aGlzLmNtZC5nZXROYW1lKCl9IGNvbXBsZXRpb25zIGNvbXBsZXRlIFwiXFwke2FjdGlvbn1cIiBcIlxcJHtAfVwiIClcbiAgICBmb3IgaSBpbiBcIlxcJHt2YWx1ZXNbQF19XCI7IGRvXG4gICAgICBvcHRzKz0oXCIkaVwiKVxuICAgIGRvbmVcbiAgfVxuXG4gIF8ke3JlcGxhY2VTcGVjaWFsQ2hhcnModGhpcy5jbWQuZ2V0TmFtZSgpKX1fZXhwYW5kKCkge1xuICAgIFsgXCIkY3VyXCIgIT0gXCJcXCR7Y3VyJVxcXFxcXFxcfVwiIF0gJiYgY3VyPVwiJGN1clxcXFxcXFxcXCJcbiAgXG4gICAgIyBleHBhbmQgfnVzZXJuYW1lIHR5cGUgZGlyZWN0b3J5IHNwZWNpZmljYXRpb25zXG4gICAgaWYgW1sgXCIkY3VyXCIgPT0gXFxcXH4qLyogXV07IHRoZW5cbiAgICAgICMgc2hlbGxjaGVjayBkaXNhYmxlPVNDMjA4NlxuICAgICAgZXZhbCBjdXI9JGN1clxuICAgICAgXG4gICAgZWxpZiBbWyBcIiRjdXJcIiA9PSBcXFxcfiogXV07IHRoZW5cbiAgICAgIGN1cj1cXCR7Y3VyI1xcXFx+fVxuICAgICAgIyBzaGVsbGNoZWNrIGRpc2FibGU9U0MyMDg2LFNDMjIwN1xuICAgICAgQ09NUFJFUExZPSggJCggY29tcGdlbiAtUCAnficgLXUgJGN1ciApIClcbiAgICAgIHJldHVybiBcXCR7I0NPTVBSRVBMWVtAXX1cbiAgICBmaVxuICB9XG5cbiAgIyBzaGVsbGNoZWNrIGRpc2FibGU9U0MyMTIwXG4gIF8ke3JlcGxhY2VTcGVjaWFsQ2hhcnModGhpcy5jbWQuZ2V0TmFtZSgpKX1fZmlsZV9kaXIoKSB7XG4gICAgbGlzdEZpbGVzPTFcbiAgICBsb2NhbCBJRlM9JCdcXFxcdFxcXFxuJyB4c3BlYyAjZ2xvYlxuICAgIF8ke3JlcGxhY2VTcGVjaWFsQ2hhcnModGhpcy5jbWQuZ2V0TmFtZSgpKX1fZXhwYW5kIHx8IHJldHVybiAwXG4gIFxuICAgIGlmIFsgXCJcXCR7MTotfVwiID0gLWQgXTsgdGhlblxuICAgICAgIyBzaGVsbGNoZWNrIGRpc2FibGU9U0MyMjA2LFNDMjIwNyxTQzIwODZcbiAgICAgIENPTVBSRVBMWT0oIFxcJHtDT01QUkVQTFlbQF06LX0gJCggY29tcGdlbiAtZCAtLSAkY3VyICkgKVxuICAgICAgI2V2YWwgXCIkZ2xvYlwiICAgICMgcmVzdG9yZSBnbG9iIHNldHRpbmcuXG4gICAgICByZXR1cm4gMFxuICAgIGZpXG4gIFxuICAgIHhzcGVjPVxcJHsxOitcIiEqLiQxXCJ9XHQjIHNldCBvbmx5IGlmIGdsb2IgcGFzc2VkIGluIGFzICQxXG4gICAgIyBzaGVsbGNoZWNrIGRpc2FibGU9U0MyMjA2LFNDMjIwN1xuICAgIENPTVBSRVBMWT0oIFxcJHtDT01QUkVQTFlbQF06LX0gJCggY29tcGdlbiAtZiAtWCBcIiR4c3BlY1wiIC0tIFwiJGN1clwiICkgXFxcbiAgICAgICAgICAkKCBjb21wZ2VuIC1kIC0tIFwiJGN1clwiICkgKVxuICB9XG5cbiAgJHt0aGlzLmdlbmVyYXRlQ29tcGxldGlvbnModGhpcy5jbWQpLnRyaW0oKX1cblxuICBmb3Igd29yZCBpbiBcIlxcJHtDT01QX1dPUkRTW0BdfVwiOyBkb1xuICAgIGNhc2UgXCJcXCR7d29yZH1cIiBpblxuICAgICAgLSopIDs7XG4gICAgICAqKVxuICAgICAgICBjbWRfdG1wPVwiXFwke2NtZH1fXFwke3dvcmQvL1teWzphbG51bTpdXS9ffVwiXG4gICAgICAgIGlmIHR5cGUgXCJcXCR7Y21kX3RtcH1cIiAmPi9kZXYvbnVsbDsgdGhlblxuICAgICAgICAgIGNtZD1cIlxcJHtjbWRfdG1wfVwiXG4gICAgICAgIGZpXG4gICAgZXNhY1xuICBkb25lXG5cbiAgXFwke2NtZH1cblxuICBpZiBbWyBsaXN0RmlsZXMgLWVxIDEgXV07IHRoZW5cbiAgICByZXR1cm4gMFxuICBmaVxuXG4gIGlmIFtbIFxcJHsjb3B0c1tAXX0gLWVxIDAgXV07IHRoZW5cbiAgICAjIHNoZWxsY2hlY2sgZGlzYWJsZT1TQzIyMDdcbiAgICBDT01QUkVQTFk9KCQoY29tcGdlbiAtZiBcIlxcJHtjdXJ9XCIpKVxuICAgIHJldHVybiAwXG4gIGZpXG5cbiAgbG9jYWwgdmFsdWVzXG4gIHZhbHVlcz1cIiQoIHByaW50ZiBcIlxcXFxuJXNcIiBcIlxcJHtvcHRzW0BdfVwiIClcIlxuICBsb2NhbCBJRlM9JCdcXFxcbidcbiAgIyBzaGVsbGNoZWNrIGRpc2FibGU9U0MyMjA3XG4gIGxvY2FsIHJlc3VsdD0oJChjb21wZ2VuIC1XIFwiXFwke3ZhbHVlc1tAXX1cIiAtLSBcIlxcJHtjdXJ9XCIpKVxuICBpZiBbWyBcXCR7I3Jlc3VsdFtAXX0gLWVxIDAgXV07IHRoZW5cbiAgICAjIHNoZWxsY2hlY2sgZGlzYWJsZT1TQzIyMDdcbiAgICBDT01QUkVQTFk9KCQoY29tcGdlbiAtZiBcIlxcJHtjdXJ9XCIpKVxuICBlbHNlXG4gICAgIyBzaGVsbGNoZWNrIGRpc2FibGU9U0MyMjA3XG4gICAgQ09NUFJFUExZPSgkKHByaW50ZiAnJXFcXFxcbicgXCJcXCR7cmVzdWx0W0BdfVwiKSlcbiAgZmlcblxuICByZXR1cm4gMFxufVxuXG5jb21wbGV0ZSAtRiBfJHtyZXBsYWNlU3BlY2lhbENoYXJzKHBhdGgpfSAtbyBiYXNoZGVmYXVsdCAtbyBkZWZhdWx0ICR7cGF0aH1gO1xuICB9XG5cbiAgLyoqIEdlbmVyYXRlcyBiYXNoIGNvbXBsZXRpb25zIG1ldGhvZCBmb3IgZ2l2ZW4gY29tbWFuZCBhbmQgY2hpbGQgY29tbWFuZHMuICovXG4gIHByaXZhdGUgZ2VuZXJhdGVDb21wbGV0aW9ucyhjb21tYW5kOiBDb21tYW5kLCBwYXRoID0gXCJcIiwgaW5kZXggPSAxKTogc3RyaW5nIHtcbiAgICBwYXRoID0gKHBhdGggPyBwYXRoICsgXCIgXCIgOiBcIlwiKSArIGNvbW1hbmQuZ2V0TmFtZSgpO1xuICAgIGNvbnN0IGNvbW1hbmRDb21wbGV0aW9ucyA9IHRoaXMuZ2VuZXJhdGVDb21tYW5kQ29tcGxldGlvbnMoXG4gICAgICBjb21tYW5kLFxuICAgICAgcGF0aCxcbiAgICAgIGluZGV4LFxuICAgICk7XG4gICAgY29uc3QgY2hpbGRDb21tYW5kQ29tcGxldGlvbnM6IHN0cmluZyA9IGNvbW1hbmQuZ2V0Q29tbWFuZHMoZmFsc2UpXG4gICAgICAuZmlsdGVyKChzdWJDb21tYW5kOiBDb21tYW5kKSA9PiBzdWJDb21tYW5kICE9PSBjb21tYW5kKVxuICAgICAgLm1hcCgoc3ViQ29tbWFuZDogQ29tbWFuZCkgPT5cbiAgICAgICAgdGhpcy5nZW5lcmF0ZUNvbXBsZXRpb25zKHN1YkNvbW1hbmQsIHBhdGgsIGluZGV4ICsgMSlcbiAgICAgIClcbiAgICAgIC5qb2luKFwiXCIpO1xuXG4gICAgcmV0dXJuIGAke2NvbW1hbmRDb21wbGV0aW9uc31cblxuJHtjaGlsZENvbW1hbmRDb21wbGV0aW9uc31gO1xuICB9XG5cbiAgcHJpdmF0ZSBnZW5lcmF0ZUNvbW1hbmRDb21wbGV0aW9ucyhcbiAgICBjb21tYW5kOiBDb21tYW5kLFxuICAgIHBhdGg6IHN0cmluZyxcbiAgICBpbmRleDogbnVtYmVyLFxuICApOiBzdHJpbmcge1xuICAgIGNvbnN0IGZsYWdzOiBzdHJpbmdbXSA9IHRoaXMuZ2V0RmxhZ3MoY29tbWFuZCk7XG5cbiAgICBjb25zdCBjaGlsZENvbW1hbmROYW1lczogc3RyaW5nW10gPSBjb21tYW5kLmdldENvbW1hbmRzKGZhbHNlKVxuICAgICAgLm1hcCgoY2hpbGRDb21tYW5kOiBDb21tYW5kKSA9PiBjaGlsZENvbW1hbmQuZ2V0TmFtZSgpKTtcblxuICAgIGNvbnN0IGNvbXBsZXRpb25zUGF0aDogc3RyaW5nID0gfnBhdGguaW5kZXhPZihcIiBcIilcbiAgICAgID8gXCIgXCIgKyBwYXRoLnNwbGl0KFwiIFwiKS5zbGljZSgxKS5qb2luKFwiIFwiKVxuICAgICAgOiBcIlwiO1xuXG4gICAgY29uc3Qgb3B0aW9uQXJndW1lbnRzID0gdGhpcy5nZW5lcmF0ZU9wdGlvbkFyZ3VtZW50cyhcbiAgICAgIGNvbW1hbmQsXG4gICAgICBjb21wbGV0aW9uc1BhdGgsXG4gICAgKTtcblxuICAgIGNvbnN0IGNvbXBsZXRpb25zQ21kOiBzdHJpbmcgPSB0aGlzLmdlbmVyYXRlQ29tbWFuZENvbXBsZXRpb25zQ29tbWFuZChcbiAgICAgIGNvbW1hbmQsXG4gICAgICBjb21wbGV0aW9uc1BhdGgsXG4gICAgKTtcblxuICAgIHJldHVybiBgICBfXyR7cmVwbGFjZVNwZWNpYWxDaGFycyhwYXRoKX0oKSB7XG4gICAgb3B0cz0oJHtbLi4uZmxhZ3MsIC4uLmNoaWxkQ29tbWFuZE5hbWVzXS5qb2luKFwiIFwiKX0pXG4gICAgJHtjb21wbGV0aW9uc0NtZH1cbiAgICBpZiBbWyBcXCR7Y3VyfSA9PSAtKiB8fCBcXCR7Q09NUF9DV09SRH0gLWVxICR7aW5kZXh9IF1dIDsgdGhlblxuICAgICAgcmV0dXJuIDBcbiAgICBmaVxuICAgICR7b3B0aW9uQXJndW1lbnRzfVxuICB9YDtcbiAgfVxuXG4gIHByaXZhdGUgZ2V0RmxhZ3MoY29tbWFuZDogQ29tbWFuZCk6IHN0cmluZ1tdIHtcbiAgICByZXR1cm4gY29tbWFuZC5nZXRPcHRpb25zKGZhbHNlKVxuICAgICAgLm1hcCgob3B0aW9uKSA9PiBvcHRpb24uZmxhZ3MpXG4gICAgICAuZmxhdCgpO1xuICB9XG5cbiAgcHJpdmF0ZSBnZW5lcmF0ZU9wdGlvbkFyZ3VtZW50cyhcbiAgICBjb21tYW5kOiBDb21tYW5kLFxuICAgIGNvbXBsZXRpb25zUGF0aDogc3RyaW5nLFxuICApOiBzdHJpbmcge1xuICAgIGxldCBvcHRzID0gXCJcIjtcbiAgICBjb25zdCBvcHRpb25zID0gY29tbWFuZC5nZXRPcHRpb25zKGZhbHNlKTtcbiAgICBpZiAob3B0aW9ucy5sZW5ndGgpIHtcbiAgICAgIG9wdHMgKz0gJ2Nhc2UgXCIke3ByZXZ9XCIgaW4nO1xuICAgICAgZm9yIChjb25zdCBvcHRpb24gb2Ygb3B0aW9ucykge1xuICAgICAgICBjb25zdCBmbGFnczogc3RyaW5nID0gb3B0aW9uLmZsYWdzXG4gICAgICAgICAgLm1hcCgoZmxhZzogc3RyaW5nKSA9PiBmbGFnLnRyaW0oKSlcbiAgICAgICAgICAuam9pbihcInxcIik7XG5cbiAgICAgICAgY29uc3QgY29tcGxldGlvbnNDbWQ6IHN0cmluZyA9IHRoaXMuZ2VuZXJhdGVPcHRpb25Db21wbGV0aW9uc0NvbW1hbmQoXG4gICAgICAgICAgY29tbWFuZCxcbiAgICAgICAgICBvcHRpb24uYXJncyxcbiAgICAgICAgICBjb21wbGV0aW9uc1BhdGgsXG4gICAgICAgICAgeyBzdGFuZGFsb25lOiBvcHRpb24uc3RhbmRhbG9uZSB9LFxuICAgICAgICApO1xuXG4gICAgICAgIG9wdHMgKz0gYFxcbiAgICAgICR7ZmxhZ3N9KSAke2NvbXBsZXRpb25zQ21kfSA7O2A7XG4gICAgICB9XG4gICAgICBvcHRzICs9IFwiXFxuICAgIGVzYWNcIjtcbiAgICB9XG5cbiAgICByZXR1cm4gb3B0cztcbiAgfVxuXG4gIHByaXZhdGUgZ2VuZXJhdGVDb21tYW5kQ29tcGxldGlvbnNDb21tYW5kKFxuICAgIGNvbW1hbmQ6IENvbW1hbmQsXG4gICAgcGF0aDogc3RyaW5nLFxuICApIHtcbiAgICBjb25zdCBhcmdzOiBBcmd1bWVudFtdID0gY29tbWFuZC5nZXRBcmd1bWVudHMoKTtcbiAgICBpZiAoYXJncy5sZW5ndGgpIHtcbiAgICAgIGNvbnN0IHR5cGUgPSBjb21tYW5kLmdldFR5cGUoYXJnc1swXS50eXBlKTtcbiAgICAgIGlmICh0eXBlICYmIHR5cGUuaGFuZGxlciBpbnN0YW5jZW9mIEZpbGVUeXBlKSB7XG4gICAgICAgIHJldHVybiBgXyR7cmVwbGFjZVNwZWNpYWxDaGFycyh0aGlzLmNtZC5nZXROYW1lKCkpfV9maWxlX2RpcmA7XG4gICAgICB9XG4gICAgICAvLyBAVE9ETzogYWRkIHN1cHBvcnQgZm9yIG11bHRpcGxlIGFyZ3VtZW50c1xuICAgICAgcmV0dXJuIGBfJHtyZXBsYWNlU3BlY2lhbENoYXJzKHRoaXMuY21kLmdldE5hbWUoKSl9X2NvbXBsZXRlICR7XG4gICAgICAgIGFyZ3NbMF0uYWN0aW9uXG4gICAgICB9JHtwYXRofWA7XG4gICAgfVxuXG4gICAgcmV0dXJuIFwiXCI7XG4gIH1cblxuICBwcml2YXRlIGdlbmVyYXRlT3B0aW9uQ29tcGxldGlvbnNDb21tYW5kKFxuICAgIGNvbW1hbmQ6IENvbW1hbmQsXG4gICAgYXJnczogQXJndW1lbnRbXSxcbiAgICBwYXRoOiBzdHJpbmcsXG4gICAgb3B0cz86IHsgc3RhbmRhbG9uZT86IGJvb2xlYW4gfSxcbiAgKSB7XG4gICAgaWYgKGFyZ3MubGVuZ3RoKSB7XG4gICAgICBjb25zdCB0eXBlID0gY29tbWFuZC5nZXRUeXBlKGFyZ3NbMF0udHlwZSk7XG4gICAgICBpZiAodHlwZSAmJiB0eXBlLmhhbmRsZXIgaW5zdGFuY2VvZiBGaWxlVHlwZSkge1xuICAgICAgICByZXR1cm4gYG9wdHM9KCk7IF8ke3JlcGxhY2VTcGVjaWFsQ2hhcnModGhpcy5jbWQuZ2V0TmFtZSgpKX1fZmlsZV9kaXJgO1xuICAgICAgfVxuICAgICAgLy8gQFRPRE86IGFkZCBzdXBwb3J0IGZvciBtdWx0aXBsZSBhcmd1bWVudHNcbiAgICAgIHJldHVybiBgb3B0cz0oKTsgXyR7cmVwbGFjZVNwZWNpYWxDaGFycyh0aGlzLmNtZC5nZXROYW1lKCkpfV9jb21wbGV0ZSAke1xuICAgICAgICBhcmdzWzBdLmFjdGlvblxuICAgICAgfSR7cGF0aH1gO1xuICAgIH1cblxuICAgIGlmIChvcHRzPy5zdGFuZGFsb25lKSB7XG4gICAgICByZXR1cm4gXCJvcHRzPSgpXCI7XG4gICAgfVxuXG4gICAgcmV0dXJuIFwiXCI7XG4gIH1cbn1cblxuZnVuY3Rpb24gcmVwbGFjZVNwZWNpYWxDaGFycyhzdHI6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBzdHIucmVwbGFjZSgvW15hLXpBLVowLTldL2csIFwiX1wiKTtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFFQSxTQUFTLFFBQVEsUUFBUSxtQkFBbUI7QUFFNUMsdUNBQXVDLEdBQ3ZDLE9BQU8sTUFBTTs7RUFDWCx5REFBeUQsR0FDekQsT0FBYyxTQUFTLEdBQVksRUFBRTtJQUNuQyxPQUFPLElBQUkseUJBQXlCLEtBQUssUUFBUTtFQUNuRDtFQUVBLFlBQW9CLEFBQVUsR0FBWSxDQUFFO1NBQWQsTUFBQTtFQUFlO0VBRTdDLHFDQUFxQyxHQUNyQyxBQUFRLFdBQW1CO0lBQ3pCLE1BQU0sT0FBTyxJQUFJLENBQUMsR0FBRyxDQUFDLE9BQU87SUFDN0IsTUFBTSxVQUE4QixJQUFJLENBQUMsR0FBRyxDQUFDLFVBQVUsS0FDbkQsQ0FBQyxFQUFFLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxVQUFVLEdBQUcsQ0FBQyxHQUM1QjtJQUVKLE9BQU8sQ0FBQzs4QkFDa0IsRUFBRSxLQUFLLEVBQUUsUUFBUTs7Q0FFOUMsRUFBRSxvQkFBb0IsTUFBTTs7Ozs7Ozs7OztHQVUxQixFQUFFLG9CQUFvQixJQUFJLENBQUMsR0FBRyxDQUFDLE9BQU8sSUFBSTs7MkJBRWxCLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxPQUFPLEdBQUc7Ozs7OztHQU03QyxFQUFFLG9CQUFvQixJQUFJLENBQUMsR0FBRyxDQUFDLE9BQU8sSUFBSTs7Ozs7Ozs7Ozs7Ozs7Ozs7R0FpQjFDLEVBQUUsb0JBQW9CLElBQUksQ0FBQyxHQUFHLENBQUMsT0FBTyxJQUFJOzs7S0FHeEMsRUFBRSxvQkFBb0IsSUFBSSxDQUFDLEdBQUcsQ0FBQyxPQUFPLElBQUk7Ozs7Ozs7Ozs7Ozs7OztFQWU3QyxFQUFFLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLElBQUksR0FBRzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7YUF5Q2pDLEVBQUUsb0JBQW9CLE1BQU0sMkJBQTJCLEVBQUUsS0FBSyxDQUFDO0VBQzFFO0VBRUEsNEVBQTRFLEdBQzVFLEFBQVEsb0JBQW9CLE9BQWdCLEVBQUUsT0FBTyxFQUFFLEVBQUUsUUFBUSxDQUFDLEVBQVU7SUFDMUUsT0FBTyxDQUFDLE9BQU8sT0FBTyxNQUFNLEVBQUUsSUFBSSxRQUFRLE9BQU87SUFDakQsTUFBTSxxQkFBcUIsSUFBSSxDQUFDLDBCQUEwQixDQUN4RCxTQUNBLE1BQ0E7SUFFRixNQUFNLDBCQUFrQyxRQUFRLFdBQVcsQ0FBQyxPQUN6RCxNQUFNLENBQUMsQ0FBQyxhQUF3QixlQUFlLFNBQy9DLEdBQUcsQ0FBQyxDQUFDLGFBQ0osSUFBSSxDQUFDLG1CQUFtQixDQUFDLFlBQVksTUFBTSxRQUFRLElBRXBELElBQUksQ0FBQztJQUVSLE9BQU8sQ0FBQyxFQUFFLG1CQUFtQjs7QUFFakMsRUFBRSx3QkFBd0IsQ0FBQztFQUN6QjtFQUVRLDJCQUNOLE9BQWdCLEVBQ2hCLElBQVksRUFDWixLQUFhLEVBQ0w7SUFDUixNQUFNLFFBQWtCLElBQUksQ0FBQyxRQUFRLENBQUM7SUFFdEMsTUFBTSxvQkFBOEIsUUFBUSxXQUFXLENBQUMsT0FDckQsR0FBRyxDQUFDLENBQUMsZUFBMEIsYUFBYSxPQUFPO0lBRXRELE1BQU0sa0JBQTBCLENBQUMsS0FBSyxPQUFPLENBQUMsT0FDMUMsTUFBTSxLQUFLLEtBQUssQ0FBQyxLQUFLLEtBQUssQ0FBQyxHQUFHLElBQUksQ0FBQyxPQUNwQztJQUVKLE1BQU0sa0JBQWtCLElBQUksQ0FBQyx1QkFBdUIsQ0FDbEQsU0FDQTtJQUdGLE1BQU0saUJBQXlCLElBQUksQ0FBQyxpQ0FBaUMsQ0FDbkUsU0FDQTtJQUdGLE9BQU8sQ0FBQyxJQUFJLEVBQUUsb0JBQW9CLE1BQU07VUFDbEMsRUFBRTtTQUFJO1NBQVU7S0FBa0IsQ0FBQyxJQUFJLENBQUMsS0FBSztJQUNuRCxFQUFFLGVBQWU7OENBQ3lCLEVBQUUsTUFBTTs7O0lBR2xELEVBQUUsZ0JBQWdCO0dBQ25CLENBQUM7RUFDRjtFQUVRLFNBQVMsT0FBZ0IsRUFBWTtJQUMzQyxPQUFPLFFBQVEsVUFBVSxDQUFDLE9BQ3ZCLEdBQUcsQ0FBQyxDQUFDLFNBQVcsT0FBTyxLQUFLLEVBQzVCLElBQUk7RUFDVDtFQUVRLHdCQUNOLE9BQWdCLEVBQ2hCLGVBQXVCLEVBQ2Y7SUFDUixJQUFJLE9BQU87SUFDWCxNQUFNLFVBQVUsUUFBUSxVQUFVLENBQUM7SUFDbkMsSUFBSSxRQUFRLE1BQU0sRUFBRTtNQUNsQixRQUFRO01BQ1IsS0FBSyxNQUFNLFVBQVUsUUFBUztRQUM1QixNQUFNLFFBQWdCLE9BQU8sS0FBSyxDQUMvQixHQUFHLENBQUMsQ0FBQyxPQUFpQixLQUFLLElBQUksSUFDL0IsSUFBSSxDQUFDO1FBRVIsTUFBTSxpQkFBeUIsSUFBSSxDQUFDLGdDQUFnQyxDQUNsRSxTQUNBLE9BQU8sSUFBSSxFQUNYLGlCQUNBO1VBQUUsWUFBWSxPQUFPLFVBQVU7UUFBQztRQUdsQyxRQUFRLENBQUMsUUFBUSxFQUFFLE1BQU0sRUFBRSxFQUFFLGVBQWUsR0FBRyxDQUFDO01BQ2xEO01BQ0EsUUFBUTtJQUNWO0lBRUEsT0FBTztFQUNUO0VBRVEsa0NBQ04sT0FBZ0IsRUFDaEIsSUFBWSxFQUNaO0lBQ0EsTUFBTSxPQUFtQixRQUFRLFlBQVk7SUFDN0MsSUFBSSxLQUFLLE1BQU0sRUFBRTtNQUNmLE1BQU0sT0FBTyxRQUFRLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUk7TUFDekMsSUFBSSxRQUFRLEtBQUssT0FBTyxZQUFZLFVBQVU7UUFDNUMsT0FBTyxDQUFDLENBQUMsRUFBRSxvQkFBb0IsSUFBSSxDQUFDLEdBQUcsQ0FBQyxPQUFPLElBQUksU0FBUyxDQUFDO01BQy9EO01BQ0EsNENBQTRDO01BQzVDLE9BQU8sQ0FBQyxDQUFDLEVBQUUsb0JBQW9CLElBQUksQ0FBQyxHQUFHLENBQUMsT0FBTyxJQUFJLFVBQVUsRUFDM0QsSUFBSSxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQ2YsRUFBRSxLQUFLLENBQUM7SUFDWDtJQUVBLE9BQU87RUFDVDtFQUVRLGlDQUNOLE9BQWdCLEVBQ2hCLElBQWdCLEVBQ2hCLElBQVksRUFDWixJQUErQixFQUMvQjtJQUNBLElBQUksS0FBSyxNQUFNLEVBQUU7TUFDZixNQUFNLE9BQU8sUUFBUSxPQUFPLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJO01BQ3pDLElBQUksUUFBUSxLQUFLLE9BQU8sWUFBWSxVQUFVO1FBQzVDLE9BQU8sQ0FBQyxVQUFVLEVBQUUsb0JBQW9CLElBQUksQ0FBQyxHQUFHLENBQUMsT0FBTyxJQUFJLFNBQVMsQ0FBQztNQUN4RTtNQUNBLDRDQUE0QztNQUM1QyxPQUFPLENBQUMsVUFBVSxFQUFFLG9CQUFvQixJQUFJLENBQUMsR0FBRyxDQUFDLE9BQU8sSUFBSSxVQUFVLEVBQ3BFLElBQUksQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUNmLEVBQUUsS0FBSyxDQUFDO0lBQ1g7SUFFQSxJQUFJLE1BQU0sWUFBWTtNQUNwQixPQUFPO0lBQ1Q7SUFFQSxPQUFPO0VBQ1Q7QUFDRjtBQUVBLFNBQVMsb0JBQW9CLEdBQVc7RUFDdEMsT0FBTyxJQUFJLE9BQU8sQ0FBQyxpQkFBaUI7QUFDdEMifQ==