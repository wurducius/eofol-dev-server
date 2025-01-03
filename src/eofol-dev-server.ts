// @ts-ignore
import { read, stat, primary, success } from "./util"
import connect from "connect"
import es from "event-stream"
import fs from "node:fs"
import http from "http"
import os from "node:os"
import path from "node:path"
import send from "send"
import serveIndex from "serve-index"
import url from "url"
import Watchpack from "watchpack"
import { readFileSync } from "fs"

const FILENAME_HOOKED_HTML = "hooked.html"

// @ts-ignore
// eslint-disable-next-line no-unused-vars
type Middleware = (req, res, next: () => void) => void

export interface EofolDevServerOptions {
  root?: string
  watch?: string[]
  serveUrl?: string | string[]
  entry?: string
  fallback?: string
  ignore?: string[]
  host?: string
  port?: number
  https?: boolean
  browser?: string
  open?: boolean
  wait?: number
  cors?: boolean
  proxy?: string[]
  noCSSInject?: boolean
  logLevel?: number
  mount?: string[]
  htpasswd?: string
  middleware?: Middleware[]
}

const OPTIONS_DEFAULT: EofolDevServerOptions = {
  root: "./build",
  watch: undefined,
  serveUrl: undefined,
  entry: "index.html",
  fallback: undefined,
  ignore: [],
  host: "localhost",
  port: 3000,
  https: true,
  browser: undefined,
  open: true,
  wait: 150,
  // cors: true,
  proxy: undefined,
  noCSSInject: false,
  logLevel: 3,
  mount: ["./node_modules"],
  htpasswd: undefined,
  middleware: [],
}

