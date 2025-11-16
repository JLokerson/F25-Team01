import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import AdminNavbar from './AdminNavbar';
import { GenerateSalt } from './MiscellaneousParts/HashPass';

export default function AdminUserManagement() {
    const [drivers, setDrivers] = useState([]);
    const [sponsors, setSponsors] = useState([]);
    const [sponsorUsers, setSponsorUsers] = useState([]);
    const [sponsorOrgs, setSponsorOrgs] = useState([]); // Add this for SPONSOR table
    const [admins, setAdmins] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('users'); // Add tab state
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showEditSponsorModal, setShowEditSponsorModal] = useState(false);
    const [showEditAdminModal, setShowEditAdminModal] = useState(false);
    const [showAddSponsorOrgModal, setShowAddSponsorOrgModal] = useState(false); // Add modal state
    const [showEditSponsorOrgModal, setShowEditSponsorOrgModal] = useState(false);
    const [editingDriver, setEditingDriver] = useState(null);
    const [editingSponsor, setEditingSponsor] = useState(null);
    const [editingAdmin, setEditingAdmin] = useState(null);
    const [editingSponsorOrg, setEditingSponsorOrg] = useState(null); // Add editing state
    const [newDriver, setNewDriver] = useState({
        FirstName: '',
        LastName: '',
        Email: '',
        Password: '',
        SponsorID: '',
        PasswordSalt: ''
    });
    const [newSponsorOrg, setNewSponsorOrg] = useState({ // Add new sponsor org state
        Name: '',
        PointRatio: 0.01,
        EnabledSponsor: 1
    });
    const [search, setSearch] = useState("");
    const [userTypeFilter, setUserTypeFilter] = useState("all");
    const [sponsorOrgSearch, setSponsorOrgSearch] = useState(""); // Add search for sponsor orgs
    const [isFixingDrivers, setIsFixingDrivers] = useState(false);

    const fetchAllUsers = async () => {
        try {
            console.log('=== FETCHING ALL USERS ===');
            const response = await fetch(`http://localhost:4000/userAPI/getAllUsers`);
            console.log('Users API response status:', response.status);
            
            if (response.ok) {
                const responseText = await response.text();
                console.log('Raw users response text:', responseText);
                
                let allUsersData;
                try {
                    allUsersData = JSON.parse(responseText);
                    console.log('Parsed users data:', allUsersData);
                } catch (parseError) {
                    console.error('Failed to parse users JSON:', parseError);
                    setAllUsers([]);
                    return;
                }
                
                if (!Array.isArray(allUsersData)) {
                    console.error('Users data is not an array:', allUsersData);
                    setAllUsers([]);
                    return;
                }
                
                // Process and categorize users by UserType
                const processedUsers = allUsersData.map((user, index) => {
                    console.log(`Processing user ${index}:`, user);
                    
                    const processed = {
                        ...user,
                        // Normalize field names
                        UserID: user.UserID || user.userID || user.user_id,
                        FirstName: user.FirstName || user.firstName || user.first_name || '',
                        LastName: user.LastName || user.lastName || user.last_name || '',
                        Email: user.Email || user.email || '',
                        ActiveAccount: user.ActiveAccount !== undefined ? user.ActiveAccount : 
                                     user.activeAccount !== undefined ? user.activeAccount :
                                     user.active_account !== undefined ? user.active_account : 1,
                        UserType: user.UserType || user.userType || user.user_type || 1,
                        LastLogin: user.LastLogin || user.lastLogin || user.last_login,
                        // Determine user type and display properties
                        userType: user.UserType === 1 ? 'Driver' : 
                                 user.UserType === 2 ? 'Sponsor' : 
                                 user.UserType === 3 ? 'Admin' : 'Unknown',
                        displayId: user.UserID, // Use UserID as display ID for all users
                        sponsorName: 'N/A', // Will be updated for drivers if needed
                        uniqueKey: `User-${user.UserID}`
                    };
                    
                    console.log(`Processed user ${index}:`, processed);
                    return processed;
                });
                
                // Sort by UserID for consistent display
                const sortedUsers = processedUsers.sort((a, b) => a.UserID - b.UserID);
                
                console.log('Final processed users:', sortedUsers);
                
                // Set individual arrays for compatibility with existing code
                setDrivers(sortedUsers.filter(u => u.UserType === 1));
                setSponsorUsers(sortedUsers.filter(u => u.UserType === 2));
                setAdmins(sortedUsers.filter(u => u.UserType === 3));
                setAllUsers(sortedUsers);
                
            } else {
                console.error('Failed to fetch users - HTTP status:', response.status);
                const errorText = await response.text();
                console.error('Error response body:', errorText);
                setAllUsers([]);
                setDrivers([]);
                setSponsorUsers([]);
                setAdmins([]);
            }
        } catch (error) {
            console.error('Network error fetching users:', error);
            setAllUsers([]);
            setDrivers([]);
            setSponsorUsers([]);
            setAdmins([]);
        }
    };

    const fetchAllSponsors = async () => {
        try {
            console.log('=== FETCHING SPONSORS ===');
            // Get sponsor companies for driver dropdown
            const response = await fetch(`http://localhost:4000/sponsorAPI/getAllSponsors`);
            console.log('Sponsor API response status:', response.status);
            
            if (response.ok) {
                const responseText = await response.text();
                console.log('Raw sponsor response text:', responseText);
                
                let allSponsors;
                try {
                    allSponsors = JSON.parse(responseText);
                    console.log('Parsed sponsor data:', allSponsors);
                } catch (parseError) {
                    console.error('Failed to parse sponsor JSON:', parseError);
                    setSponsors([]);
                    return;
                }
                
                if (!Array.isArray(allSponsors)) {
                    console.error('Sponsor data is not an array:', allSponsors);
                    setSponsors([]);
                    return;
                }
                
                // Process sponsor data with fallbacks
                const processedSponsors = allSponsors.map(sponsor => ({
                    ...sponsor,
                    SponsorID: sponsor.SponsorID || sponsor.sponsorID || sponsor.sponsor_id,
                    Name: sponsor.Name || sponsor.name || 
                          `${sponsor.FirstName || sponsor.firstName || sponsor.first_name || ''} ${sponsor.LastName || sponsor.lastName || sponsor.last_name || ''}`.trim(),
                    FirstName: sponsor.FirstName || sponsor.firstName || sponsor.first_name || '',
                    LastName: sponsor.LastName || sponsor.lastName || sponsor.last_name || ''
                }));
                
                console.log('Processed sponsor data:', processedSponsors);
                setSponsors(processedSponsors);
            } else {
                console.error('Failed to fetch sponsors - HTTP status:', response.status);
                setSponsors([]);
            }
        } catch (error) {
            console.error('Network error fetching sponsors:', error);
            setSponsors([]);
        }
    };

    const fetchAllSponsorUsers = async () => {
        try {
            console.log('=== FETCHING SPONSOR USERS ===');
            // Get sponsor users for user management
            const response = await fetch(`http://localhost:4000/sponsorAPI/getAllSponsorUsers`);
            console.log('Sponsor users API response status:', response.status);
            
            if (response.ok) {
                const responseText = await response.text();
                console.log('Raw sponsor users response text:', responseText);
                
                let allSponsorUsers;
                try {
                    allSponsorUsers = JSON.parse(responseText);
                    console.log('Parsed sponsor user data:', allSponsorUsers);
                } catch (parseError) {
                    console.error('Failed to parse sponsor users JSON:', parseError);
                    setSponsorUsers([]);
                    return;
                }
                
                if (!Array.isArray(allSponsorUsers)) {
                    console.error('Sponsor users data is not an array:', allSponsorUsers);
                    setSponsorUsers([]);
                    return;
                }
                
                // Process sponsor user data with fallbacks
                const processedSponsorUsers = allSponsorUsers.map(sponsorUser => ({
                    ...sponsorUser,
                    SponsorUserID: sponsorUser.SponsorUserID || sponsorUser.sponsorUserID || sponsorUser.sponsor_user_id,
                    UserID: sponsorUser.UserID || sponsorUser.userID || sponsorUser.user_id,
                    FirstName: sponsorUser.FirstName || sponsorUser.firstName || sponsorUser.first_name || '',
                    LastName: sponsorUser.LastName || sponsorUser.lastName || sponsorUser.last_name || '',
                    Email: sponsorUser.Email || sponsorUser.email || '',
                    SponsorID: sponsorUser.SponsorID || sponsorUser.sponsorID || sponsorUser.sponsor_id,
                    ActiveAccount: sponsorUser.ActiveAccount !== undefined ? sponsorUser.ActiveAccount : 
                                 sponsorUser.activeAccount !== undefined ? sponsorUser.activeAccount :
                                 sponsorUser.active_account !== undefined ? sponsorUser.active_account : 1
                }));
                
                console.log('Processed sponsor user data:', processedSponsorUsers);
                setSponsorUsers(processedSponsorUsers);
            } else {
                console.error('Failed to fetch sponsor users - HTTP status:', response.status);
                setSponsorUsers([]);
            }
        } catch (error) {
            console.error('Network error fetching sponsor users:', error);
            setSponsorUsers([]);
        }
    };

    const fetchAllAdmins = async () => {
        try {
            console.log('=== FETCHING ADMINS ===');
            const response = await fetch(`http://localhost:4000/adminAPI/getAllAdmins`);
            console.log('Admin API response status:', response.status);
            
            if (response.ok) {
                const responseText = await response.text();
                console.log('Raw admin response text:', responseText);
                
                let allAdmins;
                try {
                    allAdmins = JSON.parse(responseText);
                    console.log('Parsed admin data:', allAdmins);
                } catch (parseError) {
                    console.error('Failed to parse admin JSON:', parseError);
                    setAdmins([]);
                    return;
                }
                
                if (!Array.isArray(allAdmins)) {
                    console.error('Admin data is not an array:', allAdmins);
                    setAdmins([]);
                    return;
                }
                
                // Process admin data with fallbacks
                const processedAdmins = allAdmins.map(admin => ({
                    ...admin,
                    AdminID: admin.AdminID || admin.adminID || admin.admin_id,
                    UserID: admin.UserID || admin.userID || admin.user_id,
                    FirstName: admin.FirstName || admin.firstName || admin.first_name || '',
                    LastName: admin.LastName || admin.lastName || admin.last_name || '',
                    Email: admin.Email || admin.email || '',
                    ActiveAccount: admin.ActiveAccount !== undefined ? admin.ActiveAccount : 
                                 admin.activeAccount !== undefined ? admin.activeAccount :
                                 admin.active_account !== undefined ? admin.active_account : 1
                }));
                
                console.log('Processed admin data:', processedAdmins);
                setAdmins(processedAdmins);
            } else {
                console.error('Failed to fetch admins - HTTP status:', response.status);
                setAdmins([]);
            }
        } catch (error) {
            console.error('Network error fetching admins:', error);
            setAdmins([]);
        }
    };

    const fetchSponsorOrgs = async () => {
        try {
            console.log('=== FETCHING SPONSOR ORGANIZATIONS ===');
            const response = await fetch(`http://localhost:4000/sponsorAPI/getAllSponsors`);
            console.log('Sponsor orgs API response status:', response.status);
            
            if (response.ok) {
                const responseText = await response.text();
                console.log('Raw sponsor orgs response text:', responseText);
                
                let allSponsorOrgs;
                try {
                    allSponsorOrgs = JSON.parse(responseText);
                    console.log('Parsed sponsor orgs data:', allSponsorOrgs);
                } catch (parseError) {
                    console.error('Failed to parse sponsor orgs JSON:', parseError);
                    setSponsorOrgs([]);
                    return;
                }
                
                if (!Array.isArray(allSponsorOrgs)) {
                    console.error('Sponsor orgs data is not an array:', allSponsorOrgs);
                    setSponsorOrgs([]);
                    return;
                }
                
                // Process sponsor org data with fallbacks
                const processedSponsorOrgs = allSponsorOrgs.map(org => ({
                    ...org,
                    SponsorID: org.SponsorID || org.sponsorID || org.sponsor_id,
                    Name: org.Name || org.name || '',
                    PointRatio: org.PointRatio !== undefined ? org.PointRatio : 
                               org.pointRatio !== undefined ? org.pointRatio :
                               org.point_ratio !== undefined ? org.point_ratio : 0.01,
                    EnabledSponsor: org.EnabledSponsor !== undefined ? org.EnabledSponsor :
                                   org.enabledSponsor !== undefined ? org.enabledSponsor :
                                   org.enabled_sponsor !== undefined ? org.enabled_sponsor : 1
                }));
                
                console.log('Processed sponsor orgs data:', processedSponsorOrgs);
                setSponsorOrgs(processedSponsorOrgs);
            } else {
                console.error('Failed to fetch sponsor orgs - HTTP status:', response.status);
                setSponsorOrgs([]);
            }
        } catch (error) {
            console.error('Network error fetching sponsor orgs:', error);
            setSponsorOrgs([]);
        }
    };

    const combineAllUsers = () => {
        console.log('Combining users...');
        console.log('Current drivers:', drivers);
        console.log('Current sponsorUsers:', sponsorUsers);
        console.log('Current admins:', admins);
        
        // Create a map to track unique users by UserID
        const userMap = new Map();
        
        // Add drivers first (they take priority for display)
        drivers.forEach(driver => {
            const key = driver.UserID;
            if (!userMap.has(key)) {
                userMap.set(key, {
                    ...driver,
                    userType: 'Driver',
                    displayId: driver.DriverID,
                    sponsorName: getSponsorName(driver.SponsorID),
                    uniqueKey: `Driver-${driver.DriverID}-${driver.UserID}`,
                    ActiveAccount: driver.ActiveAccount !== undefined ? driver.ActiveAccount : 1,
                    priority: 1 // Highest priority
                });
            }
        });
        
        // Add sponsor users only if they don't already exist as drivers
        sponsorUsers.forEach(sponsor => {
            const key = sponsor.UserID;
            if (!userMap.has(key)) {
                userMap.set(key, {
                    ...sponsor,
                    userType: 'Sponsor',
                    displayId: sponsor.SponsorUserID,
                    sponsorName: 'N/A',
                    uniqueKey: `Sponsor-${sponsor.SponsorUserID}-${sponsor.UserID}`,
                    ActiveAccount: sponsor.ActiveAccount !== undefined ? sponsor.ActiveAccount : 1,
                    priority: 2
                });
            } else {
                // Log duplicate detection
                console.log(`Skipping duplicate user: UserID ${key} already exists as ${userMap.get(key).userType}`);
            }
        });
        
        // Add admins only if they don't already exist
        admins.forEach(admin => {
            const key = admin.UserID;
            if (!userMap.has(key)) {
                userMap.set(key, {
                    ...admin,
                    userType: 'Admin',
                    displayId: admin.AdminID,
                    sponsorName: 'N/A',
                    uniqueKey: `Admin-${admin.AdminID}-${admin.UserID}`,
                    ActiveAccount: admin.ActiveAccount !== undefined ? admin.ActiveAccount : 1,
                    priority: 3
                });
            } else {
                // Log duplicate detection
                console.log(`Skipping duplicate user: UserID ${key} already exists as ${userMap.get(key).userType}`);
            }
        });
        
        // Convert map to array and sort by UserID for consistent display
        const combinedUsers = Array.from(userMap.values()).sort((a, b) => a.UserID - b.UserID);
        
        console.log('Combined users result (deduplicated):', combinedUsers);
        console.log('Total unique users:', combinedUsers.length);
        setAllUsers(combinedUsers);
    };

    const handleAddDriver = async (e) => {
        e.preventDefault();

        try {
            const salt = GenerateSalt();
            const driverData = {
                ...newDriver,
                UserType: 1,
                PasswordSalt: salt
            };

            console.log('Creating driver with DRIVER table relationship:', driverData);
            
            const queryString = new URLSearchParams(driverData).toString();
            const response = await fetch(`http://localhost:4000/driverAPI/addDriver?${queryString}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (response.ok) {
                const responseData = await response.text();
                console.log('Driver creation response:', responseData);
                alert(`Driver added successfully!\n\nA new record has been created in the DRIVER table with SponsorID: ${driverData.SponsorID}`);
                setShowAddModal(false);
                setNewDriver({
                    FirstName: '',
                    LastName: '',
                    Email: '',
                    Password: '',
                    SponsorID: '',
                    PasswordSalt: ''
                });
                fetchAllDrivers();
            } else {
                const errorText = await response.text();
                console.error('Error adding driver:', errorText);
                alert(`Error adding driver: ${errorText}`);
            }
        } catch (error) {
            console.error('Error adding driver:', error);
            alert('Error adding driver');
        }
    };

    const handleEditDriver = (driver) => {
        setEditingDriver({
            ...driver,
            Password: '',
            PasswordSalt: 'auto-generated'
        });
        setShowEditModal(true);
    };

    const handleUpdateDriver = async (e) => {
        e.preventDefault();
        
        try {
            // Check if sponsor is being changed
            const originalDriver = drivers.find(d => d.UserID === editingDriver.UserID);
            const sponsorChanged = originalDriver && originalDriver.SponsorID !== editingDriver.SponsorID;
            
            const updateData = {
                UserID: editingDriver.UserID,
                FirstName: editingDriver.FirstName,
                LastName: editingDriver.LastName,
                Email: editingDriver.Email,
                Password: editingDriver.Password,
                PasswordSalt: editingDriver.PasswordSalt,
                SponsorID: editingDriver.SponsorID,
                // Reset points to 0 if sponsor is changing
                ResetPoints: sponsorChanged
            };

            console.log('Sending driver update data:', updateData);
            console.log('Sponsor changed:', sponsorChanged);

            // Use a new endpoint that handles both DRIVER and SPONSOR_USER updates
            const response = await fetch(`http://localhost:4000/driverAPI/updateDriverWithSponsor`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updateData)
            });

            if (response.ok) {
                const responseData = await response.json();
                console.log('Driver update response:', responseData);
                
                let message = 'Driver updated successfully!';
                if (sponsorChanged) {
                    message += '\n\nSponsor changed - driver points have been reset to 0.';
                }
                
                alert(message);
                setShowEditModal(false);
                setEditingDriver(null);
                // Refresh all data to ensure proper state sync
                await Promise.all([fetchAllDrivers(), fetchAllSponsorUsers()]);
            } else {
                const errorText = await response.text();
                console.error('Update error:', errorText);
                alert(`Error updating driver: ${errorText}`);
            }
        } catch (error) {
            console.error('Error updating driver:', error);
            alert(`Error updating driver: ${error.message}`);
        }
    };

    const handleRemoveDriver = async (driverID, driverName, isActive) => {
        // Get the UserID from the driver data
        const driver = drivers.find(d => d.DriverID === driverID);
        if (!driver) {
            alert('Driver not found');
            return;
        }

        const action = isActive ? 'deactivate' : 'reactivate';
        if (!window.confirm(`Are you sure you want to ${action} ${driverName}? This will ${isActive ? 'disable' : 'enable'} their access to the system.`)) {
            return;
        }

        try {
            // Use userAPI instead of driverAPI for consistency with other user types
            console.log(`Toggling driver UserID: ${driver.UserID}, Action: ${action}`);
            const response = await fetch(`http://localhost:4000/userAPI/toggleAccountActivity/${driver.UserID}`, {
                method: 'POST'
            });

            if (response.ok) {
                alert(`Driver ${action}d successfully!`);
                // Refresh all data to ensure proper state sync
                await Promise.all([fetchAllDrivers(), fetchAllSponsors(), fetchAllAdmins()]);
            } else {
                const responseText = await response.text();
                console.error('Server response:', responseText);
                alert(`Error ${action}ing driver: ${responseText}`);
            }
        } catch (error) {
            console.error(`Error ${action}ing driver:`, error);
            alert(`Error ${action}ing driver: ${error.message}`);
        }
    };

    const handleEditSponsor = (sponsor) => {
        setEditingSponsor({
            ...sponsor,
            Password: '',
            PasswordSalt: 'auto-generated'
        });
        setShowEditSponsorModal(true);
    };

    const handleUpdateSponsor = async (e) => {
        e.preventDefault();
        
        try {
            // Generate salt if password is provided
            const updateData = {
                UserID: editingSponsor.UserID,
                FirstName: editingSponsor.FirstName,
                LastName: editingSponsor.LastName,
                Email: editingSponsor.Email,
                SponsorID: editingSponsor.SponsorID
            };

            // Only include password fields if a new password is provided
            if (editingSponsor.Password && editingSponsor.Password.trim() !== '') {
                updateData.Password = editingSponsor.Password;
                updateData.PasswordSalt = GenerateSalt();
            }

            console.log('Sending sponsor update data:', updateData);

            // Test if we can reach the getAllSponsorUsers endpoint (which we know works)
            console.log('Testing getAllSponsorUsers endpoint...');
            try {
                const testGetUsers = await fetch(`http://localhost:4000/sponsorAPI/getAllSponsorUsers`);
                console.log('getAllSponsorUsers test status:', testGetUsers.status);
                if (testGetUsers.ok) {
                    const userData = await testGetUsers.json();
                    console.log('getAllSponsorUsers works, got', userData.length, 'users');
                } else {
                    console.log('getAllSponsorUsers test failed');
                }
            } catch (getUsersError) {
                console.error('getAllSponsorUsers test error:', getUsersError);
            }

            // Test the debug route
            console.log('Testing debug route...');
            try {
                const debugTest = await fetch(`http://localhost:4000/sponsorAPI/debug`);
                console.log('Debug test status:', debugTest.status);
                if (debugTest.ok) {
                    const debugData = await debugTest.json();
                    console.log('Debug test data:', debugData);
                } else {
                    console.log('Debug test failed');
                }
            } catch (debugError) {
                console.error('Debug test error:', debugError);
            }

            // Now try the update
            console.log('Attempting sponsor update...');
            const response = await fetch(`http://localhost:4000/sponsorAPI/updateSponsorUser`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updateData)
            });

            console.log('Response status:', response.status);
            
            if (response.ok) {
                const responseData = await response.json();
                console.log('Response data:', responseData);
                alert('Sponsor updated successfully!');
                setShowEditSponsorModal(false);
                setEditingSponsor(null);
                await Promise.all([fetchAllDrivers(), fetchAllSponsors(), fetchAllAdmins()]);
            } else {
                const errorText = await response.text();
                console.error('Error response:', errorText);
                alert(`Error updating sponsor (${response.status}): Check console for details`);
            }
        } catch (error) {
            console.error('Network error updating sponsor:', error);
            alert(`Network error updating sponsor: ${error.message}`);
        }
    };

    const handleRemoveSponsor = async (sponsorUserID, sponsorName, isActive) => {
        const action = isActive ? 'deactivate' : 'reactivate';
        if (!window.confirm(`Are you sure you want to ${action} ${sponsorName}? This will ${isActive ? 'disable' : 'enable'} their access to the system.`)) {
            return;
        }

        try {
            console.log(`Toggling sponsor UserID: ${sponsorUserID}, Action: ${action}`);
            const response = await fetch(`http://localhost:4000/userAPI/toggleAccountActivity/${sponsorUserID}`, {
                method: 'POST'
            });

            if (response.ok) {
                alert(`Sponsor ${action}d successfully!`);
                // Refresh all data to ensure proper state sync
                await Promise.all([fetchAllDrivers(), fetchAllSponsors(), fetchAllAdmins()]);
            } else {
                const responseText = await response.text();
                console.error('Server response:', responseText);
                alert(`Error ${action}ing sponsor: ${responseText}`);
            }
        } catch (error) {
            console.error(`Error ${action}ing sponsor:`, error);
            alert(`Error ${action}ing sponsor: ${error.message}`);
        }
    };

    const handleEditAdmin = (admin) => {
        setEditingAdmin({
            ...admin,
            Password: '',
            PasswordSalt: 'auto-generated'
        });
        setShowEditAdminModal(true);
    };

    const handleUpdateAdmin = async (e) => {
        e.preventDefault();
        
        try {
            // Generate salt if password is provided
            const updateData = {
                UserID: editingAdmin.UserID,
                FirstName: editingAdmin.FirstName,
                LastName: editingAdmin.LastName,
                Email: editingAdmin.Email
            };

            // Only include password fields if a new password is provided
            if (editingAdmin.Password && editingAdmin.Password.trim() !== '') {
                updateData.Password = editingAdmin.Password;
                updateData.PasswordSalt = GenerateSalt();
            }

            console.log('Sending admin update data:', updateData);

            const response = await fetch(`http://localhost:4000/adminAPI/updateAdminUser`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updateData)
            });

            console.log('Response status:', response.status);
            
            if (response.ok) {
                const responseData = await response.json();
                console.log('Response data:', responseData);
                alert('Admin updated successfully!');
                setShowEditAdminModal(false);
                setEditingAdmin(null);
                await Promise.all([fetchAllDrivers(), fetchAllSponsors(), fetchAllAdmins()]);
            } else {
                const errorText = await response.text();
                console.error('Error response:', errorText);
                alert(`Error updating admin (${response.status}): Check console for details`);
            }
        } catch (error) {
            console.error('Network error updating admin:', error);
            alert(`Network error updating admin: ${error.message}`);
        }
    };

    const handleRemoveAdmin = async (adminUserID, adminName, isActive) => {
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        
        const adminToDelete = admins.find(admin => admin.UserID === adminUserID);
        if (adminToDelete && adminToDelete.UserID === currentUser.UserID) {
            alert('You cannot deactivate your own admin account!');
            return;
        }

        const action = isActive ? 'deactivate' : 'reactivate';
        if (!window.confirm(`Are you sure you want to ${action} ${adminName}? This will ${isActive ? 'disable' : 'enable'} their access to the system.`)) {
            return;
        }

        try {
            console.log(`Toggling admin UserID: ${adminUserID}, Action: ${action}`);
            const response = await fetch(`http://localhost:4000/userAPI/toggleAccountActivity/${adminUserID}`, {
                method: 'POST'
            });

            if (response.ok) {
                alert(`Admin ${action}d successfully!`);
                // Refresh all data to ensure proper state sync
                await Promise.all([fetchAllDrivers(), fetchAllSponsors(), fetchAllAdmins()]);
            } else {
                const responseText = await response.text();
                console.error('Server response:', responseText);
                alert(`Error ${action}ing admin: ${responseText}`);
            }
        } catch (error) {
            console.error(`Error ${action}ing admin:`, error);
            alert(`Error ${action}ing admin: ${error.message}`);
        }
    };

    const getSponsorName = (sponsorID) => {
        const sponsor = sponsors.find(s => s.SponsorID === sponsorID);
        // Now this will return the company name instead of person name
        return sponsor ? sponsor.Name : 'Unknown Sponsor';
    };

    const filteredUsers = allUsers.filter(user => {
        const query = search.toLowerCase();
        
        // Safely access properties with null checks
        const firstName = user.FirstName ? user.FirstName.toLowerCase() : '';
        const lastName = user.LastName ? user.LastName.toLowerCase() : '';
        const email = user.Email ? user.Email.toLowerCase() : '';
        const sponsorName = user.sponsorName ? user.sponsorName.toLowerCase() : '';
        const userType = user.userType ? user.userType.toLowerCase() : '';
        
        const matchesSearch = (
            firstName.includes(query) ||
            lastName.includes(query) ||
            email.includes(query) ||
            sponsorName.includes(query) ||
            String(user.displayId).includes(query) ||
            String(user.UserID).includes(query) ||
            userType.includes(query)
        );
        
        const matchesFilter = userTypeFilter === "all" || userType === userTypeFilter;
        
        return matchesSearch && matchesFilter;
    });

    const filteredSponsorOrgs = sponsorOrgs.filter(org => {
        const query = sponsorOrgSearch.toLowerCase();
        const name = org.Name ? org.Name.toLowerCase() : '';
        
        return (
            name.includes(query) ||
            String(org.SponsorID).includes(query) ||
            String(org.PointRatio).includes(query)
        );
    });

    useEffect(() => {
        const fetchData = async () => {
            console.log('Starting data fetch...');
            setLoading(true);
            await Promise.all([fetchAllUsers(), fetchAllSponsors(), fetchSponsorOrgs()]);
            console.log('Data fetch completed');
            setLoading(false);
        };
        fetchData();
    }, []);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        combineAllUsers();
    }, [drivers, sponsors, sponsorUsers, admins]);

    const handleFixMissingDriverRecords = async () => {
        if (!window.confirm('This will create DRIVER records for users who have SPONSOR_USER relationships but no DRIVER records. Continue?')) {
            return;
        }

        setIsFixingDrivers(true);
        try {
            console.log('Attempting to fix missing DRIVER records...');
            const response = await fetch(`http://localhost:4000/driverAPI/createMissingDriverRecords`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (response.ok) {
                const result = await response.json();
                console.log('Fix result:', result);
                
                alert(`Fix completed!\n\nFound: ${result.found} users missing DRIVER records\nCreated: ${result.created.length} new DRIVER records\n\nRefreshing data...`);
                
                // Refresh all data to show the updates
                await Promise.all([fetchAllDrivers(), fetchAllSponsorUsers(), fetchAllAdmins()]);
            } else {
                const errorText = await response.text();
                console.error('Fix failed:', errorText);
                alert(`Failed to fix missing DRIVER records: ${errorText}`);
            }
        } catch (error) {
            console.error('Error fixing missing DRIVER records:', error);
            alert(`Error fixing missing DRIVER records: ${error.message}`);
        } finally {
            setIsFixingDrivers(false);
        }
    };

    const handleAddSponsorOrg = async (e) => {
        e.preventDefault();

        try {
            const orgData = {
                Name: newSponsorOrg.Name.trim(),
                PointRatio: parseFloat(newSponsorOrg.PointRatio),
                EnabledSponsor: parseInt(newSponsorOrg.EnabledSponsor)
            };

            console.log('Creating sponsor organization:', orgData);
            
            const response = await fetch(`http://localhost:4000/sponsorAPI/addSponsor`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(orgData)
            });

            if (response.ok) {
                const responseData = await response.text();
                console.log('Sponsor org creation response:', responseData);
                alert('Sponsor organization added successfully!');
                setShowAddSponsorOrgModal(false);
                setNewSponsorOrg({
                    Name: '',
                    PointRatio: 0.01,
                    EnabledSponsor: 1
                });
                fetchSponsorOrgs();
            } else {
                const errorText = await response.text();
                console.error('Error adding sponsor org:', errorText);
                alert(`Error adding sponsor organization: ${errorText}`);
            }
        } catch (error) {
            console.error('Error adding sponsor org:', error);
            alert('Error adding sponsor organization');
        }
    };

    const handleEditSponsorOrg = (org) => {
        setEditingSponsorOrg({ ...org });
        setShowEditSponsorOrgModal(true);
    };

    const handleUpdateSponsorOrg = async (e) => {
        e.preventDefault();
        
        try {
            const updateData = {
                SponsorID: editingSponsorOrg.SponsorID,
                Name: editingSponsorOrg.Name.trim(),
                PointRatio: parseFloat(editingSponsorOrg.PointRatio),
                EnabledSponsor: parseInt(editingSponsorOrg.EnabledSponsor)
            };

            console.log('Sending sponsor org update data:', updateData);

            // Note: Update endpoint may not exist yet, using placeholder
            const response = await fetch(`http://localhost:4000/sponsorAPI/updateSponsor`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updateData)
            });

            if (response.ok) {
                alert('Sponsor organization updated successfully!');
                setShowEditSponsorOrgModal(false);
                setEditingSponsorOrg(null);
                fetchSponsorOrgs();
            } else {
                const errorText = await response.text();
                console.error('Update error:', errorText);
                alert('Error updating sponsor organization');
            }
        } catch (error) {
            console.error('Error updating sponsor org:', error);
            alert('Error updating sponsor organization');
        }
    };

    const handleToggleSponsorOrg = async (sponsorID, sponsorName, isEnabled) => {
        const action = isEnabled ? 'disable' : 'enable';
        if (!window.confirm(`Are you sure you want to ${action} ${sponsorName}? This will affect all drivers associated with this sponsor.`)) {
            return;
        }

        try {
            console.log(`Toggling sponsor org ID: ${sponsorID}, Action: ${action}`);
            const response = await fetch(`http://localhost:4000/sponsorAPI/toggleSponsorActivity/${sponsorID}`, {
                method: 'POST'
            });

            if (response.ok) {
                alert(`Sponsor organization ${action}d successfully!`);
                fetchSponsorOrgs();
            } else {
                const responseText = await response.text();
                console.error('Server response:', responseText);
                alert(`Error ${action}ing sponsor organization: ${responseText}`);
            }
        } catch (error) {
            console.error(`Error ${action}ing sponsor org:`, error);
            alert(`Error ${action}ing sponsor organization: ${error.message}`);
        }
    };

    if (loading) {
        return (
            <div>
                <AdminNavbar />
                <div className="container mt-4">
                    <div className="text-center">
                        <div className="spinner-border" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div>
            <AdminNavbar />
            <div className="container mt-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h2>User Management</h2>
                    <div>
                        <button 
                            className="btn btn-warning me-2"
                            onClick={handleFixMissingDriverRecords}
                            disabled={isFixingDrivers}
                        >
                            {isFixingDrivers ? (
                                <>
                                    <div className="spinner-border spinner-border-sm me-2" role="status"></div>
                                    Fixing...
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-wrench me-2"></i>
                                    Fix Missing Driver Records
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Tab Navigation */}
                <ul className="nav nav-tabs mb-3">
                    <li className="nav-item">
                        <button 
                            className={`nav-link ${activeTab === 'users' ? 'active' : ''}`}
                            onClick={() => setActiveTab('users')}
                        >
                            <i className="fas fa-users me-2"></i>
                            User Accounts
                        </button>
                    </li>
                    <li className="nav-item">
                        <button 
                            className={`nav-link ${activeTab === 'sponsors' ? 'active' : ''}`}
                            onClick={() => setActiveTab('sponsors')}
                        >
                            <i className="fas fa-building me-2"></i>
                            Sponsor Organizations
                        </button>
                    </li>
                </ul>

                {/* Users Tab */}
                {activeTab === 'users' && (
                    <>
                        <div className="row mb-3">
                            <div className="col-md-8">
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Search users by name, email, sponsor, type, or ID..."
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                />
                            </div>
                            <div className="col-md-4">
                                <select 
                                    className="form-select"
                                    value={userTypeFilter}
                                    onChange={e => setUserTypeFilter(e.target.value)}
                                >
                                    <option value="all">All User Types</option>
                                    <option value="driver">Drivers Only</option>
                                    <option value="sponsor">Sponsors Only</option>
                                    <option value="admin">Admins Only</option>
                                </select>
                            </div>
                        </div>

                        <div className="card mb-3">
                            <div className="card-body">
                                <h5 className="card-title">System Overview</h5>
                                <div className="row">
                                    <div className="col-md-3">
                                        <p className="card-text">
                                            <strong>Total Drivers:</strong> {allUsers.filter(u => u.UserType === 1).length}
                                        </p>
                                    </div>
                                    <div className="col-md-3">
                                        <p className="card-text">
                                            <strong>Total Sponsors:</strong> {allUsers.filter(u => u.UserType === 2).length}
                                        </p>
                                    </div>
                                    <div className="col-md-3">
                                        <p className="card-text">
                                            <strong>Total Admins:</strong> {allUsers.filter(u => u.UserType === 3).length}
                                        </p>
                                    </div>
                                    <div className="col-md-3">
                                        <p className="card-text">
                                            <strong>Total Users:</strong> {allUsers.length}
                                        </p>
                                    </div>
                                </div>
                                <div className="row mt-2">
                                    <div className="col-12">
                                        <small className="text-muted">
                                            Data source: USER table via userAPI/getAllUsers
                                        </small>
                                        <br />
                                        <small className="text-info">
                                            <i className="fas fa-info-circle me-1"></i>
                                            All user data now comes from a single source - no more duplicates!
                                        </small>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {filteredUsers.length === 0 ? (
                            <div className="alert alert-info">
                                <h5>No Users Found</h5>
                                <p>
                                    {search || userTypeFilter !== "all"
                                        ? "No users match your search criteria."
                                        : "There are no users in the system yet."
                                    }
                                </p>
                            </div>
                        ) : (
                            <div className="table-responsive">
                                <table className="table table-striped">
                                    <thead className="table-dark">
                                        <tr>
                                            <th>User Type</th>
                                            <th>Name</th>
                                            <th>Email</th>
                                            <th>Sponsor</th>
                                            <th>User ID</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredUsers.map((user) => (
                                            <tr key={user.uniqueKey || `${user.userType}-${user.UserID}`}>
                                                <td>
                                                    <span className={`badge ${
                                                        user.userType === 'Driver' ? 'bg-primary' :
                                                        user.userType === 'Sponsor' ? 'bg-success' :
                                                        'bg-warning text-dark'
                                                    }`}>
                                                        {user.userType}
                                                    </span>
                                                    {user.ActiveAccount === 0 && (
                                                        <span className="badge bg-danger ms-1">Inactive</span>
                                                    )}
                                                </td>
                                                <td>{user.FirstName} {user.LastName}</td>
                                                <td>{user.Email}</td>
                                                <td>
                                                    {user.userType === 'Driver' 
                                                        ? `${user.sponsorName} (ID: ${user.SponsorID})`
                                                        : user.sponsorName
                                                    }
                                                </td>
                                                <td>{user.UserID}</td>
                                                <td>
                                                    {user.userType === 'Driver' && (
                                                        <>
                                                            <button 
                                                                className="btn btn-sm btn-outline-primary me-2"
                                                                onClick={() => handleEditDriver(user)}
                                                            >
                                                                <i className="fas fa-edit me-1"></i>
                                                                Edit
                                                            </button>
                                                            <button 
                                                                className={`btn btn-sm ${user.ActiveAccount === 1 ? 'btn-outline-warning' : 'btn-outline-success'}`}
                                                                onClick={() => handleRemoveDriver(user.DriverID, `${user.FirstName} ${user.LastName}`, user.ActiveAccount === 1)}
                                                            >
                                                                <i className={`fas ${user.ActiveAccount === 1 ? 'fa-ban' : 'fa-check'} me-1`}></i>
                                                                {user.ActiveAccount === 1 ? 'Deactivate' : 'Reactivate'}
                                                            </button>
                                                        </>
                                                    )}
                                                    {user.userType === 'Sponsor' && (
                                                        <>
                                                            <button 
                                                                className="btn btn-sm btn-outline-primary me-2"
                                                                onClick={() => handleEditSponsor(user)}
                                                            >
                                                                <i className="fas fa-edit me-1"></i>
                                                                Edit
                                                            </button>
                                                            <button 
                                                                className={`btn btn-sm ${user.ActiveAccount === 1 ? 'btn-outline-warning' : 'btn-outline-success'}`}
                                                                onClick={() => handleRemoveSponsor(user.UserID, `${user.FirstName} ${user.LastName}`, user.ActiveAccount === 1)}
                                                            >
                                                                <i className={`fas ${user.ActiveAccount === 1 ? 'fa-ban' : 'fa-check'} me-1`}></i>
                                                                {user.ActiveAccount === 1 ? 'Deactivate' : 'Reactivate'}
                                                            </button>
                                                        </>
                                                    )}
                                                    {user.userType === 'Admin' && (
                                                        <>
                                                            <button 
                                                                className="btn btn-sm btn-outline-primary me-2"
                                                                onClick={() => handleEditAdmin(user)}
                                                            >
                                                                <i className="fas fa-edit me-1"></i>
                                                                Edit
                                                            </button>
                                                            <button 
                                                                className={`btn btn-sm ${user.ActiveAccount === 1 ? 'btn-outline-warning' : 'btn-outline-success'}`}
                                                                onClick={() => handleRemoveAdmin(user.UserID, `${user.FirstName} ${user.LastName}`, user.ActiveAccount === 1)}
                                                            >
                                                                <i className={`fas ${user.ActiveAccount === 1 ? 'fa-ban' : 'fa-check'} me-1`}></i>
                                                                {user.ActiveAccount === 1 ? 'Deactivate' : 'Reactivate'}
                                                            </button>
                                                        </>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                )}

                {/* Sponsor Organizations Tab */}
                {activeTab === 'sponsors' && (
                    <>
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <h4>Sponsor Organizations</h4>
                            <button 
                                className="btn btn-primary"
                                onClick={() => setShowAddSponsorOrgModal(true)}
                            >
                                <i className="fas fa-plus me-2"></i>
                                Add Sponsor Organization
                            </button>
                        </div>

                        <div className="row mb-3">
                            <div className="col-md-6">
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Search sponsor organizations by name or ID..."
                                    value={sponsorOrgSearch}
                                    onChange={e => setSponsorOrgSearch(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="card mb-3">
                            <div className="card-body">
                                <h5 className="card-title">Sponsor Organizations Overview</h5>
                                <div className="row">
                                    <div className="col-md-4">
                                        <p className="card-text">
                                            <strong>Total Organizations:</strong> {sponsorOrgs.length}
                                        </p>
                                    </div>
                                    <div className="col-md-4">
                                        <p className="card-text">
                                            <strong>Active Organizations:</strong> {sponsorOrgs.filter(org => org.EnabledSponsor === 1).length}
                                        </p>
                                    </div>
                                    <div className="col-md-4">
                                        <p className="card-text">
                                            <strong>Disabled Organizations:</strong> {sponsorOrgs.filter(org => org.EnabledSponsor === 0).length}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {filteredSponsorOrgs.length === 0 ? (
                            <div className="alert alert-info">
                                <h5>No Sponsor Organizations Found</h5>
                                <p>
                                    {sponsorOrgSearch
                                        ? "No sponsor organizations match your search criteria."
                                        : "There are no sponsor organizations in the system yet."
                                    }
                                </p>
                            </div>
                        ) : (
                            <div className="table-responsive">
                                <table className="table table-striped">
                                    <thead className="table-dark">
                                        <tr>
                                            <th>Sponsor ID</th>
                                            <th>Organization Name</th>
                                            <th>Point Ratio</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredSponsorOrgs.map((org) => (
                                            <tr key={org.SponsorID}>
                                                <td>{org.SponsorID}</td>
                                                <td>{org.Name}</td>
                                                <td>{org.PointRatio}</td>
                                                <td>
                                                    <span className={`badge ${org.EnabledSponsor === 1 ? 'bg-success' : 'bg-danger'}`}>
                                                        {org.EnabledSponsor === 1 ? 'Active' : 'Disabled'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <button 
                                                        className="btn btn-sm btn-outline-primary me-2"
                                                        onClick={() => handleEditSponsorOrg(org)}
                                                    >
                                                        <i className="fas fa-edit me-1"></i>
                                                        Edit
                                                    </button>
                                                    <button 
                                                        className={`btn btn-sm ${org.EnabledSponsor === 1 ? 'btn-outline-warning' : 'btn-outline-success'}`}
                                                        onClick={() => handleToggleSponsorOrg(org.SponsorID, org.Name, org.EnabledSponsor === 1)}
                                                    >
                                                        <i className={`fas ${org.EnabledSponsor === 1 ? 'fa-ban' : 'fa-check'} me-1`}></i>
                                                        {org.EnabledSponsor === 1 ? 'Disable' : 'Enable'}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                )}

                {/* Add Driver Modal */}
                {showAddModal && (
                    <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
                        <div className="modal-dialog">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 className="modal-title">Add New Driver</h5>
                                    <button type="button" className="btn-close" onClick={() => setShowAddModal(false)}></button>
                                </div>
                                <form onSubmit={handleAddDriver}>
                                    <div className="modal-body">
                                        <div className="alert alert-info">
                                            <strong>Note:</strong> Currently only driver creation is supported through this interface. 
                                            Use the "Make New User" page for creating sponsors and admins.
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">First Name *</label>
                                            <input 
                                                type="text" 
                                                className="form-control"
                                                value={newDriver.FirstName}
                                                onChange={(e) => setNewDriver({...newDriver, FirstName: e.target.value})}
                                                required
                                            />
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">Last Name *</label>
                                            <input 
                                                type="text" 
                                                className="form-control"
                                                value={newDriver.LastName}
                                                onChange={(e) => setNewDriver({...newDriver, LastName: e.target.value})}
                                                required
                                            />
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">Email *</label>
                                            <input 
                                                type="email" 
                                                className="form-control"
                                                value={newDriver.Email}
                                                onChange={(e) => setNewDriver({...newDriver, Email: e.target.value})}
                                                required
                                            />
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">Sponsor *</label>
                                            <select 
                                                className="form-control"
                                                value={newDriver.SponsorID}
                                                onChange={(e) => setNewDriver({...newDriver, SponsorID: e.target.value})}
                                                required
                                            >
                                                <option value="">Select a sponsor...</option>
                                                {sponsors.map(sponsor => (
                                                    <option key={sponsor.SponsorID} value={sponsor.SponsorID}>
                                                        {sponsor.FirstName} {sponsor.LastName} (ID: {sponsor.SponsorID})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">Initial Password *</label>
                                            <input 
                                                type="password" 
                                                className="form-control"
                                                value={newDriver.Password}
                                                onChange={(e) => setNewDriver({...newDriver, Password: e.target.value})}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="modal-footer">
                                        <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                                            Cancel
                                        </button>
                                        <button type="submit" className="btn btn-primary">
                                            Add Driver
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}

                {/* Edit Driver Modal */}
                {showEditModal && editingDriver && (
                    <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
                        <div className="modal-dialog">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 className="modal-title">Edit Driver Information</h5>
                                    <button type="button" className="btn-close" onClick={() => setShowEditModal(false)}></button>
                                </div>
                                <form onSubmit={handleUpdateDriver}>
                                    <div className="modal-body">
                                        <div className="alert alert-info">
                                            <strong>Note:</strong> Driver ID {editingDriver.DriverID} - User ID {editingDriver.UserID}
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">First Name *</label>
                                            <input 
                                                type="text" 
                                                className="form-control"
                                                value={editingDriver.FirstName}
                                                onChange={(e) => setEditingDriver({...editingDriver, FirstName: e.target.value})}
                                                required
                                            />
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">Last Name *</label>
                                            <input 
                                                type="text" 
                                                className="form-control"
                                                value={editingDriver.LastName}
                                                onChange={(e) => setEditingDriver({...editingDriver, LastName: e.target.value})}
                                                required
                                            />
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">Email *</label>
                                            <input 
                                                type="email" 
                                                className="form-control"
                                                value={editingDriver.Email}
                                                onChange={(e) => setEditingDriver({...editingDriver, Email: e.target.value})}
                                                required
                                            />
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">Sponsor *</label>
                                            <select 
                                                className="form-control"
                                                value={editingDriver.SponsorID}
                                                onChange={(e) => setEditingDriver({...editingDriver, SponsorID: e.target.value})}
                                                required
                                            >
                                                <option value="">Select a sponsor...</option>
                                                {sponsors.map(sponsor => (
                                                    <option key={sponsor.SponsorID} value={sponsor.SponsorID}>
                                                        {sponsor.FirstName} {sponsor.LastName} (ID: {sponsor.SponsorID})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">New Password (leave blank to keep current)</label>
                                            <input 
                                                type="password" 
                                                className="form-control"
                                                value={editingDriver.Password}
                                                onChange={(e) => setEditingDriver({...editingDriver, Password: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                    <div className="modal-footer">
                                        <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>
                                            Cancel
                                        </button>
                                        <button type="submit" className="btn btn-primary">
                                            Update Driver
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}

                {/* Edit Sponsor Modal */}
                {showEditSponsorModal && editingSponsor && (
                    <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
                        <div className="modal-dialog">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 className="modal-title">Edit Sponsor Information</h5>
                                    <button type="button" className="btn-close" onClick={() => setShowEditSponsorModal(false)}></button>
                                </div>
                                <form onSubmit={handleUpdateSponsor}>
                                    <div className="modal-body">
                                        <div className="alert alert-info">
                                            <strong>Note:</strong> Sponsor ID {editingSponsor.SponsorID} - User ID {editingSponsor.UserID}
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">First Name *</label>
                                            <input 
                                                type="text" 
                                                className="form-control"
                                                value={editingSponsor.FirstName}
                                                onChange={(e) => setEditingSponsor({...editingSponsor, FirstName: e.target.value})}
                                                required
                                            />
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">Last Name *</label>
                                            <input 
                                                type="text" 
                                                className="form-control"
                                                value={editingSponsor.LastName}
                                                onChange={(e) => setEditingSponsor({...editingSponsor, LastName: e.target.value})}
                                                required
                                            />
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">Email *</label>
                                            <input 
                                                type="email" 
                                                className="form-control"
                                                value={editingSponsor.Email}
                                                onChange={(e) => setEditingSponsor({...editingSponsor, Email: e.target.value})}
                                                required
                                            />
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">New Password (leave blank to keep current)</label>
                                            <input 
                                                type="password" 
                                                className="form-control"
                                                value={editingSponsor.Password}
                                                onChange={(e) => setEditingSponsor({...editingSponsor, Password: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                    <div className="modal-footer">
                                        <button type="button" className="btn btn-secondary" onClick={() => setShowEditSponsorModal(false)}>
                                            Cancel
                                        </button>
                                        <button type="submit" className="btn btn-primary">
                                            Update Sponsor
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}

                {/* Edit Admin Modal */}
                {showEditAdminModal && editingAdmin && (
                    <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
                        <div className="modal-dialog">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 className="modal-title">Edit Admin Information</h5>
                                    <button type="button" className="btn-close" onClick={() => setShowEditAdminModal(false)}></button>
                                </div>
                                <form onSubmit={handleUpdateAdmin}>
                                    <div className="modal-body">
                                        <div className="alert alert-warning">
                                            <strong>Warning:</strong> Admin ID {editingAdmin.AdminID} - User ID {editingAdmin.UserID}
                                            <br />Editing admin accounts should be done carefully.
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">First Name *</label>
                                            <input 
                                                type="text" 
                                                className="form-control"
                                                value={editingAdmin.FirstName}
                                                onChange={(e) => setEditingAdmin({...editingAdmin, FirstName: e.target.value})}
                                                required
                                            />
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">Last Name *</label>
                                            <input 
                                                type="text" 
                                                className="form-control"
                                                value={editingAdmin.LastName}
                                                onChange={(e) => setEditingAdmin({...editingAdmin, LastName: e.target.value})}
                                                required
                                            />
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">Email *</label>
                                            <input 
                                                type="email" 
                                                className="form-control"
                                                value={editingAdmin.Email}
                                                onChange={(e) => setEditingAdmin({...editingAdmin, Email: e.target.value})}
                                                required
                                            />
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">New Password (leave blank to keep current)</label>
                                            <input 
                                                type="password" 
                                                className="form-control"
                                                value={editingAdmin.Password}
                                                onChange={(e) => setEditingAdmin({...editingAdmin, Password: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                    <div className="modal-footer">
                                        <button type="button" className="btn btn-secondary" onClick={() => setShowEditAdminModal(false)}>
                                            Cancel
                                        </button>
                                        <button type="submit" className="btn btn-warning">
                                            Update Admin
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}

                {/* Add Sponsor Organization Modal */}
                {showAddSponsorOrgModal && (
                    <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
                        <div className="modal-dialog">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 className="modal-title">Add New Sponsor Organization</h5>
                                    <button type="button" className="btn-close" onClick={() => setShowAddSponsorOrgModal(false)}></button>
                                </div>
                                <form onSubmit={handleAddSponsorOrg}>
                                    <div className="modal-body">
                                        <div className="mb-3">
                                            <label className="form-label">Organization Name *</label>
                                            <input 
                                                type="text" 
                                                className="form-control"
                                                value={newSponsorOrg.Name}
                                                onChange={(e) => setNewSponsorOrg({...newSponsorOrg, Name: e.target.value})}
                                                required
                                            />
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">Point Ratio *</label>
                                            <input 
                                                type="number" 
                                                step="0.001"
                                                min="0"
                                                max="1"
                                                className="form-control"
                                                value={newSponsorOrg.PointRatio}
                                                onChange={(e) => setNewSponsorOrg({...newSponsorOrg, PointRatio: e.target.value})}
                                                required
                                            />
                                            <div className="form-text">Ratio of points earned per dollar spent (e.g., 0.01 = 1 point per $100)</div>
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">Status *</label>
                                            <select 
                                                className="form-control"
                                                value={newSponsorOrg.EnabledSponsor}
                                                onChange={(e) => setNewSponsorOrg({...newSponsorOrg, EnabledSponsor: e.target.value})}
                                                required
                                            >
                                                <option value={1}>Active</option>
                                                <option value={0}>Disabled</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="modal-footer">
                                        <button type="button" className="btn btn-secondary" onClick={() => setShowAddSponsorOrgModal(false)}>
                                            Cancel
                                        </button>
                                        <button type="submit" className="btn btn-primary">
                                            Add Organization
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}

                {/* Edit Sponsor Organization Modal */}
                {showEditSponsorOrgModal && editingSponsorOrg && (
                    <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
                        <div className="modal-dialog">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 className="modal-title">Edit Sponsor Organization</h5>
                                    <button type="button" className="btn-close" onClick={() => setShowEditSponsorOrgModal(false)}></button>
                                </div>
                                <form onSubmit={handleUpdateSponsorOrg}>
                                    <div className="modal-body">
                                        <div className="alert alert-info">
                                            <strong>Sponsor ID:</strong> {editingSponsorOrg.SponsorID}
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">Organization Name *</label>
                                            <input 
                                                type="text" 
                                                className="form-control"
                                                value={editingSponsorOrg.Name}
                                                onChange={(e) => setEditingSponsorOrg({...editingSponsorOrg, Name: e.target.value})}
                                                required
                                            />
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">Point Ratio *</label>
                                            <input 
                                                type="number" 
                                                step="0.001"
                                                min="0"
                                                max="1"
                                                className="form-control"
                                                value={editingSponsorOrg.PointRatio}
                                                onChange={(e) => setEditingSponsorOrg({...editingSponsorOrg, PointRatio: e.target.value})}
                                                required
                                            />
                                            <div className="form-text">Ratio of points earned per dollar spent (e.g., 0.01 = 1 point per $100)</div>
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">Status *</label>
                                            <select 
                                                className="form-control"
                                                value={editingSponsorOrg.EnabledSponsor}
                                                onChange={(e) => setEditingSponsorOrg({...editingSponsorOrg, EnabledSponsor: parseInt(e.target.value)})}
                                                required
                                            >
                                                <option value={1}>Active</option>
                                                <option value={0}>Disabled</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="modal-footer">
                                        <button type="button" className="btn btn-secondary" onClick={() => setShowEditSponsorOrgModal(false)}>
                                            Cancel
                                        </button>
                                        <button type="submit" className="btn btn-primary">
                                            Update Organization
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}