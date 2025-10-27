import React, { useEffect, useMemo, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Link } from 'react-router-dom';
import DriverNavbar from '../DriverNavbar';
import sponsors from '../../content/json-assets/sponsor-user_sample.json';

// Map a CatalogBuilder item -> app "products" format used by Products/DriverCart
function toProduct(item){
  const id = Number(item.sku) || Number(item.SKU) || Number(item.id) || Number(item.ITEM_ID) || Number(String(item.sku || item.SKU || item.id || item.ITEM_ID).replace(/\D/g,'')) || Date.now();
  return {
    ITEM_ID: id,
    ITEM_NAME: item.name || item.ITEM_NAME || 'Item',
    ITEM_IMG: item.image || item.ITEM_IMG || '',
    ITEM_DES: item.description || item.ITEM_DES || '',
    ITEM_PRICE: Number(item.salePrice ?? item.ITEM_PRICE ?? 0),
    ITEM_STOCK: Number(item.stock ?? item.ITEM_STOCK ?? 999),
    ITEM_POPULARITY: Number(item.popularity ?? item.ITEM_POPULARITY ?? 0),
  };
}

function Card({ product, onAdd }){
  return (
    <div className="card h-100">
      {product.image ? (
        <img src={product.image} className="card-img-top" alt={product.name} style={{objectFit:'cover', height:180}} />
      ) : product.ITEM_IMG ? (
        <img src={product.ITEM_IMG} className="card-img-top" alt={product.ITEM_NAME} style={{objectFit:'cover', height:180}} />
      ) : (
        <div className="bg-light d-flex align-items-center justify-content-center" style={{height:180}}>
          <span className="text-muted">No image</span>
        </div>
      )}
      <div className="card-body d-flex flex-column">
        <h6 className="card-title">{product.name || product.ITEM_NAME}</h6>
        <p className="card-text" style={{flex:1}}>{product.description || product.ITEM_DES}</p>
        <div className="d-flex justify-content-between align-items-center mt-2">
          <strong>{Number(product.salePrice ?? product.ITEM_PRICE).toFixed(0)} pts</strong>
          <button className="btn btn-primary btn-sm" onClick={() => onAdd(product)}>Add to Cart</button>
        </div>
      </div>
    </div>
  );
}

export default function DriverSponsorCatalog(){
  // Determine current driver and their sponsor user id (from sample mapping)
  const [message, setMessage] = useState('');
  const user = useMemo(()=>{
    try { return JSON.parse(localStorage.getItem('user')||'null'); } catch(e){ return null; }
  }, []);
  const driverId = user?.UserID ?? user?.userid ?? 1;

  // Find sponsor-user who owns this driver in the sample mapping
  const sponsorUserId = useMemo(()=>{
    try{
      const owner = (sponsors||[]).find(s => Array.isArray(s.drivers) && s.drivers.some(d => Number(d) === Number(driverId)));
      return owner ? owner.userid : null;
    }catch(e){ return null; }
  }, [driverId]);

  // Load sponsor's catalog saved by CatalogBuilder (localStorage key)
  const [catalog, setCatalog] = useState([]);
  useEffect(()=>{
    if(!sponsorUserId){ setCatalog([]); return; }
    const key = `sponsor_catalog_${sponsorUserId}`;
    try{
      const raw = localStorage.getItem(key);
      if(raw){
        const parsed = JSON.parse(raw);
        setCatalog(parsed.filter(it => it.enabled !== false));
      }else{
        setCatalog([]);
      }
    }catch(e){ setCatalog([]); }
  }, [sponsorUserId]);

  // Add a sponsor catalog item to the app cart/products stores
  function addItem(item){
    // 1) Upsert into products store in the ITEM_* shape
    const product = toProduct(item);
    let products = [];
    try{ products = JSON.parse(localStorage.getItem('products')||'[]'); }catch(e){ products = []; }
    const idx = products.findIndex(p => Number(p.ITEM_ID) === Number(product.ITEM_ID));
    if(idx === -1){
      products.push(product);
    }else{
      products[idx] = { ...products[idx], ...product };
    }
    localStorage.setItem('products', JSON.stringify(products));

    // 2) Push into cart
    let cart = [];
    try{ cart = JSON.parse(localStorage.getItem('cart')||'[]'); }catch(e){ cart = []; }
    cart.push(product.ITEM_ID);
    localStorage.setItem('cart', JSON.stringify(cart));

    // 3) Notify others and show message
    try { window.dispatchEvent(new CustomEvent('cartUpdated', { detail: { cart } })); } catch(e){}
    setMessage(`${product.ITEM_NAME} added to cart.`);
    setTimeout(()=>setMessage(''), 2500);
  }

  return (
    <div>
      <DriverNavbar />
      <div className="container my-4">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h3>Your Sponsor Catalog</h3>
          <div className="d-flex gap-2">
            <Link to="/drivercart" className="btn btn-outline-primary btn-sm">Go to Cart</Link>
            <Link to="/driverhome" className="btn btn-secondary btn-sm">Back</Link>
          </div>
        </div>
        {!sponsorUserId && (
          <div className="alert alert-warning">No sponsor found for your account in the sample mapping.</div>
        )}
        {sponsorUserId && catalog.length === 0 && (
          <div className="alert alert-info">Your sponsor hasn't built a catalog yet.</div>
        )}
        {message && <div className="alert alert-success py-2">{message}</div>}

        <div className="row g-3">
          {catalog.map(it => (
            <div key={it.sku || it.ITEM_ID} className="col-12 col-sm-6 col-md-4 col-lg-3">
              <Card product={it} onAdd={addItem} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
