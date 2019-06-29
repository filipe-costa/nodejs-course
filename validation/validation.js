const {body} = require("express-validator")

const User = require("../models/user")

const isValidLogin = () => [
  body("email", "Please enter a valid email address")
    .isEmail()
    .normalizeEmail()
    .withMessage(),
  body("password", "Please enter a password with only numbers and text and at least 2 characters long")
    .isLength({min: 2})
    .isAlphanumeric()
    .trim()
]

const isValidSignUp = () => [
  body("email", "Please enter a valid email address")
    .custom((value) => {
      return User.findOne({
        where: {
          email: value
        }
      }).then((user) => {
        if (user) {
          return Promise.reject(new Error("E-mail already exists, please use a different one"))
        }
      })
    })
    .isEmail()
    .normalizeEmail(),
  body("password", "Please enter a password with only numbers and text and at least 2 characters long")
    .isLength({min: 2})
    .isAlphanumeric()
    .trim(),
  body("confirmPassword")
    .custom((value, {req}) => {
      if (value !== req.body.password) {
        throw new Error("Passwords have to match!")
      }
      return true
    })
    .isLength({min: 2})
    .isAlphanumeric()
    .trim()
]

const isValidProduct = () => [
  body("title")
    .trim()
    .isLength({min: 3}),
  body("price")
    .isFloat(),
  body("description")
    .isLength({min: 5, max: 400})
    .trim()
]

module.exports = {
  isValidLogin,
  isValidSignUp,
  isValidProduct
}
