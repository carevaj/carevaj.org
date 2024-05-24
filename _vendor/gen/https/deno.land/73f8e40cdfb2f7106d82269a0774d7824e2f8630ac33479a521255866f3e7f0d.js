import { bold, brightBlue, cyan, green, red, yellow } from "../deps.ts";
import { ValidationError } from "../_errors.ts";
import { Table } from "../../table/table.ts";
export class Provider {
  maxListSize = 25;
  maxCols = 8;
  async isOutdated(name, currentVersion, targetVersion) {
    const { latest, versions } = await this.getVersions(name);
    if (targetVersion === "latest") {
      targetVersion = latest;
    }
    // Check if requested version exists.
    if (targetVersion && !versions.includes(targetVersion)) {
      throw new ValidationError(`The provided version ${bold(red(targetVersion))} is not found.\n\n    ${cyan(`Visit ${brightBlue(this.getRepositoryUrl(name))} for available releases or run again with the ${yellow("-l")} or ${yellow("--list-versions")} command.`)}`);
    }
    // Check if requested version is already the latest available version.
    if (latest && latest === currentVersion && latest === targetVersion) {
      console.warn(yellow(`You're already using the latest available version ${currentVersion} of ${name}.`));
      return false;
    }
    // Check if requested version is already installed.
    if (targetVersion && currentVersion === targetVersion) {
      console.warn(yellow(`You're already using version ${currentVersion} of ${name}.`));
      return false;
    }
    return true;
  }
  async upgrade({ name, from, to, importMap, main = `${name}.ts`, args = [] }) {
    if (to === "latest") {
      const { latest } = await this.getVersions(name);
      to = latest;
    }
    const registry = new URL(main, this.getRegistryUrl(name, to)).href;
    const cmd = [
      Deno.execPath(),
      "install"
    ];
    if (importMap) {
      const importJson = new URL(importMap, this.getRegistryUrl(name, to)).href;
      cmd.push("--import-map", importJson);
    }
    if (args.length) {
      cmd.push(...args, "--force", "--name", name, registry);
    } else {
      cmd.push("--no-check", "--quiet", "--force", "--name", name, registry);
    }
    const process = Deno.run({
      cmd,
      stdout: "piped",
      stderr: "piped"
    });
    const [status, stderr] = await Promise.all([
      process.status(),
      process.stderrOutput(),
      process.output()
    ]);
    if (!status.success) {
      process.close();
      await Deno.stderr.write(stderr);
      throw new Error(`Failed to upgrade ${name} from ${from} to version ${to}!`);
    }
    process.close();
    console.info(`Successfully upgraded ${name} from ${from} to version ${to}! (${this.getRegistryUrl(name, to)})`);
  }
  async listVersions(name, currentVersion) {
    const { versions } = await this.getVersions(name);
    this.printVersions(versions, currentVersion);
  }
  printVersions(versions, currentVersion, { maxCols = this.maxCols, indent = 0 } = {}) {
    versions = versions.slice();
    if (versions?.length) {
      versions = versions.map((version)=>currentVersion && currentVersion === version ? green(`* ${version}`) : `  ${version}`);
      if (versions.length > this.maxListSize) {
        const table = new Table().indent(indent);
        const rowSize = Math.ceil(versions.length / maxCols);
        const colSize = Math.min(versions.length, maxCols);
        let versionIndex = 0;
        for(let colIndex = 0; colIndex < colSize; colIndex++){
          for(let rowIndex = 0; rowIndex < rowSize; rowIndex++){
            if (!table[rowIndex]) {
              table[rowIndex] = [];
            }
            table[rowIndex][colIndex] = versions[versionIndex++];
          }
        }
        console.log(table.toString());
      } else {
        console.log(versions.map((version)=>" ".repeat(indent) + version).join("\n"));
      }
    }
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvY2xpZmZ5QHYwLjI1LjcvY29tbWFuZC91cGdyYWRlL3Byb3ZpZGVyLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGJvbGQsIGJyaWdodEJsdWUsIGN5YW4sIGdyZWVuLCByZWQsIHllbGxvdyB9IGZyb20gXCIuLi9kZXBzLnRzXCI7XG5pbXBvcnQgeyBWYWxpZGF0aW9uRXJyb3IgfSBmcm9tIFwiLi4vX2Vycm9ycy50c1wiO1xuaW1wb3J0IHsgVGFibGUgfSBmcm9tIFwiLi4vLi4vdGFibGUvdGFibGUudHNcIjtcblxuZXhwb3J0IGludGVyZmFjZSBWZXJzaW9ucyB7XG4gIGxhdGVzdDogc3RyaW5nO1xuICB2ZXJzaW9uczogQXJyYXk8c3RyaW5nPjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBVcGdyYWRlT3B0aW9ucyB7XG4gIG5hbWU6IHN0cmluZztcbiAgZnJvbT86IHN0cmluZztcbiAgdG86IHN0cmluZztcbiAgYXJncz86IEFycmF5PHN0cmluZz47XG4gIG1haW4/OiBzdHJpbmc7XG4gIGltcG9ydE1hcD86IHN0cmluZztcbn1cblxuZXhwb3J0IGFic3RyYWN0IGNsYXNzIFByb3ZpZGVyIHtcbiAgYWJzdHJhY3QgcmVhZG9ubHkgbmFtZTogc3RyaW5nO1xuICBwcm90ZWN0ZWQgcmVhZG9ubHkgbWF4TGlzdFNpemU6IG51bWJlciA9IDI1O1xuICBwcml2YXRlIG1heENvbHMgPSA4O1xuXG4gIGFic3RyYWN0IGdldFZlcnNpb25zKG5hbWU6IHN0cmluZyk6IFByb21pc2U8VmVyc2lvbnM+O1xuXG4gIGFic3RyYWN0IGdldFJlcG9zaXRvcnlVcmwobmFtZTogc3RyaW5nKTogc3RyaW5nO1xuXG4gIGFic3RyYWN0IGdldFJlZ2lzdHJ5VXJsKG5hbWU6IHN0cmluZywgdmVyc2lvbjogc3RyaW5nKTogc3RyaW5nO1xuXG4gIGFzeW5jIGlzT3V0ZGF0ZWQoXG4gICAgbmFtZTogc3RyaW5nLFxuICAgIGN1cnJlbnRWZXJzaW9uOiBzdHJpbmcsXG4gICAgdGFyZ2V0VmVyc2lvbjogc3RyaW5nLFxuICApOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICBjb25zdCB7IGxhdGVzdCwgdmVyc2lvbnMgfSA9IGF3YWl0IHRoaXMuZ2V0VmVyc2lvbnMobmFtZSk7XG5cbiAgICBpZiAodGFyZ2V0VmVyc2lvbiA9PT0gXCJsYXRlc3RcIikge1xuICAgICAgdGFyZ2V0VmVyc2lvbiA9IGxhdGVzdDtcbiAgICB9XG5cbiAgICAvLyBDaGVjayBpZiByZXF1ZXN0ZWQgdmVyc2lvbiBleGlzdHMuXG4gICAgaWYgKHRhcmdldFZlcnNpb24gJiYgIXZlcnNpb25zLmluY2x1ZGVzKHRhcmdldFZlcnNpb24pKSB7XG4gICAgICB0aHJvdyBuZXcgVmFsaWRhdGlvbkVycm9yKFxuICAgICAgICBgVGhlIHByb3ZpZGVkIHZlcnNpb24gJHtcbiAgICAgICAgICBib2xkKHJlZCh0YXJnZXRWZXJzaW9uKSlcbiAgICAgICAgfSBpcyBub3QgZm91bmQuXFxuXFxuICAgICR7XG4gICAgICAgICAgY3lhbihcbiAgICAgICAgICAgIGBWaXNpdCAke1xuICAgICAgICAgICAgICBicmlnaHRCbHVlKHRoaXMuZ2V0UmVwb3NpdG9yeVVybChuYW1lKSlcbiAgICAgICAgICAgIH0gZm9yIGF2YWlsYWJsZSByZWxlYXNlcyBvciBydW4gYWdhaW4gd2l0aCB0aGUgJHsoeWVsbG93KFxuICAgICAgICAgICAgICBcIi1sXCIsXG4gICAgICAgICAgICApKX0gb3IgJHsoeWVsbG93KFwiLS1saXN0LXZlcnNpb25zXCIpKX0gY29tbWFuZC5gLFxuICAgICAgICAgIClcbiAgICAgICAgfWAsXG4gICAgICApO1xuICAgIH1cblxuICAgIC8vIENoZWNrIGlmIHJlcXVlc3RlZCB2ZXJzaW9uIGlzIGFscmVhZHkgdGhlIGxhdGVzdCBhdmFpbGFibGUgdmVyc2lvbi5cbiAgICBpZiAobGF0ZXN0ICYmIGxhdGVzdCA9PT0gY3VycmVudFZlcnNpb24gJiYgbGF0ZXN0ID09PSB0YXJnZXRWZXJzaW9uKSB7XG4gICAgICBjb25zb2xlLndhcm4oXG4gICAgICAgIHllbGxvdyhcbiAgICAgICAgICBgWW91J3JlIGFscmVhZHkgdXNpbmcgdGhlIGxhdGVzdCBhdmFpbGFibGUgdmVyc2lvbiAke2N1cnJlbnRWZXJzaW9ufSBvZiAke25hbWV9LmAsXG4gICAgICAgICksXG4gICAgICApO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIC8vIENoZWNrIGlmIHJlcXVlc3RlZCB2ZXJzaW9uIGlzIGFscmVhZHkgaW5zdGFsbGVkLlxuICAgIGlmICh0YXJnZXRWZXJzaW9uICYmIGN1cnJlbnRWZXJzaW9uID09PSB0YXJnZXRWZXJzaW9uKSB7XG4gICAgICBjb25zb2xlLndhcm4oXG4gICAgICAgIHllbGxvdyhgWW91J3JlIGFscmVhZHkgdXNpbmcgdmVyc2lvbiAke2N1cnJlbnRWZXJzaW9ufSBvZiAke25hbWV9LmApLFxuICAgICAgKTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIGFzeW5jIHVwZ3JhZGUoXG4gICAgeyBuYW1lLCBmcm9tLCB0bywgaW1wb3J0TWFwLCBtYWluID0gYCR7bmFtZX0udHNgLCBhcmdzID0gW10gfTpcbiAgICAgIFVwZ3JhZGVPcHRpb25zLFxuICApOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodG8gPT09IFwibGF0ZXN0XCIpIHtcbiAgICAgIGNvbnN0IHsgbGF0ZXN0IH0gPSBhd2FpdCB0aGlzLmdldFZlcnNpb25zKG5hbWUpO1xuICAgICAgdG8gPSBsYXRlc3Q7XG4gICAgfVxuICAgIGNvbnN0IHJlZ2lzdHJ5OiBzdHJpbmcgPSBuZXcgVVJMKG1haW4sIHRoaXMuZ2V0UmVnaXN0cnlVcmwobmFtZSwgdG8pKS5ocmVmO1xuXG4gICAgY29uc3QgY21kID0gW0Rlbm8uZXhlY1BhdGgoKSwgXCJpbnN0YWxsXCJdO1xuXG4gICAgaWYgKGltcG9ydE1hcCkge1xuICAgICAgY29uc3QgaW1wb3J0SnNvbjogc3RyaW5nID1cbiAgICAgICAgbmV3IFVSTChpbXBvcnRNYXAsIHRoaXMuZ2V0UmVnaXN0cnlVcmwobmFtZSwgdG8pKS5ocmVmO1xuXG4gICAgICBjbWQucHVzaChcIi0taW1wb3J0LW1hcFwiLCBpbXBvcnRKc29uKTtcbiAgICB9XG5cbiAgICBpZiAoYXJncy5sZW5ndGgpIHtcbiAgICAgIGNtZC5wdXNoKC4uLmFyZ3MsIFwiLS1mb3JjZVwiLCBcIi0tbmFtZVwiLCBuYW1lLCByZWdpc3RyeSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNtZC5wdXNoKFwiLS1uby1jaGVja1wiLCBcIi0tcXVpZXRcIiwgXCItLWZvcmNlXCIsIFwiLS1uYW1lXCIsIG5hbWUsIHJlZ2lzdHJ5KTtcbiAgICB9XG5cbiAgICBjb25zdCBwcm9jZXNzID0gRGVuby5ydW4oeyBjbWQsIHN0ZG91dDogXCJwaXBlZFwiLCBzdGRlcnI6IFwicGlwZWRcIiB9KTtcblxuICAgIGNvbnN0IFtzdGF0dXMsIHN0ZGVycl0gPSBhd2FpdCBQcm9taXNlLmFsbChbXG4gICAgICBwcm9jZXNzLnN0YXR1cygpLFxuICAgICAgcHJvY2Vzcy5zdGRlcnJPdXRwdXQoKSxcbiAgICAgIHByb2Nlc3Mub3V0cHV0KCksXG4gICAgXSk7XG5cbiAgICBpZiAoIXN0YXR1cy5zdWNjZXNzKSB7XG4gICAgICBwcm9jZXNzLmNsb3NlKCk7XG4gICAgICBhd2FpdCBEZW5vLnN0ZGVyci53cml0ZShzdGRlcnIpO1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICBgRmFpbGVkIHRvIHVwZ3JhZGUgJHtuYW1lfSBmcm9tICR7ZnJvbX0gdG8gdmVyc2lvbiAke3RvfSFgLFxuICAgICAgKTtcbiAgICB9XG4gICAgcHJvY2Vzcy5jbG9zZSgpO1xuXG4gICAgY29uc29sZS5pbmZvKFxuICAgICAgYFN1Y2Nlc3NmdWxseSB1cGdyYWRlZCAke25hbWV9IGZyb20gJHtmcm9tfSB0byB2ZXJzaW9uICR7dG99ISAoJHtcbiAgICAgICAgdGhpcy5nZXRSZWdpc3RyeVVybChuYW1lLCB0bylcbiAgICAgIH0pYCxcbiAgICApO1xuICB9XG5cbiAgcHVibGljIGFzeW5jIGxpc3RWZXJzaW9ucyhcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgY3VycmVudFZlcnNpb24/OiBzdHJpbmcsXG4gICk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IHsgdmVyc2lvbnMgfSA9IGF3YWl0IHRoaXMuZ2V0VmVyc2lvbnMobmFtZSk7XG4gICAgdGhpcy5wcmludFZlcnNpb25zKHZlcnNpb25zLCBjdXJyZW50VmVyc2lvbik7XG4gIH1cblxuICBwcm90ZWN0ZWQgcHJpbnRWZXJzaW9ucyhcbiAgICB2ZXJzaW9uczogQXJyYXk8c3RyaW5nPixcbiAgICBjdXJyZW50VmVyc2lvbj86IHN0cmluZyxcbiAgICB7IG1heENvbHMgPSB0aGlzLm1heENvbHMsIGluZGVudCA9IDAgfToge1xuICAgICAgbWF4Q29scz86IG51bWJlcjtcbiAgICAgIGluZGVudD86IG51bWJlcjtcbiAgICB9ID0ge30sXG4gICk6IHZvaWQge1xuICAgIHZlcnNpb25zID0gdmVyc2lvbnMuc2xpY2UoKTtcbiAgICBpZiAodmVyc2lvbnM/Lmxlbmd0aCkge1xuICAgICAgdmVyc2lvbnMgPSB2ZXJzaW9ucy5tYXAoKHZlcnNpb246IHN0cmluZykgPT5cbiAgICAgICAgY3VycmVudFZlcnNpb24gJiYgY3VycmVudFZlcnNpb24gPT09IHZlcnNpb25cbiAgICAgICAgICA/IGdyZWVuKGAqICR7dmVyc2lvbn1gKVxuICAgICAgICAgIDogYCAgJHt2ZXJzaW9ufWBcbiAgICAgICk7XG5cbiAgICAgIGlmICh2ZXJzaW9ucy5sZW5ndGggPiB0aGlzLm1heExpc3RTaXplKSB7XG4gICAgICAgIGNvbnN0IHRhYmxlID0gbmV3IFRhYmxlKCkuaW5kZW50KGluZGVudCk7XG4gICAgICAgIGNvbnN0IHJvd1NpemUgPSBNYXRoLmNlaWwodmVyc2lvbnMubGVuZ3RoIC8gbWF4Q29scyk7XG4gICAgICAgIGNvbnN0IGNvbFNpemUgPSBNYXRoLm1pbih2ZXJzaW9ucy5sZW5ndGgsIG1heENvbHMpO1xuICAgICAgICBsZXQgdmVyc2lvbkluZGV4ID0gMDtcbiAgICAgICAgZm9yIChsZXQgY29sSW5kZXggPSAwOyBjb2xJbmRleCA8IGNvbFNpemU7IGNvbEluZGV4KyspIHtcbiAgICAgICAgICBmb3IgKGxldCByb3dJbmRleCA9IDA7IHJvd0luZGV4IDwgcm93U2l6ZTsgcm93SW5kZXgrKykge1xuICAgICAgICAgICAgaWYgKCF0YWJsZVtyb3dJbmRleF0pIHtcbiAgICAgICAgICAgICAgdGFibGVbcm93SW5kZXhdID0gW107XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0YWJsZVtyb3dJbmRleF1bY29sSW5kZXhdID0gdmVyc2lvbnNbdmVyc2lvbkluZGV4KytdO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBjb25zb2xlLmxvZyh0YWJsZS50b1N0cmluZygpKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnNvbGUubG9nKFxuICAgICAgICAgIHZlcnNpb25zLm1hcCgodmVyc2lvbikgPT4gXCIgXCIucmVwZWF0KGluZGVudCkgKyB2ZXJzaW9uKS5qb2luKFwiXFxuXCIpLFxuICAgICAgICApO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFNBQVMsSUFBSSxFQUFFLFVBQVUsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLEdBQUcsRUFBRSxNQUFNLFFBQVEsYUFBYTtBQUN4RSxTQUFTLGVBQWUsUUFBUSxnQkFBZ0I7QUFDaEQsU0FBUyxLQUFLLFFBQVEsdUJBQXVCO0FBZ0I3QyxPQUFPLE1BQWU7RUFFRCxjQUFzQixHQUFHO0VBQ3BDLFVBQVUsRUFBRTtFQVFwQixNQUFNLFdBQ0osSUFBWSxFQUNaLGNBQXNCLEVBQ3RCLGFBQXFCLEVBQ0g7SUFDbEIsTUFBTSxFQUFFLE1BQU0sRUFBRSxRQUFRLEVBQUUsR0FBRyxNQUFNLElBQUksQ0FBQyxXQUFX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