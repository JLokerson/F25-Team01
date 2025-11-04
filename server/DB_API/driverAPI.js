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
 * Retrieves all admins by joining the Driver and User tables.
 * @returns {Promise<Array<Object>>} A promise that resolves with an array of admin user objects.
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
    console.log("=== ADDDRIVER FUNCTION START - NEW VERSION ===");
    console.log("This is the updated version that should NOT call AddDriver stored procedure");
    
    try {
        const sponsorID = data.SponsorID;
        
        // Generate salt and hash password BEFORE creating userData object
        if (!data.Password || data.Password === '') {
            throw new Error('Password is required');
        }
        
        // Always generate a salt, with fallback
        let salt;
        try {
            salt = generateSalt();
            if (!salt || salt.length === 0) {
                throw new Error('Salt generation failed');
            }
        } catch (saltError) {
            console.warn('Salt generation failed, using fallback:', saltError);
            salt = 'temp-salt-' + Date.now() + '-' + Math.random().toString(36).substring(2, 15);
        }
        
        const hashedPassword = hashPassword(data.Password, salt);
        
        console.log("Generated salt:", salt ? '[GENERATED]' : 'NULL');
        console.log("Generated salt length:", salt ? salt.length : 0);
        console.log("Hashed password:", hashedPassword ? '[HASHED]' : 'NULL');
        
        // Create user data with properly generated salt and hashed password
        const userData = {
            FirstName: data.FirstName,
            LastName: data.LastName,
            Email: data.Email,
            Password: hashedPassword,
            PasswordSalt: salt,
            UserType: data.UserType || 1
        };
        
        // Verify salt is included before calling addNewUser
        if (!userData.PasswordSalt) {
            console.error('PasswordSalt is still undefined, setting emergency fallback');
            userData.PasswordSalt = 'emergency-salt-' + Date.now();
        }
        
        console.log("Adding new driver user with hashed password and salt");
        console.log("User data being sent (with verification):", {
            FirstName: userData.FirstName,
            LastName: userData.LastName,
            Email: userData.Email,
            Password: userData.Password ? '[HASHED]' : 'NULL',
            PasswordSalt: userData.PasswordSalt ? `[GENERATED-${userData.PasswordSalt.length}chars]` : 'NULL',
            UserType: userData.UserType
        });
        
        const userResult = await user.addNewUser(userData);
        const newUserId = userResult.insertId;
        console.log("Record inserted user, ID:", newUserId);

        // Create the SPONSOR_USER relationship first
        console.log("Creating SPONSOR_USER relationship for UserID:", newUserId, "with SponsorID:", sponsorID);
        try {
            const sponsorUserSql = "INSERT INTO SPONSOR_USER (UserID, SponsorID) VALUES (?, ?)";
            const sponsorUserResult = await db.executeQuery(sponsorUserSql, [newUserId, sponsorID]);
            console.log("SPONSOR_USER relationship created successfully:", sponsorUserResult);
        } catch (sponsorUserError) {
            console.error("Failed to create SPONSOR_USER relationship:", sponsorUserError);
            // Continue - this is not critical for basic functionality
        }
        
        // === ABSOLUTELY NO STORED PROCEDURES - DIRECT DATABASE ACCESS ONLY ===
        console.log("=== STARTING DIRECT DATABASE ACCESS FOR DRIVER TABLE ===");
        console.log("IMPORTANT: This code will NEVER call 'AddDriver' stored procedure");
        console.log("If you see 'call AddDriver' in the logs after this, the server is using old cached code");
        
        // Create DRIVER record using only direct SQL
        console.log("Step 1: Creating DRIVER table record with direct SQL");
        console.log("Target SQL: INSERT INTO DRIVER (UserID, SponsorID, Points) VALUES (?, ?, 0)");
        console.log("Target values:", [newUserId, sponsorID, 0]);
        
        let driverCreationSuccess = false;
        let driverID = null;
        
        try {
            const directDriverSQL = "INSERT INTO DRIVER (UserID, SponsorID, Points) VALUES (?, ?, 0)";
            console.log("Executing direct SQL:", directDriverSQL);
            console.log("With parameters:", [newUserId, sponsorID]);
            
            const directDriverResult = await db.executeQuery(directDriverSQL, [newUserId, sponsorID]);
            driverID = directDriverResult.insertId;
            
            console.log("SUCCESS: Direct DRIVER insertion completed");
            console.log("New DriverID:", driverID);
            driverCreationSuccess = true;
            
        } catch (directDriverError) {
            console.error("FAILURE: Direct DRIVER insertion failed");
            console.error("Error details:", directDriverError);
            console.error("SQL that failed:", "INSERT INTO DRIVER (UserID, SponsorID, Points) VALUES (?, ?, 0)");
            console.error("Parameters that failed:", [newUserId, sponsorID]);
        }
        
        // Optional: Try DRIVER_SPONSOR_MAPPINGS if direct DRIVER worked
        if (driverCreationSuccess && driverID) {
            console.log("Step 2: Attempting DRIVER_SPONSOR_MAPPINGS table (optional)");
            try {
                const mappingSQL = "INSERT INTO DRIVER_SPONSOR_MAPPINGS (DriverID, SponsorID, Points, ApplicationAccepted) VALUES (?, ?, 0, 1)";
                console.log("Executing mapping SQL:", mappingSQL);
                console.log("With parameters:", [driverID, sponsorID, 0, 1]);
                
                const mappingResult = await db.executeQuery(mappingSQL, [driverID, sponsorID]);
                console.log("SUCCESS: DRIVER_SPONSOR_MAPPINGS created with MappingID:", mappingResult.insertId);
            } catch (mappingError) {
                console.warn("OPTIONAL FAILURE: DRIVER_SPONSOR_MAPPINGS failed (not critical):", mappingError.message);
            }
        }
        
        // Return results based on what succeeded
        console.log("=== FINAL RESULT DETERMINATION ===");
        if (driverCreationSuccess && driverID) {
            console.log("COMPLETE SUCCESS: Both USER and DRIVER records created");
            const successResult = {
                insertId: driverID,
                userID: newUserId,
                driverID: driverID,
                sponsorID: sponsorID,
                message: "Driver created successfully with direct SQL - stored procedures bypassed completely",
                method: "direct_sql_success"
            };
            console.log("Returning success result:", successResult);
            return successResult;
        } else {
            console.log("PARTIAL SUCCESS: USER created but DRIVER table failed");
            const partialResult = {
                insertId: newUserId,
                userID: newUserId,
                message: "User account created but DRIVER table insertion failed. Use 'Fix Missing Driver Records' to complete setup.",
                method: "partial_success",
                requiresDriverFix: true,
                error: "Direct DRIVER table insertion failed - check server logs"
            };
            console.log("Returning partial result:", partialResult);
            return partialResult;
        }
        
    } catch (error) {
        console.error("=== ADDDRIVER FUNCTION COMPLETE FAILURE ===");
        console.error("Top-level error in addDriver function:", error);
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

module.exports={router};
