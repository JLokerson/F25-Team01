import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import AdminNavbar from './AdminNavbar';
import { HashPassword, GenerateSalt } from './MiscellaneousParts/HashPass';
import { addDriver, getAllSponsorUsers, getAllSponsors, getAllApplications, updateApplicationStatus } from './MiscellaneousParts/ServerCall';

export default function AdminApplications() {
    // Extended dummy data for applications from all sponsors - updated to match real database sponsors
    const [applications, setApplications] = useState([
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
        },
        {
            id: 2,
            firstName: 'Jane',
            lastName: 'Smith',
            email: 'jsmith@email.com',
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
            firstName: 'Mike',
            lastName: 'Johnson',
            email: 'mjohnson@email.com',
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
            firstName: 'Sarah',
            lastName: 'Williams',
            email: 'swilliams@email.com',
            phone: '(555) 444-7890',
            dateOfBirth: '1992-07-25',
            licenseNumber: 'DL444789012',
            address: '321 Elm St, City, State 54321',
            requestedOrganization: 'RandTruckCompany',
            sponsorId: 5,
            applicationDate: '2024-01-22',
            status: 'approved',
            tempPassword: 'passwordabc',
            approvedBy: 'Admin John Smith',
            approvedDate: '2024-01-23'
        },
        {
            id: 5,
            firstName: 'David',
            lastName: 'Brown',
            email: 'dbrown@email.com',
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
            denialReason: 'Invalid license number provided'
        },
        {
            id: 6,
            firstName: 'Emily',
            lastName: 'Davis',
            email: 'edavis@email.com',
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
    const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'pending', 'approved', 'denied'
    const [filterOrganization, setFilterOrganization] = useState('all');
    const [sponsors, setSponsors] = useState([]);

    // Load data on component mount
    useEffect(() => {
        const loadData = async () => {
            try {
                // Load sponsors
                const sponsorResponse = await getAllSponsors();
                if (sponsorResponse.ok) {
                    const sponsorData = await sponsorResponse.json();
                    setSponsors(sponsorData);
                }

                // Load applications - try API first, fallback to dummy data
                try {
                    const applicationsResponse = await getAllApplications();
                    if (applicationsResponse.ok) {
                        const applicationsData = await applicationsResponse.json();
                        setApplications(applicationsData);
                    }
                } catch (appError) {
                    console.log('Using dummy data for applications:', appError);
                    // Keep the existing dummy data if API fails
                }
            } catch (error) {
                console.error('Error loading data:', error);
            }
        };
        loadData();
    }, []);

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
            try {
                // Generate password salt and hash the temporary password
                const salt = GenerateSalt();
                const hashedPassword = await HashPassword(selectedApplication.tempPassword + salt);
                
                console.log(`Admin approving application for ${selectedApplication.firstName} ${selectedApplication.lastName}`);
                console.log('Organization:', selectedApplication.requestedOrganization);
                
                // Create driver data
                const driverData = {
                    FirstName: selectedApplication.firstName,
                    LastName: selectedApplication.lastName,
                    Email: selectedApplication.email,
                    Password: hashedPassword,
                    PasswordSalt: salt,
                    SponsorID: selectedApplication.sponsorId,
                    UserType: 1 // Driver type
                };

                console.log('Creating driver with data:', driverData);

                // Create the driver account
                const response = await addDriver(driverData);

                console.log('Response status:', response.status);
                
                if (!response.ok) {
                    const responseText = await response.text();
                    console.log('Error response:', responseText);
                    throw new Error(`Failed to create driver: ${response.status} - ${responseText}`);
                }

                const responseText = await response.text();
                console.log('Success response:', responseText);
                
                // Update application status in database
                try {
                    const statusUpdateData = {
                        applicationId: selectedApplication.id,
                        status: 'approved',
                        processedBy: adminName
                    };
                    await updateApplicationStatus(statusUpdateData);
                } catch (statusError) {
                    console.warn('Could not update application status in database:', statusError);
                }

                // Update application status in local state
                setApplications(prev => prev.map(app => 
                    app.id === selectedApplication.id 
                        ? { 
                            ...app, 
                            status: 'approved', 
                            approvedBy: adminName,
                            approvedDate: new Date().toISOString().split('T')[0]
                        }
                        : app
                ));
                
                alert(`Driver created successfully! Temporary password: ${selectedApplication.tempPassword}`);
                
            } catch (error) {
                console.error('Error creating driver:', error);
                alert(`Failed to approve application: ${error.message}`);
                return;
            }
        } else if (actionType === 'deny') {
            if (!denialReason.trim()) {
                alert('Please provide a reason for denial.');
                return;
            }
            
            console.log(`Admin denying application for ${selectedApplication.firstName} ${selectedApplication.lastName}`);
            console.log('Denial reason:', denialReason);
            
            // Update application status in database
            try {
                const statusUpdateData = {
                    applicationId: selectedApplication.id,
                    status: 'denied',
                    processedBy: adminName,
                    denialReason: denialReason
                };
                await updateApplicationStatus(statusUpdateData);
            } catch (statusError) {
                console.warn('Could not update application status in database:', statusError);
            }
            
            // Update application status in local state
            setApplications(prev => prev.map(app => 
                app.id === selectedApplication.id 
                    ? { 
                        ...app, 
                        status: 'denied', 
                        denialReason,
                        deniedBy: adminName,
                        deniedDate: new Date().toISOString().split('T')[0]
                    }
                    : app
            ));
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
                        
                        {/* Statistics Cards */}
                        <div className="row mb-4">
                            <div className="col-md-3">
                                <div className="card text-center">
                                    <div className="card-body">
                                        <h5 className="card-title text-primary">{statusStats.total}</h5>
                                        <p className="card-text">Total Applications</p>
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-3">
                                <div className="card text-center">
                                    <div className="card-body">
                                        <h5 className="card-title text-warning">{statusStats.pending}</h5>
                                        <p className="card-text">Pending Review</p>
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-3">
                                <div className="card text-center">
                                    <div className="card-body">
                                        <h5 className="card-title text-success">{statusStats.approved}</h5>
                                        <p className="card-text">Approved</p>
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-3">
                                <div className="card text-center">
                                    <div className="card-body">
                                        <h5 className="card-title text-danger">{statusStats.denied}</h5>
                                        <p className="card-text">Denied</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="row mb-4">
                    <div className="col-md-6">
                        <label className="form-label">Filter by Status:</label>
                        <select 
                            className="form-select" 
                            value={filterStatus} 
                            onChange={(e) => setFilterStatus(e.target.value)}
                        >
                            <option value="all">All Statuses</option>
                            <option value="pending">Pending</option>
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
                                No applications match the current filters.
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
                                                <li><strong>Temporary Password:</strong> {selectedApplication.tempPassword}</li>
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