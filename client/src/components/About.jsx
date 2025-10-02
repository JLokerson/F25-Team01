import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useNavigate } from 'react-router-dom';

function MostOfTheText() {
  let navigate = useNavigate(); 
  const [sponsors, setSponsors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const GoHome = () =>{ 
    let path = `/`; 
    navigate(path);
  }

  useEffect(() => {
    const fetchSponsors = async () => {
      try {
        setLoading(true);
        // Try the standard API pattern first
        const response = await fetch('sponsorAPI/getAllSponsors');
        
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
    <div style={{minHeight:"88vh",maxHeight:"88vh"}}>
      <h1>This will be the about page</h1>
      <br></br>
      <button type="submit" onClick={GoHome} className="btn btn-info">To Home</button>
      <br></br>
      
      {loading && (
        <div className="spinner-border text-primary" role="status">
          <span className="sr-only">Loading...</span>
        </div>
      )}
      
      <p>This website is intended to be used for drivers to earn rewards points and claim rewards. Please log in and you will be directed to the correct location.
        Here is the list of the current companies using this program:</p>
      
      {error && (
        <div className="alert alert-danger" role="alert">
          Error loading sponsors: {error}
        </div>
      )}
      
      {!loading && !error && sponsors.length > 0 && (
        <div className="mt-3">
          <h3>Current Sponsors:</h3>
          <div>
            {sponsors.map((sponsor, index) => (
              <div key={sponsor.SponsorID || index} className="mb-2">
                <strong>{sponsor.Name}</strong>
                {sponsor.description && <span> - {sponsor.description}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {!loading && !error && sponsors.length === 0 && (
        <p className="text-muted">No sponsors found.</p>
      )}
    </div>
  );
}

export default function About() {
  return (
    <div>
      {MostOfTheText()}
      <div style={{minHeight:"12vh",maxHeight:"12vh"}}>
        
      </div>
    </div>
  );
}