const start = (options: EofolDevServerOptions): void => {
  const optionsImpl = { ...OPTIONS_DEFAULT, ...options }

  const app = connect()

  // Log errors on logLevel <= 2
  // Log everything on logLevel === 3

  const HOOKED_HTML = read(path.join(__dirname, FILENAME_HOOKED_HTML))

  const escape = (html: string | null) => {
    return String(html ?? "")
      .replace(/&(?!\w+;)/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
  }

  const serve = (root: string) => {
    let isFile = false
    try {
      isFile = stat(root).isFile()
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
      const reqpath = url.parse(req.url).pathname
      const hasNoOrigin = !req.headers.origin
      const injectCandidates = [new RegExp("</body>", "i"), new RegExp("</svg>"), new RegExp("</head>", "i")]
      let injectTag: string | RegExp | null = null

      const directory = () => {
        const pathname = url.parse(req.originalUrl).pathname
        res.statusCode = 301
        // @TODO
        res.setHeader("Location", `${pathname}/`)
        res.end(`Redirecting to ${escape(pathname)}/`)
      }

      const file = (filepath: string) => {
        let match = undefined
        const x = path.extname(filepath).toLocaleLowerCase()
        match = x
        // @TODO: Extract
        const possibleExtensions = ["", ".html", ".htm", ".xhtml", ".php", ".svg"]
        if (hasNoOrigin && possibleExtensions.indexOf(x) > -1) {
          // @TODO
          // TODO: Sync file read here is not nice, but we need to determine if the html should be injected or not
          const contents = fs.readFileSync(filepath, "utf8")
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

      const error = (err: { status: number }) => {
        // @TODO: Extract
        if (err.status === 404) return next()
        next(err)
      }

      // @TODO
      // @ts-ignore
      const inject = (stream) => {
        if (injectTag) {
          // @TODO: Extract
          // res.setHeader("Content-Length", HOOKED_HTML.length + res.getHeader("Content-Length"))
          stream.pipe.pipe = (res: string) => {
            // @ts-ignore
            stream.pipe.call(stream, es.replace(new RegExp(injectTag, "i"), HOOKED_HTML + injectTag)).pipe(res)
          }
        }
      }

      // @TODO
      send(req, reqpath ?? "", { root: root })
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

  const serveHandler = serve(optionsImpl.root ?? ".")
  const wait = optionsImpl.wait ?? 100

  // Serve directory listing on empty root

  /*
  if (optionsImpl.cors) {
    // @TODO
    // @ts-ignore
    app.use(require("cors"))({
      origin: true,
      credentials: true,
      url: "/",
    })
  }
*/

  if (optionsImpl.htpasswd) {
    const auth = require("http-auth")
    const basic = auth.basic({
      realm: "Please authorize",
      file: optionsImpl.htpasswd,
    })
    //  app.use(auth.connect(basic))
  }

  // @TODO
  // MIDDLEWARE
  if (optionsImpl.middleware) {
    // eslint-disable-next-line no-unused-vars
    optionsImpl.middleware.forEach((mw) => {})
  }

  const watchPaths = optionsImpl.watch ?? [optionsImpl.root]

  if (optionsImpl.mount) {
    optionsImpl.mount.forEach((mountRule) => {
      // const mountPath = path.resolve(process.cwd(), mountRule[1])
      const mountPath = path.resolve(process.cwd(), mountRule)
      if (!options.watch) watchPaths.push(mountPath)
      // @TODO
      // app.use(mountRule[0], serve(mountPath))
      app.use(mountRule, serve(mountRule))
    })

    if (optionsImpl.proxy) {
      optionsImpl.proxy.forEach((proxyRule) => {
        // @TODO
        const proxyOpts = url.parse(proxyRule[1])
        // @ts-ignore
        proxyOpts.via = true
        // @ts-ignore
        proxyOpts.preserveHost = true
        // @TODO
        // app.use(proxyRule[0], require("proxy-middleware")(proxyOpts))
        if (typeof optionsImpl.logLevel === "number" && optionsImpl.logLevel >= 1)
          console.log('Mapping %s to "%s"', proxyRule[0], proxyRule[1])
      })
    }

    app.use(serveHandler)

    /*
    app.use("/hello", (req, res, next) => {
      console.log(`HELLO WORLD ${req}`)
      res.end("hello world")
    })
*/

    // .use(entryPoint(serveHandler, optionsImpl.fallback))
    // @TODO
    // @ts-ignore
    // .use(serveIndex(optionsImpl.root ?? ".", { icons: true }))

    let server
    let protocol

    // eslint-disable-next-line no-undef
    const dirname = __dirname

    const httpsConfig = {
      key: readFileSync(path.join(dirname, "..", "/" + "cert", "/" + "eofol-dev-server-key.pem")),
      cert: readFileSync(path.join(dirname, "..", "/" + "cert", "/" + "eofol-dev-server-server-cert.pem")),

      ca: [readFileSync(path.join(dirname, "..", "/" + "cert", "/" + "eofol-dev-server-client-cert.pem"))],

      passphrase: "EofolDevServerPasssword1122",
    }

    if (optionsImpl.https) {
      server = require("https").createServer(httpsConfig, app)
      protocol = "https"
    } else {
      server = http.createServer(app)
      protocol = "http"
    }

    const serverProps: { watcher?: any; server?: any } = {}

    const shutdown = () => {
      if (serverProps.watcher) {
        serverProps.watcher.close()
      }
      if (serverProps.server) serverProps.server.close()
    }

    server.addListener("error", (e: { code: string }) => {
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
      serverProps.server = server

      const address = server.address()
      // const serveHost = address.address === "0.0.0.0" ? "127.0.0.1" : address.address
      const openHost = optionsImpl.host === "0.0.0.0" ? "127.0.0.1" : optionsImpl.host

      // const serveURL = `${protocol}://${serveHost}:${address.port}`
      const openURL = `${protocol}://${openHost}:${address.port}`

      //  console.log("LISTENING", server, openURL)
      // let serveURLs = [optionsImpl.serveUrl]
      if (typeof optionsImpl.logLevel === "number" && optionsImpl.logLevel > 2 && address.address === "0.0.0.0") {
        const ifaces = os.networkInterfaces()
        Object.keys(ifaces)
          .map((iface) => ifaces[iface])
          .reduce((data, addresses) => {
            addresses
              ?.filter((addr) => addr.family === "IPv4")
              ?.forEach((addr) => {
                data?.push(addr)
              })
            return data
          }, [])
          ?.map((addr) => {
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
    })

    // Handle log init (add util/logger)

    server.listen(optionsImpl.port, optionsImpl.host)

    // @TODO
    let clients: any[] = []
    // @TODO
    server.addListener("upgrade", (request: string | URL, socket: string | string[] | undefined, head: any) => {
      // @ts-ignore
      const ws = new WebSocket(request, socket, head)
      ws.onopen = () => {
        ws.send("connected")
      }

      if (typeof optionsImpl.wait === "number" && optionsImpl.wait > 0) {
        // eslint-disable-next-line no-undef
        let waitTimeout: string | number | NodeJS.Timeout | undefined
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

    const updateChanges = (changePath: string) => {
      const cssChange = path.extname(changePath) === ".css" && !optionsImpl.noCSSInject
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

    const recompile = async (x: string) => {
      console.log(primary("Recompiling..."))
      // @TODO Do we need this?
      // cleanHot()
      // return await compile(true).then(() => {
      updateChanges(x)
      console.log(success(`Recompiled! Serving app now at ${SERVE_URL}.`))
      // })
    }

    // @TODO
    const handleChange = async (x: any) => {
      await recompile(x)
    }

    // @TODO
    const handleRemove = async (x: any) => {
      await recompile(x)
    }

    const listOfFiles: string[] = []
    const listOfNotExistingItems: string[] = []

    // @TODO Differentiate dev || serve
    console.log(primary("Starting the development server..."))

    const wp = new Watchpack(watchOptions)

    const handleClose = () => {
      // @TODO Differentiate dev || serve
      console.log(primary("\nShutting down development server..."))
      wp.close()
      // @TODO Differentiate dev || serve
      console.log(primary("Development server shut down."))
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

    console.log(success(`Serving app now at ${SERVE_URL}.`))
  }
}

// Handle exit (connect)

export default start
