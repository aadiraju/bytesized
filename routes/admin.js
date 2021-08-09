const express = require('express');
const router = express.Router();
const auth = require('../auth');
const sql = require('mssql');

// handlebars helper functions
const priceFormat = (price) => {
    return '$' + Number(price).toFixed(2);
};

const dateFormat = (datetime) => {
    date = datetime.toISOString().split('T')[0];
    return date;

};

function loginAuth(req, res, next) {
    if (req.session.authenticatedUser)
        next();
    else {
        //if login in invalid, send back to login page
        req.session.loginMessage = "Access Denied to Admin Page, check your credentials.";
        res.redirect("/login");
    }
}

router.get('/', loginAuth, function (req, res, next) {

    (async function () {
        let pool = await sql.connect(dbConfig);
        let orderReportSQL = `select cast(orderDate as DATE) as groupedOrderDate, sum(totalAmount) as totalDayAmount
                              from ordersummary
                              group by cast(orderDate as DATE)
                              order by groupedOrderDate ASC;
        `;

        let orderReport = await pool.request().query(orderReportSQL);
        pool.close();
        return orderReport.recordset;
    })().then(([orderReport]) => {
        res.render('admin', {
            title: 'Bytesized Admin Page',
            orderReport: orderReport,
            helpers: {
                priceFormat,
                dateFormat
            },
            active: {'admin': true}
        });
    })
        .catch((err) => {
            console.dir(err);
            res.end();
        });
});

module.exports = router;
