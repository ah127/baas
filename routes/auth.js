const express = require('express');
const { check, body } = require('express-validator');

const authController = require('../controllers/auth');

const router = express.Router();

router.get('/signup', authController.getSignup);

router.post('/signup',
    [
        check('email').
            isEmail()
            .withMessage('Invalid Email Address Provided'),
        body('password', 'Please enter passwords at least of 5 characters')
            .isLength({ min: 5 })
            .trim(),
        body('confirmPassword')
            .trim()
            .custom((value, { req }) => {
                if (value !== req.body.password) {
                    throw new Error('Passwords has to match');
                }
                return true;
            })
    ]
    , authController.postSignup);

router.get('/login', authController.getLogin);

router.post('/login',
    [
        check('email').isEmail(),
        body('password', 'Please enter passwords with numbers & text at least of 5 characters')
            .isLength({ min: 5 })
            .trim()
    ],
    authController.postLogin);

router.post('/logout', authController.postLogout);

router.get('/reset', authController.getReset);

router.post('/reset', authController.postReset);

router.get('/reset/:token', authController.getNewPassword);

router.post('/new-password', authController.postNewPassword);

module.exports = router;