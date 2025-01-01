const fs = require("fs")
const path = require("path")
const { rimrafSync } = require("rimraf")

const checkExistsCreate = (pathToCheck) => {
  if (!exists(pathToCheck)) {
    fs.mkdirSync(pathToCheck, { recursive: true })
  }
}

const removeFilePart = (dirname) => path.parse(dirname).dir

const isDirectory = (path) => fs.lstatSync(path).isDirectory()

const rm = (path) => rimrafSync(path)

const exists = (path) => fs.existsSync(path)

const read = (path) => fs.readFileSync(path)

const write = (path, content) => fs.writeFileSync(path, content)

const readDir = (path, options) => fs.readdirSync(path, options)

const stat = (path) => fs.statSync(path)

module.exports = { checkExistsCreate, removeFilePart, isDirectory, rm, exists, read, write, readDir, stat }
