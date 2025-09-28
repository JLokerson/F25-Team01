import React, { useEffect, useState } from 'react';

export default function CartPage(){
  // read user from localStorage to determine availability
  let user = null;
  try { user = JSON.parse(localStorage.getItem('user')); } catch(e) { user = null; }
  const userType = user?.UserType ?? user?.accountType ?? null;
  // Cart is stored as an array of ITEM_IDs
  const [cart, setCart] = useState([]); // array of ITEM_IDs
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

  if (userType !== 3) {
    return (
      <div className="container my-5">
        <h3>Cart</h3>
        <p>The cart is only available to drivers. If you believe this is an error, please contact an administrator.</p>
      </div>
    );
  }

  const items = cart.map(id => productsMap[id]).filter(Boolean);

  return (
    <div className="container my-5">
      <h3>Your Cart</h3>
      {items.length === 0 ? (
        <p>Your cart is empty.</p>
      ) : (
        <div className="list-group">
          {items.map(item => (
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
    </div>
  );
}
