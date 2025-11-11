//This file is for admin related database api calls.
const db = require('./db'); //shared database connection pool
const user = require('./userAPI');
/**
 * Retrieves all admins by joining the Admin and User tables.
 * @returns {Promise<Array<Object>>} A promise that resolves with an array of admin user objects.
 */
async function getAllAdmins(){
    try {
        console.log("Reading all admin user info");

        const query = "SELECT ADMIN.AdminID, ADMIN.UserID, USER.FirstName, USER.LastName, USER.Email FROM ADMIN \
                        INNER JOIN USER ON ADMIN.USERID = USER.USERID;";
        const allAdmins = await db.executeQuery(query);
        console.log("Returning %s Admins", allAdmins.length);
        return allAdmins;
    } catch (error) {
        console.error("Failed to get all admins: ", error);
        throw error;
    }
}

// Fetches audit log records
async function getAuditRecords(){
    try {
        console.log("Reading audit records");

        const query = "call RetrieveAuditData();";
        const AuditRecords = await db.executeQuery(query);
        console.log("Returning %s audit records", AuditRecords.length);
        return AuditRecords;
    } catch (error) {
        console.error("Failed to get all audit records: ", error);
        throw error;
    }
}

/**
 * Creates a new user and then adds the corresponding UserID to the Admin table.
 * @param {object} data - The user data to be added.
 * @returns {Promise<object>} A promise that resolves with the result of the admin table insertion.
 */
async function addAdmin(data) {
    try {
        const userResult = await user.addNewUser(data);
        const newUserId = userResult.insertId;

        console.log("Adding new admin with UserID:", newUserId);
        const sql = "INSERT INTO ADMIN (UserID) VALUES (?)";
        const adminResult = await db.executeQuery(sql, [newUserId]);

        console.log("New admin record created successfully.");
        return adminResult;
    } catch (error) {
        console.error("Failed to add new admin:", error);
        throw error;
    }
}

/**
 * Retrieves all driver applications from all sponsor organizations.
 * @returns {Promise<Array<Object>>} A promise that resolves with an array of application objects.
 */
async function getAllApplications(){
    try {
        console.log("Reading all driver applications");
        
        // For now, return dummy data since we don't have an APPLICATIONS table yet
        // This would be replaced with a real database query once the table is created
        // Updated to match real sponsors from Team01_DB.SPONSOR table
        const applications = [
            {
                id: 1,
                firstName: 'John',
                lastName: 'Doe',
                email: 'jdoe@email.com',
                phone: '(555) 123-4567',
                dateOfBirth: '1990-05-15',
                licenseNumber: 'DL123456789',
                address: '123 Main St, City, State 12345',
                requestedOrganization: 'RandTruckCompany',
                sponsorId: 1,
                applicationDate: '2024-01-15',
                status: 'pending',
                tempPassword: 'password123'
            },
            {
                id: 2,
                firstName: 'Jane',
                lastName: 'Smith',
                email: 'jsmith@email.com',
                phone: '(555) 987-6543',
                dateOfBirth: '1988-09-22',
                licenseNumber: 'DL987654321',
                address: '456 Oak Ave, City, State 54321',
                requestedOrganization: 'CoolTruckCompany',
                sponsorId: 3,
                applicationDate: '2024-01-18',
                status: 'pending',
                tempPassword: 'password456'
            },
            {
                id: 3,
                firstName: 'Mike',
                lastName: 'Johnson',
                email: 'mjohnson@email.com',
                phone: '(555) 555-1234',
                dateOfBirth: '1985-03-10',
                licenseNumber: 'DL555123456',
                address: '789 Pine Rd, City, State 67890',
                requestedOrganization: 'AwesomeTruckCompany',
                sponsorId: 4,
                applicationDate: '2024-01-20',
                status: 'pending',
                tempPassword: 'password789'
            },
            {
                id: 4,
                firstName: 'Sarah',
                lastName: 'Williams',
                email: 'swilliams@email.com',
                phone: '(555) 444-7890',
                dateOfBirth: '1992-07-25',
                licenseNumber: 'DL444789012',
                address: '321 Elm St, City, State 54321',
                requestedOrganization: 'RandTruckCompany',
                sponsorId: 5,
                applicationDate: '2024-01-22',
                status: 'approved',
                tempPassword: 'passwordabc',
                approvedBy: 'Admin John Smith',
                approvedDate: '2024-01-23'
            }
        ];
        
        console.log("Returning %s applications", applications.length);
        return applications;
    } catch (error) {
        console.error("Failed to get all applications: ", error);
        throw error;
    }
}

/**
 * Updates an application status (approve/deny).
 * @param {object} data - The application update data.
 * @returns {Promise<object>} A promise that resolves with the update result.
 */
async function updateApplicationStatus(data) {
    try {
        console.log("Updating application status:", data);
        
        // For now, return a success response since we don't have an APPLICATIONS table yet
        // This would be replaced with a real database update once the table is created
        /*
        const sql = "UPDATE APPLICATIONS SET status = ?, processedBy = ?, processedDate = ?, denialReason = ? WHERE id = ?";
        const values = [data.status, data.processedBy, new Date(), data.denialReason || null, data.applicationId];
        const result = await db.executeQuery(sql, values);
        */
        
        const result = { affectedRows: 1, message: 'Application status updated successfully' };
        console.log("Application status updated successfully");
        return result;
    } catch (error) {
        console.error("Failed to update application status:", error);
        throw error;
    }
}


var express = require("express");
var router=express.Router();


router.get("/getAllAdmins", async (req, res, next) => {
    try {
        const admins = await getAllAdmins();
        res.json(admins);
    } catch (error) {
        res.status(500).send('Database error.');
    }
});

router.get("/getAuditRecords", async (req, res, next) => {
    try {
        const auditlog = await getAuditRecords();
        res.json(auditlog);
    } catch (error) {
        res.status(500).send('Database error.');
    }
});

router.post("/addAdmin", async (req, res, next) => {
    const data = req.query;
    console.log('Received POST data for new admin: ', data);
    try {
        const result = await addAdmin(data);
        res.status(200).json({ message: 'Admin user added successfully!', id: result.insertId });
    } catch (error) {
        res.status(500).send('Error adding admin user.');
    }
});

router.get("/getAllApplications", async (req, res, next) => {
    try {
        const applications = await getAllApplications();
        res.json(applications);
    } catch (error) {
        res.status(500).send('Database error.');
    }
});

router.post("/updateApplicationStatus", async (req, res, next) => {
    const data = req.query;
    console.log('Received POST data for application status update: ', data);
    try {
        const result = await updateApplicationStatus(data);
        res.status(200).json({ message: 'Application status updated successfully!', result });
    } catch (error) {
        res.status(500).send('Error updating application status.');
    }
});

module.exports={router};
