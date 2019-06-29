const fs = require("fs")
const path = require("path")
const PDFDoc = require("pdfkit")
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY)

const Product = require("../models/product")
const Order = require("../models/order")

const getProducts = (req, res, next) => {
  const pageNumber = parseInt(req.query.page, 10) || 1

  const ITEMS_PER_PAGE = 2
  let totalProducts = 0
  Product.count()
    .then((count) => {
      totalProducts = count
      return Product.findAll({
        offset: (pageNumber - 1) * ITEMS_PER_PAGE,
        limit: ITEMS_PER_PAGE
      })
    })
    .then((products) => {
      res.render("shop/product-list", {
        prods: products,
        pageTitle: "All Products",
        path: "/products",
        totalProducts,
        currentPage: pageNumber,
        hasNextPage: ITEMS_PER_PAGE * pageNumber < totalProducts,
        hasPreviousPage: pageNumber > 1,
        nextPage: pageNumber + 1,
        previousPage: pageNumber - 1,
        lastPage: Math.ceil(totalProducts / ITEMS_PER_PAGE)
      })
    }).catch((err) => {
      const error = new Error(err)
      error.httpStatusCode = 500
      return next(error)
    })
}

const getProduct = (req, res, next) => {
  const {productId: id} = req.params
  Product.findAll({
    where: {
      id
    }
  })
    .then((product) => {
      res.render("shop/product-detail", {
        path: "/products",
        pageTitle: product[0].title,
        product: product[0]
      })
    }).catch((err) => {
      const error = new Error(err)
      error.httpStatusCode = 500
      return next(error)
    })
}

const getIndex = (req, res, next) => {
  const pageNumber = parseInt(req.query.page, 10) || 1

  const ITEMS_PER_PAGE = 2
  let totalProducts = 0
  Product.findAndCountAll()
    .then((products) => {
      totalProducts = products.count
      return Product.findAll({
        offset: (pageNumber - 1) * ITEMS_PER_PAGE,
        limit: ITEMS_PER_PAGE
      })
    })
    .then((products) => {
      res.render("shop/index", {
        prods: products,
        pageTitle: "Shop",
        path: "/",
        totalProducts,
        currentPage: pageNumber,
        hasNextPage: ITEMS_PER_PAGE * pageNumber < totalProducts,
        hasPreviousPage: pageNumber > 1,
        nextPage: pageNumber + 1,
        previousPage: pageNumber - 1,
        lastPage: Math.ceil(totalProducts / ITEMS_PER_PAGE)
      })
    }).catch((err) => {
      next(err)
    })
}

const getCart = (req, res, next) => {
  if (req.user && req.user.getCart()) {
    req.user
      .getCart()
      .then((cart) => {
        if (cart && cart.getProducts()) {
          cart.getProducts()
            .then((products) => {
              res.render("shop/cart", {
                path: "/cart",
                pageTitle: "Your Cart",
                products
              })
            }).catch((err) => {
              const error = new Error(err)
              error.httpStatusCode = 500
              return next(error)
            })
        } else {
          res.render("shop/cart", {
            path: "/cart",
            pageTitle: "Your Cart",
            products: []
          })
        }
      })
      .catch((err) => {
        const error = new Error(err)
        error.httpStatusCode = 500
        return next(error)
      })
  } else {
    res.render("shop/cart", {
      path: "/cart",
      pageTitle: "Your Cart",
      products: []
    })
  }
}

const postCart = (req, res, next) => {
  const {productId: id} = req.body
  let fetchedCart
  let newQuantity = 1
  if (req.user && req.user.getCart()) {
    req.user.getCart()
      .then((cart) => {
        fetchedCart = cart
        if (cart) {
          return cart.getProducts({
            where: {
              id
            }
          })
        }
        return []
      })
      .then((products) => {
        let product
        if (products.length > 0) {
          [product] = products
        }
        if (product) {
          const oldQuantity = product.cartItem.quantity
          newQuantity = oldQuantity + 1
          return product
        }
        return Product.findByPk(id)
      })
      .then((product) => {
        if (!fetchedCart) {
          return req.user.createCart()
            .then((cart) => {
              cart.addProduct(product, {
                through: {
                  quantity: newQuantity
                }
              }).catch((err) => {
                const error = new Error(err)
                error.httpStatusCode = 500
                return next(error)
              })
            })
        }
        return fetchedCart.addProduct(product, {
          through: {
            quantity: newQuantity
          }
        })
      })
      .then(() => {
        res.redirect("/cart")
      })
      .catch((err) => {
        const error = new Error(err)
        error.httpStatusCode = 500
        return next(error)
      })
  } else {
    res.redirect("/cart")
  }
}

