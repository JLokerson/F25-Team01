// Use express
const express = require("express");
const db = require("./db");

const router = express.Router();

// Ensure JSON payloads are parsed for all routes mounted here
router.use(express.json());

/**
 * Validate and normalize sponsor/category identifiers.
 * @param {object} data
 * @returns {{SponsorID:number, CategoryID:string}}
 */
function extractSponsorCategory(data = {}) {
  // Converts number from data.SponsorID and data.CategoryID into a String for later use
  const SponsorID = Number(data.SponsorID || data.sponsorID);
  const CategoryID = (data.CategoryID || data.categoryID || "")
    .toString()
    .trim();

  // Check if SponsorID is a real number that is greater than 0
  if (!Number.isFinite(SponsorID) || !isNaN(SponsorID) || SponsorID <= 0) {
    const err = new Error(
      "SponsorID is required and must be a positive number."
    );
    err.status = 400;
    throw err;
  }

  // Check if CategoryID is non null
  if (!CategoryID) {
    const err = new Error("CategoryID is required.");
    err.status = 400;
    throw err;
  }

  console.log(`Got ${SponsorID} : ${CategoryID}`);
  return { SponsorID, CategoryID };
}

/**
 * Return every catalog row for a sponsor. This mirrors the provided
 * `CATALOG` table (CatalogID, SponsorID, CategoryID, Active).
 */
async function getAllCategoriesForSponsor(sponsorID) {
  const sql = `
    SELECT CatalogID, SponsorID, CategoryID, Active
    FROM CATALOG
    WHERE SponsorID = ?
    ORDER BY Active DESC, CatalogID ASC
  `;
  return db.executeQuery(sql, [sponsorID]);
}

async function addCategoryForSponsor(payload) {
  const { SponsorID, CategoryID } = extractSponsorCategory(payload);

  const lookupSql =
    "SELECT CatalogID FROM CATALOG WHERE SponsorID = ? AND CategoryID = ? LIMIT 1";
  const existing = await db.executeQuery(lookupSql, [SponsorID, CategoryID]);
  if (existing.length) {
    await db.executeQuery("UPDATE CATALOG SET Active = 1 WHERE CatalogID = ?", [
      existing[0].CatalogID,
    ]);
    return { catalogId: existing[0].CatalogID, created: false };
  }
  const insertSql =
    "INSERT INTO CATALOG (SponsorID, CategoryID, Active) VALUES (?, ?, 1)";
  const result = await db.executeQuery(insertSql, [SponsorID, CategoryID]);
  return { catalogId: result.insertId, created: true };
}

/**
 * Toggle the Active flag for a sponsor/category combo.
 */
async function updateCategoryStatus(payload) {
  const { SponsorID, CategoryID } = extractSponsorCategory(payload);
  const activeFlag = payload.Active ?? payload.active ?? payload.Status;

  if (activeFlag === undefined || activeFlag === null) {
    const err = new Error(
      "Active flag is required (use 1 for active, 0 for inactive)."
    );
    err.status = 400;
    throw err;
  }

  const Active = Number(activeFlag) ? 1 : 0;
  const sql = `
    UPDATE CATALOG
    SET Active = ?
    WHERE SponsorID = ? AND CategoryID = ?
  `;

  const result = await db.executeQuery(sql, [Active, SponsorID, CategoryID]);
  if (result.affectedRows === 0) {
    const err = new Error("Category mapping not found for sponsor.");
    err.status = 404;
    throw err;
  }
  return { updated: true, active: Active };
}

/**
 * GET /catalogAPI/getAllCategories
 * Returns every category code assigned to the sponsor (used in sprint8-feat-catalogapi-new).
 * Name/Img are currently null placeholders until we persist metadata locally.
 */
router.get("/getAllCategories", async (req, res) => {
  const sponsorID = Number(req.query.SponsorID || req.query.sponsorID);
  if (!Number.isFinite(sponsorID) || sponsorID <= 0) {
    return res
      .status(400)
      .json({ message: "SponsorID query parameter is required." });
  }

  try {
    const categories = await getAllCategoriesForSponsor(sponsorID);
    const normalized = categories.map((row) => ({
      catalogId: row.CatalogID,
      sponsorId: row.SponsorID,
      categoryId: row.CategoryID,
      active: Boolean(row.Active),
      name: null,
      img: null,
    }));
    res.json({ sponsorID, categories: normalized });
  } catch (err) {
    console.error("getAllCategories error:", err);
    res
      .status(500)
      .json({ message: "Failed to fetch categories.", error: err.message });
  }
});

/**
 * POST /catalogAPI/addCategory
 * Assigns a BestBuy category code to a sponsor (adds row to CATALOG or reactivates existing entry).
 */
router.post("/addCategory", async (req, res) => {
  const data = Object.keys(req.body || {}).length ? req.body : req.query;
  try {
    const result = await addCategoryForSponsor(data);
    res.status(200).json({
      message: "Category assigned successfully.",
      sponsorID: Number(data.SponsorID || data.sponsorID),
      categoryID: data.CategoryID || data.categoryID,
      catalogID: result.catalogId,
      created: result.created,
    });
  } catch (err) {
    console.error("addCategory error:", err);
    res
      .status(err.status || 500)
      .json({ message: err.message || "Failed to add category." });
  }
});

/**
 * POST /catalogAPI/updateCategoryStatus
 * Toggles the Active flag on a catalog row (0 = inactive, 1 = active).
 */
router.post("/updateCategoryStatus", async (req, res) => {
  const data = Object.keys(req.body || {}).length ? req.body : req.query;
  try {
    const result = await updateCategoryStatus(data);
    res.status(200).json({
      message: "Category status updated.",
      sponsorID: Number(data.SponsorID || data.sponsorID),
      categoryID: data.CategoryID || data.categoryID,
      active: result.active,
    });
  } catch (err) {
    console.error("updateCategoryStatus error:", err);
    res
      .status(err.status || 500)
      .json({ message: err.message || "Failed to update category status." });
  }
});

module.exports = { router };
