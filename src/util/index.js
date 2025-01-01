const { primary, success, error } = require("./chalk")
const prettySize = require("./pretty-size")
const prettyTime = require("./pretty-time")
const getDirSize = require("./get-dir-size")
const spawn = require("./spawn")
const Fs = require("./fs")

module.exports = {
  primary,
  success,
  error,
  prettySize,
  prettyTime,
  spawn,
  getDirSize,
  ...Fs,
}
