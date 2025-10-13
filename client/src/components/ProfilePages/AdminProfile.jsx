import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Link } from 'react-router-dom';
import AdminNavbar from '../AdminNavbar';
import HelperPasswordChange from './HelperPasswordChange';
import { CookiesProvider, useCookies } from 'react-cookie';

export default function AdminProfile() {
    console.log('AdminProfile rendered');
    const [cookies, setCookie] = useCookies(['username', 'password']);
    
    // Ensure this is actually a sponsor user.
    // TO-DO: verify the login returned success and not fail, rn only checks if error.
    function VerifyLogin(){
        try{
            let userinfo = {
            "email": cookies.username,
            "password": cookies.password,
            };
            return true;
        }catch(e){
            return false;
        }
    }

    return (
        <div>
            {AdminNavbar()}
            {/* Place profile stuff below here*/}
            {HelperPasswordChange()}
            <p>Hey this is where you will one day see your profile, assuming you have one.</p>
        </div>
    );
}