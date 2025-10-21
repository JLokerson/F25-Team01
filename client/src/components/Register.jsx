import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Link, useNavigate } from 'react-router-dom';
import { GenerateSalt } from './MiscellaneousParts/HashPass';

//TO DO: how do we want to handle user types? Right now it defaults to Driver (1) for all new registrations
// Do we want driver to make an account w a sponsor or is that something they can do after making account? 

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState('');
  const [acceptedTOS, setAcceptedTOS] = useState(false);
  const [readTOS, setreadTOS] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const navigate = useNavigate();

  const checkEmailExists = async (email) => {
    try {
      const response = await fetch(`http://localhost:4000/userAPI/checkEmail?email=${encodeURIComponent(email)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      return data.exists;
    } catch (error) {
      console.error('Error checking email:', error);
      return false;
    }
  };

  const loginUser = async (email, password) => {
    try {
      const response = await fetch(`http://localhost:4000/userAPI/login?Email=${encodeURIComponent(email)}&Password=${encodeURIComponent(password)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse login response:', parseError);
        return null;
      }

      if (response.ok && data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
        return data.user;
      }
      return null;
    } catch (error) {
      console.error('Auto-login error:', error);
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!acceptedTOS || !readTOS) return;
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    // Check for duplicate email
    const emailExists = await checkEmailExists(email);
    if (emailExists) {
      setError('A user with this email already exists. Please use a different email.');
      return;
    }

    setError('');

    // Create user object
    const user = {
      FirstName: firstName.trim(),
      LastName: lastName.trim(),
      Email: email.trim(),
      Password: password,
      PasswordSalt: GenerateSalt(),
      UserType: 1 // Default to Driver for public registration
    };

    try {
      const response = await fetch('http://localhost:4000/userAPI/addUser', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(user)
      });
      
      const data = await response.json().catch(() => ({}));
      
      if (response.ok) {
        alert("Registered successfully!");
        
        // Automatically log the user in
        const loggedInUser = await loginUser(email, password);
        if (loggedInUser) {
          // Navigate based on user type (Driver = 1, so goes to DriverHome)
          const userType = loggedInUser.UserType;
          if (userType === 1) {
            navigate('/DriverHome');
          } else if (userType === 2) {
            navigate('/SponsorHome');
          } else if (userType === 3) {
            navigate('/AdminHome');
          } else {
            navigate('/about');
          }
        } else {
          // If auto-login fails, just go to login page
          navigate('/login');
        }
      } else {
        setError('Failed to register: ' + (data.message || 'Unknown error'));
      }
    } catch (err) {
      setError('Error: ' + err.message);
    }
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
        <div className="mb-3">
          <label htmlFor="confirm" className="form-label">Confirm Password</label>
          <div className="input-group">
            <input
              type={showConfirm ? "text" : "password"}
              id="confirm"
              className="form-control"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              required
            />
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => setShowConfirm(!showConfirm)}
              tabIndex={-1}
            >
              {showConfirm ? "Hide" : "Show"}
            </button>
          </div>
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
        <div className="mb-3 form-check">
          <input
            type="checkbox"
            className="form-check-input"
            id="readTOS"
            checked={readTOS}
            onChange={e => setreadTOS(true)}
          />
          <label className="form-check-label" htmlFor="readTOS">
            I have in fact read the terms of service.
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