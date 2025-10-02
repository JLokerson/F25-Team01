import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useNavigate } from 'react-router-dom';

function MostOfTheText() {
  let navigate = useNavigate(); 
  const GoHome = () =>{ 
    let path = `/`; 
    navigate(path);
  }

  return (
    <div style={{minHeight:"88vh",maxHeight:"88vh"}}>
      <h1>This will be the about page</h1>
      <br></br>
      <button type="submit" onClick={GoHome} className="btn btn-info">To Home</button>
      <br></br>
      <div className="spinner-border text-primary" role="status">
        <span className="sr-only"> </span>
      </div>
      <p>This website is intended to be used for drivers to earn rewards points and claim rewards. Please log in and you will be directed to the correct location.</p>
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