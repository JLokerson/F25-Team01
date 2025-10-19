import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import SponsorNavbar from '../SponsorNavbar';
import HelperPasswordChange from './HelperPasswordChange';
import sponsors from '../../content/json-assets/sponsor-user_sample.json';
import driversSeed from '../../content/json-assets/driver_sample.json';
import { CookiesProvider, useCookies } from 'react-cookie';
import { login } from '../MiscellaneousParts/ServerCall';

export default function SponsorProfile() {
    // use this info to try a login.
    const [cookies, setCookie] = useCookies(['username', 'password']);
    const [showPasswordChangeButton, setShowPasswordChangeButton] = useState(false);
    
    // Ensure this is actually a sponsor user.
    // TO-DO: verify the login returned success and not fail, rn only checks if error on retrieval.
    async function VerifyLogin(){
        try{
            let userinfo = {
            "email": cookies.username,
            "password": cookies.password,
            };
            await login(userinfo);
            return true;
        }catch(e){
            return false;
        }
    }

    const [sponsor] = useState(() => {
        if (!Array.isArray(sponsors) || sponsors.length === 0) {
            return null;
        }
        // Hardcoded to the first sponsor
        return sponsors[0];
    });
    const [driversList, setDriversList] = useState([]); // Initialize as empty array instead of null
    const [editing, setEditing] = useState(null); // { driver, newPoints }

    const getUserInfo = () => {
        const userString = localStorage.getItem('user');
        if (userString) {
            try {
                return JSON.parse(userString);
            } catch (e) {
                return null;
            }
        }
        return null;
    };

    const getTimeSinceLastLogin = (lastLoginDate) => {
        const now = new Date();
        const diffTime = Math.abs(now - lastLoginDate);
        const diffMonths = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 30.44)); // Average days per month
        
        if (diffMonths >= 12) {
            const years = Math.floor(diffMonths / 12);
            const remainingMonths = diffMonths % 12;
            return years === 1 
                ? `over 1 year${remainingMonths > 0 ? ` and ${remainingMonths} month${remainingMonths > 1 ? 's' : ''}` : ''}`
                : `over ${years} years${remainingMonths > 0 ? ` and ${remainingMonths} month${remainingMonths > 1 ? 's' : ''}` : ''}`;
        } else {
            return `${diffMonths} month${diffMonths !== 1 ? 's' : ''}`;
        }
    };

    const getUserTypeString = (userType) => {
        switch (userType) {
            case 1: return 'Driver';
            case 2: return 'Sponsor';
            case 3: return 'Admin';
            default: return `Unknown (${userType})`;
        }
    };

    const checkLastLogin = () => {
        const userString = localStorage.getItem('user');
        if (userString) {
            try {
                const user = JSON.parse(userString);
                const lastLoginDate = user.LastLogin ? new Date(user.LastLogin) : null;
                
                if (lastLoginDate) {
                    const threeMonthsAgo = new Date();
                    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
                    
                    if (lastLoginDate < threeMonthsAgo) {
                        setShowPasswordChangeButton(true);
                    }
                } else {
                    setShowPasswordChangeButton(true);
                }
            } catch (e) {
                console.error('Error parsing user data:', e);
            }
        }
    };

    // Load drivers from content/json-assets/driver_sample.json
    useEffect(() => {
        checkLastLogin();
        
        let list = [];
        try { 
            const raw = localStorage.getItem('drivers'); 
            if (raw) {
                list = JSON.parse(raw); 
            }
        } catch (e) { 
            list = [];
            console.log('There are no drivers in the local storage, please check content/json-assets/driver_sample.json');
        }
        
        // Ensure list is an array
        if (!Array.isArray(list)) {
            list = [];
        }

        setDriversList(list);
    }, []);

    function openEditorFor(driverId){
        const d = driversList.find(x => Number(x.userid) === Number(driverId) || x.userid === driverId);
        if (!d) return alert('Driver not found locally');
        setEditing({ driver: d, newPoints: d.points });
    } 

    function saveEdit(){
        if (!editing) return;
        const updated = driversList.map(d => (Number(d.userid) === Number(editing.driver.userid) ? { ...d, points: Number(editing.newPoints) } : d));
        setDriversList(updated);
        try { localStorage.setItem('drivers', JSON.stringify(updated));
            // also set a short-lived key to trigger storage events in other tabs
            localStorage.setItem('drivers_last_update', JSON.stringify({ userid: editing.driver.userid, points: Number(editing.newPoints), ts: Date.now() }));
        } catch (e) { console.error('Failed to save drivers', e); }
        // notify same-tab listeners
        try{ window.dispatchEvent(new Event('driversUpdated')); } catch(e){}
        setEditing(null);
    }

    const userInfo = getUserInfo();

    if (!sponsor) {
        return (
            <div>
                {SponsorNavbar()}
                <div className="container mt-4">No sponsor data available.</div>
            </div>
        );
    }

    if(VerifyLogin){
        return (
            <div>
                {SponsorNavbar()}
                
                {/* User Information Section */}
                {userInfo && (
                    <div className="container mt-4">
                        <div className="card mb-4">
                            <div className="card-header">
                                <h4 className="mb-0">
                                    <i className="fas fa-user me-2"></i>
                                    Current User Information
                                </h4>
                            </div>
                            <div className="card-body">
                                <div className="row">
                                    <div className="col-md-6">
                                        <p><strong>User ID:</strong> {userInfo.UserID}</p>
                                        <p><strong>Name:</strong> {userInfo.FirstName} {userInfo.LastName}</p>
                                        <p><strong>Email:</strong> {userInfo.Email}</p>
                                    </div>
                                    <div className="col-md-6">
                                        <p><strong>User Type:</strong> {getUserTypeString(userInfo.UserType)}</p>
                                        {showPasswordChangeButton && (
                                            <div className="alert alert-warning mt-2">
                                                <i className="fas fa-exclamation-triangle me-2"></i>
                                                <strong>Security Notice:</strong>
                                                <p className="mb-2 mt-1">
                                                    {userInfo.LastLogin 
                                                        ? `It has been ${getTimeSinceLastLogin(new Date(userInfo.LastLogin))} since your last login.`
                                                        : 'We have no record of your last login.'
                                                    }
                                                    <br />
                                                    We recommend updating your password for security.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {HelperPasswordChange(sponsor.userid)}

                <div className="container mt-4">
                    <h5>Sponsored Drivers</h5>
                    {Array.isArray(driversList) && driversList.length > 0 ? (
                        <ul className="list-group">
                            {driversList.map((d) => (
                                <li key={d.userid} className="list-group-item d-flex justify-content-between align-items-center">
                                    <div>
                                        <div><strong>{d.firstName} {d.lastName}</strong></div>
                                        <div className="text-muted small">User ID: {d.userid} • Points: {d.points}</div>
                                    </div>
                                    <div>
                                        <button className="btn btn-sm btn-outline-primary me-2" onClick={() => openEditorFor(d.userid)}>Edit Points</button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p>No linked drivers.</p>
                    )}

                    <div className="mt-3">
                        <button className="btn btn-secondary me-2" onClick={() => {
                            const dataStr = JSON.stringify(driversList, null, 2);
                            const blob = new Blob([dataStr], { type: 'application/json' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = 'drivers_export.json';
                            a.click();
                            URL.revokeObjectURL(url);
                        }}>Export Drivers JSON</button>

                        <label className="btn btn-outline-secondary mb-0">
                            Import JSON
                            <input type="file" accept="application/json" style={{display:'none'}} onChange={(e) => {
                                const f = e.target.files && e.target.files[0];
                                if (!f) return;
                                const reader = new FileReader();
                                reader.onload = (ev) => {
                                    try {
                                        const parsed = JSON.parse(ev.target.result);
                                        if (!Array.isArray(parsed)) return alert('Imported JSON must be an array of drivers');
                                        setDriversList(parsed);
                                        localStorage.setItem('drivers', JSON.stringify(parsed));
                                        window.dispatchEvent(new Event('driversUpdated'));
                                        localStorage.setItem('drivers_last_update', JSON.stringify({ userid: null, points: null, ts: Date.now() }));
                                    } catch (err) { alert('Failed to import JSON: ' + err.message); }
                                };
                                reader.readAsText(f);
                            }} />
                        </label>
                    </div>

                    {/* Inline modal/editor */}
                    {editing && (
                        <div style={{position:'fixed', left:'50%', top:'50%', transform:'translate(-50%,-50%)', background:'#fff', padding:20, borderRadius:8, boxShadow:'0 4px 20px rgba(0,0,0,.3)', zIndex:9999, width:360}}>
                            <h5>Edit points — {editing.driver.firstName} {editing.driver.lastName}</h5>
                            <div style={{marginTop:8}}>
                                <label>New points</label>
                                <input type="number" value={editing.newPoints} onChange={e=>setEditing({...editing, newPoints: e.target.value})} className="form-control" />
                            </div>
                            <div style={{display:'flex', gap:8, marginTop:12, justifyContent:'flex-end'}}>
                                <button className="btn btn-secondary" onClick={()=>setEditing(null)}>Cancel</button>
                                <button className="btn btn-primary" onClick={saveEdit}>Save</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }else{
        return;
    }
}