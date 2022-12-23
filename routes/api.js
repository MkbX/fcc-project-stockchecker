'use strict';

module.exports = function (app) {

  const axios = require("axios");
  const mongoose = require('mongoose');

  mongoose.connect(process.env.DB, { useNewUrlParser: true, useUnifiedTopology: true });
  const db = mongoose.connection;
  db.on("connected", ()=> console.log('Connected to database!'));
  db.on("error", (error)=> console.log('Error connecting to database: ', error));

  const ipHashSchema = new mongoose.Schema({
    ipHash: String,
    alreadyLiked: {type: Boolean, default: false}
  });
  const ipHashCollection = new mongoose.model('IpHash', ipHashSchema);

  const stockSchema = new mongoose.Schema({
    stock: String,
    likes: {type: Number, default: 0}
  });
  const stockCollection = new mongoose.model('Stock', stockSchema);
  let canLike = true;
  let stockLike1;
  let stockLike0;
  let stockLike;
  let rel0;
  let rel1;

  
  

  function hashBobJColinP(str) {
    let hash = 0;                  
    if (str.length == 0) return hash;
      
    for (let i = 0; i < str.length; i++) {
        let char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
      
    return hash;
  }

  async function createAndSaveIpHash(hash) {
    const newIPHash =  new ipHashCollection({
      ipHash: hash,
      alreadyLiked: false
    });

    try {
      const doc = await newIPHash.save();
      console.log('saved new ipHash: ', doc);

    }
    catch(err) {
      console.log('error saving newIpHash: ', err);
    }
    
  }

  async function findOneIpByHash(hash) {
    try{
      const doc = await ipHashCollection.findOne({ipHash: hash});
      console.log('found ipHash: ', doc);
      if(doc == null) {
        await createAndSaveIpHash(hash);
      }
      canLike = (doc) ? !doc.alreadyLiked : true;

    }
    catch(err) {
      console.log('error finding hash: ', err);
    }     
  }

  async function getIpAlreadyLiked(hash) {
    try{
      const doc = await ipHashCollection.findOne({ipHash: hash});
      console.log('alreadyLiked: ', (doc) ? doc.alreadyLiked : null);
      return (doc) ? doc.alreadyLiked : false;
    }
    catch(err) {
      console.log('error finding hash: ', err);
    }
    
  }

  async function updateAlreadyLiked(hash) {
    try {
      const doc = await ipHashCollection.findOneAndUpdate({ipHash: hash}, {$set: {alreadyLiked: true}}, {new: true});
      console.log('updated alreadyLiked to: ' , (doc) ? doc.alreadyLiked : null);
      canLike = (doc) ? !doc.alreadyLiked : true;
    }
    catch(err) {
      console.log(err);
    }
    
  }

  async function createAndSaveStock(stock) {
    const newstock = new stockCollection({
      stock: stock,
      likes: 0
    });
    try {
      const doc = await newstock.save();
      console.log('saved new stock: ', doc);

    }
    catch(err) {
      console.log('error saving newStock: ', err);
    }
    
    
  }

  async function findOneStock(stock) {
    try {
      const doc = await stockCollection.findOne({stock: stock}); 
      console.log('found stock: ', doc);
      if(doc == null) {
        await createAndSaveStock(stock);
      }  
    }
    catch(err) {
      console.log('error finding stock: ', err);
    }
      
  }

  async function getStockLikes(stock) {
    try {
      const doc = await stockCollection.findOne({stock: stock});
      return (doc) ? doc.likes : 0;
    }
    catch(err) {
      console.log('error finding stock: ', err);
    }
    
  }

  async function updatestockLikes(stock) {
    try {
      const doc = await stockCollection.findOneAndUpdate({stock: stock}, {$inc: {likes: 1}}, {new: true});
      console.log('updated ' + stock + ' likes to: ' , (doc) ? doc.likes : null);
    }
    catch(err) {
      console.log(err);
    }
    
  }

  async function prepareData(hash, reqStock, reqLike) {    
    await findOneIpByHash(hash);

    if(Array.isArray(reqStock)) {
      await findOneStock(reqStock[1]);
      stockLike1 = await getStockLikes(reqStock[1]);
      await findOneStock(reqStock[0]);
      stockLike1 = await getStockLikes(reqStock[0]);

      if(reqLike == "true" && canLike) {
        await updatestockLikes(reqStock[1]);
        await updatestockLikes(reqStock[0]);
        await updateAlreadyLiked(hash);      
        
      }

    rel0 = stockLike0 - stockLike1
    rel1 = stockLike1 - stockLike0


    }
    else {
      await findOneStock(reqStock);
      stockLike = await getStockLikes(reqStock);

      if(reqLike == "true" && canLike) {
        await updatestockLikes(reqStock);
        await updateAlreadyLiked(hash);  
        
      }
    }



  }


  app.route('/api/stock-prices')
    .get(function (req, res){
      
      //console.log(req.ip);
      const hash = hashBobJColinP(req.ip);
      //console.log(hash);

      async function returnData(reqStock) {
        if(Array.isArray(reqStock)) {
          let stockUrlApi2 = "https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/" + reqStock[1] + "/quote/";
          let stockPrice2 = 0;
          let stockUrlApi1 = "https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/" + reqStock[0] + "/quote/";
          let stockPrice1 = 0;

          try {
            let response2 = await axios.get(stockUrlApi2, {headers: { "Accept-Encoding": "gzip,deflate,compress" }});
            stockPrice2 = response2.data.latestPrice || 0;
          }
          catch(error2) {
            console.log(error2);
          }
          try {
            let response1 = await axios.get(stockUrlApi1, {headers: { "Accept-Encoding": "gzip,deflate,compress" }})
            stockPrice1 = response1.data.latestPrice || 0;
          }
          catch(error1) {
            console.log(error1);
          }
          res.json({stockData: [{stock: reqStock[1], price: stockPrice2 || 0, rel_likes: rel0 || 0}, {stock: reqStock[0], price: stockPrice1 || 0, rel_likes: rel1 || 0}]});
          
          
        }
        else {
          let stockUrlApi = "https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/" + reqStock + "/quote/";
          let stockPrice = 0;
          try {
            let response = await axios.get(stockUrlApi, {headers: { "Accept-Encoding": "gzip,deflate,compress" }});
            stockPrice = response.data.latestPrice;
            
          }
          catch(error) {
            console.log(error);
          }
          res.json({stockData:{stock: reqStock, price: stockPrice || 0, likes: stockLike || 0}});
        }   
      }

      async function main() {
        await prepareData(hash, req.query.stock, req.query.like).catch(console.error);
        await returnData(req.query.stock);
      }

      main().catch(console.error);
      

      

         
      
    });
    
};
