import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

export default function Navbar({ user }) {
  const navigate = useNavigate();

  // user expected shape: { UserType: number, ... }
  // AccountType mapping used across repo: 1=Admin, 2=Sponsor, 3=Driver (guessing from Login.jsx)
  const userType = user?.UserType ?? user?.accountType ?? null;

  const handleProfile = () => {
    if (userType === 1) navigate('/AdminProfile');
    else if (userType === 2) navigate('/SponsorProfile');
    else if (userType === 3) navigate('/DriverProfile');
    else navigate('/');
  };

  const handleCart = (e) => {
    if (userType === 3) {
      navigate('/cart');
    } else {
      // For non-drivers, prevent navigating and show a small notice
      e.preventDefault();
      alert('Cart is only available to drivers.');
    }
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-light">
      <div className="container-fluid">
        <Link className="navbar-brand d-flex align-items-center" to="/">
          <img src="https://wallpaperaccess.com/full/2723826.jpg" alt="Network Drivers" className="navbar-logo me-2" />
          <span className="fw-bold">Network Drivers</span>
        </Link>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
          <span className="navbar-toggler-icon" />
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <Link className="nav-link" to="/about">About</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/products">Products</Link>
            </li>
            <li className="nav-item">
              {/* Cart link: allowed for drivers only */}
              <a href="#" onClick={handleCart} className={`nav-link ${userType !== 3 ? 'text-muted' : ''}`}>Cart</a>
            </li>
          </ul>

          <div className="d-flex align-items-center gap-2">
            <button className="btn btn-outline-secondary btn-sm" onClick={handleProfile}>Profile</button>
            <button className="btn btn-danger btn-sm" onClick={() => { localStorage.removeItem('user'); window.location.href = '/'; }}>Logout</button>
          </div>
        </div>
      </div>
    </nav>
  );
}
