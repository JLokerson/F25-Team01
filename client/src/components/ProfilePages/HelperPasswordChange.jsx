import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Link } from 'react-router-dom';
import { HashPassword } from '../MiscellaneousParts/HashPass';

export default function HelperPasswordChange(UserID = -1) {
    const [newpass1, setnewpass1] = useState('');
    const [newpass2, setnewpass2] = useState('');
    const [oldpass, setoldpass] = useState('');

    async function AttemptUpdate(newpass){
        let salt = 'boo';
        await alert("Hash is " + await HashPassword(newpass+salt));
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