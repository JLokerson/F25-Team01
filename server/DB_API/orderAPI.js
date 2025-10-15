//This file is for admin related database api calls.
const db = require('./db'); //shared database connection pool
const user = require('./userAPI');


// Add order
async function AddOrder(data){
    let sql;
    let values;

    try {
        console.log("Adding Order.");
        sql = "INSERT INTO ORDERS (ProductID, DriverID, PurchasedAtPrice, OrderStatus, DeliveredOn) VALUES (?, ?, ?, ?, ?)";
        values = [data.ProductID, data.DriverID, data.PurchasedAtPrice, 'Placed', null];
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
}


// Update order state
async function UpdateOrderState(){
    if (!data.OrderID || !data.NewStatus) {
        throw new Error("Order Update Input Params Missing");
    }

    try {
        console.log(`Updating Order Status for OrderID: ${data.OrderID}`);
        // Update both password and LastLogin when password is changed
        const sql = "UPDATE ORDERS SET OrderStatus = ? WHERE OrderID = ?";
        const values = [data.NewStatus, data.OrderID];

        const result = await db.executeQuery(sql, values);

        console.log(`Update result: ${result.affectedRows} rows affected.`);
        console.log(`Updated order status for UserID: ${data.OrderID}`);
        return result;
    } catch (error) {
        console.error("Failed to update order status:", error);
        throw error;
    }
}

router.post("/updateOrderStatus", async (req, res, next) => {
    console.log('--- /updateOrderStatus route hit ---');
    console.log('Raw req.body:', req.body);
    console.log('Raw req.query:', req.query);
    
    // Prefer body, fallback to query for Postman compatibility
    const source = (req.body && Object.keys(req.body).length > 0) ? req.body : req.query;
    
    const data = {
        OrderID: source.OrderID,
        NewStatus: source.NewStatus,
    };
    
    console.log('Received POST data for status update:', data);
    
    try {
        const result = await updatePassword(data);
        if (result.affectedRows > 0) {
            res.status(200).json({ message: 'status updated successfully!' });
        } else {
            res.status(404).json({ message: 'Order not updated.' });
        }
    } catch (error) {
        console.error('Order update error:', error);
        if (error.message.includes("required")) {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).send('Error updating order.');
    }
});