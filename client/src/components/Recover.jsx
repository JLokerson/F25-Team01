import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Link } from 'react-router-dom';
import { getUser, getUserFromEmail, updatePassword } from './MiscellaneousParts/ServerCall';
import { HashPassword, GenerateSalt } from './MiscellaneousParts/HashPass';

export default function Recover() {
  console.log("Recover component rendered");

  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  async function ResetPass(){
    // Because obviously we can't send an actual email we just do the reset.
    let IDForReset = await getUserFromEmail(email);
    IDForReset = await IDForReset.json();
    IDForReset = IDForReset[0]["UserID"];

    let salt = GenerateSalt();
    let hashedPassword = await HashPassword(email,salt);
    await updatePassword(IDForReset, hashedPassword, salt);
    alert("Email confirmed, password reset to your email. Please use password change in profile upon next login.");
  }

  const handleSubmit = async (e) => {

    e.preventDefault();
    // Implement backend logic here to send recovery email (will we do this? mock for now)
    // We don't.
    setSubmitted(true);

    ResetPass();
  };

  return (
    <div className="form-page-container">
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
