import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../App.css';
import { Link, useNavigate } from 'react-router-dom';

export default function AdminNavbar() {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const firstName = user?.FirstName || 'Admin';

    // prevent navigation back to protected pages after logout
    const handleLogout = () => {
        localStorage.removeItem('user');
        // Prevent back navigation after logout
        window.history.pushState(null, '', window.location.href);
        window.onpopstate = function () {
            window.history.go(1);
        };
        navigate('/', { replace: true });
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
    );
}