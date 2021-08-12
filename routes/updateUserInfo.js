const express = require('express');
const router = express.Router();
const auth = require('../auth');
const sql = require('mssql');

router.use(express.urlencoded({extended: true}));

router.post('/', function (req, res) {
    (async () => {
        let update = await updateAcc(req);
        if (update) {
            req.session.createAccMessage = "Account info updated";
            res.redirect("/userAcc");
        } else {
            req.session.createAccMessage = "Nothing to update";
            res.redirect("/userAcc");
        }
    })();
});


async function updateAcc(req) {
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
            body.pass  == '' || body.first == null || body.last == null  || body.em == null || body.phone  == null || body.add  == null ||
            body.cty  == null|| body.st  == null|| body.postal  == null|| body.ctry  == null || body.user  == null ||
            body.pass  == null){
                update == false;
            }

        try {
            pool = await sql.connect(dbConfig);
            if(update == true){
                let query = `update customer 
                            set firstName = @firstName, lastName = @lastName, email = @email, phonenum = @phoneNum, address = @address,
                            city = @city, state = @state, postalCode = @postalCode, country = @country, userid = @userName, password = @password
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
                await preppedSql.execute({firstName: firstName, lastName: lastName, email: email, phoneNum: phoneNum, address: address,
                    city: city, state: state, postalCode: postalCode, country: country, userName: userName, password: password, user: req.session.authenticatedUser});
                
            }
            
            pool.close();
        } catch(err) {
            console.dir(err);
        }

        return await update;
}

module.exports = router;