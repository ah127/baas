const path = require('path');

const express = require('express');

const shopController = require('../controllers/shop');
const isAuth = require('../middleware/is-auth');

const router = express.Router();

router.get('/', shopController.getIndex);

router.post('/products', shopController.getProductsNearLocation);

router.get('/products/:productId', shopController.getProduct);

router.get('/cart', isAuth.isLoggedIn, isAuth.canAccessCustomerPage, shopController.getCart);

router.post('/cart', isAuth.isLoggedIn, isAuth.canAccessCustomerPage, shopController.postCart);

router.post('/cart-delete-item', isAuth.isLoggedIn, isAuth.canAccessCustomerPage, shopController.postCartDeleteProduct);

router.get('/checkout', isAuth.isLoggedIn, isAuth.canAccessCustomerPage, shopController.getCheckout);

router.post('/checkout_wallet', isAuth.isLoggedIn, isAuth.canAccessCustomerPage, shopController.postCheckout);

router.get('/checkout/success', isAuth.isLoggedIn, isAuth.canAccessCustomerPage, shopController.getCheckoutSuccess);

router.get('/checkout/cancel', isAuth.isLoggedIn, isAuth.canAccessCustomerPage, shopController.getCheckout);

// router.post('/create-order', isAuth.isLoggedIn, isAuth.canAccessCustomerPage, shopController.postOrder);

router.get('/orders', isAuth.isLoggedIn, isAuth.canAccessCustomerPage, shopController.getOrders);

router.get('/orders/:orderId', isAuth.isLoggedIn, isAuth.canAccessCustomerPage, shopController.getInvoice);

module.exports = router;
