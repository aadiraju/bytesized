const express = require('express');
const router = express.Router();
const sql = require('mssql');

const priceFormat = (price) => {
    return 'CAD$ ' + Number(price).toFixed(2);
};

const subtotalFormat = (product) => {
    return 'CAD$ ' + (Number(product.price) * Number(product.quantity)).toFixed(2);
};

router.get('/', function (req, res, next) {
    res.setHeader('Content-Type', 'text/html');

    let customerId = req.query ? Number(req.query.customerId) : null;
    let cartSize = 0;
    let isValid = false;
    let orderId = null;

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
        isValid = !customerId && customerId === customerResults?.recordset[0].customerId; //returns true if customerId matches any customer

        // Check if cart is empty and get total cart value if not.
        let realProductList = [];
        let totalAmount = 0.0;
        if (productList !== false) {
            for (let item of productList) {
                if (item === null)
                    continue;
                totalAmount += item.quantity * item.price;
                realProductList.push(item);
            }
        }
        cartSize = realProductList.length;

        if (cartSize > 0) {
            // Insert order into ordersummary table only if there is a product in the cart
            let date = new Date();
            let dateStr = date.getFullYear() + '-' + date.getMonth() + '-' + date.getDate();
            let ordersummaryInsert = `INSERT INTO ordersummary (orderDate, totalAmount, shiptoAddress, shiptoCity,
                                                                shiptoState, shiptoPostalCode, shiptoCountry,
                                                                customerId)
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

            orderId = orderResults.recordset[0].orderId;

            let orderProductInsert =
                `
                    INSERT INTO orderproduct(orderId, productId, quantity, price)
                    VALUES (@orderId, @productId, @quantity, @price)
                `;
            const ordprodPS = new sql.PreparedStatement(pool);
            ordprodPS.input('orderId', sql.Int);
            ordprodPS.input('productId', sql.Int);
            ordprodPS.input('quantity', sql.Int);
            ordprodPS.input('price', sql.Decimal);
            await ordprodPS.prepare(orderProductInsert);

            for (let product of realProductList) {
                //update orderProduct for each non-null product
                await ordprodPS.execute({
                    orderId: orderId,
                    productId: product.id,
                    quantity: product.quantity,
                    price: product.price
                });
            }
        }
        //clear session cart
        req.session.productList = [];

        pool.close();
        return [cartSize, realProductList, orderId, totalAmount, isValid, customerResults.recordset[0]];
    })().then(([cartSize, realProductList, orderId, totalAmount, isValid, custData]) => {
        res.render('order', {
            title: 'Bytesized Customer Order',
            cartSize: cartSize,
            realProductList: realProductList,
            orderId: orderId,
            totalAmount: totalAmount,
            isValid: isValid,
            custData: custData,
            helpers: {
                priceFormat,
                subtotalFormat
            }
        });
    }).catch(err => {
        console.dir(err);
        res.send(err);
    });
});

module.exports = router;
