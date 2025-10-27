import React from 'react';

/*
 CatalogItemCard.jsx

 Purpose:
 - Small reusable product card used in both the Browse and My Catalog views.

 Props:
 - product: object containing product data. Expected fields include:
    - sku or ITEM_ID
    - name or ITEM_NAME
    - image or ITEM_IMG
    - salePrice or ITEM_PRICE
 - actionLabel: string (default 'Add') — button label for the primary action.
 - onAction: function(product) — callback invoked when the action button is clicked.
 - small: boolean — optional smaller typography for compact lists.
 - enabled: boolean — when false, the card is visually muted (opacity and grayscale) to indicate
   the product is deactivated in the sponsor's catalog.

 Visual behavior:
 - When `enabled === false` the card uses reduced opacity, a grayscale filter, and a muted background.
 - The action button remains interactive so the item can be reactivated.
*/

export default function CatalogItemCard({ product, actionLabel = 'Add', onAction, small=false, enabled=true }){
    const containerStyle = {
        border: '1px solid #ddd',
        borderRadius: 8,
        padding: 12,
        textAlign: 'center',
        transition: 'opacity 200ms ease, filter 200ms ease',
        opacity: enabled ? 1 : 0.45,
        filter: enabled ? 'none' : 'grayscale(80%)',
        background: enabled ? 'white' : '#f8f9fa'
    };

    return (
        <div style={containerStyle}>
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
