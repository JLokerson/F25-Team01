import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import 'bootstrap/dist/css/bootstrap.min.css';
import initialProducts from '../content/json-assets/product_sample.json';

export default function Products() {
    console.log("Catalog of all products. Products component rendered. Products.jsx");

    const [products, setProducts] = useState([]);
    const [view, setView] = useState('all'); // 'all' | 'popular'

    // Load products from localStorage or initial JSON on mount
    useEffect(() => {
        const stored = localStorage.getItem('products');
        if (stored) {
            try {
                setProducts(JSON.parse(stored));
                return;
            } catch (e) {
                console.error('Failed to parse stored products', e);
            }
        }
        // Deep copy initialProducts to avoid accidental mutation
        const copied = initialProducts.map(p => ({ ...p }));
        setProducts(copied);
        localStorage.setItem('products', JSON.stringify(copied));
    }, []);

    // Persist products whenever they change
    useEffect(() => {
        localStorage.setItem('products', JSON.stringify(products));
    }, [products]);

    // Add item to cart: decrement stock, increment popularity, add to cart list
    const addToCart = (itemId) => {
        setProducts(prev => {
            const next = prev.map(p => {
                if (p.ITEM_ID === itemId) {
                    if ((p.ITEM_STOCK ?? 0) <= 0) {
                        alert('Item out of stock');
                        return p;
                    }
                    return { ...p, ITEM_STOCK: (p.ITEM_STOCK ?? 0) - 1, ITEM_POPULARITY: (p.ITEM_POPULARITY ?? 0) + 1 };
                }
                return p;
            });
            return next;
        });

        // update cart in localStorage (array of ITEM_IDs)
        const raw = localStorage.getItem('cart') || '[]';
        let cart = [];
        try { cart = JSON.parse(raw); } catch (e) { cart = []; }
        cart.push(itemId);
        localStorage.setItem('cart', JSON.stringify(cart));
    };

    // Remove item from cart helper (used by CartPage) — exported via window for small app wiring
    const removeFromCart = (itemId) => {
        // Restore stock by +1 and don't change popularity
        setProducts(prev => prev.map(p => p.ITEM_ID === itemId ? { ...p, ITEM_STOCK: (p.ITEM_STOCK ?? 0) + 1 } : p));

        const raw = localStorage.getItem('cart') || '[]';
        let cart = [];
        try { cart = JSON.parse(raw); } catch (e) { cart = []; }
        const idx = cart.indexOf(itemId);
        if (idx !== -1) cart.splice(idx, 1);
        localStorage.setItem('cart', JSON.stringify(cart));
    };

    // make removeFromCart available globally so CartPage (currently simple) can call it without refactor
    useEffect(() => {
        window.__app_removeFromCart = removeFromCart;
    }, [products]);

    const productsToShow = () => {
        if (view === 'popular') {
            return [...products].sort((a, b) => (b.ITEM_POPULARITY ?? 0) - (a.ITEM_POPULARITY ?? 0));
        }
        return products;
    };

    return (
        <div className="container my-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h1>Product Catalog</h1>
                <Link to="/DriverHome" className="btn btn-secondary">Back to Driver Home</Link>
            </div>

            <div className="mb-3">
                <div className="btn-group" role="group" aria-label="Product view tabs">
                    <button className={`btn btn-outline-primary ${view === 'all' ? 'active' : ''}`} onClick={() => setView('all')}>All</button>
                    <button className={`btn btn-outline-primary ${view === 'popular' ? 'active' : ''}`} onClick={() => setView('popular')}>Most popular</button>
                </div>
            </div>

            <div className="row g-3">
                {productsToShow().map(item => (
                    <div className="col-12 col-sm-6 col-md-4" key={item.ITEM_ID}>
                        <div className="card h-100">
                            {item.ITEM_IMG ? (
                                <img src={item.ITEM_IMG} className="card-img-top" alt={item.ITEM_NAME} style={{objectFit: 'cover', height: '180px'}} />
                            ) : (
                                <div className="bg-light d-flex align-items-center justify-content-center" style={{height: '180px'}}>
                                    <span className="text-muted">No image</span>
                                </div>
                            )}
                            <div className="card-body d-flex flex-column">
                                <h5 className="card-title">{item.ITEM_NAME}</h5>
                                <p className="card-text" style={{flex: 1}}>{item.ITEM_DES}</p>
                                <div className="d-flex justify-content-between align-items-center mt-2">
                                    <div>
                                        <strong>${item.ITEM_PRICE}</strong>
                                        <div className="text-muted small">Stock: {item.ITEM_STOCK}</div>
                                        <div className="text-muted small">Popularity: {item.ITEM_POPULARITY}</div>
                                    </div>
                                    <button className="btn btn-primary" onClick={() => addToCart(item.ITEM_ID)} disabled={(item.ITEM_STOCK ?? 0) <= 0}>Redeem</button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
