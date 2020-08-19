const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { validationResult } = require('express-validator');
const nodemailer = require('nodemailer');
const userModel = require('../models/user');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'baas3211@gmail.com',
        pass: 'Baas12345'
    }
});

exports.getSignup = (req, res, next) => {
    let message = req.flash('error');
    if (message.length > 0) {
        message = message[0];
    } else {
        message = null;
    }

    res.render('auth/signup', {
        pageTitle: 'SignUp',
        path: '/signup',
        errorMessage: message,
        oldInput: {
            email: '',
            password: '',
            confirmPassword: ''
        },
        validationErrors: []
    });
}

exports.postSignup = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    const isHotelOwner = req.body.isHotelOwner ? true : false;
    const intialCart = { items: [] };
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(422).render('auth/signup', {
            pageTitle: 'SignUp',
            path: '/signup',
            errorMessage: errors.array()[0].msg,
            oldInput: {
                email: email,
                password: password,
                confirmPassword: req.body.confirmPassword
            },
            validationErrors: errors.array()
        });
    }
    //check if email is already existing or not
    userModel.findByEmail(email)
        .then(user => {
            if (user) {
                req.flash('error', 'Email already existed, Pick a different one');
                return res.redirect('/signup');
            }
            bcrypt.hash(password, 12)
                .then(hashedPassword => {
                    userModel.signup(email, hashedPassword, isHotelOwner, intialCart)
                        .then(result => {
                            res.redirect('/login');
                            const mailOptions = {
                                from: 'baas3211@gmail.com',
                                to: email,
                                subject: 'Signup Succeeded!',
                                html: '<h1>You succesfully signed up <a href="http://localhost:3000/">Bass.com</a></h1>'
                            };
                            return transporter.sendMail(mailOptions)
                        })
                        .catch(err => {
                            const error = new Error(err);
                            error.httpStatusCode = 500;
                            return next(error);
                        });
                })
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
}

exports.getLogin = (req, res, next) => {
    let message = req.flash('error');
    if (message.length > 0) {
        message = message[0];
    } else {
        message = null;
    }
    res.render('auth/login', {
        pageTitle: 'Login',
        path: '/login',
        errorMessage: message,
        oldInput: {
            email: '',
            password: ''
        },
        validationErrors: []
    });
}

exports.postLogin = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).render('auth/login', {
            pageTitle: 'Login',
            path: '/login',
            errorMessage: errors.array()[0].msg,
            oldInput: {
                email: email,
                password: password
            },
            validationErrors: errors.array()
        });
    }
    userModel.findByEmail(email)
        .then(user => {
            if (!user) {
                return res.status(422).render('auth/login', {
                    pageTitle: 'Login',
                    path: '/login',
                    errorMessage: 'Username or Password is incorrect',
                    oldInput: {
                        email: email,
                        password: password
                    },
                    validationErrors: []
                });
            }
            bcrypt.compare(password, user.password)
                .then(doMatch => {
                    if (doMatch) {
                        req.session.user = user;
                        req.session.isLoggedIn = true;
                        if (user.isHotelOwner) {
                            req.session.isHotelOwner = true;
                        }
                        return req.session.save(err => {
                            if (err) { console.log(err) };
                            res.redirect('/');
                        })
                    }
                    return res.status(422).render('auth/login', {
                        pageTitle: 'Login',
                        path: '/login',
                        errorMessage: 'Username or Password is incorrect',
                        oldInput: {
                            email: email,
                            password: password
                        },
                        validationErrors: []
                    });
                });
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
}

exports.postLogout = (req, res, next) => {
    req.session.destroy(err => {
        if (err) {
            console.log(err);
            return;
        }
        res.redirect('/');
    })
}

exports.getReset = (req, res, next) => {
    let message = req.flash('error');
    if (message.length > 0) {
        message = message[0];
    } else {
        message = null;
    }
    res.render('auth/reset', {
        pageTitle: 'Reset Password',
        path: '/reset',
        errorMessage: message
    });
}

exports.postReset = (req, res, next) => {
    crypto.randomBytes(32, (errorFromCrypto, buffer) => {
        if (errorFromCrypto) {
            return res.redirect('/reset');
        }
        const token = buffer.toString('hex');
        userModel.findByEmail(req.body.email)
            .then(user => {
                if (!user) {
                    req.flash('error', 'No account with that email found')
                    return res.redirect('/reset');
                }
                userModel.addForgetToken(user.email, token)
                    .then(result => {
                        res.redirect('/');
                        const mailOptions = {
                            from: 'baas3211@gmail.com',
                            to: user.email,
                            subject: 'Password Reset Baas',
                            html: `<p>Click this <a href="http://localhost:3000/reset/${token}">link</a> to set a new password</p>`
                        };
                        transporter.sendMail(mailOptions)
                    })
            })
            .catch(err => {
                const error = new Error(err);
                error.httpStatusCode = 500;
                return next(error);
            });
    })
}

exports.getNewPassword = (req, res, next) => {
    const token = req.params.token;
    userModel.findByToken(token)
        .then(user => {
            if (!user) {
                req.flash('error', 'Token expired or invalid');
                return res.redirect('/reset');
            }
            let message = req.flash('error');
            if (message.length > 0) {
                message = message[0];
            } else {
                message = null;
            }
            res.render('auth/new-password', {
                pageTitle: 'New Password',
                path: '/auth/new-password',
                errorMessage: message,
                userId: user._id.toString(),
                passwordToken: token
            });
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        })
}

exports.postNewPassword = (req, res, next) => {
    const newPassword = req.body.password;
    const passwordToken = req.body.passwordToken;
    const userId = req.body.userId;
    userModel.findByToken(passwordToken)
        .then(user => {
            if (!user) {
                req.flash('error', 'Token expired or Invalid');
                return res.redirect('/reset');
            }
            userModel.updatePassword(userId, newPassword)
                .then(result => {
                    res.redirect('/login');
                })
                .catch(err => {
                    const error = new Error(err);
                    error.httpStatusCode = 500;
                    return next(error);
                });
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
}