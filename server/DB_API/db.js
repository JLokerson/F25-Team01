require("dotenv").config();
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  dbName: process.env.DB_NAME,
};

//set up sql conneciton
const mysql = require("mysql2");
const pool = mysql
  .createPool({
    host: dbConfig.host,
    user: dbConfig.user,
    password: dbConfig.password,
    database: dbConfig.dbName,
    waitForConnections: true,
    queueLimit: 0,
  })
  .promise();

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
  } catch (error) {
    console.error("(!) Database query failed:", error);
    throw error;
  }
}

module.exports = { executeQuery };
