exports.get404 = (req, res, next) => {
  let b;
  if (req.session.user == undefined) {
    b = "";
  } else {
    b = req.session.user.baascoin;
  }
  res.status(404).render('404', {
    pageTitle: 'Page Not Found',
    path: '/404',
    baascoin: b,
    isAuthenticated: req.session.isLoggedIn
  });
};

exports.get500 = (req, res, next) => {
  let b;
  if (req.session.user == undefined) {
    b = "";
  } else {
    b = req.session.user.baascoin;
  }
  res.status(500).render('500', {
    pageTitle: 'Error!',
    path: '/500',
    baascoin: b,
    isAuthenticated: req.session.isLoggedIn
  });
};
