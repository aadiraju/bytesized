const express = require('express');
const router = express.Router();
const sql = require('mssql');
const auth = require('../auth');

function loginAuth(req, res, next) {
    if (req.session.authenticatedUser)
        next();
    else {
        //If Customer tries to access page without being logged in, send to login page with appropriate error message
        req.session.loginMessage = "You haven't logged in yet.";
        res.redirect("/login");
    }
}

router.get('/', loginAuth, function (req, res, next) {
    let userid = req.session.authenticatedUser;

    (async function () {
        let pool = await sql.connect(dbConfig);
        let customerIDQuery = `SELECT customerId,
                                      firstName,
                                      lastName,
                                      email,
                                      phonenum,
                                      address,
                                      city,
                                      state,
                                      postalCode,
                                      country,
                                      userid
                               FROM customer
                               WHERE userid = @userid;`
        let preppedSql = new sql.PreparedStatement(pool);
        preppedSql.input('userid', sql.VarChar(20));
        await preppedSql.prepare(customerIDQuery);
        let customerResults = await preppedSql.execute({userid: userid});
        let customer = customerResults.recordset[0];

        pool.close();
        return [customer]
    })().then(([customer]) => {
        res.render('customer', {
            title: 'Bytesized Custmer Info',
            username: req.session.authenticatedUser,
            customer: customer,
            active: {'customer': true}
        });
    })
        .catch(err => {
            console.dir(err);
            res.send(err);
        });
});

module.exports = router;
