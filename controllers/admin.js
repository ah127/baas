const productModel = require('../models/product');
const fileHepler = require('../util/file');
const { validationResult } = require('express-validator');

exports.getAddProduct = (req, res, next) => {
  res.render('admin/edit-product', {
    pageTitle: 'Add Product',
    path: '/admin/add-product',
    editing: false,
    hasError: false,
    errorMessage: null,
    validationErrors: []
  });
};

exports.postAddProduct = async (req, res, next) => {
  const title = req.body.title;
  const image = req.file;
  const price = req.body.price;
  const description = req.body.description;
  const userId = req.session.user._id;
  const latitude = parseFloat(req.body.latitu);
  const longitude = parseFloat(req.body.longitu);

  const errors = validationResult(req);

  if (!image) {
    return res.status(422).render('admin/edit-product', {
      pageTitle: 'Add Product',
      path: '/admin/add-product',
      editing: false,
      hasError: true,
      product: {
        title: title,
        price: price,
        description: description,
        latitude: latitude,
        longitude: longitude
      },
      errorMessage: 'Attached file is not an image',
      validationErrors: []
    });
  }

  if (!errors.isEmpty()) {
    return res.status(422).render('admin/edit-product', {
      pageTitle: 'Add Product',
      path: '/admin/add-product',
      editing: false,
      hasError: true,
      product: {
        title: title,
        image: image,
        price: price,
        description: description,
        latitude: latitude,
        longitude: longitude
      },
      errorMessage: errors.array()[0].msg,
      validationErrors: errors.array()
    });
  }

  const imageUrl = image.path;
  try {
    await productModel.save(title, imageUrl, price, description, userId, latitude, longitude);
    res.redirect('/admin/products');
  }
  catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    next(error);
    return error;
  }

};

exports.getEditProduct = (req, res, next) => {
  const editMode = req.query.edit;
  if (!editMode) {
    return res.redirect('/');
  }
  const prodId = req.params.productId;
  productModel.findById(prodId)
    .then(product => {
      if (!product) {
        return res.redirect('/');
      }
      res.render('admin/edit-product', {
        pageTitle: 'Edit Product',
        path: '/admin/edit-product',
        editing: editMode,
        product: product,
        hasError: false,
        errorMessage: null,
        validationErrors: []
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postEditProduct = (req, res, next) => {
  const prodId = req.body.productId;
  const updatedTitle = req.body.title;
  const updatedPrice = req.body.price;
  const image = req.file;
  let updatedImage;
  const updatedDesc = req.body.description;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render('admin/edit-product', {
      pageTitle: 'Edit Product',
      path: '/admin/edit-product',
      editing: true,
      hasError: true,
      product: {
        title: updatedTitle,
        price: updatedPrice,
        description: updatedDesc,
        _id: prodId
      },
      errorMessage: errors.array()[0].msg,
      validationErrors: errors.array()
    });
  }
  productModel.findById(prodId)
    .then(product => {
      if (product.userId.toString() !== req.session.user._id.toString()) {
        return res.redirect('/');
      }

      if (image) {
        fileHepler.deleteFile(product.imageUrl);
        updatedImage = image.path;
      }

      return productModel.editProduct(prodId, updatedTitle, updatedPrice, updatedImage, updatedDesc);
    })
    .then(result => {
      res.redirect('/admin/products')
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    })

};

exports.getProducts = (req, res, next) => {
  productModel.fetchAllAdminProducts(req.session.user._id)
    .then(products => {
      res.render('admin/products', {
        prods: products,
        pageTitle: 'Admin Products',
        path: '/admin/products'
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.deleteProduct = (req, res, next) => {
  const prodId = req.params.productId;
  productModel.findById(prodId)
    .then(product => {
      if (product.userId.toString() !== req.session.user._id.toString()) {
        return res.redirect('/');
      }
      fileHepler.deleteFile(product.imageUrl);
      return productModel.deleteById(prodId);
    })
    .then(result => {
      // res.redirect('/admin/products');
      res.status(200).json({
        message: 'Success!'
      });
    })
    .catch(err => {
      res.status(500).json({ message: 'Deleting Product Failed.' });
    });
};
