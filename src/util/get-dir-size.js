const path = require("path")
const { readDir, stat } = require("./fs")

const getDirSize = (dirPath) => {
  let size = 0
  const files = readDir(dirPath)

  for (let i = 0; i < files.length; i++) {
    const filePath = path.join(dirPath, files[i])
    const stats = stat(filePath)

    if (stats.isFile()) {
      size += stats.size
    } else if (stats.isDirectory()) {
      size += getDirSize(filePath)
    }
  }

  return size
}

module.exports = getDirSize
