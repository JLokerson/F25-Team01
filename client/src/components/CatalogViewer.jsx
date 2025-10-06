import React, { useState } from 'react';
import sponsor1 from '../content/json-assets/sponsor1_catalog.json';
import sponsor2 from '../content/json-assets/sponsor2_catalog.json';
import sponsor3 from '../content/json-assets/sponsor3_catalog.json';

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

export default function CatalogViewer(){
  const [sponsor, setSponsor] = useState('1');

  const data = sponsor === '1' ? sponsor1 : sponsor === '3' ? sponsor2 : sponsor3;

  return (
    <div style={{padding:20}}>
      <h3>Catalog Viewer (client-only)</h3>
      <p>Select a sponsor to load their local JSON catalog (no server needed):</p>
      <div style={{display:'flex', gap:8, marginBottom:12}}>
        <button className={sponsor==='1' ? 'btn btn-primary' : 'btn btn-outline-primary'} onClick={()=>setSponsor('1')}>RandTruckCompany (1)</button>
        <button className={sponsor==='3' ? 'btn btn-primary' : 'btn btn-outline-primary'} onClick={()=>setSponsor('3')}>CoolTruckCompany (3)</button>
        <button className={sponsor==='4' ? 'btn btn-primary' : 'btn btn-outline-primary'} onClick={()=>setSponsor('4')}>AwesomeTruckCompany (4)</button>
      </div>

      <div style={{display:'flex', flexWrap:'wrap'}}>
        {data.map(p => <ProductCard key={p.ITEM_ID} p={p} />)}
      </div>
    </div>
  );
}
