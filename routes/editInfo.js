const express = require('express');
const router = express.Router();
const auth = require('../auth');
const sql = require('mssql');

router.get('/', function (req, res, next) {
    let updateAccMessage = false;
    if (req.session.updateAccMessage) {
        updateAccMessage = req.session.updateAccMessage;
        req.session.updateAccMessage = false;
    }
    let pool;
    (async () => {
        pool = await sql.connect(dbConfig);
        let custQuery = `select *
                         from customer
                         where userid = @userid;`;

        let preppedSql = new sql.PreparedStatement(pool);
        preppedSql.input('userid', sql.VarChar(20));
        await preppedSql.prepare(custQuery);
        let customerResults = await preppedSql.execute({userid: req.session.authenticatedUser});

        let customer = [];

        if (customerResults.recordset.length > 0)
            customer = customerResults.recordset[0];

        return [customer];
    })().then(([customer]) => {
        pool.close();
        res.render('updateAccForm', {
            title: "Update Account Info",
            username: req.session.authenticatedUser,
            customer: customer,
            updateAccMessage: updateAccMessage
        });
    });


});

module.exports = router;
