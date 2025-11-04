import React, { useEffect, useMemo, useState } from 'react';
import SponsorNavbar from '../SponsorNavbar';
import { bbCall, findCatId, getProdByCatId } from '../../components/MiscellaneousParts/BestBuyCalls';
import ProductCard from '../ProductCard';
import './SponsorCatalog.css';

const BestBuyBrowser = () => {
  const [category, setCategory] = useState('Laptops');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchProducts = async (catName) => {
    setLoading(true);
    setError(null);
    try {
      const catId = await findCatId(catName);
      if (!catId) {
        throw new Error('Category not found');
      }
      const prods = await getProdByCatId(catId, 5);
      setProducts(prods);
    } catch (err) {
      setError(err.message);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts(category);
  }, [category]);

  return (
    <div className="sponsor-catalog">
      <SponsorNavbar />
      {loading && <p>Loading...</p>}
      {error && <p>Error: {error}</p>}
      <div className="product-list">
        {products.map((product) => (
          <ProductCard key={product.sku} product={product} />
        ))}
      </div>
    </div>
  );
};

export default BestBuyBrowser;