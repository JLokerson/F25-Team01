import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../styles/Home.css';
import '../styles/Navbar.css';
import { useNavigate } from 'react-router-dom';
import truck from '../content/img/truck.png';
import { getAllSponsors} from './MiscellaneousParts/ServerCall';

function MostOfTheText() {
  let navigate = useNavigate(); 
  const [sponsors, setSponsors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const logopath = truck;

  const GoHome = () =>{ 
    let path = `/`; 
    navigate(path);
  }

  const GoToLogin = () => {
    let path = `/login`;
    navigate(path);
  }

  useEffect(() => {
    const fetchSponsors = async () => {
      try {
        setLoading(true);
        // Try the standard API pattern first
        const response = await getAllSponsors();
        
        console.log('Sponsor fetch response status:', response.status);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch sponsors: ${response.status}`);
        }
        
        const sponsorData = await response.text();
        console.log('Fetched sponsor data:', sponsorData);
        const parsedSponsors = JSON.parse(sponsorData);
        setSponsors(parsedSponsors);
      } catch (err) {
        console.error('Error fetching sponsors:', err);
        setError(err.message);
        // Add some mock data for testing if API fails
        setSponsors([
          { id: 1, name: 'Test Sponsor 1', description: 'Sample sponsor for testing' },
          { id: 2, name: 'Test Sponsor 2', description: 'Another sample sponsor' }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchSponsors();
  }, []);

  return (
    <div className="landing">
      <div className="landing__bg"></div>
      
      {/* Navbar section - matching Home page */}
      <nav className="navbar navbar-expand-lg navbar-dark">
        <div className="container-fluid px-4">
          <a className="navbar-brand d-flex align-items-center" href="#" onClick={(e) => { e.preventDefault(); GoHome(); }}>
            <img src={logopath} alt="Network Drivers" className="navbar-logo me-2" />
            <span className="fw-bold text-white">Network Drivers</span>
          </a>
          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#aboutNav" aria-controls="aboutNav" aria-expanded="false" aria-label="Toggle navigation">
            <span className="navbar-toggler-icon" />
          </button>
          <div className="collapse navbar-collapse" id="aboutNav">
            <ul className="navbar-nav ms-auto mb-2 mb-lg-0 align-items-lg-center">
              <li className="nav-item">
                <button className="nav-link btn btn-link text-white" onClick={GoHome}>Home</button>
              </li>
              <li className="nav-item">
                <button className="nav-link btn btn-link text-white" onClick={() => navigate('/about')}>About</button>
              </li>
              <li className="nav-item">
                <button className="nav-link btn btn-outline-light rounded-pill ms-2" onClick={GoToLogin}>Login</button>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      <div className="container mt-4 about-content" style={{position: 'relative', zIndex: 10, flex: 1}}>
        <h1 className="landing__title text-center" style={{color: 'var(--text)', textShadow: '2px 2px 4px rgba(0,0,0,0.8)'}}>About Our Driver Rewards Program</h1>
        <br />
        
        {loading && (
          <div className="spinner-border loading-spinner" style={{color: 'var(--accent)'}} role="status">
            <span className="sr-only">Loading...</span>
          </div>
        )}
        
        <p className="about-section" style={{
          color: 'var(--text)', 
          fontSize: '1.1rem',
          textShadow: '1px 1px 3px rgba(0,0,0,0.8)',
          backgroundColor: 'var(--bg-overlay)',
          padding: '15px',
          borderRadius: '10px',
          marginBottom: '20px'
        }}>
        This website is intended to be used for drivers to earn rewards points and claim rewards.
        </p>
        
        {error && (
          <div className="alert alert-danger about-section" role="alert" style={{
            backgroundColor: 'rgba(220, 53, 69, 0.8)',
            borderColor: 'var(--accent)',
            color: 'var(--text)'
          }}>
            Error loading sponsors: {error}
          </div>
        )}
        
        {!loading && !error && sponsors.length > 0 && (
          <div className="mt-3 about-section" style={{
            backgroundColor: 'var(--bg-overlay)',
            padding: '20px',
            borderRadius: '10px',
            marginBottom: '20px'
          }}>
            <h3 style={{color: 'var(--accent)', marginBottom: '15px'}}>Current Sponsors:</h3>
            <div>
              {sponsors.map((sponsor, index) => (
                <div key={sponsor.SponsorID || index} className="mb-2 sponsor-item" style={{
                  color: 'var(--text)',
                  fontSize: '1rem',
                  padding: '8px',
                  backgroundColor: 'rgba(255, 180, 0, 0.1)',
                  borderRadius: '5px',
                  border: '1px solid var(--accent)'
                }}>
                  <strong style={{color: 'var(--accent)'}}>{sponsor.Name}</strong>
                  {sponsor.description && <span> - {sponsor.description}</span>}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {!loading && !error && sponsors.length === 0 && (
          <p className="about-section" style={{
            color: 'var(--text)',
            fontStyle: 'italic',
            backgroundColor: 'var(--bg-overlay)',
            padding: '15px',
            borderRadius: '10px'
          }}>
            No sponsors found.
          </p>
        )}
      </div>

      {/* Footer section */}
      <footer className="landing__footer">&copy; {new Date().getFullYear()} Network Drivers</footer>
    </div>
  );
}

export default function About() {
  return (
    <div>
      {MostOfTheText()}
    </div>
  );
}