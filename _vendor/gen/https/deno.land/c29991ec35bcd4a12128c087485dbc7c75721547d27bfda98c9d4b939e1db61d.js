import { getDefaultValue, getOption, matchWildCardOptions, paramCaseToCamelCase } from "./_utils.ts";
import { DuplicateOptionError, InvalidOptionError, InvalidOptionValueError, MissingOptionValueError, UnexpectedArgumentAfterVariadicArgumentError, UnexpectedOptionValueError, UnexpectedRequiredArgumentError, UnknownConflictingOptionError, UnknownOptionError, UnknownRequiredOptionError, UnknownTypeError } from "./_errors.ts";
import { OptionType } from "./deprecated.ts";
import { boolean } from "./types/boolean.ts";
import { number } from "./types/number.ts";
import { string } from "./types/string.ts";
import { validateFlags } from "./_validate_flags.ts";
import { integer } from "./types/integer.ts";
const DefaultTypes = {
  string,
  number,
  integer,
  boolean
};
/**
 * Parse command line arguments.
 * @param argsOrCtx Command line arguments e.g: `Deno.args` or parse context.
 * @param opts      Parse options.
 *
 * ```
 * // examples/flags/flags.ts -x 3 -y.z -n5 -abc --beep=boop foo bar baz --deno.land --deno.com -- --cliffy
 * parseFlags(Deno.args);
 * ```
 *
 * Output:
 *
 * ```
 * {
 *   flags: {
 *     x: "3",
 *     y: { z: true },
 *     n: "5",
 *     a: true,
 *     b: true,
 *     c: true,
 *     beep: "boop",
 *     deno: { land: true, com: true }
 *   },
 *   literal: [ "--cliffy" ],
 *   unknown: [ "foo", "bar", "baz" ],
 *   stopEarly: false,
 *   stopOnUnknown: false
 * }
 * ```
 */ export function parseFlags(argsOrCtx, opts = {}) {
  let args;
  let ctx;
  if (Array.isArray(argsOrCtx)) {
    ctx = {};
    args = argsOrCtx;
  } else {
    ctx = argsOrCtx;
    args = argsOrCtx.unknown;
    argsOrCtx.unknown = [];
  }
  args = args.slice();
  ctx.flags ??= {};
  ctx.literal ??= [];
  ctx.unknown ??= [];
  ctx.stopEarly = false;
  ctx.stopOnUnknown = false;
  opts.dotted ??= true;
  validateOptions(opts);
  const options = parseArgs(ctx, args, opts);
  validateFlags(ctx, opts, options);
  if (opts.dotted) {
    parseDottedOptions(ctx);
  }
  return ctx;
}
function validateOptions(opts) {
  opts.flags?.forEach((opt)=>{
    opt.depends?.forEach((flag)=>{
      if (!opts.flags || !getOption(opts.flags, flag)) {
        throw new UnknownRequiredOptionError(flag, opts.flags ?? []);
      }
    });
    opt.conflicts?.forEach((flag)=>{
      if (!opts.flags || !getOption(opts.flags, flag)) {
        throw new UnknownConflictingOptionError(flag, opts.flags ?? []);
      }
    });
  });
}
function parseArgs(ctx, args, opts) {
  /** Option name mapping: propertyName -> option.name */ const optionsMap = new Map();
  let inLiteral = false;
  for(let argsIndex = 0; argsIndex < args.length; argsIndex++){
    let option;
    let current = args[argsIndex];
    let currentValue;
    let negate = false;
    // literal args after --
    if (inLiteral) {
      ctx.literal.push(current);
      continue;
    } else if (current === "--") {
      inLiteral = true;
      continue;
    } else if (ctx.stopEarly || ctx.stopOnUnknown) {
      ctx.unknown.push(current);
      continue;
    }
    const isFlag = current.length > 1 && current[0] === "-";
    if (!isFlag) {
      if (opts.stopEarly) {
        ctx.stopEarly = true;
      }
      ctx.unknown.push(current);
      continue;
    }
    const isShort = current[1] !== "-";
    const isLong = isShort ? false : current.length > 3 && current[2] !== "-";
    if (!isShort && !isLong) {
      throw new InvalidOptionError(current, opts.flags ?? []);
    }
    // normalize short flags: -abc => -a -b -c
    if (isShort && current.length > 2 && current[2] !== ".") {
      args.splice(argsIndex, 1, ...splitFlags(current));
      current = args[argsIndex];
    } else if (isLong && current.startsWith("--no-")) {
      negate = true;
    }
    // split value: --foo="bar=baz" => --foo bar=baz
    const equalSignIndex = current.indexOf("=");
    if (equalSignIndex !== -1) {
      currentValue = current.slice(equalSignIndex + 1) || undefined;
      current = current.slice(0, equalSignIndex);
    }
    if (opts.flags) {
      option = getOption(opts.flags, current);
      if (!option) {
        const name = current.replace(/^-+/, "");
        option = matchWildCardOptions(name, opts.flags);
        if (!option) {
          if (opts.stopOnUnknown) {
            ctx.stopOnUnknown = true;
            ctx.unknown.push(args[argsIndex]);
            continue;
          }
          throw new UnknownOptionError(current, opts.flags);
        }
      }
    } else {
      option = {
        name: current.replace(/^-+/, ""),
        optionalValue: true,
        type: OptionType.STRING
      };
    }
    if (option.standalone) {
      ctx.standalone = option;
    }
    const positiveName = negate ? option.name.replace(/^no-?/, "") : option.name;
    const propName = paramCaseToCamelCase(positiveName);
    if (typeof ctx.flags[propName] !== "undefined") {
      if (!opts.flags?.length) {
        option.collect = true;
      } else if (!option.collect) {
        throw new DuplicateOptionError(current);
      }
    }
    if (option.type && !option.args?.length) {
      option.args = [
        {
          type: option.type,
          requiredValue: option.requiredValue,
          optionalValue: option.optionalValue,
          variadic: option.variadic,
          list: option.list,
          separator: option.separator
        }
      ];
    }
    if (opts.flags?.length && !option.args?.length && typeof currentValue !== "undefined") {
      throw new UnexpectedOptionValueError(option.name, currentValue);
    }
    let optionArgsIndex = 0;
    let inOptionalArg = false;
    const next = ()=>currentValue ?? args[argsIndex + 1];
    const previous = ctx.flags[propName];
    parseNext(option);
    if (typeof ctx.flags[propName] === "undefined") {
      if (option.args?.[optionArgsIndex]?.requiredValue) {
        throw new MissingOptionValueError(option.name);
      } else if (typeof option.default !== "undefined") {
        ctx.flags[propName] = getDefaultValue(option);
      } else {
        ctx.flags[propName] = true;
      }
    }
    if (option.value) {
      ctx.flags[propName] = option.value(ctx.flags[propName], previous);
    } else if (option.collect) {
      const value = typeof previous !== "undefined" ? Array.isArray(previous) ? previous : [
        previous
      ] : [];
      value.push(ctx.flags[propName]);
      ctx.flags[propName] = value;
    }
    optionsMap.set(propName, option);
    opts.option?.(option, ctx.flags[propName]);
    /** Parse next argument for current option. */ // deno-lint-ignore no-inner-declarations
    function parseNext(option) {
      if (negate) {
        ctx.flags[propName] = false;
        return;
      } else if (!option.args?.length) {
        ctx.flags[propName] = undefined;
        return;
      }
      const arg = option.args[optionArgsIndex];
      if (!arg) {
        const flag = next();
        throw new UnknownOptionError(flag, opts.flags ?? []);
      }
      if (!arg.type) {
        arg.type = OptionType.BOOLEAN;
      }
      if (option.args?.length && !option.type) {
        // make all values required by default
        if ((typeof arg.optionalValue === "undefined" || arg.optionalValue === false) && typeof arg.requiredValue === "undefined") {
          arg.requiredValue = true;
        }
      } else {
        // make non boolean value required by default
        if (arg.type !== OptionType.BOOLEAN && (typeof arg.optionalValue === "undefined" || arg.optionalValue === false) && typeof arg.requiredValue === "undefined") {
          arg.requiredValue = true;
        }
      }
      if (!arg.requiredValue) {
        inOptionalArg = true;
      } else if (inOptionalArg) {
        throw new UnexpectedRequiredArgumentError(option.name);
      }
      let result;
      let increase = false;
      if (arg.list && hasNext(arg)) {
        const parsed = next().split(arg.separator || ",").map((nextValue)=>{
          const value = parseValue(option, arg, nextValue);
          if (typeof value === "undefined") {
            throw new InvalidOptionValueError(option.name, arg.type ?? "?", nextValue);
          }
          return value;
        });
        if (parsed?.length) {
          result = parsed;
        }
      } else {
        if (hasNext(arg)) {
          result = parseValue(option, arg, next());
        } else if (arg.optionalValue && arg.type === OptionType.BOOLEAN) {
          result = true;
        }
      }
      if (increase && typeof currentValue === "undefined") {
        argsIndex++;
        if (!arg.variadic) {
          optionArgsIndex++;
        } else if (option.args[optionArgsIndex + 1]) {
          throw new UnexpectedArgumentAfterVariadicArgumentError(next());
        }
      }
      if (typeof result !== "undefined" && (option.args.length > 1 || arg.variadic)) {
        if (!ctx.flags[propName]) {
          ctx.flags[propName] = [];
        }
        ctx.flags[propName].push(result);
        if (hasNext(arg)) {
          parseNext(option);
        }
      } else {
        ctx.flags[propName] = result;
      }
      /** Check if current option should have an argument. */ function hasNext(arg) {
        if (!option.args?.length) {
          return false;
        }
        const nextValue = currentValue ?? args[argsIndex + 1];
        if (!nextValue) {
          return false;
        }
        if (option.args.length > 1 && optionArgsIndex >= option.args.length) {
          return false;
        }
        if (arg.requiredValue) {
          return true;
        }
        // require optional values to be called with an equal sign: foo=bar
        if (option.equalsSign && arg.optionalValue && !arg.variadic && typeof currentValue === "undefined") {
          return false;
        }
        if (arg.optionalValue || arg.variadic) {
          return nextValue[0] !== "-" || typeof currentValue !== "undefined" || arg.type === OptionType.NUMBER && !isNaN(Number(nextValue));
        }
        return false;
      }
      /** Parse argument value.  */ function parseValue(option, arg, value) {
        const result = opts.parse ? opts.parse({
          label: "Option",
          type: arg.type || OptionType.STRING,
          name: `--${option.name}`,
          value
        }) : parseDefaultType(option, arg, value);
        if (typeof result !== "undefined") {
          increase = true;
        }
        return result;
      }
    }
  }
  return optionsMap;
}
function parseDottedOptions(ctx) {
  // convert dotted option keys into nested objects
  ctx.flags = Object.keys(ctx.flags).reduce((result, key)=>{
    if (~key.indexOf(".")) {
      key.split(".").reduce((// deno-lint-ignore no-explicit-any
      result, subKey, index, parts)=>{
        if (index === parts.length - 1) {
          result[subKey] = ctx.flags[key];
        } else {
          result[subKey] = result[subKey] ?? {};
        }
        return result[subKey];
      }, result);
    } else {
      result[key] = ctx.flags[key];
    }
    return result;
  }, {});
}
function splitFlags(flag) {
  flag = flag.slice(1);
  const normalized = [];
  const index = flag.indexOf("=");
  const flags = (index !== -1 ? flag.slice(0, index) : flag).split("");
  if (isNaN(Number(flag[flag.length - 1]))) {
    flags.forEach((val)=>normalized.push(`-${val}`));
  } else {
    normalized.push(`-${flags.shift()}`);
    if (flags.length) {
      normalized.push(flags.join(""));
    }
  }
  if (index !== -1) {
    normalized[normalized.length - 1] += flag.slice(index);
  }
  return normalized;
}
function parseDefaultType(option, arg, value) {
  const type = arg.type || OptionType.STRING;
  const parseType = DefaultTypes[type];
  if (!parseType) {
    throw new UnknownTypeError(type, Object.keys(DefaultTypes));
  }
  return parseType({
    label: "Option",
    type,
    name: `--${option.name}`,
    value
  });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvY2xpZmZ5QHYwLjI1LjcvZmxhZ3MvZmxhZ3MudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtcbiAgZ2V0RGVmYXVsdFZhbHVlLFxuICBnZXRPcHRpb24sXG4gIG1hdGNoV2lsZENhcmRPcHRpb25zLFxuICBwYXJhbUNhc2VUb0NhbWVsQ2FzZSxcbn0gZnJvbSBcIi4vX3V0aWxzLnRzXCI7XG5pbXBvcnQge1xuICBEdXBsaWNhdGVPcHRpb25FcnJvcixcbiAgSW52YWxpZE9wdGlvbkVycm9yLFxuICBJbnZhbGlkT3B0aW9uVmFsdWVFcnJvcixcbiAgTWlzc2luZ09wdGlvblZhbHVlRXJyb3IsXG4gIFVuZXhwZWN0ZWRBcmd1bWVudEFmdGVyVmFyaWFkaWNBcmd1bWVudEVycm9yLFxuICBVbmV4cGVjdGVkT3B0aW9uVmFsdWVFcnJvcixcbiAgVW5leHBlY3RlZFJlcXVpcmVkQXJndW1lbnRFcnJvcixcbiAgVW5rbm93bkNvbmZsaWN0aW5nT3B0aW9uRXJyb3IsXG4gIFVua25vd25PcHRpb25FcnJvcixcbiAgVW5rbm93blJlcXVpcmVkT3B0aW9uRXJyb3IsXG4gIFVua25vd25UeXBlRXJyb3IsXG59IGZyb20gXCIuL19lcnJvcnMudHNcIjtcbmltcG9ydCB7IE9wdGlvblR5cGUgfSBmcm9tIFwiLi9kZXByZWNhdGVkLnRzXCI7XG5pbXBvcnQgdHlwZSB7XG4gIEFyZ3VtZW50T3B0aW9ucyxcbiAgQXJndW1lbnRUeXBlLFxuICBGbGFnT3B0aW9ucyxcbiAgUGFyc2VGbGFnc0NvbnRleHQsXG4gIFBhcnNlRmxhZ3NPcHRpb25zLFxuICBUeXBlSGFuZGxlcixcbn0gZnJvbSBcIi4vdHlwZXMudHNcIjtcbmltcG9ydCB7IGJvb2xlYW4gfSBmcm9tIFwiLi90eXBlcy9ib29sZWFuLnRzXCI7XG5pbXBvcnQgeyBudW1iZXIgfSBmcm9tIFwiLi90eXBlcy9udW1iZXIudHNcIjtcbmltcG9ydCB7IHN0cmluZyB9IGZyb20gXCIuL3R5cGVzL3N0cmluZy50c1wiO1xuaW1wb3J0IHsgdmFsaWRhdGVGbGFncyB9IGZyb20gXCIuL192YWxpZGF0ZV9mbGFncy50c1wiO1xuaW1wb3J0IHsgaW50ZWdlciB9IGZyb20gXCIuL3R5cGVzL2ludGVnZXIudHNcIjtcblxuY29uc3QgRGVmYXVsdFR5cGVzOiBSZWNvcmQ8QXJndW1lbnRUeXBlLCBUeXBlSGFuZGxlcj4gPSB7XG4gIHN0cmluZyxcbiAgbnVtYmVyLFxuICBpbnRlZ2VyLFxuICBib29sZWFuLFxufTtcblxuLyoqXG4gKiBQYXJzZSBjb21tYW5kIGxpbmUgYXJndW1lbnRzLlxuICogQHBhcmFtIGFyZ3NPckN0eCBDb21tYW5kIGxpbmUgYXJndW1lbnRzIGUuZzogYERlbm8uYXJnc2Agb3IgcGFyc2UgY29udGV4dC5cbiAqIEBwYXJhbSBvcHRzICAgICAgUGFyc2Ugb3B0aW9ucy5cbiAqXG4gKiBgYGBcbiAqIC8vIGV4YW1wbGVzL2ZsYWdzL2ZsYWdzLnRzIC14IDMgLXkueiAtbjUgLWFiYyAtLWJlZXA9Ym9vcCBmb28gYmFyIGJheiAtLWRlbm8ubGFuZCAtLWRlbm8uY29tIC0tIC0tY2xpZmZ5XG4gKiBwYXJzZUZsYWdzKERlbm8uYXJncyk7XG4gKiBgYGBcbiAqXG4gKiBPdXRwdXQ6XG4gKlxuICogYGBgXG4gKiB7XG4gKiAgIGZsYWdzOiB7XG4gKiAgICAgeDogXCIzXCIsXG4gKiAgICAgeTogeyB6OiB0cnVlIH0sXG4gKiAgICAgbjogXCI1XCIsXG4gKiAgICAgYTogdHJ1ZSxcbiAqICAgICBiOiB0cnVlLFxuICogICAgIGM6IHRydWUsXG4gKiAgICAgYmVlcDogXCJib29wXCIsXG4gKiAgICAgZGVubzogeyBsYW5kOiB0cnVlLCBjb206IHRydWUgfVxuICogICB9LFxuICogICBsaXRlcmFsOiBbIFwiLS1jbGlmZnlcIiBdLFxuICogICB1bmtub3duOiBbIFwiZm9vXCIsIFwiYmFyXCIsIFwiYmF6XCIgXSxcbiAqICAgc3RvcEVhcmx5OiBmYWxzZSxcbiAqICAgc3RvcE9uVW5rbm93bjogZmFsc2VcbiAqIH1cbiAqIGBgYFxuICovXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VGbGFnczxcbiAgVEZsYWdzIGV4dGVuZHMgUmVjb3JkPHN0cmluZywgdW5rbm93bj4sXG4gIFRGbGFnT3B0aW9ucyBleHRlbmRzIEZsYWdPcHRpb25zLFxuICBURmxhZ3NSZXN1bHQgZXh0ZW5kcyBQYXJzZUZsYWdzQ29udGV4dCxcbj4oXG4gIGFyZ3NPckN0eDogc3RyaW5nW10gfCBURmxhZ3NSZXN1bHQsXG4gIG9wdHM6IFBhcnNlRmxhZ3NPcHRpb25zPFRGbGFnT3B0aW9ucz4gPSB7fSxcbik6IFRGbGFnc1Jlc3VsdCAmIFBhcnNlRmxhZ3NDb250ZXh0PFRGbGFncywgVEZsYWdPcHRpb25zPiB7XG4gIGxldCBhcmdzOiBBcnJheTxzdHJpbmc+O1xuICBsZXQgY3R4OiBQYXJzZUZsYWdzQ29udGV4dDxSZWNvcmQ8c3RyaW5nLCB1bmtub3duPj47XG5cbiAgaWYgKEFycmF5LmlzQXJyYXkoYXJnc09yQ3R4KSkge1xuICAgIGN0eCA9IHt9IGFzIFBhcnNlRmxhZ3NDb250ZXh0PFJlY29yZDxzdHJpbmcsIHVua25vd24+PjtcbiAgICBhcmdzID0gYXJnc09yQ3R4O1xuICB9IGVsc2Uge1xuICAgIGN0eCA9IGFyZ3NPckN0eDtcbiAgICBhcmdzID0gYXJnc09yQ3R4LnVua25vd247XG4gICAgYXJnc09yQ3R4LnVua25vd24gPSBbXTtcbiAgfVxuICBhcmdzID0gYXJncy5zbGljZSgpO1xuXG4gIGN0eC5mbGFncyA/Pz0ge307XG4gIGN0eC5saXRlcmFsID8/PSBbXTtcbiAgY3R4LnVua25vd24gPz89IFtdO1xuICBjdHguc3RvcEVhcmx5ID0gZmFsc2U7XG4gIGN0eC5zdG9wT25Vbmtub3duID0gZmFsc2U7XG5cbiAgb3B0cy5kb3R0ZWQgPz89IHRydWU7XG5cbiAgdmFsaWRhdGVPcHRpb25zKG9wdHMpO1xuICBjb25zdCBvcHRpb25zID0gcGFyc2VBcmdzKGN0eCwgYXJncywgb3B0cyk7XG4gIHZhbGlkYXRlRmxhZ3MoY3R4LCBvcHRzLCBvcHRpb25zKTtcblxuICBpZiAob3B0cy5kb3R0ZWQpIHtcbiAgICBwYXJzZURvdHRlZE9wdGlvbnMoY3R4KTtcbiAgfVxuXG4gIHJldHVybiBjdHggYXMgVEZsYWdzUmVzdWx0ICYgUGFyc2VGbGFnc0NvbnRleHQ8VEZsYWdzLCBURmxhZ09wdGlvbnM+O1xufVxuXG5mdW5jdGlvbiB2YWxpZGF0ZU9wdGlvbnM8VEZsYWdPcHRpb25zIGV4dGVuZHMgRmxhZ09wdGlvbnM+KFxuICBvcHRzOiBQYXJzZUZsYWdzT3B0aW9uczxURmxhZ09wdGlvbnM+LFxuKSB7XG4gIG9wdHMuZmxhZ3M/LmZvckVhY2goKG9wdCkgPT4ge1xuICAgIG9wdC5kZXBlbmRzPy5mb3JFYWNoKChmbGFnKSA9PiB7XG4gICAgICBpZiAoIW9wdHMuZmxhZ3MgfHwgIWdldE9wdGlvbihvcHRzLmZsYWdzLCBmbGFnKSkge1xuICAgICAgICB0aHJvdyBuZXcgVW5rbm93blJlcXVpcmVkT3B0aW9uRXJyb3IoZmxhZywgb3B0cy5mbGFncyA/PyBbXSk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgb3B0LmNvbmZsaWN0cz8uZm9yRWFjaCgoZmxhZykgPT4ge1xuICAgICAgaWYgKCFvcHRzLmZsYWdzIHx8ICFnZXRPcHRpb24ob3B0cy5mbGFncywgZmxhZykpIHtcbiAgICAgICAgdGhyb3cgbmV3IFVua25vd25Db25mbGljdGluZ09wdGlvbkVycm9yKGZsYWcsIG9wdHMuZmxhZ3MgPz8gW10pO1xuICAgICAgfVxuICAgIH0pO1xuICB9KTtcbn1cblxuZnVuY3Rpb24gcGFyc2VBcmdzPFRGbGFnT3B0aW9ucyBleHRlbmRzIEZsYWdPcHRpb25zPihcbiAgY3R4OiBQYXJzZUZsYWdzQ29udGV4dDxSZWNvcmQ8c3RyaW5nLCB1bmtub3duPj4sXG4gIGFyZ3M6IEFycmF5PHN0cmluZz4sXG4gIG9wdHM6IFBhcnNlRmxhZ3NPcHRpb25zPFRGbGFnT3B0aW9ucz4sXG4pOiBNYXA8c3RyaW5nLCBGbGFnT3B0aW9ucz4ge1xuICAvKiogT3B0aW9uIG5hbWUgbWFwcGluZzogcHJvcGVydHlOYW1lIC0+IG9wdGlvbi5uYW1lICovXG4gIGNvbnN0IG9wdGlvbnNNYXA6IE1hcDxzdHJpbmcsIEZsYWdPcHRpb25zPiA9IG5ldyBNYXAoKTtcbiAgbGV0IGluTGl0ZXJhbCA9IGZhbHNlO1xuXG4gIGZvciAoXG4gICAgbGV0IGFyZ3NJbmRleCA9IDA7XG4gICAgYXJnc0luZGV4IDwgYXJncy5sZW5ndGg7XG4gICAgYXJnc0luZGV4KytcbiAgKSB7XG4gICAgbGV0IG9wdGlvbjogRmxhZ09wdGlvbnMgfCB1bmRlZmluZWQ7XG4gICAgbGV0IGN1cnJlbnQ6IHN0cmluZyA9IGFyZ3NbYXJnc0luZGV4XTtcbiAgICBsZXQgY3VycmVudFZhbHVlOiBzdHJpbmcgfCB1bmRlZmluZWQ7XG4gICAgbGV0IG5lZ2F0ZSA9IGZhbHNlO1xuXG4gICAgLy8gbGl0ZXJhbCBhcmdzIGFmdGVyIC0tXG4gICAgaWYgKGluTGl0ZXJhbCkge1xuICAgICAgY3R4LmxpdGVyYWwucHVzaChjdXJyZW50KTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH0gZWxzZSBpZiAoY3VycmVudCA9PT0gXCItLVwiKSB7XG4gICAgICBpbkxpdGVyYWwgPSB0cnVlO1xuICAgICAgY29udGludWU7XG4gICAgfSBlbHNlIGlmIChjdHguc3RvcEVhcmx5IHx8IGN0eC5zdG9wT25Vbmtub3duKSB7XG4gICAgICBjdHgudW5rbm93bi5wdXNoKGN1cnJlbnQpO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgY29uc3QgaXNGbGFnID0gY3VycmVudC5sZW5ndGggPiAxICYmIGN1cnJlbnRbMF0gPT09IFwiLVwiO1xuXG4gICAgaWYgKCFpc0ZsYWcpIHtcbiAgICAgIGlmIChvcHRzLnN0b3BFYXJseSkge1xuICAgICAgICBjdHguc3RvcEVhcmx5ID0gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIGN0eC51bmtub3duLnB1c2goY3VycmVudCk7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gICAgY29uc3QgaXNTaG9ydCA9IGN1cnJlbnRbMV0gIT09IFwiLVwiO1xuICAgIGNvbnN0IGlzTG9uZyA9IGlzU2hvcnQgPyBmYWxzZSA6IGN1cnJlbnQubGVuZ3RoID4gMyAmJiBjdXJyZW50WzJdICE9PSBcIi1cIjtcblxuICAgIGlmICghaXNTaG9ydCAmJiAhaXNMb25nKSB7XG4gICAgICB0aHJvdyBuZXcgSW52YWxpZE9wdGlvbkVycm9yKGN1cnJlbnQsIG9wdHMuZmxhZ3MgPz8gW10pO1xuICAgIH1cblxuICAgIC8vIG5vcm1hbGl6ZSBzaG9ydCBmbGFnczogLWFiYyA9PiAtYSAtYiAtY1xuICAgIGlmIChpc1Nob3J0ICYmIGN1cnJlbnQubGVuZ3RoID4gMiAmJiBjdXJyZW50WzJdICE9PSBcIi5cIikge1xuICAgICAgYXJncy5zcGxpY2UoYXJnc0luZGV4LCAxLCAuLi5zcGxpdEZsYWdzKGN1cnJlbnQpKTtcbiAgICAgIGN1cnJlbnQgPSBhcmdzW2FyZ3NJbmRleF07XG4gICAgfSBlbHNlIGlmIChpc0xvbmcgJiYgY3VycmVudC5zdGFydHNXaXRoKFwiLS1uby1cIikpIHtcbiAgICAgIG5lZ2F0ZSA9IHRydWU7XG4gICAgfVxuXG4gICAgLy8gc3BsaXQgdmFsdWU6IC0tZm9vPVwiYmFyPWJhelwiID0+IC0tZm9vIGJhcj1iYXpcbiAgICBjb25zdCBlcXVhbFNpZ25JbmRleCA9IGN1cnJlbnQuaW5kZXhPZihcIj1cIik7XG4gICAgaWYgKGVxdWFsU2lnbkluZGV4ICE9PSAtMSkge1xuICAgICAgY3VycmVudFZhbHVlID0gY3VycmVudC5zbGljZShlcXVhbFNpZ25JbmRleCArIDEpIHx8IHVuZGVmaW5lZDtcbiAgICAgIGN1cnJlbnQgPSBjdXJyZW50LnNsaWNlKDAsIGVxdWFsU2lnbkluZGV4KTtcbiAgICB9XG5cbiAgICBpZiAob3B0cy5mbGFncykge1xuICAgICAgb3B0aW9uID0gZ2V0T3B0aW9uKG9wdHMuZmxhZ3MsIGN1cnJlbnQpO1xuXG4gICAgICBpZiAoIW9wdGlvbikge1xuICAgICAgICBjb25zdCBuYW1lID0gY3VycmVudC5yZXBsYWNlKC9eLSsvLCBcIlwiKTtcbiAgICAgICAgb3B0aW9uID0gbWF0Y2hXaWxkQ2FyZE9wdGlvbnMobmFtZSwgb3B0cy5mbGFncyk7XG4gICAgICAgIGlmICghb3B0aW9uKSB7XG4gICAgICAgICAgaWYgKG9wdHMuc3RvcE9uVW5rbm93bikge1xuICAgICAgICAgICAgY3R4LnN0b3BPblVua25vd24gPSB0cnVlO1xuICAgICAgICAgICAgY3R4LnVua25vd24ucHVzaChhcmdzW2FyZ3NJbmRleF0pO1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgfVxuICAgICAgICAgIHRocm93IG5ldyBVbmtub3duT3B0aW9uRXJyb3IoY3VycmVudCwgb3B0cy5mbGFncyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgb3B0aW9uID0ge1xuICAgICAgICBuYW1lOiBjdXJyZW50LnJlcGxhY2UoL14tKy8sIFwiXCIpLFxuICAgICAgICBvcHRpb25hbFZhbHVlOiB0cnVlLFxuICAgICAgICB0eXBlOiBPcHRpb25UeXBlLlNUUklORyxcbiAgICAgIH07XG4gICAgfVxuXG4gICAgaWYgKG9wdGlvbi5zdGFuZGFsb25lKSB7XG4gICAgICBjdHguc3RhbmRhbG9uZSA9IG9wdGlvbjtcbiAgICB9XG5cbiAgICBjb25zdCBwb3NpdGl2ZU5hbWU6IHN0cmluZyA9IG5lZ2F0ZVxuICAgICAgPyBvcHRpb24ubmFtZS5yZXBsYWNlKC9ebm8tPy8sIFwiXCIpXG4gICAgICA6IG9wdGlvbi5uYW1lO1xuICAgIGNvbnN0IHByb3BOYW1lOiBzdHJpbmcgPSBwYXJhbUNhc2VUb0NhbWVsQ2FzZShwb3NpdGl2ZU5hbWUpO1xuXG4gICAgaWYgKHR5cGVvZiBjdHguZmxhZ3NbcHJvcE5hbWVdICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICBpZiAoIW9wdHMuZmxhZ3M/Lmxlbmd0aCkge1xuICAgICAgICBvcHRpb24uY29sbGVjdCA9IHRydWU7XG4gICAgICB9IGVsc2UgaWYgKCFvcHRpb24uY29sbGVjdCkge1xuICAgICAgICB0aHJvdyBuZXcgRHVwbGljYXRlT3B0aW9uRXJyb3IoY3VycmVudCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKG9wdGlvbi50eXBlICYmICFvcHRpb24uYXJncz8ubGVuZ3RoKSB7XG4gICAgICBvcHRpb24uYXJncyA9IFt7XG4gICAgICAgIHR5cGU6IG9wdGlvbi50eXBlLFxuICAgICAgICByZXF1aXJlZFZhbHVlOiBvcHRpb24ucmVxdWlyZWRWYWx1ZSxcbiAgICAgICAgb3B0aW9uYWxWYWx1ZTogb3B0aW9uLm9wdGlvbmFsVmFsdWUsXG4gICAgICAgIHZhcmlhZGljOiBvcHRpb24udmFyaWFkaWMsXG4gICAgICAgIGxpc3Q6IG9wdGlvbi5saXN0LFxuICAgICAgICBzZXBhcmF0b3I6IG9wdGlvbi5zZXBhcmF0b3IsXG4gICAgICB9XTtcbiAgICB9XG5cbiAgICBpZiAoXG4gICAgICBvcHRzLmZsYWdzPy5sZW5ndGggJiYgIW9wdGlvbi5hcmdzPy5sZW5ndGggJiZcbiAgICAgIHR5cGVvZiBjdXJyZW50VmFsdWUgIT09IFwidW5kZWZpbmVkXCJcbiAgICApIHtcbiAgICAgIHRocm93IG5ldyBVbmV4cGVjdGVkT3B0aW9uVmFsdWVFcnJvcihvcHRpb24ubmFtZSwgY3VycmVudFZhbHVlKTtcbiAgICB9XG5cbiAgICBsZXQgb3B0aW9uQXJnc0luZGV4ID0gMDtcbiAgICBsZXQgaW5PcHRpb25hbEFyZyA9IGZhbHNlO1xuICAgIGNvbnN0IG5leHQgPSAoKSA9PiBjdXJyZW50VmFsdWUgPz8gYXJnc1thcmdzSW5kZXggKyAxXTtcbiAgICBjb25zdCBwcmV2aW91cyA9IGN0eC5mbGFnc1twcm9wTmFtZV07XG5cbiAgICBwYXJzZU5leHQob3B0aW9uKTtcblxuICAgIGlmICh0eXBlb2YgY3R4LmZsYWdzW3Byb3BOYW1lXSA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgaWYgKG9wdGlvbi5hcmdzPy5bb3B0aW9uQXJnc0luZGV4XT8ucmVxdWlyZWRWYWx1ZSkge1xuICAgICAgICB0aHJvdyBuZXcgTWlzc2luZ09wdGlvblZhbHVlRXJyb3Iob3B0aW9uLm5hbWUpO1xuICAgICAgfSBlbHNlIGlmICh0eXBlb2Ygb3B0aW9uLmRlZmF1bHQgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgY3R4LmZsYWdzW3Byb3BOYW1lXSA9IGdldERlZmF1bHRWYWx1ZShvcHRpb24pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY3R4LmZsYWdzW3Byb3BOYW1lXSA9IHRydWU7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKG9wdGlvbi52YWx1ZSkge1xuICAgICAgY3R4LmZsYWdzW3Byb3BOYW1lXSA9IG9wdGlvbi52YWx1ZShjdHguZmxhZ3NbcHJvcE5hbWVdLCBwcmV2aW91cyk7XG4gICAgfSBlbHNlIGlmIChvcHRpb24uY29sbGVjdCkge1xuICAgICAgY29uc3QgdmFsdWU6IHVua25vd25bXSA9IHR5cGVvZiBwcmV2aW91cyAhPT0gXCJ1bmRlZmluZWRcIlxuICAgICAgICA/IChBcnJheS5pc0FycmF5KHByZXZpb3VzKSA/IHByZXZpb3VzIDogW3ByZXZpb3VzXSlcbiAgICAgICAgOiBbXTtcblxuICAgICAgdmFsdWUucHVzaChjdHguZmxhZ3NbcHJvcE5hbWVdKTtcbiAgICAgIGN0eC5mbGFnc1twcm9wTmFtZV0gPSB2YWx1ZTtcbiAgICB9XG5cbiAgICBvcHRpb25zTWFwLnNldChwcm9wTmFtZSwgb3B0aW9uKTtcblxuICAgIG9wdHMub3B0aW9uPy4ob3B0aW9uIGFzIFRGbGFnT3B0aW9ucywgY3R4LmZsYWdzW3Byb3BOYW1lXSk7XG5cbiAgICAvKiogUGFyc2UgbmV4dCBhcmd1bWVudCBmb3IgY3VycmVudCBvcHRpb24uICovXG4gICAgLy8gZGVuby1saW50LWlnbm9yZSBuby1pbm5lci1kZWNsYXJhdGlvbnNcbiAgICBmdW5jdGlvbiBwYXJzZU5leHQob3B0aW9uOiBGbGFnT3B0aW9ucyk6IHZvaWQge1xuICAgICAgaWYgKG5lZ2F0ZSkge1xuICAgICAgICBjdHguZmxhZ3NbcHJvcE5hbWVdID0gZmFsc2U7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH0gZWxzZSBpZiAoIW9wdGlvbi5hcmdzPy5sZW5ndGgpIHtcbiAgICAgICAgY3R4LmZsYWdzW3Byb3BOYW1lXSA9IHVuZGVmaW5lZDtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgY29uc3QgYXJnOiBBcmd1bWVudE9wdGlvbnMgfCB1bmRlZmluZWQgPSBvcHRpb24uYXJnc1tvcHRpb25BcmdzSW5kZXhdO1xuXG4gICAgICBpZiAoIWFyZykge1xuICAgICAgICBjb25zdCBmbGFnID0gbmV4dCgpO1xuICAgICAgICB0aHJvdyBuZXcgVW5rbm93bk9wdGlvbkVycm9yKGZsYWcsIG9wdHMuZmxhZ3MgPz8gW10pO1xuICAgICAgfVxuXG4gICAgICBpZiAoIWFyZy50eXBlKSB7XG4gICAgICAgIGFyZy50eXBlID0gT3B0aW9uVHlwZS5CT09MRUFOO1xuICAgICAgfVxuXG4gICAgICBpZiAob3B0aW9uLmFyZ3M/Lmxlbmd0aCAmJiAhb3B0aW9uLnR5cGUpIHtcbiAgICAgICAgLy8gbWFrZSBhbGwgdmFsdWVzIHJlcXVpcmVkIGJ5IGRlZmF1bHRcbiAgICAgICAgaWYgKFxuICAgICAgICAgICh0eXBlb2YgYXJnLm9wdGlvbmFsVmFsdWUgPT09IFwidW5kZWZpbmVkXCIgfHxcbiAgICAgICAgICAgIGFyZy5vcHRpb25hbFZhbHVlID09PSBmYWxzZSkgJiZcbiAgICAgICAgICB0eXBlb2YgYXJnLnJlcXVpcmVkVmFsdWUgPT09IFwidW5kZWZpbmVkXCJcbiAgICAgICAgKSB7XG4gICAgICAgICAgYXJnLnJlcXVpcmVkVmFsdWUgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBtYWtlIG5vbiBib29sZWFuIHZhbHVlIHJlcXVpcmVkIGJ5IGRlZmF1bHRcbiAgICAgICAgaWYgKFxuICAgICAgICAgIGFyZy50eXBlICE9PSBPcHRpb25UeXBlLkJPT0xFQU4gJiZcbiAgICAgICAgICAodHlwZW9mIGFyZy5vcHRpb25hbFZhbHVlID09PSBcInVuZGVmaW5lZFwiIHx8XG4gICAgICAgICAgICBhcmcub3B0aW9uYWxWYWx1ZSA9PT0gZmFsc2UpICYmXG4gICAgICAgICAgdHlwZW9mIGFyZy5yZXF1aXJlZFZhbHVlID09PSBcInVuZGVmaW5lZFwiXG4gICAgICAgICkge1xuICAgICAgICAgIGFyZy5yZXF1aXJlZFZhbHVlID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoIWFyZy5yZXF1aXJlZFZhbHVlKSB7XG4gICAgICAgIGluT3B0aW9uYWxBcmcgPSB0cnVlO1xuICAgICAgfSBlbHNlIGlmIChpbk9wdGlvbmFsQXJnKSB7XG4gICAgICAgIHRocm93IG5ldyBVbmV4cGVjdGVkUmVxdWlyZWRBcmd1bWVudEVycm9yKG9wdGlvbi5uYW1lKTtcbiAgICAgIH1cblxuICAgICAgbGV0IHJlc3VsdDogdW5rbm93bjtcbiAgICAgIGxldCBpbmNyZWFzZSA9IGZhbHNlO1xuXG4gICAgICBpZiAoYXJnLmxpc3QgJiYgaGFzTmV4dChhcmcpKSB7XG4gICAgICAgIGNvbnN0IHBhcnNlZDogdW5rbm93bltdID0gbmV4dCgpXG4gICAgICAgICAgLnNwbGl0KGFyZy5zZXBhcmF0b3IgfHwgXCIsXCIpXG4gICAgICAgICAgLm1hcCgobmV4dFZhbHVlOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHZhbHVlID0gcGFyc2VWYWx1ZShvcHRpb24sIGFyZywgbmV4dFZhbHVlKTtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgICAgICAgdGhyb3cgbmV3IEludmFsaWRPcHRpb25WYWx1ZUVycm9yKFxuICAgICAgICAgICAgICAgIG9wdGlvbi5uYW1lLFxuICAgICAgICAgICAgICAgIGFyZy50eXBlID8/IFwiP1wiLFxuICAgICAgICAgICAgICAgIG5leHRWYWx1ZSxcbiAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgICAgICB9KTtcblxuICAgICAgICBpZiAocGFyc2VkPy5sZW5ndGgpIHtcbiAgICAgICAgICByZXN1bHQgPSBwYXJzZWQ7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmIChoYXNOZXh0KGFyZykpIHtcbiAgICAgICAgICByZXN1bHQgPSBwYXJzZVZhbHVlKG9wdGlvbiwgYXJnLCBuZXh0KCkpO1xuICAgICAgICB9IGVsc2UgaWYgKGFyZy5vcHRpb25hbFZhbHVlICYmIGFyZy50eXBlID09PSBPcHRpb25UeXBlLkJPT0xFQU4pIHtcbiAgICAgICAgICByZXN1bHQgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmIChpbmNyZWFzZSAmJiB0eXBlb2YgY3VycmVudFZhbHVlID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgIGFyZ3NJbmRleCsrO1xuICAgICAgICBpZiAoIWFyZy52YXJpYWRpYykge1xuICAgICAgICAgIG9wdGlvbkFyZ3NJbmRleCsrO1xuICAgICAgICB9IGVsc2UgaWYgKG9wdGlvbi5hcmdzW29wdGlvbkFyZ3NJbmRleCArIDFdKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IFVuZXhwZWN0ZWRBcmd1bWVudEFmdGVyVmFyaWFkaWNBcmd1bWVudEVycm9yKG5leHQoKSk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKFxuICAgICAgICB0eXBlb2YgcmVzdWx0ICE9PSBcInVuZGVmaW5lZFwiICYmXG4gICAgICAgIChvcHRpb24uYXJncy5sZW5ndGggPiAxIHx8IGFyZy52YXJpYWRpYylcbiAgICAgICkge1xuICAgICAgICBpZiAoIWN0eC5mbGFnc1twcm9wTmFtZV0pIHtcbiAgICAgICAgICBjdHguZmxhZ3NbcHJvcE5hbWVdID0gW107XG4gICAgICAgIH1cblxuICAgICAgICAoY3R4LmZsYWdzW3Byb3BOYW1lXSBhcyBBcnJheTx1bmtub3duPikucHVzaChyZXN1bHQpO1xuXG4gICAgICAgIGlmIChoYXNOZXh0KGFyZykpIHtcbiAgICAgICAgICBwYXJzZU5leHQob3B0aW9uKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY3R4LmZsYWdzW3Byb3BOYW1lXSA9IHJlc3VsdDtcbiAgICAgIH1cblxuICAgICAgLyoqIENoZWNrIGlmIGN1cnJlbnQgb3B0aW9uIHNob3VsZCBoYXZlIGFuIGFyZ3VtZW50LiAqL1xuICAgICAgZnVuY3Rpb24gaGFzTmV4dChhcmc6IEFyZ3VtZW50T3B0aW9ucyk6IGJvb2xlYW4ge1xuICAgICAgICBpZiAoIW9wdGlvbi5hcmdzPy5sZW5ndGgpIHtcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgbmV4dFZhbHVlID0gY3VycmVudFZhbHVlID8/IGFyZ3NbYXJnc0luZGV4ICsgMV07XG4gICAgICAgIGlmICghbmV4dFZhbHVlKSB7XG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGlmIChvcHRpb24uYXJncy5sZW5ndGggPiAxICYmIG9wdGlvbkFyZ3NJbmRleCA+PSBvcHRpb24uYXJncy5sZW5ndGgpIHtcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGFyZy5yZXF1aXJlZFZhbHVlKSB7XG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgLy8gcmVxdWlyZSBvcHRpb25hbCB2YWx1ZXMgdG8gYmUgY2FsbGVkIHdpdGggYW4gZXF1YWwgc2lnbjogZm9vPWJhclxuICAgICAgICBpZiAoXG4gICAgICAgICAgb3B0aW9uLmVxdWFsc1NpZ24gJiYgYXJnLm9wdGlvbmFsVmFsdWUgJiYgIWFyZy52YXJpYWRpYyAmJlxuICAgICAgICAgIHR5cGVvZiBjdXJyZW50VmFsdWUgPT09IFwidW5kZWZpbmVkXCJcbiAgICAgICAgKSB7XG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGlmIChhcmcub3B0aW9uYWxWYWx1ZSB8fCBhcmcudmFyaWFkaWMpIHtcbiAgICAgICAgICByZXR1cm4gbmV4dFZhbHVlWzBdICE9PSBcIi1cIiB8fFxuICAgICAgICAgICAgdHlwZW9mIGN1cnJlbnRWYWx1ZSAhPT0gXCJ1bmRlZmluZWRcIiB8fFxuICAgICAgICAgICAgKGFyZy50eXBlID09PSBPcHRpb25UeXBlLk5VTUJFUiAmJiAhaXNOYU4oTnVtYmVyKG5leHRWYWx1ZSkpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cblxuICAgICAgLyoqIFBhcnNlIGFyZ3VtZW50IHZhbHVlLiAgKi9cbiAgICAgIGZ1bmN0aW9uIHBhcnNlVmFsdWUoXG4gICAgICAgIG9wdGlvbjogRmxhZ09wdGlvbnMsXG4gICAgICAgIGFyZzogQXJndW1lbnRPcHRpb25zLFxuICAgICAgICB2YWx1ZTogc3RyaW5nLFxuICAgICAgKTogdW5rbm93biB7XG4gICAgICAgIGNvbnN0IHJlc3VsdDogdW5rbm93biA9IG9wdHMucGFyc2VcbiAgICAgICAgICA/IG9wdHMucGFyc2Uoe1xuICAgICAgICAgICAgbGFiZWw6IFwiT3B0aW9uXCIsXG4gICAgICAgICAgICB0eXBlOiBhcmcudHlwZSB8fCBPcHRpb25UeXBlLlNUUklORyxcbiAgICAgICAgICAgIG5hbWU6IGAtLSR7b3B0aW9uLm5hbWV9YCxcbiAgICAgICAgICAgIHZhbHVlLFxuICAgICAgICAgIH0pXG4gICAgICAgICAgOiBwYXJzZURlZmF1bHRUeXBlKG9wdGlvbiwgYXJnLCB2YWx1ZSk7XG5cbiAgICAgICAgaWYgKFxuICAgICAgICAgIHR5cGVvZiByZXN1bHQgIT09IFwidW5kZWZpbmVkXCJcbiAgICAgICAgKSB7XG4gICAgICAgICAgaW5jcmVhc2UgPSB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gb3B0aW9uc01hcDtcbn1cblxuZnVuY3Rpb24gcGFyc2VEb3R0ZWRPcHRpb25zKGN0eDogUGFyc2VGbGFnc0NvbnRleHQpOiB2b2lkIHtcbiAgLy8gY29udmVydCBkb3R0ZWQgb3B0aW9uIGtleXMgaW50byBuZXN0ZWQgb2JqZWN0c1xuICBjdHguZmxhZ3MgPSBPYmplY3Qua2V5cyhjdHguZmxhZ3MpLnJlZHVjZShcbiAgICAocmVzdWx0OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiwga2V5OiBzdHJpbmcpID0+IHtcbiAgICAgIGlmICh+a2V5LmluZGV4T2YoXCIuXCIpKSB7XG4gICAgICAgIGtleS5zcGxpdChcIi5cIikucmVkdWNlKFxuICAgICAgICAgIChcbiAgICAgICAgICAgIC8vIGRlbm8tbGludC1pZ25vcmUgbm8tZXhwbGljaXQtYW55XG4gICAgICAgICAgICByZXN1bHQ6IFJlY29yZDxzdHJpbmcsIGFueT4sXG4gICAgICAgICAgICBzdWJLZXk6IHN0cmluZyxcbiAgICAgICAgICAgIGluZGV4OiBudW1iZXIsXG4gICAgICAgICAgICBwYXJ0czogc3RyaW5nW10sXG4gICAgICAgICAgKSA9PiB7XG4gICAgICAgICAgICBpZiAoaW5kZXggPT09IHBhcnRzLmxlbmd0aCAtIDEpIHtcbiAgICAgICAgICAgICAgcmVzdWx0W3N1YktleV0gPSBjdHguZmxhZ3Nba2V5XTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHJlc3VsdFtzdWJLZXldID0gcmVzdWx0W3N1YktleV0gPz8ge307XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0W3N1YktleV07XG4gICAgICAgICAgfSxcbiAgICAgICAgICByZXN1bHQsXG4gICAgICAgICk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXN1bHRba2V5XSA9IGN0eC5mbGFnc1trZXldO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9LFxuICAgIHt9LFxuICApO1xufVxuXG5mdW5jdGlvbiBzcGxpdEZsYWdzKGZsYWc6IHN0cmluZyk6IEFycmF5PHN0cmluZz4ge1xuICBmbGFnID0gZmxhZy5zbGljZSgxKTtcbiAgY29uc3Qgbm9ybWFsaXplZDogQXJyYXk8c3RyaW5nPiA9IFtdO1xuICBjb25zdCBpbmRleCA9IGZsYWcuaW5kZXhPZihcIj1cIik7XG4gIGNvbnN0IGZsYWdzID0gKGluZGV4ICE9PSAtMSA/IGZsYWcuc2xpY2UoMCwgaW5kZXgpIDogZmxhZykuc3BsaXQoXCJcIik7XG5cbiAgaWYgKGlzTmFOKE51bWJlcihmbGFnW2ZsYWcubGVuZ3RoIC0gMV0pKSkge1xuICAgIGZsYWdzLmZvckVhY2goKHZhbCkgPT4gbm9ybWFsaXplZC5wdXNoKGAtJHt2YWx9YCkpO1xuICB9IGVsc2Uge1xuICAgIG5vcm1hbGl6ZWQucHVzaChgLSR7ZmxhZ3Muc2hpZnQoKX1gKTtcbiAgICBpZiAoZmxhZ3MubGVuZ3RoKSB7XG4gICAgICBub3JtYWxpemVkLnB1c2goZmxhZ3Muam9pbihcIlwiKSk7XG4gICAgfVxuICB9XG5cbiAgaWYgKGluZGV4ICE9PSAtMSkge1xuICAgIG5vcm1hbGl6ZWRbbm9ybWFsaXplZC5sZW5ndGggLSAxXSArPSBmbGFnLnNsaWNlKGluZGV4KTtcbiAgfVxuXG4gIHJldHVybiBub3JtYWxpemVkO1xufVxuXG5mdW5jdGlvbiBwYXJzZURlZmF1bHRUeXBlKFxuICBvcHRpb246IEZsYWdPcHRpb25zLFxuICBhcmc6IEFyZ3VtZW50T3B0aW9ucyxcbiAgdmFsdWU6IHN0cmluZyxcbik6IHVua25vd24ge1xuICBjb25zdCB0eXBlOiBBcmd1bWVudFR5cGUgPSBhcmcudHlwZSBhcyBBcmd1bWVudFR5cGUgfHwgT3B0aW9uVHlwZS5TVFJJTkc7XG4gIGNvbnN0IHBhcnNlVHlwZSA9IERlZmF1bHRUeXBlc1t0eXBlXTtcblxuICBpZiAoIXBhcnNlVHlwZSkge1xuICAgIHRocm93IG5ldyBVbmtub3duVHlwZUVycm9yKHR5cGUsIE9iamVjdC5rZXlzKERlZmF1bHRUeXBlcykpO1xuICB9XG5cbiAgcmV0dXJuIHBhcnNlVHlwZSh7XG4gICAgbGFiZWw6IFwiT3B0aW9uXCIsXG4gICAgdHlwZSxcbiAgICBuYW1lOiBgLS0ke29wdGlvbi5uYW1lfWAsXG4gICAgdmFsdWUsXG4gIH0pO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFNBQ0UsZUFBZSxFQUNmLFNBQVMsRUFDVCxvQkFBb0IsRUFDcEIsb0JBQW9CLFFBQ2YsY0FBYztBQUNyQixTQUNFLG9CQUFvQixFQUNwQixrQkFBa0IsRUFDbEIsdUJBQXVCLEVBQ3ZCLHVCQUF1QixFQUN2Qiw0Q0FBNEMsRUFDNUMsMEJBQTBCLEVBQzFCLCtCQUErQixFQUMvQiw2QkFBNkIsRUFDN0Isa0JBQWtCLEVBQ2xCLDBCQUEwQixFQUMxQixnQkFBZ0IsUUFDWCxlQUFlO0FBQ3RCLFNBQVMsVUFBVSxRQUFRLGtCQUFrQjtBQVM3QyxTQUFTLE9BQU8sUUFBUSxxQkFBcUI7QUFDN0MsU0FBUyxNQUFNLFFBQVEsb0JBQW9CO0FBQzNDLFNBQVMsTUFBTSxRQUFRLG9CQUFvQjtBQUMzQyxTQUFTLGFBQWEsUUFBUSx1QkFBdUI7QUFDckQsU0FBUyxPQUFPLFFBQVEscUJBQXFCO0FBRTdDLE1BQU0sZUFBa0Q7RUFDdEQ7RUFDQTtFQUNBO0VBQ0E7QUFDRjtBQUVBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0E4QkMsR0FDRCxPQUFPLFNBQVMsV0FLZCxTQUFrQyxFQUNsQyxPQUF3QyxDQUFDLENBQUM7RUFFMUMsSUFBSTtFQUNKLElBQUk7RUFFSixJQUFJLE1BQU0sT0FBTyxDQUFDLFlBQVk7SUFDNUIsTUFBTSxDQUFDO0lBQ1AsT0FBTztFQUNULE9BQU87SUFDTCxNQUFNO0lBQ04sT0FBTyxVQUFVLE9BQU87SUFDeEIsVUFBVSxPQUFPLEdBQUcsRUFBRTtFQUN4QjtFQUNBLE9BQU8sS0FBSyxLQUFLO0VBRWpCLElBQUksS0FBSyxLQUFLLENBQUM7RUFDZixJQUFJLE9BQU8s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