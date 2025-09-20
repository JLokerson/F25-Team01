

// Load environment variables from .env file
require('dotenv').config();
let mysql = require('mysql');

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  dbName: process.env.DB_NAME
};

let con = mysql.createConnection({
  host: dbConfig.host,
  user: dbConfig.user,
  password: dbConfig.password,
  database: dbConfig.dbName
});
var testStuff = "";
con.connect(function(err) {
  if (err) throw err;
  console.log("Connected!");
  con.query("select * from USER", function (err, result, fields) {
    if (err) throw err;
    console.log(result);
    testStuff = JSON.stringify(result);
  });
});

function addNewUser(data){
  console.log("Testing addNewUser func");
  console.log(data);
  // var parsedData = JSON.parse(data);
  var sql = "INSERT INTO USER (first_name, last_name, email, password) VALUES (?, ?, ?, ?)";
  var values = ["Julia", "Lokerson", "fakeer@mail.com", "password123"];
  con.query(sql, values, function (err, result, fields) {
        if (err) throw err;
        
        console.log("1 record inserted, ID: " + result.insertId);
        testStuff = JSON.stringify(data);
    });
};



var express = require("express");
var router=express.Router();

router.get("/", function(req, res, next) {
    res.send("Ohm can make an API work\n"+testStuff);
});

router.post("/addUser", (req, res, next) => {
    const data = req.body;
    console.log('Received POST data: ', data);
    addNewUser(data);

    res.status(200).send('Data received successfully!');
});

module.exports=router;