import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Link } from 'react-router-dom';
import DriverNavbar from './DriverNavbar';

export default function DriverHome() {
    return (
        <div>
            {DriverNavbar()}
            {/* Place driver home page text below here */}
        </div>
    );
}