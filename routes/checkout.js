const express = require('express');
const router = express.Router();

router.get('/', function (req, res, next) {
    let invalid = req.session.invalidPassword ? req.session.invalidPassword : false;

    res.render('checkout', {
        title: 'Bytesized Checkout',
        invalid: invalid
    });
});

module.exports = router;
