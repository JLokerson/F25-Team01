import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Link } from 'react-router-dom';
import { HashPassword, GenerateSalt } from '../MiscellaneousParts/HashPass';

export default function HelperPasswordChange(UserID = 1) {
    const [newpass1, setnewpass1] = useState('');
    const [newpass2, setnewpass2] = useState('');
    const [oldpass, setoldpass] = useState('');
    const [showNewPass1, setShowNewPass1] = useState(false);
    const [showNewPass2, setShowNewPass2] = useState(false);
    const [showOldPass, setShowOldPass] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState(''); // 'success' or 'error' messages

    async function AttemptUpdate(newpass){
        let salt = GenerateSalt();
        let hashedPassword = await HashPassword(newpass+salt);
        setMessage("Processing password change...");
        setMessageType("info");
            
        try {
        const response = await fetch(`http://localhost:4000/userAPI/updatePassword?UserID=${UserID}&Password=${encodeURIComponent(newpass)}&PasswordSalt=${encodeURIComponent(salt)}`, {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json',
            }
        });

        console.log('Request URL:', `http://localhost:4000/userAPI/updatePassword?UserID=${UserID}&Password=${encodeURIComponent(newpass)}&PasswordSalt=${encodeURIComponent(salt)}`);

        // Debug: Log the response status and text
        console.log('Response status:', response.status);
        const responseText = await response.text();
        console.log('Response text:', responseText);

        // Try to parse as JSON only if we got a response
        let data;
        try {
            data = JSON.parse(responseText);
        } catch (parseError) {
            console.error('Failed to parse JSON:', parseError);
            console.error('Raw response:', responseText);
            setMessage("Server error. Check console for details.");
            setMessageType("error");
            return;
        }

        if (!response.ok) {
            setMessage(data.message || "Password change failed. Please check your credentials.");
            setMessageType("error");
            return;
        }
        
        // Store user info TODO: MAKE THIS USE COOKIES
        console.log('Password change successful.');
        setMessage("Password changed successfully!");
        setMessageType("success");
        // Clear form fields
        setnewpass1('');
        setnewpass2('');
        setoldpass('');
        
        } catch (error) {
        console.error('Unknown error:', error);
        setMessage("Network error. Please try again.");
        setMessageType("error");
        }
    }

    function ChangePassword(e){
        e.preventDefault();
        setMessage(''); // Clear previous messages
        
        if(newpass1 === newpass2){
            // ATTEMPT TO UPDATE PASSWORD IF OLDPASS CORRECT
            if(oldpass){
                AttemptUpdate(newpass1);
                return;
            }

            // IF NOT CORRECT:
            setMessage('Incorrect Current Password. Password Not Updated.');
            setMessageType("error");
        }else{
            setMessage('Passwords do not match.');
            setMessageType("error");
        }
    }

    return (
        <div>
                <form onSubmit={ChangePassword}>
                <div className="mb-3">
                <label htmlFor="newpass1" className="form-label">New password</label>
                <div className="input-group">
                    <input
                        type={showNewPass1 ? "text" : "password"}
                        id="newpass1"
                        className="form-control"
                        value={newpass1}
                        onChange={e => setnewpass1(e.target.value)}
                        required
                    />
                    <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => setShowNewPass1(!showNewPass1)}
                        tabIndex={-1}
                    >
                        {showNewPass1 ? "Hide" : "Show"}
                    </button>
                </div>
                </div>
                <div className="mb-3">
                <label htmlFor="newpass2" className="form-label">New password (must match)</label>
                <div className="input-group">
                    <input
                        type={showNewPass2 ? "text" : "password"}
                        id="newpass2"
                        className="form-control"
                        value={newpass2}
                        onChange={e => setnewpass2(e.target.value)}
                        required
                    />
                    <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => setShowNewPass2(!showNewPass2)}
                        tabIndex={-1}
                    >
                        {showNewPass2 ? "Hide" : "Show"}
                    </button>
                </div>
                </div>
                <div className="mb-3">
                <label htmlFor="oldpass" className="form-label">Current password</label>
                <div className="input-group">
                    <input
                        type={showOldPass ? "text" : "password"}
                        id="oldpass"
                        className="form-control"
                        value={oldpass}
                        onChange={e => setoldpass(e.target.value)}
                        required
                    />
                    <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => setShowOldPass(!showOldPass)}
                        tabIndex={-1}
                    >
                        {showOldPass ? "Hide" : "Show"}
                    </button>
                </div>
                </div>
                <button type="submit" className="btn btn-primary w-100">Change Password</button>
            </form>
            
            {message && (
                <div className={`mt-3 alert ${
                    messageType === 'success' ? 'alert-success' : 
                    messageType === 'error' ? 'alert-danger' : 
                    'alert-info'
                }`}>
                    {message}
                </div>
            )}
        </div>
    );
}