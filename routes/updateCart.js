const express = require('express');
const router = express.Router();
const sql = require('mssql');
const manageCart = require('./manageCart');

router.get('/', function (req, res, next) {

    // Get product id and new quantity
    let id = false;
    let newQty = false;
    if (req.query.id && req.query.qty) {
        id = req.query.id;
        newQty = Number(req.query.qty);
    } else {
        res.redirect("/listprod");
    }

    let pool;
    (async function () {
        pool = await sql.connect(dbConfig);
        await manageCart.updateQtyInCart(id, newQty, pool, req.session);
    })().then(() => {
        pool.close();
        res.redirect("/showcart");
    })
});

module.exports = router;
