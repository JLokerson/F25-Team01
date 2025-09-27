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
    
    try {
      const response = await fetch("http://localhost:4000/userAPI/login", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          Email: username,
          Password: password
        })
      });

      // Debug: Log the response status and text
      console.log('Response status:', response.status);
      const responseText = await response.text();
      console.log('Response text:', responseText);

      // Try to parse as JSON only if we got a response
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse JSON:', parseError);
        console.error('Raw response:', responseText);
        alert("Server error. Check console for details.");
        return;
      }

      if (!response.ok) {
        setFailedAttempts(prev => {
          const next = prev + 1;
          if (next >= 5) setShowRecovery(true);
          return next;
        });
        alert(data.message || "Login failed. Please check your credentials.");
        return;
      }

      // Login successful
      setFailedAttempts(0);
      setShowRecovery(false);

      // Store user info in localStorage
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Navigate based on user type
      const userType = data.user.UserType;
      if (userType === 1) {
        navigate('/AdminHome'); // Admin user
      } else if (userType === 2) {
        navigate('/SponsorHome'); // Sponsor user
      } else if (userType === 3) {
        navigate('/DriverHome'); // Driver user
      } else {
        navigate('/about'); // Default fallback
      }
      
    } catch (error) {
      console.error('Login error:', error);
      alert("Network error. Please try again.");
    }
  };

  const handleRecovery = () => {
    navigate('/recover');
  };

  return (
    <div className="d-flex justify-content-center align-items-center min-vh-100">
      <div
        className="card p-4 shadow w-100 h-100 d-flex flex-column justify-content-between"
        style={{ maxWidth: '32em', height: '28em' }}
      >
        <h1 className="mb-4 text-center">Login</h1>
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
        <div className="mt-4">
          <div className="d-flex gap-2 mb-2">
            <Link to="/register" className="btn btn-primary btn-sm flex-fill">Register</Link>
            <Link to="/recover" className="btn btn-warning btn-sm flex-fill">Forgot Password?</Link>
          </div>
          <div className="text-center">
            <Link to="/about" className="btn btn-secondary btn-sm">Back</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
