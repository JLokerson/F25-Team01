import React, { useEffect, useState, useCallback } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import DriverNavbar from '../DriverNavbar';
import HelperPasswordChange from './HelperPasswordChange';
import { getAllSponsors, getAllDrivers, getDriverSponsorMappings, getPointsHistory } from '../MiscellaneousParts/ServerCall';

export default function DriverProfile() {
    const [activeTab, setActiveTab] = useState('profile'); // tab state
    const [showPasswordChangeButton, setShowPasswordChangeButton] = useState(false);
    const [driverInfo, setDriverInfo] = useState(null);
    const [allDriverMappings, setAllDriverMappings] = useState([]);
    const [selectedMappingIndex, setSelectedMappingIndex] = useState(0);
    const [sponsorNames, setSponsorNames] = useState({});
    const [driverInfoLoading, setDriverInfoLoading] = useState(true);
    const [pointsHistory, setPointsHistory] = useState([]);
    const [pointsHistoryLoading, setPointsHistoryLoading] = useState(false);

    const checkLastLogin = () => {
        const userString = localStorage.getItem('user');
        if (userString) {
            try {
                const user = JSON.parse(userString);
                const lastLoginDate = user.LastLogin ? new Date(user.LastLogin) : null;
                
                if (lastLoginDate) {
                    const threeMonthsAgo = new Date();
                    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
                    
                    if (lastLoginDate < threeMonthsAgo) {
                        setShowPasswordChangeButton(true);
                    }
                } else {
                    setShowPasswordChangeButton(true);
                }
            } catch (e) {
                console.error('Error parsing user data:', e);
            }
        }
    };

    const fetchPointsHistory = useCallback(async (mappingID) => {
        if (!mappingID) {
            console.log('No mappingID provided for points history');
            return;
        }

        setPointsHistoryLoading(true);
        try {
            console.log('Fetching points history for MappingID:', mappingID);
            const response = await getPointsHistory(mappingID);
            
            if (response && response.ok) {
                const historyData = await response.json();
                console.log('Points history response:', historyData);
                setPointsHistory(historyData);
            } else {
                console.error('Failed to fetch points history');
                setPointsHistory([]);
            }
        } catch (error) {
            console.error('Error fetching points history:', error);
            setPointsHistory([]);
        } finally {
            setPointsHistoryLoading(false);
        }
    }, []);

    const fetchDriverInfo = useCallback(async () => {
        const userInfo = getUserInfo();
        console.log('DriverProfile - UserInfo:', userInfo);
        if (userInfo && userInfo.UserID) {
            try {
                // Try the new API endpoint using the ServerCall helper
                console.log('DriverProfile - Attempting to use getDriverSponsorMappings...');
                const response = await getDriverSponsorMappings(userInfo.UserID);
                
                if (response && response.ok) {
                    const mappingsData = await response.json();
                    console.log('DriverProfile - GetDriverInfoSpecific raw response:', mappingsData);
                    
                    // Handle the stored procedure response structure: [[actualData], metadata]
                    let allMappings = [];
                    
                    if (Array.isArray(mappingsData) && mappingsData.length > 0) {
                        // Check if first element is an array (stored procedure result structure)
                        if (Array.isArray(mappingsData[0])) {
                            // Extract the actual data from the first element
                            allMappings = mappingsData[0];
                            console.log('DriverProfile - Extracted mappings from nested array:', allMappings);
                        } else {
                            // Fallback: treat the whole response as the data
                            allMappings = mappingsData;
                            console.log('DriverProfile - Using direct response as mappings:', allMappings);
                        }
                    }
                    
                    console.log('DriverProfile - Final processed mappings:', allMappings);
                    console.log('DriverProfile - Number of mappings found:', allMappings.length);
                    
                    if (Array.isArray(allMappings) && allMappings.length > 0) {
                        // Set driver info from the first mapping
                        const firstMapping = allMappings[0];
                        setDriverInfo({
                            DriverID: firstMapping.DriverID,
                            UserID: firstMapping.UserID,
                            FirstName: firstMapping.FirstName,
                            LastName: firstMapping.LastName,
                            Email: firstMapping.Email
                        });
                        
                        // Transform ALL mappings to match expected structure
                        const transformedMappings = allMappings.map((mapping, index) => {
                            console.log(`DriverProfile - Processing mapping ${index + 1}:`, mapping);
                            
                            // MappingID should be directly available from the stored procedure
                            const mappingID = mapping.MappingID;
                            console.log(`DriverProfile - Extracted MappingID: ${mappingID} for UserID ${mapping.UserID}, SponsorID ${mapping.SponsorID}`);
                            
                            if (mappingID === undefined || mappingID === null) {
                                console.error(`DriverProfile - MappingID is missing for mapping:`, mapping);
                            }
                            
                            return {
                                DriverID: mapping.DriverID,
                                SponsorID: mapping.SponsorID,
                                Points: mapping.Points || 0,
                                UserID: mapping.UserID,
                                FirstName: mapping.FirstName,
                                LastName: mapping.LastName,
                                Email: mapping.Email,
                                SponsorName: mapping.Name || null,
                                PointRatio: mapping.PointRatio || '0.01',
                                ApplicationAccepted: 1,
                                MappingID: mappingID, // This should now be properly extracted
                                mappingKey: `${mapping.UserID}-${mapping.SponsorID}-${mappingID || index}`
                            };
                        });
                        
                        console.log('DriverProfile - Transformed mappings with MappingIDs:', transformedMappings);
                        
                        // Verify MappingIDs are present
                        transformedMappings.forEach((mapping, index) => {
                            console.log(`DriverProfile - Final Mapping ${index}: UserID=${mapping.UserID}, SponsorID=${mapping.SponsorID}, MappingID=${mapping.MappingID}`);
                            if (!mapping.MappingID && mapping.MappingID !== 0) {
                                console.error(`DriverProfile - Missing MappingID in transformed mapping ${index}:`, mapping);
                            }
                        });
                        
                        setAllDriverMappings(transformedMappings);
                        
                        // Fetch points history for the first (default) mapping
                        if (transformedMappings.length > 0) {
                            const firstMappingID = transformedMappings[0].MappingID;
                            console.log(`DriverProfile - Attempting to fetch points history for first mapping with MappingID: ${firstMappingID}`);
                            
                            if (firstMappingID !== undefined && firstMappingID !== null) {
                                fetchPointsHistory(firstMappingID);
                            } else {
                                console.error('DriverProfile - No valid MappingID found for first mapping, cannot fetch points history');
                                setPointsHistory([]);
                            }
                        }

                        // Create sponsor name mapping from the response data
                        const sponsorNameMap = {};
                        allMappings.forEach(mapping => {
                            if (mapping.Name) {
                                sponsorNameMap[mapping.SponsorID] = mapping.Name;
                            }
                        });
                        setSponsorNames(sponsorNameMap);
                        
                    } else {
                        console.log('DriverProfile - No driver-sponsor mappings found, falling back');
                        await fetchDriverInfoFallback(userInfo);
                    }
                } else {
                    console.log('DriverProfile - getDriverSponsorMappings failed, falling back to getAllDrivers approach');
                    await fetchDriverInfoFallback(userInfo);
                }
            } catch (error) {
                console.error('Error with getDriverSponsorMappings, falling back:', error);
                await fetchDriverInfoFallback(userInfo);
            } finally {
                setDriverInfoLoading(false);
            }
        } else {
            console.log('DriverProfile - No UserID found in userInfo');
            setDriverInfoLoading(false);
        }
    }, [fetchPointsHistory]);

    const fetchDriverInfoFallback = async (userInfo) => {
        try {
            // Fallback to original getAllDrivers approach
            const driversResponse = await getAllDrivers();
            if (driversResponse.ok) {
                const driversData = await driversResponse.json();
                console.log('DriverProfile - Fallback: Raw drivers response:', driversData);
                
                // Handle different possible response structures
                let allDrivers = driversData;
                if (Array.isArray(driversData) && driversData.length > 0 && Array.isArray(driversData[0])) {
                    allDrivers = driversData[0];
                }
                
                if (Array.isArray(allDrivers)) {
                    const driverRecord = allDrivers.find(d => Number(d.UserID) === Number(userInfo.UserID));
                    console.log('DriverProfile - Fallback: Found driver record:', driverRecord);
                    
                    if (driverRecord) {
                        setDriverInfo(driverRecord);
                        
                        const driverMappings = [{
                            DriverID: driverRecord.DriverID,
                            SponsorID: driverRecord.SponsorID,
                            Points: driverRecord.Points || 0,
                            UserID: driverRecord.UserID,
                            FirstName: driverRecord.FirstName,
                            LastName: driverRecord.LastName,
                            Email: driverRecord.Email
                        }];
                        
                        setAllDriverMappings(driverMappings);
                        await fetchSponsorNames([driverRecord.SponsorID]);
                    } else {
                        setDriverInfo(false);
                        setAllDriverMappings([]);
                    }
                }
            }
        } catch (error) {
            console.error('Fallback fetch error:', error);
            setDriverInfo(false);
            setAllDriverMappings([]);
        }
    };

    /* Commented out broken test code.
    const testGetDriverInfoSpecific = async () => {
        const userInfo = getUserInfo();
        if (!userInfo || !userInfo.UserID) {
            alert('No user logged in');
            return;
        }

        try {
            console.log('Testing GetDriverInfoSpecific for UserID:', userInfo.UserID);
            
            const testResults = [];

            // Only test the ServerCall helper - no direct URL calls
            try {
                console.log('Testing ServerCall helper...');
                const serverCallResponse = await getDriverSponsorMappings(userInfo.UserID);
                if (serverCallResponse && serverCallResponse.ok) {
                    const data = await serverCallResponse.json();
                    testResults.push({
                        url: 'ServerCall helper (getDriverSponsorMappings)',
                        success: true,
                        status: serverCallResponse.status,
                        data: data
                    });
                    console.log('ServerCall helper success:', data);
                } else {
                    testResults.push({
                        url: 'ServerCall helper (getDriverSponsorMappings)',
                        success: false,
                        status: serverCallResponse?.status || 'Unknown',
                        error: 'ServerCall failed'
                    });
                }
            } catch (serverCallError) {
                testResults.push({
                    url: 'ServerCall helper (getDriverSponsorMappings)',
                    success: false,
                    error: serverCallError.message
                });
                console.log('ServerCall helper error:', serverCallError.message);
            }

            setTestResults({
                success: testResults.some(r => r.success),
                testResults: testResults,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Test error:', error);
            setTestResults({
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    };
    */

    const fetchSponsorNames = async (sponsorIds) => {
        try {
            const response = await getAllSponsors();
            if (response.ok) {
                const allSponsors = await response.json();
                console.log('DriverProfile - All sponsors:', allSponsors); // Debug log
                
                const sponsorNameMap = {};
                sponsorIds.forEach(sponsorId => {
                    const sponsor = allSponsors.find(s => s.SponsorID === sponsorId);
                    sponsorNameMap[sponsorId] = sponsor ? sponsor.Name : `Unknown Sponsor (${sponsorId})`;
                });
                
                setSponsorNames(sponsorNameMap);
            }
        } catch (error) {
            console.error('Error fetching sponsor names:', error);
        }
    };

    const handleSponsorChange = (index) => {
        console.log(`DriverProfile - Sponsor selection changed to index: ${index}`);
        setSelectedMappingIndex(index);
        
        // Fetch points history for the newly selected mapping
        const selectedMapping = allDriverMappings[index];
        console.log(`DriverProfile - Selected mapping:`, selectedMapping);
        
        if (selectedMapping && selectedMapping.MappingID !== undefined && selectedMapping.MappingID !== null) {
            console.log(`DriverProfile - Fetching points history for MappingID: ${selectedMapping.MappingID}`);
            fetchPointsHistory(selectedMapping.MappingID);
        } else {
            console.error('DriverProfile - No valid MappingID found for selected mapping:', selectedMapping);
            setPointsHistory([]);
        }
    };

    const getCurrentMapping = () => {
        return allDriverMappings[selectedMappingIndex] || null;
    };

    useEffect(() => {
        checkLastLogin();
        fetchDriverInfo();
    }, [fetchDriverInfo]);

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

    const getTimeSinceLastLogin = (lastLoginDate) => {
        const now = new Date();
        const diffTime = Math.abs(now - lastLoginDate);
        const diffMonths = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 30.44)); // Average days per month
        
        if (diffMonths >= 12) {
            const years = Math.floor(diffMonths / 12);
            const remainingMonths = diffMonths % 12;
            return years === 1 
                ? `over 1 year${remainingMonths > 0 ? ` and ${remainingMonths} month${remainingMonths > 1 ? 's' : ''}` : ''}`
                : `over ${years} years${remainingMonths > 0 ? ` and ${remainingMonths} month${remainingMonths > 1 ? 's' : ''}` : ''}`;
        } else {
            return `${diffMonths} month${diffMonths !== 1 ? 's' : ''}`;
        }
    };

    const getUserTypeString = (userType) => {
        switch (userType) {
            case 1: return 'Driver';
            case 2: return 'Sponsor';
            case 3: return 'Admin';
            default: return `Unknown (${userType})`;
        }
    };

    const userInfo = getUserInfo();

    const formatDateTime = (dateTimeString) => {
        if (!dateTimeString) return 'No date recorded';
        
        try {
            const date = new Date(dateTimeString);
            return date.toLocaleString();
        } catch (error) {
            return 'Invalid date';
        }
    };

    const formatPointChange = (pointChange) => {
        if (pointChange > 0) {
            return `+${pointChange}`;
        }
        return pointChange.toString();
    };

    const getPointChangeClass = (pointChange) => {
        if (pointChange > 0) {
            return 'text-success'; // Green for positive
        } else if (pointChange < 0) {
            return 'text-danger'; // Red for negative
        }
        return 'text-muted'; // Gray for zero
    };

    const generatePointsDescription = (pointChange, eventTime) => {
        if (!pointChange) return 'No change recorded';
        
        if (pointChange > 0) {
            return `Points awarded (+${pointChange})`;
        } else if (pointChange < 0) {
            return `Points deducted (${pointChange})`;
        } else {
            return 'Points adjustment (0)';
        }
    };

    return (
        <div>
            {DriverNavbar()}

            <div className="container mt-4">
                <h2>Driver Profile</h2>

                {/* Tab Navigation */}
                <ul className="nav nav-tabs mb-4">
                    <li className="nav-item">
                        <button
                            className={`nav-link ${activeTab === 'profile' ? 'active' : ''}`}
                            onClick={() => setActiveTab('profile')}
                        >
                            Profile
                        </button>
                    </li>
                    <li className="nav-item">
                        <button
                            className={`nav-link ${activeTab === 'points' ? 'active' : ''} position-relative`}
                            onClick={() => setActiveTab('points')}
                        >
                            Points History
                            {pointsHistory.length > 0 && (
                                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                                    {pointsHistory.length}
                                    <span className="visually-hidden">points history records</span>
                                </span>
                            )}
                        </button>
                    </li>
                    <li className="nav-item">
                        <button
                            className={`nav-link ${activeTab === 'password' ? 'active' : ''}`}
                            onClick={() => setActiveTab('password')}
                        >
                            Change Password
                        </button>
                    </li>
                </ul>

                {/* Tab Content */}
                {activeTab === 'profile' && (
                    <>
                        {/* User Information Section from Sprint7 */}
                        {userInfo && (
                            <div className="card mb-4">
                                <div className="card-header">
                                    <h4 className="mb-0">
                                        <i className="fas fa-user me-2"></i>
                                        Current User Information
                                    </h4>
                                </div>
                                <div className="card-body">
                                    <div className="row">
                                        <div className="col-md-6">
                                            <p><strong>Name:</strong> {userInfo.FirstName} {userInfo.LastName}</p>
                                            <p><strong>Email:</strong> {userInfo.Email}</p>
                                            <p><strong>User Type:</strong> {getUserTypeString(userInfo.UserType)}</p>
                                        </div>
                                        <div className="col-md-6">
                                            {driverInfoLoading ? (
                                                <p><em>Loading driver information...</em></p>
                                            ) : driverInfo && allDriverMappings.length > 0 ? (
                                                <>
                                                    {/* Sponsor Selector - always show dropdown */}
                                                    <div className="mb-3">
                                                        <label className="form-label"><strong>Current Sponsor:</strong></label>
                                                        <select 
                                                            className="form-select"
                                                            value={selectedMappingIndex}
                                                            onChange={(e) => handleSponsorChange(parseInt(e.target.value))}
                                                        >
                                                            {allDriverMappings.map((mapping, index) => {
                                                                const sponsorName = mapping.SponsorName || sponsorNames[mapping.SponsorID] || `Sponsor ID: ${mapping.SponsorID}`;
                                                                console.log(`Rendering option ${index}: ${sponsorName} (SponsorID: ${mapping.SponsorID})`);
                                                                return (
                                                                    <option key={mapping.mappingKey || `${mapping.DriverID}-${index}`} value={index}>
                                                                        {sponsorName} (Points: {mapping.Points || 0})
                                                                    </option>
                                                                );
                                                            })}
                                                        </select>
                                                        <small className="form-text text-muted">
                                                            Showing {allDriverMappings.length} sponsor relationship{allDriverMappings.length !== 1 ? 's' : ''}
                                                        </small>
                                                    </div>
                                                    
                                                    <p><strong>Current Points:</strong> {getCurrentMapping()?.Points || 0}</p>
                                                    
                                                    {allDriverMappings.length > 1 && (
                                                        <div className="alert alert-info mt-2">
                                                            <small>
                                                                <i className="fas fa-info-circle me-2"></i>
                                                                You have relationships with {allDriverMappings.length} sponsors. 
                                                                Use the dropdown above to switch between them and view different point balances.
                                                            </small>
                                                        </div>
                                                    )}
                                                </>
                                            ) : driverInfo ? (
                                                <div className="alert alert-warning">
                                                    <p><strong>Driver record found but no active sponsor relationships.</strong></p>
                                                    <p className="small">Your driver record exists but you don't have any accepted sponsor applications. Contact your administrator to set up sponsor relationships.</p>
                                                </div>
                                            ) : (
                                                <div className="alert alert-info">
                                                    <p><strong>No driver record found.</strong></p>
                                                    <p className="small">Your user account (UserID: {userInfo.UserID}) is not associated with a driver record. Contact your administrator or use the Testing page to create a driver entry.</p>
                                                </div>
                                            )}
                                            {showPasswordChangeButton && (
                                                <div className="alert alert-warning mt-2">
                                                    <i className="fas fa-exclamation-triangle me-2"></i>
                                                    <strong>Security Notice:</strong>
                                                    <p className="mb-2 mt-1">
                                                        {userInfo.LastLogin 
                                                            ? `It has been ${getTimeSinceLastLogin(new Date(userInfo.LastLogin))} since your last login.`
                                                            : 'We have no record of your last login.'
                                                        }
                                                        <br />
                                                        We recommend updating your password for security.
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Remove the entire legacy driver section that shows the warning */}
                    </>
                )}

                {activeTab === 'points' && (
                    <div>
                        <h5>Points History</h5>
                        
                        {driverInfoLoading ? (
                            <div className="text-center">
                                <div className="spinner-border" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                </div>
                                <p>Loading driver information...</p>
                            </div>
                        ) : !driverInfo || allDriverMappings.length === 0 ? (
                            <div className="alert alert-info">
                                <i className="fas fa-info-circle me-2"></i>
                                No driver record or sponsor relationships found. Points history is not available.
                            </div>
                        ) : (
                            <>
                                {/* Sponsor Selector */}
                                <div className="mb-3">
                                    <label className="form-label"><strong>Select Sponsor:</strong></label>
                                    <select 
                                        className="form-select"
                                        value={selectedMappingIndex}
                                        onChange={(e) => handleSponsorChange(parseInt(e.target.value))}
                                    >
                                        {allDriverMappings.map((mapping, index) => {
                                            const sponsorName = mapping.SponsorName || sponsorNames[mapping.SponsorID] || `Sponsor ID: ${mapping.SponsorID}`;
                                            return (
                                                <option key={mapping.mappingKey || `${mapping.DriverID}-${index}`} value={index}>
                                                    {sponsorName} (Current Points: {mapping.Points || 0})
                                                </option>
                                            );
                                        })}
                                    </select>
                                </div>

                                {/* Points History Table */}
                                {pointsHistoryLoading ? (
                                    <div className="text-center">
                                        <div className="spinner-border spinner-border-sm" role="status">
                                            <span className="visually-hidden">Loading...</span>
                                        </div>
                                        <p>Loading points history...</p>
                                    </div>
                                ) : pointsHistory.length === 0 ? (
                                    <div className="alert alert-info">
                                        <i className="fas fa-info-circle me-2"></i>
                                        No points history found for this sponsor relationship.
                                    </div>
                                ) : (
                                    <div className="card">
                                        <div className="card-header">
                                            <h6 className="mb-0">
                                                <i className="fas fa-history me-2"></i>
                                                Points Change History ({pointsHistory.length} records)
                                            </h6>
                                        </div>
                                        <div className="card-body p-0">
                                            <div className="table-responsive">
                                                <table className="table table-striped table-hover mb-0">
                                                    <thead className="thead-dark">
                                                        <tr>
                                                            <th scope="col" className="text-center">#</th>
                                                            <th scope="col">Date & Time</th>
                                                            <th scope="col" className="text-center">Points Change</th>
                                                            <th scope="col">Description</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {pointsHistory.map((record, index) => (
                                                            <tr key={record.PointChangeID || index}>
                                                                <td className="text-center text-muted">
                                                                    <small>{index + 1}</small>
                                                                </td>
                                                                <td>
                                                                    <span className="fw-normal">
                                                                        {formatDateTime(record.EventTime)}
                                                                    </span>
                                                                </td>
                                                                <td className={`text-center fw-bold ${getPointChangeClass(record.PointChange)}`}>
                                                                    {formatPointChange(record.PointChange)}
                                                                </td>
                                                                <td>
                                                                    <span className="text-muted">
                                                                        {generatePointsDescription(record.PointChange, record.EventTime)}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}

                {activeTab === 'password' && (
                    <div>
                        <h5>Change Password</h5>
                        <div className="row">
                            <div className="col-md-6">
                                <HelperPasswordChange UserID={userInfo?.UserID ?? 4} />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}