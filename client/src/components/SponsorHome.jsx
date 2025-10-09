import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Link } from 'react-router-dom';
import SponsorNavbar from './SponsorNavbar';
import PasswordChangeModal from './PasswordChangeModal';

export default function SponsorHome() {
    const [showPasswordModal, setShowPasswordModal] = useState(false);

    useEffect(() => {
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
                    }
                } else {
                    // If LastLogin is missing, show the modal (useful for admin assuming identity)
                    console.log('SponsorHome - LastLogin is missing, showing modal');
                    setShowPasswordModal(true);
                }
            }
        };

        checkPasswordReminder();
    }, []);

    return (
        <div>
            <SponsorNavbar />
            {/* Place sponsor home page content below here */}
            
            <PasswordChangeModal 
                show={showPasswordModal} 
                onClose={() => setShowPasswordModal(false)} 
            />
        </div>
    );
}