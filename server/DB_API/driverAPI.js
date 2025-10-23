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

        const query = "call GetDriverInfo();";
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
        // First get the UserID associated with this driver
        const getUserQuery = "SELECT UserID FROM DRIVER WHERE DriverID = ?";
        const driverResult = await db.executeQuery(getUserQuery, [driverID]);
        
        if (driverResult.length === 0) {
            throw new Error("Driver not found");
        }
        
        const userID = driverResult[0].UserID;
        
        // Mark account as disabled on User table
        console.log("Toggling activity of driver with DriverID:", driverID);
        const deleteDriverQuery = "call ToggleAccountActivity(?)";
        await db.executeQuery(deleteDriverQuery, [driverID]);
        
        console.log("Driver disabled/enabled successfully.");
        return result;
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
