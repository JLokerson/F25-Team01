import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Link } from 'react-router-dom';
import AdminNavbar from '../AdminNavbar';
import HelperPasswordChange from './HelperPasswordChange';
import { CookiesProvider, useCookies } from 'react-cookie';

export default function AdminProfile() {
    console.log('AdminProfile rendered');
    const [cookies, setCookie] = useCookies(['username', 'password']);
    const [showPasswordChangeButton, setShowPasswordChangeButton] = useState(false);
    
    // Ensure this is actually a sponsor user.
    // TO-DO: verify the login returned success and not fail, rn only checks if error.
    function VerifyLogin(){
        try{
            let userinfo = {
            "email": cookies.username,
            "password": cookies.password,
            };
            return true;
        }catch(e){
            return false;
        }
    }

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

    useEffect(() => {
        checkLastLogin();
    }, []);

    const userInfo = getUserInfo();

    const getUserTypeString = (userType) => {
        switch (userType) {
            case 1: return 'Driver';
            case 2: return 'Sponsor';
            case 3: return 'Admin';
            default: return `Unknown (${userType})`;
        }
    };

    return (
        <div>
            {AdminNavbar()}
            {/* Place profile stuff below here*/}
            
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
                                </div>
                                <div className="col-md-6">
                                    <p><strong>User Type:</strong> {getUserTypeString(userInfo.UserType)}</p>
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

            {HelperPasswordChange()}
            <p>Hey this is where you will one day see your profile, assuming you have one.</p>
        </div>
    );
}