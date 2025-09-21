import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Link, useNavigate } from 'react-router-dom';

export default function Login() {
  // Not secure - for demonstration purposes only
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [showRecovery, setShowRecovery] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Use entered email and password in the request body
    var response = await fetch("http://localhost:4000/testAPI/login", // <-- changed endpoint
    {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            email: username, 
            password: password
        })
    });

    if (!response.ok) {
        setFailedAttempts(prev => {
          const next = prev + 1;
          if (next >= 5) setShowRecovery(true);
          return next;
        });
        alert("Login failed. Please check your credentials.");
        return;
    }
    setFailedAttempts(0);
    setShowRecovery(false);
    alert(response.status + " " + response.statusText);
  };

  const handleRecovery = () => {
    navigate('/recover');
  };

  return (
    <div className="container mt-5" style={{ maxWidth: 400 }}>
      <h1 className="mb-4">Login</h1>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="email" className="form-label">Email</label>
          <input
            type="email"
            id="email"
            className="form-control"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
          />
        </div>
        <div className="mb-3">
          <label htmlFor="password" className="form-label">Password</label>
          <div className="input-group">
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              className="form-control"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>
        <button type="submit" className="btn btn-primary w-100">Login</button>
      </form>
      {showRecovery && (
        <div className="mt-3">
          <button className="btn btn-warning w-100" onClick={handleRecovery}>
            Forgot Password? Go to Recovery
          </button>
        </div>
      )}
      <div className="mt-3">
        <Link to="/about">Go to About Page</Link>
      </div>
      <div className="mt-3">
        <Link to="/register">Go to Register Page</Link>
      </div>
      <div className="mt-3">
        <Link to="/recover">Go to Recovery Page</Link>
      </div>
    </div>
  );
}