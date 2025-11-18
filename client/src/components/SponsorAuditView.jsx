import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Link } from 'react-router-dom';
import SponsorNavbar from './SponsorNavbar';
import PasswordChangeModal from './PasswordChangeModal';
import ReportView from './MiscellaneousParts/ReportView.jsx';

export default function AdminAuditView(){
    return (
        <div>
            <SponsorNavbar />
            <ReportView />
        </div>
    );
}