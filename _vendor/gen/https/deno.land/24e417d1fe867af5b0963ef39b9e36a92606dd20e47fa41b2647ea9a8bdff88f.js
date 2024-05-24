import { getFlag } from "../../flags/_utils.ts";
import { Table } from "../../table/table.ts";
import { dedent, getDescription, parseArgumentsDefinition } from "../_utils.ts";
import { bold, brightBlue, brightMagenta, dim, getColorEnabled, green, italic, red, setColorEnabled, yellow } from "../deps.ts";
import { Type } from "../type.ts";
/** Help text generator. */ export class HelpGenerator {
  cmd;
  indent;
  options;
  /** Generate help text for given command. */ static generate(cmd, options) {
    return new HelpGenerator(cmd, options).generate();
  }
  constructor(cmd, options = {}){
    this.cmd = cmd;
    this.indent = 2;
    this.options = {
      types: false,
      hints: true,
      colors: true,
      long: false,
      ...options
    };
  }
  generate() {
    const areColorsEnabled = getColorEnabled();
    setColorEnabled(this.options.colors);
    const result = this.generateHeader() + this.generateMeta() + this.generateDescription() + this.generateOptions() + this.generateCommands() + this.generateEnvironmentVariables() + this.generateExamples();
    setColorEnabled(areColorsEnabled);
    return result;
  }
  generateHeader() {
    const usage = this.cmd.getUsage();
    const rows = [
      [
        bold("Usage:"),
        brightMagenta(this.cmd.getPath() + (usage ? " " + highlightArguments(usage, this.options.types) : ""))
      ]
    ];
    const version = this.cmd.getVersion();
    if (version) {
      rows.push([
        bold("Version:"),
        yellow(`${this.cmd.getVersion()}`)
      ]);
    }
    return "\n" + Table.from(rows).indent(this.indent).padding(1).toString() + "\n";
  }
  generateMeta() {
    const meta = Object.entries(this.cmd.getMeta());
    if (!meta.length) {
      return "";
    }
    const rows = [];
    for (const [name, value] of meta){
      rows.push([
        bold(`${name}: `) + value
      ]);
    }
    return "\n" + Table.from(rows).indent(this.indent).padding(1).toString() + "\n";
  }
  generateDescription() {
    if (!this.cmd.getDescription()) {
      return "";
    }
    return this.label("Description") + Table.from([
      [
        dedent(this.cmd.getDescription())
      ]
    ]).indent(this.indent * 2).maxColWidth(140).padding(1).toString() + "\n";
  }
  generateOptions() {
    const options = this.cmd.getOptions(false);
    if (!options.length) {
      return "";
    }
    let groups = [];
    const hasGroups = options.some((option)=>option.groupName);
    if (hasGroups) {
      for (const option of options){
        let group = groups.find((group)=>group.name === option.groupName);
        if (!group) {
          group = {
            name: option.groupName,
            options: []
          };
          groups.push(group);
        }
        group.options.push(option);
      }
    } else {
      groups = [
        {
          name: "Options",
          options
        }
      ];
    }
    let result = "";
    for (const group of groups){
      result += this.generateOptionGroup(group);
    }
    return result;
  }
  generateOptionGroup(group) {
    if (!group.options.length) {
      return "";
    }
    const hasTypeDefinitions = !!group.options.find((option)=>!!option.typeDefinition);
    if (hasTypeDefinitions) {
      return this.label(group.name ?? "Options") + Table.from([
        ...group.options.map((option)=>[
            option.flags.map((flag)=>brightBlue(flag)).join(", "),
            highlightArguments(option.typeDefinition || "", this.options.types),
            red(bold("-")),
            getDescription(option.description, !this.options.long),
            this.generateHints(option)
          ])
      ]).padding([
        2,
        2,
        1,
        2
      ]).indent(this.indent * 2).maxColWidth([
        60,
        60,
        1,
        80,
        60
      ]).toString() + "\n";
    }
    return this.label(group.name ?? "Options") + Table.from([
      ...group.options.map((option)=>[
          option.flags.map((flag)=>brightBlue(flag)).join(", "),
          red(bold("-")),
          getDescription(option.description, !this.options.long),
          this.generateHints(option)
        ])
    ]).indent(this.indent * 2).maxColWidth([
      60,
      1,
      80,
      60
    ]).padding([
      2,
      1,
      2
    ]).toString() + "\n";
  }
  generateCommands() {
    const commands = this.cmd.getCommands(false);
    if (!commands.length) {
      return "";
    }
    const hasTypeDefinitions = !!commands.find((command)=>!!command.getArgsDefinition());
    if (hasTypeDefinitions) {
      return this.label("Commands") + Table.from([
        ...commands.map((command)=>[
            [
              command.getName(),
              ...command.getAliases()
            ].map((name)=>brightBlue(name)).join(", "),
            highlightArguments(command.getArgsDefinition() || "", this.options.types),
            red(bold("-")),
            command.getShortDescription()
          ])
      ]).indent(this.indent * 2).maxColWidth([
        60,
        60,
        1,
        80
      ]).padding([
        2,
        2,
        1,
        2
      ]).toString() + "\n";
    }
    return this.label("Commands") + Table.from([
      ...commands.map((command)=>[
          [
            command.getName(),
            ...command.getAliases()
          ].map((name)=>brightBlue(name)).join(", "),
          red(bold("-")),
          command.getShortDescription()
        ])
    ]).maxColWidth([
      60,
      1,
      80
    ]).padding([
      2,
      1,
      2
    ]).indent(this.indent * 2).toString() + "\n";
  }
  generateEnvironmentVariables() {
    const envVars = this.cmd.getEnvVars(false);
    if (!envVars.length) {
      return "";
    }
    return this.label("Environment variables") + Table.from([
      ...envVars.map((envVar)=>[
          envVar.names.map((name)=>brightBlue(name)).join(", "),
          highlightArgumentDetails(envVar.details, this.options.types),
          red(bold("-")),
          this.options.long ? dedent(envVar.description) : envVar.description.trim().split("\n", 1)[0],
          envVar.required ? `(${yellow(`required`)})` : ""
        ])
    ]).padding([
      2,
      2,
      1,
      2
    ]).indent(this.indent * 2).maxColWidth([
      60,
      60,
      1,
      80,
      10
    ]).toString() + "\n";
  }
  generateExamples() {
    const examples = this.cmd.getExamples();
    if (!examples.length) {
      return "";
    }
    return this.label("Examples") + Table.from(examples.map((example)=>[
        dim(bold(`${capitalize(example.name)}:`)),
        dedent(example.description)
      ])).padding(1).indent(this.indent * 2).maxColWidth(150).toString() + "\n";
  }
  generateHints(option) {
    if (!this.options.hints) {
      return "";
    }
    const hints = [];
    option.required && hints.push(yellow(`required`));
    typeof option.default !== "undefined" && hints.push(bold(`Default: `) + inspect(option.default, this.options.colors));
    option.depends?.length && hints.push(yellow(bold(`Depends: `)) + italic(option.depends.map(getFlag).join(", ")));
    option.conflicts?.length && hints.push(red(bold(`Conflicts: `)) + italic(option.conflicts.map(getFlag).join(", ")));
    const type = this.cmd.getType(option.args[0]?.type)?.handler;
    if (type instanceof Type) {
      const possibleValues = type.values?.(this.cmd, this.cmd.getParent());
      if (possibleValues?.length) {
        hints.push(bold(`Values: `) + possibleValues.map((value)=>inspect(value, this.options.colors)).join(", "));
      }
    }
    if (hints.length) {
      return `(${hints.join(", ")})`;
    }
    return "";
  }
  label(label) {
    return "\n" + " ".repeat(this.indent) + bold(`${label}:`) + "\n\n";
  }
}
function capitalize(string) {
  return (string?.charAt(0).toUpperCase() + string.slice(1)) ?? "";
}
function inspect(value, colors) {
  return Deno.inspect(value, // deno < 1.4.3 doesn't support the colors property.
  {
    depth: 1,
    colors,
    trailingComma: false
  });
}
/**
 * Colorize arguments string.
 * @param argsDefinition Arguments definition: `<color1:string> <color2:string>`
 * @param types Show types.
 */ function highlightArguments(argsDefinition, types = true) {
  if (!argsDefinition) {
    return "";
  }
  return parseArgumentsDefinition(argsDefinition, false, true).map((arg)=>typeof arg === "string" ? arg : highlightArgumentDetails(arg, types)).join(" ");
}
/**
 * Colorize argument string.
 * @param arg Argument details.
 * @param types Show types.
 */ function highlightArgumentDetails(arg, types = true) {
  let str = "";
  str += yellow(arg.optionalValue ? "[" : "<");
  let name = "";
  name += arg.name;
  if (arg.variadic) {
    name += "...";
  }
  name = brightMagenta(name);
  str += name;
  if (types) {
    str += yellow(":");
    str += red(arg.type);
    if (arg.list) {
      str += green("[]");
    }
  }
  str += yellow(arg.optionalValue ? "]" : ">");
  return str;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvY2xpZmZ5QHYwLjI1LjcvY29tbWFuZC9oZWxwL19oZWxwX2dlbmVyYXRvci50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBnZXRGbGFnIH0gZnJvbSBcIi4uLy4uL2ZsYWdzL191dGlscy50c1wiO1xuaW1wb3J0IHsgVGFibGUgfSBmcm9tIFwiLi4vLi4vdGFibGUvdGFibGUudHNcIjtcbmltcG9ydCB7IGRlZGVudCwgZ2V0RGVzY3JpcHRpb24sIHBhcnNlQXJndW1lbnRzRGVmaW5pdGlvbiB9IGZyb20gXCIuLi9fdXRpbHMudHNcIjtcbmltcG9ydCB0eXBlIHsgQ29tbWFuZCB9IGZyb20gXCIuLi9jb21tYW5kLnRzXCI7XG5pbXBvcnQge1xuICBib2xkLFxuICBicmlnaHRCbHVlLFxuICBicmlnaHRNYWdlbnRhLFxuICBkaW0sXG4gIGdldENvbG9yRW5hYmxlZCxcbiAgZ3JlZW4sXG4gIGl0YWxpYyxcbiAgcmVkLFxuICBzZXRDb2xvckVuYWJsZWQsXG4gIHllbGxvdyxcbn0gZnJvbSBcIi4uL2RlcHMudHNcIjtcbmltcG9ydCB7IFR5cGUgfSBmcm9tIFwiLi4vdHlwZS50c1wiO1xuaW1wb3J0IHR5cGUgeyBBcmd1bWVudCwgRW52VmFyLCBFeGFtcGxlLCBPcHRpb24gfSBmcm9tIFwiLi4vdHlwZXMudHNcIjtcblxuZXhwb3J0IGludGVyZmFjZSBIZWxwT3B0aW9ucyB7XG4gIHR5cGVzPzogYm9vbGVhbjtcbiAgaGludHM/OiBib29sZWFuO1xuICBjb2xvcnM/OiBib29sZWFuO1xuICBsb25nPzogYm9vbGVhbjtcbn1cblxuaW50ZXJmYWNlIE9wdGlvbkdyb3VwIHtcbiAgbmFtZT86IHN0cmluZztcbiAgb3B0aW9uczogQXJyYXk8T3B0aW9uPjtcbn1cblxuLyoqIEhlbHAgdGV4dCBnZW5lcmF0b3IuICovXG5leHBvcnQgY2xhc3MgSGVscEdlbmVyYXRvciB7XG4gIHByaXZhdGUgaW5kZW50ID0gMjtcbiAgcHJpdmF0ZSBvcHRpb25zOiBSZXF1aXJlZDxIZWxwT3B0aW9ucz47XG5cbiAgLyoqIEdlbmVyYXRlIGhlbHAgdGV4dCBmb3IgZ2l2ZW4gY29tbWFuZC4gKi9cbiAgcHVibGljIHN0YXRpYyBnZW5lcmF0ZShjbWQ6IENvbW1hbmQsIG9wdGlvbnM/OiBIZWxwT3B0aW9ucyk6IHN0cmluZyB7XG4gICAgcmV0dXJuIG5ldyBIZWxwR2VuZXJhdG9yKGNtZCwgb3B0aW9ucykuZ2VuZXJhdGUoKTtcbiAgfVxuXG4gIHByaXZhdGUgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSBjbWQ6IENvbW1hbmQsXG4gICAgb3B0aW9uczogSGVscE9wdGlvbnMgPSB7fSxcbiAgKSB7XG4gICAgdGhpcy5vcHRpb25zID0ge1xuICAgICAgdHlwZXM6IGZhbHNlLFxuICAgICAgaGludHM6IHRydWUsXG4gICAgICBjb2xvcnM6IHRydWUsXG4gICAgICBsb25nOiBmYWxzZSxcbiAgICAgIC4uLm9wdGlvbnMsXG4gICAgfTtcbiAgfVxuXG4gIHByaXZhdGUgZ2VuZXJhdGUoKTogc3RyaW5nIHtcbiAgICBjb25zdCBhcmVDb2xvcnNFbmFibGVkID0gZ2V0Q29sb3JFbmFibGVkKCk7XG4gICAgc2V0Q29sb3JFbmFibGVkKHRoaXMub3B0aW9ucy5jb2xvcnMpO1xuXG4gICAgY29uc3QgcmVzdWx0ID0gdGhpcy5nZW5lcmF0ZUhlYWRlcigpICtcbiAgICAgIHRoaXMuZ2VuZXJhdGVNZXRhKCkgK1xuICAgICAgdGhpcy5nZW5lcmF0ZURlc2NyaXB0aW9uKCkgK1xuICAgICAgdGhpcy5nZW5lcmF0ZU9wdGlvbnMoKSArXG4gICAgICB0aGlzLmdlbmVyYXRlQ29tbWFuZHMoKSArXG4gICAgICB0aGlzLmdlbmVyYXRlRW52aXJvbm1lbnRWYXJpYWJsZXMoKSArXG4gICAgICB0aGlzLmdlbmVyYXRlRXhhbXBsZXMoKTtcblxuICAgIHNldENvbG9yRW5hYmxlZChhcmVDb2xvcnNFbmFibGVkKTtcblxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICBwcml2YXRlIGdlbmVyYXRlSGVhZGVyKCk6IHN0cmluZyB7XG4gICAgY29uc3QgdXNhZ2UgPSB0aGlzLmNtZC5nZXRVc2FnZSgpO1xuICAgIGNvbnN0IHJvd3MgPSBbXG4gICAgICBbXG4gICAgICAgIGJvbGQoXCJVc2FnZTpcIiksXG4gICAgICAgIGJyaWdodE1hZ2VudGEoXG4gICAgICAgICAgdGhpcy5jbWQuZ2V0UGF0aCgpICtcbiAgICAgICAgICAgICh1c2FnZSA/IFwiIFwiICsgaGlnaGxpZ2h0QXJndW1lbnRzKHVzYWdlLCB0aGlzLm9wdGlvbnMudHlwZXMpIDogXCJcIiksXG4gICAgICAgICksXG4gICAgICBdLFxuICAgIF07XG4gICAgY29uc3QgdmVyc2lvbjogc3RyaW5nIHwgdW5kZWZpbmVkID0gdGhpcy5jbWQuZ2V0VmVyc2lvbigpO1xuICAgIGlmICh2ZXJzaW9uKSB7XG4gICAgICByb3dzLnB1c2goW2JvbGQoXCJWZXJzaW9uOlwiKSwgeWVsbG93KGAke3RoaXMuY21kLmdldFZlcnNpb24oKX1gKV0pO1xuICAgIH1cbiAgICByZXR1cm4gXCJcXG5cIiArXG4gICAgICBUYWJsZS5mcm9tKHJvd3MpXG4gICAgICAgIC5pbmRlbnQodGhpcy5pbmRlbnQpXG4gICAgICAgIC5wYWRkaW5nKDEpXG4gICAgICAgIC50b1N0cmluZygpICtcbiAgICAgIFwiXFxuXCI7XG4gIH1cblxuICBwcml2YXRlIGdlbmVyYXRlTWV0YSgpOiBzdHJpbmcge1xuICAgIGNvbnN0IG1ldGEgPSBPYmplY3QuZW50cmllcyh0aGlzLmNtZC5nZXRNZXRhKCkpO1xuICAgIGlmICghbWV0YS5sZW5ndGgpIHtcbiAgICAgIHJldHVybiBcIlwiO1xuICAgIH1cblxuICAgIGNvbnN0IHJvd3MgPSBbXTtcbiAgICBmb3IgKGNvbnN0IFtuYW1lLCB2YWx1ZV0gb2YgbWV0YSkge1xuICAgICAgcm93cy5wdXNoKFtib2xkKGAke25hbWV9OiBgKSArIHZhbHVlXSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIFwiXFxuXCIgK1xuICAgICAgVGFibGUuZnJvbShyb3dzKVxuICAgICAgICAuaW5kZW50KHRoaXMuaW5kZW50KVxuICAgICAgICAucGFkZGluZygxKVxuICAgICAgICAudG9TdHJpbmcoKSArXG4gICAgICBcIlxcblwiO1xuICB9XG5cbiAgcHJpdmF0ZSBnZW5lcmF0ZURlc2NyaXB0aW9uKCk6IHN0cmluZyB7XG4gICAgaWYgKCF0aGlzLmNtZC5nZXREZXNjcmlwdGlvbigpKSB7XG4gICAgICByZXR1cm4gXCJcIjtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMubGFiZWwoXCJEZXNjcmlwdGlvblwiKSArXG4gICAgICBUYWJsZS5mcm9tKFtcbiAgICAgICAgW2RlZGVudCh0aGlzLmNtZC5nZXREZXNjcmlwdGlvbigpKV0sXG4gICAgICBdKVxuICAgICAgICAuaW5kZW50KHRoaXMuaW5kZW50ICogMilcbiAgICAgICAgLm1heENvbFdpZHRoKDE0MClcbiAgICAgICAgLnBhZGRpbmcoMSlcbiAgICAgICAgLnRvU3RyaW5nKCkgK1xuICAgICAgXCJcXG5cIjtcbiAgfVxuXG4gIHByaXZhdGUgZ2VuZXJhdGVPcHRpb25zKCk6IHN0cmluZyB7XG4gICAgY29uc3Qgb3B0aW9ucyA9IHRoaXMuY21kLmdldE9wdGlvbnMoZmFsc2UpO1xuICAgIGlmICghb3B0aW9ucy5sZW5ndGgpIHtcbiAgICAgIHJldHVybiBcIlwiO1xuICAgIH1cblxuICAgIGxldCBncm91cHM6IEFycmF5PE9wdGlvbkdyb3VwPiA9IFtdO1xuICAgIGNvbnN0IGhhc0dyb3VwcyA9IG9wdGlvbnMuc29tZSgob3B0aW9uKSA9PiBvcHRpb24uZ3JvdXBOYW1lKTtcbiAgICBpZiAoaGFzR3JvdXBzKSB7XG4gICAgICBmb3IgKGNvbnN0IG9wdGlvbiBvZiBvcHRpb25zKSB7XG4gICAgICAgIGxldCBncm91cCA9IGdyb3Vwcy5maW5kKChncm91cCkgPT4gZ3JvdXAubmFtZSA9PT0gb3B0aW9uLmdyb3VwTmFtZSk7XG4gICAgICAgIGlmICghZ3JvdXApIHtcbiAgICAgICAgICBncm91cCA9IHtcbiAgICAgICAgICAgIG5hbWU6IG9wdGlvbi5ncm91cE5hbWUsXG4gICAgICAgICAgICBvcHRpb25zOiBbXSxcbiAgICAgICAgICB9O1xuICAgICAgICAgIGdyb3Vwcy5wdXNoKGdyb3VwKTtcbiAgICAgICAgfVxuICAgICAgICBncm91cC5vcHRpb25zLnB1c2gob3B0aW9uKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgZ3JvdXBzID0gW3tcbiAgICAgICAgbmFtZTogXCJPcHRpb25zXCIsXG4gICAgICAgIG9wdGlvbnMsXG4gICAgICB9XTtcbiAgICB9XG5cbiAgICBsZXQgcmVzdWx0ID0gXCJcIjtcbiAgICBmb3IgKGNvbnN0IGdyb3VwIG9mIGdyb3Vwcykge1xuICAgICAgcmVzdWx0ICs9IHRoaXMuZ2VuZXJhdGVPcHRpb25Hcm91cChncm91cCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIHByaXZhdGUgZ2VuZXJhdGVPcHRpb25Hcm91cChncm91cDogT3B0aW9uR3JvdXApOiBzdHJpbmcge1xuICAgIGlmICghZ3JvdXAub3B0aW9ucy5sZW5ndGgpIHtcbiAgICAgIHJldHVybiBcIlwiO1xuICAgIH1cbiAgICBjb25zdCBoYXNUeXBlRGVmaW5pdGlvbnMgPSAhIWdyb3VwLm9wdGlvbnMuZmluZCgob3B0aW9uKSA9PlxuICAgICAgISFvcHRpb24udHlwZURlZmluaXRpb25cbiAgICApO1xuXG4gICAgaWYgKGhhc1R5cGVEZWZpbml0aW9ucykge1xuICAgICAgcmV0dXJuIHRoaXMubGFiZWwoZ3JvdXAubmFtZSA/PyBcIk9wdGlvbnNcIikgK1xuICAgICAgICBUYWJsZS5mcm9tKFtcbiAgICAgICAgICAuLi5ncm91cC5vcHRpb25zLm1hcCgob3B0aW9uOiBPcHRpb24pID0+IFtcbiAgICAgICAgICAgIG9wdGlvbi5mbGFncy5tYXAoKGZsYWcpID0+IGJyaWdodEJsdWUoZmxhZykpLmpvaW4oXCIsIFwiKSxcbiAgICAgICAgICAgIGhpZ2hsaWdodEFyZ3VtZW50cyhcbiAgICAgICAgICAgICAgb3B0aW9uLnR5cGVEZWZpbml0aW9uIHx8IFwiXCIsXG4gICAgICAgICAgICAgIHRoaXMub3B0aW9ucy50eXBlcyxcbiAgICAgICAgICAgICksXG4gICAgICAgICAgICByZWQoYm9sZChcIi1cIikpLFxuICAgICAgICAgICAgZ2V0RGVzY3JpcHRpb24ob3B0aW9uLmRlc2NyaXB0aW9uLCAhdGhpcy5vcHRpb25zLmxvbmcpLFxuICAgICAgICAgICAgdGhpcy5nZW5lcmF0ZUhpbnRzKG9wdGlvbiksXG4gICAgICAgICAgXSksXG4gICAgICAgIF0pXG4gICAgICAgICAgLnBhZGRpbmcoWzIsIDIsIDEsIDJdKVxuICAgICAgICAgIC5pbmRlbnQodGhpcy5pbmRlbnQgKiAyKVxuICAgICAgICAgIC5tYXhDb2xXaWR0aChbNjAsIDYwLCAxLCA4MCwgNjBdKVxuICAgICAgICAgIC50b1N0cmluZygpICtcbiAgICAgICAgXCJcXG5cIjtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5sYWJlbChncm91cC5uYW1lID8/IFwiT3B0aW9uc1wiKSArXG4gICAgICBUYWJsZS5mcm9tKFtcbiAgICAgICAgLi4uZ3JvdXAub3B0aW9ucy5tYXAoKG9wdGlvbjogT3B0aW9uKSA9PiBbXG4gICAgICAgICAgb3B0aW9uLmZsYWdzLm1hcCgoZmxhZykgPT4gYnJpZ2h0Qmx1ZShmbGFnKSkuam9pbihcIiwgXCIpLFxuICAgICAgICAgIHJlZChib2xkKFwiLVwiKSksXG4gICAgICAgICAgZ2V0RGVzY3JpcHRpb24ob3B0aW9uLmRlc2NyaXB0aW9uLCAhdGhpcy5vcHRpb25zLmxvbmcpLFxuICAgICAgICAgIHRoaXMuZ2VuZXJhdGVIaW50cyhvcHRpb24pLFxuICAgICAgICBdKSxcbiAgICAgIF0pXG4gICAgICAgIC5pbmRlbnQodGhpcy5pbmRlbnQgKiAyKVxuICAgICAgICAubWF4Q29sV2lkdGgoWzYwLCAxLCA4MCwgNjBdKVxuICAgICAgICAucGFkZGluZyhbMiwgMSwgMl0pXG4gICAgICAgIC50b1N0cmluZygpICtcbiAgICAgIFwiXFxuXCI7XG4gIH1cblxuICBwcml2YXRlIGdlbmVyYXRlQ29tbWFuZHMoKTogc3RyaW5nIHtcbiAgICBjb25zdCBjb21tYW5kcyA9IHRoaXMuY21kLmdldENvbW1hbmRzKGZhbHNlKTtcbiAgICBpZiAoIWNvbW1hbmRzLmxlbmd0aCkge1xuICAgICAgcmV0dXJuIFwiXCI7XG4gICAgfVxuXG4gICAgY29uc3QgaGFzVHlwZURlZmluaXRpb25zID0gISFjb21tYW5kcy5maW5kKChjb21tYW5kKSA9PlxuICAgICAgISFjb21tYW5kLmdldEFyZ3NEZWZpbml0aW9uKClcbiAgICApO1xuXG4gICAgaWYgKGhhc1R5cGVEZWZpbml0aW9ucykge1xuICAgICAgcmV0dXJuIHRoaXMubGFiZWwoXCJDb21tYW5kc1wiKSArXG4gICAgICAgIFRhYmxlLmZyb20oW1xuICAgICAgICAgIC4uLmNvbW1hbmRzLm1hcCgoY29tbWFuZDogQ29tbWFuZCkgPT4gW1xuICAgICAgICAgICAgW2NvbW1hbmQuZ2V0TmFtZSgpLCAuLi5jb21tYW5kLmdldEFsaWFzZXMoKV0ubWFwKChuYW1lKSA9PlxuICAgICAgICAgICAgICBicmlnaHRCbHVlKG5hbWUpXG4gICAgICAgICAgICApLmpvaW4oXCIsIFwiKSxcbiAgICAgICAgICAgIGhpZ2hsaWdodEFyZ3VtZW50cyhcbiAgICAgICAgICAgICAgY29tbWFuZC5nZXRBcmdzRGVmaW5pdGlvbigpIHx8IFwiXCIsXG4gICAgICAgICAgICAgIHRoaXMub3B0aW9ucy50eXBlcyxcbiAgICAgICAgICAgICksXG4gICAgICAgICAgICByZWQoYm9sZChcIi1cIikpLFxuICAgICAgICAgICAgY29tbWFuZC5nZXRTaG9ydERlc2NyaXB0aW9uKCksXG4gICAgICAgICAgXSksXG4gICAgICAgIF0pXG4gICAgICAgICAgLmluZGVudCh0aGlzLmluZGVudCAqIDIpXG4gICAgICAgICAgLm1heENvbFdpZHRoKFs2MCwgNjAsIDEsIDgwXSlcbiAgICAgICAgICAucGFkZGluZyhbMiwgMiwgMSwgMl0pXG4gICAgICAgICAgLnRvU3RyaW5nKCkgK1xuICAgICAgICBcIlxcblwiO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLmxhYmVsKFwiQ29tbWFuZHNcIikgK1xuICAgICAgVGFibGUuZnJvbShbXG4gICAgICAgIC4uLmNvbW1hbmRzLm1hcCgoY29tbWFuZDogQ29tbWFuZCkgPT4gW1xuICAgICAgICAgIFtjb21tYW5kLmdldE5hbWUoKSwgLi4uY29tbWFuZC5nZXRBbGlhc2VzKCldLm1hcCgobmFtZSkgPT5cbiAgICAgICAgICAgIGJyaWdodEJsdWUobmFtZSlcbiAgICAgICAgICApXG4gICAgICAgICAgICAuam9pbihcIiwgXCIpLFxuICAgICAgICAgIHJlZChib2xkKFwiLVwiKSksXG4gICAgICAgICAgY29tbWFuZC5nZXRTaG9ydERlc2NyaXB0aW9uKCksXG4gICAgICAgIF0pLFxuICAgICAgXSlcbiAgICAgICAgLm1heENvbFdpZHRoKFs2MCwgMSwgODBdKVxuICAgICAgICAucGFkZGluZyhbMiwgMSwgMl0pXG4gICAgICAgIC5pbmRlbnQodGhpcy5pbmRlbnQgKiAyKVxuICAgICAgICAudG9TdHJpbmcoKSArXG4gICAgICBcIlxcblwiO1xuICB9XG5cbiAgcHJpdmF0ZSBnZW5lcmF0ZUVudmlyb25tZW50VmFyaWFibGVzKCk6IHN0cmluZyB7XG4gICAgY29uc3QgZW52VmFycyA9IHRoaXMuY21kLmdldEVudlZhcnMoZmFsc2UpO1xuICAgIGlmICghZW52VmFycy5sZW5ndGgpIHtcbiAgICAgIHJldHVybiBcIlwiO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5sYWJlbChcIkVudmlyb25tZW50IHZhcmlhYmxlc1wiKSArXG4gICAgICBUYWJsZS5mcm9tKFtcbiAgICAgICAgLi4uZW52VmFycy5tYXAoKGVudlZhcjogRW52VmFyKSA9PiBbXG4gICAgICAgICAgZW52VmFyLm5hbWVzLm1hcCgobmFtZTogc3RyaW5nKSA9PiBicmlnaHRCbHVlKG5hbWUpKS5qb2luKFwiLCBcIiksXG4gICAgICAgICAgaGlnaGxpZ2h0QXJndW1lbnREZXRhaWxzKFxuICAgICAgICAgICAgZW52VmFyLmRldGFpbHMsXG4gICAgICAgICAgICB0aGlzLm9wdGlvbnMudHlwZXMsXG4gICAgICAgICAgKSxcbiAgICAgICAgICByZWQoYm9sZChcIi1cIikpLFxuICAgICAgICAgIHRoaXMub3B0aW9ucy5sb25nXG4gICAgICAgICAgICA/IGRlZGVudChlbnZWYXIuZGVzY3JpcHRpb24pXG4gICAgICAgICAgICA6IGVudlZhci5kZXNjcmlwdGlvbi50cmltKCkuc3BsaXQoXCJcXG5cIiwgMSlbMF0sXG4gICAgICAgICAgZW52VmFyLnJlcXVpcmVkID8gYCgke3llbGxvdyhgcmVxdWlyZWRgKX0pYCA6IFwiXCIsXG4gICAgICAgIF0pLFxuICAgICAgXSlcbiAgICAgICAgLnBhZGRpbmcoWzIsIDIsIDEsIDJdKVxuICAgICAgICAuaW5kZW50KHRoaXMuaW5kZW50ICogMilcbiAgICAgICAgLm1heENvbFdpZHRoKFs2MCwgNjAsIDEsIDgwLCAxMF0pXG4gICAgICAgIC50b1N0cmluZygpICtcbiAgICAgIFwiXFxuXCI7XG4gIH1cblxuICBwcml2YXRlIGdlbmVyYXRlRXhhbXBsZXMoKTogc3RyaW5nIHtcbiAgICBjb25zdCBleGFtcGxlcyA9IHRoaXMuY21kLmdldEV4YW1wbGVzKCk7XG4gICAgaWYgKCFleGFtcGxlcy5sZW5ndGgpIHtcbiAgICAgIHJldHVybiBcIlwiO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5sYWJlbChcIkV4YW1wbGVzXCIpICtcbiAgICAgIFRhYmxlLmZyb20oZXhhbXBsZXMubWFwKChleGFtcGxlOiBFeGFtcGxlKSA9PiBbXG4gICAgICAgIGRpbShib2xkKGAke2NhcGl0YWxpemUoZXhhbXBsZS5uYW1lKX06YCkpLFxuICAgICAgICBkZWRlbnQoZXhhbXBsZS5kZXNjcmlwdGlvbiksXG4gICAgICBdKSlcbiAgICAgICAgLnBhZGRpbmcoMSlcbiAgICAgICAgLmluZGVudCh0aGlzLmluZGVudCAqIDIpXG4gICAgICAgIC5tYXhDb2xXaWR0aCgxNTApXG4gICAgICAgIC50b1N0cmluZygpICtcbiAgICAgIFwiXFxuXCI7XG4gIH1cblxuICBwcml2YXRlIGdlbmVyYXRlSGludHMob3B0aW9uOiBPcHRpb24pOiBzdHJpbmcge1xuICAgIGlmICghdGhpcy5vcHRpb25zLmhpbnRzKSB7XG4gICAgICByZXR1cm4gXCJcIjtcbiAgICB9XG4gICAgY29uc3QgaGludHMgPSBbXTtcblxuICAgIG9wdGlvbi5yZXF1aXJlZCAmJiBoaW50cy5wdXNoKHllbGxvdyhgcmVxdWlyZWRgKSk7XG4gICAgdHlwZW9mIG9wdGlvbi5kZWZhdWx0ICE9PSBcInVuZGVmaW5lZFwiICYmIGhpbnRzLnB1c2goXG4gICAgICBib2xkKGBEZWZhdWx0OiBgKSArIGluc3BlY3Qob3B0aW9uLmRlZmF1bHQsIHRoaXMub3B0aW9ucy5jb2xvcnMpLFxuICAgICk7XG4gICAgb3B0aW9uLmRlcGVuZHM/Lmxlbmd0aCAmJiBoaW50cy5wdXNoKFxuICAgICAgeWVsbG93KGJvbGQoYERlcGVuZHM6IGApKSArXG4gICAgICAgIGl0YWxpYyhvcHRpb24uZGVwZW5kcy5tYXAoZ2V0RmxhZykuam9pbihcIiwgXCIpKSxcbiAgICApO1xuICAgIG9wdGlvbi5jb25mbGljdHM/Lmxlbmd0aCAmJiBoaW50cy5wdXNoKFxuICAgICAgcmVkKGJvbGQoYENvbmZsaWN0czogYCkpICtcbiAgICAgICAgaXRhbGljKG9wdGlvbi5jb25mbGljdHMubWFwKGdldEZsYWcpLmpvaW4oXCIsIFwiKSksXG4gICAgKTtcblxuICAgIGNvbnN0IHR5cGUgPSB0aGlzLmNtZC5nZXRUeXBlKG9wdGlvbi5hcmdzWzBdPy50eXBlKT8uaGFuZGxlcjtcbiAgICBpZiAodHlwZSBpbnN0YW5jZW9mIFR5cGUpIHtcbiAgICAgIGNvbnN0IHBvc3NpYmxlVmFsdWVzID0gdHlwZS52YWx1ZXM/Lih0aGlzLmNtZCwgdGhpcy5jbWQuZ2V0UGFyZW50KCkpO1xuICAgICAgaWYgKHBvc3NpYmxlVmFsdWVzPy5sZW5ndGgpIHtcbiAgICAgICAgaGludHMucHVzaChcbiAgICAgICAgICBib2xkKGBWYWx1ZXM6IGApICtcbiAgICAgICAgICAgIHBvc3NpYmxlVmFsdWVzLm1hcCgodmFsdWU6IHVua25vd24pID0+XG4gICAgICAgICAgICAgIGluc3BlY3QodmFsdWUsIHRoaXMub3B0aW9ucy5jb2xvcnMpXG4gICAgICAgICAgICApLmpvaW4oXCIsIFwiKSxcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoaGludHMubGVuZ3RoKSB7XG4gICAgICByZXR1cm4gYCgke2hpbnRzLmpvaW4oXCIsIFwiKX0pYDtcbiAgICB9XG5cbiAgICByZXR1cm4gXCJcIjtcbiAgfVxuXG4gIHByaXZhdGUgbGFiZWwobGFiZWw6IHN0cmluZykge1xuICAgIHJldHVybiBcIlxcblwiICtcbiAgICAgIFwiIFwiLnJlcGVhdCh0aGlzLmluZGVudCkgKyBib2xkKGAke2xhYmVsfTpgKSArXG4gICAgICBcIlxcblxcblwiO1xuICB9XG59XG5cbmZ1bmN0aW9uIGNhcGl0YWxpemUoc3RyaW5nOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gc3RyaW5nPy5jaGFyQXQoMCkudG9VcHBlckNhc2UoKSArIHN0cmluZy5zbGljZSgxKSA/PyBcIlwiO1xufVxuXG5mdW5jdGlvbiBpbnNwZWN0KHZhbHVlOiB1bmtub3duLCBjb2xvcnM6IGJvb2xlYW4pOiBzdHJpbmcge1xuICByZXR1cm4gRGVuby5pbnNwZWN0KFxuICAgIHZhbHVlLFxuICAgIC8vIGRlbm8gPCAxLjQuMyBkb2Vzbid0IHN1cHBvcnQgdGhlIGNvbG9ycyBwcm9wZXJ0eS5cbiAgICB7IGRlcHRoOiAxLCBjb2xvcnMsIHRyYWlsaW5nQ29tbWE6IGZhbHNlIH0gYXMgRGVuby5JbnNwZWN0T3B0aW9ucyxcbiAgKTtcbn1cblxuLyoqXG4gKiBDb2xvcml6ZSBhcmd1bWVudHMgc3RyaW5nLlxuICogQHBhcmFtIGFyZ3NEZWZpbml0aW9uIEFyZ3VtZW50cyBkZWZpbml0aW9uOiBgPGNvbG9yMTpzdHJpbmc+IDxjb2xvcjI6c3RyaW5nPmBcbiAqIEBwYXJhbSB0eXBlcyBTaG93IHR5cGVzLlxuICovXG5mdW5jdGlvbiBoaWdobGlnaHRBcmd1bWVudHMoYXJnc0RlZmluaXRpb246IHN0cmluZywgdHlwZXMgPSB0cnVlKSB7XG4gIGlmICghYXJnc0RlZmluaXRpb24pIHtcbiAgICByZXR1cm4gXCJcIjtcbiAgfVxuXG4gIHJldHVybiBwYXJzZUFyZ3VtZW50c0RlZmluaXRpb24oYXJnc0RlZmluaXRpb24sIGZhbHNlLCB0cnVlKVxuICAgIC5tYXAoKGFyZzogQXJndW1lbnQgfCBzdHJpbmcpID0+XG4gICAgICB0eXBlb2YgYXJnID09PSBcInN0cmluZ1wiID8gYXJnIDogaGlnaGxpZ2h0QXJndW1lbnREZXRhaWxzKGFyZywgdHlwZXMpXG4gICAgKVxuICAgIC5qb2luKFwiIFwiKTtcbn1cblxuLyoqXG4gKiBDb2xvcml6ZSBhcmd1bWVudCBzdHJpbmcuXG4gKiBAcGFyYW0gYXJnIEFyZ3VtZW50IGRldGFpbHMuXG4gKiBAcGFyYW0gdHlwZXMgU2hvdyB0eXBlcy5cbiAqL1xuZnVuY3Rpb24gaGlnaGxpZ2h0QXJndW1lbnREZXRhaWxzKFxuICBhcmc6IEFyZ3VtZW50LFxuICB0eXBlcyA9IHRydWUsXG4pOiBzdHJpbmcge1xuICBsZXQgc3RyID0gXCJcIjtcblxuICBzdHIgKz0geWVsbG93KGFyZy5vcHRpb25hbFZhbHVlID8gXCJbXCIgOiBcIjxcIik7XG5cbiAgbGV0IG5hbWUgPSBcIlwiO1xuICBuYW1lICs9IGFyZy5uYW1lO1xuICBpZiAoYXJnLnZhcmlhZGljKSB7XG4gICAgbmFtZSArPSBcIi4uLlwiO1xuICB9XG4gIG5hbWUgPSBicmlnaHRNYWdlbnRhKG5hbWUpO1xuXG4gIHN0ciArPSBuYW1lO1xuXG4gIGlmICh0eXBlcykge1xuICAgIHN0ciArPSB5ZWxsb3coXCI6XCIpO1xuICAgIHN0ciArPSByZWQoYXJnLnR5cGUpO1xuICAgIGlmIChhcmcubGlzdCkge1xuICAgICAgc3RyICs9IGdyZWVuKFwiW11cIik7XG4gICAgfVxuICB9XG5cbiAgc3RyICs9IHllbGxvdyhhcmcub3B0aW9uYWxWYWx1ZSA/IFwiXVwiIDogXCI+XCIpO1xuXG4gIHJldHVybiBzdHI7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsU0FBUyxPQUFPLFFBQVEsd0JBQXdCO0FBQ2hELFNBQVMsS0FBSyxRQUFRLHVCQUF1QjtBQUM3QyxTQUFTLE1BQU0sRUFBRSxjQUFjLEVBQUUsd0JBQXdCLFFBQVEsZUFBZTtBQUVoRixTQUNFLElBQUksRUFDSixVQUFVLEVBQ1YsYUFBYSxFQUNiLEdBQUcsRUFDSCxlQUFlLEVBQ2YsS0FBSyxFQUNMLE1BQU0sRUFDTixHQUFHLEVBQ0gsZUFBZSxFQUNmLE1BQU0sUUFDRCxhQUFhO0FBQ3BCLFNBQVMsSUFBSSxRQUFRLGFBQWE7QUFlbEMseUJBQXlCLEdBQ3pCLE9BQU8sTUFBTTs7RUFDSCxPQUFXO0VBQ1gsUUFBK0I7RUFFdkMsMENBQTBDLEdBQzFDLE9BQWMsU0FBUyxHQUFZLEVBQUUsT0FBcUIsRUFBVTtJQUNsRSxPQUFPLElBQUksY0FBYyxLQUFLLFNBQVMsUUFBUTtFQUNqRDtFQUVBLFlBQ0UsQUFBUSxHQUFZLEVBQ3BCLFVBQXVCLENBQUMsQ0FBQyxDQUN6QjtTQUZRLE1BQUE7U0FURixTQUFTO0lBWWYsSUFBSSxDQUFDLE9BQU8sR0FBRztNQUNiLE9BQU87TUFDUCxPQUFPO01BQ1AsUUFBUTtNQUNSLE1BQU07TUFDTixHQUFHLE9BQU87SUFDWjtFQUNGO0VBRVEsV0FBbUI7SUFDekIsTUFBTSxtQkFBbUI7SUFDekIsZ0JBQWdCLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTTtJQUVuQyxNQUFNLFNBQVMsSUFBSSxDQUFDLGNBQWMsS0FDaEMsSUFBSSxDQUFDLFlBQVksS0FDakIsSUFBSSxDQUFDLG1CQUFtQixLQUN4QixJQUFJLENBQUMsZUFBZSxLQUNwQixJQUFJ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