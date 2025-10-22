import React, { useEffect, useState } from 'react';
import CatalogItemCard from './CatalogItemCard';

export default function BestBuyBrowser({ onAdd }){
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [query, setQuery] = useState('laptop');
    const [searchTerm, setSearchTerm] = useState('laptop');

    useEffect(()=>{ fetchProducts(); }, [page, searchTerm]);

    async function fetchProducts(){
        setLoading(true); setError(null);
        const key = localStorage.getItem('BESTBUY_API_KEY') || '';
        if (!key) {
            setError('No BestBuy API key found in localStorage. Please paste it in the Sponsor settings.');
            setLoading(false); return;
        }

        try{
            const searchFilter = searchTerm ? `(search=${encodeURIComponent(searchTerm)})` : '';
            // Use proxy path if server proxy is implemented; fall back to direct BestBuy URL
            const proxy = `/v1/products${searchFilter}?format=json&show=sku,name,salePrice,image&page=${page}&pageSize=20&apiKey=${key}`;
            const resp = await fetch(proxy);
            if (!resp.ok) throw new Error('HTTP ' + resp.status);
            const json = await resp.json();
            setProducts(json.products || []);
        }catch(err){
            setError('Failed to fetch BestBuy products: ' + err.message);
        }finally{ setLoading(false); }
    }

    const handleSearch = (e) => { e.preventDefault(); setPage(1); setSearchTerm(query); };

    return (
        <div>
            <form className="d-flex mb-2" onSubmit={handleSearch}>
                <input className="form-control me-2" value={query} onChange={e=>setQuery(e.target.value)} />
                <button className="btn btn-primary">Search</button>
            </form>

            {loading && <div>Loading...</div>}
            {error && <div className="alert alert-danger">{error}</div>}

            <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:12}}>
                {products.map(p => (
                    <CatalogItemCard key={p.sku} product={{ sku:p.sku, name:p.name, image:p.image, salePrice:p.salePrice }} actionLabel="Add" onAction={onAdd} />
                ))}
            </div>

            <div className="d-flex justify-content-center mt-3">
                <button className="btn btn-secondary me-2" onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1}>Previous</button>
                <span className="align-self-center">Page {page}</span>
                <button className="btn btn-secondary ms-2" onClick={()=>setPage(p=>p+1)}>Next</button>
            </div>
        </div>
    );
}
