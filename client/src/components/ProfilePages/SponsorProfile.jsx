import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import SponsorNavbar from '../SponsorNavbar';
import HelperPasswordChange from './HelperPasswordChange';
import sponsors from '../../content/json-assets/sponsor-user_sample.json';

export default function SponsorProfile() {
    const [sponsor] = useState(() => {
        if (!Array.isArray(sponsors) || sponsors.length === 0) return null;
        return sponsors[Math.floor(Math.random() * sponsors.length)];
    });

    if (!sponsor) {
        return (
            <div>
                {SponsorNavbar()}
                <div className="container mt-4">No sponsor data available.</div>
            </div>
        );
    }

    return (
        <div>
            {SponsorNavbar()}
            {HelperPasswordChange(sponsor.userid)}

            <div className="container mt-4">
                <h2>Sponsor Profile</h2>
                <ul className="list-group mb-3">
                    <li className="list-group-item"><strong>User ID:</strong> {sponsor.userid}</li>
                    <li className="list-group-item"><strong>Name:</strong> {sponsor.firstName} {sponsor.lastName}</li>
                    <li className="list-group-item"><strong>Email:</strong> {sponsor.email}</li>
                    <li className="list-group-item"><strong>Birthday:</strong> {sponsor.birthday}</li>
                </ul>

                <h5>Sponsored Drivers</h5>
                {Array.isArray(sponsor.drivers) && sponsor.drivers.length > 0 ? (
                    <ul className="list-group">
                        {sponsor.drivers.map((d) => (
                            <li key={d} className="list-group-item">Driver ID: {d}</li>
                        ))}
                    </ul>
                ) : (
                    <p>No linked drivers.</p>
                )}
            </div>
        </div>
    );
}