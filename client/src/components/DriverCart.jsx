import React, { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Link, useNavigate } from 'react-router-dom';
import DriverNavbar from './DriverNavbar';

export default function DriverCart() {
    let navigate = useNavigate();

    // read user from localStorage to determine availability
    let user = null;
    try { user = JSON.parse(localStorage.getItem('user')); } catch(e) { user = null; }
    const userType = user?.UserType ?? user?.accountType ?? null;

    // Cart is stored as an array of ITEM_IDs
    const [cart, setCart] = useState([]);
    const [productsMap, setProductsMap] = useState({});

    useEffect(() => {
        console.log('DriverCart mounted: reading cart/products from localStorage');
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

    // listen for cart updates dispatched by other components in the same tab
    useEffect(() => {
        const handler = (e) => {
            console.log('DriverCart received cartUpdated event', e && e.detail);
            const raw = localStorage.getItem('cart') || '[]';
            try { setCart(JSON.parse(raw)); } catch(e) { setCart([]); }
            const prodRaw = localStorage.getItem('products') || '[]';
            try {
                const prods = JSON.parse(prodRaw);
                const map = {};
                prods.forEach(p => map[p.ITEM_ID] = p);
                setProductsMap(map);
            } catch(e) { setProductsMap({}); }
        };
        window.addEventListener('cartUpdated', handler);
        // also listen to storage events for other tabs
        const storageHandler = (e) => {
            console.log('DriverCart received storage event', e);
            if (e.key === 'cart' || e.key === 'products') handler(e);
        };
        window.addEventListener('storage', storageHandler);
        return () => {
            window.removeEventListener('cartUpdated', handler);
            window.removeEventListener('storage', storageHandler);
        };
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

    function OrderConfirm(){
        // Use local cart to determine items to order
        let CartItems = cart;

        // Check if cart has items.
        if (!CartItems || CartItems.length === 0){
            alert('No items in cart to order');
            return;
        }else{
            // Build an order object and persist to localStorage (simple client-side orders)
            const prodRaw = localStorage.getItem('products') || '[]';
            let prods = [];
            try { prods = JSON.parse(prodRaw); } catch (e) { prods = []; }

            // create snapshot of ordered items (including price at time of order)
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
                // ignore
            }

            // Navigate to confirmation
            navigate('/DriverOrderConfirmation');
        }
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