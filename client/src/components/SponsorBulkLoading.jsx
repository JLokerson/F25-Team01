import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import SponsorNavbar from './SponsorNavbar';
import { GenerateSalt } from './MiscellaneousParts/HashPass';

export default function SponsorBulkLoading() {
    const [bulkUploadFile, setBulkUploadFile] = useState(null);
    const [bulkUploadResults, setBulkUploadResults] = useState(null);
    const [bulkUploadLoading, setBulkUploadLoading] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);
    const [sponsors, setSponsors] = useState([]);
    const [sponsorInfo, setSponsorInfo] = useState([]);
    const [loading, setLoading] = useState([true]);

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
                const response = await fetch(`https://63iutwxr2owp72oyfbetwyluaq0wakdm.lambda-url.us-east-1.on.aws/sponsorAPI/getAllSponsorUsers`);
                if (response.ok) {
                    const allSponsorUsers = await response.json();
                    const currentSponsorInfo = allSponsorUsers.find(s => s.UserID === userInfo.UserID);
                    setSponsorInfo(currentSponsorInfo);

                    /* Unnecessary here.
                    if (currentSponsorInfo) {
                        fetchDriversForSponsor(currentSponsorInfo.SponsorID);
                    }
                    */
                }
            } catch (error) {
                console.error('Error fetching sponsor info:', error);
            }
        }
    };

    // Use this to load all the sponsor orgs.
    const fetchAllSponsors = async () => {
        try {
            console.log('=== FETCHING SPONSORS ===');
            // Get sponsor companies for driver dropdown
            const response = await fetch(`http://localhost:4000/sponsorAPI/getAllSponsors`);
            console.log('Sponsor API response status:', response.status);
            
            if (response.ok) {
                const responseText = await response.text();
                console.log('Raw sponsor response text:', responseText);
                
                let allSponsors;
                try {
                    allSponsors = JSON.parse(responseText);
                    console.log('Parsed sponsor data:', allSponsors);
                } catch (parseError) {
                    console.error('Failed to parse sponsor JSON:', parseError);
                    setSponsors([]);
                    return;
                }
                
                if (!Array.isArray(allSponsors)) {
                    console.error('Sponsor data is not an array:', allSponsors);
                    setSponsors([]);
                    return;
                }
                
                // Process sponsor data with fallbacks
                const processedSponsors = allSponsors.map(sponsor => ({
                    ...sponsor,
                    SponsorID: sponsor.SponsorID || sponsor.sponsorID || sponsor.sponsor_id,
                    Name: sponsor.Name || sponsor.name || 
                          `${sponsor.FirstName || sponsor.firstName || sponsor.first_name || ''} ${sponsor.LastName || sponsor.lastName || sponsor.last_name || ''}`.trim(),
                    FirstName: sponsor.FirstName || sponsor.firstName || sponsor.first_name || '',
                    LastName: sponsor.LastName || sponsor.lastName || sponsor.last_name || ''
                }));
                
                console.log('Processed sponsor data:', processedSponsors);
                setSponsors(processedSponsors);
            } else {
                console.error('Failed to fetch sponsors - HTTP status:', response.status);
                setSponsors([]);
            }
        } catch (error) {
            console.error('Network error fetching sponsors:', error);
            setSponsors([]);
        }
    };

    // Base template for this was taken from Julia's adminbulkupload branch off which
    // the sponsorbulkupload branch was based. This is gonna be messy, seeing as I
    // do not find this massive function to be particularly readable. Regardless, I have a plan.
    const handleBulkUpload = async (e) => {
        e.preventDefault();
        if (!bulkUploadFile) {
            alert('Please select a file to upload.');
            return;
        }

        setBulkUploadLoading(true);
        setBulkUploadResults(null);

        try {
            const fileContent = await readFileContent(bulkUploadFile);
            const lines = fileContent.split('\n').map(line => line.trim()).filter(line => line);
            
            const results = {
                totalLines: lines.length,
                processed: 0,
                errors: [],
                success: {
                    organizations: 0,
                    drivers: 0,
                    sponsors: 0
                },
                organizationCache: new Set() // Track organizations we've created in this session
            };

            /* Disallowed for sponsor users.
            // Load existing organizations into cache
            sponsors.forEach(sponsor => {
                results.organizationCache.add(sponsor.Name.toLowerCase());
            });
            */

            for (let i = 0; i < lines.length; i++) {
                const lineNumber = i + 1;
                const line = lines[i];
                
                try {
                    const result = await processUploadLine(line, lineNumber, results.organizationCache);
                    
                    if (result.success) {
                        results.success[result.type]++;

                        // Should never occur.
                        if (result.type === 'organizations') {

                            // Alert user and don't log it.
                            alert("Sponsor users may not create organizations!");
                        }
                    } else {
                        results.errors.push({
                            line: lineNumber,
                            content: line,
                            error: result.error
                        });
                    }
                } catch (error) {
                    results.errors.push({
                        line: lineNumber,
                        content: line,
                        error: `Unexpected error: ${error.message}`
                    });
                }
                
                results.processed++;
            }

            setBulkUploadResults(results);
            
            // Refresh all data after bulk upload
            //await Promise.all([fetchAllUsers(), fetchAllSponsors(), fetchSponsorOrgs()]);
            // I have no idea what the fuck to await here. I did not make this page and I 
            // am looking at far too many lines of code to figure this out.
            
        } catch (error) {
            console.error('Error processing bulk upload:', error);
            alert(`Error processing file: ${error.message}`);
        } finally {
            setBulkUploadLoading(false);
        }
    };

    const processUploadLine = async (line, lineNumber, organizationCache) => {
        const parts = line.split('|');
        
        if (parts.length < 2) {
            return { success: false, error: 'Invalid format: Not enough fields (minimum 2 required)' };
        }

        const type = parts[0].trim().toUpperCase();
        
        switch (type) {
            case 'O':
                return await { success: false, error: `Invalid type '${type}' cannot be O for sponsors.` };
            case 'D':
                return await processDriverRecord(parts, organizationCache);
            case 'S':
                return await processSponsorRecord(parts, organizationCache);
            default:
                return { success: false, error: `Invalid type '${type}'. Must be O, D, or S.` };
        }
    };

    const processDriverRecord = async (parts, organizationCache) => {
        if (parts.length !== 5) {
            return { success: false, error: 'Driver record must have exactly 4 fields: D||first name|last name|email' };
        }

        const [, organizationName, firstName, lastName, email] = parts.map(p => p.trim());
        
        if (!firstName || !lastName || !email) {
            return { success: false, error: 'All driver fields are required and cannot be empty' };
        }

        
        if(organizationName){
            return { success: false, error: 'Organization name cannot be provided by sponsor users.'}
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return { success: false, error: 'Invalid email format' };
        }

        try {
            const salt = GenerateSalt();
            const driverData = {
                FirstName: firstName,
                LastName: lastName,
                Email: email,
                Password: 'DefaultPassword123!', // Default password - user should change on first login
                SponsorID: sponsorInfo.sponsorID,
                UserType: 1,
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
                return { success: true, type: 'drivers' };
            } else {
                const errorText = await response.text();
                return { success: false, error: `Failed to create driver: ${errorText}` };
            }
        } catch (error) {
            return { success: false, error: `Network error creating driver: ${error.message}` };
        }
    };

    const processSponsorRecord = async (parts, organizationCache) => {
        if (parts.length !== 5) {
            return { success: false, error: 'Sponsor record must have exactly 4 fields: S||first name|last name|email' };
        }

        const [, organizationName, firstName, lastName, email] = parts.map(p => p.trim());
        
        if (!firstName || !lastName || !email) {
            return { success: false, error: 'All sponsor fields are required and cannot be empty' };
        }

        if(organizationName){
            return { success: false, error: 'Organization name cannot be provided by sponsor users.'}
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return { success: false, error: 'Invalid email format' };
        }

        try {
            const salt = GenerateSalt();
            const sponsorData = {
                FirstName: firstName,
                LastName: lastName,
                Email: email,
                Password: 'DefaultPassword123!', // Default password - user should change on first login
                SponsorID: sponsorInfo.sponsorID,
                UserType: 2,
                PasswordSalt: salt
            };

            const queryString = new URLSearchParams(sponsorData).toString();
            const response = await fetch(`http://localhost:4000/sponsorAPI/addSponsorUser?${queryString}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                return { success: true, type: 'sponsors' };
            } else {
                const errorText = await response.text();
                return { success: false, error: `Failed to create sponsor: ${errorText}` };
            }
        } catch (error) {
            return { success: false, error: `Network error creating sponsor: ${error.message}` };
        }
    };

    const readFileContent = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    };

    const handleFileSelect = (file) => {
        if (file && (file.type === 'text/plain' || file.name.endsWith('.txt'))) {
            setBulkUploadFile(file);
            setBulkUploadResults(null);
        } else {
            alert('Please select a valid text file (.txt)');
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragOver(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragOver(false);
        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            handleFileSelect(files[0]);
        }
    };


    // Actual code for doing things the page needs.
    useEffect(() => {
            const fetchData = async () => {
                console.log('Starting data fetch...');
                setLoading(true);
                await Promise.all([fetchAllSponsors(),fetchSponsorInfo()]);
                console.log('Data fetch completed');
                setLoading(false);
            };
            fetchData();
        }, []);


    // Returned view. Uses same code as in adminusermanagement because 
    // frankly I already disabled the organization loading so it
    // shouldn't be an issue. Who knows, maybe some hypothetical RC3
    // might want that decision reverted and as such being able to
    // revert it might be advantageous in a hypothetical business
    // environment that does not actually exist regardless.
    return(
        <div>
        <SponsorNavbar/>
        <div className="row">
                            <div className="col-md-8">
                                <div className="card">
                                    <div className="card-body">
                                        <h5 className="card-title">
                                            <i className="fas fa-upload me-2"></i>
                                            Bulk Load Users and Organizations
                                        </h5>
                                        <p className="card-text">
                                            Upload a pipe-delimited text file to create multiple organizations, drivers, and sponsors at once.
                                        </p>

                                        <form onSubmit={handleBulkUpload}>
                                            <div 
                                                className={`border rounded p-4 mb-3 text-center ${isDragOver ? 'border-primary bg-light' : 'border-dashed'}`}
                                                onDragOver={handleDragOver}
                                                onDragLeave={handleDragLeave}
                                                onDrop={handleDrop}
                                                style={{ 
                                                    borderStyle: isDragOver ? 'solid' : 'dashed',
                                                    minHeight: '120px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    flexDirection: 'column'
                                                }}
                                            >
                                                {bulkUploadFile ? (
                                                    <div>
                                                        <i className="fas fa-file-alt fa-2x text-success mb-2"></i>
                                                        <p className="mb-0">
                                                            <strong>{bulkUploadFile.name}</strong>
                                                        </p>
                                                        <small className="text-muted">
                                                            {(bulkUploadFile.size / 1024).toFixed(2)} KB
                                                        </small>
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <i className="fas fa-cloud-upload-alt fa-2x text-muted mb-2"></i>
                                                        <p className="mb-2">
                                                            Drag and drop your text file here, or click to browse
                                                        </p>
                                                        <input
                                                            type="file"
                                                            className="form-control"
                                                            accept=".txt,text/plain"
                                                            onChange={(e) => handleFileSelect(e.target.files[0])}
                                                            style={{ maxWidth: '300px', margin: '0 auto' }}
                                                        />
                                                    </div>
                                                )}
                                            </div>

                                            <div className="d-flex justify-content-between">
                                                <button
                                                    type="button"
                                                    className="btn btn-outline-secondary"
                                                    onClick={() => {
                                                        setBulkUploadFile(null);
                                                        setBulkUploadResults(null);
                                                    }}
                                                    disabled={!bulkUploadFile}
                                                >
                                                    Clear File
                                                </button>
                                                <button
                                                    type="submit"
                                                    className="btn btn-primary"
                                                    disabled={!bulkUploadFile || bulkUploadLoading}
                                                >
                                                    {bulkUploadLoading ? (
                                                        <>
                                                            <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                                            Processing...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <i className="fas fa-upload me-2"></i>
                                                            Upload and Process
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </form>

                                        {/* Results Display */}
                                        {bulkUploadResults && (
                                            <div className="mt-4">
                                                <hr />
                                                <h6>Upload Results</h6>
                                                <div className="row mb-3">
                                                    <div className="col-md-3">
                                                        <div className="card bg-primary text-white">
                                                            <div className="card-body text-center">
                                                                <h5>{bulkUploadResults.totalLines}</h5>
                                                                <small>Total Lines</small>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="col-md-3">
                                                        <div className="card bg-success text-white">
                                                            <div className="card-body text-center">
                                                                <h5>
                                                                    {bulkUploadResults.success.organizations + 
                                                                     bulkUploadResults.success.drivers + 
                                                                     bulkUploadResults.success.sponsors}
                                                                </h5>
                                                                <small>Successful</small>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="col-md-3">
                                                        <div className="card bg-danger text-white">
                                                            <div className="card-body text-center">
                                                                <h5>{bulkUploadResults.errors.length}</h5>
                                                                <small>Errors</small>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="col-md-3">
                                                        <div className="card bg-info text-white">
                                                            <div className="card-body text-center">
                                                                <h5>{bulkUploadResults.processed}</h5>
                                                                <small>Processed</small>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="row mb-3">
                                                    <div className="col-md-4">
                                                        <div className="text-center">
                                                            <i className="fas fa-building text-warning fa-2x"></i>
                                                            <h6 className="mt-2">Organizations</h6>
                                                            <span className="badge bg-warning">{bulkUploadResults.success.organizations}</span>
                                                        </div>
                                                    </div>
                                                    <div className="col-md-4">
                                                        <div className="text-center">
                                                            <i className="fas fa-car text-primary fa-2x"></i>
                                                            <h6 className="mt-2">Drivers</h6>
                                                            <span className="badge bg-primary">{bulkUploadResults.success.drivers}</span>
                                                        </div>
                                                    </div>
                                                    <div className="col-md-4">
                                                        <div className="text-center">
                                                            <i className="fas fa-handshake text-success fa-2x"></i>
                                                            <h6 className="mt-2">Sponsors</h6>
                                                            <span className="badge bg-success">{bulkUploadResults.success.sponsors}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Error Details */}
                                                {bulkUploadResults.errors.length > 0 && (
                                                    <div className="mt-3">
                                                        <h6 className="text-danger">
                                                            <i className="fas fa-exclamation-triangle me-2"></i>
                                                            Errors ({bulkUploadResults.errors.length})
                                                        </h6>
                                                        <div className="table-responsive" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                                            <table className="table table-sm table-striped">
                                                                <thead className="table-dark">
                                                                    <tr>
                                                                        <th>Line</th>
                                                                        <th>Content</th>
                                                                        <th>Error</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {bulkUploadResults.errors.map((error, index) => (
                                                                        <tr key={index}>
                                                                            <td>{error.line}</td>
                                                                            <td>
                                                                                <code style={{ fontSize: '0.8em' }}>
                                                                                    {error.content.length > 50 
                                                                                        ? error.content.substring(0, 50) + '...' 
                                                                                        : error.content}
                                                                                </code>
                                                                            </td>
                                                                            <td className="text-danger" style={{ fontSize: '0.9em' }}>
                                                                                {error.error}
                                                                            </td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="col-md-4">
                                <div className="card">
                                    <div className="card-body">
                                        <h6 className="card-title">
                                            <i className="fas fa-info-circle me-2"></i>
                                            File Format Instructions
                                        </h6>
                                        <div className="mb-3">
                                            <h6>Record Types:</h6>
                                            <ul className="list-unstyled">
                                                <li><code>D</code> - Driver</li>
                                                <li><code>S</code> - Sponsor User</li>
                                            </ul>
                                        </div>

                                        <div className="mb-3">
                                            <h6>Format Examples:</h6>
                                            <div className="bg-light p-2 rounded">
                                                <code style={{ fontSize: '0.8em' }}>
                                                    D||Joe|Driver|joe@email.com<br />
                                                    S||Jill|Sponsor|jill@mail.com
                                                </code>
                                            </div>
                                        </div>

                                        <div className="mb-3">
                                            <h6>Rules:</h6>
                                            <ul style={{ fontSize: '0.9em' }}>
                                                <li>Organizations must exist or be created first</li>
                                                <li>Use pipe (|) as delimiter</li>
                                                <li>No pipes allowed in field data</li>
                                                <li>Email addresses must be valid format</li>
                                                <li>Default password: "DefaultPassword123!"</li>
                                                <li>Errors are skipped, processing continues</li>
                                            </ul>
                                        </div>

                                        <div className="alert alert-warning" style={{ fontSize: '0.8em' }}>
                                            <strong>Note:</strong> While admins can create organizations in a bulk upload, this feature is not available to sponsors.
                                            If you need to create an additional organization for some reason, please contact an admin.
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
    </div>
    );
}