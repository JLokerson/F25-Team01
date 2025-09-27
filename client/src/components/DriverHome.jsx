import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Link } from 'react-router-dom';
import DriverNavbar from './DriverNavbar';

export default function DriverHome() {
    return (
        <div>
            {DriverNavbar()}
            {/* Place driver home page text below here */}
            console.log("Driver home page rendered. DriverHome.jsx");
            <div className="container my-5">
                <h1>Welcome to the Driver Home Page</h1>
                <p>This is where drivers can see their dashboard and relevant information.</p>
            </div>
        </div>
    );
}