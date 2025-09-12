import React from 'react';
import { Link } from 'react-router-dom';

export default function About() {
  return (
    <div>
      <h1>This will be the about page</h1>
      <Link to="/login">Go to Login Page</Link>
      <h1>Below is a test of whether the addition of booststrap did fuck all.</h1>
      <div class="spinner-border text-primary" role="status">
        <span class="sr-only"> </span>
      </div>
    </div>
  );
}