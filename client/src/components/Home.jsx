import React from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../styles/Home.css';
import '../styles/Navbar.css';

export default function Home() {
  const navigate = useNavigate();
  const logolink = "https://wallpaperaccess.com/full/2723826.jpg";
  return (
  <div className="landing" aria-label="Landing page">
    <div className="landing__bg" />
        <nav className="navbar navbar-expand-lg navbar-dark">
            <div className="container-fluid px-4">
                <a className="navbar-brand d-flex align-items-center" href="#" onClick={(e) => { e.preventDefault(); navigate('/'); }}>
                    <img src={logolink} alt="Network Drivers" className="navbar-logo me-2" style={{width: '40px', height: '40px', objectFit: 'cover'}} />
                    <span className="fw-bold text-white">Network Drivers</span>
                </a>
                <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#landingNav" aria-controls="landingNav" aria-expanded="false" aria-label="Toggle navigation">
                <span className="navbar-toggler-icon" />
                </button>
                <div className="collapse navbar-collapse" id="landingNav">
                    <ul className="navbar-nav ms-auto mb-2 mb-lg-0 align-items-lg-center">
                        <li className="nav-item">
                            <button className="nav-link btn btn-link text-white" onClick={() => navigate('/about')}>About</button>
                        </li>
                        <li className="nav-item">
                            <button className="nav-link btn btn-outline-light rounded-pill ms-2" onClick={() => navigate('/login')}>Login</button>
                        </li>
                    </ul>
                </div>
            </div>
        </nav>
        
        <main className="landing__content container text-center">
        <div className="row justify-content-center">
            <div className="col-12 col-md-10 col-lg-8">
                <h1 className="landing__title display-4">Together, we drive change</h1>
                <p className="landing__subtitle lead">Secure. Scalable. Smart.</p>
                <div className="d-inline-block mt-3">
                    <button className="btn-getstarted btn btn-warning btn-lg rounded-pill" onClick={() => navigate('/login')}>Get Started</button>
                </div>
            </div>
        </div>
        </main>

        <footer className="landing__footer">&copy; {new Date().getFullYear()} Network Drivers</footer>
    </div>
  );
}