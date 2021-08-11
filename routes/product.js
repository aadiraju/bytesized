const express = require('express');
const router = express.Router();
const sql = require('mssql');

const priceFormat = (price) => {
    return 'CAD$ ' + Number(price).toFixed(2);
};

const makeAddCartURL = (product) => {
    let prodName = encodeURIComponent(product.productName); //makes the name URL safe
    return `addcart?id=${product.productId}&name=${prodName}&price=${product.productPrice}`;
};

const makeImageURL = (productId) => {
    return `displayImage?id=${productId}`;
};

router.get('/', function (req, res, next) {
    res.setHeader('Content-Type', 'text/html');

    let productId = req.query.id;

    (async function () {
        let pool = await sql.connect(dbConfig);

        let getProductById = `SELECT *
                              FROM product p
                                       JOIN category c on p.categoryId = c.categoryId
                              WHERE productId = @productId`;

        let preppedSql = new sql.PreparedStatement(pool);
        preppedSql.input('productId', sql.Int);
        await preppedSql.prepare(getProductById);

        let results = await preppedSql.execute({productId: productId});
        let product = results.recordset[0];

        pool.close();
        return [productId, product];
    })().then(([productId, product]) => {
        res.render('product', {
            title: 'Bytesized Product',
            username: req.session.authenticatedUser,
            productId: productId,
            product: product,
            helpers: {
                priceFormat,
                makeAddCartURL,
                makeImageURL
            },
            active: {'product': true}
        });
    })
        .catch(err => {
            console.dir(err);
            res.send(err);
        });
});

module.exports = router;
