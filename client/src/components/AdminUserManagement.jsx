import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import AdminNavbar from './AdminNavbar';
import { GenerateSalt } from './MiscellaneousParts/HashPass';

export default function AdminUserManagement() {
    const [drivers, setDrivers] = useState([]);
    const [sponsors, setSponsors] = useState([]);
    const [admins, setAdmins] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showEditSponsorModal, setShowEditSponsorModal] = useState(false);
    const [showEditAdminModal, setShowEditAdminModal] = useState(false);
    const [editingDriver, setEditingDriver] = useState(null);
    const [editingSponsor, setEditingSponsor] = useState(null);
    const [editingAdmin, setEditingAdmin] = useState(null);
    const [newDriver, setNewDriver] = useState({
        FirstName: '',
        LastName: '',
        Email: '',
        Password: '',
        SponsorID: '',
        PasswordSalt: ''
    });
    const [search, setSearch] = useState("");
    const [userTypeFilter, setUserTypeFilter] = useState("all");
    const [dataIssues, setDataIssues] = useState([]);
    const [showDataCleanup, setShowDataCleanup] = useState(false);

    const fetchAllDrivers = async () => {
        try {
            const response = await fetch(`http://localhost:4000/driverAPI/getAllDrivers`);
            if (response.ok) {
                const allDrivers = await response.json();
                setDrivers(allDrivers);
            }
        } catch (error) {
            console.error('Error fetching drivers:', error);
        }
    };

    const fetchAllSponsors = async () => {
        try {
            const response = await fetch(`http://localhost:4000/sponsorAPI/getAllSponsorUsers`);
            if (response.ok) {
                const allSponsors = await response.json();
                setSponsors(allSponsors);
            }
        } catch (error) {
            console.error('Error fetching sponsors:', error);
        }
    };

    const fetchAllAdmins = async () => {
        try {
            const response = await fetch(`http://localhost:4000/adminAPI/getAllAdmins`);
            if (response.ok) {
                const allAdmins = await response.json();
                setAdmins(allAdmins);
            }
        } catch (error) {
            console.error('Error fetching admins:', error);
        }
    };

    const combineAllUsers = () => {
        const userMap = new Map(); // Use Map to deduplicate by UserID
        
        // Process drivers first
        drivers.forEach(driver => {
            const userKey = driver.UserID;
            if (!userMap.has(userKey)) {
                userMap.set(userKey, {
                    ...driver,
                    userType: 'Driver',
                    displayId: driver.DriverID,
                    sponsorName: getSponsorName(driver.SponsorID),
                    uniqueKey: `Driver-${driver.DriverID}-${driver.UserID}`
                });
            } else {
                // If user already exists, prefer the first role type encountered
                console.log(`Duplicate user found: UserID ${userKey} already exists as ${userMap.get(userKey).userType}, skipping Driver role`);
            }
        });

        // Process sponsors
        sponsors.forEach(sponsor => {
            const userKey = sponsor.UserID;
            if (!userMap.has(userKey)) {
                userMap.set(userKey, {
                    ...sponsor,
                    userType: 'Sponsor',
                    displayId: sponsor.SponsorID,
                    sponsorName: 'N/A',
                    uniqueKey: `Sponsor-${sponsor.SponsorID}-${sponsor.UserID}`
                });
            } else {
                console.log(`Duplicate user found: UserID ${userKey} already exists as ${userMap.get(userKey).userType}, skipping Sponsor role`);
            }
        });

        // Process admins
        admins.forEach(admin => {
            const userKey = admin.UserID;
            if (!userMap.has(userKey)) {
                userMap.set(userKey, {
                    ...admin,
                    userType: 'Admin',
                    displayId: admin.AdminID,
                    sponsorName: 'N/A',
                    uniqueKey: `Admin-${admin.AdminID}-${admin.UserID}`
                });
            } else {
                console.log(`Duplicate user found: UserID ${userKey} already exists as ${userMap.get(userKey).userType}, skipping Admin role`);
            }
        });

        // Convert Map values back to array
        const combinedUsers = Array.from(userMap.values());
        
        console.log(`Combined ${combinedUsers.length} unique users from ${drivers.length} drivers, ${sponsors.length} sponsors, and ${admins.length} admins`);
        
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
                    SponsorID: '',
                    PasswordSalt: ''
                });
                fetchAllDrivers();
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
            Password: '',
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
                PasswordSalt: editingDriver.PasswordSalt,
                SponsorID: editingDriver.SponsorID // Make sure this is included
            };

            console.log('Sending driver update data:', updateData); // Debug log

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
                fetchAllDrivers();
            } else {
                const errorText = await response.text();
                console.error('Update error:', errorText);
                alert('Error updating driver');
            }
        } catch (error) {
            console.error('Error updating driver:', error);
            alert('Error updating driver');
        }
    };

    const handleRemoveDriver = async (driverID, driverName) => {
        if (!window.confirm(`Are you sure you want to remove ${driverName} from the system? This action cannot be undone.`)) {
            return;
        }

        try {
            const response = await fetch(`http://localhost:4000/driverAPI/removeDriver/${driverID}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                alert('Driver removed successfully!');
                fetchAllDrivers();
            } else {
                alert('Error removing driver');
            }
        } catch (error) {
            console.error('Error removing driver:', error);
            alert('Error removing driver');
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

    const handleRemoveSponsor = async (sponsorUserID, sponsorName) => {
        if (!window.confirm(`Are you sure you want to remove ${sponsorName} from the system? This action cannot be undone and may affect associated drivers.`)) {
            return;
        }

        try {
            console.log('Removing sponsor with SponsorUserID:', sponsorUserID);

            const response = await fetch(`http://localhost:4000/sponsorAPI/removeSponsorUser/${sponsorUserID}`, {
                method: 'DELETE'
            });

            console.log('Delete response status:', response.status);
            const responseText = await response.text();
            console.log('Delete response text:', responseText);

            if (response.ok) {
                alert('Sponsor removed successfully!');
                await Promise.all([fetchAllDrivers(), fetchAllSponsors(), fetchAllAdmins()]);
            } else {
                alert(`Error removing sponsor: ${responseText}`);
            }
        } catch (error) {
            console.error('Error removing sponsor:', error);
            alert(`Error removing sponsor: ${error.message}`);
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

    const handleRemoveAdmin = async (adminID, adminName) => {
        // Get current user to prevent self-deletion
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        
        // Check if trying to delete self
        const adminToDelete = admins.find(admin => admin.AdminID === adminID);
        if (adminToDelete && adminToDelete.UserID === currentUser.UserID) {
            alert('You cannot delete your own admin account!');
            return;
        }

        if (!window.confirm(`Are you sure you want to remove ${adminName} from the system? This action cannot be undone and will remove all admin privileges.`)) {
            return;
        }

        try {
            console.log('Removing admin with AdminID:', adminID);

            const response = await fetch(`http://localhost:4000/adminAPI/removeAdminUser/${adminID}`, {
                method: 'DELETE'
            });

            console.log('Delete response status:', response.status);
            const responseText = await response.text();
            console.log('Delete response text:', responseText);

            if (response.ok) {
                alert('Admin removed successfully!');
                await Promise.all([fetchAllDrivers(), fetchAllSponsors(), fetchAllAdmins()]);
            } else {
                alert(`Error removing admin: ${responseText}`);
            }
        } catch (error) {
            console.error('Error removing admin:', error);
            alert(`Error removing admin: ${error.message}`);
        }
    };

    const getSponsorName = (sponsorID) => {
        const sponsor = sponsors.find(s => s.SponsorID === sponsorID);
        return sponsor ? `${sponsor.FirstName} ${sponsor.LastName}` : 'Unknown Sponsor';
    };

    const filteredUsers = allUsers.filter(user => {
        const query = search.toLowerCase();
        const matchesSearch = (
            user.FirstName.toLowerCase().includes(query) ||
            user.LastName.toLowerCase().includes(query) ||
            user.Email.toLowerCase().includes(query) ||
            (user.sponsorName && user.sponsorName.toLowerCase().includes(query)) ||
            String(user.displayId).includes(query) ||
            String(user.UserID).includes(query) ||
            user.userType.toLowerCase().includes(query)
        );
        
        const matchesFilter = userTypeFilter === "all" || user.userType.toLowerCase() === userTypeFilter;
        
        return matchesSearch && matchesFilter;
    });

    const checkDataIntegrity = async () => {
        try {
            const response = await fetch(`http://localhost:4000/dataCleanupAPI/identify-issues`);
            if (response.ok) {
                const result = await response.json();
                setDataIssues(result.issues);
                if (result.totalIssues > 0) {
                    setShowDataCleanup(true);
                } else {
                    alert('No data integrity issues found!');
                }
            }
        } catch (error) {
            console.error('Error checking data integrity:', error);
        }
    };

    const fixDuplicateDrivers = async () => {
        try {
            const response = await fetch(`http://localhost:4000/dataCleanupAPI/fix-duplicate-drivers`, {
                method: 'POST'
            });
            if (response.ok) {
                const result = await response.json();
                alert(result.message);
                checkDataIntegrity(); // Refresh issues
                await Promise.all([fetchAllDrivers(), fetchAllSponsors(), fetchAllAdmins()]);
            }
        } catch (error) {
            console.error('Error fixing duplicate drivers:', error);
        }
    };

    const fixInvalidSponsors = async () => {
        try {
            const response = await fetch(`http://localhost:4000/dataCleanupAPI/fix-invalid-sponsors`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ defaultSponsorID: 1 })
            });
            if (response.ok) {
                const result = await response.json();
                alert(result.message);
                checkDataIntegrity(); // Refresh issues
                await Promise.all([fetchAllDrivers(), fetchAllSponsors(), fetchAllAdmins()]);
            }
        } catch (error) {
            console.error('Error fixing invalid sponsors:', error);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            await Promise.all([fetchAllDrivers(), fetchAllSponsors(), fetchAllAdmins()]);
            setLoading(false);
        };
        fetchData();
    }, []);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        combineAllUsers();
    }, [drivers, sponsors, admins]);

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
                            onClick={checkDataIntegrity}
                        >
                            <i className="fas fa-tools me-2"></i>
                            Check Data Integrity
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

                {/* Data Cleanup Section */}
                {showDataCleanup && dataIssues.length > 0 && (
                    <div className="alert alert-warning">
                        <h5><i className="fas fa-exclamation-triangle me-2"></i>Data Integrity Issues Found</h5>
                        {dataIssues.map((issue, index) => (
                            <div key={index} className="mb-3">
                                <strong>{issue.description}:</strong>
                                <ul>
                                    {issue.data.slice(0, 3).map((item, i) => (
                                        <li key={i}>{JSON.stringify(item)}</li>
                                    ))}
                                    {issue.data.length > 3 && <li>...and {issue.data.length - 3} more</li>}
                                </ul>
                                {issue.type === 'duplicate_drivers' && (
                                    <button className="btn btn-sm btn-danger me-2" onClick={fixDuplicateDrivers}>
                                        Fix Duplicate Drivers
                                    </button>
                                )}
                                {issue.type === 'invalid_sponsor_references' && (
                                    <button className="btn btn-sm btn-danger me-2" onClick={fixInvalidSponsors}>
                                        Fix Invalid Sponsor References
                                    </button>
                                )}
                            </div>
                        ))}
                        <button className="btn btn-sm btn-secondary" onClick={() => setShowDataCleanup(false)}>
                            Hide Issues
                        </button>
                    </div>
                )}

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
                                    <strong>Total Drivers:</strong> {drivers.length}
                                </p>
                            </div>
                            <div className="col-md-3">
                                <p className="card-text">
                                    <strong>Total Sponsors:</strong> {sponsors.length}
                                </p>
                            </div>
                            <div className="col-md-3">
                                <p className="card-text">
                                    <strong>Total Admins:</strong> {admins.length}
                                </p>
                            </div>
                            <div className="col-md-3">
                                <p className="card-text">
                                    <strong>Unique Users:</strong> {allUsers.length}
                                </p>
                            </div>
                        </div>
                        {/* Show warning if there are potential duplicates */}
                        {(drivers.length + sponsors.length + admins.length) > allUsers.length && (
                            <div className="alert alert-warning mt-2">
                                <strong>Note:</strong> Some users have multiple roles. Showing {allUsers.length} unique users 
                                from {drivers.length + sponsors.length + admins.length} total role entries.
                            </div>
                        )}
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
                                    <th>Type ID</th>
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
                                        </td>
                                        <td>{user.displayId}</td>
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
                                                        className="btn btn-sm btn-outline-danger"
                                                        onClick={() => handleRemoveDriver(user.DriverID, `${user.FirstName} ${user.LastName}`)}
                                                    >
                                                        <i className="fas fa-trash me-1"></i>
                                                        Remove
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
                                                        className="btn btn-sm btn-outline-danger"
                                                        onClick={() => handleRemoveSponsor(user.SponsorUserID, `${user.FirstName} ${user.LastName}`)}
                                                    >
                                                        <i className="fas fa-trash me-1"></i>
                                                        Remove
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
                                                        className="btn btn-sm btn-outline-danger"
                                                        onClick={() => handleRemoveAdmin(user.AdminID, `${user.FirstName} ${user.LastName}`)}
                                                    >
                                                        <i className="fas fa-trash me-1"></i>
                                                        Remove
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

            </div>
        </div>
    );
}