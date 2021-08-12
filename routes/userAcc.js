const express = require('express');
const router = express.Router();
const auth = require('../auth');
const sql = require('mssql');

router.get('/', function (req, res, next) {
    res.setHeader('Content-Type', 'text/html');

    let user = null;
    if (req.session.authenticatedUser){
        user = req.session.authenticatedUser;
    }

    res.render('userAcc', {
        title: "User Account",
        user: user
    });
});

module.exports = router;