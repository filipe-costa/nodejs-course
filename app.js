
// Load .env variables
const dotenv = require("dotenv")

dotenv.config()

const express = require("express")

// Parsers
const multerParser = require("multer")
const bodyParser = require("body-parser")
const cookieParser = require("cookie-parser")

// Sessions and CSRF protection
const session = require("express-session")
const MySQLStore = require("express-mysql-session")(session)
const csrf = require("csurf")

// Flash message
const flash = require("connect-flash")

// Build path from string
const buildPath = require("./utils/buildPath")

// Database
const sequelize = require("./utils/database")

// Routes
const adminRoutes = require("./routes/admin")
const shopRoutes = require("./routes/shop")
const authRoutes = require("./routes/auth")

// Controllers / Middleware
const errorController = require("./controllers/error")

// Sequelize Models
const Product = require("./models/product")
const User = require("./models/user")
const Cart = require("./models/cart")
const CartItem = require("./models/cart-item")
const Order = require("./models/order")
const OrderItem = require("./models/order-item")

// Init server, some call it app
const server = express()

// Init session store
const sessionStore = new MySQLStore({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
})

// Handle file storage middleware
const fileStorage = multerParser.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images")
  },
  filename: (req, file, cb) => {
    cb(null, `${new Date().getTime()}-${file.originalname}`)
  }
})

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/png"
    || file.mimetype === "image/jpg"
    || file.mimetype === "image/jpeg"
  ) {
    cb(null, true)
  }
  cb(null, false)
}

// Middleware
server.use(bodyParser.urlencoded({extended: false}))
server.use(multerParser({storage: fileStorage, fileFilter}).single("image"))

server.use(cookieParser("null"))
server.use(session({
  secret: "null",
  resave: false,
  store: sessionStore,
  saveUninitialized: false
}))
server.use(flash())


// User middleware to authenticate requests
server.use((req, res, next) => {
  if (!req.session.user) {
    return next()
  }
  return User.findByPk(req.session.user.id)
    .then((user) => {
      if (!user) {
        return next()
      }
      req.user = user
      next()
    })
    .catch((error) => {
      next(new Error(error))
    })
})

// Specific route for stripe post requests where it is not needed csrf token

server.use((req, res, next) => {
  if (req.url === "/create-order") {
    next()
  } else {
    csrf({cookie: true})
    next()
  }
})

// Set path to static folder to send with each request
server.use(express.static(buildPath("public")))
server.use("/images", express.static(buildPath("images")))

// Template engine and views
server.set("view engine", "ejs")
server.set("views", "views")


// Use locals middleware to be served with every request
// No need to hardcode the same variables for each get/post requests
// When rendering the pages
server.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isLoggedIn
  res.locals.csrfToken = req.csrfToken ? req.csrfToken() : null
  next()
})

// Routes
server.use("/admin", adminRoutes)
server.use(shopRoutes)
server.use(authRoutes)

// Specific error view page
server.get("/500", errorController.get500)

// General error view page
server.use(errorController.get404)

// Middleware to handle other types of errors
server.use((error, req, res) => {
  res.redirect("/500")
})

// Sequelize associations
User.hasMany(Product)
Product.belongsTo(User, {
  constraints: true,
  onDelete: "CASCADE"
})

User.hasOne(Cart)
Cart.belongsTo(User)
Cart.belongsToMany(Product, {through: CartItem})
Product.belongsToMany(Cart, {through: CartItem})

Order.belongsTo(User)
User.hasMany(Order)

Order.belongsToMany(Product, {through: OrderItem})

const SERVER_PORT = 3000

// Let sequelize init the DB and sync models
// Before init the server
sequelize.sync()
  .then(() => {
    server.listen(3000, () => console.log(`Server listening on port: ${SERVER_PORT}`))
  })
  .catch((err) => console.log("Error sync sequelize ", err))
