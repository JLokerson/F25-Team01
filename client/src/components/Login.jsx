import React from 'react';
import { Link } from 'react-router-dom';

export default function Login() {
  return (
    <div>
      <h1>This will be the login page</h1>
      <Link to="/about">Go to About Page</Link>
    </div>
  );
}