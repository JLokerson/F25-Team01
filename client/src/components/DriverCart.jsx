import React, { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Link, useNavigate } from 'react-router-dom';
import DriverNavbar from './DriverNavbar';
import driversSeed from '../content/json-assets/driver_sample.json';

export default function DriverCart() {
    let navigate = useNavigate();
    // read user from localStorage to determine availability
    let user = null;
    try { user = JSON.parse(localStorage.getItem('user')); } catch(e) { user = null; }
    const userType = 1 /*user?.UserType ?? user?.accountType ?? null*/;

    // Cart is stored as an array of ITEM_IDs
    const [cart, setCart] = useState([]);
    const [productsMap, setProductsMap] = useState({});

    useEffect(() => {
        const raw = localStorage.getItem('cart') || '[]';
        try { setCart(JSON.parse(raw)); } catch(e) { setCart([]); }

        const prodRaw = localStorage.getItem('products') || '[]';
        try {
            const prods = JSON.parse(prodRaw);
            const map = {};
            prods.forEach(p => map[p.ITEM_ID] = p);
            setProductsMap(map);
        } catch(e) { setProductsMap({}); }
    }, []);

    const remove = (itemId) => {
        // call the global helper created in Products.jsx
        if (window.__app_removeFromCart) {
            window.__app_removeFromCart(itemId);
        }
        // update local cart view
        setCart(prev => {
            const next = [...prev];
            const idx = next.indexOf(itemId);
            if (idx !== -1) next.splice(idx, 1);
            localStorage.setItem('cart', JSON.stringify(next));
            return next;
        });
        // update local products map for UI
        setProductsMap(prev => {
            const p = prev[itemId];
            if (!p) return prev;
            const updated = { ...prev, [itemId]: { ...p, ITEM_STOCK: (p.ITEM_STOCK ?? 0) + 1 } };
            return updated;
        });
    };

    async function OrderConfirm(){
        // Use local cart to determine items to order
        let CartItems = cart;

        // REQUEST HANDLING START
        try {
        const response = await fetch("http://localhost:4000/CartAPI/getCartItems", {
            method: 'GET',
            headers: {
            'Content-Type': 'application/json',
            },
            body: JSON.stringify({
            userID: /*user?.UserID || user?.ID*/1
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
        if (!CartItems || CartItems.length === 0){
            alert('No items in cart to order');
            return;
        }else{
            // TODO: Place an order (call server API) - currently just navigate
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
            // --- Update driver points: deduct points for userid=1 by total cost of ordered items ---
            try {
                const driversRaw = localStorage.getItem('drivers');
                let driversList = [];
                if (driversRaw) {
                    try { driversList = JSON.parse(driversRaw); } catch (e) { driversList = []; }
                }

                // If still no drivers persisted, fall back to the bundled seed JSON
                if (!Array.isArray(driversList) || driversList.length === 0) {
                    driversList = Array.isArray(driversSeed) ? driversSeed.map(d => ({ ...d })) : [];
                }

                // Calculate total cost of ordered items (sum of ITEM_PRICE)
                const totalCost = items.reduce((sum, it) => sum + (Number(it.ITEM_PRICE) || 0), 0);

                // Find driver with userid === 1 (numeric or string)
                const target = driversList.find(d => Number(d.userid) === 1 || d.userid === 1);
                if (target) {
                    const current = Number(target.points) || 0;
                    target.points = Math.max(0, current - totalCost);
                } else {
                    // If no driver exists, create a minimal one for userid=1 with negative-adjusted points (clamped to 0)
                    const pts = Math.max(0, 0 - totalCost);
                    driversList.push({ userid: 1, accountType: 1, firstName: 'Driver', lastName: 'One', birthday: '', email: '', points: pts });
                }

                localStorage.setItem('drivers', JSON.stringify(driversList));
                // notify any open pages of drivers change
                try { window.dispatchEvent(new Event('driversUpdated')); } catch (e) { /* ignore */ }
            } catch (e) {
                console.error('Failed to update driver points:', e);
            }


            // Remove items from cart. I can't test this because I can't actually reach this version of the page rn so here's hoping.
            

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
                {userType !== 1 ? (
                    <p>The cart is only available to drivers. If you believe this is an error, please contact an administrator.</p>
                ) : (
                    <>
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
                            <button type="submit" onClick={OrderConfirm} className="btn btn-info me-2">Order All</button>
                            <Link to="/DriverHome" className="btn btn-secondary">Back</Link>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}