const express = require("express")

const shopController = require("../controllers/shop")

const withAuth = require("../middleware/withAuth")

const routes = express.Router()

routes.get("/", shopController.getIndex)

routes.get("/products", shopController.getProducts)

routes.get("/products/:productId", shopController.getProduct)

routes.get("/cart", withAuth, shopController.getCart)

routes.post("/cart", withAuth, shopController.postCart)

routes.post("/cart-delete-item", withAuth, shopController.postCartDeleteProduct)

routes.get("/orders", withAuth, shopController.getOrders)

routes.get("/checkout", withAuth, shopController.getCheckout)

routes.post("/create-order", withAuth, shopController.postOrder)

routes.get("/orders/:orderId", withAuth, shopController.getInvoice)

module.exports = routes
