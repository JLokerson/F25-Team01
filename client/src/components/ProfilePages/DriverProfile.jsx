import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Link } from 'react-router-dom';
import DriverNavbar from '../DriverNavbar';
import HelperPasswordChange from './HelperPasswordChange';

export default function DriverProfile() {

    // temp value for future
    const UserID = 1;

    return (
        <div>
            {DriverNavbar()}
            {HelperPasswordChange(UserID)}
            {/* Place profile stuff below here*/}
            <p>Hey this is where you will one day see your profile, assuming you have one.</p>
        </div>
    );
}