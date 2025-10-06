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

  const mapping = { '1': 1, '3': 3, '4': 4 };

  useEffect(()=>{ loadCatalog(sponsor); }, [sponsor]);

  async function loadCatalog(s){
    setLoading(true);
    // Try server first
    try{
      const resp = await fetch(`http://localhost:4000/sponsorAPI/getCatalogForSponsor?SponsorID=${mapping[s]}`);
      if (resp.ok){
        const json = await resp.json();
        setData(json);
        setLoading(false);
        return;
      }
    }catch(e){
      // ignore - fallback to static
    }

    // fallback to static imports if server not available
    if (s === '1') setData(sponsor1Static);
    else if (s === '3') setData(sponsor2Static);
    else setData(sponsor3Static);
    setLoading(false);
  }

  function openEditor(item){
    setEditing({ item, newPrice: item.ITEM_PRICE });
  }

  async function saveEdit(){
    if (!editing) return;
    const SponsorID = mapping[sponsor];
    const payload = { SponsorID, ITEM_ID: editing.item.ITEM_ID, newPrice: Number(editing.newPrice) };
    try{
      const resp = await fetch('http://localhost:4000/sponsorAPI/updateProductPrice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!resp.ok) {
        const text = await resp.text();
        alert('Failed to save: ' + text);
        return;
      }
      // refresh catalog from server
      await loadCatalog(sponsor);
      setEditing(null);
    }catch(err){
      alert('Error saving edit: ' + err.message);
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

import React, { useState } from 'react';
import sponsor1 from '../content/json-assets/sponsor1_catalog.json';
import sponsor2 from '../content/json-assets/sponsor2_catalog.json';
import sponsor3 from '../content/json-assets/sponsor3_catalog.json';
import { useEffect } from 'react';

function ProductCard({p}){
  return (
    <div style={{border:'1px solid #ddd', padding:12, borderRadius:8, width:220, margin:8}}>
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

/*  This file is used to view catalog stuff from json-assets  for sponsors
function ProductCard({p, onClick}){
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
    In a real app, you would fetch the catalog from the server based on the logged-in sponsor 
export default function CatalogViewer(){
  const [sponsor, setSponsor] = useState('1');
  const [data, setData] = useState([]);
  const [editing, setEditing] = useState(null); // { item, newPrice }
  const [loading, setLoading] = useState(false);

  const mapping = { '1': 1, '3': 3, '4': 4 };

  useEffect(()=>{
    loadCatalog(sponsor);
  },[sponsor]);

  async function loadCatalog(s){
    setLoading(true);
    // Try server first
    try{
      const resp = await fetch(`http://localhost:4000/sponsorAPI/getCatalogForSponsor?SponsorID=${mapping[s]}`);
      if (resp.ok){
        const json = await resp.json();
        setData(json);
        setLoading(false);
        return;
      }
    }catch(e){
      // ignore - fallback to static
    }

    // fallback to static imports if server not available
    if (s === '1') setData(sponsor1);
    else if (s === '3') setData(sponsor2);
    else setData(sponsor3);
    setLoading(false);
  }

  function openEditor(item){
    setEditing({ item, newPrice: item.ITEM_PRICE });
  }

  async function saveEdit(){
    if (!editing) return;
    const SponsorID = mapping[sponsor];
    const payload = { SponsorID, ITEM_ID: editing.item.ITEM_ID, newPrice: Number(editing.newPrice) };
    try{
      const resp = await fetch('http://localhost:4000/sponsorAPI/updateProductPrice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!resp.ok) {
        const text = await resp.text();
        alert('Failed to save: ' + text);
        return;
      }
      const result = await resp.json();
      // refresh catalog from server
      await loadCatalog(sponsor);
      setEditing(null);
    }catch(err){
      alert('Error saving edit: ' + err.message);
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
        <div style={{display:'flex', flexWrap:'wrap'}}>
            {data.map(p => <ProductCard key={p.ITEM_ID} p={p} />)}
        </div>
    </div>
  );
}
