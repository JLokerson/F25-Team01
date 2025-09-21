import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Link } from 'react-router-dom';

export default function Recover() {
  console.log("Recover component rendered");

  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Implement backend logic here to send recovery email (will we do this? mock for now)
    setSubmitted(true);
    // Example:
    // await fetch("http://localhost:4000/testAPI/recover", {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ email })
    // });
  };

  return (
    <div className="container mt-5" style={{ maxWidth: 400 }}>
      <h1 className="mb-4">Password Recovery</h1>
      {submitted ? (
        <div>
          <p>If an account with that email exists, you will receive password recovery instructions.</p>
          <Link to="/login" className="btn btn-primary w-100">Back to Login</Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="email" className="form-label">Enter your email</label>
            <input
              type="email"
              id="email"
              className="form-control"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-warning w-100">Send Recovery Email</button>
        </form>
      )}
    </div>
  );
}
