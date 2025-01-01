import { primary, success } from "./util/chalk"
import connect from "connect"
import cors from "cors"
import httpAuth from "http-auth"
import Watchpack from "watchpack"

// @ts-ignore
// eslint-disable-next-line no-unused-vars
type Middleware = (req, res, next: () => void) => void

interface EofolDevServerOptions {
  root?: string
  serveUrl?: string
  entry?: string
  fallback?: string
  ignore?: string[]
  ignorePattern?: string[]
  host?: string
  port?: number
  https?: boolean
  browser?: string
  open?: boolean
  wait?: number
  cors?: boolean
  proxy?: string
  noCSSInject?: boolean
  logLevel?: number
  mount?: string
  htpasswd?: string
  httpsModule?: string
  middleware?: Middleware[]
}

const OPTIONS_DEFAULT: EofolDevServerOptions = {
  root: "./build",
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
  mount: "./node_modules/",
  htpasswd: undefined,
  httpsModule: undefined,
  middleware: [],
}

const start = (options: EofolDevServerOptions): void => {
  const optionsImpl = { ...OPTIONS_DEFAULT, ...options }

  const app = connect()

  // Log errors on logLevel <= 2
  // Log everything on logLevel === 3

  // Injected code index.html update, refreshCSS

  // Escape func

  // Serve statically files

  // Serve directory listing on empty root

  if (optionsImpl.cors) {
    app.use(cors)({
      origin: true,
      credentials: true,
    })
  }

  if (optionsImpl.httpsModule) {
    try {
      require.resolve(optionsImpl.httpsModule)
    } catch (e) {
      console.error(`The specified https module: "${optionsImpl.httpsModule}" was not found.`)
      console.error("Did you forget to run " + `"npm install ${optionsImpl.httpsModule}"?`)
      return
    }
  } else {
    optionsImpl.httpsModule = "https"
  }

  if (optionsImpl.htpasswd) {
    app.use(
      httpAuth.connect(
        httpAuth.basic({
          realm: "Please authorize",
          file: optionsImpl.htpasswd,
        }),
      ),
    )
  }

  if (optionsImpl.middleware) {
    //middleware
  }

  // mount

  // proxy

  // serve

  // Handle log init (add util/logger)

  // Handle server startup errors EADDRINUSE

  // Handle successful server listening

  // Listen

  // Websockets

  // Handle upgrade

  const watchOptions = {
    aggregateTimeout: 250,
    poll: true,
    followSymlinks: true,
    ignored: "**/.git",
  }

  const DIRNAME_SRC = "src"

  const listOfDirectories = [DIRNAME_SRC]

  const SERVE_URL = `${optionsImpl.https ? "https" : "http"}://${optionsImpl.host}:${optionsImpl.port}`

  const recompile = async () => {
    console.log(primary("Recompiling..."))
    // @TODO Do we need this?
    // cleanHot()
    // return await compile(true).then(() => {
    console.log(success(`Recompiled! Servin app now at ${SERVE_URL}.`))
    // })
  }

  const handleChange = async () => {
    await recompile()
  }

  const handleRemove = async () => {
    await recompile()
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

// Handle exit (connect)

export default start
