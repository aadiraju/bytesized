const express = require('express');
const router = express.Router();
const sql = require('mssql');

router.use(express.urlencoded({extended: true}));

router.post('/', function (req, res, next) {

    let body = req.body;
    let customerId = null;
    let password = null;
    if (body.customerId && body.password) {
        customerId = Number(body.customerId);
        password = body.password;
    }

    let retrievedPassword = false;

    (async function () {
        try {

            let passwordQuery = `
                SELECT password
                FROM customer
                WHERE customerId = @customerId;
            `;

            if (Number.isInteger(customerId)) { //only works when customerId is a valid Integer
                let pool = await sql.connect(dbConfig);

                const passwordPS = new sql.PreparedStatement(pool);
                passwordPS.input('customerId', sql.Int);
                await passwordPS.prepare(passwordQuery);

                let passwordResults = await passwordPS.execute({customerId: customerId});
                if (passwordResults.recordset.length) { //true only if customer exists in DB
                    let retrievedCustomer = passwordResults.recordset[0];
                    retrievedPassword = retrievedCustomer.password;
                }
            }

        } catch (err) {
            console.dir(err);
        }
    })().then(() => {
        if (password && retrievedPassword && retrievedPassword === password) {
            req.session.customerAuth = {
                'customerId': customerId,
                'authenticated': true
            };
            res.redirect(`/order`);
        } else {
            req.session.invalidPassword = true;
            res.redirect("/checkout");
        }
    });

});

router.get('/', function (req, res, next) {
    //prevent get requests from working and redirect back to checkout with invalid password
    req.session.invalidPassword = true;
    res.redirect("/checkout");
});

module.exports = router;
