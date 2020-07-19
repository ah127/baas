const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const stripe = require('stripe')('sk_test_51H2XT0EKb6anIrL5a5vjdvBv6uZl0ouESJ9i5lto0zKtUeA14IhwqJoX4bi6iljb8Y7IfCHsfiFpoeh0Z11H7lAk00tNVElQ1W');

const productModel = require('../models/product');
const userModel = require('../models/user');

exports.getProducts = (req, res, next) => {
  const page = +req.query.page || 1;
  const ITEMS_PER_PAGE = 2;
  let totalItems;
  productModel.countTotalProducts()
    .then(numProducts => {
      totalItems = numProducts;
      return productModel.fetchAll(page, ITEMS_PER_PAGE);
    })
    .then(products => {
      res.render('shop/product-list', {
        prods: products,
        pageTitle: 'All Products',
        path: '/products',
        currentPage: page,
        hasNextPage: ITEMS_PER_PAGE * page < totalItems,
        hasPreviousPage: page > 1,
        nextPage: page + 1,
        previousPage: page - 1,
        lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE)
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getProduct = (req, res, next) => {
  const prodId = req.params.productId;
  productModel.findById(prodId)
    .then(product => {
      res.render('shop/product-detail', {
        product: product,
        pageTitle: product.title,
        path: '/products'
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getIndex = (req, res, next) => {
  const page = +req.query.page || 1;
  const ITEMS_PER_PAGE = 2;
  let totalItems;
  productModel.countTotalProducts()
    .then(numProducts => {
      totalItems = numProducts;
      return productModel.fetchAll(page, ITEMS_PER_PAGE);
    })
    .then(products => {
      res.render('shop/index', {
        prods: products,
        pageTitle: 'Shop',
        path: '/',
        currentPage: page,
        hasNextPage: ITEMS_PER_PAGE * page < totalItems,
        hasPreviousPage: page > 1,
        nextPage: page + 1,
        previousPage: page - 1,
        lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE)
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getCart = (req, res, next) => {
  const userId = req.session.user._id;
  userModel.getCart(userId, req.session.user.name)
    .then(products => {
      res.render('shop/cart', {
        path: '/cart',
        pageTitle: 'Your Cart',
        products: products
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postCart = (req, res, next) => {
  const prodId = req.body.productId;
  const numberOfNights = req.body.nights;
  userModel.addToCart(req.session.user._id, prodId, numberOfNights)
    .then(result => {
      res.redirect('/cart');
    })
    .catch(err => {
      console.log(err)
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postCartDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;
  userModel.deleteItemFromCart(req.session.user._id, prodId)
    .then(result => {
      res.redirect('/cart');
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getCheckout = (req, res, next) => {
  let cartProducts;
  let total = 0;
  const userId = req.session.user._id;
  userModel.getCart(userId, req.session.user.name)
    .then(products => {
      cartProducts = products;
      total = 0;
      cartProducts.forEach(p => {
        total += p.quantity * p.price
      });
      return stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: cartProducts.map(p => {
          return {
            name: p.title,
            description: p.description,
            amount: p.price * 100,
            currency: 'usd',
            quantity: p.quantity
          };
        }),
        success_url: req.protocol + '://' + req.get('host') + '/checkout/success',
        cancel_url: req.protocol + '://' + req.get('host') + '/checkout/cancel'
      });
    })
    .then(session => {
      res.render('shop/checkout', {
        path: '/checkout',
        pageTitle: 'Your Cart',
        products: cartProducts,
        totalSum: total,
        sessionId: session.id
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
}

exports.getCheckoutSuccess = (req, res, next) => {
  userModel.addOrder(req.session.user._id, req.session.user.email)
    .then(result => {
      res.redirect('/orders');
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

// exports.postOrder = (req, res, next) => {
//   userModel.addOrder(req.session.user._id, req.session.user.email)
//     .then(result => {
//       res.redirect('/orders');
//     })
//     .catch(err => {
//       const error = new Error(err);
//       error.httpStatusCode = 500;
//       return next(error);
//     });
// };

exports.getOrders = (req, res, next) => {
  userModel.getOrders(req.session.user._id)
    .then(orders => {
      res.render('shop/orders', {
        path: '/orders',
        pageTitle: 'Your Orders',
        orders: orders
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getInvoice = (req, res, next) => {
  const orderId = req.params.orderId;
  userModel.findOrderById(orderId)
    .then(order => {
      if (!order) {
        return next(new Error('No orders found'))
      }

      if (order.user._id.toString() !== req.session.user._id.toString()) {
        return next(new Error('Unautorized'));
      }

      const invoiceName = 'invoice-' + orderId + '.pdf';
      const invoicePath = path.join('datas', 'invoices', invoiceName);
      const doc = new PDFDocument();
      res.setHeader('Content-Type', 'application/pdf');
      doc.pipe(fs.createWriteStream(invoicePath));
      doc.pipe(res);
      doc
        .fontSize(26)
        .text('Invoice', {
          underline: true
        });
      doc.text('-------------------------------');
      let totalPrice = 0;
      order.items.forEach(prod => {
        totalPrice += prod.quantity * prod.price;
        doc
          .fontSize(14)
          .text(
            prod.title +
            ' - ' +
            prod.quantity +
            ' x ' +
            ' $ ' +
            prod.price
          );
      });
      doc.text('-------------------------------');
      doc
        .fontSize(20)
        .text('Total Price: $' + totalPrice);

      doc.end();
      // fs.readFile(invoicePath, (err, data) => {
      //   if (err) {
      //     return next(err);
      //   }
      //   res.setHeader('Content-Type', 'application/pdf');
      //   res.send(data);
      // });
      // const file = fs.createReadStream(invoicePath);
      // res.setHeader('Content-Type', 'application/pdf');
      // file.pipe(res);
    })
    .catch(err => {
      return next(err);
    });
}
