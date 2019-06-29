const fs = require("fs")

const buildPath = require("./buildPath")

const deleteFile = (filePath) => {
  fs.unlink(buildPath(filePath), (err) => {
    if (err) {
      throw (err)
    }
  })
}

module.exports = {
  deleteFile
}
