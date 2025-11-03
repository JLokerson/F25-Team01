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
                
                {/* Admin Action Cards */}
                <div className="row mt-4">
                    <div className="col-md-4 mb-3">
                        <div className="card h-100">
                            <div className="card-body text-center">
                                <i className="fas fa-file-alt fa-3x text-primary mb-3"></i>
                                <h5 className="card-title">Driver Applications</h5>
                                <p className="card-text">Review and manage driver applications from all sponsor organizations</p>
                                <Link to="/admin-applications" className="btn btn-primary">
                                    <i className="fas fa-eye me-1"></i>View Applications
                                </Link>
                            </div>
                        </div>
                    </div>
                    
                    <div className="col-md-4 mb-3">
                        <div className="card h-100">
                            <div className="card-body text-center">
                                <i className="fas fa-user-plus fa-3x text-success mb-3"></i>
                                <h5 className="card-title">Create New User</h5>
                                <p className="card-text">Add new users to the system with different roles and permissions</p>
                                <Link to="/MakeNewUser" className="btn btn-success">
                                    <i className="fas fa-plus me-1"></i>Create User
                                </Link>
                            </div>
                        </div>
                    </div>
                    
                    <div className="col-md-4 mb-3">
                        <div className="card h-100">
                            <div className="card-body text-center">
                                <i className="fas fa-user-secret fa-3x text-warning mb-3"></i>
                                <h5 className="card-title">Impostor Mode</h5>
                                <p className="card-text">View the system from the perspective of drivers or sponsors</p>
                                <button 
                                    className="btn btn-warning"
                                    onClick={() => window.dispatchEvent(new Event('openImpostorModal'))}
                                >
                                    <i className="fas fa-mask me-1"></i>Enter Impostor Mode
                                </button>
                            </div>
                        </div>
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