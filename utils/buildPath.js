const path = require("path")

const buildPath = (folder, file) => path.join(__dirname, "..", folder, file || "")


module.exports = buildPath
