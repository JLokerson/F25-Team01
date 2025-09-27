import React from 'react';
import { Link } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

export default function Home() {
  return (
    <div className="container d-flex flex-column justify-content-center align-items-center" style={{minHeight: '70vh'}}>
      <h1>Welcome</h1>
      <p className="lead text-center">Please log in to access your dashboard.</p>
      <div className="d-flex gap-2">
        <Link to="/login" className="btn btn-primary">Login</Link>
        <Link to="/register" className="btn btn-secondary">Register</Link>
        <Link to="/about" className="btn btn-outline-secondary">About</Link>
      </div>
    </div>
  );
}
