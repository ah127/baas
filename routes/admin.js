const path = require('path');
const { body } = require('express-validator');
const express = require('express');

const adminController = require('../controllers/admin');
const isAuth = require('../middleware/is-auth');

const router = express.Router();

// /admin/add-product => GET
router.get('/add-product', isAuth.isLoggedIn, isAuth.canAccessHotelAdmin, adminController.getAddProduct);

// /admin/products => GET
router.get('/products', isAuth.isLoggedIn, isAuth.canAccessHotelAdmin, adminController.getProducts);

// /admin/add-product => POST
router.post('/add-product',
    [
        body('title')
            .isString()
            .isLength({ min: 3 })
            .trim(),
        body('price').isFloat(),
        body('description')
            .isLength({ min: 5, max: 400 })
            .trim()
    ],
    isAuth.isLoggedIn,
    adminController.postAddProduct);

router.get('/edit-product/:productId', isAuth.isLoggedIn, isAuth.canAccessHotelAdmin, adminController.getEditProduct);

router.post('/edit-product', [
    body('title')
        .isString()
        .isLength({ min: 3 })
        .trim(),
    body('price').isFloat(),
    body('description')
        .isLength({ min: 5, max: 400 })
        .trim()
], isAuth.isLoggedIn, isAuth.canAccessHotelAdmin, adminController.postEditProduct);

router.delete('/product/:productId', isAuth.isLoggedIn, isAuth.canAccessHotelAdmin, adminController.deleteProduct);

module.exports = router;
