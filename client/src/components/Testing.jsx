import React, { useState } from 'react';

const Testing = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [autoClear, setAutoClear] = useState(false);
  const [formData, setFormData] = useState({
    addUser: { FirstName: 'Test', LastName: 'User', Email: 'newuser@example.com', Password: 'password123', PasswordSalt: 'salt123', UserType: 1 },
    addAdmin: { FirstName: 'Test', LastName: 'Admin', Email: 'testadmin@example.com', Password: 'password123', PasswordSalt: 'salt123', UserType: 3 },
    addDriver: { SponsorID: 1, FirstName: 'Test', LastName: 'Driver', Email: 'testdriver@example.com', Password: 'password123', PasswordSalt: 'salt123', UserType: 1 },
    addSponsor: { Name: 'Test Sponsor' },
    addSponsorUser: { SponsorID: 1, FirstName: 'Test', LastName: 'SponsorUser', Email: 'testsponsoruser@example.com', Password: 'password123', PasswordSalt: 'salt123', UserType: 2 },
    addCartItem: { DriverID: 1, ProductID: 1 },
    updatePassword: { UserID: 1, Password: 'newpass123', PasswordSalt: 'newsalt123' },
    getUserById: { UserID: 1 },
    getCartItems: { DriverID: 1 },
    getItemMappings: { ProductID: 1 },
    checkEmail: { email: 'test@example.com' },
    login: { Email: 'test@example.com', Password: 'password123' }
  });

  const addResult = (method, endpoint, status, data) => {
    const timestamp = new Date().toLocaleTimeString();
    setResults(prev => {
      const newResult = {
        id: Date.now(),
        timestamp,
        method,
        endpoint,
        status,
        data: JSON.stringify(data, null, 2)
      };
      
      // If auto-clear is enabled, only keep the new result
      if (autoClear) {
        return [newResult];
      }
      
      // Otherwise, keep last 10 results as before
      return [newResult, ...prev.slice(0, 9)];
    });
  };

  const testRequest = async (method, endpoint, body = null) => {
    setLoading(true);
    try {
      const config = {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
      };

      if (body) {
        config.body = JSON.stringify(body);
      }

      const response = await fetch(`http://localhost:4000${endpoint}`, config);
      const data = await response.json();
      
      addResult(method, endpoint, response.status, data);
    } catch (error) {
      addResult(method, endpoint, 'ERROR', { error: error.message });
    }
    setLoading(false);
  };

  const updateFormData = (formKey, field, value) => {
    setFormData(prev => ({
      ...prev,
      [formKey]: {
        ...prev[formKey],
        [field]: value
      }
    }));
  };

  const buildQueryString = (data) => {
    return Object.keys(data)
      .map(key => `${key}=${encodeURIComponent(data[key])}`)
      .join('&');
  };

  const clearResults = () => {
    setResults([]);
  };

  return (
    <div className="testing-container">
      <h1>API Testing Page</h1>

      <div className="endpoints-grid">
        
        {/* User/Auth Tests */}
        <div className="endpoint-section">
          <h3>User/Auth Endpoints</h3>
          
          <div className="form-section">
            <h4>Login</h4>
            <input 
              placeholder="Email" 
              value={formData.login.Email}
              onChange={(e) => updateFormData('login', 'Email', e.target.value)}
            />
            <input 
              placeholder="Password" 
              value={formData.login.Password}
              onChange={(e) => updateFormData('login', 'Password', e.target.value)}
            />
            <button onClick={() => testRequest('POST', `/userAPI/login?${buildQueryString(formData.login)}`)}>
              POST Login
            </button>
          </div>
          
          <div className="form-section">
            <h4>Add User</h4>
            <input 
              placeholder="First Name" 
              value={formData.addUser.FirstName}
              onChange={(e) => updateFormData('addUser', 'FirstName', e.target.value)}
            />
            <input 
              placeholder="Last Name" 
              value={formData.addUser.LastName}
              onChange={(e) => updateFormData('addUser', 'LastName', e.target.value)}
            />
            <input 
              placeholder="Email" 
              value={formData.addUser.Email}
              onChange={(e) => updateFormData('addUser', 'Email', e.target.value)}
            />
            <input 
              placeholder="Password" 
              value={formData.addUser.Password}
              onChange={(e) => updateFormData('addUser', 'Password', e.target.value)}
            />
            <input 
              placeholder="Password Salt" 
              value={formData.addUser.PasswordSalt}
              onChange={(e) => updateFormData('addUser', 'PasswordSalt', e.target.value)}
            />
            <select 
              value={formData.addUser.UserType}
              onChange={(e) => updateFormData('addUser', 'UserType', parseInt(e.target.value))}
            >
              <option value={1}>Driver</option>
              <option value={2}>Sponsor</option>
              <option value={3}>Admin</option>
            </select>
            <button onClick={() => testRequest('POST', '/userAPI/addUser', formData.addUser)}>
              POST Add User
            </button>
          </div>

          <button onClick={() => testRequest('GET', '/userAPI/getAllUsers')}>
            GET All Users
          </button>
          
          <div className="form-section">
            <h4>Get User by ID</h4>
            <input 
              placeholder="User ID" 
              type="number"
              value={formData.getUserById.UserID}
              onChange={(e) => updateFormData('getUserById', 'UserID', parseInt(e.target.value))}
            />
            <button onClick={() => testRequest('GET', `/userAPI/getUser?UserID=${formData.getUserById.UserID}`)}>
              GET User by ID
            </button>
          </div>
          
          <div className="form-section">
            <h4>Check Email</h4>
            <input 
              placeholder="Email" 
              value={formData.checkEmail.email}
              onChange={(e) => updateFormData('checkEmail', 'email', e.target.value)}
            />
            <button onClick={() => testRequest('GET', `/userAPI/checkEmail?email=${encodeURIComponent(formData.checkEmail.email)}`)}>
              GET Check Email
            </button>
          </div>
          
          <div className="form-section">
            <h4>Update Password</h4>
            <input 
              placeholder="User ID" 
              type="number"
              value={formData.updatePassword.UserID}
              onChange={(e) => updateFormData('updatePassword', 'UserID', parseInt(e.target.value))}
            />
            <input 
              placeholder="New Password" 
              value={formData.updatePassword.Password}
              onChange={(e) => updateFormData('updatePassword', 'Password', e.target.value)}
            />
            <input 
              placeholder="New Password Salt" 
              value={formData.updatePassword.PasswordSalt}
              onChange={(e) => updateFormData('updatePassword', 'PasswordSalt', e.target.value)}
            />
            <button onClick={() => testRequest('POST', '/userAPI/updatePassword', formData.updatePassword)}>
              POST Update Password
            </button>
          </div>
        </div>

        {/* Admin Tests */}
        <div className="endpoint-section">
          <h3>Admin Endpoints</h3>
          <button onClick={() => testRequest('GET', '/adminAPI/getAllAdmins')}>
            GET All Admins
          </button>
          
          <div className="form-section">
            <h4>Add Admin</h4>
            <input 
              placeholder="First Name" 
              value={formData.addAdmin.FirstName}
              onChange={(e) => updateFormData('addAdmin', 'FirstName', e.target.value)}
            />
            <input 
              placeholder="Last Name" 
              value={formData.addAdmin.LastName}
              onChange={(e) => updateFormData('addAdmin', 'LastName', e.target.value)}
            />
            <input 
              placeholder="Email" 
              value={formData.addAdmin.Email}
              onChange={(e) => updateFormData('addAdmin', 'Email', e.target.value)}
            />
            <input 
              placeholder="Password" 
              value={formData.addAdmin.Password}
              onChange={(e) => updateFormData('addAdmin', 'Password', e.target.value)}
            />
            <input 
              placeholder="Password Salt" 
              value={formData.addAdmin.PasswordSalt}
              onChange={(e) => updateFormData('addAdmin', 'PasswordSalt', e.target.value)}
            />
            <button onClick={() => testRequest('POST', `/adminAPI/addAdmin?${buildQueryString(formData.addAdmin)}`)}>
              POST Add Admin
            </button>
          </div>
        </div>

        {/* Driver Tests */}
        <div className="endpoint-section">
          <h3>Driver Endpoints</h3>
          <button onClick={() => testRequest('GET', '/driverAPI/getAllDrivers')}>
            GET All Drivers
          </button>
          
          <div className="form-section">
            <h4>Add Driver</h4>
            <input 
              placeholder="Sponsor ID" 
              type="number"
              value={formData.addDriver.SponsorID}
              onChange={(e) => updateFormData('addDriver', 'SponsorID', parseInt(e.target.value))}
            />
            <input 
              placeholder="First Name" 
              value={formData.addDriver.FirstName}
              onChange={(e) => updateFormData('addDriver', 'FirstName', e.target.value)}
            />
            <input 
              placeholder="Last Name" 
              value={formData.addDriver.LastName}
              onChange={(e) => updateFormData('addDriver', 'LastName', e.target.value)}
            />
            <input 
              placeholder="Email" 
              value={formData.addDriver.Email}
              onChange={(e) => updateFormData('addDriver', 'Email', e.target.value)}
            />
            <input 
              placeholder="Password" 
              value={formData.addDriver.Password}
              onChange={(e) => updateFormData('addDriver', 'Password', e.target.value)}
            />
            <input 
              placeholder="Password Salt" 
              value={formData.addDriver.PasswordSalt}
              onChange={(e) => updateFormData('addDriver', 'PasswordSalt', e.target.value)}
            />
            <button onClick={() => testRequest('POST', `/driverAPI/addDriver?${buildQueryString(formData.addDriver)}`)}>
              POST Add Driver
            </button>
          </div>
        </div>

        {/* Sponsor Tests */}
        <div className="endpoint-section">
          <h3>Sponsor Endpoints</h3>
          <button onClick={() => testRequest('GET', '/sponsorAPI/getAllSponsors')}>
            GET All Sponsors
          </button>
          
          <div className="form-section">
            <h4>Add Sponsor</h4>
            <input 
              placeholder="Sponsor Name" 
              value={formData.addSponsor.Name}
              onChange={(e) => updateFormData('addSponsor', 'Name', e.target.value)}
            />
            <button onClick={() => testRequest('POST', `/sponsorAPI/addSponsor?${buildQueryString(formData.addSponsor)}`)}>
              POST Add Sponsor
            </button>
          </div>

          <button onClick={() => testRequest('GET', '/sponsorAPI/getAllSponsorUsers')}>
            GET All Sponsor Users
          </button>
          
          <div className="form-section">
            <h4>Add Sponsor User</h4>
            <input 
              placeholder="Sponsor ID" 
              type="number"
              value={formData.addSponsorUser.SponsorID}
              onChange={(e) => updateFormData('addSponsorUser', 'SponsorID', parseInt(e.target.value))}
            />
            <input 
              placeholder="First Name" 
              value={formData.addSponsorUser.FirstName}
              onChange={(e) => updateFormData('addSponsorUser', 'FirstName', e.target.value)}
            />
            <input 
              placeholder="Last Name" 
              value={formData.addSponsorUser.LastName}
              onChange={(e) => updateFormData('addSponsorUser', 'LastName', e.target.value)}
            />
            <input 
              placeholder="Email" 
              value={formData.addSponsorUser.Email}
              onChange={(e) => updateFormData('addSponsorUser', 'Email', e.target.value)}
            />
            <input 
              placeholder="Password" 
              value={formData.addSponsorUser.Password}
              onChange={(e) => updateFormData('addSponsorUser', 'Password', e.target.value)}
            />
            <input 
              placeholder="Password Salt" 
              value={formData.addSponsorUser.PasswordSalt}
              onChange={(e) => updateFormData('addSponsorUser', 'PasswordSalt', e.target.value)}
            />
            <button onClick={() => testRequest('POST', `/sponsorAPI/addSponsorUser?${buildQueryString(formData.addSponsorUser)}`)}>
              POST Add Sponsor User
            </button>
          </div>
        </div>

        {/* Cart Tests */}
        <div className="endpoint-section">
          <h3>Cart Endpoints</h3>
          
          <div className="form-section">
            <h4>Get Cart Items by Driver</h4>
            <input 
              placeholder="Driver ID" 
              type="number"
              value={formData.getCartItems.DriverID}
              onChange={(e) => updateFormData('getCartItems', 'DriverID', parseInt(e.target.value))}
            />
            <button onClick={() => testRequest('GET', `/CartAPI/getCartItems?DriverID=${formData.getCartItems.DriverID}`)}>
              GET Cart Items by Driver
            </button>
          </div>
          
          <div className="form-section">
            <h4>Add Cart Item</h4>
            <input 
              placeholder="Driver ID" 
              type="number"
              value={formData.addCartItem.DriverID}
              onChange={(e) => updateFormData('addCartItem', 'DriverID', parseInt(e.target.value))}
            />
            <input 
              placeholder="Product ID" 
              type="number"
              value={formData.addCartItem.ProductID}
              onChange={(e) => updateFormData('addCartItem', 'ProductID', parseInt(e.target.value))}
            />
            <button onClick={() => testRequest('POST', `/CartAPI/addCartItem?${buildQueryString(formData.addCartItem)}`)}>
              POST Add Cart Item
            </button>
          </div>

          <div className="form-section">
            <h4>Get Item Mappings by Product</h4>
            <input 
              placeholder="Product ID" 
              type="number"
              value={formData.getItemMappings.ProductID}
              onChange={(e) => updateFormData('getItemMappings', 'ProductID', parseInt(e.target.value))}
            />
            <button onClick={() => testRequest('GET', `/CartAPI/getItemMappings?ProductID=${formData.getItemMappings.ProductID}`)}>
              GET Item Mappings by Product
            </button>
          </div>
        </div>

        {/* Test Routes */}
        <div className="endpoint-section">
          <h3>Test Routes</h3>
          <button onClick={() => testRequest('GET', '/userAPI/')}>
            GET User API Root
          </button>
          <button onClick={() => testRequest('GET', '/userAPI/test-login')}>
            GET Test Login Route
          </button>
        </div>
      </div>

      <div className="controls">
        <button 
          onClick={clearResults}
          className="clear-button"
        >
          Clear Results
        </button>
        <label className="auto-clear-checkbox">
          <input 
            type="checkbox" 
            checked={autoClear}
            onChange={(e) => setAutoClear(e.target.checked)}
          />
          Auto-clear previous results
        </label>
        {loading && <span className="loading">Loading...</span>}
      </div>

      <div className="results-section">
        <h2>Test Results</h2>
        {results.length === 0 ? (
          <p className="no-results">No test results yet. Click a button above to test an endpoint.</p>
        ) : (
          <div className="results-container">
            {results.map(result => (
              <div key={result.id} className={`result-item ${result.status === 'ERROR' ? 'error' : result.status >= 400 ? 'warning' : 'success'}`}>
                <div className="result-header">
                  <strong>{result.method} {result.endpoint}</strong>
                  <span className="timestamp">{result.timestamp}</span>
                </div>
                <div className="status-line">
                  Status: <span className={`status ${result.status === 'ERROR' ? 'error' : result.status >= 400 ? 'warning' : 'success'}`}>
                    {result.status}
                  </span>
                </div>
                <pre className="response-data">
                  {result.data}
                </pre>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Testing;