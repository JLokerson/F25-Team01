import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Link } from 'react-router-dom';
import AdminNavbar from './AdminNavbar';
import PasswordChangeModal from './PasswordChangeModal';
import ImpostorModeModal from './ImpostorModeModal';

export default function AdminHome() {
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [showImpostorModal, setShowImpostorModal] = useState(false);
    const [impostorMode, setImpostorMode] = useState(localStorage.getItem('impostorMode') || null);

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

        // Listen for impostor mode trigger from navbar
        const handleOpenImpostorModal = () => {
            setShowImpostorModal(true);
        };

        // Listen for impostor mode state changes
        const handleImpostorModeChange = () => {
            setImpostorMode(localStorage.getItem('impostorMode') || null);
        };

        window.addEventListener('openImpostorModal', handleOpenImpostorModal);
        window.addEventListener('storage', handleImpostorModeChange);

        return () => {
            window.removeEventListener('openImpostorModal', handleOpenImpostorModal);
            window.removeEventListener('storage', handleImpostorModeChange);
        };
    }, []);

    const handleClosePasswordModal = () => {
        setShowPasswordModal(false);
    };

    const handleOpenImpostorModal = () => {
        setShowImpostorModal(true);
    };

    const handleCloseImpostorModal = () => {
        setShowImpostorModal(false);
    };

    const handleExitImpostorMode = () => {
        localStorage.removeItem('impostorMode');
        localStorage.removeItem('impostorType');
        localStorage.removeItem('impostorSponsorOrg');
        setImpostorMode(null);
        // Don't reload the page, just update the state
    };

    const handleImpostorModeSet = (type, sponsorOrg = null) => {
        localStorage.setItem('impostorMode', 'true');
        localStorage.setItem('impostorType', type);
        if (sponsorOrg) {
            localStorage.setItem('impostorSponsorOrg', sponsorOrg);
        }
        setImpostorMode('true');
        setShowImpostorModal(false);
        window.location.reload(); // Refresh to update navbar
    };

    return (
        <div>
            <AdminNavbar />
            <div className="container mt-4">
                <div className="row">
                    <div className="col-md-12">
                        <h2>Admin Dashboard</h2>
                        
                        <div className="card mt-4">
                            <div className="card-body">
                                <h5 className="card-title">Troubleshooting Tools</h5>
                                <p className="card-text">Use impostor mode to troubleshoot user issues by experiencing the application as they would.</p>
                                
                                {!impostorMode ? (
                                    <button 
                                        className="btn btn-warning me-2" 
                                        onClick={handleOpenImpostorModal}
                                    >
                                        Enter Impostor Mode
                                    </button>
                                ) : (
                                    <div>
                                        <span className="badge bg-warning text-dark me-2 mb-2">
                                            Active: {localStorage.getItem('impostorType') === 'driver' ? 'Driver Mode' : 'Sponsor Mode'}
                                        </span>
                                        <br />
                                        <button 
                                            className="btn btn-secondary me-2" 
                                            onClick={handleOpenImpostorModal}
                                        >
                                            Switch Mode
                                        </button>
                                        <button 
                                            className="btn btn-danger" 
                                            onClick={handleExitImpostorMode}
                                        >
                                            Exit Impostor Mode
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <PasswordChangeModal 
                show={showPasswordModal} 
                onClose={handleClosePasswordModal} 
            />
            
            <ImpostorModeModal
                show={showImpostorModal}
                onClose={handleCloseImpostorModal}
                onSetImpostorMode={handleImpostorModeSet}
            />
        </div>
    );
}