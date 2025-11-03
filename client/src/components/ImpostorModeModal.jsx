import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllSponsors } from './MiscellaneousParts/ServerCall';

export default function ImpostorModeModal({ show, onClose, onSetImpostorMode }) {
    const navigate = useNavigate();
    const [sponsors, setSponsors] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (show) {
            fetchSponsors();
        }
    }, [show]);

    const fetchSponsors = async () => {
        setLoading(true);
        setError(null);
        
        try {
            console.log('Fetching sponsors from API...');
            const response = await getAllSponsors();

            console.log('Response status:', response.status);

            if (response.status === 404) {
                // API endpoint doesn't exist yet, show informative message
                console.log('Sponsor API endpoint not implemented yet');
                setSponsors([]);
                setError('Sponsor API endpoint not implemented yet. Contact development team.');
                setLoading(false);
                return;
            }

            const responseText = await response.text();
            console.log('Raw response:', responseText);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}, message: ${responseText}`);
            }

            let data;
            try {
                data = JSON.parse(responseText);
                console.log('Parsed response data:', data);
            } catch (parseError) {
                console.error('Failed to parse JSON:', parseError);
                throw new Error(`Invalid JSON response: ${responseText}`);
            }

            // Handle different possible response formats
            let sponsorsList = [];
            if (Array.isArray(data)) {
                sponsorsList = data;
            } else if (data && Array.isArray(data.sponsors)) {
                sponsorsList = data.sponsors;
            } else if (data && Array.isArray(data.data)) {
                sponsorsList = data.data;
            } else if (data && typeof data === 'object') {
                // If it's a single sponsor object, wrap it in an array
                sponsorsList = [data];
            }

            console.log('Final sponsors list:', sponsorsList);
            setSponsors(sponsorsList);
        } catch (error) {
            console.error('Error fetching sponsors:', error);
            if (error.message.includes('404')) {
                setError('Sponsor API endpoint not found. Please ensure the server is running with the latest sponsor API implementation.');
            } else {
                setError(`Failed to load sponsors: ${error.message}`);
            }
            setSponsors([]);
        } finally {
            setLoading(false);
        }
    };

    const handleDriverMode = () => {
        onSetImpostorMode('driver');
        navigate('/DriverHome', { replace: true });
    };

    const handleSponsorMode = (sponsorOrg) => {
        onSetImpostorMode('sponsor', sponsorOrg);
        navigate('/SponsorHome', { replace: true });
    };

    const handleGenericSponsorMode = () => {
        onSetImpostorMode('sponsor', 'Generic Sponsor');
        navigate('/SponsorHome', { replace: true });
    };

    if (!show) {
        return null;
    }

    return (
        <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-lg">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">Enter Impostor Mode</h5>
                        <button type="button" className="btn-close" onClick={onClose}></button>
                    </div>
                    <div className="modal-body">
                        <p>Select which user type to impersonate for troubleshooting:</p>
                        
                        <div className="row">
                            <div className="col-md-6">
                                <div className="card">
                                    <div className="card-body">
                                        <h5 className="card-title">Driver Mode</h5>
                                        <p className="card-text">Experience the application as a driver would see it.</p>
                                        <button className="btn btn-primary" onClick={handleDriverMode}>
                                            Enter Driver Mode
                                        </button>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="col-md-6">
                                <div className="card">
                                    <div className="card-body">
                                        <h5 className="card-title">Sponsor Mode</h5>
                                        <p className="card-text">Experience the application as a sponsor would see it.</p>
                                        
                                        {loading && (
                                            <div className="text-center">
                                                <div className="spinner-border spinner-border-sm" role="status">
                                                    <span className="visually-hidden">Loading...</span>
                                                </div>
                                                <p className="mt-2">Loading sponsors...</p>
                                            </div>
                                        )}
                                        
                                        {error && (
                                            <div>
                                                <div className="alert alert-warning" role="alert">
                                                    <strong>API Issue:</strong> {error}
                                                </div>
                                                <div className="alert alert-info" role="alert">
                                                    <small>You can still use generic sponsor mode for testing.</small>
                                                </div>
                                                <button className="btn btn-primary" onClick={handleGenericSponsorMode}>
                                                    Enter Generic Sponsor Mode
                                                </button>
                                            </div>
                                        )}
                                        
                                        {!loading && !error && sponsors.length > 0 && (
                                            <div>
                                                <label htmlFor="sponsorSelect" className="form-label">Select Sponsor:</label>
                                                <select 
                                                    id="sponsorSelect" 
                                                    className="form-select mb-3"
                                                    onChange={(e) => {
                                                        if (e.target.value) {
                                                            handleSponsorMode(e.target.value);
                                                        }
                                                    }}
                                                    defaultValue=""
                                                >
                                                    <option value="">Choose a sponsor...</option>
                                                    {sponsors.map((sponsor, index) => (
                                                        <option 
                                                            key={sponsor.SponsorID || sponsor.id || index} 
                                                            value={sponsor.Name || sponsor.SponsorOrganization || sponsor.organization || sponsor.name}
                                                        >
                                                            {sponsor.Name || sponsor.SponsorOrganization || sponsor.organization || sponsor.name || `Sponsor ${index + 1}`}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}
                                        
                                        {!loading && !error && sponsors.length === 0 && (
                                            <div>
                                                <div className="alert alert-success" role="alert">
                                                    <small>No sponsors found in database. Using generic sponsor mode.</small>
                                                </div>
                                                <button className="btn btn-primary" onClick={handleGenericSponsorMode}>
                                                    Enter Sponsor Mode
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
