import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import DriverNavbar from './DriverNavbar';

export default function DriverApplication() {
    const [sponsors, setSponsors] = useState([]);
    const [userApplications, setUserApplications] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    useEffect(() => {
        fetchSponsors();
        loadUserApplications();
    }, []);

    const fetchSponsors = async () => {
        try {
            // Use the direct getAllSponsors endpoint
            const response = await fetch('http://localhost:4000/sponsorAPI/getAllSponsors');
            if (response.ok) {
                const sponsorsData = await response.json();
                console.log('Fetched sponsors:', sponsorsData);
                
                // Transform the data to match expected format
                const formattedSponsors = sponsorsData.map(sponsor => ({
                    SponsorID: sponsor.SponsorID,
                    OrganizationName: sponsor.Name // Use Name as OrganizationName
                }));
                
                setSponsors(formattedSponsors);
            } else {
                console.error('Failed to fetch sponsors:', response.status);
            }
        } catch (error) {
            console.error('Error fetching sponsors:', error);
        }
    };

    const loadUserApplications = () => {
        // Load applications from localStorage (mock storage)
        const applications = JSON.parse(localStorage.getItem('driverApplications') || '[]');
        const userApps = applications.filter(app => app.applicantUserID === user.UserID);
        setUserApplications(userApps);
    };

    const saveApplications = (applications) => {
        localStorage.setItem('driverApplications', JSON.stringify(applications));
    };

    const handleApply = async (sponsorID, organizationName) => {
        setLoading(true);
        setMessage('');

        try {
            // Get existing applications
            const existingApplications = JSON.parse(localStorage.getItem('driverApplications') || '[]');
            
            // Check if user already has a PENDING application for this sponsor
            const existingPendingApp = existingApplications.find(
                app => app.applicantUserID === user.UserID && 
                       app.requestedSponsorID === sponsorID && 
                       app.status === 'pending'
            );
            
            if (existingPendingApp) {
                throw new Error('You already have a pending application for this sponsor');
            }

            // Create new application
            const newApplication = {
                ApplicationID: Date.now(), // Simple ID generation
                applicantUserID: user.UserID,
                firstName: user.FirstName,
                lastName: user.LastName,
                email: user.Email,
                requestedSponsorID: sponsorID,
                sponsorName: organizationName,
                applicationDate: new Date().toISOString(),
                status: 'pending',
                responseReason: null,
                reviewedDate: null
            };

            // Save to localStorage
            existingApplications.push(newApplication);
            saveApplications(existingApplications);
            
            setMessage('Application submitted successfully!');
            setMessageType('success');
            loadUserApplications(); // Refresh user applications
            
        } catch (error) {
            console.error('Error submitting application:', error);
            setMessage(error.message);
            setMessageType('error');
        } finally {
            setLoading(false);
        }
    };

    const getApplicationStatus = (sponsorID) => {
        // Get the most recent application for this sponsor
        const applications = userApplications
            .filter(app => app.requestedSponsorID === sponsorID)
            .sort((a, b) => new Date(b.applicationDate) - new Date(a.applicationDate));
        
        return applications[0]; // Return most recent application
    };

    const getStatusBadge = (status) => {
        switch(status) {
            case 'pending':
                return <span className="badge bg-warning">Pending</span>;
            case 'approved':
                return <span className="badge bg-success">Approved</span>;
            case 'denied':
                return <span className="badge bg-danger">Denied</span>;
            default:
                return null;
        }
    };

    return (
        <>
            <DriverNavbar />
            <div className="container mt-4">
                <div className="row">
                    <div className="col-12">
                        <h2 className="mb-4">Apply to Sponsor Organizations</h2>
                        
                        {message && (
                            <div className={`alert ${messageType === 'success' ? 'alert-success' : 'alert-danger'} alert-dismissible fade show`}>
                                {message}
                                <button type="button" className="btn-close" onClick={() => setMessage('')}></button>
                            </div>
                        )}

                        <div className="card mb-4">
                            <div className="card-body">
                                <h5 className="card-title">Your Information</h5>
                                <div className="row">
                                    <div className="col-md-6">
                                        <p><strong>Name:</strong> {user.FirstName} {user.LastName}</p>
                                        <p><strong>Email:</strong> {user.Email}</p>
                                    </div>
                                    <div className="col-md-6">
                                        <p><strong>User ID:</strong> {user.UserID}</p>
                                        <p><strong>User Type:</strong> {user.UserType === 1 ? 'Driver' : 'Other'}</p>
                                    </div>
                                </div>
                                <small className="text-muted">This information will be used for your applications.</small>
                            </div>
                        </div>

                        <h3 className="mb-3">Available Sponsor Organizations</h3>
                        
                        {sponsors.length === 0 ? (
                            <div className="alert alert-info">
                                <i className="fas fa-info-circle me-2"></i>
                                No sponsor organizations available at this time.
                            </div>
                        ) : (
                            <div className="row">
                                {sponsors.map(sponsor => {
                                    const application = getApplicationStatus(sponsor.SponsorID);
                                    return (
                                        <div key={sponsor.SponsorID} className="col-md-6 col-lg-4 mb-3">
                                            <div className="card h-100">
                                                <div className="card-body d-flex flex-column">
                                                    <h5 className="card-title">{sponsor.OrganizationName}</h5>
                                                    <p className="card-text flex-grow-1">
                                                        <small className="text-muted">Sponsor ID: {sponsor.SponsorID}</small>
                                                    </p>
                                                    
                                                    <div className="mt-auto">
                                                        {application ? (
                                                            <div>
                                                                <div className="mb-2">
                                                                    {getStatusBadge(application.status)}
                                                                </div>
                                                                <small className="text-muted d-block">
                                                                    Applied: {new Date(application.applicationDate).toLocaleDateString()}
                                                                </small>
                                                                {application.responseReason && (
                                                                    <small className="text-muted d-block mt-1">
                                                                        <strong>Response:</strong> {application.responseReason}
                                                                    </small>
                                                                )}
                                                                {application.status === 'denied' && (
                                                                    <button 
                                                                        className="btn btn-outline-primary btn-sm w-100 mt-2"
                                                                        onClick={() => handleApply(sponsor.SponsorID, sponsor.OrganizationName)}
                                                                        disabled={loading}
                                                                    >
                                                                        {loading ? 'Applying...' : 'Apply Again'}
                                                                    </button>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <button 
                                                                className="btn btn-primary w-100"
                                                                onClick={() => handleApply(sponsor.SponsorID, sponsor.OrganizationName)}
                                                                disabled={loading}
                                                            >
                                                                {loading ? 'Applying...' : 'Apply'}
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {userApplications.length > 0 && (
                            <div className="mt-5">
                                <h3 className="mb-3">Your Applications</h3>
                                <div className="table-responsive">
                                    <table className="table table-striped">
                                        <thead>
                                            <tr>
                                                <th>Organization</th>
                                                <th>Application Date</th>
                                                <th>Status</th>
                                                <th>Response</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {userApplications.map(application => (
                                                <tr key={application.ApplicationID}>
                                                    <td>{application.sponsorName}</td>
                                                    <td>{new Date(application.applicationDate).toLocaleDateString()}</td>
                                                    <td>{getStatusBadge(application.status)}</td>
                                                    <td>
                                                        {application.responseReason ? (
                                                            <small>{application.responseReason}</small>
                                                        ) : (
                                                            <small className="text-muted">Pending review</small>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
