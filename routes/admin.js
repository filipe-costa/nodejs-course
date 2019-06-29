const express = require("express")

const adminController = require("../controllers/admin")
const validation = require("../validation/validation")

const withAuth = require("../middleware/withAuth")

const routes = express.Router()

// /admin/add-product => GET
routes.get("/add-product", withAuth, adminController.getAddProduct)

// /admin/products => GET
routes.get("/products", withAuth, adminController.getProducts)

// /admin/add-product => POST
routes.post("/add-product", validation.isValidProduct(), withAuth, adminController.postAddProduct)

routes.post("/edit-product", validation.isValidProduct(), withAuth, adminController.postEditProduct)

// routes.post("/delete-product", withAuth, adminController.postDeleteProduct)

routes.delete("/product/:productId", withAuth, adminController.deleteProduct)

routes.get("/edit-product/:productId", withAuth, adminController.getEditProduct)

module.exports = routes
