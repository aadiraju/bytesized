const express = require('express');
const router = express.Router();

// Handlebar helper functions.

const priceFormat = (price) => {
    return 'CAD$ ' + Number(price).toFixed(2);
};

const makeProductURL = (id, name) => {
    let prodName = encodeURIComponent(name); //makes the name URL safe
    return `product?id=${id}&name=${prodName}`
};

// Request and rendering.
router.get('/', function (req, res, next) {
    res.setHeader('Content-Type', 'text/html');

    let total = 0.0;
    let productList = false;
    if (req.session.productList) {
        productList = req.session.productList;
        productList = productList.filter(Object => Object)

        for (let item of productList) {
            if (item === null)
                continue;
            total += item.quantity * item.price;
        }
    }
    let cartSize = productList.length;

    (async function () {
        return [productList, total, cartSize];
    })().then(([productList, total, cartSize]) => {
        res.render('showcart', {
            title: 'Bytesized Cart',
            username: req.session.authenticatedUser,
            productList: productList,
            total: total,
            cartSize: cartSize,
            helpers: {
                priceFormat,
                makeProductURL
            },
            active: {'showcart': true}
        });
    })
        .catch(err => {
            console.dir(err);
            res.send(err);
        });
});

module.exports = router;
