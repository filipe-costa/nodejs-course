const Sequelize = require("sequelize")

const sequelize = new Sequelize("node-complete", process.env.DB_USER, process.env.DB_PASSWORD, {
  dialect: "mysql",
  host: "localhost",
  logging: false
})

module.exports = sequelize
