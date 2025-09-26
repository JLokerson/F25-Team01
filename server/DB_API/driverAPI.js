//This file is for admin related database api calls.
const db = require('./db'); //shared database connection pool
const user = require('./userAPI');
/**
 * Retrieves all admins by joining the Driver and User tables.
 * @returns {Promise<Array<Object>>} A promise that resolves with an array of admin user objects.
 */
async function getAllDrivers(){
    try {
        console.log("Reading all driver user info");

        const query = "SELECT DRIVER.DriverID, DRIVER.SponsorID, DRIVER.UserID, USER.FirstName, USER.LastName, USER.Email FROM DRIVER \
                        INNER JOIN USER ON DRIVER.USERID = USER.USERID;";
        const allDrivers = await db.executeQuery(query);
        console.log("Returning %s Drivers", allDrivers.length);
        return allDrivers;
    } catch (error) {
        console.error("Failed to get all drivers: ", error);
        throw error;
    }
}

/**
 * Creates a new driver user and then adds the corresponding UserID to the Driver table.
 * @param {object} data - The user data to be added.
 * @returns {Promise<object>} A promise that resolves with the result of the driver table insertion.
 */
async function addDriver(data) {
    try {
        const sponsorID = data.SponsorID;
        const userResult = await user.addNewUser(data);
        const newUserId = userResult.insertId;

        console.log("Adding new driver with UserID:", newUserId);
        const sql = "INSERT INTO DRIVER (SponsorID, UserID) VALUES (?, ?)";
        const adminResult = await db.executeQuery(sql, [sponsorID, newUserId]);

        console.log("New driver record created successfully.");
        return adminResult;
    } catch (error) {
        console.error("Failed to add new driver:", error);
        throw error;
    }
}


var express = require("express");
var router=express.Router();


router.get("/getAllDrivers", async (req, res, next) => {
    try {
        const admins = await getAllDrivers();
        res.json(admins);
    } catch (error) {
        res.status(500).send('Database error.');
    }
});

router.post("/addDriver", async (req, res, next) => {
    const data = req.query;
    console.log('Received POST data for new driver: ', data);
    try {
        const result = await addDriver(data);
        res.status(200).json({ message: 'Driver user added successfully!', id: result.insertId });
    } catch (error) {
        res.status(500).send('Error adding driver user.');
    }
});

module.exports={router};
