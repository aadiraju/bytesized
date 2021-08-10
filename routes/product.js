const express = require('express');
const router = express.Router();
const sql = require('mssql');

const priceFormat = (price) => {
    return 'CAD$ ' + Number(price).toFixed(2);
};

const makeAddCartURL = (product) => {
    let prodName = encodeURIComponent(product.productName); //makes the name URL safe
    return `addcart?id=${product.productId}&name=${prodName}&price=${product.productPrice}`
};

const makeImageURL = (product) => {
    let prodName = encodeURIComponent(product.productName); //makes the name URL safe
    return `displayImage?id=${product.productId}&name=${prodName}`
};

router.get('/', function (req, res, next) {
    res.setHeader('Content-Type', 'text/html');

    let productId = req.query.id;

    (async function () {
        let pool = await sql.connect(dbConfig);

        let getProductById = `SELECT * 
                                FROM product p JOIN category c on p.categoryId = c.categoryId
                                WHERE productId = @productId`;

        let preppedSql = new sql.PreparedStatement(pool);
        preppedSql.input('productId', sql.Int);
        await preppedSql.prepare(getProductById);

        let results = await preppedSql.execute({ productId: productId });
        let product = results.recordset[0];
        let productName = product.productName;
        let productPrice = product.productPrice;
        let productImageURL = product.productImageURL;
        let productImage = product.productImage;
        let productDescription = product.productDescription;
        let categoryId = product.categoryId;
        let categoryName = product.categoryName;

        if (productName === undefined)
            productName = "N/A";
        if (productPrice === undefined)
            productPrice = "N/A";
        if (productImageURL === undefined)
            productImageURL = "N/A";
        if (productImage === undefined)
            productImage = "N/A";
        if (productDescription === undefined)
            productDescription = "N/A";
        if (categoryId === undefined)
            categoryId = "N/A";
        if (categoryName === undefined)
            categoryName = "N/A";

        pool.close();
        return [
            productId,
            productName,
            productPrice,
            productImageURL,
            productImage,
            productDescription,
            categoryId,
            categoryName
        ];
    })().then(([
        productId,
        productName,
        productPrice,
        productImageURL,
        productImage,
        productDescription,
        categoryId,
        categoryName
    ]) => {
        res.render('product', {
            title: 'Bytesized Product',
            username: req.session.authenticatedUser,
            productId: productId,
            productName: productName,
            productPrice: productPrice,
            productImageURL: productImageURL,
            productImage: productImage,
            productDescription: productDescription,
            categoryId: categoryId,
            categoryName: categoryName,
            helpers: {
                priceFormat,
                makeAddCartURL,
                makeImageURL
            },
            active: { 'product': true }
        });
    })
        .catch(err => {
            console.dir(err);
            res.send(err);
        });
});

module.exports = router;
