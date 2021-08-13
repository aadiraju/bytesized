const express = require('express');
const router = express.Router();
const auth = require('../auth');
const sql = require('mssql');

router.get('/', function (req, res, next) {

    res.render('userAcc', {
        title: "User Account",
        username: req.session.authenticatedUser,
        updateAccMessage: req.session.updateAccMessage
    });
});

module.exports = router;
