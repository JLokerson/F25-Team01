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
    const [sponsorName, setSponsorName] = useState(null);
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
        console.log('DriverProfile - UserInfo:', userInfo); // Debug log
        if (userInfo && userInfo.UserID) {
            try {
                const response = await getAllDrivers();
                if (response.ok) {
                    const allDrivers = await response.json();
                    console.log('DriverProfile - All drivers:', allDrivers); // Debug log
                    console.log('DriverProfile - Looking for UserID:', userInfo.UserID, 'Type:', typeof userInfo.UserID); // Debug log
                    
                    // Log each driver's UserID for comparison
                    allDrivers.forEach((driver, index) => {
                        console.log(`DriverProfile - Driver ${index} UserID:`, driver.UserID, 'Type:', typeof driver.UserID);
                    });
                    
                    const currentDriverInfo = allDrivers.find(d => Number(d.UserID) === Number(userInfo.UserID));
                    console.log('DriverProfile - Current driver info:', currentDriverInfo); // Debug log
                    setDriverInfo(currentDriverInfo || false); // Set to false if not found
                    
                    // Fetch sponsor name if we have driver info
                    if (currentDriverInfo && currentDriverInfo.SponsorID) {
                        fetchSponsorName(currentDriverInfo.SponsorID);
                    }
                }
            } catch (error) {
                console.error('Error fetching driver info:', error);
                setDriverInfo(false);
            } finally {
                setDriverInfoLoading(false);
            }
        } else {
            setDriverInfoLoading(false);
        }
    };

    const fetchSponsorName = async (sponsorID) => {
        try {
            const response = await getAllSponsors();
            if (response.ok) {
                const allSponsors = await response.json();
                console.log('DriverProfile - All sponsors:', allSponsors); // Debug log
                const sponsor = allSponsors.find(s => s.SponsorID === sponsorID);
                console.log('DriverProfile - Found sponsor:', sponsor); // Debug log
                setSponsorName(sponsor ? sponsor.Name : null);
            }
        } catch (error) {
            console.error('Error fetching sponsor name:', error);
        }
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
                                            <p><strong>User ID:</strong> {userInfo.UserID}</p>
                                            <p><strong>Name:</strong> {userInfo.FirstName} {userInfo.LastName}</p>
                                            <p><strong>Email:</strong> {userInfo.Email}</p>
                                            <p><strong>User Type:</strong> {getUserTypeString(userInfo.UserType)}</p>
                                        </div>
                                        <div className="col-md-6">
                                            {driverInfoLoading ? (
                                                <p><em>Loading driver information...</em></p>
                                            ) : driverInfo ? (
                                                <>
                                                    <p><strong>Driver ID:</strong> {driverInfo.DriverID}</p>
                                                    <p><strong>Sponsor ID:</strong> {driverInfo.SponsorID}{sponsorName ? ` (${sponsorName})` : ''}</p>
                                                    <p><strong>Points:</strong> {driverInfo.Points || 0}</p>
                                                </>
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