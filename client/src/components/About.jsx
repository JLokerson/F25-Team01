import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Link } from 'react-router-dom';

function DisplayTOS() {
  // Mock login logic
  alert(`By using our site you hereby agree that we, the designers and hosts of this service, are not to be held liable for any and all harm, fiscal or otherwise, that may arise from the use of our software. You agree that should you have any legal dispute with us, it is to be handled via arbitration in Clemson, South Carolina. The arbitrator in any such arrangement will be selected and/or approved by us, Network Drivers.`);
};


export default function About() {
  return (
    <div>
      <div style={{minHeight:"92vh",maxHeight:"92vh"}}>
        <h1>This will be the about page</h1>
        <Link to="/login">Go to Login Page</Link>
        <br></br>
        <div className="spinner-border text-primary" role="status">
          <span className="sr-only"> </span>
        </div>
      </div>
      <button style={{minHeight:"8vh",maxHeight:"8vh"}} type="submit" onClick={DisplayTOS} className="btn btn-info">TOS</button>
    </div>
  );
}