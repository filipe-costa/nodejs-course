const Sequelize = require("sequelize")

const sequelize = require("../utils/database")

const User = sequelize.define("user", {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true
  },
  password: {
    type: Sequelize.STRING,
    allowNull: false
  },
  email: Sequelize.STRING,
  resetToken: Sequelize.STRING,
  resetTokenExpiration: Sequelize.DATE
})


module.exports = User
