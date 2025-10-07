import React, { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import DriverNavbar from '../DriverNavbar';
import HelperPasswordChange from './HelperPasswordChange';
import driversSeed from '../../content/json-assets/driver_sample.json';

export default function DriverProfile() {
    const [driver, setDriver] = useState(null);

    const loadDrivers = () => {
        // prefer drivers persisted in localStorage (so points changes persist)
        let list = null;
        try {
            const raw = localStorage.getItem('drivers');
            if (raw) list = JSON.parse(raw);
        } catch (e) { list = null; }

        if (!Array.isArray(list) || list.length === 0) {
            list = Array.isArray(driversSeed) ? driversSeed : [];
        }

        // find userid === 1
        const d = list.find(
            x => Number(x.userid) === 1 || x.userid === 1
        );
        setDriver(d || null);
    };

    useEffect(() => {
        loadDrivers();

        const onStorage = (e) => {
            if (e.key === 'drivers' || e.key === null) loadDrivers();
        };
        const onCustom = () => loadDrivers();

        window.addEventListener('storage', onStorage);
        window.addEventListener('driversUpdated', onCustom);
        return () => {
            window.removeEventListener('storage', onStorage);
            window.removeEventListener('driversUpdated', onCustom);
        };
    }, []);

    return (
        <div>
            {DriverNavbar()}
            {HelperPasswordChange(driver?.userid ?? 4)}

            <div className="container mt-4">
                <h2>Driver Profile</h2>
                {!driver ? (
                    <div className="alert alert-warning">Driver with userid=1 not found.</div>
                ) : (
                    <ul className="list-group">
                        <li className="list-group-item"><strong>User ID:</strong> {driver.userid}</li>
                        <li className="list-group-item"><strong>Name:</strong> {driver.firstName} {driver.lastName}</li>
                        <li className="list-group-item"><strong>Email:</strong> {driver.email}</li>
                        <li className="list-group-item"><strong>Birthday:</strong> {driver.birthday}</li>
                        <li className="list-group-item"><strong>Points:</strong> {driver.points}</li>
                    </ul>
                )}
            </div>
        </div>
    );
}