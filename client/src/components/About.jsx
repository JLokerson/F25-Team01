import React from 'react';
import { Link } from 'react-router-dom';

export default function About() {
  return (
    <div>
      <h1>This will be the about page</h1>
      <Link to="/login">Go to Login Page</Link>
    </div>
  );
}