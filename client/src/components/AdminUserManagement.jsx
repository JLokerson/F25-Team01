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
    const [editingDriver, setEditingDriver] = useState(null);
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
        const combinedUsers = [
            ...drivers.map(driver => ({
                ...driver,
                userType: 'Driver',
                displayId: driver.DriverID,
                sponsorName: getSponsorName(driver.SponsorID)
            })),
            ...sponsors.map(sponsor => ({
                ...sponsor,
                userType: 'Sponsor',
                displayId: sponsor.SponsorID,
                sponsorName: 'N/A'
            })),
            ...admins.map(admin => ({
                ...admin,
                userType: 'Admin',
                displayId: admin.AdminID,
                sponsorName: 'N/A'
            }))
        ];
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
                SponsorID: editingDriver.SponsorID
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
                fetchAllDrivers();
            } else {
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

    useEffect(() => {
        const fetchData = async () => {
            await Promise.all([fetchAllDrivers(), fetchAllSponsors(), fetchAllAdmins()]);
            setLoading(false);
        };
        fetchData();
    }, []);

    useEffect(() => {
        if (drivers.length > 0 || sponsors.length > 0 || admins.length > 0) {
            combineAllUsers();
        }
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
                    <button 
                        className="btn btn-primary"
                        onClick={() => setShowAddModal(true)}
                    >
                        <i className="fas fa-plus me-2"></i>
                        Add New Driver
                    </button>
                </div>

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
                                    <strong>Total Users:</strong> {allUsers.length}
                                </p>
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
                                    <tr key={`${user.userType}-${user.UserID}`}>
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
                                            {(user.userType === 'Sponsor' || user.userType === 'Admin') && (
                                                <span className="text-muted">
                                                    <i className="fas fa-lock me-1"></i>
                                                    Protected
                                                </span>
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
            </div>
        </div>
    );
}