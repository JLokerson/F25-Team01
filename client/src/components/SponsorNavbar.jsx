import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../App.css';
import { Link, useNavigate } from 'react-router-dom';
import ImpostorModeModal from './ImpostorModeModal';

export default function SponsorNavbar() {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const firstName = user?.FirstName || 'Sponsor';
    const [showImpostorModal, setShowImpostorModal] = useState(false);
    
    // Check if admin is in impostor mode
    const impostorMode = localStorage.getItem('impostorMode');
    const isAdminImpostor = impostorMode && localStorage.getItem('impostorType') === 'sponsor';
    const sponsorOrg = localStorage.getItem('impostorSponsorOrg') || 'Generic Sponsor';

    // prevent navigation back to protected pages after logout
    const handleLogout = () => {
        localStorage.removeItem('user');
        // Clear impostor mode on logout
        if (isAdminImpostor) {
            localStorage.removeItem('impostorMode');
            localStorage.removeItem('impostorType');
            localStorage.removeItem('impostorSponsorOrg');
        }
        window.history.pushState(null, '', window.location.href);
        window.onpopstate = function () {
            window.history.go(1);
        };
        navigate('/', { replace: true });
    };

    const handleExitImpostorMode = () => {
        localStorage.removeItem('impostorMode');
        localStorage.removeItem('impostorType');
        localStorage.removeItem('impostorSponsorOrg');
        navigate('/adminhome', { replace: true });
    };

    const handleSwitchImpostorMode = () => {
        setShowImpostorModal(true);
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
        window.location.reload(); // Refresh to update navbar
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
                                <Link className="nav-link" to="#">Driver Management</Link>
                            </li>
                            <li className="nav-item">
                                <Link className="nav-link" to="#">Catalog Management</Link>
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
        </>
    );
}