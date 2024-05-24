import { getDefaultValue, getOption, paramCaseToCamelCase } from "./_utils.ts";
import { ConflictingOptionError, DependingOptionError, MissingOptionValueError, MissingRequiredOptionError, OptionNotCombinableError, UnknownOptionError } from "./_errors.ts";
/**
 * Flags post validation. Validations that are not already done by the parser.
 *
 * @param ctx     Parse context.
 * @param opts    Parse options.
 * @param options Option name mappings: propertyName -> option
 */ export function validateFlags(ctx, opts, options = new Map()) {
  if (!opts.flags) {
    return;
  }
  const defaultValues = setDefaultValues(ctx, opts);
  const optionNames = Object.keys(ctx.flags);
  if (!optionNames.length && opts.allowEmpty) {
    return;
  }
  if (ctx.standalone) {
    validateStandaloneOption(ctx, options, optionNames, defaultValues);
    return;
  }
  for (const [name, option] of options){
    validateUnknownOption(option, opts);
    validateConflictingOptions(ctx, option);
    validateDependingOptions(ctx, option, defaultValues);
    validateRequiredValues(ctx, option, name);
  }
  validateRequiredOptions(ctx, options, opts);
}
function validateUnknownOption(option, opts) {
  if (!getOption(opts.flags ?? [], option.name)) {
    throw new UnknownOptionError(option.name, opts.flags ?? []);
  }
}
/**
 * Adds all default values to ctx.flags and returns a boolean object map with
 * only the default option names `{ [OptionName: string]: boolean }`.
 */ function setDefaultValues(ctx, opts) {
  const defaultValues = {};
  if (!opts.flags?.length) {
    return defaultValues;
  }
  // Set default values
  for (const option of opts.flags){
    let name;
    let defaultValue = undefined;
    // if --no-[flag] is present set --[flag] default value to true
    if (option.name.startsWith("no-")) {
      const propName = option.name.replace(/^no-/, "");
      if (typeof ctx.flags[propName] !== "undefined") {
        continue;
      }
      const positiveOption = getOption(opts.flags, propName);
      if (positiveOption) {
        continue;
      }
      name = paramCaseToCamelCase(propName);
      defaultValue = true;
    }
    if (!name) {
      name = paramCaseToCamelCase(option.name);
    }
    const hasDefaultValue = (!opts.ignoreDefaults || typeof opts.ignoreDefaults[name] === "undefined") && typeof ctx.flags[name] === "undefined" && (typeof option.default !== "undefined" || typeof defaultValue !== "undefined");
    if (hasDefaultValue) {
      ctx.flags[name] = getDefaultValue(option) ?? defaultValue;
      defaultValues[option.name] = true;
      if (typeof option.value === "function") {
        ctx.flags[name] = option.value(ctx.flags[name]);
      }
    }
  }
  return defaultValues;
}
function validateStandaloneOption(ctx, options, optionNames, defaultValues) {
  if (!ctx.standalone || optionNames.length === 1) {
    return;
  }
  // Don't throw an error if all values are coming from the default option.
  for (const [_, opt] of options){
    if (!defaultValues[opt.name] && opt !== ctx.standalone) {
      throw new OptionNotCombinableError(ctx.standalone.name);
    }
  }
}
function validateConflictingOptions(ctx, option) {
  if (!option.conflicts?.length) {
    return;
  }
  for (const flag of option.conflicts){
    if (isset(flag, ctx.flags)) {
      throw new ConflictingOptionError(option.name, flag);
    }
  }
}
function validateDependingOptions(ctx, option, defaultValues) {
  if (!option.depends) {
    return;
  }
  for (const flag of option.depends){
    // Don't throw an error if the value is coming from the default option.
    if (!isset(flag, ctx.flags) && !defaultValues[option.name]) {
      throw new DependingOptionError(option.name, flag);
    }
  }
}
function validateRequiredValues(ctx, option, name) {
  if (!option.args) {
    return;
  }
  const isArray = option.args.length > 1;
  for(let i = 0; i < option.args.length; i++){
    const arg = option.args[i];
    if (!arg.requiredValue) {
      continue;
    }
    const hasValue = isArray ? typeof ctx.flags[name][i] !== "undefined" : typeof ctx.flags[name] !== "undefined";
    if (!hasValue) {
      throw new MissingOptionValueError(option.name);
    }
  }
}
function validateRequiredOptions(ctx, options, opts) {
  if (!opts.flags?.length) {
    return;
  }
  const optionsValues = [
    ...options.values()
  ];
  for (const option of opts.flags){
    if (!option.required || paramCaseToCamelCase(option.name) in ctx.flags) {
      continue;
    }
    const conflicts = option.conflicts ?? [];
    const hasConflict = conflicts.find((flag)=>!!ctx.flags[flag]);
    const hasConflicts = hasConflict || optionsValues.find((opt)=>opt.conflicts?.find((flag)=>flag === option.name));
    if (hasConflicts) {
      continue;
    }
    throw new MissingRequiredOptionError(option.name);
  }
}
/**
 * Check if value exists for flag.
 * @param flagName  Flag name.
 * @param flags     Parsed values.
 */ function isset(flagName, flags) {
  const name = paramCaseToCamelCase(flagName);
  // return typeof values[ name ] !== 'undefined' && values[ name ] !== false;
  return typeof flags[name] !== "undefined";
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvY2xpZmZ5QHYwLjI1LjcvZmxhZ3MvX3ZhbGlkYXRlX2ZsYWdzLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGdldERlZmF1bHRWYWx1ZSwgZ2V0T3B0aW9uLCBwYXJhbUNhc2VUb0NhbWVsQ2FzZSB9IGZyb20gXCIuL191dGlscy50c1wiO1xuaW1wb3J0IHtcbiAgQ29uZmxpY3RpbmdPcHRpb25FcnJvcixcbiAgRGVwZW5kaW5nT3B0aW9uRXJyb3IsXG4gIE1pc3NpbmdPcHRpb25WYWx1ZUVycm9yLFxuICBNaXNzaW5nUmVxdWlyZWRPcHRpb25FcnJvcixcbiAgT3B0aW9uTm90Q29tYmluYWJsZUVycm9yLFxuICBVbmtub3duT3B0aW9uRXJyb3IsXG59IGZyb20gXCIuL19lcnJvcnMudHNcIjtcbmltcG9ydCB7IFBhcnNlRmxhZ3NDb250ZXh0LCBQYXJzZUZsYWdzT3B0aW9ucyB9IGZyb20gXCIuL3R5cGVzLnRzXCI7XG5pbXBvcnQgdHlwZSB7IEFyZ3VtZW50T3B0aW9ucywgRmxhZ09wdGlvbnMgfSBmcm9tIFwiLi90eXBlcy50c1wiO1xuXG4vKipcbiAqIEZsYWdzIHBvc3QgdmFsaWRhdGlvbi4gVmFsaWRhdGlvbnMgdGhhdCBhcmUgbm90IGFscmVhZHkgZG9uZSBieSB0aGUgcGFyc2VyLlxuICpcbiAqIEBwYXJhbSBjdHggICAgIFBhcnNlIGNvbnRleHQuXG4gKiBAcGFyYW0gb3B0cyAgICBQYXJzZSBvcHRpb25zLlxuICogQHBhcmFtIG9wdGlvbnMgT3B0aW9uIG5hbWUgbWFwcGluZ3M6IHByb3BlcnR5TmFtZSAtPiBvcHRpb25cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHZhbGlkYXRlRmxhZ3M8VCBleHRlbmRzIEZsYWdPcHRpb25zID0gRmxhZ09wdGlvbnM+KFxuICBjdHg6IFBhcnNlRmxhZ3NDb250ZXh0PFJlY29yZDxzdHJpbmcsIHVua25vd24+PixcbiAgb3B0czogUGFyc2VGbGFnc09wdGlvbnM8VD4sXG4gIG9wdGlvbnM6IE1hcDxzdHJpbmcsIEZsYWdPcHRpb25zPiA9IG5ldyBNYXAoKSxcbik6IHZvaWQge1xuICBpZiAoIW9wdHMuZmxhZ3MpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgY29uc3QgZGVmYXVsdFZhbHVlcyA9IHNldERlZmF1bHRWYWx1ZXMoY3R4LCBvcHRzKTtcblxuICBjb25zdCBvcHRpb25OYW1lcyA9IE9iamVjdC5rZXlzKGN0eC5mbGFncyk7XG4gIGlmICghb3B0aW9uTmFtZXMubGVuZ3RoICYmIG9wdHMuYWxsb3dFbXB0eSkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGlmIChjdHguc3RhbmRhbG9uZSkge1xuICAgIHZhbGlkYXRlU3RhbmRhbG9uZU9wdGlvbihcbiAgICAgIGN0eCxcbiAgICAgIG9wdGlvbnMsXG4gICAgICBvcHRpb25OYW1lcyxcbiAgICAgIGRlZmF1bHRWYWx1ZXMsXG4gICAgKTtcbiAgICByZXR1cm47XG4gIH1cblxuICBmb3IgKGNvbnN0IFtuYW1lLCBvcHRpb25dIG9mIG9wdGlvbnMpIHtcbiAgICB2YWxpZGF0ZVVua25vd25PcHRpb24ob3B0aW9uLCBvcHRzKTtcbiAgICB2YWxpZGF0ZUNvbmZsaWN0aW5nT3B0aW9ucyhjdHgsIG9wdGlvbik7XG4gICAgdmFsaWRhdGVEZXBlbmRpbmdPcHRpb25zKGN0eCwgb3B0aW9uLCBkZWZhdWx0VmFsdWVzKTtcbiAgICB2YWxpZGF0ZVJlcXVpcmVkVmFsdWVzKGN0eCwgb3B0aW9uLCBuYW1lKTtcbiAgfVxuXG4gIHZhbGlkYXRlUmVxdWlyZWRPcHRpb25zKGN0eCwgb3B0aW9ucywgb3B0cyk7XG59XG5cbmZ1bmN0aW9uIHZhbGlkYXRlVW5rbm93bk9wdGlvbjxUIGV4dGVuZHMgRmxhZ09wdGlvbnMgPSBGbGFnT3B0aW9ucz4oXG4gIG9wdGlvbjogRmxhZ09wdGlvbnMsXG4gIG9wdHM6IFBhcnNlRmxhZ3NPcHRpb25zPFQ+LFxuKSB7XG4gIGlmICghZ2V0T3B0aW9uKG9wdHMuZmxhZ3MgPz8gW10sIG9wdGlvbi5uYW1lKSkge1xuICAgIHRocm93IG5ldyBVbmtub3duT3B0aW9uRXJyb3Iob3B0aW9uLm5hbWUsIG9wdHMuZmxhZ3MgPz8gW10pO1xuICB9XG59XG5cbi8qKlxuICogQWRkcyBhbGwgZGVmYXVsdCB2YWx1ZXMgdG8gY3R4LmZsYWdzIGFuZCByZXR1cm5zIGEgYm9vbGVhbiBvYmplY3QgbWFwIHdpdGhcbiAqIG9ubHkgdGhlIGRlZmF1bHQgb3B0aW9uIG5hbWVzIGB7IFtPcHRpb25OYW1lOiBzdHJpbmddOiBib29sZWFuIH1gLlxuICovXG5mdW5jdGlvbiBzZXREZWZhdWx0VmFsdWVzPFQgZXh0ZW5kcyBGbGFnT3B0aW9ucyA9IEZsYWdPcHRpb25zPihcbiAgY3R4OiBQYXJzZUZsYWdzQ29udGV4dDxSZWNvcmQ8c3RyaW5nLCB1bmtub3duPj4sXG4gIG9wdHM6IFBhcnNlRmxhZ3NPcHRpb25zPFQ+LFxuKSB7XG4gIGNvbnN0IGRlZmF1bHRWYWx1ZXM6IFJlY29yZDxzdHJpbmcsIGJvb2xlYW4+ID0ge307XG4gIGlmICghb3B0cy5mbGFncz8ubGVuZ3RoKSB7XG4gICAgcmV0dXJuIGRlZmF1bHRWYWx1ZXM7XG4gIH1cblxuICAvLyBTZXQgZGVmYXVsdCB2YWx1ZXNcbiAgZm9yIChjb25zdCBvcHRpb24gb2Ygb3B0cy5mbGFncykge1xuICAgIGxldCBuYW1lOiBzdHJpbmcgfCB1bmRlZmluZWQ7XG4gICAgbGV0IGRlZmF1bHRWYWx1ZTogdW5rbm93biA9IHVuZGVmaW5lZDtcblxuICAgIC8vIGlmIC0tbm8tW2ZsYWddIGlzIHByZXNlbnQgc2V0IC0tW2ZsYWddIGRlZmF1bHQgdmFsdWUgdG8gdHJ1ZVxuICAgIGlmIChvcHRpb24ubmFtZS5zdGFydHNXaXRoKFwibm8tXCIpKSB7XG4gICAgICBjb25zdCBwcm9wTmFtZSA9IG9wdGlvbi5uYW1lLnJlcGxhY2UoL15uby0vLCBcIlwiKTtcbiAgICAgIGlmICh0eXBlb2YgY3R4LmZsYWdzW3Byb3BOYW1lXSAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHBvc2l0aXZlT3B0aW9uID0gZ2V0T3B0aW9uKG9wdHMuZmxhZ3MsIHByb3BOYW1lKTtcbiAgICAgIGlmIChwb3NpdGl2ZU9wdGlvbikge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIG5hbWUgPSBwYXJhbUNhc2VUb0NhbWVsQ2FzZShwcm9wTmFtZSk7XG4gICAgICBkZWZhdWx0VmFsdWUgPSB0cnVlO1xuICAgIH1cblxuICAgIGlmICghbmFtZSkge1xuICAgICAgbmFtZSA9IHBhcmFtQ2FzZVRvQ2FtZWxDYXNlKG9wdGlvbi5uYW1lKTtcbiAgICB9XG5cbiAgICBjb25zdCBoYXNEZWZhdWx0VmFsdWU6IGJvb2xlYW4gPSAoIW9wdHMuaWdub3JlRGVmYXVsdHMgfHxcbiAgICAgIHR5cGVvZiBvcHRzLmlnbm9yZURlZmF1bHRzW25hbWVdID09PSBcInVuZGVmaW5lZFwiKSAmJlxuICAgICAgdHlwZW9mIGN0eC5mbGFnc1tuYW1lXSA9PT0gXCJ1bmRlZmluZWRcIiAmJiAoXG4gICAgICAgIHR5cGVvZiBvcHRpb24uZGVmYXVsdCAhPT0gXCJ1bmRlZmluZWRcIiB8fFxuICAgICAgICB0eXBlb2YgZGVmYXVsdFZhbHVlICE9PSBcInVuZGVmaW5lZFwiXG4gICAgICApO1xuXG4gICAgaWYgKGhhc0RlZmF1bHRWYWx1ZSkge1xuICAgICAgY3R4LmZsYWdzW25hbWVdID0gZ2V0RGVmYXVsdFZhbHVlKG9wdGlvbikgPz8gZGVmYXVsdFZhbHVlO1xuICAgICAgZGVmYXVsdFZhbHVlc1tvcHRpb24ubmFtZV0gPSB0cnVlO1xuICAgICAgaWYgKHR5cGVvZiBvcHRpb24udmFsdWUgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICBjdHguZmxhZ3NbbmFtZV0gPSBvcHRpb24udmFsdWUoY3R4LmZsYWdzW25hbWVdKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gZGVmYXVsdFZhbHVlcztcbn1cblxuZnVuY3Rpb24gdmFsaWRhdGVTdGFuZGFsb25lT3B0aW9uKFxuICBjdHg6IFBhcnNlRmxhZ3NDb250ZXh0LFxuICBvcHRpb25zOiBNYXA8c3RyaW5nLCBGbGFnT3B0aW9ucz4sXG4gIG9wdGlvbk5hbWVzOiBBcnJheTxzdHJpbmc+LFxuICBkZWZhdWx0VmFsdWVzOiBSZWNvcmQ8c3RyaW5nLCBib29sZWFuPixcbik6IHZvaWQge1xuICBpZiAoIWN0eC5zdGFuZGFsb25lIHx8IG9wdGlvbk5hbWVzLmxlbmd0aCA9PT0gMSkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIC8vIERvbid0IHRocm93IGFuIGVycm9yIGlmIGFsbCB2YWx1ZXMgYXJlIGNvbWluZyBmcm9tIHRoZSBkZWZhdWx0IG9wdGlvbi5cbiAgZm9yIChjb25zdCBbXywgb3B0XSBvZiBvcHRpb25zKSB7XG4gICAgaWYgKCFkZWZhdWx0VmFsdWVzW29wdC5uYW1lXSAmJiBvcHQgIT09IGN0eC5zdGFuZGFsb25lKSB7XG4gICAgICB0aHJvdyBuZXcgT3B0aW9uTm90Q29tYmluYWJsZUVycm9yKGN0eC5zdGFuZGFsb25lLm5hbWUpO1xuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiB2YWxpZGF0ZUNvbmZsaWN0aW5nT3B0aW9ucyhcbiAgY3R4OiBQYXJzZUZsYWdzQ29udGV4dDxSZWNvcmQ8c3RyaW5nLCB1bmtub3duPj4sXG4gIG9wdGlvbjogRmxhZ09wdGlvbnMsXG4pOiB2b2lkIHtcbiAgaWYgKCFvcHRpb24uY29uZmxpY3RzPy5sZW5ndGgpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgZm9yIChjb25zdCBmbGFnIG9mIG9wdGlvbi5jb25mbGljdHMpIHtcbiAgICBpZiAoaXNzZXQoZmxhZywgY3R4LmZsYWdzKSkge1xuICAgICAgdGhyb3cgbmV3IENvbmZsaWN0aW5nT3B0aW9uRXJyb3Iob3B0aW9uLm5hbWUsIGZsYWcpO1xuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiB2YWxpZGF0ZURlcGVuZGluZ09wdGlvbnMoXG4gIGN0eDogUGFyc2VGbGFnc0NvbnRleHQ8UmVjb3JkPHN0cmluZywgdW5rbm93bj4+LFxuICBvcHRpb246IEZsYWdPcHRpb25zLFxuICBkZWZhdWx0VmFsdWVzOiBSZWNvcmQ8c3RyaW5nLCBib29sZWFuPixcbik6IHZvaWQge1xuICBpZiAoIW9wdGlvbi5kZXBlbmRzKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIGZvciAoY29uc3QgZmxhZyBvZiBvcHRpb24uZGVwZW5kcykge1xuICAgIC8vIERvbid0IHRocm93IGFuIGVycm9yIGlmIHRoZSB2YWx1ZSBpcyBjb21pbmcgZnJvbSB0aGUgZGVmYXVsdCBvcHRpb24uXG4gICAgaWYgKCFpc3NldChmbGFnLCBjdHguZmxhZ3MpICYmICFkZWZhdWx0VmFsdWVzW29wdGlvbi5uYW1lXSkge1xuICAgICAgdGhyb3cgbmV3IERlcGVuZGluZ09wdGlvbkVycm9yKG9wdGlvbi5uYW1lLCBmbGFnKTtcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gdmFsaWRhdGVSZXF1aXJlZFZhbHVlcyhcbiAgY3R4OiBQYXJzZUZsYWdzQ29udGV4dDxSZWNvcmQ8c3RyaW5nLCB1bmtub3duPj4sXG4gIG9wdGlvbjogRmxhZ09wdGlvbnMsXG4gIG5hbWU6IHN0cmluZyxcbik6IHZvaWQge1xuICBpZiAoIW9wdGlvbi5hcmdzKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIGNvbnN0IGlzQXJyYXkgPSBvcHRpb24uYXJncy5sZW5ndGggPiAxO1xuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgb3B0aW9uLmFyZ3MubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCBhcmc6IEFyZ3VtZW50T3B0aW9ucyA9IG9wdGlvbi5hcmdzW2ldO1xuICAgIGlmICghYXJnLnJlcXVpcmVkVmFsdWUpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgICBjb25zdCBoYXNWYWx1ZSA9IGlzQXJyYXlcbiAgICAgID8gdHlwZW9mIChjdHguZmxhZ3NbbmFtZV0gYXMgQXJyYXk8dW5rbm93bj4pW2ldICE9PSBcInVuZGVmaW5lZFwiXG4gICAgICA6IHR5cGVvZiBjdHguZmxhZ3NbbmFtZV0gIT09IFwidW5kZWZpbmVkXCI7XG5cbiAgICBpZiAoIWhhc1ZhbHVlKSB7XG4gICAgICB0aHJvdyBuZXcgTWlzc2luZ09wdGlvblZhbHVlRXJyb3Iob3B0aW9uLm5hbWUpO1xuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiB2YWxpZGF0ZVJlcXVpcmVkT3B0aW9uczxUIGV4dGVuZHMgRmxhZ09wdGlvbnMgPSBGbGFnT3B0aW9ucz4oXG4gIGN0eDogUGFyc2VGbGFnc0NvbnRleHQ8UmVjb3JkPHN0cmluZywgdW5rbm93bj4+LFxuICBvcHRpb25zOiBNYXA8c3RyaW5nLCBGbGFnT3B0aW9ucz4sXG4gIG9wdHM6IFBhcnNlRmxhZ3NPcHRpb25zPFQ+LFxuKTogdm9pZCB7XG4gIGlmICghb3B0cy5mbGFncz8ubGVuZ3RoKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIGNvbnN0IG9wdGlvbnNWYWx1ZXMgPSBbLi4ub3B0aW9ucy52YWx1ZXMoKV07XG5cbiAgZm9yIChjb25zdCBvcHRpb24gb2Ygb3B0cy5mbGFncykge1xuICAgIGlmICghb3B0aW9uLnJlcXVpcmVkIHx8IHBhcmFtQ2FzZVRvQ2FtZWxDYXNlKG9wdGlvbi5uYW1lKSBpbiBjdHguZmxhZ3MpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgICBjb25zdCBjb25mbGljdHMgPSBvcHRpb24uY29uZmxpY3RzID8/IFtdO1xuICAgIGNvbnN0IGhhc0NvbmZsaWN0ID0gY29uZmxpY3RzLmZpbmQoKGZsYWc6IHN0cmluZykgPT4gISFjdHguZmxhZ3NbZmxhZ10pO1xuICAgIGNvbnN0IGhhc0NvbmZsaWN0cyA9IGhhc0NvbmZsaWN0IHx8XG4gICAgICBvcHRpb25zVmFsdWVzLmZpbmQoKG9wdCkgPT5cbiAgICAgICAgb3B0LmNvbmZsaWN0cz8uZmluZCgoZmxhZzogc3RyaW5nKSA9PiBmbGFnID09PSBvcHRpb24ubmFtZSlcbiAgICAgICk7XG5cbiAgICBpZiAoaGFzQ29uZmxpY3RzKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gICAgdGhyb3cgbmV3IE1pc3NpbmdSZXF1aXJlZE9wdGlvbkVycm9yKG9wdGlvbi5uYW1lKTtcbiAgfVxufVxuXG4vKipcbiAqIENoZWNrIGlmIHZhbHVlIGV4aXN0cyBmb3IgZmxhZy5cbiAqIEBwYXJhbSBmbGFnTmFtZSAgRmxhZyBuYW1lLlxuICogQHBhcmFtIGZsYWdzICAgICBQYXJzZWQgdmFsdWVzLlxuICovXG5mdW5jdGlvbiBpc3NldChmbGFnTmFtZTogc3RyaW5nLCBmbGFnczogUmVjb3JkPHN0cmluZywgdW5rbm93bj4pOiBib29sZWFuIHtcbiAgY29uc3QgbmFtZSA9IHBhcmFtQ2FzZVRvQ2FtZWxDYXNlKGZsYWdOYW1lKTtcbiAgLy8gcmV0dXJuIHR5cGVvZiB2YWx1ZXNbIG5hbWUgXSAhPT0gJ3VuZGVmaW5lZCcgJiYgdmFsdWVzWyBuYW1lIF0gIT09IGZhbHNlO1xuICByZXR1cm4gdHlwZW9mIGZsYWdzW25hbWVdICE9PSBcInVuZGVmaW5lZFwiO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFNBQVMsZUFBZSxFQUFFLFNBQVMsRUFBRSxvQkFBb0IsUUFBUSxjQUFjO0FBQy9FLFNBQ0Usc0JBQXNCLEVBQ3RCLG9CQUFvQixFQUNwQix1QkFBdUIsRUFDdkIsMEJBQTBCLEVBQzFCLHdCQUF3QixFQUN4QixrQkFBa0IsUUFDYixlQUFlO0FBSXRCOzs7Ozs7Q0FNQyxHQUNELE9BQU8sU0FBUyxjQUNkLEdBQStDLEVBQy9DLElBQTBCLEVBQzFCLFVBQW9DLElBQUksS0FBSztFQUU3QyxJQUFJLENBQUMsS0FBSyxLQUFLLEVBQUU7SUFDZjtFQUNGO0VBQ0EsTUFBTSxnQkFBZ0IsaUJBQWlCLEtBQUs7RUFFNUMsTUFBTSxjQUFjLE9BQU8sSUFBSSxDQUFDLElBQUksS0FBSztFQUN6QyxJQUFJLENBQUMsWUFBWSxNQUFNLElBQUksS0FBSyxVQUFVLEVBQUU7SUFDMUM7RUFDRjtFQUVBLElBQUksSUFBSSxVQUFVLEVBQUU7SUFDbEIseUJBQ0UsS0FDQSxT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