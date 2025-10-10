import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../App.css';
import { Link, useNavigate } from 'react-router-dom';

export default function SponsorNavbar() {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const firstName = user?.FirstName || 'Sponsor';
    
    // Check if admin is in impostor mode
    const impostorMode = localStorage.getItem('impostorMode');
    const isAdminImpostor = impostorMode && localStorage.getItem('impostorType') === 'sponsor';

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

    return (
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