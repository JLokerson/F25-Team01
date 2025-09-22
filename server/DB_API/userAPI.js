//This file is for user related database api calls.

// Load environment variables from .env file
require('dotenv').config();
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  dbName: process.env.DB_NAME
};

//set up sql conneciton
const mysql = require('mysql2');
const pool = mysql.createPool({
    host: dbConfig.host,
    user: dbConfig.user,
    password: dbConfig.password,
    database: dbConfig.dbName,
    waitForConnections: true,
    queueLimit: 0
}).promise();

/**
 * A reusable function to execute a MySQL query using promises.
 *
 * @param {string} query - The SQL query string. Can include '?' placeholders.
 * @param {Array<any>} [values=[]] - An array of values to replace the placeholders.
 * @returns {Promise<Array<Object>>} A promise that resolves with the query results (rows).
 * @throws {Error} Throws an error if the query fails.
 */
async function executeQuery(query, values = []) {
    try {
        const [rows, metadata] = await pool.query(query, values);
        return rows;
    }
    catch (error) {
        console.error('Database query failed:', error);
        throw error;
    }
}


async function getAllUsers(){
    try{
        console.log("Reading all USER info");
        const allUsers = await executeQuery("SELECT * from USER");
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

async function getAllUsers(params){
    //plan to make this get more customizable
    ;
}

async function addNewUser(data){
    try {
        console.log("Inserting new User to User Table");
        console.log(data);
        const sql = "INSERT INTO USER (FirstName, LastName, Email, Password, PasswordSalt, UserType) VALUES (?, ?, ?, ?, ?, ?)";
        const values = [data.FirstName, data.LastName, data.Email, data.Password, data.PasswordSalt, data.UserType];

        const result = await executeQuery(sql, values);

        console.log("Record inserted, ID: " + result.insertId);
        return result; 
    }
    catch (error) {
        console.error("Failed to add new user:", error);
        throw error;
    }
};

async function updatePassword(){
    //stuff'll happen here eventually
}

var express = require("express");
var router=express.Router();

router.get("/getAllUsers", async function(req, res, next) {
    try {
        const users = await getAllUsers();
        res.json(users);
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


module.exports=router;