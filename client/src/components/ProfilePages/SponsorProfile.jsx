import React, { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import SponsorNavbar from '../SponsorNavbar';
import HelperPasswordChange from './HelperPasswordChange';
import sponsors from '../../content/json-assets/sponsor-user_sample.json';

export default function SponsorProfile() {
  const [activeTab, setActiveTab] = useState('profile');
  const [showPasswordChangeButton, setShowPasswordChangeButton] = useState(false);
  const [sponsorInfo, setSponsorInfo] = useState(null);
  const [sponsorName, setSponsorName] = useState(null);

  // Use first sponsor from sample as placeholder data when needed
  const [sponsor] = useState(() => {
    if (!Array.isArray(sponsors) || sponsors.length === 0) return null;
    return sponsors[0];
  });
  const [driversList, setDriversList] = useState([]);
  const [editing, setEditing] = useState(null); // { driver, newPoints }

  const getUserInfo = () => {
    try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; }
  };

  const getTimeSinceLastLogin = (lastLoginDate) => {
    const now = new Date();
    const diffMonths = Math.floor(Math.abs(now - lastLoginDate) / (1000 * 60 * 60 * 24 * 30.44));
    if (diffMonths >= 12) {
      const years = Math.floor(diffMonths / 12);
      const remainingMonths = diffMonths % 12;
      return years === 1
        ? `over 1 year${remainingMonths ? ` and ${remainingMonths} month${remainingMonths > 1 ? 's' : ''}` : ''}`
        : `over ${years} years${remainingMonths ? ` and ${remainingMonths} month${remainingMonths > 1 ? 's' : ''}` : ''}`;
    }
    return `${diffMonths} month${diffMonths !== 1 ? 's' : ''}`;
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
    const user = getUserInfo();
    if (user) {
      const lastLoginDate = user.LastLogin ? new Date(user.LastLogin) : null;
      if (!lastLoginDate) return setShowPasswordChangeButton(true);
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      if (lastLoginDate < threeMonthsAgo) setShowPasswordChangeButton(true);
    }
  };

  const fetchSponsorInfo = async () => {
    const user = getUserInfo();
    if (user && user.UserID) {
      try {
        const resp = await fetch('http://localhost:4000/sponsorAPI/getAllSponsorUsers');
        if (resp.ok) {
          const all = await resp.json();
          const current = all.find((s) => s.UserID === user.UserID);
          setSponsorInfo(current || null);
          if (current && current.SponsorID) fetchSponsorName(current.SponsorID);
        }
      } catch {
        // ignore network errors for now
      }
    }
  };

  const fetchSponsorName = async (sponsorID) => {
    try {
      const resp = await fetch('http://localhost:4000/sponsorAPI/getAllSponsors');
      if (resp.ok) {
        const all = await resp.json();
        const s = all.find((x) => x.SponsorID === sponsorID);
        setSponsorName(s ? s.Name : null);
      }
    } catch {
      // ignore network errors for now
    }
  };

  useEffect(() => {
    checkLastLogin();
    fetchSponsorInfo();
    let list = [];
    try {
      const raw = localStorage.getItem('drivers');
      if (raw) list = JSON.parse(raw);
    } catch {
      list = [];
    }
    if (!Array.isArray(list)) list = [];
    setDriversList(list);
  }, []);

  function openEditorFor(driverId) {
    const d = driversList.find((x) => Number(x.userid) === Number(driverId) || x.userid === driverId);
    if (!d) return alert('Driver not found locally');
    setEditing({ driver: d, newPoints: d.points });
  }

  function saveEdit() {
    if (!editing) return;
    const updated = driversList.map((d) => (Number(d.userid) === Number(editing.driver.userid) ? { ...d, points: Number(editing.newPoints) } : d));
    setDriversList(updated);
    try {
      localStorage.setItem('drivers', JSON.stringify(updated));
      localStorage.setItem('drivers_last_update', JSON.stringify({ userid: editing.driver.userid, points: Number(editing.newPoints), ts: Date.now() }));
    } catch {}
    try { window.dispatchEvent(new Event('driversUpdated')); } catch {}
    setEditing(null);
  }

  const userInfo = getUserInfo();

  if (!sponsor) {
    return (
      <div>
        <SponsorNavbar />
        <div className="container mt-4">No sponsor data available.</div>
      </div>
    );
  }

  return (
    <div>
      <SponsorNavbar />
      <div className="container mt-4">
        <h2>Sponsor Profile</h2>

        <ul className="nav nav-tabs mb-4">
          <li className="nav-item">
            <button className={`nav-link ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>Profile Information</button>
          </li>
          <li className="nav-item">
            <button className={`nav-link ${activeTab === 'password' ? 'active' : ''}`} onClick={() => setActiveTab('password')}>Change Password</button>
          </li>
        </ul>

        {activeTab === 'profile' && (
          <div>
            {userInfo && (
              <div className="card mb-4">
                <div className="card-header">
                  <h4 className="mb-0"><i className="fas fa-user me-2"></i>Current User Information</h4>
                </div>
                <div className="card-body">
                  <div className="row">
                    <div className="col-md-6">
                      <p><strong>User ID:</strong> {userInfo.UserID}</p>
                      <p><strong>Name:</strong> {userInfo.FirstName} {userInfo.LastName}</p>
                      <p><strong>Email:</strong> {userInfo.Email}</p>
                      <p><strong>User Type:</strong> {getUserTypeString(userInfo.UserType)}</p>
                    </div>
                    <div className="col-md-6">
                      {sponsorInfo ? (
                        <>
                          <p><strong>Sponsor User ID:</strong> {sponsorInfo.SponsorUserID}</p>
                          <p><strong>Sponsor ID:</strong> {sponsorInfo.SponsorID}{sponsorName ? ` (${sponsorName})` : ''}</p>
                        </>
                      ) : (
                        <p><em>Loading sponsor information...</em></p>
                      )}
                      {showPasswordChangeButton && (
                        <div className="alert alert-warning mt-2">
                          <i className="fas fa-exclamation-triangle me-2"></i>
                          <strong>Security Notice:</strong>
                          <p className="mb-2 mt-1">
                            {userInfo.LastLogin ? `It has been ${getTimeSinceLastLogin(new Date(userInfo.LastLogin))} since your last login.` : 'We have no record of your last login.'}
                            <br />We recommend updating your password for security.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

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
                a.href = url; a.download = 'drivers_export.json'; a.click(); URL.revokeObjectURL(url);
              }}>Export Drivers JSON</button>

              <label className="btn btn-outline-secondary mb-0">
                Import JSON
                <input type="file" accept="application/json" style={{ display: 'none' }} onChange={(e) => {
                  const f = e.target.files && e.target.files[0]; if (!f) return; const reader = new FileReader();
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
          </div>
        )}

        {activeTab === 'password' && (
          <div>
            <h5>Change Password</h5>
            <div className="row">
              <div className="col-md-6">
                <HelperPasswordChange UserID={sponsor.userid} />
              </div>
            </div>
          </div>
        )}

        {editing && (
          <div style={{ position: 'fixed', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', background: '#fff', padding: 20, borderRadius: 8, boxShadow: '0 4px 20px rgba(0,0,0,.3)', zIndex: 9999, width: 360 }}>
            <h5>Edit points — {editing.driver.firstName} {editing.driver.lastName}</h5>
            <div style={{ marginTop: 8 }}>
              <label>New points</label>
              <input type="number" value={editing.newPoints} onChange={(e) => setEditing({ ...editing, newPoints: e.target.value })} className="form-control" />
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setEditing(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={saveEdit}>Save</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
 