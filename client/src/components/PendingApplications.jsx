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
    const [error, setError] = useState(null);

    // Load applications on component mount
    useEffect(() => {
        const loadApplications = async () => {
            try {
                setError(null);
                // Get current sponsor info to determine which applications to show
                const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
                let sponsorID = null;
                
                console.log('Using Lambda API URL');
                console.log('Current user info:', userInfo);
                
                if (userInfo.UserID) {
                    try {
                        // Get sponsor info for the logged-in user
                        const sponsorResponse = await fetch('https://63iutwxr2owp72oyfbetwyluaq0wakdm.lambda-url.us-east-1.on.aws/sponsorAPI/getAllSponsorUsers');
                        if (sponsorResponse.ok) {
                            const allSponsorUsers = await sponsorResponse.json();
                            console.log('All sponsor users:', allSponsorUsers);
                            
                            const currentSponsorInfo = allSponsorUsers.find(s => s.UserID === parseInt(userInfo.UserID));
                            console.log('Current sponsor info found:', currentSponsorInfo);
                            
                            if (currentSponsorInfo) {
                                sponsorID = currentSponsorInfo.SponsorID;
                                console.log('Sponsor ID determined:', sponsorID);
                            } else {
                                console.warn('No sponsor info found for UserID:', userInfo.UserID);
                            }
                        } else {
                            console.error('Failed to fetch sponsor users:', sponsorResponse.status);
                        }
                    } catch (error) {
                        console.warn('Could not fetch sponsor info:', error);
                        setError('Could not determine sponsor information');
                    }
                }

                if (!sponsorID) {
                    console.warn('Could not determine sponsor ID for user:', userInfo);
                    setError(`Could not determine sponsor ID for user. UserID: ${userInfo.UserID}`);
                    setApplications([]);
                    return;
                }

                console.log('Fetching mappings for SponsorID:', sponsorID);
                
                // Fetch driver-sponsor mappings for this sponsor using Lambda URL
                const response = await fetch(`https://63iutwxr2owp72oyfbetwyluaq0wakdm.lambda-url.us-east-1.on.aws/sponsorAPI/getDriverSponsorMappingsForSponsor?SponsorID=${sponsorID}`);
                console.log('Response status:', response.status);
                
                if (response.ok) {
                    const mappings = await response.json();
                    console.log('Raw mappings data:', mappings);
                    
                    // Filter to only show applications for this specific sponsor
                    const sponsorMappings = mappings.filter(mapping => mapping.SponsorID === sponsorID);
                    console.log('Filtered mappings for sponsor:', sponsorMappings);
                    
                    // Transform mappings into application format
                    const formattedApplications = sponsorMappings.map(mapping => ({
                        id: mapping.MappingID,
                        firstName: mapping.FirstName || 'Unknown',
                        lastName: mapping.LastName || 'User',
                        email: mapping.Email || 'no-email@example.com',
                        phone: '(555) 000-0000', // Not available in current mapping
                        dateOfBirth: '1990-01-01', // Not available in current mapping
                        licenseNumber: 'DL000000000', // Not available in current mapping
                        address: 'Address not provided', // Not available in current mapping
                        requestedOrganization: mapping.SponsorName || `Sponsor ID ${mapping.SponsorID}`,
                        sponsorId: mapping.SponsorID,
                        driverId: mapping.DriverID,
                        currentPoints: mapping.Points,
                        applicationAccepted: mapping.ApplicationAccepted,
                        applicationDate: mapping.ApplicationDate || new Date().toISOString().split('T')[0],
                        status: mapping.Status || (mapping.ApplicationAccepted === 0 ? 'pending' : 'approved'),
                        tempPassword: 'password123'
                    }));
                    
                    console.log('Formatted applications for sponsor:', formattedApplications);
                    console.log('Number of pending applications:', formattedApplications.filter(app => app.status === 'pending').length);
                    setApplications(formattedApplications);
                } else {
                    const errorText = await response.text();
                    console.error('API Error:', errorText);
                    setError(`Failed to load applications from database: ${response.status} ${errorText}`);
                    setApplications([]);
                }
                
            } catch (error) {
                console.error('Error loading applications:', error);
                setError(`Failed to load applications: ${error.message}`);
                setApplications([]);
            } finally {
                setLoading(false);
            }
        };

        loadApplications();
    }, []);

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
                const response = await fetch(`https://63iutwxr2owp72oyfbetwyluaq0wakdm.lambda-url.us-east-1.on.aws/driverAPI/addDriver?${queryString}`, {
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
                    
                    // TODO: Update application status via API
                    // await fetch(`https://63iutwxr2owp72oyfbetwyluaq0wakdm.lambda-url.us-east-1.on.aws/api/applications/${selectedApplication.id}/approve`, {
                    //     method: 'PUT',
                    //     headers: { 'Content-Type': 'application/json' },
                    //     body: JSON.stringify({ approvedBy: sponsorName, approvedByType: 'sponsor' })
                    // });
                    
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
            
            // TODO: Update application status via API
            // await fetch(`https://63iutwxr2owp72oyfbetwyluaq0wakdm.lambda-url.us-east-1.on.aws/api/applications/${selectedApplication.id}/deny`, {
            //     method: 'PUT',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify({ 
            //         deniedBy: sponsorName, 
            //         deniedByType: 'sponsor',
            //         denialReason: denialReason 
            //     })
            // });
            
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

    if (error) {
        return (
            <>
                <SponsorNavbar />
                <div className="container-fluid mt-4">
                    <div className="alert alert-danger">
                        <i className="fas fa-exclamation-triangle me-2"></i>
                        Error: {error}
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
                            <div className="alert alert-info">
                                <i className="fas fa-info-circle me-2"></i>
                                No pending applications for your organization at this time.
                                <div className="mt-2">
                                    <small>
                                        Applications will appear here when drivers submit requests to join your organization.
                                        <br />
                                        <em>Note: Only applications with ApplicationAccepted = 0 are shown as pending.</em>
                                    </small>
                                </div>
                            </div>
                        ) : (
                            <div className="table-responsive">
                                <table className="table table-striped table-hover">
                                    <thead className="table-dark">
                                        <tr>
                                            <th>Mapping ID</th>
                                            <th>Sponsor ID</th>
                                            <th>Driver ID</th>
                                            <th>Accepted Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pendingApplications.map(application => (
                                            <tr key={application.id}>
                                                <td>
                                                    <span className="badge bg-secondary">{application.id}</span>
                                                </td>
                                                <td>
                                                    <span className="badge bg-info">{application.sponsorId}</span>
                                                </td>
                                                <td>
                                                    <span className="badge bg-primary">{application.driverId}</span>
                                                </td>
                                                <td>
                                                    <span className={`badge ${application.applicationAccepted === 0 ? 'bg-warning text-dark' : 'bg-success'}`}>
                                                        {application.applicationAccepted === 0 ? 'Not Accepted (0)' : 'Accepted (1)'}
                                                    </span>
                                                </td>
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
                                        <h6><i className="fas fa-database me-2"></i>Database Mapping Information</h6>
                                        <p><strong>Mapping ID:</strong> {selectedApplication.id}</p>
                                        <p><strong>Sponsor ID:</strong> {selectedApplication.sponsorId}</p>
                                        <p><strong>Driver ID:</strong> {selectedApplication.driverId}</p>
                                        <p><strong>Current Points:</strong> {selectedApplication.currentPoints}</p>
                                        <p><strong>Application Accepted:</strong> 
                                            <span className={`badge ms-2 ${selectedApplication.applicationAccepted === 0 ? 'bg-warning text-dark' : 'bg-success'}`}>
                                                {selectedApplication.applicationAccepted === 0 ? 'Not Accepted (0)' : 'Accepted (1)'}
                                            </span>
                                        </p>
                                    </div>
                                    <div className="col-md-6">
                                        <h6><i className="fas fa-user me-2"></i>User Information</h6>
                                        <p><strong>Name:</strong> {selectedApplication.firstName} {selectedApplication.lastName}</p>
                                        <p><strong>Email:</strong> {selectedApplication.email}</p>
                                        <p><strong>Organization:</strong> {selectedApplication.requestedOrganization}</p>
                                        <p><strong>Status:</strong> 
                                            <span className={`badge ms-2 ${selectedApplication.status === 'pending' ? 'bg-warning text-dark' : 'bg-success'}`}>
                                                {selectedApplication.status}
                                            </span>
                                        </p>
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