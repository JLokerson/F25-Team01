//This file is for admin related database api calls.
const db = require('./db'); //shared database connection pool
const user = require('./userAPI');
/**
 * Retrieves all Sponsors.
 * @returns {Promise<Array<Object>>} A promise that resolves with an array of sponsor objects.
 */
async function getAllSponsors(){
    try {
        console.log("Reading all Sponsor info");
        
        const query = "SELECT * FROM SPONSOR";
        const allAdmins = await db.executeQuery(query);
        console.log("Returning %s Sponsors", allAdmins.length);
        return allAdmins;
    } catch (error) {
        console.error("Failed to get all sponsors: ", error);
        throw error;
    }
}

/**
 * Creates a new Sponsor.
 * @param {object} data - The Sponsor data to be added.
 * @returns {Promise<object>} A promise that resolves with the result of the sponsor table insertion.
 */
async function addSponsor(data) {
    try {
        console.log("Inserting new Company to Sponsor Table");
        console.log(data);
        const sql = "INSERT INTO SPONSOR (Name) VALUES (?)";
        const values = [data.Name];

        const result = await db.executeQuery(sql, values);

        console.log("Record inserted Sponsor, ID: " + result.insertId);
        return result; 
    }
    catch (error) {
        console.error("Failed to add new sponsor:", error);
        throw error;
    }
}

/**
 * Retrieves all Sponsor Users by joining the Sponsor User and User tables.
 * @returns {Promise<Array<Object>>} A promise that resolves with an array of admin user objects.
 */
async function getAllSponsorUsers(){
    try {
        console.log("Reading all sponsor user info");

        const query = "SELECT SPONSOR_USER.SponsorUserID, SPONSOR_USER.SponsorID,\
                        SPONSOR_USER.UserID, USER.FirstName, USER.LastName, USER.Email FROM SPONSOR_USER \
                        INNER JOIN USER ON SPONSOR_USER.USERID = USER.USERID;";
        const allSponsorUsers = await db.executeQuery(query);
        console.log("Returning %s Sponsor Users", allSponsorUsers.length);
        return allSponsorUsers;
    } catch (error) {
        console.error("Failed to get all sponsor users: ", error);
        throw error;
    }
}

/**
 * Creates a new sponsor user and then adds the corresponding UserID to the sponsor user table.
 * @param {object} data - The user data to be added.
 * @returns {Promise<object>} A promise that resolves with the result of the sponsor user table insertion.
 */
async function addSponsorUser(data) {
    try {
        const sponsorID = data.SponsorID;
        const userResult = await user.addNewUser(data);
        const newUserId = userResult.insertId;

        console.log("Adding new sponsor user with UserID:", newUserId);
        const sql = "INSERT INTO SPONSOR_USER (SponsorID, UserID) VALUES (?, ?)";
        const adminResult = await db.executeQuery(sql, [sponsorID, newUserId]);

        console.log("New sponsor user record created successfully.");
        return adminResult;
    } catch (error) {
        console.error("Failed to add new sponsor user:", error);
        throw error;
    }
}


var express = require("express");
var router=express.Router();


router.get("/getAllSponsors", async (req, res, next) => {
    try {
        const sponsors = await getAllSponsors();
        res.json(sponsors);
    } catch (error) {
        res.status(500).send('Database error.');
    }
});

router.post("/addSponsor", async (req, res, next) => {
    const data = req.query;
    console.log('Received POST data: ', data);
    try {
        const result = await addSponsor(data);
        res.status(200).json({ message: 'Sponsor added successfully!', id: result.insertId });
    } catch (error) {
        res.status(500).send('Error adding sponsor.');
    }
});

router.get("/getAllSponsorUsers", async (req, res, next) => {
    try {
        const sponsorUsers = await getAllSponsorUsers();
        res.json(sponsorUsers);
    } catch (error) {
        res.status(500).send('Database error.');
    }
});

router.post("/addSponsorUser", async (req, res, next) => {
    const data = req.query;
    console.log('Received POST data for new sponsor user: ', data);
    try {
        const result = await addSponsorUser(data);
        res.status(200).json({ message: 'Sponsor user added successfully!', id: result.insertId });
    } catch (error) {
        res.status(500).send('Error adding sponsor user.');
    }
});

module.exports={router};
