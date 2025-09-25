const db = require('./db');

async function getCartItems(data){
    let sql;
    let values;

    // Prioritize searching by UserID if it's provided.
    if (data.DriverID) {
        console.log(`Querying CART_MAPPINGS by DriverID: ${data.DriverID}`);
        sql = "SELECT * FROM CART_MAPPINGS WHERE DriverID = ?";
        values = [data.DriverID];
    }

    try {
        const cartitems = await db.executeQuery(sql, values);
        if (cartitems.length > 0) {
            console.log("Found " + cartitems.length + " items for Driver " + data.DriverID);
            return cartitems; // users[0] Return the first user found (should be unique by ID or email combo)
        } else {
            cartitems.log("Empty cart.");
            return null;
        }
    } catch (error) {
        console.error("Failed to get cart items:", error);
        throw error;
    }

    return values;
}