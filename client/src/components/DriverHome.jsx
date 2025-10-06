import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Link } from 'react-router-dom';
import DriverNavbar from './DriverNavbar';
import PasswordChangeModal from './PasswordChangeModal';

export default function DriverHome() {
    const [showPasswordModal, setShowPasswordModal] = useState(false);

    useEffect(() => {
        // Check if user needs password change reminder
        const checkPasswordReminder = () => {
            const userString = localStorage.getItem('user');
            const reminderDate = localStorage.getItem('passwordChangeReminder');
            
            if (userString) {
                const user = JSON.parse(userString);
                const lastLoginDate = user.LastLoginDate ? new Date(user.LastLoginDate) : null;
                const now = new Date();
                
                // If there's a reminder set and it's in the future, don't show modal
                if (reminderDate && new Date(reminderDate) > now) {
                    return;
                }
                
                // Check if it's been more than 3 months since last login
                if (lastLoginDate) {
                    const threeMonthsAgo = new Date();
                    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
                    
                    if (lastLoginDate < threeMonthsAgo) {
                        setShowPasswordModal(true);
                    }
                }
            }
        };

        checkPasswordReminder();
    }, []);

    return (
        <div>
            <DriverNavbar />
            {/* Place driver home page content below here */}
            <div className="container my-5">
                <h1>Welcome to the Driver Home Page</h1>
                <p>This is where drivers can see their dashboard and relevant information.</p>
            </div>
            
            <PasswordChangeModal 
                show={showPasswordModal} 
                onClose={() => setShowPasswordModal(false)} 
            />
        </div>
    );
}