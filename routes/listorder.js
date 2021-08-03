const express = require('express');
const router = express.Router();
const sql = require('mssql');
const moment = require('moment');

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
        
        let prodInOrd = [];

        for (let ord of results.recordset){
            ordList.push(ord);
        }
 
        //res.write("<table border = '1'><tr><th>Order Id</th><th>Order Date</th><th>Customer Id</th><th>Customer Name</th><th>Total Amount</th></tr>");
            for (let i = 0; i < results.recordset.length; i++) {
                let result = results.recordset[i];
                let ordId = result.orderId;
                //res.write("<tr><td>" + result.orderId + "</td><td>" + result.ordDate + "</td><td>" + result.customerId + "</td><td>" + result.customerName + "</td><td> $" + result.totalAmount.toFixed(2) + "</td></tr><tr><td colspan = '5'>");

                let sqlQuery2 = `SELECT productId, quantity, price FROM orderproduct WHERE orderId = ` + ordId;
                let results2 = await pool.request().query(sqlQuery2);

                for (let prod of results2.recordset){
                    prodInOrd.push(prod);
                }
                //res.write("<table border = '2'><tr><th>Product Id</th><th>Quantity</th><th>Price</th></tr>");
                //for (let j = 0; j < results2.recordset.length; j++){
                    //let result2 = results2.recordset[j];
                    //res.write("<tr><td>" + result2.productId + "</td><td>" + result2.quantity + "</td><td> $" + result2.price.toFixed(2) + "</td></tr>");
                //}
                //res.write("</table>");
                //res.write("</td></tr>");
            }
            
            //res.write("</table>");
        return [ordList, prodInOrd];

    })().then(([ordList, prodInOrd]) => {
        res.render('listorder', {
            title: 'Bytesized Order List',
            ordList: ordList,
            prodInOrd: prodInOrd
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
