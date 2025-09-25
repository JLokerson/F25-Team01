import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Link, useNavigate } from 'react-router-dom';
import DriverNavbar from './DriverNavbar';

export default function CartPage() {
    let navigate = useNavigate(); 

    
    function OrderConfirm(){
        // Make a call to grab the orders associated with the currently logged in user here
        let CartItems = null

        // Check if cart has items.
        if (CartItems == null){
            alert('No items in cart to order');
            return;
        }else{

            // Place an order.
            

            // Go to confirmation page
            navigate('/OrderConfirmation');
        }
    }
    return (
        <div>
            {DriverNavbar()}
            <button type="submit" onClick={OrderConfirm} className="btn btn-info">Order All</button>
        </div>
    );
}