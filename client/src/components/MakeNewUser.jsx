import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import AdminNavbar from './AdminNavbar';
import { GenerateSalt } from './MiscellaneousParts/HashPass';

export default function MakeNewUser() {
    const [form, setForm] = useState({
        FirstName: '',
        LastName: '',
        Email: '',
        Password: '',
        UserType: 1, // 1=Driver, 2=Sponsor, 3=Admin
    });
    const [message, setMessage] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        if (type === 'radio') {
            setForm({
                ...form,
                UserType: Number(value)
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
            const response = await fetch(`http://localhost:4000/userAPI/checkEmail?email=${encodeURIComponent(email)}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
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

        // Basic validation
        if (!user.FirstName || !user.LastName || !user.Email || !user.Password) {
            setMessage('All fields are required.');
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
            const response = await fetch('http://localhost:4000/userAPI/addUser', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(user)
            });
            const data = await response.json().catch(() => ({}));
            console.log('Response from server:', response.status, data); // Log what is received

            if (response.ok) {
                setMessage('User created successfully!');
            } else {
                setMessage('Failed to create user: ' + (data.message || 'Unknown error'));
            }
        } catch (err) {
            setMessage('Error: ' + err.message);
        }
    };

    return (
        <div>
            {AdminNavbar()}
            <div className="container mt-4">
                <h2>Make New User</h2>
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
                    <button type="submit" className="btn btn-primary">Create User</button>
                </form>
                {message && (
                    <div className="alert alert-info mt-3" style={{ whiteSpace: 'pre-wrap' }}>
                        {message}
                    </div>
                )}
            </div>
        </div>
    );
}