import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Link, useNavigate } from 'react-router-dom';
import DriverNavbar from './DriverNavbar';

export default function CartPage() {
    let navigate = useNavigate(); 

    
    async function OrderConfirm(UserID = 1){
        // Make a call to grab the orders associated with the currently logged in user here
        let CartItems = null


        // REQUEST HANDLING START
        try {
        const response = await fetch("http://localhost:4000/CartAPI/getCartItems", {
            method: 'GET',
            headers: {
            'Content-Type': 'application/json',
            },
            body: JSON.stringify({
            DriverID: UserID
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
            alert(data.message || "Failed to fetch cart items.");
            return;
        }

        CartItems = data;

        // Check if cart has items.
        if (CartItems == null){
            alert('No items in cart to order');
            return;
        }else{

            // Place an order.
            

            // Go to confirmation page
            navigate('/OrderConfirmation');
        }
        
        // Store user info (consider using localStorage or context)
        console.log('Cart retrieval successful.');
        
        } catch (error) {
        console.error('Unknown error:', error);
        alert("Error. Please try again.");
        }
        // REQUEST HANDLING STOP
    }
    
    return (
        <div>
            {DriverNavbar()}
            <button type="submit" onClick={OrderConfirm} className="btn btn-info">Order All</button>
        </div>
    );
}