// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
/**
 * Command line arguments parser based on
 * {@link https://github.com/minimistjs/minimist | minimist}.
 *
 * This module is browser compatible.
 *
 * @example
 * ```ts
 * import { parseArgs } from "@std/cli/parse-args";
 *
 * console.dir(parseArgs(Deno.args));
 * ```
 *
 * @module
 */ import { assert } from "jsr:/@std/assert@^0.225.2/assert";
function isNumber(x) {
  if (typeof x === "number") return true;
  if (/^0x[0-9a-f]+$/i.test(String(x))) return true;
  return /^[-+]?(?:\d+(?:\.\d*)?|\.\d+)(e[-+]?\d+)?$/.test(String(x));
}
function setNested(object, keys, value, collect = false) {
  keys.slice(0, -1).forEach((key)=>{
    object[key] ??= {};
    object = object[key];
  });
  const key = keys.at(-1);
  if (collect) {
    const v = object[key];
    if (Array.isArray(v)) {
      v.push(value);
      return;
    }
    value = v ? [
      v,
      value
    ] : [
      value
    ];
  }
  object[key] = value;
}
function hasNested(object, keys) {
  keys = [
    ...keys
  ];
  const lastKey = keys.pop();
  if (!lastKey) return false;
  for (const key of keys){
    if (!object[key]) return false;
    object = object[key];
  }
  return Object.hasOwn(object, lastKey);
}
function aliasIsBoolean(aliasMap, booleanSet, key) {
  const set = aliasMap.get(key);
  if (set === undefined) return false;
  for (const alias of set)if (booleanSet.has(alias)) return true;
  return false;
}
function isBooleanString(value) {
  return value === "true" || value === "false";
}
function parseBooleanString(value) {
  return value !== "false";
}
const FLAG_REGEXP = /^(?:-(?:(?<doubleDash>-)(?<negated>no-)?)?)(?<key>.+?)(?:=(?<value>.+?))?$/s;
/**
 * Take a set of command line arguments, optionally with a set of options, and
 * return an object representing the flags found in the passed arguments.
 *
 * By default, any arguments starting with `-` or `--` are considered boolean
 * flags. If the argument name is followed by an equal sign (`=`) it is
 * considered a key-value pair. Any arguments which could not be parsed are
 * available in the `_` property of the returned object.
 *
 * By default, the flags module tries to determine the type of all arguments
 * automatically and the return type of the `parseArgs` method will have an index
 * signature with `any` as value (`{ [x: string]: any }`).
 *
 * If the `string`, `boolean` or `collect` option is set, the return value of
 * the `parseArgs` method will be fully typed and the index signature of the return
 * type will change to `{ [x: string]: unknown }`.
 *
 * Any arguments after `'--'` will not be parsed and will end up in `parsedArgs._`.
 *
 * Numeric-looking arguments will be returned as numbers unless `options.string`
 * or `options.boolean` is set for that argument name.
 *
 * @example
 * ```ts
 * import { parseArgs } from "@std/cli/parse-args";
 * const parsedArgs = parseArgs(Deno.args);
 * ```
 *
 * @example
 * ```ts
 * import { parseArgs } from "@std/cli/parse-args";
 * const parsedArgs = parseArgs(["--foo", "--bar=baz", "./quux.txt"]);
 * // parsedArgs: { foo: true, bar: "baz", _: ["./quux.txt"] }
 * ```
 */ export function parseArgs(args, { "--": doubleDash = false, alias = {}, boolean = false, default: defaults = {}, stopEarly = false, string = [], collect = [], negatable = [], unknown: unknownFn = (i)=>i } = {}) {
  const aliasMap = new Map();
  const booleanSet = new Set();
  const stringSet = new Set();
  const collectSet = new Set();
  const negatableSet = new Set();
  let allBools = false;
  if (alias) {
    for(const key in alias){
      const val = alias[key];
      assert(val !== undefined);
      const aliases = Array.isArray(val) ? val : [
        val
      ];
      aliasMap.set(key, new Set(aliases));
      aliases.forEach((alias)=>aliasMap.set(alias, new Set([
          key,
          ...aliases.filter((it)=>it !== alias)
        ])));
    }
  }
  if (boolean) {
    if (typeof boolean === "boolean") {
      allBools = boolean;
    } else {
      const booleanArgs = Array.isArray(boolean) ? boolean : [
        boolean
      ];
      for (const key of booleanArgs.filter(Boolean)){
        booleanSet.add(key);
        aliasMap.get(key)?.forEach((al)=>{
          booleanSet.add(al);
        });
      }
    }
  }
  if (string) {
    const stringArgs = Array.isArray(string) ? string : [
      string
    ];
    for (const key of stringArgs.filter(Boolean)){
      stringSet.add(key);
      aliasMap.get(key)?.forEach((al)=>stringSet.add(al));
    }
  }
  if (collect) {
    const collectArgs = Array.isArray(collect) ? collect : [
      collect
    ];
    for (const key of collectArgs.filter(Boolean)){
      collectSet.add(key);
      aliasMap.get(key)?.forEach((al)=>collectSet.add(al));
    }
  }
  if (negatable) {
    const negatableArgs = Array.isArray(negatable) ? negatable : [
      negatable
    ];
    for (const key of negatableArgs.filter(Boolean)){
      negatableSet.add(key);
      aliasMap.get(key)?.forEach((alias)=>negatableSet.add(alias));
    }
  }
  const argv = {
    _: []
  };
  function setArgument(key, value, arg, collect) {
    if (!booleanSet.has(key) && !stringSet.has(key) && !aliasMap.has(key) && !(allBools && /^--[^=]+$/.test(arg)) && unknownFn?.(arg, key, value) === false) {
      return;
    }
    if (typeof value === "string" && !stringSet.has(key)) {
      value = isNumber(value) ? Number(value) : value;
    }
    const collectable = collect && collectSet.has(key);
    setNested(argv, key.split("."), value, collectable);
    aliasMap.get(key)?.forEach((key)=>{
      setNested(argv, key.split("."), value, collectable);
    });
  }
  let notFlags = [];
  // all args after "--" are not parsed
  const index = args.indexOf("--");
  if (index !== -1) {
    notFlags = args.slice(index + 1);
    args = args.slice(0, index);
  }
  for(let i = 0; i < args.length; i++){
    const arg = args[i];
    const groups = arg.match(FLAG_REGEXP)?.groups;
    if (groups) {
      const { doubleDash, negated } = groups;
      let key = groups.key;
      let value = groups.value;
      if (doubleDash) {
        if (value) {
          if (booleanSet.has(key)) value = parseBooleanString(value);
          setArgument(key, value, arg, true);
          continue;
        }
        if (negated) {
          if (negatableSet.has(key)) {
            setArgument(key, false, arg, false);
            continue;
          }
          key = `no-${key}`;
        }
        const next = args[i + 1];
        if (!booleanSet.has(key) && !allBools && next && !/^-/.test(next) && (aliasMap.get(key) ? !aliasIsBoolean(aliasMap, booleanSet, key) : true)) {
          value = next;
          i++;
          setArgument(key, value, arg, true);
          continue;
        }
        if (next && isBooleanString(next)) {
          value = parseBooleanString(next);
          i++;
          setArgument(key, value, arg, true);
          continue;
        }
        value = stringSet.has(key) ? "" : true;
        setArgument(key, value, arg, true);
        continue;
      }
      const letters = arg.slice(1, -1).split("");
      let broken = false;
      for (const [j, letter] of letters.entries()){
        const next = arg.slice(j + 2);
        if (next === "-") {
          setArgument(letter, next, arg, true);
          continue;
        }
        if (/[A-Za-z]/.test(letter) && /=/.test(next)) {
          setArgument(letter, next.split(/=(.+)/)[1], arg, true);
          broken = true;
          break;
        }
        if (/[A-Za-z]/.test(letter) && /-?\d+(\.\d*)?(e-?\d+)?$/.test(next)) {
          setArgument(letter, next, arg, true);
          broken = true;
          break;
        }
        if (letters[j + 1] && letters[j + 1].match(/\W/)) {
          setArgument(letter, arg.slice(j + 2), arg, true);
          broken = true;
          break;
        }
        setArgument(letter, stringSet.has(letter) ? "" : true, arg, true);
      }
      key = arg.slice(-1);
      if (!broken && key !== "-") {
        const nextArg = args[i + 1];
        if (nextArg && !/^(-|--)[^-]/.test(nextArg) && !booleanSet.has(key) && (aliasMap.get(key) ? !aliasIsBoolean(aliasMap, booleanSet, key) : true)) {
          setArgument(key, nextArg, arg, true);
          i++;
        } else if (nextArg && isBooleanString(nextArg)) {
          const value = parseBooleanString(nextArg);
          setArgument(key, value, arg, true);
          i++;
        } else {
          setArgument(key, stringSet.has(key) ? "" : true, arg, true);
        }
      }
      continue;
    }
    if (unknownFn?.(arg) !== false) {
      argv._.push(stringSet.has("_") || !isNumber(arg) ? arg : Number(arg));
    }
    if (stopEarly) {
      argv._.push(...args.slice(i + 1));
      break;
    }
  }
  for (const [key, value] of Object.entries(defaults)){
    const keys = key.split(".");
    if (!hasNested(argv, keys)) {
      setNested(argv, keys, value);
      aliasMap.get(key)?.forEach((key)=>setNested(argv, key.split("."), value));
    }
  }
  for (const key of booleanSet.keys()){
    const keys = key.split(".");
    if (!hasNested(argv, keys)) {
      const value = collectSet.has(key) ? [] : false;
      setNested(argv, keys, value);
    }
  }
  for (const key of stringSet.keys()){
    const keys = key.split(".");
    if (!hasNested(argv, keys) && collectSet.has(key)) {
      setNested(argv, keys, []);
    }
  }
  if (doubleDash) {
    argv["--"] = [];
    for (const key of notFlags){
      argv["--"].push(key);
    }
  } else {
    for (const key of notFlags){
      argv._.push(key);
    }
  }
  return argv;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0BzdGQvY2xpLzAuMjI0LjIvcGFyc2VfYXJncy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDI0IHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuLy8gVGhpcyBtb2R1bGUgaXMgYnJvd3NlciBjb21wYXRpYmxlLlxuXG4vKipcbiAqIENvbW1hbmQgbGluZSBhcmd1bWVudHMgcGFyc2VyIGJhc2VkIG9uXG4gKiB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL21pbmltaXN0anMvbWluaW1pc3QgfCBtaW5pbWlzdH0uXG4gKlxuICogVGhpcyBtb2R1bGUgaXMgYnJvd3NlciBjb21wYXRpYmxlLlxuICpcbiAqIEBleGFtcGxlXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgcGFyc2VBcmdzIH0gZnJvbSBcIkBzdGQvY2xpL3BhcnNlLWFyZ3NcIjtcbiAqXG4gKiBjb25zb2xlLmRpcihwYXJzZUFyZ3MoRGVuby5hcmdzKSk7XG4gKiBgYGBcbiAqXG4gKiBAbW9kdWxlXG4gKi9cbmltcG9ydCB7IGFzc2VydCB9IGZyb20gXCJqc3I6L0BzdGQvYXNzZXJ0QF4wLjIyNS4yL2Fzc2VydFwiO1xuXG4vKiogQ29tYmluZXMgcmVjdXJzaXZlbHkgYWxsIGludGVyc2VjdGlvbiB0eXBlcyBhbmQgcmV0dXJucyBhIG5ldyBzaW5nbGUgdHlwZS4gKi9cbnR5cGUgSWQ8VFJlY29yZD4gPSBUUmVjb3JkIGV4dGVuZHMgUmVjb3JkPHN0cmluZywgdW5rbm93bj5cbiAgPyBUUmVjb3JkIGV4dGVuZHMgaW5mZXIgSW5mZXJyZWRSZWNvcmRcbiAgICA/IHsgW0tleSBpbiBrZXlvZiBJbmZlcnJlZFJlY29yZF06IElkPEluZmVycmVkUmVjb3JkW0tleV0+IH1cbiAgOiBuZXZlclxuICA6IFRSZWNvcmQ7XG5cbi8qKiBDb252ZXJ0cyBhIHVuaW9uIHR5cGUgYEEgfCBCIHwgQ2AgaW50byBhbiBpbnRlcnNlY3Rpb24gdHlwZSBgQSAmIEIgJiBDYC4gKi9cbnR5cGUgVW5pb25Ub0ludGVyc2VjdGlvbjxUVmFsdWU+ID1cbiAgKFRWYWx1ZSBleHRlbmRzIHVua25vd24gPyAoYXJnczogVFZhbHVlKSA9PiB1bmtub3duIDogbmV2ZXIpIGV4dGVuZHNcbiAgICAoYXJnczogaW5mZXIgUikgPT4gdW5rbm93biA/IFIgZXh0ZW5kcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiA/IFIgOiBuZXZlclxuICAgIDogbmV2ZXI7XG5cbnR5cGUgQm9vbGVhblR5cGUgPSBib29sZWFuIHwgc3RyaW5nIHwgdW5kZWZpbmVkO1xudHlwZSBTdHJpbmdUeXBlID0gc3RyaW5nIHwgdW5kZWZpbmVkO1xudHlwZSBBcmdUeXBlID0gU3RyaW5nVHlwZSB8IEJvb2xlYW5UeXBlO1xuXG50eXBlIENvbGxlY3RhYmxlID0gc3RyaW5nIHwgdW5kZWZpbmVkO1xudHlwZSBOZWdhdGFibGUgPSBzdHJpbmcgfCB1bmRlZmluZWQ7XG5cbnR5cGUgVXNlVHlwZXM8XG4gIFRCb29sZWFucyBleHRlbmRzIEJvb2xlYW5UeXBlLFxuICBUU3RyaW5ncyBleHRlbmRzIFN0cmluZ1R5cGUsXG4gIFRDb2xsZWN0YWJsZSBleHRlbmRzIENvbGxlY3RhYmxlLFxuPiA9IHVuZGVmaW5lZCBleHRlbmRzIChcbiAgJiAoZmFsc2UgZXh0ZW5kcyBUQm9vbGVhbnMgPyB1bmRlZmluZWQgOiBUQm9vbGVhbnMpXG4gICYgVENvbGxlY3RhYmxlXG4gICYgVFN0cmluZ3NcbikgPyBmYWxzZVxuICA6IHRydWU7XG5cbi8qKlxuICogQ3JlYXRlcyBhIHJlY29yZCB3aXRoIGFsbCBhdmFpbGFibGUgZmxhZ3Mgd2l0aCB0aGUgY29ycmVzcG9uZGluZyB0eXBlIGFuZFxuICogZGVmYXVsdCB0eXBlLlxuICovXG50eXBlIFZhbHVlczxcbiAgVEJvb2xlYW5zIGV4dGVuZHMgQm9vbGVhblR5cGUsXG4gIFRTdHJpbmdzIGV4dGVuZHMgU3RyaW5nVHlwZSxcbiAgVENvbGxlY3RhYmxlIGV4dGVuZHMgQ29sbGVjdGFibGUsXG4gIFROZWdhdGFibGUgZXh0ZW5kcyBOZWdhdGFibGUsXG4gIFREZWZhdWx0IGV4dGVuZHMgUmVjb3JkPHN0cmluZywgdW5rbm93bj4gfCB1bmRlZmluZWQsXG4gIFRBbGlhc2VzIGV4dGVuZHMgQWxpYXNlcyB8IHVuZGVmaW5lZCxcbj4gPSBVc2VUeXBlczxUQm9vbGVhbnMsIFRTdHJpbmdzLCBUQ29sbGVjdGFibGU+IGV4dGVuZHMgdHJ1ZSA/XG4gICAgJiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPlxuICAgICYgQWRkQWxpYXNlczxcbiAgICAgIFNwcmVhZERlZmF1bHRzPFxuICAgICAgICAmIENvbGxlY3RWYWx1ZXM8VFN0cmluZ3MsIHN0cmluZywgVENvbGxlY3RhYmxlLCBUTmVnYXRhYmxlPlxuICAgICAgICAmIFJlY3Vyc2l2ZVJlcXVpcmVkPENvbGxlY3RWYWx1ZXM8VEJvb2xlYW5zLCBib29sZWFuLCBUQ29sbGVjdGFibGU+PlxuICAgICAgICAmIENvbGxlY3RVbmtub3duVmFsdWVzPFxuICAgICAgICAgIFRCb29sZWFucyxcbiAgICAgICAgICBUU3RyaW5ncyxcbiAgICAgICAgICBUQ29sbGVjdGFibGUsXG4gICAgICAgICAgVE5lZ2F0YWJsZVxuICAgICAgICA+LFxuICAgICAgICBEZWRvdFJlY29yZDxURGVmYXVsdD5cbiAgICAgID4sXG4gICAgICBUQWxpYXNlc1xuICAgID5cbiAgLy8gZGVuby1saW50LWlnbm9yZSBuby1leHBsaWNpdC1hbnlcbiAgOiBSZWNvcmQ8c3RyaW5nLCBhbnk+O1xuXG50eXBlIEFsaWFzZXM8VEFyZ05hbWVzID0gc3RyaW5nLCBUQWxpYXNOYW1lcyBleHRlbmRzIHN0cmluZyA9IHN0cmluZz4gPSBQYXJ0aWFsPFxuICBSZWNvcmQ8RXh0cmFjdDxUQXJnTmFtZXMsIHN0cmluZz4sIFRBbGlhc05hbWVzIHwgUmVhZG9ubHlBcnJheTxUQWxpYXNOYW1lcz4+XG4+O1xuXG50eXBlIEFkZEFsaWFzZXM8XG4gIFRBcmdzLFxuICBUQWxpYXNlcyBleHRlbmRzIEFsaWFzZXMgfCB1bmRlZmluZWQsXG4+ID0ge1xuICBbVEFyZ05hbWUgaW4ga2V5b2YgVEFyZ3MgYXMgQWxpYXNOYW1lczxUQXJnTmFtZSwgVEFsaWFzZXM+XTogVEFyZ3NbVEFyZ05hbWVdO1xufTtcblxudHlwZSBBbGlhc05hbWVzPFxuICBUQXJnTmFtZSxcbiAgVEFsaWFzZXMgZXh0ZW5kcyBBbGlhc2VzIHwgdW5kZWZpbmVkLFxuPiA9IFRBcmdOYW1lIGV4dGVuZHMga2V5b2YgVEFsaWFzZXNcbiAgPyBzdHJpbmcgZXh0ZW5kcyBUQWxpYXNlc1tUQXJnTmFtZV0gPyBUQXJnTmFtZVxuICA6IFRBbGlhc2VzW1RBcmdOYW1lXSBleHRlbmRzIHN0cmluZyA/IFRBcmdOYW1lIHwgVEFsaWFzZXNbVEFyZ05hbWVdXG4gIDogVEFsaWFzZXNbVEFyZ05hbWVdIGV4dGVuZHMgQXJyYXk8c3RyaW5nPlxuICAgID8gVEFyZ05hbWUgfCBUQWxpYXNlc1tUQXJnTmFtZV1bbnVtYmVyXVxuICA6IFRBcmdOYW1lXG4gIDogVEFyZ05hbWU7XG5cbi8qKlxuICogU3ByZWFkcyBhbGwgZGVmYXVsdCB2YWx1ZXMgb2YgUmVjb3JkIGBURGVmYXVsdHNgIGludG8gUmVjb3JkIGBUQXJnc2BcbiAqIGFuZCBtYWtlcyBkZWZhdWx0IHZhbHVlcyByZXF1aXJlZC5cbiAqXG4gKiAqKkV4YW1wbGU6KipcbiAqIGBTcHJlYWRWYWx1ZXM8eyBmb28/OiBib29sZWFuLCBiYXI/OiBudW1iZXIgfSwgeyBmb286IG51bWJlciB9PmBcbiAqXG4gKiAqKlJlc3VsdDoqKiBgeyBmb286IGJvb2xlYW4gfCBudW1iZXIsIGJhcj86IG51bWJlciB9YFxuICovXG50eXBlIFNwcmVhZERlZmF1bHRzPFRBcmdzLCBURGVmYXVsdHM+ID0gVERlZmF1bHRzIGV4dGVuZHMgdW5kZWZpbmVkID8gVEFyZ3NcbiAgOiBUQXJncyBleHRlbmRzIFJlY29yZDxzdHJpbmcsIHVua25vd24+ID9cbiAgICAgICYgT21pdDxUQXJncywga2V5b2YgVERlZmF1bHRzPlxuICAgICAgJiB7XG4gICAgICAgIFtEZWZhdWx0IGluIGtleW9mIFREZWZhdWx0c106IERlZmF1bHQgZXh0ZW5kcyBrZXlvZiBUQXJnc1xuICAgICAgICAgID8gKFRBcmdzW0RlZmF1bHRdICYgVERlZmF1bHRzW0RlZmF1bHRdIHwgVERlZmF1bHRzW0RlZmF1bHRdKSBleHRlbmRzXG4gICAgICAgICAgICBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPlxuICAgICAgICAgICAgPyBOb25OdWxsYWJsZTxTcHJlYWREZWZhdWx0czxUQXJnc1tEZWZhdWx0XSwgVERlZmF1bHRzW0RlZmF1bHRdPj5cbiAgICAgICAgICA6IFREZWZhdWx0c1tEZWZhdWx0XSB8IE5vbk51bGxhYmxlPFRBcmdzW0RlZmF1bHRdPlxuICAgICAgICAgIDogdW5rbm93bjtcbiAgICAgIH1cbiAgOiBuZXZlcjtcblxuLyoqXG4gKiBEZWZpbmVzIHRoZSBSZWNvcmQgZm9yIHRoZSBgZGVmYXVsdGAgb3B0aW9uIHRvIGFkZFxuICogYXV0by1zdWdnZXN0aW9uIHN1cHBvcnQgZm9yIElERSdzLlxuICovXG50eXBlIERlZmF1bHRzPFRCb29sZWFucyBleHRlbmRzIEJvb2xlYW5UeXBlLCBUU3RyaW5ncyBleHRlbmRzIFN0cmluZ1R5cGU+ID0gSWQ8XG4gIFVuaW9uVG9JbnRlcnNlY3Rpb248XG4gICAgJiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPlxuICAgIC8vIERlZG90dGVkIGF1dG8gc3VnZ2VzdGlvbnM6IHsgZm9vOiB7IGJhcjogdW5rbm93biB9IH1cbiAgICAmIE1hcFR5cGVzPFRTdHJpbmdzLCB1bmtub3duPlxuICAgICYgTWFwVHlwZXM8VEJvb2xlYW5zLCB1bmtub3duPlxuICAgIC8vIEZsYXQgYXV0byBzdWdnZXN0aW9uczogeyBcImZvby5iYXJcIjogdW5rbm93biB9XG4gICAgJiBNYXBEZWZhdWx0czxUQm9vbGVhbnM+XG4gICAgJiBNYXBEZWZhdWx0czxUU3RyaW5ncz5cbiAgPlxuPjtcblxudHlwZSBNYXBEZWZhdWx0czxUQXJnTmFtZXMgZXh0ZW5kcyBBcmdUeXBlPiA9IFBhcnRpYWw8XG4gIFJlY29yZDxUQXJnTmFtZXMgZXh0ZW5kcyBzdHJpbmcgPyBUQXJnTmFtZXMgOiBzdHJpbmcsIHVua25vd24+XG4+O1xuXG50eXBlIFJlY3Vyc2l2ZVJlcXVpcmVkPFRSZWNvcmQ+ID0gVFJlY29yZCBleHRlbmRzIFJlY29yZDxzdHJpbmcsIHVua25vd24+ID8ge1xuICAgIFtLZXkgaW4ga2V5b2YgVFJlY29yZF0tPzogUmVjdXJzaXZlUmVxdWlyZWQ8VFJlY29yZFtLZXldPjtcbiAgfVxuICA6IFRSZWNvcmQ7XG5cbi8qKiBTYW1lIGFzIGBNYXBUeXBlc2AgYnV0IGFsc28gc3VwcG9ydHMgY29sbGVjdGFibGUgb3B0aW9ucy4gKi9cbnR5cGUgQ29sbGVjdFZhbHVlczxcbiAgVEFyZ05hbWVzIGV4dGVuZHMgQXJnVHlwZSxcbiAgVFR5cGUsXG4gIFRDb2xsZWN0YWJsZSBleHRlbmRzIENvbGxlY3RhYmxlLFxuICBUTmVnYXRhYmxlIGV4dGVuZHMgTmVnYXRhYmxlID0gdW5kZWZpbmVkLFxuPiA9IFVuaW9uVG9JbnRlcnNlY3Rpb248XG4gIEV4dHJhY3Q8VEFyZ05hbWVzLCBUQ29sbGVjdGFibGU+IGV4dGVuZHMgc3RyaW5nID9cbiAgICAgICYgKEV4Y2x1ZGU8VEFyZ05hbWVzLCBUQ29sbGVjdGFibGU+IGV4dGVuZHMgbmV2ZXIgPyBSZWNvcmQ8bmV2ZXIsIG5ldmVyPlxuICAgICAgICA6IE1hcFR5cGVzPEV4Y2x1ZGU8VEFyZ05hbWVzLCBUQ29sbGVjdGFibGU+LCBUVHlwZSwgVE5lZ2F0YWJsZT4pXG4gICAgICAmIChFeHRyYWN0PFRBcmdOYW1lcywgVENvbGxlY3RhYmxlPiBleHRlbmRzIG5ldmVyID8gUmVjb3JkPG5ldmVyLCBuZXZlcj5cbiAgICAgICAgOiBSZWN1cnNpdmVSZXF1aXJlZDxcbiAgICAgICAgICBNYXBUeXBlczxFeHRyYWN0PFRBcmdOYW1lcywgVENvbGxlY3RhYmxlPiwgQXJyYXk8VFR5cGU+LCBUTmVnYXRhYmxlPlxuICAgICAgICA+KVxuICAgIDogTWFwVHlwZXM8VEFyZ05hbWVzLCBUVHlwZSwgVE5lZ2F0YWJsZT5cbj47XG5cbi8qKiBTYW1lIGFzIGBSZWNvcmRgIGJ1dCBhbHNvIHN1cHBvcnRzIGRvdHRlZCBhbmQgbmVnYXRhYmxlIG9wdGlvbnMuICovXG50eXBlIE1hcFR5cGVzPFxuICBUQXJnTmFtZXMgZXh0ZW5kcyBBcmdUeXBlLFxuICBUVHlwZSxcbiAgVE5lZ2F0YWJsZSBleHRlbmRzIE5lZ2F0YWJsZSA9IHVuZGVmaW5lZCxcbj4gPSB1bmRlZmluZWQgZXh0ZW5kcyBUQXJnTmFtZXMgPyBSZWNvcmQ8bmV2ZXIsIG5ldmVyPlxuICA6IFRBcmdOYW1lcyBleHRlbmRzIGAke2luZmVyIE5hbWV9LiR7aW5mZXIgUmVzdH1gID8ge1xuICAgICAgW0tleSBpbiBOYW1lXT86IE1hcFR5cGVzPFxuICAgICAgICBSZXN0LFxuICAgICAgICBUVHlwZSxcbiAgICAgICAgVE5lZ2F0YWJsZSBleHRlbmRzIGAke05hbWV9LiR7aW5mZXIgTmVnYXRlfWAgPyBOZWdhdGUgOiB1bmRlZmluZWRcbiAgICAgID47XG4gICAgfVxuICA6IFRBcmdOYW1lcyBleHRlbmRzIHN0cmluZyA/IFBhcnRpYWw8XG4gICAgICBSZWNvcmQ8VEFyZ05hbWVzLCBUTmVnYXRhYmxlIGV4dGVuZHMgVEFyZ05hbWVzID8gVFR5cGUgfCBmYWxzZSA6IFRUeXBlPlxuICAgID5cbiAgOiBSZWNvcmQ8bmV2ZXIsIG5ldmVyPjtcblxudHlwZSBDb2xsZWN0VW5rbm93blZhbHVlczxcbiAgVEJvb2xlYW5zIGV4dGVuZHMgQm9vbGVhblR5cGUsXG4gIFRTdHJpbmdzIGV4dGVuZHMgU3RyaW5nVHlwZSxcbiAgVENvbGxlY3RhYmxlIGV4dGVuZHMgQ29sbGVjdGFibGUsXG4gIFROZWdhdGFibGUgZXh0ZW5kcyBOZWdhdGFibGUsXG4+ID0gVW5pb25Ub0ludGVyc2VjdGlvbjxcbiAgVENvbGxlY3RhYmxlIGV4dGVuZHMgVEJvb2xlYW5zICYgVFN0cmluZ3MgPyBSZWNvcmQ8bmV2ZXIsIG5ldmVyPlxuICAgIDogRGVkb3RSZWNvcmQ8XG4gICAgICAvLyBVbmtub3duIGNvbGxlY3RhYmxlICYgbm9uLW5lZ2F0YWJsZSBhcmdzLlxuICAgICAgJiBSZWNvcmQ8XG4gICAgICAgIEV4Y2x1ZGU8XG4gICAgICAgICAgRXh0cmFjdDxFeGNsdWRlPFRDb2xsZWN0YWJsZSwgVE5lZ2F0YWJsZT4sIHN0cmluZz4sXG4gICAgICAgICAgRXh0cmFjdDxUU3RyaW5ncyB8IFRCb29sZWFucywgc3RyaW5nPlxuICAgICAgICA+LFxuICAgICAgICBBcnJheTx1bmtub3duPlxuICAgICAgPlxuICAgICAgLy8gVW5rbm93biBjb2xsZWN0YWJsZSAmIG5lZ2F0YWJsZSBhcmdzLlxuICAgICAgJiBSZWNvcmQ8XG4gICAgICAgIEV4Y2x1ZGU8XG4gICAgICAgICAgRXh0cmFjdDxFeHRyYWN0PFRDb2xsZWN0YWJsZSwgVE5lZ2F0YWJsZT4sIHN0cmluZz4sXG4gICAgICAgICAgRXh0cmFjdDxUU3RyaW5ncyB8IFRCb29sZWFucywgc3RyaW5nPlxuICAgICAgICA+LFxuICAgICAgICBBcnJheTx1bmtub3duPiB8IGZhbHNlXG4gICAgICA+XG4gICAgPlxuPjtcblxuLyoqIENvbnZlcnRzIGB7IFwiZm9vLmJhci5iYXpcIjogdW5rbm93biB9YCBpbnRvIGB7IGZvbzogeyBiYXI6IHsgYmF6OiB1bmtub3duIH0gfSB9YC4gKi9cbnR5cGUgRGVkb3RSZWNvcmQ8VFJlY29yZD4gPSBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiBleHRlbmRzIFRSZWNvcmQgPyBUUmVjb3JkXG4gIDogVFJlY29yZCBleHRlbmRzIFJlY29yZDxzdHJpbmcsIHVua25vd24+ID8gVW5pb25Ub0ludGVyc2VjdGlvbjxcbiAgICAgIFZhbHVlT2Y8XG4gICAgICAgIHtcbiAgICAgICAgICBbS2V5IGluIGtleW9mIFRSZWNvcmRdOiBLZXkgZXh0ZW5kcyBzdHJpbmcgPyBEZWRvdDxLZXksIFRSZWNvcmRbS2V5XT5cbiAgICAgICAgICAgIDogbmV2ZXI7XG4gICAgICAgIH1cbiAgICAgID5cbiAgICA+XG4gIDogVFJlY29yZDtcblxudHlwZSBEZWRvdDxUS2V5IGV4dGVuZHMgc3RyaW5nLCBUVmFsdWU+ID0gVEtleSBleHRlbmRzXG4gIGAke2luZmVyIE5hbWV9LiR7aW5mZXIgUmVzdH1gID8geyBbS2V5IGluIE5hbWVdOiBEZWRvdDxSZXN0LCBUVmFsdWU+IH1cbiAgOiB7IFtLZXkgaW4gVEtleV06IFRWYWx1ZSB9O1xuXG50eXBlIFZhbHVlT2Y8VFZhbHVlPiA9IFRWYWx1ZVtrZXlvZiBUVmFsdWVdO1xuXG4vKiogVGhlIHZhbHVlIHJldHVybmVkIGZyb20gYHBhcnNlQXJnc2AuICovXG5leHBvcnQgdHlwZSBBcmdzPFxuICAvLyBkZW5vLWxpbnQtaWdub3JlIG5vLWV4cGxpY2l0LWFueVxuICBUQXJncyBleHRlbmRzIFJlY29yZDxzdHJpbmcsIHVua25vd24+ID0gUmVjb3JkPHN0cmluZywgYW55PixcbiAgVERvdWJsZURhc2ggZXh0ZW5kcyBib29sZWFuIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkLFxuPiA9IElkPFxuICAmIFRBcmdzXG4gICYge1xuICAgIC8qKiBDb250YWlucyBhbGwgdGhlIGFyZ3VtZW50cyB0aGF0IGRpZG4ndCBoYXZlIGFuIG9wdGlvbiBhc3NvY2lhdGVkIHdpdGhcbiAgICAgKiB0aGVtLiAqL1xuICAgIF86IEFycmF5PHN0cmluZyB8IG51bWJlcj47XG4gIH1cbiAgJiAoYm9vbGVhbiBleHRlbmRzIFREb3VibGVEYXNoID8gRG91YmxlRGFzaFxuICAgIDogdHJ1ZSBleHRlbmRzIFREb3VibGVEYXNoID8gUmVxdWlyZWQ8RG91YmxlRGFzaD5cbiAgICA6IFJlY29yZDxuZXZlciwgbmV2ZXI+KVxuPjtcblxudHlwZSBEb3VibGVEYXNoID0ge1xuICAvKiogQ29udGFpbnMgYWxsIHRoZSBhcmd1bWVudHMgdGhhdCBhcHBlYXIgYWZ0ZXIgdGhlIGRvdWJsZSBkYXNoOiBcIi0tXCIuICovXG4gIFwiLS1cIj86IEFycmF5PHN0cmluZz47XG59O1xuXG4vKiogVGhlIG9wdGlvbnMgZm9yIHRoZSBgcGFyc2VBcmdzYCBjYWxsLiAqL1xuZXhwb3J0IGludGVyZmFjZSBQYXJzZU9wdGlvbnM8XG4gIFRCb29sZWFucyBleHRlbmRzIEJvb2xlYW5UeXBlID0gQm9vbGVhblR5cGUsXG4gIFRTdHJpbmdzIGV4dGVuZHMgU3RyaW5nVHlwZSA9IFN0cmluZ1R5cGUsXG4gIFRDb2xsZWN0YWJsZSBleHRlbmRzIENvbGxlY3RhYmxlID0gQ29sbGVjdGFibGUsXG4gIFROZWdhdGFibGUgZXh0ZW5kcyBOZWdhdGFibGUgPSBOZWdhdGFibGUsXG4gIFREZWZhdWx0IGV4dGVuZHMgUmVjb3JkPHN0cmluZywgdW5rbm93bj4gfCB1bmRlZmluZWQgPVxuICAgIHwgUmVjb3JkPHN0cmluZywgdW5rbm93bj5cbiAgICB8IHVuZGVmaW5lZCxcbiAgVEFsaWFzZXMgZXh0ZW5kcyBBbGlhc2VzIHwgdW5kZWZpbmVkID0gQWxpYXNlcyB8IHVuZGVmaW5lZCxcbiAgVERvdWJsZURhc2ggZXh0ZW5kcyBib29sZWFuIHwgdW5kZWZpbmVkID0gYm9vbGVhbiB8IHVuZGVmaW5lZCxcbj4ge1xuICAvKipcbiAgICogV2hlbiBgdHJ1ZWAsIHBvcHVsYXRlIHRoZSByZXN1bHQgYF9gIHdpdGggZXZlcnl0aGluZyBiZWZvcmUgdGhlIGAtLWAgYW5kXG4gICAqIHRoZSByZXN1bHQgYFsnLS0nXWAgd2l0aCBldmVyeXRoaW5nIGFmdGVyIHRoZSBgLS1gLlxuICAgKlxuICAgKiBAZGVmYXVsdCB7ZmFsc2V9XG4gICAqXG4gICAqICBAZXhhbXBsZVxuICAgKiBgYGB0c1xuICAgKiAvLyAkIGRlbm8gcnVuIGV4YW1wbGUudHMgLS0gYSBhcmcxXG4gICAqIGltcG9ydCB7IHBhcnNlQXJncyB9IGZyb20gXCJAc3RkL2NsaS9wYXJzZS1hcmdzXCI7XG4gICAqIGNvbnNvbGUuZGlyKHBhcnNlQXJncyhEZW5vLmFyZ3MsIHsgXCItLVwiOiBmYWxzZSB9KSk7XG4gICAqIC8vIG91dHB1dDogeyBfOiBbIFwiYVwiLCBcImFyZzFcIiBdIH1cbiAgICogY29uc29sZS5kaXIocGFyc2VBcmdzKERlbm8uYXJncywgeyBcIi0tXCI6IHRydWUgfSkpO1xuICAgKiAvLyBvdXRwdXQ6IHsgXzogW10sIC0tOiBbIFwiYVwiLCBcImFyZzFcIiBdIH1cbiAgICogYGBgXG4gICAqL1xuICBcIi0tXCI/OiBURG91YmxlRGFzaDtcblxuICAvKipcbiAgICogQW4gb2JqZWN0IG1hcHBpbmcgc3RyaW5nIG5hbWVzIHRvIHN0cmluZ3Mgb3IgYXJyYXlzIG9mIHN0cmluZyBhcmd1bWVudFxuICAgKiBuYW1lcyB0byB1c2UgYXMgYWxpYXNlcy5cbiAgICovXG4gIGFsaWFzPzogVEFsaWFzZXM7XG5cbiAgLyoqXG4gICAqIEEgYm9vbGVhbiwgc3RyaW5nIG9yIGFycmF5IG9mIHN0cmluZ3MgdG8gYWx3YXlzIHRyZWF0IGFzIGJvb2xlYW5zLiBJZlxuICAgKiBgdHJ1ZWAgd2lsbCB0cmVhdCBhbGwgZG91YmxlIGh5cGhlbmF0ZWQgYXJndW1lbnRzIHdpdGhvdXQgZXF1YWwgc2lnbnMgYXNcbiAgICogYGJvb2xlYW5gIChlLmcuIGFmZmVjdHMgYC0tZm9vYCwgbm90IGAtZmAgb3IgYC0tZm9vPWJhcmApLlxuICAgKiAgQWxsIGBib29sZWFuYCBhcmd1bWVudHMgd2lsbCBiZSBzZXQgdG8gYGZhbHNlYCBieSBkZWZhdWx0LlxuICAgKi9cbiAgYm9vbGVhbj86IFRCb29sZWFucyB8IFJlYWRvbmx5QXJyYXk8RXh0cmFjdDxUQm9vbGVhbnMsIHN0cmluZz4+O1xuXG4gIC8qKiBBbiBvYmplY3QgbWFwcGluZyBzdHJpbmcgYXJndW1lbnQgbmFtZXMgdG8gZGVmYXVsdCB2YWx1ZXMuICovXG4gIGRlZmF1bHQ/OiBURGVmYXVsdCAmIERlZmF1bHRzPFRCb29sZWFucywgVFN0cmluZ3M+O1xuXG4gIC8qKlxuICAgKiBXaGVuIGB0cnVlYCwgcG9wdWxhdGUgdGhlIHJlc3VsdCBgX2Agd2l0aCBldmVyeXRoaW5nIGFmdGVyIHRoZSBmaXJzdFxuICAgKiBub24tb3B0aW9uLlxuICAgKi9cbiAgc3RvcEVhcmx5PzogYm9vbGVhbjtcblxuICAvKiogQSBzdHJpbmcgb3IgYXJyYXkgb2Ygc3RyaW5ncyBhcmd1bWVudCBuYW1lcyB0byBhbHdheXMgdHJlYXQgYXMgc3RyaW5ncy4gKi9cbiAgc3RyaW5nPzogVFN0cmluZ3MgfCBSZWFkb25seUFycmF5PEV4dHJhY3Q8VFN0cmluZ3MsIHN0cmluZz4+O1xuXG4gIC8qKlxuICAgKiBBIHN0cmluZyBvciBhcnJheSBvZiBzdHJpbmdzIGFyZ3VtZW50IG5hbWVzIHRvIGFsd2F5cyB0cmVhdCBhcyBhcnJheXMuXG4gICAqIENvbGxlY3RhYmxlIG9wdGlvbnMgY2FuIGJlIHVzZWQgbXVsdGlwbGUgdGltZXMuIEFsbCB2YWx1ZXMgd2lsbCBiZVxuICAgKiBjb2xsZWN0ZWQgaW50byBvbmUgYXJyYXkuIElmIGEgbm9uLWNvbGxlY3RhYmxlIG9wdGlvbiBpcyB1c2VkIG11bHRpcGxlXG4gICAqIHRpbWVzLCB0aGUgbGFzdCB2YWx1ZSBpcyB1c2VkLlxuICAgKiBBbGwgQ29sbGVjdGFibGUgYXJndW1lbnRzIHdpbGwgYmUgc2V0IHRvIGBbXWAgYnkgZGVmYXVsdC5cbiAgICovXG4gIGNvbGxlY3Q/OiBUQ29sbGVjdGFibGUgfCBSZWFkb25seUFycmF5PEV4dHJhY3Q8VENvbGxlY3RhYmxlLCBzdHJpbmc+PjtcblxuICAvKipcbiAgICogQSBzdHJpbmcgb3IgYXJyYXkgb2Ygc3RyaW5ncyBhcmd1bWVudCBuYW1lcyB3aGljaCBjYW4gYmUgbmVnYXRlZFxuICAgKiBieSBwcmVmaXhpbmcgdGhlbSB3aXRoIGAtLW5vLWAsIGxpa2UgYC0tbm8tY29uZmlnYC5cbiAgICovXG4gIG5lZ2F0YWJsZT86IFROZWdhdGFibGUgfCBSZWFkb25seUFycmF5PEV4dHJhY3Q8VE5lZ2F0YWJsZSwgc3RyaW5nPj47XG5cbiAgLyoqXG4gICAqIEEgZnVuY3Rpb24gd2hpY2ggaXMgaW52b2tlZCB3aXRoIGEgY29tbWFuZCBsaW5lIHBhcmFtZXRlciBub3QgZGVmaW5lZCBpblxuICAgKiB0aGUgYG9wdGlvbnNgIGNvbmZpZ3VyYXRpb24gb2JqZWN0LiBJZiB0aGUgZnVuY3Rpb24gcmV0dXJucyBgZmFsc2VgLCB0aGVcbiAgICogdW5rbm93biBvcHRpb24gaXMgbm90IGFkZGVkIHRvIGBwYXJzZWRBcmdzYC5cbiAgICovXG4gIHVua25vd24/OiAoYXJnOiBzdHJpbmcsIGtleT86IHN0cmluZywgdmFsdWU/OiB1bmtub3duKSA9PiB1bmtub3duO1xufVxuXG5pbnRlcmZhY2UgTmVzdGVkTWFwcGluZyB7XG4gIFtrZXk6IHN0cmluZ106IE5lc3RlZE1hcHBpbmcgfCB1bmtub3duO1xufVxuXG5mdW5jdGlvbiBpc051bWJlcih4OiB1bmtub3duKTogYm9vbGVhbiB7XG4gIGlmICh0eXBlb2YgeCA9PT0gXCJudW1iZXJcIikgcmV0dXJuIHRydWU7XG4gIGlmICgvXjB4WzAtOWEtZl0rJC9pLnRlc3QoU3RyaW5nKHgpKSkgcmV0dXJuIHRydWU7XG4gIHJldHVybiAvXlstK10/KD86XFxkKyg/OlxcLlxcZCopP3xcXC5cXGQrKShlWy0rXT9cXGQrKT8kLy50ZXN0KFN0cmluZyh4KSk7XG59XG5cbmZ1bmN0aW9uIHNldE5lc3RlZChcbiAgb2JqZWN0OiBOZXN0ZWRNYXBwaW5nLFxuICBrZXlzOiBzdHJpbmdbXSxcbiAgdmFsdWU6IHVua25vd24sXG4gIGNvbGxlY3QgPSBmYWxzZSxcbikge1xuICBrZXlzLnNsaWNlKDAsIC0xKS5mb3JFYWNoKChrZXkpID0+IHtcbiAgICBvYmplY3Rba2V5XSA/Pz0ge307XG4gICAgb2JqZWN0ID0gb2JqZWN0W2tleV0gYXMgTmVzdGVkTWFwcGluZztcbiAgfSk7XG5cbiAgY29uc3Qga2V5ID0ga2V5cy5hdCgtMSkhO1xuXG4gIGlmIChjb2xsZWN0KSB7XG4gICAgY29uc3QgdiA9IG9iamVjdFtrZXldO1xuICAgIGlmIChBcnJheS5pc0FycmF5KHYpKSB7XG4gICAgICB2LnB1c2godmFsdWUpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHZhbHVlID0gdiA/IFt2LCB2YWx1ZV0gOiBbdmFsdWVdO1xuICB9XG5cbiAgb2JqZWN0W2tleV0gPSB2YWx1ZTtcbn1cblxuZnVuY3Rpb24gaGFzTmVzdGVkKG9iamVjdDogTmVzdGVkTWFwcGluZywga2V5czogc3RyaW5nW10pOiBib29sZWFuIHtcbiAga2V5cyA9IFsuLi5rZXlzXTtcbiAgY29uc3QgbGFzdEtleSA9IGtleXMucG9wKCk7XG4gIGlmICghbGFzdEtleSkgcmV0dXJuIGZhbHNlO1xuICBmb3IgKGNvbnN0IGtleSBvZiBrZXlzKSB7XG4gICAgaWYgKCFvYmplY3Rba2V5XSkgcmV0dXJuIGZhbHNlO1xuICAgIG9iamVjdCA9IG9iamVjdFtrZXldIGFzIE5lc3RlZE1hcHBpbmc7XG4gIH1cbiAgcmV0dXJuIE9iamVjdC5oYXNPd24ob2JqZWN0LCBsYXN0S2V5KTtcbn1cblxuZnVuY3Rpb24gYWxpYXNJc0Jvb2xlYW4oXG4gIGFsaWFzTWFwOiBNYXA8c3RyaW5nLCBTZXQ8c3RyaW5nPj4sXG4gIGJvb2xlYW5TZXQ6IFNldDxzdHJpbmc+LFxuICBrZXk6IHN0cmluZyxcbik6IGJvb2xlYW4ge1xuICBjb25zdCBzZXQgPSBhbGlhc01hcC5nZXQoa2V5KTtcbiAgaWYgKHNldCA9PT0gdW5kZWZpbmVkKSByZXR1cm4gZmFsc2U7XG4gIGZvciAoY29uc3QgYWxpYXMgb2Ygc2V0KSBpZiAoYm9vbGVhblNldC5oYXMoYWxpYXMpKSByZXR1cm4gdHJ1ZTtcbiAgcmV0dXJuIGZhbHNlO1xufVxuXG5mdW5jdGlvbiBpc0Jvb2xlYW5TdHJpbmcodmFsdWU6IHN0cmluZykge1xuICByZXR1cm4gdmFsdWUgPT09IFwidHJ1ZVwiIHx8IHZhbHVlID09PSBcImZhbHNlXCI7XG59XG5cbmZ1bmN0aW9uIHBhcnNlQm9vbGVhblN0cmluZyh2YWx1ZTogdW5rbm93bikge1xuICByZXR1cm4gdmFsdWUgIT09IFwiZmFsc2VcIjtcbn1cblxuY29uc3QgRkxBR19SRUdFWFAgPVxuICAvXig/Oi0oPzooPzxkb3VibGVEYXNoPi0pKD88bmVnYXRlZD5uby0pPyk/KSg/PGtleT4uKz8pKD86PSg/PHZhbHVlPi4rPykpPyQvcztcblxuLyoqXG4gKiBUYWtlIGEgc2V0IG9mIGNvbW1hbmQgbGluZSBhcmd1bWVudHMsIG9wdGlvbmFsbHkgd2l0aCBhIHNldCBvZiBvcHRpb25zLCBhbmRcbiAqIHJldHVybiBhbiBvYmplY3QgcmVwcmVzZW50aW5nIHRoZSBmbGFncyBmb3VuZCBpbiB0aGUgcGFzc2VkIGFyZ3VtZW50cy5cbiAqXG4gKiBCeSBkZWZhdWx0LCBhbnkgYXJndW1lbnRzIHN0YXJ0aW5nIHdpdGggYC1gIG9yIGAtLWAgYXJlIGNvbnNpZGVyZWQgYm9vbGVhblxuICogZmxhZ3MuIElmIHRoZSBhcmd1bWVudCBuYW1lIGlzIGZvbGxvd2VkIGJ5IGFuIGVxdWFsIHNpZ24gKGA9YCkgaXQgaXNcbiAqIGNvbnNpZGVyZWQgYSBrZXktdmFsdWUgcGFpci4gQW55IGFyZ3VtZW50cyB3aGljaCBjb3VsZCBub3QgYmUgcGFyc2VkIGFyZVxuICogYXZhaWxhYmxlIGluIHRoZSBgX2AgcHJvcGVydHkgb2YgdGhlIHJldHVybmVkIG9iamVjdC5cbiAqXG4gKiBCeSBkZWZhdWx0LCB0aGUgZmxhZ3MgbW9kdWxlIHRyaWVzIHRvIGRldGVybWluZSB0aGUgdHlwZSBvZiBhbGwgYXJndW1lbnRzXG4gKiBhdXRvbWF0aWNhbGx5IGFuZCB0aGUgcmV0dXJuIHR5cGUgb2YgdGhlIGBwYXJzZUFyZ3NgIG1ldGhvZCB3aWxsIGhhdmUgYW4gaW5kZXhcbiAqIHNpZ25hdHVyZSB3aXRoIGBhbnlgIGFzIHZhbHVlIChgeyBbeDogc3RyaW5nXTogYW55IH1gKS5cbiAqXG4gKiBJZiB0aGUgYHN0cmluZ2AsIGBib29sZWFuYCBvciBgY29sbGVjdGAgb3B0aW9uIGlzIHNldCwgdGhlIHJldHVybiB2YWx1ZSBvZlxuICogdGhlIGBwYXJzZUFyZ3NgIG1ldGhvZCB3aWxsIGJlIGZ1bGx5IHR5cGVkIGFuZCB0aGUgaW5kZXggc2lnbmF0dXJlIG9mIHRoZSByZXR1cm5cbiAqIHR5cGUgd2lsbCBjaGFuZ2UgdG8gYHsgW3g6IHN0cmluZ106IHVua25vd24gfWAuXG4gKlxuICogQW55IGFyZ3VtZW50cyBhZnRlciBgJy0tJ2Agd2lsbCBub3QgYmUgcGFyc2VkIGFuZCB3aWxsIGVuZCB1cCBpbiBgcGFyc2VkQXJncy5fYC5cbiAqXG4gKiBOdW1lcmljLWxvb2tpbmcgYXJndW1lbnRzIHdpbGwgYmUgcmV0dXJuZWQgYXMgbnVtYmVycyB1bmxlc3MgYG9wdGlvbnMuc3RyaW5nYFxuICogb3IgYG9wdGlvbnMuYm9vbGVhbmAgaXMgc2V0IGZvciB0aGF0IGFyZ3VtZW50IG5hbWUuXG4gKlxuICogQGV4YW1wbGVcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyBwYXJzZUFyZ3MgfSBmcm9tIFwiQHN0ZC9jbGkvcGFyc2UtYXJnc1wiO1xuICogY29uc3QgcGFyc2VkQXJncyA9IHBhcnNlQXJncyhEZW5vLmFyZ3MpO1xuICogYGBgXG4gKlxuICogQGV4YW1wbGVcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyBwYXJzZUFyZ3MgfSBmcm9tIFwiQHN0ZC9jbGkvcGFyc2UtYXJnc1wiO1xuICogY29uc3QgcGFyc2VkQXJncyA9IHBhcnNlQXJncyhbXCItLWZvb1wiLCBcIi0tYmFyPWJhelwiLCBcIi4vcXV1eC50eHRcIl0pO1xuICogLy8gcGFyc2VkQXJnczogeyBmb286IHRydWUsIGJhcjogXCJiYXpcIiwgXzogW1wiLi9xdXV4LnR4dFwiXSB9XG4gKiBgYGBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlQXJnczxcbiAgVEFyZ3MgZXh0ZW5kcyBWYWx1ZXM8XG4gICAgVEJvb2xlYW5zLFxuICAgIFRTdHJpbmdzLFxuICAgIFRDb2xsZWN0YWJsZSxcbiAgICBUTmVnYXRhYmxlLFxuICAgIFREZWZhdWx0cyxcbiAgICBUQWxpYXNlc1xuICA+LFxuICBURG91YmxlRGFzaCBleHRlbmRzIGJvb2xlYW4gfCB1bmRlZmluZWQgPSB1bmRlZmluZWQsXG4gIFRCb29sZWFucyBleHRlbmRzIEJvb2xlYW5UeXBlID0gdW5kZWZpbmVkLFxuICBUU3RyaW5ncyBleHRlbmRzIFN0cmluZ1R5cGUgPSB1bmRlZmluZWQsXG4gIFRDb2xsZWN0YWJsZSBleHRlbmRzIENvbGxlY3RhYmxlID0gdW5kZWZpbmVkLFxuICBUTmVnYXRhYmxlIGV4dGVuZHMgTmVnYXRhYmxlID0gdW5kZWZpbmVkLFxuICBURGVmYXVsdHMgZXh0ZW5kcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZCxcbiAgVEFsaWFzZXMgZXh0ZW5kcyBBbGlhc2VzPFRBbGlhc0FyZ05hbWVzLCBUQWxpYXNOYW1lcz4gfCB1bmRlZmluZWQgPSB1bmRlZmluZWQsXG4gIFRBbGlhc0FyZ05hbWVzIGV4dGVuZHMgc3RyaW5nID0gc3RyaW5nLFxuICBUQWxpYXNOYW1lcyBleHRlbmRzIHN0cmluZyA9IHN0cmluZyxcbj4oXG4gIGFyZ3M6IHN0cmluZ1tdLFxuICB7XG4gICAgXCItLVwiOiBkb3VibGVEYXNoID0gZmFsc2UsXG4gICAgYWxpYXMgPSB7fSBhcyBOb25OdWxsYWJsZTxUQWxpYXNlcz4sXG4gICAgYm9vbGVhbiA9IGZhbHNlLFxuICAgIGRlZmF1bHQ6IGRlZmF1bHRzID0ge30gYXMgVERlZmF1bHRzICYgRGVmYXVsdHM8VEJvb2xlYW5zLCBUU3RyaW5ncz4sXG4gICAgc3RvcEVhcmx5ID0gZmFsc2UsXG4gICAgc3RyaW5nID0gW10sXG4gICAgY29sbGVjdCA9IFtdLFxuICAgIG5lZ2F0YWJsZSA9IFtdLFxuICAgIHVua25vd246IHVua25vd25GbiA9IChpOiBzdHJpbmcpOiB1bmtub3duID0+IGksXG4gIH06IFBhcnNlT3B0aW9uczxcbiAgICBUQm9vbGVhbnMsXG4gICAgVFN0cmluZ3MsXG4gICAgVENvbGxlY3RhYmxlLFxuICAgIFROZWdhdGFibGUsXG4gICAgVERlZmF1bHRzLFxuICAgIFRBbGlhc2VzLFxuICAgIFREb3VibGVEYXNoXG4gID4gPSB7fSxcbik6IEFyZ3M8VEFyZ3MsIFREb3VibGVEYXNoPiB7XG4gIGNvbnN0IGFsaWFzTWFwOiBNYXA8c3RyaW5nLCBTZXQ8c3RyaW5nPj4gPSBuZXcgTWFwKCk7XG4gIGNvbnN0IGJvb2xlYW5TZXQgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgY29uc3Qgc3RyaW5nU2V0ID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gIGNvbnN0IGNvbGxlY3RTZXQgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgY29uc3QgbmVnYXRhYmxlU2V0ID0gbmV3IFNldDxzdHJpbmc+KCk7XG5cbiAgbGV0IGFsbEJvb2xzID0gZmFsc2U7XG5cbiAgaWYgKGFsaWFzKSB7XG4gICAgZm9yIChjb25zdCBrZXkgaW4gYWxpYXMpIHtcbiAgICAgIGNvbnN0IHZhbCA9IChhbGlhcyBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPilba2V5XTtcbiAgICAgIGFzc2VydCh2YWwgIT09IHVuZGVmaW5lZCk7XG4gICAgICBjb25zdCBhbGlhc2VzID0gQXJyYXkuaXNBcnJheSh2YWwpID8gdmFsIDogW3ZhbF07XG4gICAgICBhbGlhc01hcC5zZXQoa2V5LCBuZXcgU2V0KGFsaWFzZXMpKTtcbiAgICAgIGFsaWFzZXMuZm9yRWFjaCgoYWxpYXMpID0+XG4gICAgICAgIGFsaWFzTWFwLnNldChcbiAgICAgICAgICBhbGlhcyxcbiAgICAgICAgICBuZXcgU2V0KFtrZXksIC4uLmFsaWFzZXMuZmlsdGVyKChpdCkgPT4gaXQgIT09IGFsaWFzKV0pLFxuICAgICAgICApXG4gICAgICApO1xuICAgIH1cbiAgfVxuXG4gIGlmIChib29sZWFuKSB7XG4gICAgaWYgKHR5cGVvZiBib29sZWFuID09PSBcImJvb2xlYW5cIikge1xuICAgICAgYWxsQm9vbHMgPSBib29sZWFuO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBib29sZWFuQXJncyA9IEFycmF5LmlzQXJyYXkoYm9vbGVhbikgPyBib29sZWFuIDogW2Jvb2xlYW5dO1xuICAgICAgZm9yIChjb25zdCBrZXkgb2YgYm9vbGVhbkFyZ3MuZmlsdGVyKEJvb2xlYW4pKSB7XG4gICAgICAgIGJvb2xlYW5TZXQuYWRkKGtleSk7XG4gICAgICAgIGFsaWFzTWFwLmdldChrZXkpPy5mb3JFYWNoKChhbCkgPT4ge1xuICAgICAgICAgIGJvb2xlYW5TZXQuYWRkKGFsKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgaWYgKHN0cmluZykge1xuICAgIGNvbnN0IHN0cmluZ0FyZ3MgPSBBcnJheS5pc0FycmF5KHN0cmluZykgPyBzdHJpbmcgOiBbc3RyaW5nXTtcbiAgICBmb3IgKGNvbnN0IGtleSBvZiBzdHJpbmdBcmdzLmZpbHRlcihCb29sZWFuKSkge1xuICAgICAgc3RyaW5nU2V0LmFkZChrZXkpO1xuICAgICAgYWxpYXNNYXAuZ2V0KGtleSk/LmZvckVhY2goKGFsKSA9PiBzdHJpbmdTZXQuYWRkKGFsKSk7XG4gICAgfVxuICB9XG5cbiAgaWYgKGNvbGxlY3QpIHtcbiAgICBjb25zdCBjb2xsZWN0QXJncyA9IEFycmF5LmlzQXJyYXkoY29sbGVjdCkgPyBjb2xsZWN0IDogW2NvbGxlY3RdO1xuICAgIGZvciAoY29uc3Qga2V5IG9mIGNvbGxlY3RBcmdzLmZpbHRlcihCb29sZWFuKSkge1xuICAgICAgY29sbGVjdFNldC5hZGQoa2V5KTtcbiAgICAgIGFsaWFzTWFwLmdldChrZXkpPy5mb3JFYWNoKChhbCkgPT4gY29sbGVjdFNldC5hZGQoYWwpKTtcbiAgICB9XG4gIH1cblxuICBpZiAobmVnYXRhYmxlKSB7XG4gICAgY29uc3QgbmVnYXRhYmxlQXJncyA9IEFycmF5LmlzQXJyYXkobmVnYXRhYmxlKSA/IG5lZ2F0YWJsZSA6IFtuZWdhdGFibGVdO1xuICAgIGZvciAoY29uc3Qga2V5IG9mIG5lZ2F0YWJsZUFyZ3MuZmlsdGVyKEJvb2xlYW4pKSB7XG4gICAgICBuZWdhdGFibGVTZXQuYWRkKGtleSk7XG4gICAgICBhbGlhc01hcC5nZXQoa2V5KT8uZm9yRWFjaCgoYWxpYXMpID0+IG5lZ2F0YWJsZVNldC5hZGQoYWxpYXMpKTtcbiAgICB9XG4gIH1cblxuICBjb25zdCBhcmd2OiBBcmdzID0geyBfOiBbXSB9O1xuXG4gIGZ1bmN0aW9uIHNldEFyZ3VtZW50KFxuICAgIGtleTogc3RyaW5nLFxuICAgIHZhbHVlOiBzdHJpbmcgfCBudW1iZXIgfCBib29sZWFuLFxuICAgIGFyZzogc3RyaW5nLFxuICAgIGNvbGxlY3Q6IGJvb2xlYW4sXG4gICkge1xuICAgIGlmIChcbiAgICAgICFib29sZWFuU2V0LmhhcyhrZXkpICYmXG4gICAgICAhc3RyaW5nU2V0LmhhcyhrZXkpICYmXG4gICAgICAhYWxpYXNNYXAuaGFzKGtleSkgJiZcbiAgICAgICEoYWxsQm9vbHMgJiYgL14tLVtePV0rJC8udGVzdChhcmcpKSAmJlxuICAgICAgdW5rbm93bkZuPy4oYXJnLCBrZXksIHZhbHVlKSA9PT0gZmFsc2VcbiAgICApIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gXCJzdHJpbmdcIiAmJiAhc3RyaW5nU2V0LmhhcyhrZXkpKSB7XG4gICAgICB2YWx1ZSA9IGlzTnVtYmVyKHZhbHVlKSA/IE51bWJlcih2YWx1ZSkgOiB2YWx1ZTtcbiAgICB9XG5cbiAgICBjb25zdCBjb2xsZWN0YWJsZSA9IGNvbGxlY3QgJiYgY29sbGVjdFNldC5oYXMoa2V5KTtcbiAgICBzZXROZXN0ZWQoYXJndiwga2V5LnNwbGl0KFwiLlwiKSwgdmFsdWUsIGNvbGxlY3RhYmxlKTtcbiAgICBhbGlhc01hcC5nZXQoa2V5KT8uZm9yRWFjaCgoa2V5KSA9PiB7XG4gICAgICBzZXROZXN0ZWQoYXJndiwga2V5LnNwbGl0KFwiLlwiKSwgdmFsdWUsIGNvbGxlY3RhYmxlKTtcbiAgICB9KTtcbiAgfVxuXG4gIGxldCBub3RGbGFnczogc3RyaW5nW10gPSBbXTtcblxuICAvLyBhbGwgYXJncyBhZnRlciBcIi0tXCIgYXJlIG5vdCBwYXJzZWRcbiAgY29uc3QgaW5kZXggPSBhcmdzLmluZGV4T2YoXCItLVwiKTtcbiAgaWYgKGluZGV4ICE9PSAtMSkge1xuICAgIG5vdEZsYWdzID0gYXJncy5zbGljZShpbmRleCArIDEpO1xuICAgIGFyZ3MgPSBhcmdzLnNsaWNlKDAsIGluZGV4KTtcbiAgfVxuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgYXJncy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IGFyZyA9IGFyZ3NbaV0hO1xuXG4gICAgY29uc3QgZ3JvdXBzID0gYXJnLm1hdGNoKEZMQUdfUkVHRVhQKT8uZ3JvdXBzO1xuXG4gICAgaWYgKGdyb3Vwcykge1xuICAgICAgY29uc3QgeyBkb3VibGVEYXNoLCBuZWdhdGVkIH0gPSBncm91cHM7XG4gICAgICBsZXQga2V5ID0gZ3JvdXBzLmtleSE7XG4gICAgICBsZXQgdmFsdWU6IHN0cmluZyB8IG51bWJlciB8IGJvb2xlYW4gfCB1bmRlZmluZWQgPSBncm91cHMudmFsdWU7XG5cbiAgICAgIGlmIChkb3VibGVEYXNoKSB7XG4gICAgICAgIGlmICh2YWx1ZSkge1xuICAgICAgICAgIGlmIChib29sZWFuU2V0LmhhcyhrZXkpKSB2YWx1ZSA9IHBhcnNlQm9vbGVhblN0cmluZyh2YWx1ZSk7XG4gICAgICAgICAgc2V0QXJndW1lbnQoa2V5LCB2YWx1ZSwgYXJnLCB0cnVlKTtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChuZWdhdGVkKSB7XG4gICAgICAgICAgaWYgKG5lZ2F0YWJsZVNldC5oYXMoa2V5KSkge1xuICAgICAgICAgICAgc2V0QXJndW1lbnQoa2V5LCBmYWxzZSwgYXJnLCBmYWxzZSk7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICB9XG4gICAgICAgICAga2V5ID0gYG5vLSR7a2V5fWA7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBuZXh0ID0gYXJnc1tpICsgMV07XG5cbiAgICAgICAgaWYgKFxuICAgICAgICAgICFib29sZWFuU2V0LmhhcyhrZXkpICYmXG4gICAgICAgICAgIWFsbEJvb2xzICYmXG4gICAgICAgICAgbmV4dCAmJlxuICAgICAgICAgICEvXi0vLnRlc3QobmV4dCkgJiZcbiAgICAgICAgICAoYWxpYXNNYXAuZ2V0KGtleSlcbiAgICAgICAgICAgID8gIWFsaWFzSXNCb29sZWFuKGFsaWFzTWFwLCBib29sZWFuU2V0LCBrZXkpXG4gICAgICAgICAgICA6IHRydWUpXG4gICAgICAgICkge1xuICAgICAgICAgIHZhbHVlID0gbmV4dDtcbiAgICAgICAgICBpKys7XG4gICAgICAgICAgc2V0QXJndW1lbnQoa2V5LCB2YWx1ZSwgYXJnLCB0cnVlKTtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChuZXh0ICYmIGlzQm9vbGVhblN0cmluZyhuZXh0KSkge1xuICAgICAgICAgIHZhbHVlID0gcGFyc2VCb29sZWFuU3RyaW5nKG5leHQpO1xuICAgICAgICAgIGkrKztcbiAgICAgICAgICBzZXRBcmd1bWVudChrZXksIHZhbHVlLCBhcmcsIHRydWUpO1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFsdWUgPSBzdHJpbmdTZXQuaGFzKGtleSkgPyBcIlwiIDogdHJ1ZTtcbiAgICAgICAgc2V0QXJndW1lbnQoa2V5LCB2YWx1ZSwgYXJnLCB0cnVlKTtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBjb25zdCBsZXR0ZXJzID0gYXJnLnNsaWNlKDEsIC0xKS5zcGxpdChcIlwiKTtcblxuICAgICAgbGV0IGJyb2tlbiA9IGZhbHNlO1xuICAgICAgZm9yIChjb25zdCBbaiwgbGV0dGVyXSBvZiBsZXR0ZXJzLmVudHJpZXMoKSkge1xuICAgICAgICBjb25zdCBuZXh0ID0gYXJnLnNsaWNlKGogKyAyKTtcblxuICAgICAgICBpZiAobmV4dCA9PT0gXCItXCIpIHtcbiAgICAgICAgICBzZXRBcmd1bWVudChsZXR0ZXIsIG5leHQsIGFyZywgdHJ1ZSk7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoL1tBLVphLXpdLy50ZXN0KGxldHRlcikgJiYgLz0vLnRlc3QobmV4dCkpIHtcbiAgICAgICAgICBzZXRBcmd1bWVudChsZXR0ZXIsIG5leHQuc3BsaXQoLz0oLispLylbMV0hLCBhcmcsIHRydWUpO1xuICAgICAgICAgIGJyb2tlbiA9IHRydWU7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoXG4gICAgICAgICAgL1tBLVphLXpdLy50ZXN0KGxldHRlcikgJiZcbiAgICAgICAgICAvLT9cXGQrKFxcLlxcZCopPyhlLT9cXGQrKT8kLy50ZXN0KG5leHQpXG4gICAgICAgICkge1xuICAgICAgICAgIHNldEFyZ3VtZW50KGxldHRlciwgbmV4dCwgYXJnLCB0cnVlKTtcbiAgICAgICAgICBicm9rZW4gPSB0cnVlO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGxldHRlcnNbaiArIDFdICYmIGxldHRlcnNbaiArIDFdIS5tYXRjaCgvXFxXLykpIHtcbiAgICAgICAgICBzZXRBcmd1bWVudChsZXR0ZXIsIGFyZy5zbGljZShqICsgMiksIGFyZywgdHJ1ZSk7XG4gICAgICAgICAgYnJva2VuID0gdHJ1ZTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBzZXRBcmd1bWVudChcbiAgICAgICAgICBsZXR0ZXIsXG4gICAgICAgICAgc3RyaW5nU2V0LmhhcyhsZXR0ZXIpID8gXCJcIiA6IHRydWUsXG4gICAgICAgICAgYXJnLFxuICAgICAgICAgIHRydWUsXG4gICAgICAgICk7XG4gICAgICB9XG5cbiAgICAgIGtleSA9IGFyZy5zbGljZSgtMSk7XG4gICAgICBpZiAoIWJyb2tlbiAmJiBrZXkgIT09IFwiLVwiKSB7XG4gICAgICAgIGNvbnN0IG5leHRBcmcgPSBhcmdzW2kgKyAxXTtcbiAgICAgICAgaWYgKFxuICAgICAgICAgIG5leHRBcmcgJiZcbiAgICAgICAgICAhL14oLXwtLSlbXi1dLy50ZXN0KG5leHRBcmcpICYmXG4gICAgICAgICAgIWJvb2xlYW5TZXQuaGFzKGtleSkgJiZcbiAgICAgICAgICAoYWxpYXNNYXAuZ2V0KGtleSlcbiAgICAgICAgICAgID8gIWFsaWFzSXNCb29sZWFuKGFsaWFzTWFwLCBib29sZWFuU2V0LCBrZXkpXG4gICAgICAgICAgICA6IHRydWUpXG4gICAgICAgICkge1xuICAgICAgICAgIHNldEFyZ3VtZW50KGtleSwgbmV4dEFyZywgYXJnLCB0cnVlKTtcbiAgICAgICAgICBpKys7XG4gICAgICAgIH0gZWxzZSBpZiAobmV4dEFyZyAmJiBpc0Jvb2xlYW5TdHJpbmcobmV4dEFyZykpIHtcbiAgICAgICAgICBjb25zdCB2YWx1ZSA9IHBhcnNlQm9vbGVhblN0cmluZyhuZXh0QXJnKTtcbiAgICAgICAgICBzZXRBcmd1bWVudChrZXksIHZhbHVlLCBhcmcsIHRydWUpO1xuICAgICAgICAgIGkrKztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzZXRBcmd1bWVudChrZXksIHN0cmluZ1NldC5oYXMoa2V5KSA/IFwiXCIgOiB0cnVlLCBhcmcsIHRydWUpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBpZiAodW5rbm93bkZuPy4oYXJnKSAhPT0gZmFsc2UpIHtcbiAgICAgIGFyZ3YuXy5wdXNoKFxuICAgICAgICBzdHJpbmdTZXQuaGFzKFwiX1wiKSB8fCAhaXNOdW1iZXIoYXJnKSA/IGFyZyA6IE51bWJlcihhcmcpLFxuICAgICAgKTtcbiAgICB9XG5cbiAgICBpZiAoc3RvcEVhcmx5KSB7XG4gICAgICBhcmd2Ll8ucHVzaCguLi5hcmdzLnNsaWNlKGkgKyAxKSk7XG4gICAgICBicmVhaztcbiAgICB9XG4gIH1cblxuICBmb3IgKGNvbnN0IFtrZXksIHZhbHVlXSBvZiBPYmplY3QuZW50cmllcyhkZWZhdWx0cykpIHtcbiAgICBjb25zdCBrZXlzID0ga2V5LnNwbGl0KFwiLlwiKTtcbiAgICBpZiAoIWhhc05lc3RlZChhcmd2LCBrZXlzKSkge1xuICAgICAgc2V0TmVzdGVkKGFyZ3YsIGtleXMsIHZhbHVlKTtcbiAgICAgIGFsaWFzTWFwLmdldChrZXkpPy5mb3JFYWNoKChrZXkpID0+XG4gICAgICAgIHNldE5lc3RlZChhcmd2LCBrZXkuc3BsaXQoXCIuXCIpLCB2YWx1ZSlcbiAgICAgICk7XG4gICAgfVxuICB9XG5cbiAgZm9yIChjb25zdCBrZXkgb2YgYm9vbGVhblNldC5rZXlzKCkpIHtcbiAgICBjb25zdCBrZXlzID0ga2V5LnNwbGl0KFwiLlwiKTtcbiAgICBpZiAoIWhhc05lc3RlZChhcmd2LCBrZXlzKSkge1xuICAgICAgY29uc3QgdmFsdWUgPSBjb2xsZWN0U2V0LmhhcyhrZXkpID8gW10gOiBmYWxzZTtcbiAgICAgIHNldE5lc3RlZChhcmd2LCBrZXlzLCB2YWx1ZSk7XG4gICAgfVxuICB9XG5cbiAgZm9yIChjb25zdCBrZXkgb2Ygc3RyaW5nU2V0LmtleXMoKSkge1xuICAgIGNvbnN0IGtleXMgPSBrZXkuc3BsaXQoXCIuXCIpO1xuICAgIGlmICghaGFzTmVzdGVkKGFyZ3YsIGtleXMpICYmIGNvbGxlY3RTZXQuaGFzKGtleSkpIHtcbiAgICAgIHNldE5lc3RlZChhcmd2LCBrZXlzLCBbXSk7XG4gICAgfVxuICB9XG5cbiAgaWYgKGRvdWJsZURhc2gpIHtcbiAgICBhcmd2W1wiLS1cIl0gPSBbXTtcbiAgICBmb3IgKGNvbnN0IGtleSBvZiBub3RGbGFncykge1xuICAgICAgYXJndltcIi0tXCJdLnB1c2goa2V5KTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgZm9yIChjb25zdCBrZXkgb2Ygbm90RmxhZ3MpIHtcbiAgICAgIGFyZ3YuXy5wdXNoKGtleSk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGFyZ3YgYXMgQXJnczxUQXJncywgVERvdWJsZURhc2g+O1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3Mi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