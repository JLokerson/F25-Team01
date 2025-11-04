//This file is for admin related database api calls.
const db = require('./db'); //shared database connection pool
const user = require('./userAPI');
const fs = require('fs').promises;
const path = require('path');
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


async function toggleSponsorUserActivity(SponsorID) {
    try {

        // First get the UserID associated with this sponsor
        const getUserQuery = "SELECT SPONSOR_USER.SponsorUserID FROM SPONSOR_USER WHERE SponsorID = ?";
        const driverResult = await db.executeQuery(getUserQuery, [driverID]);
        
        if (driverResult.length === 0) {
            throw new Error("Sponsor User not found");
        }
        
        const userID = driverResult[0].UserID;
        
        // Mark account as disabled on User table
        console.log("Toggling activity of sponsor user with SponsorID:", driverID);
        const deleteDriverQuery = "call ToggleAccountActivity(?)";
        await db.executeQuery(deleteDriverQuery, [userID]);
        
        console.log("Sponsor User disabled/enabled successfully.");
        return result;
    } catch (error) {
        console.error("Failed to toggle sponsor user:", error);
        throw error;
    }
}

async function toggleSponsorActivity(SponsorID) {
    try {
        
        // Mark account as disabled on User table
        console.log("Toggling activity of sponsor user with SponsorID:", SponsorID);
        const deleteDriverQuery = "call ToggleSponsorEnabled(?)";
        await db.executeQuery(deleteDriverQuery, [SponsorID]);
        
        console.log("Sponsor disabled/enabled successfully.");
        return result;
    } catch (error) {
        console.error("Failed to toggle sponsor:", error);
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

/**
 * Get the sponsor record associated with a given UserID
 * Expects: /getSponsorForUser?UserID=123
 * This is ABSOLUTELY TEMPORARY until we implement proper authentication and sesh management
 */
router.get("/getSponsorForUser", async (req, res, next) => {
    const userID = req.query.UserID;

    if (!userID) {
        return res.status(400).json({ message: 'UserID required' });
    }

    try {
        const sql = `SELECT S.* FROM SPONSOR_USER SU INNER JOIN SPONSOR S ON SU.SponsorID = S.SponsorID WHERE SU.UserID = ?`;
        const rows = await db.executeQuery(sql, [userID]);
        if (rows && rows.length > 0) {
            res.json(rows[0]);
        } else {
            res.status(404).json({ message: 'Sponsor not found for user' });
        }
    } catch (error) {
        console.error('Error in getSponsorForUser:', error);
        res.status(500).send('Database error.');
    }
});

/**
 * Return the catalog JSON for a sponsor by SponsorID.
 * Mapping is defined here (can be moved to DB later).
 * Expects: /getCatalogForSponsor?SponsorID=1
 */
router.get("/getCatalogForSponsor", async (req, res, next) => {
    const sponsorID = req.query.SponsorID;
    if (!sponsorID) return res.status(400).json({ message: 'SponsorID required' });

    // hardcoded mapping based on current DB sample sponsors, this is TEMPORARY
    const mapping = {
        '1': 'sponsor1_catalog.json', // RandTruckCompany
        '3': 'sponsor2_catalog.json', // CoolTruckCompany
        '4': 'sponsor3_catalog.json'  // AwesomeTruckCompany
    };

    const filename = mapping[String(sponsorID)];
    if (!filename) {
        return res.status(404).json({ message: 'No catalog mapped for this sponsor' });
    }

    try {
        const filePath = path.resolve(__dirname, '../../client/src/content/json-assets', filename);
        const fileContents = await fs.readFile(filePath, 'utf8');
        const json = JSON.parse(fileContents);
        res.json(json);
    } catch (error) {
        console.error('Error reading catalog file:', error);
        res.status(500).json({ message: 'Failed to read catalog file' });
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

/**
 * Update product price in sponsor catalog JSON.
 * Expects JSON body: { SponsorID, ITEM_ID, newPrice }
 * This is VERY TEMPORARY and insecure, just to demonstrate updating the JSON file
 * Demo directions:
 *      URL: http://localhost:4000/sponsorAPI/updateProductPrice
 */
router.post('/updateProductPrice', async (req, res, next) => {
    try {
        const source = (req.body && Object.keys(req.body).length > 0) ? req.body : req.query;
        const SponsorID = source.SponsorID;
        const ITEM_ID = Number(source.ITEM_ID);
        const newPrice = Number(source.newPrice);

        if (!SponsorID || !ITEM_ID || isNaN(newPrice)) {
            return res.status(400).json({ message: 'SponsorID, ITEM_ID and newPrice are required and must be valid' });
        }

        const mapping = {
            '1': 'sponsor1_catalog.json',
            '3': 'sponsor2_catalog.json',
            '4': 'sponsor3_catalog.json'
        };

        const filename = mapping[String(SponsorID)];
        if (!filename) return res.status(404).json({ message: 'No catalog mapped for this sponsor' });

        const filePath = path.resolve(__dirname, '../../client/src/content/json-assets', filename);
        const fileContents = await fs.readFile(filePath, 'utf8');
        const json = JSON.parse(fileContents);

        const idx = json.findIndex(it => Number(it.ITEM_ID) === ITEM_ID);
        if (idx === -1) return res.status(404).json({ message: 'Item not found in catalog' });

        json[idx].ITEM_PRICE = newPrice;

        // write back
        await fs.writeFile(filePath, JSON.stringify(json, null, 4), 'utf8');

        res.json({ message: 'Price updated', item: json[idx] });
    } catch (error) {
        console.error('Error in updateProductPrice:', error);
        res.status(500).json({ message: 'Failed to update product price' });
    }
});

// Add a simple debug route for testing
router.get("/debug", (req, res) => {
    console.log('Debug route hit successfully');
    res.json({ 
        message: 'SponsorAPI debug route working',
        timestamp: new Date().toISOString(),
        routes: 'All routes functional'
    });
});

router.post("/toggleSponsorUserActivity/:sponsorID", async (req, res, next) => {
    const sponsorID = req.params.sponsorID;
    console.log('Received disable request for sponsor ID:', sponsorID);
    try {
        const result = await toggleSponsorUserActivity(sponsorID);
        res.status(200).json({ message: 'Sponsor user activity toggled successfully!' });
    } catch (error) {
        console.error('Error toggling activity for sponsor user:', error);
        res.status(500).send('Error toggling activity for sponsor user.');
    }
});

router.post("/toggleSponsorActivity/:sponsorID", async (req, res, next) => {
    const sponsorID = req.params.sponsorID;
    console.log('Received disable request for sponsor ID:', sponsorID);
    try {
        const result = await toggleSponsorActivity(sponsorID);
        res.status(200).json({ message: 'Sponsor activity toggled successfully!' });
    } catch (error) {
        console.error('Error toggling activity for sponsor:', error);
        res.status(500).send('Error toggling activity for sponsor.');
    }
});

module.exports={router};
