import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Link, useNavigate } from 'react-router-dom';

export default function Login() {
  // Not secure - for demonstration purposes only
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const navigate = useNavigate();
  const [cookies, setCookie] = useCookies(['password', 'username'])

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log('Sending login request with:', { Email: username, Password: password });

    try {
      const response = await fetch(`http://localhost:4000/userAPI/login?Email=${encodeURIComponent(username)}&Password=${encodeURIComponent(password)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      console.log('Request URL:', `http://localhost:4000/userAPI/login?Email=${encodeURIComponent(username)}&Password=${encodeURIComponent(password)}`);

      // Debug: Log the response status and text
      console.log('Response status:', response.status);
      const responseText = await response.text();
      console.log('Response text:', responseText);

      // Try to parse as JSON only if we got a response
      let data;
      try {
        data = JSON.parse(responseText);
        console.log('Parsed response data:', data); 
      } catch (parseError) {
        console.error('Failed to parse JSON:', parseError);
        console.error('Raw response:', responseText);
        alert("Server error. Check console for details.");
        return;
      }

      if (!response.ok) {
        setFailedAttempts(prev => {
          const next = prev + 1;
          if (next >= 5) {
            navigate('/recover');
            return next;
          }
          return next;
        });
        alert(data.message || "Login failed. Please check your credentials.");
        return;
      }

      // Login successful
      setFailedAttempts(0);
      setCookie('password', password, { path: '/' })
      setCookie('username', username, { path: '/' })
      // Store user info in localStorage
      if (!data.user) {
        alert("No user object in response! Check backend response format.");
        console.error('No user object in response:', data);
        return;
      }
      
      // Check if password is older than 3 months
      const shouldSuggestPasswordChange = checkPasswordAge(data.user.LastLogin);
      

      // Wait, what? Okay, so is this actually saving a json instead of a cookie? This feels... dangerous. I need to talk to jason more before going into detail on this. This is problematic.
      // Store user info and password change suggestion flag
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('suggestPasswordChange', shouldSuggestPasswordChange.toString());
      console.log('User stored in localStorage:', data.user);
      console.log('Password change suggestion:', shouldSuggestPasswordChange);
      
      // If user is a sponsor, fetch their sponsor record so we know which catalog to load
      if (data.user.UserType === 2) {
        try {
          const sponsorResp = await fetch(`http://localhost:4000/sponsorAPI/getSponsorForUser?UserID=${encodeURIComponent(data.user.UserID)}`);
          if (sponsorResp.ok) {
            const sponsor = await sponsorResp.json();
            localStorage.setItem('sponsor', JSON.stringify(sponsor));
            console.log('Sponsor stored in localStorage:', sponsor);
          } else {
            console.warn('No sponsor record found for user');
          }
        } catch (err) {
          console.error('Failed to fetch sponsor record:', err);
        }
      }
      
      // Navigate based on user type
      const userType = data.user.UserType;
      if (userType === 1) {
        navigate('/DriverHome'); // Driver user
      } else if (userType === 2) {
        navigate('/SponsorHome'); // Sponsor user
      } else if (userType === 3) {
        navigate('/AdminHome'); // Admin user
      } else {
        navigate('/about'); // Default fallback
      }
      
    } catch (error) {
      console.error('Login error:', error);
      alert("Network error. Please try again.");
    }
  };

  // Function to check if password is older than 3 months
  const checkPasswordAge = (lastLogin) => {
    if (!lastLogin) {
      // If no LastLogin date, this is likely the first login, don't suggest password change
      return false;
    }
    
    const lastLoginDate = new Date(lastLogin);
    const currentDate = new Date();
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(currentDate.getMonth() - 3);
    
    // If last login (password change) was more than 3 months ago, suggest password change
    return lastLoginDate < threeMonthsAgo;
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
            <Link to="/" className="btn btn-secondary btn-sm">Back</Link>
          </div>
        </div>
      </div>
    </div>
  );
}