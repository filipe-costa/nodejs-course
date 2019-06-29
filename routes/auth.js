const express = require("express")
const authController = require("../controllers/auth")
const validation = require("../validation/validation")

const routes = express.Router()

routes.get("/login", authController.getLogin)

routes.post("/login", validation.isValidLogin(), authController.postLogin)

routes.post("/logout", authController.postLogout)

routes.get("/signup", authController.getSignUp)

routes.post("/signup", validation.isValidSignUp(), authController.postSignUp)

routes.get("/reset", authController.getReset)

routes.post("/reset", authController.postReset)

routes.get("/new-password/:tokenId", authController.getNewPassword)

routes.post("/new-password", authController.postNewPassword)

module.exports = routes
