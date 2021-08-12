const express = require('express');
const router = express.Router();
const auth = require('../auth');
const sql = require('mssql');

router.get('/', function(req, res, next) {
    let updateAccMessage = false;
    if (req.session.updateAccMessage) {
        updateAccMessage = req.session.updateAccMessage;
        req.session.updateAccMessage = false;
    }

    res.render('updateAccForm', {
        title: "Update Account Info",
        updateAccMessage: updateAccMessage
    });
});

module.exports = router;