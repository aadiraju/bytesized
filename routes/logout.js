const express = require('express');
const router = express.Router();

router.get('/', function (req, res, next) {
    req.session.authenticatedUser = false;
    req.session.productList = [];
    res.redirect("/");
});

module.exports = router;
