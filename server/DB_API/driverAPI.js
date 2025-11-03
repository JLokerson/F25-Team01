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

        // Try stored procedure first
        const query = "call GetDriverInfo();";
        const result = await db.executeQuery(query);
        
        console.log("Raw stored procedure result:", JSON.stringify(result, null, 2));
        
        // Stored procedures return results in an array format [resultset, metadata]
        let allDrivers = Array.isArray(result[0]) ? result[0] : result;
        
        console.log("Processed drivers from stored procedure:", allDrivers.length);
        
        // Always use direct query to ensure we get all fields including ActiveAccount
        console.log("Using direct query to ensure all fields are included...");

        // Intentionally omits password related fields due to being a bulk retrieval.
        const fallbackQuery = `
            SELECT 
                d.DriverID,
                d.SponsorID,
                d.UserID,
                d.Points,
                u.FirstName,
                u.LastName,
                u.Email,
                u.UserType,
                u.LastLogin,
                COALESCE(u.ActiveAccount, 1) as ActiveAccount
            FROM DRIVER d
            JOIN USER u ON d.UserID = u.UserID
            ORDER BY d.DriverID
        `;
        
        allDrivers = await db.executeQuery(fallbackQuery);
        console.log("Direct query returned:", allDrivers.length, "drivers");
        console.log("Sample driver record:", allDrivers[0] ? JSON.stringify(allDrivers[0], null, 2) : "No drivers found");
        
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
        // Thank god this doesn't also handle the fucking User entry creation.
        // I could have had to add that to the fucking stored procedure too.
        // AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
        const sql = "call AddDriver(?,?)";
        const adminResult = await db.executeQuery(sql, [sponsorID, newUserId]);

        console.log("New driver record created successfully.");
        return adminResult;
    } catch (error) {
        console.error("Failed to add new driver:", error);
        throw error;
    }
}

/**
 * Updates driver information in the USER table and DRIVER table.
 * @param {object} data - The driver data to be updated.
 * @returns {Promise<object>} A promise that resolves with the result of the update.
 */
async function updateDriver(data) {
    try {
        const { UserID, FirstName, LastName, Email, Password, PasswordSalt, SponsorID } = data;
        
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
        
        // Update the DRIVER table if SponsorID is provided
        if (SponsorID) {
            console.log("Updating driver's SponsorID to:", SponsorID);
            const driverUpdateSql = "UPDATE DRIVER SET SponsorID = ? WHERE UserID = ?";
            await db.executeQuery(driverUpdateSql, [SponsorID, UserID]);
            console.log("Driver's SponsorID updated successfully.");
        }
        
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
        const admins = await getAllDrivers();
        res.json(admins);
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
 * Cleans up duplicate driver records for the same user
 * @param {number} userID - The UserID that has duplicate driver records
 * @returns {Promise<object>} Result of the cleanup operation
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
 * @returns {Promise<object>} Result of the cleanup operation
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

module.exports={router};
