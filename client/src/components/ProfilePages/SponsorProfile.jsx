import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Link } from 'react-router-dom';
import SponsorNavbar from '../SponsorNavbar';
import HelperPasswordChange from './HelperPasswordChange';

export default function SponsorProfile() {
    return (
        <div>
            {SponsorNavbar()}
            {/* Place profile stuff below here*/}
            {HelperPasswordChange()}
            <p>Hey this is where you will one day see your profile, assuming you have one.</p>
        </div>
    );
}