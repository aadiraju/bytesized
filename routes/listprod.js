const express = require('express');
const router = express.Router();
const sql = require('mssql');

//handlebar helper functions

const priceFormat = (price) => {
    return 'CAD$ ' + Number(price).toFixed(2);
};

const makeAddCartURL = (product) => {
    let prodName = encodeURIComponent(product.productName); //makes the name URL safe
    return `addcart?id=${product.productId}&name=${prodName}&price=${product.productPrice}`
};

//request and rendering
router.get('/', function (req, res, next) {
    res.setHeader('Content-Type', 'text/html');
    // Get the product name to search for
    let name = req.query.productName;
    if (name === undefined)
        name = '';

    let category = req.query.categoryName;
    if (category === undefined || category === ' ')
        category = 'All';

    (async function () {
        let pool = await sql.connect(dbConfig);

        let prodQuery = `SELECT productId, productName, productPrice, productImageURL, categoryName
                         from product p
                                  join category c on p.categoryId = c.categoryId
                         WHERE productName LIKE CONCAT('%', @name, '%')
                           AND (categoryName = @category OR @category = 'All')
                         ORDER BY productId ASC`;

        let catQuery = `SELECT categoryName
                        from category
                        ORDER BY categoryName ASC`;
        // make prepped SQL statement for safety and injection prevention, then add the user parameters into it
        let preppedSql = new sql.PreparedStatement(pool);
        preppedSql.input('name', sql.VarChar(40));
        preppedSql.input('category', sql.VarChar(50));
        await preppedSql.prepare(prodQuery);

        let results = await preppedSql.execute({name: name, category: category});
        let prodList = [];

        for (let prod of results.recordset)
            prodList.push(prod);

        preppedSql = new sql.PreparedStatement(pool);
        await preppedSql.prepare(catQuery);
        let catResults = await preppedSql.execute({});
        let catList = ['All'];
        for (let cat of catResults.recordset)
            catList.push(cat.categoryName);

        return [prodList, catList];
    })().then(([prodList, catList]) => {
        res.render('listprod', {
            title: 'Bytesized Product List',
            prodList: prodList,
            catList: catList,
            helpers: {
                priceFormat,
                makeAddCartURL
            }
        });
    })
        .catch(err => {
            console.dir(err);
            res.send(err);
        });
});

module.exports = router;
