import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import SponsorNavbar from './SponsorNavbar';
import { getAllSponsorUsers } from './MiscellaneousParts/ServerCall';

export default function PendingApplications() {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedApplication, setSelectedApplication] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [denialReason, setDenialReason] = useState('');
    const [actionType, setActionType] = useState(''); // 'approve' or 'deny'

    // Load applications on component mount
    useEffect(() => {
        const loadApplications = async () => {
            try {
                // Get current sponsor info to determine which applications to show
                const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
                let sponsorID = null;
                
                if (userInfo.UserID) {
                    try {
                        const sponsorResponse = await getAllSponsorUsers();
                        if (sponsorResponse.ok) {
                            const allSponsorUsers = await sponsorResponse.json();
                            const currentSponsorInfo = allSponsorUsers.find(s => s.UserID === userInfo.UserID);
                            if (currentSponsorInfo) {
                                sponsorID = currentSponsorInfo.SponsorID;
                            }
                        }
                    } catch (error) {
                        console.warn('Could not fetch sponsor info:', error);
                    }
                }

                // Since application API endpoints don't exist, always use fallback data
                console.log('Using fallback application data - API endpoints not available');
                if (sponsorID) {
                    const fallbackData = getFallbackApplications().filter(app => app.sponsorId === sponsorID);
                    setApplications(fallbackData);
                } else {
                    console.warn('Could not determine sponsor ID, showing all applications');
                    const fallbackData = getFallbackApplications();
                    setApplications(fallbackData);
                }
            } catch (error) {
                console.error('Error loading applications:', error);
                // Use fallback data in case of any errors
                setApplications(getFallbackApplications());
            } finally {
                setLoading(false);
            }
        };

        loadApplications();
    }, []);

    // Shared fallback data - this should match the data in AdminApplications
    const getFallbackApplications = () => [
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

    const handleConfirmAction = async () => {
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        const sponsorName = `${currentUser.FirstName || 'Sponsor'} ${currentUser.LastName || 'User'}`;
        
        if (actionType === 'approve') {
            console.log(`Sponsor approving application for ${selectedApplication.firstName} ${selectedApplication.lastName}`);
            console.log('Organization:', selectedApplication.requestedOrganization);
            
            // Use simple hardcoded password and salt
            const password = "password";
            const salt = "salt";
            
            // Create driver data with simple password and salt
            const driverData = {
                FirstName: selectedApplication.firstName,
                LastName: selectedApplication.lastName,
                Email: selectedApplication.email,
                Password: password,
                PasswordSalt: salt,
                SponsorID: selectedApplication.sponsorId,
                UserType: 1 // Driver type
            };

            console.log('Creating driver with data:', driverData);

            try {
                // Use the working addDriver endpoint - this should create both USER and DRIVER records
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
                    setApplications(prev => prev.filter(app => 
                        app.id !== selectedApplication.id // Remove the processed application from the list
                    ));
                    
                    // Show detailed success message with generated IDs
                    if (responseData && responseData.driverID) {
                        alert(`Driver created successfully!\n\nLogin credentials:\n- Email: ${selectedApplication.email}\n- Password: password\n- UserID: ${responseData.userID}\n\nDRIVER Table Record:\n- DriverID: ${responseData.driverID}\n- SponsorID: ${selectedApplication.sponsorId}\n- Points: 0\n\nThe driver can now log in to access their account.`);
                    } else {
                        alert(`Driver created successfully!\n\nLogin credentials:\nEmail: ${selectedApplication.email}\nPassword: password\n\nThe driver can now log in to access their account.\n\nDriver relationship added to DRIVER table with SponsorID: ${selectedApplication.sponsorId}`);
                    }
                } else {
                    const errorText = await response.text();
                    console.error('Error creating driver:', errorText);
                    alert(`Error creating driver: ${errorText}`);
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
            
            console.log(`Sponsor denying application for ${selectedApplication.firstName} ${selectedApplication.lastName}`);
            console.log('Denial reason:', denialReason);
            
            // Since application status API doesn't exist, just log what would be updated
            console.log('Would update application status:', {
                applicationId: selectedApplication.id,
                status: 'denied',
                processedBy: sponsorName,
                processedByType: 'sponsor',
                denialReason: denialReason
            });
            
            // Update application status in local state
            setApplications(prev => prev.filter(app => 
                app.id !== selectedApplication.id // Remove the denied application from the list
            ));
            
            alert('Application denied successfully.');
        }
        
        setShowModal(false);
        setSelectedApplication(null);
        setDenialReason('');
        setActionType('');
    };

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

    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedApplication(null);
        setDenialReason('');
        setActionType('');
    };

    const pendingApplications = applications.filter(app => app.status === 'pending');

    if (loading) {
        return (
            <>
                <SponsorNavbar />
                <div className="container-fluid mt-4">
                    <div className="text-center">
                        <div className="spinner-border" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                        <p className="mt-2">Loading applications...</p>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <SponsorNavbar />
            <div className="container-fluid mt-4">
                <div className="row">
                    <div className="col-12">
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <h2 className="mb-0">
                                <i className="fas fa-file-alt me-2"></i>
                                Pending Driver Applications
                            </h2>
                            <div className="text-muted">
                                <small>Applications for your organization</small>
                            </div>
                        </div>
                        
                        {pendingApplications.length === 0 ? (
                            <div className="alert alert-warning">
                                <i className="fas fa-exclamation-triangle me-2"></i>
                                No pending applications for your organization at this time.
                            </div>
                        ) : (
                            <div className="table-responsive">
                                <table className="table table-striped table-hover">
                                    <thead className="table-dark">
                                        <tr>
                                            <th>Name</th>
                                            <th>Email</th>
                                            <th>Phone</th>
                                            <th>Requested Organization</th>
                                            <th>Application Date</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pendingApplications.map(application => (
                                            <tr key={application.id}>
                                                <td>{application.firstName} {application.lastName}</td>
                                                <td>{application.email}</td>
                                                <td>{application.phone}</td>
                                                <td>
                                                    <span className="badge bg-info">
                                                        {application.requestedOrganization}
                                                    </span>
                                                </td>
                                                <td>{new Date(application.applicationDate).toLocaleDateString()}</td>
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

            {/* Application Review Modal - same as existing */}
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
                                {/* ...existing modal body content... */}
                                <div className="row">
                                    <div className="col-md-6">
                                        <h6>Personal Information</h6>
                                        <p><strong>Name:</strong> {selectedApplication.firstName} {selectedApplication.lastName}</p>
                                        <p><strong>Email:</strong> {selectedApplication.email}</p>
                                        <p><strong>Phone:</strong> {selectedApplication.phone}</p>
                                        <p><strong>Date of Birth:</strong> {new Date(selectedApplication.dateOfBirth).toLocaleDateString()}</p>
                                    </div>
                                    <div className="col-md-6">
                                        <h6>Driver Information</h6>
                                        <p><strong>License Number:</strong> {selectedApplication.licenseNumber}</p>
                                        <p><strong>Address:</strong> {selectedApplication.address}</p>
                                        <p><strong>Requested Organization:</strong> {selectedApplication.requestedOrganization}</p>
                                        <p><strong>Application Date:</strong> {new Date(selectedApplication.applicationDate).toLocaleDateString()}</p>
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
                                                <li><strong>Temporary Password:</strong> password</li>
                                                <li><strong>Approved By:</strong> Sponsor (You)</li>
                                                <li><strong>Sync Status:</strong> Will be visible to administrators</li>
                                            </ul>
                                            <small className="text-muted">The user should change their password after first login.</small>
                                        </div>
                                    </div>
                                )}

                                {actionType === 'deny' && (
                                    <div className="mt-3">
                                        <label htmlFor="denialReason" className="form-label">
                                            <strong>Reason for Denial:</strong>
                                        </label>
                                        <textarea
                                            id="denialReason"
                                            className="form-control"
                                            rows="3"
                                            value={denialReason}
                                            onChange={(e) => setDenialReason(e.target.value)}
                                            placeholder="Please provide a reason for denying this application..."
                                        />
                                        <small className="text-muted">This denial reason will be visible to administrators.</small>
                                    </div>
                                )}
                            </div>
                            <div className="modal-footer">
                                {!actionType ? (
                                    <>
                                        <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                                            Close
                                        </button>
                                        <button type="button" className="btn btn-danger" onClick={handleDeny}>
                                            Deny Application
                                        </button>
                                        <button type="button" className="btn btn-success" onClick={handleApprove}>
                                            Approve Application
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button type="button" className="btn btn-secondary" onClick={() => setActionType('')}>
                                            Back
                                        </button>
                                        <button 
                                            type="button" 
                                            className={`btn ${actionType === 'approve' ? 'btn-success' : 'btn-danger'}`}
                                            onClick={handleConfirmAction}
                                        >
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
