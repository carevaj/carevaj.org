// deno-lint-ignore-file no-explicit-any
import { UnknownTypeError, ValidationError as FlagsValidationError } from "../flags/_errors.ts";
import { MissingRequiredEnvVarError } from "./_errors.ts";
import { parseFlags } from "../flags/flags.ts";
import { getDescription, parseArgumentsDefinition, splitArguments } from "./_utils.ts";
import { bold, brightBlue, red, yellow } from "./deps.ts";
import { CommandExecutableNotFoundError, CommandNotFoundError, DefaultCommandNotFoundError, DuplicateCommandAliasError, DuplicateCommandNameError, DuplicateCompletionError, DuplicateEnvVarError, DuplicateExampleError, DuplicateOptionNameError, DuplicateTypeError, MissingArgumentError, MissingArgumentsError, MissingCommandNameError, NoArgumentsAllowedError, TooManyArgumentsError, TooManyEnvVarValuesError, UnexpectedOptionalEnvVarValueError, UnexpectedVariadicEnvVarValueError, UnknownCommandError, ValidationError } from "./_errors.ts";
import { BooleanType } from "./types/boolean.ts";
import { FileType } from "./types/file.ts";
import { NumberType } from "./types/number.ts";
import { StringType } from "./types/string.ts";
import { Type } from "./type.ts";
import { HelpGenerator } from "./help/_help_generator.ts";
import { IntegerType } from "./types/integer.ts";
import { underscoreToCamelCase } from "../flags/_utils.ts";
export class Command {
  types = new Map();
  rawArgs = [];
  literalArgs = [];
  // @TODO: get script name: https://github.com/denoland/deno/pull/5034
  // private name: string = location.pathname.split( '/' ).pop() as string;
  _name = "COMMAND";
  _parent;
  _globalParent;
  ver;
  desc = "";
  _usage;
  fn;
  options = [];
  commands = new Map();
  examples = [];
  envVars = [];
  aliases = [];
  completions = new Map();
  cmd = this;
  argsDefinition;
  isExecutable = false;
  throwOnError = false;
  _allowEmpty = false;
  _stopEarly = false;
  defaultCommand;
  _useRawArgs = false;
  args = [];
  isHidden = false;
  isGlobal = false;
  hasDefaults = false;
  _versionOptions;
  _helpOptions;
  _versionOption;
  _helpOption;
  _help;
  _shouldExit;
  _meta = {};
  _groupName;
  _noGlobals = false;
  errorHandler;
  versionOption(flags, desc, opts) {
    this._versionOptions = flags === false ? flags : {
      flags,
      desc,
      opts: typeof opts === "function" ? {
        action: opts
      } : opts
    };
    return this;
  }
  helpOption(flags, desc, opts) {
    this._helpOptions = flags === false ? flags : {
      flags,
      desc,
      opts: typeof opts === "function" ? {
        action: opts
      } : opts
    };
    return this;
  }
  /**
   * Add new sub-command.
   * @param nameAndArguments  Command definition. E.g: `my-command <input-file:string> <output-file:string>`
   * @param cmdOrDescription  The description of the new child command.
   * @param override          Override existing child command.
   */ command(nameAndArguments, cmdOrDescription, override) {
    this.reset();
    const result = splitArguments(nameAndArguments);
    const name = result.flags.shift();
    const aliases = result.flags;
    if (!name) {
      throw new MissingCommandNameError();
    }
    if (this.getBaseCommand(name, true)) {
      if (!override) {
        throw new DuplicateCommandNameError(name);
      }
      this.removeCommand(name);
    }
    let description;
    let cmd;
    if (typeof cmdOrDescription === "string") {
      description = cmdOrDescription;
    }
    if (cmdOrDescription instanceof Command) {
      cmd = cmdOrDescription.reset();
    } else {
      cmd = new Command();
    }
    cmd._name = name;
    cmd._parent = this;
    if (description) {
      cmd.description(description);
    }
    if (result.typeDefinition) {
      cmd.arguments(result.typeDefinition);
    }
    aliases.forEach((alias)=>cmd.alias(alias));
    this.commands.set(name, cmd);
    this.select(name);
    return this;
  }
  /**
   * Add new command alias.
   * @param alias Tha name of the alias.
   */ alias(alias) {
    if (this.cmd._name === alias || this.cmd.aliases.includes(alias)) {
      throw new DuplicateCommandAliasError(alias);
    }
    this.cmd.aliases.push(alias);
    return this;
  }
  /** Reset internal command reference to main command. */ reset() {
    this._groupName = undefined;
    this.cmd = this;
    return this;
  }
  /**
   * Set internal command pointer to child command with given name.
   * @param name The name of the command to select.
   */ select(name) {
    const cmd = this.getBaseCommand(name, true);
    if (!cmd) {
      throw new CommandNotFoundError(name, this.getBaseCommands(true));
    }
    this.cmd = cmd;
    return this;
  }
  /*****************************************************************************
   **** SUB HANDLER ************************************************************
   *****************************************************************************/ /** Set command name. */ name(name) {
    this.cmd._name = name;
    return this;
  }
  /**
   * Set command version.
   * @param version Semantic version string string or method that returns the version string.
   */ version(version) {
    if (typeof version === "string") {
      this.cmd.ver = ()=>version;
    } else if (typeof version === "function") {
      this.cmd.ver = version;
    }
    return this;
  }
  meta(name, value) {
    this.cmd._meta[name] = value;
    return this;
  }
  getMeta(name) {
    return typeof name === "undefined" ? this._meta : this._meta[name];
  }
  /**
   * Set command help.
   * @param help Help string, method, or config for generator that returns the help string.
   */ help(help) {
    if (typeof help === "string") {
      this.cmd._help = ()=>help;
    } else if (typeof help === "function") {
      this.cmd._help = help;
    } else {
      this.cmd._help = (cmd, options)=>HelpGenerator.generate(cmd, {
          ...help,
          ...options
        });
    }
    return this;
  }
  /**
   * Set the long command description.
   * @param description The command description.
   */ description(description) {
    this.cmd.desc = description;
    return this;
  }
  /**
   * Set the command usage. Defaults to arguments.
   * @param usage The command usage.
   */ usage(usage) {
    this.cmd._usage = usage;
    return this;
  }
  /**
   * Hide command from help, completions, etc.
   */ hidden() {
    this.cmd.isHidden = true;
    return this;
  }
  /** Make command globally available. */ global() {
    this.cmd.isGlobal = true;
    return this;
  }
  /** Make command executable. */ executable() {
    this.cmd.isExecutable = true;
    return this;
  }
  /**
   * Set command arguments:
   *
   *   <requiredArg:string> [optionalArg: number] [...restArgs:string]
   */ arguments(args) {
    this.cmd.argsDefinition = args;
    return this;
  }
  /**
   * Set command callback method.
   * @param fn Command action handler.
   */ action(fn) {
    this.cmd.fn = fn;
    return this;
  }
  /**
   * Don't throw an error if the command was called without arguments.
   * @param allowEmpty Enable/disable allow empty.
   */ // public allowEmpty<TAllowEmpty extends boolean | undefined = undefined>(
  //   allowEmpty?: TAllowEmpty,
  // ): false extends TAllowEmpty ? this
  //   : Command<
  //     Partial<TParentCommandGlobals>,
  //     TParentCommandTypes,
  //     Partial<TCommandOptions>,
  //     TCommandArguments,
  //     TCommandGlobals,
  //     TCommandTypes,
  //     TCommandGlobalTypes,
  //     TParentCommand
  //   > {
  //   this.cmd._allowEmpty = allowEmpty !== false;
  //   return this;
  // }
  allowEmpty(allowEmpty) {
    this.cmd._allowEmpty = allowEmpty !== false;
    return this;
  }
  /**
   * Enable stop early. If enabled, all arguments starting from the first non
   * option argument will be passed as arguments with type string to the command
   * action handler.
   *
   * For example:
   *     `command --debug-level warning server --port 80`
   *
   * Will result in:
   *     - options: `{debugLevel: 'warning'}`
   *     - args: `['server', '--port', '80']`
   *
   * @param stopEarly Enable/disable stop early.
   */ stopEarly(stopEarly = true) {
    this.cmd._stopEarly = stopEarly;
    return this;
  }
  /**
   * Disable parsing arguments. If enabled the raw arguments will be passed to
   * the action handler. This has no effect for parent or child commands. Only
   * for the command on which this method was called.
   * @param useRawArgs Enable/disable raw arguments.
   */ useRawArgs(useRawArgs = true) {
    this.cmd._useRawArgs = useRawArgs;
    return this;
  }
  /**
   * Set default command. The default command is executed when the program
   * was called without any argument and if no action handler is registered.
   * @param name Name of the default command.
   */ default(name) {
    this.cmd.defaultCommand = name;
    return this;
  }
  globalType(name, handler, options) {
    return this.type(name, handler, {
      ...options,
      global: true
    });
  }
  /**
   * Register custom type.
   * @param name    The name of the type.
   * @param handler The callback method to parse the type.
   * @param options Type options.
   */ type(name, handler, options) {
    if (this.cmd.types.get(name) && !options?.override) {
      throw new DuplicateTypeError(name);
    }
    this.cmd.types.set(name, {
      ...options,
      name,
      handler: handler
    });
    if (handler instanceof Type && (typeof handler.complete !== "undefined" || typeof handler.values !== "undefined")) {
      const completeHandler = (cmd, parent)=>handler.complete?.(cmd, parent) || [];
      this.complete(name, completeHandler, options);
    }
    return this;
  }
  globalComplete(name, complete, options) {
    return this.complete(name, complete, {
      ...options,
      global: true
    });
  }
  complete(name, complete, options) {
    if (this.cmd.completions.has(name) && !options?.override) {
      throw new DuplicateCompletionError(name);
    }
    this.cmd.completions.set(name, {
      name,
      complete,
      ...options
    });
    return this;
  }
  /**
   * Throw validation errors instead of calling `Deno.exit()` to handle
   * validation errors manually.
   *
   * A validation error is thrown when the command is wrongly used by the user.
   * For example: If the user passes some invalid options or arguments to the
   * command.
   *
   * This has no effect for parent commands. Only for the command on which this
   * method was called and all child commands.
   *
   * **Example:**
   *
   * ```
   * try {
   *   cmd.parse();
   * } catch(error) {
   *   if (error instanceof ValidationError) {
   *     cmd.showHelp();
   *     Deno.exit(1);
   *   }
   *   throw error;
   * }
   * ```
   *
   * @see ValidationError
   */ throwErrors() {
    this.cmd.throwOnError = true;
    return this;
  }
  error(handler) {
    this.cmd.errorHandler = handler;
    return this;
  }
  getErrorHandler() {
    return this.errorHandler ?? this._parent?.errorHandler;
  }
  /**
   * Same as `.throwErrors()` but also prevents calling `Deno.exit` after
   * printing help or version with the --help and --version option.
   */ noExit() {
    this.cmd._shouldExit = false;
    this.throwErrors();
    return this;
  }
  /**
   * Disable inheriting global commands, options and environment variables from
   * parent commands.
   */ noGlobals() {
    this.cmd._noGlobals = true;
    return this;
  }
  /** Check whether the command should throw errors or exit. */ shouldThrowErrors() {
    return this.throwOnError || !!this._parent?.shouldThrowErrors();
  }
  /** Check whether the command should exit after printing help or version. */ shouldExit() {
    return this._shouldExit ?? this._parent?.shouldExit() ?? true;
  }
  globalOption(flags, desc, opts) {
    if (typeof opts === "function") {
      return this.option(flags, desc, {
        value: opts,
        global: true
      });
    }
    return this.option(flags, desc, {
      ...opts,
      global: true
    });
  }
  /**
   * Enable grouping of options and set the name of the group.
   * All option which are added after calling the `.group()` method will be
   * grouped in the help output. If the `.group()` method can be use multiple
   * times to create more groups.
   *
   * @param name The name of the option group.
   */ group(name) {
    this.cmd._groupName = name;
    return this;
  }
  option(flags, desc, opts) {
    if (typeof opts === "function") {
      return this.option(flags, desc, {
        value: opts
      });
    }
    const result = splitArguments(flags);
    const args = result.typeDefinition ? parseArgumentsDefinition(result.typeDefinition) : [];
    const option = {
      ...opts,
      name: "",
      description: desc,
      args,
      flags: result.flags,
      equalsSign: result.equalsSign,
      typeDefinition: result.typeDefinition,
      groupName: this._groupName
    };
    if (option.separator) {
      for (const arg of args){
        if (arg.list) {
          arg.separator = option.separator;
        }
      }
    }
    for (const part of option.flags){
      const arg = part.trim();
      const isLong = /^--/.test(arg);
      const name = isLong ? arg.slice(2) : arg.slice(1);
      if (this.cmd.getBaseOption(name, true)) {
        if (opts?.override) {
          this.removeOption(name);
        } else {
          throw new DuplicateOptionNameError(name);
        }
      }
      if (!option.name && isLong) {
        option.name = name;
      } else if (!option.aliases) {
        option.aliases = [
          name
        ];
      } else {
        option.aliases.push(name);
      }
    }
    if (option.prepend) {
      this.cmd.options.unshift(option);
    } else {
      this.cmd.options.push(option);
    }
    return this;
  }
  /**
   * Add new command example.
   * @param name          Name of the example.
   * @param description   The content of the example.
   */ example(name, description) {
    if (this.cmd.hasExample(name)) {
      throw new DuplicateExampleError(name);
    }
    this.cmd.examples.push({
      name,
      description
    });
    return this;
  }
  globalEnv(name, description, options) {
    return this.env(name, description, {
      ...options,
      global: true
    });
  }
  env(name, description, options) {
    const result = splitArguments(name);
    if (!result.typeDefinition) {
      result.typeDefinition = "<value:boolean>";
    }
    if (result.flags.some((envName)=>this.cmd.getBaseEnvVar(envName, true))) {
      throw new DuplicateEnvVarError(name);
    }
    const details = parseArgumentsDefinition(result.typeDefinition);
    if (details.length > 1) {
      throw new TooManyEnvVarValuesError(name);
    } else if (details.length && details[0].optionalValue) {
      throw new UnexpectedOptionalEnvVarValueError(name);
    } else if (details.length && details[0].variadic) {
      throw new UnexpectedVariadicEnvVarValueError(name);
    }
    this.cmd.envVars.push({
      name: result.flags[0],
      names: result.flags,
      description,
      type: details[0].type,
      details: details.shift(),
      ...options
    });
    return this;
  }
  /*****************************************************************************
   **** MAIN HANDLER ***********************************************************
   *****************************************************************************/ /**
   * Parse command line arguments and execute matched command.
   * @param args Command line args to parse. Ex: `cmd.parse( Deno.args )`
   */ parse(args = Deno.args) {
    const ctx = {
      unknown: args.slice(),
      flags: {},
      env: {},
      literal: [],
      stopEarly: false,
      stopOnUnknown: false
    };
    return this.parseCommand(ctx);
  }
  async parseCommand(ctx) {
    try {
      this.reset();
      this.registerDefaults();
      this.rawArgs = ctx.unknown.slice();
      if (this.isExecutable) {
        await this.executeExecutable(ctx.unknown);
        return {
          options: {},
          args: [],
          cmd: this,
          literal: []
        };
      } else if (this._useRawArgs) {
        await this.parseEnvVars(ctx, this.envVars);
        return this.execute(ctx.env, ...ctx.unknown);
      }
      let preParseGlobals = false;
      let subCommand;
      // Pre parse globals to support: cmd --global-option sub-command --option
      if (ctx.unknown.length > 0) {
        // Detect sub command.
        subCommand = this.getSubCommand(ctx);
        if (!subCommand) {
          // Only pre parse globals if first arg ist a global option.
          const optionName = ctx.unknown[0].replace(/^-+/, "");
          const option = this.getOption(optionName, true);
          if (option?.global) {
            preParseGlobals = true;
            await this.parseGlobalOptionsAndEnvVars(ctx);
          }
        }
      }
      if (subCommand || ctx.unknown.length > 0) {
        subCommand ??= this.getSubCommand(ctx);
        if (subCommand) {
          subCommand._globalParent = this;
          return subCommand.parseCommand(ctx);
        }
      }
      // Parse rest options & env vars.
      await this.parseOptionsAndEnvVars(ctx, preParseGlobals);
      const options = {
        ...ctx.env,
        ...ctx.flags
      };
      const args = this.parseArguments(ctx, options);
      this.literalArgs = ctx.literal;
      // Execute option action.
      if (ctx.action) {
        await ctx.action.action.call(this, options, ...args);
        if (ctx.action.standalone) {
          return {
            options,
            args,
            cmd: this,
            literal: this.literalArgs
          };
        }
      }
      return await this.execute(options, ...args);
    } catch (error) {
      this.handleError(error);
    }
  }
  getSubCommand(ctx) {
    const subCommand = this.getCommand(ctx.unknown[0], true);
    if (subCommand) {
      ctx.unknown.shift();
    }
    return subCommand;
  }
  async parseGlobalOptionsAndEnvVars(ctx) {
    const isHelpOption = this.getHelpOption()?.flags.includes(ctx.unknown[0]);
    // Parse global env vars.
    const envVars = [
      ...this.envVars.filter((envVar)=>envVar.global),
      ...this.getGlobalEnvVars(true)
    ];
    await this.parseEnvVars(ctx, envVars, !isHelpOption);
    // Parse global options.
    const options = [
      ...this.options.filter((option)=>option.global),
      ...this.getGlobalOptions(true)
    ];
    this.parseOptions(ctx, options, {
      stopEarly: true,
      stopOnUnknown: true,
      dotted: false
    });
  }
  async parseOptionsAndEnvVars(ctx, preParseGlobals) {
    const helpOption = this.getHelpOption();
    const isVersionOption = this._versionOption?.flags.includes(ctx.unknown[0]);
    const isHelpOption = helpOption && ctx.flags?.[helpOption.name] === true;
    // Parse env vars.
    const envVars = preParseGlobals ? this.envVars.filter((envVar)=>!envVar.global) : this.getEnvVars(true);
    await this.parseEnvVars(ctx, envVars, !isHelpOption && !isVersionOption);
    // Parse options.
    const options = this.getOptions(true);
    this.parseOptions(ctx, options);
  }
  /** Register default options like `--version` and `--help`. */ registerDefaults() {
    if (this.hasDefaults || this.getParent()) {
      return this;
    }
    this.hasDefaults = true;
    this.reset();
    !this.types.has("string") && this.type("string", new StringType(), {
      global: true
    });
    !this.types.has("number") && this.type("number", new NumberType(), {
      global: true
    });
    !this.types.has("integer") && this.type("integer", new IntegerType(), {
      global: true
    });
    !this.types.has("boolean") && this.type("boolean", new BooleanType(), {
      global: true
    });
    !this.types.has("file") && this.type("file", new FileType(), {
      global: true
    });
    if (!this._help) {
      this.help({
        hints: true,
        types: false
      });
    }
    if (this._versionOptions !== false && (this._versionOptions || this.ver)) {
      this.option(this._versionOptions?.flags || "-V, --version", this._versionOptions?.desc || "Show the version number for this program.", {
        standalone: true,
        prepend: true,
        action: async function() {
          const long = this.getRawArgs().includes(`--${this._versionOption?.name}`);
          if (long) {
            await this.checkVersion();
            this.showLongVersion();
          } else {
            this.showVersion();
          }
          this.exit();
        },
        ...this._versionOptions?.opts ?? {}
      });
      this._versionOption = this.options[0];
    }
    if (this._helpOptions !== false) {
      this.option(this._helpOptions?.flags || "-h, --help", this._helpOptions?.desc || "Show this help.", {
        standalone: true,
        global: true,
        prepend: true,
        action: async function() {
          const long = this.getRawArgs().includes(`--${this.getHelpOption()?.name}`);
          await this.checkVersion();
          this.showHelp({
            long
          });
          this.exit();
        },
        ...this._helpOptions?.opts ?? {}
      });
      this._helpOption = this.options[0];
    }
    return this;
  }
  /**
   * Execute command.
   * @param options A map of options.
   * @param args Command arguments.
   */ async execute(options, ...args) {
    if (this.fn) {
      await this.fn(options, ...args);
    } else if (this.defaultCommand) {
      const cmd = this.getCommand(this.defaultCommand, true);
      if (!cmd) {
        throw new DefaultCommandNotFoundError(this.defaultCommand, this.getCommands());
      }
      cmd._globalParent = this;
      return cmd.execute(options, ...args);
    }
    return {
      options,
      args,
      cmd: this,
      literal: this.literalArgs
    };
  }
  /**
   * Execute external sub-command.
   * @param args Raw command line arguments.
   */ async executeExecutable(args) {
    const command = this.getPath().replace(/\s+/g, "-");
    await Deno.permissions.request({
      name: "run",
      command
    });
    try {
      const process = Deno.run({
        cmd: [
          command,
          ...args
        ]
      });
      const status = await process.status();
      if (!status.success) {
        Deno.exit(status.code);
      }
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) {
        throw new CommandExecutableNotFoundError(command);
      }
      throw error;
    }
  }
  /** Parse raw command line arguments. */ parseOptions(ctx, options, { stopEarly = this._stopEarly, stopOnUnknown = false, dotted = true } = {}) {
    parseFlags(ctx, {
      stopEarly,
      stopOnUnknown,
      dotted,
      allowEmpty: this._allowEmpty,
      flags: options,
      ignoreDefaults: ctx.env,
      parse: (type)=>this.parseType(type),
      option: (option)=>{
        if (!ctx.action && option.action) {
          ctx.action = option;
        }
      }
    });
  }
  /** Parse argument type. */ parseType(type) {
    const typeSettings = this.getType(type.type);
    if (!typeSettings) {
      throw new UnknownTypeError(type.type, this.getTypes().map((type)=>type.name));
    }
    return typeSettings.handler instanceof Type ? typeSettings.handler.parse(type) : typeSettings.handler(type);
  }
  /**
   * Read and validate environment variables.
   * @param ctx Parse context.
   * @param envVars env vars defined by the command.
   * @param validate when true, throws an error if a required env var is missing.
   */ async parseEnvVars(ctx, envVars, validate = true) {
    for (const envVar of envVars){
      const env = await this.findEnvVar(envVar.names);
      if (env) {
        const parseType = (value)=>{
          return this.parseType({
            label: "Environment variable",
            type: envVar.type,
            name: env.name,
            value
          });
        };
        const propertyName = underscoreToCamelCase(envVar.prefix ? envVar.names[0].replace(new RegExp(`^${envVar.prefix}`), "") : envVar.names[0]);
        if (envVar.details.list) {
          ctx.env[propertyName] = env.value.split(envVar.details.separator ?? ",").map(parseType);
        } else {
          ctx.env[propertyName] = parseType(env.value);
        }
        if (envVar.value && typeof ctx.env[propertyName] !== "undefined") {
          ctx.env[propertyName] = envVar.value(ctx.env[propertyName]);
        }
      } else if (envVar.required && validate) {
        throw new MissingRequiredEnvVarError(envVar);
      }
    }
  }
  async findEnvVar(names) {
    for (const name of names){
      const status = await Deno.permissions.query({
        name: "env",
        variable: name
      });
      if (status.state === "granted") {
        const value = Deno.env.get(name);
        if (value) {
          return {
            name,
            value
          };
        }
      }
    }
    return undefined;
  }
  /**
   * Parse command-line arguments.
   * @param ctx     Parse context.
   * @param options Parsed command line options.
   */ parseArguments(ctx, options) {
    const params = [];
    const args = ctx.unknown.slice();
    if (!this.hasArguments()) {
      if (args.length) {
        if (this.hasCommands(true)) {
          if (this.hasCommand(args[0], true)) {
            // e.g: command --global-foo --foo sub-command
            throw new TooManyArgumentsError(args);
          } else {
            throw new UnknownCommandError(args[0], this.getCommands());
          }
        } else {
          throw new NoArgumentsAllowedError(this.getPath());
        }
      }
    } else {
      if (!args.length) {
        const required = this.getArguments().filter((expectedArg)=>!expectedArg.optionalValue).map((expectedArg)=>expectedArg.name);
        if (required.length) {
          const optionNames = Object.keys(options);
          const hasStandaloneOption = !!optionNames.find((name)=>this.getOption(name, true)?.standalone);
          if (!hasStandaloneOption) {
            throw new MissingArgumentsError(required);
          }
        }
      } else {
        for (const expectedArg of this.getArguments()){
          if (!args.length) {
            if (expectedArg.optionalValue) {
              break;
            }
            throw new MissingArgumentError(expectedArg.name);
          }
          let arg;
          const parseArgValue = (value)=>{
            return expectedArg.list ? value.split(",").map((value)=>parseArgType(value)) : parseArgType(value);
          };
          const parseArgType = (value)=>{
            return this.parseType({
              label: "Argument",
              type: expectedArg.type,
              name: expectedArg.name,
              value
            });
          };
          if (expectedArg.variadic) {
            arg = args.splice(0, args.length).map((value)=>parseArgValue(value));
          } else {
            arg = parseArgValue(args.shift());
          }
          if (expectedArg.variadic && Array.isArray(arg)) {
            params.push(...arg);
          } else if (typeof arg !== "undefined") {
            params.push(arg);
          }
        }
        if (args.length) {
          throw new TooManyArgumentsError(args);
        }
      }
    }
    return params;
  }
  handleError(error) {
    this.throw(error instanceof FlagsValidationError ? new ValidationError(error.message) : error instanceof Error ? error : new Error(`[non-error-thrown] ${error}`));
  }
  /**
   * Handle error. If `throwErrors` is enabled the error will be thrown,
   * otherwise a formatted error message will be printed and `Deno.exit(1)`
   * will be called. This will also trigger registered error handlers.
   *
   * @param error The error to handle.
   */ throw(error) {
    if (error instanceof ValidationError) {
      error.cmd = this;
    }
    this.getErrorHandler()?.(error, this);
    if (this.shouldThrowErrors() || !(error instanceof ValidationError)) {
      throw error;
    }
    this.showHelp();
    console.error(red(`  ${bold("error")}: ${error.message}\n`));
    Deno.exit(error instanceof ValidationError ? error.exitCode : 1);
  }
  /*****************************************************************************
   **** GETTER *****************************************************************
   *****************************************************************************/ /** Get command name. */ getName() {
    return this._name;
  }
  /** Get parent command. */ getParent() {
    return this._parent;
  }
  /**
   * Get parent command from global executed command.
   * Be sure, to call this method only inside an action handler. Unless this or any child command was executed,
   * this method returns always undefined.
   */ getGlobalParent() {
    return this._globalParent;
  }
  /** Get main command. */ getMainCommand() {
    return this._parent?.getMainCommand() ?? this;
  }
  /** Get command name aliases. */ getAliases() {
    return this.aliases;
  }
  /** Get full command path. */ getPath() {
    return this._parent ? this._parent.getPath() + " " + this._name : this._name;
  }
  /** Get arguments definition. E.g: <input-file:string> <output-file:string> */ getArgsDefinition() {
    return this.argsDefinition;
  }
  /**
   * Get argument by name.
   * @param name Name of the argument.
   */ getArgument(name) {
    return this.getArguments().find((arg)=>arg.name === name);
  }
  /** Get arguments. */ getArguments() {
    if (!this.args.length && this.argsDefinition) {
      this.args = parseArgumentsDefinition(this.argsDefinition);
    }
    return this.args;
  }
  /** Check if command has arguments. */ hasArguments() {
    return !!this.argsDefinition;
  }
  /** Get command version. */ getVersion() {
    return this.getVersionHandler()?.call(this, this);
  }
  /** Get help handler method. */ getVersionHandler() {
    return this.ver ?? this._parent?.getVersionHandler();
  }
  /** Get command description. */ getDescription() {
    // call description method only once
    return typeof this.desc === "function" ? this.desc = this.desc() : this.desc;
  }
  getUsage() {
    return this._usage ?? this.getArgsDefinition();
  }
  /** Get short command description. This is the first line of the description. */ getShortDescription() {
    return getDescription(this.getDescription(), true);
  }
  /** Get original command-line arguments. */ getRawArgs() {
    return this.rawArgs;
  }
  /** Get all arguments defined after the double dash. */ getLiteralArgs() {
    return this.literalArgs;
  }
  /** Output generated help without exiting. */ showVersion() {
    console.log(this.getVersion());
  }
  /** Returns command name, version and meta data. */ getLongVersion() {
    return `${bold(this.getMainCommand().getName())} ${brightBlue(this.getVersion() ?? "")}` + Object.entries(this.getMeta()).map(([k, v])=>`\n${bold(k)} ${brightBlue(v)}`).join("");
  }
  /** Outputs command name, version and meta data. */ showLongVersion() {
    console.log(this.getLongVersion());
  }
  /** Output generated help without exiting. */ showHelp(options) {
    console.log(this.getHelp(options));
  }
  /** Get generated help. */ getHelp(options) {
    this.registerDefaults();
    return this.getHelpHandler().call(this, this, options ?? {});
  }
  /** Get help handler method. */ getHelpHandler() {
    return this._help ?? this._parent?.getHelpHandler();
  }
  exit(code = 0) {
    if (this.shouldExit()) {
      Deno.exit(code);
    }
  }
  /** Check if new version is available and add hint to version. */ async checkVersion() {
    const mainCommand = this.getMainCommand();
    const upgradeCommand = mainCommand.getCommand("upgrade");
    if (!isUpgradeCommand(upgradeCommand)) {
      return;
    }
    const latestVersion = await upgradeCommand.getLatestVersion();
    const currentVersion = mainCommand.getVersion();
    if (currentVersion === latestVersion) {
      return;
    }
    const versionHelpText = `(New version available: ${latestVersion}. Run '${mainCommand.getName()} upgrade' to upgrade to the latest version!)`;
    mainCommand.version(`${currentVersion}  ${bold(yellow(versionHelpText))}`);
  }
  /*****************************************************************************
   **** Options GETTER *********************************************************
   *****************************************************************************/ /**
   * Checks whether the command has options or not.
   * @param hidden Include hidden options.
   */ hasOptions(hidden) {
    return this.getOptions(hidden).length > 0;
  }
  /**
   * Get options.
   * @param hidden Include hidden options.
   */ getOptions(hidden) {
    return this.getGlobalOptions(hidden).concat(this.getBaseOptions(hidden));
  }
  /**
   * Get base options.
   * @param hidden Include hidden options.
   */ getBaseOptions(hidden) {
    if (!this.options.length) {
      return [];
    }
    return hidden ? this.options.slice(0) : this.options.filter((opt)=>!opt.hidden);
  }
  /**
   * Get global options.
   * @param hidden Include hidden options.
   */ getGlobalOptions(hidden) {
    const helpOption = this.getHelpOption();
    const getGlobals = (cmd, noGlobals, options = [], names = [])=>{
      if (cmd.options.length) {
        for (const option of cmd.options){
          if (option.global && !this.options.find((opt)=>opt.name === option.name) && names.indexOf(option.name) === -1 && (hidden || !option.hidden)) {
            if (noGlobals && option !== helpOption) {
              continue;
            }
            names.push(option.name);
            options.push(option);
          }
        }
      }
      return cmd._parent ? getGlobals(cmd._parent, noGlobals || cmd._noGlobals, options, names) : options;
    };
    return this._parent ? getGlobals(this._parent, this._noGlobals) : [];
  }
  /**
   * Checks whether the command has an option with given name or not.
   * @param name Name of the option. Must be in param-case.
   * @param hidden Include hidden options.
   */ hasOption(name, hidden) {
    return !!this.getOption(name, hidden);
  }
  /**
   * Get option by name.
   * @param name Name of the option. Must be in param-case.
   * @param hidden Include hidden options.
   */ getOption(name, hidden) {
    return this.getBaseOption(name, hidden) ?? this.getGlobalOption(name, hidden);
  }
  /**
   * Get base option by name.
   * @param name Name of the option. Must be in param-case.
   * @param hidden Include hidden options.
   */ getBaseOption(name, hidden) {
    const option = this.options.find((option)=>option.name === name || option.aliases?.includes(name));
    return option && (hidden || !option.hidden) ? option : undefined;
  }
  /**
   * Get global option from parent commands by name.
   * @param name Name of the option. Must be in param-case.
   * @param hidden Include hidden options.
   */ getGlobalOption(name, hidden) {
    const helpOption = this.getHelpOption();
    const getGlobalOption = (parent, noGlobals)=>{
      const option = parent.getBaseOption(name, hidden);
      if (!option?.global) {
        return parent._parent && getGlobalOption(parent._parent, noGlobals || parent._noGlobals);
      }
      if (noGlobals && option !== helpOption) {
        return;
      }
      return option;
    };
    return this._parent && getGlobalOption(this._parent, this._noGlobals);
  }
  /**
   * Remove option by name.
   * @param name Name of the option. Must be in param-case.
   */ removeOption(name) {
    const index = this.options.findIndex((option)=>option.name === name);
    if (index === -1) {
      return;
    }
    return this.options.splice(index, 1)[0];
  }
  /**
   * Checks whether the command has sub-commands or not.
   * @param hidden Include hidden commands.
   */ hasCommands(hidden) {
    return this.getCommands(hidden).length > 0;
  }
  /**
   * Get commands.
   * @param hidden Include hidden commands.
   */ getCommands(hidden) {
    return this.getGlobalCommands(hidden).concat(this.getBaseCommands(hidden));
  }
  /**
   * Get base commands.
   * @param hidden Include hidden commands.
   */ getBaseCommands(hidden) {
    const commands = Array.from(this.commands.values());
    return hidden ? commands : commands.filter((cmd)=>!cmd.isHidden);
  }
  /**
   * Get global commands.
   * @param hidden Include hidden commands.
   */ getGlobalCommands(hidden) {
    const getCommands = (command, noGlobals, commands = [], names = [])=>{
      if (command.commands.size) {
        for (const [_, cmd] of command.commands){
          if (cmd.isGlobal && this !== cmd && !this.commands.has(cmd._name) && names.indexOf(cmd._name) === -1 && (hidden || !cmd.isHidden)) {
            if (noGlobals && cmd?.getName() !== "help") {
              continue;
            }
            names.push(cmd._name);
            commands.push(cmd);
          }
        }
      }
      return command._parent ? getCommands(command._parent, noGlobals || command._noGlobals, commands, names) : commands;
    };
    return this._parent ? getCommands(this._parent, this._noGlobals) : [];
  }
  /**
   * Checks whether a child command exists by given name or alias.
   * @param name Name or alias of the command.
   * @param hidden Include hidden commands.
   */ hasCommand(name, hidden) {
    return !!this.getCommand(name, hidden);
  }
  /**
   * Get command by name or alias.
   * @param name Name or alias of the command.
   * @param hidden Include hidden commands.
   */ getCommand(name, hidden) {
    return this.getBaseCommand(name, hidden) ?? this.getGlobalCommand(name, hidden);
  }
  /**
   * Get base command by name or alias.
   * @param name Name or alias of the command.
   * @param hidden Include hidden commands.
   */ getBaseCommand(name, hidden) {
    for (const cmd of this.commands.values()){
      if (cmd._name === name || cmd.aliases.includes(name)) {
        return cmd && (hidden || !cmd.isHidden) ? cmd : undefined;
      }
    }
  }
  /**
   * Get global command by name or alias.
   * @param name Name or alias of the command.
   * @param hidden Include hidden commands.
   */ getGlobalCommand(name, hidden) {
    const getGlobalCommand = (parent, noGlobals)=>{
      const cmd = parent.getBaseCommand(name, hidden);
      if (!cmd?.isGlobal) {
        return parent._parent && getGlobalCommand(parent._parent, noGlobals || parent._noGlobals);
      }
      if (noGlobals && cmd.getName() !== "help") {
        return;
      }
      return cmd;
    };
    return this._parent && getGlobalCommand(this._parent, this._noGlobals);
  }
  /**
   * Remove sub-command by name or alias.
   * @param name Name or alias of the command.
   */ removeCommand(name) {
    const command = this.getBaseCommand(name, true);
    if (command) {
      this.commands.delete(command._name);
    }
    return command;
  }
  /** Get types. */ getTypes() {
    return this.getGlobalTypes().concat(this.getBaseTypes());
  }
  /** Get base types. */ getBaseTypes() {
    return Array.from(this.types.values());
  }
  /** Get global types. */ getGlobalTypes() {
    const getTypes = (cmd, types = [], names = [])=>{
      if (cmd) {
        if (cmd.types.size) {
          cmd.types.forEach((type)=>{
            if (type.global && !this.types.has(type.name) && names.indexOf(type.name) === -1) {
              names.push(type.name);
              types.push(type);
            }
          });
        }
        return getTypes(cmd._parent, types, names);
      }
      return types;
    };
    return getTypes(this._parent);
  }
  /**
   * Get type by name.
   * @param name Name of the type.
   */ getType(name) {
    return this.getBaseType(name) ?? this.getGlobalType(name);
  }
  /**
   * Get base type by name.
   * @param name Name of the type.
   */ getBaseType(name) {
    return this.types.get(name);
  }
  /**
   * Get global type by name.
   * @param name Name of the type.
   */ getGlobalType(name) {
    if (!this._parent) {
      return;
    }
    const cmd = this._parent.getBaseType(name);
    if (!cmd?.global) {
      return this._parent.getGlobalType(name);
    }
    return cmd;
  }
  /** Get completions. */ getCompletions() {
    return this.getGlobalCompletions().concat(this.getBaseCompletions());
  }
  /** Get base completions. */ getBaseCompletions() {
    return Array.from(this.completions.values());
  }
  /** Get global completions. */ getGlobalCompletions() {
    const getCompletions = (cmd, completions = [], names = [])=>{
      if (cmd) {
        if (cmd.completions.size) {
          cmd.completions.forEach((completion)=>{
            if (completion.global && !this.completions.has(completion.name) && names.indexOf(completion.name) === -1) {
              names.push(completion.name);
              completions.push(completion);
            }
          });
        }
        return getCompletions(cmd._parent, completions, names);
      }
      return completions;
    };
    return getCompletions(this._parent);
  }
  /**
   * Get completion by name.
   * @param name Name of the completion.
   */ getCompletion(name) {
    return this.getBaseCompletion(name) ?? this.getGlobalCompletion(name);
  }
  /**
   * Get base completion by name.
   * @param name Name of the completion.
   */ getBaseCompletion(name) {
    return this.completions.get(name);
  }
  /**
   * Get global completions by name.
   * @param name Name of the completion.
   */ getGlobalCompletion(name) {
    if (!this._parent) {
      return;
    }
    const completion = this._parent.getBaseCompletion(name);
    if (!completion?.global) {
      return this._parent.getGlobalCompletion(name);
    }
    return completion;
  }
  /**
   * Checks whether the command has environment variables or not.
   * @param hidden Include hidden environment variable.
   */ hasEnvVars(hidden) {
    return this.getEnvVars(hidden).length > 0;
  }
  /**
   * Get environment variables.
   * @param hidden Include hidden environment variable.
   */ getEnvVars(hidden) {
    return this.getGlobalEnvVars(hidden).concat(this.getBaseEnvVars(hidden));
  }
  /**
   * Get base environment variables.
   * @param hidden Include hidden environment variable.
   */ getBaseEnvVars(hidden) {
    if (!this.envVars.length) {
      return [];
    }
    return hidden ? this.envVars.slice(0) : this.envVars.filter((env)=>!env.hidden);
  }
  /**
   * Get global environment variables.
   * @param hidden Include hidden environment variable.
   */ getGlobalEnvVars(hidden) {
    if (this._noGlobals) {
      return [];
    }
    const getEnvVars = (cmd, envVars = [], names = [])=>{
      if (cmd) {
        if (cmd.envVars.length) {
          cmd.envVars.forEach((envVar)=>{
            if (envVar.global && !this.envVars.find((env)=>env.names[0] === envVar.names[0]) && names.indexOf(envVar.names[0]) === -1 && (hidden || !envVar.hidden)) {
              names.push(envVar.names[0]);
              envVars.push(envVar);
            }
          });
        }
        return getEnvVars(cmd._parent, envVars, names);
      }
      return envVars;
    };
    return getEnvVars(this._parent);
  }
  /**
   * Checks whether the command has an environment variable with given name or not.
   * @param name Name of the environment variable.
   * @param hidden Include hidden environment variable.
   */ hasEnvVar(name, hidden) {
    return !!this.getEnvVar(name, hidden);
  }
  /**
   * Get environment variable by name.
   * @param name Name of the environment variable.
   * @param hidden Include hidden environment variable.
   */ getEnvVar(name, hidden) {
    return this.getBaseEnvVar(name, hidden) ?? this.getGlobalEnvVar(name, hidden);
  }
  /**
   * Get base environment variable by name.
   * @param name Name of the environment variable.
   * @param hidden Include hidden environment variable.
   */ getBaseEnvVar(name, hidden) {
    const envVar = this.envVars.find((env)=>env.names.indexOf(name) !== -1);
    return envVar && (hidden || !envVar.hidden) ? envVar : undefined;
  }
  /**
   * Get global environment variable by name.
   * @param name Name of the environment variable.
   * @param hidden Include hidden environment variable.
   */ getGlobalEnvVar(name, hidden) {
    if (!this._parent || this._noGlobals) {
      return;
    }
    const envVar = this._parent.getBaseEnvVar(name, hidden);
    if (!envVar?.global) {
      return this._parent.getGlobalEnvVar(name, hidden);
    }
    return envVar;
  }
  /** Checks whether the command has examples or not. */ hasExamples() {
    return this.examples.length > 0;
  }
  /** Get all examples. */ getExamples() {
    return this.examples;
  }
  /** Checks whether the command has an example with given name or not. */ hasExample(name) {
    return !!this.getExample(name);
  }
  /** Get example with given name. */ getExample(name) {
    return this.examples.find((example)=>example.name === name);
  }
  getHelpOption() {
    return this._helpOption ?? this._parent?.getHelpOption();
  }
}
function isUpgradeCommand(command) {
  return command instanceof Command && "getLatestVersion" in command;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvY2xpZmZ5QHYwLjI1LjcvY29tbWFuZC9jb21tYW5kLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIGRlbm8tbGludC1pZ25vcmUtZmlsZSBuby1leHBsaWNpdC1hbnlcbmltcG9ydCB7XG4gIFVua25vd25UeXBlRXJyb3IsXG4gIFZhbGlkYXRpb25FcnJvciBhcyBGbGFnc1ZhbGlkYXRpb25FcnJvcixcbn0gZnJvbSBcIi4uL2ZsYWdzL19lcnJvcnMudHNcIjtcbmltcG9ydCB7IE1pc3NpbmdSZXF1aXJlZEVudlZhckVycm9yIH0gZnJvbSBcIi4vX2Vycm9ycy50c1wiO1xuaW1wb3J0IHsgcGFyc2VGbGFncyB9IGZyb20gXCIuLi9mbGFncy9mbGFncy50c1wiO1xuaW1wb3J0IHR5cGUgeyBQYXJzZUZsYWdzQ29udGV4dCB9IGZyb20gXCIuLi9mbGFncy90eXBlcy50c1wiO1xuaW1wb3J0IHtcbiAgZ2V0RGVzY3JpcHRpb24sXG4gIHBhcnNlQXJndW1lbnRzRGVmaW5pdGlvbixcbiAgc3BsaXRBcmd1bWVudHMsXG59IGZyb20gXCIuL191dGlscy50c1wiO1xuaW1wb3J0IHsgYm9sZCwgYnJpZ2h0Qmx1ZSwgcmVkLCB5ZWxsb3cgfSBmcm9tIFwiLi9kZXBzLnRzXCI7XG5pbXBvcnQge1xuICBDb21tYW5kRXhlY3V0YWJsZU5vdEZvdW5kRXJyb3IsXG4gIENvbW1hbmROb3RGb3VuZEVycm9yLFxuICBEZWZhdWx0Q29tbWFuZE5vdEZvdW5kRXJyb3IsXG4gIER1cGxpY2F0ZUNvbW1hbmRBbGlhc0Vycm9yLFxuICBEdXBsaWNhdGVDb21tYW5kTmFtZUVycm9yLFxuICBEdXBsaWNhdGVDb21wbGV0aW9uRXJyb3IsXG4gIER1cGxpY2F0ZUVudlZhckVycm9yLFxuICBEdXBsaWNhdGVFeGFtcGxlRXJyb3IsXG4gIER1cGxpY2F0ZU9wdGlvbk5hbWVFcnJvcixcbiAgRHVwbGljYXRlVHlwZUVycm9yLFxuICBNaXNzaW5nQXJndW1lbnRFcnJvcixcbiAgTWlzc2luZ0FyZ3VtZW50c0Vycm9yLFxuICBNaXNzaW5nQ29tbWFuZE5hbWVFcnJvcixcbiAgTm9Bcmd1bWVudHNBbGxvd2VkRXJyb3IsXG4gIFRvb01hbnlBcmd1bWVudHNFcnJvcixcbiAgVG9vTWFueUVudlZhclZhbHVlc0Vycm9yLFxuICBVbmV4cGVjdGVkT3B0aW9uYWxFbnZWYXJWYWx1ZUVycm9yLFxuICBVbmV4cGVjdGVkVmFyaWFkaWNFbnZWYXJWYWx1ZUVycm9yLFxuICBVbmtub3duQ29tbWFuZEVycm9yLFxuICBWYWxpZGF0aW9uRXJyb3IsXG59IGZyb20gXCIuL19lcnJvcnMudHNcIjtcbmltcG9ydCB7IERlZmF1bHRWYWx1ZSwgRXJyb3JIYW5kbGVyLCBPcHRpb25WYWx1ZUhhbmRsZXIgfSBmcm9tIFwiLi90eXBlcy50c1wiO1xuaW1wb3J0IHsgQm9vbGVhblR5cGUgfSBmcm9tIFwiLi90eXBlcy9ib29sZWFuLnRzXCI7XG5pbXBvcnQgeyBGaWxlVHlwZSB9IGZyb20gXCIuL3R5cGVzL2ZpbGUudHNcIjtcbmltcG9ydCB7IE51bWJlclR5cGUgfSBmcm9tIFwiLi90eXBlcy9udW1iZXIudHNcIjtcbmltcG9ydCB7IFN0cmluZ1R5cGUgfSBmcm9tIFwiLi90eXBlcy9zdHJpbmcudHNcIjtcbmltcG9ydCB7IFR5cGUgfSBmcm9tIFwiLi90eXBlLnRzXCI7XG5pbXBvcnQgeyBIZWxwR2VuZXJhdG9yIH0gZnJvbSBcIi4vaGVscC9faGVscF9nZW5lcmF0b3IudHNcIjtcbmltcG9ydCB0eXBlIHsgSGVscE9wdGlvbnMgfSBmcm9tIFwiLi9oZWxwL19oZWxwX2dlbmVyYXRvci50c1wiO1xuaW1wb3J0IHR5cGUge1xuICBBY3Rpb25IYW5kbGVyLFxuICBBcmd1bWVudCxcbiAgQXJndW1lbnRWYWx1ZSxcbiAgQ29tbWFuZFJlc3VsdCxcbiAgQ29tcGxldGVIYW5kbGVyLFxuICBDb21wbGV0ZU9wdGlvbnMsXG4gIENvbXBsZXRpb24sXG4gIERlc2NyaXB0aW9uLFxuICBFbnZWYXIsXG4gIEVudlZhck9wdGlvbnMsXG4gIEVudlZhclZhbHVlSGFuZGxlcixcbiAgRXhhbXBsZSxcbiAgR2xvYmFsRW52VmFyT3B0aW9ucyxcbiAgR2xvYmFsT3B0aW9uT3B0aW9ucyxcbiAgSGVscEhhbmRsZXIsXG4gIE1hcFR5cGVzLFxuICBPcHRpb24sXG4gIE9wdGlvbk9wdGlvbnMsXG4gIFR5cGVEZWYsXG4gIFR5cGVPcHRpb25zLFxuICBUeXBlT3JUeXBlSGFuZGxlcixcbiAgVmVyc2lvbkhhbmRsZXIsXG59IGZyb20gXCIuL3R5cGVzLnRzXCI7XG5pbXBvcnQgeyBJbnRlZ2VyVHlwZSB9IGZyb20gXCIuL3R5cGVzL2ludGVnZXIudHNcIjtcbmltcG9ydCB7IHVuZGVyc2NvcmVUb0NhbWVsQ2FzZSB9IGZyb20gXCIuLi9mbGFncy9fdXRpbHMudHNcIjtcblxuZXhwb3J0IGNsYXNzIENvbW1hbmQ8XG4gIFRQYXJlbnRDb21tYW5kR2xvYmFscyBleHRlbmRzIFJlY29yZDxzdHJpbmcsIHVua25vd24+IHwgdm9pZCA9IHZvaWQsXG4gIFRQYXJlbnRDb21tYW5kVHlwZXMgZXh0ZW5kcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiB8IHZvaWQgPVxuICAgIFRQYXJlbnRDb21tYW5kR2xvYmFscyBleHRlbmRzIG51bWJlciA/IGFueSA6IHZvaWQsXG4gIFRDb21tYW5kT3B0aW9ucyBleHRlbmRzIFJlY29yZDxzdHJpbmcsIHVua25vd24+IHwgdm9pZCA9XG4gICAgVFBhcmVudENvbW1hbmRHbG9iYWxzIGV4dGVuZHMgbnVtYmVyID8gYW55IDogdm9pZCxcbiAgVENvbW1hbmRBcmd1bWVudHMgZXh0ZW5kcyBBcnJheTx1bmtub3duPiA9IFRQYXJlbnRDb21tYW5kR2xvYmFscyBleHRlbmRzXG4gICAgbnVtYmVyID8gYW55IDogW10sXG4gIFRDb21tYW5kR2xvYmFscyBleHRlbmRzIFJlY29yZDxzdHJpbmcsIHVua25vd24+IHwgdm9pZCA9XG4gICAgVFBhcmVudENvbW1hbmRHbG9iYWxzIGV4dGVuZHMgbnVtYmVyID8gYW55IDogdm9pZCxcbiAgVENvbW1hbmRUeXBlcyBleHRlbmRzIFJlY29yZDxzdHJpbmcsIHVua25vd24+IHwgdm9pZCA9XG4gICAgVFBhcmVudENvbW1hbmRHbG9iYWxzIGV4dGVuZHMgbnVtYmVyID8gYW55IDoge1xuICAgICAgbnVtYmVyOiBudW1iZXI7XG4gICAgICBpbnRlZ2VyOiBudW1iZXI7XG4gICAgICBzdHJpbmc6IHN0cmluZztcbiAgICAgIGJvb2xlYW46IGJvb2xlYW47XG4gICAgICBmaWxlOiBzdHJpbmc7XG4gICAgfSxcbiAgVENvbW1hbmRHbG9iYWxUeXBlcyBleHRlbmRzIFJlY29yZDxzdHJpbmcsIHVua25vd24+IHwgdm9pZCA9XG4gICAgVFBhcmVudENvbW1hbmRHbG9iYWxzIGV4dGVuZHMgbnVtYmVyID8gYW55IDogdm9pZCxcbiAgVFBhcmVudENvbW1hbmQgZXh0ZW5kcyBDb21tYW5kPGFueT4gfCB1bmRlZmluZWQgPVxuICAgIFRQYXJlbnRDb21tYW5kR2xvYmFscyBleHRlbmRzIG51bWJlciA/IGFueSA6IHVuZGVmaW5lZCxcbj4ge1xuICBwcml2YXRlIHR5cGVzOiBNYXA8c3RyaW5nLCBUeXBlRGVmPiA9IG5ldyBNYXAoKTtcbiAgcHJpdmF0ZSByYXdBcmdzOiBBcnJheTxzdHJpbmc+ID0gW107XG4gIHByaXZhdGUgbGl0ZXJhbEFyZ3M6IEFycmF5PHN0cmluZz4gPSBbXTtcbiAgLy8gQFRPRE86IGdldCBzY3JpcHQgbmFtZTogaHR0cHM6Ly9naXRodWIuY29tL2Rlbm9sYW5kL2Rlbm8vcHVsbC81MDM0XG4gIC8vIHByaXZhdGUgbmFtZTogc3RyaW5nID0gbG9jYXRpb24ucGF0aG5hbWUuc3BsaXQoICcvJyApLnBvcCgpIGFzIHN0cmluZztcbiAgcHJpdmF0ZSBfbmFtZSA9IFwiQ09NTUFORFwiO1xuICBwcml2YXRlIF9wYXJlbnQ/OiBUUGFyZW50Q29tbWFuZDtcbiAgcHJpdmF0ZSBfZ2xvYmFsUGFyZW50PzogQ29tbWFuZDxhbnk+O1xuICBwcml2YXRlIHZlcj86IFZlcnNpb25IYW5kbGVyO1xuICBwcml2YXRlIGRlc2M6IERlc2NyaXB0aW9uID0gXCJcIjtcbiAgcHJpdmF0ZSBfdXNhZ2U/OiBzdHJpbmc7XG4gIHByaXZhdGUgZm4/OiBBY3Rpb25IYW5kbGVyO1xuICBwcml2YXRlIG9wdGlvbnM6IEFycmF5PE9wdGlvbj4gPSBbXTtcbiAgcHJpdmF0ZSBjb21tYW5kczogTWFwPHN0cmluZywgQ29tbWFuZDxhbnk+PiA9IG5ldyBNYXAoKTtcbiAgcHJpdmF0ZSBleGFtcGxlczogQXJyYXk8RXhhbXBsZT4gPSBbXTtcbiAgcHJpdmF0ZSBlbnZWYXJzOiBBcnJheTxFbnZWYXI+ID0gW107XG4gIHByaXZhdGUgYWxpYXNlczogQXJyYXk8c3RyaW5nPiA9IFtdO1xuICBwcml2YXRlIGNvbXBsZXRpb25zOiBNYXA8c3RyaW5nLCBDb21wbGV0aW9uPiA9IG5ldyBNYXAoKTtcbiAgcHJpdmF0ZSBjbWQ6IENvbW1hbmQ8YW55PiA9IHRoaXM7XG4gIHByaXZhdGUgYXJnc0RlZmluaXRpb24/OiBzdHJpbmc7XG4gIHByaXZhdGUgaXNFeGVjdXRhYmxlID0gZmFsc2U7XG4gIHByaXZhdGUgdGhyb3dPbkVycm9yID0gZmFsc2U7XG4gIHByaXZhdGUgX2FsbG93RW1wdHkgPSBmYWxzZTtcbiAgcHJpdmF0ZSBfc3RvcEVhcmx5ID0gZmFsc2U7XG4gIHByaXZhdGUgZGVmYXVsdENvbW1hbmQ/OiBzdHJpbmc7XG4gIHByaXZhdGUgX3VzZVJhd0FyZ3MgPSBmYWxzZTtcbiAgcHJpdmF0ZSBhcmdzOiBBcnJheTxBcmd1bWVudD4gPSBbXTtcbiAgcHJpdmF0ZSBpc0hpZGRlbiA9IGZhbHNlO1xuICBwcml2YXRlIGlzR2xvYmFsID0gZmFsc2U7XG4gIHByaXZhdGUgaGFzRGVmYXVsdHMgPSBmYWxzZTtcbiAgcHJpdmF0ZSBfdmVyc2lvbk9wdGlvbnM/OiBEZWZhdWx0T3B0aW9uIHwgZmFsc2U7XG4gIHByaXZhdGUgX2hlbHBPcHRpb25zPzogRGVmYXVsdE9wdGlvbiB8IGZhbHNlO1xuICBwcml2YXRlIF92ZXJzaW9uT3B0aW9uPzogT3B0aW9uO1xuICBwcml2YXRlIF9oZWxwT3B0aW9uPzogT3B0aW9uO1xuICBwcml2YXRlIF9oZWxwPzogSGVscEhhbmRsZXI7XG4gIHByaXZhdGUgX3Nob3VsZEV4aXQ/OiBib29sZWFuO1xuICBwcml2YXRlIF9tZXRhOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0ge307XG4gIHByaXZhdGUgX2dyb3VwTmFtZT86IHN0cmluZztcbiAgcHJpdmF0ZSBfbm9HbG9iYWxzID0gZmFsc2U7XG4gIHByaXZhdGUgZXJyb3JIYW5kbGVyPzogRXJyb3JIYW5kbGVyO1xuXG4gIC8qKiBEaXNhYmxlIHZlcnNpb24gb3B0aW9uLiAqL1xuICBwdWJsaWMgdmVyc2lvbk9wdGlvbihlbmFibGU6IGZhbHNlKTogdGhpcztcblxuICAvKipcbiAgICogU2V0IGdsb2JhbCB2ZXJzaW9uIG9wdGlvbi5cbiAgICogQHBhcmFtIGZsYWdzIFRoZSBmbGFncyBvZiB0aGUgdmVyc2lvbiBvcHRpb24uXG4gICAqIEBwYXJhbSBkZXNjICBUaGUgZGVzY3JpcHRpb24gb2YgdGhlIHZlcnNpb24gb3B0aW9uLlxuICAgKiBAcGFyYW0gb3B0cyAgVmVyc2lvbiBvcHRpb24gb3B0aW9ucy5cbiAgICovXG4gIHB1YmxpYyB2ZXJzaW9uT3B0aW9uKFxuICAgIGZsYWdzOiBzdHJpbmcsXG4gICAgZGVzYz86IHN0cmluZyxcbiAgICBvcHRzPzpcbiAgICAgICYgT3B0aW9uT3B0aW9uczxcbiAgICAgICAgUGFydGlhbDxUQ29tbWFuZE9wdGlvbnM+LFxuICAgICAgICBUQ29tbWFuZEFyZ3VtZW50cyxcbiAgICAgICAgVENvbW1hbmRHbG9iYWxzLFxuICAgICAgICBUUGFyZW50Q29tbWFuZEdsb2JhbHMsXG4gICAgICAgIFRDb21tYW5kVHlwZXMsXG4gICAgICAgIFRDb21tYW5kR2xvYmFsVHlwZXMsXG4gICAgICAgIFRQYXJlbnRDb21tYW5kVHlwZXMsXG4gICAgICAgIFRQYXJlbnRDb21tYW5kXG4gICAgICA+XG4gICAgICAmIHtcbiAgICAgICAgZ2xvYmFsOiB0cnVlO1xuICAgICAgfSxcbiAgKTogdGhpcztcblxuICAvKipcbiAgICogU2V0IHZlcnNpb24gb3B0aW9uLlxuICAgKiBAcGFyYW0gZmxhZ3MgVGhlIGZsYWdzIG9mIHRoZSB2ZXJzaW9uIG9wdGlvbi5cbiAgICogQHBhcmFtIGRlc2MgIFRoZSBkZXNjcmlwdGlvbiBvZiB0aGUgdmVyc2lvbiBvcHRpb24uXG4gICAqIEBwYXJhbSBvcHRzICBWZXJzaW9uIG9wdGlvbiBvcHRpb25zLlxuICAgKi9cbiAgcHVibGljIHZlcnNpb25PcHRpb24oXG4gICAgZmxhZ3M6IHN0cmluZyxcbiAgICBkZXNjPzogc3RyaW5nLFxuICAgIG9wdHM/OiBPcHRpb25PcHRpb25zPFxuICAgICAgVENvbW1hbmRPcHRpb25zLFxuICAgICAgVENvbW1hbmRBcmd1bWVudHMsXG4gICAgICBUQ29tbWFuZEdsb2JhbHMsXG4gICAgICBUUGFyZW50Q29tbWFuZEdsb2JhbHMsXG4gICAgICBUQ29tbWFuZFR5cGVzLFxuICAgICAgVENvbW1hbmRHbG9iYWxUeXBlcyxcbiAgICAgIFRQYXJlbnRDb21tYW5kVHlwZXMsXG4gICAgICBUUGFyZW50Q29tbWFuZFxuICAgID4sXG4gICk6IHRoaXM7XG5cbiAgLyoqXG4gICAqIFNldCB2ZXJzaW9uIG9wdGlvbi5cbiAgICogQHBhcmFtIGZsYWdzIFRoZSBmbGFncyBvZiB0aGUgdmVyc2lvbiBvcHRpb24uXG4gICAqIEBwYXJhbSBkZXNjICBUaGUgZGVzY3JpcHRpb24gb2YgdGhlIHZlcnNpb24gb3B0aW9uLlxuICAgKiBAcGFyYW0gb3B0cyAgVGhlIGFjdGlvbiBvZiB0aGUgdmVyc2lvbiBvcHRpb24uXG4gICAqL1xuICBwdWJsaWMgdmVyc2lvbk9wdGlvbihcbiAgICBmbGFnczogc3RyaW5nLFxuICAgIGRlc2M/OiBzdHJpbmcsXG4gICAgb3B0cz86IEFjdGlvbkhhbmRsZXI8XG4gICAgICBUQ29tbWFuZE9wdGlvbnMsXG4gICAgICBUQ29tbWFuZEFyZ3VtZW50cyxcbiAgICAgIFRDb21tYW5kR2xvYmFscyxcbiAgICAgIFRQYXJlbnRDb21tYW5kR2xvYmFscyxcbiAgICAgIFRDb21tYW5kVHlwZXMsXG4gICAgICBUQ29tbWFuZEdsb2JhbFR5cGVzLFxuICAgICAgVFBhcmVudENvbW1hbmRUeXBlcyxcbiAgICAgIFRQYXJlbnRDb21tYW5kXG4gICAgPixcbiAgKTogdGhpcztcblxuICBwdWJsaWMgdmVyc2lvbk9wdGlvbihcbiAgICBmbGFnczogc3RyaW5nIHwgZmFsc2UsXG4gICAgZGVzYz86IHN0cmluZyxcbiAgICBvcHRzPzpcbiAgICAgIHwgQWN0aW9uSGFuZGxlcjxcbiAgICAgICAgVENvbW1hbmRPcHRpb25zLFxuICAgICAgICBUQ29tbWFuZEFyZ3VtZW50cyxcbiAgICAgICAgVENvbW1hbmRHbG9iYWxzLFxuICAgICAgICBUUGFyZW50Q29tbWFuZEdsb2JhbHMsXG4gICAgICAgIFRDb21tYW5kVHlwZXMsXG4gICAgICAgIFRDb21tYW5kR2xvYmFsVHlwZXMsXG4gICAgICAgIFRQYXJlbnRDb21tYW5kVHlwZXMsXG4gICAgICAgIFRQYXJlbnRDb21tYW5kXG4gICAgICA+XG4gICAgICB8IE9wdGlvbk9wdGlvbnM8XG4gICAgICAgIFRDb21tYW5kT3B0aW9ucyxcbiAgICAgICAgVENvbW1hbmRBcmd1bWVudHMsXG4gICAgICAgIFRDb21tYW5kR2xvYmFscyxcbiAgICAgICAgVFBhcmVudENvbW1hbmRHbG9iYWxzLFxuICAgICAgICBUQ29tbWFuZFR5cGVzLFxuICAgICAgICBUQ29tbWFuZEdsb2JhbFR5cGVzLFxuICAgICAgICBUUGFyZW50Q29tbWFuZFR5cGVzLFxuICAgICAgICBUUGFyZW50Q29tbWFuZFxuICAgICAgPlxuICAgICAgfCBPcHRpb25PcHRpb25zPFxuICAgICAgICBQYXJ0aWFsPFRDb21tYW5kT3B0aW9ucz4sXG4gICAgICAgIFRDb21tYW5kQXJndW1lbnRzLFxuICAgICAgICBUQ29tbWFuZEdsb2JhbHMsXG4gICAgICAgIFRQYXJlbnRDb21tYW5kR2xvYmFscyxcbiAgICAgICAgVENvbW1hbmRUeXBlcyxcbiAgICAgICAgVENvbW1hbmRHbG9iYWxUeXBlcyxcbiAgICAgICAgVFBhcmVudENvbW1hbmRUeXBlcyxcbiAgICAgICAgVFBhcmVudENvbW1hbmRcbiAgICAgID5cbiAgICAgICAgJiB7XG4gICAgICAgICAgZ2xvYmFsOiB0cnVlO1xuICAgICAgICB9LFxuICApOiB0aGlzIHtcbiAgICB0aGlzLl92ZXJzaW9uT3B0aW9ucyA9IGZsYWdzID09PSBmYWxzZSA/IGZsYWdzIDoge1xuICAgICAgZmxhZ3MsXG4gICAgICBkZXNjLFxuICAgICAgb3B0czogdHlwZW9mIG9wdHMgPT09IFwiZnVuY3Rpb25cIiA/IHsgYWN0aW9uOiBvcHRzIH0gOiBvcHRzLFxuICAgIH07XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKiogRGlzYWJsZSBoZWxwIG9wdGlvbi4gKi9cbiAgcHVibGljIGhlbHBPcHRpb24oZW5hYmxlOiBmYWxzZSk6IHRoaXM7XG5cbiAgLyoqXG4gICAqIFNldCBnbG9iYWwgaGVscCBvcHRpb24uXG4gICAqIEBwYXJhbSBmbGFncyBUaGUgZmxhZ3Mgb2YgdGhlIGhlbHAgb3B0aW9uLlxuICAgKiBAcGFyYW0gZGVzYyAgVGhlIGRlc2NyaXB0aW9uIG9mIHRoZSBoZWxwIG9wdGlvbi5cbiAgICogQHBhcmFtIG9wdHMgIEhlbHAgb3B0aW9uIG9wdGlvbnMuXG4gICAqL1xuICBwdWJsaWMgaGVscE9wdGlvbihcbiAgICBmbGFnczogc3RyaW5nLFxuICAgIGRlc2M/OiBzdHJpbmcsXG4gICAgb3B0cz86XG4gICAgICAmIE9wdGlvbk9wdGlvbnM8XG4gICAgICAgIFBhcnRpYWw8VENvbW1hbmRPcHRpb25zPixcbiAgICAgICAgVENvbW1hbmRBcmd1bWVudHMsXG4gICAgICAgIFRDb21tYW5kR2xvYmFscyxcbiAgICAgICAgVFBhcmVudENvbW1hbmRHbG9iYWxzLFxuICAgICAgICBUQ29tbWFuZFR5cGVzLFxuICAgICAgICBUQ29tbWFuZEdsb2JhbFR5cGVzLFxuICAgICAgICBUUGFyZW50Q29tbWFuZFR5cGVzLFxuICAgICAgICBUUGFyZW50Q29tbWFuZFxuICAgICAgPlxuICAgICAgJiB7XG4gICAgICAgIGdsb2JhbDogdHJ1ZTtcbiAgICAgIH0sXG4gICk6IHRoaXM7XG5cbiAgLyoqXG4gICAqIFNldCBoZWxwIG9wdGlvbi5cbiAgICogQHBhcmFtIGZsYWdzIFRoZSBmbGFncyBvZiB0aGUgaGVscCBvcHRpb24uXG4gICAqIEBwYXJhbSBkZXNjICBUaGUgZGVzY3JpcHRpb24gb2YgdGhlIGhlbHAgb3B0aW9uLlxuICAgKiBAcGFyYW0gb3B0cyAgSGVscCBvcHRpb24gb3B0aW9ucy5cbiAgICovXG4gIHB1YmxpYyBoZWxwT3B0aW9uKFxuICAgIGZsYWdzOiBzdHJpbmcsXG4gICAgZGVzYz86IHN0cmluZyxcbiAgICBvcHRzPzogT3B0aW9uT3B0aW9uczxcbiAgICAgIFRDb21tYW5kT3B0aW9ucyxcbiAgICAgIFRDb21tYW5kQXJndW1lbnRzLFxuICAgICAgVENvbW1hbmRHbG9iYWxzLFxuICAgICAgVFBhcmVudENvbW1hbmRHbG9iYWxzLFxuICAgICAgVENvbW1hbmRUeXBlcyxcbiAgICAgIFRDb21tYW5kR2xvYmFsVHlwZXMsXG4gICAgICBUUGFyZW50Q29tbWFuZFR5cGVzLFxuICAgICAgVFBhcmVudENvbW1hbmRcbiAgICA+LFxuICApOiB0aGlzO1xuXG4gIC8qKlxuICAgKiBTZXQgaGVscCBvcHRpb24uXG4gICAqIEBwYXJhbSBmbGFncyBUaGUgZmxhZ3Mgb2YgdGhlIGhlbHAgb3B0aW9uLlxuICAgKiBAcGFyYW0gZGVzYyAgVGhlIGRlc2NyaXB0aW9uIG9mIHRoZSBoZWxwIG9wdGlvbi5cbiAgICogQHBhcmFtIG9wdHMgIFRoZSBhY3Rpb24gb2YgdGhlIGhlbHAgb3B0aW9uLlxuICAgKi9cbiAgcHVibGljIGhlbHBPcHRpb24oXG4gICAgZmxhZ3M6IHN0cmluZyxcbiAgICBkZXNjPzogc3RyaW5nLFxuICAgIG9wdHM/OiBBY3Rpb25IYW5kbGVyPFxuICAgICAgVENvbW1hbmRPcHRpb25zLFxuICAgICAgVENvbW1hbmRBcmd1bWVudHMsXG4gICAgICBUQ29tbWFuZEdsb2JhbHMsXG4gICAgICBUUGFyZW50Q29tbWFuZEdsb2JhbHMsXG4gICAgICBUQ29tbWFuZFR5cGVzLFxuICAgICAgVENvbW1hbmRHbG9iYWxUeXBlcyxcbiAgICAgIFRQYXJlbnRDb21tYW5kVHlwZXMsXG4gICAgICBUUGFyZW50Q29tbWFuZFxuICAgID4sXG4gICk6IHRoaXM7XG5cbiAgcHVibGljIGhlbHBPcHRpb24oXG4gICAgZmxhZ3M6IHN0cmluZyB8IGZhbHNlLFxuICAgIGRlc2M/OiBzdHJpbmcsXG4gICAgb3B0cz86XG4gICAgICB8IEFjdGlvbkhhbmRsZXI8XG4gICAgICAgIFRDb21tYW5kT3B0aW9ucyxcbiAgICAgICAgVENvbW1hbmRBcmd1bWVudHMsXG4gICAgICAgIFRDb21tYW5kR2xvYmFscyxcbiAgICAgICAgVFBhcmVudENvbW1hbmRHbG9iYWxzLFxuICAgICAgICBUQ29tbWFuZFR5cGVzLFxuICAgICAgICBUQ29tbWFuZEdsb2JhbFR5cGVzLFxuICAgICAgICBUUGFyZW50Q29tbWFuZFR5cGVzLFxuICAgICAgICBUUGFyZW50Q29tbWFuZFxuICAgICAgPlxuICAgICAgfCBPcHRpb25PcHRpb25zPFxuICAgICAgICBUQ29tbWFuZE9wdGlvbnMsXG4gICAgICAgIFRDb21tYW5kQXJndW1lbnRzLFxuICAgICAgICBUQ29tbWFuZEdsb2JhbHMsXG4gICAgICAgIFRQYXJlbnRDb21tYW5kR2xvYmFscyxcbiAgICAgICAgVENvbW1hbmRUeXBlcyxcbiAgICAgICAgVENvbW1hbmRHbG9iYWxUeXBlcyxcbiAgICAgICAgVFBhcmVudENvbW1hbmRUeXBlcyxcbiAgICAgICAgVFBhcmVudENvbW1hbmRcbiAgICAgID5cbiAgICAgIHwgT3B0aW9uT3B0aW9uczxcbiAgICAgICAgUGFydGlhbDxUQ29tbWFuZE9wdGlvbnM+LFxuICAgICAgICBUQ29tbWFuZEFyZ3VtZW50cyxcbiAgICAgICAgVENvbW1hbmRHbG9iYWxzLFxuICAgICAgICBUUGFyZW50Q29tbWFuZEdsb2JhbHMsXG4gICAgICAgIFRDb21tYW5kVHlwZXMsXG4gICAgICAgIFRDb21tYW5kR2xvYmFsVHlwZXMsXG4gICAgICAgIFRQYXJlbnRDb21tYW5kVHlwZXMsXG4gICAgICAgIFRQYXJlbnRDb21tYW5kXG4gICAgICA+XG4gICAgICAgICYge1xuICAgICAgICAgIGdsb2JhbDogdHJ1ZTtcbiAgICAgICAgfSxcbiAgKTogdGhpcyB7XG4gICAgdGhpcy5faGVscE9wdGlvbnMgPSBmbGFncyA9PT0gZmFsc2UgPyBmbGFncyA6IHtcbiAgICAgIGZsYWdzLFxuICAgICAgZGVzYyxcbiAgICAgIG9wdHM6IHR5cGVvZiBvcHRzID09PSBcImZ1bmN0aW9uXCIgPyB7IGFjdGlvbjogb3B0cyB9IDogb3B0cyxcbiAgICB9O1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZCBuZXcgc3ViLWNvbW1hbmQuXG4gICAqIEBwYXJhbSBuYW1lICAgICAgQ29tbWFuZCBkZWZpbml0aW9uLiBFLmc6IGBteS1jb21tYW5kIDxpbnB1dC1maWxlOnN0cmluZz4gPG91dHB1dC1maWxlOnN0cmluZz5gXG4gICAqIEBwYXJhbSBjbWQgICAgICAgVGhlIG5ldyBjaGlsZCBjb21tYW5kIHRvIHJlZ2lzdGVyLlxuICAgKiBAcGFyYW0gb3ZlcnJpZGUgIE92ZXJyaWRlIGV4aXN0aW5nIGNoaWxkIGNvbW1hbmQuXG4gICAqL1xuICBwdWJsaWMgY29tbWFuZDxcbiAgICBUQ29tbWFuZCBleHRlbmRzIENvbW1hbmQ8XG4gICAgICAoVEdsb2JhbE9wdGlvbnMgJiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPikgfCB2b2lkIHwgdW5kZWZpbmVkLFxuICAgICAgVEdsb2JhbFR5cGVzIHwgdm9pZCB8IHVuZGVmaW5lZCxcbiAgICAgIFJlY29yZDxzdHJpbmcsIHVua25vd24+IHwgdm9pZCxcbiAgICAgIEFycmF5PHVua25vd24+LFxuICAgICAgUmVjb3JkPHN0cmluZywgdW5rbm93bj4gfCB2b2lkLFxuICAgICAgUmVjb3JkPHN0cmluZywgdW5rbm93bj4gfCB2b2lkLFxuICAgICAgUmVjb3JkPHN0cmluZywgdW5rbm93bj4gfCB2b2lkLFxuICAgICAgQ29tbWFuZDxcbiAgICAgICAgVEdsb2JhbE9wdGlvbnMgfCB2b2lkIHwgdW5kZWZpbmVkLFxuICAgICAgICBUR2xvYmFsVHlwZXMgfCB2b2lkIHwgdW5kZWZpbmVkLFxuICAgICAgICBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiB8IHZvaWQsXG4gICAgICAgIEFycmF5PHVua25vd24+LFxuICAgICAgICBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiB8IHZvaWQsXG4gICAgICAgIFJlY29yZDxzdHJpbmcsIHVua25vd24+IHwgdm9pZCxcbiAgICAgICAgUmVjb3JkPHN0cmluZywgdW5rbm93bj4gfCB2b2lkLFxuICAgICAgICB1bmRlZmluZWRcbiAgICAgID5cbiAgICA+LFxuICAgIFRHbG9iYWxPcHRpb25zXG4gICAgICBleHRlbmRzIChUUGFyZW50Q29tbWFuZCBleHRlbmRzIENvbW1hbmQ8YW55PiA/IFRQYXJlbnRDb21tYW5kR2xvYmFsc1xuICAgICAgICA6IE1lcmdlPFRQYXJlbnRDb21tYW5kR2xvYmFscywgVENvbW1hbmRHbG9iYWxzPiksXG4gICAgVEdsb2JhbFR5cGVzXG4gICAgICBleHRlbmRzIChUUGFyZW50Q29tbWFuZCBleHRlbmRzIENvbW1hbmQ8YW55PiA/IFRQYXJlbnRDb21tYW5kVHlwZXNcbiAgICAgICAgOiBNZXJnZTxUUGFyZW50Q29tbWFuZFR5cGVzLCBUQ29tbWFuZFR5cGVzPiksXG4gID4oXG4gICAgbmFtZTogc3RyaW5nLFxuICAgIGNtZDogVENvbW1hbmQsXG4gICAgb3ZlcnJpZGU/OiBib29sZWFuLFxuICApOiBSZXR1cm5UeXBlPFRDb21tYW5kW1wicmVzZXRcIl0+IGV4dGVuZHMgQ29tbWFuZDxcbiAgICBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiB8IHZvaWQsXG4gICAgUmVjb3JkPHN0cmluZywgdW5rbm93bj4gfCB2b2lkLFxuICAgIGluZmVyIE9wdGlvbnMsXG4gICAgaW5mZXIgQXJndW1lbnRzLFxuICAgIGluZmVyIEdsb2JhbE9wdGlvbnMsXG4gICAgaW5mZXIgVHlwZXMsXG4gICAgaW5mZXIgR2xvYmFsVHlwZXMsXG4gICAgdW5kZWZpbmVkXG4gID4gPyBDb21tYW5kPFxuICAgICAgVEdsb2JhbE9wdGlvbnMsXG4gICAgICBUR2xvYmFsVHlwZXMsXG4gICAgICBPcHRpb25zLFxuICAgICAgQXJndW1lbnRzLFxuICAgICAgR2xvYmFsT3B0aW9ucyxcbiAgICAgIFR5cGVzLFxuICAgICAgR2xvYmFsVHlwZXMsXG4gICAgICBPbmVPZjxUUGFyZW50Q29tbWFuZCwgdGhpcz5cbiAgICA+XG4gICAgOiBuZXZlcjtcblxuICAvKipcbiAgICogQWRkIG5ldyBzdWItY29tbWFuZC5cbiAgICogQHBhcmFtIG5hbWUgICAgICBDb21tYW5kIGRlZmluaXRpb24uIEUuZzogYG15LWNvbW1hbmQgPGlucHV0LWZpbGU6c3RyaW5nPiA8b3V0cHV0LWZpbGU6c3RyaW5nPmBcbiAgICogQHBhcmFtIGNtZCAgICAgICBUaGUgbmV3IGNoaWxkIGNvbW1hbmQgdG8gcmVnaXN0ZXIuXG4gICAqIEBwYXJhbSBvdmVycmlkZSAgT3ZlcnJpZGUgZXhpc3RpbmcgY2hpbGQgY29tbWFuZC5cbiAgICovXG4gIHB1YmxpYyBjb21tYW5kPFxuICAgIFRDb21tYW5kIGV4dGVuZHMgQ29tbWFuZDxcbiAgICAgIFRHbG9iYWxPcHRpb25zIHwgdm9pZCB8IHVuZGVmaW5lZCxcbiAgICAgIFRHbG9iYWxUeXBlcyB8IHZvaWQgfCB1bmRlZmluZWQsXG4gICAgICBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiB8IHZvaWQsXG4gICAgICBBcnJheTx1bmtub3duPixcbiAgICAgIFJlY29yZDxzdHJpbmcsIHVua25vd24+IHwgdm9pZCxcbiAgICAgIFJlY29yZDxzdHJpbmcsIHVua25vd24+IHwgdm9pZCxcbiAgICAgIFJlY29yZDxzdHJpbmcsIHVua25vd24+IHwgdm9pZCxcbiAgICAgIE9uZU9mPFRQYXJlbnRDb21tYW5kLCB0aGlzPiB8IHVuZGVmaW5lZFxuICAgID4sXG4gICAgVEdsb2JhbE9wdGlvbnNcbiAgICAgIGV4dGVuZHMgKFRQYXJlbnRDb21tYW5kIGV4dGVuZHMgQ29tbWFuZDxhbnk+ID8gVFBhcmVudENvbW1hbmRHbG9iYWxzXG4gICAgICAgIDogTWVyZ2U8VFBhcmVudENvbW1hbmRHbG9iYWxzLCBUQ29tbWFuZEdsb2JhbHM+KSxcbiAgICBUR2xvYmFsVHlwZXNcbiAgICAgIGV4dGVuZHMgKFRQYXJlbnRDb21tYW5kIGV4dGVuZHMgQ29tbWFuZDxhbnk+ID8gVFBhcmVudENvbW1hbmRUeXBlc1xuICAgICAgICA6IE1lcmdlPFRQYXJlbnRDb21tYW5kVHlwZXMsIFRDb21tYW5kVHlwZXM+KSxcbiAgPihcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgY21kOiBUQ29tbWFuZCxcbiAgICBvdmVycmlkZT86IGJvb2xlYW4sXG4gICk6IFRDb21tYW5kIGV4dGVuZHMgQ29tbWFuZDxcbiAgICBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiB8IHZvaWQsXG4gICAgUmVjb3JkPHN0cmluZywgdW5rbm93bj4gfCB2b2lkLFxuICAgIGluZmVyIE9wdGlvbnMsXG4gICAgaW5mZXIgQXJndW1lbnRzLFxuICAgIGluZmVyIEdsb2JhbE9wdGlvbnMsXG4gICAgaW5mZXIgVHlwZXMsXG4gICAgaW5mZXIgR2xvYmFsVHlwZXMsXG4gICAgT25lT2Y8VFBhcmVudENvbW1hbmQsIHRoaXM+IHwgdW5kZWZpbmVkXG4gID4gPyBDb21tYW5kPFxuICAgICAgVEdsb2JhbE9wdGlvbnMsXG4gICAgICBUR2xvYmFsVHlwZXMsXG4gICAgICBPcHRpb25zLFxuICAgICAgQXJndW1lbnRzLFxuICAgICAgR2xvYmFsT3B0aW9ucyxcbiAgICAgIFR5cGVzLFxuICAgICAgR2xvYmFsVHlwZXMsXG4gICAgICBPbmVPZjxUUGFyZW50Q29tbWFuZCwgdGhpcz5cbiAgICA+XG4gICAgOiBuZXZlcjtcblxuICAvKipcbiAgICogQWRkIG5ldyBzdWItY29tbWFuZC5cbiAgICogQHBhcmFtIG5hbWVBbmRBcmd1bWVudHMgIENvbW1hbmQgZGVmaW5pdGlvbi4gRS5nOiBgbXktY29tbWFuZCA8aW5wdXQtZmlsZTpzdHJpbmc+IDxvdXRwdXQtZmlsZTpzdHJpbmc+YFxuICAgKiBAcGFyYW0gZGVzYyAgICAgICAgICAgICAgVGhlIGRlc2NyaXB0aW9uIG9mIHRoZSBuZXcgY2hpbGQgY29tbWFuZC5cbiAgICogQHBhcmFtIG92ZXJyaWRlICAgICAgICAgIE92ZXJyaWRlIGV4aXN0aW5nIGNoaWxkIGNvbW1hbmQuXG4gICAqL1xuICBwdWJsaWMgY29tbWFuZDxcbiAgICBUTmFtZUFuZEFyZ3VtZW50cyBleHRlbmRzIHN0cmluZyxcbiAgICBUQXJndW1lbnRzIGV4dGVuZHMgVHlwZWRDb21tYW5kQXJndW1lbnRzPFxuICAgICAgVE5hbWVBbmRBcmd1bWVudHMsXG4gICAgICBUUGFyZW50Q29tbWFuZCBleHRlbmRzIENvbW1hbmQ8YW55PiA/IFRQYXJlbnRDb21tYW5kVHlwZXNcbiAgICAgICAgOiBNZXJnZTxUUGFyZW50Q29tbWFuZFR5cGVzLCBUQ29tbWFuZEdsb2JhbFR5cGVzPlxuICAgID4sXG4gID4oXG4gICAgbmFtZUFuZEFyZ3VtZW50czogVE5hbWVBbmRBcmd1bWVudHMsXG4gICAgZGVzYz86IHN0cmluZyxcbiAgICBvdmVycmlkZT86IGJvb2xlYW4sXG4gICk6IFRQYXJlbnRDb21tYW5kR2xvYmFscyBleHRlbmRzIG51bWJlciA/IENvbW1hbmQ8YW55PiA6IENvbW1hbmQ8XG4gICAgVFBhcmVudENvbW1hbmQgZXh0ZW5kcyBDb21tYW5kPGFueT4gPyBUUGFyZW50Q29tbWFuZEdsb2JhbHNcbiAgICAgIDogTWVyZ2U8VFBhcmVudENvbW1hbmRHbG9iYWxzLCBUQ29tbWFuZEdsb2JhbHM+LFxuICAgIFRQYXJlbnRDb21tYW5kIGV4dGVuZHMgQ29tbWFuZDxhbnk+ID8gVFBhcmVudENvbW1hbmRUeXBlc1xuICAgICAgOiBNZXJnZTxUUGFyZW50Q29tbWFuZFR5cGVzLCBUQ29tbWFuZEdsb2JhbFR5cGVzPixcbiAgICB2b2lkLFxuICAgIFRBcmd1bWVudHMsXG4gICAgdm9pZCxcbiAgICB2b2lkLFxuICAgIHZvaWQsXG4gICAgT25lT2Y8VFBhcmVudENvbW1hbmQsIHRoaXM+XG4gID47XG5cbiAgLyoqXG4gICAqIEFkZCBuZXcgc3ViLWNvbW1hbmQuXG4gICAqIEBwYXJhbSBuYW1lQW5kQXJndW1lbnRzICBDb21tYW5kIGRlZmluaXRpb24uIEUuZzogYG15LWNvbW1hbmQgPGlucHV0LWZpbGU6c3RyaW5nPiA8b3V0cHV0LWZpbGU6c3RyaW5nPmBcbiAgICogQHBhcmFtIGNtZE9yRGVzY3JpcHRpb24gIFRoZSBkZXNjcmlwdGlvbiBvZiB0aGUgbmV3IGNoaWxkIGNvbW1hbmQuXG4gICAqIEBwYXJhbSBvdmVycmlkZSAgICAgICAgICBPdmVycmlkZSBleGlzdGluZyBjaGlsZCBjb21tYW5kLlxuICAgKi9cbiAgY29tbWFuZChcbiAgICBuYW1lQW5kQXJndW1lbnRzOiBzdHJpbmcsXG4gICAgY21kT3JEZXNjcmlwdGlvbj86IENvbW1hbmQ8YW55PiB8IHN0cmluZyxcbiAgICBvdmVycmlkZT86IGJvb2xlYW4sXG4gICk6IENvbW1hbmQ8YW55PiB7XG4gICAgdGhpcy5yZXNldCgpO1xuXG4gICAgY29uc3QgcmVzdWx0ID0gc3BsaXRBcmd1bWVudHMobmFtZUFuZEFyZ3VtZW50cyk7XG5cbiAgICBjb25zdCBuYW1lOiBzdHJpbmcgfCB1bmRlZmluZWQgPSByZXN1bHQuZmxhZ3Muc2hpZnQoKTtcbiAgICBjb25zdCBhbGlhc2VzOiBzdHJpbmdbXSA9IHJlc3VsdC5mbGFncztcblxuICAgIGlmICghbmFtZSkge1xuICAgICAgdGhyb3cgbmV3IE1pc3NpbmdDb21tYW5kTmFtZUVycm9yKCk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuZ2V0QmFzZUNvbW1hbmQobmFtZSwgdHJ1ZSkpIHtcbiAgICAgIGlmICghb3ZlcnJpZGUpIHtcbiAgICAgICAgdGhyb3cgbmV3IER1cGxpY2F0ZUNvbW1hbmROYW1lRXJyb3IobmFtZSk7XG4gICAgICB9XG4gICAgICB0aGlzLnJlbW92ZUNvbW1hbmQobmFtZSk7XG4gICAgfVxuXG4gICAgbGV0IGRlc2NyaXB0aW9uOiBzdHJpbmcgfCB1bmRlZmluZWQ7XG4gICAgbGV0IGNtZDogQ29tbWFuZDxhbnk+O1xuXG4gICAgaWYgKHR5cGVvZiBjbWRPckRlc2NyaXB0aW9uID09PSBcInN0cmluZ1wiKSB7XG4gICAgICBkZXNjcmlwdGlvbiA9IGNtZE9yRGVzY3JpcHRpb247XG4gICAgfVxuXG4gICAgaWYgKGNtZE9yRGVzY3JpcHRpb24gaW5zdGFuY2VvZiBDb21tYW5kKSB7XG4gICAgICBjbWQgPSBjbWRPckRlc2NyaXB0aW9uLnJlc2V0KCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNtZCA9IG5ldyBDb21tYW5kKCk7XG4gICAgfVxuXG4gICAgY21kLl9uYW1lID0gbmFtZTtcbiAgICBjbWQuX3BhcmVudCA9IHRoaXM7XG5cbiAgICBpZiAoZGVzY3JpcHRpb24pIHtcbiAgICAgIGNtZC5kZXNjcmlwdGlvbihkZXNjcmlwdGlvbik7XG4gICAgfVxuXG4gICAgaWYgKHJlc3VsdC50eXBlRGVmaW5pdGlvbikge1xuICAgICAgY21kLmFyZ3VtZW50cyhyZXN1bHQudHlwZURlZmluaXRpb24pO1xuICAgIH1cblxuICAgIGFsaWFzZXMuZm9yRWFjaCgoYWxpYXM6IHN0cmluZykgPT4gY21kLmFsaWFzKGFsaWFzKSk7XG5cbiAgICB0aGlzLmNvbW1hbmRzLnNldChuYW1lLCBjbWQpO1xuXG4gICAgdGhpcy5zZWxlY3QobmFtZSk7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGQgbmV3IGNvbW1hbmQgYWxpYXMuXG4gICAqIEBwYXJhbSBhbGlhcyBUaGEgbmFtZSBvZiB0aGUgYWxpYXMuXG4gICAqL1xuICBwdWJsaWMgYWxpYXMoYWxpYXM6IHN0cmluZyk6IHRoaXMge1xuICAgIGlmICh0aGlzLmNtZC5fbmFtZSA9PT0gYWxpYXMgfHwgdGhpcy5jbWQuYWxpYXNlcy5pbmNsdWRlcyhhbGlhcykpIHtcbiAgICAgIHRocm93IG5ldyBEdXBsaWNhdGVDb21tYW5kQWxpYXNFcnJvcihhbGlhcyk7XG4gICAgfVxuXG4gICAgdGhpcy5jbWQuYWxpYXNlcy5wdXNoKGFsaWFzKTtcblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqIFJlc2V0IGludGVybmFsIGNvbW1hbmQgcmVmZXJlbmNlIHRvIG1haW4gY29tbWFuZC4gKi9cbiAgcHVibGljIHJlc2V0KCk6IE9uZU9mPFRQYXJlbnRDb21tYW5kLCB0aGlzPiB7XG4gICAgdGhpcy5fZ3JvdXBOYW1lID0gdW5kZWZpbmVkO1xuICAgIHRoaXMuY21kID0gdGhpcztcbiAgICByZXR1cm4gdGhpcyBhcyBPbmVPZjxUUGFyZW50Q29tbWFuZCwgdGhpcz47XG4gIH1cblxuICAvKipcbiAgICogU2V0IGludGVybmFsIGNvbW1hbmQgcG9pbnRlciB0byBjaGlsZCBjb21tYW5kIHdpdGggZ2l2ZW4gbmFtZS5cbiAgICogQHBhcmFtIG5hbWUgVGhlIG5hbWUgb2YgdGhlIGNvbW1hbmQgdG8gc2VsZWN0LlxuICAgKi9cbiAgcHVibGljIHNlbGVjdDxcbiAgICBUT3B0aW9ucyBleHRlbmRzIFJlY29yZDxzdHJpbmcsIHVua25vd24+IHwgdm9pZCA9IGFueSxcbiAgICBUQXJndW1lbnRzIGV4dGVuZHMgQXJyYXk8dW5rbm93bj4gPSBhbnksXG4gICAgVEdsb2JhbE9wdGlvbnMgZXh0ZW5kcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiB8IHZvaWQgPSBhbnksXG4gID4oXG4gICAgbmFtZTogc3RyaW5nLFxuICApOiBDb21tYW5kPFxuICAgIFRQYXJlbnRDb21tYW5kR2xvYmFscyxcbiAgICBUUGFyZW50Q29tbWFuZFR5cGVzLFxuICAgIFRPcHRpb25zLFxuICAgIFRBcmd1bWVudHMsXG4gICAgVEdsb2JhbE9wdGlvbnMsXG4gICAgVENvbW1hbmRUeXBlcyxcbiAgICBUQ29tbWFuZEdsb2JhbFR5cGVzLFxuICAgIFRQYXJlbnRDb21tYW5kXG4gID4ge1xuICAgIGNvbnN0IGNtZCA9IHRoaXMuZ2V0QmFzZUNvbW1hbmQobmFtZSwgdHJ1ZSk7XG5cbiAgICBpZiAoIWNtZCkge1xuICAgICAgdGhyb3cgbmV3IENvbW1hbmROb3RGb3VuZEVycm9yKG5hbWUsIHRoaXMuZ2V0QmFzZUNvbW1hbmRzKHRydWUpKTtcbiAgICB9XG5cbiAgICB0aGlzLmNtZCA9IGNtZDtcblxuICAgIHJldHVybiB0aGlzIGFzIENvbW1hbmQ8YW55PjtcbiAgfVxuXG4gIC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICAgKioqKiBTVUIgSEFORExFUiAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAgICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG4gIC8qKiBTZXQgY29tbWFuZCBuYW1lLiAqL1xuICBwdWJsaWMgbmFtZShuYW1lOiBzdHJpbmcpOiB0aGlzIHtcbiAgICB0aGlzLmNtZC5fbmFtZSA9IG5hbWU7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogU2V0IGNvbW1hbmQgdmVyc2lvbi5cbiAgICogQHBhcmFtIHZlcnNpb24gU2VtYW50aWMgdmVyc2lvbiBzdHJpbmcgc3RyaW5nIG9yIG1ldGhvZCB0aGF0IHJldHVybnMgdGhlIHZlcnNpb24gc3RyaW5nLlxuICAgKi9cbiAgcHVibGljIHZlcnNpb24oXG4gICAgdmVyc2lvbjpcbiAgICAgIHwgc3RyaW5nXG4gICAgICB8IFZlcnNpb25IYW5kbGVyPFxuICAgICAgICBQYXJ0aWFsPFRDb21tYW5kT3B0aW9ucz4sXG4gICAgICAgIFBhcnRpYWw8VENvbW1hbmRBcmd1bWVudHM+LFxuICAgICAgICBUQ29tbWFuZEdsb2JhbHMsXG4gICAgICAgIFRQYXJlbnRDb21tYW5kR2xvYmFscyxcbiAgICAgICAgVENvbW1hbmRUeXBlcyxcbiAgICAgICAgVENvbW1hbmRHbG9iYWxUeXBlcyxcbiAgICAgICAgVFBhcmVudENvbW1hbmRUeXBlcyxcbiAgICAgICAgVFBhcmVudENvbW1hbmRcbiAgICAgID4sXG4gICk6IHRoaXMge1xuICAgIGlmICh0eXBlb2YgdmVyc2lvbiA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgdGhpcy5jbWQudmVyID0gKCkgPT4gdmVyc2lvbjtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiB2ZXJzaW9uID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgIHRoaXMuY21kLnZlciA9IHZlcnNpb247XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgcHVibGljIG1ldGEobmFtZTogc3RyaW5nLCB2YWx1ZTogc3RyaW5nKTogdGhpcyB7XG4gICAgdGhpcy5jbWQuX21ldGFbbmFtZV0gPSB2YWx1ZTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHB1YmxpYyBnZXRNZXRhKCk6IFJlY29yZDxzdHJpbmcsIHN0cmluZz47XG4gIHB1YmxpYyBnZXRNZXRhKG5hbWU6IHN0cmluZyk6IHN0cmluZztcbiAgcHVibGljIGdldE1ldGEobmFtZT86IHN0cmluZyk6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gfCBzdHJpbmcge1xuICAgIHJldHVybiB0eXBlb2YgbmFtZSA9PT0gXCJ1bmRlZmluZWRcIiA/IHRoaXMuX21ldGEgOiB0aGlzLl9tZXRhW25hbWVdO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldCBjb21tYW5kIGhlbHAuXG4gICAqIEBwYXJhbSBoZWxwIEhlbHAgc3RyaW5nLCBtZXRob2QsIG9yIGNvbmZpZyBmb3IgZ2VuZXJhdG9yIHRoYXQgcmV0dXJucyB0aGUgaGVscCBzdHJpbmcuXG4gICAqL1xuICBwdWJsaWMgaGVscChcbiAgICBoZWxwOlxuICAgICAgfCBzdHJpbmdcbiAgICAgIHwgSGVscEhhbmRsZXI8XG4gICAgICAgIFBhcnRpYWw8VENvbW1hbmRPcHRpb25zPixcbiAgICAgICAgUGFydGlhbDxUQ29tbWFuZEFyZ3VtZW50cz4sXG4gICAgICAgIFRDb21tYW5kR2xvYmFscyxcbiAgICAgICAgVFBhcmVudENvbW1hbmRHbG9iYWxzXG4gICAgICA+XG4gICAgICB8IEhlbHBPcHRpb25zLFxuICApOiB0aGlzIHtcbiAgICBpZiAodHlwZW9mIGhlbHAgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgIHRoaXMuY21kLl9oZWxwID0gKCkgPT4gaGVscDtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBoZWxwID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgIHRoaXMuY21kLl9oZWxwID0gaGVscDtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5jbWQuX2hlbHAgPSAoY21kOiBDb21tYW5kLCBvcHRpb25zOiBIZWxwT3B0aW9ucyk6IHN0cmluZyA9PlxuICAgICAgICBIZWxwR2VuZXJhdG9yLmdlbmVyYXRlKGNtZCwgeyAuLi5oZWxwLCAuLi5vcHRpb25zIH0pO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXQgdGhlIGxvbmcgY29tbWFuZCBkZXNjcmlwdGlvbi5cbiAgICogQHBhcmFtIGRlc2NyaXB0aW9uIFRoZSBjb21tYW5kIGRlc2NyaXB0aW9uLlxuICAgKi9cbiAgcHVibGljIGRlc2NyaXB0aW9uKFxuICAgIGRlc2NyaXB0aW9uOiBEZXNjcmlwdGlvbjxcbiAgICAgIFRDb21tYW5kT3B0aW9ucyxcbiAgICAgIFRDb21tYW5kQXJndW1lbnRzLFxuICAgICAgVENvbW1hbmRHbG9iYWxzLFxuICAgICAgVFBhcmVudENvbW1hbmRHbG9iYWxzLFxuICAgICAgVENvbW1hbmRUeXBlcyxcbiAgICAgIFRDb21tYW5kR2xvYmFsVHlwZXMsXG4gICAgICBUUGFyZW50Q29tbWFuZFR5cGVzLFxuICAgICAgVFBhcmVudENvbW1hbmRcbiAgICA+LFxuICApOiB0aGlzIHtcbiAgICB0aGlzLmNtZC5kZXNjID0gZGVzY3JpcHRpb247XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogU2V0IHRoZSBjb21tYW5kIHVzYWdlLiBEZWZhdWx0cyB0byBhcmd1bWVudHMuXG4gICAqIEBwYXJhbSB1c2FnZSBUaGUgY29tbWFuZCB1c2FnZS5cbiAgICovXG4gIHB1YmxpYyB1c2FnZSh1c2FnZTogc3RyaW5nKTogdGhpcyB7XG4gICAgdGhpcy5jbWQuX3VzYWdlID0gdXNhZ2U7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogSGlkZSBjb21tYW5kIGZyb20gaGVscCwgY29tcGxldGlvbnMsIGV0Yy5cbiAgICovXG4gIHB1YmxpYyBoaWRkZW4oKTogdGhpcyB7XG4gICAgdGhpcy5jbWQuaXNIaWRkZW4gPSB0cnVlO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqIE1ha2UgY29tbWFuZCBnbG9iYWxseSBhdmFpbGFibGUuICovXG4gIHB1YmxpYyBnbG9iYWwoKTogdGhpcyB7XG4gICAgdGhpcy5jbWQuaXNHbG9iYWwgPSB0cnVlO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqIE1ha2UgY29tbWFuZCBleGVjdXRhYmxlLiAqL1xuICBwdWJsaWMgZXhlY3V0YWJsZSgpOiB0aGlzIHtcbiAgICB0aGlzLmNtZC5pc0V4ZWN1dGFibGUgPSB0cnVlO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldCBjb21tYW5kIGFyZ3VtZW50czpcbiAgICpcbiAgICogICA8cmVxdWlyZWRBcmc6c3RyaW5nPiBbb3B0aW9uYWxBcmc6IG51bWJlcl0gWy4uLnJlc3RBcmdzOnN0cmluZ11cbiAgICovXG4gIHB1YmxpYyBhcmd1bWVudHM8XG4gICAgVEFyZ3VtZW50cyBleHRlbmRzIFR5cGVkQXJndW1lbnRzPFxuICAgICAgVEFyZ3MsXG4gICAgICBNZXJnZTxUUGFyZW50Q29tbWFuZFR5cGVzLCBNZXJnZTxUQ29tbWFuZEdsb2JhbFR5cGVzLCBUQ29tbWFuZFR5cGVzPj5cbiAgICA+LFxuICAgIFRBcmdzIGV4dGVuZHMgc3RyaW5nID0gc3RyaW5nLFxuICA+KFxuICAgIGFyZ3M6IFRBcmdzLFxuICApOiBDb21tYW5kPFxuICAgIFRQYXJlbnRDb21tYW5kR2xvYmFscyxcbiAgICBUUGFyZW50Q29tbWFuZFR5cGVzLFxuICAgIFRDb21tYW5kT3B0aW9ucyxcbiAgICBUQXJndW1lbnRzLFxuICAgIFRDb21tYW5kR2xvYmFscyxcbiAgICBUQ29tbWFuZFR5cGVzLFxuICAgIFRDb21tYW5kR2xvYmFsVHlwZXMsXG4gICAgVFBhcmVudENvbW1hbmRcbiAgPiB7XG4gICAgdGhpcy5jbWQuYXJnc0RlZmluaXRpb24gPSBhcmdzO1xuICAgIHJldHVybiB0aGlzIGFzIENvbW1hbmQ8YW55PjtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXQgY29tbWFuZCBjYWxsYmFjayBtZXRob2QuXG4gICAqIEBwYXJhbSBmbiBDb21tYW5kIGFjdGlvbiBoYW5kbGVyLlxuICAgKi9cbiAgcHVibGljIGFjdGlvbihcbiAgICBmbjogQWN0aW9uSGFuZGxlcjxcbiAgICAgIFRDb21tYW5kT3B0aW9ucyxcbiAgICAgIFRDb21tYW5kQXJndW1lbnRzLFxuICAgICAgVENvbW1hbmRHbG9iYWxzLFxuICAgICAgVFBhcmVudENvbW1hbmRHbG9iYWxzLFxuICAgICAgVENvbW1hbmRUeXBlcyxcbiAgICAgIFRDb21tYW5kR2xvYmFsVHlwZXMsXG4gICAgICBUUGFyZW50Q29tbWFuZFR5cGVzLFxuICAgICAgVFBhcmVudENvbW1hbmRcbiAgICA+LFxuICApOiB0aGlzIHtcbiAgICB0aGlzLmNtZC5mbiA9IGZuO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIERvbid0IHRocm93IGFuIGVycm9yIGlmIHRoZSBjb21tYW5kIHdhcyBjYWxsZWQgd2l0aG91dCBhcmd1bWVudHMuXG4gICAqIEBwYXJhbSBhbGxvd0VtcHR5IEVuYWJsZS9kaXNhYmxlIGFsbG93IGVtcHR5LlxuICAgKi9cbiAgLy8gcHVibGljIGFsbG93RW1wdHk8VEFsbG93RW1wdHkgZXh0ZW5kcyBib29sZWFuIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkPihcbiAgLy8gICBhbGxvd0VtcHR5PzogVEFsbG93RW1wdHksXG4gIC8vICk6IGZhbHNlIGV4dGVuZHMgVEFsbG93RW1wdHkgPyB0aGlzXG4gIC8vICAgOiBDb21tYW5kPFxuICAvLyAgICAgUGFydGlhbDxUUGFyZW50Q29tbWFuZEdsb2JhbHM+LFxuICAvLyAgICAgVFBhcmVudENvbW1hbmRUeXBlcyxcbiAgLy8gICAgIFBhcnRpYWw8VENvbW1hbmRPcHRpb25zPixcbiAgLy8gICAgIFRDb21tYW5kQXJndW1lbnRzLFxuICAvLyAgICAgVENvbW1hbmRHbG9iYWxzLFxuICAvLyAgICAgVENvbW1hbmRUeXBlcyxcbiAgLy8gICAgIFRDb21tYW5kR2xvYmFsVHlwZXMsXG4gIC8vICAgICBUUGFyZW50Q29tbWFuZFxuICAvLyAgID4ge1xuICAvLyAgIHRoaXMuY21kLl9hbGxvd0VtcHR5ID0gYWxsb3dFbXB0eSAhPT0gZmFsc2U7XG4gIC8vICAgcmV0dXJuIHRoaXM7XG4gIC8vIH1cblxuICBwdWJsaWMgYWxsb3dFbXB0eTxUQWxsb3dFbXB0eSBleHRlbmRzIGJvb2xlYW4gfCB1bmRlZmluZWQgPSB1bmRlZmluZWQ+KFxuICAgIGFsbG93RW1wdHk/OiBUQWxsb3dFbXB0eSxcbiAgKTogZmFsc2UgZXh0ZW5kcyBUQWxsb3dFbXB0eSA/IHRoaXNcbiAgICA6IENvbW1hbmQ8XG4gICAgICBQYXJ0aWFsPFRQYXJlbnRDb21tYW5kR2xvYmFscz4sXG4gICAgICBUUGFyZW50Q29tbWFuZFR5cGVzLFxuICAgICAgUGFydGlhbDxUQ29tbWFuZE9wdGlvbnM+LFxuICAgICAgVENvbW1hbmRBcmd1bWVudHMsXG4gICAgICBUQ29tbWFuZEdsb2JhbHMsXG4gICAgICBUQ29tbWFuZFR5cGVzLFxuICAgICAgVENvbW1hbmRHbG9iYWxUeXBlcyxcbiAgICAgIFRQYXJlbnRDb21tYW5kXG4gICAgPiB7XG4gICAgdGhpcy5jbWQuX2FsbG93RW1wdHkgPSBhbGxvd0VtcHR5ICE9PSBmYWxzZTtcbiAgICByZXR1cm4gdGhpcyBhcyBmYWxzZSBleHRlbmRzIFRBbGxvd0VtcHR5ID8gdGhpc1xuICAgICAgOiBDb21tYW5kPFxuICAgICAgICBQYXJ0aWFsPFRQYXJlbnRDb21tYW5kR2xvYmFscz4sXG4gICAgICAgIFRQYXJlbnRDb21tYW5kVHlwZXMsXG4gICAgICAgIFBhcnRpYWw8VENvbW1hbmRPcHRpb25zPixcbiAgICAgICAgVENvbW1hbmRBcmd1bWVudHMsXG4gICAgICAgIFRDb21tYW5kR2xvYmFscyxcbiAgICAgICAgVENvbW1hbmRUeXBlcyxcbiAgICAgICAgVENvbW1hbmRHbG9iYWxUeXBlcyxcbiAgICAgICAgVFBhcmVudENvbW1hbmRcbiAgICAgID47XG4gIH1cblxuICAvKipcbiAgICogRW5hYmxlIHN0b3AgZWFybHkuIElmIGVuYWJsZWQsIGFsbCBhcmd1bWVudHMgc3RhcnRpbmcgZnJvbSB0aGUgZmlyc3Qgbm9uXG4gICAqIG9wdGlvbiBhcmd1bWVudCB3aWxsIGJlIHBhc3NlZCBhcyBhcmd1bWVudHMgd2l0aCB0eXBlIHN0cmluZyB0byB0aGUgY29tbWFuZFxuICAgKiBhY3Rpb24gaGFuZGxlci5cbiAgICpcbiAgICogRm9yIGV4YW1wbGU6XG4gICAqICAgICBgY29tbWFuZCAtLWRlYnVnLWxldmVsIHdhcm5pbmcgc2VydmVyIC0tcG9ydCA4MGBcbiAgICpcbiAgICogV2lsbCByZXN1bHQgaW46XG4gICAqICAgICAtIG9wdGlvbnM6IGB7ZGVidWdMZXZlbDogJ3dhcm5pbmcnfWBcbiAgICogICAgIC0gYXJnczogYFsnc2VydmVyJywgJy0tcG9ydCcsICc4MCddYFxuICAgKlxuICAgKiBAcGFyYW0gc3RvcEVhcmx5IEVuYWJsZS9kaXNhYmxlIHN0b3AgZWFybHkuXG4gICAqL1xuICBwdWJsaWMgc3RvcEVhcmx5KHN0b3BFYXJseSA9IHRydWUpOiB0aGlzIHtcbiAgICB0aGlzLmNtZC5fc3RvcEVhcmx5ID0gc3RvcEVhcmx5O1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIERpc2FibGUgcGFyc2luZyBhcmd1bWVudHMuIElmIGVuYWJsZWQgdGhlIHJhdyBhcmd1bWVudHMgd2lsbCBiZSBwYXNzZWQgdG9cbiAgICogdGhlIGFjdGlvbiBoYW5kbGVyLiBUaGlzIGhhcyBubyBlZmZlY3QgZm9yIHBhcmVudCBvciBjaGlsZCBjb21tYW5kcy4gT25seVxuICAgKiBmb3IgdGhlIGNvbW1hbmQgb24gd2hpY2ggdGhpcyBtZXRob2Qgd2FzIGNhbGxlZC5cbiAgICogQHBhcmFtIHVzZVJhd0FyZ3MgRW5hYmxlL2Rpc2FibGUgcmF3IGFyZ3VtZW50cy5cbiAgICovXG4gIHB1YmxpYyB1c2VSYXdBcmdzKFxuICAgIHVzZVJhd0FyZ3MgPSB0cnVlLFxuICApOiBDb21tYW5kPFxuICAgIHZvaWQsXG4gICAgdm9pZCxcbiAgICB2b2lkLFxuICAgIEFycmF5PHN0cmluZz4sXG4gICAgdm9pZCxcbiAgICB2b2lkLFxuICAgIHZvaWQsXG4gICAgVFBhcmVudENvbW1hbmRcbiAgPiB7XG4gICAgdGhpcy5jbWQuX3VzZVJhd0FyZ3MgPSB1c2VSYXdBcmdzO1xuICAgIHJldHVybiB0aGlzIGFzIENvbW1hbmQ8YW55PjtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXQgZGVmYXVsdCBjb21tYW5kLiBUaGUgZGVmYXVsdCBjb21tYW5kIGlzIGV4ZWN1dGVkIHdoZW4gdGhlIHByb2dyYW1cbiAgICogd2FzIGNhbGxlZCB3aXRob3V0IGFueSBhcmd1bWVudCBhbmQgaWYgbm8gYWN0aW9uIGhhbmRsZXIgaXMgcmVnaXN0ZXJlZC5cbiAgICogQHBhcmFtIG5hbWUgTmFtZSBvZiB0aGUgZGVmYXVsdCBjb21tYW5kLlxuICAgKi9cbiAgcHVibGljIGRlZmF1bHQobmFtZTogc3RyaW5nKTogdGhpcyB7XG4gICAgdGhpcy5jbWQuZGVmYXVsdENvbW1hbmQgPSBuYW1lO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgcHVibGljIGdsb2JhbFR5cGU8XG4gICAgVEhhbmRsZXIgZXh0ZW5kcyBUeXBlT3JUeXBlSGFuZGxlcjx1bmtub3duPixcbiAgICBUTmFtZSBleHRlbmRzIHN0cmluZyA9IHN0cmluZyxcbiAgPihcbiAgICBuYW1lOiBUTmFtZSxcbiAgICBoYW5kbGVyOiBUSGFuZGxlcixcbiAgICBvcHRpb25zPzogT21pdDxUeXBlT3B0aW9ucywgXCJnbG9iYWxcIj4sXG4gICk6IENvbW1hbmQ8XG4gICAgVFBhcmVudENvbW1hbmRHbG9iYWxzLFxuICAgIFRQYXJlbnRDb21tYW5kVHlwZXMsXG4gICAgVENvbW1hbmRPcHRpb25zLFxuICAgIFRDb21tYW5kQXJndW1lbnRzLFxuICAgIFRDb21tYW5kR2xvYmFscyxcbiAgICBUQ29tbWFuZFR5cGVzLFxuICAgIE1lcmdlPFRDb21tYW5kR2xvYmFsVHlwZXMsIFR5cGVkVHlwZTxUTmFtZSwgVEhhbmRsZXI+PixcbiAgICBUUGFyZW50Q29tbWFuZFxuICA+IHtcbiAgICByZXR1cm4gdGhpcy50eXBlKG5hbWUsIGhhbmRsZXIsIHsgLi4ub3B0aW9ucywgZ2xvYmFsOiB0cnVlIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlZ2lzdGVyIGN1c3RvbSB0eXBlLlxuICAgKiBAcGFyYW0gbmFtZSAgICBUaGUgbmFtZSBvZiB0aGUgdHlwZS5cbiAgICogQHBhcmFtIGhhbmRsZXIgVGhlIGNhbGxiYWNrIG1ldGhvZCB0byBwYXJzZSB0aGUgdHlwZS5cbiAgICogQHBhcmFtIG9wdGlvbnMgVHlwZSBvcHRpb25zLlxuICAgKi9cbiAgcHVibGljIHR5cGU8XG4gICAgVEhhbmRsZXIgZXh0ZW5kcyBUeXBlT3JUeXBlSGFuZGxlcjx1bmtub3duPixcbiAgICBUTmFtZSBleHRlbmRzIHN0cmluZyA9IHN0cmluZyxcbiAgPihcbiAgICBuYW1lOiBUTmFtZSxcbiAgICBoYW5kbGVyOiBUSGFuZGxlcixcbiAgICBvcHRpb25zPzogVHlwZU9wdGlvbnMsXG4gICk6IENvbW1hbmQ8XG4gICAgVFBhcmVudENvbW1hbmRHbG9iYWxzLFxuICAgIFRQYXJlbnRDb21tYW5kVHlwZXMsXG4gICAgVENvbW1hbmRPcHRpb25zLFxuICAgIFRDb21tYW5kQXJndW1lbnRzLFxuICAgIFRDb21tYW5kR2xvYmFscyxcbiAgICBNZXJnZTxUQ29tbWFuZFR5cGVzLCBUeXBlZFR5cGU8VE5hbWUsIFRIYW5kbGVyPj4sXG4gICAgVENvbW1hbmRHbG9iYWxUeXBlcyxcbiAgICBUUGFyZW50Q29tbWFuZFxuICA+IHtcbiAgICBpZiAodGhpcy5jbWQudHlwZXMuZ2V0KG5hbWUpICYmICFvcHRpb25zPy5vdmVycmlkZSkge1xuICAgICAgdGhyb3cgbmV3IER1cGxpY2F0ZVR5cGVFcnJvcihuYW1lKTtcbiAgICB9XG5cbiAgICB0aGlzLmNtZC50eXBlcy5zZXQobmFtZSwge1xuICAgICAgLi4ub3B0aW9ucyxcbiAgICAgIG5hbWUsXG4gICAgICBoYW5kbGVyOiBoYW5kbGVyIGFzIFR5cGVPclR5cGVIYW5kbGVyPHVua25vd24+LFxuICAgIH0pO1xuXG4gICAgaWYgKFxuICAgICAgaGFuZGxlciBpbnN0YW5jZW9mIFR5cGUgJiZcbiAgICAgICh0eXBlb2YgaGFuZGxlci5jb21wbGV0ZSAhPT0gXCJ1bmRlZmluZWRcIiB8fFxuICAgICAgICB0eXBlb2YgaGFuZGxlci52YWx1ZXMgIT09IFwidW5kZWZpbmVkXCIpXG4gICAgKSB7XG4gICAgICBjb25zdCBjb21wbGV0ZUhhbmRsZXI6IENvbXBsZXRlSGFuZGxlciA9IChcbiAgICAgICAgY21kOiBDb21tYW5kLFxuICAgICAgICBwYXJlbnQ/OiBDb21tYW5kLFxuICAgICAgKSA9PiBoYW5kbGVyLmNvbXBsZXRlPy4oY21kLCBwYXJlbnQpIHx8IFtdO1xuICAgICAgdGhpcy5jb21wbGV0ZShuYW1lLCBjb21wbGV0ZUhhbmRsZXIsIG9wdGlvbnMpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzIGFzIENvbW1hbmQ8YW55PjtcbiAgfVxuXG4gIHB1YmxpYyBnbG9iYWxDb21wbGV0ZShcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgY29tcGxldGU6IENvbXBsZXRlSGFuZGxlcixcbiAgICBvcHRpb25zPzogT21pdDxDb21wbGV0ZU9wdGlvbnMsIFwiZ2xvYmFsXCI+LFxuICApOiB0aGlzIHtcbiAgICByZXR1cm4gdGhpcy5jb21wbGV0ZShuYW1lLCBjb21wbGV0ZSwgeyAuLi5vcHRpb25zLCBnbG9iYWw6IHRydWUgfSk7XG4gIH1cblxuICAvKipcbiAgICogUmVnaXN0ZXIgY29tbWFuZCBzcGVjaWZpYyBjdXN0b20gdHlwZS5cbiAgICogQHBhcmFtIG5hbWUgICAgICBUaGUgbmFtZSBvZiB0aGUgY29tcGxldGlvbi5cbiAgICogQHBhcmFtIGNvbXBsZXRlICBUaGUgY2FsbGJhY2sgbWV0aG9kIHRvIGNvbXBsZXRlIHRoZSB0eXBlLlxuICAgKiBAcGFyYW0gb3B0aW9ucyAgIENvbXBsZXRlIG9wdGlvbnMuXG4gICAqL1xuICBwdWJsaWMgY29tcGxldGUoXG4gICAgbmFtZTogc3RyaW5nLFxuICAgIGNvbXBsZXRlOiBDb21wbGV0ZUhhbmRsZXI8XG4gICAgICBQYXJ0aWFsPFRDb21tYW5kT3B0aW9ucz4sXG4gICAgICBQYXJ0aWFsPFRDb21tYW5kQXJndW1lbnRzPixcbiAgICAgIFRDb21tYW5kR2xvYmFscyxcbiAgICAgIFRQYXJlbnRDb21tYW5kR2xvYmFscyxcbiAgICAgIFRDb21tYW5kVHlwZXMsXG4gICAgICBUQ29tbWFuZEdsb2JhbFR5cGVzLFxuICAgICAgVFBhcmVudENvbW1hbmRUeXBlcyxcbiAgICAgIGFueVxuICAgID4sXG4gICAgb3B0aW9uczogQ29tcGxldGVPcHRpb25zICYgeyBnbG9iYWw6IGJvb2xlYW4gfSxcbiAgKTogdGhpcztcbiAgcHVibGljIGNvbXBsZXRlKFxuICAgIG5hbWU6IHN0cmluZyxcbiAgICBjb21wbGV0ZTogQ29tcGxldGVIYW5kbGVyPFxuICAgICAgVENvbW1hbmRPcHRpb25zLFxuICAgICAgVENvbW1hbmRBcmd1bWVudHMsXG4gICAgICBUQ29tbWFuZEdsb2JhbHMsXG4gICAgICBUUGFyZW50Q29tbWFuZEdsb2JhbHMsXG4gICAgICBUQ29tbWFuZFR5cGVzLFxuICAgICAgVENvbW1hbmRHbG9iYWxUeXBlcyxcbiAgICAgIFRQYXJlbnRDb21tYW5kVHlwZXMsXG4gICAgICBUUGFyZW50Q29tbWFuZFxuICAgID4sXG4gICAgb3B0aW9ucz86IENvbXBsZXRlT3B0aW9ucyxcbiAgKTogdGhpcztcblxuICBwdWJsaWMgY29tcGxldGUoXG4gICAgbmFtZTogc3RyaW5nLFxuICAgIGNvbXBsZXRlOlxuICAgICAgfCBDb21wbGV0ZUhhbmRsZXI8XG4gICAgICAgIFRDb21tYW5kT3B0aW9ucyxcbiAgICAgICAgVENvbW1hbmRBcmd1bWVudHMsXG4gICAgICAgIFRDb21tYW5kR2xvYmFscyxcbiAgICAgICAgVFBhcmVudENvbW1hbmRHbG9iYWxzLFxuICAgICAgICBUQ29tbWFuZFR5cGVzLFxuICAgICAgICBUQ29tbWFuZEdsb2JhbFR5cGVzLFxuICAgICAgICBUUGFyZW50Q29tbWFuZFR5cGVzLFxuICAgICAgICBUUGFyZW50Q29tbWFuZFxuICAgICAgPlxuICAgICAgfCBDb21wbGV0ZUhhbmRsZXI8XG4gICAgICAgIFBhcnRpYWw8VENvbW1hbmRPcHRpb25zPixcbiAgICAgICAgUGFydGlhbDxUQ29tbWFuZEFyZ3VtZW50cz4sXG4gICAgICAgIFRDb21tYW5kR2xvYmFscyxcbiAgICAgICAgVFBhcmVudENvbW1hbmRHbG9iYWxzLFxuICAgICAgICBUQ29tbWFuZFR5cGVzLFxuICAgICAgICBUQ29tbWFuZEdsb2JhbFR5cGVzLFxuICAgICAgICBUUGFyZW50Q29tbWFuZFR5cGVzLFxuICAgICAgICBhbnlcbiAgICAgID4sXG4gICAgb3B0aW9ucz86IENvbXBsZXRlT3B0aW9ucyxcbiAgKTogdGhpcyB7XG4gICAgaWYgKHRoaXMuY21kLmNvbXBsZXRpb25zLmhhcyhuYW1lKSAmJiAhb3B0aW9ucz8ub3ZlcnJpZGUpIHtcbiAgICAgIHRocm93IG5ldyBEdXBsaWNhdGVDb21wbGV0aW9uRXJyb3IobmFtZSk7XG4gICAgfVxuXG4gICAgdGhpcy5jbWQuY29tcGxldGlvbnMuc2V0KG5hbWUsIHtcbiAgICAgIG5hbWUsXG4gICAgICBjb21wbGV0ZSxcbiAgICAgIC4uLm9wdGlvbnMsXG4gICAgfSk7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBUaHJvdyB2YWxpZGF0aW9uIGVycm9ycyBpbnN0ZWFkIG9mIGNhbGxpbmcgYERlbm8uZXhpdCgpYCB0byBoYW5kbGVcbiAgICogdmFsaWRhdGlvbiBlcnJvcnMgbWFudWFsbHkuXG4gICAqXG4gICAqIEEgdmFsaWRhdGlvbiBlcnJvciBpcyB0aHJvd24gd2hlbiB0aGUgY29tbWFuZCBpcyB3cm9uZ2x5IHVzZWQgYnkgdGhlIHVzZXIuXG4gICAqIEZvciBleGFtcGxlOiBJZiB0aGUgdXNlciBwYXNzZXMgc29tZSBpbnZhbGlkIG9wdGlvbnMgb3IgYXJndW1lbnRzIHRvIHRoZVxuICAgKiBjb21tYW5kLlxuICAgKlxuICAgKiBUaGlzIGhhcyBubyBlZmZlY3QgZm9yIHBhcmVudCBjb21tYW5kcy4gT25seSBmb3IgdGhlIGNvbW1hbmQgb24gd2hpY2ggdGhpc1xuICAgKiBtZXRob2Qgd2FzIGNhbGxlZCBhbmQgYWxsIGNoaWxkIGNvbW1hbmRzLlxuICAgKlxuICAgKiAqKkV4YW1wbGU6KipcbiAgICpcbiAgICogYGBgXG4gICAqIHRyeSB7XG4gICAqICAgY21kLnBhcnNlKCk7XG4gICAqIH0gY2F0Y2goZXJyb3IpIHtcbiAgICogICBpZiAoZXJyb3IgaW5zdGFuY2VvZiBWYWxpZGF0aW9uRXJyb3IpIHtcbiAgICogICAgIGNtZC5zaG93SGVscCgpO1xuICAgKiAgICAgRGVuby5leGl0KDEpO1xuICAgKiAgIH1cbiAgICogICB0aHJvdyBlcnJvcjtcbiAgICogfVxuICAgKiBgYGBcbiAgICpcbiAgICogQHNlZSBWYWxpZGF0aW9uRXJyb3JcbiAgICovXG4gIHB1YmxpYyB0aHJvd0Vycm9ycygpOiB0aGlzIHtcbiAgICB0aGlzLmNtZC50aHJvd09uRXJyb3IgPSB0cnVlO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgcHVibGljIGVycm9yKGhhbmRsZXI6IEVycm9ySGFuZGxlcik6IHRoaXMge1xuICAgIHRoaXMuY21kLmVycm9ySGFuZGxlciA9IGhhbmRsZXI7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBwcml2YXRlIGdldEVycm9ySGFuZGxlcigpOiBFcnJvckhhbmRsZXIgfCB1bmRlZmluZWQge1xuICAgIHJldHVybiB0aGlzLmVycm9ySGFuZGxlciA/PyB0aGlzLl9wYXJlbnQ/LmVycm9ySGFuZGxlcjtcbiAgfVxuXG4gIC8qKlxuICAgKiBTYW1lIGFzIGAudGhyb3dFcnJvcnMoKWAgYnV0IGFsc28gcHJldmVudHMgY2FsbGluZyBgRGVuby5leGl0YCBhZnRlclxuICAgKiBwcmludGluZyBoZWxwIG9yIHZlcnNpb24gd2l0aCB0aGUgLS1oZWxwIGFuZCAtLXZlcnNpb24gb3B0aW9uLlxuICAgKi9cbiAgcHVibGljIG5vRXhpdCgpOiB0aGlzIHtcbiAgICB0aGlzLmNtZC5fc2hvdWxkRXhpdCA9IGZhbHNlO1xuICAgIHRoaXMudGhyb3dFcnJvcnMoKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBEaXNhYmxlIGluaGVyaXRpbmcgZ2xvYmFsIGNvbW1hbmRzLCBvcHRpb25zIGFuZCBlbnZpcm9ubWVudCB2YXJpYWJsZXMgZnJvbVxuICAgKiBwYXJlbnQgY29tbWFuZHMuXG4gICAqL1xuICBwdWJsaWMgbm9HbG9iYWxzKCk6IHRoaXMge1xuICAgIHRoaXMuY21kLl9ub0dsb2JhbHMgPSB0cnVlO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqIENoZWNrIHdoZXRoZXIgdGhlIGNvbW1hbmQgc2hvdWxkIHRocm93IGVycm9ycyBvciBleGl0LiAqL1xuICBwcm90ZWN0ZWQgc2hvdWxkVGhyb3dFcnJvcnMoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMudGhyb3dPbkVycm9yIHx8ICEhdGhpcy5fcGFyZW50Py5zaG91bGRUaHJvd0Vycm9ycygpO1xuICB9XG5cbiAgLyoqIENoZWNrIHdoZXRoZXIgdGhlIGNvbW1hbmQgc2hvdWxkIGV4aXQgYWZ0ZXIgcHJpbnRpbmcgaGVscCBvciB2ZXJzaW9uLiAqL1xuICBwcm90ZWN0ZWQgc2hvdWxkRXhpdCgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5fc2hvdWxkRXhpdCA/PyB0aGlzLl9wYXJlbnQ/LnNob3VsZEV4aXQoKSA/PyB0cnVlO1xuICB9XG5cbiAgcHVibGljIGdsb2JhbE9wdGlvbjxcbiAgICBURmxhZ3MgZXh0ZW5kcyBzdHJpbmcsXG4gICAgVEdsb2JhbE9wdGlvbnMgZXh0ZW5kcyBUeXBlZE9wdGlvbjxcbiAgICAgIFRGbGFncyxcbiAgICAgIFRDb21tYW5kT3B0aW9ucyxcbiAgICAgIE1lcmdlPFRQYXJlbnRDb21tYW5kVHlwZXMsIE1lcmdlPFRDb21tYW5kR2xvYmFsVHlwZXMsIFRDb21tYW5kVHlwZXM+PixcbiAgICAgIHVuZGVmaW5lZCBleHRlbmRzIFRDb25mbGljdHMgPyBUUmVxdWlyZWQgOiBmYWxzZSxcbiAgICAgIFREZWZhdWx0VmFsdWVcbiAgICA+LFxuICAgIFRNYXBwZWRHbG9iYWxPcHRpb25zIGV4dGVuZHMgTWFwVmFsdWU8XG4gICAgICBUR2xvYmFsT3B0aW9ucyxcbiAgICAgIFRNYXBwZWRWYWx1ZSxcbiAgICAgIFRDb2xsZWN0XG4gICAgPixcbiAgICBUUmVxdWlyZWQgZXh0ZW5kcyBPcHRpb25PcHRpb25zW1wicmVxdWlyZWRcIl0gPSB1bmRlZmluZWQsXG4gICAgVENvbGxlY3QgZXh0ZW5kcyBPcHRpb25PcHRpb25zW1wiY29sbGVjdFwiXSA9IHVuZGVmaW5lZCxcbiAgICBUQ29uZmxpY3RzIGV4dGVuZHMgT3B0aW9uT3B0aW9uc1tcImNvbmZsaWN0c1wiXSA9IHVuZGVmaW5lZCxcbiAgICBURGVmYXVsdFZhbHVlID0gdW5kZWZpbmVkLFxuICAgIFRNYXBwZWRWYWx1ZSA9IHVuZGVmaW5lZCxcbiAgPihcbiAgICBmbGFnczogVEZsYWdzLFxuICAgIGRlc2M6IHN0cmluZyxcbiAgICBvcHRzPzpcbiAgICAgIHwgT21pdDxcbiAgICAgICAgR2xvYmFsT3B0aW9uT3B0aW9uczxcbiAgICAgICAgICBQYXJ0aWFsPFRDb21tYW5kT3B0aW9ucz4sXG4gICAgICAgICAgVENvbW1hbmRBcmd1bWVudHMsXG4gICAgICAgICAgTWVyZ2VPcHRpb25zPFRGbGFncywgVENvbW1hbmRHbG9iYWxzLCBUR2xvYmFsT3B0aW9ucz4sXG4gICAgICAgICAgVFBhcmVudENvbW1hbmRHbG9iYWxzLFxuICAgICAgICAgIFRDb21tYW5kVHlwZXMsXG4gICAgICAgICAgVENvbW1hbmRHbG9iYWxUeXBlcyxcbiAgICAgICAgICBUUGFyZW50Q29tbWFuZFR5cGVzLFxuICAgICAgICAgIFRQYXJlbnRDb21tYW5kXG4gICAgICAgID4sXG4gICAgICAgIFwidmFsdWVcIlxuICAgICAgPlxuICAgICAgICAmIHtcbiAgICAgICAgICBkZWZhdWx0PzogRGVmYXVsdFZhbHVlPFREZWZhdWx0VmFsdWU+O1xuICAgICAgICAgIHJlcXVpcmVkPzogVFJlcXVpcmVkO1xuICAgICAgICAgIGNvbGxlY3Q/OiBUQ29sbGVjdDtcbiAgICAgICAgICB2YWx1ZT86IE9wdGlvblZhbHVlSGFuZGxlcjxcbiAgICAgICAgICAgIE1hcFR5cGVzPFZhbHVlT2Y8VEdsb2JhbE9wdGlvbnM+PixcbiAgICAgICAgICAgIFRNYXBwZWRWYWx1ZVxuICAgICAgICAgID47XG4gICAgICAgIH1cbiAgICAgIHwgT3B0aW9uVmFsdWVIYW5kbGVyPE1hcFR5cGVzPFZhbHVlT2Y8VEdsb2JhbE9wdGlvbnM+PiwgVE1hcHBlZFZhbHVlPixcbiAgKTogQ29tbWFuZDxcbiAgICBUUGFyZW50Q29tbWFuZEdsb2JhbHMsXG4gICAgVFBhcmVudENvbW1hbmRUeXBlcyxcbiAgICBUQ29tbWFuZE9wdGlvbnMsXG4gICAgVENvbW1hbmRBcmd1bWVudHMsXG4gICAgTWVyZ2VPcHRpb25zPFRGbGFncywgVENvbW1hbmRHbG9iYWxzLCBUTWFwcGVkR2xvYmFsT3B0aW9ucz4sXG4gICAgVENvbW1hbmRUeXBlcyxcbiAgICBUQ29tbWFuZEdsb2JhbFR5cGVzLFxuICAgIFRQYXJlbnRDb21tYW5kXG4gID4ge1xuICAgIGlmICh0eXBlb2Ygb3B0cyA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICByZXR1cm4gdGhpcy5vcHRpb24oXG4gICAgICAgIGZsYWdzLFxuICAgICAgICBkZXNjLFxuICAgICAgICB7IHZhbHVlOiBvcHRzLCBnbG9iYWw6IHRydWUgfSBhcyBPcHRpb25PcHRpb25zLFxuICAgICAgKSBhcyBDb21tYW5kPGFueT47XG4gICAgfVxuICAgIHJldHVybiB0aGlzLm9wdGlvbihcbiAgICAgIGZsYWdzLFxuICAgICAgZGVzYyxcbiAgICAgIHsgLi4ub3B0cywgZ2xvYmFsOiB0cnVlIH0gYXMgT3B0aW9uT3B0aW9ucyxcbiAgICApIGFzIENvbW1hbmQ8YW55PjtcbiAgfVxuXG4gIC8qKlxuICAgKiBFbmFibGUgZ3JvdXBpbmcgb2Ygb3B0aW9ucyBhbmQgc2V0IHRoZSBuYW1lIG9mIHRoZSBncm91cC5cbiAgICogQWxsIG9wdGlvbiB3aGljaCBhcmUgYWRkZWQgYWZ0ZXIgY2FsbGluZyB0aGUgYC5ncm91cCgpYCBtZXRob2Qgd2lsbCBiZVxuICAgKiBncm91cGVkIGluIHRoZSBoZWxwIG91dHB1dC4gSWYgdGhlIGAuZ3JvdXAoKWAgbWV0aG9kIGNhbiBiZSB1c2UgbXVsdGlwbGVcbiAgICogdGltZXMgdG8gY3JlYXRlIG1vcmUgZ3JvdXBzLlxuICAgKlxuICAgKiBAcGFyYW0gbmFtZSBUaGUgbmFtZSBvZiB0aGUgb3B0aW9uIGdyb3VwLlxuICAgKi9cbiAgcHVibGljIGdyb3VwKG5hbWU6IHN0cmluZyk6IHRoaXMge1xuICAgIHRoaXMuY21kLl9ncm91cE5hbWUgPSBuYW1lO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZCBhIG5ldyBvcHRpb24uXG4gICAqIEBwYXJhbSBmbGFncyBGbGFncyBzdHJpbmcgZS5nOiAtaCwgLS1oZWxwLCAtLW1hbnVhbCA8cmVxdWlyZWRBcmc6c3RyaW5nPiBbb3B0aW9uYWxBcmc6bnVtYmVyXSBbLi4ucmVzdEFyZ3M6c3RyaW5nXVxuICAgKiBAcGFyYW0gZGVzYyBGbGFnIGRlc2NyaXB0aW9uLlxuICAgKiBAcGFyYW0gb3B0cyBGbGFnIG9wdGlvbnMgb3IgY3VzdG9tIGhhbmRsZXIgZm9yIHByb2Nlc3NpbmcgZmxhZyB2YWx1ZS5cbiAgICovXG4gIHB1YmxpYyBvcHRpb248XG4gICAgVEZsYWdzIGV4dGVuZHMgc3RyaW5nLFxuICAgIFRHbG9iYWxPcHRpb25zIGV4dGVuZHMgVHlwZWRPcHRpb248XG4gICAgICBURmxhZ3MsXG4gICAgICBUQ29tbWFuZE9wdGlvbnMsXG4gICAgICBNZXJnZTxUUGFyZW50Q29tbWFuZFR5cGVzLCBNZXJnZTxUQ29tbWFuZEdsb2JhbFR5cGVzLCBUQ29tbWFuZFR5cGVzPj4sXG4gICAgICB1bmRlZmluZWQgZXh0ZW5kcyBUQ29uZmxpY3RzID8gVFJlcXVpcmVkIDogZmFsc2UsXG4gICAgICBURGVmYXVsdFxuICAgID4sXG4gICAgVE1hcHBlZEdsb2JhbE9wdGlvbnMgZXh0ZW5kcyBNYXBWYWx1ZTxcbiAgICAgIFRHbG9iYWxPcHRpb25zLFxuICAgICAgVE1hcHBlZFZhbHVlLFxuICAgICAgVENvbGxlY3RcbiAgICA+LFxuICAgIFRSZXF1aXJlZCBleHRlbmRzIE9wdGlvbk9wdGlvbnNbXCJyZXF1aXJlZFwiXSA9IHVuZGVmaW5lZCxcbiAgICBUQ29sbGVjdCBleHRlbmRzIE9wdGlvbk9wdGlvbnNbXCJjb2xsZWN0XCJdID0gdW5kZWZpbmVkLFxuICAgIFRDb25mbGljdHMgZXh0ZW5kcyBPcHRpb25PcHRpb25zW1wiY29uZmxpY3RzXCJdID0gdW5kZWZpbmVkLFxuICAgIFREZWZhdWx0ID0gdW5kZWZpbmVkLFxuICAgIFRNYXBwZWRWYWx1ZSA9IHVuZGVmaW5lZCxcbiAgPihcbiAgICBmbGFnczogVEZsYWdzLFxuICAgIGRlc2M6IHN0cmluZyxcbiAgICBvcHRzOlxuICAgICAgfCBPbWl0PFxuICAgICAgICBPcHRpb25PcHRpb25zPFxuICAgICAgICAgIFBhcnRpYWw8VENvbW1hbmRPcHRpb25zPixcbiAgICAgICAgICBUQ29tbWFuZEFyZ3VtZW50cyxcbiAgICAgICAgICBNZXJnZU9wdGlvbnM8VEZsYWdzLCBUQ29tbWFuZEdsb2JhbHMsIFRHbG9iYWxPcHRpb25zPixcbiAgICAgICAgICBUUGFyZW50Q29tbWFuZEdsb2JhbHMsXG4gICAgICAgICAgVENvbW1hbmRUeXBlcyxcbiAgICAgICAgICBUQ29tbWFuZEdsb2JhbFR5cGVzLFxuICAgICAgICAgIFRQYXJlbnRDb21tYW5kVHlwZXMsXG4gICAgICAgICAgVFBhcmVudENvbW1hbmRcbiAgICAgICAgPixcbiAgICAgICAgXCJ2YWx1ZVwiXG4gICAgICA+XG4gICAgICAgICYge1xuICAgICAgICAgIGdsb2JhbDogdHJ1ZTtcbiAgICAgICAgICBkZWZhdWx0PzogRGVmYXVsdFZhbHVlPFREZWZhdWx0PjtcbiAgICAgICAgICByZXF1aXJlZD86IFRSZXF1aXJlZDtcbiAgICAgICAgICBjb2xsZWN0PzogVENvbGxlY3Q7XG4gICAgICAgICAgdmFsdWU/OiBPcHRpb25WYWx1ZUhhbmRsZXI8XG4gICAgICAgICAgICBNYXBUeXBlczxWYWx1ZU9mPFRHbG9iYWxPcHRpb25zPj4sXG4gICAgICAgICAgICBUTWFwcGVkVmFsdWVcbiAgICAgICAgICA+O1xuICAgICAgICB9XG4gICAgICB8IE9wdGlvblZhbHVlSGFuZGxlcjxNYXBUeXBlczxWYWx1ZU9mPFRHbG9iYWxPcHRpb25zPj4sIFRNYXBwZWRWYWx1ZT4sXG4gICk6IENvbW1hbmQ8XG4gICAgVFBhcmVudENvbW1hbmRHbG9iYWxzLFxuICAgIFRQYXJlbnRDb21tYW5kVHlwZXMsXG4gICAgVENvbW1hbmRPcHRpb25zLFxuICAgIFRDb21tYW5kQXJndW1lbnRzLFxuICAgIE1lcmdlT3B0aW9uczxURmxhZ3MsIFRDb21tYW5kR2xvYmFscywgVE1hcHBlZEdsb2JhbE9wdGlvbnM+LFxuICAgIFRDb21tYW5kVHlwZXMsXG4gICAgVENvbW1hbmRHbG9iYWxUeXBlcyxcbiAgICBUUGFyZW50Q29tbWFuZFxuICA+O1xuXG4gIHB1YmxpYyBvcHRpb248XG4gICAgVEZsYWdzIGV4dGVuZHMgc3RyaW5nLFxuICAgIFRPcHRpb25zIGV4dGVuZHMgVHlwZWRPcHRpb248XG4gICAgICBURmxhZ3MsXG4gICAgICBUQ29tbWFuZE9wdGlvbnMsXG4gICAgICBNZXJnZTxUUGFyZW50Q29tbWFuZFR5cGVzLCBNZXJnZTxUQ29tbWFuZEdsb2JhbFR5cGVzLCBUQ29tbWFuZFR5cGVzPj4sXG4gICAgICB1bmRlZmluZWQgZXh0ZW5kcyBUQ29uZmxpY3RzID8gVFJlcXVpcmVkIDogZmFsc2UsXG4gICAgICBURGVmYXVsdFZhbHVlXG4gICAgPixcbiAgICBUTWFwcGVkT3B0aW9ucyBleHRlbmRzIE1hcFZhbHVlPFRPcHRpb25zLCBUTWFwcGVkVmFsdWUsIFRDb2xsZWN0PixcbiAgICBUUmVxdWlyZWQgZXh0ZW5kcyBPcHRpb25PcHRpb25zW1wicmVxdWlyZWRcIl0gPSB1bmRlZmluZWQsXG4gICAgVENvbGxlY3QgZXh0ZW5kcyBPcHRpb25PcHRpb25zW1wiY29sbGVjdFwiXSA9IHVuZGVmaW5lZCxcbiAgICBUQ29uZmxpY3RzIGV4dGVuZHMgT3B0aW9uT3B0aW9uc1tcImNvbmZsaWN0c1wiXSA9IHVuZGVmaW5lZCxcbiAgICBURGVmYXVsdFZhbHVlID0gdW5kZWZpbmVkLFxuICAgIFRNYXBwZWRWYWx1ZSA9IHVuZGVmaW5lZCxcbiAgPihcbiAgICBmbGFnczogVEZsYWdzLFxuICAgIGRlc2M6IHN0cmluZyxcbiAgICBvcHRzPzpcbiAgICAgIHwgT21pdDxcbiAgICAgICAgT3B0aW9uT3B0aW9uczxcbiAgICAgICAgICBNZXJnZU9wdGlvbnM8VEZsYWdzLCBUQ29tbWFuZE9wdGlvbnMsIFRNYXBwZWRPcHRpb25zPixcbiAgICAgICAgICBUQ29tbWFuZEFyZ3VtZW50cyxcbiAgICAgICAgICBUQ29tbWFuZEdsb2JhbHMsXG4gICAgICAgICAgVFBhcmVudENvbW1hbmRHbG9iYWxzLFxuICAgICAgICAgIFRDb21tYW5kVHlwZXMsXG4gICAgICAgICAgVENvbW1hbmRHbG9iYWxUeXBlcyxcbiAgICAgICAgICBUUGFyZW50Q29tbWFuZFR5cGVzLFxuICAgICAgICAgIFRQYXJlbnRDb21tYW5kXG4gICAgICAgID4sXG4gICAgICAgIFwidmFsdWVcIlxuICAgICAgPlxuICAgICAgICAmIHtcbiAgICAgICAgICBkZWZhdWx0PzogRGVmYXVsdFZhbHVlPFREZWZhdWx0VmFsdWU+O1xuICAgICAgICAgIHJlcXVpcmVkPzogVFJlcXVpcmVkO1xuICAgICAgICAgIGNvbGxlY3Q/OiBUQ29sbGVjdDtcbiAgICAgICAgICBjb25mbGljdHM/OiBUQ29uZmxpY3RzO1xuICAgICAgICAgIHZhbHVlPzogT3B0aW9uVmFsdWVIYW5kbGVyPE1hcFR5cGVzPFZhbHVlT2Y8VE9wdGlvbnM+PiwgVE1hcHBlZFZhbHVlPjtcbiAgICAgICAgfVxuICAgICAgfCBPcHRpb25WYWx1ZUhhbmRsZXI8TWFwVHlwZXM8VmFsdWVPZjxUT3B0aW9ucz4+LCBUTWFwcGVkVmFsdWU+LFxuICApOiBDb21tYW5kPFxuICAgIFRQYXJlbnRDb21tYW5kR2xvYmFscyxcbiAgICBUUGFyZW50Q29tbWFuZFR5cGVzLFxuICAgIE1lcmdlT3B0aW9uczxURmxhZ3MsIFRDb21tYW5kT3B0aW9ucywgVE1hcHBlZE9wdGlvbnM+LFxuICAgIFRDb21tYW5kQXJndW1lbnRzLFxuICAgIFRDb21tYW5kR2xvYmFscyxcbiAgICBUQ29tbWFuZFR5cGVzLFxuICAgIFRDb21tYW5kR2xvYmFsVHlwZXMsXG4gICAgVFBhcmVudENvbW1hbmRcbiAgPjtcblxuICBwdWJsaWMgb3B0aW9uKFxuICAgIGZsYWdzOiBzdHJpbmcsXG4gICAgZGVzYzogc3RyaW5nLFxuICAgIG9wdHM/OiBPcHRpb25PcHRpb25zIHwgT3B0aW9uVmFsdWVIYW5kbGVyLFxuICApOiBDb21tYW5kPGFueT4ge1xuICAgIGlmICh0eXBlb2Ygb3B0cyA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICByZXR1cm4gdGhpcy5vcHRpb24oZmxhZ3MsIGRlc2MsIHsgdmFsdWU6IG9wdHMgfSk7XG4gICAgfVxuXG4gICAgY29uc3QgcmVzdWx0ID0gc3BsaXRBcmd1bWVudHMoZmxhZ3MpO1xuXG4gICAgY29uc3QgYXJnczogQXJndW1lbnRbXSA9IHJlc3VsdC50eXBlRGVmaW5pdGlvblxuICAgICAgPyBwYXJzZUFyZ3VtZW50c0RlZmluaXRpb24ocmVzdWx0LnR5cGVEZWZpbml0aW9uKVxuICAgICAgOiBbXTtcblxuICAgIGNvbnN0IG9wdGlvbjogT3B0aW9uID0ge1xuICAgICAgLi4ub3B0cyxcbiAgICAgIG5hbWU6IFwiXCIsXG4gICAgICBkZXNjcmlwdGlvbjogZGVzYyxcbiAgICAgIGFyZ3MsXG4gICAgICBmbGFnczogcmVzdWx0LmZsYWdzLFxuICAgICAgZXF1YWxzU2lnbjogcmVzdWx0LmVxdWFsc1NpZ24sXG4gICAgICB0eXBlRGVmaW5pdGlvbjogcmVzdWx0LnR5cGVEZWZpbml0aW9uLFxuICAgICAgZ3JvdXBOYW1lOiB0aGlzLl9ncm91cE5hbWUsXG4gICAgfTtcblxuICAgIGlmIChvcHRpb24uc2VwYXJhdG9yKSB7XG4gICAgICBmb3IgKGNvbnN0IGFyZyBvZiBhcmdzKSB7XG4gICAgICAgIGlmIChhcmcubGlzdCkge1xuICAgICAgICAgIGFyZy5zZXBhcmF0b3IgPSBvcHRpb24uc2VwYXJhdG9yO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgZm9yIChjb25zdCBwYXJ0IG9mIG9wdGlvbi5mbGFncykge1xuICAgICAgY29uc3QgYXJnID0gcGFydC50cmltKCk7XG4gICAgICBjb25zdCBpc0xvbmcgPSAvXi0tLy50ZXN0KGFyZyk7XG4gICAgICBjb25zdCBuYW1lID0gaXNMb25nID8gYXJnLnNsaWNlKDIpIDogYXJnLnNsaWNlKDEpO1xuXG4gICAgICBpZiAodGhpcy5jbWQuZ2V0QmFzZU9wdGlvbihuYW1lLCB0cnVlKSkge1xuICAgICAgICBpZiAob3B0cz8ub3ZlcnJpZGUpIHtcbiAgICAgICAgICB0aGlzLnJlbW92ZU9wdGlvbihuYW1lKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRHVwbGljYXRlT3B0aW9uTmFtZUVycm9yKG5hbWUpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmICghb3B0aW9uLm5hbWUgJiYgaXNMb25nKSB7XG4gICAgICAgIG9wdGlvbi5uYW1lID0gbmFtZTtcbiAgICAgIH0gZWxzZSBpZiAoIW9wdGlvbi5hbGlhc2VzKSB7XG4gICAgICAgIG9wdGlvbi5hbGlhc2VzID0gW25hbWVdO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgb3B0aW9uLmFsaWFzZXMucHVzaChuYW1lKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAob3B0aW9uLnByZXBlbmQpIHtcbiAgICAgIHRoaXMuY21kLm9wdGlvbnMudW5zaGlmdChvcHRpb24pO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmNtZC5vcHRpb25zLnB1c2gob3B0aW9uKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGQgbmV3IGNvbW1hbmQgZXhhbXBsZS5cbiAgICogQHBhcmFtIG5hbWUgICAgICAgICAgTmFtZSBvZiB0aGUgZXhhbXBsZS5cbiAgICogQHBhcmFtIGRlc2NyaXB0aW9uICAgVGhlIGNvbnRlbnQgb2YgdGhlIGV4YW1wbGUuXG4gICAqL1xuICBwdWJsaWMgZXhhbXBsZShuYW1lOiBzdHJpbmcsIGRlc2NyaXB0aW9uOiBzdHJpbmcpOiB0aGlzIHtcbiAgICBpZiAodGhpcy5jbWQuaGFzRXhhbXBsZShuYW1lKSkge1xuICAgICAgdGhyb3cgbmV3IER1cGxpY2F0ZUV4YW1wbGVFcnJvcihuYW1lKTtcbiAgICB9XG5cbiAgICB0aGlzLmNtZC5leGFtcGxlcy5wdXNoKHsgbmFtZSwgZGVzY3JpcHRpb24gfSk7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHB1YmxpYyBnbG9iYWxFbnY8XG4gICAgVE5hbWVBbmRWYWx1ZSBleHRlbmRzIHN0cmluZyxcbiAgICBUR2xvYmFsRW52VmFycyBleHRlbmRzIFR5cGVkRW52PFxuICAgICAgVE5hbWVBbmRWYWx1ZSxcbiAgICAgIFRQcmVmaXgsXG4gICAgICBUQ29tbWFuZE9wdGlvbnMsXG4gICAgICBNZXJnZTxUUGFyZW50Q29tbWFuZFR5cGVzLCBNZXJnZTxUQ29tbWFuZEdsb2JhbFR5cGVzLCBUQ29tbWFuZFR5cGVzPj4sXG4gICAgICBUUmVxdWlyZWRcbiAgICA+LFxuICAgIFRNYXBwZWRHbG9iYWxFbnZWYXJzIGV4dGVuZHMgTWFwVmFsdWU8VEdsb2JhbEVudlZhcnMsIFRNYXBwZWRWYWx1ZT4sXG4gICAgVFJlcXVpcmVkIGV4dGVuZHMgRW52VmFyT3B0aW9uc1tcInJlcXVpcmVkXCJdID0gdW5kZWZpbmVkLFxuICAgIFRQcmVmaXggZXh0ZW5kcyBFbnZWYXJPcHRpb25zW1wicHJlZml4XCJdID0gdW5kZWZpbmVkLFxuICAgIFRNYXBwZWRWYWx1ZSA9IHVuZGVmaW5lZCxcbiAgPihcbiAgICBuYW1lOiBUTmFtZUFuZFZhbHVlLFxuICAgIGRlc2NyaXB0aW9uOiBzdHJpbmcsXG4gICAgb3B0aW9ucz86IE9taXQ8R2xvYmFsRW52VmFyT3B0aW9ucywgXCJ2YWx1ZVwiPiAmIHtcbiAgICAgIHJlcXVpcmVkPzogVFJlcXVpcmVkO1xuICAgICAgcHJlZml4PzogVFByZWZpeDtcbiAgICAgIHZhbHVlPzogRW52VmFyVmFsdWVIYW5kbGVyPFxuICAgICAgICBNYXBUeXBlczxWYWx1ZU9mPFRHbG9iYWxFbnZWYXJzPj4sXG4gICAgICAgIFRNYXBwZWRWYWx1ZVxuICAgICAgPjtcbiAgICB9LFxuICApOiBDb21tYW5kPFxuICAgIFRQYXJlbnRDb21tYW5kR2xvYmFscyxcbiAgICBUUGFyZW50Q29tbWFuZFR5cGVzLFxuICAgIFRDb21tYW5kT3B0aW9ucyxcbiAgICBUQ29tbWFuZEFyZ3VtZW50cyxcbiAgICBNZXJnZTxUQ29tbWFuZEdsb2JhbHMsIFRNYXBwZWRHbG9iYWxFbnZWYXJzPixcbiAgICBUQ29tbWFuZFR5cGVzLFxuICAgIFRDb21tYW5kR2xvYmFsVHlwZXMsXG4gICAgVFBhcmVudENvbW1hbmRcbiAgPiB7XG4gICAgcmV0dXJuIHRoaXMuZW52KFxuICAgICAgbmFtZSxcbiAgICAgIGRlc2NyaXB0aW9uLFxuICAgICAgeyAuLi5vcHRpb25zLCBnbG9iYWw6IHRydWUgfSBhcyBFbnZWYXJPcHRpb25zLFxuICAgICkgYXMgQ29tbWFuZDxhbnk+O1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZCBuZXcgZW52aXJvbm1lbnQgdmFyaWFibGUuXG4gICAqIEBwYXJhbSBuYW1lICAgICAgICAgIE5hbWUgb2YgdGhlIGVudmlyb25tZW50IHZhcmlhYmxlLlxuICAgKiBAcGFyYW0gZGVzY3JpcHRpb24gICBUaGUgZGVzY3JpcHRpb24gb2YgdGhlIGVudmlyb25tZW50IHZhcmlhYmxlLlxuICAgKiBAcGFyYW0gb3B0aW9ucyAgICAgICBFbnZpcm9ubWVudCB2YXJpYWJsZSBvcHRpb25zLlxuICAgKi9cbiAgcHVibGljIGVudjxcbiAgICBOIGV4dGVuZHMgc3RyaW5nLFxuICAgIEcgZXh0ZW5kcyBUeXBlZEVudjxcbiAgICAgIE4sXG4gICAgICBQLFxuICAgICAgVENvbW1hbmRPcHRpb25zLFxuICAgICAgTWVyZ2U8VFBhcmVudENvbW1hbmRUeXBlcywgTWVyZ2U8VENvbW1hbmRHbG9iYWxUeXBlcywgVENvbW1hbmRUeXBlcz4+LFxuICAgICAgUlxuICAgID4sXG4gICAgTUcgZXh0ZW5kcyBNYXBWYWx1ZTxHLCBWPixcbiAgICBSIGV4dGVuZHMgRW52VmFyT3B0aW9uc1tcInJlcXVpcmVkXCJdID0gdW5kZWZpbmVkLFxuICAgIFAgZXh0ZW5kcyBFbnZWYXJPcHRpb25zW1wicHJlZml4XCJdID0gdW5kZWZpbmVkLFxuICAgIFYgPSB1bmRlZmluZWQsXG4gID4oXG4gICAgbmFtZTogTixcbiAgICBkZXNjcmlwdGlvbjogc3RyaW5nLFxuICAgIG9wdGlvbnM6IE9taXQ8RW52VmFyT3B0aW9ucywgXCJ2YWx1ZVwiPiAmIHtcbiAgICAgIGdsb2JhbDogdHJ1ZTtcbiAgICAgIHJlcXVpcmVkPzogUjtcbiAgICAgIHByZWZpeD86IFA7XG4gICAgICB2YWx1ZT86IEVudlZhclZhbHVlSGFuZGxlcjxNYXBUeXBlczxWYWx1ZU9mPEc+PiwgVj47XG4gICAgfSxcbiAgKTogQ29tbWFuZDxcbiAgICBUUGFyZW50Q29tbWFuZEdsb2JhbHMsXG4gICAgVFBhcmVudENvbW1hbmRUeXBlcyxcbiAgICBUQ29tbWFuZE9wdGlvbnMsXG4gICAgVENvbW1hbmRBcmd1bWVudHMsXG4gICAgTWVyZ2U8VENvbW1hbmRHbG9iYWxzLCBNRz4sXG4gICAgVENvbW1hbmRUeXBlcyxcbiAgICBUQ29tbWFuZEdsb2JhbFR5cGVzLFxuICAgIFRQYXJlbnRDb21tYW5kXG4gID47XG5cbiAgcHVibGljIGVudjxcbiAgICBUTmFtZUFuZFZhbHVlIGV4dGVuZHMgc3RyaW5nLFxuICAgIFRFbnZWYXIgZXh0ZW5kcyBUeXBlZEVudjxcbiAgICAgIFROYW1lQW5kVmFsdWUsXG4gICAgICBUUHJlZml4LFxuICAgICAgVENvbW1hbmRPcHRpb25zLFxuICAgICAgTWVyZ2U8VFBhcmVudENvbW1hbmRUeXBlcywgTWVyZ2U8VENvbW1hbmRHbG9iYWxUeXBlcywgVENvbW1hbmRUeXBlcz4+LFxuICAgICAgVFJlcXVpcmVkXG4gICAgPixcbiAgICBUTWFwcGVkRW52VmFyIGV4dGVuZHMgTWFwVmFsdWU8VEVudlZhciwgVE1hcHBlZFZhbHVlPixcbiAgICBUUmVxdWlyZWQgZXh0ZW5kcyBFbnZWYXJPcHRpb25zW1wicmVxdWlyZWRcIl0gPSB1bmRlZmluZWQsXG4gICAgVFByZWZpeCBleHRlbmRzIEVudlZhck9wdGlvbnNbXCJwcmVmaXhcIl0gPSB1bmRlZmluZWQsXG4gICAgVE1hcHBlZFZhbHVlID0gdW5kZWZpbmVkLFxuICA+KFxuICAgIG5hbWU6IFROYW1lQW5kVmFsdWUsXG4gICAgZGVzY3JpcHRpb246IHN0cmluZyxcbiAgICBvcHRpb25zPzogT21pdDxFbnZWYXJPcHRpb25zLCBcInZhbHVlXCI+ICYge1xuICAgICAgcmVxdWlyZWQ/OiBUUmVxdWlyZWQ7XG4gICAgICBwcmVmaXg/OiBUUHJlZml4O1xuICAgICAgdmFsdWU/OiBFbnZWYXJWYWx1ZUhhbmRsZXI8TWFwVHlwZXM8VmFsdWVPZjxURW52VmFyPj4sIFRNYXBwZWRWYWx1ZT47XG4gICAgfSxcbiAgKTogQ29tbWFuZDxcbiAgICBUUGFyZW50Q29tbWFuZEdsb2JhbHMsXG4gICAgVFBhcmVudENvbW1hbmRUeXBlcyxcbiAgICBNZXJnZTxUQ29tbWFuZE9wdGlvbnMsIFRNYXBwZWRFbnZWYXI+LFxuICAgIFRDb21tYW5kQXJndW1lbnRzLFxuICAgIFRDb21tYW5kR2xvYmFscyxcbiAgICBUQ29tbWFuZFR5cGVzLFxuICAgIFRDb21tYW5kR2xvYmFsVHlwZXMsXG4gICAgVFBhcmVudENvbW1hbmRcbiAgPjtcblxuICBwdWJsaWMgZW52KFxuICAgIG5hbWU6IHN0cmluZyxcbiAgICBkZXNjcmlwdGlvbjogc3RyaW5nLFxuICAgIG9wdGlvbnM/OiBFbnZWYXJPcHRpb25zLFxuICApOiBDb21tYW5kPGFueT4ge1xuICAgIGNvbnN0IHJlc3VsdCA9IHNwbGl0QXJndW1lbnRzKG5hbWUpO1xuXG4gICAgaWYgKCFyZXN1bHQudHlwZURlZmluaXRpb24pIHtcbiAgICAgIHJlc3VsdC50eXBlRGVmaW5pdGlvbiA9IFwiPHZhbHVlOmJvb2xlYW4+XCI7XG4gICAgfVxuXG4gICAgaWYgKHJlc3VsdC5mbGFncy5zb21lKChlbnZOYW1lKSA9PiB0aGlzLmNtZC5nZXRCYXNlRW52VmFyKGVudk5hbWUsIHRydWUpKSkge1xuICAgICAgdGhyb3cgbmV3IER1cGxpY2F0ZUVudlZhckVycm9yKG5hbWUpO1xuICAgIH1cblxuICAgIGNvbnN0IGRldGFpbHM6IEFyZ3VtZW50W10gPSBwYXJzZUFyZ3VtZW50c0RlZmluaXRpb24oXG4gICAgICByZXN1bHQudHlwZURlZmluaXRpb24sXG4gICAgKTtcblxuICAgIGlmIChkZXRhaWxzLmxlbmd0aCA+IDEpIHtcbiAgICAgIHRocm93IG5ldyBUb29NYW55RW52VmFyVmFsdWVzRXJyb3IobmFtZSk7XG4gICAgfSBlbHNlIGlmIChkZXRhaWxzLmxlbmd0aCAmJiBkZXRhaWxzWzBdLm9wdGlvbmFsVmFsdWUpIHtcbiAgICAgIHRocm93IG5ldyBVbmV4cGVjdGVkT3B0aW9uYWxFbnZWYXJWYWx1ZUVycm9yKG5hbWUpO1xuICAgIH0gZWxzZSBpZiAoZGV0YWlscy5sZW5ndGggJiYgZGV0YWlsc1swXS52YXJpYWRpYykge1xuICAgICAgdGhyb3cgbmV3IFVuZXhwZWN0ZWRWYXJpYWRpY0VudlZhclZhbHVlRXJyb3IobmFtZSk7XG4gICAgfVxuXG4gICAgdGhpcy5jbWQuZW52VmFycy5wdXNoKHtcbiAgICAgIG5hbWU6IHJlc3VsdC5mbGFnc1swXSxcbiAgICAgIG5hbWVzOiByZXN1bHQuZmxhZ3MsXG4gICAgICBkZXNjcmlwdGlvbixcbiAgICAgIHR5cGU6IGRldGFpbHNbMF0udHlwZSxcbiAgICAgIGRldGFpbHM6IGRldGFpbHMuc2hpZnQoKSBhcyBBcmd1bWVudCxcbiAgICAgIC4uLm9wdGlvbnMsXG4gICAgfSk7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICAgKioqKiBNQUlOIEhBTkRMRVIgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAgICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG4gIC8qKlxuICAgKiBQYXJzZSBjb21tYW5kIGxpbmUgYXJndW1lbnRzIGFuZCBleGVjdXRlIG1hdGNoZWQgY29tbWFuZC5cbiAgICogQHBhcmFtIGFyZ3MgQ29tbWFuZCBsaW5lIGFyZ3MgdG8gcGFyc2UuIEV4OiBgY21kLnBhcnNlKCBEZW5vLmFyZ3MgKWBcbiAgICovXG4gIHB1YmxpYyBwYXJzZShcbiAgICBhcmdzOiBzdHJpbmdbXSA9IERlbm8uYXJncyxcbiAgKTogUHJvbWlzZTxcbiAgICBUUGFyZW50Q29tbWFuZCBleHRlbmRzIENvbW1hbmQ8YW55PiA/IENvbW1hbmRSZXN1bHQ8XG4gICAgICAgIFJlY29yZDxzdHJpbmcsIHVua25vd24+LFxuICAgICAgICBBcnJheTx1bmtub3duPixcbiAgICAgICAgUmVjb3JkPHN0cmluZywgdW5rbm93bj4sXG4gICAgICAgIFJlY29yZDxzdHJpbmcsIHVua25vd24+LFxuICAgICAgICBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPixcbiAgICAgICAgUmVjb3JkPHN0cmluZywgdW5rbm93bj4sXG4gICAgICAgIFJlY29yZDxzdHJpbmcsIHVua25vd24+LFxuICAgICAgICB1bmRlZmluZWRcbiAgICAgID5cbiAgICAgIDogQ29tbWFuZFJlc3VsdDxcbiAgICAgICAgTWFwVHlwZXM8VENvbW1hbmRPcHRpb25zPixcbiAgICAgICAgTWFwVHlwZXM8VENvbW1hbmRBcmd1bWVudHM+LFxuICAgICAgICBNYXBUeXBlczxUQ29tbWFuZEdsb2JhbHM+LFxuICAgICAgICBNYXBUeXBlczxUUGFyZW50Q29tbWFuZEdsb2JhbHM+LFxuICAgICAgICBUQ29tbWFuZFR5cGVzLFxuICAgICAgICBUQ29tbWFuZEdsb2JhbFR5cGVzLFxuICAgICAgICBUUGFyZW50Q29tbWFuZFR5cGVzLFxuICAgICAgICBUUGFyZW50Q29tbWFuZFxuICAgICAgPlxuICA+IHtcbiAgICBjb25zdCBjdHg6IFBhcnNlQ29udGV4dCA9IHtcbiAgICAgIHVua25vd246IGFyZ3Muc2xpY2UoKSxcbiAgICAgIGZsYWdzOiB7fSxcbiAgICAgIGVudjoge30sXG4gICAgICBsaXRlcmFsOiBbXSxcbiAgICAgIHN0b3BFYXJseTogZmFsc2UsXG4gICAgICBzdG9wT25Vbmtub3duOiBmYWxzZSxcbiAgICB9O1xuICAgIHJldHVybiB0aGlzLnBhcnNlQ29tbWFuZChjdHgpIGFzIGFueTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgcGFyc2VDb21tYW5kKGN0eDogUGFyc2VDb250ZXh0KTogUHJvbWlzZTxDb21tYW5kUmVzdWx0PiB7XG4gICAgdHJ5IHtcbiAgICAgIHRoaXMucmVzZXQoKTtcbiAgICAgIHRoaXMucmVnaXN0ZXJEZWZhdWx0cygpO1xuICAgICAgdGhpcy5yYXdBcmdzID0gY3R4LnVua25vd24uc2xpY2UoKTtcblxuICAgICAgaWYgKHRoaXMuaXNFeGVjdXRhYmxlKSB7XG4gICAgICAgIGF3YWl0IHRoaXMuZXhlY3V0ZUV4ZWN1dGFibGUoY3R4LnVua25vd24pO1xuICAgICAgICByZXR1cm4geyBvcHRpb25zOiB7fSwgYXJnczogW10sIGNtZDogdGhpcywgbGl0ZXJhbDogW10gfSBhcyBhbnk7XG4gICAgICB9IGVsc2UgaWYgKHRoaXMuX3VzZVJhd0FyZ3MpIHtcbiAgICAgICAgYXdhaXQgdGhpcy5wYXJzZUVudlZhcnMoY3R4LCB0aGlzLmVudlZhcnMpO1xuICAgICAgICByZXR1cm4gdGhpcy5leGVjdXRlKGN0eC5lbnYsIC4uLmN0eC51bmtub3duKSBhcyBhbnk7XG4gICAgICB9XG5cbiAgICAgIGxldCBwcmVQYXJzZUdsb2JhbHMgPSBmYWxzZTtcbiAgICAgIGxldCBzdWJDb21tYW5kOiBDb21tYW5kPGFueT4gfCB1bmRlZmluZWQ7XG5cbiAgICAgIC8vIFByZSBwYXJzZSBnbG9iYWxzIHRvIHN1cHBvcnQ6IGNtZCAtLWdsb2JhbC1vcHRpb24gc3ViLWNvbW1hbmQgLS1vcHRpb25cbiAgICAgIGlmIChjdHgudW5rbm93bi5sZW5ndGggPiAwKSB7XG4gICAgICAgIC8vIERldGVjdCBzdWIgY29tbWFuZC5cbiAgICAgICAgc3ViQ29tbWFuZCA9IHRoaXMuZ2V0U3ViQ29tbWFuZChjdHgpO1xuXG4gICAgICAgIGlmICghc3ViQ29tbWFuZCkge1xuICAgICAgICAgIC8vIE9ubHkgcHJlIHBhcnNlIGdsb2JhbHMgaWYgZmlyc3QgYXJnIGlzdCBhIGdsb2JhbCBvcHRpb24uXG4gICAgICAgICAgY29uc3Qgb3B0aW9uTmFtZSA9IGN0eC51bmtub3duWzBdLnJlcGxhY2UoL14tKy8sIFwiXCIpO1xuICAgICAgICAgIGNvbnN0IG9wdGlvbiA9IHRoaXMuZ2V0T3B0aW9uKG9wdGlvbk5hbWUsIHRydWUpO1xuXG4gICAgICAgICAgaWYgKG9wdGlvbj8uZ2xvYmFsKSB7XG4gICAgICAgICAgICBwcmVQYXJzZUdsb2JhbHMgPSB0cnVlO1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5wYXJzZUdsb2JhbE9wdGlvbnNBbmRFbnZWYXJzKGN0eCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmIChzdWJDb21tYW5kIHx8IGN0eC51bmtub3duLmxlbmd0aCA+IDApIHtcbiAgICAgICAgc3ViQ29tbWFuZCA/Pz0gdGhpcy5nZXRTdWJDb21tYW5kKGN0eCk7XG5cbiAgICAgICAgaWYgKHN1YkNvbW1hbmQpIHtcbiAgICAgICAgICBzdWJDb21tYW5kLl9nbG9iYWxQYXJlbnQgPSB0aGlzO1xuICAgICAgICAgIHJldHVybiBzdWJDb21tYW5kLnBhcnNlQ29tbWFuZChjdHgpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIFBhcnNlIHJlc3Qgb3B0aW9ucyAmIGVudiB2YXJzLlxuICAgICAgYXdhaXQgdGhpcy5wYXJzZU9wdGlvbnNBbmRFbnZWYXJzKGN0eCwgcHJlUGFyc2VHbG9iYWxzKTtcbiAgICAgIGNvbnN0IG9wdGlvbnMgPSB7IC4uLmN0eC5lbnYsIC4uLmN0eC5mbGFncyB9O1xuICAgICAgY29uc3QgYXJncyA9IHRoaXMucGFyc2VBcmd1bWVudHMoY3R4LCBvcHRpb25zKTtcbiAgICAgIHRoaXMubGl0ZXJhbEFyZ3MgPSBjdHgubGl0ZXJhbDtcblxuICAgICAgLy8gRXhlY3V0ZSBvcHRpb24gYWN0aW9uLlxuICAgICAgaWYgKGN0eC5hY3Rpb24pIHtcbiAgICAgICAgYXdhaXQgY3R4LmFjdGlvbi5hY3Rpb24uY2FsbCh0aGlzLCBvcHRpb25zLCAuLi5hcmdzKTtcblxuICAgICAgICBpZiAoY3R4LmFjdGlvbi5zdGFuZGFsb25lKSB7XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIG9wdGlvbnMsXG4gICAgICAgICAgICBhcmdzLFxuICAgICAgICAgICAgY21kOiB0aGlzLFxuICAgICAgICAgICAgbGl0ZXJhbDogdGhpcy5saXRlcmFsQXJncyxcbiAgICAgICAgICB9IGFzIGFueTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gYXdhaXQgdGhpcy5leGVjdXRlKG9wdGlvbnMsIC4uLmFyZ3MpIGFzIGFueTtcbiAgICB9IGNhdGNoIChlcnJvcjogdW5rbm93bikge1xuICAgICAgdGhpcy5oYW5kbGVFcnJvcihlcnJvcik7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBnZXRTdWJDb21tYW5kKGN0eDogUGFyc2VDb250ZXh0KSB7XG4gICAgY29uc3Qgc3ViQ29tbWFuZCA9IHRoaXMuZ2V0Q29tbWFuZChjdHgudW5rbm93blswXSwgdHJ1ZSk7XG5cbiAgICBpZiAoc3ViQ29tbWFuZCkge1xuICAgICAgY3R4LnVua25vd24uc2hpZnQoKTtcbiAgICB9XG5cbiAgICByZXR1cm4gc3ViQ29tbWFuZDtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgcGFyc2VHbG9iYWxPcHRpb25zQW5kRW52VmFycyhcbiAgICBjdHg6IFBhcnNlQ29udGV4dCxcbiAgKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgaXNIZWxwT3B0aW9uID0gdGhpcy5nZXRIZWxwT3B0aW9uKCk/LmZsYWdzLmluY2x1ZGVzKGN0eC51bmtub3duWzBdKTtcblxuICAgIC8vIFBhcnNlIGdsb2JhbCBlbnYgdmFycy5cbiAgICBjb25zdCBlbnZWYXJzID0gW1xuICAgICAgLi4udGhpcy5lbnZWYXJzLmZpbHRlcigoZW52VmFyKSA9PiBlbnZWYXIuZ2xvYmFsKSxcbiAgICAgIC4uLnRoaXMuZ2V0R2xvYmFsRW52VmFycyh0cnVlKSxcbiAgICBdO1xuXG4gICAgYXdhaXQgdGhpcy5wYXJzZUVudlZhcnMoY3R4LCBlbnZWYXJzLCAhaXNIZWxwT3B0aW9uKTtcblxuICAgIC8vIFBhcnNlIGdsb2JhbCBvcHRpb25zLlxuICAgIGNvbnN0IG9wdGlvbnMgPSBbXG4gICAgICAuLi50aGlzLm9wdGlvbnMuZmlsdGVyKChvcHRpb24pID0+IG9wdGlvbi5nbG9iYWwpLFxuICAgICAgLi4udGhpcy5nZXRHbG9iYWxPcHRpb25zKHRydWUpLFxuICAgIF07XG5cbiAgICB0aGlzLnBhcnNlT3B0aW9ucyhjdHgsIG9wdGlvbnMsIHtcbiAgICAgIHN0b3BFYXJseTogdHJ1ZSxcbiAgICAgIHN0b3BPblVua25vd246IHRydWUsXG4gICAgICBkb3R0ZWQ6IGZhbHNlLFxuICAgIH0pO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBwYXJzZU9wdGlvbnNBbmRFbnZWYXJzKFxuICAgIGN0eDogUGFyc2VDb250ZXh0LFxuICAgIHByZVBhcnNlR2xvYmFsczogYm9vbGVhbixcbiAgKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgaGVscE9wdGlvbiA9IHRoaXMuZ2V0SGVscE9wdGlvbigpO1xuICAgIGNvbnN0IGlzVmVyc2lvbk9wdGlvbiA9IHRoaXMuX3ZlcnNpb25PcHRpb24/LmZsYWdzLmluY2x1ZGVzKGN0eC51bmtub3duWzBdKTtcbiAgICBjb25zdCBpc0hlbHBPcHRpb24gPSBoZWxwT3B0aW9uICYmIGN0eC5mbGFncz8uW2hlbHBPcHRpb24ubmFtZV0gPT09IHRydWU7XG5cbiAgICAvLyBQYXJzZSBlbnYgdmFycy5cbiAgICBjb25zdCBlbnZWYXJzID0gcHJlUGFyc2VHbG9iYWxzXG4gICAgICA/IHRoaXMuZW52VmFycy5maWx0ZXIoKGVudlZhcikgPT4gIWVudlZhci5nbG9iYWwpXG4gICAgICA6IHRoaXMuZ2V0RW52VmFycyh0cnVlKTtcblxuICAgIGF3YWl0IHRoaXMucGFyc2VFbnZWYXJzKFxuICAgICAgY3R4LFxuICAgICAgZW52VmFycyxcbiAgICAgICFpc0hlbHBPcHRpb24gJiYgIWlzVmVyc2lvbk9wdGlvbixcbiAgICApO1xuXG4gICAgLy8gUGFyc2Ugb3B0aW9ucy5cbiAgICBjb25zdCBvcHRpb25zID0gdGhpcy5nZXRPcHRpb25zKHRydWUpO1xuXG4gICAgdGhpcy5wYXJzZU9wdGlvbnMoY3R4LCBvcHRpb25zKTtcbiAgfVxuXG4gIC8qKiBSZWdpc3RlciBkZWZhdWx0IG9wdGlvbnMgbGlrZSBgLS12ZXJzaW9uYCBhbmQgYC0taGVscGAuICovXG4gIHByaXZhdGUgcmVnaXN0ZXJEZWZhdWx0cygpOiB0aGlzIHtcbiAgICBpZiAodGhpcy5oYXNEZWZhdWx0cyB8fCB0aGlzLmdldFBhcmVudCgpKSB7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgdGhpcy5oYXNEZWZhdWx0cyA9IHRydWU7XG5cbiAgICB0aGlzLnJlc2V0KCk7XG5cbiAgICAhdGhpcy50eXBlcy5oYXMoXCJzdHJpbmdcIikgJiZcbiAgICAgIHRoaXMudHlwZShcInN0cmluZ1wiLCBuZXcgU3RyaW5nVHlwZSgpLCB7IGdsb2JhbDogdHJ1ZSB9KTtcbiAgICAhdGhpcy50eXBlcy5oYXMoXCJudW1iZXJcIikgJiZcbiAgICAgIHRoaXMudHlwZShcIm51bWJlclwiLCBuZXcgTnVtYmVyVHlwZSgpLCB7IGdsb2JhbDogdHJ1ZSB9KTtcbiAgICAhdGhpcy50eXBlcy5oYXMoXCJpbnRlZ2VyXCIpICYmXG4gICAgICB0aGlzLnR5cGUoXCJpbnRlZ2VyXCIsIG5ldyBJbnRlZ2VyVHlwZSgpLCB7IGdsb2JhbDogdHJ1ZSB9KTtcbiAgICAhdGhpcy50eXBlcy5oYXMoXCJib29sZWFuXCIpICYmXG4gICAgICB0aGlzLnR5cGUoXCJib29sZWFuXCIsIG5ldyBCb29sZWFuVHlwZSgpLCB7IGdsb2JhbDogdHJ1ZSB9KTtcbiAgICAhdGhpcy50eXBlcy5oYXMoXCJmaWxlXCIpICYmXG4gICAgICB0aGlzLnR5cGUoXCJmaWxlXCIsIG5ldyBGaWxlVHlwZSgpLCB7IGdsb2JhbDogdHJ1ZSB9KTtcblxuICAgIGlmICghdGhpcy5faGVscCkge1xuICAgICAgdGhpcy5oZWxwKHtcbiAgICAgICAgaGludHM6IHRydWUsXG4gICAgICAgIHR5cGVzOiBmYWxzZSxcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGlmICh0aGlzLl92ZXJzaW9uT3B0aW9ucyAhPT0gZmFsc2UgJiYgKHRoaXMuX3ZlcnNpb25PcHRpb25zIHx8IHRoaXMudmVyKSkge1xuICAgICAgdGhpcy5vcHRpb24oXG4gICAgICAgIHRoaXMuX3ZlcnNpb25PcHRpb25zPy5mbGFncyB8fCBcIi1WLCAtLXZlcnNpb25cIixcbiAgICAgICAgdGhpcy5fdmVyc2lvbk9wdGlvbnM/LmRlc2MgfHxcbiAgICAgICAgICBcIlNob3cgdGhlIHZlcnNpb24gbnVtYmVyIGZvciB0aGlzIHByb2dyYW0uXCIsXG4gICAgICAgIHtcbiAgICAgICAgICBzdGFuZGFsb25lOiB0cnVlLFxuICAgICAgICAgIHByZXBlbmQ6IHRydWUsXG4gICAgICAgICAgYWN0aW9uOiBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBjb25zdCBsb25nID0gdGhpcy5nZXRSYXdBcmdzKCkuaW5jbHVkZXMoXG4gICAgICAgICAgICAgIGAtLSR7dGhpcy5fdmVyc2lvbk9wdGlvbj8ubmFtZX1gLFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIGlmIChsb25nKSB7XG4gICAgICAgICAgICAgIGF3YWl0IHRoaXMuY2hlY2tWZXJzaW9uKCk7XG4gICAgICAgICAgICAgIHRoaXMuc2hvd0xvbmdWZXJzaW9uKCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICB0aGlzLnNob3dWZXJzaW9uKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLmV4aXQoKTtcbiAgICAgICAgICB9LFxuICAgICAgICAgIC4uLih0aGlzLl92ZXJzaW9uT3B0aW9ucz8ub3B0cyA/PyB7fSksXG4gICAgICAgIH0sXG4gICAgICApO1xuICAgICAgdGhpcy5fdmVyc2lvbk9wdGlvbiA9IHRoaXMub3B0aW9uc1swXTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5faGVscE9wdGlvbnMgIT09IGZhbHNlKSB7XG4gICAgICB0aGlzLm9wdGlvbihcbiAgICAgICAgdGhpcy5faGVscE9wdGlvbnM/LmZsYWdzIHx8IFwiLWgsIC0taGVscFwiLFxuICAgICAgICB0aGlzLl9oZWxwT3B0aW9ucz8uZGVzYyB8fCBcIlNob3cgdGhpcyBoZWxwLlwiLFxuICAgICAgICB7XG4gICAgICAgICAgc3RhbmRhbG9uZTogdHJ1ZSxcbiAgICAgICAgICBnbG9iYWw6IHRydWUsXG4gICAgICAgICAgcHJlcGVuZDogdHJ1ZSxcbiAgICAgICAgICBhY3Rpb246IGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGNvbnN0IGxvbmcgPSB0aGlzLmdldFJhd0FyZ3MoKS5pbmNsdWRlcyhcbiAgICAgICAgICAgICAgYC0tJHt0aGlzLmdldEhlbHBPcHRpb24oKT8ubmFtZX1gLFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuY2hlY2tWZXJzaW9uKCk7XG4gICAgICAgICAgICB0aGlzLnNob3dIZWxwKHsgbG9uZyB9KTtcbiAgICAgICAgICAgIHRoaXMuZXhpdCgpO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgLi4uKHRoaXMuX2hlbHBPcHRpb25zPy5vcHRzID8/IHt9KSxcbiAgICAgICAgfSxcbiAgICAgICk7XG4gICAgICB0aGlzLl9oZWxwT3B0aW9uID0gdGhpcy5vcHRpb25zWzBdO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIEV4ZWN1dGUgY29tbWFuZC5cbiAgICogQHBhcmFtIG9wdGlvbnMgQSBtYXAgb2Ygb3B0aW9ucy5cbiAgICogQHBhcmFtIGFyZ3MgQ29tbWFuZCBhcmd1bWVudHMuXG4gICAqL1xuICBwcm90ZWN0ZWQgYXN5bmMgZXhlY3V0ZShcbiAgICBvcHRpb25zOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPixcbiAgICAuLi5hcmdzOiBBcnJheTx1bmtub3duPlxuICApOiBQcm9taXNlPENvbW1hbmRSZXN1bHQ+IHtcbiAgICBpZiAodGhpcy5mbikge1xuICAgICAgYXdhaXQgdGhpcy5mbihvcHRpb25zLCAuLi5hcmdzKTtcbiAgICB9IGVsc2UgaWYgKHRoaXMuZGVmYXVsdENvbW1hbmQpIHtcbiAgICAgIGNvbnN0IGNtZCA9IHRoaXMuZ2V0Q29tbWFuZCh0aGlzLmRlZmF1bHRDb21tYW5kLCB0cnVlKTtcblxuICAgICAgaWYgKCFjbWQpIHtcbiAgICAgICAgdGhyb3cgbmV3IERlZmF1bHRDb21tYW5kTm90Rm91bmRFcnJvcihcbiAgICAgICAgICB0aGlzLmRlZmF1bHRDb21tYW5kLFxuICAgICAgICAgIHRoaXMuZ2V0Q29tbWFuZHMoKSxcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICAgIGNtZC5fZ2xvYmFsUGFyZW50ID0gdGhpcztcblxuICAgICAgcmV0dXJuIGNtZC5leGVjdXRlKG9wdGlvbnMsIC4uLmFyZ3MpO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICBvcHRpb25zLFxuICAgICAgYXJncyxcbiAgICAgIGNtZDogdGhpcyxcbiAgICAgIGxpdGVyYWw6IHRoaXMubGl0ZXJhbEFyZ3MsXG4gICAgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiBFeGVjdXRlIGV4dGVybmFsIHN1Yi1jb21tYW5kLlxuICAgKiBAcGFyYW0gYXJncyBSYXcgY29tbWFuZCBsaW5lIGFyZ3VtZW50cy5cbiAgICovXG4gIHByb3RlY3RlZCBhc3luYyBleGVjdXRlRXhlY3V0YWJsZShhcmdzOiBzdHJpbmdbXSkge1xuICAgIGNvbnN0IGNvbW1hbmQgPSB0aGlzLmdldFBhdGgoKS5yZXBsYWNlKC9cXHMrL2csIFwiLVwiKTtcblxuICAgIGF3YWl0IERlbm8ucGVybWlzc2lvbnMucmVxdWVzdCh7IG5hbWU6IFwicnVuXCIsIGNvbW1hbmQgfSk7XG5cbiAgICB0cnkge1xuICAgICAgY29uc3QgcHJvY2VzczogRGVuby5Qcm9jZXNzID0gRGVuby5ydW4oe1xuICAgICAgICBjbWQ6IFtjb21tYW5kLCAuLi5hcmdzXSxcbiAgICAgIH0pO1xuICAgICAgY29uc3Qgc3RhdHVzOiBEZW5vLlByb2Nlc3NTdGF0dXMgPSBhd2FpdCBwcm9jZXNzLnN0YXR1cygpO1xuXG4gICAgICBpZiAoIXN0YXR1cy5zdWNjZXNzKSB7XG4gICAgICAgIERlbm8uZXhpdChzdGF0dXMuY29kZSk7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGlmIChlcnJvciBpbnN0YW5jZW9mIERlbm8uZXJyb3JzLk5vdEZvdW5kKSB7XG4gICAgICAgIHRocm93IG5ldyBDb21tYW5kRXhlY3V0YWJsZU5vdEZvdW5kRXJyb3IoY29tbWFuZCk7XG4gICAgICB9XG4gICAgICB0aHJvdyBlcnJvcjtcbiAgICB9XG4gIH1cblxuICAvKiogUGFyc2UgcmF3IGNvbW1hbmQgbGluZSBhcmd1bWVudHMuICovXG4gIHByb3RlY3RlZCBwYXJzZU9wdGlvbnMoXG4gICAgY3R4OiBQYXJzZUNvbnRleHQsXG4gICAgb3B0aW9uczogT3B0aW9uW10sXG4gICAge1xuICAgICAgc3RvcEVhcmx5ID0gdGhpcy5fc3RvcEVhcmx5LFxuICAgICAgc3RvcE9uVW5rbm93biA9IGZhbHNlLFxuICAgICAgZG90dGVkID0gdHJ1ZSxcbiAgICB9OiBQYXJzZU9wdGlvbnNPcHRpb25zID0ge30sXG4gICk6IHZvaWQge1xuICAgIHBhcnNlRmxhZ3MoY3R4LCB7XG4gICAgICBzdG9wRWFybHksXG4gICAgICBzdG9wT25Vbmtub3duLFxuICAgICAgZG90dGVkLFxuICAgICAgYWxsb3dFbXB0eTogdGhpcy5fYWxsb3dFbXB0eSxcbiAgICAgIGZsYWdzOiBvcHRpb25zLFxuICAgICAgaWdub3JlRGVmYXVsdHM6IGN0eC5lbnYsXG4gICAgICBwYXJzZTogKHR5cGU6IEFyZ3VtZW50VmFsdWUpID0+IHRoaXMucGFyc2VUeXBlKHR5cGUpLFxuICAgICAgb3B0aW9uOiAob3B0aW9uOiBPcHRpb24pID0+IHtcbiAgICAgICAgaWYgKCFjdHguYWN0aW9uICYmIG9wdGlvbi5hY3Rpb24pIHtcbiAgICAgICAgICBjdHguYWN0aW9uID0gb3B0aW9uIGFzIEFjdGlvbk9wdGlvbjtcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICB9KTtcbiAgfVxuXG4gIC8qKiBQYXJzZSBhcmd1bWVudCB0eXBlLiAqL1xuICBwcm90ZWN0ZWQgcGFyc2VUeXBlKHR5cGU6IEFyZ3VtZW50VmFsdWUpOiB1bmtub3duIHtcbiAgICBjb25zdCB0eXBlU2V0dGluZ3M6IFR5cGVEZWYgfCB1bmRlZmluZWQgPSB0aGlzLmdldFR5cGUodHlwZS50eXBlKTtcblxuICAgIGlmICghdHlwZVNldHRpbmdzKSB7XG4gICAgICB0aHJvdyBuZXcgVW5rbm93blR5cGVFcnJvcihcbiAgICAgICAgdHlwZS50eXBlLFxuICAgICAgICB0aGlzLmdldFR5cGVzKCkubWFwKCh0eXBlKSA9PiB0eXBlLm5hbWUpLFxuICAgICAgKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdHlwZVNldHRpbmdzLmhhbmRsZXIgaW5zdGFuY2VvZiBUeXBlXG4gICAgICA/IHR5cGVTZXR0aW5ncy5oYW5kbGVyLnBhcnNlKHR5cGUpXG4gICAgICA6IHR5cGVTZXR0aW5ncy5oYW5kbGVyKHR5cGUpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlYWQgYW5kIHZhbGlkYXRlIGVudmlyb25tZW50IHZhcmlhYmxlcy5cbiAgICogQHBhcmFtIGN0eCBQYXJzZSBjb250ZXh0LlxuICAgKiBAcGFyYW0gZW52VmFycyBlbnYgdmFycyBkZWZpbmVkIGJ5IHRoZSBjb21tYW5kLlxuICAgKiBAcGFyYW0gdmFsaWRhdGUgd2hlbiB0cnVlLCB0aHJvd3MgYW4gZXJyb3IgaWYgYSByZXF1aXJlZCBlbnYgdmFyIGlzIG1pc3NpbmcuXG4gICAqL1xuICBwcm90ZWN0ZWQgYXN5bmMgcGFyc2VFbnZWYXJzKFxuICAgIGN0eDogUGFyc2VDb250ZXh0LFxuICAgIGVudlZhcnM6IEFycmF5PEVudlZhcj4sXG4gICAgdmFsaWRhdGUgPSB0cnVlLFxuICApOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBmb3IgKGNvbnN0IGVudlZhciBvZiBlbnZWYXJzKSB7XG4gICAgICBjb25zdCBlbnYgPSBhd2FpdCB0aGlzLmZpbmRFbnZWYXIoZW52VmFyLm5hbWVzKTtcblxuICAgICAgaWYgKGVudikge1xuICAgICAgICBjb25zdCBwYXJzZVR5cGUgPSAodmFsdWU6IHN0cmluZykgPT4ge1xuICAgICAgICAgIHJldHVybiB0aGlzLnBhcnNlVHlwZSh7XG4gICAgICAgICAgICBsYWJlbDogXCJFbnZpcm9ubWVudCB2YXJpYWJsZVwiLFxuICAgICAgICAgICAgdHlwZTogZW52VmFyLnR5cGUsXG4gICAgICAgICAgICBuYW1lOiBlbnYubmFtZSxcbiAgICAgICAgICAgIHZhbHVlLFxuICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuXG4gICAgICAgIGNvbnN0IHByb3BlcnR5TmFtZSA9IHVuZGVyc2NvcmVUb0NhbWVsQ2FzZShcbiAgICAgICAgICBlbnZWYXIucHJlZml4XG4gICAgICAgICAgICA/IGVudlZhci5uYW1lc1swXS5yZXBsYWNlKG5ldyBSZWdFeHAoYF4ke2VudlZhci5wcmVmaXh9YCksIFwiXCIpXG4gICAgICAgICAgICA6IGVudlZhci5uYW1lc1swXSxcbiAgICAgICAgKTtcblxuICAgICAgICBpZiAoZW52VmFyLmRldGFpbHMubGlzdCkge1xuICAgICAgICAgIGN0eC5lbnZbcHJvcGVydHlOYW1lXSA9IGVudi52YWx1ZVxuICAgICAgICAgICAgLnNwbGl0KGVudlZhci5kZXRhaWxzLnNlcGFyYXRvciA/PyBcIixcIilcbiAgICAgICAgICAgIC5tYXAocGFyc2VUeXBlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjdHguZW52W3Byb3BlcnR5TmFtZV0gPSBwYXJzZVR5cGUoZW52LnZhbHVlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChlbnZWYXIudmFsdWUgJiYgdHlwZW9mIGN0eC5lbnZbcHJvcGVydHlOYW1lXSAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICAgIGN0eC5lbnZbcHJvcGVydHlOYW1lXSA9IGVudlZhci52YWx1ZShjdHguZW52W3Byb3BlcnR5TmFtZV0pO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKGVudlZhci5yZXF1aXJlZCAmJiB2YWxpZGF0ZSkge1xuICAgICAgICB0aHJvdyBuZXcgTWlzc2luZ1JlcXVpcmVkRW52VmFyRXJyb3IoZW52VmFyKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBwcm90ZWN0ZWQgYXN5bmMgZmluZEVudlZhcihcbiAgICBuYW1lczogcmVhZG9ubHkgc3RyaW5nW10sXG4gICk6IFByb21pc2U8eyBuYW1lOiBzdHJpbmc7IHZhbHVlOiBzdHJpbmcgfSB8IHVuZGVmaW5lZD4ge1xuICAgIGZvciAoY29uc3QgbmFtZSBvZiBuYW1lcykge1xuICAgICAgY29uc3Qgc3RhdHVzID0gYXdhaXQgRGVuby5wZXJtaXNzaW9ucy5xdWVyeSh7XG4gICAgICAgIG5hbWU6IFwiZW52XCIsXG4gICAgICAgIHZhcmlhYmxlOiBuYW1lLFxuICAgICAgfSk7XG5cbiAgICAgIGlmIChzdGF0dXMuc3RhdGUgPT09IFwiZ3JhbnRlZFwiKSB7XG4gICAgICAgIGNvbnN0IHZhbHVlID0gRGVuby5lbnYuZ2V0KG5hbWUpO1xuXG4gICAgICAgIGlmICh2YWx1ZSkge1xuICAgICAgICAgIHJldHVybiB7IG5hbWUsIHZhbHVlIH07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdW5kZWZpbmVkO1xuICB9XG5cbiAgLyoqXG4gICAqIFBhcnNlIGNvbW1hbmQtbGluZSBhcmd1bWVudHMuXG4gICAqIEBwYXJhbSBjdHggICAgIFBhcnNlIGNvbnRleHQuXG4gICAqIEBwYXJhbSBvcHRpb25zIFBhcnNlZCBjb21tYW5kIGxpbmUgb3B0aW9ucy5cbiAgICovXG4gIHByb3RlY3RlZCBwYXJzZUFyZ3VtZW50cyhcbiAgICBjdHg6IFBhcnNlQ29udGV4dCxcbiAgICBvcHRpb25zOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPixcbiAgKTogVENvbW1hbmRBcmd1bWVudHMge1xuICAgIGNvbnN0IHBhcmFtczogQXJyYXk8dW5rbm93bj4gPSBbXTtcbiAgICBjb25zdCBhcmdzID0gY3R4LnVua25vd24uc2xpY2UoKTtcblxuICAgIGlmICghdGhpcy5oYXNBcmd1bWVudHMoKSkge1xuICAgICAgaWYgKGFyZ3MubGVuZ3RoKSB7XG4gICAgICAgIGlmICh0aGlzLmhhc0NvbW1hbmRzKHRydWUpKSB7XG4gICAgICAgICAgaWYgKHRoaXMuaGFzQ29tbWFuZChhcmdzWzBdLCB0cnVlKSkge1xuICAgICAgICAgICAgLy8gZS5nOiBjb21tYW5kIC0tZ2xvYmFsLWZvbyAtLWZvbyBzdWItY29tbWFuZFxuICAgICAgICAgICAgdGhyb3cgbmV3IFRvb01hbnlBcmd1bWVudHNFcnJvcihhcmdzKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFVua25vd25Db21tYW5kRXJyb3IoYXJnc1swXSwgdGhpcy5nZXRDb21tYW5kcygpKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhyb3cgbmV3IE5vQXJndW1lbnRzQWxsb3dlZEVycm9yKHRoaXMuZ2V0UGF0aCgpKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoIWFyZ3MubGVuZ3RoKSB7XG4gICAgICAgIGNvbnN0IHJlcXVpcmVkID0gdGhpcy5nZXRBcmd1bWVudHMoKVxuICAgICAgICAgIC5maWx0ZXIoKGV4cGVjdGVkQXJnKSA9PiAhZXhwZWN0ZWRBcmcub3B0aW9uYWxWYWx1ZSlcbiAgICAgICAgICAubWFwKChleHBlY3RlZEFyZykgPT4gZXhwZWN0ZWRBcmcubmFtZSk7XG5cbiAgICAgICAgaWYgKHJlcXVpcmVkLmxlbmd0aCkge1xuICAgICAgICAgIGNvbnN0IG9wdGlvbk5hbWVzOiBzdHJpbmdbXSA9IE9iamVjdC5rZXlzKG9wdGlvbnMpO1xuICAgICAgICAgIGNvbnN0IGhhc1N0YW5kYWxvbmVPcHRpb24gPSAhIW9wdGlvbk5hbWVzLmZpbmQoKG5hbWUpID0+XG4gICAgICAgICAgICB0aGlzLmdldE9wdGlvbihuYW1lLCB0cnVlKT8uc3RhbmRhbG9uZVxuICAgICAgICAgICk7XG5cbiAgICAgICAgICBpZiAoIWhhc1N0YW5kYWxvbmVPcHRpb24pIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBNaXNzaW5nQXJndW1lbnRzRXJyb3IocmVxdWlyZWQpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZm9yIChjb25zdCBleHBlY3RlZEFyZyBvZiB0aGlzLmdldEFyZ3VtZW50cygpKSB7XG4gICAgICAgICAgaWYgKCFhcmdzLmxlbmd0aCkge1xuICAgICAgICAgICAgaWYgKGV4cGVjdGVkQXJnLm9wdGlvbmFsVmFsdWUpIHtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aHJvdyBuZXcgTWlzc2luZ0FyZ3VtZW50RXJyb3IoZXhwZWN0ZWRBcmcubmFtZSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgbGV0IGFyZzogdW5rbm93bjtcblxuICAgICAgICAgIGNvbnN0IHBhcnNlQXJnVmFsdWUgPSAodmFsdWU6IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIGV4cGVjdGVkQXJnLmxpc3RcbiAgICAgICAgICAgICAgPyB2YWx1ZS5zcGxpdChcIixcIikubWFwKCh2YWx1ZSkgPT4gcGFyc2VBcmdUeXBlKHZhbHVlKSlcbiAgICAgICAgICAgICAgOiBwYXJzZUFyZ1R5cGUodmFsdWUpO1xuICAgICAgICAgIH07XG5cbiAgICAgICAgICBjb25zdCBwYXJzZUFyZ1R5cGUgPSAodmFsdWU6IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMucGFyc2VUeXBlKHtcbiAgICAgICAgICAgICAgbGFiZWw6IFwiQXJndW1lbnRcIixcbiAgICAgICAgICAgICAgdHlwZTogZXhwZWN0ZWRBcmcudHlwZSxcbiAgICAgICAgICAgICAgbmFtZTogZXhwZWN0ZWRBcmcubmFtZSxcbiAgICAgICAgICAgICAgdmFsdWUsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9O1xuXG4gICAgICAgICAgaWYgKGV4cGVjdGVkQXJnLnZhcmlhZGljKSB7XG4gICAgICAgICAgICBhcmcgPSBhcmdzLnNwbGljZSgwLCBhcmdzLmxlbmd0aCkubWFwKCh2YWx1ZSkgPT5cbiAgICAgICAgICAgICAgcGFyc2VBcmdWYWx1ZSh2YWx1ZSlcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGFyZyA9IHBhcnNlQXJnVmFsdWUoYXJncy5zaGlmdCgpIGFzIHN0cmluZyk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKGV4cGVjdGVkQXJnLnZhcmlhZGljICYmIEFycmF5LmlzQXJyYXkoYXJnKSkge1xuICAgICAgICAgICAgcGFyYW1zLnB1c2goLi4uYXJnKTtcbiAgICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBhcmcgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgICAgIHBhcmFtcy5wdXNoKGFyZyk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGFyZ3MubGVuZ3RoKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IFRvb01hbnlBcmd1bWVudHNFcnJvcihhcmdzKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBwYXJhbXMgYXMgVENvbW1hbmRBcmd1bWVudHM7XG4gIH1cblxuICBwcml2YXRlIGhhbmRsZUVycm9yKGVycm9yOiB1bmtub3duKTogbmV2ZXIge1xuICAgIHRoaXMudGhyb3coXG4gICAgICBlcnJvciBpbnN0YW5jZW9mIEZsYWdzVmFsaWRhdGlvbkVycm9yXG4gICAgICAgID8gbmV3IFZhbGlkYXRpb25FcnJvcihlcnJvci5tZXNzYWdlKVxuICAgICAgICA6IGVycm9yIGluc3RhbmNlb2YgRXJyb3JcbiAgICAgICAgPyBlcnJvclxuICAgICAgICA6IG5ldyBFcnJvcihgW25vbi1lcnJvci10aHJvd25dICR7ZXJyb3J9YCksXG4gICAgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBIYW5kbGUgZXJyb3IuIElmIGB0aHJvd0Vycm9yc2AgaXMgZW5hYmxlZCB0aGUgZXJyb3Igd2lsbCBiZSB0aHJvd24sXG4gICAqIG90aGVyd2lzZSBhIGZvcm1hdHRlZCBlcnJvciBtZXNzYWdlIHdpbGwgYmUgcHJpbnRlZCBhbmQgYERlbm8uZXhpdCgxKWBcbiAgICogd2lsbCBiZSBjYWxsZWQuIFRoaXMgd2lsbCBhbHNvIHRyaWdnZXIgcmVnaXN0ZXJlZCBlcnJvciBoYW5kbGVycy5cbiAgICpcbiAgICogQHBhcmFtIGVycm9yIFRoZSBlcnJvciB0byBoYW5kbGUuXG4gICAqL1xuICBwdWJsaWMgdGhyb3coZXJyb3I6IEVycm9yKTogbmV2ZXIge1xuICAgIGlmIChlcnJvciBpbnN0YW5jZW9mIFZhbGlkYXRpb25FcnJvcikge1xuICAgICAgZXJyb3IuY21kID0gdGhpcyBhcyB1bmtub3duIGFzIENvbW1hbmQ7XG4gICAgfVxuICAgIHRoaXMuZ2V0RXJyb3JIYW5kbGVyKCk/LihlcnJvciwgdGhpcyBhcyB1bmtub3duIGFzIENvbW1hbmQpO1xuXG4gICAgaWYgKHRoaXMuc2hvdWxkVGhyb3dFcnJvcnMoKSB8fCAhKGVycm9yIGluc3RhbmNlb2YgVmFsaWRhdGlvbkVycm9yKSkge1xuICAgICAgdGhyb3cgZXJyb3I7XG4gICAgfVxuICAgIHRoaXMuc2hvd0hlbHAoKTtcblxuICAgIGNvbnNvbGUuZXJyb3IocmVkKGAgICR7Ym9sZChcImVycm9yXCIpfTogJHtlcnJvci5tZXNzYWdlfVxcbmApKTtcblxuICAgIERlbm8uZXhpdChlcnJvciBpbnN0YW5jZW9mIFZhbGlkYXRpb25FcnJvciA/IGVycm9yLmV4aXRDb2RlIDogMSk7XG4gIH1cblxuICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAgICoqKiogR0VUVEVSICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gICAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuICAvKiogR2V0IGNvbW1hbmQgbmFtZS4gKi9cbiAgcHVibGljIGdldE5hbWUoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy5fbmFtZTtcbiAgfVxuXG4gIC8qKiBHZXQgcGFyZW50IGNvbW1hbmQuICovXG4gIHB1YmxpYyBnZXRQYXJlbnQoKTogVFBhcmVudENvbW1hbmQge1xuICAgIHJldHVybiB0aGlzLl9wYXJlbnQgYXMgVFBhcmVudENvbW1hbmQ7XG4gIH1cblxuICAvKipcbiAgICogR2V0IHBhcmVudCBjb21tYW5kIGZyb20gZ2xvYmFsIGV4ZWN1dGVkIGNvbW1hbmQuXG4gICAqIEJlIHN1cmUsIHRvIGNhbGwgdGhpcyBtZXRob2Qgb25seSBpbnNpZGUgYW4gYWN0aW9uIGhhbmRsZXIuIFVubGVzcyB0aGlzIG9yIGFueSBjaGlsZCBjb21tYW5kIHdhcyBleGVjdXRlZCxcbiAgICogdGhpcyBtZXRob2QgcmV0dXJucyBhbHdheXMgdW5kZWZpbmVkLlxuICAgKi9cbiAgcHVibGljIGdldEdsb2JhbFBhcmVudCgpOiBDb21tYW5kPGFueT4gfCB1bmRlZmluZWQge1xuICAgIHJldHVybiB0aGlzLl9nbG9iYWxQYXJlbnQ7XG4gIH1cblxuICAvKiogR2V0IG1haW4gY29tbWFuZC4gKi9cbiAgcHVibGljIGdldE1haW5Db21tYW5kKCk6IENvbW1hbmQ8YW55PiB7XG4gICAgcmV0dXJuIHRoaXMuX3BhcmVudD8uZ2V0TWFpbkNvbW1hbmQoKSA/PyB0aGlzO1xuICB9XG5cbiAgLyoqIEdldCBjb21tYW5kIG5hbWUgYWxpYXNlcy4gKi9cbiAgcHVibGljIGdldEFsaWFzZXMoKTogc3RyaW5nW10ge1xuICAgIHJldHVybiB0aGlzLmFsaWFzZXM7XG4gIH1cblxuICAvKiogR2V0IGZ1bGwgY29tbWFuZCBwYXRoLiAqL1xuICBwdWJsaWMgZ2V0UGF0aCgpOiBzdHJpbmcge1xuICAgIHJldHVybiB0aGlzLl9wYXJlbnRcbiAgICAgID8gdGhpcy5fcGFyZW50LmdldFBhdGgoKSArIFwiIFwiICsgdGhpcy5fbmFtZVxuICAgICAgOiB0aGlzLl9uYW1lO1xuICB9XG5cbiAgLyoqIEdldCBhcmd1bWVudHMgZGVmaW5pdGlvbi4gRS5nOiA8aW5wdXQtZmlsZTpzdHJpbmc+IDxvdXRwdXQtZmlsZTpzdHJpbmc+ICovXG4gIHB1YmxpYyBnZXRBcmdzRGVmaW5pdGlvbigpOiBzdHJpbmcgfCB1bmRlZmluZWQge1xuICAgIHJldHVybiB0aGlzLmFyZ3NEZWZpbml0aW9uO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBhcmd1bWVudCBieSBuYW1lLlxuICAgKiBAcGFyYW0gbmFtZSBOYW1lIG9mIHRoZSBhcmd1bWVudC5cbiAgICovXG4gIHB1YmxpYyBnZXRBcmd1bWVudChuYW1lOiBzdHJpbmcpOiBBcmd1bWVudCB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0QXJndW1lbnRzKCkuZmluZCgoYXJnKSA9PiBhcmcubmFtZSA9PT0gbmFtZSk7XG4gIH1cblxuICAvKiogR2V0IGFyZ3VtZW50cy4gKi9cbiAgcHVibGljIGdldEFyZ3VtZW50cygpOiBBcmd1bWVudFtdIHtcbiAgICBpZiAoIXRoaXMuYXJncy5sZW5ndGggJiYgdGhpcy5hcmdzRGVmaW5pdGlvbikge1xuICAgICAgdGhpcy5hcmdzID0gcGFyc2VBcmd1bWVudHNEZWZpbml0aW9uKHRoaXMuYXJnc0RlZmluaXRpb24pO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLmFyZ3M7XG4gIH1cblxuICAvKiogQ2hlY2sgaWYgY29tbWFuZCBoYXMgYXJndW1lbnRzLiAqL1xuICBwdWJsaWMgaGFzQXJndW1lbnRzKCkge1xuICAgIHJldHVybiAhIXRoaXMuYXJnc0RlZmluaXRpb247XG4gIH1cblxuICAvKiogR2V0IGNvbW1hbmQgdmVyc2lvbi4gKi9cbiAgcHVibGljIGdldFZlcnNpb24oKTogc3RyaW5nIHwgdW5kZWZpbmVkIHtcbiAgICByZXR1cm4gdGhpcy5nZXRWZXJzaW9uSGFuZGxlcigpPy5jYWxsKHRoaXMsIHRoaXMpO1xuICB9XG5cbiAgLyoqIEdldCBoZWxwIGhhbmRsZXIgbWV0aG9kLiAqL1xuICBwcml2YXRlIGdldFZlcnNpb25IYW5kbGVyKCk6IFZlcnNpb25IYW5kbGVyIHwgdW5kZWZpbmVkIHtcbiAgICByZXR1cm4gdGhpcy52ZXIgPz8gdGhpcy5fcGFyZW50Py5nZXRWZXJzaW9uSGFuZGxlcigpO1xuICB9XG5cbiAgLyoqIEdldCBjb21tYW5kIGRlc2NyaXB0aW9uLiAqL1xuICBwdWJsaWMgZ2V0RGVzY3JpcHRpb24oKTogc3RyaW5nIHtcbiAgICAvLyBjYWxsIGRlc2NyaXB0aW9uIG1ldGhvZCBvbmx5IG9uY2VcbiAgICByZXR1cm4gdHlwZW9mIHRoaXMuZGVzYyA9PT0gXCJmdW5jdGlvblwiXG4gICAgICA/IHRoaXMuZGVzYyA9IHRoaXMuZGVzYygpXG4gICAgICA6IHRoaXMuZGVzYztcbiAgfVxuXG4gIHB1YmxpYyBnZXRVc2FnZSgpIHtcbiAgICByZXR1cm4gdGhpcy5fdXNhZ2UgPz8gdGhpcy5nZXRBcmdzRGVmaW5pdGlvbigpO1xuICB9XG5cbiAgLyoqIEdldCBzaG9ydCBjb21tYW5kIGRlc2NyaXB0aW9uLiBUaGlzIGlzIHRoZSBmaXJzdCBsaW5lIG9mIHRoZSBkZXNjcmlwdGlvbi4gKi9cbiAgcHVibGljIGdldFNob3J0RGVzY3JpcHRpb24oKTogc3RyaW5nIHtcbiAgICByZXR1cm4gZ2V0RGVzY3JpcHRpb24odGhpcy5nZXREZXNjcmlwdGlvbigpLCB0cnVlKTtcbiAgfVxuXG4gIC8qKiBHZXQgb3JpZ2luYWwgY29tbWFuZC1saW5lIGFyZ3VtZW50cy4gKi9cbiAgcHVibGljIGdldFJhd0FyZ3MoKTogc3RyaW5nW10ge1xuICAgIHJldHVybiB0aGlzLnJhd0FyZ3M7XG4gIH1cblxuICAvKiogR2V0IGFsbCBhcmd1bWVudHMgZGVmaW5lZCBhZnRlciB0aGUgZG91YmxlIGRhc2guICovXG4gIHB1YmxpYyBnZXRMaXRlcmFsQXJncygpOiBzdHJpbmdbXSB7XG4gICAgcmV0dXJuIHRoaXMubGl0ZXJhbEFyZ3M7XG4gIH1cblxuICAvKiogT3V0cHV0IGdlbmVyYXRlZCBoZWxwIHdpdGhvdXQgZXhpdGluZy4gKi9cbiAgcHVibGljIHNob3dWZXJzaW9uKCk6IHZvaWQge1xuICAgIGNvbnNvbGUubG9nKHRoaXMuZ2V0VmVyc2lvbigpKTtcbiAgfVxuXG4gIC8qKiBSZXR1cm5zIGNvbW1hbmQgbmFtZSwgdmVyc2lvbiBhbmQgbWV0YSBkYXRhLiAqL1xuICBwdWJsaWMgZ2V0TG9uZ1ZlcnNpb24oKTogc3RyaW5nIHtcbiAgICByZXR1cm4gYCR7Ym9sZCh0aGlzLmdldE1haW5Db21tYW5kKCkuZ2V0TmFtZSgpKX0gJHtcbiAgICAgIGJyaWdodEJsdWUodGhpcy5nZXRWZXJzaW9uKCkgPz8gXCJcIilcbiAgICB9YCArXG4gICAgICBPYmplY3QuZW50cmllcyh0aGlzLmdldE1ldGEoKSkubWFwKFxuICAgICAgICAoW2ssIHZdKSA9PiBgXFxuJHtib2xkKGspfSAke2JyaWdodEJsdWUodil9YCxcbiAgICAgICkuam9pbihcIlwiKTtcbiAgfVxuXG4gIC8qKiBPdXRwdXRzIGNvbW1hbmQgbmFtZSwgdmVyc2lvbiBhbmQgbWV0YSBkYXRhLiAqL1xuICBwdWJsaWMgc2hvd0xvbmdWZXJzaW9uKCk6IHZvaWQge1xuICAgIGNvbnNvbGUubG9nKHRoaXMuZ2V0TG9uZ1ZlcnNpb24oKSk7XG4gIH1cblxuICAvKiogT3V0cHV0IGdlbmVyYXRlZCBoZWxwIHdpdGhvdXQgZXhpdGluZy4gKi9cbiAgcHVibGljIHNob3dIZWxwKG9wdGlvbnM/OiBIZWxwT3B0aW9ucyk6IHZvaWQge1xuICAgIGNvbnNvbGUubG9nKHRoaXMuZ2V0SGVscChvcHRpb25zKSk7XG4gIH1cblxuICAvKiogR2V0IGdlbmVyYXRlZCBoZWxwLiAqL1xuICBwdWJsaWMgZ2V0SGVscChvcHRpb25zPzogSGVscE9wdGlvbnMpOiBzdHJpbmcge1xuICAgIHRoaXMucmVnaXN0ZXJEZWZhdWx0cygpO1xuICAgIHJldHVybiB0aGlzLmdldEhlbHBIYW5kbGVyKCkuY2FsbCh0aGlzLCB0aGlzLCBvcHRpb25zID8/IHt9KTtcbiAgfVxuXG4gIC8qKiBHZXQgaGVscCBoYW5kbGVyIG1ldGhvZC4gKi9cbiAgcHJpdmF0ZSBnZXRIZWxwSGFuZGxlcigpOiBIZWxwSGFuZGxlciB7XG4gICAgcmV0dXJuIHRoaXMuX2hlbHAgPz8gdGhpcy5fcGFyZW50Py5nZXRIZWxwSGFuZGxlcigpIGFzIEhlbHBIYW5kbGVyO1xuICB9XG5cbiAgcHJpdmF0ZSBleGl0KGNvZGUgPSAwKSB7XG4gICAgaWYgKHRoaXMuc2hvdWxkRXhpdCgpKSB7XG4gICAgICBEZW5vLmV4aXQoY29kZSk7XG4gICAgfVxuICB9XG5cbiAgLyoqIENoZWNrIGlmIG5ldyB2ZXJzaW9uIGlzIGF2YWlsYWJsZSBhbmQgYWRkIGhpbnQgdG8gdmVyc2lvbi4gKi9cbiAgcHVibGljIGFzeW5jIGNoZWNrVmVyc2lvbigpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBtYWluQ29tbWFuZCA9IHRoaXMuZ2V0TWFpbkNvbW1hbmQoKTtcbiAgICBjb25zdCB1cGdyYWRlQ29tbWFuZCA9IG1haW5Db21tYW5kLmdldENvbW1hbmQoXCJ1cGdyYWRlXCIpO1xuXG4gICAgaWYgKCFpc1VwZ3JhZGVDb21tYW5kKHVwZ3JhZGVDb21tYW5kKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCBsYXRlc3RWZXJzaW9uID0gYXdhaXQgdXBncmFkZUNvbW1hbmQuZ2V0TGF0ZXN0VmVyc2lvbigpO1xuICAgIGNvbnN0IGN1cnJlbnRWZXJzaW9uID0gbWFpbkNvbW1hbmQuZ2V0VmVyc2lvbigpO1xuXG4gICAgaWYgKGN1cnJlbnRWZXJzaW9uID09PSBsYXRlc3RWZXJzaW9uKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IHZlcnNpb25IZWxwVGV4dCA9XG4gICAgICBgKE5ldyB2ZXJzaW9uIGF2YWlsYWJsZTogJHtsYXRlc3RWZXJzaW9ufS4gUnVuICcke21haW5Db21tYW5kLmdldE5hbWUoKX0gdXBncmFkZScgdG8gdXBncmFkZSB0byB0aGUgbGF0ZXN0IHZlcnNpb24hKWA7XG5cbiAgICBtYWluQ29tbWFuZC52ZXJzaW9uKGAke2N1cnJlbnRWZXJzaW9ufSAgJHtib2xkKHllbGxvdyh2ZXJzaW9uSGVscFRleHQpKX1gKTtcbiAgfVxuXG4gIC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICAgKioqKiBPcHRpb25zIEdFVFRFUiAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAgICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG4gIC8qKlxuICAgKiBDaGVja3Mgd2hldGhlciB0aGUgY29tbWFuZCBoYXMgb3B0aW9ucyBvciBub3QuXG4gICAqIEBwYXJhbSBoaWRkZW4gSW5jbHVkZSBoaWRkZW4gb3B0aW9ucy5cbiAgICovXG4gIHB1YmxpYyBoYXNPcHRpb25zKGhpZGRlbj86IGJvb2xlYW4pOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5nZXRPcHRpb25zKGhpZGRlbikubGVuZ3RoID4gMDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgb3B0aW9ucy5cbiAgICogQHBhcmFtIGhpZGRlbiBJbmNsdWRlIGhpZGRlbiBvcHRpb25zLlxuICAgKi9cbiAgcHVibGljIGdldE9wdGlvbnMoaGlkZGVuPzogYm9vbGVhbik6IE9wdGlvbltdIHtcbiAgICByZXR1cm4gdGhpcy5nZXRHbG9iYWxPcHRpb25zKGhpZGRlbikuY29uY2F0KHRoaXMuZ2V0QmFzZU9wdGlvbnMoaGlkZGVuKSk7XG4gIH1cblxuICAvKipcbiAgICogR2V0IGJhc2Ugb3B0aW9ucy5cbiAgICogQHBhcmFtIGhpZGRlbiBJbmNsdWRlIGhpZGRlbiBvcHRpb25zLlxuICAgKi9cbiAgcHVibGljIGdldEJhc2VPcHRpb25zKGhpZGRlbj86IGJvb2xlYW4pOiBPcHRpb25bXSB7XG4gICAgaWYgKCF0aGlzLm9wdGlvbnMubGVuZ3RoKSB7XG4gICAgICByZXR1cm4gW107XG4gICAgfVxuXG4gICAgcmV0dXJuIGhpZGRlblxuICAgICAgPyB0aGlzLm9wdGlvbnMuc2xpY2UoMClcbiAgICAgIDogdGhpcy5vcHRpb25zLmZpbHRlcigob3B0KSA9PiAhb3B0LmhpZGRlbik7XG4gIH1cblxuICAvKipcbiAgICogR2V0IGdsb2JhbCBvcHRpb25zLlxuICAgKiBAcGFyYW0gaGlkZGVuIEluY2x1ZGUgaGlkZGVuIG9wdGlvbnMuXG4gICAqL1xuICBwdWJsaWMgZ2V0R2xvYmFsT3B0aW9ucyhoaWRkZW4/OiBib29sZWFuKTogT3B0aW9uW10ge1xuICAgIGNvbnN0IGhlbHBPcHRpb24gPSB0aGlzLmdldEhlbHBPcHRpb24oKTtcbiAgICBjb25zdCBnZXRHbG9iYWxzID0gKFxuICAgICAgY21kOiBDb21tYW5kPGFueT4sXG4gICAgICBub0dsb2JhbHM6IGJvb2xlYW4sXG4gICAgICBvcHRpb25zOiBPcHRpb25bXSA9IFtdLFxuICAgICAgbmFtZXM6IHN0cmluZ1tdID0gW10sXG4gICAgKTogT3B0aW9uW10gPT4ge1xuICAgICAgaWYgKGNtZC5vcHRpb25zLmxlbmd0aCkge1xuICAgICAgICBmb3IgKGNvbnN0IG9wdGlvbiBvZiBjbWQub3B0aW9ucykge1xuICAgICAgICAgIGlmIChcbiAgICAgICAgICAgIG9wdGlvbi5nbG9iYWwgJiZcbiAgICAgICAgICAgICF0aGlzLm9wdGlvbnMuZmluZCgob3B0KSA9PiBvcHQubmFtZSA9PT0gb3B0aW9uLm5hbWUpICYmXG4gICAgICAgICAgICBuYW1lcy5pbmRleE9mKG9wdGlvbi5uYW1lKSA9PT0gLTEgJiZcbiAgICAgICAgICAgIChoaWRkZW4gfHwgIW9wdGlvbi5oaWRkZW4pXG4gICAgICAgICAgKSB7XG4gICAgICAgICAgICBpZiAobm9HbG9iYWxzICYmIG9wdGlvbiAhPT0gaGVscE9wdGlvbikge1xuICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgbmFtZXMucHVzaChvcHRpb24ubmFtZSk7XG4gICAgICAgICAgICBvcHRpb25zLnB1c2gob3B0aW9uKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGNtZC5fcGFyZW50XG4gICAgICAgID8gZ2V0R2xvYmFscyhcbiAgICAgICAgICBjbWQuX3BhcmVudCxcbiAgICAgICAgICBub0dsb2JhbHMgfHwgY21kLl9ub0dsb2JhbHMsXG4gICAgICAgICAgb3B0aW9ucyxcbiAgICAgICAgICBuYW1lcyxcbiAgICAgICAgKVxuICAgICAgICA6IG9wdGlvbnM7XG4gICAgfTtcblxuICAgIHJldHVybiB0aGlzLl9wYXJlbnQgPyBnZXRHbG9iYWxzKHRoaXMuX3BhcmVudCwgdGhpcy5fbm9HbG9iYWxzKSA6IFtdO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrcyB3aGV0aGVyIHRoZSBjb21tYW5kIGhhcyBhbiBvcHRpb24gd2l0aCBnaXZlbiBuYW1lIG9yIG5vdC5cbiAgICogQHBhcmFtIG5hbWUgTmFtZSBvZiB0aGUgb3B0aW9uLiBNdXN0IGJlIGluIHBhcmFtLWNhc2UuXG4gICAqIEBwYXJhbSBoaWRkZW4gSW5jbHVkZSBoaWRkZW4gb3B0aW9ucy5cbiAgICovXG4gIHB1YmxpYyBoYXNPcHRpb24obmFtZTogc3RyaW5nLCBoaWRkZW4/OiBib29sZWFuKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuICEhdGhpcy5nZXRPcHRpb24obmFtZSwgaGlkZGVuKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgb3B0aW9uIGJ5IG5hbWUuXG4gICAqIEBwYXJhbSBuYW1lIE5hbWUgb2YgdGhlIG9wdGlvbi4gTXVzdCBiZSBpbiBwYXJhbS1jYXNlLlxuICAgKiBAcGFyYW0gaGlkZGVuIEluY2x1ZGUgaGlkZGVuIG9wdGlvbnMuXG4gICAqL1xuICBwdWJsaWMgZ2V0T3B0aW9uKG5hbWU6IHN0cmluZywgaGlkZGVuPzogYm9vbGVhbik6IE9wdGlvbiB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0QmFzZU9wdGlvbihuYW1lLCBoaWRkZW4pID8/XG4gICAgICB0aGlzLmdldEdsb2JhbE9wdGlvbihuYW1lLCBoaWRkZW4pO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBiYXNlIG9wdGlvbiBieSBuYW1lLlxuICAgKiBAcGFyYW0gbmFtZSBOYW1lIG9mIHRoZSBvcHRpb24uIE11c3QgYmUgaW4gcGFyYW0tY2FzZS5cbiAgICogQHBhcmFtIGhpZGRlbiBJbmNsdWRlIGhpZGRlbiBvcHRpb25zLlxuICAgKi9cbiAgcHVibGljIGdldEJhc2VPcHRpb24obmFtZTogc3RyaW5nLCBoaWRkZW4/OiBib29sZWFuKTogT3B0aW9uIHwgdW5kZWZpbmVkIHtcbiAgICBjb25zdCBvcHRpb24gPSB0aGlzLm9wdGlvbnMuZmluZCgob3B0aW9uKSA9PlxuICAgICAgb3B0aW9uLm5hbWUgPT09IG5hbWUgfHwgb3B0aW9uLmFsaWFzZXM/LmluY2x1ZGVzKG5hbWUpXG4gICAgKTtcblxuICAgIHJldHVybiBvcHRpb24gJiYgKGhpZGRlbiB8fCAhb3B0aW9uLmhpZGRlbikgPyBvcHRpb24gOiB1bmRlZmluZWQ7XG4gIH1cblxuICAvKipcbiAgICogR2V0IGdsb2JhbCBvcHRpb24gZnJvbSBwYXJlbnQgY29tbWFuZHMgYnkgbmFtZS5cbiAgICogQHBhcmFtIG5hbWUgTmFtZSBvZiB0aGUgb3B0aW9uLiBNdXN0IGJlIGluIHBhcmFtLWNhc2UuXG4gICAqIEBwYXJhbSBoaWRkZW4gSW5jbHVkZSBoaWRkZW4gb3B0aW9ucy5cbiAgICovXG4gIHB1YmxpYyBnZXRHbG9iYWxPcHRpb24obmFtZTogc3RyaW5nLCBoaWRkZW4/OiBib29sZWFuKTogT3B0aW9uIHwgdW5kZWZpbmVkIHtcbiAgICBjb25zdCBoZWxwT3B0aW9uID0gdGhpcy5nZXRIZWxwT3B0aW9uKCk7XG4gICAgY29uc3QgZ2V0R2xvYmFsT3B0aW9uID0gKFxuICAgICAgcGFyZW50OiBDb21tYW5kLFxuICAgICAgbm9HbG9iYWxzOiBib29sZWFuLFxuICAgICk6IE9wdGlvbiB8IHVuZGVmaW5lZCA9PiB7XG4gICAgICBjb25zdCBvcHRpb246IE9wdGlvbiB8IHVuZGVmaW5lZCA9IHBhcmVudC5nZXRCYXNlT3B0aW9uKFxuICAgICAgICBuYW1lLFxuICAgICAgICBoaWRkZW4sXG4gICAgICApO1xuXG4gICAgICBpZiAoIW9wdGlvbj8uZ2xvYmFsKSB7XG4gICAgICAgIHJldHVybiBwYXJlbnQuX3BhcmVudCAmJiBnZXRHbG9iYWxPcHRpb24oXG4gICAgICAgICAgcGFyZW50Ll9wYXJlbnQsXG4gICAgICAgICAgbm9HbG9iYWxzIHx8IHBhcmVudC5fbm9HbG9iYWxzLFxuICAgICAgICApO1xuICAgICAgfVxuICAgICAgaWYgKG5vR2xvYmFscyAmJiBvcHRpb24gIT09IGhlbHBPcHRpb24pIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gb3B0aW9uO1xuICAgIH07XG5cbiAgICByZXR1cm4gdGhpcy5fcGFyZW50ICYmIGdldEdsb2JhbE9wdGlvbihcbiAgICAgIHRoaXMuX3BhcmVudCxcbiAgICAgIHRoaXMuX25vR2xvYmFscyxcbiAgICApO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlbW92ZSBvcHRpb24gYnkgbmFtZS5cbiAgICogQHBhcmFtIG5hbWUgTmFtZSBvZiB0aGUgb3B0aW9uLiBNdXN0IGJlIGluIHBhcmFtLWNhc2UuXG4gICAqL1xuICBwdWJsaWMgcmVtb3ZlT3B0aW9uKG5hbWU6IHN0cmluZyk6IE9wdGlvbiB8IHVuZGVmaW5lZCB7XG4gICAgY29uc3QgaW5kZXggPSB0aGlzLm9wdGlvbnMuZmluZEluZGV4KChvcHRpb24pID0+IG9wdGlvbi5uYW1lID09PSBuYW1lKTtcblxuICAgIGlmIChpbmRleCA9PT0gLTEpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5vcHRpb25zLnNwbGljZShpbmRleCwgMSlbMF07XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2tzIHdoZXRoZXIgdGhlIGNvbW1hbmQgaGFzIHN1Yi1jb21tYW5kcyBvciBub3QuXG4gICAqIEBwYXJhbSBoaWRkZW4gSW5jbHVkZSBoaWRkZW4gY29tbWFuZHMuXG4gICAqL1xuICBwdWJsaWMgaGFzQ29tbWFuZHMoaGlkZGVuPzogYm9vbGVhbik6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLmdldENvbW1hbmRzKGhpZGRlbikubGVuZ3RoID4gMDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgY29tbWFuZHMuXG4gICAqIEBwYXJhbSBoaWRkZW4gSW5jbHVkZSBoaWRkZW4gY29tbWFuZHMuXG4gICAqL1xuICBwdWJsaWMgZ2V0Q29tbWFuZHMoaGlkZGVuPzogYm9vbGVhbik6IEFycmF5PENvbW1hbmQ8YW55Pj4ge1xuICAgIHJldHVybiB0aGlzLmdldEdsb2JhbENvbW1hbmRzKGhpZGRlbikuY29uY2F0KHRoaXMuZ2V0QmFzZUNvbW1hbmRzKGhpZGRlbikpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBiYXNlIGNvbW1hbmRzLlxuICAgKiBAcGFyYW0gaGlkZGVuIEluY2x1ZGUgaGlkZGVuIGNvbW1hbmRzLlxuICAgKi9cbiAgcHVibGljIGdldEJhc2VDb21tYW5kcyhoaWRkZW4/OiBib29sZWFuKTogQXJyYXk8Q29tbWFuZDxhbnk+PiB7XG4gICAgY29uc3QgY29tbWFuZHMgPSBBcnJheS5mcm9tKHRoaXMuY29tbWFuZHMudmFsdWVzKCkpO1xuICAgIHJldHVybiBoaWRkZW4gPyBjb21tYW5kcyA6IGNvbW1hbmRzLmZpbHRlcigoY21kKSA9PiAhY21kLmlzSGlkZGVuKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgZ2xvYmFsIGNvbW1hbmRzLlxuICAgKiBAcGFyYW0gaGlkZGVuIEluY2x1ZGUgaGlkZGVuIGNvbW1hbmRzLlxuICAgKi9cbiAgcHVibGljIGdldEdsb2JhbENvbW1hbmRzKGhpZGRlbj86IGJvb2xlYW4pOiBBcnJheTxDb21tYW5kPGFueT4+IHtcbiAgICBjb25zdCBnZXRDb21tYW5kcyA9IChcbiAgICAgIGNvbW1hbmQ6IENvbW1hbmQ8YW55PixcbiAgICAgIG5vR2xvYmFsczogYm9vbGVhbixcbiAgICAgIGNvbW1hbmRzOiBBcnJheTxDb21tYW5kPGFueT4+ID0gW10sXG4gICAgICBuYW1lczogc3RyaW5nW10gPSBbXSxcbiAgICApOiBBcnJheTxDb21tYW5kPGFueT4+ID0+IHtcbiAgICAgIGlmIChjb21tYW5kLmNvbW1hbmRzLnNpemUpIHtcbiAgICAgICAgZm9yIChjb25zdCBbXywgY21kXSBvZiBjb21tYW5kLmNvbW1hbmRzKSB7XG4gICAgICAgICAgaWYgKFxuICAgICAgICAgICAgY21kLmlzR2xvYmFsICYmXG4gICAgICAgICAgICB0aGlzICE9PSBjbWQgJiZcbiAgICAgICAgICAgICF0aGlzLmNvbW1hbmRzLmhhcyhjbWQuX25hbWUpICYmXG4gICAgICAgICAgICBuYW1lcy5pbmRleE9mKGNtZC5fbmFtZSkgPT09IC0xICYmXG4gICAgICAgICAgICAoaGlkZGVuIHx8ICFjbWQuaXNIaWRkZW4pXG4gICAgICAgICAgKSB7XG4gICAgICAgICAgICBpZiAobm9HbG9iYWxzICYmIGNtZD8uZ2V0TmFtZSgpICE9PSBcImhlbHBcIikge1xuICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgbmFtZXMucHVzaChjbWQuX25hbWUpO1xuICAgICAgICAgICAgY29tbWFuZHMucHVzaChjbWQpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gY29tbWFuZC5fcGFyZW50XG4gICAgICAgID8gZ2V0Q29tbWFuZHMoXG4gICAgICAgICAgY29tbWFuZC5fcGFyZW50LFxuICAgICAgICAgIG5vR2xvYmFscyB8fCBjb21tYW5kLl9ub0dsb2JhbHMsXG4gICAgICAgICAgY29tbWFuZHMsXG4gICAgICAgICAgbmFtZXMsXG4gICAgICAgIClcbiAgICAgICAgOiBjb21tYW5kcztcbiAgICB9O1xuXG4gICAgcmV0dXJuIHRoaXMuX3BhcmVudCA/IGdldENvbW1hbmRzKHRoaXMuX3BhcmVudCwgdGhpcy5fbm9HbG9iYWxzKSA6IFtdO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrcyB3aGV0aGVyIGEgY2hpbGQgY29tbWFuZCBleGlzdHMgYnkgZ2l2ZW4gbmFtZSBvciBhbGlhcy5cbiAgICogQHBhcmFtIG5hbWUgTmFtZSBvciBhbGlhcyBvZiB0aGUgY29tbWFuZC5cbiAgICogQHBhcmFtIGhpZGRlbiBJbmNsdWRlIGhpZGRlbiBjb21tYW5kcy5cbiAgICovXG4gIHB1YmxpYyBoYXNDb21tYW5kKG5hbWU6IHN0cmluZywgaGlkZGVuPzogYm9vbGVhbik6IGJvb2xlYW4ge1xuICAgIHJldHVybiAhIXRoaXMuZ2V0Q29tbWFuZChuYW1lLCBoaWRkZW4pO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBjb21tYW5kIGJ5IG5hbWUgb3IgYWxpYXMuXG4gICAqIEBwYXJhbSBuYW1lIE5hbWUgb3IgYWxpYXMgb2YgdGhlIGNvbW1hbmQuXG4gICAqIEBwYXJhbSBoaWRkZW4gSW5jbHVkZSBoaWRkZW4gY29tbWFuZHMuXG4gICAqL1xuICBwdWJsaWMgZ2V0Q29tbWFuZDxUQ29tbWFuZCBleHRlbmRzIENvbW1hbmQ8YW55Pj4oXG4gICAgbmFtZTogc3RyaW5nLFxuICAgIGhpZGRlbj86IGJvb2xlYW4sXG4gICk6IFRDb21tYW5kIHwgdW5kZWZpbmVkIHtcbiAgICByZXR1cm4gdGhpcy5nZXRCYXNlQ29tbWFuZChuYW1lLCBoaWRkZW4pID8/XG4gICAgICB0aGlzLmdldEdsb2JhbENvbW1hbmQobmFtZSwgaGlkZGVuKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgYmFzZSBjb21tYW5kIGJ5IG5hbWUgb3IgYWxpYXMuXG4gICAqIEBwYXJhbSBuYW1lIE5hbWUgb3IgYWxpYXMgb2YgdGhlIGNvbW1hbmQuXG4gICAqIEBwYXJhbSBoaWRkZW4gSW5jbHVkZSBoaWRkZW4gY29tbWFuZHMuXG4gICAqL1xuICBwdWJsaWMgZ2V0QmFzZUNvbW1hbmQ8VENvbW1hbmQgZXh0ZW5kcyBDb21tYW5kPGFueT4+KFxuICAgIG5hbWU6IHN0cmluZyxcbiAgICBoaWRkZW4/OiBib29sZWFuLFxuICApOiBUQ29tbWFuZCB8IHVuZGVmaW5lZCB7XG4gICAgZm9yIChjb25zdCBjbWQgb2YgdGhpcy5jb21tYW5kcy52YWx1ZXMoKSkge1xuICAgICAgaWYgKGNtZC5fbmFtZSA9PT0gbmFtZSB8fCBjbWQuYWxpYXNlcy5pbmNsdWRlcyhuYW1lKSkge1xuICAgICAgICByZXR1cm4gKGNtZCAmJiAoaGlkZGVuIHx8ICFjbWQuaXNIaWRkZW4pID8gY21kIDogdW5kZWZpbmVkKSBhc1xuICAgICAgICAgIHwgVENvbW1hbmRcbiAgICAgICAgICB8IHVuZGVmaW5lZDtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogR2V0IGdsb2JhbCBjb21tYW5kIGJ5IG5hbWUgb3IgYWxpYXMuXG4gICAqIEBwYXJhbSBuYW1lIE5hbWUgb3IgYWxpYXMgb2YgdGhlIGNvbW1hbmQuXG4gICAqIEBwYXJhbSBoaWRkZW4gSW5jbHVkZSBoaWRkZW4gY29tbWFuZHMuXG4gICAqL1xuICBwdWJsaWMgZ2V0R2xvYmFsQ29tbWFuZDxUQ29tbWFuZCBleHRlbmRzIENvbW1hbmQ8YW55Pj4oXG4gICAgbmFtZTogc3RyaW5nLFxuICAgIGhpZGRlbj86IGJvb2xlYW4sXG4gICk6IFRDb21tYW5kIHwgdW5kZWZpbmVkIHtcbiAgICBjb25zdCBnZXRHbG9iYWxDb21tYW5kID0gKFxuICAgICAgcGFyZW50OiBDb21tYW5kLFxuICAgICAgbm9HbG9iYWxzOiBib29sZWFuLFxuICAgICk6IENvbW1hbmQgfCB1bmRlZmluZWQgPT4ge1xuICAgICAgY29uc3QgY21kOiBDb21tYW5kIHwgdW5kZWZpbmVkID0gcGFyZW50LmdldEJhc2VDb21tYW5kKG5hbWUsIGhpZGRlbik7XG5cbiAgICAgIGlmICghY21kPy5pc0dsb2JhbCkge1xuICAgICAgICByZXR1cm4gcGFyZW50Ll9wYXJlbnQgJiZcbiAgICAgICAgICBnZXRHbG9iYWxDb21tYW5kKHBhcmVudC5fcGFyZW50LCBub0dsb2JhbHMgfHwgcGFyZW50Ll9ub0dsb2JhbHMpO1xuICAgICAgfVxuICAgICAgaWYgKG5vR2xvYmFscyAmJiBjbWQuZ2V0TmFtZSgpICE9PSBcImhlbHBcIikge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBjbWQ7XG4gICAgfTtcblxuICAgIHJldHVybiB0aGlzLl9wYXJlbnQgJiZcbiAgICAgIGdldEdsb2JhbENvbW1hbmQodGhpcy5fcGFyZW50LCB0aGlzLl9ub0dsb2JhbHMpIGFzIFRDb21tYW5kO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlbW92ZSBzdWItY29tbWFuZCBieSBuYW1lIG9yIGFsaWFzLlxuICAgKiBAcGFyYW0gbmFtZSBOYW1lIG9yIGFsaWFzIG9mIHRoZSBjb21tYW5kLlxuICAgKi9cbiAgcHVibGljIHJlbW92ZUNvbW1hbmQobmFtZTogc3RyaW5nKTogQ29tbWFuZDxhbnk+IHwgdW5kZWZpbmVkIHtcbiAgICBjb25zdCBjb21tYW5kID0gdGhpcy5nZXRCYXNlQ29tbWFuZChuYW1lLCB0cnVlKTtcblxuICAgIGlmIChjb21tYW5kKSB7XG4gICAgICB0aGlzLmNvbW1hbmRzLmRlbGV0ZShjb21tYW5kLl9uYW1lKTtcbiAgICB9XG5cbiAgICByZXR1cm4gY29tbWFuZDtcbiAgfVxuXG4gIC8qKiBHZXQgdHlwZXMuICovXG4gIHB1YmxpYyBnZXRUeXBlcygpOiBBcnJheTxUeXBlRGVmPiB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0R2xvYmFsVHlwZXMoKS5jb25jYXQodGhpcy5nZXRCYXNlVHlwZXMoKSk7XG4gIH1cblxuICAvKiogR2V0IGJhc2UgdHlwZXMuICovXG4gIHB1YmxpYyBnZXRCYXNlVHlwZXMoKTogQXJyYXk8VHlwZURlZj4ge1xuICAgIHJldHVybiBBcnJheS5mcm9tKHRoaXMudHlwZXMudmFsdWVzKCkpO1xuICB9XG5cbiAgLyoqIEdldCBnbG9iYWwgdHlwZXMuICovXG4gIHB1YmxpYyBnZXRHbG9iYWxUeXBlcygpOiBBcnJheTxUeXBlRGVmPiB7XG4gICAgY29uc3QgZ2V0VHlwZXMgPSAoXG4gICAgICBjbWQ6IENvbW1hbmQ8YW55PiB8IHVuZGVmaW5lZCxcbiAgICAgIHR5cGVzOiBBcnJheTxUeXBlRGVmPiA9IFtdLFxuICAgICAgbmFtZXM6IEFycmF5PHN0cmluZz4gPSBbXSxcbiAgICApOiBBcnJheTxUeXBlRGVmPiA9PiB7XG4gICAgICBpZiAoY21kKSB7XG4gICAgICAgIGlmIChjbWQudHlwZXMuc2l6ZSkge1xuICAgICAgICAgIGNtZC50eXBlcy5mb3JFYWNoKCh0eXBlOiBUeXBlRGVmKSA9PiB7XG4gICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgIHR5cGUuZ2xvYmFsICYmXG4gICAgICAgICAgICAgICF0aGlzLnR5cGVzLmhhcyh0eXBlLm5hbWUpICYmXG4gICAgICAgICAgICAgIG5hbWVzLmluZGV4T2YodHlwZS5uYW1lKSA9PT0gLTFcbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICBuYW1lcy5wdXNoKHR5cGUubmFtZSk7XG4gICAgICAgICAgICAgIHR5cGVzLnB1c2godHlwZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZ2V0VHlwZXMoY21kLl9wYXJlbnQsIHR5cGVzLCBuYW1lcyk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB0eXBlcztcbiAgICB9O1xuXG4gICAgcmV0dXJuIGdldFR5cGVzKHRoaXMuX3BhcmVudCk7XG4gIH1cblxuICAvKipcbiAgICogR2V0IHR5cGUgYnkgbmFtZS5cbiAgICogQHBhcmFtIG5hbWUgTmFtZSBvZiB0aGUgdHlwZS5cbiAgICovXG4gIHB1YmxpYyBnZXRUeXBlKG5hbWU6IHN0cmluZyk6IFR5cGVEZWYgfCB1bmRlZmluZWQge1xuICAgIHJldHVybiB0aGlzLmdldEJhc2VUeXBlKG5hbWUpID8/IHRoaXMuZ2V0R2xvYmFsVHlwZShuYW1lKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgYmFzZSB0eXBlIGJ5IG5hbWUuXG4gICAqIEBwYXJhbSBuYW1lIE5hbWUgb2YgdGhlIHR5cGUuXG4gICAqL1xuICBwdWJsaWMgZ2V0QmFzZVR5cGUobmFtZTogc3RyaW5nKTogVHlwZURlZiB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMudHlwZXMuZ2V0KG5hbWUpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBnbG9iYWwgdHlwZSBieSBuYW1lLlxuICAgKiBAcGFyYW0gbmFtZSBOYW1lIG9mIHRoZSB0eXBlLlxuICAgKi9cbiAgcHVibGljIGdldEdsb2JhbFR5cGUobmFtZTogc3RyaW5nKTogVHlwZURlZiB8IHVuZGVmaW5lZCB7XG4gICAgaWYgKCF0aGlzLl9wYXJlbnQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBjbWQ6IFR5cGVEZWYgfCB1bmRlZmluZWQgPSB0aGlzLl9wYXJlbnQuZ2V0QmFzZVR5cGUobmFtZSk7XG5cbiAgICBpZiAoIWNtZD8uZ2xvYmFsKSB7XG4gICAgICByZXR1cm4gdGhpcy5fcGFyZW50LmdldEdsb2JhbFR5cGUobmFtZSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGNtZDtcbiAgfVxuXG4gIC8qKiBHZXQgY29tcGxldGlvbnMuICovXG4gIHB1YmxpYyBnZXRDb21wbGV0aW9ucygpIHtcbiAgICByZXR1cm4gdGhpcy5nZXRHbG9iYWxDb21wbGV0aW9ucygpLmNvbmNhdCh0aGlzLmdldEJhc2VDb21wbGV0aW9ucygpKTtcbiAgfVxuXG4gIC8qKiBHZXQgYmFzZSBjb21wbGV0aW9ucy4gKi9cbiAgcHVibGljIGdldEJhc2VDb21wbGV0aW9ucygpOiBDb21wbGV0aW9uW10ge1xuICAgIHJldHVybiBBcnJheS5mcm9tKHRoaXMuY29tcGxldGlvbnMudmFsdWVzKCkpO1xuICB9XG5cbiAgLyoqIEdldCBnbG9iYWwgY29tcGxldGlvbnMuICovXG4gIHB1YmxpYyBnZXRHbG9iYWxDb21wbGV0aW9ucygpOiBDb21wbGV0aW9uW10ge1xuICAgIGNvbnN0IGdldENvbXBsZXRpb25zID0gKFxuICAgICAgY21kOiBDb21tYW5kPGFueT4gfCB1bmRlZmluZWQsXG4gICAgICBjb21wbGV0aW9uczogQ29tcGxldGlvbltdID0gW10sXG4gICAgICBuYW1lczogc3RyaW5nW10gPSBbXSxcbiAgICApOiBDb21wbGV0aW9uW10gPT4ge1xuICAgICAgaWYgKGNtZCkge1xuICAgICAgICBpZiAoY21kLmNvbXBsZXRpb25zLnNpemUpIHtcbiAgICAgICAgICBjbWQuY29tcGxldGlvbnMuZm9yRWFjaCgoY29tcGxldGlvbjogQ29tcGxldGlvbikgPT4ge1xuICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICBjb21wbGV0aW9uLmdsb2JhbCAmJlxuICAgICAgICAgICAgICAhdGhpcy5jb21wbGV0aW9ucy5oYXMoY29tcGxldGlvbi5uYW1lKSAmJlxuICAgICAgICAgICAgICBuYW1lcy5pbmRleE9mKGNvbXBsZXRpb24ubmFtZSkgPT09IC0xXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgbmFtZXMucHVzaChjb21wbGV0aW9uLm5hbWUpO1xuICAgICAgICAgICAgICBjb21wbGV0aW9ucy5wdXNoKGNvbXBsZXRpb24pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGdldENvbXBsZXRpb25zKGNtZC5fcGFyZW50LCBjb21wbGV0aW9ucywgbmFtZXMpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gY29tcGxldGlvbnM7XG4gICAgfTtcblxuICAgIHJldHVybiBnZXRDb21wbGV0aW9ucyh0aGlzLl9wYXJlbnQpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBjb21wbGV0aW9uIGJ5IG5hbWUuXG4gICAqIEBwYXJhbSBuYW1lIE5hbWUgb2YgdGhlIGNvbXBsZXRpb24uXG4gICAqL1xuICBwdWJsaWMgZ2V0Q29tcGxldGlvbihuYW1lOiBzdHJpbmcpOiBDb21wbGV0aW9uIHwgdW5kZWZpbmVkIHtcbiAgICByZXR1cm4gdGhpcy5nZXRCYXNlQ29tcGxldGlvbihuYW1lKSA/PyB0aGlzLmdldEdsb2JhbENvbXBsZXRpb24obmFtZSk7XG4gIH1cblxuICAvKipcbiAgICogR2V0IGJhc2UgY29tcGxldGlvbiBieSBuYW1lLlxuICAgKiBAcGFyYW0gbmFtZSBOYW1lIG9mIHRoZSBjb21wbGV0aW9uLlxuICAgKi9cbiAgcHVibGljIGdldEJhc2VDb21wbGV0aW9uKG5hbWU6IHN0cmluZyk6IENvbXBsZXRpb24gfCB1bmRlZmluZWQge1xuICAgIHJldHVybiB0aGlzLmNvbXBsZXRpb25zLmdldChuYW1lKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgZ2xvYmFsIGNvbXBsZXRpb25zIGJ5IG5hbWUuXG4gICAqIEBwYXJhbSBuYW1lIE5hbWUgb2YgdGhlIGNvbXBsZXRpb24uXG4gICAqL1xuICBwdWJsaWMgZ2V0R2xvYmFsQ29tcGxldGlvbihuYW1lOiBzdHJpbmcpOiBDb21wbGV0aW9uIHwgdW5kZWZpbmVkIHtcbiAgICBpZiAoIXRoaXMuX3BhcmVudCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGNvbXBsZXRpb246IENvbXBsZXRpb24gfCB1bmRlZmluZWQgPSB0aGlzLl9wYXJlbnQuZ2V0QmFzZUNvbXBsZXRpb24oXG4gICAgICBuYW1lLFxuICAgICk7XG5cbiAgICBpZiAoIWNvbXBsZXRpb24/Lmdsb2JhbCkge1xuICAgICAgcmV0dXJuIHRoaXMuX3BhcmVudC5nZXRHbG9iYWxDb21wbGV0aW9uKG5hbWUpO1xuICAgIH1cblxuICAgIHJldHVybiBjb21wbGV0aW9uO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrcyB3aGV0aGVyIHRoZSBjb21tYW5kIGhhcyBlbnZpcm9ubWVudCB2YXJpYWJsZXMgb3Igbm90LlxuICAgKiBAcGFyYW0gaGlkZGVuIEluY2x1ZGUgaGlkZGVuIGVudmlyb25tZW50IHZhcmlhYmxlLlxuICAgKi9cbiAgcHVibGljIGhhc0VudlZhcnMoaGlkZGVuPzogYm9vbGVhbik6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLmdldEVudlZhcnMoaGlkZGVuKS5sZW5ndGggPiAwO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBlbnZpcm9ubWVudCB2YXJpYWJsZXMuXG4gICAqIEBwYXJhbSBoaWRkZW4gSW5jbHVkZSBoaWRkZW4gZW52aXJvbm1lbnQgdmFyaWFibGUuXG4gICAqL1xuICBwdWJsaWMgZ2V0RW52VmFycyhoaWRkZW4/OiBib29sZWFuKTogRW52VmFyW10ge1xuICAgIHJldHVybiB0aGlzLmdldEdsb2JhbEVudlZhcnMoaGlkZGVuKS5jb25jYXQodGhpcy5nZXRCYXNlRW52VmFycyhoaWRkZW4pKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgYmFzZSBlbnZpcm9ubWVudCB2YXJpYWJsZXMuXG4gICAqIEBwYXJhbSBoaWRkZW4gSW5jbHVkZSBoaWRkZW4gZW52aXJvbm1lbnQgdmFyaWFibGUuXG4gICAqL1xuICBwdWJsaWMgZ2V0QmFzZUVudlZhcnMoaGlkZGVuPzogYm9vbGVhbik6IEVudlZhcltdIHtcbiAgICBpZiAoIXRoaXMuZW52VmFycy5sZW5ndGgpIHtcbiAgICAgIHJldHVybiBbXTtcbiAgICB9XG5cbiAgICByZXR1cm4gaGlkZGVuXG4gICAgICA/IHRoaXMuZW52VmFycy5zbGljZSgwKVxuICAgICAgOiB0aGlzLmVudlZhcnMuZmlsdGVyKChlbnYpID0+ICFlbnYuaGlkZGVuKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgZ2xvYmFsIGVudmlyb25tZW50IHZhcmlhYmxlcy5cbiAgICogQHBhcmFtIGhpZGRlbiBJbmNsdWRlIGhpZGRlbiBlbnZpcm9ubWVudCB2YXJpYWJsZS5cbiAgICovXG4gIHB1YmxpYyBnZXRHbG9iYWxFbnZWYXJzKGhpZGRlbj86IGJvb2xlYW4pOiBFbnZWYXJbXSB7XG4gICAgaWYgKHRoaXMuX25vR2xvYmFscykge1xuICAgICAgcmV0dXJuIFtdO1xuICAgIH1cblxuICAgIGNvbnN0IGdldEVudlZhcnMgPSAoXG4gICAgICBjbWQ6IENvbW1hbmQ8YW55PiB8IHVuZGVmaW5lZCxcbiAgICAgIGVudlZhcnM6IEVudlZhcltdID0gW10sXG4gICAgICBuYW1lczogc3RyaW5nW10gPSBbXSxcbiAgICApOiBFbnZWYXJbXSA9PiB7XG4gICAgICBpZiAoY21kKSB7XG4gICAgICAgIGlmIChjbWQuZW52VmFycy5sZW5ndGgpIHtcbiAgICAgICAgICBjbWQuZW52VmFycy5mb3JFYWNoKChlbnZWYXI6IEVudlZhcikgPT4ge1xuICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICBlbnZWYXIuZ2xvYmFsICYmXG4gICAgICAgICAgICAgICF0aGlzLmVudlZhcnMuZmluZCgoZW52KSA9PiBlbnYubmFtZXNbMF0gPT09IGVudlZhci5uYW1lc1swXSkgJiZcbiAgICAgICAgICAgICAgbmFtZXMuaW5kZXhPZihlbnZWYXIubmFtZXNbMF0pID09PSAtMSAmJlxuICAgICAgICAgICAgICAoaGlkZGVuIHx8ICFlbnZWYXIuaGlkZGVuKVxuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgIG5hbWVzLnB1c2goZW52VmFyLm5hbWVzWzBdKTtcbiAgICAgICAgICAgICAgZW52VmFycy5wdXNoKGVudlZhcik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZ2V0RW52VmFycyhjbWQuX3BhcmVudCwgZW52VmFycywgbmFtZXMpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gZW52VmFycztcbiAgICB9O1xuXG4gICAgcmV0dXJuIGdldEVudlZhcnModGhpcy5fcGFyZW50KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVja3Mgd2hldGhlciB0aGUgY29tbWFuZCBoYXMgYW4gZW52aXJvbm1lbnQgdmFyaWFibGUgd2l0aCBnaXZlbiBuYW1lIG9yIG5vdC5cbiAgICogQHBhcmFtIG5hbWUgTmFtZSBvZiB0aGUgZW52aXJvbm1lbnQgdmFyaWFibGUuXG4gICAqIEBwYXJhbSBoaWRkZW4gSW5jbHVkZSBoaWRkZW4gZW52aXJvbm1lbnQgdmFyaWFibGUuXG4gICAqL1xuICBwdWJsaWMgaGFzRW52VmFyKG5hbWU6IHN0cmluZywgaGlkZGVuPzogYm9vbGVhbik6IGJvb2xlYW4ge1xuICAgIHJldHVybiAhIXRoaXMuZ2V0RW52VmFyKG5hbWUsIGhpZGRlbik7XG4gIH1cblxuICAvKipcbiAgICogR2V0IGVudmlyb25tZW50IHZhcmlhYmxlIGJ5IG5hbWUuXG4gICAqIEBwYXJhbSBuYW1lIE5hbWUgb2YgdGhlIGVudmlyb25tZW50IHZhcmlhYmxlLlxuICAgKiBAcGFyYW0gaGlkZGVuIEluY2x1ZGUgaGlkZGVuIGVudmlyb25tZW50IHZhcmlhYmxlLlxuICAgKi9cbiAgcHVibGljIGdldEVudlZhcihuYW1lOiBzdHJpbmcsIGhpZGRlbj86IGJvb2xlYW4pOiBFbnZWYXIgfCB1bmRlZmluZWQge1xuICAgIHJldHVybiB0aGlzLmdldEJhc2VFbnZWYXIobmFtZSwgaGlkZGVuKSA/P1xuICAgICAgdGhpcy5nZXRHbG9iYWxFbnZWYXIobmFtZSwgaGlkZGVuKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgYmFzZSBlbnZpcm9ubWVudCB2YXJpYWJsZSBieSBuYW1lLlxuICAgKiBAcGFyYW0gbmFtZSBOYW1lIG9mIHRoZSBlbnZpcm9ubWVudCB2YXJpYWJsZS5cbiAgICogQHBhcmFtIGhpZGRlbiBJbmNsdWRlIGhpZGRlbiBlbnZpcm9ubWVudCB2YXJpYWJsZS5cbiAgICovXG4gIHB1YmxpYyBnZXRCYXNlRW52VmFyKG5hbWU6IHN0cmluZywgaGlkZGVuPzogYm9vbGVhbik6IEVudlZhciB8IHVuZGVmaW5lZCB7XG4gICAgY29uc3QgZW52VmFyOiBFbnZWYXIgfCB1bmRlZmluZWQgPSB0aGlzLmVudlZhcnMuZmluZCgoZW52KSA9PlxuICAgICAgZW52Lm5hbWVzLmluZGV4T2YobmFtZSkgIT09IC0xXG4gICAgKTtcblxuICAgIHJldHVybiBlbnZWYXIgJiYgKGhpZGRlbiB8fCAhZW52VmFyLmhpZGRlbikgPyBlbnZWYXIgOiB1bmRlZmluZWQ7XG4gIH1cblxuICAvKipcbiAgICogR2V0IGdsb2JhbCBlbnZpcm9ubWVudCB2YXJpYWJsZSBieSBuYW1lLlxuICAgKiBAcGFyYW0gbmFtZSBOYW1lIG9mIHRoZSBlbnZpcm9ubWVudCB2YXJpYWJsZS5cbiAgICogQHBhcmFtIGhpZGRlbiBJbmNsdWRlIGhpZGRlbiBlbnZpcm9ubWVudCB2YXJpYWJsZS5cbiAgICovXG4gIHB1YmxpYyBnZXRHbG9iYWxFbnZWYXIobmFtZTogc3RyaW5nLCBoaWRkZW4/OiBib29sZWFuKTogRW52VmFyIHwgdW5kZWZpbmVkIHtcbiAgICBpZiAoIXRoaXMuX3BhcmVudCB8fCB0aGlzLl9ub0dsb2JhbHMpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBlbnZWYXI6IEVudlZhciB8IHVuZGVmaW5lZCA9IHRoaXMuX3BhcmVudC5nZXRCYXNlRW52VmFyKFxuICAgICAgbmFtZSxcbiAgICAgIGhpZGRlbixcbiAgICApO1xuXG4gICAgaWYgKCFlbnZWYXI/Lmdsb2JhbCkge1xuICAgICAgcmV0dXJuIHRoaXMuX3BhcmVudC5nZXRHbG9iYWxFbnZWYXIobmFtZSwgaGlkZGVuKTtcbiAgICB9XG5cbiAgICByZXR1cm4gZW52VmFyO1xuICB9XG5cbiAgLyoqIENoZWNrcyB3aGV0aGVyIHRoZSBjb21tYW5kIGhhcyBleGFtcGxlcyBvciBub3QuICovXG4gIHB1YmxpYyBoYXNFeGFtcGxlcygpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5leGFtcGxlcy5sZW5ndGggPiAwO1xuICB9XG5cbiAgLyoqIEdldCBhbGwgZXhhbXBsZXMuICovXG4gIHB1YmxpYyBnZXRFeGFtcGxlcygpOiBFeGFtcGxlW10ge1xuICAgIHJldHVybiB0aGlzLmV4YW1wbGVzO1xuICB9XG5cbiAgLyoqIENoZWNrcyB3aGV0aGVyIHRoZSBjb21tYW5kIGhhcyBhbiBleGFtcGxlIHdpdGggZ2l2ZW4gbmFtZSBvciBub3QuICovXG4gIHB1YmxpYyBoYXNFeGFtcGxlKG5hbWU6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgIHJldHVybiAhIXRoaXMuZ2V0RXhhbXBsZShuYW1lKTtcbiAgfVxuXG4gIC8qKiBHZXQgZXhhbXBsZSB3aXRoIGdpdmVuIG5hbWUuICovXG4gIHB1YmxpYyBnZXRFeGFtcGxlKG5hbWU6IHN0cmluZyk6IEV4YW1wbGUgfCB1bmRlZmluZWQge1xuICAgIHJldHVybiB0aGlzLmV4YW1wbGVzLmZpbmQoKGV4YW1wbGUpID0+IGV4YW1wbGUubmFtZSA9PT0gbmFtZSk7XG4gIH1cblxuICBwcml2YXRlIGdldEhlbHBPcHRpb24oKTogT3B0aW9uIHwgdW5kZWZpbmVkIHtcbiAgICByZXR1cm4gdGhpcy5faGVscE9wdGlvbiA/PyB0aGlzLl9wYXJlbnQ/LmdldEhlbHBPcHRpb24oKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBpc1VwZ3JhZGVDb21tYW5kKGNvbW1hbmQ6IHVua25vd24pOiBjb21tYW5kIGlzIFVwZ3JhZGVDb21tYW5kSW1wbCB7XG4gIHJldHVybiBjb21tYW5kIGluc3RhbmNlb2YgQ29tbWFuZCAmJiBcImdldExhdGVzdFZlcnNpb25cIiBpbiBjb21tYW5kO1xufVxuXG5pbnRlcmZhY2UgVXBncmFkZUNvbW1hbmRJbXBsIHtcbiAgZ2V0TGF0ZXN0VmVyc2lvbigpOiBQcm9taXNlPHN0cmluZz47XG59XG5cbmludGVyZmFjZSBEZWZhdWx0T3B0aW9uIHtcbiAgZmxhZ3M6IHN0cmluZztcbiAgZGVzYz86IHN0cmluZztcbiAgb3B0cz86IE9wdGlvbk9wdGlvbnM7XG59XG5cbnR5cGUgQWN0aW9uT3B0aW9uID0gT3B0aW9uICYgeyBhY3Rpb246IEFjdGlvbkhhbmRsZXIgfTtcblxuaW50ZXJmYWNlIFBhcnNlQ29udGV4dCBleHRlbmRzIFBhcnNlRmxhZ3NDb250ZXh0PFJlY29yZDxzdHJpbmcsIHVua25vd24+PiB7XG4gIGFjdGlvbj86IEFjdGlvbk9wdGlvbjtcbiAgZW52OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPjtcbn1cblxuaW50ZXJmYWNlIFBhcnNlT3B0aW9uc09wdGlvbnMge1xuICBzdG9wRWFybHk/OiBib29sZWFuO1xuICBzdG9wT25Vbmtub3duPzogYm9vbGVhbjtcbiAgZG90dGVkPzogYm9vbGVhbjtcbn1cblxudHlwZSBUcmltTGVmdDxUVmFsdWUgZXh0ZW5kcyBzdHJpbmcsIFRUcmltVmFsdWUgZXh0ZW5kcyBzdHJpbmcgfCB1bmRlZmluZWQ+ID1cbiAgVFZhbHVlIGV4dGVuZHMgYCR7VFRyaW1WYWx1ZX0ke2luZmVyIFRSZXN0fWAgPyBUUmVzdFxuICAgIDogVFZhbHVlO1xuXG50eXBlIFRyaW1SaWdodDxUVmFsdWUgZXh0ZW5kcyBzdHJpbmcsIFRUcmltVmFsdWUgZXh0ZW5kcyBzdHJpbmc+ID1cbiAgVFZhbHVlIGV4dGVuZHMgYCR7aW5mZXIgVFJlc3R9JHtUVHJpbVZhbHVlfWAgPyBUUmVzdFxuICAgIDogVFZhbHVlO1xuXG50eXBlIExvd2VyPFRWYWx1ZSBleHRlbmRzIHN0cmluZz4gPSBUVmFsdWUgZXh0ZW5kcyBVcHBlcmNhc2U8VFZhbHVlPlxuICA/IExvd2VyY2FzZTxUVmFsdWU+XG4gIDogVW5jYXBpdGFsaXplPFRWYWx1ZT47XG5cbnR5cGUgQ2FtZWxDYXNlPFRWYWx1ZSBleHRlbmRzIHN0cmluZz4gPSBUVmFsdWUgZXh0ZW5kc1xuICBgJHtpbmZlciBUUGFydH1fJHtpbmZlciBUUmVzdH1gXG4gID8gYCR7TG93ZXI8VFBhcnQ+fSR7Q2FwaXRhbGl6ZTxDYW1lbENhc2U8VFJlc3Q+Pn1gXG4gIDogVFZhbHVlIGV4dGVuZHMgYCR7aW5mZXIgVFBhcnR9LSR7aW5mZXIgVFJlc3R9YFxuICAgID8gYCR7TG93ZXI8VFBhcnQ+fSR7Q2FwaXRhbGl6ZTxDYW1lbENhc2U8VFJlc3Q+Pn1gXG4gIDogTG93ZXI8VFZhbHVlPjtcblxudHlwZSBPbmVPZjxUVmFsdWUsIFREZWZhdWx0PiA9IFRWYWx1ZSBleHRlbmRzIHZvaWQgPyBURGVmYXVsdCA6IFRWYWx1ZTtcblxudHlwZSBNZXJnZTxUTGVmdCwgVFJpZ2h0PiA9IFRMZWZ0IGV4dGVuZHMgdm9pZCA/IFRSaWdodFxuICA6IFRSaWdodCBleHRlbmRzIHZvaWQgPyBUTGVmdFxuICA6IFRMZWZ0ICYgVFJpZ2h0O1xuXG4vLyB0eXBlIE1lcmdlPEwsIFI+ID0gTCBleHRlbmRzIHZvaWQgPyBSXG4vLyAgIDogUiBleHRlbmRzIHZvaWQgPyBMXG4vLyAgIDogT21pdDxMLCBrZXlvZiBSPiAmIFI7XG5cbnR5cGUgTWVyZ2VSZWN1cnNpdmU8VExlZnQsIFRSaWdodD4gPSBUTGVmdCBleHRlbmRzIHZvaWQgPyBUUmlnaHRcbiAgOiBUUmlnaHQgZXh0ZW5kcyB2b2lkID8gVExlZnRcbiAgOiBUTGVmdCAmIFRSaWdodDtcblxudHlwZSBPcHRpb25hbE9yUmVxdWlyZWRWYWx1ZTxUVHlwZSBleHRlbmRzIHN0cmluZz4gPVxuICB8IGBbJHtUVHlwZX1dYFxuICB8IGA8JHtUVHlwZX0+YDtcbnR5cGUgUmVzdFZhbHVlID0gYC4uLiR7c3RyaW5nfWAgfCBgJHtzdHJpbmd9Li4uYDtcblxuLyoqXG4gKiBSZXN0IGFyZ3Mgd2l0aCBsaXN0IHR5cGUgYW5kIGNvbXBsZXRpb25zLlxuICpcbiAqIC0gYFsuLi5uYW1lOnR5cGVbXTpjb21wbGV0aW9uXWBcbiAqIC0gYDwuLi5uYW1lOnR5cGVbXTpjb21wbGV0aW9uPmBcbiAqIC0gYFtuYW1lLi4uOnR5cGVbXTpjb21wbGV0aW9uXWBcbiAqIC0gYDxuYW1lLi4uOnR5cGVbXTpjb21wbGV0aW9uPmBcbiAqL1xudHlwZSBSZXN0QXJnc0xpc3RUeXBlQ29tcGxldGlvbjxUVHlwZSBleHRlbmRzIHN0cmluZz4gPSBPcHRpb25hbE9yUmVxdWlyZWRWYWx1ZTxcbiAgYCR7UmVzdFZhbHVlfToke1RUeXBlfVtdOiR7c3RyaW5nfWBcbj47XG5cbi8qKlxuICogUmVzdCBhcmdzIHdpdGggbGlzdCB0eXBlLlxuICpcbiAqIC0gYFsuLi5uYW1lOnR5cGVbXV1gXG4gKiAtIGA8Li4ubmFtZTp0eXBlW10+YFxuICogLSBgW25hbWUuLi46dHlwZVtdXWBcbiAqIC0gYDxuYW1lLi4uOnR5cGVbXT5gXG4gKi9cbnR5cGUgUmVzdEFyZ3NMaXN0VHlwZTxUVHlwZSBleHRlbmRzIHN0cmluZz4gPSBPcHRpb25hbE9yUmVxdWlyZWRWYWx1ZTxcbiAgYCR7UmVzdFZhbHVlfToke1RUeXBlfVtdYFxuPjtcblxuLyoqXG4gKiBSZXN0IGFyZ3Mgd2l0aCB0eXBlIGFuZCBjb21wbGV0aW9ucy5cbiAqXG4gKiAtIGBbLi4ubmFtZTp0eXBlOmNvbXBsZXRpb25dYFxuICogLSBgPC4uLm5hbWU6dHlwZTpjb21wbGV0aW9uPmBcbiAqIC0gYFtuYW1lLi4uOnR5cGU6Y29tcGxldGlvbl1gXG4gKiAtIGA8bmFtZS4uLjp0eXBlOmNvbXBsZXRpb24+YFxuICovXG50eXBlIFJlc3RBcmdzVHlwZUNvbXBsZXRpb248VFR5cGUgZXh0ZW5kcyBzdHJpbmc+ID0gT3B0aW9uYWxPclJlcXVpcmVkVmFsdWU8XG4gIGAke1Jlc3RWYWx1ZX06JHtUVHlwZX06JHtzdHJpbmd9YFxuPjtcblxuLyoqXG4gKiBSZXN0IGFyZ3Mgd2l0aCB0eXBlLlxuICpcbiAqIC0gYFsuLi5uYW1lOnR5cGVdYFxuICogLSBgPC4uLm5hbWU6dHlwZT5gXG4gKiAtIGBbbmFtZS4uLjp0eXBlXWBcbiAqIC0gYDxuYW1lLi4uOnR5cGU+YFxuICovXG50eXBlIFJlc3RBcmdzVHlwZTxUVHlwZSBleHRlbmRzIHN0cmluZz4gPSBPcHRpb25hbE9yUmVxdWlyZWRWYWx1ZTxcbiAgYCR7UmVzdFZhbHVlfToke1RUeXBlfWBcbj47XG5cbi8qKlxuICogUmVzdCBhcmdzLlxuICogLSBgWy4uLm5hbWVdYFxuICogLSBgPC4uLm5hbWU+YFxuICogLSBgW25hbWUuLi5dYFxuICogLSBgPG5hbWUuLi4+YFxuICovXG50eXBlIFJlc3RBcmdzID0gT3B0aW9uYWxPclJlcXVpcmVkVmFsdWU8XG4gIGAke1Jlc3RWYWx1ZX1gXG4+O1xuXG4vKipcbiAqIFNpbmdsZSBhcmcgd2l0aCBsaXN0IHR5cGUgYW5kIGNvbXBsZXRpb25zLlxuICpcbiAqIC0gYFtuYW1lOnR5cGVbXTpjb21wbGV0aW9uXWBcbiAqIC0gYDxuYW1lOnR5cGVbXTpjb21wbGV0aW9uPmBcbiAqL1xudHlwZSBTaW5nbGVBcmdMaXN0VHlwZUNvbXBsZXRpb248VFR5cGUgZXh0ZW5kcyBzdHJpbmc+ID1cbiAgT3B0aW9uYWxPclJlcXVpcmVkVmFsdWU8XG4gICAgYCR7c3RyaW5nfToke1RUeXBlfVtdOiR7c3RyaW5nfWBcbiAgPjtcblxuLyoqXG4gKiBTaW5nbGUgYXJnIHdpdGggbGlzdCB0eXBlLlxuICpcbiAqIC0gYFtuYW1lOnR5cGVbXV1gXG4gKiAtIGA8bmFtZTp0eXBlW10+YFxuICovXG50eXBlIFNpbmdsZUFyZ0xpc3RUeXBlPFRUeXBlIGV4dGVuZHMgc3RyaW5nPiA9IE9wdGlvbmFsT3JSZXF1aXJlZFZhbHVlPFxuICBgJHtzdHJpbmd9OiR7VFR5cGV9W11gXG4+O1xuXG4vKipcbiAqIFNpbmdsZSBhcmcgIHdpdGggdHlwZSBhbmQgY29tcGxldGlvbi5cbiAqXG4gKiAtIGBbbmFtZTp0eXBlOmNvbXBsZXRpb25dYFxuICogLSBgPG5hbWU6dHlwZTpjb21wbGV0aW9uPmBcbiAqL1xudHlwZSBTaW5nbGVBcmdUeXBlQ29tcGxldGlvbjxUVHlwZSBleHRlbmRzIHN0cmluZz4gPSBPcHRpb25hbE9yUmVxdWlyZWRWYWx1ZTxcbiAgYCR7c3RyaW5nfToke1RUeXBlfToke3N0cmluZ31gXG4+O1xuXG4vKipcbiAqIFNpbmdsZSBhcmcgd2l0aCB0eXBlLlxuICpcbiAqIC0gYFtuYW1lOnR5cGVdYFxuICogLSBgPG5hbWU6dHlwZT5gXG4gKi9cbnR5cGUgU2luZ2xlQXJnVHlwZTxUVHlwZSBleHRlbmRzIHN0cmluZz4gPSBPcHRpb25hbE9yUmVxdWlyZWRWYWx1ZTxcbiAgYCR7c3RyaW5nfToke1RUeXBlfWBcbj47XG5cbi8qKlxuICogU2luZ2xlIGFyZy5cbiAqXG4gKiAtIGBbbmFtZV1gXG4gKiAtIGA8bmFtZT5gXG4gKi9cbnR5cGUgU2luZ2xlQXJnID0gT3B0aW9uYWxPclJlcXVpcmVkVmFsdWU8XG4gIGAke3N0cmluZ31gXG4+O1xuXG50eXBlIERlZmF1bHRUeXBlcyA9IHtcbiAgbnVtYmVyOiBOdW1iZXJUeXBlO1xuICBpbnRlZ2VyOiBJbnRlZ2VyVHlwZTtcbiAgc3RyaW5nOiBTdHJpbmdUeXBlO1xuICBib29sZWFuOiBCb29sZWFuVHlwZTtcbiAgZmlsZTogRmlsZVR5cGU7XG59O1xuXG50eXBlIEFyZ3VtZW50VHlwZTxcbiAgVEFyZyBleHRlbmRzIHN0cmluZyxcbiAgVEN1c3RvbVR5cGVzLFxuICBUVHlwZXMgPSBNZXJnZTxEZWZhdWx0VHlwZXMsIFRDdXN0b21UeXBlcz4sXG4+ID0gVEFyZyBleHRlbmRzIFJlc3RBcmdzTGlzdFR5cGVDb21wbGV0aW9uPGluZmVyIFR5cGU+XG4gID8gVFR5cGVzIGV4dGVuZHMgUmVjb3JkPFR5cGUsIGluZmVyIFI+ID8gQXJyYXk8QXJyYXk8Uj4+IDogdW5rbm93blxuICA6IFRBcmcgZXh0ZW5kcyBSZXN0QXJnc0xpc3RUeXBlPGluZmVyIFR5cGU+XG4gICAgPyBUVHlwZXMgZXh0ZW5kcyBSZWNvcmQ8VHlwZSwgaW5mZXIgUj4gPyBBcnJheTxBcnJheTxSPj4gOiB1bmtub3duXG4gIDogVEFyZyBleHRlbmRzIFJlc3RBcmdzVHlwZUNvbXBsZXRpb248aW5mZXIgVHlwZT5cbiAgICA/IFRUeXBlcyBleHRlbmRzIFJlY29yZDxUeXBlLCBpbmZlciBSPiA/IEFycmF5PFI+IDogdW5rbm93blxuICA6IFRBcmcgZXh0ZW5kcyBSZXN0QXJnc1R5cGU8aW5mZXIgVHlwZT5cbiAgICA/IFRUeXBlcyBleHRlbmRzIFJlY29yZDxUeXBlLCBpbmZlciBSPiA/IEFycmF5PFI+IDogdW5rbm93blxuICA6IFRBcmcgZXh0ZW5kcyBSZXN0QXJncyA/IEFycmF5PHN0cmluZz5cbiAgOiBUQXJnIGV4dGVuZHMgU2luZ2xlQXJnTGlzdFR5cGVDb21wbGV0aW9uPGluZmVyIFR5cGU+XG4gICAgPyBUVHlwZXMgZXh0ZW5kcyBSZWNvcmQ8VHlwZSwgaW5mZXIgUj4gPyBBcnJheTxSPiA6IHVua25vd25cbiAgOiBUQXJnIGV4dGVuZHMgU2luZ2xlQXJnTGlzdFR5cGU8aW5mZXIgVHlwZT5cbiAgICA/IFRUeXBlcyBleHRlbmRzIFJlY29yZDxUeXBlLCBpbmZlciBSPiA/IEFycmF5PFI+IDogdW5rbm93blxuICA6IFRBcmcgZXh0ZW5kcyBTaW5nbGVBcmdUeXBlQ29tcGxldGlvbjxpbmZlciBUeXBlPlxuICAgID8gVFR5cGVzIGV4dGVuZHMgUmVjb3JkPFR5cGUsIGluZmVyIFI+ID8gUiA6IHVua25vd25cbiAgOiBUQXJnIGV4dGVuZHMgU2luZ2xlQXJnVHlwZTxpbmZlciBUeXBlPlxuICAgID8gVFR5cGVzIGV4dGVuZHMgUmVjb3JkPFR5cGUsIGluZmVyIFI+ID8gUiA6IHVua25vd25cbiAgOiBUQXJnIGV4dGVuZHMgU2luZ2xlQXJnID8gc3RyaW5nXG4gIDogdW5rbm93bjtcblxudHlwZSBBcmd1bWVudFR5cGVzPFRGbGFncyBleHRlbmRzIHN0cmluZywgVD4gPSBURmxhZ3MgZXh0ZW5kc1xuICBgJHtzdHJpbmd9ICR7c3RyaW5nfWAgPyBUeXBlZEFyZ3VtZW50czxURmxhZ3MsIFQ+XG4gIDogQXJndW1lbnRUeXBlPFRGbGFncywgVD47XG5cbnR5cGUgR2V0QXJndW1lbnRzPFRGbGFncyBleHRlbmRzIHN0cmluZz4gPSBURmxhZ3MgZXh0ZW5kc1xuICBgLSR7c3RyaW5nfT0ke2luZmVyIFJlc3RGbGFnc31gID8gR2V0QXJndW1lbnRzPFJlc3RGbGFncz5cbiAgOiBURmxhZ3MgZXh0ZW5kcyBgLSR7c3RyaW5nfSAke2luZmVyIFJlc3RGbGFnc31gID8gR2V0QXJndW1lbnRzPFJlc3RGbGFncz5cbiAgOiBURmxhZ3M7XG5cbnR5cGUgT3B0aW9uTmFtZTxOYW1lIGV4dGVuZHMgc3RyaW5nPiA9IE5hbWUgZXh0ZW5kcyBcIipcIiA/IHN0cmluZ1xuICA6IENhbWVsQ2FzZTxUcmltUmlnaHQ8TmFtZSwgXCIsXCI+PjtcblxudHlwZSBJc1JlcXVpcmVkPFRSZXF1aXJlZCBleHRlbmRzIGJvb2xlYW4gfCB1bmRlZmluZWQsIFREZWZhdWx0PiA9XG4gIFRSZXF1aXJlZCBleHRlbmRzIHRydWUgPyB0cnVlXG4gICAgOiBURGVmYXVsdCBleHRlbmRzIHVuZGVmaW5lZCA/IGZhbHNlXG4gICAgOiB0cnVlO1xuXG50eXBlIE5lZ2F0YWJsZU9wdGlvbjxcbiAgVE5hbWUgZXh0ZW5kcyBzdHJpbmcsXG4gIFRPcHRpb25zLFxuICBURGVmYXVsdCxcbj4gPSBURGVmYXVsdCBleHRlbmRzIHVuZGVmaW5lZFxuICA/IE9wdGlvbk5hbWU8VE5hbWU+IGV4dGVuZHMga2V5b2YgVE9wdGlvbnNcbiAgICA/IHsgW0tleSBpbiBPcHRpb25OYW1lPFROYW1lPl0/OiBmYWxzZSB9XG4gIDogeyBbS2V5IGluIE9wdGlvbk5hbWU8VE5hbWU+XTogYm9vbGVhbiB9XG4gIDogeyBbS2V5IGluIE9wdGlvbk5hbWU8VE5hbWU+XTogTm9uTnVsbGFibGU8VERlZmF1bHQ+IHwgZmFsc2UgfTtcblxudHlwZSBCb29sZWFuT3B0aW9uPFxuICBUTmFtZSBleHRlbmRzIHN0cmluZyxcbiAgVE9wdGlvbnMsXG4gIFRSZXF1aXJlZCBleHRlbmRzIGJvb2xlYW4gfCB1bmRlZmluZWQgPSB1bmRlZmluZWQsXG4gIFREZWZhdWx0ID0gdW5kZWZpbmVkLFxuPiA9IFROYW1lIGV4dGVuZHMgYG5vLSR7aW5mZXIgTmFtZX1gID8gTmVnYXRhYmxlT3B0aW9uPE5hbWUsIFRPcHRpb25zLCBURGVmYXVsdD5cbiAgOiBUTmFtZSBleHRlbmRzIGAke2luZmVyIE5hbWV9LiR7aW5mZXIgUmVzdH1gID8gKFRSZXF1aXJlZCBleHRlbmRzIHRydWUgPyB7XG4gICAgICAgIFtLZXkgaW4gT3B0aW9uTmFtZTxOYW1lPl06IEJvb2xlYW5PcHRpb248XG4gICAgICAgICAgUmVzdCxcbiAgICAgICAgICBUT3B0aW9ucyxcbiAgICAgICAgICBUUmVxdWlyZWQsXG4gICAgICAgICAgVERlZmF1bHRcbiAgICAgICAgPjtcbiAgICAgIH1cbiAgICAgIDoge1xuICAgICAgICBbS2V5IGluIE9wdGlvbk5hbWU8TmFtZT5dPzogQm9vbGVhbk9wdGlvbjxcbiAgICAgICAgICBSZXN0LFxuICAgICAgICAgIFRPcHRpb25zLFxuICAgICAgICAgIFRSZXF1aXJlZCxcbiAgICAgICAgICBURGVmYXVsdFxuICAgICAgICA+O1xuICAgICAgfSlcbiAgOiAoVFJlcXVpcmVkIGV4dGVuZHMgdHJ1ZSA/IHsgW0tleSBpbiBPcHRpb25OYW1lPFROYW1lPl06IHRydWUgfCBURGVmYXVsdCB9XG4gICAgOiB7IFtLZXkgaW4gT3B0aW9uTmFtZTxUTmFtZT5dPzogdHJ1ZSB8IFREZWZhdWx0IH0pO1xuXG50eXBlIFZhbHVlT3B0aW9uPFxuICBUTmFtZSBleHRlbmRzIHN0cmluZyxcbiAgVFJlc3RGbGFncyBleHRlbmRzIHN0cmluZyxcbiAgVFR5cGVzLFxuICBUUmVxdWlyZWQgZXh0ZW5kcyBib29sZWFuIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkLFxuICBURGVmYXVsdCA9IHVuZGVmaW5lZCxcbj4gPSBUTmFtZSBleHRlbmRzIGAke2luZmVyIE5hbWV9LiR7aW5mZXIgUmVzdE5hbWV9YFxuICA/IChUUmVxdWlyZWQgZXh0ZW5kcyB0cnVlID8ge1xuICAgICAgW0tleSBpbiBPcHRpb25OYW1lPE5hbWU+XTogVmFsdWVPcHRpb248XG4gICAgICAgIFJlc3ROYW1lLFxuICAgICAgICBUUmVzdEZsYWdzLFxuICAgICAgICBUVHlwZXMsXG4gICAgICAgIFRSZXF1aXJlZCxcbiAgICAgICAgVERlZmF1bHRcbiAgICAgID47XG4gICAgfVxuICAgIDoge1xuICAgICAgW0tleSBpbiBPcHRpb25OYW1lPE5hbWU+XT86IFZhbHVlT3B0aW9uPFxuICAgICAgICBSZXN0TmFtZSxcbiAgICAgICAgVFJlc3RGbGFncyxcbiAgICAgICAgVFR5cGVzLFxuICAgICAgICBUUmVxdWlyZWQsXG4gICAgICAgIFREZWZhdWx0XG4gICAgICA+O1xuICAgIH0pXG4gIDogKFRSZXF1aXJlZCBleHRlbmRzIHRydWUgPyB7XG4gICAgICBbS2V5IGluIE9wdGlvbk5hbWU8VE5hbWU+XTogR2V0QXJndW1lbnRzPFRSZXN0RmxhZ3M+IGV4dGVuZHMgYFske3N0cmluZ31dYFxuICAgICAgICA/IFxuICAgICAgICAgIHwgTm9uTnVsbGFibGU8VERlZmF1bHQ+XG4gICAgICAgICAgfCB0cnVlXG4gICAgICAgICAgfCBBcmd1bWVudFR5cGU8R2V0QXJndW1lbnRzPFRSZXN0RmxhZ3M+LCBUVHlwZXM+XG4gICAgICAgIDogXG4gICAgICAgICAgfCBOb25OdWxsYWJsZTxURGVmYXVsdD5cbiAgICAgICAgICB8IEFyZ3VtZW50VHlwZTxHZXRBcmd1bWVudHM8VFJlc3RGbGFncz4sIFRUeXBlcz47XG4gICAgfVxuICAgIDoge1xuICAgICAgW0tleSBpbiBPcHRpb25OYW1lPFROYW1lPl0/OiBHZXRBcmd1bWVudHM8VFJlc3RGbGFncz4gZXh0ZW5kc1xuICAgICAgICBgWyR7c3RyaW5nfV1gID8gXG4gICAgICAgICAgfCBOb25OdWxsYWJsZTxURGVmYXVsdD5cbiAgICAgICAgICB8IHRydWVcbiAgICAgICAgICB8IEFyZ3VtZW50VHlwZTxHZXRBcmd1bWVudHM8VFJlc3RGbGFncz4sIFRUeXBlcz5cbiAgICAgICAgOiBcbiAgICAgICAgICB8IE5vbk51bGxhYmxlPFREZWZhdWx0PlxuICAgICAgICAgIHwgQXJndW1lbnRUeXBlPEdldEFyZ3VtZW50czxUUmVzdEZsYWdzPiwgVFR5cGVzPjtcbiAgICB9KTtcblxudHlwZSBWYWx1ZXNPcHRpb248XG4gIFROYW1lIGV4dGVuZHMgc3RyaW5nLFxuICBUUmVzdEZsYWdzIGV4dGVuZHMgc3RyaW5nLFxuICBUVHlwZXMsXG4gIFRSZXF1aXJlZCBleHRlbmRzIGJvb2xlYW4gfCB1bmRlZmluZWQgPSB1bmRlZmluZWQsXG4gIFREZWZhdWx0ID0gdW5kZWZpbmVkLFxuPiA9IFROYW1lIGV4dGVuZHMgYCR7aW5mZXIgTmFtZX0uJHtpbmZlciBSZXN0TmFtZX1gXG4gID8gKFRSZXF1aXJlZCBleHRlbmRzIHRydWUgPyB7XG4gICAgICBbS2V5IGluIE9wdGlvbk5hbWU8TmFtZT5dOiBWYWx1ZXNPcHRpb248XG4gICAgICAgIFJlc3ROYW1lLFxuICAgICAgICBUUmVzdEZsYWdzLFxuICAgICAgICBUVHlwZXMsXG4gICAgICAgIFRSZXF1aXJlZCxcbiAgICAgICAgVERlZmF1bHRcbiAgICAgID47XG4gICAgfVxuICAgIDoge1xuICAgICAgW0tleSBpbiBPcHRpb25OYW1lPE5hbWU+XT86IFZhbHVlc09wdGlvbjxcbiAgICAgICAgUmVzdE5hbWUsXG4gICAgICAgIFRSZXN0RmxhZ3MsXG4gICAgICAgIFRUeXBlcyxcbiAgICAgICAgVFJlcXVpcmVkLFxuICAgICAgICBURGVmYXVsdFxuICAgICAgPjtcbiAgICB9KVxuICA6IChUUmVxdWlyZWQgZXh0ZW5kcyB0cnVlID8ge1xuICAgICAgW0tleSBpbiBPcHRpb25OYW1lPFROYW1lPl06IEdldEFyZ3VtZW50czxUUmVzdEZsYWdzPiBleHRlbmRzIGBbJHtzdHJpbmd9XWBcbiAgICAgICAgPyBcbiAgICAgICAgICB8IE5vbk51bGxhYmxlPFREZWZhdWx0PlxuICAgICAgICAgIHwgdHJ1ZVxuICAgICAgICAgIHwgQXJndW1lbnRUeXBlczxHZXRBcmd1bWVudHM8VFJlc3RGbGFncz4sIFRUeXBlcz5cbiAgICAgICAgOiBcbiAgICAgICAgICB8IE5vbk51bGxhYmxlPFREZWZhdWx0PlxuICAgICAgICAgIHwgQXJndW1lbnRUeXBlczxHZXRBcmd1bWVudHM8VFJlc3RGbGFncz4sIFRUeXBlcz47XG4gICAgfVxuICAgIDoge1xuICAgICAgW0tleSBpbiBPcHRpb25OYW1lPFROYW1lPl0/OiBHZXRBcmd1bWVudHM8VFJlc3RGbGFncz4gZXh0ZW5kc1xuICAgICAgICBgWyR7c3RyaW5nfV1gID8gXG4gICAgICAgICAgfCBOb25OdWxsYWJsZTxURGVmYXVsdD5cbiAgICAgICAgICB8IHRydWVcbiAgICAgICAgICB8IEFyZ3VtZW50VHlwZXM8R2V0QXJndW1lbnRzPFRSZXN0RmxhZ3M+LCBUVHlwZXM+XG4gICAgICAgIDogXG4gICAgICAgICAgfCBOb25OdWxsYWJsZTxURGVmYXVsdD5cbiAgICAgICAgICB8IEFyZ3VtZW50VHlwZXM8R2V0QXJndW1lbnRzPFRSZXN0RmxhZ3M+LCBUVHlwZXM+O1xuICAgIH0pO1xuXG50eXBlIE1hcFZhbHVlPFRPcHRpb25zLCBUTWFwcGVkT3B0aW9ucywgVENvbGxlY3QgPSB1bmRlZmluZWQ+ID1cbiAgVE1hcHBlZE9wdGlvbnMgZXh0ZW5kcyB1bmRlZmluZWQgPyBUQ29sbGVjdCBleHRlbmRzIHRydWUgPyB7XG4gICAgICAgIFtLZXkgaW4ga2V5b2YgVE9wdGlvbnNdOiBUT3B0aW9uc1tLZXldIGV4dGVuZHNcbiAgICAgICAgICAoUmVjb3JkPHN0cmluZywgdW5rbm93bj4gfCB1bmRlZmluZWQpXG4gICAgICAgICAgPyBNYXBWYWx1ZTxUT3B0aW9uc1tLZXldLCBUTWFwcGVkT3B0aW9ucz5cbiAgICAgICAgICA6IEFycmF5PE5vbk51bGxhYmxlPFRPcHRpb25zW0tleV0+PjtcbiAgICAgIH1cbiAgICA6IFRPcHRpb25zXG4gICAgOiB7XG4gICAgICBbS2V5IGluIGtleW9mIFRPcHRpb25zXTogVE9wdGlvbnNbS2V5XSBleHRlbmRzXG4gICAgICAgIChSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiB8IHVuZGVmaW5lZClcbiAgICAgICAgPyBNYXBWYWx1ZTxUT3B0aW9uc1tLZXldLCBUTWFwcGVkT3B0aW9ucz5cbiAgICAgICAgOiBUTWFwcGVkT3B0aW9ucztcbiAgICB9O1xuXG50eXBlIEdldE9wdGlvbk5hbWU8VEZsYWdzPiA9IFRGbGFncyBleHRlbmRzIGAke3N0cmluZ30tLSR7aW5mZXIgTmFtZX09JHtzdHJpbmd9YFxuICA/IFRyaW1SaWdodDxOYW1lLCBcIixcIj5cbiAgOiBURmxhZ3MgZXh0ZW5kcyBgJHtzdHJpbmd9LS0ke2luZmVyIE5hbWV9ICR7c3RyaW5nfWAgPyBUcmltUmlnaHQ8TmFtZSwgXCIsXCI+XG4gIDogVEZsYWdzIGV4dGVuZHMgYCR7c3RyaW5nfS0tJHtpbmZlciBOYW1lfWAgPyBOYW1lXG4gIDogVEZsYWdzIGV4dGVuZHMgYC0ke2luZmVyIE5hbWV9PSR7c3RyaW5nfWAgPyBUcmltUmlnaHQ8TmFtZSwgXCIsXCI+XG4gIDogVEZsYWdzIGV4dGVuZHMgYC0ke2luZmVyIE5hbWV9ICR7c3RyaW5nfWAgPyBUcmltUmlnaHQ8TmFtZSwgXCIsXCI+XG4gIDogVEZsYWdzIGV4dGVuZHMgYC0ke2luZmVyIE5hbWV9YCA/IE5hbWVcbiAgOiB1bmtub3duO1xuXG50eXBlIE1lcmdlT3B0aW9uczxcbiAgVEZsYWdzLFxuICBUT3B0aW9ucyxcbiAgVE1hcHBlZE9wdGlvbnMsXG4gIFROYW1lID0gR2V0T3B0aW9uTmFtZTxURmxhZ3M+LFxuPiA9IFROYW1lIGV4dGVuZHMgYG5vLSR7c3RyaW5nfWAgPyBTcHJlYWQ8VE9wdGlvbnMsIFRNYXBwZWRPcHRpb25zPlxuICA6IFROYW1lIGV4dGVuZHMgYCR7c3RyaW5nfS4ke3N0cmluZ31gXG4gICAgPyBNZXJnZVJlY3Vyc2l2ZTxUT3B0aW9ucywgVE1hcHBlZE9wdGlvbnM+XG4gIDogTWVyZ2U8VE9wdGlvbnMsIFRNYXBwZWRPcHRpb25zPjtcblxuLy8gdHlwZSBNZXJnZU9wdGlvbnM8VCwgQ08sIE8sIE4gPSBHZXRPcHRpb25OYW1lPFQ+PiA9IE4gZXh0ZW5kcyBgbm8tJHtzdHJpbmd9YFxuLy8gICA/IFNwcmVhZDxDTywgTz5cbi8vICAgOiBOIGV4dGVuZHMgYCR7aW5mZXIgTmFtZX0uJHtpbmZlciBDaGlsZH1gXG4vLyAgICAgPyAoT3B0aW9uTmFtZTxOYW1lPiBleHRlbmRzIGtleW9mIE1lcmdlPENPLCBPPlxuLy8gICAgICAgPyBPcHRpb25OYW1lPENoaWxkPiBleHRlbmRzXG4vLyAgICAgICAgIGtleW9mIE5vbk51bGxhYmxlPE1lcmdlPENPLCBPPltPcHRpb25OYW1lPE5hbWU+XT4gPyBTcHJlYWRUd288Q08sIE8+XG4vLyAgICAgICA6IE1lcmdlUmVjdXJzaXZlPENPLCBPPlxuLy8gICAgICAgOiBNZXJnZVJlY3Vyc2l2ZTxDTywgTz4pXG4vLyAgIDogTWVyZ2U8Q08sIE8+O1xuXG50eXBlIFR5cGVkT3B0aW9uPFxuICBURmxhZ3MgZXh0ZW5kcyBzdHJpbmcsXG4gIFRPcHRpb25zLFxuICBUVHlwZXMsXG4gIFRSZXF1aXJlZCBleHRlbmRzIGJvb2xlYW4gfCB1bmRlZmluZWQgPSB1bmRlZmluZWQsXG4gIFREZWZhdWx0ID0gdW5kZWZpbmVkLFxuPiA9IG51bWJlciBleHRlbmRzIFRUeXBlcyA/IGFueVxuICA6IFRGbGFncyBleHRlbmRzIGAke3N0cmluZ30tLSR7aW5mZXIgTmFtZX09JHtpbmZlciBUUmVzdEZsYWdzfWBcbiAgICA/IFZhbHVlc09wdGlvbjxcbiAgICAgIE5hbWUsXG4gICAgICBUUmVzdEZsYWdzLFxuICAgICAgVFR5cGVzLFxuICAgICAgSXNSZXF1aXJlZDxUUmVxdWlyZWQsIFREZWZhdWx0PixcbiAgICAgIFREZWZhdWx0XG4gICAgPlxuICA6IFRGbGFncyBleHRlbmRzIGAke3N0cmluZ30tLSR7aW5mZXIgTmFtZX0gJHtpbmZlciBUUmVzdEZsYWdzfWBcbiAgICA/IFZhbHVlc09wdGlvbjxcbiAgICAgIE5hbWUsXG4gICAgICBUUmVzdEZsYWdzLFxuICAgICAgVFR5cGVzLFxuICAgICAgSXNSZXF1aXJlZDxUUmVxdWlyZWQsIFREZWZhdWx0PixcbiAgICAgIFREZWZhdWx0XG4gICAgPlxuICA6IFRGbGFncyBleHRlbmRzIGAke3N0cmluZ30tLSR7aW5mZXIgTmFtZX1gXG4gICAgPyBCb29sZWFuT3B0aW9uPE5hbWUsIFRPcHRpb25zLCBJc1JlcXVpcmVkPFRSZXF1aXJlZCwgVERlZmF1bHQ+LCBURGVmYXVsdD5cbiAgOiBURmxhZ3MgZXh0ZW5kcyBgLSR7aW5mZXIgTmFtZX09JHtpbmZlciBUUmVzdEZsYWdzfWAgPyBWYWx1ZXNPcHRpb248XG4gICAgICBOYW1lLFxuICAgICAgVFJlc3RGbGFncyxcbiAgICAgIFRUeXBlcyxcbiAgICAgIElzUmVxdWlyZWQ8VFJlcXVpcmVkLCBURGVmYXVsdD4sXG4gICAgICBURGVmYXVsdFxuICAgID5cbiAgOiBURmxhZ3MgZXh0ZW5kcyBgLSR7aW5mZXIgTmFtZX0gJHtpbmZlciBUUmVzdEZsYWdzfWAgPyBWYWx1ZXNPcHRpb248XG4gICAgICBOYW1lLFxuICAgICAgVFJlc3RGbGFncyxcbiAgICAgIFRUeXBlcyxcbiAgICAgIElzUmVxdWlyZWQ8VFJlcXVpcmVkLCBURGVmYXVsdD4sXG4gICAgICBURGVmYXVsdFxuICAgID5cbiAgOiBURmxhZ3MgZXh0ZW5kcyBgLSR7aW5mZXIgTmFtZX1gXG4gICAgPyBCb29sZWFuT3B0aW9uPE5hbWUsIFRPcHRpb25zLCBJc1JlcXVpcmVkPFRSZXF1aXJlZCwgVERlZmF1bHQ+LCBURGVmYXVsdD5cbiAgOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPjtcblxudHlwZSBUeXBlZEFyZ3VtZW50czxUQXJncyBleHRlbmRzIHN0cmluZywgVFR5cGVzPiA9IG51bWJlciBleHRlbmRzIFRUeXBlcyA/IGFueVxuICA6IFRBcmdzIGV4dGVuZHMgYCR7aW5mZXIgVEFyZ30gJHtpbmZlciBUUmVzdEFyZ3N9YFxuICAgID8gVEFyZyBleHRlbmRzIGBbJHtzdHJpbmd9XWBcbiAgICAgID8gW0FyZ3VtZW50VHlwZTxUQXJnLCBUVHlwZXM+PywgLi4uVHlwZWRBcmd1bWVudHM8VFJlc3RBcmdzLCBUVHlwZXM+XVxuICAgIDogW0FyZ3VtZW50VHlwZTxUQXJnLCBUVHlwZXM+LCAuLi5UeXBlZEFyZ3VtZW50czxUUmVzdEFyZ3MsIFRUeXBlcz5dXG4gIDogVEFyZ3MgZXh0ZW5kcyBgJHtzdHJpbmd9Li4uJHtzdHJpbmd9YCA/IFtcbiAgICAgIC4uLkFyZ3VtZW50VHlwZTxUQXJncywgVFR5cGVzPiBleHRlbmRzIEFycmF5PGluZmVyIFRWYWx1ZT5cbiAgICAgICAgPyBUQXJncyBleHRlbmRzIGBbJHtzdHJpbmd9XWAgPyBBcnJheTxUVmFsdWU+XG4gICAgICAgIDogW1RWYWx1ZSwgLi4uQXJyYXk8VFZhbHVlPl1cbiAgICAgICAgOiBuZXZlcixcbiAgICBdXG4gIDogVEFyZ3MgZXh0ZW5kcyBgWyR7c3RyaW5nfV1gID8gW0FyZ3VtZW50VHlwZTxUQXJncywgVFR5cGVzPj9dXG4gIDogW0FyZ3VtZW50VHlwZTxUQXJncywgVFR5cGVzPl07XG5cbnR5cGUgVHlwZWRDb21tYW5kQXJndW1lbnRzPFROYW1lQW5kQXJndW1lbnRzIGV4dGVuZHMgc3RyaW5nLCBUVHlwZXM+ID1cbiAgbnVtYmVyIGV4dGVuZHMgVFR5cGVzID8gYW55XG4gICAgOiBUTmFtZUFuZEFyZ3VtZW50cyBleHRlbmRzIGAke3N0cmluZ30gJHtpbmZlciBURmxhZ3N9YFxuICAgICAgPyBUeXBlZEFyZ3VtZW50czxURmxhZ3MsIFRUeXBlcz5cbiAgICA6IFtdO1xuXG50eXBlIFR5cGVkRW52PFxuICBUTmFtZUFuZFZhbHVlIGV4dGVuZHMgc3RyaW5nLFxuICBUUHJlZml4IGV4dGVuZHMgc3RyaW5nIHwgdW5kZWZpbmVkLFxuICBUT3B0aW9ucyxcbiAgVFR5cGVzLFxuICBUUmVxdWlyZWQgZXh0ZW5kcyBib29sZWFuIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkLFxuICBURGVmYXVsdCA9IHVuZGVmaW5lZCxcbj4gPSBudW1iZXIgZXh0ZW5kcyBUVHlwZXMgPyBhbnlcbiAgOiBUTmFtZUFuZFZhbHVlIGV4dGVuZHMgYCR7aW5mZXIgTmFtZX09JHtpbmZlciBSZXN0fWBcbiAgICA/IFZhbHVlT3B0aW9uPFRyaW1MZWZ0PE5hbWUsIFRQcmVmaXg+LCBSZXN0LCBUVHlwZXMsIFRSZXF1aXJlZCwgVERlZmF1bHQ+XG4gIDogVE5hbWVBbmRWYWx1ZSBleHRlbmRzIGAke2luZmVyIE5hbWV9ICR7aW5mZXIgUmVzdH1gXG4gICAgPyBWYWx1ZU9wdGlvbjxUcmltTGVmdDxOYW1lLCBUUHJlZml4PiwgUmVzdCwgVFR5cGVzLCBUUmVxdWlyZWQsIFREZWZhdWx0PlxuICA6IFROYW1lQW5kVmFsdWUgZXh0ZW5kcyBgJHtpbmZlciBOYW1lfWBcbiAgICA/IEJvb2xlYW5PcHRpb248VHJpbUxlZnQ8TmFtZSwgVFByZWZpeD4sIFRPcHRpb25zLCBUUmVxdWlyZWQsIFREZWZhdWx0PlxuICA6IFJlY29yZDxzdHJpbmcsIHVua25vd24+O1xuXG50eXBlIFR5cGVkVHlwZTxcbiAgVE5hbWUgZXh0ZW5kcyBzdHJpbmcsXG4gIFRIYW5kbGVyIGV4dGVuZHMgVHlwZU9yVHlwZUhhbmRsZXI8dW5rbm93bj4sXG4+ID0geyBbTmFtZSBpbiBUTmFtZV06IFRIYW5kbGVyIH07XG5cbnR5cGUgUmVxdWlyZWRLZXlzPFRSZWNvcmQ+ID0ge1xuICAvLyBkZW5vLWxpbnQtaWdub3JlIGJhbi10eXBlc1xuICBbS2V5IGluIGtleW9mIFRSZWNvcmRdLT86IHt9IGV4dGVuZHMgUGljazxUUmVjb3JkLCBLZXk+ID8gbmV2ZXIgOiBLZXk7XG59W2tleW9mIFRSZWNvcmRdO1xuXG50eXBlIE9wdGlvbmFsS2V5czxUUmVjb3JkPiA9IHtcbiAgLy8gZGVuby1saW50LWlnbm9yZSBiYW4tdHlwZXNcbiAgW0tleSBpbiBrZXlvZiBUUmVjb3JkXS0/OiB7fSBleHRlbmRzIFBpY2s8VFJlY29yZCwgS2V5PiA/IEtleSA6IG5ldmVyO1xufVtrZXlvZiBUUmVjb3JkXTtcblxudHlwZSBTcHJlYWRSZXF1aXJlZFByb3BlcnRpZXM8XG4gIFRUYXJnZXQsXG4gIFRTb3VyY2UsXG4gIFRLZXlzIGV4dGVuZHMga2V5b2YgVFRhcmdldCAmIGtleW9mIFRTb3VyY2UsXG4+ID0ge1xuICBbS2V5IGluIFRLZXlzXTpcbiAgICB8IEV4Y2x1ZGU8VFRhcmdldFtLZXldLCB1bmRlZmluZWQ+XG4gICAgfCBFeGNsdWRlPFRTb3VyY2VbS2V5XSwgdW5kZWZpbmVkPjtcbn07XG5cbnR5cGUgU3ByZWFkT3B0aW9uYWxQcm9wZXJ0aWVzPFxuICBUVGFyZ2V0LFxuICBUU291cmNlLFxuICBUS2V5cyBleHRlbmRzIGtleW9mIFRUYXJnZXQgJiBrZXlvZiBUU291cmNlLFxuPiA9IHtcbiAgW0tleSBpbiBUS2V5c10/OiBUVGFyZ2V0W0tleV0gfCBUU291cmNlW0tleV07XG59O1xuXG4vKiogTWVyZ2UgdHlwZXMgb2YgdHdvIG9iamVjdHMuICovXG50eXBlIFNwcmVhZDxUVGFyZ2V0LCBUU291cmNlPiA9IFRUYXJnZXQgZXh0ZW5kcyB2b2lkID8gVFNvdXJjZVxuICA6IFRTb3VyY2UgZXh0ZW5kcyB2b2lkID8gVFRhcmdldFxuICAvLyBQcm9wZXJ0aWVzIGluIEwgdGhhdCBkb24ndCBleGlzdCBpbiBSLlxuICA6IFxuICAgICYgT21pdDxUVGFyZ2V0LCBrZXlvZiBUU291cmNlPlxuICAgIC8vIFByb3BlcnRpZXMgaW4gUiB0aGF0IGRvbid0IGV4aXN0IGluIEwuXG4gICAgJiBPbWl0PFRTb3VyY2UsIGtleW9mIFRUYXJnZXQ+XG4gICAgLy8gUmVxdWlyZWQgcHJvcGVydGllcyBpbiBSIHRoYXQgZXhpc3QgaW4gTC5cbiAgICAmIFNwcmVhZFJlcXVpcmVkUHJvcGVydGllczxcbiAgICAgIFRUYXJnZXQsXG4gICAgICBUU291cmNlLFxuICAgICAgUmVxdWlyZWRLZXlzPFRTb3VyY2U+ICYga2V5b2YgVFRhcmdldFxuICAgID5cbiAgICAvLyBSZXF1aXJlZCBwcm9wZXJ0aWVzIGluIEwgdGhhdCBleGlzdCBpbiBSLlxuICAgICYgU3ByZWFkUmVxdWlyZWRQcm9wZXJ0aWVzPFxuICAgICAgVFRhcmdldCxcbiAgICAgIFRTb3VyY2UsXG4gICAgICBSZXF1aXJlZEtleXM8VFRhcmdldD4gJiBrZXlvZiBUU291cmNlXG4gICAgPlxuICAgIC8vIE9wdGlvbmFsIHByb3BlcnRpZXMgaW4gTCBhbmQgUi5cbiAgICAmIFNwcmVhZE9wdGlvbmFsUHJvcGVydGllczxcbiAgICAgIFRUYXJnZXQsXG4gICAgICBUU291cmNlLFxuICAgICAgT3B0aW9uYWxLZXlzPFRUYXJnZXQ+ICYgT3B0aW9uYWxLZXlzPFRTb3VyY2U+XG4gICAgPjtcblxudHlwZSBWYWx1ZU9mPFRWYWx1ZT4gPSBUVmFsdWUgZXh0ZW5kcyBSZWNvcmQ8c3RyaW5nLCBpbmZlciBWPiA/IFZhbHVlT2Y8Vj5cbiAgOiBUVmFsdWU7XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsd0NBQXdDO0FBQ3hDLFNBQ0UsZ0JBQWdCLEVBQ2hCLG1CQUFtQixvQkFBb0IsUUFDbEMsc0JBQXNCO0FBQzdCLFNBQVMsMEJBQTBCLFFBQVEsZUFBZTtBQUMxRCxTQUFTLFVBQVUsUUFBUSxvQkFBb0I7QUFFL0MsU0FDRSxjQUFjLEVBQ2Qsd0JBQXdCLEVBQ3hCLGNBQWMsUUFDVCxjQUFjO0FBQ3JCLFNBQVMsSUFBSSxFQUFFLFVBQVUsRUFBRSxHQUFH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