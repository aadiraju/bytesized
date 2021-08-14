const express = require('express');
const exphbs = require('express-handlebars');
const session = require('express-session')

let index = require('./routes/index');
let loadData = require('./routes/loaddata');
let listOrder = require('./routes/listorder');
let listProd = require('./routes/listprod');
let addCart = require('./routes/addcart');
let updateCart = require('./routes/updateCart');
let removeCart = require('./routes/removeCart');
let showCart = require('./routes/showcart');
let checkout = require('./routes/checkout');
let order = require('./routes/order');
let customerAuth = require('./routes/customerAuth');
let login = require('./routes/login');
let validateLogin = require('./routes/validateLogin');
let logout = require('./routes/logout');
let admin = require('./routes/admin');
let product = require('./routes/product');
let review = require('./routes/review');
let displayImage = require('./routes/displayImage');
let customer = require('./routes/customer');
let ship = require('./routes/ship');
let createAcc = require('./routes/createAcc');
let newAccFormValidation = require('./routes/newAccFormValidation');
let userAcc = require('./routes/userAcc');
let editInfo = require('./routes/editInfo');
let updateUserInfo = require('./routes/updateUserInfo');
let listCustOrders = require('./routes/listCustOrders');

const app = express();

// This DB Config is accessible globally
dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    server: '10.7.112.4',
    database: process.env.DB_NAME,
    port: 1433,
    options: {
        'enableArithAbort': true,
        'encrypt': false,
    }
}
// Setting up the session.
// This uses MemoryStorage which is not
// recommended for production use.
app.use(session({
    secret: 'COSC 304 Rules!',
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: false,
        secure: false,
        maxAge: 60000,
    }
}))

// Setting up the rendering engine
app.engine('handlebars', exphbs());
app.set('view engine', 'handlebars');

app.use(express.static(__dirname + '/public'));

// Setting up Express.js routes.
// These present a "route" on the URL of the site.
// Eg: http://127.0.0.1/loaddata
app.use('/', index);
app.use('/loaddata', loadData);
app.use('/listorder', listOrder);
app.use('/listprod', listProd);
app.use('/addcart', addCart);
app.use('/updateCart', updateCart);
app.use('/removeCart', removeCart);
app.use('/showcart', showCart);
app.use('/checkout', checkout);
app.use('/customerAuth', customerAuth);
app.use('/order', order);
app.use('/login', login);
app.use('/validateLogin', validateLogin);
app.use('/logout', logout);
app.use('/admin', admin);
app.use('/product', product);
app.use('/review', review);
app.use('/displayImage', displayImage);
app.use('/customer', customer);
app.use('/ship', ship);
app.use('/createAcc', createAcc);
app.use('/newAccFormValidation', newAccFormValidation);
app.use('/userAcc', userAcc);
app.use('/editInfo', editInfo);
app.use('/updateUserInfo', updateUserInfo);
app.use('/listCustOrders', listCustOrders);

// Starting our Express app
app.listen(process.env.PORT || 3000)
