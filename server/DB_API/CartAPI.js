const db = require("./db");

async function getCartItems(data) {
  let sql;
  let values;

  if (data.DriverID) {
    console.log(`Querying CART_MAPPINGS by DriverID: ${data.DriverID}`);
    sql = "SELECT * FROM CART_MAPPINGS WHERE DriverID = ?";
    values = [data.DriverID];
  }

  try {
    const cartitems = await db.executeQuery(sql, values);
    if (cartitems.length > 0) {
      console.log(
        "Found " + cartitems.length + " items for Driver " + data.DriverID
      );
      return cartitems;
    } else {
      console.log("Empty cart.");
      return null;
    }
  } catch (error) {
    console.error("Failed to get cart items:", error);
    throw error;
  }
}

async function removeAllCartItems(data) {
  let sql;
  let values;
  try {
    values = data.DriverID;
  } catch (error) {
    values = null;
  }
  //console.log("attempting to delete along" + data);
  if (values != null) {
    console.log(`Removing from CART_MAPPINGS by DriverID: ${data.DriverID}`);
    sql = "DELETE FROM CART_MAPPINGS WHERE DriverID = ?";
    values = [data.DriverID];
  }

  try {
    await db.executeQuery(sql, values);
  } catch (error) {
    console.error("Failed to delete cart items:", error);
    throw error;
  }
  return null;
}

async function addToCart(data) {
  try {
    console.log("Inserting new entry to CART_MAPPINGS table");
    console.log(data);
    const sql = "INSERT INTO CART_MAPPINGS (DriverID, ProductID) VALUES (?, ?)";
    const values = [data.DriverID, data.ProductID];

    const result = await db.executeQuery(sql, values);

    console.log("Record inserted, ID: " + result.insertId);
    return result;
  } catch (error) {
    console.error("Failed to add new cart mapping:", error);
    throw error;
  }
}

// Returns all mappings for a specific item, useful in case we want statistics
// on item popularity that we can present to sponsors when editing the catalog.
async function getCartsFromItems(data) {
  let sql;
  let values;

  // Prioritize searching by Product if it's provided.
  if (data.ProductID) {
    console.log(`Querying CART_MAPPINGS by ProductID: ${data.ProductID}`);
    sql = "SELECT * FROM CART_MAPPINGS WHERE ProductID = ?";
    values = [data.ProductID];
  }

  try {
    const cartitems = await db.executeQuery(sql, values);
    if (cartitems.length > 0) {
      console.log(
        "Found " + cartitems.length + " items for Product " + data.ProductID
      );
      return cartitems; // users[0] Return the first user found (should be unique by ID or email combo)
    } else {
      console.log("Empty cart.");
      return null;
    }
  } catch (error) {
    console.error("Failed to get cart items:", error);
    throw error;
  }
}

// Remove a single product from a driver's cart by MappingID
async function removeProductFromCart(mappingID, driverID) {
  try {
    console.log(
      `Removing item ${mappingID} from cart for DriverID: ${driverID}`
    );

    // Validate inputs
    if (!Number.isFinite(mappingID) || mappingID <= 0) {
      const err = new Error("MappingID must be a positive number");
      err.status = 400;
      throw err;
    }

    if (!Number.isFinite(driverID) || driverID <= 0) {
      const err = new Error("DriverID must be a positive number");
      err.status = 400;
      throw err;
    }

    // Verify the item belongs to this driver before deleting
    const verifyQuery = `
            SELECT MappingID FROM CART_MAPPINGS
            WHERE MappingID = ? AND DriverID = ?
            LIMIT 1
        `;

    const verification = await db.executeQuery(verifyQuery, [
      mappingID,
      driverID,
    ]);

    if (verification.length === 0) {
      const err = new Error(
        "Cart item not found or does not belong to this driver"
      );
      err.status = 404;
      throw err;
    }

    // Delete from CART_MAPPINGS
    const deleteQuery = `
            DELETE FROM CART_MAPPINGS
            WHERE MappingID = ? AND DriverID = ?
        `;

    const result = await db.executeQuery(deleteQuery, [mappingID, driverID]);

    console.log(`Successfully removed item ${mappingID} from cart`);

    return {
      success: true,
      mappingID,
      message: "Product removed from cart successfully",
    };
  } catch (error) {
    console.error("Failed to remove product from cart:", error);
    throw error;
  }
}

var express = require("express");
var router = express.Router();

router.post("/removeCartItems", async (req, res, next) => {
  //console.log(req);
  try {
    await removeAllCartItems(req.query);
    res.status(200).json({ message: "Cart items removed successfully!" });
  } catch (error) {
    res.status(500).send("Unknown error in deletion process.");
  }
});

router.get("/getCartItems", async (req, res, next) => {
  try {
    const cart = await getCartItems(req.query);
    if (cart) {
      res.json(cart);
    } else {
      res
        .status(404)
        .json({ message: "Cart not found or bad query parameters." });
    }
  } catch (error) {
    res.status(500).send("Database error.");
  }
});

router.post("/addCartItem", async (req, res, next) => {
  const data = req.body;
  console.log("Received POST data for new cart item: ", data);
  try {
    const result = await addToCart(data);
    res
      .status(200)
      .json({ message: "Cart item added successfully!", id: result.insertId });
  } catch (error) {
    res.status(500).send("Error adding cart item user.");
  }
});

router.get("/getItemMappings", async function (req, res, next) {
  try {
    const returns = await getCartsFromItems(req.query);
    res.json(returns);
  } catch (error) {
    res.status(500).send("Database error.");
  }
});

// ===== NEW LAYER 2 ROUTES =====
// DELETE /cartAPI/deleteCartItems - alias for removeCartItems (expected by frontend)
router.delete("/deleteCartItems", async (req, res, next) => {
  try {
    await removeAllCartItems(req.query);
    res.status(200).json({ message: "Cart items removed successfully!" });
  } catch (error) {
    res.status(500).send("Unknown error in deletion process.");
  }
});

// DELETE /cartAPI/removeFromCart - remove single item by MappingID
router.delete("/removeFromCart", async (req, res, next) => {
  const data = req.body || {};
  const mappingID = Number(data.MappingID || data.mappingID);
  const driverID = Number(data.DriverID || data.driverID);

  console.log("Received DELETE /removeFromCart request:", {
    mappingID,
    driverID,
  });

  // Validate inputs
  if (!Number.isFinite(mappingID) || mappingID <= 0) {
    console.error("Invalid MappingID provided:", mappingID);
    return res.status(400).json({
      message: "MappingID is required and must be a positive number",
    });
  }

  if (!Number.isFinite(driverID) || driverID <= 0) {
    console.error("Invalid DriverID provided:", driverID);
    return res.status(400).json({
      message: "DriverID is required and must be a positive number",
    });
  }

  try {
    const result = await removeProductFromCart(mappingID, driverID);
    res.json(result);
  } catch (error) {
    console.error("Error removing product from cart:", error);
    res.status(error.status || 500).json({
      message: error.message || "Failed to remove product from cart",
    });
  }
});

module.exports = { router };
