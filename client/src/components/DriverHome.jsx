import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Link } from 'react-router-dom';
import DriverNavbar from './DriverNavbar';
import PasswordChangeModal from './PasswordChangeModal';

export default function DriverHome() {
    const [showPasswordModal, setShowPasswordModal] = useState(false);

    useEffect(() => {
        // Check if admin is in impostor mode - don't show password modal for admin impostor
        const impostorMode = localStorage.getItem('impostorMode');
        const isAdminImpostor = impostorMode && localStorage.getItem('impostorType') === 'driver';
        
        if (isAdminImpostor) {
            // Skip password modal for admin in impostor mode
            return;
        }

        // Check if user needs password change reminder
        const checkPasswordReminder = () => {
            const userString = localStorage.getItem('user');
            const reminderDate = localStorage.getItem('passwordChangeReminder');
            
            console.log('DriverHome - User data:', userString);
            console.log('DriverHome - Reminder date:', reminderDate);
            
            if (userString) {
                const user = JSON.parse(userString);
                const lastLoginDate = user.LastLogin ? new Date(user.LastLogin) : null;
                const now = new Date();
                
                console.log('DriverHome - LastLoginDate:', lastLoginDate);
                console.log('DriverHome - User object:', user);
                
                // If there's a reminder set and it's in the future, don't show modal
                if (reminderDate && new Date(reminderDate) > now) {
                    console.log('DriverHome - Reminder is set for future, skipping modal');
                    return;
                }
                
                // Check if it's been more than 3 months since last login OR if LastLogin is missing
                if (lastLoginDate) {
                    const threeMonthsAgo = new Date();
                    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
                    
                    if (lastLoginDate < threeMonthsAgo) {
                        console.log('DriverHome - LastLogin is older than 3 months, showing modal');
                        setShowPasswordModal(true);
                    }
                } else {
                    // If LastLogin is missing, show the modal (but not for admin impostor)
                    console.log('DriverHome - LastLogin is missing, showing modal');
                    setShowPasswordModal(true);
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
                
                {/* Quick access to driver features */}
                <div className="row mt-4">
                    <div className="col-md-6 mb-3">
                        <div className="card">
                            <div className="card-body">
                                <h5 className="card-title">Shopping Cart</h5>
                                <p className="card-text">View and manage items in your shopping cart.</p>
                                <Link to="/drivercart" className="btn btn-primary">Go to Cart</Link>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-6 mb-3">
                        <div className="card">
                            <div className="card-body">
                                <h5 className="card-title">Product Catalog</h5>
                                <p className="card-text">Browse available products and add them to your cart.</p>
                                <Link to="/products" className="btn btn-primary">Browse Catalog</Link>
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