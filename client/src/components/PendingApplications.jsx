import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import SponsorNavbar from './SponsorNavbar';
import { HashPassword, GenerateSalt } from './MiscellaneousParts/HashPass';
import { addDriver, getAllSponsorUsers } from './MiscellaneousParts/ServerCall';

export default function PendingApplications() {
    // Dummy data for pending applications
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
            applicationDate: '2024-01-15',
            status: 'pending',
            tempPassword: 'password' // Temporary password for new users
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
            requestedOrganization: 'RandTruckCompany',
            applicationDate: '2024-01-18',
            status: 'pending',
            tempPassword: 'password'
        }
    ]);

    const [selectedApplication, setSelectedApplication] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [denialReason, setDenialReason] = useState('');
    const [actionType, setActionType] = useState(''); // 'approve' or 'deny'

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
        if (actionType === 'approve') {
            try {
                // Generate password salt and hash the temporary password
                const salt = GenerateSalt();
                const hashedPassword = await HashPassword(selectedApplication.tempPassword + salt);
                
                console.log(`Approving application for ${selectedApplication.firstName} ${selectedApplication.lastName}`);
                console.log('Organization:', selectedApplication.requestedOrganization);
                
                // Get current sponsor info to determine SponsorID
                const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
                let sponsorID = 1; // Default fallback
                
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
                        console.warn('Could not fetch sponsor info, using default SponsorID:', error);
                    }
                }

                // Create driver data in the same format as SponsorDriverManagement
                const driverData = {
                    FirstName: selectedApplication.firstName,
                    LastName: selectedApplication.lastName,
                    Email: selectedApplication.email,
                    Password: hashedPassword,
                    PasswordSalt: salt,
                    SponsorID: sponsorID,
                    UserType: 1 // Driver type
                };

                console.log('Creating driver with data:', driverData);

                // Use the same endpoint as SponsorDriverManagement
                const response = await addDriver(driverData);

                console.log('Response status:', response.status);
                
                if (!response.ok) {
                    const responseText = await response.text();
                    console.log('Error response:', responseText);
                    throw new Error(`Failed to create driver: ${response.status} - ${responseText}`);
                }

                const responseText = await response.text();
                console.log('Success response:', responseText);
                
                // Update application status
                setApplications(prev => prev.map(app => 
                    app.id === selectedApplication.id 
                        ? { ...app, status: 'approved' }
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
            
            console.log(`Denying application for ${selectedApplication.firstName} ${selectedApplication.lastName}`);
            console.log('Denial reason:', denialReason);
            
            // Update application status
            setApplications(prev => prev.map(app => 
                app.id === selectedApplication.id 
                    ? { ...app, status: 'denied', denialReason }
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

    const pendingApplications = applications.filter(app => app.status === 'pending');

    return (
        <>
            <SponsorNavbar />
            <div className="container-fluid mt-4">
                <div className="row">
                    <div className="col-12">
                        <h2 className="mb-4">Pending Driver Applications</h2>
                        
                        {pendingApplications.length === 0 ? (
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
                                                <td>{application.requestedOrganization}</td>
                                                <td>{new Date(application.applicationDate).toLocaleDateString()}</td>
                                                <td>
                                                    <button 
                                                        className="btn btn-primary btn-sm"
                                                        onClick={() => handleViewApplication(application)}
                                                    >
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
                                    Review Application - {selectedApplication.firstName} {selectedApplication.lastName}
                                </h5>
                                <button type="button" className="btn-close" onClick={handleCloseModal}></button>
                            </div>
                            <div className="modal-body">
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
                                                <li><strong>Temporary Password:</strong> {selectedApplication.tempPassword}</li>
                                                <li><strong>Last Login:</strong> null (first-time user)</li>
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
