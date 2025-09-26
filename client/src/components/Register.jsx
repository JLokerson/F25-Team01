import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Link, useNavigate } from 'react-router-dom';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [salt, setSalt] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState('');
  const [acceptedTOS, setAcceptedTOS] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!acceptedTOS) return;
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setError('');
    // Example registration logic (mock)
    // await fetch("http://localhost:4000/testAPI/register", { ... })
    // TO DO: 
    // - add field 
    // - Check for duplicate emails 
    // - randomly generate password salt for making new user 
    alert("Registered successfully!");
    navigate('/login');
  };

  return (
    <div className="form-page-container">
      <h1 className="mb-4">Register</h1>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="firstName" className="form-label">First Name</label>
          <input
            type="text"
            id="firstName"
            className="form-control"
            value={firstName}
            onChange={e => setFirstName(e.target.value)}
            required
          />
        </div>
        <div className="mb-3">
          <label htmlFor="lastName" className="form-label">Last Name</label>
          <input
            type="text"
            id="lastName"
            className="form-control"
            value={lastName}
            onChange={e => setLastName(e.target.value)}
            required
          />
        </div>
        <div className="mb-3">
          <label htmlFor="email" className="form-label">Email</label>
          <input
            type="email"
            id="email"
            className="form-control"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="mb-3">
          <label htmlFor="password" className="form-label">Password</label>
          <input
            type="password"
            id="password"
            className="form-control"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
        </div>
        <div className="mb-3">
          <label htmlFor="confirm" className="form-label">Confirm Password</label>
          <input
            type="password"
            id="confirm"
            className="form-control"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            required
          />
        </div>
        {error && <div className="alert alert-danger">{error}</div>}
        <div className="mb-3">
          <p style={{fontSize: "0.95em"}}>
            By using our site you hereby agree that we, the designers and hosts of this service, are not to be held liable for any and all harm, fiscal or otherwise, that may arise from the use of our software. You agree that should you have any legal dispute with us, it is to be handled via arbitration in Clemson, South Carolina. The arbitrator in any such arrangement will be selected and/or approved by us, Network Drivers. By continuing to use this application you hereby agree to these terms.
          </p>
        </div>
        <div className="mb-3 form-check">
          <input
            type="checkbox"
            className="form-check-input"
            id="acceptTOS"
            checked={acceptedTOS}
            onChange={e => setAcceptedTOS(e.target.checked)}
          />
          <label className="form-check-label" htmlFor="acceptTOS">
            I understand and accept the Terms of Service
          </label>
        </div>
        <button
          type="submit"
          className="btn btn-primary w-100"
          disabled={!acceptedTOS}
          style={{opacity: acceptedTOS ? 1 : 0.6, cursor: acceptedTOS ? 'pointer' : 'not-allowed'}}
        >
          Register
        </button>
      </form>
      <div className="mt-3">
        <Link to="/login">Already have an account? Login</Link>
      </div>
    </div>
  );
}