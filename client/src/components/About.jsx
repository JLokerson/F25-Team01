import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Link } from 'react-router-dom';

export default function About() {
  return (
    <div>
      <h1>This will be the about page</h1>
      <Link to="/login">Go to Login Page</Link>
      <div className="spinner-border text-primary" role="status">
        <span className="sr-only"> </span>
      </div>
    </div>
  );
}