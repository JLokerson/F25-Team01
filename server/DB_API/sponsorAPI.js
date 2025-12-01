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
        
        // Handle both Name only and full sponsor data
        let sql, values;
        if (data.PointRatio !== undefined && data.EnabledSponsor !== undefined) {
            // Full sponsor organization with all fields
            sql = "INSERT INTO SPONSOR (Name, PointRatio, EnabledSponsor) VALUES (?, ?, ?)";
            values = [data.Name, data.PointRatio, data.EnabledSponsor];
        } else {
            // Simple sponsor with just name (for backward compatibility)
            sql = "INSERT INTO SPONSOR (Name) VALUES (?)";
            values = [data.Name];
        }

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
        console.log("Reading all sponsor user info (including inactive accounts)");

        const query = "SELECT SPONSOR_USER.SponsorUserID, SPONSOR_USER.SponsorID,\
                        SPONSOR_USER.UserID, USER.FirstName, USER.LastName, USER.Email, USER.ActiveAccount FROM SPONSOR_USER \
                        INNER JOIN USER ON SPONSOR_USER.USERID = USER.USERID;";
        const allSponsorUsers = await db.executeQuery(query);
        console.log("Returning %s Sponsor Users (including inactive)", allSponsorUsers.length);
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
    console.log('Request body:', req.body);
    console.log('Request query:', req.query);
    
    // Use req.body directly since it's being parsed correctly
    const data = req.body;
    
    // Fallback to query if body is empty (for backward compatibility)
    if (!data || Object.keys(data).length === 0) {
        data = req.query;
    }
    
    console.log('Final data being used:', data);
    
    try {
        const result = await addSponsor(data);
        res.status(200).json({ message: 'Sponsor added successfully!', id: result.insertId });
    } catch (error) {
        console.error('Error in addSponsor route:', error);
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
 *      or https://63iutwxr2owp72oyfbetwyluaq0wakdm.lambda-url.us-east-1.on.aws/sponsorAPI/updateProductPrice
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

// Add debug routes for testing - works with localhost
router.get("/testDriverSponsorMappings", async (req, res, next) => {
    try {
        console.log("Testing DRIVER_SPONSOR_MAPPINGS table access");
        console.log("Request from:", req.get('host')); // Shows if localhost or AWS
        
        // Test basic table access with multiple variations
        const queries = [
            "SELECT * FROM Team01_DB.DRIVER_SPONSOR_MAPPINGS LIMIT 5",
            "SELECT * FROM DRIVER_SPONSOR_MAPPINGS LIMIT 5"
        ];
        
        let result = null;
        let usedQuery = "";
        
        for (const query of queries) {
            try {
                console.log("Trying query:", query);
                result = await db.executeQuery(query);
                usedQuery = query;
                console.log("SUCCESS with query:", query);
                break;
            } catch (error) {
                console.log("FAILED with query:", query, "Error:", error.message);
            }
        }
        
        if (result === null) {
            throw new Error("All queries failed - table may not exist");
        }
        
        console.log("Final query result:", result);
        console.log("Number of records found:", result.length);
        
        if (result.length > 0) {
            console.log("Sample record:", result[0]);
            console.log("Available columns:", Object.keys(result[0]));
        }
        
        res.json({
            success: true,
            recordCount: result.length,
            sampleData: result,
            queryUsed: usedQuery,
            message: "DRIVER_SPONSOR_MAPPINGS table accessed successfully",
            serverInfo: {
                host: req.get('host'),
                isLocalhost: req.get('host').includes('localhost') || req.get('host').includes('127.0.0.1')
            }
        });
    } catch (error) {
        console.error("Error testing DRIVER_SPONSOR_MAPPINGS table:", error);
        res.status(500).json({
            success: false,
            error: error.message,
            message: "Failed to access DRIVER_SPONSOR_MAPPINGS table",
            serverInfo: {
                host: req.get('host'),
                isLocalhost: req.get('host').includes('localhost') || req.get('host').includes('127.0.0.1')
            }
        });
    }
});

// Test all tables to see what's available
router.get("/testAllTables", async (req, res, next) => {
    try {
        console.log("Testing all available tables");
        
        const tables = [
            "Team01_DB.DRIVER_SPONSOR_MAPPINGS",
            "DRIVER_SPONSOR_MAPPINGS", 
            "Team01_DB.USER",
            "Team01_DB.DRIVER",
            "Team01_DB.SPONSOR"
        ];
        
        const results = {};
        
        for (const table of tables) {
            try {
                const query = `SELECT COUNT(*) as count FROM ${table}`;
                const result = await db.executeQuery(query);
                results[table] = {
                    success: true,
                    count: result[0].count
                };
                console.log(`Table ${table}: ${result[0].count} records`);
            } catch (error) {
                results[table] = {
                    success: false,
                    error: error.message
                };
                console.log(`Table ${table}: ERROR - ${error.message}`);
            }
        }
        
        res.json({
            message: "Table access test complete",
            results: results
        });
    } catch (error) {
        console.error("Error testing tables:", error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Updates an existing Sponsor organization.
 * @param {object} data - The Sponsor data to be updated.
 * @returns {Promise<object>} A promise that resolves with the result of the sponsor table update.
 */
async function updateSponsor(data) {
    try {
        console.log("Updating sponsor organization");
        console.log(data);
        const sql = "UPDATE SPONSOR SET Name = ?, PointRatio = ?, EnabledSponsor = ? WHERE SponsorID = ?";
        const values = [data.Name, data.PointRatio, data.EnabledSponsor, data.SponsorID];

        const result = await db.executeQuery(sql, values);

        console.log("Sponsor organization updated, ID: " + data.SponsorID);
        return result; 
    }
    catch (error) {
        console.error("Failed to update sponsor:", error);
        throw error;
    }
}

/**
 * Updates a sponsor user's information.
 * @param {object} data - The sponsor user data to be updated.
 * @returns {Promise<object>} A promise that resolves with the result of the update.
 */
async function updateSponsorUser(data) {
    try {
        console.log("Updating sponsor user with data:", data);
        
        // Update the USER table first
        const userResult = await user.updateUser(data);
        
        console.log("Sponsor user updated successfully");
        return userResult;
    } catch (error) {
        console.error("Failed to update sponsor user:", error);
        throw error;
    }
}

router.post("/updateSponsor", async (req, res, next) => {
    const data = req.body;
    console.log('Received POST data for sponsor update: ', data);
    try {
        const result = await updateSponsor(data);
        res.status(200).json({ message: 'Sponsor organization updated successfully!', result });
    } catch (error) {
        console.error('Error updating sponsor:', error);
        res.status(500).send('Error updating sponsor organization.');
    }
});

router.post("/updateSponsorUser", async (req, res, next) => {
    const data = req.body;
    console.log('Received POST data for sponsor user update: ', data);
    try {
        const result = await updateSponsorUser(data);
        res.status(200).json({ message: 'Sponsor user updated successfully!', result });
    } catch (error) {
        console.error('Error updating sponsor user:', error);
        res.status(500).send('Error updating sponsor user.');
    }
});

async function updateDriverPoints(data) {
    try {
        console.log("Updating Points:");
        console.log(data);
        const sql = "CALL PointsUpdate(?, ?, ?)";
        const result = await db.executeQuery(sql, [data.DriverID, data.PointChange, data.SponsorID]);
        console.log("Points Updated successfully.");
    } catch (error) {
        console.error("Failed to update points for driver:", error);
        throw error;
    }
}

router.post("/updateDriverPoints", async (req, res, next) => {
    const data = req.query;
    console.log('Received POST data for driver point update: ', data);
    try {
        const result = await updateDriverPoints(data);
        res.status(200).json({ message: 'Driver user points updated successfully!', result });
    } catch (error) {
        console.error('Error updating drivers points:', error);
        res.status(500).send('Error updating driver points.');
    }
});

/**
 * Retrieves driver-sponsor mappings for a specific sponsor.
 * @param {number} sponsorId - The sponsor ID to filter by.
 * @returns {Promise<Array<Object>>} A promise that resolves with an array of mapping objects.
 */
async function getDriverSponsorMappingsForSponsor(sponsorId){
    try {
        console.log("Reading driver-sponsor mappings for sponsor:", sponsorId);

        // Query to get mappings with user details and SPONSOR names for applications that are NOT accepted (ApplicationAccepted = 0)
        // AND specifically for this sponsor ID
        let query = `
            SELECT 
                dsm.MappingID,
                dsm.SponsorID,
                dsm.DriverID,
                dsm.Points,
                dsm.ApplicationAccepted,
                u.FirstName,
                u.LastName,
                u.Email,
                s.Name as SponsorName,
                'pending' as Status,
                NOW() as ApplicationDate
            FROM Team01_DB.DRIVER_SPONSOR_MAPPINGS dsm
            LEFT JOIN Team01_DB.DRIVER d ON dsm.DriverID = d.DriverID
            LEFT JOIN Team01_DB.USER u ON d.UserID = u.UserID
            LEFT JOIN Team01_DB.SPONSOR s ON dsm.SponsorID = s.SponsorID
            WHERE dsm.SponsorID = ? AND dsm.ApplicationAccepted = 0
            ORDER BY dsm.MappingID DESC
        `;
        let mappings;
        
        try {
            mappings = await db.executeQuery(query, [sponsorId]);
            console.log("Successfully queried with full JOIN for sponsor:", sponsorId);
        } catch (error) {
            console.log("Full JOIN failed, trying fallback with SPONSOR table only for sponsor:", sponsorId);
            // Fallback query that still includes SPONSOR table for organization names
            query = `
                SELECT 
                    dsm.*,
                    s.Name as SponsorName
                FROM Team01_DB.DRIVER_SPONSOR_MAPPINGS dsm
                LEFT JOIN Team01_DB.SPONSOR s ON dsm.SponsorID = s.SponsorID
                WHERE dsm.SponsorID = ? AND dsm.ApplicationAccepted = 0 
                ORDER BY dsm.MappingID DESC
            `;
            mappings = await db.executeQuery(query, [sponsorId]);
            console.log("Successfully queried DRIVER_SPONSOR_MAPPINGS with SPONSOR join for sponsor:", sponsorId);
        }
        
        console.log("Query used:", query);
        console.log("Parameters:", [sponsorId]);
        console.log("Raw result for sponsor", sponsorId, ":", mappings);
        console.log("Returning %s pending driver-sponsor mappings for sponsor %s", mappings.length, sponsorId);
        
        return mappings;
    } catch (error) {
        console.error("Failed to get driver-sponsor mappings for sponsor: ", error);
        console.error("Error details:", error.message);
        console.error("Error stack:", error.stack);
        throw error;
    }
}

// Add new function to get all mappings for admin
async function getAllDriverSponsorMappings(){
    try {
        console.log("Reading all driver-sponsor mappings");

        // Query to get all mappings with user details and SPONSOR organization names
        let query = `
            SELECT 
                dsm.MappingID,
                dsm.SponsorID,
                dsm.DriverID,
                dsm.Points,
                dsm.ApplicationAccepted,
                u.FirstName,
                u.LastName,
                u.Email,
                s.Name as SponsorName,
                CASE 
                    WHEN dsm.ApplicationAccepted = 0 THEN 'pending'
                    WHEN dsm.ApplicationAccepted = 1 THEN 'approved'
                    ELSE 'unknown'
                END as Status,
                NOW() as ApplicationDate
            FROM Team01_DB.DRIVER_SPONSOR_MAPPINGS dsm
            LEFT JOIN Team01_DB.DRIVER d ON dsm.DriverID = d.DriverID
            LEFT JOIN Team01_DB.USER u ON d.UserID = u.UserID
            LEFT JOIN Team01_DB.SPONSOR s ON dsm.SponsorID = s.SponsorID
            ORDER BY dsm.ApplicationAccepted ASC, dsm.MappingID DESC
        `;
        let mappings;
        
        try {
            mappings = await db.executeQuery(query);
            console.log("Successfully queried all mappings with full JOIN");
        } catch (error) {
            console.log("Full JOIN failed, trying fallback with SPONSOR table only");
            // Fallback query that still includes SPONSOR table for organization names
            query = `
                SELECT 
                    dsm.*,
                    s.Name as SponsorName,
                    CASE 
                        WHEN dsm.ApplicationAccepted = 0 THEN 'pending'
                        WHEN dsm.ApplicationAccepted = 1 THEN 'approved'
                        ELSE 'unknown'
                    END as Status
                FROM Team01_DB.DRIVER_SPONSOR_MAPPINGS dsm
                LEFT JOIN Team01_DB.SPONSOR s ON dsm.SponsorID = s.SponsorID
                ORDER BY dsm.ApplicationAccepted ASC, dsm.MappingID DESC
            `;
            mappings = await db.executeQuery(query);
            console.log("Successfully queried all DRIVER_SPONSOR_MAPPINGS with SPONSOR join");
        }
        
        console.log("Query used:", query);
        console.log("Raw result count:", mappings.length);
        console.log("Sample mapping with sponsor name:", mappings.length > 0 ? mappings[0] : 'No data');
        console.log("Returning %s total driver-sponsor mappings", mappings.length);
        
        return mappings;
    } catch (error) {
        console.error("Failed to get all driver-sponsor mappings: ", error);
        console.error("Error details:", error.message);
        throw error;
    }
}

// Add route for admin to get all mappings
router.get("/getAllDriverSponsorMappings", async (req, res, next) => {
    try {
        const mappings = await getAllDriverSponsorMappings();
        console.log("Sending response with all mappings:", mappings.length, "records");
        res.json(mappings);
    } catch (error) {
        console.error("Error in getAllDriverSponsorMappings route:", error);
        res.status(500).json({
            error: 'Database error',
            details: error.message
        });
    }
});

// Add route for sponsor to get their pending driver mappings
router.get("/getDriverSponsorMappingsForSponsor", async (req, res, next) => {
    const sponsorId = req.query.SponsorID;
    console.log("Received request for sponsor mappings with SponsorID:", sponsorId);
    
    if (!sponsorId) {
        return res.status(400).json({ message: 'SponsorID required' });
    }
    
    try {
        const mappings = await getDriverSponsorMappingsForSponsor(sponsorId);
        console.log("Sending response with mappings for sponsor", sponsorId, ":", mappings.length, "records");
        
        // Double-check filtering on the server side to ensure security
        const filteredMappings = mappings.filter(mapping => 
            mapping.SponsorID === parseInt(sponsorId) && mapping.ApplicationAccepted === 0
        );
        
        console.log("After server-side filtering:", filteredMappings.length, "records");
        res.json(filteredMappings);
    } catch (error) {
        console.error("Error in getDriverSponsorMappingsForSponsor route:", error);
        res.status(500).json({
            error: 'Database error',
            details: error.message
        });
    }
});

module.exports={router};
