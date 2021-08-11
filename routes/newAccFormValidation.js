const express = require('express');
const router = express.Router();
const auth = require('../auth');
const sql = require('mssql');

router.use(express.urlencoded({extended: true}));

router.post('/', function (req, res) {
    // Have to preserve async context since we make an async call
    // to the database in the validateLogin function.
    (async () => {
        let newUser = await validateNewAcc(req);
        console.log(newUser);
        if (newUser) {
            req.session.authenticatedUser = newUser;
            res.redirect("/");
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

    if(body.first != null && body.last != null && body.em != null && body.phone != null && body.add != null 
        && body.cty != null && body.st != null && body.postal != null && body.ctry != null && body.user != null
        && body.pass != null){
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
        
        if (body.first == '' || body.last == '' || body.em == '' || body.phone  == '' || body.add  == '' ||
            body.cty  == '' || body.st  == '' || body.postal  == '' || body.ctry  == '' || body.user  == '' ||
            body.pass  == ''){
                newUser = false;
            }

        try {
            pool = await sql.connect(dbConfig);

            let query = `Select * from customer`;
            let customers = await pool.request().query(query);

            for (let customer of customers.recordset) {
                if(firstName === customer.firstName || lastName === customer.lastName || email === customer.email
                    || phoneNum === customer.phonenum || address === customer.address || city === customer.city ||
                    state === customer.state || postalCode === customer.postalCode || country === customer.country ||
                    userName === customer.userid || password === customer.password){
                        newUser = false;
                    }
            }

            if (newUser == true){
                let query2 = `insert into customer (firstName, lastName, email, phonenum, address, city, state, 
                                postalCode, country, userid, password) VALUES (@firstName, @lastName, @email, @phoneNum, @address,
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
                await preppedSql.execute({firstName: firstName});
                await preppedSql.execute({lastName: lastName});
                await preppedSql.execute({email: email});
                await preppedSql.execute({phoneNum: phoneNum});
                await preppedSql.execute({address: address});
                await preppedSql.execute({city: city});
                await preppedSql.execute({state: state});
                await preppedSql.execute({postalCode: postalCode});
                await preppedSql.execute({country: country});
                await preppedSql.execute({userName: userName});
                await preppedSql.execute({password: password});
            }
            pool.close()
        } catch (err) {
            console.dir(err);
        }

   return await userName;
}

module.exports = router;
