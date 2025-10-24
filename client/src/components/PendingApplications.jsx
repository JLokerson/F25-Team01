import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import SponsorNavbar from './SponsorNavbar';
import { HashPassword, GenerateSalt } from './MiscellaneousParts/HashPass';

export default function PendingApplications() {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedApplication, setSelectedApplication] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [responseReason, setResponseReason] = useState('');
    const [actionType, setActionType] = useState(''); // 'approve' or 'deny'
    const [tempPassword, setTempPassword] = useState('');

    useEffect(() => {
        fetchPendingApplications();
    }, []);

    const fetchPendingApplications = async () => {
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            
            // Get current sponsor's SponsorID
            const sponsorResponse = await fetch(`http://localhost:4000/sponsorAPI/getAllSponsorUsers`);
            if (!sponsorResponse.ok) return;
            
            const allSponsorUsers = await sponsorResponse.json();
            const currentSponsorInfo = allSponsorUsers.find(s => s.UserID === user.UserID);
            if (!currentSponsorInfo) return;

            // Get applications from localStorage - include approved ones for removal option
            const allApplications = JSON.parse(localStorage.getItem('driverApplications') || '[]');
            const sponsorApplications = allApplications.filter(
                app => app.requestedSponsorID === currentSponsorInfo.SponsorID && 
                (app.status === 'pending' || app.status === 'approved') // Include approved for removal
            );
            
            setApplications(sponsorApplications);
        } catch (error) {
            console.error('Error fetching applications:', error);
        } finally {
            setLoading(false);
        }
    };

    const generateTempPassword = () => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
        let result = '';
        for (let i = 0; i < 8; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    };

    const handleViewApplication = (application) => {
        setSelectedApplication(application);
        setActionType('');
        setResponseReason('');
        setTempPassword(generateTempPassword());
        setShowModal(true);
    };

    const handleApprove = () => {
        setActionType('approve');
        setResponseReason(`Welcome to our driver network! You have been approved and can now access driver features.`);
    };

    const handleDeny = () => {
        setActionType('deny');
        setResponseReason('');
    };

    const handleConfirmAction = async () => {
        if (!responseReason.trim()) {
            alert('Please provide a response message.');
            return;
        }

        try {
            if (actionType === 'approve') {
                const updateData = {
                    UserID: selectedApplication.applicantUserID,
                    SponsorID: selectedApplication.requestedSponsorID
                };

                console.log('Updating user SponsorID:', updateData);

                // Try multiple approaches with retries to update the driver's sponsor
                let success = false;
                let lastError = null;

                // First, get the driver's current information
                try {
                    const driversResponse = await fetch(`http://localhost:4000/driverAPI/getAllDrivers`);
                    
                    if (driversResponse.ok) {
                        const allDrivers = await driversResponse.json();
                        const existingDriver = allDrivers.find(d => d.UserID === selectedApplication.applicantUserID);
                        
                        if (!existingDriver) {
                            throw new Error('User is not currently a driver. Cannot change sponsor assignment.');
                        }

                        console.log('Found existing driver record:', existingDriver);
                        
                        // Update the driver's sponsor assignment
                        for (let attempt = 1; attempt <= 3 && !success; attempt++) {
                            try {
                                console.log(`Attempt ${attempt}: Updating driver SponsorID...`);
                                
                                // Prepare complete update data with existing driver information
                                const driverUpdateData = {
                                    UserID: existingDriver.UserID,
                                    FirstName: existingDriver.FirstName,
                                    LastName: existingDriver.LastName,
                                    Email: existingDriver.Email,
                                    SponsorID: selectedApplication.requestedSponsorID // New sponsor
                                };
                                
                                const updateResponse = await fetch(`http://localhost:4000/driverAPI/updateDriver`, {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                    },
                                    body: JSON.stringify(driverUpdateData)
                                });

                                const responseText = await updateResponse.text();
                                console.log(`Attempt ${attempt} - Response status:`, updateResponse.status);
                                console.log(`Attempt ${attempt} - Response text:`, responseText);

                                if (updateResponse.ok) {
                                    console.log('✅ Driver sponsor updated successfully');
                                    success = true;
                                    break;
                                } else {
                                    lastError = new Error(`Update API returned ${updateResponse.status}: ${responseText}`);
                                }
                                
                                // Wait before retry
                                if (attempt < 3) {
                                    console.log(`Waiting 2 seconds before retry...`);
                                    await new Promise(resolve => setTimeout(resolve, 2000));
                                }
                            } catch (error) {
                                console.warn(`Attempt ${attempt} failed:`, error.message);
                                lastError = error;
                                
                                if (attempt < 3) {
                                    await new Promise(resolve => setTimeout(resolve, 2000));
                                }
                            }
                        }

                        // Verify the update was successful
                        if (success) {
                            try {
                                console.log('Verifying sponsor change...');
                                const verifyResponse = await fetch(`http://localhost:4000/driverAPI/getAllDrivers`);
                                
                                if (verifyResponse.ok) {
                                    const updatedDrivers = await verifyResponse.json();
                                    const updatedDriver = updatedDrivers.find(d => d.UserID === selectedApplication.applicantUserID);
                                    
                                    if (updatedDriver && updatedDriver.SponsorID == selectedApplication.requestedSponsorID) {
                                        console.log('✅ Sponsor change verified successfully');
                                    } else {
                                        console.warn('⚠️ Sponsor change verification failed, but API reported success');
                                    }
                                }
                            } catch (verifyError) {
                                console.warn('Could not verify sponsor change:', verifyError.message);
                            }
                        }
                        
                    } else {
                        throw new Error('Could not fetch current driver information');
                    }
                } catch (driverFetchError) {
                    console.error('Failed to fetch driver information:', driverFetchError.message);
                    lastError = driverFetchError;
                }

                // If all approaches failed, offer manual option
                if (!success) {
                    const continueAnyway = window.confirm(
                        `The system had trouble updating the driver's sponsor assignment.\n\n` +
                        `Error: ${lastError?.message || 'Unknown error'}\n\n` +
                        `This might be a temporary issue. You can:\n` +
                        `1. Try again in a moment\n` +
                        `2. Approve now and manually update the sponsor assignment\n` +
                        `3. Cancel and try later\n\n` +
                        `Would you like to approve the application anyway?\n` +
                        `(You may need to manually update the driver's sponsor)`
                    );
                    
                    if (!continueAnyway) {
                        return;
                    }
                    
                    console.log('⚠️ Proceeding with approval despite sponsor update issues');
                }
            }

            // Update application status in localStorage
            const allApplications = JSON.parse(localStorage.getItem('driverApplications') || '[]');
            const updatedApplications = allApplications.map(app => 
                app.ApplicationID === selectedApplication.ApplicationID 
                    ? { 
                        ...app, 
                        status: actionType === 'approve' ? 'approved' : 'denied',
                        responseReason: responseReason,
                        reviewedDate: new Date().toISOString()
                    }
                    : app
            );
            
            localStorage.setItem('driverApplications', JSON.stringify(updatedApplications));

            // Refresh applications list
            await fetchPendingApplications();
            
            alert(`Application ${actionType === 'approve' ? 'approved' : 'denied'} successfully!${actionType === 'approve' ? ' Driver has been reassigned to the new sponsor.' : ''}`);
            
        } catch (error) {
            console.error('Error processing application:', error);
            alert(`Failed to ${actionType} application: ${error.message}`);
            return;
        }
        
        setShowModal(false);
        setSelectedApplication(null);
        setResponseReason('');
        setActionType('');
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedApplication(null);
        setResponseReason('');
        setActionType('');
    };

    const handleRemoveApproval = async (application) => {
        if (!window.confirm(`Are you sure you want to remove approval for ${application.firstName} ${application.lastName}? This will revert their sponsor assignment.`)) {
            return;
        }

        try {
            // Get the driver's information to revert sponsor assignment
            console.log('Reverting sponsor assignment for UserID:', application.applicantUserID);
            
            const driversResponse = await fetch(`http://localhost:4000/driverAPI/getAllDrivers`);
            if (driversResponse.ok) {
                const allDrivers = await driversResponse.json();
                const driverToRevert = allDrivers.find(d => d.UserID === application.applicantUserID);
                
                if (driverToRevert) {
                    console.log('Found driver record to revert:', driverToRevert);
                    
                    // You could revert to a default sponsor (e.g., SponsorID 1) or ask for the previous sponsor
                    const revertData = {
                        UserID: driverToRevert.UserID,
                        FirstName: driverToRevert.FirstName,
                        LastName: driverToRevert.LastName,
                        Email: driverToRevert.Email,
                        SponsorID: 1 // Revert to default sponsor or implement logic to track previous sponsor
                    };
                    
                    const revertResponse = await fetch(`http://localhost:4000/driverAPI/updateDriver`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(revertData)
                    });
                    
                    if (!revertResponse.ok) {
                        console.warn('Failed to revert sponsor assignment, continuing with application update');
                    } else {
                        console.log('Driver sponsor assignment reverted successfully');
                    }
                } else {
                    console.log('No driver record found for UserID:', application.applicantUserID);
                }
            }

            // Update application status back to pending
            const allApplications = JSON.parse(localStorage.getItem('driverApplications') || '[]');
            const updatedApplications = allApplications.map(app => 
                app.ApplicationID === application.ApplicationID 
                    ? { 
                        ...app, 
                        status: 'pending',
                        responseReason: '',
                        reviewedDate: null
                    }
                    : app
            );
            
            localStorage.setItem('driverApplications', JSON.stringify(updatedApplications));

            // Refresh applications list
            await fetchPendingApplications();
            
            alert('Approval removed successfully! Driver sponsor assignment has been reverted.');
            
        } catch (error) {
            console.error('Error removing approval:', error);
            alert(`Failed to remove approval: ${error.message}`);
        }
    };

    if (loading) {
        return (
            <>
                <SponsorNavbar />
                <div className="container-fluid mt-4">
                    <div className="text-center">Loading applications...</div>
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
                        <h2 className="mb-4">Pending Driver Applications</h2>
                        
                        {applications.length === 0 ? (
                            <div className="alert alert-info">
                                <i className="fas fa-info-circle me-2"></i>
                                No pending applications at this time.
                            </div>
                        ) : (
                            <div className="table-responsive">
                                <table className="table table-striped table-hover">
                                    <thead className="table-dark">
                                        <tr>
                                            <th>Name</th>
                                            <th>Email</th>
                                            <th>Application Date</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {applications.map(application => (
                                            <tr key={application.ApplicationID}>
                                                <td>{application.firstName} {application.lastName}</td>
                                                <td>{application.email}</td>
                                                <td>{new Date(application.applicationDate).toLocaleDateString()}</td>
                                                <td>
                                                    {application.status === 'pending' ? (
                                                        <button 
                                                            className="btn btn-primary btn-sm"
                                                            onClick={() => handleViewApplication(application)}
                                                        >
                                                            Review
                                                        </button>
                                                    ) : application.status === 'approved' ? (
                                                        <div>
                                                            <span className="badge bg-success me-2">Approved</span>
                                                            <button 
                                                                className="btn btn-warning btn-sm"
                                                                onClick={() => handleRemoveApproval(application)}
                                                            >
                                                                Remove Approval
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <span className="badge bg-danger">Denied</span>
                                                    )}
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
                                    Review Application - {selectedApplication.firstName} {selectedApplication.lastName}
                                </h5>
                                <button type="button" className="btn-close" onClick={handleCloseModal}></button>
                            </div>
                            <div className="modal-body">
                                <div className="row">
                                    <div className="col-md-6">
                                        <h6>Driver Information</h6>
                                        <p><strong>Name:</strong> {selectedApplication.firstName} {selectedApplication.lastName}</p>
                                        <p><strong>Email:</strong> {selectedApplication.email}</p>
                                        <p><strong>User ID:</strong> {selectedApplication.applicantUserID}</p>
                                    </div>
                                    <div className="col-md-6">
                                        <h6>Application Details</h6>
                                        <p><strong>Applied:</strong> {new Date(selectedApplication.applicationDate).toLocaleDateString()}</p>
                                        <p><strong>Status:</strong> {selectedApplication.status}</p>
                                    </div>
                                </div>
                                
                                {selectedApplication.additionalInfo && (
                                    <div className="mt-3">
                                        <h6>Additional Information</h6>
                                        <p>{selectedApplication.additionalInfo}</p>
                                    </div>
                                )}

                                <div className="mt-3">
                                    <label htmlFor="responseReason" className="form-label">
                                        <strong>Response Message:</strong>
                                    </label>
                                    <textarea
                                        id="responseReason"
                                        className="form-control"
                                        rows="4"
                                        value={responseReason}
                                        onChange={(e) => setResponseReason(e.target.value)}
                                        placeholder={actionType === 'approve' ? 
                                            "Welcome message for the approved driver..." : 
                                            "Reason for denial..."}
                                    />
                                </div>
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
