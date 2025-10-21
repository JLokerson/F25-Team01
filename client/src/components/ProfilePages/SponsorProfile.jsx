import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import SponsorNavbar from '../SponsorNavbar';
import HelperPasswordChange from './HelperPasswordChange';
import sponsors from '../../content/json-assets/sponsor-user_sample.json';
import driversSeed from '../../content/json-assets/driver_sample.json';
import { CookiesProvider, useCookies } from 'react-cookie';
import { login } from '../MiscellaneousParts/ServerCall';

export default function SponsorProfile() {
    const [cookies, setCookie] = useCookies(['username', 'password']);
    const [showPasswordChangeButton, setShowPasswordChangeButton] = useState(false);
    const [sponsorInfo, setSponsorInfo] = useState(null);
    const [sponsorName, setSponsorName] = useState(null);
    
    // Ensure this is actually a sponsor user.
    // TO-DO: verify the login returned success and not fail, rn only checks if error on retrieval.
    async function VerifyLogin(){
        try{
            let userinfo = {
            "email": cookies.username,
            "password": cookies.password,
            };
            await login(userinfo);
            return true;
        }catch(e){
            return false;
        }
    }

    const [sponsor] = useState(() => {
        if (!Array.isArray(sponsors) || sponsors.length === 0) {
            return null;
        }
        // Hardcoded to the first sponsor
        return sponsors[0];
    });
    const [driversList, setDriversList] = useState([]); // Initialize as empty array instead of null
    const [editing, setEditing] = useState(null); // { driver, newPoints }

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

    const fetchSponsorInfo = async () => {
        const userInfo = getUserInfo();
        console.log('SponsorProfile - UserInfo:', userInfo); // Debug log
        if (userInfo && userInfo.UserID) {
            try {
                const response = await fetch(`http://localhost:4000/sponsorAPI/getAllSponsorUsers`);
                if (response.ok) {
                    const allSponsorUsers = await response.json();
                    console.log('SponsorProfile - All sponsor users:', allSponsorUsers); // Debug log
                    const currentSponsorInfo = allSponsorUsers.find(s => s.UserID === userInfo.UserID);
                    console.log('SponsorProfile - Current sponsor info:', currentSponsorInfo); // Debug log
                    setSponsorInfo(currentSponsorInfo);
                    
                    // Fetch sponsor name if we have sponsor info
                    if (currentSponsorInfo && currentSponsorInfo.SponsorID) {
                        fetchSponsorName(currentSponsorInfo.SponsorID);
                    }
                }
            } catch (error) {
                console.error('Error fetching sponsor info:', error);
            }
        }
    };

    const fetchSponsorName = async (sponsorID) => {
        try {
            const response = await fetch(`http://localhost:4000/sponsorAPI/getAllSponsors`);
            if (response.ok) {
                const allSponsors = await response.json();
                console.log('SponsorProfile - All sponsors:', allSponsors); // Debug log
                const sponsor = allSponsors.find(s => s.SponsorID === sponsorID);
                console.log('SponsorProfile - Found sponsor:', sponsor); // Debug log
                setSponsorName(sponsor ? sponsor.Name : null);
            }
        } catch (error) {
            console.error('Error fetching sponsor name:', error);
        }
    };

    // Load drivers from content/json-assets/driver_sample.json
    useEffect(() => {
        checkLastLogin();
        fetchSponsorInfo();
        
        let list = [];
        try { 
            const raw = localStorage.getItem('drivers'); 
            if (raw) {
                list = JSON.parse(raw); 
            }
        } catch (e) { 
            list = [];
            console.log('There are no drivers in the local storage, please check content/json-assets/driver_sample.json');
        }
        
        // Ensure list is an array
        if (!Array.isArray(list)) {
            list = [];
        }

        setDriversList(list);
    }, []);

    function openEditorFor(driverId){
        const d = driversList.find(x => Number(x.userid) === Number(driverId) || x.userid === driverId);
        if (!d) return alert('Driver not found locally');
        setEditing({ driver: d, newPoints: d.points });
    } 

    function saveEdit(){
        if (!editing) return;
        const updated = driversList.map(d => (Number(d.userid) === Number(editing.driver.userid) ? { ...d, points: Number(editing.newPoints) } : d));
        setDriversList(updated);
        try { localStorage.setItem('drivers', JSON.stringify(updated));
            // also set a short-lived key to trigger storage events in other tabs
            localStorage.setItem('drivers_last_update', JSON.stringify({ userid: editing.driver.userid, points: Number(editing.newPoints), ts: Date.now() }));
        } catch (e) { console.error('Failed to save drivers', e); }
        // notify same-tab listeners
        try{ window.dispatchEvent(new Event('driversUpdated')); } catch(e){}
        setEditing(null);
    }

    const userInfo = getUserInfo();

    if (!sponsor) {
        return (
            <div>
                {SponsorNavbar()}
                <div className="container mt-4">No sponsor data available.</div>
            </div>
        );
    }

    if(VerifyLogin){
        return (
            <div>
                {SponsorNavbar()}
                
                {/* User Information Section */}
                {userInfo && (
                    <div className="container mt-4">
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
                                        {sponsorInfo ? (
                                            <>
                                                <p><strong>Sponsor User ID:</strong> {sponsorInfo.SponsorUserID}</p>
                                                <p><strong>Sponsor ID:</strong> {sponsorInfo.SponsorID}{sponsorName ? ` (${sponsorName})` : ''}</p>
                                            </>
                                        ) : (
                                            <p><em>Loading sponsor information...</em></p>
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
                    </div>
                )}

                {HelperPasswordChange(sponsor.userid)}
            </div>
        );
    }else{
        return;
    }
}