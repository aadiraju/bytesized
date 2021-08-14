const express = require('express');
const router = express.Router();
const sql = require('mssql');

router.use(express.urlencoded({extended: true}));

router.post('/', function (req, res, next) {

    let body = req.body;
    let reviewRating = body.reviewRating;
    let productId = body.productId;
    let userId = req.session.authenticatedUser;
    let reviewComment = body.reviewComment;
    console.log(userId);
    if (userId === undefined) {
        res.redirect('/login');
        return;
    }

    let pool = null;
    (async function () {
        try {
            pool = await sql.connect(dbConfig);
            let customerIDQuery = `SELECT customerId
                                   FROM customer
                                   WHERE userid = @userid`;
            let preppedSql = new sql.PreparedStatement(pool);
            preppedSql.input('userid', sql.VarChar);
            await preppedSql.prepare(customerIDQuery);
            let customerResults = await preppedSql.execute({userid: userId});
            if (!customerResults.recordset[0]) {
                res.redirect('/login');
                return;
            }
            let customerId = customerResults.recordset[0].customerId;

            let insertReviewSql = `
                insert into review (reviewRating, reviewDate, customerId, productId, reviewComment)
                values (@reviewRating, @reviewDate, @customerId, @productId, @reviewComment)
            `;
            let reviewPS = new sql.PreparedStatement(pool);
            reviewPS.input('reviewRating', sql.Int);
            reviewPS.input('reviewDate', sql.DateTime);
            reviewPS.input('customerId', sql.Int);
            reviewPS.input('productId', sql.Int);
            reviewPS.input('reviewComment', sql.VarChar);
            await reviewPS.prepare(insertReviewSql);

            await reviewPS.execute({
                reviewRating: reviewRating,
                reviewDate: new Date(),
                customerId: customerId,
                productId: productId,
                reviewComment: reviewComment
            });

            res.redirect('/listprod');
        } catch (err) {
            console.dir(err);
        }
    })().then(() => {
        pool.close();
    });

});

router.get('/', function (req, res, next) {
    //prevent get requests from working and redirect back to checkout with invalid password
    res.redirect("/listprod");
});

module.exports = router;
