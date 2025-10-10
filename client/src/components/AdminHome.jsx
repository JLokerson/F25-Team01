import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Link } from 'react-router-dom';
import AdminNavbar from './AdminNavbar';
import PasswordChangeModal from './PasswordChangeModal';

export default function AdminHome() {
    const [showPasswordModal, setShowPasswordModal] = useState(false);

    useEffect(() => {
        // Check if we should show password change suggestion
        const suggestPasswordChange = localStorage.getItem('suggestPasswordChange') === 'true';
        const reminderDate = localStorage.getItem('passwordChangeReminder');
        
        if (suggestPasswordChange) {
            // Check if we're past the reminder date (if user chose "remind later")
            if (reminderDate) {
                const now = new Date();
                const remind = new Date(reminderDate);
                if (now >= remind) {
                    setShowPasswordModal(true);
                    localStorage.removeItem('passwordChangeReminder');
                }
            } else {
                // First time showing the modal
                setShowPasswordModal(true);
            }
        }
        
        // Clear the suggestion flag after checking
        localStorage.removeItem('suggestPasswordChange');
    }, []);

    const handleClosePasswordModal = () => {
        setShowPasswordModal(false);
    };

    return (
        <div>
            <AdminNavbar />
            <div className="container mt-4">
                <div className="row">
                    <div className="col-md-12">
                        <p className="mb-2">
                            <i className="fas fa-user-shield me-2"></i>
                            <strong>You are logged in as: Admin</strong>
                        </p>
                        <h2>Admin Dashboard</h2>
                        {/* Impostor mode controls moved to navbar */}
                    </div>
                </div>
            </div>
            
            <PasswordChangeModal 
                show={showPasswordModal} 
                onClose={handleClosePasswordModal} 
            />
        </div>
    );
}