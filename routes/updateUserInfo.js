const express = require('express');
const router = express.Router();
const auth = require('../auth');
const sql = require('mssql');

router.use(express.urlencoded({extended: true}));

router.post('/', function (req, res) {
    let pool;
    (async () => {
        pool = await sql.connect(dbConfig);
        let update = await updateAcc(req, pool);
        if (update) {
            req.session.createAccMessage = "Account info updated";
            res.redirect("/userAcc");
        } else {
            req.session.createAccMessage = "Nothing to update";
            res.redirect("/userAcc");
        }
    })().then(() => pool.close());
});


async function updateAcc(req, pool) {
    let update = true;
    let body = req.body;
    let firstName = null;
    let lastName = null;
    let email = null;
    let phoneNum = null;
    let address = null;
    let city = null;
    let state = null;
    let postalCode = null;
    let country = null;
    let userName = null;
    let password = null;

    if (body.first != null && body.last != null && body.em != null && body.phone != null && body.add != null
        && body.cty != null && body.st != null && body.postal != null && body.ctry != null && body.user != null
        && body.pass != null) {
        firstName = body.first;
        lastName = body.last;
        email = body.em;
        phoneNum = body.phone;
        address = body.add;
        city = body.cty;
        state = body.st;
        postalCode = body.postal;
        country = body.ctry;
        userName = body.user;
        password = body.pass;
    }

    if (body.first === '' || body.last === '' || body.em === '' || body.phone === '' || body.add === '' ||
        body.cty === '' || body.st === '' || body.postal === '' || body.ctry === '' || body.user === '' ||
        body.pass === '') {
        update = false;
    }

    try {
        if (update === true) {
            let query = `update customer
                         set firstName  = @firstName,
                             lastName   = @lastName,
                             email      = @email,
                             phonenum   = @phoneNum,
                             address    = @address,
                             city       = @city,
                             state      = @state,
                             postalCode = @postalCode,
                             country    = @country,
                             userid     = @userName,
                             password   = @password
                         where userid = @user`;

            let preppedSql = new sql.PreparedStatement(pool);

            preppedSql.input('firstName', sql.VarChar(40));
            preppedSql.input('lastName', sql.VarChar(40));
            preppedSql.input('email', sql.VarChar(50));
            preppedSql.input('phoneNum', sql.VarChar(20));
            preppedSql.input('address', sql.VarChar(50));
            preppedSql.input('city', sql.VarChar(40));
            preppedSql.input('state', sql.VarChar(20));
            preppedSql.input('postalCode', sql.VarChar(20));
            preppedSql.input('country', sql.VarChar(40));
            preppedSql.input('userName', sql.VarChar(20));
            preppedSql.input('password', sql.VarChar(30));
            preppedSql.input('user', sql.VarChar(20));

            await preppedSql.prepare(query);
            await preppedSql.execute({
                firstName: firstName,
                lastName: lastName,
                email: email,
                phoneNum: phoneNum,
                address: address,
                city: city,
                state: state,
                postalCode: postalCode,
                country: country,
                userName: userName,
                password: password,
                user: req.session.authenticatedUser
            });

        }

    } catch (err) {
        console.dir(err);
    }

    return update;
}

module.exports = router;
