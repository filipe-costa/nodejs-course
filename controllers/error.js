const get404 = (req, res, next) => {
  res.status(404).render("404", {
    pageTitle: "Page Not Found",
    path: "/404",
    isAuthenticated: req.isLoggedIn
  })
}

const get500 = (req, res) => {
  res.status(500).render("500", {
    pageTitle: "Error!",
    path: "/500",
    isAuthenticated: req.isLoggedIn
  })
}

module.exports = {
  get404,
  get500
}
