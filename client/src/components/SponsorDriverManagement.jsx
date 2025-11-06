import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import SponsorNavbar from './SponsorNavbar';
import { GenerateSalt } from './MiscellaneousParts/HashPass'; // <-- Import GenerateSalt

export default function SponsorDriverManagement() {
    const [drivers, setDrivers] = useState([]);
    const [sponsorInfo, setSponsorInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingDriver, setEditingDriver] = useState(null);
    const [newDriver, setNewDriver] = useState({
        FirstName: '',
        LastName: '',
        Email: '',
        Password: '',
        PasswordSalt: '' // <-- Remove default, will generate on submit
    });
    const [search, setSearch] = useState(""); // <-- Add search state
    const [showDebugModal, setShowDebugModal] = useState(false);
    const [debugData, setDebugData] = useState(null);

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
                const response = await fetch(`http://localhost:4000/sponsorAPI/getAllSponsorUsers`);
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
            const driversResponse = await fetch(`http://localhost:4000/driverAPI/getAllDrivers`);
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
            const sponsorUsersResponse = await fetch(`http://localhost:4000/sponsorAPI/getAllSponsorUsers`);
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
            const response = await fetch(`http://localhost:4000/driverAPI/addDriver?${queryString}`, {
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

            const response = await fetch(`http://localhost:4000/driverAPI/updateDriver`, {
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

    const handleRemoveDriver = async (driverID, driverName, isActive) => {
        const action = isActive ? 'deactivate' : 'reactivate';
        if (!window.confirm(`Are you sure you want to ${action} ${driverName} from the program? This will ${isActive ? 'disable' : 'enable'} their access.`)) {
            return;
        }

        try {
            const response = await fetch(`http://localhost:4000/driverAPI/toggleDriverActivity/${driverID}`, {
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
            const response = await fetch('http://localhost:4000/driverAPI/debugAllUsers');
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
                    <h2>Driver Management - All Sponsors</h2>
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
                </div>

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
                            <strong>Sponsor ID:</strong> {sponsorInfo.SponsorID} <br />
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
                                        <td>
                                            <button 
                                                className="btn btn-sm btn-outline-primary me-2"
                                                onClick={() => handleEditDriver(driver)}
                                            >
                                                <i className="fas fa-edit me-1"></i>
                                                Edit
                                            </button>
                                            {driver.DriverID && (
                                                <button 
                                                    className={`btn btn-sm ${driver.ActiveAccount === 1 ? 'btn-outline-warning' : 'btn-outline-success'}`}
                                                    onClick={() => handleRemoveDriver(driver.DriverID, `${driver.FirstName} ${driver.LastName}`, driver.ActiveAccount === 1)}
                                                >
                                                    <i className={`fas ${driver.ActiveAccount === 1 ? 'fa-ban' : 'fa-check'} me-1`}></i>
                                                    {driver.ActiveAccount === 1 ? 'Deactivate' : 'Reactivate'}
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
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