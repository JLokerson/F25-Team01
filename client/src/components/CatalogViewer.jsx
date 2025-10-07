import React, { useState, useEffect } from 'react';
import sponsor1Static from '../content/json-assets/sponsor1_catalog.json';
import sponsor2Static from '../content/json-assets/sponsor2_catalog.json';
import sponsor3Static from '../content/json-assets/sponsor3_catalog.json';

function ProductCard({ p, onClick }){
    return (
        <div onClick={() => onClick(p)} style={{border:'1px solid #ddd', padding:12, borderRadius:8, width:220, margin:8, cursor:'pointer'}}>
            <div style={{height:120, background:'#f4f4f4', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:8}}>
                {p.ITEM_IMG ? <img src={p.ITEM_IMG} alt={p.ITEM_NAME} style={{maxHeight:110, maxWidth:'100%'}} /> : <div style={{color:'#888'}}>No Image</div>}
            </div>
            <div style={{fontWeight:700}}>{p.ITEM_NAME}</div>
            <div style={{fontSize:12, color:'#666', minHeight:36}}>{p.ITEM_DES}</div>
            <div style={{marginTop:8, fontWeight:700}}>Price: ${p.ITEM_PRICE}</div>
            <div style={{fontSize:12, color:'#333'}}>Stock: {p.ITEM_STOCK}</div>
        </div>
    );
}

export default function CatalogViewer(){
    const [sponsor, setSponsor] = useState('1');
    const [data, setData] = useState([]);
    const [editing, setEditing] = useState(null); // { item, newPrice }
    const [loading, setLoading] = useState(false);

    // Client-only mode: load from static JSON and apply any overrides saved in localStorage.
    // This avoids any backend calls and keeps edits local to the browser.
    useEffect(()=>{ loadCatalogClientOnly(sponsor); }, [sponsor]);

    function loadCatalogClientOnly(s){
        setLoading(true);
        let base = [];
        if (s === '1') base = sponsor1Static;
        else if (s === '3') base = sponsor2Static;
        else base = sponsor3Static;

        // Apply overrides from localStorage if present
        try{
            const key = `catalog_overrides_sponsor_${s}`;
            const raw = localStorage.getItem(key);
            if (raw){
                const overrides = JSON.parse(raw);
                // Create a merged array where items replaced by overrides are used
                const merged = base.map(it => {
                    const ov = overrides.find(o => Number(o.ITEM_ID) === Number(it.ITEM_ID));
                    return ov ? { ...it, ...ov } : it;
                });
                setData(merged);
            } else {
                setData(base);
            }
        }catch(err){
            console.error('Failed to load catalog overrides:', err);
            setData(base);
        }
        setLoading(false);
    }

    function openEditor(item){
        setEditing({ item, newPrice: item.ITEM_PRICE });
    }

    function saveEdit(){
        if (!editing) return;
        try{
            const s = sponsor;
            const key = `catalog_overrides_sponsor_${s}`;
            const raw = localStorage.getItem(key);
            const overrides = raw ? JSON.parse(raw) : [];

            // replace or add the override for this ITEM_ID
            const newOv = { ITEM_ID: editing.item.ITEM_ID, ITEM_PRICE: Number(editing.newPrice) };
            const updated = overrides.filter(o => Number(o.ITEM_ID) !== Number(newOv.ITEM_ID)).concat(newOv);
            localStorage.setItem(key, JSON.stringify(updated));

            // update visible data immediately
            setData(prev => prev.map(it => Number(it.ITEM_ID) === Number(newOv.ITEM_ID) ? { ...it, ITEM_PRICE: newOv.ITEM_PRICE } : it));
            setEditing(null);
        }catch(err){
            alert('Error saving edit locally: ' + err.message);
        }
    }

    return (
        <div style={{padding:20}}>
            <h3>Catalog Viewer (client/server)</h3>
            <p>Select a sponsor to load their catalog (server if available, otherwise local JSON):</p>
            <div style={{display:'flex', gap:8, marginBottom:12}}>
                <button className={sponsor==='1' ? 'btn btn-primary' : 'btn btn-outline-primary'} onClick={()=>setSponsor('1')}>RandTruckCompany (1)</button>
                <button className={sponsor==='3' ? 'btn btn-primary' : 'btn btn-outline-primary'} onClick={()=>setSponsor('3')}>CoolTruckCompany (3)</button>
                <button className={sponsor==='4' ? 'btn btn-primary' : 'btn btn-outline-primary'} onClick={()=>setSponsor('4')}>AwesomeTruckCompany (4)</button>
            </div>

            {loading ? <div>Loading...</div> : (
                <div style={{display:'flex', flexWrap:'wrap'}}>
                    {data.map(p => <ProductCard key={p.ITEM_ID} p={p} onClick={openEditor} />)}
                </div>
            )}

            {editing && (
                <div style={{position:'fixed', left:'50%', top:'50%', transform:'translate(-50%,-50%)', background:'#fff', padding:20, borderRadius:8, boxShadow:'0 4px 20px rgba(0,0,0,.3)', zIndex:9999, width:360}}>
                    <h5>Edit price — {editing.item.ITEM_NAME}</h5>
                    <div style={{marginTop:8}}>
                        <label>New price</label>
                        <input type="number" value={editing.newPrice} onChange={e=>setEditing({...editing, newPrice: e.target.value})} className="form-control" />
                    </div>
                    <div style={{display:'flex', gap:8, marginTop:12, justifyContent:'flex-end'}}>
                        <button className="btn btn-secondary" onClick={()=>setEditing(null)}>Cancel</button>
                        <button className="btn btn-primary" onClick={saveEdit}>Save</button>
                    </div>
                </div>
            )}
        </div>
    );
}
