const sql = require('mssql');

const addToCart = async (id, name, price, pool, session) => {
    // If the product list isn't set in the session,
    // create a new list.
    let productList = false;
    if (!session.productList) {
        productList = [];
    } else {
        productList = session.productList;
    }

    // Update quantity if add same item to order again
    if (productList[id]) {
        await updateQtyInCart(productList[id], productList[id].quantity + 1, pool, session);
    } else {
        productList[id] = {
            "id": id,
            "name": name,
            "price": price,
            "quantity": 1,
            "subtotal": price
        };
    }

    session.productList = productList;

    // If user not logged in, no need to update DB
    if (!session.authenticatedUser) {
        return;
    }

    //TODO: either update DB here, or make another method that updates DB with current product list and call that new method here
};

const removeFromCart = async (id, pool, session) => {
    // If the product list isn't set in the session,
    // create a new list.
    let productList = session.productList;
    if (productList[id])
        delete productList[id];

    session.productList = productList;

    // If user not logged in, no need to update DB
    if (!session.authenticatedUser) {
        return;
    }

    //TODO: either update DB here, or make another method that deletes the product from inCart and call that new method here
};

const updateQtyInCart = async (id, newQty, pool, session) => {

    let productList = session.productList;

    //update only if newQty is a valid non-negative number
    if (newQty < 0 || !Number.isInteger(newQty))
        return;

    if (productList[id] && productList[id].quantity !== newQty) {
        productList[id].quantity = newQty;
        productList[id].subtotal = productList[id].price * productList[id].quantity;
        if (newQty === 0) {
            // If new quantity entered is 0, just delete it from the cart
            session.productList = productList;
            await removeFromCart(id, pool, session);
            return;
        }
    } else {
        return;
    }
    session.productList = productList;

    // If user not logged in, no need to update DB
    if (!session.authenticatedUser) {
        return;
    }

    //TODO: either update DB here, or make another method that updates the product quantity from inCart and call that new method here
    return;
};

//Fetches the cart from the database
const getDBCart = async (pool, session) => {
    if (!session.authenticatedUser) {
        return;
    }
    let username = session.authenticatedUser;

    // Query DB for an existing cart
    let cartQuery = `
        select incart.productId AS id, quantity, price, name, (price * quantity) AS subtotal
        from incart
        where userId = @username
    `;
    const preppedSql = new sql.PreparedStatement(pool);
    preppedSql.input("username", sql.VarChar);
    await preppedSql.prepare(cartQuery);
    let results = await preppedSql.execute({username: username});
    let dbCart = results.recordset;

    if (dbCart.length === 0) { // If there are no values returned from cart
        return;
    }
    // Create the product list as last saved
    let dbProducts = [];
    for (let dbProd of dbCart) {
        if (!dbProd) {
            continue;
        }
        dbProducts[dbProd.id] = {
            "id": dbProd.id,
            "name": dbProd.name,
            "price": dbProd.price,
            "quantity": dbProd.quantity,
            "subtotal": dbProd.subtotal,
        };
    }
    return dbProducts;
};

//Load cart from DB on login
const loadCartFromDB = async (pool, session) => {
        if (!session.authenticatedUser) {
            return;
        }

        let dbCart = await getDBCart(pool, session);
        if (!dbCart) {
            //Save any residual cart before login into DB
            if (session.productList) {
                for (let product of session.productList) {
                    if (!product) {
                        continue;
                    }
                    //TODO: Add each item into the DB using the DB add method
                }
            }
        } else {
            //if there is a cart stored in DB overwrite the current cart before login and just use DB cart
            session.productList = dbCart;
        }
    }
;

// After checkout, delete the cart since the order has been placed
const eraseCart = async (pool, session) => {
    session.productList = [];
    if (session.authenticatedUser) {
        return;
    }
    // erase cart from DB if user is logged in
    let eraseCartSql = `
        DELETE
        FROM incart
        WHERE incart.userId = @userid
    `;
    const preppedSql = new sql.PreparedStatement(pool);
    preppedSql.input("userid", sql.VarChar);
    await preppedSql.prepare(eraseCartSql);
    await preppedSql.execute({userid: session.authenticatedUser});
};

module.exports = {
    addToCart,
    removeFromCart,
    updateQtyInCart,
    loadCartFromDB,
    eraseCart
};
