import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Link } from 'react-router-dom';
import SponsorNavbar from './SponsorNavbar';
import CatalogViewer from './CatalogViewer';

export default function SponsorHome() {
    return (
        <div>
            <SponsorNavbar />
            <CatalogViewer />
        </div>
    );
}