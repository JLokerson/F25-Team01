import React from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../styles/Home.css';

export default function Home() {
  const navigate = useNavigate();
  const logolink = "https://sdmntprnorthcentralus.oaiusercontent.com/files/00000000-0784-622f-a764-580da68a489e/raw?se=2025-09-27T20%3A52%3A36Z&sp=r&sv=2024-08-04&sr=b&scid=b713bc52-c608-5a81-af5e-df8e067cf073&skoid=71e8fa5c-90a9-4c17-827b-14c3005164d6&sktid=a48cca56-e6da-484e-a814-9c849652bcb3&skt=2025-09-27T14%3A29%3A58Z&ske=2025-09-28T14%3A29%3A58Z&sks=b&skv=2024-08-04&sig=ZXCFZS6TIDLNRgOZC7wOL7DKP7k7SCyb7IVGo%2B%2B2Fwc%3D";
  return (
  <div className="landing" aria-label="Landing page">
    <div className="landing__bg" />
        <nav className="navbar navbar-expand-lg navbar-dark">
            <div className="container-fluid px-4">
                <a className="navbar-brand d-flex align-items-center" href="#" onClick={(e) => { e.preventDefault(); navigate('/'); }}>
                    <img src={logolink} alt="Network Drivers" className="navbar-logo me-2" />
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