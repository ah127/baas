const expect = require('chai').expect;
const sinon = require('sinon');

const product = require('../../models/product');
const adminController = require('../../controllers/admin');

describe('Shop Controller - Add product', () => {
    it('should throw an error if image is not provided', function (done) {
        sinon.stub(product, 'save');
        product.save.throws();

        const req = {
            body: {
                title: 'title',
                price: 100,
                description: 'dummy description',
                latitude: '87.55',
                longitude: '-27.88'
            },
            session: { user: { _id: '5' } }
        };
        adminController.postAddProduct(req, {}, () => { }).then(result => {
            expect(result).to.be.an('error');
            expect(result).to.have.property('httpStatusCode', 500);
            done();
        })
        product.save.restore();
    })
});