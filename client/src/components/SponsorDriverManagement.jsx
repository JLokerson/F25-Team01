import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import SponsorNavbar from './SponsorNavbar';
import { GenerateSalt } from './MiscellaneousParts/HashPass'; 
import { updateDriverPoints } from "./MiscellaneousParts/ServerCall";

export default function SponsorDriverManagement() {
    const [drivers, setDrivers] = useState([]);
    const [sponsorInfo, setSponsorInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('drivers'); // Add tab state
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingDriver, setEditingDriver] = useState(null);
    const [showManagePointsModal, setShowManagePointsModal] = useState(false);
    const [managingDriver, setManagingDriver] = useState(null);
    const [pointsAdjustment, setPointsAdjustment] = useState(0);
    
    const [newDriver, setNewDriver] = useState({
        FirstName: '',
        LastName: '',
        Email: '',
        Password: '',
        PasswordSalt: '' 
    });
    const [search, setSearch] = useState(""); 
    const [showDebugModal, setShowDebugModal] = useState(false);
    const [debugData, setDebugData] = useState(null);

    // Bulk upload states
    const [bulkUploadFile, setBulkUploadFile] = useState(null);
    const [bulkUploadResults, setBulkUploadResults] = useState(null);
    const [bulkUploadLoading, setBulkUploadLoading] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);

    const getUserInfo = () => {
        const userString = localStorage.getItem('user');
        if (userString) {
            try {
                return JSON.parse(userString);
            } catch (e) {
                return null;
            }
        }
        return null;
    };

    const fetchSponsorInfo = async () => {
        const userInfo = getUserInfo();
        if (userInfo && userInfo.UserID) {
            try {
                const response = await fetch(`https://63iutwxr2owp72oyfbetwyluaq0wakdm.lambda-url.us-east-1.on.aws/sponsorAPI/getAllSponsorUsers`);
                if (response.ok) {
                    const allSponsorUsers = await response.json();
                    const currentSponsorInfo = allSponsorUsers.find(s => s.UserID === userInfo.UserID);
                    setSponsorInfo(currentSponsorInfo);
                    if (currentSponsorInfo) {
                        fetchDriversForSponsor(currentSponsorInfo.SponsorID);
                    }
                }
            } catch (error) {
                console.error('Error fetching sponsor info:', error);
            }
        }
        setLoading(false);
    };

    const fetchDriversForSponsor = async (sponsorID) => {
        try {
            console.log('Fetching drivers for SponsorID:', sponsorID);
            
            // Get current user info to exclude the sponsor user themselves
            const currentUser = getUserInfo();
            const currentUserID = currentUser?.UserID;
            console.log('Current user ID:', currentUserID);
            
            // Get all drivers (including inactive accounts)
            const driversResponse = await fetch(`https://63iutwxr2owp72oyfbetwyluaq0wakdm.lambda-url.us-east-1.on.aws/driverAPI/getAllDrivers`);
            let allDrivers = [];
            if (driversResponse.ok) {
                allDrivers = await driversResponse.json();
                console.log('All drivers from API:', allDrivers);
                
                // Handle nested array response format if needed
                if (Array.isArray(allDrivers) && allDrivers.length > 0 && Array.isArray(allDrivers[0])) {
                    allDrivers = allDrivers[0];
                    console.log('Extracted drivers from nested array:', allDrivers);
                }
            } else {
                console.warn('Failed to fetch drivers');
            }
            
            // Get all sponsor users to get additional user info
            const sponsorUsersResponse = await fetch(`https://63iutwxr2owp72oyfbetwyluaq0wakdm.lambda-url.us-east-1.on.aws/sponsorAPI/getAllSponsorUsers`);
            let allSponsorUsers = [];
            if (sponsorUsersResponse.ok) {
                allSponsorUsers = await sponsorUsersResponse.json();
                console.log('All sponsor users:', allSponsorUsers);
            } else {
                console.warn('Failed to fetch sponsor users');
            }
            
            // Filter to show ONLY drivers that belong to the current user's sponsor
            const sponsorDrivers = [];
            
            console.log(`Looking for drivers with SponsorID: ${sponsorID} (type: ${typeof sponsorID})`);
            
            // Add drivers from DRIVER table that have matching SponsorID
            if (Array.isArray(allDrivers)) {
                allDrivers.forEach((driver, index) => {
                    console.log(`Checking driver ${index}:`, {
                        DriverID: driver.DriverID,
                        UserID: driver.UserID,
                        SponsorID: driver.SponsorID,
                        ActiveAccount: driver.ActiveAccount,
                        sponsorIDType: typeof driver.SponsorID,
                        matches: driver.SponsorID == sponsorID,
                        isNotCurrentUser: driver.UserID !== currentUserID
                    });
                    
                    // Only include drivers that belong to the current user's sponsor
                    if (driver.SponsorID == sponsorID && driver.UserID !== currentUserID) {
                        console.log(`✓ Including driver from same sponsor: UserID ${driver.UserID}, DriverID ${driver.DriverID}, Active: ${driver.ActiveAccount}`);
                        sponsorDrivers.push({
                            ...driver,
                            FirstName: driver.FirstName || 'Unknown',
                            LastName: driver.LastName || 'User',
                            Email: driver.Email || 'No email',
                            ActiveAccount: driver.ActiveAccount !== undefined ? driver.ActiveAccount : 1,
                            uniqueKey: driver.DriverID ? `driver-${driver.DriverID}` : `user-${driver.UserID}-${index}`
                        });
                    } else if (driver.SponsorID != sponsorID) {
                        console.log(`✗ Excluding driver from different sponsor: DriverID ${driver.DriverID}, SponsorID ${driver.SponsorID} vs ${sponsorID}`);
                    } else if (driver.UserID === currentUserID) {
                        console.log(`✗ Excluding current user: UserID ${driver.UserID}`);
                    }
                });
            }
            
            console.log(`Found ${sponsorDrivers.length} drivers with matching SponsorID from DRIVER table`);
            
            // Add users from SPONSOR_USER table that have matching SponsorID but aren't already in drivers
            if (Array.isArray(allSponsorUsers)) {
                allSponsorUsers.forEach((sponsorUser, index) => {
                    console.log(`Checking sponsor user ${index}:`, {
                        UserID: sponsorUser.UserID,
                        SponsorID: sponsorUser.SponsorID,
                        sponsorIDType: typeof sponsorUser.SponsorID,
                        matches: sponsorUser.SponsorID == sponsorID,
                        isNotCurrentUser: sponsorUser.UserID !== currentUserID
                    });
                    
                    // Only include users that belong to the current user's sponsor
                    if (sponsorUser.SponsorID == sponsorID && sponsorUser.UserID !== currentUserID) {
                        // Check if this user is already in the drivers list
                        const existsInDrivers = sponsorDrivers.some(driver => driver.UserID === sponsorUser.UserID);
                        
                        if (!existsInDrivers) {
                            console.log(`✓ Found sponsor user with matching SponsorID but no DRIVER record: UserID ${sponsorUser.UserID}`);
                            sponsorDrivers.push({
                                UserID: sponsorUser.UserID,
                                FirstName: sponsorUser.FirstName || 'Unknown',
                                LastName: sponsorUser.LastName || 'User',
                                Email: sponsorUser.Email || 'No email',
                                DriverID: null, // No driver ID available
                                SponsorID: sponsorID,
                                Points: 0,
                                ActiveAccount: sponsorUser.ActiveAccount !== undefined ? sponsorUser.ActiveAccount : 1,
                                uniqueKey: `sponsor-user-${sponsorUser.UserID}-${index}`
                            });
                        } else {
                            console.log(`- Sponsor user ${sponsorUser.UserID} already exists in drivers list`);
                        }
                    }
                });
            }
            
            console.log('Final sponsor drivers list (same sponsor only):', sponsorDrivers);
            console.log(`Total drivers found for SponsorID ${sponsorID}: ${sponsorDrivers.length}`);
            setDrivers(sponsorDrivers);
            
        } catch (error) {
            console.error('Error fetching sponsor drivers:', error);
        }
    };

    const handleAddDriver = async (e) => {
        e.preventDefault();
        if (!sponsorInfo) return;

        try {
            // Generate a new salt for the driver
            const salt = GenerateSalt();
            const driverData = {
                ...newDriver,
                SponsorID: sponsorInfo.SponsorID,
                UserType: 1, // Driver type
                PasswordSalt: salt
            };

            const queryString = new URLSearchParams(driverData).toString();
            const response = await fetch(`https://63iutwxr2owp72oyfbetwyluaq0wakdm.lambda-url.us-east-1.on.aws/driverAPI/addDriver?${queryString}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (response.ok) {
                alert('Driver added successfully!');
                setShowAddModal(false);
                setNewDriver({
                    FirstName: '',
                    LastName: '',
                    Email: '',
                    Password: '',
                    PasswordSalt: ''
                });
                fetchDriversForSponsor(sponsorInfo.SponsorID);
            } else {
                alert('Error adding driver');
            }
        } catch (error) {
            console.error('Error adding driver:', error);
            alert('Error adding driver');
        }
    };

    const handleEditDriver = (driver) => {
        setEditingDriver({
            ...driver,
            Password: '', // Don't show existing password
            PasswordSalt: 'auto-generated'
        });
        setShowEditModal(true);
    };

    const handleUpdateDriver = async (e) => {
        e.preventDefault();
        
        try {
            const updateData = {
                UserID: editingDriver.UserID,
                FirstName: editingDriver.FirstName,
                LastName: editingDriver.LastName,
                Email: editingDriver.Email,
                Password: editingDriver.Password,
                PasswordSalt: editingDriver.PasswordSalt
            };

            const response = await fetch(`https://63iutwxr2owp72oyfbetwyluaq0wakdm.lambda-url.us-east-1.on.aws/driverAPI/updateDriver`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updateData)
            });

            if (response.ok) {
                alert('Driver updated successfully!');
                setShowEditModal(false);
                setEditingDriver(null);
                fetchDriversForSponsor(sponsorInfo.SponsorID);
            } else {
                alert('Error updating driver');
            }
        } catch (error) {
            console.error('Error updating driver:', error);
            alert('Error updating driver');
        }
    };

    // Function for points management
    const handleManagePointsClick = (driver) => {
        setManagingDriver(driver);
        console.log(driver);
        setPointsAdjustment(0); // Reset the input field
        setShowManagePointsModal(true);
    };

    // Function to update points 
    const handleUpdatePoints = async (e) => {
        e.preventDefault();
        if (!managingDriver || pointsAdjustment === 0) {
             alert('Please enter a non-zero number of points to adjust.');
             return;
        }

        try {
            console.log('Sending point adjustment:', [managingDriver.DriverID, pointsAdjustment, managingDriver.SponsorID]);

            const response = await updateDriverPoints(managingDriver.DriverID, pointsAdjustment, managingDriver.SponsorID);

            if (response.ok) {
                alert(`Points adjusted successfully! (${pointsAdjustment})`);
                fetchDriversForSponsor(sponsorInfo.SponsorID); 
            } else {
                alert('Error adjusting points');
            }

            setShowManagePointsModal(false);
            setManagingDriver(null);
            setPointsAdjustment(0);
            fetchDriversForSponsor(sponsorInfo.SponsorID); 
            
        } catch (error) {
            console.error('Error adjusting points:', error);
            alert('Error adjusting points');
        }
    };


    const handleRemoveDriver = async (driverID, driverName, isActive) => {
        const action = isActive ? 'deactivate' : 'reactivate';
        if (!window.confirm(`Are you sure you want to ${action} ${driverName} from the program? This will ${isActive ? 'disable' : 'enable'} their access.`)) {
            return;
        }

        try {
            const response = await fetch(`https://63iutwxr2owp72oyfbetwyluaq0wakdm.lambda-url.us-east-1.on.aws/driverAPI/toggleDriverActivity/${driverID}`, {
                method: 'POST'
            });

            if (response.ok) {
                alert(`Driver ${action}d successfully!`);
                fetchDriversForSponsor(sponsorInfo.SponsorID);
            } else {
                alert(`Error ${action}ing driver`);
            }
        } catch (error) {
            console.error(`Error ${action}ing driver:`, error);
            alert(`Error ${action}ing driver`);
        }
    };

    const handleDebugAllUsers = async () => {
        try {
            console.log('Fetching debug data for all users...');
            const response = await fetch('https://63iutwxr2owp72oyfbetwyluaq0wakdm.lambda-url.us-east-1.on.aws/driverAPI/debugAllUsers');
            if (response.ok) {
                const result = await response.json();
                console.log('Debug data received:', result);
                setDebugData(result);
                setShowDebugModal(true);
            } else {
                alert('Failed to fetch debug data');
            }
        } catch (error) {
            console.error('Error fetching debug data:', error);
            alert('Error fetching debug data');
        }
    };

    // Filter drivers based on search query
    const filteredDrivers = drivers.filter(driver => {
        const query = search.toLowerCase();
        return (
            driver.FirstName.toLowerCase().includes(query) ||
            driver.LastName.toLowerCase().includes(query) ||
            driver.Email.toLowerCase().includes(query) ||
            String(driver.DriverID || '').includes(query) ||
            String(driver.UserID).includes(query)
        );
    });

    const handleBulkUpload = async (e) => {
        e.preventDefault();
        if (!bulkUploadFile) {
            alert('Please select a file to upload.');
            return;
        }

        setBulkUploadLoading(true);
        setBulkUploadResults(null);

        try {
            const fileContent = await readFileContent(bulkUploadFile);
            const lines = fileContent.split('\n').map(line => line.trim()).filter(line => line);
            
            const results = {
                totalLines: lines.length,
                processed: 0,
                errors: [],
                success: {
                    drivers: 0,
                    sponsors: 0
                }
            };

            for (let i = 0; i < lines.length; i++) {
                const lineNumber = i + 1;
                const line = lines[i];
                
                try {
                    const result = await processUploadLine(line, lineNumber);
                    
                    if (result.success) {
                        results.success[result.type]++;
                    } else {
                        results.errors.push({
                            line: lineNumber,
                            content: line,
                            error: result.error
                        });
                    }
                } catch (error) {
                    results.errors.push({
                        line: lineNumber,
                        content: line,
                        error: `Unexpected error: ${error.message}`
                    });
                }
                
                results.processed++;
            }

            setBulkUploadResults(results);
            
            // Refresh data after bulk upload
            if (sponsorInfo) {
                fetchDriversForSponsor(sponsorInfo.SponsorID);
            }
            
        } catch (error) {
            console.error('Error processing bulk upload:', error);
            alert(`Error processing file: ${error.message}`);
        } finally {
            setBulkUploadLoading(false);
        }
    };

    const processUploadLine = async (line, lineNumber) => {
        const parts = line.split('|');
        
        if (parts.length < 2) {
            return { success: false, error: 'Invalid format: Not enough fields (minimum 2 required)' };
        }

        const type = parts[0].trim().toUpperCase();
        
        switch (type) {
            case 'D':
                return await processDriverRecord(parts);
            case 'S':
                return await processSponsorRecord(parts);
            default:
                return { success: false, error: `Invalid type '${type}'. Must be D or S.` };
        }
    };

    const processDriverRecord = async (parts) => {
        if (parts.length !== 5) {
            return { success: false, error: 'Driver record must have exactly 4 fields: D||first name|last name|email' };
        }

        const [, organizationName, firstName, lastName, email] = parts.map(p => p.trim());
        
        if (!firstName || !lastName || !email) {
            return { success: false, error: 'All driver fields are required and cannot be empty' };
        }

        if(organizationName){
            return { success: false, error: 'Organization name cannot be provided by sponsor users.'}
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return { success: false, error: 'Invalid email format' };
        }

        try {
            const salt = GenerateSalt();
            const driverData = {
                FirstName: firstName,
                LastName: lastName,
                Email: email,
                Password: 'DefaultPassword123!',
                SponsorID: sponsorInfo.SponsorID,
                UserType: 1,
                PasswordSalt: salt
            };

            const queryString = new URLSearchParams(driverData).toString();
            const response = await fetch(`https://63iutwxr2owp72oyfbetwyluaq0wakdm.lambda-url.us-east-1.on.aws/driverAPI/addDriver?${queryString}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (response.ok) {
                return { success: true, type: 'drivers' };
            } else {
                const errorText = await response.text();
                return { success: false, error: `Failed to create driver: ${errorText}` };
            }
        } catch (error) {
            return { success: false, error: `Network error creating driver: ${error.message}` };
        }
    };

    const processSponsorRecord = async (parts) => {
        if (parts.length !== 5) {
            return { success: false, error: 'Sponsor record must have exactly 4 fields: S||first name|last name|email' };
        }

        const [, organizationName, firstName, lastName, email] = parts.map(p => p.trim());
        
        if (!firstName || !lastName || !email) {
            return { success: false, error: 'All sponsor fields are required and cannot be empty' };
        }

        if(organizationName){
            return { success: false, error: 'Organization name cannot be provided by sponsor users.'}
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return { success: false, error: 'Invalid email format' };
        }

        try {
            const salt = GenerateSalt();
            const sponsorData = {
                FirstName: firstName,
                LastName: lastName,
                Email: email,
                Password: 'DefaultPassword123!',
                SponsorID: sponsorInfo.SponsorID,
                UserType: 2,
                PasswordSalt: salt
            };

            const queryString = new URLSearchParams(sponsorData).toString();
            const response = await fetch(`https://63iutwxr2owp72oyfbetwyluaq0wakdm.lambda-url.us-east-1.on.aws/sponsorAPI/addSponsorUser?${queryString}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                return { success: true, type: 'sponsors' };
            } else {
                const errorText = await response.text();
                return { success: false, error: `Failed to create sponsor: ${errorText}` };
            }
        } catch (error) {
            return { success: false, error: `Network error creating sponsor: ${error.message}` };
        }
    };

    const readFileContent = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    };

    const handleFileSelect = (file) => {
        if (file && (file.type === 'text/plain' || file.name.endsWith('.txt'))) {
            setBulkUploadFile(file);
            setBulkUploadResults(null);
        } else {
            alert('Please select a valid text file (.txt)');
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragOver(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragOver(false);
        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            handleFileSelect(files[0]);
        }
    };

    useEffect(() => {
        fetchSponsorInfo();
    }, []);

    if (loading) {
        return (
            <div>
                <SponsorNavbar />
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

    if (!sponsorInfo) {
        return (
            <div>
                <SponsorNavbar />
                <div className="container mt-4">
                    <div className="alert alert-warning">
                        <h4>Access Denied</h4>
                        <p>You are not associated with a sponsor organization. Please contact your administrator.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div>
            <SponsorNavbar />
            <div className="container mt-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h2>Driver Management</h2>
                    {activeTab === 'drivers' && (
                        <div>
                            <button 
                                className="btn btn-outline-info me-2"
                                onClick={handleDebugAllUsers}
                            >
                                <i className="fas fa-bug me-2"></i>
                                Debug All Users
                            </button>
                            <button 
                                className="btn btn-primary"
                                onClick={() => setShowAddModal(true)}
                            >
                                <i className="fas fa-plus me-2"></i>
                                Add New Driver
                            </button>
                        </div>
                    )}
                </div>

                {/* Tab Navigation */}
                <ul className="nav nav-tabs mb-3">
                    <li className="nav-item">
                        <button 
                            className={`nav-link ${activeTab === 'drivers' ? 'active' : ''}`}
                            onClick={() => setActiveTab('drivers')}
                        >
                            <i className="fas fa-users me-2"></i>
                            Driver Management
                        </button>
                    </li>
                    <li className="nav-item">
                        <button 
                            className={`nav-link ${activeTab === 'bulk' ? 'active' : ''}`}
                            onClick={() => setActiveTab('bulk')}
                        >
                            <i className="fas fa-upload me-2"></i>
                            Bulk Load
                        </button>
                    </li>
                </ul>

                {/* Driver Management Tab */}
                {activeTab === 'drivers' && (
                    <>
                        {/* Search input */}
                        <div className="mb-3">
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Search drivers by name, email, or ID..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>

                        <div className="card mb-3">
                            <div className="card-body">
                                <h5 className="card-title">Sponsor Information</h5>
                                <p className="card-text">
                                    <strong>Sponsor ID:</strong> {sponsorInfo?.SponsorID} <br />
                                    <strong>Total Drivers:</strong> {drivers.length}
                                </p>
                            </div>
                        </div>

                        {filteredDrivers.length === 0 ? (
                            <div className="alert alert-info">
                                <h5>No Drivers Found</h5>
                                <p>
                                    {search
                                        ? "No drivers match your search."
                                        : "You don't have any drivers in your program yet. Click \"Add New Driver\" to get started."
                                    }
                                </p>
                            </div>
                        ) : (
                            <div className="table-responsive">
                                <table className="table table-striped">
                                    <thead className="table-dark">
                                        <tr>
                                            <th>Name</th>
                                            <th>Email</th>
                                            <th>User ID</th>
                                            <th>Points</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredDrivers.map((driver) => (
                                            <tr key={driver.uniqueKey || driver.DriverID || `user-${driver.UserID}`} className={driver.ActiveAccount === 0 ? 'table-secondary' : ''}>
                                                <td>
                                                    {driver.FirstName} {driver.LastName}
                                                    {driver.ActiveAccount === 0 && (
                                                        <span className="badge bg-danger ms-2">Inactive</span>
                                                    )}
                                                </td>
                                                <td>{driver.Email}</td>
                                                <td>{driver.UserID}</td>
                                                <td>{driver.Points}</td>
                                                <td>
                                                    <button 
                                                        className="btn btn-sm btn-outline-primary me-2"
                                                        onClick={() => handleEditDriver(driver)}
                                                    >
                                                        <i className="fas fa-edit me-1"></i>
                                                        Edit
                                                    </button>
                                                    <button 
                                                        className="btn btn-sm btn-outline-info me-2"
                                                        onClick={() => handleManagePointsClick(driver)}
                                                    >
                                                        <i className="fas fa-coins me-1"></i>
                                                        Points
                                                    </button>
                                                    <button 
                                                        className={`btn btn-sm ${driver.ActiveAccount === 1 ? 'btn-outline-warning' : 'btn-outline-success'}`}
                                                        onClick={() => handleRemoveDriver(driver.DriverID || driver.UserID, `${driver.FirstName} ${driver.LastName}`, driver.ActiveAccount === 1)}
                                                    >
                                                        <i className={`fas ${driver.ActiveAccount === 1 ? 'fa-ban' : 'fa-check'} me-1`}></i>
                                                        {driver.ActiveAccount === 1 ? 'Deactivate' : 'Reactivate'}
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

                {/* Bulk Load Tab */}
                {activeTab === 'bulk' && (
                    <>
                        <div className="row">
                            <div className="col-md-8">
                                <div className="card">
                                    <div className="card-body">
                                        <h5 className="card-title">
                                            <i className="fas fa-upload me-2"></i>
                                            Bulk Load Users
                                        </h5>
                                        <p className="card-text">
                                            Upload a pipe-delimited text file to create multiple drivers and sponsors at once.
                                        </p>

                                        <form onSubmit={handleBulkUpload}>
                                            <div 
                                                className={`border rounded p-4 mb-3 text-center ${isDragOver ? 'border-primary bg-light' : 'border-dashed'}`}
                                                onDragOver={handleDragOver}
                                                onDragLeave={handleDragLeave}
                                                onDrop={handleDrop}
                                                style={{ 
                                                    borderStyle: isDragOver ? 'solid' : 'dashed',
                                                    minHeight: '120px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    flexDirection: 'column'
                                                }}
                                            >
                                                {bulkUploadFile ? (
                                                    <div>
                                                        <i className="fas fa-file-alt fa-2x text-success mb-2"></i>
                                                        <p className="mb-0">
                                                            <strong>{bulkUploadFile.name}</strong>
                                                        </p>
                                                        <small className="text-muted">
                                                            {(bulkUploadFile.size / 1024).toFixed(2)} KB
                                                        </small>
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <i className="fas fa-cloud-upload-alt fa-2x text-muted mb-2"></i>
                                                        <p className="mb-2">
                                                            Drag and drop your text file here, or click to browse
                                                        </p>
                                                        <input
                                                            type="file"
                                                            className="form-control"
                                                            accept=".txt,text/plain"
                                                            onChange={(e) => handleFileSelect(e.target.files[0])}
                                                            style={{ maxWidth: '300px', margin: '0 auto' }}
                                                        />
                                                    </div>
                                                )}
                                            </div>

                                            <div className="d-flex justify-content-between">
                                                <button
                                                    type="button"
                                                    className="btn btn-outline-secondary"
                                                    onClick={() => {
                                                        setBulkUploadFile(null);
                                                        setBulkUploadResults(null);
                                                    }}
                                                    disabled={!bulkUploadFile}
                                                >
                                                    Clear File
                                                </button>
                                                <button
                                                    type="submit"
                                                    className="btn btn-primary"
                                                    disabled={!bulkUploadFile || bulkUploadLoading}
                                                >
                                                    {bulkUploadLoading ? (
                                                        <>
                                                            <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                                            Processing...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <i className="fas fa-upload me-2"></i>
                                                            Upload and Process
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </form>

                                        {/* Results Display */}
                                        {bulkUploadResults && (
                                            <div className="mt-4">
                                                <hr />
                                                <h6>Upload Results</h6>
                                                <div className="row mb-3">
                                                    <div className="col-md-3">
                                                        <div className="card bg-primary text-white">
                                                            <div className="card-body text-center">
                                                                <h5>{bulkUploadResults.totalLines}</h5>
                                                                <small>Total Lines</small>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="col-md-3">
                                                        <div className="card bg-success text-white">
                                                            <div className="card-body text-center">
                                                                <h5>
                                                                    {bulkUploadResults.success.drivers + 
                                                                     bulkUploadResults.success.sponsors}
                                                                </h5>
                                                                <small>Successful</small>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="col-md-3">
                                                        <div className="card bg-danger text-white">
                                                            <div className="card-body text-center">
                                                                <h5>{bulkUploadResults.errors.length}</h5>
                                                                <small>Errors</small>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="col-md-3">
                                                        <div className="card bg-info text-white">
                                                            <div className="card-body text-center">
                                                                <h5>{bulkUploadResults.processed}</h5>
                                                                <small>Processed</small>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="row mb-3">
                                                    <div className="col-md-6">
                                                        <div className="text-center">
                                                            <i className="fas fa-car text-primary fa-2x"></i>
                                                            <h6 className="mt-2">Drivers</h6>
                                                            <span className="badge bg-primary">{bulkUploadResults.success.drivers}</span>
                                                        </div>
                                                    </div>
                                                    <div className="col-md-6">
                                                        <div className="text-center">
                                                            <i className="fas fa-handshake text-success fa-2x"></i>
                                                            <h6 className="mt-2">Sponsors</h6>
                                                            <span className="badge bg-success">{bulkUploadResults.success.sponsors}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Error Details */}
                                                {bulkUploadResults.errors.length > 0 && (
                                                    <div className="mt-3">
                                                        <h6 className="text-danger">
                                                            <i className="fas fa-exclamation-triangle me-2"></i>
                                                            Errors ({bulkUploadResults.errors.length})
                                                        </h6>
                                                        <div className="table-responsive" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                                            <table className="table table-sm table-striped">
                                                                <thead className="table-dark">
                                                                    <tr>
                                                                        <th>Line</th>
                                                                        <th>Content</th>
                                                                        <th>Error</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {bulkUploadResults.errors.map((error, index) => (
                                                                        <tr key={index}>
                                                                            <td>{error.line}</td>
                                                                            <td>
                                                                                <code style={{ fontSize: '0.8em' }}>
                                                                                    {error.content.length > 50 
                                                                                        ? error.content.substring(0, 50) + '...' 
                                                                                        : error.content}
                                                                                </code>
                                                                            </td>
                                                                            <td className="text-danger" style={{ fontSize: '0.9em' }}>
                                                                                {error.error}
                                                                            </td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="col-md-4">
                                <div className="card">
                                    <div className="card-body">
                                        <h6 className="card-title">
                                            <i className="fas fa-info-circle me-2"></i>
                                            File Format Instructions
                                        </h6>
                                        <div className="mb-3">
                                            <h6>Record Types:</h6>
                                            <ul className="list-unstyled">
                                                <li><code>D</code> - Driver</li>
                                                <li><code>S</code> - Sponsor User</li>
                                            </ul>
                                        </div>

                                        <div className="mb-3">
                                            <h6>Format Examples:</h6>
                                            <div className="bg-light p-2 rounded">
                                                <code style={{ fontSize: '0.8em' }}>
                                                    D||Joe|Driver|joe@email.com<br />
                                                    S||Jill|Sponsor|jill@mail.com
                                                </code>
                                            </div>
                                        </div>

                                        <div className="mb-3">
                                            <h6>Rules:</h6>
                                            <ul style={{ fontSize: '0.9em' }}>
                                                <li>Use pipe (|) as delimiter</li>
                                                <li>Leave organization field empty (second field)</li>
                                                <li>No pipes allowed in field data</li>
                                                <li>Email addresses must be valid format</li>
                                                <li>Default password: "DefaultPassword123!"</li>
                                                <li>All users will be assigned to your organization</li>
                                                <li>Errors are skipped, processing continues</li>
                                            </ul>
                                        </div>

                                        <div className="alert alert-warning" style={{ fontSize: '0.8em' }}>
                                            <strong>Note:</strong> Sponsors cannot create organizations through bulk upload. 
                                            All users will be automatically assigned to your sponsor organization.
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
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

                {/* Manage Points Modal */}
                {showManagePointsModal && managingDriver && (
                    <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
                        <div className="modal-dialog">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 className="modal-title">Manage Points for {managingDriver.FirstName} {managingDriver.LastName}</h5>
                                    <button type="button" className="btn-close" onClick={() => setShowManagePointsModal(false)}></button>
                                </div>
                                <form onSubmit={handleUpdatePoints}>
                                    <div className="modal-body">
                                        <div className="alert alert-info">
                                            Current Points: <strong>{managingDriver.Points || 0}</strong>
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">Points Adjustment (+/-)</label>
                                            <input 
                                                type="number" 
                                                className="form-control"
                                                placeholder="e.g., 50 to award, -20 to deduct"
                                                value={pointsAdjustment}
                                                onChange={(e) => setPointsAdjustment(parseInt(e.target.value) || 0)}
                                                required
                                            />
                                            <small className="form-text text-muted">Enter a positive number to add points, or a negative number to deduct points.</small>
                                        </div>
                                    </div>
                                    <div className="modal-footer">
                                        <button type="button" className="btn btn-secondary" onClick={() => setShowManagePointsModal(false)}>
                                            Cancel
                                        </button>
                                        <button type="submit" className="btn btn-info">
                                            <i className="fas fa-arrow-up me-1"></i>
                                            Adjust Points
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}

                {/* Debug Modal */}
                {showDebugModal && debugData && (
                    <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
                        <div className="modal-dialog modal-xl">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 className="modal-title">Debug: All Users Data</h5>
                                    <button type="button" className="btn-close" onClick={() => setShowDebugModal(false)}></button>
                                </div>
                                <div className="modal-body" style={{maxHeight: '70vh', overflowY: 'auto'}}>
                                    <div className="accordion" id="debugAccordion">
                                        
                                        {/* Summary */}
                                        <div className="accordion-item">
                                            <h2 className="accordion-header">
                                                <button className="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#summary">
                                                    Summary Statistics
                                                </button>
                                            </h2>
                                            <div id="summary" className="accordion-collapse collapse show">
                                                <div className="accordion-body">
                                                    <div className="row">
                                                        <div className="col-md-6">
                                                            <strong>Total Users:</strong> {debugData.data.summary.totalUsers}<br/>
                                                            <strong>Active Users:</strong> {debugData.data.summary.activeUsers}<br/>
                                                            <strong>Inactive Users:</strong> {debugData.data.summary.inactiveUsers}<br/>
                                                            <strong>Driver Type Users:</strong> {debugData.data.summary.driverTypeUsers}
                                                        </div>
                                                        <div className="col-md-6">
                                                            <strong>Total Drivers:</strong> {debugData.data.summary.totalDrivers}<br/>
                                                            <strong>Total Sponsor Users:</strong> {debugData.data.summary.totalSponsorUsers}<br/>
                                                            <strong>Total Sponsors:</strong> {debugData.data.summary.totalSponsors}<br/>
                                                            <strong>Users Missing Driver Records:</strong> {debugData.data.summary.usersWithoutDriverRecords}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* All Users */}
                                        <div className="accordion-item">
                                            <h2 className="accordion-header">
                                                <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#allUsers">
                                                    All Users ({debugData.data.allUsers.length})
                                                </button>
                                            </h2>
                                            <div id="allUsers" className="accordion-collapse collapse">
                                                <div className="accordion-body">
                                                    <div className="table-responsive">
                                                        <table className="table table-sm">
                                                            <thead>
                                                                <tr>
                                                                    <th>UserID</th>
                                                                    <th>Name</th>
                                                                    <th>Email</th>
                                                                    <th>UserType</th>
                                                                    <th>Active</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {debugData.data.allUsers.map(user => (
                                                                    <tr key={user.UserID} className={user.ActiveAccount === 0 ? 'table-secondary' : ''}>
                                                                        <td>{user.UserID}</td>
                                                                        <td>{user.FirstName} {user.LastName}</td>
                                                                        <td>{user.Email}</td>
                                                                        <td>{user.UserType}</td>
                                                                        <td>{user.ActiveAccount ? 'Yes' : 'No'}</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Driver Records */}
                                        <div className="accordion-item">
                                            <h2 className="accordion-header">
                                                <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#allDrivers">
                                                    Driver Records ({debugData.data.allDrivers.length})
                                                </button>
                                            </h2>
                                            <div id="allDrivers" className="accordion-collapse collapse">
                                                <div className="accordion-body">
                                                    <div className="table-responsive">
                                                        <table className="table table-sm">
                                                            <thead>
                                                                <tr>
                                                                    <th>DriverID</th>
                                                                    <th>UserID</th>
                                                                    <th>SponsorID</th>
                                                                    <th>Points</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {debugData.data.allDrivers.map(driver => (
                                                                    <tr key={driver.DriverID}>
                                                                        <td>{driver.DriverID}</td>
                                                                        <td>{driver.UserID}</td>
                                                                        <td>{driver.SponsorID}</td>
                                                                        <td>{driver.Points || 0}</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Issues */}
                                        {(debugData.data.usersWithoutDriverRecords.length > 0 || debugData.data.driversWithInvalidSponsors.length > 0) && (
                                            <div className="accordion-item">
                                                <h2 className="accordion-header">
                                                    <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#issues">
                                                        <span className="text-danger">Data Issues Found</span>
                                                    </button>
                                                </h2>
                                                <div id="issues" className="accordion-collapse collapse">
                                                    <div className="accordion-body">
                                                        {debugData.data.usersWithoutDriverRecords.length > 0 && (
                                                            <div className="alert alert-warning">
                                                                <h6>Users Without Driver Records ({debugData.data.usersWithoutDriverRecords.length})</h6>
                                                                <ul>
                                                                    {debugData.data.usersWithoutDriverRecords.map(user => (
                                                                        <li key={user.UserID}>
                                                                            UserID {user.UserID}: {user.FirstName} {user.LastName} ({user.Email})
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        )}
                                                        
                                                        {debugData.data.driversWithInvalidSponsors.length > 0 && (
                                                            <div className="alert alert-danger">
                                                                <h6>Drivers With Invalid Sponsors ({debugData.data.driversWithInvalidSponsors.length})</h6>
                                                                <ul>
                                                                    {debugData.data.driversWithInvalidSponsors.map(driver => (
                                                                        <li key={driver.DriverID}>
                                                                            DriverID {driver.DriverID} (UserID {driver.UserID}) - Invalid SponsorID: {driver.SponsorID}
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowDebugModal(false)}>
                                        Close
                                    </button>
                                    <button type="button" className="btn btn-info" onClick={() => console.log('Full Debug Data:', debugData)}>
                                        Log to Console
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}