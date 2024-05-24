#!/usr/bin/env -S deno run --allow-net --allow-read
// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This program serves files in the current directory over HTTP.
// TODO(bartlomieju): Add tests like these:
// https://github.com/indexzero/http-server/blob/master/test/http-server-test.js
/**
 * Contains functions {@linkcode serveDir} and {@linkcode serveFile} for building a static file server.
 *
 * This module can also be used as a cli. If you want to run directly:
 *
 * ```shell
 * > # start server
 * > deno run --allow-net --allow-read @std/http/file-server
 * > # show help
 * > deno run --allow-net --allow-read @std/http/file-server --help
 * ```
 *
 * If you want to install and run:
 *
 * ```shell
 * > # install
 * > deno install --allow-net --allow-read @std/http/file-server
 * > # start server
 * > file_server
 * > # show help
 * > file_server --help
 * ```
 *
 * @module
 */ import { join as posixJoin } from "jsr:/@std/path@^0.224.0/posix/join";
import { normalize as posixNormalize } from "jsr:/@std/path@^0.224.0/posix/normalize";
import { extname } from "jsr:/@std/path@^0.224.0/extname";
import { join } from "jsr:/@std/path@^0.224.0/join";
import { relative } from "jsr:/@std/path@^0.224.0/relative";
import { resolve } from "jsr:/@std/path@^0.224.0/resolve";
import { SEPARATOR_PATTERN } from "jsr:/@std/path@^0.224.0/constants";
import { contentType } from "jsr:/@std/media-types@^0.224.0/content-type";
import { calculate, ifNoneMatch } from "./etag.ts";
import { isRedirectStatus, STATUS_CODE, STATUS_TEXT } from "./status.ts";
import { ByteSliceStream } from "jsr:/@std/streams@^0.224.0/byte-slice-stream";
import { parseArgs } from "jsr:/@std/cli@^0.224.0/parse-args";
import { red } from "jsr:/@std/fmt@^0.224.0/colors";
import denoConfig from "./deno.json" with {
  type: "json"
};
import { format as formatBytes } from "jsr:/@std/fmt@^0.224.0/bytes";
const ENV_PERM_STATUS = Deno.permissions.querySync?.({
  name: "env",
  variable: "DENO_DEPLOYMENT_ID"
}).state ?? "granted"; // for deno deploy
const DENO_DEPLOYMENT_ID = ENV_PERM_STATUS === "granted" ? Deno.env.get("DENO_DEPLOYMENT_ID") : undefined;
const HASHED_DENO_DEPLOYMENT_ID = DENO_DEPLOYMENT_ID ? calculate(DENO_DEPLOYMENT_ID, {
  weak: true
}) : undefined;
function modeToString(isDir, maybeMode) {
  const modeMap = [
    "---",
    "--x",
    "-w-",
    "-wx",
    "r--",
    "r-x",
    "rw-",
    "rwx"
  ];
  if (maybeMode === null) {
    return "(unknown mode)";
  }
  const mode = maybeMode.toString(8);
  if (mode.length < 3) {
    return "(unknown mode)";
  }
  let output = "";
  mode.split("").reverse().slice(0, 3).forEach((v)=>{
    output = `${modeMap[+v]} ${output}`;
  });
  output = `${isDir ? "d" : "-"} ${output}`;
  return output;
}
function createStandardResponse(status, init) {
  const statusText = STATUS_TEXT[status];
  return new Response(statusText, {
    status,
    statusText,
    ...init
  });
}
/**
 * parse range header.
 *
 * ```ts ignore
 * parseRangeHeader("bytes=0-100",   500); // => { start: 0, end: 100 }
 * parseRangeHeader("bytes=0-",      500); // => { start: 0, end: 499 }
 * parseRangeHeader("bytes=-100",    500); // => { start: 400, end: 499 }
 * parseRangeHeader("bytes=invalid", 500); // => null
 * ```
 *
 * Note: Currently, no support for multiple Ranges (e.g. `bytes=0-10, 20-30`)
 */ function parseRangeHeader(rangeValue, fileSize) {
  const rangeRegex = /bytes=(?<start>\d+)?-(?<end>\d+)?$/u;
  const parsed = rangeValue.match(rangeRegex);
  if (!parsed || !parsed.groups) {
    // failed to parse range header
    return null;
  }
  const { start, end } = parsed.groups;
  if (start !== undefined) {
    if (end !== undefined) {
      return {
        start: +start,
        end: +end
      };
    } else {
      return {
        start: +start,
        end: fileSize - 1
      };
    }
  } else {
    if (end !== undefined) {
      // example: `bytes=-100` means the last 100 bytes.
      return {
        start: fileSize - +end,
        end: fileSize - 1
      };
    } else {
      // failed to parse range header
      return null;
    }
  }
}
/**
 * Returns an HTTP Response with the requested file as the body.
 * @param req The server request context used to cleanup the file handle.
 * @param filePath Path of the file to serve.
 */ export async function serveFile(req, filePath, { etagAlgorithm: algorithm, fileInfo } = {}) {
  try {
    fileInfo ??= await Deno.stat(filePath);
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      await req.body?.cancel();
      return createStandardResponse(STATUS_CODE.NotFound);
    } else {
      throw error;
    }
  }
  if (fileInfo.isDirectory) {
    await req.body?.cancel();
    return createStandardResponse(STATUS_CODE.NotFound);
  }
  const headers = createBaseHeaders();
  // Set date header if access timestamp is available
  if (fileInfo.atime) {
    headers.set("date", fileInfo.atime.toUTCString());
  }
  const etag = fileInfo.mtime ? await calculate(fileInfo, {
    algorithm
  }) : await HASHED_DENO_DEPLOYMENT_ID;
  // Set last modified header if last modification timestamp is available
  if (fileInfo.mtime) {
    headers.set("last-modified", fileInfo.mtime.toUTCString());
  }
  if (etag) {
    headers.set("etag", etag);
  }
  if (etag || fileInfo.mtime) {
    // If a `if-none-match` header is present and the value matches the tag or
    // if a `if-modified-since` header is present and the value is bigger than
    // the access timestamp value, then return 304
    const ifNoneMatchValue = req.headers.get("if-none-match");
    const ifModifiedSinceValue = req.headers.get("if-modified-since");
    if (!ifNoneMatch(ifNoneMatchValue, etag) || ifNoneMatchValue === null && fileInfo.mtime && ifModifiedSinceValue && fileInfo.mtime.getTime() < new Date(ifModifiedSinceValue).getTime() + 1000) {
      const status = STATUS_CODE.NotModified;
      return new Response(null, {
        status,
        statusText: STATUS_TEXT[status],
        headers
      });
    }
  }
  // Set mime-type using the file extension in filePath
  const contentTypeValue = contentType(extname(filePath));
  if (contentTypeValue) {
    headers.set("content-type", contentTypeValue);
  }
  const fileSize = fileInfo.size;
  const rangeValue = req.headers.get("range");
  // handle range request
  // Note: Some clients add a Range header to all requests to limit the size of the response.
  // If the file is empty, ignore the range header and respond with a 200 rather than a 416.
  // https://github.com/golang/go/blob/0d347544cbca0f42b160424f6bc2458ebcc7b3fc/src/net/http/fs.go#L273-L276
  if (rangeValue && 0 < fileSize) {
    const parsed = parseRangeHeader(rangeValue, fileSize);
    // Returns 200 OK if parsing the range header fails
    if (!parsed) {
      // Set content length
      headers.set("content-length", `${fileSize}`);
      const file = await Deno.open(filePath);
      const status = STATUS_CODE.OK;
      return new Response(file.readable, {
        status,
        statusText: STATUS_TEXT[status],
        headers
      });
    }
    // Return 416 Range Not Satisfiable if invalid range header value
    if (parsed.end < 0 || parsed.end < parsed.start || fileSize <= parsed.start) {
      // Set the "Content-range" header
      headers.set("content-range", `bytes */${fileSize}`);
      return createStandardResponse(STATUS_CODE.RangeNotSatisfiable, {
        headers
      });
    }
    // clamps the range header value
    const start = Math.max(0, parsed.start);
    const end = Math.min(parsed.end, fileSize - 1);
    // Set the "Content-range" header
    headers.set("content-range", `bytes ${start}-${end}/${fileSize}`);
    // Set content length
    const contentLength = end - start + 1;
    headers.set("content-length", `${contentLength}`);
    // Return 206 Partial Content
    const file = await Deno.open(filePath);
    await file.seek(start, Deno.SeekMode.Start);
    const sliced = file.readable.pipeThrough(new ByteSliceStream(0, contentLength - 1));
    const status = STATUS_CODE.PartialContent;
    return new Response(sliced, {
      status,
      statusText: STATUS_TEXT[status],
      headers
    });
  }
  // Set content length
  headers.set("content-length", `${fileSize}`);
  const file = await Deno.open(filePath);
  const status = STATUS_CODE.OK;
  return new Response(file.readable, {
    status,
    statusText: STATUS_TEXT[status],
    headers
  });
}
async function serveDirIndex(dirPath, options) {
  const { showDotfiles } = options;
  const urlRoot = options.urlRoot ? "/" + options.urlRoot : "";
  const dirUrl = `/${relative(options.target, dirPath).replaceAll(new RegExp(SEPARATOR_PATTERN, "g"), "/")}`;
  const listEntryPromise = [];
  // if ".." makes sense
  if (dirUrl !== "/") {
    const prevPath = join(dirPath, "..");
    const entryInfo = Deno.stat(prevPath).then((fileInfo)=>({
        mode: modeToString(true, fileInfo.mode),
        size: "",
        name: "../",
        url: `${urlRoot}${posixJoin(dirUrl, "..")}`
      }));
    listEntryPromise.push(entryInfo);
  }
  // Read fileInfo in parallel
  for await (const entry of Deno.readDir(dirPath)){
    if (!showDotfiles && entry.name[0] === ".") {
      continue;
    }
    const filePath = join(dirPath, entry.name);
    const fileUrl = encodeURIComponent(posixJoin(dirUrl, entry.name)).replaceAll("%2F", "/");
    listEntryPromise.push((async ()=>{
      try {
        const fileInfo = await Deno.stat(filePath);
        return {
          mode: modeToString(entry.isDirectory, fileInfo.mode),
          size: entry.isFile ? formatBytes(fileInfo.size ?? 0) : "",
          name: `${entry.name}${entry.isDirectory ? "/" : ""}`,
          url: `${urlRoot}${fileUrl}${entry.isDirectory ? "/" : ""}`
        };
      } catch (error) {
        // Note: Deno.stat for windows system files may be rejected with os error 32.
        if (!options.quiet) logError(error);
        return {
          mode: "(unknown mode)",
          size: "",
          name: `${entry.name}${entry.isDirectory ? "/" : ""}`,
          url: `${urlRoot}${fileUrl}${entry.isDirectory ? "/" : ""}`
        };
      }
    })());
  }
  const listEntry = await Promise.all(listEntryPromise);
  listEntry.sort((a, b)=>a.name.toLowerCase() > b.name.toLowerCase() ? 1 : -1);
  const formattedDirUrl = `${dirUrl.replace(/\/$/, "")}/`;
  const page = dirViewerTemplate(formattedDirUrl, listEntry);
  const headers = createBaseHeaders();
  headers.set("content-type", "text/html; charset=UTF-8");
  const status = STATUS_CODE.OK;
  return new Response(page, {
    status,
    statusText: STATUS_TEXT[status],
    headers
  });
}
function serveFallback(maybeError) {
  if (maybeError instanceof URIError) {
    return createStandardResponse(STATUS_CODE.BadRequest);
  }
  if (maybeError instanceof Deno.errors.NotFound) {
    return createStandardResponse(STATUS_CODE.NotFound);
  }
  return createStandardResponse(STATUS_CODE.InternalServerError);
}
function serverLog(req, status) {
  const d = new Date().toISOString();
  const dateFmt = `[${d.slice(0, 10)} ${d.slice(11, 19)}]`;
  const url = new URL(req.url);
  const s = `${dateFmt} [${req.method}] ${url.pathname}${url.search} ${status}`;
  // using console.debug instead of console.log so chrome inspect users can hide request logs
  console.debug(s);
}
function createBaseHeaders() {
  return new Headers({
    server: "deno",
    // Set "accept-ranges" so that the client knows it can make range requests on future requests
    "accept-ranges": "bytes"
  });
}
function dirViewerTemplate(dirname, entries) {
  const paths = dirname.split("/");
  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta http-equiv="X-UA-Compatible" content="ie=edge" />
        <title>Deno File Server</title>
        <style>
          :root {
            --background-color: #fafafa;
            --color: rgba(0, 0, 0, 0.87);
          }
          @media (prefers-color-scheme: dark) {
            :root {
              --background-color: #292929;
              --color: #fff;
            }
            thead {
              color: #7f7f7f;
            }
          }
          @media (min-width: 960px) {
            main {
              max-width: 960px;
            }
            body {
              padding-left: 32px;
              padding-right: 32px;
            }
          }
          @media (min-width: 600px) {
            main {
              padding-left: 24px;
              padding-right: 24px;
            }
          }
          body {
            background: var(--background-color);
            color: var(--color);
            font-family: "Roboto", "Helvetica", "Arial", sans-serif;
            font-weight: 400;
            line-height: 1.43;
            font-size: 0.875rem;
          }
          a {
            color: #2196f3;
            text-decoration: none;
          }
          a:hover {
            text-decoration: underline;
          }
          thead {
            text-align: left;
          }
          thead th {
            padding-bottom: 12px;
          }
          table td {
            padding: 6px 36px 6px 0px;
          }
          .size {
            text-align: right;
            padding: 6px 12px 6px 24px;
          }
          .mode {
            font-family: monospace, monospace;
          }
        </style>
      </head>
      <body>
        <main>
          <h1>Index of
          <a href="/">home</a>${paths.map((path, index, array)=>{
    if (path === "") return "";
    const link = array.slice(0, index + 1).join("/");
    return `<a href="${link}">${path}</a>`;
  }).join("/")}
          </h1>
          <table>
            <thead>
              <tr>
                <th>Mode</th>
                <th>Size</th>
                <th>Name</th>
              </tr>
            </thead>
            ${entries.map((entry)=>`
                  <tr>
                    <td class="mode">
                      ${entry.mode}
                    </td>
                    <td class="size">
                      ${entry.size}
                    </td>
                    <td>
                      <a href="${entry.url}">${entry.name}</a>
                    </td>
                  </tr>
                `).join("")}
          </table>
        </main>
      </body>
    </html>
  `;
}
/**
 * Serves the files under the given directory root (opts.fsRoot).
 *
 * ```ts
 * import { serveDir } from "@std/http/file-server";
 *
 * Deno.serve((req) => {
 *   const pathname = new URL(req.url).pathname;
 *   if (pathname.startsWith("/static")) {
 *     return serveDir(req, {
 *       fsRoot: "path/to/static/files/dir",
 *     });
 *   }
 *   // Do dynamic responses
 *   return new Response();
 * });
 * ```
 *
 * Optionally you can pass `urlRoot` option. If it's specified that part is stripped from the beginning of the requested pathname.
 *
 * ```ts
 * import { serveDir } from "@std/http/file-server";
 *
 * // ...
 * serveDir(new Request("http://localhost/static/path/to/file"), {
 *   fsRoot: "public",
 *   urlRoot: "static",
 * });
 * ```
 *
 * The above example serves `./public/path/to/file` for the request to `/static/path/to/file`.
 *
 * @param req The request to handle
 */ export async function serveDir(req, opts = {}) {
  let response;
  try {
    response = await createServeDirResponse(req, opts);
  } catch (error) {
    if (!opts.quiet) logError(error);
    response = serveFallback(error);
  }
  // Do not update the header if the response is a 301 redirect.
  const isRedirectResponse = isRedirectStatus(response.status);
  if (opts.enableCors && !isRedirectResponse) {
    response.headers.append("access-control-allow-origin", "*");
    response.headers.append("access-control-allow-headers", "Origin, X-Requested-With, Content-Type, Accept, Range");
  }
  if (!opts.quiet) serverLog(req, response.status);
  if (opts.headers && !isRedirectResponse) {
    for (const header of opts.headers){
      const headerSplit = header.split(":");
      const name = headerSplit[0];
      const value = headerSplit.slice(1).join(":");
      response.headers.append(name, value);
    }
  }
  return response;
}
async function createServeDirResponse(req, opts) {
  const target = opts.fsRoot || ".";
  const urlRoot = opts.urlRoot;
  const showIndex = opts.showIndex ?? true;
  const showDotfiles = opts.showDotfiles || false;
  const { etagAlgorithm, showDirListing, quiet } = opts;
  const url = new URL(req.url);
  const decodedUrl = decodeURIComponent(url.pathname);
  let normalizedPath = posixNormalize(decodedUrl);
  if (urlRoot && !normalizedPath.startsWith("/" + urlRoot)) {
    return createStandardResponse(STATUS_CODE.NotFound);
  }
  // Redirect paths like `/foo////bar` and `/foo/bar/////` to normalized paths.
  if (normalizedPath !== decodedUrl) {
    url.pathname = normalizedPath;
    return Response.redirect(url, 301);
  }
  if (urlRoot) {
    normalizedPath = normalizedPath.replace(urlRoot, "");
  }
  // Remove trailing slashes to avoid ENOENT errors
  // when accessing a path to a file with a trailing slash.
  if (normalizedPath.endsWith("/")) {
    normalizedPath = normalizedPath.slice(0, -1);
  }
  const fsPath = join(target, normalizedPath);
  const fileInfo = await Deno.stat(fsPath);
  // For files, remove the trailing slash from the path.
  if (fileInfo.isFile && url.pathname.endsWith("/")) {
    url.pathname = url.pathname.slice(0, -1);
    return Response.redirect(url, 301);
  }
  // For directories, the path must have a trailing slash.
  if (fileInfo.isDirectory && !url.pathname.endsWith("/")) {
    // On directory listing pages,
    // if the current URL's pathname doesn't end with a slash, any
    // relative URLs in the index file will resolve against the parent
    // directory, rather than the current directory. To prevent that, we
    // return a 301 redirect to the URL with a slash.
    url.pathname += "/";
    return Response.redirect(url, 301);
  }
  // if target is file, serve file.
  if (!fileInfo.isDirectory) {
    return serveFile(req, fsPath, {
      etagAlgorithm,
      fileInfo
    });
  }
  // if target is directory, serve index or dir listing.
  if (showIndex) {
    const indexPath = join(fsPath, "index.html");
    let indexFileInfo;
    try {
      indexFileInfo = await Deno.lstat(indexPath);
    } catch (error) {
      if (!(error instanceof Deno.errors.NotFound)) {
        throw error;
      }
    // skip Not Found error
    }
    if (indexFileInfo?.isFile) {
      return serveFile(req, indexPath, {
        etagAlgorithm,
        fileInfo: indexFileInfo
      });
    }
  }
  if (showDirListing) {
    return serveDirIndex(fsPath, {
      urlRoot,
      showDotfiles,
      target,
      quiet
    });
  }
  return createStandardResponse(STATUS_CODE.NotFound);
}
function logError(error) {
  console.error(red(error instanceof Error ? error.message : `${error}`));
}
function main() {
  const serverArgs = parseArgs(Deno.args, {
    string: [
      "port",
      "host",
      "cert",
      "key",
      "header"
    ],
    boolean: [
      "help",
      "dir-listing",
      "dotfiles",
      "cors",
      "verbose",
      "version"
    ],
    negatable: [
      "dir-listing",
      "dotfiles",
      "cors"
    ],
    collect: [
      "header"
    ],
    default: {
      "dir-listing": true,
      dotfiles: true,
      cors: true,
      verbose: false,
      version: false,
      host: "0.0.0.0",
      port: "4507",
      cert: "",
      key: ""
    },
    alias: {
      p: "port",
      c: "cert",
      k: "key",
      h: "help",
      v: "verbose",
      V: "version",
      H: "header"
    }
  });
  const port = Number(serverArgs.port);
  const headers = serverArgs.header || [];
  const host = serverArgs.host;
  const certFile = serverArgs.cert;
  const keyFile = serverArgs.key;
  if (serverArgs.help) {
    printUsage();
    Deno.exit();
  }
  if (serverArgs.version) {
    console.log(`Deno File Server ${denoConfig.version}`);
    Deno.exit();
  }
  if (keyFile || certFile) {
    if (keyFile === "" || certFile === "") {
      console.log("--key and --cert are required for TLS");
      printUsage();
      Deno.exit(1);
    }
  }
  const wild = serverArgs._;
  const target = resolve(wild[0] ?? "");
  const handler = (req)=>{
    return serveDir(req, {
      fsRoot: target,
      showDirListing: serverArgs["dir-listing"],
      showDotfiles: serverArgs.dotfiles,
      enableCors: serverArgs.cors,
      quiet: !serverArgs.verbose,
      headers
    });
  };
  const useTls = !!(keyFile && certFile);
  function onListen({ port, hostname }) {
    const networkAddress = getNetworkAddress();
    const protocol = useTls ? "https" : "http";
    let message = `Listening on:\n- Local: ${protocol}://${hostname}:${port}`;
    if (networkAddress && !DENO_DEPLOYMENT_ID) {
      message += `\n- Network: ${protocol}://${networkAddress}:${port}`;
    }
    console.log(message);
  }
  if (useTls) {
    Deno.serve({
      port,
      hostname: host,
      onListen,
      cert: Deno.readTextFileSync(certFile),
      key: Deno.readTextFileSync(keyFile)
    }, handler);
  } else {
    Deno.serve({
      port,
      hostname: host,
      onListen
    }, handler);
  }
}
/**
 * Gets the network address of the machine,
 * inspired by the util of the same name in `npm:serve`
 * https://github.com/vercel/serve/blob/1ea55b1b5004f468159b54775e4fb3090fedbb2b/source/utilities/http.ts#L33
 */ function getNetworkAddress() {
  for (const { family, address } of Deno.networkInterfaces()){
    if (family === "IPv4" && !address.startsWith("127.")) {
      return address;
    }
  }
}
function printUsage() {
  console.log(`Deno File Server ${denoConfig.version}
  Serves a local directory in HTTP.

INSTALL:
  deno install --allow-net --allow-read jsr:@std/http@${denoConfig.version}/file_server

USAGE:
  file_server [path] [options]

OPTIONS:
  -h, --help            Prints help information
  -p, --port <PORT>     Set port
  --cors                Enable CORS via the "Access-Control-Allow-Origin" header
  --host     <HOST>     Hostname (default is 0.0.0.0)
  -c, --cert <FILE>     TLS certificate file (enables TLS)
  -k, --key  <FILE>     TLS key file (enables TLS)
  -H, --header <HEADER> Sets a header on every request.
                        (e.g. --header "Cache-Control: no-cache")
                        This option can be specified multiple times.
  --no-dir-listing      Disable directory listing
  --no-dotfiles         Do not show dotfiles
  --no-cors             Disable cross-origin resource sharing
  -v, --verbose         Print request level logs
  -V, --version         Print version information

  All TLS options are required when one is provided.`);
}
if (import.meta.main) {
  main();
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0BzdGQvaHR0cC8wLjIyNC4wL2ZpbGVfc2VydmVyLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIiMhL3Vzci9iaW4vZW52IC1TIGRlbm8gcnVuIC0tYWxsb3ctbmV0IC0tYWxsb3ctcmVhZFxuLy8gQ29weXJpZ2h0IDIwMTgtMjAyNCB0aGUgRGVubyBhdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLiBNSVQgbGljZW5zZS5cblxuLy8gVGhpcyBwcm9ncmFtIHNlcnZlcyBmaWxlcyBpbiB0aGUgY3VycmVudCBkaXJlY3Rvcnkgb3ZlciBIVFRQLlxuLy8gVE9ETyhiYXJ0bG9taWVqdSk6IEFkZCB0ZXN0cyBsaWtlIHRoZXNlOlxuLy8gaHR0cHM6Ly9naXRodWIuY29tL2luZGV4emVyby9odHRwLXNlcnZlci9ibG9iL21hc3Rlci90ZXN0L2h0dHAtc2VydmVyLXRlc3QuanNcblxuLyoqXG4gKiBDb250YWlucyBmdW5jdGlvbnMge0BsaW5rY29kZSBzZXJ2ZURpcn0gYW5kIHtAbGlua2NvZGUgc2VydmVGaWxlfSBmb3IgYnVpbGRpbmcgYSBzdGF0aWMgZmlsZSBzZXJ2ZXIuXG4gKlxuICogVGhpcyBtb2R1bGUgY2FuIGFsc28gYmUgdXNlZCBhcyBhIGNsaS4gSWYgeW91IHdhbnQgdG8gcnVuIGRpcmVjdGx5OlxuICpcbiAqIGBgYHNoZWxsXG4gKiA+ICMgc3RhcnQgc2VydmVyXG4gKiA+IGRlbm8gcnVuIC0tYWxsb3ctbmV0IC0tYWxsb3ctcmVhZCBAc3RkL2h0dHAvZmlsZS1zZXJ2ZXJcbiAqID4gIyBzaG93IGhlbHBcbiAqID4gZGVubyBydW4gLS1hbGxvdy1uZXQgLS1hbGxvdy1yZWFkIEBzdGQvaHR0cC9maWxlLXNlcnZlciAtLWhlbHBcbiAqIGBgYFxuICpcbiAqIElmIHlvdSB3YW50IHRvIGluc3RhbGwgYW5kIHJ1bjpcbiAqXG4gKiBgYGBzaGVsbFxuICogPiAjIGluc3RhbGxcbiAqID4gZGVubyBpbnN0YWxsIC0tYWxsb3ctbmV0IC0tYWxsb3ctcmVhZCBAc3RkL2h0dHAvZmlsZS1zZXJ2ZXJcbiAqID4gIyBzdGFydCBzZXJ2ZXJcbiAqID4gZmlsZV9zZXJ2ZXJcbiAqID4gIyBzaG93IGhlbHBcbiAqID4gZmlsZV9zZXJ2ZXIgLS1oZWxwXG4gKiBgYGBcbiAqXG4gKiBAbW9kdWxlXG4gKi9cblxuaW1wb3J0IHsgam9pbiBhcyBwb3NpeEpvaW4gfSBmcm9tIFwianNyOi9Ac3RkL3BhdGhAXjAuMjI0LjAvcG9zaXgvam9pblwiO1xuaW1wb3J0IHsgbm9ybWFsaXplIGFzIHBvc2l4Tm9ybWFsaXplIH0gZnJvbSBcImpzcjovQHN0ZC9wYXRoQF4wLjIyNC4wL3Bvc2l4L25vcm1hbGl6ZVwiO1xuaW1wb3J0IHsgZXh0bmFtZSB9IGZyb20gXCJqc3I6L0BzdGQvcGF0aEBeMC4yMjQuMC9leHRuYW1lXCI7XG5pbXBvcnQgeyBqb2luIH0gZnJvbSBcImpzcjovQHN0ZC9wYXRoQF4wLjIyNC4wL2pvaW5cIjtcbmltcG9ydCB7IHJlbGF0aXZlIH0gZnJvbSBcImpzcjovQHN0ZC9wYXRoQF4wLjIyNC4wL3JlbGF0aXZlXCI7XG5pbXBvcnQgeyByZXNvbHZlIH0gZnJvbSBcImpzcjovQHN0ZC9wYXRoQF4wLjIyNC4wL3Jlc29sdmVcIjtcbmltcG9ydCB7IFNFUEFSQVRPUl9QQVRURVJOIH0gZnJvbSBcImpzcjovQHN0ZC9wYXRoQF4wLjIyNC4wL2NvbnN0YW50c1wiO1xuaW1wb3J0IHsgY29udGVudFR5cGUgfSBmcm9tIFwianNyOi9Ac3RkL21lZGlhLXR5cGVzQF4wLjIyNC4wL2NvbnRlbnQtdHlwZVwiO1xuaW1wb3J0IHsgY2FsY3VsYXRlLCBpZk5vbmVNYXRjaCB9IGZyb20gXCIuL2V0YWcudHNcIjtcbmltcG9ydCB7XG4gIGlzUmVkaXJlY3RTdGF0dXMsXG4gIFNUQVRVU19DT0RFLFxuICBTVEFUVVNfVEVYVCxcbiAgdHlwZSBTdGF0dXNDb2RlLFxufSBmcm9tIFwiLi9zdGF0dXMudHNcIjtcbmltcG9ydCB7IEJ5dGVTbGljZVN0cmVhbSB9IGZyb20gXCJqc3I6L0BzdGQvc3RyZWFtc0BeMC4yMjQuMC9ieXRlLXNsaWNlLXN0cmVhbVwiO1xuaW1wb3J0IHsgcGFyc2VBcmdzIH0gZnJvbSBcImpzcjovQHN0ZC9jbGlAXjAuMjI0LjAvcGFyc2UtYXJnc1wiO1xuaW1wb3J0IHsgcmVkIH0gZnJvbSBcImpzcjovQHN0ZC9mbXRAXjAuMjI0LjAvY29sb3JzXCI7XG5pbXBvcnQgZGVub0NvbmZpZyBmcm9tIFwiLi9kZW5vLmpzb25cIiB3aXRoIHsgdHlwZTogXCJqc29uXCIgfTtcbmltcG9ydCB7IGZvcm1hdCBhcyBmb3JtYXRCeXRlcyB9IGZyb20gXCJqc3I6L0BzdGQvZm10QF4wLjIyNC4wL2J5dGVzXCI7XG5cbmludGVyZmFjZSBFbnRyeUluZm8ge1xuICBtb2RlOiBzdHJpbmc7XG4gIHNpemU6IHN0cmluZztcbiAgdXJsOiBzdHJpbmc7XG4gIG5hbWU6IHN0cmluZztcbn1cblxuY29uc3QgRU5WX1BFUk1fU1RBVFVTID1cbiAgRGVuby5wZXJtaXNzaW9ucy5xdWVyeVN5bmM/Lih7IG5hbWU6IFwiZW52XCIsIHZhcmlhYmxlOiBcIkRFTk9fREVQTE9ZTUVOVF9JRFwiIH0pXG4gICAgLnN0YXRlID8/IFwiZ3JhbnRlZFwiOyAvLyBmb3IgZGVubyBkZXBsb3lcbmNvbnN0IERFTk9fREVQTE9ZTUVOVF9JRCA9IEVOVl9QRVJNX1NUQVRVUyA9PT0gXCJncmFudGVkXCJcbiAgPyBEZW5vLmVudi5nZXQoXCJERU5PX0RFUExPWU1FTlRfSURcIilcbiAgOiB1bmRlZmluZWQ7XG5jb25zdCBIQVNIRURfREVOT19ERVBMT1lNRU5UX0lEID0gREVOT19ERVBMT1lNRU5UX0lEXG4gID8gY2FsY3VsYXRlKERFTk9fREVQTE9ZTUVOVF9JRCwgeyB3ZWFrOiB0cnVlIH0pXG4gIDogdW5kZWZpbmVkO1xuXG5mdW5jdGlvbiBtb2RlVG9TdHJpbmcoaXNEaXI6IGJvb2xlYW4sIG1heWJlTW9kZTogbnVtYmVyIHwgbnVsbCk6IHN0cmluZyB7XG4gIGNvbnN0IG1vZGVNYXAgPSBbXCItLS1cIiwgXCItLXhcIiwgXCItdy1cIiwgXCItd3hcIiwgXCJyLS1cIiwgXCJyLXhcIiwgXCJydy1cIiwgXCJyd3hcIl07XG5cbiAgaWYgKG1heWJlTW9kZSA9PT0gbnVsbCkge1xuICAgIHJldHVybiBcIih1bmtub3duIG1vZGUpXCI7XG4gIH1cbiAgY29uc3QgbW9kZSA9IG1heWJlTW9kZS50b1N0cmluZyg4KTtcbiAgaWYgKG1vZGUubGVuZ3RoIDwgMykge1xuICAgIHJldHVybiBcIih1bmtub3duIG1vZGUpXCI7XG4gIH1cbiAgbGV0IG91dHB1dCA9IFwiXCI7XG4gIG1vZGVcbiAgICAuc3BsaXQoXCJcIilcbiAgICAucmV2ZXJzZSgpXG4gICAgLnNsaWNlKDAsIDMpXG4gICAgLmZvckVhY2goKHYpID0+IHtcbiAgICAgIG91dHB1dCA9IGAke21vZGVNYXBbK3ZdfSAke291dHB1dH1gO1xuICAgIH0pO1xuICBvdXRwdXQgPSBgJHtpc0RpciA/IFwiZFwiIDogXCItXCJ9ICR7b3V0cHV0fWA7XG4gIHJldHVybiBvdXRwdXQ7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZVN0YW5kYXJkUmVzcG9uc2Uoc3RhdHVzOiBTdGF0dXNDb2RlLCBpbml0PzogUmVzcG9uc2VJbml0KSB7XG4gIGNvbnN0IHN0YXR1c1RleHQgPSBTVEFUVVNfVEVYVFtzdGF0dXNdO1xuICByZXR1cm4gbmV3IFJlc3BvbnNlKHN0YXR1c1RleHQsIHsgc3RhdHVzLCBzdGF0dXNUZXh0LCAuLi5pbml0IH0pO1xufVxuXG4vKipcbiAqIHBhcnNlIHJhbmdlIGhlYWRlci5cbiAqXG4gKiBgYGB0cyBpZ25vcmVcbiAqIHBhcnNlUmFuZ2VIZWFkZXIoXCJieXRlcz0wLTEwMFwiLCAgIDUwMCk7IC8vID0+IHsgc3RhcnQ6IDAsIGVuZDogMTAwIH1cbiAqIHBhcnNlUmFuZ2VIZWFkZXIoXCJieXRlcz0wLVwiLCAgICAgIDUwMCk7IC8vID0+IHsgc3RhcnQ6IDAsIGVuZDogNDk5IH1cbiAqIHBhcnNlUmFuZ2VIZWFkZXIoXCJieXRlcz0tMTAwXCIsICAgIDUwMCk7IC8vID0+IHsgc3RhcnQ6IDQwMCwgZW5kOiA0OTkgfVxuICogcGFyc2VSYW5nZUhlYWRlcihcImJ5dGVzPWludmFsaWRcIiwgNTAwKTsgLy8gPT4gbnVsbFxuICogYGBgXG4gKlxuICogTm90ZTogQ3VycmVudGx5LCBubyBzdXBwb3J0IGZvciBtdWx0aXBsZSBSYW5nZXMgKGUuZy4gYGJ5dGVzPTAtMTAsIDIwLTMwYClcbiAqL1xuZnVuY3Rpb24gcGFyc2VSYW5nZUhlYWRlcihyYW5nZVZhbHVlOiBzdHJpbmcsIGZpbGVTaXplOiBudW1iZXIpIHtcbiAgY29uc3QgcmFuZ2VSZWdleCA9IC9ieXRlcz0oPzxzdGFydD5cXGQrKT8tKD88ZW5kPlxcZCspPyQvdTtcbiAgY29uc3QgcGFyc2VkID0gcmFuZ2VWYWx1ZS5tYXRjaChyYW5nZVJlZ2V4KTtcblxuICBpZiAoIXBhcnNlZCB8fCAhcGFyc2VkLmdyb3Vwcykge1xuICAgIC8vIGZhaWxlZCB0byBwYXJzZSByYW5nZSBoZWFkZXJcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIGNvbnN0IHsgc3RhcnQsIGVuZCB9ID0gcGFyc2VkLmdyb3VwcztcbiAgaWYgKHN0YXJ0ICE9PSB1bmRlZmluZWQpIHtcbiAgICBpZiAoZW5kICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiB7IHN0YXJ0OiArc3RhcnQsIGVuZDogK2VuZCB9O1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4geyBzdGFydDogK3N0YXJ0LCBlbmQ6IGZpbGVTaXplIC0gMSB9O1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBpZiAoZW5kICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIC8vIGV4YW1wbGU6IGBieXRlcz0tMTAwYCBtZWFucyB0aGUgbGFzdCAxMDAgYnl0ZXMuXG4gICAgICByZXR1cm4geyBzdGFydDogZmlsZVNpemUgLSArZW5kLCBlbmQ6IGZpbGVTaXplIC0gMSB9O1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBmYWlsZWQgdG8gcGFyc2UgcmFuZ2UgaGVhZGVyXG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gIH1cbn1cblxuLyoqIEludGVyZmFjZSBmb3Igc2VydmVGaWxlIG9wdGlvbnMuICovXG5leHBvcnQgaW50ZXJmYWNlIFNlcnZlRmlsZU9wdGlvbnMge1xuICAvKiogVGhlIGFsZ29yaXRobSB0byB1c2UgZm9yIGdlbmVyYXRpbmcgdGhlIEVUYWcuXG4gICAqXG4gICAqIEBkZWZhdWx0IHtcIlNIQS0yNTZcIn1cbiAgICovXG4gIGV0YWdBbGdvcml0aG0/OiBBbGdvcml0aG1JZGVudGlmaWVyO1xuICAvKiogQW4gb3B0aW9uYWwgRmlsZUluZm8gb2JqZWN0IHJldHVybmVkIGJ5IERlbm8uc3RhdC4gSXQgaXMgdXNlZCBmb3Igb3B0aW1pemF0aW9uIHB1cnBvc2VzLiAqL1xuICBmaWxlSW5mbz86IERlbm8uRmlsZUluZm87XG59XG5cbi8qKlxuICogUmV0dXJucyBhbiBIVFRQIFJlc3BvbnNlIHdpdGggdGhlIHJlcXVlc3RlZCBmaWxlIGFzIHRoZSBib2R5LlxuICogQHBhcmFtIHJlcSBUaGUgc2VydmVyIHJlcXVlc3QgY29udGV4dCB1c2VkIHRvIGNsZWFudXAgdGhlIGZpbGUgaGFuZGxlLlxuICogQHBhcmFtIGZpbGVQYXRoIFBhdGggb2YgdGhlIGZpbGUgdG8gc2VydmUuXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBzZXJ2ZUZpbGUoXG4gIHJlcTogUmVxdWVzdCxcbiAgZmlsZVBhdGg6IHN0cmluZyxcbiAgeyBldGFnQWxnb3JpdGhtOiBhbGdvcml0aG0sIGZpbGVJbmZvIH06IFNlcnZlRmlsZU9wdGlvbnMgPSB7fSxcbik6IFByb21pc2U8UmVzcG9uc2U+IHtcbiAgdHJ5IHtcbiAgICBmaWxlSW5mbyA/Pz0gYXdhaXQgRGVuby5zdGF0KGZpbGVQYXRoKTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBpZiAoZXJyb3IgaW5zdGFuY2VvZiBEZW5vLmVycm9ycy5Ob3RGb3VuZCkge1xuICAgICAgYXdhaXQgcmVxLmJvZHk/LmNhbmNlbCgpO1xuICAgICAgcmV0dXJuIGNyZWF0ZVN0YW5kYXJkUmVzcG9uc2UoU1RBVFVTX0NPREUuTm90Rm91bmQpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBlcnJvcjtcbiAgICB9XG4gIH1cblxuICBpZiAoZmlsZUluZm8uaXNEaXJlY3RvcnkpIHtcbiAgICBhd2FpdCByZXEuYm9keT8uY2FuY2VsKCk7XG4gICAgcmV0dXJuIGNyZWF0ZVN0YW5kYXJkUmVzcG9uc2UoU1RBVFVTX0NPREUuTm90Rm91bmQpO1xuICB9XG5cbiAgY29uc3QgaGVhZGVycyA9IGNyZWF0ZUJhc2VIZWFkZXJzKCk7XG5cbiAgLy8gU2V0IGRhdGUgaGVhZGVyIGlmIGFjY2VzcyB0aW1lc3RhbXAgaXMgYXZhaWxhYmxlXG4gIGlmIChmaWxlSW5mby5hdGltZSkge1xuICAgIGhlYWRlcnMuc2V0KFwiZGF0ZVwiLCBmaWxlSW5mby5hdGltZS50b1VUQ1N0cmluZygpKTtcbiAgfVxuXG4gIGNvbnN0IGV0YWcgPSBmaWxlSW5mby5tdGltZVxuICAgID8gYXdhaXQgY2FsY3VsYXRlKGZpbGVJbmZvLCB7IGFsZ29yaXRobSB9KVxuICAgIDogYXdhaXQgSEFTSEVEX0RFTk9fREVQTE9ZTUVOVF9JRDtcblxuICAvLyBTZXQgbGFzdCBtb2RpZmllZCBoZWFkZXIgaWYgbGFzdCBtb2RpZmljYXRpb24gdGltZXN0YW1wIGlzIGF2YWlsYWJsZVxuICBpZiAoZmlsZUluZm8ubXRpbWUpIHtcbiAgICBoZWFkZXJzLnNldChcImxhc3QtbW9kaWZpZWRcIiwgZmlsZUluZm8ubXRpbWUudG9VVENTdHJpbmcoKSk7XG4gIH1cbiAgaWYgKGV0YWcpIHtcbiAgICBoZWFkZXJzLnNldChcImV0YWdcIiwgZXRhZyk7XG4gIH1cblxuICBpZiAoZXRhZyB8fCBmaWxlSW5mby5tdGltZSkge1xuICAgIC8vIElmIGEgYGlmLW5vbmUtbWF0Y2hgIGhlYWRlciBpcyBwcmVzZW50IGFuZCB0aGUgdmFsdWUgbWF0Y2hlcyB0aGUgdGFnIG9yXG4gICAgLy8gaWYgYSBgaWYtbW9kaWZpZWQtc2luY2VgIGhlYWRlciBpcyBwcmVzZW50IGFuZCB0aGUgdmFsdWUgaXMgYmlnZ2VyIHRoYW5cbiAgICAvLyB0aGUgYWNjZXNzIHRpbWVzdGFtcCB2YWx1ZSwgdGhlbiByZXR1cm4gMzA0XG4gICAgY29uc3QgaWZOb25lTWF0Y2hWYWx1ZSA9IHJlcS5oZWFkZXJzLmdldChcImlmLW5vbmUtbWF0Y2hcIik7XG4gICAgY29uc3QgaWZNb2RpZmllZFNpbmNlVmFsdWUgPSByZXEuaGVhZGVycy5nZXQoXCJpZi1tb2RpZmllZC1zaW5jZVwiKTtcbiAgICBpZiAoXG4gICAgICAoIWlmTm9uZU1hdGNoKGlmTm9uZU1hdGNoVmFsdWUsIGV0YWcpKSB8fFxuICAgICAgKGlmTm9uZU1hdGNoVmFsdWUgPT09IG51bGwgJiZcbiAgICAgICAgZmlsZUluZm8ubXRpbWUgJiZcbiAgICAgICAgaWZNb2RpZmllZFNpbmNlVmFsdWUgJiZcbiAgICAgICAgZmlsZUluZm8ubXRpbWUuZ2V0VGltZSgpIDxcbiAgICAgICAgICBuZXcgRGF0ZShpZk1vZGlmaWVkU2luY2VWYWx1ZSkuZ2V0VGltZSgpICsgMTAwMClcbiAgICApIHtcbiAgICAgIGNvbnN0IHN0YXR1cyA9IFNUQVRVU19DT0RFLk5vdE1vZGlmaWVkO1xuICAgICAgcmV0dXJuIG5ldyBSZXNwb25zZShudWxsLCB7XG4gICAgICAgIHN0YXR1cyxcbiAgICAgICAgc3RhdHVzVGV4dDogU1RBVFVTX1RFWFRbc3RhdHVzXSxcbiAgICAgICAgaGVhZGVycyxcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIC8vIFNldCBtaW1lLXR5cGUgdXNpbmcgdGhlIGZpbGUgZXh0ZW5zaW9uIGluIGZpbGVQYXRoXG4gIGNvbnN0IGNvbnRlbnRUeXBlVmFsdWUgPSBjb250ZW50VHlwZShleHRuYW1lKGZpbGVQYXRoKSk7XG4gIGlmIChjb250ZW50VHlwZVZhbHVlKSB7XG4gICAgaGVhZGVycy5zZXQoXCJjb250ZW50LXR5cGVcIiwgY29udGVudFR5cGVWYWx1ZSk7XG4gIH1cblxuICBjb25zdCBmaWxlU2l6ZSA9IGZpbGVJbmZvLnNpemU7XG5cbiAgY29uc3QgcmFuZ2VWYWx1ZSA9IHJlcS5oZWFkZXJzLmdldChcInJhbmdlXCIpO1xuXG4gIC8vIGhhbmRsZSByYW5nZSByZXF1ZXN0XG4gIC8vIE5vdGU6IFNvbWUgY2xpZW50cyBhZGQgYSBSYW5nZSBoZWFkZXIgdG8gYWxsIHJlcXVlc3RzIHRvIGxpbWl0IHRoZSBzaXplIG9mIHRoZSByZXNwb25zZS5cbiAgLy8gSWYgdGhlIGZpbGUgaXMgZW1wdHksIGlnbm9yZSB0aGUgcmFuZ2UgaGVhZGVyIGFuZCByZXNwb25kIHdpdGggYSAyMDAgcmF0aGVyIHRoYW4gYSA0MTYuXG4gIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9nb2xhbmcvZ28vYmxvYi8wZDM0NzU0NGNiY2EwZjQyYjE2MDQyNGY2YmMyNDU4ZWJjYzdiM2ZjL3NyYy9uZXQvaHR0cC9mcy5nbyNMMjczLUwyNzZcbiAgaWYgKHJhbmdlVmFsdWUgJiYgMCA8IGZpbGVTaXplKSB7XG4gICAgY29uc3QgcGFyc2VkID0gcGFyc2VSYW5nZUhlYWRlcihyYW5nZVZhbHVlLCBmaWxlU2l6ZSk7XG5cbiAgICAvLyBSZXR1cm5zIDIwMCBPSyBpZiBwYXJzaW5nIHRoZSByYW5nZSBoZWFkZXIgZmFpbHNcbiAgICBpZiAoIXBhcnNlZCkge1xuICAgICAgLy8gU2V0IGNvbnRlbnQgbGVuZ3RoXG4gICAgICBoZWFkZXJzLnNldChcImNvbnRlbnQtbGVuZ3RoXCIsIGAke2ZpbGVTaXplfWApO1xuXG4gICAgICBjb25zdCBmaWxlID0gYXdhaXQgRGVuby5vcGVuKGZpbGVQYXRoKTtcbiAgICAgIGNvbnN0IHN0YXR1cyA9IFNUQVRVU19DT0RFLk9LO1xuICAgICAgcmV0dXJuIG5ldyBSZXNwb25zZShmaWxlLnJlYWRhYmxlLCB7XG4gICAgICAgIHN0YXR1cyxcbiAgICAgICAgc3RhdHVzVGV4dDogU1RBVFVTX1RFWFRbc3RhdHVzXSxcbiAgICAgICAgaGVhZGVycyxcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIFJldHVybiA0MTYgUmFuZ2UgTm90IFNhdGlzZmlhYmxlIGlmIGludmFsaWQgcmFuZ2UgaGVhZGVyIHZhbHVlXG4gICAgaWYgKFxuICAgICAgcGFyc2VkLmVuZCA8IDAgfHxcbiAgICAgIHBhcnNlZC5lbmQgPCBwYXJzZWQuc3RhcnQgfHxcbiAgICAgIGZpbGVTaXplIDw9IHBhcnNlZC5zdGFydFxuICAgICkge1xuICAgICAgLy8gU2V0IHRoZSBcIkNvbnRlbnQtcmFuZ2VcIiBoZWFkZXJcbiAgICAgIGhlYWRlcnMuc2V0KFwiY29udGVudC1yYW5nZVwiLCBgYnl0ZXMgKi8ke2ZpbGVTaXplfWApO1xuXG4gICAgICByZXR1cm4gY3JlYXRlU3RhbmRhcmRSZXNwb25zZShcbiAgICAgICAgU1RBVFVTX0NPREUuUmFuZ2VOb3RTYXRpc2ZpYWJsZSxcbiAgICAgICAgeyBoZWFkZXJzIH0sXG4gICAgICApO1xuICAgIH1cblxuICAgIC8vIGNsYW1wcyB0aGUgcmFuZ2UgaGVhZGVyIHZhbHVlXG4gICAgY29uc3Qgc3RhcnQgPSBNYXRoLm1heCgwLCBwYXJzZWQuc3RhcnQpO1xuICAgIGNvbnN0IGVuZCA9IE1hdGgubWluKHBhcnNlZC5lbmQsIGZpbGVTaXplIC0gMSk7XG5cbiAgICAvLyBTZXQgdGhlIFwiQ29udGVudC1yYW5nZVwiIGhlYWRlclxuICAgIGhlYWRlcnMuc2V0KFwiY29udGVudC1yYW5nZVwiLCBgYnl0ZXMgJHtzdGFydH0tJHtlbmR9LyR7ZmlsZVNpemV9YCk7XG5cbiAgICAvLyBTZXQgY29udGVudCBsZW5ndGhcbiAgICBjb25zdCBjb250ZW50TGVuZ3RoID0gZW5kIC0gc3RhcnQgKyAxO1xuICAgIGhlYWRlcnMuc2V0KFwiY29udGVudC1sZW5ndGhcIiwgYCR7Y29udGVudExlbmd0aH1gKTtcblxuICAgIC8vIFJldHVybiAyMDYgUGFydGlhbCBDb250ZW50XG4gICAgY29uc3QgZmlsZSA9IGF3YWl0IERlbm8ub3BlbihmaWxlUGF0aCk7XG4gICAgYXdhaXQgZmlsZS5zZWVrKHN0YXJ0LCBEZW5vLlNlZWtNb2RlLlN0YXJ0KTtcbiAgICBjb25zdCBzbGljZWQgPSBmaWxlLnJlYWRhYmxlXG4gICAgICAucGlwZVRocm91Z2gobmV3IEJ5dGVTbGljZVN0cmVhbSgwLCBjb250ZW50TGVuZ3RoIC0gMSkpO1xuICAgIGNvbnN0IHN0YXR1cyA9IFNUQVRVU19DT0RFLlBhcnRpYWxDb250ZW50O1xuICAgIHJldHVybiBuZXcgUmVzcG9uc2Uoc2xpY2VkLCB7XG4gICAgICBzdGF0dXMsXG4gICAgICBzdGF0dXNUZXh0OiBTVEFUVVNfVEVYVFtzdGF0dXNdLFxuICAgICAgaGVhZGVycyxcbiAgICB9KTtcbiAgfVxuXG4gIC8vIFNldCBjb250ZW50IGxlbmd0aFxuICBoZWFkZXJzLnNldChcImNvbnRlbnQtbGVuZ3RoXCIsIGAke2ZpbGVTaXplfWApO1xuXG4gIGNvbnN0IGZpbGUgPSBhd2FpdCBEZW5vLm9wZW4oZmlsZVBhdGgpO1xuICBjb25zdCBzdGF0dXMgPSBTVEFUVVNfQ09ERS5PSztcbiAgcmV0dXJuIG5ldyBSZXNwb25zZShmaWxlLnJlYWRhYmxlLCB7XG4gICAgc3RhdHVzLFxuICAgIHN0YXR1c1RleHQ6IFNUQVRVU19URVhUW3N0YXR1c10sXG4gICAgaGVhZGVycyxcbiAgfSk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHNlcnZlRGlySW5kZXgoXG4gIGRpclBhdGg6IHN0cmluZyxcbiAgb3B0aW9uczoge1xuICAgIHNob3dEb3RmaWxlczogYm9vbGVhbjtcbiAgICB0YXJnZXQ6IHN0cmluZztcbiAgICB1cmxSb290OiBzdHJpbmcgfCB1bmRlZmluZWQ7XG4gICAgcXVpZXQ6IGJvb2xlYW4gfCB1bmRlZmluZWQ7XG4gIH0sXG4pOiBQcm9taXNlPFJlc3BvbnNlPiB7XG4gIGNvbnN0IHsgc2hvd0RvdGZpbGVzIH0gPSBvcHRpb25zO1xuICBjb25zdCB1cmxSb290ID0gb3B0aW9ucy51cmxSb290ID8gXCIvXCIgKyBvcHRpb25zLnVybFJvb3QgOiBcIlwiO1xuICBjb25zdCBkaXJVcmwgPSBgLyR7XG4gICAgcmVsYXRpdmUob3B0aW9ucy50YXJnZXQsIGRpclBhdGgpLnJlcGxhY2VBbGwoXG4gICAgICBuZXcgUmVnRXhwKFNFUEFSQVRPUl9QQVRURVJOLCBcImdcIiksXG4gICAgICBcIi9cIixcbiAgICApXG4gIH1gO1xuICBjb25zdCBsaXN0RW50cnlQcm9taXNlOiBQcm9taXNlPEVudHJ5SW5mbz5bXSA9IFtdO1xuXG4gIC8vIGlmIFwiLi5cIiBtYWtlcyBzZW5zZVxuICBpZiAoZGlyVXJsICE9PSBcIi9cIikge1xuICAgIGNvbnN0IHByZXZQYXRoID0gam9pbihkaXJQYXRoLCBcIi4uXCIpO1xuICAgIGNvbnN0IGVudHJ5SW5mbyA9IERlbm8uc3RhdChwcmV2UGF0aCkudGhlbigoZmlsZUluZm8pOiBFbnRyeUluZm8gPT4gKHtcbiAgICAgIG1vZGU6IG1vZGVUb1N0cmluZyh0cnVlLCBmaWxlSW5mby5tb2RlKSxcbiAgICAgIHNpemU6IFwiXCIsXG4gICAgICBuYW1lOiBcIi4uL1wiLFxuICAgICAgdXJsOiBgJHt1cmxSb290fSR7cG9zaXhKb2luKGRpclVybCwgXCIuLlwiKX1gLFxuICAgIH0pKTtcbiAgICBsaXN0RW50cnlQcm9taXNlLnB1c2goZW50cnlJbmZvKTtcbiAgfVxuXG4gIC8vIFJlYWQgZmlsZUluZm8gaW4gcGFyYWxsZWxcbiAgZm9yIGF3YWl0IChjb25zdCBlbnRyeSBvZiBEZW5vLnJlYWREaXIoZGlyUGF0aCkpIHtcbiAgICBpZiAoIXNob3dEb3RmaWxlcyAmJiBlbnRyeS5uYW1lWzBdID09PSBcIi5cIikge1xuICAgICAgY29udGludWU7XG4gICAgfVxuICAgIGNvbnN0IGZpbGVQYXRoID0gam9pbihkaXJQYXRoLCBlbnRyeS5uYW1lKTtcbiAgICBjb25zdCBmaWxlVXJsID0gZW5jb2RlVVJJQ29tcG9uZW50KHBvc2l4Sm9pbihkaXJVcmwsIGVudHJ5Lm5hbWUpKVxuICAgICAgLnJlcGxhY2VBbGwoXCIlMkZcIiwgXCIvXCIpO1xuXG4gICAgbGlzdEVudHJ5UHJvbWlzZS5wdXNoKChhc3luYyAoKSA9PiB7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCBmaWxlSW5mbyA9IGF3YWl0IERlbm8uc3RhdChmaWxlUGF0aCk7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgbW9kZTogbW9kZVRvU3RyaW5nKGVudHJ5LmlzRGlyZWN0b3J5LCBmaWxlSW5mby5tb2RlKSxcbiAgICAgICAgICBzaXplOiBlbnRyeS5pc0ZpbGUgPyBmb3JtYXRCeXRlcyhmaWxlSW5mby5zaXplID8/IDApIDogXCJcIixcbiAgICAgICAgICBuYW1lOiBgJHtlbnRyeS5uYW1lfSR7ZW50cnkuaXNEaXJlY3RvcnkgPyBcIi9cIiA6IFwiXCJ9YCxcbiAgICAgICAgICB1cmw6IGAke3VybFJvb3R9JHtmaWxlVXJsfSR7ZW50cnkuaXNEaXJlY3RvcnkgPyBcIi9cIiA6IFwiXCJ9YCxcbiAgICAgICAgfTtcbiAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIC8vIE5vdGU6IERlbm8uc3RhdCBmb3Igd2luZG93cyBzeXN0ZW0gZmlsZXMgbWF5IGJlIHJlamVjdGVkIHdpdGggb3MgZXJyb3IgMzIuXG4gICAgICAgIGlmICghb3B0aW9ucy5xdWlldCkgbG9nRXJyb3IoZXJyb3IpO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIG1vZGU6IFwiKHVua25vd24gbW9kZSlcIixcbiAgICAgICAgICBzaXplOiBcIlwiLFxuICAgICAgICAgIG5hbWU6IGAke2VudHJ5Lm5hbWV9JHtlbnRyeS5pc0RpcmVjdG9yeSA/IFwiL1wiIDogXCJcIn1gLFxuICAgICAgICAgIHVybDogYCR7dXJsUm9vdH0ke2ZpbGVVcmx9JHtlbnRyeS5pc0RpcmVjdG9yeSA/IFwiL1wiIDogXCJcIn1gLFxuICAgICAgICB9O1xuICAgICAgfVxuICAgIH0pKCkpO1xuICB9XG5cbiAgY29uc3QgbGlzdEVudHJ5ID0gYXdhaXQgUHJvbWlzZS5hbGwobGlzdEVudHJ5UHJvbWlzZSk7XG4gIGxpc3RFbnRyeS5zb3J0KChhLCBiKSA9PlxuICAgIGEubmFtZS50b0xvd2VyQ2FzZSgpID4gYi5uYW1lLnRvTG93ZXJDYXNlKCkgPyAxIDogLTFcbiAgKTtcbiAgY29uc3QgZm9ybWF0dGVkRGlyVXJsID0gYCR7ZGlyVXJsLnJlcGxhY2UoL1xcLyQvLCBcIlwiKX0vYDtcbiAgY29uc3QgcGFnZSA9IGRpclZpZXdlclRlbXBsYXRlKGZvcm1hdHRlZERpclVybCwgbGlzdEVudHJ5KTtcblxuICBjb25zdCBoZWFkZXJzID0gY3JlYXRlQmFzZUhlYWRlcnMoKTtcbiAgaGVhZGVycy5zZXQoXCJjb250ZW50LXR5cGVcIiwgXCJ0ZXh0L2h0bWw7IGNoYXJzZXQ9VVRGLThcIik7XG5cbiAgY29uc3Qgc3RhdHVzID0gU1RBVFVTX0NPREUuT0s7XG4gIHJldHVybiBuZXcgUmVzcG9uc2UocGFnZSwge1xuICAgIHN0YXR1cyxcbiAgICBzdGF0dXNUZXh0OiBTVEFUVVNfVEVYVFtzdGF0dXNdLFxuICAgIGhlYWRlcnMsXG4gIH0pO1xufVxuXG5mdW5jdGlvbiBzZXJ2ZUZhbGxiYWNrKG1heWJlRXJyb3I6IHVua25vd24pOiBSZXNwb25zZSB7XG4gIGlmIChtYXliZUVycm9yIGluc3RhbmNlb2YgVVJJRXJyb3IpIHtcbiAgICByZXR1cm4gY3JlYXRlU3RhbmRhcmRSZXNwb25zZShTVEFUVVNfQ09ERS5CYWRSZXF1ZXN0KTtcbiAgfVxuXG4gIGlmIChtYXliZUVycm9yIGluc3RhbmNlb2YgRGVuby5lcnJvcnMuTm90Rm91bmQpIHtcbiAgICByZXR1cm4gY3JlYXRlU3RhbmRhcmRSZXNwb25zZShTVEFUVVNfQ09ERS5Ob3RGb3VuZCk7XG4gIH1cblxuICByZXR1cm4gY3JlYXRlU3RhbmRhcmRSZXNwb25zZShTVEFUVVNfQ09ERS5JbnRlcm5hbFNlcnZlckVycm9yKTtcbn1cblxuZnVuY3Rpb24gc2VydmVyTG9nKHJlcTogUmVxdWVzdCwgc3RhdHVzOiBudW1iZXIpIHtcbiAgY29uc3QgZCA9IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKTtcbiAgY29uc3QgZGF0ZUZtdCA9IGBbJHtkLnNsaWNlKDAsIDEwKX0gJHtkLnNsaWNlKDExLCAxOSl9XWA7XG4gIGNvbnN0IHVybCA9IG5ldyBVUkwocmVxLnVybCk7XG4gIGNvbnN0IHMgPSBgJHtkYXRlRm10fSBbJHtyZXEubWV0aG9kfV0gJHt1cmwucGF0aG5hbWV9JHt1cmwuc2VhcmNofSAke3N0YXR1c31gO1xuICAvLyB1c2luZyBjb25zb2xlLmRlYnVnIGluc3RlYWQgb2YgY29uc29sZS5sb2cgc28gY2hyb21lIGluc3BlY3QgdXNlcnMgY2FuIGhpZGUgcmVxdWVzdCBsb2dzXG4gIGNvbnNvbGUuZGVidWcocyk7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZUJhc2VIZWFkZXJzKCk6IEhlYWRlcnMge1xuICByZXR1cm4gbmV3IEhlYWRlcnMoe1xuICAgIHNlcnZlcjogXCJkZW5vXCIsXG4gICAgLy8gU2V0IFwiYWNjZXB0LXJhbmdlc1wiIHNvIHRoYXQgdGhlIGNsaWVudCBrbm93cyBpdCBjYW4gbWFrZSByYW5nZSByZXF1ZXN0cyBvbiBmdXR1cmUgcmVxdWVzdHNcbiAgICBcImFjY2VwdC1yYW5nZXNcIjogXCJieXRlc1wiLFxuICB9KTtcbn1cblxuZnVuY3Rpb24gZGlyVmlld2VyVGVtcGxhdGUoZGlybmFtZTogc3RyaW5nLCBlbnRyaWVzOiBFbnRyeUluZm9bXSk6IHN0cmluZyB7XG4gIGNvbnN0IHBhdGhzID0gZGlybmFtZS5zcGxpdChcIi9cIik7XG5cbiAgcmV0dXJuIGBcbiAgICA8IURPQ1RZUEUgaHRtbD5cbiAgICA8aHRtbCBsYW5nPVwiZW5cIj5cbiAgICAgIDxoZWFkPlxuICAgICAgICA8bWV0YSBjaGFyc2V0PVwiVVRGLThcIiAvPlxuICAgICAgICA8bWV0YSBuYW1lPVwidmlld3BvcnRcIiBjb250ZW50PVwid2lkdGg9ZGV2aWNlLXdpZHRoLCBpbml0aWFsLXNjYWxlPTEuMFwiIC8+XG4gICAgICAgIDxtZXRhIGh0dHAtZXF1aXY9XCJYLVVBLUNvbXBhdGlibGVcIiBjb250ZW50PVwiaWU9ZWRnZVwiIC8+XG4gICAgICAgIDx0aXRsZT5EZW5vIEZpbGUgU2VydmVyPC90aXRsZT5cbiAgICAgICAgPHN0eWxlPlxuICAgICAgICAgIDpyb290IHtcbiAgICAgICAgICAgIC0tYmFja2dyb3VuZC1jb2xvcjogI2ZhZmFmYTtcbiAgICAgICAgICAgIC0tY29sb3I6IHJnYmEoMCwgMCwgMCwgMC44Nyk7XG4gICAgICAgICAgfVxuICAgICAgICAgIEBtZWRpYSAocHJlZmVycy1jb2xvci1zY2hlbWU6IGRhcmspIHtcbiAgICAgICAgICAgIDpyb290IHtcbiAgICAgICAgICAgICAgLS1iYWNrZ3JvdW5kLWNvbG9yOiAjMjkyOTI5O1xuICAgICAgICAgICAgICAtLWNvbG9yOiAjZmZmO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhlYWQge1xuICAgICAgICAgICAgICBjb2xvcjogIzdmN2Y3ZjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgQG1lZGlhIChtaW4td2lkdGg6IDk2MHB4KSB7XG4gICAgICAgICAgICBtYWluIHtcbiAgICAgICAgICAgICAgbWF4LXdpZHRoOiA5NjBweDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJvZHkge1xuICAgICAgICAgICAgICBwYWRkaW5nLWxlZnQ6IDMycHg7XG4gICAgICAgICAgICAgIHBhZGRpbmctcmlnaHQ6IDMycHg7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIEBtZWRpYSAobWluLXdpZHRoOiA2MDBweCkge1xuICAgICAgICAgICAgbWFpbiB7XG4gICAgICAgICAgICAgIHBhZGRpbmctbGVmdDogMjRweDtcbiAgICAgICAgICAgICAgcGFkZGluZy1yaWdodDogMjRweDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgYm9keSB7XG4gICAgICAgICAgICBiYWNrZ3JvdW5kOiB2YXIoLS1iYWNrZ3JvdW5kLWNvbG9yKTtcbiAgICAgICAgICAgIGNvbG9yOiB2YXIoLS1jb2xvcik7XG4gICAgICAgICAgICBmb250LWZhbWlseTogXCJSb2JvdG9cIiwgXCJIZWx2ZXRpY2FcIiwgXCJBcmlhbFwiLCBzYW5zLXNlcmlmO1xuICAgICAgICAgICAgZm9udC13ZWlnaHQ6IDQwMDtcbiAgICAgICAgICAgIGxpbmUtaGVpZ2h0OiAxLjQzO1xuICAgICAgICAgICAgZm9udC1zaXplOiAwLjg3NXJlbTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYSB7XG4gICAgICAgICAgICBjb2xvcjogIzIxOTZmMztcbiAgICAgICAgICAgIHRleHQtZGVjb3JhdGlvbjogbm9uZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYTpob3ZlciB7XG4gICAgICAgICAgICB0ZXh0LWRlY29yYXRpb246IHVuZGVybGluZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhlYWQge1xuICAgICAgICAgICAgdGV4dC1hbGlnbjogbGVmdDtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhlYWQgdGgge1xuICAgICAgICAgICAgcGFkZGluZy1ib3R0b206IDEycHg7XG4gICAgICAgICAgfVxuICAgICAgICAgIHRhYmxlIHRkIHtcbiAgICAgICAgICAgIHBhZGRpbmc6IDZweCAzNnB4IDZweCAwcHg7XG4gICAgICAgICAgfVxuICAgICAgICAgIC5zaXplIHtcbiAgICAgICAgICAgIHRleHQtYWxpZ246IHJpZ2h0O1xuICAgICAgICAgICAgcGFkZGluZzogNnB4IDEycHggNnB4IDI0cHg7XG4gICAgICAgICAgfVxuICAgICAgICAgIC5tb2RlIHtcbiAgICAgICAgICAgIGZvbnQtZmFtaWx5OiBtb25vc3BhY2UsIG1vbm9zcGFjZTtcbiAgICAgICAgICB9XG4gICAgICAgIDwvc3R5bGU+XG4gICAgICA8L2hlYWQ+XG4gICAgICA8Ym9keT5cbiAgICAgICAgPG1haW4+XG4gICAgICAgICAgPGgxPkluZGV4IG9mXG4gICAgICAgICAgPGEgaHJlZj1cIi9cIj5ob21lPC9hPiR7XG4gICAgcGF0aHNcbiAgICAgIC5tYXAoKHBhdGgsIGluZGV4LCBhcnJheSkgPT4ge1xuICAgICAgICBpZiAocGF0aCA9PT0gXCJcIikgcmV0dXJuIFwiXCI7XG4gICAgICAgIGNvbnN0IGxpbmsgPSBhcnJheS5zbGljZSgwLCBpbmRleCArIDEpLmpvaW4oXCIvXCIpO1xuICAgICAgICByZXR1cm4gYDxhIGhyZWY9XCIke2xpbmt9XCI+JHtwYXRofTwvYT5gO1xuICAgICAgfSlcbiAgICAgIC5qb2luKFwiL1wiKVxuICB9XG4gICAgICAgICAgPC9oMT5cbiAgICAgICAgICA8dGFibGU+XG4gICAgICAgICAgICA8dGhlYWQ+XG4gICAgICAgICAgICAgIDx0cj5cbiAgICAgICAgICAgICAgICA8dGg+TW9kZTwvdGg+XG4gICAgICAgICAgICAgICAgPHRoPlNpemU8L3RoPlxuICAgICAgICAgICAgICAgIDx0aD5OYW1lPC90aD5cbiAgICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICAgIDwvdGhlYWQ+XG4gICAgICAgICAgICAke1xuICAgIGVudHJpZXNcbiAgICAgIC5tYXAoXG4gICAgICAgIChlbnRyeSkgPT4gYFxuICAgICAgICAgICAgICAgICAgPHRyPlxuICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3M9XCJtb2RlXCI+XG4gICAgICAgICAgICAgICAgICAgICAgJHtlbnRyeS5tb2RlfVxuICAgICAgICAgICAgICAgICAgICA8L3RkPlxuICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3M9XCJzaXplXCI+XG4gICAgICAgICAgICAgICAgICAgICAgJHtlbnRyeS5zaXplfVxuICAgICAgICAgICAgICAgICAgICA8L3RkPlxuICAgICAgICAgICAgICAgICAgICA8dGQ+XG4gICAgICAgICAgICAgICAgICAgICAgPGEgaHJlZj1cIiR7ZW50cnkudXJsfVwiPiR7ZW50cnkubmFtZX08L2E+XG4gICAgICAgICAgICAgICAgICAgIDwvdGQ+XG4gICAgICAgICAgICAgICAgICA8L3RyPlxuICAgICAgICAgICAgICAgIGAsXG4gICAgICApXG4gICAgICAuam9pbihcIlwiKVxuICB9XG4gICAgICAgICAgPC90YWJsZT5cbiAgICAgICAgPC9tYWluPlxuICAgICAgPC9ib2R5PlxuICAgIDwvaHRtbD5cbiAgYDtcbn1cblxuLyoqIEludGVyZmFjZSBmb3Igc2VydmVEaXIgb3B0aW9ucy4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgU2VydmVEaXJPcHRpb25zIHtcbiAgLyoqIFNlcnZlcyB0aGUgZmlsZXMgdW5kZXIgdGhlIGdpdmVuIGRpcmVjdG9yeSByb290LiBEZWZhdWx0cyB0byB5b3VyIGN1cnJlbnQgZGlyZWN0b3J5LlxuICAgKlxuICAgKiBAZGVmYXVsdCB7XCIuXCJ9XG4gICAqL1xuICBmc1Jvb3Q/OiBzdHJpbmc7XG4gIC8qKiBTcGVjaWZpZWQgdGhhdCBwYXJ0IGlzIHN0cmlwcGVkIGZyb20gdGhlIGJlZ2lubmluZyBvZiB0aGUgcmVxdWVzdGVkIHBhdGhuYW1lLlxuICAgKlxuICAgKiBAZGVmYXVsdCB7dW5kZWZpbmVkfVxuICAgKi9cbiAgdXJsUm9vdD86IHN0cmluZztcbiAgLyoqIEVuYWJsZSBkaXJlY3RvcnkgbGlzdGluZy5cbiAgICpcbiAgICogQGRlZmF1bHQge2ZhbHNlfVxuICAgKi9cbiAgc2hvd0Rpckxpc3Rpbmc/OiBib29sZWFuO1xuICAvKiogU2VydmVzIGRvdGZpbGVzLlxuICAgKlxuICAgKiBAZGVmYXVsdCB7ZmFsc2V9XG4gICAqL1xuICBzaG93RG90ZmlsZXM/OiBib29sZWFuO1xuICAvKiogU2VydmVzIGluZGV4Lmh0bWwgYXMgdGhlIGluZGV4IGZpbGUgb2YgdGhlIGRpcmVjdG9yeS5cbiAgICpcbiAgICogQGRlZmF1bHQge3RydWV9XG4gICAqL1xuICBzaG93SW5kZXg/OiBib29sZWFuO1xuICAvKiogRW5hYmxlIENPUlMgdmlhIHRoZSBcIkFjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpblwiIGhlYWRlci5cbiAgICpcbiAgICogQGRlZmF1bHQge2ZhbHNlfVxuICAgKi9cbiAgZW5hYmxlQ29ycz86IGJvb2xlYW47XG4gIC8qKiBEbyBub3QgcHJpbnQgcmVxdWVzdCBsZXZlbCBsb2dzLiBEZWZhdWx0cyB0byBmYWxzZS5cbiAgICpcbiAgICogQGRlZmF1bHQge2ZhbHNlfVxuICAgKi9cbiAgcXVpZXQ/OiBib29sZWFuO1xuICAvKiogVGhlIGFsZ29yaXRobSB0byB1c2UgZm9yIGdlbmVyYXRpbmcgdGhlIEVUYWcuXG4gICAqXG4gICAqIEBkZWZhdWx0IHtcIlNIQS0yNTZcIn1cbiAgICovXG4gIGV0YWdBbGdvcml0aG0/OiBBbGdvcml0aG1JZGVudGlmaWVyO1xuICAvKiogSGVhZGVycyB0byBhZGQgdG8gZWFjaCByZXNwb25zZVxuICAgKlxuICAgKiBAZGVmYXVsdCB7W119XG4gICAqL1xuICBoZWFkZXJzPzogc3RyaW5nW107XG59XG5cbi8qKlxuICogU2VydmVzIHRoZSBmaWxlcyB1bmRlciB0aGUgZ2l2ZW4gZGlyZWN0b3J5IHJvb3QgKG9wdHMuZnNSb290KS5cbiAqXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgc2VydmVEaXIgfSBmcm9tIFwiQHN0ZC9odHRwL2ZpbGUtc2VydmVyXCI7XG4gKlxuICogRGVuby5zZXJ2ZSgocmVxKSA9PiB7XG4gKiAgIGNvbnN0IHBhdGhuYW1lID0gbmV3IFVSTChyZXEudXJsKS5wYXRobmFtZTtcbiAqICAgaWYgKHBhdGhuYW1lLnN0YXJ0c1dpdGgoXCIvc3RhdGljXCIpKSB7XG4gKiAgICAgcmV0dXJuIHNlcnZlRGlyKHJlcSwge1xuICogICAgICAgZnNSb290OiBcInBhdGgvdG8vc3RhdGljL2ZpbGVzL2RpclwiLFxuICogICAgIH0pO1xuICogICB9XG4gKiAgIC8vIERvIGR5bmFtaWMgcmVzcG9uc2VzXG4gKiAgIHJldHVybiBuZXcgUmVzcG9uc2UoKTtcbiAqIH0pO1xuICogYGBgXG4gKlxuICogT3B0aW9uYWxseSB5b3UgY2FuIHBhc3MgYHVybFJvb3RgIG9wdGlvbi4gSWYgaXQncyBzcGVjaWZpZWQgdGhhdCBwYXJ0IGlzIHN0cmlwcGVkIGZyb20gdGhlIGJlZ2lubmluZyBvZiB0aGUgcmVxdWVzdGVkIHBhdGhuYW1lLlxuICpcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyBzZXJ2ZURpciB9IGZyb20gXCJAc3RkL2h0dHAvZmlsZS1zZXJ2ZXJcIjtcbiAqXG4gKiAvLyAuLi5cbiAqIHNlcnZlRGlyKG5ldyBSZXF1ZXN0KFwiaHR0cDovL2xvY2FsaG9zdC9zdGF0aWMvcGF0aC90by9maWxlXCIpLCB7XG4gKiAgIGZzUm9vdDogXCJwdWJsaWNcIixcbiAqICAgdXJsUm9vdDogXCJzdGF0aWNcIixcbiAqIH0pO1xuICogYGBgXG4gKlxuICogVGhlIGFib3ZlIGV4YW1wbGUgc2VydmVzIGAuL3B1YmxpYy9wYXRoL3RvL2ZpbGVgIGZvciB0aGUgcmVxdWVzdCB0byBgL3N0YXRpYy9wYXRoL3RvL2ZpbGVgLlxuICpcbiAqIEBwYXJhbSByZXEgVGhlIHJlcXVlc3QgdG8gaGFuZGxlXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBzZXJ2ZURpcihcbiAgcmVxOiBSZXF1ZXN0LFxuICBvcHRzOiBTZXJ2ZURpck9wdGlvbnMgPSB7fSxcbik6IFByb21pc2U8UmVzcG9uc2U+IHtcbiAgbGV0IHJlc3BvbnNlOiBSZXNwb25zZTtcbiAgdHJ5IHtcbiAgICByZXNwb25zZSA9IGF3YWl0IGNyZWF0ZVNlcnZlRGlyUmVzcG9uc2UocmVxLCBvcHRzKTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBpZiAoIW9wdHMucXVpZXQpIGxvZ0Vycm9yKGVycm9yKTtcbiAgICByZXNwb25zZSA9IHNlcnZlRmFsbGJhY2soZXJyb3IpO1xuICB9XG5cbiAgLy8gRG8gbm90IHVwZGF0ZSB0aGUgaGVhZGVyIGlmIHRoZSByZXNwb25zZSBpcyBhIDMwMSByZWRpcmVjdC5cbiAgY29uc3QgaXNSZWRpcmVjdFJlc3BvbnNlID0gaXNSZWRpcmVjdFN0YXR1cyhyZXNwb25zZS5zdGF0dXMpO1xuXG4gIGlmIChvcHRzLmVuYWJsZUNvcnMgJiYgIWlzUmVkaXJlY3RSZXNwb25zZSkge1xuICAgIHJlc3BvbnNlLmhlYWRlcnMuYXBwZW5kKFwiYWNjZXNzLWNvbnRyb2wtYWxsb3ctb3JpZ2luXCIsIFwiKlwiKTtcbiAgICByZXNwb25zZS5oZWFkZXJzLmFwcGVuZChcbiAgICAgIFwiYWNjZXNzLWNvbnRyb2wtYWxsb3ctaGVhZGVyc1wiLFxuICAgICAgXCJPcmlnaW4sIFgtUmVxdWVzdGVkLVdpdGgsIENvbnRlbnQtVHlwZSwgQWNjZXB0LCBSYW5nZVwiLFxuICAgICk7XG4gIH1cblxuICBpZiAoIW9wdHMucXVpZXQpIHNlcnZlckxvZyhyZXEsIHJlc3BvbnNlLnN0YXR1cyk7XG5cbiAgaWYgKG9wdHMuaGVhZGVycyAmJiAhaXNSZWRpcmVjdFJlc3BvbnNlKSB7XG4gICAgZm9yIChjb25zdCBoZWFkZXIgb2Ygb3B0cy5oZWFkZXJzKSB7XG4gICAgICBjb25zdCBoZWFkZXJTcGxpdCA9IGhlYWRlci5zcGxpdChcIjpcIik7XG4gICAgICBjb25zdCBuYW1lID0gaGVhZGVyU3BsaXRbMF0hO1xuICAgICAgY29uc3QgdmFsdWUgPSBoZWFkZXJTcGxpdC5zbGljZSgxKS5qb2luKFwiOlwiKTtcbiAgICAgIHJlc3BvbnNlLmhlYWRlcnMuYXBwZW5kKG5hbWUsIHZhbHVlKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gcmVzcG9uc2U7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGNyZWF0ZVNlcnZlRGlyUmVzcG9uc2UoXG4gIHJlcTogUmVxdWVzdCxcbiAgb3B0czogU2VydmVEaXJPcHRpb25zLFxuKSB7XG4gIGNvbnN0IHRhcmdldCA9IG9wdHMuZnNSb290IHx8IFwiLlwiO1xuICBjb25zdCB1cmxSb290ID0gb3B0cy51cmxSb290O1xuICBjb25zdCBzaG93SW5kZXggPSBvcHRzLnNob3dJbmRleCA/PyB0cnVlO1xuICBjb25zdCBzaG93RG90ZmlsZXMgPSBvcHRzLnNob3dEb3RmaWxlcyB8fCBmYWxzZTtcbiAgY29uc3QgeyBldGFnQWxnb3JpdGhtLCBzaG93RGlyTGlzdGluZywgcXVpZXQgfSA9IG9wdHM7XG5cbiAgY29uc3QgdXJsID0gbmV3IFVSTChyZXEudXJsKTtcbiAgY29uc3QgZGVjb2RlZFVybCA9IGRlY29kZVVSSUNvbXBvbmVudCh1cmwucGF0aG5hbWUpO1xuICBsZXQgbm9ybWFsaXplZFBhdGggPSBwb3NpeE5vcm1hbGl6ZShkZWNvZGVkVXJsKTtcblxuICBpZiAodXJsUm9vdCAmJiAhbm9ybWFsaXplZFBhdGguc3RhcnRzV2l0aChcIi9cIiArIHVybFJvb3QpKSB7XG4gICAgcmV0dXJuIGNyZWF0ZVN0YW5kYXJkUmVzcG9uc2UoU1RBVFVTX0NPREUuTm90Rm91bmQpO1xuICB9XG5cbiAgLy8gUmVkaXJlY3QgcGF0aHMgbGlrZSBgL2Zvby8vLy9iYXJgIGFuZCBgL2Zvby9iYXIvLy8vL2AgdG8gbm9ybWFsaXplZCBwYXRocy5cbiAgaWYgKG5vcm1hbGl6ZWRQYXRoICE9PSBkZWNvZGVkVXJsKSB7XG4gICAgdXJsLnBhdGhuYW1lID0gbm9ybWFsaXplZFBhdGg7XG4gICAgcmV0dXJuIFJlc3BvbnNlLnJlZGlyZWN0KHVybCwgMzAxKTtcbiAgfVxuXG4gIGlmICh1cmxSb290KSB7XG4gICAgbm9ybWFsaXplZFBhdGggPSBub3JtYWxpemVkUGF0aC5yZXBsYWNlKHVybFJvb3QsIFwiXCIpO1xuICB9XG5cbiAgLy8gUmVtb3ZlIHRyYWlsaW5nIHNsYXNoZXMgdG8gYXZvaWQgRU5PRU5UIGVycm9yc1xuICAvLyB3aGVuIGFjY2Vzc2luZyBhIHBhdGggdG8gYSBmaWxlIHdpdGggYSB0cmFpbGluZyBzbGFzaC5cbiAgaWYgKG5vcm1hbGl6ZWRQYXRoLmVuZHNXaXRoKFwiL1wiKSkge1xuICAgIG5vcm1hbGl6ZWRQYXRoID0gbm9ybWFsaXplZFBhdGguc2xpY2UoMCwgLTEpO1xuICB9XG5cbiAgY29uc3QgZnNQYXRoID0gam9pbih0YXJnZXQsIG5vcm1hbGl6ZWRQYXRoKTtcbiAgY29uc3QgZmlsZUluZm8gPSBhd2FpdCBEZW5vLnN0YXQoZnNQYXRoKTtcblxuICAvLyBGb3IgZmlsZXMsIHJlbW92ZSB0aGUgdHJhaWxpbmcgc2xhc2ggZnJvbSB0aGUgcGF0aC5cbiAgaWYgKGZpbGVJbmZvLmlzRmlsZSAmJiB1cmwucGF0aG5hbWUuZW5kc1dpdGgoXCIvXCIpKSB7XG4gICAgdXJsLnBhdGhuYW1lID0gdXJsLnBhdGhuYW1lLnNsaWNlKDAsIC0xKTtcbiAgICByZXR1cm4gUmVzcG9uc2UucmVkaXJlY3QodXJsLCAzMDEpO1xuICB9XG4gIC8vIEZvciBkaXJlY3RvcmllcywgdGhlIHBhdGggbXVzdCBoYXZlIGEgdHJhaWxpbmcgc2xhc2guXG4gIGlmIChmaWxlSW5mby5pc0RpcmVjdG9yeSAmJiAhdXJsLnBhdGhuYW1lLmVuZHNXaXRoKFwiL1wiKSkge1xuICAgIC8vIE9uIGRpcmVjdG9yeSBsaXN0aW5nIHBhZ2VzLFxuICAgIC8vIGlmIHRoZSBjdXJyZW50IFVSTCdzIHBhdGhuYW1lIGRvZXNuJ3QgZW5kIHdpdGggYSBzbGFzaCwgYW55XG4gICAgLy8gcmVsYXRpdmUgVVJMcyBpbiB0aGUgaW5kZXggZmlsZSB3aWxsIHJlc29sdmUgYWdhaW5zdCB0aGUgcGFyZW50XG4gICAgLy8gZGlyZWN0b3J5LCByYXRoZXIgdGhhbiB0aGUgY3VycmVudCBkaXJlY3RvcnkuIFRvIHByZXZlbnQgdGhhdCwgd2VcbiAgICAvLyByZXR1cm4gYSAzMDEgcmVkaXJlY3QgdG8gdGhlIFVSTCB3aXRoIGEgc2xhc2guXG4gICAgdXJsLnBhdGhuYW1lICs9IFwiL1wiO1xuICAgIHJldHVybiBSZXNwb25zZS5yZWRpcmVjdCh1cmwsIDMwMSk7XG4gIH1cblxuICAvLyBpZiB0YXJnZXQgaXMgZmlsZSwgc2VydmUgZmlsZS5cbiAgaWYgKCFmaWxlSW5mby5pc0RpcmVjdG9yeSkge1xuICAgIHJldHVybiBzZXJ2ZUZpbGUocmVxLCBmc1BhdGgsIHtcbiAgICAgIGV0YWdBbGdvcml0aG0sXG4gICAgICBmaWxlSW5mbyxcbiAgICB9KTtcbiAgfVxuXG4gIC8vIGlmIHRhcmdldCBpcyBkaXJlY3RvcnksIHNlcnZlIGluZGV4IG9yIGRpciBsaXN0aW5nLlxuICBpZiAoc2hvd0luZGV4KSB7IC8vIHNlcnZlIGluZGV4Lmh0bWxcbiAgICBjb25zdCBpbmRleFBhdGggPSBqb2luKGZzUGF0aCwgXCJpbmRleC5odG1sXCIpO1xuXG4gICAgbGV0IGluZGV4RmlsZUluZm86IERlbm8uRmlsZUluZm8gfCB1bmRlZmluZWQ7XG4gICAgdHJ5IHtcbiAgICAgIGluZGV4RmlsZUluZm8gPSBhd2FpdCBEZW5vLmxzdGF0KGluZGV4UGF0aCk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGlmICghKGVycm9yIGluc3RhbmNlb2YgRGVuby5lcnJvcnMuTm90Rm91bmQpKSB7XG4gICAgICAgIHRocm93IGVycm9yO1xuICAgICAgfVxuICAgICAgLy8gc2tpcCBOb3QgRm91bmQgZXJyb3JcbiAgICB9XG5cbiAgICBpZiAoaW5kZXhGaWxlSW5mbz8uaXNGaWxlKSB7XG4gICAgICByZXR1cm4gc2VydmVGaWxlKHJlcSwgaW5kZXhQYXRoLCB7XG4gICAgICAgIGV0YWdBbGdvcml0aG0sXG4gICAgICAgIGZpbGVJbmZvOiBpbmRleEZpbGVJbmZvLFxuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgaWYgKHNob3dEaXJMaXN0aW5nKSB7IC8vIHNlcnZlIGRpcmVjdG9yeSBsaXN0XG4gICAgcmV0dXJuIHNlcnZlRGlySW5kZXgoZnNQYXRoLCB7IHVybFJvb3QsIHNob3dEb3RmaWxlcywgdGFyZ2V0LCBxdWlldCB9KTtcbiAgfVxuXG4gIHJldHVybiBjcmVhdGVTdGFuZGFyZFJlc3BvbnNlKFNUQVRVU19DT0RFLk5vdEZvdW5kKTtcbn1cblxuZnVuY3Rpb24gbG9nRXJyb3IoZXJyb3I6IHVua25vd24pIHtcbiAgY29uc29sZS5lcnJvcihyZWQoZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBgJHtlcnJvcn1gKSk7XG59XG5cbmZ1bmN0aW9uIG1haW4oKSB7XG4gIGNvbnN0IHNlcnZlckFyZ3MgPSBwYXJzZUFyZ3MoRGVuby5hcmdzLCB7XG4gICAgc3RyaW5nOiBbXCJwb3J0XCIsIFwiaG9zdFwiLCBcImNlcnRcIiwgXCJrZXlcIiwgXCJoZWFkZXJcIl0sXG4gICAgYm9vbGVhbjogW1wiaGVscFwiLCBcImRpci1saXN0aW5nXCIsIFwiZG90ZmlsZXNcIiwgXCJjb3JzXCIsIFwidmVyYm9zZVwiLCBcInZlcnNpb25cIl0sXG4gICAgbmVnYXRhYmxlOiBbXCJkaXItbGlzdGluZ1wiLCBcImRvdGZpbGVzXCIsIFwiY29yc1wiXSxcbiAgICBjb2xsZWN0OiBbXCJoZWFkZXJcIl0sXG4gICAgZGVmYXVsdDoge1xuICAgICAgXCJkaXItbGlzdGluZ1wiOiB0cnVlLFxuICAgICAgZG90ZmlsZXM6IHRydWUsXG4gICAgICBjb3JzOiB0cnVlLFxuICAgICAgdmVyYm9zZTogZmFsc2UsXG4gICAgICB2ZXJzaW9uOiBmYWxzZSxcbiAgICAgIGhvc3Q6IFwiMC4wLjAuMFwiLFxuICAgICAgcG9ydDogXCI0NTA3XCIsXG4gICAgICBjZXJ0OiBcIlwiLFxuICAgICAga2V5OiBcIlwiLFxuICAgIH0sXG4gICAgYWxpYXM6IHtcbiAgICAgIHA6IFwicG9ydFwiLFxuICAgICAgYzogXCJjZXJ0XCIsXG4gICAgICBrOiBcImtleVwiLFxuICAgICAgaDogXCJoZWxwXCIsXG4gICAgICB2OiBcInZlcmJvc2VcIixcbiAgICAgIFY6IFwidmVyc2lvblwiLFxuICAgICAgSDogXCJoZWFkZXJcIixcbiAgICB9LFxuICB9KTtcbiAgY29uc3QgcG9ydCA9IE51bWJlcihzZXJ2ZXJBcmdzLnBvcnQpO1xuICBjb25zdCBoZWFkZXJzID0gc2VydmVyQXJncy5oZWFkZXIgfHwgW107XG4gIGNvbnN0IGhvc3QgPSBzZXJ2ZXJBcmdzLmhvc3Q7XG4gIGNvbnN0IGNlcnRGaWxlID0gc2VydmVyQXJncy5jZXJ0O1xuICBjb25zdCBrZXlGaWxlID0gc2VydmVyQXJncy5rZXk7XG5cbiAgaWYgKHNlcnZlckFyZ3MuaGVscCkge1xuICAgIHByaW50VXNhZ2UoKTtcbiAgICBEZW5vLmV4aXQoKTtcbiAgfVxuXG4gIGlmIChzZXJ2ZXJBcmdzLnZlcnNpb24pIHtcbiAgICBjb25zb2xlLmxvZyhgRGVubyBGaWxlIFNlcnZlciAke2Rlbm9Db25maWcudmVyc2lvbn1gKTtcbiAgICBEZW5vLmV4aXQoKTtcbiAgfVxuXG4gIGlmIChrZXlGaWxlIHx8IGNlcnRGaWxlKSB7XG4gICAgaWYgKGtleUZpbGUgPT09IFwiXCIgfHwgY2VydEZpbGUgPT09IFwiXCIpIHtcbiAgICAgIGNvbnNvbGUubG9nKFwiLS1rZXkgYW5kIC0tY2VydCBhcmUgcmVxdWlyZWQgZm9yIFRMU1wiKTtcbiAgICAgIHByaW50VXNhZ2UoKTtcbiAgICAgIERlbm8uZXhpdCgxKTtcbiAgICB9XG4gIH1cblxuICBjb25zdCB3aWxkID0gc2VydmVyQXJncy5fIGFzIHN0cmluZ1tdO1xuICBjb25zdCB0YXJnZXQgPSByZXNvbHZlKHdpbGRbMF0gPz8gXCJcIik7XG5cbiAgY29uc3QgaGFuZGxlciA9IChyZXE6IFJlcXVlc3QpOiBQcm9taXNlPFJlc3BvbnNlPiA9PiB7XG4gICAgcmV0dXJuIHNlcnZlRGlyKHJlcSwge1xuICAgICAgZnNSb290OiB0YXJnZXQsXG4gICAgICBzaG93RGlyTGlzdGluZzogc2VydmVyQXJnc1tcImRpci1saXN0aW5nXCJdLFxuICAgICAgc2hvd0RvdGZpbGVzOiBzZXJ2ZXJBcmdzLmRvdGZpbGVzLFxuICAgICAgZW5hYmxlQ29yczogc2VydmVyQXJncy5jb3JzLFxuICAgICAgcXVpZXQ6ICFzZXJ2ZXJBcmdzLnZlcmJvc2UsXG4gICAgICBoZWFkZXJzLFxuICAgIH0pO1xuICB9O1xuXG4gIGNvbnN0IHVzZVRscyA9ICEhKGtleUZpbGUgJiYgY2VydEZpbGUpO1xuXG4gIGZ1bmN0aW9uIG9uTGlzdGVuKHsgcG9ydCwgaG9zdG5hbWUgfTogeyBwb3J0OiBudW1iZXI7IGhvc3RuYW1lOiBzdHJpbmcgfSkge1xuICAgIGNvbnN0IG5ldHdvcmtBZGRyZXNzID0gZ2V0TmV0d29ya0FkZHJlc3MoKTtcbiAgICBjb25zdCBwcm90b2NvbCA9IHVzZVRscyA/IFwiaHR0cHNcIiA6IFwiaHR0cFwiO1xuICAgIGxldCBtZXNzYWdlID0gYExpc3RlbmluZyBvbjpcXG4tIExvY2FsOiAke3Byb3RvY29sfTovLyR7aG9zdG5hbWV9OiR7cG9ydH1gO1xuICAgIGlmIChuZXR3b3JrQWRkcmVzcyAmJiAhREVOT19ERVBMT1lNRU5UX0lEKSB7XG4gICAgICBtZXNzYWdlICs9IGBcXG4tIE5ldHdvcms6ICR7cHJvdG9jb2x9Oi8vJHtuZXR3b3JrQWRkcmVzc306JHtwb3J0fWA7XG4gICAgfVxuICAgIGNvbnNvbGUubG9nKG1lc3NhZ2UpO1xuICB9XG5cbiAgaWYgKHVzZVRscykge1xuICAgIERlbm8uc2VydmUoe1xuICAgICAgcG9ydCxcbiAgICAgIGhvc3RuYW1lOiBob3N0LFxuICAgICAgb25MaXN0ZW4sXG4gICAgICBjZXJ0OiBEZW5vLnJlYWRUZXh0RmlsZVN5bmMoY2VydEZpbGUpLFxuICAgICAga2V5OiBEZW5vLnJlYWRUZXh0RmlsZVN5bmMoa2V5RmlsZSksXG4gICAgfSwgaGFuZGxlcik7XG4gIH0gZWxzZSB7XG4gICAgRGVuby5zZXJ2ZSh7XG4gICAgICBwb3J0LFxuICAgICAgaG9zdG5hbWU6IGhvc3QsXG4gICAgICBvbkxpc3RlbixcbiAgICB9LCBoYW5kbGVyKTtcbiAgfVxufVxuXG4vKipcbiAqIEdldHMgdGhlIG5ldHdvcmsgYWRkcmVzcyBvZiB0aGUgbWFjaGluZSxcbiAqIGluc3BpcmVkIGJ5IHRoZSB1dGlsIG9mIHRoZSBzYW1lIG5hbWUgaW4gYG5wbTpzZXJ2ZWBcbiAqIGh0dHBzOi8vZ2l0aHViLmNvbS92ZXJjZWwvc2VydmUvYmxvYi8xZWE1NWIxYjUwMDRmNDY4MTU5YjU0Nzc1ZTRmYjMwOTBmZWRiYjJiL3NvdXJjZS91dGlsaXRpZXMvaHR0cC50cyNMMzNcbiAqL1xuZnVuY3Rpb24gZ2V0TmV0d29ya0FkZHJlc3MoKSB7XG4gIGZvciAoY29uc3QgeyBmYW1pbHksIGFkZHJlc3MgfSBvZiBEZW5vLm5ldHdvcmtJbnRlcmZhY2VzKCkpIHtcbiAgICBpZiAoZmFtaWx5ID09PSBcIklQdjRcIiAmJiAhYWRkcmVzcy5zdGFydHNXaXRoKFwiMTI3LlwiKSkge1xuICAgICAgcmV0dXJuIGFkZHJlc3M7XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIHByaW50VXNhZ2UoKSB7XG4gIGNvbnNvbGUubG9nKGBEZW5vIEZpbGUgU2VydmVyICR7ZGVub0NvbmZpZy52ZXJzaW9ufVxuICBTZXJ2ZXMgYSBsb2NhbCBkaXJlY3RvcnkgaW4gSFRUUC5cblxuSU5TVEFMTDpcbiAgZGVubyBpbnN0YWxsIC0tYWxsb3ctbmV0IC0tYWxsb3ctcmVhZCBqc3I6QHN0ZC9odHRwQCR7ZGVub0NvbmZpZy52ZXJzaW9ufS9maWxlX3NlcnZlclxuXG5VU0FHRTpcbiAgZmlsZV9zZXJ2ZXIgW3BhdGhdIFtvcHRpb25zXVxuXG5PUFRJT05TOlxuICAtaCwgLS1oZWxwICAgICAgICAgICAgUHJpbnRzIGhlbHAgaW5mb3JtYXRpb25cbiAgLXAsIC0tcG9ydCA8UE9SVD4gICAgIFNldCBwb3J0XG4gIC0tY29ycyAgICAgICAgICAgICAgICBFbmFibGUgQ09SUyB2aWEgdGhlIFwiQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luXCIgaGVhZGVyXG4gIC0taG9zdCAgICAgPEhPU1Q+ICAgICBIb3N0bmFtZSAoZGVmYXVsdCBpcyAwLjAuMC4wKVxuICAtYywgLS1jZXJ0IDxGSUxFPiAgICAgVExTIGNlcnRpZmljYXRlIGZpbGUgKGVuYWJsZXMgVExTKVxuICAtaywgLS1rZXkgIDxGSUxFPiAgICAgVExTIGtleSBmaWxlIChlbmFibGVzIFRMUylcbiAgLUgsIC0taGVhZGVyIDxIRUFERVI+IFNldHMgYSBoZWFkZXIgb24gZXZlcnkgcmVxdWVzdC5cbiAgICAgICAgICAgICAgICAgICAgICAgIChlLmcuIC0taGVhZGVyIFwiQ2FjaGUtQ29udHJvbDogbm8tY2FjaGVcIilcbiAgICAgICAgICAgICAgICAgICAgICAgIFRoaXMgb3B0aW9uIGNhbiBiZSBzcGVjaWZpZWQgbXVsdGlwbGUgdGltZXMuXG4gIC0tbm8tZGlyLWxpc3RpbmcgICAgICBEaXNhYmxlIGRpcmVjdG9yeSBsaXN0aW5nXG4gIC0tbm8tZG90ZmlsZXMgICAgICAgICBEbyBub3Qgc2hvdyBkb3RmaWxlc1xuICAtLW5vLWNvcnMgICAgICAgICAgICAgRGlzYWJsZSBjcm9zcy1vcmlnaW4gcmVzb3VyY2Ugc2hhcmluZ1xuICAtdiwgLS12ZXJib3NlICAgICAgICAgUHJpbnQgcmVxdWVzdCBsZXZlbCBsb2dzXG4gIC1WLCAtLXZlcnNpb24gICAgICAgICBQcmludCB2ZXJzaW9uIGluZm9ybWF0aW9uXG5cbiAgQWxsIFRMUyBvcHRpb25zIGFyZSByZXF1aXJlZCB3aGVuIG9uZSBpcyBwcm92aWRlZC5gKTtcbn1cblxuaWYgKGltcG9ydC5tZXRhLm1haW4pIHtcbiAgbWFpbigpO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFDQSwwRUFBMEU7QUFFMUUsZ0VBQWdFO0FBQ2hFLDJDQUEyQztBQUMzQyxnRkFBZ0Y7QUFFaEY7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztDQXdCQyxHQUVELFNBQVMsUUFBUSxTQUFTLFFBQVEscUNBQXFDO0FBQ3ZFLFNBQVMsYUFBYSxjQUFjLFFBQVEsMENBQTBDO0FBQ3RGLFNBQVMsT0FBTyxRQUFRLGtDQUFrQztBQUMxRCxTQUFTLElBQUksUUFBUSwrQkFBK0I7QUFDcEQsU0FBUyxRQUFRLFFBQVEsbUNBQW1DO0FBQzVELFNBQVMsT0FBTyxRQUFRLGtDQUFrQztBQUMxRCxTQUFTLGlCQUFpQixRQUFRLG9DQUFvQztBQUN0RSxTQUFTLFdBQVcsUUFBUSw4Q0FBOEM7QUFDMUUsU0FBUyxTQUFTLEVBQUUsV0FBVyxRQUFRLFlBQVk7QUFDbkQsU0FDRSxnQkFBZ0IsRUFDaEIsV0FBVyxFQUNYLFdBQVcsUUFFTixjQUFjO0FBQ3JCLFNBQVMsZUFBZSxRQUFRLCtDQUErQztBQUMvRSxTQUFTLFNBQVMsUUFBUSxvQ0FBb0M7QUFD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