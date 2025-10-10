import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../App.css';
import { Link, useNavigate } from 'react-router-dom';
import DriverNavbar from './DriverNavbar';
import SponsorNavbar from './SponsorNavbar';
import ImpostorModeModal from './ImpostorModeModal';

export default function AdminNavbar() {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const firstName = user?.FirstName || 'Admin';
    
    const [showImpostorModal, setShowImpostorModal] = useState(false);
    const [impostorMode, setImpostorMode] = useState(localStorage.getItem('impostorMode') || null);
    
    // Check if admin is in impostor mode
    const impostorType = localStorage.getItem('impostorType');

    useEffect(() => {
        // Listen for impostor mode state changes
        const handleImpostorModeChange = () => {
            setImpostorMode(localStorage.getItem('impostorMode') || null);
        };

        // Listen for switch impostor mode requests from other navbars
        const handleOpenImpostorModal = () => {
            setShowImpostorModal(true);
        };

        // Check impostor mode on mount
        setImpostorMode(localStorage.getItem('impostorMode') || null);

        window.addEventListener('storage', handleImpostorModeChange);
        window.addEventListener('openImpostorModal', handleOpenImpostorModal);

        return () => {
            window.removeEventListener('storage', handleImpostorModeChange);
            window.removeEventListener('openImpostorModal', handleOpenImpostorModal);
        };
    }, []);

    // If in impostor mode, render the appropriate navbar
    if (impostorMode) {
        if (impostorType === 'driver') {
            return <DriverNavbar />;
        } else if (impostorType === 'sponsor') {
            return <SponsorNavbar />;
        }
    }

    // prevent navigation back to protected pages after logout
    const handleLogout = () => {
        localStorage.removeItem('user');
        // Clear impostor mode on logout
        localStorage.removeItem('impostorMode');
        localStorage.removeItem('impostorType');
        localStorage.removeItem('impostorSponsorOrg');
        // Prevent back navigation after logout
        window.history.pushState(null, '', window.location.href);
        window.onpopstate = function () {
            window.history.go(1);
        };
        navigate('/', { replace: true });
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
        // Force component re-render to show admin navbar
    };

    const handleImpostorModeSet = (type, sponsorOrg = null) => {
        localStorage.setItem('impostorMode', 'true');
        localStorage.setItem('impostorType', type);
        if (sponsorOrg) {
            localStorage.setItem('impostorSponsorOrg', sponsorOrg);
        }
        setImpostorMode('true');
        setShowImpostorModal(false);
        // Don't reload here - navigation is handled in the modal
    };

    const navbarStyle = {
        backgroundColor: '#ff8c00'
    };

    const textStyle = {
        color: '#000000 !important',
        fontWeight: '600'
    };

    const brandStyle = {
        color: '#000000 !important',
        fontWeight: 'bold'
    };

    return (
        <>
            <nav className="admin-navbar navbar navbar-expand-lg navbar-light" style={navbarStyle}>
                <div className="container-fluid">
                    <Link className="navbar-brand d-flex align-items-center" to="/adminhome" style={brandStyle}>
                        <img src="https://wallpaperaccess.com/full/2723826.jpg" alt="Network Drivers" className="navbar-logo me-2" style={{width: '40px', height: '40px', objectFit: 'cover'}} />
                        <span className="fw-bold">Admin Home</span>
                    </Link>
                    <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
                        <span className="navbar-toggler-icon"></span>
                    </button>

                    <div className="collapse navbar-collapse" id="navbarSupportedContent">
                        <ul className="navbar-nav me-auto mb-2 mb-lg-0">
                            <li className="nav-item">
                                <Link className="nav-link" to="/adminhome" style={textStyle}>Home</Link>
                            </li>
                            <li className="nav-item">
                                <Link className="nav-link" to="/adminprofile" style={textStyle}>Profile</Link>
                            </li>
                            <li className="nav-item">
                                <Link className="nav-link" to="#" style={textStyle}>User Management</Link>
                            </li>
                            <li className="nav-item">
                                <Link className="nav-link" to="/MakeNewUser" style={textStyle}>Make New User</Link>
                            </li>
                        </ul>
                        <div className="d-flex align-items-center">
                            {/* Impostor Mode Controls */}
                            <button 
                                className="btn btn-warning btn-sm me-2" 
                                onClick={handleOpenImpostorModal}
                                title="Enter Impostor Mode"
                            >
                                <i className="fas fa-user-secret me-1"></i>
                                Impostor Mode
                            </button>
                            
                            <span className="navbar-text me-3" style={{color: 'black', fontWeight: '500'}}>
                                Hello, {firstName}!
                            </span>
                            <button className="btn btn-outline-dark btn-sm" onClick={handleLogout}>
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </nav>
            
            <ImpostorModeModal
                show={showImpostorModal}
                onClose={handleCloseImpostorModal}
                onSetImpostorMode={handleImpostorModeSet}
            />
        </>
    );
}