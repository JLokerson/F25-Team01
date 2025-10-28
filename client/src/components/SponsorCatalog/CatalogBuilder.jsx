import React, { useEffect, useMemo, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import BestBuyBrowser from './BestBuyBrowser';

const CATEGORY_LIST = [
    { key: 'phones', name: 'Phones' },
    { key: 'tablets', name: 'Tablets' },
    { key: 'monitors', name: 'Monitors' },
    { key: 'pcs', name: 'PCs' },
    { key: 'laptops', name: 'Laptops' },
    { key: 'keyboards', name: 'Keyboards' },
    { key: 'mice', name: 'Mice' },
    { key: 'headphones', name: 'Headphones' },
    { key: 'microphones', name: 'Microphones' },
    { key: 'phonecases', name: 'Phone Cases' },
];

function getSponsorId(){
    try {
        const u = JSON.parse(localStorage.getItem('user') || 'null');
        return u?.SponsorID || u?.UserID || 'sponsor_default';
    } catch { return 'sponsor_default'; }
}

export default function CatalogBuilder(){
    const sponsorId = useMemo(() => getSponsorId(), []);
    const storageKey = `sponsor_category_catalog_${sponsorId}`;
    const [tab, setTab] = useState('browse');
    const [categoryState, setCategoryState] = useState({});

    useEffect(()=>{ load();
        const onUpd = () => load();
        window.addEventListener('sponsorCategoryCatalogUpdated', onUpd);
        return ()=> window.removeEventListener('sponsorCategoryCatalogUpdated', onUpd);
    }, []);

    function load(){
        try{
            const raw = localStorage.getItem(storageKey);
            setCategoryState(raw ? JSON.parse(raw) : {});
        }catch{ setCategoryState({}); }
    }

    function save(next){
        setCategoryState(next);
        try{ localStorage.setItem(storageKey, JSON.stringify(next)); }catch{}
    }

    function toggle(key){
        const next = { ...categoryState, [key]: { active: !(categoryState[key]?.active) } };
        save(next);
    }

    return (
        <div className="container mt-4">
            <h3>Catalog Management (Categories)</h3>
            <ul className="nav nav-tabs">
                <li className="nav-item">
                    <button className={`nav-link ${tab==='browse' ? 'active' : ''}`} onClick={()=>setTab('browse')}>Browse Categories</button>
                </li>
                <li className="nav-item">
                    <button className={`nav-link ${tab==='mycatalog' ? 'active' : ''}`} onClick={()=>setTab('mycatalog')}>My Category Catalog</button>
                </li>
            </ul>

            <div className="mt-3">
                {tab==='browse' && <BestBuyBrowser />}

                        {tab==='mycatalog' && (
                            (() => {
                                const activeCats = CATEGORY_LIST.filter(cat => Boolean(categoryState[cat.key]?.active));
                                if (activeCats.length === 0) {
                                    return (
                                        <div className="alert alert-info" role="alert">
                                            Your catalog is empty. Go to "Browse Categories" and switch on categories to add them to your catalog.
                                        </div>
                                    );
                                }
                                return (
                                    <div className="row g-3">
                                        {activeCats.map(cat => (
                                            <div className="col-12 col-sm-6 col-md-4 col-lg-3" key={cat.key}>
                                                <div className="card h-100">
                                                    <div className="card-body d-flex flex-column">
                                                        <h5 className="card-title">{cat.name}</h5>
                                                        <p className="text-muted">Status: <span className="badge bg-success">Active</span></p>
                                                        <div className="mt-auto d-flex justify-content-between align-items-center">
                                                            <button className="btn btn-outline-danger btn-sm" onClick={()=>toggle(cat.key)}>Deactivate</button>
                                                            <a className="btn btn-outline-secondary btn-sm" href={`https://www.bestbuy.com/site/searchpage.jsp?st=${encodeURIComponent(cat.name)}`} target="_blank" rel="noreferrer">View on BestBuy</a>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                );
                            })()
                        )}
            </div>
        </div>
    );
}
