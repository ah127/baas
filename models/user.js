const bcrypt = require('bcrypt');
const mongodb = require('mongodb');
const getDb = require('../util/database').getDb;

exports.signup = (email, hashedPassword, isHotelOwner, intialCart) => {
  const db = getDb();
  return db.collection('users')
    .insertOne({ email: email, password: hashedPassword, isHotelOwner: isHotelOwner, baascoin: 1000, cart: intialCart });
}

exports.findById = (userId) => {
  const db = getDb();
  return db.collection('users')
    .find({ _id: mongodb.ObjectId(userId) })
    .next()
}

exports.findByEmail = (useremail) => {
  const db = getDb();
  return db.collection('users')
    .find({ email: useremail })
    .next();
}

exports.getCart = (userId) => {
  const db = getDb();
  return this.findById(userId)
    .then(userData => {
      const productIds = userData.cart.items.map(i => {
        return i.productId;
      });

      return db.collection('products')
        .find({ _id: { $in: productIds } })
        .toArray()
        .then(products => {
          return products.map(p => {
            return {
              ...p,
              quantity: userData.cart.items.find(i => {
                return i.productId.toString() === p._id.toString()
              }).quantity
            };
          });
        })
    })
    .catch(err => console.log(err));
}

exports.addToCart = (userId, prodId, numberOfNights) => {
  const db = getDb();
  return this.findById(userId)
    .then(userData => {
      let newQuantity = numberOfNights;
      let updatedCartItems = userData.cart.items;
      const cartProductIndex = updatedCartItems.findIndex(cp => {
        return cp.productId.toString() === prodId.toString();
      });

      if (cartProductIndex >= 0) {
        updatedCartItems[cartProductIndex].quantity = newQuantity;
      } else {
        updatedCartItems.push({
          productId: new mongodb.ObjectId(prodId),
          quantity: newQuantity
        })
      }
      const updatedCart = {
        items: updatedCartItems
      };

      return db.collection('users')
        .updateOne(
          { _id: userId },
          { $set: { cart: updatedCart } }
        );
    })
    .catch(err => console.log(err))
}

exports.deleteItemFromCart = (userId, prodId) => {
  const db = getDb();
  return this.findById(userId)
    .then(userData => {
      const updatedCartItems = userData.cart.items.filter(item => {
        return item.productId.toString() !== prodId.toString();
      });
      return db.collection('users')
        .updateOne(
          { _id: userId },
          { $set: { cart: { items: updatedCartItems } } }
        )
    })
    .catch(err => console.log(err));
}

exports.addOrder = (userId, userEmail) => {
  const db = getDb();
  return this.getCart(userId)
    .then(products => {
      const order = {
        items: products,
        user: {
          _id: new mongodb.ObjectId(userId),
          email: userEmail
        }
      };
      return db.collection('orders').insertOne(order);
    })
    .then(result => {
      return db
        .collection('users')
        .updateOne(
          { _id: new mongodb.ObjectId(userId) },
          { $set: { cart: { items: [] } } }
        );
    })
    .catch(err => console.log(err));
}

exports.getOrders = (userId) => {
  const db = getDb();
  return db
    .collection('orders')
    .find({ 'user._id': new mongodb.ObjectId(userId) })
    .toArray();
}

exports.addForgetToken = (email, token) => {
  const db = getDb();
  return db.collection('users')
    .updateOne(
      { email: email },
      { $set: { resetToken: token, resetTokenExpiratin: Date.now() + 3600000 } },
    );
}

exports.findByToken = (token) => {
  const db = getDb();
  return db.collection('users')
    .find({ resetToken: token, resetTokenExpiratin: { $gt: Date.now() } })
    .next();
}

exports.updatePassword = (userId, newPassword) => {
  const db = getDb();
  return bcrypt.hash(newPassword, 12)
    .then(hashedPassword => {
      return db.collection('users')
        .updateOne(
          { _id: new mongodb.ObjectId(userId) },
          { $set: { password: hashedPassword, resetToken: null, resetTokenExpiratin: null } }
        );
    })
    .catch(err => console.log(err));
}

exports.findOrderById = (orderId) => {
  const db = getDb();
  return db.collection('orders')
    .find({ _id: new mongodb.ObjectId(orderId) })
    .next()
}

exports.updateBaasCoin = (userEmail, updatedBaascoin) => {
  const db = getDb();
  db.collection('users').updateOne(
    { email: userEmail },
    { $set: { baascoin: updatedBaascoin } }
  );
}