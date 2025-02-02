const { exists, rm, PATH_DIST } = require("../src/util")

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
