const fs = require("fs")
const path = require("path")
const { exists, rm } = require("../src/util")

const PATH_CWD = fs.realpathSync(process.cwd())

const DIRNAME_DIST = "dist"
const PATH_DIST = path.resolve(PATH_CWD, DIRNAME_DIST)

const cleanDir = (target) => {
  if (exists(target)) {
    rm(target)
  }
}

const pathsToClean = [PATH_DIST]

const clean = () => {
  pathsToClean.forEach((pathToClean) => {
    cleanDir(pathToClean)
  })
}

module.exports = clean

clean()
