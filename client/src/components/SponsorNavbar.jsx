import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../App.css';
import { Link, useNavigate } from 'react-router-dom';
import ImpostorModeModal from './ImpostorModeModal';
import SponsorImpostorModeModal from './SponsorImpostorModeModal';

export default function SponsorNavbar() {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const firstName = user?.FirstName || 'Sponsor';
    const [showImpostorModal, setShowImpostorModal] = useState(false);
    const [showSponsorImpostorModal, setSponsorImpostorModeModal] = useState(false);
    
    // Check if admin is in impostor mode
    const impostorMode = localStorage.getItem('impostorMode');
    const isAdminImpostor = impostorMode && localStorage.getItem('impostorType') === 'sponsor';
    const isSponsorImpostor = impostorMode && localStorage.getItem('impostorType') === 'driver' && localStorage.getItem('originalUserType') === 'sponsor';
    const sponsorOrg = localStorage.getItem('impostorSponsorOrg') || 'Generic Sponsor';

    // prevent navigation back to protected pages after logout
    const handleLogout = () => {
        localStorage.removeItem('user');
        // Clear impostor mode on logout
        if (isAdminImpostor || isSponsorImpostor) {
            localStorage.removeItem('impostorMode');
            localStorage.removeItem('impostorType');
            localStorage.removeItem('impostorSponsorOrg');
            localStorage.removeItem('originalUserType');
        }
        window.history.pushState(null, '', window.location.href);
        window.onpopstate = function () {
            window.history.go(1);
        };
        navigate('/', { replace: true });
    };

    const handleExitImpostorMode = () => {
        if (isAdminImpostor) {
            localStorage.removeItem('impostorMode');
            localStorage.removeItem('impostorType');
            localStorage.removeItem('impostorSponsorOrg');
            navigate('/adminhome', { replace: true });
        } else if (isSponsorImpostor) {
            localStorage.removeItem('impostorMode');
            localStorage.removeItem('impostorType');
            localStorage.removeItem('originalUserType');
            navigate('/SponsorHome', { replace: true });
        }
    };

    const handleSwitchImpostorMode = () => {
        setShowImpostorModal(true);
    };

    const handleOpenSponsorImpostorMode = () => {
        setSponsorImpostorModeModal(true);
    };

    const handleCloseSponsorImpostorModal = () => {
        setSponsorImpostorModeModal(false);
    };

    const handleCloseImpostorModal = () => {
        setShowImpostorModal(false);
    };

    const handleImpostorModeSet = (type, sponsorOrg = null) => {
        localStorage.setItem('impostorMode', 'true');
        localStorage.setItem('impostorType', type);
        if (sponsorOrg) {
            localStorage.setItem('impostorSponsorOrg', sponsorOrg);
        }
        setShowImpostorModal(false);
        // Navigate to appropriate home page
        if (type === 'driver') {
            navigate('/DriverHome', { replace: true });
        } else if (type === 'sponsor') {
            navigate('/SponsorHome', { replace: true });
        }
    };

    const handleSponsorImpostorModeSet = (type) => {
        localStorage.setItem('impostorMode', 'true');
        localStorage.setItem('impostorType', type);
        localStorage.setItem('originalUserType', 'sponsor');
        setSponsorImpostorModeModal(false);
        // Navigate to driver home
        navigate('/DriverHome', { replace: true });
    };
 
    return (
        <>
            <nav className="sponsor-navbar navbar navbar-expand-lg navbar-light bg-light">
                <div className="container-fluid">
                    <Link className="navbar-brand d-flex align-items-center" to="/SponsorHome">
                        <img src="https://wallpaperaccess.com/full/2723826.jpg" alt="Network Drivers" className="navbar-logo me-2" style={{width: '40px', height: '40px', objectFit: 'cover'}} />
                        <span className="fw-bold">Sponsor Home</span>
                    </Link>
                    <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
                        <span className="navbar-toggler-icon"></span>
                    </button>

                    <div className="collapse navbar-collapse" id="navbarSupportedContent">
                        <ul className="navbar-nav me-auto mb-2 mb-lg-0">
                            <li className="nav-item">
                                <Link className="nav-link" to="/SponsorHome">Home</Link>
                            </li>
                            <li className="nav-item">
                                <Link className="nav-link" to="/SponsorProfile">Profile</Link>
                            </li>
                            <li className="nav-item">
                                <Link className="nav-link" to="/sponsor-driver-management">Driver Management</Link>
                            </li>
                            <li className="nav-item">
                                <Link className="nav-link" to="/pending-applications">Pending Applications</Link>
                            </li>
                            <li className="nav-item">
                                <Link className="nav-link" to="/sponsorcatalog">Catalog Management</Link>
                            </li>
                        </ul>
                        <div className="d-flex align-items-center">
                            {isAdminImpostor && (
                                <>
                                    <div className="alert alert-warning py-1 px-2 mb-0 me-2 d-flex align-items-center" style={{fontSize: '0.875rem'}}>
                                        <i className="fas fa-user-secret me-2"></i>
                                        <strong>Admin Impostor Mode: Sponsor ({sponsorOrg})</strong>
                                    </div>
                                    <button 
                                        className="btn btn-secondary btn-sm me-1" 
                                        onClick={handleSwitchImpostorMode}
                                        title="Switch Impostor Mode"
                                    >
                                        Switch
                                    </button>
                                    <button 
                                        className="btn btn-danger btn-sm me-2" 
                                        onClick={handleExitImpostorMode}
                                        title="Exit Impostor Mode"
                                    >
                                        Exit
                                    </button>
                                </>
                            )}
                            {!isAdminImpostor && (
                                <button 
                                    className="btn btn-warning btn-sm me-2" 
                                    onClick={handleOpenSponsorImpostorMode}
                                    title="Enter Driver Impostor Mode"
                                >
                                    <i className="fas fa-user-secret me-1"></i>
                                    Impostor Mode
                                </button>
                            )}
                            <span className="navbar-text me-3">
                                Hello, {firstName}!
                            </span>
                            <button className="btn btn-outline-danger btn-sm" onClick={handleLogout}>
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
            
            <SponsorImpostorModeModal
                show={showSponsorImpostorModal}
                onClose={handleCloseSponsorImpostorModal}
                onSetImpostorMode={handleSponsorImpostorModeSet}
            />
        </>
    );
}