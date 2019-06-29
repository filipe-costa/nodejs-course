const withAuth = (req, res, next) => {
  if (!req.session.isLoggedIn) {
    return res.redirect("/login")
  }
  return next()
}

module.exports = withAuth
