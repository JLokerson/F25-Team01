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
        console.log("Data to insert:", data);
        const sql = "INSERT INTO USER (FirstName, LastName, Email, Password, PasswordSalt, UserType) VALUES (?, ?, ?, ?, ?, ?)";
        const values = [data.FirstName, data.LastName, data.Email, data.Password, data.PasswordSalt, data.UserType];

        console.log("SQL:", sql);
        console.log("Values:", values);

        const result = await db.executeQuery(sql, values);

        console.log("Record inserted user, ID: " + result.insertId);
        return result; 
    }
    catch (error) {
        console.error("Database query failed:", error);
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

/**
 * Authenticates a user by email and password
 * @param {object} data - An object containing Email and Password
 * @returns {Promise<object|null>} The user object if authenticated, otherwise null
 */
async function loginUser(data) {
    if (!data.Email || !data.Password) {
        throw new Error("Email and Password are required for login.");
    }

    try {
        console.log(`Attempting login for email: ${data.Email}`);
        console.log(`Password provided: ${data.Password}`); // Debug line
        const sql = "SELECT * FROM USER WHERE Email = ?";
        const values = [data.Email];

        const users = await db.executeQuery(sql, values);
        
        if (users.length === 0) {
            console.log("User not found for login attempt.");
            return null;
        }

        const user = users[0];
        console.log(`Found user with password: ${user.Password}`); // Debug line
        
        // TODO: Implement proper password hashing comparison
        // For now, comparing plain text (NOT SECURE - for development only)
        if (user.Password === data.Password) {
            console.log("Login successful for user:", user.Email);
            // Remove password from returned user object for security
            const { Password, PasswordSalt, ...userWithoutPassword } = user;
            return userWithoutPassword;
        } else {
            console.log("Invalid password for user:", user.Email);
            return null;
        }
    } catch (error) {
        console.error("Failed to authenticate user:", error);
        throw error;
    }
}

var express = require("express");
var router = express.Router();

router.use((req, res, next) => {
    console.log('userAPI router middleware hit:', req.method, req.originalUrl);
    next();
});
router.use(express.json()); // Ensure JSON body parsing for all routes in this router

//console.log("userAPI router loaded"); 

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
    console.log('--- /addUser route hit ---');
    console.log('Raw req.body:', req.body);
    console.log('Raw req.query:', req.query);

    // Prefer body, fallback to query for Postman compatibility
    const source = Object.keys(req.body).length > 0 ? req.body : req.query;

    // Default fields to empty string or 1 for UserType if missing
    const FirstName = source.FirstName ? String(source.FirstName).trim() : '';
    const LastName = source.LastName ? String(source.LastName).trim() : '';
    const Email = source.Email ? String(source.Email).trim() : '';
    const Password = source.Password ? String(source.Password) : '';
    const PasswordSalt = source.PasswordSalt ? String(source.PasswordSalt) : '';
    const UserType = source.UserType && !isNaN(Number(source.UserType)) ? Number(source.UserType) : 1;

    console.log('Parsed fields:', { FirstName, LastName, Email, Password, PasswordSalt, UserType });

    // Validation: check for missing fields
    if (!FirstName || !LastName || !Email || !Password || !PasswordSalt || !UserType) {
        console.error('Missing required fields:', { FirstName, LastName, Email, Password, PasswordSalt, UserType });
        return res.status(400).json({ message: 'Missing required fields.', body: source });
    }

    try {
        const result = await addNewUser({ FirstName, LastName, Email, Password, PasswordSalt, UserType });
        console.log('User added successfully, DB result:', result);
        res.status(200).json({ message: 'User added successfully!', id: result.insertId });
    } catch (error) {
        console.error('Error in /addUser:', error); // Log the full error
        res.status(500).json({ message: 'Error adding user.', error: error.message });
    }
});


router.post("/updatePassword", async (req, res, next) => {
    console.log('--- /updatePassword route hit ---');
    console.log('Raw req.body:', req.body);
    console.log('Raw req.query:', req.query);
    
    // Prefer body, fallback to query for Postman compatibility
    const source = (req.body && Object.keys(req.body).length > 0) ? req.body : req.query;
    
    const data = {
        UserID: source.UserID,
        Password: source.Password,
        PasswordSalt: source.PasswordSalt
    };
    
    console.log('Received POST data for password update:', data);
    
    try {
        const result = await updatePassword(data);
        if (result.affectedRows > 0) {
            res.status(200).json({ message: 'Password updated successfully!' });
        } else {
            res.status(404).json({ message: 'User not found or password not updated.' });
        }
    } catch (error) {
        console.error('Password update error:', error);
        if (error.message.includes("required")) {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).send('Error updating password.');
    }
});

router.post("/login", async (req, res, next) => {
    console.log('--- /login route hit ---');
    console.log('Raw req.query:', req.query);
    
    const data = {
        Email: req.query.Email,
        Password: req.query.Password
    };
    
    console.log('Final parsed data:', data);
    console.log('Received login attempt for email:', data.Email);

    // Check if data is valid before proceeding
    if (!data.Email || !data.Password) {
        console.log('Missing Email or Password in request');
        return res.status(400).json({ 
            message: "Email and Password are required for login.",
            received: { Email: data.Email, Password: data.Password }
        });
    }

    try {
        const user = await loginUser(data);
        if (user) {
            res.status(200).json({ 
                message: 'Login successful!', 
                user: user 
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password.' });
        }
    } catch (error) {
        console.error('Login error details:', error);
        if (error.message.includes("required")) {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).send('Error during login.');
    }
});

// Test route to verify login endpoint exists
router.get("/test-login", (req, res) => {
    res.json({ message: "Login route is accessible" });
});

/**
 * Checks if an email already exists in the USER database
 * @param {string} email - The email to check
 * @returns {Promise<boolean>} True if email exists, false otherwise
 */
async function checkEmailExists(email) {
    if (!email) {
        throw new Error("Email is required to check for duplicates.");
    }

    try {
        console.log(`Checking if email exists: ${email}`);
        const sql = "SELECT COUNT(*) as count FROM USER WHERE Email = ?";
        const values = [email];

        const result = await db.executeQuery(sql, values);
        const exists = result[0].count > 0;
        
        console.log(`Email ${email} exists: ${exists}`);
        return exists;
    } catch (error) {
        console.error("Failed to check email existence:", error);
        throw error;
    }
}

router.get("/checkEmail", async (req, res, next) => {
    console.log('--- /checkEmail route hit ---');
    console.log('Raw req.query:', req.query);
    
    const { email } = req.query;
    
    if (!email) {
        return res.status(400).json({ exists: false, message: 'Email parameter is required' });
    }

    try {
        const exists = await checkEmailExists(email);
        res.json({ exists });
    } catch (error) {
        console.error('Error checking email:', error);
        res.status(500).json({ exists: false, message: 'Internal server error' });
    }
});

module.exports={router, addNewUser};