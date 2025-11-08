//This file is for admin related database api calls.
const db = require('./db'); //shared database connection pool
const user = require('./userAPI');


/**
 * Gets all categories from the CATALOG database for a sponsor
 * @param {int} sponsorID - An int repersenting sponsorID.
 * @returns {Promise<object|null>} All sponsor categories object if found, otherwise null.
 */
async function getAllCategories(sponsorID){
    try{
        console.log("Reading all category info from ", sponsorID);
        const allCategories = await db.executeQuery("SELECT * from USER WHERE SponsorID = " + sponsorID);
        console.log("Returning %s Categories", allCategories.length);
        return allCategories;
    }
    catch (error) {
        console.error("Failed to get all users: ", error);
        throw error;
    }
}



/**
 * Add catalog catagory id
 * @param {data|int} data - Object with SponsorID and CategoryID.
 * @returns {Promise<object|null>} Adds category for sponsor.
 */
async function AddCatalogCategory(data){
    let sql;
    let values;

    try {
        sql = "INSERT INTO ORDERS (SponsorID, CategoryID) VALUES (?, ?)";
        values = [data.SponsorID, data.CategoryID];
        const result = await db.executeQuery(sql, values);
        return result; 
    }
    catch (error) {
        console.error("Database query failed:", error);
        throw error;
    }
}


// Disable/Enable Catalog item
async function SetCategoryState(data){
    if (!data.SponsorID || !data.CategoryID || !data.Active) {
        throw new Error("Catalog Disable Input Params Missing");
    }

    try {
        // Update Active to 0 (false)
        const sql = "UPDATE CATALOG SET Active = ? WHERE SponsorID = ? AND CategoryID = ?";
        const values = [data.Active, data.SponsorID, data.CategoryID];
        const result = await db.executeQuery(sql, values);
        return result;
    } catch (error) {
        console.error("Failed to update order status:", error);
        throw error;
    }
}


var express = require("express");
var router=express.Router();


router.get("/getAllCategories", async (req, res, next) => {
    const data = req.query;
    console.log('Received POST data for category GET: ', data);
    try {
        const result = await getAllCategories(data);
        res.status(200).json({ message: 'Category item added successfully!', id: result.insertId });
    } catch (error) {
        res.status(500).send('Error getting category items.');
    }
});

router.post("/addCategory", async (req, res, next) => {
    const data = req.query;
    console.log('Received POST data: ', data);
    try {
        const result = await AddCatalogCategory(data);
        res.status(200).json({ message: 'Category added successfully!', id: result.insertId });
    } catch (error) {
        res.status(500).send('Error adding category.');
    }
});

router.post("/updateCategoryStatus", async (req, res, next) => {
    const data = req.query;
    console.log('Received POST data: ', data);
    try {
        const result = await SetCategoryState(data);
        res.status(200).json({ message: 'Category updated successfully!', id: result.insertId });
    } catch (error) {
        res.status(500).send('Error updating category.');
    }
});

module.exports={router};