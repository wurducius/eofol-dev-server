"use strict"
var __awaiter =
  (this && this.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value)
          })
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value))
        } catch (e) {
          reject(e)
        }
      }
      function rejected(value) {
        try {
          step(generator["throw"](value))
        } catch (e) {
          reject(e)
        }
      }
      function step(result) {
        result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected)
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next())
    })
  }
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod }
  }
Object.defineProperty(exports, "__esModule", { value: true })
// @ts-ignore
const util_1 = require("./util")
const connect_1 = __importDefault(require("connect"))
const cors_1 = __importDefault(require("cors"))
const event_stream_1 = __importDefault(require("event-stream"))
const node_fs_1 = __importDefault(require("node:fs"))
const http_1 = __importDefault(require("http"))
const node_os_1 = __importDefault(require("node:os"))
const node_path_1 = __importDefault(require("node:path"))
const send_1 = __importDefault(require("send"))
const serve_index_1 = __importDefault(require("serve-index"))
const url_1 = __importDefault(require("url"))
const watchpack_1 = __importDefault(require("watchpack"))
const FILENAME_HOOKED_HTML = "hooked.html"
const OPTIONS_DEFAULT = {
  root: "./build",
  watch: undefined,
  serveUrl: undefined,
  entry: "index.html",
  fallback: undefined,
  ignore: [],
  ignorePattern: [],
  host: "0.0.0.0",
  port: 3000,
  https: false,
  browser: undefined,
  open: true,
  wait: 150,
  cors: true,
  proxy: undefined,
  noCSSInject: false,
  logLevel: 3,
  mount: ["./node_modules/"],
  htpasswd: undefined,
  httpsModule: undefined,
  middleware: [],
}
const start = (options) => {
  var _a, _b, _c, _d
  const optionsImpl = Object.assign(Object.assign({}, OPTIONS_DEFAULT), options)
  const app = (0, connect_1.default)()
  // Log errors on logLevel <= 2
  // Log everything on logLevel === 3
  const HOOKED_HTML = (0, util_1.read)(node_path_1.default.join(__dirname, FILENAME_HOOKED_HTML))
  const escape = (html) => {
    return String(html !== null && html !== void 0 ? html : "")
      .replace(/&(?!\w+;)/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
  }
  // Serve statically files
  const serve = (root) => {
    let isFile = false
    try {
      isFile = (0, util_1.stat)(root).isFile()
    } catch (e) {
      // @TODO
      // @ts-ignore
      if (e.code !== "ENOENT") throw e
    }
    // @TODO
    // @ts-ignore
    return (req, res, next) => {
      if (req.method !== "GET" && req.method !== "HEAD") return next()
      // @TODO
      const reqpath = isFile ? "" : url_1.default.parse(req.url).pathname
      const hasNoOrigin = !req.headers.origin
      const injectCandidates = [new RegExp("</body>", "i"), new RegExp("</svg>"), new RegExp("</head>", "i")]
      let injectTag = null
      const directory = () => {
        const pathname = url_1.default.parse(req.originalUrl).pathname
        res.statusCode = 301
        // @TODO
        res.setHeader("Location", `${pathname}/`)
        res.end(`Redirecting to ${escape(pathname)}/`)
      }
      const file = (filepath) => {
        let match = undefined
        const x = node_path_1.default.extname(filepath).toLocaleLowerCase()
        match = x
        // @TODO: Extract
        const possibleExtensions = ["", ".html", ".htm", ".xhtml", ".php", ".svg"]
        if (hasNoOrigin && possibleExtensions.indexOf(x) > -1) {
          // @TODO
          // TODO: Sync file read here is not nice, but we need to determine if the html should be injected or not
          const contents = node_fs_1.default.readFileSync(filepath, "utf8")
          for (let i = 0; i < injectCandidates.length; ++i) {
            match = injectCandidates[i].exec(contents)
            if (match) {
              injectTag = match[0]
              break
            }
          }
          if (!injectTag && typeof optionsImpl.logLevel === "number" && optionsImpl.logLevel >= 3) {
            console.warn(
              `Failed to inject refresh script because none of the expected tags ${injectCandidates} was found in "${filepath}".`,
            )
          }
        }
      }
      const error = (err) => {
        // @TODO: Extract
        if (err.status === 404) return next()
        next(err)
      }
      // @TODO
      // @ts-ignore
      const inject = (stream) => {
        if (injectTag) {
          // @TODO: Extract
          res.setHeader("Content-Length", HOOKED_HTML.length + res.getHeader("Content-Length"))
          stream.pipe.pipe = (res) => {
            // @ts-ignore
            stream.pipe
              .call(stream, event_stream_1.default.replace(new RegExp(injectTag, "i"), HOOKED_HTML + injectTag))
              .pipe(res)
          }
        }
      }
      // @TODO
      ;(0, send_1.default)(req, reqpath !== null && reqpath !== void 0 ? reqpath : "", { root: root })
        .on("error", error)
        .on("directory", directory)
        .on("file", file)
        .on("stream", inject)
        .pipe(res)
    }
  }
  // @TODO
  // @ts-ignore
  const entryPoint = (staticHandler, file) => {
    if (!file)
      // @TODO
      // @ts-ignore
      return (req, res, next) => {
        next()
      }
    // @TODO
    // @ts-ignore
    return (req, res, next) => {
      req.url = `/${file}`
      staticHandler(req, res, next)
    }
  }
  const serveHandler = serve((_a = optionsImpl.root) !== null && _a !== void 0 ? _a : "./")
  const wait = (_b = optionsImpl.wait) !== null && _b !== void 0 ? _b : 100
  // Serve directory listing on empty root
  if (optionsImpl.cors) {
    // @TODO
    // @ts-ignore
    app.use(cors_1.default)({
      origin: true,
      credentials: true,
    })
  }
  if (optionsImpl.httpsModule) {
    try {
      require.resolve(optionsImpl.httpsModule)
    } catch (e) {
      console.error(`The specified https module: "${optionsImpl.httpsModule}" was not found.`)
      console.error("Did you by chance forget to run " + `"npm install ${optionsImpl.httpsModule}"?`)
      return
    }
  } else {
    optionsImpl.httpsModule = "https"
  }
  if (optionsImpl.htpasswd) {
    const auth = require("http-auth")
    const basic = auth.basic({
      realm: "Please authorize",
      file: optionsImpl.htpasswd,
    })
    app.use(auth.connect(basic))
  }
  // @TODO
  // MIDDLEWARE
  if (optionsImpl.middleware) {
    // eslint-disable-next-line no-unused-vars
    optionsImpl.middleware.forEach((mw) => {})
  }
  const watchPaths = (_c = optionsImpl.watch) !== null && _c !== void 0 ? _c : [optionsImpl.root]
  if (optionsImpl.mount) {
    optionsImpl.mount.forEach((mountRule) => {
      const mountPath = node_path_1.default.resolve(process.cwd(), mountRule[1])
      if (!options.watch) watchPaths.push(mountPath)
      app.use(mountRule[0], serve(mountPath))
      if (typeof optionsImpl.logLevel === "number" && optionsImpl.logLevel >= 1)
        console.log('Mapping %s to "%s"', mountRule[0], mountPath)
    })
  }
  if (optionsImpl.proxy) {
    optionsImpl.proxy.forEach((proxyRule) => {
      // @TODO
      const proxyOpts = url_1.default.parse(proxyRule[1])
      // @ts-ignore
      proxyOpts.via = true
      // @ts-ignore
      proxyOpts.preserveHost = true
      app.use(proxyRule[0], require("proxy-middleware")(proxyOpts))
      if (typeof optionsImpl.logLevel === "number" && optionsImpl.logLevel >= 1)
        console.log('Mapping %s to "%s"', proxyRule[0], proxyRule[1])
    })
  }
  app
    .use(serveHandler)
    .use(entryPoint(serveHandler, optionsImpl.fallback))
    // @TODO
    // @ts-ignore
    .use((0, serve_index_1.default)((_d = optionsImpl.root) !== null && _d !== void 0 ? _d : "./", { icons: true }))
  let server
  let protocol
  if (optionsImpl.https !== null) {
    let httpsConfig = optionsImpl.https
    if (typeof optionsImpl.https === "string") {
      httpsConfig = require(node_path_1.default.resolve(process.cwd(), optionsImpl.https))
    }
    server = require(optionsImpl.httpsModule).createServer(httpsConfig, app)
    protocol = "https"
  } else {
    server = http_1.default.createServer(app)
    protocol = "http"
  }
  const serverProps = {}
  const shutdown = () => {
    if (serverProps.watcher) {
      serverProps.watcher.close()
    }
    if (serverProps.server) serverProps.server.close()
  }
  server.addListener("error", (e) => {
    if (e.code === "EADDRINUSE") {
      const serveURL = `${protocol}://${optionsImpl.host}:${optionsImpl.port}`
      console.log("%s is already in use. Trying another port. ", serveURL)
      setTimeout(() => {
        server.listen(0, optionsImpl.host)
        // @TODO Extract
      }, 1000)
    } else {
      console.error(e.toString())
      shutdown()
    }
  })
  // Handle successful server
  server.addListener("listening", () => {
    var _a
    serverProps.server = server
    const address = server.address()
    // const serveHost = address.address === "0.0.0.0" ? "127.0.0.1" : address.address
    const openHost = optionsImpl.host === "0.0.0.0" ? "127.0.0.1" : optionsImpl.host
    // const serveURL = `${protocol}://${serveHost}:${address.port}`
    const openURL = `${protocol}://${openHost}:${address.port}`
    // let serveURLs = [optionsImpl.serveUrl]
    if (typeof optionsImpl.logLevel === "number" && optionsImpl.logLevel > 2 && address.address === "0.0.0.0") {
      const ifaces = node_os_1.default.networkInterfaces()
      ;(_a = Object.keys(ifaces)
        .map((iface) => ifaces[iface])
        .reduce((data, addresses) => {
          var _a
          ;(_a =
            addresses === null || addresses === void 0
              ? void 0
              : addresses.filter((addr) => addr.family === "IPv4")) === null || _a === void 0
            ? void 0
            : _a.forEach((addr) => {
                data === null || data === void 0 ? void 0 : data.push(addr)
              })
          return data
        }, [])) === null || _a === void 0
        ? void 0
        : _a.map((addr) => {
            return `${protocol}://${addr.address}:${address.port}`
          })
    }
    // @TODO
    const openPath =
      options.open === undefined || options.open === true
        ? ""
        : options.open === null || options.open === false
          ? null
          : options.open
    if (openPath !== null && optionsImpl.browser) {
      // @ts-ignore
      open(openURL + openPath, { app: optionsImpl.browser })
    }
    // Handle log init (add util/logger)
    server.listen(optionsImpl.port, optionsImpl.host)
    // @TODO
    let clients = []
    // @TODO
    server.addListener("upgrade", (request, socket, head) => {
      // @ts-ignore
      const ws = new WebSocket(request, socket, head)
      ws.onopen = () => {
        ws.send("connected")
      }
      if (typeof optionsImpl.wait === "number" && optionsImpl.wait > 0) {
        // eslint-disable-next-line no-undef
        let waitTimeout
        ws.send = () => {
          if (waitTimeout) {
            clearTimeout(waitTimeout)
          }
          waitTimeout = setTimeout(() => {
            // @TODO
            // @ts-ignore
            // eslint-disable-next-line no-undef
            ws.send.apply(ws, arguments)
          }, wait)
        }
      }
      ws.onclose = () => {
        clients = clients.filter((x) => {
          return x !== ws
        })
      }
      clients.push(ws)
    })
    // Handle ignore and ignorePattern
    const updateChanges = (changePath) => {
      const cssChange = node_path_1.default.extname(changePath) === ".css" && !optionsImpl.noCSSInject
      if (typeof optionsImpl.logLevel === "number" && optionsImpl.logLevel >= 1) {
        if (cssChange) {
          console.log("CSS change detected", changePath)
        } else {
          console.log("Change detected, changePath")
        }
        clients.forEach((ws) => {
          if (ws) ws.send(cssChange ? "refreshcss" : "reload")
        })
      }
    }
    const watchOptions = {
      aggregateTimeout: 100,
      poll: true,
      followSymlinks: true,
      ignored: "**/.git",
    }
    const DIRNAME_SRC = "src"
    const listOfDirectories = [DIRNAME_SRC]
    const SERVE_URL = `${optionsImpl.https ? "https" : "http"}://${optionsImpl.host}:${optionsImpl.port}`
    // Bluebird, checksum & hot-reload
    const recompile = (x) =>
      __awaiter(void 0, void 0, void 0, function* () {
        console.log((0, util_1.primary)("Recompiling..."))
        // @TODO Do we need this?
        // cleanHot()
        // return await compile(true).then(() => {
        updateChanges(x)
        console.log((0, util_1.success)(`Recompiled! Servin app now at ${SERVE_URL}.`))
        // })
      })
    // @TODO
    const handleChange = (x) =>
      __awaiter(void 0, void 0, void 0, function* () {
        yield recompile(x)
      })
    // @TODO
    const handleRemove = (x) =>
      __awaiter(void 0, void 0, void 0, function* () {
        yield recompile(x)
      })
    const listOfFiles = []
    const listOfNotExistingItems = []
    // @TODO Differentiate dev || serve
    console.log((0, util_1.primary)("Starting the development server..."))
    const wp = new watchpack_1.default(watchOptions)
    const handleClose = () => {
      // @TODO Differentiate dev || serve
      console.log((0, util_1.primary)("\nShutting down development server..."))
      wp.close()
      // @TODO Differentiate dev || serve
      console.log((0, util_1.primary)("Development server shut down."))
      process.exit(0)
    }
    process.on("SIGINT", handleClose)
    process.on("SIGTERM", handleClose)
    process.on("SIGQUIT", handleClose)
    wp.watch({
      files: listOfFiles,
      directories: listOfDirectories,
      missing: listOfNotExistingItems,
      startTime: Date.now() - 10000,
    })
    wp.on("change", handleChange)
    wp.on("remove", handleRemove)
    console.log((0, util_1.success)(`Serving app now at ${SERVE_URL}.`))
  })
}
// Handle exit (connect)
exports.default = start
