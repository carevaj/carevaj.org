import { log } from "./utils/log.ts";
/**
 * Script runner to store and run commands or execute functions
 * It can execute the scripts and functions in parallel or sequentially
 */ export default class Scripts {
  /** The current working directory */ cwd;
  /** All registered scripts and functions */ scripts = new Map();
  constructor(options = {}){
    this.cwd = options.cwd || Deno.cwd();
  }
  /** Register one or more scripts under a specific name */ set(name, ...scripts) {
    this.scripts.set(name, scripts);
  }
  /** Run one or more commands */ async run(...names) {
    for (const name of names){
      const success = await this.#run(name);
      if (!success) {
        return false;
      }
    }
    return true;
  }
  /** Run an individual script or function */ async #run(name) {
    if (typeof name === "string" && this.scripts.has(name)) {
      log.info(`[script] ${name}`);
      const command = this.scripts.get(name);
      return this.run(...command);
    }
    if (Array.isArray(name)) {
      const results = await Promise.all(name.map((n)=>this.#run(n)));
      return results.every((success)=>success);
    }
    if (typeof name === "function") {
      return this.#runFunction(name);
    }
    return this.#runScript(name);
  }
  /** Run a function */ async #runFunction(fn) {
    if (fn.name) {
      log.info(`[script] ${fn.name}()`);
    }
    const result = await fn();
    return result !== false;
  }
  /** Run a shell command */ async #runScript(script) {
    log.info(`[script] ${script}`);
    const args = shArgs(script);
    const cmd = args.shift();
    const command = new Deno.Command(cmd, {
      args,
      stdout: "inherit",
      stderr: "inherit",
      cwd: this.cwd
    });
    const output = await command.output();
    return output.success;
  }
}
/** Returns the shell arguments for the current platform */ function shArgs(script) {
  return Deno.build.os === "windows" ? [
    "PowerShell.exe",
    "-Command",
    script
  ] : [
    "/usr/bin/env",
    "bash",
    "-c",
    script
  ];
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvbHVtZUB2Mi4yLjAvY29yZS9zY3JpcHRzLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGxvZyB9IGZyb20gXCIuL3V0aWxzL2xvZy50c1wiO1xuXG5leHBvcnQgaW50ZXJmYWNlIE9wdGlvbnMge1xuICAvKiogVGhlIGN1cnJlbnQgd29ya2luZyBkaXJlY3RvcnkgKi9cbiAgY3dkPzogc3RyaW5nO1xufVxuXG4vKipcbiAqIFNjcmlwdCBydW5uZXIgdG8gc3RvcmUgYW5kIHJ1biBjb21tYW5kcyBvciBleGVjdXRlIGZ1bmN0aW9uc1xuICogSXQgY2FuIGV4ZWN1dGUgdGhlIHNjcmlwdHMgYW5kIGZ1bmN0aW9ucyBpbiBwYXJhbGxlbCBvciBzZXF1ZW50aWFsbHlcbiAqL1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgU2NyaXB0cyB7XG4gIC8qKiBUaGUgY3VycmVudCB3b3JraW5nIGRpcmVjdG9yeSAqL1xuICBjd2Q6IHN0cmluZztcblxuICAvKiogQWxsIHJlZ2lzdGVyZWQgc2NyaXB0cyBhbmQgZnVuY3Rpb25zICovXG4gIHNjcmlwdHMgPSBuZXcgTWFwPHN0cmluZywgU2NyaXB0T3JGdW5jdGlvbltdPigpO1xuXG4gIGNvbnN0cnVjdG9yKG9wdGlvbnM6IE9wdGlvbnMgPSB7fSkge1xuICAgIHRoaXMuY3dkID0gb3B0aW9ucy5jd2QgfHwgRGVuby5jd2QoKTtcbiAgfVxuXG4gIC8qKiBSZWdpc3RlciBvbmUgb3IgbW9yZSBzY3JpcHRzIHVuZGVyIGEgc3BlY2lmaWMgbmFtZSAqL1xuICBzZXQobmFtZTogc3RyaW5nLCAuLi5zY3JpcHRzOiBTY3JpcHRPckZ1bmN0aW9uW10pOiB2b2lkIHtcbiAgICB0aGlzLnNjcmlwdHMuc2V0KG5hbWUsIHNjcmlwdHMpO1xuICB9XG5cbiAgLyoqIFJ1biBvbmUgb3IgbW9yZSBjb21tYW5kcyAqL1xuICBhc3luYyBydW4oXG4gICAgLi4ubmFtZXM6IFNjcmlwdE9yRnVuY3Rpb25bXVxuICApOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICBmb3IgKGNvbnN0IG5hbWUgb2YgbmFtZXMpIHtcbiAgICAgIGNvbnN0IHN1Y2Nlc3MgPSBhd2FpdCB0aGlzLiNydW4obmFtZSk7XG5cbiAgICAgIGlmICghc3VjY2Vzcykge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICAvKiogUnVuIGFuIGluZGl2aWR1YWwgc2NyaXB0IG9yIGZ1bmN0aW9uICovXG4gIGFzeW5jICNydW4obmFtZTogU2NyaXB0T3JGdW5jdGlvbik6IFByb21pc2U8dW5rbm93bj4ge1xuICAgIGlmICh0eXBlb2YgbmFtZSA9PT0gXCJzdHJpbmdcIiAmJiB0aGlzLnNjcmlwdHMuaGFzKG5hbWUpKSB7XG4gICAgICBsb2cuaW5mbyhgW3NjcmlwdF0gJHtuYW1lfWApO1xuICAgICAgY29uc3QgY29tbWFuZCA9IHRoaXMuc2NyaXB0cy5nZXQobmFtZSkhO1xuICAgICAgcmV0dXJuIHRoaXMucnVuKC4uLmNvbW1hbmQpO1xuICAgIH1cblxuICAgIGlmIChBcnJheS5pc0FycmF5KG5hbWUpKSB7XG4gICAgICBjb25zdCByZXN1bHRzID0gYXdhaXQgUHJvbWlzZS5hbGwoXG4gICAgICAgIG5hbWUubWFwKChuKSA9PiB0aGlzLiNydW4obikpLFxuICAgICAgKTtcbiAgICAgIHJldHVybiByZXN1bHRzLmV2ZXJ5KChzdWNjZXNzKSA9PiBzdWNjZXNzKTtcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIG5hbWUgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgcmV0dXJuIHRoaXMuI3J1bkZ1bmN0aW9uKG5hbWUpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLiNydW5TY3JpcHQobmFtZSk7XG4gIH1cblxuICAvKiogUnVuIGEgZnVuY3Rpb24gKi9cbiAgYXN5bmMgI3J1bkZ1bmN0aW9uKGZuOiAoKSA9PiB1bmtub3duKSB7XG4gICAgaWYgKGZuLm5hbWUpIHtcbiAgICAgIGxvZy5pbmZvKGBbc2NyaXB0XSAke2ZuLm5hbWV9KClgKTtcbiAgICB9XG4gICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgZm4oKTtcbiAgICByZXR1cm4gcmVzdWx0ICE9PSBmYWxzZTtcbiAgfVxuXG4gIC8qKiBSdW4gYSBzaGVsbCBjb21tYW5kICovXG4gIGFzeW5jICNydW5TY3JpcHQoc2NyaXB0OiBzdHJpbmcpIHtcbiAgICBsb2cuaW5mbyhgW3NjcmlwdF0gJHtzY3JpcHR9YCk7XG5cbiAgICBjb25zdCBhcmdzID0gc2hBcmdzKHNjcmlwdCk7XG4gICAgY29uc3QgY21kID0gYXJncy5zaGlmdCgpITtcblxuICAgIGNvbnN0IGNvbW1hbmQgPSBuZXcgRGVuby5Db21tYW5kKGNtZCwge1xuICAgICAgYXJncyxcbiAgICAgIHN0ZG91dDogXCJpbmhlcml0XCIsXG4gICAgICBzdGRlcnI6IFwiaW5oZXJpdFwiLFxuICAgICAgY3dkOiB0aGlzLmN3ZCxcbiAgICB9KTtcblxuICAgIGNvbnN0IG91dHB1dCA9IGF3YWl0IGNvbW1hbmQub3V0cHV0KCk7XG4gICAgcmV0dXJuIG91dHB1dC5zdWNjZXNzO1xuICB9XG59XG5cbi8qKiBSZXR1cm5zIHRoZSBzaGVsbCBhcmd1bWVudHMgZm9yIHRoZSBjdXJyZW50IHBsYXRmb3JtICovXG5mdW5jdGlvbiBzaEFyZ3Moc2NyaXB0OiBzdHJpbmcpIHtcbiAgcmV0dXJuIERlbm8uYnVpbGQub3MgPT09IFwid2luZG93c1wiXG4gICAgPyBbXCJQb3dlclNoZWxsLmV4ZVwiLCBcIi1Db21tYW5kXCIsIHNjcmlwdF1cbiAgICA6IFtcIi91c3IvYmluL2VudlwiLCBcImJhc2hcIiwgXCItY1wiLCBzY3JpcHRdO1xufVxuXG4vKiogQSBzY3JpcHQgb3IgZnVuY3Rpb24gKi9cbmV4cG9ydCB0eXBlIFNjcmlwdE9yRnVuY3Rpb24gPSBzdHJpbmcgfCAoKCkgPT4gdW5rbm93bikgfCBTY3JpcHRPckZ1bmN0aW9uW107XG4iXSwibmFtZXMiOltdLCJtYXBwaW5n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