import React, { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import DriverNavbar from '../DriverNavbar';
import HelperPasswordChange from './HelperPasswordChange';
import driversSeed from '../../content/json-assets/driver_sample.json';
import { CookiesProvider, useCookies } from 'react-cookie';

export default function DriverProfile() {
    const [driver, setDriver] = useState(null);
    const [cookies, setCookie] = useCookies(['MyDriverID']);

    const loadDrivers = () => {
        // prefer drivers persisted in localStorage (so points changes persist)
        // TODO: MAKE POINTS CHANGES ON BACKEND WHY WOULD THAT BE ON CLIENT WHAT
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
            x => Number(x.userid) === 3 || x.userid === 3
        );
        setDriver(d || null);
        if (driver == null){
            setDriver(cookies.Driver);
        }else{
            setCookie('driverinfo', driver, { path: '/' })
        }
    };

    useEffect(() => {
        loadDrivers();

        const onStorage = (e) => {
            if (e.key === 'drivers' || e.key === null) loadDrivers();
        };
        const onCustom = () => loadDrivers();

        window.addEventListener('storage', onStorage);
        window.addEventListener('driversUpdated', onCustom);
        // Also listen for a short-lived update key to show notifications across tabs
        const onLastUpdate = (e) => {
            if (e.key === 'drivers_last_update' || e.key === null) {
                try {
                    const raw = localStorage.getItem('drivers_last_update');
                    if (!raw) return;
                    const upd = JSON.parse(raw);
                    // if update is for this driver, show a browser notification
                    const myid = driver ? Number(driver.userid) : 3; // fallback
                    if (Number(upd.userid) === myid) {
                        // Ask permission if needed
                        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
                            new Notification('Points updated', { body: `Your points are now ${upd.points}` });
                        } else if (typeof Notification !== 'undefined' && Notification.permission !== 'denied') {
                            Notification.requestPermission().then(p => {
                                if (p === 'granted') new Notification('Points updated', { body: `Your points are now ${upd.points}` });
                            });
                        }
                    }
                } catch (e) { /* ignore */ }
            }
        };
        window.addEventListener('storage', onLastUpdate);
        return () => {
            window.removeEventListener('storage', onStorage);
            window.removeEventListener('driversUpdated', onCustom);
            window.removeEventListener('storage', onLastUpdate);
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