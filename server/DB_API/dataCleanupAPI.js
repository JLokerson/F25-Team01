//This file helps identify and fix data integrity issues
const db = require('./db');
const express = require("express");
const router = express.Router();

/**
 * Identifies all data integrity issues in the system
 */
async function identifyDataIssues() {
    try {
        const issues = [];

        // Check for duplicate drivers (same UserID)
        const duplicateDrivers = await db.executeQuery(`
            SELECT UserID, COUNT(*) as count, GROUP_CONCAT(DriverID) as DriverIDs 
            FROM DRIVER 
            GROUP BY UserID 
            HAVING COUNT(*) > 1
        `);
        
        if (duplicateDrivers.length > 0) {
            issues.push({
                type: 'duplicate_drivers',
                description: 'Users with multiple driver records',
                data: duplicateDrivers
            });
        }

        // Check for drivers with invalid SponsorID
        const invalidSponsorDrivers = await db.executeQuery(`
            SELECT d.DriverID, d.SponsorID, d.UserID, u.FirstName, u.LastName 
            FROM DRIVER d 
            INNER JOIN USER u ON d.UserID = u.UserID 
            WHERE d.SponsorID NOT IN (SELECT SponsorID FROM SPONSOR)
        `);
        
        if (invalidSponsorDrivers.length > 0) {
            issues.push({
                type: 'invalid_sponsor_references',
                description: 'Drivers referencing non-existent sponsors',
                data: invalidSponsorDrivers
            });
        }

        // Check for duplicate sponsor companies
        const duplicateSponsors = await db.executeQuery(`
            SELECT Name, COUNT(*) as count, GROUP_CONCAT(SponsorID) as SponsorIDs 
            FROM SPONSOR 
            GROUP BY Name 
            HAVING COUNT(*) > 1
        `);
        
        if (duplicateSponsors.length > 0) {
            issues.push({
                type: 'duplicate_sponsor_companies',
                description: 'Multiple sponsor records with same company name',
                data: duplicateSponsors
            });
        }

        // Check for sponsor users without corresponding sponsor companies
        const orphanedSponsorUsers = await db.executeQuery(`
            SELECT su.SponsorUserID, su.SponsorID, su.UserID, u.FirstName, u.LastName 
            FROM SPONSOR_USER su 
            INNER JOIN USER u ON su.UserID = u.UserID 
            WHERE su.SponsorID NOT IN (SELECT SponsorID FROM SPONSOR)
        `);
        
        if (orphanedSponsorUsers.length > 0) {
            issues.push({
                type: 'orphaned_sponsor_users',
                description: 'Sponsor users referencing non-existent sponsor companies',
                data: orphanedSponsorUsers
            });
        }

        return issues;
    } catch (error) {
        console.error("Failed to identify data issues:", error);
        throw error;
    }
}

/**
 * Fixes duplicate driver records by keeping the first one and removing duplicates
 */
async function fixDuplicateDrivers() {
    try {
        const duplicates = await db.executeQuery(`
            SELECT UserID, MIN(DriverID) as KeepDriverID, GROUP_CONCAT(DriverID) as AllDriverIDs 
            FROM DRIVER 
            GROUP BY UserID 
            HAVING COUNT(*) > 1
        `);

        let fixedCount = 0;
        for (const duplicate of duplicates) {
            const driverIDsToDelete = duplicate.AllDriverIDs.split(',')
                .filter(id => parseInt(id) !== duplicate.KeepDriverID);
            
            for (const driverID of driverIDsToDelete) {
                await db.executeQuery('DELETE FROM DRIVER WHERE DriverID = ?', [driverID]);
                fixedCount++;
            }
        }

        return { message: `Removed ${fixedCount} duplicate driver records`, fixedCount };
    } catch (error) {
        console.error("Failed to fix duplicate drivers:", error);
        throw error;
    }
}

/**
 * Fixes drivers with invalid SponsorID by setting them to a default sponsor
 */
async function fixInvalidSponsorReferences(defaultSponsorID = 1) {
    try {
        const result = await db.executeQuery(`
            UPDATE DRIVER 
            SET SponsorID = ? 
            WHERE SponsorID NOT IN (SELECT SponsorID FROM SPONSOR)
        `, [defaultSponsorID]);

        return { 
            message: `Fixed ${result.affectedRows} drivers with invalid sponsor references`, 
            fixedCount: result.affectedRows,
            defaultSponsorID 
        };
    } catch (error) {
        console.error("Failed to fix invalid sponsor references:", error);
        throw error;
    }
}

// Routes
router.use(express.json());

router.get("/identify-issues", async (req, res) => {
    try {
        const issues = await identifyDataIssues();
        res.json({
            totalIssues: issues.length,
            issues: issues
        });
    } catch (error) {
        console.error('Error identifying data issues:', error);
        res.status(500).json({ message: 'Error identifying data issues', error: error.message });
    }
});

router.post("/fix-duplicate-drivers", async (req, res) => {
    try {
        const result = await fixDuplicateDrivers();
        res.json(result);
    } catch (error) {
        console.error('Error fixing duplicate drivers:', error);
        res.status(500).json({ message: 'Error fixing duplicate drivers', error: error.message });
    }
});

router.post("/fix-invalid-sponsors", async (req, res) => {
    try {
        const defaultSponsorID = req.body.defaultSponsorID || 1;
        const result = await fixInvalidSponsorReferences(defaultSponsorID);
        res.json(result);
    } catch (error) {
        console.error('Error fixing invalid sponsor references:', error);
        res.status(500).json({ message: 'Error fixing invalid sponsor references', error: error.message });
    }
});

router.get("/summary", async (req, res) => {
    try {
        const summary = {};
        
        // Get counts
        const sponsorCount = await db.executeQuery('SELECT COUNT(*) as count FROM SPONSOR');
        const sponsorUserCount = await db.executeQuery('SELECT COUNT(*) as count FROM SPONSOR_USER');
        const driverCount = await db.executeQuery('SELECT COUNT(*) as count FROM DRIVER');
        const userCount = await db.executeQuery('SELECT COUNT(*) as count FROM USER');
        
        // Get unique counts
        const uniqueDriverUsers = await db.executeQuery('SELECT COUNT(DISTINCT UserID) as count FROM DRIVER');
        const uniqueSponsorUsers = await db.executeQuery('SELECT COUNT(DISTINCT UserID) as count FROM SPONSOR_USER');
        
        summary.totals = {
            sponsorCompanies: sponsorCount[0].count,
            sponsorUsers: sponsorUserCount[0].count,
            driverRecords: driverCount[0].count,
            totalUsers: userCount[0].count,
            uniqueDriverUsers: uniqueDriverUsers[0].count,
            uniqueSponsorUsers: uniqueSponsorUsers[0].count
        };

        const issues = await identifyDataIssues();
        summary.issues = {
            count: issues.length,
            types: issues.map(i => i.type)
        };

        res.json(summary);
    } catch (error) {
        console.error('Error getting data summary:', error);
        res.status(500).json({ message: 'Error getting data summary', error: error.message });
    }
});

module.exports = {router};
