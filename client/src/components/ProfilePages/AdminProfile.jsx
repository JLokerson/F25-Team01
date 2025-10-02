import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Link } from 'react-router-dom';
import AdminNavbar from '../AdminNavbar';
import HelperPasswordChange from './HelperPasswordChange';

export default function AdminProfile() {
    console.log('AdminProfile rendered');
    return (
        <div>
            {AdminNavbar()}
            {/* Place profile stuff below here*/}
            {HelperPasswordChange()}
            <p>Hey this is where you will one day see your profile, assuming you have one.</p>
        </div>
    );
}