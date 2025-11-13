import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../App.css';
import { Link, useNavigate } from 'react-router-dom';
import ImpostorModeModal from './ImpostorModeModal';

export default function DriverNavbar() {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const firstName = user?.FirstName || 'Driver';
    const [showImpostorModal, setShowImpostorModal] = useState(false);
    
    // Check if admin is in impostor mode
    const impostorMode = localStorage.getItem('impostorMode');
    const isAdminImpostor = impostorMode && localStorage.getItem('impostorType') === 'driver';

    // Get cart items count
    const getCartItemCount = () => {
        try {
            const cart = JSON.parse(localStorage.getItem('cart') || '[]');
            return cart.reduce((total, item) => total + (item.quantity || 1), 0);
        } catch (e) {
            return 0;
        }
    };

    const cartItemCount = getCartItemCount();

    // Prevent navigation back to protected pages after logout
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

    const handleCart = () => {
        navigate('/drivercart');
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
        // Navigate to appropriate home page
        if (type === 'driver') {
            navigate('/DriverHome', { replace: true });
        } else if (type === 'sponsor') {
            navigate('/SponsorHome', { replace: true });
        }
    };

    return (
        <>
            <nav className="driver-navbar navbar navbar-expand-lg navbar-light bg-light">
                <div className="container-fluid">
                    <Link className="navbar-brand d-flex align-items-center" to="/DriverHome">
                        <img src="https://wallpaperaccess.com/full/2723826.jpg" alt="Network Drivers" className="navbar-logo me-2" style={{width: '40px', height: '40px', objectFit: 'cover'}} />
                        <span className="fw-bold">Driver Home</span>
                    </Link>
                    <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
                        <span className="navbar-toggler-icon"></span>
                    </button>

                    <div className="collapse navbar-collapse" id="navbarSupportedContent">
                        <ul className="navbar-nav me-auto mb-2 mb-lg-0">
                            <li className="nav-item">
                                <Link className="nav-link" to="/DriverHome">Home</Link>
                            </li>
                            <li className="nav-item">
                                <Link className="nav-link" to="/DriverProfile">Profile</Link>
                            </li>
                            <li className="nav-item">
                                <Link className="nav-link" to="/products">Catalog</Link>
                            </li>
                        </ul>
                        <div className="d-flex align-items-center">
                            {isAdminImpostor && (
                                <>
                                    <div className="alert alert-warning py-1 px-2 mb-0 me-2 d-flex align-items-center" style={{fontSize: '0.875rem'}}>
                                        <i className="fas fa-user-secret me-2"></i>
                                        <strong>Admin Impostor Mode: Driver</strong>
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
                            <Link className="nav-link position-relative d-flex align-items-center me-3" to="/drivercart">
                                <img 
                                    src="/cart.png" 
                                    alt="Cart" 
                                    style={{width: '20px', height: '20px'}}
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.nextSibling.style.display = 'inline';
                                    }}
                                />
                                <span style={{display: 'none'}}>Cart</span>
                                {cartItemCount > 0 && (
                                    <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                                        {cartItemCount}
                                        <span className="visually-hidden">items in cart</span>
                                    </span>
                                )}
                            </Link>
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