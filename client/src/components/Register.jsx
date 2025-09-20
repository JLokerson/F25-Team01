import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Link } from 'react-router-dom';

export default function Register() {
  // Not secure - for demonstration purposes only
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Mock login logic
    //alert(`Username: ${username}\nPassword: ${password}`);
    var response = await fetch("http://localhost:4000/testAPI/addUser",
    {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            first_name: 'Julia',
            last_name: 'Lokerson',
            email: 'fakeer@mail.com',
            password: 'password123'
        })
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    console.log(response.json());
    return response.json();

    //return textStuff;
  };

  return (
    <div className="container mt-5" style={{ maxWidth: 400 }}>
      <h1 className="mb-4">Login</h1>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="username" className="form-label">Username</label>
          <input
            type="text"
            id="username"
            className="form-control"
            value={username}
            onChange={e => setUsername(e.target.value)}
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
        <button type="submit" className="btn btn-primary w-100">Login</button>
      </form>
      <div className="mt-3">
        <Link to="/about">Go to About Page</Link>
      </div>
      <div className="mt-3">
        <Link to="/login">Go to Login Page</Link>
      </div>
    </div>
  );
}