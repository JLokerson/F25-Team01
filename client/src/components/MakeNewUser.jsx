import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import AdminNavbar from './AdminNavbar';
import { GenerateSalt } from './MiscellaneousParts/HashPass';
import { addUser, checkEmailExist } from './MiscellaneousParts/ServerCall';

export default function MakeNewUser() {
    const [form, setForm] = useState({
        FirstName: '',
        LastName: '',
        Email: '',
        Password: '',
        UserType: 1, // 1=Driver, 2=Sponsor, 3=Admin
        SponsorID: '', // Add sponsor selection for drivers and sponsors
    });
    const [sponsorOrgs, setSponsorOrgs] = useState([]); // Add sponsor organizations state
    const [message, setMessage] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [activeTab, setActiveTab] = useState('user'); // Add tab state
    const [newSponsorOrg, setNewSponsorOrg] = useState({ // Add new sponsor org state
        Name: '',
        PointRatio: 0.01,
        EnabledSponsor: 1
    });

    // Fetch sponsor organizations for driver creation
    const fetchSponsorOrgs = async () => {
        try {
            const response = await fetch(`http://localhost:4000/sponsorAPI/getAllSponsors`);
            if (response.ok) {
                const data = await response.json();
                // Filter to only active sponsors
                const activeSponsors = data.filter(org => org.EnabledSponsor === 1);
                setSponsorOrgs(activeSponsors);
            } else {
                console.error('Failed to fetch sponsor organizations');
                setSponsorOrgs([]);
            }
        } catch (error) {
            console.error('Error fetching sponsor organizations:', error);
            setSponsorOrgs([]);
        }
    };

    useEffect(() => {
        fetchSponsorOrgs();
    }, []);

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        if (type === 'radio') {
            setForm({
                ...form,
                UserType: Number(value),
                SponsorID: (Number(value) === 1 || Number(value) === 2) ? form.SponsorID : '' // Clear sponsor if not driver or sponsor
            });
        } else {
            setForm({
                ...form,
                [name]: value
            });
        }
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const checkEmailExists = async (email) => {
        try {
            const response = await checkEmailExist(email);
            const data = await response.json();
            return data.exists; // Assuming backend returns { exists: true/false }
        } catch (error) {
            console.error('Error checking email:', error);
            return false; // Assume email doesn't exist if check fails
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        // Trim values to avoid accidental spaces
        const user = {
            FirstName: form.FirstName.trim(),
            LastName: form.LastName.trim(),
            Email: form.Email.trim(),
            Password: form.Password,
            PasswordSalt: GenerateSalt(),
            UserType: form.UserType
        };

        // Add SponsorID for drivers and sponsors
        if ((form.UserType === 1 || form.UserType === 2) && form.SponsorID) {
            user.SponsorID = form.SponsorID;
        }

        // Basic validation
        if (!user.FirstName || !user.LastName || !user.Email || !user.Password) {
            setMessage('All fields are required.');
            return;
        }

        // Validate sponsor selection for drivers and sponsors
        if ((form.UserType === 1 || form.UserType === 2) && !form.SponsorID) {
            setMessage(`Please select a sponsor organization for the ${form.UserType === 1 ? 'driver' : 'sponsor'}.`);
            return;
        }

        // Check for duplicate email
        const emailExists = await checkEmailExists(user.Email);
        if (emailExists) {
            setMessage('A user with this email already exists. Please use a different email.');
            return;
        }

        console.log('Submitting user:', user); // Log what is being sent

        try {
            const response = await addUser(user);
            const data = await response.json().catch(() => ({}));
            console.log('Response from server:', response.status, data); // Log what is received

            if (response.ok) {
                setMessage('User created successfully!');
                // Reset form
                setForm({
                    FirstName: '',
                    LastName: '',
                    Email: '',
                    Password: '',
                    UserType: 1,
                    SponsorID: ''
                });
            } else {
                setMessage('Failed to create user: ' + (data.message || 'Unknown error'));
            }
        } catch (err) {
            setMessage('Error: ' + err.message);
        }
    };

    const handleAddSponsorOrg = async (e) => {
        e.preventDefault();

        try {
            const orgData = {
                Name: newSponsorOrg.Name.trim(),
                PointRatio: parseFloat(newSponsorOrg.PointRatio),
                EnabledSponsor: parseInt(newSponsorOrg.EnabledSponsor)
            };

            console.log('Creating sponsor organization:', orgData);
            
            const response = await fetch(`http://localhost:4000/sponsorAPI/addSponsor`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(orgData)
            });

            if (response.ok) {
                const responseData = await response.text();
                console.log('Sponsor org creation response:', responseData);
                setMessage('Sponsor organization added successfully!');
                setNewSponsorOrg({
                    Name: '',
                    PointRatio: 0.01,
                    EnabledSponsor: 1
                });
                fetchSponsorOrgs(); // Refresh the list
            } else {
                const errorText = await response.text();
                console.error('Error adding sponsor org:', errorText);
                setMessage(`Error adding sponsor organization: ${errorText}`);
            }
        } catch (error) {
            console.error('Error adding sponsor org:', error);
            setMessage('Error adding sponsor organization');
        }
    };

    return (
        <div>
            {AdminNavbar()}
            <div className="container mt-4">
                <h2>Management Tools</h2>
                
                {/* Tab Navigation */}
                <ul className="nav nav-tabs mb-3">
                    <li className="nav-item">
                        <button 
                            className={`nav-link ${activeTab === 'user' ? 'active' : ''}`}
                            onClick={() => setActiveTab('user')}
                        >
                            <i className="fas fa-user-plus me-2"></i>
                            Make New User
                        </button>
                    </li>
                    <li className="nav-item">
                        <button 
                            className={`nav-link ${activeTab === 'sponsor' ? 'active' : ''}`}
                            onClick={() => setActiveTab('sponsor')}
                        >
                            <i className="fas fa-building me-2"></i>
                            Add Sponsor Organization
                        </button>
                    </li>
                </ul>

                {/* User Creation Tab */}
                {activeTab === 'user' && (
                    <>
                        <h3>Create New User</h3>
                        <form onSubmit={handleSubmit} className="mt-3">
                            <div className="mb-3">
                                <label className="form-label">First Name</label>
                                <input type="text" className="form-control" name="FirstName" value={form.FirstName} onChange={handleChange} required />
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Last Name</label>
                                <input type="text" className="form-control" name="LastName" value={form.LastName} onChange={handleChange} required />
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Email</label>
                                <input type="email" className="form-control" name="Email" value={form.Email} onChange={handleChange} required />
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Password</label>
                                <div className="input-group">
                                    <input 
                                        type={showPassword ? "text" : "password"} 
                                        className="form-control" 
                                        name="Password" 
                                        value={form.Password} 
                                        onChange={handleChange} 
                                        required 
                                    />
                                    <button 
                                        type="button" 
                                        className="btn btn-outline-secondary" 
                                        onClick={togglePasswordVisibility}
                                    >
                                        {showPassword ? "Hide" : "Show"}
                                    </button>
                                </div>
                            </div>
                            <div className="mb-3">
                                <label className="form-label">User Type</label>
                                <div>
                                    <input
                                        type="radio"
                                        id="driver"
                                        name="UserType"
                                        value="1"
                                        checked={form.UserType === 1}
                                        onChange={handleChange}
                                    />
                                    <label htmlFor="driver" className="ms-1 me-3">Driver</label>
                                    <input
                                        type="radio"
                                        id="sponsor"
                                        name="UserType"
                                        value="2"
                                        checked={form.UserType === 2}
                                        onChange={handleChange}
                                    />
                                    <label htmlFor="sponsor" className="ms-1 me-3">Sponsor</label>
                                    <input
                                        type="radio"
                                        id="admin"
                                        name="UserType"
                                        value="3"
                                        checked={form.UserType === 3}
                                        onChange={handleChange}
                                    />
                                    <label htmlFor="admin" className="ms-1">Admin</label>
                                </div>
                            </div>
                            
                            {/* Show sponsor selection for drivers and sponsors */}
                            {(form.UserType === 1 || form.UserType === 2) && (
                                <div className="mb-3">
                                    <label className="form-label">Sponsor Organization *</label>
                                    <select 
                                        className="form-control"
                                        name="SponsorID"
                                        value={form.SponsorID}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="">Select a sponsor organization...</option>
                                        {sponsorOrgs.map(org => (
                                            <option key={org.SponsorID} value={org.SponsorID}>
                                                {org.Name} (ID: {org.SponsorID}) - Point Ratio: {org.PointRatio}
                                            </option>
                                        ))}
                                    </select>
                                    {sponsorOrgs.length === 0 && (
                                        <div className="form-text text-warning">
                                            No active sponsor organizations found. Please add sponsor organizations first using the "Add Sponsor Organization" tab.
                                        </div>
                                    )}
                                </div>
                            )}
                            
                            <button type="submit" className="btn btn-primary">Create User</button>
                        </form>
                    </>
                )}

                {/* Sponsor Organization Creation Tab */}
                {activeTab === 'sponsor' && (
                    <>
                        <h3>Add New Sponsor Organization</h3>
                        <form onSubmit={handleAddSponsorOrg} className="mt-3">
                            <div className="mb-3">
                                <label className="form-label">Organization Name *</label>
                                <input 
                                    type="text" 
                                    className="form-control"
                                    value={newSponsorOrg.Name}
                                    onChange={(e) => setNewSponsorOrg({...newSponsorOrg, Name: e.target.value})}
                                    required
                                    placeholder="Enter company/organization name"
                                />
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Point Ratio *</label>
                                <input 
                                    type="number" 
                                    step="0.001"
                                    min="0"
                                    max="1"
                                    className="form-control"
                                    value={newSponsorOrg.PointRatio}
                                    onChange={(e) => setNewSponsorOrg({...newSponsorOrg, PointRatio: e.target.value})}
                                    required
                                />
                                <div className="form-text">
                                    Ratio of points earned per dollar spent (e.g., 0.01 = 1 point per $100 spent)
                                    <br />
                                    Common values: 0.01 (1%), 0.005 (0.5%), 0.02 (2%)
                                </div>
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Initial Status *</label>
                                <select 
                                    className="form-control"
                                    value={newSponsorOrg.EnabledSponsor}
                                    onChange={(e) => setNewSponsorOrg({...newSponsorOrg, EnabledSponsor: parseInt(e.target.value)})}
                                    required
                                >
                                    <option value={1}>Active (Users can be assigned to this organization)</option>
                                    <option value={0}>Disabled (Organization exists but inactive)</option>
                                </select>
                            </div>
                            
                            <button type="submit" className="btn btn-success">
                                <i className="fas fa-plus me-2"></i>
                                Add Sponsor Organization
                            </button>
                        </form>

                        <div className="mt-4">
                            <h5>Current Sponsor Organizations</h5>
                            <div className="table-responsive">
                                <table className="table table-sm table-striped">
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Name</th>
                                            <th>Point Ratio</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sponsorOrgs.map(org => (
                                            <tr key={org.SponsorID}>
                                                <td>{org.SponsorID}</td>
                                                <td>{org.Name}</td>
                                                <td>{org.PointRatio}</td>
                                                <td>
                                                    <span className={`badge ${org.EnabledSponsor === 1 ? 'bg-success' : 'bg-secondary'}`}>
                                                        {org.EnabledSponsor === 1 ? 'Active' : 'Disabled'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {sponsorOrgs.length === 0 && (
                                <p className="text-muted">No sponsor organizations found. Add some above to get started.</p>
                            )}
                        </div>
                    </>
                )}

                {message && (
                    <div className="alert alert-info mt-3" style={{ whiteSpace: 'pre-wrap' }}>
                        {message}
                    </div>
                )}
            </div>
        </div>
    );
}