import connect from "connect"
import cors from "cors"
import httpAuth from "http-auth"

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
  // eslint-disable-next-line no-unused-vars
  middleware?: ((file: string, next: (nextFile: string) => void) => void)[]
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
      // @TODO CHANGEIT
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

  // Watch

  // Handle exit
}

export default start
