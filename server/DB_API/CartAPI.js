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
}

async function AddToCart(params) {
    try {
        console.log("Inserting new entry to CART_MAPPINGS table");
        console.log(data);
        const sql = "INSERT INTO USER (DriverID, ProductID) VALUES (?, ?)";
        const values = [data.DriverID, data.ProductID];

        const result = await db.executeQuery(sql, values);

        console.log("Record inserted, ID: " + result.insertId);
        return result; 
    }
    catch (error) {
        console.error("Failed to add new cart mapping:", error);
        throw error;
    }
}

// Returns all mappings for a specific item, useful in case we want statistics
// on item popularity that we can present to sponsors when editing the catalog.
async function GetCartsFromItems(params){
    let sql;
    let values;

    // Prioritize searching by UserID if it's provided.
    if (data.ProductID) {
        console.log(`Querying CART_MAPPINGS by ProductID: ${data.ProductID}`);
        sql = "SELECT * FROM CART_MAPPINGS WHERE ProductID = ?";
        values = [data.ProductID];
    }

    try {
        const cartitems = await db.executeQuery(sql, values);
        if (cartitems.length > 0) {
            console.log("Found " + cartitems.length + " items for Product " + data.ProductID);
            return cartitems; // users[0] Return the first user found (should be unique by ID or email combo)
        } else {
            cartitems.log("Empty cart.");
            return null;
        }
    } catch (error) {
        console.error("Failed to get cart items:", error);
        throw error;
    }
}