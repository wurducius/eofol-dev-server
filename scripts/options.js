const { PATH_CWD } = require("../src/util")

const spawnOptions = {
  encoding: "utf8",
  cwd: PATH_CWD,
  env: process.env,
  shell: process.platform === "win32",
  stdio: "inherit",
}

module.exports = { spawnOptions }
