import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

const ProductCard = ({ product }) => {
  // Handle missing product data gracefully
  if (!product) {
    return (
      <div className="card mb-3" style={{ width: '18rem' }}>
        <div className="card-body">
          <p className="card-text">No product data available</p>
        </div>
      </div>
    );
  }

  const {
    name = 'Unknown Product',
    salePrice = 0,
    image = null,
    thumbnailImage = null,
    largeImage = null,
    url = '#',
    sku = 'N/A'
  } = product;

  // Choose the best available image
  const displayImage = largeImage || image || thumbnailImage;

  const handleAddToCart = (e) => {
    e.preventDefault();
    // TODO: Implement add to cart functionality
    console.log('Adding to cart:', { name, salePrice, sku });
    alert(`Added "${name}" to cart!`);
  };

  return (
    <div className="card mb-3" style={{ width: '18rem' }}>
      {displayImage && (
        <img 
          src={displayImage} 
          className="card-img-top" 
          alt={name}
          style={{ height: '200px', objectFit: 'cover' }}
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />
      )}
      <div className="card-body">
        <h5 className="card-title" title={name}>
          {name.length > 50 ? `${name.substring(0, 50)}...` : name}
        </h5>
        <div className="mb-2">
          <strong className="text-success">${salePrice}</strong>
        </div>
        <div className="mb-2">
          <small className="text-muted">SKU: {sku}</small>
        </div>
        <div className="d-flex gap-2">
          <button 
            className="btn btn-primary btn-sm flex-fill"
            onClick={handleAddToCart}
          >
            Add to Cart
          </button>
          {url && url !== '#' && (
            <a 
              href={url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn btn-outline-secondary btn-sm"
            >
              View Details
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;