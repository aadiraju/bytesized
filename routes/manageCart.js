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

    // Add item to cart in database
    let pool = await sql.connect(dbConfig);

    let addDB = `INSERT INTO incart (userId, productId, quantity, price, name)
                VALUES (@userId, @productId, @quantity, @price, @name)`;
    let preppedSql = new sql.PreparedStatement(pool);
    preppedSql.input('userId', sql.VarChar(20));
    preppedSql.input('productId', sql.Int);
    preppedSql.input('quantity', sql.Int);
    preppedSql.input('price', sql.Decimal(10, 2));
    preppedSql.input('name', sql.VarChar(200));
    await preppedSql.prepare(addDB);

    await preppedSql.execute({ userId: session.userid, productId: id, quantity: 1, price: price, name: name });
    pool.close();
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

    // Delete item from cart in database
    let pool = await sql.connect(dbConfig);

    let removeDB = `DELETE FROM incart WHERE userId = @userId AND productId = @productId`;
    let preppedSql = new sql.PreparedStatement(pool);
    preppedSql.input('userId', sql.VarChar(20));
    preppedSql.input('productId', sql.Int);
    await preppedSql.prepare(removeDB);

    await preppedSql.execute({ userId: session.userid, productId: id });
    pool.close();
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

    // Update item in cart in database
    let pool = await sql.connect(dbConfig);

    let updateDB = `UPDATE incart SET quantity = @quantity WHERE userId = @userId AND productId = @productId`;
    let preppedSql = new sql.PreparedStatement(pool);
    preppedSql.input('quantity', sql.Int);
    preppedSql.input('userId', sql.VarChar(20));
    preppedSql.input('productId', sql.Int);
    await preppedSql.prepare(updateDB);

    await preppedSql.execute({ quantity: newQty, userId: session.userid, productId: id });
    pool.close();
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
    let results = await preppedSql.execute({ username: username });
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
}

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
                // Add each item into the DB using the DB add method
                addToCart = async (product.id, product.name, product.price, pool, session)
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
    await preppedSql.execute({ userid: session.authenticatedUser });
};

module.exports = {
    addToCart,
    removeFromCart,
    updateQtyInCart,
    loadCartFromDB,
    eraseCart
};
