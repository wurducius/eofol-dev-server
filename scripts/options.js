const fs = require("fs")
const PATH_CWD = fs.realpathSync(process.cwd())

const spawnOptions = {
  encoding: "utf8",
  cwd: PATH_CWD,
  env: process.env,
  shell: process.platform === "win32",
  stdio: "inherit",
}

module.exports = { spawnOptions }
