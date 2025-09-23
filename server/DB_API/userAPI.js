//This file is for user related database api calls.
const db = require('./db'); //shared database connection pool

/**
 * Gets all users from the USER database
 * @returns {Promise<object|null>} The user object if found, otherwise null.
 */
async function getAllUsers(){
    try{
        console.log("Reading all USER info");
        const allUsers = await db.executeQuery("SELECT * from USER");
        console.log("Returning %s Users", allUsers.length);
        // console.log(allUsers); // for debugging
        // console.log("__________________");
        return allUsers;
    }
    catch (error) {
        console.error("Failed to get all users: ", error);
        throw error;
    }
}

/**
 * Gets a user from the USER database by their UserID or with FirstName, LastName, and Email.
 * @param {object} data - An object containing lookup criteria.
 * @returns {Promise<object|null>} The user object if found, otherwise null.
 */
async function getUser(data){
    let sql;
    let values;

    // Prioritize searching by UserID if it's provided.
    if (data.UserID) {
        console.log(`Querying user by UserID: ${data.UserID}`);
        sql = "SELECT * FROM USER WHERE UserID = ?";
        values = [data.UserID];
    } 
    // Otherwise, search by the combination of FirstName, LastName, and Email.
    else if (data.FirstName && data.LastName && data.Email) {
        console.log(`Querying user by name and email: ${data.FirstName} ${data.LastName}, ${data.Email}`);
        sql = "SELECT * FROM USER WHERE FirstName = ? AND LastName = ? AND Email = ?";
        values = [data.FirstName, data.LastName, data.Email];
    } 
    // If neither set of criteria is met, we cannot perform a lookup.
    else {
        console.log("Bad data to get a user.");
        return null;
    }

    try {
        const users = await db.executeQuery(sql, values);
        if (users.length > 0) {
            console.log("User found.");
            return users; // users[0] Return the first user found (should be unique by ID or email combo)
        } else {
            console.log("User not found.");
            return null;
        }
    } catch (error) {
        console.error("Failed to get user:", error);
        throw error;
    }
}

async function addNewUser(data){
    try {
        console.log("Inserting new User to User Table");
        console.log(data);
        const sql = "INSERT INTO USER (FirstName, LastName, Email, Password, PasswordSalt, UserType) VALUES (?, ?, ?, ?, ?, ?)";
        const values = [data.FirstName, data.LastName, data.Email, data.Password, data.PasswordSalt, data.UserType];

        const result = await db.executeQuery(sql, values);

        console.log("Record inserted, ID: " + result.insertId);
        return result; 
    }
    catch (error) {
        console.error("Failed to add new user:", error);
        throw error;
    }
};

/**
 * Updates a user's password in the USER database.
 * @param {object} data - An object containing UserID, new Password, and new PasswordSalt.
 * @returns {Promise<object>} The result from the database operation (e.g., affectedRows).
 */
async function updatePassword(data){

    if (!data.UserID || !data.Password || !data.PasswordSalt) {
        throw new Error("UserID, new Password, and new PasswordSalt are required to update.");
    }

    try {
        console.log(`Updating password for UserID: ${data.UserID}`);
        const sql = "UPDATE USER SET Password = ?, PasswordSalt = ? WHERE UserID = ?";
        const values = [data.Password, data.PasswordSalt, data.UserID];

        const result = await db.executeQuery(sql, values);

        console.log(`Update result: ${result.affectedRows} rows affected.`);
        return result;
    } catch (error) {
        console.error("Failed to update password:", error);
        throw error;
    }
}

var express = require("express");
var router=express.Router();

router.get("/", async function(req, res, next) {
    try {
        const users = await getAllUsers();
        res.json(users);
    } catch (error) {
        res.status(500).send('Database error.');
    }
});

router.get("/getAllUsers", async function(req, res, next) {
    try {
        const users = await getAllUsers(req.query);
        res.json(users);
    } catch (error) {
        res.status(500).send('Database error.');
    }
});

// Example: /getUser?UserID=1 OR /getUser?FirstName=John&LastName=Doe&Email=john.doe@email.com
router.get("/getUser", async function(req, res, next) {
    try {
        const user = await getUser(req.query);
        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ message: 'User not found or bad query parameters.' });
        }
    } catch (error) {
        res.status(500).send('Database error.');
    }
});

router.post("/addUser", async (req, res, next) => {
    const data = req.body;
    console.log('Received POST data: ', data);
    try {
        const result = await addNewUser(data);
        res.status(200).json({ message: 'User added successfully!', id: result.insertId });
    } catch (error) {
        res.status(500).send('Error adding user.');
    }
});

router.post("/updatePassword", async (req, res, next) => {
    const data = req.body;
    console.log('Received POST data for password update: ', data);
    try {
        const result = await updatePassword(data);
        if (result.affectedRows > 0) {
            res.status(200).json({ message: 'Password updated successfully!' });
        } else {
            res.status(404).json({ message: 'User not found, password not updated.' });
        }
    } catch (error) {
        // Handle specific errors like missing data
        if (error.message.includes("required")) {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).send('Error updating password.');
    }
});


module.exports=router;