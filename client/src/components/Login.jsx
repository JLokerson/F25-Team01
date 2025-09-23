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
    // Mock login logic
    //alert(`Username: ${username}\nPassword: ${password}`);
    var response = await fetch("http://localhost:4000/userAPI/addUser",
    {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            FirstName: "Julia", 
            LastName: "Lokerson",
            Email: "fakeer@mail.com", 
            Password: "password123", 
            PasswordSalt: "aBit", 
            UserType: 3
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
