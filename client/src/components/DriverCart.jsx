import React, { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Link, useNavigate } from 'react-router-dom';
import DriverNavbar from './DriverNavbar';

export default function DriverCart() {
    let navigate = useNavigate();

    
    function OrderConfirm(){
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
            userID: UserID
            })
        });

        // Debug: Log the response status and text
        console.log('Response status:', response.status);
        const responseText = await response.text();
        console.log('Response text:', responseText);

        // Gets the response and parses it as JSON
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
        if (!CartItems || CartItems.length === 0){
            alert('No items in cart to order');
            return;
        }else{
            // Build an order object and persist to localStorage (simple client-side orders)
            const prodRaw = localStorage.getItem('products') || '[]';
            let prods = [];
            try { prods = JSON.parse(prodRaw); } catch (e) { prods = []; }

            // Create snapshot of ordered items (including price at time of order)
            const items = cart.map(id => {
                const p = prods.find(x => x.ITEM_ID === id);
                return p ? { ITEM_ID: p.ITEM_ID, ITEM_NAME: p.ITEM_NAME, ITEM_PRICE: p.ITEM_PRICE } : { ITEM_ID: id };
            });

            const order = {
                id: Date.now(),
                timestamp: new Date().toISOString(),
                user: user ?? null,
                items,
            };

            const ordersRaw = localStorage.getItem('orders') || '[]';
            let orders = [];
            try { orders = JSON.parse(ordersRaw); } catch (e) { orders = []; }
            orders.push(order);
            localStorage.setItem('orders', JSON.stringify(orders));

            // Clear cart
            localStorage.setItem('cart', JSON.stringify([]));
            setCart([]);

            // Persist products array (products were already mutated on addToCart in Products.jsx via localStorage)
            // But ensure any local productsMap changes are written back too
            try {
                const prodMap = productsMap;
                const prodsArray = Object.keys(prodMap).map(k => prodMap[k]);
                localStorage.setItem('products', JSON.stringify(prodsArray));
            } catch (e) {
                // Ignore here
            }

            // Navigate to confirmation
            navigate('/DriverOrderConfirmation');
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
            <div className="container my-5">
                <h3>Your Cart</h3>
                {/* If not a driver, show a warning but still display cart contents */}
                {userType !== 3 && (
                    <p className="text-warning">The cart is only available to drivers. You can still view the cart contents below.</p>
                )}

                {/* Cart contents */}
                {cart.length === 0 ? (
                    <p>Your cart is empty.</p>
                ) : (
                    <div className="list-group mb-3">
                        {cart.map(id => productsMap[id]).filter(Boolean).map(item => (
                            <div key={item.ITEM_ID} className="list-group-item d-flex justify-content-between align-items-center">
                                <div>
                                    <div><strong>{item.ITEM_NAME}</strong></div>
                                    <div className="text-muted small">Price: ${item.ITEM_PRICE} • Stock: {item.ITEM_STOCK}</div>
                                </div>
                                <div>
                                    <button className="btn btn-sm btn-danger me-2" onClick={() => remove(item.ITEM_ID)}>Remove</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="d-flex">
                    <button type="submit" onClick={OrderConfirm} className="btn btn-info me-2" disabled={userType !== 3}>Order All</button>
                    <Link to="/DriverHome" className="btn btn-secondary">Back</Link>
                </div>
            </div>
        </div>
    );
}