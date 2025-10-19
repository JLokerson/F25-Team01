import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Link } from 'react-router-dom';
import SponsorNavbar from './SponsorNavbar';
import PasswordChangeModal from './PasswordChangeModal';

export default function SponsorHome() {
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [showPasswordChangeButton, setShowPasswordChangeButton] = useState(false);

    // Check if admin is in impostor mode
    const impostorMode = localStorage.getItem('impostorMode');
    const isAdminImpostor = impostorMode && localStorage.getItem('impostorType') === 'sponsor';
    const sponsorOrg = localStorage.getItem('impostorSponsorOrg') || 'Generic Sponsor';

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

    useEffect(() => {
        // Check if admin is in impostor mode - don't show password modal for admin impostor
        const impostorMode = localStorage.getItem('impostorMode');
        const isAdminImpostor = impostorMode && localStorage.getItem('impostorType') === 'sponsor';
        
        if (isAdminImpostor) {
            // Skip password modal for admin in impostor mode
            return;
        }

        // Check if user needs password change reminder
        const checkPasswordReminder = () => {
            const userString = localStorage.getItem('user');
            const reminderDate = localStorage.getItem('passwordChangeReminder');
            
            console.log('SponsorHome - User data:', userString);
            console.log('SponsorHome - Reminder date:', reminderDate);
            
            if (userString) {
                const user = JSON.parse(userString);
                const lastLoginDate = user.LastLogin ? new Date(user.LastLogin) : null;
                const now = new Date();
                
                console.log('SponsorHome - LastLoginDate:', lastLoginDate);
                console.log('SponsorHome - User object:', user);
                
                // If there's a reminder set and it's in the future, don't show modal
                if (reminderDate && new Date(reminderDate) > now) {
                    console.log('SponsorHome - Reminder is set for future, skipping modal');
                    return;
                }
                
                // Check if it's been more than 3 months since last login OR if LastLogin is missing
                if (lastLoginDate) {
                    const threeMonthsAgo = new Date();
                    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
                    
                    if (lastLoginDate < threeMonthsAgo) {
                        console.log('SponsorHome - LastLogin is older than 3 months, showing modal');
                        setShowPasswordModal(true);
                        setShowPasswordChangeButton(true);
                    }
                } else {
                    // If LastLogin is missing, show the modal (but not for admin impostor)
                    console.log('SponsorHome - LastLogin is missing, showing modal');
                    setShowPasswordModal(true);
                    setShowPasswordChangeButton(true);
                }
            }
        };

        checkPasswordReminder();
    }, []);

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
            <SponsorNavbar />
            
            {/* User Information Section */}
            {userInfo && !isAdminImpostor && (
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

            {/* Place sponsor home page content below here */}
            <div className="container my-5">
                <p className="mb-3">
                    <i className="fas fa-handshake me-2"></i>
                    <strong>
                        You are logged in as: Sponsor
                        {isAdminImpostor && (
                            <span className="badge bg-warning text-dark ms-2">
                                (Admin Impostor Mode - {sponsorOrg})
                            </span>
                        )}
                    </strong>
                </p>
                <h1>Welcome to the Sponsor Home Page</h1>
                <p>This is where sponsors can manage their drivers and catalog.</p>
                
                {/* Quick access to sponsor features */}
                <div className="row mt-4">
                    <div className="col-md-6 mb-3">
                        <div className="card">
                            <div className="card-body">
                                <h5 className="card-title">Driver Management</h5>
                                <p className="card-text">Manage your drivers and their accounts.</p>
                                <Link to="#" className="btn btn-primary">Manage Drivers</Link>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-6 mb-3">
                        <div className="card">
                            <div className="card-body">
                                <h5 className="card-title">Catalog Management</h5>
                                <p className="card-text">Manage your product catalog and pricing.</p>
                                <Link to="#" className="btn btn-primary">Manage Catalog</Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <PasswordChangeModal 
                show={showPasswordModal} 
                onClose={() => setShowPasswordModal(false)} 
            />
        </div>
    );
}