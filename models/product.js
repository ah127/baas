const mongodb = require('mongodb');
const getDb = require('../util/database').getDb;

exports.save = (title, imageUrl, price, description, userId) => {
  const db = getDb();
  return db.collection('products').insertOne({
    title: title,
    imageUrl: imageUrl,
    price: price,
    description: description,
    userId: userId
  });
}

exports.findById = (prodId) => {
  const db = getDb();
  return db
    .collection('products')
    .find({ _id: new mongodb.ObjectId(prodId) })
    .next()
}

exports.editProduct = (prodId, updatedTitle, updatedPrice, updatedImage, updatedDesc) => {
  const db = getDb();
  let updatedProduct;
  if (updatedImage) {
    updatedProduct = {
      title: updatedTitle,
      price: updatedPrice,
      imageUrl: updatedImage,
      description: updatedDesc
    }
  } else {
    updatedProduct = {
      title: updatedTitle,
      price: updatedPrice,
      description: updatedDesc
    }
  }
  return db.collection('products')
    .updateOne(
      { _id: new mongodb.ObjectId(prodId) },
      { $set: updatedProduct }
    )
}

exports.fetchAll = (page, ITEMS_PER_PAGE) => {
  const db = getDb();
  return db
    .collection('products')
    .find()
    .skip((page - 1) * ITEMS_PER_PAGE)
    .limit(ITEMS_PER_PAGE)
    .toArray();
}

exports.fetchAllAdminProducts = (userId) => {
  const db = getDb();
  return db
    .collection('products')
    .find({ userId: userId })
    .toArray()
}

exports.deleteById = (prodId) => {
  const db = getDb();
  return db
    .collection('products')
    .deleteOne({ _id: new mongodb.ObjectId(prodId) })
}

exports.countTotalProducts = () => {
  const db = getDb();
  return db.collection('products')
    .find()
    .count();
}