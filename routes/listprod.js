const express = require('express');
const router = express.Router();
const sql = require('mssql');

router.get('/', function (req, res, next) {
    res.setHeader('Content-Type', 'text/html');
    // Get the product name to search for
    let name = req.query.productName;
    if (name === undefined)
        name = '';

    /** $name now contains the search string the user entered
     Use it to build a query and print out the results. **/
    /** Create and validate connection **/
    /**
     For each product create a link of the form
     addcart?id=<productId>&name=<productName>&price=<productPrice>
     **/
    /**
     Useful code for formatting currency:
     let num = 2.89999;
     num = num.toFixed(2);
     **/
    (async function () {
        let pool = await sql.connect(dbConfig);

        let prodQuery = `SELECT productId, productName, productPrice, productImageURL, categoryName
                         from product p
                                  join category c on p.categoryId = c.categoryId
                         WHERE productName LIKE CONCAT('%', @name, '%')`;

        // make prepped SQL statement for safety and injection prevention, then add the user parameters into it
        const preppedSql = new sql.PreparedStatement(pool);
        preppedSql.input('name', sql.VarChar(40));
        await preppedSql.prepare(prodQuery);

        let results = await preppedSql.execute({name: name});
        let prodList = [];

        for (let prod of results.recordset)
            prodList.push(prod);

        return prodList;
    })().then((prodList) => {
        res.render('listprod', {
            title: 'Bytesized Product List',
            prodList: prodList
        });
    })
        .catch(err => {
            console.dir(err);
            res.send(err);
        });
});

module.exports = router;
