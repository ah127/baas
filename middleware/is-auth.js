exports.isLoggedIn = (req, res, next) => {
    if (!req.session.isLoggedIn) {
        return res.redirect('/login');
    }
    next();
}

exports.canAccessHotelAdmin = (req, res, next) => {
    if (!req.session.isHotelOwner) {
        return res.send('Unathuorised page');
    }
    next();
}

exports.canAccessCustomerPage = (req, res, next) => {

    if (req.session.isHotelOwner) {
        return res.send('Hotel owner cannot access this page');
    }
    next();
}