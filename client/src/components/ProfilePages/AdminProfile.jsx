import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import AdminNavbar from '../AdminNavbar';
import HelperPasswordChange from './HelperPasswordChange';

// admin_sample.json is currently empty in the repo, so use a small
// fallback list here to display something useful.
const fallbackAdmins = [
    {
        userid: 'admin001',
        accountType: 0,
        firstName: 'Grace',
        lastName: 'Hopper',
        birthday: '12-09-1906',
        email: 'grace.hopper@example.com'
    },
    {
        userid: 'admin002',
        accountType: 0,
        firstName: 'Ada',
        lastName: 'Lovelace',
        birthday: '12-10-1815',
        email: 'ada.lovelace@example.com'
    }
];

export default function AdminProfile() {
    // pick a random admin from the fallback list
    const [admin] = useState(() => {
        return fallbackAdmins[Math.floor(Math.random() * fallbackAdmins.length)];
    });

    return (
        <div>
            {AdminNavbar()}
            {HelperPasswordChange(admin.userid)}

            <div className="container mt-4">
                <h2>Admin Profile</h2>
                <ul className="list-group">
                    <li className="list-group-item"><strong>User ID:</strong> {admin.userid}</li>
                    <li className="list-group-item"><strong>Name:</strong> {admin.firstName} {admin.lastName}</li>
                    <li className="list-group-item"><strong>Email:</strong> {admin.email}</li>
                    <li className="list-group-item"><strong>Birthday:</strong> {admin.birthday}</li>
                </ul>
            </div>
        </div>
    );
}