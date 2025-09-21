import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Link } from 'react-router-dom';
import AdminNavbar from AdminNavbar;

export default function Login() {
    return (
        <div>
            {AdminNavbar()}
            {/* Place admin home page text below here */}
        </div>
    );
}