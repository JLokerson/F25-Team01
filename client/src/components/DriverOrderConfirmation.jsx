import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Link } from 'react-router-dom';
import DriverNavbar from './DriverNavbar';

export default function OrderConfirmation() {
    return (
        <div>
            {DriverNavbar()}
            <h1>Your Order has been placed!</h1>
        </div>
    );
}