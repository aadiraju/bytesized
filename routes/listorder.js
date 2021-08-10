const express = require('express');
const router = express.Router();
const sql = require('mssql');

// handlebars helper functions
const priceFormat = (price) => {
    return '$' + Number(price).toFixed(2);
};

const dateTimeFormat = (datetime) => {
    date = datetime.toISOString().split('T')[0];
    time = datetime.toISOString().substr(11, 18);
    return date + " " + time;

};

router.get('/', function (req, res, next) {
    res.setHeader('Content-Type', 'text/html');

    (async function () {
        //connects to the database
        let pool = await sql.connect(dbConfig);

        // Query to get order summary information
        let sqlQuery = `SELECT orderId,
                               orderDate                        as ordDate,
                               customer.customerId,
                               CONCAT(firstName, ' ', LastName) as customerName,
                               totalAmount
                        FROM ordersummary ordSum
                                 join customer on ordSum.customerId = customer.customerId`;

        let results = await pool.request().query(sqlQuery);

        //array to hold the order list information
        let ordList = [];

        // gets the product information for each order
        for (let i = 0; i < results.recordset.length; i++) {
            let result = results.recordset[i];
            let ordId = result.orderId;
            let prodInOrd = [];

            // Query to get product information on each order
            let sqlQuery2 = `SELECT productId, quantity, price
                             FROM orderproduct
                             WHERE orderId = @ordId`;

            // Executes sqlQuery2 and protects input from injection
            let preparedStatement = new sql.PreparedStatement(pool);
            preparedStatement.input('ordId', sql.Int);
            await preparedStatement.prepare(sqlQuery2);
            let results2 = await preparedStatement.execute({ordId: ordId});


            for (let j = 0; j < results2.recordset.length; j++) {
                let result2 = results2.recordset[j];
                prodInOrd.push(result2);
            }

            // adds the order summary info and product info to ordList (for handlebars template)
            result.prodInOrd = prodInOrd;
            ordList.push(result);
        }
        pool.close();
        return [ordList];
    })()
        //loads and renders the listorder page
        .then(([ordList]) => {
            res.render('listorder', {
                title: 'Bytesized Order List',
                username: req.session.authenticatedUser,
                ordList: ordList,
                helpers: {
                    priceFormat,
                    dateTimeFormat
                },
                active: {'listorder': true}
            });
        }).catch(err => {
        console.dir(err);
        res.send(err);
    });
});

module.exports = router;
