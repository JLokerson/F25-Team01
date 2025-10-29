//This file is for admin related database api calls.
const db = require('./db'); //shared database connection pool
const user = require('./userAPI');
/**
 * Retrieves all admins by joining the Admin and User tables.
 * @returns {Promise<Array<Object>>} A promise that resolves with an array of admin user objects.
 */
async function getAllAdmins(){
    try {
        console.log("Reading all admin user info");

        const query = "SELECT ADMIN.AdminID, ADMIN.UserID, USER.FirstName, USER.LastName, USER.Email FROM ADMIN \
                        INNER JOIN USER ON ADMIN.USERID = USER.USERID;";
        const allAdmins = await db.executeQuery(query);
        console.log("Returning %s Admins", allAdmins.length);
        return allAdmins;
    } catch (error) {
        console.error("Failed to get all admins: ", error);
        throw error;
    }
}

/**
 * Creates a new user and then adds the corresponding UserID to the Admin table.
 * @param {object} data - The user data to be added.
 * @returns {Promise<object>} A promise that resolves with the result of the admin table insertion.
 */
async function addAdmin(data) {
    try {
        const userResult = await user.addNewUser(data);
        const newUserId = userResult.insertId;

        console.log("Adding new admin with UserID:", newUserId);
        const sql = "INSERT INTO ADMIN (UserID) VALUES (?)";
        const adminResult = await db.executeQuery(sql, [newUserId]);

        console.log("New admin record created successfully.");
        return adminResult;
    } catch (error) {
        console.error("Failed to add new admin:", error);
        throw error;
    }
}


var express = require("express");
var router=express.Router();


router.get("/getAllAdmins", async (req, res, next) => {
    try {
        const admins = await getAllAdmins();
        res.json(admins);
    } catch (error) {
        res.status(500).send('Database error.');
    }
});

router.post("/addAdmin", async (req, res, next) => {
    const data = req.query;
    console.log('Received POST data for new admin: ', data);
    try {
        const result = await addAdmin(data);
        res.status(200).json({ message: 'Admin user added successfully!', id: result.insertId });
    } catch (error) {
        res.status(500).send('Error adding admin user.');
    }
});

module.exports={router};
