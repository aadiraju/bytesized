const express = require('express');
const router = express.Router();

router.get('/', function(req, res, next) {
    res.setHeader('Content-Type', 'text/html');

    (async function () {
        return [];
    })().then(() => {
        res.render('checkout', {
            title: 'Bytesized Checkout'
        });
    })
        .catch(err => {
            console.dir(err);
            res.send(err);
        });
});

module.exports = router;
