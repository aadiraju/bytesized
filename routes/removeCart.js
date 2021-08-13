const express = require('express');
const router = express.Router();
const sql = require('mssql');
const manageCart = require('./manageCart');

router.get('/', function (req, res, next) {

    // If product list is empty, make one
    let productList = false;
    if (!req.session.productList) {
        productList = [];
    } else {
        productList = req.session.productList;
    }

    // Get product id
    let id = false;
    if (req.query.id) {
        id = req.query.id;
    } else {
        res.redirect("/listprod");
    }

    let pool;
    (async function () {
        pool = await sql.connect(dbConfig);
        await manageCart.removeFromCart(id, pool, req.session);
    })().then(() => {
        pool.close();
        res.redirect("/showcart");
    });
});

module.exports = router;
