import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../App.css';
import { Link, useNavigate } from 'react-router-dom';

export default function DriverNavbar() {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const firstName = user?.FirstName || 'Driver';
    
    // Check if admin is in impostor mode
    const impostorMode = localStorage.getItem('impostorMode');
    const isAdminImpostor = impostorMode && localStorage.getItem('impostorType') === 'driver';

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

    return (
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
                        <li className="nav-item">
                            <Link className="nav-link" to="/drivercart">Cart</Link>
                        </li>
                        <li className="nav-item">
                            <Link className="nav-link" to="#">My Orders</Link>
                        </li>
                    </ul>
                    <div className="d-flex align-items-center">
                        {isAdminImpostor && (
                            <>
                                <span className="badge bg-warning text-dark me-2">
                                    Admin Impostor Mode
                                </span>
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
    );
}