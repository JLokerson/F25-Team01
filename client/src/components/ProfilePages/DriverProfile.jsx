import React, { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import DriverNavbar from '../DriverNavbar';
import HelperPasswordChange from './HelperPasswordChange';
import { CookiesProvider, useCookies } from 'react-cookie';
import { getAllSponsors, getAllDrivers, getDriverSponsorMappings } from '../MiscellaneousParts/ServerCall';

export default function DriverProfile() {
    const [cookies, setCookie] = useCookies(['driverinfo']);
    const [activeTab, setActiveTab] = useState('profile'); // tab state
    const [showPasswordChangeButton, setShowPasswordChangeButton] = useState(false);
    const [driverInfo, setDriverInfo] = useState(null);
    const [allDriverMappings, setAllDriverMappings] = useState([]);
    const [selectedMappingIndex, setSelectedMappingIndex] = useState(0);
    const [sponsorNames, setSponsorNames] = useState({});
    const [driverInfoLoading, setDriverInfoLoading] = useState(true);
    const [testResults, setTestResults] = useState(null);

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

    const fetchDriverInfo = async () => {
        const userInfo = getUserInfo();
        console.log('DriverProfile - UserInfo:', userInfo);
        if (userInfo && userInfo.UserID) {
            try {
                // Try the new API endpoint using the ServerCall helper
                console.log('DriverProfile - Attempting to use getDriverSponsorMappings...');
                const response = await getDriverSponsorMappings(userInfo.UserID);
                
                if (response && response.ok) {
                    const mappingsData = await response.json();
                    console.log('DriverProfile - GetDriverInfoSpecific response:', mappingsData);
                    
                    // Handle the response structure - could be from stored procedure or fallback
                    let allMappings = mappingsData;
                    
                    // The stored procedure returns results in a nested array format
                    // But the fallback returns a flat array directly
                    if (Array.isArray(mappingsData) && mappingsData.length > 0) {
                        // Check if the first element is an array (nested structure from stored procedure)
                        if (Array.isArray(mappingsData[0])) {
                            allMappings = mappingsData[0];
                        }
                        // If it's already a flat array of objects, use it as-is (fallback case)
                        else if (typeof mappingsData[0] === 'object' && mappingsData[0].hasOwnProperty('DriverID')) {
                            allMappings = mappingsData;
                        }
                    }
                    
                    console.log('DriverProfile - Processed mappings:', allMappings);
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
                        // Each mapping represents a different sponsor relationship
                        const transformedMappings = allMappings.map((mapping, index) => {
                            console.log(`DriverProfile - Processing mapping ${index + 1}:`, mapping);
                            return {
                                DriverID: mapping.DriverID,
                                SponsorID: mapping.SponsorID,
                                Points: mapping.Points || 0,
                                UserID: mapping.UserID,
                                FirstName: mapping.FirstName,
                                LastName: mapping.LastName,
                                Email: mapping.Email,
                                // Handle sponsor name from either stored procedure response or need to fetch separately
                                SponsorName: mapping.Name || null,
                                PointRatio: mapping.PointRatio || '0.01',
                                // Add a unique key to help with dropdown rendering
                                mappingKey: `${mapping.UserID}-${mapping.SponsorID}`
                            };
                        });
                        
                        console.log('DriverProfile - Transformed mappings:', transformedMappings);
                        console.log('DriverProfile - Setting', transformedMappings.length, 'mappings in state');
                        setAllDriverMappings(transformedMappings);
                        
                        // Create sponsor name mapping from the response data or fetch sponsor names
                        const sponsorNameMap = {};
                        const sponsorIdsToFetch = [];
                        
                        allMappings.forEach(mapping => {
                            if (mapping.Name) {
                                // If sponsor name is already in the response (from stored procedure)
                                sponsorNameMap[mapping.SponsorID] = mapping.Name;
                                console.log(`DriverProfile - Added sponsor mapping from response: ${mapping.SponsorID} -> ${mapping.Name}`);
                            } else {
                                // If sponsor name is not in response, we need to fetch it
                                sponsorIdsToFetch.push(mapping.SponsorID);
                            }
                        });
                        
                        setSponsorNames(sponsorNameMap);
                        
                        // If we need to fetch sponsor names separately (fallback case)
                        if (sponsorIdsToFetch.length > 0) {
                            console.log('DriverProfile - Fetching sponsor names for IDs:', sponsorIdsToFetch);
                            await fetchSponsorNames(sponsorIdsToFetch);
                        } else {
                            console.log('DriverProfile - All sponsor names already available from response');
                        }
                        
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
    };

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
        setSelectedMappingIndex(index);
    };

    const getCurrentMapping = () => {
        return allDriverMappings[selectedMappingIndex] || null;
    };

    useEffect(() => {
        checkLastLogin();
        fetchDriverInfo();

        return () => {
            // Cleanup if needed
        };
    }, []);

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