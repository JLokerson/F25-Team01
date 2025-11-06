import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import AdminNavbar from './AdminNavbar';

export default function AdminApplications() {
    // Extended dummy data for applications from all sponsors - updated to match real database sponsors
    const [applications, setApplications] = useState([
        {
            id: 1,
            firstName: 'David',
            lastName: 'Johnson',
            email: 'davidjohnson@email.com',
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
        // {
        //     id: 2,
        //     firstName: 'Sarah',
        //     lastName: 'Williams',
        //     email: 'sarahwilliams@email.com',
        //     phone: '(555) 987-6543',
        //     dateOfBirth: '1988-09-22',
        //     licenseNumber: 'DL987654321',
        //     address: '456 Oak Ave, City, State 54321',
        //     requestedOrganization: 'CoolTruckCompany',
        //     sponsorId: 3,
        //     applicationDate: '2024-01-18',
        //     status: 'pending',
        //     tempPassword: 'password456'
        // },
        {
            id: 3,
            firstName: 'James',
            lastName: 'Anderson',
            email: 'jamesanderson@email.com',
            phone: '(555) 555-1234',
            dateOfBirth: '1985-03-10',
            licenseNumber: 'DL555123456',
            address: '789 Pine Rd, City, State 67890',
            requestedOrganization: 'CoolTruckCompany',
            sponsorId: 3,
            applicationDate: '2024-01-20',
            status: 'pending',
            tempPassword: 'password789'
        },
        {
            id: 4,
            firstName: 'Maria',
            lastName: 'Rodriguez',
            email: 'mariarodriguez@email.com',
            phone: '(555) 444-7890',
            dateOfBirth: '1992-07-25',
            licenseNumber: 'DL444789012',
            address: '321 Elm St, City, State 54321',
            requestedOrganization: 'RandTruckCompany',
            sponsorId: 5,
            applicationDate: '2024-01-22',
            status: 'approved',
            tempPassword: 'passwordabc',
            approvedBy: 'Sponsor User',
            approvedDate: '2024-01-23',
            processedByType: 'sponsor'
        },
        {
            id: 5,
            firstName: 'Michael',
            lastName: 'Brown',
            email: 'michaelbrown@email.com',
            phone: '(555) 333-2468',
            dateOfBirth: '1987-11-05',
            licenseNumber: 'DL333246810',
            address: '654 Maple Ave, City, State 13579',
            requestedOrganization: 'CoolTruckCompany',
            sponsorId: 3,
            applicationDate: '2024-01-19',
            status: 'denied',
            tempPassword: 'passworddef',
            deniedBy: 'Admin Jane Doe',
            deniedDate: '2024-01-21',
            denialReason: 'Invalid license number provided',
            processedByType: 'admin'
        },
        {
            id: 6,
            firstName: 'Lisa',
            lastName: 'Garcia',
            email: 'lisagarcia@email.com',
            phone: '(555) 777-9999',
            dateOfBirth: '1991-12-08',
            licenseNumber: 'DL777999123',
            address: '987 Cedar Blvd, City, State 98765',
            requestedOrganization: 'AwesomeTruckCompany',
            sponsorId: 4,
            applicationDate: '2024-01-25',
            status: 'pending',
            tempPassword: 'password999'
        }
    ]);

    const [selectedApplication, setSelectedApplication] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [denialReason, setDenialReason] = useState('');
    const [actionType, setActionType] = useState(''); // 'approve' or 'deny'
    const [filterStatus, setFilterStatus] = useState('pending'); // 'all', 'pending', 'approved', 'denied'
    const [filterOrganization, setFilterOrganization] = useState('all');
    // Remove unused sponsors state variable
    // const [sponsors, setSponsors] = useState([]);

    // Load data on component mount
    useEffect(() => {
        const loadData = async () => {
            try {
                // Load sponsors - remove this since we're not using it
                // const sponsorResponse = await getAllSponsors();
                // if (sponsorResponse.ok) {
                //     const sponsorData = await sponsorResponse.json();
                //     setSponsors(sponsorData);
                // }

                // Since application API endpoints don't exist, always use fallback data
                console.log('Using shared fallback application data - API endpoints not available');
                setApplications(getSharedFallbackApplications());
            } catch (error) {
                console.error('Error loading data:', error);
                setApplications(getSharedFallbackApplications());
            }
        };
        loadData();

        // Remove polling since API endpoints don't exist
        console.log('Application polling disabled - API endpoints not available');
    }, []);

    // Shared fallback data - this should match the data in PendingApplications
    const getSharedFallbackApplications = () => [
        {
            id: 1,
            firstName: 'David',
            lastName: 'Johnson',
            email: 'davidjohnson@email.com',
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
            firstName: 'Sarah',
            lastName: 'Williams',
            email: 'sarahwilliams@email.com',
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
            firstName: 'James',
            lastName: 'Anderson',
            email: 'jamesanderson@email.com',
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
            firstName: 'Maria',
            lastName: 'Rodriguez',
            email: 'mariarodriguez@email.com',
            phone: '(555) 444-7890',
            dateOfBirth: '1992-07-25',
            licenseNumber: 'DL444789012',
            address: '321 Elm St, City, State 54321',
            requestedOrganization: 'RandTruckCompany',
            sponsorId: 5,
            applicationDate: '2024-01-22',
            status: 'approved',
            tempPassword: 'passwordabc',
            approvedBy: 'Sponsor User',
            approvedDate: '2024-01-23',
            processedByType: 'sponsor'
        },
        {
            id: 5,
            firstName: 'Michael',
            lastName: 'Brown',
            email: 'michaelbrown@email.com',
            phone: '(555) 333-2468',
            dateOfBirth: '1987-11-05',
            licenseNumber: 'DL333246810',
            address: '654 Maple Ave, City, State 13579',
            requestedOrganization: 'CoolTruckCompany',
            sponsorId: 3,
            applicationDate: '2024-01-19',
            status: 'denied',
            tempPassword: 'passworddef',
            deniedBy: 'Admin Jane Doe',
            deniedDate: '2024-01-21',
            denialReason: 'Invalid license number provided',
            processedByType: 'admin'
        },
        {
            id: 6,
            firstName: 'Lisa',
            lastName: 'Garcia',
            email: 'lisagarcia@email.com',
            phone: '(555) 777-9999',
            dateOfBirth: '1991-12-08',
            licenseNumber: 'DL777999123',
            address: '987 Cedar Blvd, City, State 98765',
            requestedOrganization: 'AwesomeTruckCompany',
            sponsorId: 4,
            applicationDate: '2024-01-25',
            status: 'pending',
            tempPassword: 'password999'
        }
    ];

    const handleViewApplication = (application) => {
        setSelectedApplication(application);
        setActionType('');
        setDenialReason('');
        setShowModal(true);
    };

    const handleApprove = () => {
        setActionType('approve');
    };

    const handleDeny = () => {
        setActionType('deny');
    };

    const handleConfirmAction = async () => {
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        const adminName = `${currentUser.FirstName || 'Admin'} ${currentUser.LastName || 'User'}`;
        
        if (actionType === 'approve') {
            console.log(`Admin approving application for ${selectedApplication.firstName} ${selectedApplication.lastName}`);
            console.log('Organization:', selectedApplication.requestedOrganization);
            
            // Use simple hardcoded password and salt
            const password = "password";
            const salt = "salt";
            
            // Create driver data - this will create both USER and DRIVER table records
            const driverData = {
                FirstName: selectedApplication.firstName,
                LastName: selectedApplication.lastName,
                Email: selectedApplication.email,
                Password: password,
                PasswordSalt: salt,
                SponsorID: selectedApplication.sponsorId,
                UserType: 1 // Driver type
            };

            console.log('Creating driver with USER and DRIVER table records:', driverData);
            console.log('Expected DRIVER table entry: { DriverID: auto-generated, SponsorID:', selectedApplication.sponsorId, ', UserID: auto-generated, Points: 0 }');

            try {
                // Use the addDriver endpoint - this should create:
                // 1. A record in the USER table 
                // 2. A record in the DRIVER table with (DriverID, SponsorID, UserID, Points=0)
                const queryString = new URLSearchParams(driverData).toString();
                const response = await fetch(`http://localhost:4000/driverAPI/addDriver?${queryString}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                });

                console.log('Response status:', response.status);
                
                if (response.ok) {
                    const responseText = await response.text();
                    console.log('Driver creation response:', responseText);
                    
                    // Try to parse the response to get more details
                    let responseData = null;
                    try {
                        responseData = JSON.parse(responseText);
                    } catch (parseError) {
                        console.log('Response is not JSON, treating as plain text');
                    }
                    
                    // Update application status in local state
                    setApplications(prev => prev.map(app => 
                        app.id === selectedApplication.id 
                            ? { 
                                ...app, 
                                status: 'approved', 
                                approvedBy: adminName,
                                approvedDate: new Date().toISOString().split('T')[0],
                                processedByType: 'admin'
                            }
                            : app
                    ));
                    
                    // Check if this was a partial success (user created but DRIVER table failed)
                    if (responseData && responseData.requiresDriverFix) {
                        alert(`Driver User Account Created Successfully!\n\nUser Account:\n- Email: ${selectedApplication.email}\n- Password: password\n- UserID: ${responseData.userID}\n\nNote: DRIVER table relationship needs to be created manually.\nPlease use the "Fix Missing Driver Records" button in User Management.\n\nThe user can log in but may have limited functionality until the DRIVER relationship is fixed.`);
                    } else if (responseData && responseData.driverID) {
                        // Full success with all IDs
                        alert(`Driver created successfully!\n\nUser Account:\n- Email: ${selectedApplication.email}\n- Password: password\n- UserID: ${responseData.userID}\n\nDRIVER Table Record:\n- DriverID: ${responseData.driverID}\n- SponsorID: ${selectedApplication.sponsorId}\n- Points: 0 (initial)\n\nThe driver can now log in to access their account.`);
                    } else {
                        // Fallback success message
                        alert(`Driver created successfully!\n\nUser Account Created:\n- Email: ${selectedApplication.email}\n- Password: password\n\nDRIVER Table Record:\n- SponsorID: ${selectedApplication.sponsorId}\n- Points: 0 (initial)\n\nThe driver can now log in to access their account.`);
                    }
                } else {
                    const errorText = await response.text();
                    console.error('Error creating driver:', errorText);
                    alert(`Error creating driver: ${errorText}\n\nPlease check the server logs and try again.`);
                    return;
                }
            } catch (error) {
                console.error('Network error creating driver:', error);
                alert(`Error creating driver: ${error.message}`);
                return;
            }
            
        } else if (actionType === 'deny') {
            if (!denialReason.trim()) {
                alert('Please provide a reason for denial.');
                return;
            }
            
            console.log(`Admin denying application for ${selectedApplication.firstName} ${selectedApplication.lastName}`);
            console.log('Denial reason:', denialReason);
            
            // Since application status API doesn't exist, just log what would be updated
            console.log('Would update application status:', {
                applicationId: selectedApplication.id,
                status: 'denied',
                processedBy: adminName,
                processedByType: 'admin',
                denialReason: denialReason
            });
            
            // Update application status in local state - keep for admin view but mark as processed
            setApplications(prev => prev.map(app => 
                app.id === selectedApplication.id 
                    ? { 
                        ...app, 
                        status: 'denied', 
                        denialReason,
                        deniedBy: adminName,
                        deniedDate: new Date().toISOString().split('T')[0],
                        processedByType: 'admin'
                    }
                    : app
            ));
            
            alert('Application denied successfully.');
        }
        
        setShowModal(false);
        setSelectedApplication(null);
        setDenialReason('');
        setActionType('');
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedApplication(null);
        setDenialReason('');
        setActionType('');
    };

    // Filter applications based on status and organization
    const filteredApplications = applications.filter(app => {
        const statusMatch = filterStatus === 'all' || app.status === filterStatus;
        const orgMatch = filterOrganization === 'all' || app.requestedOrganization === filterOrganization;
        return statusMatch && orgMatch;
    });

    // Get unique organizations for filter dropdown
    const uniqueOrganizations = [...new Set(applications.map(app => app.requestedOrganization))];

    // Get status statistics
    const statusStats = {
        total: applications.length,
        pending: applications.filter(app => app.status === 'pending').length,
        approved: applications.filter(app => app.status === 'approved').length,
        denied: applications.filter(app => app.status === 'denied').length
    };

    const getStatusBadge = (status) => {
        switch(status) {
            case 'pending':
                return <span className="badge bg-warning text-dark">Pending</span>;
            case 'approved':
                return <span className="badge bg-success">Approved</span>;
            case 'denied':
                return <span className="badge bg-danger">Denied</span>;
            default:
                return <span className="badge bg-secondary">Unknown</span>;
        }
    };

    return (
        <>
            <AdminNavbar />
            <div className="container-fluid mt-4">
                {/* Header and Statistics */}
                <div className="row mb-4">
                    <div className="col-12">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <h2 className="mb-0">
                                <i className="fas fa-file-alt me-2"></i>
                                Driver Applications Management
                            </h2>
                            <div className="text-muted">
                                <small>System-wide application review</small>
                            </div>
                        </div>
                        
                        {/* Enhanced Statistics Cards with sync info */}
                        <div className="row mb-4">
                            <div className="col-md-3">
                                <div className="card text-center">
                                    <div className="card-body">
                                        <h5 className="card-title text-primary">{statusStats.total}</h5>
                                        <p className="card-text">Total Applications</p>
                                        <small className="text-muted">System-wide</small>
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-3">
                                <div className="card text-center">
                                    <div className="card-body">
                                        <h5 className="card-title text-warning">{statusStats.pending}</h5>
                                        <p className="card-text">Pending Review</p>
                                        <small className="text-muted">Admin + Sponsor</small>
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-3">
                                <div className="card text-center">
                                    <div className="card-body">
                                        <h5 className="card-title text-success">{statusStats.approved}</h5>
                                        <p className="card-text">Approved</p>
                                        <small className="text-muted">
                                            {applications.filter(app => app.status === 'approved' && app.processedByType === 'admin').length} by Admin, {' '}
                                            {applications.filter(app => app.status === 'approved' && app.processedByType === 'sponsor').length} by Sponsor
                                        </small>
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-3">
                                <div className="card text-center">
                                    <div className="card-body">
                                        <h5 className="card-title text-danger">{statusStats.denied}</h5>
                                        <p className="card-text">Denied</p>
                                        <small className="text-muted">
                                            {applications.filter(app => app.status === 'denied' && app.processedByType === 'admin').length} by Admin, {' '}
                                            {applications.filter(app => app.status === 'denied' && app.processedByType === 'sponsor').length} by Sponsor
                                        </small>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Enhanced Filters */}
                <div className="row mb-4">
                    <div className="col-md-6">
                        <label className="form-label">Filter by Status:</label>
                        <select 
                            className="form-select" 
                            value={filterStatus} 
                            onChange={(e) => setFilterStatus(e.target.value)}
                        >
                            <option value="pending">Pending Only (Default)</option>
                            <option value="all">All Statuses</option>
                            <option value="approved">Approved</option>
                            <option value="denied">Denied</option>
                        </select>
                    </div>
                    <div className="col-md-6">
                        <label className="form-label">Filter by Organization:</label>
                        <select 
                            className="form-select" 
                            value={filterOrganization} 
                            onChange={(e) => setFilterOrganization(e.target.value)}
                        >
                            <option value="all">All Organizations</option>
                            {uniqueOrganizations.map(org => (
                                <option key={org} value={org}>{org}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Applications Table */}
                <div className="row">
                    <div className="col-12">
                        {filteredApplications.length === 0 ? (
                            <div className="alert alert-info">
                                <i className="fas fa-info-circle me-2"></i>
                                {filterStatus === 'pending' 
                                    ? "No pending applications match the current filters."
                                    : "No applications match the current filters."
                                }
                                {filterStatus === 'pending' && (
                                    <div className="mt-2">
                                        <small>
                                            To view processed applications, change the status filter above.
                                        </small>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="table-responsive">
                                <table className="table table-striped table-hover">
                                    <thead className="table-dark">
                                        <tr>
                                            <th>Name</th>
                                            <th>Email</th>
                                            <th>Phone</th>
                                            <th>Organization</th>
                                            <th>Application Date</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredApplications.map(application => (
                                            <tr key={application.id}>
                                                <td>{application.firstName} {application.lastName}</td>
                                                <td>{application.email}</td>
                                                <td>{application.phone}</td>
                                                <td>
                                                    <span className="badge bg-light text-dark">
                                                        {application.requestedOrganization}
                                                    </span>
                                                </td>
                                                <td>{new Date(application.applicationDate).toLocaleDateString()}</td>
                                                <td>{getStatusBadge(application.status)}</td>
                                                <td>
                                                    <button 
                                                        className="btn btn-primary btn-sm"
                                                        onClick={() => handleViewApplication(application)}
                                                    >
                                                        <i className="fas fa-eye me-1"></i>
                                                        Review
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Application Review Modal */}
            {showModal && selectedApplication && (
                <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-lg">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">
                                    <i className="fas fa-user-check me-2"></i>
                                    Review Application - {selectedApplication.firstName} {selectedApplication.lastName}
                                </h5>
                                <button type="button" className="btn-close" onClick={handleCloseModal}></button>
                            </div>
                            <div className="modal-body">
                                <div className="row">
                                    <div className="col-md-6">
                                        <h6><i className="fas fa-user me-2"></i>Personal Information</h6>
                                        <p><strong>Name:</strong> {selectedApplication.firstName} {selectedApplication.lastName}</p>
                                        <p><strong>Email:</strong> {selectedApplication.email}</p>
                                        <p><strong>Phone:</strong> {selectedApplication.phone}</p>
                                        <p><strong>Date of Birth:</strong> {new Date(selectedApplication.dateOfBirth).toLocaleDateString()}</p>
                                        <p><strong>Address:</strong> {selectedApplication.address}</p>
                                    </div>
                                    <div className="col-md-6">
                                        <h6><i className="fas fa-id-card me-2"></i>Driver & Application Information</h6>
                                        <p><strong>License Number:</strong> {selectedApplication.licenseNumber}</p>
                                        <p><strong>Requested Organization:</strong> 
                                            <span className="badge bg-info ms-2">{selectedApplication.requestedOrganization}</span>
                                        </p>
                                        <p><strong>Application Date:</strong> {new Date(selectedApplication.applicationDate).toLocaleDateString()}</p>
                                        <p><strong>Current Status:</strong> {getStatusBadge(selectedApplication.status)}</p>
                                        
                                        {/* Show additional info for processed applications */}
                                        {selectedApplication.status === 'approved' && (
                                            <div className="mt-2 p-2 bg-success bg-opacity-10 rounded">
                                                <small>
                                                    <strong>Approved by:</strong> {selectedApplication.approvedBy}<br/>
                                                    <strong>Approved on:</strong> {new Date(selectedApplication.approvedDate).toLocaleDateString()}
                                                </small>
                                            </div>
                                        )}
                                        
                                        {selectedApplication.status === 'denied' && (
                                            <div className="mt-2 p-2 bg-danger bg-opacity-10 rounded">
                                                <small>
                                                    <strong>Denied by:</strong> {selectedApplication.deniedBy}<br/>
                                                    <strong>Denied on:</strong> {new Date(selectedApplication.deniedDate).toLocaleDateString()}<br/>
                                                    <strong>Reason:</strong> {selectedApplication.denialReason}
                                                </small>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {actionType === 'approve' && (
                                    <div className="mt-3">
                                        <div className="alert alert-info">
                                            <h6><i className="fas fa-info-circle me-2"></i>Approval Information</h6>
                                            <p className="mb-1">A new user account will be created with the following details:</p>
                                            <ul className="mb-0">
                                                <li><strong>User Type:</strong> Driver (Type 1)</li>
                                                <li><strong>Organization:</strong> {selectedApplication.requestedOrganization}</li>
                                                <li><strong>Sponsor ID:</strong> {selectedApplication.sponsorId}</li>
                                                <li><strong>Temporary Password:</strong> password</li>
                                                <li><strong>Action By:</strong> Admin (System-wide approval)</li>
                                            </ul>
                                            <small className="text-muted">The user should change their password after first login.</small>
                                        </div>
                                    </div>
                                )}

                                {actionType === 'deny' && (
                                    <div className="mt-3">
                                        <label htmlFor="denialReason" className="form-label">
                                            <strong><i className="fas fa-comment-slash me-1"></i>Reason for Denial:</strong>
                                        </label>
                                        <textarea
                                            id="denialReason"
                                            className="form-control"
                                            rows="3"
                                            value={denialReason}
                                            onChange={(e) => setDenialReason(e.target.value)}
                                            placeholder="Please provide a detailed reason for denying this application..."
                                        />
                                    </div>
                                )}
                            </div>
                            <div className="modal-footer">
                                {!actionType ? (
                                    <>
                                        <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                                            <i className="fas fa-times me-1"></i>Close
                                        </button>
                                        {selectedApplication.status === 'pending' && (
                                            <>
                                                <button type="button" className="btn btn-danger" onClick={handleDeny}>
                                                    <i className="fas fa-times-circle me-1"></i>Deny Application
                                                </button>
                                                <button type="button" className="btn btn-success" onClick={handleApprove}>
                                                    <i className="fas fa-check-circle me-1"></i>Approve Application
                                                </button>
                                            </>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        <button type="button" className="btn btn-secondary" onClick={() => setActionType('')}>
                                            <i className="fas fa-arrow-left me-1"></i>Back
                                        </button>
                                        <button 
                                            type="button" 
                                            className={`btn ${actionType === 'approve' ? 'btn-success' : 'btn-danger'}`}
                                            onClick={handleConfirmAction}
                                        >
                                            <i className={`fas ${actionType === 'approve' ? 'fa-check' : 'fa-times'} me-1`}></i>
                                            Confirm {actionType === 'approve' ? 'Approval' : 'Denial'}
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}