import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import SponsorNavbar from './SponsorNavbar';

export default function DriverManagement() {
    const [drivers, setDrivers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [sponsorInfo, setSponsorInfo] = useState(null);
    const [editingDriver, setEditingDriver] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newDriverData, setNewDriverData] = useState({
        FirstName: '',
        LastName: '',
        Email: '',
        Password: '',
        PasswordSalt: 'default_salt'
    });

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
        console.log('DriverManagement - UserInfo:', userInfo);
        if (userInfo && userInfo.UserID) {
            try {
                const response = await fetch(`http://localhost:4000/sponsorAPI/getAllSponsorUsers`);
                console.log('DriverManagement - Sponsor users response status:', response.status);
                if (response.ok) {
                    const allSponsorUsers = await response.json();
                    console.log('DriverManagement - All sponsor users:', allSponsorUsers);
                    const currentSponsorInfo = allSponsorUsers.find(s => s.UserID === userInfo.UserID);
                    console.log('DriverManagement - Current sponsor info:', currentSponsorInfo);
                    setSponsorInfo(currentSponsorInfo);
                    return currentSponsorInfo;
                } else {
                    const errorText = await response.text();
                    console.error('DriverManagement - Sponsor API error:', errorText);
                    throw new Error(`Failed to fetch sponsor info: ${response.status}`);
                }
            } catch (error) {
                console.error('Error fetching sponsor info:', error);
                setError('Failed to fetch sponsor information: ' + error.message);
            }
        }
        return null;
    };

    const fetchDrivers = async (sponsorID) => {
        try {
            console.log('DriverManagement - Fetching drivers for sponsor:', sponsorID);
            const response = await fetch(`http://localhost:4000/driverAPI/getDriversBySponsor?SponsorID=${sponsorID}`);
            console.log('DriverManagement - Drivers response status:', response.status);
            
            if (response.ok) {
                const driversData = await response.json();
                console.log('DriverManagement - Drivers data:', driversData);
                setDrivers(Array.isArray(driversData) ? driversData : []);
            } else {
                const errorText = await response.text();
                console.error('DriverManagement - Drivers API error:', errorText);
                throw new Error(`Failed to fetch drivers: ${response.status} - ${errorText}`);
            }
        } catch (error) {
            console.error('Error fetching drivers:', error);
            setError('Failed to fetch drivers: ' + error.message);
            setDrivers([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const initializeData = async () => {
            setLoading(true);
            setError(null);
            
            const sponsorData = await fetchSponsorInfo();
            if (sponsorData && sponsorData.SponsorID) {
                await fetchDrivers(sponsorData.SponsorID);
            } else {
                setError('No sponsor information found for current user. Please ensure you are logged in as a sponsor user.');
                setLoading(false);
            }
        };

        initializeData();
    }, []);

    const handleAddDriver = async () => {
        if (!sponsorInfo || !newDriverData.FirstName || !newDriverData.LastName || !newDriverData.Email || !newDriverData.Password) {
            alert('Please fill in all required fields');
            return;
        }

        try {
            const driverData = {
                ...newDriverData,
                SponsorID: sponsorInfo.SponsorID,
                UserType: 1 // Driver user type
            };

            const queryString = Object.keys(driverData)
                .map(key => `${key}=${encodeURIComponent(driverData[key])}`)
                .join('&');

            const response = await fetch(`http://localhost:4000/driverAPI/addDriver?${queryString}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (response.ok) {
                setShowAddModal(false);
                setNewDriverData({
                    FirstName: '',
                    LastName: '',
                    Email: '',
                    Password: '',
                    PasswordSalt: 'default_salt'
                });
                await fetchDrivers(sponsorInfo.SponsorID);
                alert('Driver added successfully!');
            } else {
                const errorText = await response.text();
                throw new Error(`Failed to add driver: ${response.status} - ${errorText}`);
            }
        } catch (error) {
            console.error('Error adding driver:', error);
            alert('Failed to add driver: ' + error.message);
        }
    };

    const handleEditDriver = (driver) => {
        setEditingDriver({
            ...driver,
            originalData: { ...driver }
        });
    };

    const handleUpdateDriver = async () => {
        if (!editingDriver) return;

        try {
            const response = await fetch(`http://localhost:4000/driverAPI/updateDriverInfo`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    UserID: editingDriver.UserID,
                    FirstName: editingDriver.FirstName,
                    LastName: editingDriver.LastName,
                    Email: editingDriver.Email
                })
            });

            if (response.ok) {
                setEditingDriver(null);
                await fetchDrivers(sponsorInfo.SponsorID);
                alert('Driver updated successfully!');
            } else {
                const errorText = await response.text();
                throw new Error(`Failed to update driver: ${response.status} - ${errorText}`);
            }
        } catch (error) {
            console.error('Error updating driver:', error);
            alert('Failed to update driver: ' + error.message);
        }
    };

    const handleRemoveDriver = async (driverID, driverName) => {
        if (!window.confirm(`Are you sure you want to remove ${driverName} from the program? This action cannot be undone.`)) {
            return;
        }

        try {
            const response = await fetch(`http://localhost:4000/driverAPI/removeDriver?DriverID=${driverID}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                await fetchDrivers(sponsorInfo.SponsorID);
                alert('Driver removed successfully!');
            } else {
                const errorText = await response.text();
                throw new Error(`Failed to remove driver: ${response.status} - ${errorText}`);
            }
        } catch (error) {
            console.error('Error removing driver:', error);
            alert('Failed to remove driver: ' + error.message);
        }
    };

    if (loading) {
        return (
            <div>
                <SponsorNavbar />
                <div className="container mt-4">
                    <div className="text-center">
                        <div className="spinner-border" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                        <p className="mt-2">Loading driver information...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div>
                <SponsorNavbar />
                <div className="container mt-4">
                    <div className="alert alert-danger">
                        <h4>Error</h4>
                        <p>{error}</p>
                        <button 
                            className="btn btn-primary mt-2" 
                            onClick={() => window.location.reload()}
                        >
                            Retry
                        </button>
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

                {sponsorInfo && (
                    <div className="alert alert-info">
                        <p><strong>Managing drivers for Sponsor ID:</strong> {sponsorInfo.SponsorID}</p>
                    </div>
                )}

                {drivers.length === 0 ? (
                    <div className="alert alert-info">
                        <h4>No Drivers Found</h4>
                        <p>You don't have any drivers in your program yet. Click "Add New Driver" to get started.</p>
                    </div>
                ) : (
                    <div className="row">
                        {drivers.map((driver) => (
                            <div key={driver.DriverID} className="col-md-6 col-lg-4 mb-4">
                                <div className="card">
                                    <div className="card-header d-flex justify-content-between align-items-center">
                                        <h5 className="mb-0">Driver #{driver.DriverID}</h5>
                                        <div className="dropdown">
                                            <button className="btn btn-sm btn-outline-secondary dropdown-toggle" data-bs-toggle="dropdown">
                                                Actions
                                            </button>
                                            <ul className="dropdown-menu">
                                                <li>
                                                    <button 
                                                        className="dropdown-item"
                                                        onClick={() => handleEditDriver(driver)}
                                                    >
                                                        <i className="fas fa-edit me-2"></i>Edit
                                                    </button>
                                                </li>
                                                <li>
                                                    <button 
                                                        className="dropdown-item text-danger"
                                                        onClick={() => handleRemoveDriver(driver.DriverID, `${driver.FirstName} ${driver.LastName}`)}
                                                    >
                                                        <i className="fas fa-trash me-2"></i>Remove
                                                    </button>
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                    <div className="card-body">
                                        <p><strong>Name:</strong> {driver.FirstName} {driver.LastName}</p>
                                        <p><strong>Email:</strong> {driver.Email}</p>
                                        <p><strong>User ID:</strong> {driver.UserID}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Add Driver Modal */}
                {showAddModal && (
                    <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
                        <div className="modal-dialog">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 className="modal-title">Add New Driver</h5>
                                    <button 
                                        type="button" 
                                        className="btn-close"
                                        onClick={() => setShowAddModal(false)}
                                    ></button>
                                </div>
                                <div className="modal-body">
                                    <form>
                                        <div className="mb-3">
                                            <label className="form-label">First Name *</label>
                                            <input 
                                                type="text" 
                                                className="form-control"
                                                value={newDriverData.FirstName}
                                                onChange={(e) => setNewDriverData({...newDriverData, FirstName: e.target.value})}
                                            />
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">Last Name *</label>
                                            <input 
                                                type="text" 
                                                className="form-control"
                                                value={newDriverData.LastName}
                                                onChange={(e) => setNewDriverData({...newDriverData, LastName: e.target.value})}
                                            />
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">Email *</label>
                                            <input 
                                                type="email" 
                                                className="form-control"
                                                value={newDriverData.Email}
                                                onChange={(e) => setNewDriverData({...newDriverData, Email: e.target.value})}
                                            />
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">Password *</label>
                                            <input 
                                                type="password" 
                                                className="form-control"
                                                value={newDriverData.Password}
                                                onChange={(e) => setNewDriverData({...newDriverData, Password: e.target.value})}
                                            />
                                        </div>
                                    </form>
                                </div>
                                <div className="modal-footer">
                                    <button 
                                        type="button" 
                                        className="btn btn-secondary"
                                        onClick={() => setShowAddModal(false)}
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="button" 
                                        className="btn btn-primary"
                                        onClick={handleAddDriver}
                                    >
                                        Add Driver
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Edit Driver Modal */}
                {editingDriver && (
                    <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
                        <div className="modal-dialog">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 className="modal-title">Edit Driver Information</h5>
                                    <button 
                                        type="button" 
                                        className="btn-close"
                                        onClick={() => setEditingDriver(null)}
                                    ></button>
                                </div>
                                <div className="modal-body">
                                    <form>
                                        <div className="mb-3">
                                            <label className="form-label">First Name</label>
                                            <input 
                                                type="text" 
                                                className="form-control"
                                                value={editingDriver.FirstName}
                                                onChange={(e) => setEditingDriver({...editingDriver, FirstName: e.target.value})}
                                            />
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">Last Name</label>
                                            <input 
                                                type="text" 
                                                className="form-control"
                                                value={editingDriver.LastName}
                                                onChange={(e) => setEditingDriver({...editingDriver, LastName: e.target.value})}
                                            />
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">Email</label>
                                            <input 
                                                type="email" 
                                                className="form-control"
                                                value={editingDriver.Email}
                                                onChange={(e) => setEditingDriver({...editingDriver, Email: e.target.value})}
                                            />
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">Driver ID</label>
                                            <input 
                                                type="text" 
                                                className="form-control"
                                                value={editingDriver.DriverID}
                                                disabled
                                            />
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">User ID</label>
                                            <input 
                                                type="text" 
                                                className="form-control"
                                                value={editingDriver.UserID}
                                                disabled
                                            />
                                        </div>
                                    </form>
                                </div>
                                <div className="modal-footer">
                                    <button 
                                        type="button" 
                                        className="btn btn-secondary"
                                        onClick={() => setEditingDriver(null)}
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="button" 
                                        className="btn btn-primary"
                                        onClick={handleUpdateDriver}
                                    >
                                        Update Driver
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
