const express = require('express');
const router = express.Router();
const sql = require('mssql');
const moment = require('moment');

const priceFormat = (price) => {
    return 'CAD$ ' + Number(price).toFixed(2);
};

router.get('/', function (req, res, next) {
    res.setHeader('Content-Type', 'text/html');

    let customerId = req.query.customerId;
    let validIDstr = customerId;
    let cartSize = '';
    let isValid = false;

    // Get the product list
    let productList = false;
    if (req.session.productList && req.session.productList.length > 0) {
        productList = req.session.productList;
    }

    /**
     Determine if valid customer id was entered
     Determine if there are products in the shopping cart
     If either are not true, display an error message
     **/
    (async function () {
        let pool = await sql.connect(dbConfig);

        // Query for customer information.
        let customerIDQuery = `SELECT customerId, address, city, state, postalCode, country, userid
                               FROM customer
                               WHERE customerId = @customerId`;
        let preppedSql = new sql.PreparedStatement(pool);
        preppedSql.input('customerId', sql.Int);
        await preppedSql.prepare(customerIDQuery);
        let customerResults = await preppedSql.execute({customerId: customerId});

        // Check if ID is valid.
        for (let customer of customerResults.recordset) {
            isValid = !isNaN(customerId) && customerId === customer.customerId;
            if (isValid)
                break;
        }
        if (!isValid) {
            validIDstr = 'Invalid Customer ID';
        }

        // Check if cart is empty and get total cart value if not.
        let totalAmount = 0.0;
        if (productList !== false) {
            cartSize = productList.length;

            for (let item of productList) {
                if (item === null)
                    continue;
                totalAmount += item.quantity * item.price;
            }
        } else {
            cartSize = 'The cart is empty!!';
        }

        // Insert order into ordersummary table.
        let date = new Date();
        let dateStr = date.getFullYear() + '-' + date.getMonth() + '-' + date.getDate();
        let ordersummaryInsert = `INSERT INTO ordersummary (orderDate, totalAmount, shiptoAddress, shiptoCity,
                                                            shiptoState, shiptoPostalCode, shiptoCountry, customerId)
                                  OUTPUT INSERTED.orderId
                                  VALUES (@orderDate, @totalAmount, @address, @city, @state, @postalCode, @country,
                                          @customerId);`;

        preppedSql = new sql.PreparedStatement(pool);
        preppedSql.input('orderDate', sql.DateTime);
        preppedSql.input('totalAmount', sql.Decimal(10, 2));
        preppedSql.input('address', sql.VarChar(50));
        preppedSql.input('city', sql.VarChar(40));
        preppedSql.input('state', sql.VarChar(20));
        preppedSql.input('postalCode', sql.VarChar(20));
        preppedSql.input('country', sql.VarChar(40));
        preppedSql.input('customerId', sql.Int);
        await preppedSql.prepare(ordersummaryInsert);

        let orderResults = await preppedSql.execute({
            orderDate: dateStr,
            totalAmount: totalAmount,
            address: customerResults.recordset[0].address,
            city: customerResults.recordset[0].city,
            state: customerResults.recordset[0].state,
            postalCode: customerResults.recordset[0].postalCode,
            country: customerResults.recordset[0].country,
            customerId: customerResults.recordset[0].customerId
        });

        let orderId = orderResults.recordset[0].orderId;

        pool.close();
        return [cartSize, orderId, totalAmount, validIDstr];
    })().then(([cartSize, orderId, totalAmount, validIDstr]) => {
        res.render('order', {
            title: 'Bytesized Customer Order',
            cartSize: cartSize,
            orderId: orderId,
            totalAmount: totalAmount,
            validIDstr: validIDstr,
            helpers: {
                priceFormat
            }
        });
    }).catch(err => {
        console.dir(err);
        res.send(err);
    });
});

module.exports = router;
