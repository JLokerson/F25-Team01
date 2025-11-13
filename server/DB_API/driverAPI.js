//This file is for admin related database api calls.
const db = require('./db'); //shared database connection pool
const user = require('./userAPI');
const crypto = require('crypto');

/**
 * Generates a random salt for password hashing
 * @returns {string} A random salt string
 */
function generateSalt() {
    return crypto.randomBytes(16).toString('hex');
}

/**
 * Hashes a password with a salt using SHA-256
 * @param {string} password - The plain text password
 * @param {string} salt - The salt to use
 * @returns {string} The hashed password
 */
function hashPassword(password, salt) {
    return crypto.createHash('sha256').update(password + salt).digest('hex');
}

/**
 * Retrieves all drivers by joining the Driver and User tables, including inactive accounts.
 * @returns {Promise<Array<Object>>} A promise that resolves with an array of driver user objects.
 */
async function getAllDrivers(){
    try {
        console.log("Reading all driver user info");

        const query = "call GetDriverInfo();";
        const allDrivers = await db.executeQuery(query);
        console.log("Returning %s Drivers", allDrivers.length);
        return allDrivers;
    } catch (error) {
        console.error("Failed to get all drivers: ", error);
        throw error;
    }
}

async function getSpecificDriverSponsors(data){
    try {
        console.log("Reading info for chosen driver");

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
 * Creates missing DRIVER records for users who exist in SPONSOR_USER but not in DRIVER table
 * This fixes the issue where users are created but the AddDriver stored procedure fails
 */
async function createMissingDriverRecords() {
    try {
        console.log("Finding users in SPONSOR_USER who don't have DRIVER records...");
        
        // Find UserIDs that exist in SPONSOR_USER but not in DRIVER
        const findMissingQuery = `
            SELECT su.UserID, su.SponsorID, u.FirstName, u.LastName, u.Email
            FROM SPONSOR_USER su
            INNER JOIN USER u ON su.UserID = u.UserID
            LEFT JOIN DRIVER d ON su.UserID = d.UserID
            WHERE d.UserID IS NULL AND u.UserType = 1
        `;
        
        const missingDrivers = await db.executeQuery(findMissingQuery);
        console.log(`Found ${missingDrivers.length} users missing DRIVER records:`, missingDrivers);
        
        if (missingDrivers.length === 0) {
            return { message: "No missing DRIVER records found", created: [] };
        }
        
        const createdDrivers = [];
        
        // Create DRIVER records for each missing user
        for (const user of missingDrivers) {
            try {
                console.log(`Creating DRIVER record for UserID ${user.UserID} (${user.FirstName} ${user.LastName})`);
                
                // Insert directly into DRIVER table instead of using the problematic stored procedure
                const insertDriverQuery = "INSERT INTO DRIVER (UserID, SponsorID) VALUES (?, ?)";
                const result = await db.executeQuery(insertDriverQuery, [user.UserID, user.SponsorID]);
                
                console.log(`Successfully created DRIVER record with DriverID ${result.insertId} for UserID ${user.UserID}`);
                
                createdDrivers.push({
                    UserID: user.UserID,
                    DriverID: result.insertId,
                    SponsorID: user.SponsorID,
                    Name: `${user.FirstName} ${user.LastName}`,
                    Email: user.Email
                });
                
            } catch (driverCreateError) {
                console.error(`Failed to create DRIVER record for UserID ${user.UserID}:`, driverCreateError);
            }
        }
        
        return {
            message: `Created ${createdDrivers.length} missing DRIVER records`,
            found: missingDrivers.length,
            created: createdDrivers
        };
        
    } catch (error) {
        console.error("Failed to create missing DRIVER records:", error);
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
        const sql = "call AddDriver (?, ?)";
        const adminResult = await db.executeQuery(sql, [newUserId, sponsorID]);

        console.log("New driver record created successfully.");
        return adminResult;
    } catch (error) {
        console.error("Failed to add new driver:", error);
        throw error;
    }
}

/**
 * Updates driver information in the USER table.
 * @param {object} data - The driver data to be updated.
 * @returns {Promise<object>} A promise that resolves with the result of the update.
 */
async function updateDriver(data) {
    try {
        const { UserID, FirstName, LastName, Email, Password, PasswordSalt } = data;
        
        let sql = "UPDATE USER SET FirstName = ?, LastName = ?, Email = ?";
        let values = [FirstName, LastName, Email];
        
        // Only update password if provided
        if (Password && Password.trim() !== '') {
            sql += ", Password = ?, PasswordSalt = ?";
            values.push(Password, PasswordSalt || 'updated-salt');
        }
        
        sql += " WHERE UserID = ?";
        values.push(UserID);
        
        console.log("Updating driver with UserID:", UserID);
        const result = await db.executeQuery(sql, values);
        
        console.log("Driver updated successfully.");
        return result;
    } catch (error) {
        console.error("Failed to update driver:", error);
        throw error;
    }
}

/**
 * Removes a driver from the system by deleting from DRIVER table and USER table.
 * @param {number} driverID - The driver ID to be removed.
 * @returns {Promise<object>} A promise that resolves with the result of the deletion.
 */
async function removeDriver(driverID) {
    try {
        // First get the UserID associated with this driver
        const getUserQuery = "SELECT UserID FROM DRIVER WHERE DriverID = ?";
        const driverResult = await db.executeQuery(getUserQuery, [driverID]);
        
        if (driverResult.length === 0) {
            throw new Error("Driver not found");
        }
        
        const userID = driverResult[0].UserID;
        
        // Delete from DRIVER table first (due to foreign key constraint)
        console.log("Removing driver with DriverID:", driverID);
        const deleteDriverQuery = "DELETE FROM DRIVER WHERE DriverID = ?";
        await db.executeQuery(deleteDriverQuery, [driverID]);
        
        // Then delete from USER table
        console.log("Removing user with UserID:", userID);
        const deleteUserQuery = "DELETE FROM USER WHERE UserID = ?";
        const result = await db.executeQuery(deleteUserQuery, [userID]);
        
        console.log("Driver and user removed successfully.");
        return result;
    } catch (error) {
        console.error("Failed to remove driver:", error);
        throw error;
    }
}

// Replacement for removeDriver, removeDriver left for consistency.
async function toggleDriverActivity(driverID) {
    try {
        console.log(`Starting toggleDriverActivity for DriverID: ${driverID}`);
        

        // First get the UserID associated with this driver
        const getUserQuery = "SELECT UserID FROM DRIVER WHERE DriverID = ?";
        const driverResult = await db.executeQuery(getUserQuery, [driverID]);
        
        console.log(`Driver lookup result for DriverID ${driverID}:`, driverResult);
        
        if (driverResult.length === 0) {
            console.error(`Driver not found for DriverID: ${driverID}`);
            throw new Error(`Driver not found for DriverID: ${driverID}`);
        }
        
        const userID = driverResult[0].UserID;
        console.log(`Found UserID ${userID} for DriverID ${driverID}`);
        
        // Use the userAPI function instead of duplicating logic
        const user = require('./userAPI');
        const updateResult = await user.toggleAccountActivity(userID);
        
        console.log("Driver activity toggled successfully via userAPI.");
        return updateResult;
    } catch (error) {
        console.error("Failed to toggle driver:", error);
        throw error;
    }
}


var express = require("express");
var router = express.Router();

// Ensure JSON body parsing for all routes in this router
router.use(express.json());


router.get("/getAllDrivers", async (req, res, next) => {
    try {
        const result = await getAllDrivers();
        res.json(result);
    } catch (error) {
        res.status(500).send('Database error.');
    }
});

router.get("/getSpecificDriver", async (req, res, next) => {
    const data = (req.body && Object.keys(req.body).length > 0) ? req.body : req.query;
    try {
        const result = await getSpecificDriverSponsors(data);
        res.json(result);
    } catch (error) {
        res.status(500).send('Database error.');
    }
});

router.post("/addDriver", async (req, res, next) => {
    // Prefer body, fallback to query for Postman compatibility
    const data = (req.body && Object.keys(req.body).length > 0) ? req.body : req.query;
    console.log('Received POST data for new driver: ', data);
    try {
        const result = await addDriver(data);
        res.status(200).json({ message: 'Driver user added successfully!', id: result.insertId });
    } catch (error) {
        res.status(500).send('Error adding driver user.');
    }
});

router.post("/updateDriver", async (req, res, next) => {
    console.log('Received POST request body:', req.body);
    console.log('Received POST request query:', req.query);

    // Prefer body, fallback to query for Postman compatibility
    const data = (req.body && Object.keys(req.body).length > 0) ? req.body : req.query;

    console.log('Processing update driver data:', data);

    if (!data.UserID) {
        return res.status(400).json({ message: 'UserID is required' });
    }

    try {
        const result = await updateDriver(data);
        res.status(200).json({ message: 'Driver updated successfully!' });
    } catch (error) {
        console.error('Error updating driver:', error);
        res.status(500).json({ message: 'Error updating driver.', error: error.message });
    }
});

router.post("/updateDriverWithSponsor", async (req, res, next) => {
    console.log('Received POST request for updateDriverWithSponsor');
    console.log('Request headers:', req.get('Content-Type'));
    console.log('Parsed body:', req.body);
    console.log('Query params:', req.query);

    const data = req.body;

    if (!data.UserID) {
        return res.status(400).json({ message: 'UserID is required' });
    }

    if (!data.SponsorID) {
        return res.status(400).json({ message: 'SponsorID is required' });
    }

    try {
        console.log('Calling updateDriverWithSponsor function with data:', data);
        const result = await updateDriverWithSponsor(data);
        console.log('updateDriverWithSponsor completed successfully:', result);
        res.status(200).json({ 
            message: 'Driver updated successfully with sponsor relationship!',
            details: result
        });
    } catch (error) {
        console.error('Error updating driver with sponsor:', error);
        res.status(500).json({ 
            message: 'Error updating driver with sponsor relationship.',
            error: error.message 
        });
    }
});

router.delete("/removeDriver/:driverID", async (req, res, next) => {
    const driverID = req.params.driverID;
    console.log('Received DELETE request for driver ID:', driverID);
    try {
        const result = await removeDriver(driverID);
        res.status(200).json({ message: 'Driver removed successfully!' });
    } catch (error) {
        console.error('Error removing driver:', error);
        res.status(500).send('Error removing driver.');
    }
});

router.post("/toggleDriverActivity/:driverID", async (req, res, next) => {
    
    const driverID = req.params.driverID;
    console.log('Received toggle activity request for driver ID:', driverID);
    
    // Validate that driverID is a number
    if (isNaN(driverID) || driverID <= 0) {
        console.error('Invalid DriverID provided:', driverID);
        return res.status(400).json({ 
            message: 'Invalid DriverID provided',
            received: driverID
        });
    }
    
    try {
        const result = await toggleDriverActivity(parseInt(driverID));
        res.status(200).json({ message: 'Driver activity toggled successfully!' });
    } catch (error) {
        console.error('Error toggling activity for driver:', error);
        res.status(500).json({ 
            message: 'Error toggling activity for driver.',
            error: error.message,
            driverID: driverID
        });
    }
});

/**
 * Debug function to show all users from different tables
 * @returns {Promise<object>} Debug information about all users
 */
async function debugAllUsers() {
    try {
        console.log("=== DEBUG: Fetching all user data from multiple tables ===");
        
        const debugData = {};
        
        // Get all users from USER table
        const allUsersQuery = "SELECT UserID, FirstName, LastName, Email, UserType, ActiveAccount FROM USER ORDER BY UserID";
        debugData.allUsers = await db.executeQuery(allUsersQuery);
        console.log(`Found ${debugData.allUsers.length} users in USER table`);
        
        // Get all drivers from DRIVER table with more detail
        const allDriversQuery = `
            SELECT d.DriverID, d.UserID, d.SponsorID, d.Points,
                   u.FirstName, u.LastName, u.Email, u.ActiveAccount
            FROM DRIVER d
            LEFT JOIN USER u ON d.UserID = u.UserID
            ORDER BY d.DriverID
        `;
        debugData.allDrivers = await db.executeQuery(allDriversQuery);
        console.log(`Found ${debugData.allDrivers.length} drivers in DRIVER table`);
        
        // Get all sponsor users from SPONSOR_USER table
        const allSponsorUsersQuery = `
            SELECT su.SponsorUserID, su.UserID, su.SponsorID,
                   u.FirstName, u.LastName, u.Email, u.ActiveAccount
            FROM SPONSOR_USER su
            LEFT JOIN USER u ON su.UserID = u.UserID
            ORDER BY su.SponsorUserID
        `;
        debugData.allSponsorUsers = await db.executeQuery(allSponsorUsersQuery);
        console.log(`Found ${debugData.allSponsorUsers.length} sponsor users in SPONSOR_USER table`);
        
        // Get all sponsors from SPONSOR table
        const allSponsorsQuery = "SELECT SponsorID, Name, EnabledSponsor FROM SPONSOR ORDER BY SponsorID";
        debugData.allSponsors = await db.executeQuery(allSponsorsQuery);
        console.log(`Found ${debugData.allSponsors.length} sponsors in SPONSOR table`);
        
        // Get the same data that getAllDrivers() returns
        debugData.getAllDriversResult = await getAllDrivers();
        console.log(`getAllDrivers() returned ${debugData.getAllDriversResult.length} drivers`);
        
        // Analysis: Find users without driver records
        const userIDsWithDrivers = new Set(debugData.allDrivers.map(d => d.UserID));
        debugData.usersWithoutDriverRecords = debugData.allUsers.filter(user => 
            user.UserType === 1 && !userIDsWithDrivers.has(user.UserID)
        );
        
        // Analysis: Find drivers without valid sponsors
        const validSponsorIDs = new Set(debugData.allSponsors.map(s => s.SponsorID));
        debugData.driversWithInvalidSponsors = debugData.allDrivers.filter(driver => 
            !validSponsorIDs.has(driver.SponsorID)
        );
        
        // Analysis: Find duplicates and data issues
        debugData.duplicateDriverUserIDs = [];
        const userIDCounts = {};
        debugData.allDrivers.forEach(driver => {
            userIDCounts[driver.UserID] = (userIDCounts[driver.UserID] || 0) + 1;
        });
        Object.keys(userIDCounts).forEach(userID => {
            if (userIDCounts[userID] > 1) {
                debugData.duplicateDriverUserIDs.push({
                    UserID: parseInt(userID),
                    count: userIDCounts[userID],
                    drivers: debugData.allDrivers.filter(d => d.UserID === parseInt(userID))
                });
            }
        });
        
        // Summary stats
        debugData.summary = {
            totalUsers: debugData.allUsers.length,
            activeUsers: debugData.allUsers.filter(u => u.ActiveAccount === 1).length,
            inactiveUsers: debugData.allUsers.filter(u => u.ActiveAccount === 0).length,
            driverTypeUsers: debugData.allUsers.filter(u => u.UserType === 1).length,
            totalDrivers: debugData.allDrivers.length,
            totalSponsorUsers: debugData.allSponsorUsers.length,
            totalSponsors: debugData.allSponsors.length,
            usersWithoutDriverRecords: debugData.usersWithoutDriverRecords.length,
            driversWithInvalidSponsors: debugData.driversWithInvalidSponsors.length,
            duplicateDriverUserIDs: debugData.duplicateDriverUserIDs.length
        };
        
        console.log("=== DEBUG SUMMARY ===");
        console.log(debugData.summary);
        console.log("=== DUPLICATE ANALYSIS ===");
        console.log("Users with multiple DRIVER records:", debugData.duplicateDriverUserIDs);
        
        return debugData;
    } catch (error) {
        console.error("Failed to debug all users:", error);
        throw error;
    }
}

router.get("/debugAllUsers", async (req, res, next) => {
    console.log('Received request for debug all users data');
    try {
        const result = await debugAllUsers();
        res.status(200).json({
            message: 'Debug data retrieved successfully',
            timestamp: new Date().toISOString(),
            data: result
        });
    } catch (error) {
        console.error('Error in debug all users:', error);
        res.status(500).json({ message: 'Error retrieving debug data.', error: error.message });
    }
});

/**
 * Cleans up duplicate driver records for the same user
 * @param {number} userID - The UserID that has duplicate driver records
 * @returns {Promise<object>}
 */
async function cleanupDuplicateDriversForUser(userID) {
    try {
        console.log(`Cleaning up duplicate driver records for UserID: ${userID}`);
        
        // Get all driver records for this user
        const getDriversQuery = "SELECT DriverID, SponsorID FROM DRIVER WHERE UserID = ? ORDER BY DriverID ASC";
        const driverRecords = await db.executeQuery(getDriversQuery, [userID]);
        
        if (driverRecords.length <= 1) {
            console.log(`No duplicates found for UserID ${userID}`);
            return { message: `No duplicates found for UserID ${userID}` };
        }
        
        // Keep the first record (lowest DriverID) and delete the rest
        const keepRecord = driverRecords[0];
        const deleteRecords = driverRecords.slice(1);
        
        console.log(`Keeping DriverID ${keepRecord.DriverID}, deleting ${deleteRecords.length} duplicates`);
        
        // Delete duplicate driver records
        for (const record of deleteRecords) {
            const deleteQuery = "DELETE FROM DRIVER WHERE DriverID = ?";
            await db.executeQuery(deleteQuery, [record.DriverID]);
            console.log(`Deleted duplicate DriverID: ${record.DriverID}`);
        }
        
        // If the kept record has SponsorID 0, update it to a valid sponsor
        if (keepRecord.SponsorID === 0) {
            console.log(`Updating SponsorID from 0 to 1 for DriverID ${keepRecord.DriverID}`);
            const updateSponsorQuery = "UPDATE DRIVER SET SponsorID = 1 WHERE DriverID = ?";
            await db.executeQuery(updateSponsorQuery, [keepRecord.DriverID]);
        }
        
        return { 
            message: `Cleaned up ${deleteRecords.length} duplicate driver records for UserID ${userID}`,
            kept: keepRecord.DriverID,
            deleted: deleteRecords.map(r => r.DriverID)
        };
    } catch (error) {
        console.error(`Failed to cleanup duplicates for UserID ${userID}:`, error);
        throw error;
    }
}

/**
 * Fixes all data integrity issues in one operation
 * @returns {Promise<object>}
 */
async function fixAllDataIntegrityIssues() {
    try {
        console.log("Starting comprehensive data integrity cleanup...");
        const results = [];
        
        // Step 1: Fix duplicate drivers for UserID 4
        const userCleanup = await cleanupDuplicateDriversForUser(4);
        results.push(userCleanup);
        
        // Step 2: Fix any remaining drivers with SponsorID 0
        const fixInvalidSponsorsQuery = "UPDATE DRIVER SET SponsorID = 1 WHERE SponsorID = 0 OR SponsorID NOT IN (SELECT SponsorID FROM SPONSOR)";
        const sponsorFixResult = await db.executeQuery(fixInvalidSponsorsQuery);
        results.push({ 
            message: `Fixed ${sponsorFixResult.affectedRows} drivers with invalid sponsor references`
        });
        
        // Step 3: Report on sponsor name duplicates (don't auto-fix as this may require business logic)
        const duplicateSponsorsQuery = `
            SELECT Name, COUNT(*) as count, GROUP_CONCAT(SponsorID) as SponsorIDs
            FROM SPONSOR 
            GROUP BY Name 
            HAVING COUNT(*) > 1
        `;
        const duplicateSponsors = await db.executeQuery(duplicateSponsorsQuery);
        if (duplicateSponsors.length > 0) {
            results.push({
                message: `Found ${duplicateSponsors.length} sponsor name duplicates - manual review recommended`,
                duplicates: duplicateSponsors
            });
        }
        
        console.log("Data integrity cleanup completed");
        return {
            message: "Data integrity cleanup completed successfully",
            results: results,
            totalIssuesFixed: results.reduce((sum, r) => sum + (r.deleted ? r.deleted.length : 0), 0)
        };
    } catch (error) {
        console.error("Failed to fix data integrity issues:", error);
        throw error;
    }
}

router.post("/fixAllDataIntegrityIssues", async (req, res, next) => {
    console.log('Received request to fix all data integrity issues');
    try {
        const result = await fixAllDataIntegrityIssues();
        res.status(200).json(result);
    } catch (error) {
        console.error('Error fixing data integrity issues:', error);
        res.status(500).json({ message: 'Error fixing data integrity issues.', error: error.message });
    }
});

router.post("/cleanupDuplicateDriversForUser/:userID", async (req, res, next) => {
    const userID = req.params.userID;
    console.log('Received request to cleanup duplicate drivers for UserID:', userID);
    try {
        const result = await cleanupDuplicateDriversForUser(parseInt(userID));
        res.status(200).json(result);
    } catch (error) {
        console.error('Error cleaning up duplicate drivers:', error);
        res.status(500).json({ message: 'Error cleaning up duplicate drivers.', error: error.message });
    }
});

router.post("/createMissingDriverRecords", async (req, res, next) => {
    console.log('Received request to create missing DRIVER records');
    try {
        const result = await createMissingDriverRecords();
        res.status(200).json(result);
    } catch (error) {
        console.error('Error creating missing DRIVER records:', error);
        res.status(500).json({ message: 'Error creating missing DRIVER records.', error: error.message });
    }
});

/**
 * Retrieves drivers for a specific sponsor, including inactive accounts.
 * @param {number} sponsorID - The sponsor ID to filter by
 * @returns {Promise<Array<Object>>} A promise that resolves with an array of driver user objects.
 */
async function getDriversForSponsor(sponsorID) {
    try {
        console.log(`Reading driver info for SponsorID: ${sponsorID} (including inactive accounts)`);

        const query = `
            SELECT 
                u.FirstName, 
                u.LastName, 
                u.Email, 
                u.UserID, 
                u.ActiveAccount,
                d.DriverID, 
                d.SponsorID, 
                COALESCE(d.Points, 0) as Points
            FROM DRIVER d
            INNER JOIN USER u ON d.UserID = u.UserID
            WHERE u.UserType = 1 AND d.SponsorID = ?
            ORDER BY u.ActiveAccount DESC, u.LastName, u.FirstName
        `;
        
        const sponsorDrivers = await db.executeQuery(query, [sponsorID]);
        console.log(`Returning ${sponsorDrivers.length} Drivers for SponsorID ${sponsorID} (including inactive)`);
        
        return sponsorDrivers;
    } catch (error) {
        console.error(`Failed to get drivers for sponsor ${sponsorID}:`, error);
        throw error;
    }
}

router.get("/getDriversForSponsor/:sponsorID", async (req, res, next) => {
    const sponsorID = req.params.sponsorID;
    console.log('Received request for drivers for SponsorID:', sponsorID);
    
    // Validate sponsorID
    if (isNaN(sponsorID) || sponsorID <= 0) {
        console.error('Invalid SponsorID provided:', sponsorID);
        return res.status(400).json({ 
            message: 'Invalid SponsorID provided',
            received: sponsorID
        });
    }
    
    try {
        const result = await getDriversForSponsor(parseInt(sponsorID));
        res.json(result);
    } catch (error) {
        console.error('Error fetching drivers for sponsor:', error);
        res.status(500).json({ 
            message: 'Database error.',
            error: error.message 
        });
    }
});

/**
 * Updates driver information including sponsor relationship and optionally resets points.
 * Handles updates to USER, DRIVER, and SPONSOR_USER tables.
 * @param {object} data - The driver data to be updated.
 * @returns {Promise<object>} A promise that resolves with the result of the update.
 */
async function updateDriverWithSponsor(data) {
    try {
        const { UserID, FirstName, LastName, Email, Password, PasswordSalt, SponsorID, ResetPoints } = data;
        
        console.log(`Updating driver UserID ${UserID} with sponsor change capability`);
        console.log('Reset points requested:', ResetPoints);
        
        // Step 1: Update USER table
        let userSql = "UPDATE USER SET FirstName = ?, LastName = ?, Email = ?";
        let userValues = [FirstName, LastName, Email];
        
        // Only update password if provided
        if (Password && Password.trim() !== '' && Password !== 'auto-generated') {
            const salt = PasswordSalt && PasswordSalt !== 'auto-generated' ? PasswordSalt : generateSalt();
            const hashedPassword = hashPassword(Password, salt);
            userSql += ", Password = ?, PasswordSalt = ?";
            userValues.push(hashedPassword, salt);
            console.log('Password will be updated with new hash');
        }
        
        userSql += " WHERE UserID = ?";
        userValues.push(UserID);
        
        console.log('Updating USER table...');
        await db.executeQuery(userSql, userValues);
        
        // Step 2: Update DRIVER table (including SponsorID and optionally reset points)
        let driverSql = "UPDATE DRIVER SET SponsorID = ?";
        let driverValues = [SponsorID];
        
        if (ResetPoints) {
            driverSql += ", Points = 0";
            console.log('Resetting driver points to 0 due to sponsor change');
        }
        
        driverSql += " WHERE UserID = ?";
        driverValues.push(UserID);
        
        console.log('Updating DRIVER table...');
        const driverResult = await db.executeQuery(driverSql, driverValues);
        
        // Step 3: Update SPONSOR_USER table (if the relationship exists)
        console.log('Updating SPONSOR_USER relationship...');
        try {
            const updateSponsorUserSql = "UPDATE SPONSOR_USER SET SponsorID = ? WHERE UserID = ?";
            const sponsorUserResult = await db.executeQuery(updateSponsorUserSql, [SponsorID, UserID]);
            
            if (sponsorUserResult.affectedRows === 0) {
                console.log('No SPONSOR_USER record found to update, creating new one...');
                // If no SPONSOR_USER record exists, create one
                const insertSponsorUserSql = "INSERT INTO SPONSOR_USER (UserID, SponsorID) VALUES (?, ?)";
                await db.executeQuery(insertSponsorUserSql, [UserID, SponsorID]);
                console.log('Created new SPONSOR_USER relationship');
            } else {
                console.log('Updated existing SPONSOR_USER relationship');
            }
        } catch (sponsorUserError) {
            console.warn('Failed to update SPONSOR_USER relationship (may not be critical):', sponsorUserError.message);
        }
        
        console.log('Driver update with sponsor change completed successfully');
        return {
            message: 'Driver updated successfully',
            userUpdated: true,
            driverUpdated: driverResult.affectedRows > 0,
            pointsReset: ResetPoints,
            sponsorChanged: true
        };
        
    } catch (error) {
        console.error("Failed to update driver with sponsor:", error);
        throw error;
    }
}

router.post("/updateDriverWithSponsor", async (req, res, next) => {
    console.log('Received POST request for updateDriverWithSponsor');
    console.log('Request headers:', req.get('Content-Type'));
    console.log('Parsed body:', req.body);
    console.log('Query params:', req.query);

    const data = req.body;

    if (!data.UserID) {
        return res.status(400).json({ message: 'UserID is required' });
    }

    if (!data.SponsorID) {
        return res.status(400).json({ message: 'SponsorID is required' });
    }

    try {
        const result = await updateDriverWithSponsor(data);
        res.status(200).json({ 
            message: 'Driver updated successfully with sponsor relationship!',
            details: result
        });
    } catch (error) {
        console.error('Error updating driver with sponsor:', error);
        res.status(500).json({ 
            message: 'Error updating driver with sponsor relationship.',
            error: error.message 
        });
    }
});

// Test route to verify routing is working
router.get("/testRoute", (req, res) => {
    res.json({ message: "Test route is working", timestamp: new Date().toISOString() });
});

module.exports={router};