const postCartDeleteProduct = (req, res, next) => {
  const {productId: id} = req.body
  req.user.getCart()
    .then((cart) => cart.getProducts({
      where: {
        id
      }
    }))
    .then(([product]) => product.cartItem.destroy())
    .then(() => {
      res.redirect("/cart")
    })
    .catch((err) => {
      const error = new Error(err)
      error.httpStatusCode = 500
      return next(error)
    })
}

const getOrders = (req, res, next) => {
  req.user
    .getOrders({include: ["products"]})
    .then((orders) => {
      if (orders) {
        res.render("shop/orders", {
          path: "/orders",
          pageTitle: "Your Orders",
          orders
        })
      } else {
        res.render("shop/orders", {
          path: "/orders",
          pageTitle: "Your Orders",
          orders: []
        })
      }
    }).catch((err) => {
      const error = new Error(err)
      error.httpStatusCode = 500
      return next(error)
    })
}

const postOrder = (req, res, next) => {
  const token = req.body.stripeToken
  let totalSum = 0
  let orderId = null
  req.user
    .getCart({
      include: ["products"]
    })
    .then((cart) => {
      const {products} = cart
      products.forEach((prod) => {
        totalSum += prod.price * prod.cartItem.quantity
      })
      return req.user
        .createOrder()
        .then((order) => {
          orderId = order.id
          return order.addProducts((products.map((product) => {
            product.orderItem = {quantity: product.cartItem.quantity}
            return product
          })))
        }).catch((err) => {
          const error = new Error(err)
          error.httpStatusCode = 500
          return next(error)
        })
    })
    .then(() => {
      stripe.charges.create({
        amount: Math.round(totalSum * 100),
        currency: "usd",
        description: "Example Charge",
        source: token,
        metadata: {
          orderId
        }
      })
      return req.user.getCart()
        .then((cart) => cart.destroy())
        .catch((err) => {
          const error = new Error(err)
          error.httpStatusCode = 500
          return next(error)
        })
    })
    .then(() => {
      res.redirect("/orders")
    })
    .catch((err) => {
      const error = new Error(err)
      error.httpStatusCode = 500
      return next(error)
    })
}

const getCheckout = (req, res, next) => {
  req.user.getCart({
    include: ["products"]
  })
    .then((cart) => {
      const {products} = cart
      let totalSum = 0
      products.forEach((prod) => {
        totalSum += prod.price * prod.cartItem.quantity
      })

      const newProducts = products.map((prod) => {
        return {
          id: prod.id,
          title: prod.title,
          quantity: prod.cartItem.quantity
        }
      })
      res.render("shop/checkout", {
        path: "/checkout",
        pageTitle: "Checkout",
        products: newProducts,
        totalSum
      })
    })
    .catch((err) => {
      const error = new Error(err)
      error.httpStatusCode = 500
      return next(error)
    })
}


const getInvoice = (req, res, next) => {
  const {orderId} = req.params

  Order.findByPk(orderId, {
    include: ["products"]
  })
    .then((order) => {
      if (!order) {
        return next(new Error("No order found"))
      }

      if (order.userId !== req.user.id) {
        return next(new Error("Unauthorized"))
      }

      const invoiceName = `invoice-${orderId}.pdf`
      const invoicePath = path.join("data", "invoices", invoiceName)

      const {products} = order

      let totalPrice = 0

      res.set({
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=${invoiceName}`
      })

      const doc = new PDFDoc()

      doc.pipe(fs.createWriteStream(invoicePath))
      doc.pipe(res)

      doc
        .fontSize(26)
        .text("Invoice", {
          underline: true
        })

      doc.text("------------------------------------------")
      products.forEach((prod) => {
        totalPrice += prod.orderItem.quantity * prod.price
        doc
          .fontSize(14)
          .text(`${prod.title}-${prod.orderItem.quantity}x $${prod.price}`)
      })
      doc.text("------------------------------------------")
      doc.text(`Total Price: $${totalPrice}`)

      doc.end()
    })
}


module.exports = {
  getCart,
  postCart,
  postCartDeleteProduct,
  getCheckout,
  getIndex,
  getOrders,
  postOrder,
  getProducts,
  getProduct,
  getInvoice
}
