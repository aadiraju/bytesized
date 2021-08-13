const express = require('express');
const router = express.Router();
const auth = require('../auth');
const sql = require('mssql');
const manageCart = require('./manageCart');

router.use(express.urlencoded({extended: true}));

router.post('/', function (req, res) {
    // Have to preserve async context since we make an async call
    // to the database in the validateLogin function.
    let pool;
    (async () => {
        pool = await sql.connect(dbConfig);
        let authenticatedUser = await validateLogin(pool, req);
        if (authenticatedUser) {
            req.session.authenticatedUser = authenticatedUser;
            await manageCart.loadCartFromDB(pool, req.session);
            res.redirect("/");
        } else {
            req.session.loginMessage = "Access Denied, check your username and/or password";
            res.redirect("/login");
        }
    })().then(() => {
        pool.close();
    }).catch((err) => {
        console.dir(err);
        pool.close();
    });
});

async function validateLogin(pool, req) {
    let body = req.body;
    let userId = null;
    let password = null;
    if (body.userId != null && body.pass != null) {
        userId = body.userId;
        password = body.pass;
    }
    let retrievedPassword = false;
    return await (async function () { //returns the username if user exists, or false if they don't
        try {
            let passwordQuery = `
                SELECT password
                FROM customer
                WHERE userid = @userId;
            `;

            const passwordPS = new sql.PreparedStatement(pool);
            passwordPS.input('userId', sql.VarChar(20));
            await passwordPS.prepare(passwordQuery);

            let passwordResults = await passwordPS.execute({userId: userId});
            if (passwordResults.recordset.length) { //true only if customer exists in DB
                retrievedPassword = passwordResults.recordset[0].password;
            }

        } catch (err) {
            console.dir(err);
            return false;
        }
    })().then(() => {
        if (password != null && retrievedPassword && retrievedPassword === password) {
            return userId;
        } else
            return false;
    });
}

module.exports = router;
