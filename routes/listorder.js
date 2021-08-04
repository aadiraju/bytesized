const express = require('express');
const router = express.Router();
const sql = require('mssql');
const moment = require('moment');

const priceFormat = (price) => {
    return '$' + Number(price).toFixed(2);
};

router.get('/', function(req, res, next) {
    res.setHeader('Content-Type', 'text/html');
    //res.write('<title>YOUR NAME Grocery Order List</title>');
    /** Create connection, and validate that it connected successfully **/
    (async function(){
        let pool = await sql.connect(dbConfig);

        let sqlQuery = `SELECT orderId, CONVERT(varchar, orderDate, 121) as ordDate, customer.customerId, CONCAT(firstName,' ', LastName) as customerName, totalAmount
                        FROM ordersummary ordSum join customer on ordSum.customerId = customer.customerId`;

        let results = await pool.request().query(sqlQuery);
        
        let ordList = [];
        
            for (let i = 0; i < results.recordset.length; i++) {
                let result = results.recordset[i];
                let ordId = result.orderId;
                let prodInOrd = [];

                let sqlQuery2 = `SELECT productId, quantity, price FROM orderproduct WHERE orderId = ` + ordId;
                let results2 = await pool.request().query(sqlQuery2);

                for (let j = 0; j < results2.recordset.length; j++){
                    let result2 = results2.recordset[j];
                    prodInOrd.push(result2);
                }

                ordList.push(result,prodInOrd)
            }
        return [ordList];

    })().then(([ordList]) => {
        res.render('listorder', {
            title: 'Bytesized Order List',
            ordList: ordList,
            helpers: {
                priceFormat
            }
        });
    }).catch(err =>{
        console.dir(err);
        res.send(err);
    });
    /**
    Useful code for formatting currency:
        let num = 2.87879778;
        num = num.toFixed(2);
    **/

    /** Write query to retrieve all order headers **/

    /** For each order in the results
            Print out the order header information
            Write a query to retrieve the products in the order

            For each product in the order
                Write out product information 
    **/
//   res.end();
   
});

module.exports = router;
