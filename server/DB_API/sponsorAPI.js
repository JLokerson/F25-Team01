const express = require("express");
const db = require("./db");
const user = require("./userAPI");

/**
 * Creates a new Sponsor.
 * @param {object} data - The Sponsor data to be added.
 * @returns {Promise<object>} A promise that resolves with the result of the sponsor table insertion.
 */
async function addSponsor(data) {
    try {
        console.log("Inserting new Company to Sponsor Table");
        console.log(data);
        
        // Handle both Name only and full sponsor data
        let sql, values;
        if (data.PointRatio !== undefined && data.EnabledSponsor !== undefined) {
            // Full sponsor organization with all fields
            sql = "INSERT INTO SPONSOR (Name, PointRatio, EnabledSponsor) VALUES (?, ?, ?)";
            values = [data.Name, data.PointRatio, data.EnabledSponsor];
        } else {
            // Simple sponsor with just name (for backward compatibility)
            sql = "INSERT INTO SPONSOR (Name) VALUES (?)";
            values = [data.Name];
        }

router.use(express.json());
router.use(express.urlencoded({ extended: true }));

async function getAllSponsors() {
  const query = "SELECT * FROM SPONSOR";
  return db.executeQuery(query);
}

/**
 * Retrieves all Sponsor Users by joining the Sponsor User and User tables.
 * @returns {Promise<Array<Object>>} A promise that resolves with an array of admin user objects.
 */
async function getAllSponsorUsers(){
    try {
        console.log("Reading all sponsor user info (including inactive accounts)");

        const query = "SELECT SPONSOR_USER.SponsorUserID, SPONSOR_USER.SponsorID,\
                        SPONSOR_USER.UserID, USER.FirstName, USER.LastName, USER.Email, USER.ActiveAccount FROM SPONSOR_USER \
                        INNER JOIN USER ON SPONSOR_USER.USERID = USER.USERID;";
        const allSponsorUsers = await db.executeQuery(query);
        console.log("Returning %s Sponsor Users (including inactive)", allSponsorUsers.length);
        return allSponsorUsers;
    } catch (error) {
        console.error("Failed to get all sponsor users: ", error);
        throw error;
    }
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

router.post("/addSponsor", async (req, res, next) => {
    console.log('Request body:', req.body);
    console.log('Request query:', req.query);
    
    // Use req.body directly since it's being parsed correctly
    const data = req.body;
    
    // Fallback to query if body is empty (for backward compatibility)
    if (!data || Object.keys(data).length === 0) {
        data = req.query;
    }
    
    console.log('Final data being used:', data);
    
    try {
        const result = await addSponsor(data);
        res.status(200).json({ message: 'Sponsor added successfully!', id: result.insertId });
    } catch (error) {
        console.error('Error in addSponsor route:', error);
        res.status(500).send('Error adding sponsor.');
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
    console.log('Debug route hit successfully');
    res.json({ 
        message: 'SponsorAPI debug route working',
        timestamp: new Date().toISOString(),
        routes: 'All routes functional'
    });
});

router.post("/toggleSponsorUserActivity/:sponsorID", async (req, res, next) => {
    const sponsorID = req.params.sponsorID;
    console.log('Received disable request for sponsor ID:', sponsorID);
    try {
        const result = await toggleSponsorUserActivity(sponsorID);
        res.status(200).json({ message: 'Sponsor user activity toggled successfully!' });
    } catch (error) {
        console.error('Error toggling activity for sponsor user:', error);
        res.status(500).send('Error toggling activity for sponsor user.');
    }
});

router.post("/toggleSponsorActivity/:sponsorID", async (req, res, next) => {
    const sponsorID = req.params.sponsorID;
    console.log('Received disable request for sponsor ID:', sponsorID);
    try {
        const result = await toggleSponsorActivity(sponsorID);
        res.status(200).json({ message: 'Sponsor activity toggled successfully!' });
    } catch (error) {
        console.error('Error toggling activity for sponsor:', error);
        res.status(500).send('Error toggling activity for sponsor.');
    }
});

/**
 * Updates an existing Sponsor organization.
 * @param {object} data - The Sponsor data to be updated.
 * @returns {Promise<object>} A promise that resolves with the result of the sponsor table update.
 */
async function updateSponsor(data) {
    try {
        console.log("Updating sponsor organization");
        console.log(data);
        const sql = "UPDATE SPONSOR SET Name = ?, PointRatio = ?, EnabledSponsor = ? WHERE SponsorID = ?";
        const values = [data.Name, data.PointRatio, data.EnabledSponsor, data.SponsorID];

        const result = await db.executeQuery(sql, values);

        console.log("Sponsor organization updated, ID: " + data.SponsorID);
        return result; 
    }
    catch (error) {
        console.error("Failed to update sponsor:", error);
        throw error;
    }
}

/**
 * Updates a sponsor user's information.
 * @param {object} data - The sponsor user data to be updated.
 * @returns {Promise<object>} A promise that resolves with the result of the update.
 */
async function updateSponsorUser(data) {
    try {
        console.log("Updating sponsor user with data:", data);
        
        // Update the USER table first
        const userResult = await user.updateUser(data);
        
        console.log("Sponsor user updated successfully");
        return userResult;
    } catch (error) {
        console.error("Failed to update sponsor user:", error);
        throw error;
    }
}

router.post("/updateSponsor", async (req, res, next) => {
    const data = req.body;
    console.log('Received POST data for sponsor update: ', data);
    try {
        const result = await updateSponsor(data);
        res.status(200).json({ message: 'Sponsor organization updated successfully!', result });
    } catch (error) {
        console.error('Error updating sponsor:', error);
        res.status(500).send('Error updating sponsor organization.');
    }
});

router.post("/updateSponsorUser", async (req, res, next) => {
    const data = req.body;
    console.log('Received POST data for sponsor user update: ', data);
    try {
        const result = await updateSponsorUser(data);
        res.status(200).json({ message: 'Sponsor user updated successfully!', result });
    } catch (error) {
        console.error('Error updating sponsor user:', error);
        res.status(500).send('Error updating sponsor user.');
    }
});

module.exports = router;
