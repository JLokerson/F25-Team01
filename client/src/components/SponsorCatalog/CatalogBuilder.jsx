import React, { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import BestBuyBrowser from './BestBuyBrowser';
import CatalogItemCard from './CatalogItemCard';

export default function CatalogBuilder(){
    const sponsor = JSON.parse(localStorage.getItem('user') || '{}');
    const sponsorId = sponsor?.UserID || sponsor?.userid || 'sponsor_default';
    const key = `sponsor_catalog_${sponsorId}`;
    const [tab, setTab] = useState('browse');
    const [catalog, setCatalog] = useState([]);

    useEffect(()=>{ loadCatalog(); }, []);

    function loadCatalog(){
        try{ const raw = localStorage.getItem(key); if (raw) setCatalog(JSON.parse(raw)); else setCatalog([]); }catch(e){ setCatalog([]); }
    }

    function saveCatalog(next){
        setCatalog(next);
        try{ localStorage.setItem(key, JSON.stringify(next)); }catch(e){ console.error('save failed', e); }
    }

    function handleAdd(product){
        // prevent duplicates by sku
        const exists = catalog.find(c => String(c.sku) === String(product.sku));
        if (exists) return alert('Product already in catalog');
        const next = catalog.concat([{ sku: product.sku, name: product.name, image: product.image, salePrice: product.salePrice, enabled: true }]);
        saveCatalog(next);
        setTab('mycatalog');
    }

    function handleDeactivate(item){
        const next = catalog.map(c => c.sku === item.sku ? { ...c, enabled: false } : c);
        saveCatalog(next);
    }

    function handleActivate(item){
        const next = catalog.map(c => c.sku === item.sku ? { ...c, enabled: true } : c);
        saveCatalog(next);
    }

    return (
        <div className="container mt-4">
            <h3>Catalog Management</h3>
            <ul className="nav nav-tabs">
                <li className="nav-item">
                    <button className={`nav-link ${tab==='browse' ? 'active' : ''}`} onClick={()=>setTab('browse')}>Browse</button>
                </li>
                <li className="nav-item">
                    <button className={`nav-link ${tab==='mycatalog' ? 'active' : ''}`} onClick={()=>setTab('mycatalog')}>My Catalog</button>
                </li>
            </ul>

            <div className="mt-3">
                {tab==='browse' && <BestBuyBrowser onAdd={handleAdd} />}

                {tab==='mycatalog' && (
                    <div>
                        {catalog.length===0 ? <p>No products yet.</p> : (
                            <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:12}}>
                                {catalog.map(p => (
                                    <div key={p.sku}>
                                        <CatalogItemCard product={{ sku:p.sku, name:p.name, image:p.image, salePrice:p.salePrice }} actionLabel={p.enabled ? 'Deactivate' : 'Activate'} onAction={() => p.enabled ? handleDeactivate(p) : handleActivate(p)} enabled={true} />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
