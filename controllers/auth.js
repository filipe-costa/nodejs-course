const crypto = require("crypto")
const bcrypt = require("bcrypt")
const {Op} = require("sequelize")
const {validationResult} = require("express-validator")
const nodemailer = require("nodemailer")
const sendGridTransport = require("nodemailer-sendgrid-transport")
const User = require("../models/user")

const key = process.env.SENDGRID_API_KEY
const options = {
  auth: {
    api_key: key
  }
}

const transporter = nodemailer.createTransport(sendGridTransport(options))

const getLogin = (req, res) => {
  let errorMessage = req.flash("error")
  if (!errorMessage.length > 0) {
    errorMessage = null
  }
  res.render("auth/login", {
    path: "/login",
    pageTitle: "Login",
    errorMessage,
    oldInput: {
      email: "",
      password: ""
    },
    validationErrors: []
  })
}


const postLogin = (req, res, next) => {
  const {email, password} = req.body
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(422).render("auth/login", {
      path: "/login",
      pageTitle: "Login",
      errorMessage: errors.array()[0].msg,
      oldInput: {email, password},
      validationErrors: errors.array()
    })
  }

  User.findOne({
    where: {
      email
    }
  })
    .then((user) => {
      if (!user) {
        req.flash("error", "Invalid email or password")
        return res.redirect("/login")
      }
      return bcrypt.compare(password, user.password.toString())
        .then((doMatch) => {
          if (doMatch) {
            req.session.isLoggedIn = true
            req.session.user = user
            return req.session.save(() => {
              return res.redirect("/")
            })
          }
          req.flash("error", "Invalid email or password")
          res.redirect("/login")
        })
        .catch((err) => {
          const error = new Error(err)
          error.httpStatusCode = 500
          return next(error)
        })
    })
    .catch((err) => {
      const error = new Error(err)
      error.httpStatusCode = 500
      return next(error)
    })
}

const postLogout = (req, res) => {
  req.session.destroy(() => {
    res.redirect("/")
  })
}

const getSignUp = (req, res) => {
  let errorMessage = req.flash("error")
  if (!errorMessage.length > 0) {
    errorMessage = null
  }
  res.render("auth/signup", {
    path: "/signup",
    pageTitle: "Signup",
    errorMessage,
    oldInput: {
      email: "",
      password: "",
      confirmPassword: ""
    },
    validationErrors: []
  })
}

const postSignUp = (req, res, next) => {
  const {email, password, confirmPassword} = req.body
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(422).render("auth/signup", {
      path: "/signup",
      pageTitle: "Signup",
      errorMessage: errors.array()[0].msg,
      oldInput: {
        email,
        password,
        confirmPassword
      },
      validationErrors: errors.array()
    })
  }

  User.findOne({
    where: {
      email
    }
  })
    .then(() => {
      return bcrypt.hash(password, 10)
        .then((hashedPassword) => {
          return User.create({email, password: hashedPassword})
        })
        .then(() => {
          res.redirect("/login")
          return transporter.sendMail({
            to: email,
            from: "",
            subject: "Signup Succeed",
            html: "<h1>Sending emails to a mailbox server and back to you!</h1>"
          })
        })
    })
    .catch((err) => {
      const error = new Error(err)
      error.httpStatusCode = 500
      return next(error)
    })
}

const getReset = (req, res) => {
  let errorMessage = req.flash("error")
  if (!errorMessage.length > 0) {
    errorMessage = null
  }
  res.render("auth/reset", {
    path: "/reset",
    pageTitle: "Reset Password",
    errorMessage
  })
}

const postReset = (req, res, next) => {
  const {email} = req.body
  crypto.randomBytes(32, (err, buffer) => {
    if (err) {
      return res.redirect("/redirect")
    }
    const token = buffer.toString("hex")
    User.findOne({
      where: {
        email
      }
    }).then((user) => {
      if (!user) {
        req.flash("Sorry, we couldn't find such account")
        return res.redirect("/reset")
      }

      return user.update({
        resetToken: token,
        resetTokenExpiration: new Date(Date.now() + 3600000)
      }, {
        where: {
          email
        }
      })
    }).then(() => {
      res.redirect("/login")
      return transporter.sendMail({
        to: email,
        from: "",
        subject: "Reset your password",
        html: `
          <p>You requested a password reset</p>
          <p>Click this <a href="http://localhost:3000/new-password/${token}">link</a> to set a new password.</p>
        `
      })
    })
      .catch((e) => {
        const error = new Error(e)
        error.httpStatusCode = 500
        return next(error)
      })
  })
}

const getNewPassword = (req, res) => {
  let errorMessage = req.flash("error")
  if (!errorMessage.length > 0) {
    errorMessage = null
  }
  const {tokenId} = req.params
  User.findOne({
    where: {
      resetToken: tokenId,
      resetTokenExpiration: {
        [Op.gt]: new Date(Date.now())
      }
    }
  })
    .then((user) => {
      if (!user) {
        req.flash("Sorry, we couldn't find such account")
        return res.redirect("/reset")
      }
      res.render("auth/new-password", {
        path: "/new-password",
        pageTitle: "New password",
        errorMessage,
        userId: user.id
      })
    })
}


const postNewPassword = (req, res, next) => {
  const {userId, password} = req.body
  let errorMessage = req.flash("error")
  if (!errorMessage.length > 0) {
    errorMessage = null
  }

  User.findOne({
    where: {
      id: userId
    }
  })
    .then((user) => {
      if (!user) {
        req.flash("Sorry, we couldn't find such account")
        return res.redirect("/new-password/")
      }

      return bcrypt.hash(password, 10)
        .then((hashedPassword) => {
          return user.update({
            password: hashedPassword,
            resetToken: null,
            resetTokenExpiration: null
          }, {
            where: {
              id: user.id
            }
          })
        })
    })
    .then(() => {
      res.render("auth/new-password", {
        path: "/new-password",
        pageTitle: "New password",
        errorMessage
      })
    })
    .catch((err) => {
      const error = new Error(err)
      error.httpStatusCode = 500
      return next(error)
    })
}

module.exports = {
  getLogin,
  postLogin,
  postLogout,
  getSignUp,
  postSignUp,
  getReset,
  postReset,
  getNewPassword,
  postNewPassword
}
