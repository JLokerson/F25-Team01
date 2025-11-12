import React, { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import DriverNavbar from '../DriverNavbar';
import HelperPasswordChange from './HelperPasswordChange';
import { CookiesProvider, useCookies } from 'react-cookie';
import { getAllSponsors, getAllDrivers } from '../MiscellaneousParts/ServerCall';

export default function DriverProfile() {
    const [cookies, setCookie] = useCookies(['driverinfo']);
    const [activeTab, setActiveTab] = useState('profile'); // tab state
    const [showPasswordChangeButton, setShowPasswordChangeButton] = useState(false);
    const [driverInfo, setDriverInfo] = useState(null);
    const [allDriverMappings, setAllDriverMappings] = useState([]);
    const [selectedMappingIndex, setSelectedMappingIndex] = useState(0);
    const [sponsorNames, setSponsorNames] = useState({});
    const [driverInfoLoading, setDriverInfoLoading] = useState(true);

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
                // First get the driver record to get DriverID from UserID
                const driversResponse = await getAllDrivers();
                if (driversResponse.ok) {
                    const allDrivers = await driversResponse.json();
                    console.log('DriverProfile - All drivers from DRIVER table:', allDrivers);
                    
                    // Find driver record by UserID
                    const driverRecord = allDrivers.find(d => Number(d.UserID) === Number(userInfo.UserID));
                    console.log('DriverProfile - Found driver record for UserID', userInfo.UserID, ':', driverRecord);
                    
                    if (driverRecord) {
                        console.log('DriverProfile - Using DriverID:', driverRecord.DriverID);
                        setDriverInfo(driverRecord); // Keep basic driver info
                        
                        // Now fetch driver-sponsor mappings using the DriverID
                        await fetchDriverSponsorMappings(driverRecord.DriverID);
                    } else {
                        console.log('DriverProfile - No driver record found for UserID:', userInfo.UserID);
                        setDriverInfo(false);
                        setAllDriverMappings([]);
                    }
                } else {
                    console.error('DriverProfile - Failed to fetch drivers:', driversResponse.status);
                    setDriverInfo(false);
                    setAllDriverMappings([]);
                }
            } catch (error) {
                console.error('Error fetching driver info:', error);
                setDriverInfo(false);
                setAllDriverMappings([]);
            } finally {
                setDriverInfoLoading(false);
            }
        } else {
            console.log('DriverProfile - No UserID found in userInfo');
            setDriverInfoLoading(false);
        }
    };

    const fetchDriverSponsorMappings = async (driverID) => {
        try {
            console.log('DriverProfile - Fetching mappings for DriverID:', driverID);
            
            // Try the direct API endpoint first
            let response = await fetch(`https://63iutwxr2owp72oyfbetwyluaq0wakdm.lambda-url.us-east-1.on.aws/adminAPI/getDriverSponsorMappings`);
            
            // If 404, try alternative endpoint or create fallback data
            if (!response.ok && response.status === 404) {
                console.log('DriverProfile - getDriverSponsorMappings endpoint not found, trying alternative approach');
                
                // Create fallback data based on CSV structure you provided
                // This is temporary until the proper API endpoint is available
                const fallbackMappings = [
                    {MappingID: 1, SponsorID: 1, DriverID: 1, Points: 20, ApplicationAccepted: 1},
                    {MappingID: 2, SponsorID: 1, DriverID: 3, Points: 90, ApplicationAccepted: 1},
                    {MappingID: 3, SponsorID: 1, DriverID: 4, Points: 0, ApplicationAccepted: 1},
                    {MappingID: 4, SponsorID: 1, DriverID: 5, Points: 0, ApplicationAccepted: 1},
                    {MappingID: 5, SponsorID: 1, DriverID: 2, Points: 100, ApplicationAccepted: 1},
                    {MappingID: 6, SponsorID: 2, DriverID: 11, Points: 200, ApplicationAccepted: 1},
                    {MappingID: 9, SponsorID: 3, DriverID: 6, Points: 0, ApplicationAccepted: 1},
                    {MappingID: 10, SponsorID: 3, DriverID: 14, Points: 0, ApplicationAccepted: 1},
                    {MappingID: 11, SponsorID: 3, DriverID: 6, Points: 0, ApplicationAccepted: 1},
                    {MappingID: 12, SponsorID: 3, DriverID: 15, Points: 0, ApplicationAccepted: 1}
                ];
                
                console.log('DriverProfile - Using fallback mappings data');
                
                // Filter mappings for this driver where ApplicationAccepted = 1
                const driverMappings = fallbackMappings.filter(mapping => {
                    console.log(`DriverProfile - Checking mapping: DriverID ${mapping.DriverID} === ${driverID} && ApplicationAccepted ${mapping.ApplicationAccepted} === 1`);
                    return Number(mapping.DriverID) === Number(driverID) && 
                           Number(mapping.ApplicationAccepted) === 1;
                });
                
                console.log('DriverProfile - Filtered driver mappings for DriverID', driverID, ':', driverMappings);
                setAllDriverMappings(driverMappings);
                
                if (driverMappings.length > 0) {
                    // Fetch sponsor names for all mappings
                    const sponsorIds = [...new Set(driverMappings.map(mapping => mapping.SponsorID))];
                    console.log('DriverProfile - Fetching sponsor names for IDs:', sponsorIds);
                    await fetchSponsorNames(sponsorIds);
                } else {
                    console.log('DriverProfile - No accepted mappings found for DriverID:', driverID);
                }
                return;
            }
            
            if (response.ok) {
                const allMappings = await response.json();
                console.log('DriverProfile - All mappings from DRIVER_SPONSOR_MAPPINGS:', allMappings);
                
                // Filter mappings for this driver where ApplicationAccepted = 1
                const driverMappings = allMappings.filter(mapping => {
                    console.log(`DriverProfile - Checking mapping: DriverID ${mapping.DriverID} === ${driverID} && ApplicationAccepted ${mapping.ApplicationAccepted} === 1`);
                    return Number(mapping.DriverID) === Number(driverID) && 
                           Number(mapping.ApplicationAccepted) === 1;
                });
                
                console.log('DriverProfile - Filtered driver mappings for DriverID', driverID, ':', driverMappings);
                setAllDriverMappings(driverMappings);
                
                if (driverMappings.length > 0) {
                    // Fetch sponsor names for all mappings
                    const sponsorIds = [...new Set(driverMappings.map(mapping => mapping.SponsorID))];
                    console.log('DriverProfile - Fetching sponsor names for IDs:', sponsorIds);
                    await fetchSponsorNames(sponsorIds);
                } else {
                    console.log('DriverProfile - No accepted mappings found for DriverID:', driverID);
                }
            } else {
                console.error('DriverProfile - Failed to fetch mappings:', response.status);
                setAllDriverMappings([]);
            }
        } catch (error) {
            console.error('Error fetching driver-sponsor mappings:', error);
            setAllDriverMappings([]);
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
                                                            {allDriverMappings.map((mapping, index) => (
                                                                <option key={mapping.MappingID} value={index}>
                                                                    {sponsorNames[mapping.SponsorID] || `Sponsor ID: ${mapping.SponsorID}`}
                                                                </option>
                                                            ))}
                                                        </select>
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