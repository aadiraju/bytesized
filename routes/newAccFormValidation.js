const express = require('express');
const router = express.Router();
const auth = require('../auth');
const sql = require('mssql');

router.use(express.urlencoded({extended: true}));

router.post('/', function (req, res) {
    (async () => {
        let newUser = await validateNewAcc(req);
        if (newUser) {
            req.session.authenticatedUser = newUser;
            req.session.updateAccMessage = "Successfully Created New Account with username : " + newUser;
            res.redirect("/userAcc");
        } else {
            req.session.createAccMessage = "Could not create new account. Re-check information and try again";
            res.redirect("/createAcc");
        }
    })();
});

async function validateNewAcc(req) {
    let newUser = true;

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

    if (body.first === '' || body.last === '' || body.em === '' || body.phone === '' || body.add === '' ||
        body.cty === '' || body.st === '' || body.postal === '' || body.ctry === '' || body.user === '' ||
        body.pass === '') {
        newUser = false;
    }

    if (body.first != null && body.last != null && body.em != null && body.phone != null && body.add != null
        && body.cty != null && body.st != null && body.postal != null && body.ctry != null && body.user != null
        && body.pass != null) {
        firstName = body.first;
        lastName = body.last;
        email = body.em;

        //clean phone num
        phoneNum = body.phone;
        phoneNum = phoneNum.replace(/[^0-9.]/g, '').replace(/\D[^\.]/g, '');
        phoneNum = phoneNum.slice(0, 3) + "-" + phoneNum.slice(3, 6) + "-" + phoneNum.slice(6);

        address = body.add;
        city = body.cty;
        state = body.st;
        postalCode = body.postal;
        country = body.ctry;
        userName = body.user;
        password = body.pass;
    }

    try {
        let pool = await sql.connect(dbConfig);

        let query = `select *
                     from customer`;
        let customers = await pool.request().query(query);

        for (let customer of customers.recordset) {
            if ((firstName === customer.firstName && lastName === customer.lastName) || email === customer.email
                || phoneNum === customer.phonenum || userName === customer.userid) {
                newUser = false;
            }
        }

        if (newUser === true) {
            let query2 = `insert into customer (firstName, lastName, email, phonenum, address, city, state,
                                                postalCode, country, userid, password)
                          VALUES (@firstName, @lastName, @email, @phoneNum, @address,
                                  @city, @state, @postalCode, @country, @userName, @password)`;

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

            await preppedSql.prepare(query2);
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
                password: password
            });
        }
        pool.close();
    } catch (err) {
        console.dir(err);
    }

    return userName;
}

module.exports = router;
