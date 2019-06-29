const {validationResult} = require("express-validator")

const Product = require("../models/product")
const fileUtil = require("../utils/file")

const getAddProduct = (req, res) => {
  res.render("admin/edit-product", {
    pageTitle: "Add Product",
    hasError: false,
    path: "/admin/add-product",
    editing: false,
    errorMessage: null,
    validationErrors: []
  })
}

const postAddProduct = (req, res, next) => {
  const {
    title, price, description
  } = req.body

  const image = req.file

  if (!image) {
    return res.status(422).render("admin/edit-product", {
      path: "/admin/add-product",
      pageTitle: "Add Product",
      errorMessage: "Attached filed is not an image",
      hasError: true,
      editing: false,
      product: {
        title, price, description
      },
      validationErrors: []
    })
  }
  const imageUrl = `/${image.path}` // Minor fix till I figure out why multer doesn't add a slash to the path
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(422).render("admin/edit-product", {
      path: "/admin/add-product",
      pageTitle: "Add Product",
      errorMessage: errors.array()[0].msg,
      hasError: true,
      editing: false,
      product: {
        title, price, description
      },
      validationErrors: errors.array()
    })
  }

  req.user.createProduct({
    title,
    imageUrl,
    price,
    description
  })
    .then(() => res.redirect("/admin/products"))
    .catch((err) => {
      const error = new Error(err)
      error.httpStatusCode = 500
      return next(error)
    })
}

const postEditProduct = (req, res, next) => {
  const {
    title, price, description, productId: id
  } = req.body

  let currentUrl = ""
  const image = req.file
  if (image) {
    currentUrl = `/${image.path}`
  }

  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(422).render("admin/edit-product", {
      path: "/admin/edit-product",
      pageTitle: "Edit Product",
      editing: true,
      hasError: true,
      errorMessage: errors.array()[0].msg,
      product: {
        title, price, description, id
      },
      validationErrors: errors.array()
    })
  }


  const updateObject = currentUrl.length > 0 ? {
    title, price, imageUrl: currentUrl, description
  } : {
    title, price, description
  }

  Product.findByPk(id)
    .then((product) => {
      if (product.userId !== req.user.id) {
        return res.redirect("/")
      }
      if (currentUrl.length > 0) {
        fileUtil.deleteFile(product.imageUrl)
      }
      return product.update(updateObject).then(() => {
        res.redirect("/admin/products")
      }).catch((err) => {
        const error = new Error(err)
        error.httpStatusCode = 500
        return next(error)
      })
    })
}

const getEditProduct = (req, res, next) => {
  const editMode = req.query.edit
  if (!editMode) {
    return res.redirect("/")
  }
  const {productId: id} = req.params
  req.user.getProducts({
    where: {
      id
    }
  }).then((product) => {
    res.render("admin/edit-product", {
      pageTitle: "Edit Product",
      path: "/admin/edit-product",
      editing: editMode,
      product: product[0],
      errorMessage: null,
      validationErrors: []
    })
  }).catch((err) => {
    const error = new Error(err)
    error.httpStatusCode = 500
    return next(error)
  })
}

const getProducts = (req, res, next) => {
  if (req.user && req.user.getProducts()) {
    req.user.getProducts({
      where: {
        userId: req.user.id
      }
    })
      .then((products) => {
        res.render("admin/products", {
          prods: products,
          pageTitle: "Admin Products",
          path: "/admin/products"
        })
      }).catch((err) => {
        const error = new Error(err)
        error.httpStatusCode = 500
        return next(error)
      })
  } else {
    res.render("admin/products", {
      prods: [],
      pageTitle: "Admin Products",
      path: "/admin/products"
    })
  }
}

const deleteProduct = (req, res, next) => {
  const {productId: id} = req.params

  Product.findByPk(id)
    .then((product) => {
      if (!product) {
        return next(new Error("Product not found"))
      }

      fileUtil.deleteFile(product.imageUrl)
      return product.destroy({
        where: {
          id
        }
      })
    })
    .then(() => {
      res.status(200).json({
        message: "Success!"
      })
    })
    .catch(() => {
      res.status(500).json({
        message: "Deleting the product failed!"
      })
    })
}

module.exports = {
  getAddProduct,
  postAddProduct,
  getProducts,
  getEditProduct,
  postEditProduct,
  deleteProduct
}
