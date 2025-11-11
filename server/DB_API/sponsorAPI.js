const express = require("express");
const db = require("./db");
const user = require("./userAPI");

const router = express.Router();

router.use(express.json());
router.use(express.urlencoded({ extended: true }));

async function getAllSponsors() {
  const query = "SELECT * FROM SPONSOR";
  return db.executeQuery(query);
}

async function addSponsor({ Name }) {
  if (!Name || !Name.trim()) {
    throw new Error("Sponsor name is required.");
  }
  const sql = "INSERT INTO SPONSOR (Name) VALUES (?)";
  return db.executeQuery(sql, [Name.trim()]);
}

async function getAllSponsorUsers() {
  const query = `
    SELECT
      SU.SponsorUserID,
      SU.SponsorID,
      SU.UserID,
      U.FirstName,
      U.LastName,
      U.Email
    FROM SPONSOR_USER SU
    INNER JOIN USER U ON SU.UserID = U.UserID
  `;
  return db.executeQuery(query);
}

async function addSponsorUser(data) {
  const required = [
    "FirstName",
    "LastName",
    "Email",
    "Password",
    "PasswordSalt",
    "SponsorID",
  ];
  const missing = required.filter(
    (key) => !data[key] || data[key].toString().trim() === ""
  );
  if (missing.length) {
    throw new Error(`Missing required fields: ${missing.join(", ")}`);
  }

  const sponsorID = Number(data.SponsorID);
  if (!Number.isFinite(sponsorID)) {
    throw new Error("SponsorID must be a number.");
  }

  const userPayload = {
    FirstName: String(data.FirstName).trim(),
    LastName: String(data.LastName).trim(),
    Email: String(data.Email).trim(),
    Password: String(data.Password),
    PasswordSalt: String(data.PasswordSalt),
    UserType: data.UserType ?? 2,
  };

  const userResult = await user.addNewUser(userPayload);
  const sql = "INSERT INTO SPONSOR_USER (SponsorID, UserID) VALUES (?, ?)";
  return db.executeQuery(sql, [sponsorID, userResult.insertId]);
}

async function toggleSponsorUserActivity(sponsorUserId) {
  const rows = await db.executeQuery(
    "SELECT UserID FROM SPONSOR_USER WHERE SponsorUserID = ?",
    [sponsorUserId]
  );
  if (!rows.length) {
    throw new Error("Sponsor user not found.");
  }
  return db.executeQuery("CALL ToggleAccountActivity(?)", [rows[0].UserID]);
}

async function toggleSponsorActivity(sponsorId) {
  return db.executeQuery("CALL ToggleSponsorEnabled(?)", [sponsorId]);
}

router.get("/getAllSponsors", async (req, res) => {
  try {
    const sponsors = await getAllSponsors();
    res.json(sponsors);
  } catch (error) {
    console.error("Failed to fetch sponsors:", error);
    res.status(500).send("Database error.");
  }
});

router.get("/getSponsorForUser", async (req, res) => {
  const userID = req.query.UserID;
  if (!userID) {
    return res.status(400).json({ message: "UserID required" });
  }

  try {
    const sql = `
      SELECT S.*
      FROM SPONSOR_USER SU
      INNER JOIN SPONSOR S ON SU.SponsorID = S.SponsorID
      WHERE SU.UserID = ?
    `;
    const rows = await db.executeQuery(sql, [userID]);
    if (!rows.length) {
      return res.status(404).json({ message: "Sponsor not found for user" });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error("Error in getSponsorForUser:", error);
    res.status(500).send("Database error.");
  }
});

router.post("/addSponsor", async (req, res) => {
  try {
    const result = await addSponsor(req.body || {});
    res
      .status(200)
      .json({ message: "Sponsor added successfully!", id: result.insertId });
  } catch (error) {
    console.error("Failed to add sponsor:", error);
    res.status(400).json({ message: error.message });
  }
});

router.get("/getAllSponsorUsers", async (req, res) => {
  try {
    const sponsorUsers = await getAllSponsorUsers();
    res.json(sponsorUsers);
  } catch (error) {
    console.error("Failed to fetch sponsor users:", error);
    res.status(500).send("Database error.");
  }
});

router.post("/addSponsorUser", async (req, res) => {
  try {
    const result = await addSponsorUser(req.body || {});
    res.status(200).json({
      message: "Sponsor user added successfully!",
      id: result.insertId,
    });
  } catch (error) {
    console.error("Failed to add sponsor user:", error);
    res.status(400).json({ message: error.message });
  }
});

router.post("/toggleSponsorUserActivity/:sponsorUserId", async (req, res) => {
  const sponsorUserId = Number(req.params.sponsorUserId);
  if (!Number.isFinite(sponsorUserId)) {
    return res
      .status(400)
      .json({ message: "sponsorUserId route parameter is required." });
  }

  try {
    await toggleSponsorUserActivity(sponsorUserId);
    res.json({ message: "Sponsor user activity toggled." });
  } catch (error) {
    console.error("Failed to toggle sponsor user:", error);
    res.status(400).json({ message: error.message });
  }
});

router.post("/toggleSponsorActivity/:sponsorId", async (req, res) => {
  const sponsorId = Number(req.params.sponsorId);
  if (!Number.isFinite(sponsorId)) {
    return res
      .status(400)
      .json({ message: "sponsorId route parameter is required." });
  }

  try {
    await toggleSponsorActivity(sponsorId);
    res.json({ message: "Sponsor activity toggled." });
  } catch (error) {
    console.error("Failed to toggle sponsor:", error);
    res.status(400).json({ message: error.message });
  }
});

router.get("/debug", (req, res) => {
  res.json({
    message: "SponsorAPI debug route working",
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
