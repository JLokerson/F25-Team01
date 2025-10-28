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
            const response = await fetch(`http://localhost:4000/driverAPI/getAllDrivers`);
            if (response.ok) {
                const allDrivers = await response.json();
                const sponsorDrivers = allDrivers.filter(driver => driver.SponsorID === sponsorID);
                setDrivers(sponsorDrivers);
            }
        } catch (error) {
            console.error('Error fetching drivers:', error);
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

    // Filter drivers based on search query
    const filteredDrivers = drivers.filter(driver => {
        const query = search.toLowerCase();
        return (
            driver.FirstName.toLowerCase().includes(query) ||
            driver.LastName.toLowerCase().includes(query) ||
            driver.Email.toLowerCase().includes(query) ||
            String(driver.DriverID).includes(query) ||
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
                    <h2>Driver Management</h2>
                    <button 
                        className="btn btn-primary"
                        onClick={() => setShowAddModal(true)}
                    >
                        <i className="fas fa-plus me-2"></i>
                        Add New Driver
                    </button>
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
                                    <th>Driver ID</th>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>User ID</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredDrivers.map((driver) => (
                                    <tr key={driver.DriverID} className={driver.ActiveAccount === 0 ? 'table-secondary' : ''}>
                                        <td>{driver.DriverID}</td>
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
                                            <button 
                                                className={`btn btn-sm ${driver.ActiveAccount === 1 ? 'btn-outline-warning' : 'btn-outline-success'}`}
                                                onClick={() => handleRemoveDriver(driver.DriverID, `${driver.FirstName} ${driver.LastName}`, driver.ActiveAccount === 1)}
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
            </div>
        </div>
    );
}
