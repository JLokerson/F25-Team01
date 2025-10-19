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
    const [driversList, setDriversList] = useState([]);
    const [editing, setEditing] = useState(null); // { driver, newPoints }

    // Load drivers from content/json-assets/driver_sample.json
    useEffect(() => {
        let list = null;
        try { 
            const raw = localStorage.getItem('drivers'); 
            if (raw) {
                list = JSON.parse(raw); 
            }
        } catch (e) { 
            list = null;
            console.log('There are no drivers in the local storage, please check content/json-assets/driver_sample.json');
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
                    {driversList.length > 0 ? (
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