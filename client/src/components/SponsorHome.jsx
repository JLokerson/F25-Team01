import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Link } from 'react-router-dom';
import SponsorNavbar from './SponsorNavbar';

export default function SponsorHome() {
    return (
        <div>
            {SponsorNavbar()}
            {/* Place sponsor home page text below here */}
        </div>
    );
}