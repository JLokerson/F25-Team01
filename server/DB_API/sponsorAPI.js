//This file is for sponsor related database api calls.
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
        const allSponsors = await db.executeQuery(query);
        console.log("Returning %s Sponsors", allSponsors.length);
        return allSponsors;
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
 * @returns {Promise<Array<Object>>} A promise that resolves with an array of sponsor user objects.
 */
async function getAllSponsorUsers(){
    try {
        console.log("Reading all sponsor user info");

        // This and other bulk SElECT operations should never retrieve password information. 
        // Password retrieval removed when spotted due to merge conflict.
        const query = `
            SELECT 
                SPONSOR_USER.SponsorUserID, 
                SPONSOR_USER.SponsorID,
                SPONSOR_USER.UserID, 
                USER.FirstName, 
                USER.LastName, 
                USER.Email,
                USER.UserType,
                USER.LastLogin,
                COALESCE(USER.ActiveAccount, 1) as ActiveAccount
            FROM SPONSOR_USER 
            INNER JOIN USER ON SPONSOR_USER.USERID = USER.USERID
            ORDER BY SPONSOR_USER.SponsorUserID
        `;
        
        const allSponsorUsers = await db.executeQuery(query);
        console.log("Returning %s Sponsor Users", allSponsorUsers.length);
        console.log("Sample sponsor user record:", allSponsorUsers[0] ? JSON.stringify(allSponsorUsers[0], null, 2) : "No sponsor users found");
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
        const result = await db.executeQuery(sql, [sponsorID, newUserId]);

        console.log("New sponsor user record created successfully.");
        return result;
    } catch (error) {
        console.error("Failed to add new sponsor user:", error);
        throw error;
    }
}

/**
 * Updates a sponsor user's information using the same pattern as driverAPI.
 * @param {object} data - The updated sponsor user data.
 * @returns {Promise<object>} A promise that resolves with the result of the update operation.
 */
async function updateSponsorUser(data) {
    try {
        const { UserID, FirstName, LastName, Email, Password, PasswordSalt } = data;
        
        let sql = "UPDATE USER SET FirstName = ?, LastName = ?, Email = ?";
        let values = [FirstName, LastName, Email];
        
        // Only update password if provided (same as driverAPI)
        if (Password && Password.trim() !== '') {
            sql += ", Password = ?, PasswordSalt = ?";
            values.push(Password, PasswordSalt || 'updated-salt');
        }
        
        sql += " WHERE UserID = ?";
        values.push(UserID);
        
        console.log("Updating sponsor user with UserID:", UserID);
        const result = await db.executeQuery(sql, values);
        
        // Update the sponsor_user table if SponsorID changed
        if (data.SponsorID) {
            const sponsorUpdateSql = "UPDATE SPONSOR_USER SET SponsorID = ? WHERE UserID = ?";
            await db.executeQuery(sponsorUpdateSql, [data.SponsorID, data.UserID]);
        }
        
        console.log("Sponsor user updated successfully.");
        return result;
    } catch (error) {
        console.error("Failed to update sponsor user:", error);
        throw error;
    }
}

/**
 * Removes a sponsor user from both SPONSOR_USER and USER tables.
 * @param {number} sponsorUserID - The SponsorUserID to remove.
 * @returns {Promise<object>} A promise that resolves with the result of the deletion.
 */
async function removeSponsorUser(sponsorUserID) {
    try {
        console.log("Removing sponsor user with SponsorUserID:", sponsorUserID);
        
        // First get the UserID
        const getUserSql = "SELECT UserID FROM SPONSOR_USER WHERE SponsorUserID = ?";
        const userResult = await db.executeQuery(getUserSql, [sponsorUserID]);
        
        if (userResult.length === 0) {
            throw new Error("Sponsor user not found");
        }
        
        const userID = userResult[0].UserID;
        
        // Delete from SPONSOR_USER table first (foreign key constraint)
        const deleteSponsorUserSql = "DELETE FROM SPONSOR_USER WHERE SponsorUserID = ?";
        await db.executeQuery(deleteSponsorUserSql, [sponsorUserID]);
        
        // Then delete from USER table
        const deleteUserSql = "DELETE FROM USER WHERE UserID = ?";
        const result = await db.executeQuery(deleteUserSql, [userID]);
        
        console.log("Sponsor user removed successfully.");
        return result;
    } catch (error) {
        console.error("Failed to remove sponsor user:", error);
        throw error;
    }
}

// Replacement for removeDriver, removeDriver left for consistency.
async function toggleSponsorUserActivity(SponsorID) {
    try {

        // First get the UserID associated with this driver
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


var express = require("express");
var router = express.Router();

// Ensure JSON body parsing for all routes in this router (same as driverAPI)
router.use(express.json());

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
 * Expects: /getCatalogForSponsor?SponsorID=1
 */
router.get("/getCatalogForSponsor", async (req, res, next) => {
    const sponsorID = req.query.SponsorID;
    if (!sponsorID) return res.status(400).json({ message: 'SponsorID required' });

    // hardcoded mapping based on current DB sample sponsors
    const mapping = {
        '1': 'sponsor1_catalog.json',
        '3': 'sponsor2_catalog.json',
        '4': 'sponsor3_catalog.json'
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
    // Prefer body, fallback to query for compatibility (same as driverAPI)
    const data = (req.body && Object.keys(req.body).length > 0) ? req.body : req.query;
    console.log('Received POST data for new sponsor user: ', data);
    try {
        const result = await addSponsorUser(data);
        res.status(200).json({ message: 'Sponsor user added successfully!', id: result.insertId });
    } catch (error) {
        res.status(500).send('Error adding sponsor user.');
    }
});

router.post("/updateSponsorUser", async (req, res, next) => {
    console.log('Received POST request body:', req.body);
    console.log('Received POST request query:', req.query);

    // Prefer body, fallback to query for compatibility (EXACT same as driverAPI)
    const data = (req.body && Object.keys(req.body).length > 0) ? req.body : req.query;

    console.log('Processing update sponsor user data:', data);

    if (!data.UserID) {
        return res.status(400).json({ message: 'UserID is required' });
    }

    try {
        const result = await updateSponsorUser(data);
        res.status(200).json({ message: 'Sponsor user updated successfully!' });
    } catch (error) {
        console.error('Error updating sponsor user:', error);
        res.status(500).json({ message: 'Error updating sponsor user.', error: error.message });
    }
});

router.delete("/removeSponsorUser/:sponsorUserID", async (req, res, next) => {
    const sponsorUserID = req.params.sponsorUserID;
    console.log('Received DELETE request for sponsor user ID:', sponsorUserID);
    try {
        const result = await removeSponsorUser(sponsorUserID);
        res.status(200).json({ message: 'Sponsor user removed successfully!' });
    } catch (error) {
        console.error('Error removing sponsor user:', error);
        res.status(500).send('Error removing sponsor user.');
    }
});

/**
 * Update product price in sponsor catalog JSON.
 * Expects JSON body: { SponsorID, ITEM_ID, newPrice }
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


module.exports = {router};
router.delete("/toggleDriverActivity/:driverID", async (req, res, next) => {
    
    const driverID = req.params.driverID;
    console.log('Received disable request for driver ID:', driverID);
    try {
        const result = await toggleDriverActivity(driverID);
        res.status(200).json({ message: 'Driver activity toggled successfully!' });
    } catch (error) {
        console.error('Error toggling activity for driver:', error);
        res.status(500).send('Error toggling activity for driver.');
    }
});

module.exports={router};
