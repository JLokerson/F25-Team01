import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Link, useNavigate } from 'react-router-dom';

export default function SponsorNavbar() {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const firstName = user?.FirstName || 'Sponsor';

    // prevent navigation back to protected pages after logout
    const handleLogout = () => {
        localStorage.removeItem('user');
        window.history.pushState(null, '', window.location.href);
        window.onpopstate = function () {
            window.history.go(1);
        };
        navigate('/about', { replace: true });
    };

    return (
        <nav className="navbar navbar-expand-lg navbar-light bg-light">
            <a className="navbar-brand" href="#">Sponsor Home</a>
            <button className="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
                <span className="navbar-toggler-icon"></span>
            </button>

            <div className="collapse navbar-collapse" id="navbarSupportedContent">
                <ul className="navbar-nav mr-auto">
                <li className="nav-item active">
                    <a className="nav-link" href="/SponsorHome">Home <span className="sr-only">(current)</span></a>
                </li>
                <li className="nav-item">
                    <a className="nav-link" href="/SponsorProfile">Profile</a>
                </li>
                <li className="nav-item">
                    <a className="nav-link" href="#">Driver Management</a>
                </li>
                <li className="nav-item">
                    <a className="nav-link" href="#">Catalog Management</a>
                </li>
                {/* Commented out the unwanted parts, but left as a reference on how to make given elements since the bootstrap default example had to be slightly modified to work with react
                <li class="nav-item dropdown">
                    <a class="nav-link dropdown-toggle" href="#" id="navbarDropdown" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                    Dropdown
                    </a>
                    <div class="dropdown-menu" aria-labelledby="navbarDropdown">
                    <a class="dropdown-item" href="#">Action</a>
                    <a class="dropdown-item" href="#">Another action</a>
                    <div class="dropdown-divider"></div>
                    <a class="dropdown-item" href="#">Something else here</a>
                    </div>
                </li>
                <li class="nav-item">
                    <a class="nav-link disabled" href="#">Disabled</a>
                </li>
                */}
                </ul>
                <div className="d-flex align-items-center ms-auto">
                    <span className="navbar-text me-3">
                        Hello, {firstName}!
                    </span>
                    <button className="btn btn-outline-danger btn-sm me-4" onClick={handleLogout}>
                        Logout
                    </button>
                </div>
            </div>
        </nav>
    );
}