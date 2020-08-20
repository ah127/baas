const expect = require('chai').expect;
const sinon = require('sinon');

const user = require('../../models/user');
const authController = require('../../controllers/auth');

describe('Auth Controller - login', () => {
    it('should throw an error if accessing the database fails', function (done) {
        sinon.stub(user, 'findByEmail');
        user.findByEmail.throws();

        const req = {
            body: {
                email: 'test@test.com',
                password: 'tester'
            }
        };
        authController.postLogin(req, {}, () => { }).then(result => {
            expect(result).to.be.an('error');
            expect(result).to.have.property('httpStatusCode', 500);
            done();
        })

        user.findByEmail.restore();
    })
});