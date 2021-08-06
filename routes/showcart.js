const express = require('express');
const router = express.Router();

// Handlebar helper functions.

const priceFormat = (price) => {
    return 'CAD$ ' + Number(price).toFixed(2);
};

// Request and rendering.
router.get('/', function (req, res, next) {
    res.setHeader('Content-Type', 'text/html');

    let total = 0.0;
    let productList = false;
    if (req.session.productList) {
        productList = req.session.productList;
        productList = productList.filter(Object=>Object)

        for (let item of productList) {
            if (item === null)
                continue;
            total += item.quantity * item.price;
        }
    }

    (async function () {
        return [productList, total];
    })().then(([productList, total]) => {
        res.render('showcart', {
            title: 'Bytesized Cart',
            productList: productList,
            total: total,
            helpers: {
                priceFormat
            }
        });
    })
        .catch(err => {
            console.dir(err);
            res.send(err);
        });
});

module.exports = router;
