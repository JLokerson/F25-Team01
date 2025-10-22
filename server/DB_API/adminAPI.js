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

/**
 * Updates an admin user's information using the same pattern as driverAPI.
 * @param {object} data - The updated admin user data.
 * @returns {Promise<object>} A promise that resolves with the result of the update operation.
 */
async function updateAdminUser(data) {
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
        
        console.log("Updating admin user with UserID:", UserID);
        const result = await db.executeQuery(sql, values);
        
        console.log("Admin user updated successfully.");
        return result;
    } catch (error) {
        console.error("Failed to update admin user:", error);
        throw error;
    }
}

/**
 * Removes an admin user from both ADMIN and USER tables.
 * @param {number} adminID - The AdminID to remove.
 * @returns {Promise<object>} A promise that resolves with the result of the deletion.
 */
async function removeAdminUser(adminID) {
    try {
        console.log("Removing admin user with AdminID:", adminID);
        
        // First get the UserID
        const getUserSql = "SELECT UserID FROM ADMIN WHERE AdminID = ?";
        const userResult = await db.executeQuery(getUserSql, [adminID]);
        
        if (userResult.length === 0) {
            throw new Error("Admin user not found");
        }
        
        const userID = userResult[0].UserID;
        
        // Delete from ADMIN table first (foreign key constraint)
        const deleteAdminSql = "DELETE FROM ADMIN WHERE AdminID = ?";
        await db.executeQuery(deleteAdminSql, [adminID]);
        
        // Then delete from USER table
        const deleteUserSql = "DELETE FROM USER WHERE UserID = ?";
        const result = await db.executeQuery(deleteUserSql, [userID]);
        
        console.log("Admin user removed successfully.");
        return result;
    } catch (error) {
        console.error("Failed to remove admin user:", error);
        throw error;
    }
}

var express = require("express");
var router=express.Router();

// Ensure JSON body parsing for all routes in this router
router.use(express.json());

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

router.post("/updateAdminUser", async (req, res, next) => {
    console.log('Received POST request body:', req.body);
    console.log('Received POST request query:', req.query);

    // Prefer body, fallback to query for compatibility
    const data = (req.body && Object.keys(req.body).length > 0) ? req.body : req.query;

    console.log('Processing update admin user data:', data);

    if (!data.UserID) {
        return res.status(400).json({ message: 'UserID is required' });
    }

    try {
        const result = await updateAdminUser(data);
        res.status(200).json({ message: 'Admin user updated successfully!' });
    } catch (error) {
        console.error('Error updating admin user:', error);
        res.status(500).json({ message: 'Error updating admin user.', error: error.message });
    }
});

router.delete("/removeAdminUser/:adminID", async (req, res, next) => {
    const adminID = req.params.adminID;
    console.log('Received DELETE request for admin user ID:', adminID);
    try {
        const result = await removeAdminUser(adminID);
        res.status(200).json({ message: 'Admin user removed successfully!' });
    } catch (error) {
        console.error('Error removing admin user:', error);
        res.status(500).send('Error removing admin user.');
    }
});

module.exports={router};
