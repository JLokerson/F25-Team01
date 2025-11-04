import { useEffect, useState } from 'react';


export default function App() {
  const [category, setCategory] = useState('Phones');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [timeoutReached, setTimeoutReached] = useState(false);

  const fetchItems = async () => {
    setLoading(true);
    setErr('');
    setItems([]);
    setTimeoutReached(false);

    // Set up timeout to show "No items found" after 10 seconds
    const timeoutId = setTimeout(() => {
      setTimeoutReached(true);
    }, 10000);

    try {
      const res = await fetch(`http://localhost:4001/api/products?category=${encodeURIComponent(category)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Request failed');
      const raw = Array.isArray(data.items) ? data.items : [];
      const onlyWithUrl = raw.filter((it) => it && it.url);
      setItems(onlyWithUrl);
    } catch (e) {
      setErr(e.message);
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
      setTimeoutReached(false);
    }
  };

  useEffect(() => {
    fetchItems(); // initial load
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ fontFamily: 'Heebo, Arial', minHeight: '100vh', minWidth: '100vw', background: '#0181b0', color: '#fff' }}>
      <div style={{ maxWidth: 'auto', margin: '0 auto', padding: '24px' }}>
        <h1 style={{ marginBottom: 25, borderBottom: '2px solid #fff'}}>BEST BUY DEMO</h1>
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder='Enter a category name (examples: Phones, Laptops, TVs)'
            style={{
              flex: 1, padding: '10px 12px', borderRadius: 10, border: '1px solid #333',
              background: '#121212', color: '#fff'
            }}
          />
          <button
            onClick={fetchItems}
            style={{
              padding: '10px 14px', borderRadius: 10, border: '1px solid #3b82f6',
              background: '#1d4ed8', color: '#fff', cursor: 'pointer'
            }}
          >
            Search
          </button>
        </div>

        {loading && !timeoutReached && <p>Searching Items . . .</p>}
        {loading && timeoutReached && <p>No items found.</p>}
        {err && <p style={{ color: '#f87171' }}>Error: {err}</p>}
        {!loading && !err && items.length === 0 && <p>No items found.</p>}

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: 16
        }}>
          {items.map((p) => (
            <div key={p.sku} style={{
              background: '#111', border: '1px solid #222', borderRadius: 14, overflow: 'hidden'
            }}>
              <div style={{ aspectRatio: '4 / 3', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {p.image ? (
                  <img src={p.image} alt={p.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                ) : (
                  <span style={{ opacity: 0.6 }}>No image</span>
                )}
              </div>
              <div style={{ padding: 12 }}>
                <div style={{ fontSize: 14, opacity: 0.8, marginBottom: 6 }}>SKU: {p.sku}</div>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>{p.name}</div>
                <div style={{ fontSize: 18 }}>${Number(p.salePrice ?? 0).toFixed(2)}</div>
                  {p.url && (
                    <div style={{ marginTop: 6 }}>
                      <a
                        href={p.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#60a5fa', fontSize: 13, textDecoration: 'underline' }}
                      >
                        {p.url}
                      </a>
                    </div>
                  )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

