import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Link } from 'react-router-dom';
import DriverNavbar from '../DriverNavbar';

export default function DriverProfile() {
    return (
        <div>
            {DriverNavbar()}
            {/* Place profile stuff below here*/}
            <p>Hey this is where you will one day see your profile, assuming you have one.</p>
        </div>
    );
}