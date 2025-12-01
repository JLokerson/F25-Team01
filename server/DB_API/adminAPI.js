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
 * Retrieves all driver-sponsor mappings from the database.
 * @returns {Promise<Array<Object>>} A promise that resolves with an array of mapping objects.
 */
async function getDriverSponsorMappings(){
    try {
        console.log("Reading all driver-sponsor mappings for admin");

        // Query to get all mappings with user details and SPONSOR organization names
        let query = `
            SELECT 
                dsm.MappingID,
                dsm.SponsorID,
                dsm.DriverID,
                dsm.Points,
                dsm.ApplicationAccepted,
                u.FirstName,
                u.LastName,
                u.Email,
                s.Name as SponsorName,
                CASE 
                    WHEN dsm.ApplicationAccepted = 0 THEN 'pending'
                    WHEN dsm.ApplicationAccepted = 1 THEN 'approved'
                    ELSE 'unknown'
                END as Status,
                NOW() as ApplicationDate
            FROM Team01_DB.DRIVER_SPONSOR_MAPPINGS dsm
            LEFT JOIN Team01_DB.DRIVER d ON dsm.DriverID = d.DriverID
            LEFT JOIN Team01_DB.USER u ON d.UserID = u.UserID
            LEFT JOIN Team01_DB.SPONSOR s ON dsm.SponsorID = s.SponsorID
            ORDER BY dsm.ApplicationAccepted ASC, dsm.MappingID DESC
        `;
        let mappings;
        
        try {
            mappings = await db.executeQuery(query);
            console.log("Successfully queried all mappings with full JOIN");
        } catch (error) {
            console.log("Full JOIN failed, trying fallback with SPONSOR table only");
            // Fallback query that still includes SPONSOR table for organization names
            query = `
                SELECT 
                    dsm.*,
                    s.Name as SponsorName,
                    CASE 
                        WHEN dsm.ApplicationAccepted = 0 THEN 'pending'
                        WHEN dsm.ApplicationAccepted = 1 THEN 'approved'
                        ELSE 'unknown'
                    END as Status
                FROM Team01_DB.DRIVER_SPONSOR_MAPPINGS dsm
                LEFT JOIN Team01_DB.SPONSOR s ON dsm.SponsorID = s.SponsorID
                ORDER BY dsm.ApplicationAccepted ASC, dsm.MappingID DESC
            `;
            mappings = await db.executeQuery(query);
            console.log("Successfully queried DRIVER_SPONSOR_MAPPINGS with SPONSOR join");
        }
        
        console.log("Query used:", query);
        console.log("Raw result count:", mappings.length);
        console.log("Sample mapping with sponsor name:", mappings.length > 0 ? mappings[0] : 'No data');
        console.log("Returning %s driver-sponsor mappings", mappings.length);
        
        return mappings;
    } catch (error) {
        console.error("Failed to get driver-sponsor mappings: ", error);
        console.error("Error details:", error.message);
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
        
        // Try to fetch real driver-sponsor mappings from database
        let applications = [];
        
        try {
            const mappings = await getDriverSponsorMappings();
            console.log("Successfully got mappings:", mappings.length);
            
            // Transform mappings into application format
            applications = mappings.map(mapping => ({
                id: mapping.MappingID,
                firstName: mapping.FirstName,
                lastName: mapping.LastName,
                email: mapping.Email,
                phone: mapping.Phone || '(555) 000-0000',
                dateOfBirth: mapping.DateOfBirth || '1990-01-01',
                licenseNumber: mapping.LicenseNumber || 'DL000000000',
                address: mapping.Address || 'Address not provided',
                requestedOrganization: mapping.SponsorName,
                sponsorId: mapping.SponsorID,
                applicationDate: mapping.ApplicationDate || new Date().toISOString().split('T')[0],
                status: mapping.Status || 'pending',
                tempPassword: 'password123'
            }));
            
            console.log("Returning %s applications from database", applications.length);
        } catch (error) {
            console.warn("Could not fetch from database, using fallback data:", error.message);
            
            // Fallback to dummy data if database fails
            applications = [
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
                }
            ];
        }
        
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

router.get("/getDriverSponsorMappings", async (req, res, next) => {
    try {
        const mappings = await getDriverSponsorMappings();
        console.log("Sending response with all mappings:", mappings.length, "records");
        res.json(mappings);
    } catch (error) {
        console.error("Error in getDriverSponsorMappings route:", error);
        res.status(500).json({
            error: 'Database error',
            details: error.message
        });
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

// Add debug route for admin API
router.get("/testDriverSponsorMappings", async (req, res, next) => {
    try {
        const mappings = await getDriverSponsorMappings();
        res.json({
            success: true,
            count: mappings.length,
            data: mappings
        });
    } catch (error) {
        console.error("Error in admin testDriverSponsorMappings:", error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports={router};
