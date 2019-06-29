const Sequelize = require("sequelize")

const sequelize = new Sequelize("node-complete", "root", "notasecret123", {
  dialect: "mysql",
  host: "localhost",
  logging: false
})

module.exports = sequelize
