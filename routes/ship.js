const express = require('express');
const router = express.Router();
const sql = require('mssql');
const moment = require('moment');

router.get('/', function(req, res) {
    res.setHeader('Content-Type', 'text/html');

    let valid = false; // For checking if the user input is valid
    let ordList = []; // For holding the list of orders in one shipment
    let flag = false; // For flagging if a product has insufficient inventory
    let pid = []; // Holds an array of product IDs that are in a shipment so the inventory can be updated

	// Gets order id
    let orderId = req.query.orderId;

    // Some validity checking
    if(orderId){
        orderId = Number(orderId);
    }
    else{
        orderId = '';
    }
		  

    (async function() { // Start of transaction
        try {
            let pool = await sql.connect(dbConfig);

            // Validates that the input is a valid orderId
           if (Number.isInteger(orderId)){ 
               let query = `Select orderId
                            from orderproduct
                            where orderId = @orderId`;
                let preppedSql = new sql.PreparedStatement(pool);
                preppedSql.input('orderId', sql.Int);
                await preppedSql.prepare(query);
                let results = await preppedSql.execute({orderId: orderId});

                if (results){
                    valid = true;
                }
                else{
                    valid = false;
                }
           }

           // If the input is valid, show all the shipment info
           if (valid){ 
               let query2 = `Select orderproduct.productId, orderproduct.quantity as quantity, productinventory.quantity as quantity2, (productinventory.quantity - orderproduct.quantity) as remaining
                            from orderproduct join productinventory on orderproduct.productId = productinventory.productId
                            where orderId = ` + orderId;
                let results2 = await pool.request().query(query2);

                let flagPid = 0;

                // Puts all the products in the ordList array and checks if there is enough inventory
                for (let ord of results2.recordset){ 
                    ordList.push(ord);
                    pid.push(ord.productId);
                    if (ord.remaining < 0){
                        // flag = true tells us there is an insufficient inventory
                        flag = true;
                        // flagPid tells us which product has the insufficient inventory
                        flagPid = ord.productId;
                    }
                }

                // Checks if there is insufficient inventory to process shipment then the transaction is cancelled
                if (flag == true){ 
                    ordList = '';
                    ordList = "Shipment not done. Insufficient inventory for product id: " + flagPid + ". Transaction Cancelled.";
                }
                // Inserts a new shipment into the shipment table
                else{ 
                    let shipmentDate = new Date().toISOString().slice(0, 10);
                    let warehouseId = 1;
                    let shipmentDesc = "Date shipped: " + shipmentDate + "From warehouse: " + warehouseId;

                    let query3 = `insert into shipment(shipmentDate, shipmentDesc, warehouseId) values (@shipmentDate, @shipmentDesc, @warehouseId)`;
                    let preppedSql = new sql.PreparedStatement(pool);
                    preppedSql.input('shipmentDate', sql.DateTime);
                    preppedSql.input('shipmentDesc', sql.VarChar(100));
                    preppedSql.input('warehouseId', sql.Int);
                    await preppedSql.prepare(query3);
                    await preppedSql.execute({shipmentDate: shipmentDate, shipmentDesc: shipmentDesc, warehouseId: warehouseId});

                    // If there is enough inventory, the productinventory table is updated to reflect the shipment
                    for (let id of pid){
                        let query4 = `update productinventory 
                                        set quantity = (
                                            select (productinventory.quantity - orderproduct.quantity) as remaining 
                                            from productinventory join orderproduct on productinventory.productId = orderproduct.productId
                                            where productinventory.productId = @id and orderproduct.orderId = @orderId)`;
                        let preppedSql = new sql.PreparedStatement(pool);
                        preppedSql.input('id', sql.Int);
                        preppedSql.input('orderId', sql.Int)
                        await preppedSql.prepare(query4);
                        await preppedSql.execute({id: id, orderId: orderId});
                    }
                }
           }
           pool.close();
           return [ordList, valid, flag];

        } catch(err) {
            console.dir(err);
        }
    })()
    .then(([ordList, valid, flag]) =>{
        res.render('shipment', {
            title: 'Bytesized Shipment',
            ordList: ordList,
            valid: valid,
            flag: flag
        });
    })
    .catch(err => {
        console.dir(err);
    });
});

module.exports = router;
