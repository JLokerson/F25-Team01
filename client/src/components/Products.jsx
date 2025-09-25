import React from "react";
import { Link } from "react-router-dom";
import 'bootstrap/dist/css/bootstrap.min.css';
import products from '../content/json-assets/product_sample.json';

export default function Products() {
    console.log("Catalog of all products. Products component rendered. Products.jsx");

    return (
        <div className="container my-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h1>Product Catalog</h1>
                <Link to="/DriverHome" className="btn btn-secondary">Back to Driver Home</Link>
            </div>

            <div className="row g-3">
                {products.map(item => (
                    <div className="col-12 col-sm-6 col-md-4" key={item.ITEM_ID}>
                        <div className="card h-100">
                            {item.ITEM_IMG ? (
                                <img src={item.ITEM_IMG} className="card-img-top" alt={item.ITEM_NAME} style={{objectFit: 'cover', height: '180px'}} />
                            ) : (
                                <div className="bg-light d-flex align-items-center justify-content-center" style={{height: '180px'}}>
                                    <span className="text-muted">No image</span>
                                </div>
                            )}
                            <div className="card-body d-flex flex-column">
                                <h5 className="card-title">{item.ITEM_NAME}</h5>
                                <p className="card-text" style={{flex: 1}}>{item.ITEM_DES}</p>
                                <div className="d-flex justify-content-between align-items-center mt-2">
                                    <div>
                                        <strong>${item.ITEM_PRICE}</strong>
                                        <div className="text-muted small">Stock: {item.ITEM_STOCK}</div>
                                    </div>
                                    <button className="btn btn-primary">Redeem</button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
