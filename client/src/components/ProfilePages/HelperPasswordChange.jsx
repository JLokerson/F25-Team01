import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Link } from 'react-router-dom';
import HashPassword, { GenerateSalt } from '../MiscellaneousParts/HashPass';

export default function HelperPasswordChange(UserID = -1) {
    const [newpass1, setnewpass1] = useState('');
    const [newpass2, setnewpass2] = useState('');
    const [oldpass, setoldpass] = useState('');

    async function AttemptUpdate(newpass){
        let salt = GenerateSalt;
        await alert("Hash is " + await HashPassword(newpass+salt));
            
        try {
        const response = await fetch("http://localhost:4000/userAPI/updatePassword", {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json',
            },
            body: JSON.stringify({
            userID: UserID,
            Password: newpass,
            PasswordSalt: salt
            })
        });

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
            alert("Server error. Check console for details.");
            return;
        }

        if (!response.ok) {
            alert(data.message || "Password change failed. Please check your credentials.");
            return;
        }
        
        // Store user info (consider using localStorage or context)
        console.log('Password change successful.');
        
        } catch (error) {
        console.error('Unknown error:', error);
        alert("Network error. Please try again.");
        }

    }


    function ChangePassword(){
        if(newpass1 === newpass2){
            // ATTEMPT TO UPDATE PASSWORD IF OLDPASS CORRECT
            if(oldpass){
                AttemptUpdate(newpass1);
            }

            // IF NOT CORRECT:
            alert('Incorrect Current Password. Password Not Updated.');
        }else{
            alert('Passwords do not match.');
        }
    }



    return (
        <div>
                <form onSubmit={ChangePassword}>
                <div className="mb-3">
                <label htmlFor="newpass1" className="form-label">New password</label>
                <input
                    type="password"
                    id="newpass1"
                    className="form-control"
                    value={newpass1}
                    onChange={e => setnewpass1(e.target.value)}
                    required
                />
                </div>
                <div className="mb-3">
                <label htmlFor="newpass2" className="form-label">New password (must match)</label>
                <input
                    type="password"
                    id="newpass2"
                    className="form-control"
                    value={newpass2}
                    onChange={e => setnewpass2(e.target.value)}
                    required
                />
                </div>
                <div className="mb-3">
                <label htmlFor="oldpass" className="form-label">Current password</label>
                <input
                    type="password"
                    id="oldpass"
                    className="form-control"
                    value={oldpass}
                    onChange={e => setoldpass(e.target.value)}
                    required
                />
                </div>
                <button type="submit" className="btn btn-primary w-100">Change Password</button>
            </form>
        </div>
    );
}