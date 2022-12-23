const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);
let likeSaved;

suite('Functional Tests', function() {

    test('Viewing one stock.',  function(done){
        chai.request(server).get('/api/stock-prices/?stock=GOOG')
        .end(function (err, res) {
          assert.equal(res.status, 200);
          assert.property(res.body, 'stockData');
          assert.typeOf(res.body.stockData.stock, 'string');
          assert.typeOf(res.body.stockData.price, 'number');
          assert.typeOf(res.body.stockData.likes, 'number');
          done();
        });
      });

    test('Viewing one stock and liking it.',  function(done){
        chai.request(server).get('/api/stock-prices/?stock=GOOG&like=true')
        .end(function (err, res) {
          likeSaved = res.body.stockData.likes;
          assert.equal(res.status, 200);
          assert.property(res.body, 'stockData');
          assert.typeOf(res.body.stockData.stock, 'string');
          assert.typeOf(res.body.stockData.price, 'number');
          assert.typeOf(res.body.stockData.likes, 'number');
          assert.isTrue(res.body.stockData.likes >= 0);
          done();
        });
      });
    
    test('Viewing the same stock and liking it again.',  function(done){
        chai.request(server).get('/api/stock-prices/?stock=GOOG&like=true')
        .end(function (err, res) {           
          assert.equal(res.status, 200);
          assert.property(res.body, 'stockData');
          assert.typeOf(res.body.stockData.stock, 'string');
          assert.typeOf(res.body.stockData.price, 'number');
          assert.typeOf(res.body.stockData.likes, 'number');
          assert.isTrue(res.body.stockData.likes >= 0);
          done();
        });
      });

    test('Viewing two stocks.',  function(done){
        chai.request(server).get('/api/stock-prices/?stock=GOOG&stock=MSFT')
        .end(function (err, res) {
          assert.equal(res.status, 200);
          assert.property(res.body, 'stockData');
          assert.property(res.body.stockData[0], 'price');
          assert.property(res.body.stockData[1], 'price');
          done();
        });
      });

      test('Viewing two stocks and liking them.',  function(done){
        chai.request(server).get('/api/stock-prices/?stock=GOOG&stock=MSFT&like=true')
        .end(function (err, res) {
          assert.equal(res.status, 200);
          assert.property(res.body, 'stockData');
          assert.property(res.body.stockData[0], 'rel_likes');
          assert.property(res.body.stockData[1], 'rel_likes');
          done();
        });
      });

});
