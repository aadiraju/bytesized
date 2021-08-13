const express = require('express');
const router = express.Router();

router.get('/', function(req, res, next) {
    // Set the message for the login, if present
    let createAccMessage = false;
    if (req.session.createAccMessage) {
        createAccMessage = req.session.createAccMessage;
        req.session.createAccMessage = false;
    }

    res.render('newAccForm', {
        title: "Create an Account",
        username: req.session.authenticatedUser,
        createAccMessage: createAccMessage
    });
});

module.exports = router;
