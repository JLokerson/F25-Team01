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
            console.log("Empty cart.");
            return null;
        }
    } catch (error) {
        console.error("Failed to get cart items:", error);
        throw error;
    }
}

async function AddToCart(data) {
    try {
        console.log("Inserting new entry to CART_MAPPINGS table");
        console.log(data);
        const sql = "INSERT INTO CART_MAPPINGS (DriverID, ProductID) VALUES (?, ?)";
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

var express = require("express");
var router=express.Router();


router.get("/getCartItems", async (req, res, next) => {
    try {
        const cart = await getCartItems(req.query);
        if (cart) {
            res.json(cart);
        } else {
            res.status(404).json({ message: 'Cart not found or bad query parameters.' });
        }
    } catch (error) {
        res.status(500).send('Database error.');
    }
});

router.post("/addCartItem", async (req, res, next) => {
    const data = req.query;
    console.log('Received POST data for new cart item: ', data);
    try {
        const result = await AddToCart(data);
        res.status(200).json({ message: 'Cart item added successfully!', id: result.insertId });
    } catch (error) {
        res.status(500).send('Error adding cart item user.');
    }
});

module.exports={router};