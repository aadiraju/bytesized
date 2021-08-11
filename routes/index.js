const express = require('express');
const sql = require("mssql");
const router = express.Router();

//handlebars helpers
const priceFormat = (price) => {
    return 'CAD$ ' + Number(price).toFixed(2);
};

const makeAddCartURL = (product) => {
    let prodName = encodeURIComponent(product.productName); //makes the name URL safe
    return `addcart?id=${product.productId}&name=${prodName}&price=${product.productPrice}`
};

// Rendering the main page
router.get('/', function (req, res) {
    let username = false;
    let pool;
    //fetch top-selling products and send them to template
    (async function () {
        pool = await sql.connect(dbConfig);

        let prodQuery = `
            select top 5 o.productId, productName, productImageURL, productPrice, sum(quantity) as totalSold
            from orderproduct o
                     join product p on o.productId = p.productId
            group by o.productId, p.productName, productImageURL, productPrice
            order by totalSold DESC;
        `;
        let preppedSql = new sql.PreparedStatement(pool);
        await preppedSql.prepare(prodQuery);
        let topProd = await preppedSql.execute({});

        return [topProd.recordset];

    })().then(([topProd]) => {
        pool.close();
        res.render('index', {
            title: "Bytesized",
            username: req.session.authenticatedUser,
            topProd: topProd,
            helpers: {
                priceFormat,
                makeAddCartURL
            },
            active: {'home': true}
        });
    });
})

module.exports = router;
