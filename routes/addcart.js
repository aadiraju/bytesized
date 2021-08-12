const express = require('express');
const router = express.Router();
const sql = require('mssql');
const manageCart = require('./manageCart');

router.get('/', function (req, res, next) {


    // Add new product selected
    // Get product information
    let id = false;
    let name = false;
    let price = false;
    if (req.query.id && req.query.name && req.query.price) {
        id = req.query.id;
        name = req.query.name;
        price = req.query.price;
    } else {
        res.redirect("/listprod");
    }

    let pool;
    (async function () {
        pool = await sql.connect(dbConfig);
        await manageCart.addToCart(req.session, pool, id, name, price);
    })().then(() => {
        pool.close();
        res.redirect("/showcart");
    })
});

module.exports = router;
