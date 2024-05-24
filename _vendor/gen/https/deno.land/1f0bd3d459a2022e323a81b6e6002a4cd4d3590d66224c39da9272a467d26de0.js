import { parseArgs } from "../../deps/cli.ts";
export function getOptionsFromCli(options) {
  const cli = parseArgs(Deno.args, {
    string: [
      "src",
      "dest",
      "location",
      "port"
    ],
    boolean: [
      "serve",
      "open"
    ],
    alias: {
      dev: "d",
      serve: "s",
      port: "p",
      open: "o"
    },
    ["--"]: true
  });
  if (cli.src) {
    options.src = cli.src;
  }
  if (cli.dest) {
    options.dest = cli.dest;
  }
  if (cli.port) {
    (options.server ||= {}).port = parseInt(cli.port);
  } else if (cli.serve) {
    (options.server ||= {}).port = 3000;
  }
  let location;
  if (cli.location) {
    location = new URL(cli.location);
  } else if (options.location && !cli.server) {
    location = options.location;
  } else {
    location = new URL("http://localhost");
  }
  let port;
  if (cli.port) {
    port = parseInt(cli.port);
  } else if (location.port) {
    port = parseInt(location.port);
  } else if (options.server?.port) {
    port = options.server.port;
  } else {
    port = cli.serve ? 3000 : location.protocol === "https:" ? 443 : 80;
  }
  (options.server ||= {}).port = port;
  location.port = port.toString();
  options.location = location;
  if (cli.open) {
    (options.server ||= {}).open = cli.open;
  }
  return options;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvbHVtZUB2Mi4yLjAvY29yZS91dGlscy9jbGlfb3B0aW9ucy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBwYXJzZUFyZ3MgfSBmcm9tIFwiLi4vLi4vZGVwcy9jbGkudHNcIjtcbmltcG9ydCB0eXBlIHsgRGVlcFBhcnRpYWwgfSBmcm9tIFwiLi9vYmplY3QudHNcIjtcbmltcG9ydCB0eXBlIHsgU2l0ZU9wdGlvbnMgfSBmcm9tIFwiLi4vc2l0ZS50c1wiO1xuXG5leHBvcnQgZnVuY3Rpb24gZ2V0T3B0aW9uc0Zyb21DbGkoXG4gIG9wdGlvbnM6IERlZXBQYXJ0aWFsPFNpdGVPcHRpb25zPixcbik6IERlZXBQYXJ0aWFsPFNpdGVPcHRpb25zPiB7XG4gIGNvbnN0IGNsaSA9IHBhcnNlQXJncyhEZW5vLmFyZ3MsIHtcbiAgICBzdHJpbmc6IFtcInNyY1wiLCBcImRlc3RcIiwgXCJsb2NhdGlvblwiLCBcInBvcnRcIl0sXG4gICAgYm9vbGVhbjogW1wic2VydmVcIiwgXCJvcGVuXCJdLFxuICAgIGFsaWFzOiB7IGRldjogXCJkXCIsIHNlcnZlOiBcInNcIiwgcG9ydDogXCJwXCIsIG9wZW46IFwib1wiIH0sXG4gICAgW1wiLS1cIl06IHRydWUsXG4gIH0pO1xuXG4gIGlmIChjbGkuc3JjKSB7XG4gICAgb3B0aW9ucy5zcmMgPSBjbGkuc3JjO1xuICB9XG5cbiAgaWYgKGNsaS5kZXN0KSB7XG4gICAgb3B0aW9ucy5kZXN0ID0gY2xpLmRlc3Q7XG4gIH1cblxuICBpZiAoY2xpLnBvcnQpIHtcbiAgICAob3B0aW9ucy5zZXJ2ZXIgfHw9IHt9KS5wb3J0ID0gcGFyc2VJbnQoY2xpLnBvcnQpO1xuICB9IGVsc2UgaWYgKGNsaS5zZXJ2ZSkge1xuICAgIChvcHRpb25zLnNlcnZlciB8fD0ge30pLnBvcnQgPSAzMDAwO1xuICB9XG5cbiAgbGV0IGxvY2F0aW9uOiBVUkw7XG5cbiAgaWYgKGNsaS5sb2NhdGlvbikge1xuICAgIGxvY2F0aW9uID0gbmV3IFVSTChjbGkubG9jYXRpb24pO1xuICB9IGVsc2UgaWYgKG9wdGlvbnMubG9jYXRpb24gJiYgIWNsaS5zZXJ2ZXIpIHtcbiAgICBsb2NhdGlvbiA9IG9wdGlvbnMubG9jYXRpb24gYXMgVVJMO1xuICB9IGVsc2Uge1xuICAgIGxvY2F0aW9uID0gbmV3IFVSTChcImh0dHA6Ly9sb2NhbGhvc3RcIik7XG4gIH1cblxuICBsZXQgcG9ydDogbnVtYmVyO1xuXG4gIGlmIChjbGkucG9ydCkge1xuICAgIHBvcnQgPSBwYXJzZUludChjbGkucG9ydCk7XG4gIH0gZWxzZSBpZiAobG9jYXRpb24ucG9ydCkge1xuICAgIHBvcnQgPSBwYXJzZUludChsb2NhdGlvbi5wb3J0KTtcbiAgfSBlbHNlIGlmIChvcHRpb25zLnNlcnZlcj8ucG9ydCkge1xuICAgIHBvcnQgPSBvcHRpb25zLnNlcnZlci5wb3J0O1xuICB9IGVsc2Uge1xuICAgIHBvcnQgPSBjbGkuc2VydmUgPyAzMDAwIDogbG9jYXRpb24ucHJvdG9jb2wgPT09IFwiaHR0cHM6XCIgPyA0NDMgOiA4MDtcbiAgfVxuXG4gIChvcHRpb25zLnNlcnZlciB8fD0ge30pLnBvcnQgPSBwb3J0O1xuICBsb2NhdGlvbi5wb3J0ID0gcG9ydC50b1N0cmluZygpO1xuICBvcHRpb25zLmxvY2F0aW9uID0gbG9jYXRpb247XG5cbiAgaWYgKGNsaS5vcGVuKSB7XG4gICAgKG9wdGlvbnMuc2VydmVyIHx8PSB7fSkub3BlbiA9IGNsaS5vcGVuO1xuICB9XG5cbiAgcmV0dXJuIG9wdGlvbnM7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsU0FBUyxTQUFTLFFBQVEsb0JBQW9CO0FBSTlDLE9BQU8sU0FBUyxrQkFDZCxPQUFpQztFQUVqQyxNQUFNLE1BQU0sVUFBVSxLQUFLLElBQUksRUFBRTtJQUMvQixRQUFRO01BQUM7TUFBTztNQUFRO01BQVk7S0FBTztJQUMzQyxTQUFTO01BQUM7TUFBUztLQUFPO0lBQzFCLE9BQU87TUFBRSxLQUFLO01BQUssT0FBTztNQUFLLE1BQU07TUFBSyxNQUFNO0lBQUk7SUFDcEQsQ0FBQyxLQUFLLEVBQUU7RUFDVjtFQUVBLElBQUksSUFBSSxHQUFHLEVBQUU7SUFDWCxRQUFRLEdBQUcsR0FBRyxJQUFJLEdBQUc7RUFDdkI7RUFFQSxJQUFJLElBQUksSUFBSSxFQUFFO0lBQ1osUUFBUSxJQUFJLEdBQUcsSUFBSSxJQUFJO0VBQ3pCO0VBRUEsSUFBSSxJQUFJLElBQUksRUFBRTtJQUNaLENBQUMsUUFBUSxNQUFNLEtBQUssQ0FBQyxDQUFDLEVBQUUsSUFBSSxHQUFHLFNBQVMsSUFBSSxJQUFJO0VBQ2xELE9BQU8sSUFBSSxJQUFJLEtBQUssRUFBRTtJQUNwQixDQUFDLFFBQVEsTUFBTSxLQUFLLENBQUMsQ0FBQyxFQUFFLElBQUksR0FBRztFQUNqQztFQUVBLElBQUk7RUFFSixJQUFJLElBQUksUUFBUSxFQUFFO0lBQ2hCLFdBQVcsSUFBSSxJQUFJLElBQUksUUFBUTtFQUNqQyxPQUFPLElBQUksUUFBUSxRQUFRLElBQUksQ0FBQyxJQUFJLE1BQU0sRUFBRTtJQUMxQyxXQUFXLFFBQVEsUUFBUTtFQUM3QixPQUFPO0lBQ0wsV0FBVyxJQUFJLElBQUk7RUFDckI7RUFFQSxJQUFJO0VBRUosSUFBSSxJQUFJLElBQUksRUFBRTtJQUNaLE9BQU8sU0FBUyxJQUFJLElBQUk7RUFDMUIsT0FBTyxJQUFJLFNBQVMsSUFBSSxFQUFFO0lBQ3hCLE9BQU8sU0FBUyxTQUFTLElBQUk7RUFDL0IsT0FBTyxJQUFJLFFBQVEsTUFBTSxFQUFFLE1BQU07SUFDL0IsT0FBTyxRQUFRLE1BQU0sQ0FBQyxJQUFJO0VBQzVCLE9BQU87SUFDTCxPQUFPLElBQUksS0FBSyxHQUFHLE9BQU8sU0FBUyxRQUFRLEtBQUssV0FBVyxNQUFNO0VBQ25FO0VBRUEsQ0FBQyxRQUFRLE1BQU0sS0FBSyxDQUFDLENBQUMsRUFBRSxJQUFJLEdBQUc7RUFDL0IsU0FBUyxJQUFJLEdBQUcsS0FBSyxRQUFRO0VBQzdCLFFBQVEsUUFBUSxHQUFHO0VBRW5CLElBQUksSUFBSSxJQUFJLEVBQUU7SUFDWixDQUFDLFFBQVEsTUFBTSxLQUFLLENBQUMsQ0FBQyxFQUFFLElBQUksR0FBRyxJQUFJLElBQUk7RUFDekM7RUFFQSxPQUFPO0FBQ1QifQ==