import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Link } from 'react-router-dom';
import AdminNavbar from './AdminNavbar';
import PasswordChangeModal from './PasswordChangeModal';
import ReportView from './MiscellaneousParts/ReportView.jsx';

export default function AdminAuditView(){
    return (
        <div>
            <AdminNavbar />
            <ReportView />
        </div>
    );
}