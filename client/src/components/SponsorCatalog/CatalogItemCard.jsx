import React from 'react';

export default function CatalogItemCard({ product, actionLabel = 'Add', onAction, small=false, enabled=true }){
    return (
        <div style={{border:'1px solid #ddd', borderRadius:8, padding:12, textAlign:'center'}}>
            <div style={{height:120, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:8}}>
                <img src={product.image || product.ITEM_IMG || 'https://via.placeholder.com/150'} alt={product.name || product.ITEM_NAME} style={{maxHeight:110, maxWidth:'100%'}} />
            </div>
            <div style={{fontWeight:700, fontSize: small ? 13 : 14}}>{product.name || product.ITEM_NAME}</div>
            <div style={{fontSize: small ? 12 : 14, color:'#b12704', marginTop:6}}>${(product.salePrice || product.ITEM_PRICE || 0)}</div>
            <div style={{marginTop:8}}>
                <button className={`btn btn-sm ${actionLabel==='Add' ? 'btn-primary' : 'btn-outline-danger'}`} onClick={() => onAction && onAction(product)} disabled={!enabled}>{actionLabel}</button>
            </div>
        </div>
    );
}
