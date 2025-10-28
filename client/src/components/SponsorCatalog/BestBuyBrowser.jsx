import React, { useEffect, useMemo, useState } from 'react';
import SponsorNavbar from '../SponsorNavbar';

// Category-driven Best Buy browser for sponsors.
// Sponsors activate/deactivate whole categories for their catalog.
// Items are accessed by external links to Best Buy search results.
const DEFAULT_CATEGORIES = [
    { key: 'phones', name: 'Phones', query: 'phone', emoji: '📱' },
    { key: 'tablets', name: 'Tablets', query: 'tablet', emoji: '📲' },
    { key: 'monitors', name: 'Monitors', query: 'monitor', emoji: '🖥️' },
    { key: 'pcs', name: 'PCs', query: 'desktop pc', emoji: '💻' },
    { key: 'laptops', name: 'Laptops', query: 'laptop', emoji: '💼' },
    { key: 'keyboards', name: 'Keyboards', query: 'keyboard', emoji: '⌨️' },
    { key: 'mice', name: 'Mice', query: 'mouse', emoji: '🖱️' },
    { key: 'headphones', name: 'Headphones', query: 'headphones', emoji: '🎧' },
    { key: 'microphones', name: 'Microphones', query: 'microphone', emoji: '🎙️' },
    { key: 'phonecases', name: 'Phone Cases', query: 'phone case', emoji: '🧰' },
    { key: 'speakers', name: 'Speakers', query: 'speakers', emoji: '🔊' },
    { key: 'cameras', name: 'Cameras', query: 'camera', emoji: '📸' },
    { key: 'gaming', name: 'Gaming', query: 'gaming', emoji: '🎮' },
    { key: 'smartwatches', name: 'Smart Watches', query: 'smart watch', emoji: '⌚' },
    { key: 'chargers', name: 'Chargers', query: 'charger', emoji: '🔌' },
    { key: 'cables', name: 'Cables', query: 'cable', emoji: '🔗' },
    { key: 'storage', name: 'Storage', query: 'external drive', emoji: '💾' },
    { key: 'printers', name: 'Printers', query: 'printer', emoji: '🖨️' },
    { key: 'routers', name: 'Routers', query: 'router', emoji: '📡' },
    { key: 'earbuds', name: 'Earbuds', query: 'earbuds', emoji: '🎵' },
    { key: 'tvs', name: 'TVs', query: 'television', emoji: '📺' },
    { key: 'appliances', name: 'Appliances', query: 'appliance', emoji: '🏠' },
    { key: 'fitness', name: 'Fitness Tech', query: 'fitness tracker', emoji: '🏃' },
    { key: 'vr', name: 'VR Headsets', query: 'VR headset', emoji: '🥽' },
];

function getSponsorIdForStorage() {
    try {
        const userRaw = localStorage.getItem('user');
        if (!userRaw) return 'default';
        const user = JSON.parse(userRaw);
        // Prefer SponsorID if present (sponsor user), otherwise UserID as a fallback bucket
        return user.SponsorID || user.UserID || 'default';
    } catch {
        return 'default';
    }
}

function loadCategoryState(sponsorId) {
    try {
        const raw = localStorage.getItem(`sponsor_category_catalog_${sponsorId}`);
        if (!raw) return {};
        const obj = JSON.parse(raw);
        return obj && typeof obj === 'object' ? obj : {};
    } catch {
        return {};
    }
}

function saveCategoryState(sponsorId, state) {
    try {
        localStorage.setItem(`sponsor_category_catalog_${sponsorId}`, JSON.stringify(state));
        window.dispatchEvent(new Event('sponsorCategoryCatalogUpdated'));
    } catch {}
}

export default function BestBuyBrowser() {
    const [filter, setFilter] = useState('');
    const [inexact, setInexact] = useState(true); // inexact contains match by default
    const [selectedKey, setSelectedKey] = useState(null);
    const sponsorId = useMemo(() => getSponsorIdForStorage(), []);
    const [categoryState, setCategoryState] = useState(() => loadCategoryState(sponsorId));

    useEffect(() => {
        // if sponsor changes (rare), reload
        setCategoryState(loadCategoryState(sponsorId));
    }, [sponsorId]);

    function toggleCategory(key) {
        const updated = { ...categoryState, [key]: { active: !(categoryState[key]?.active) } };
        setCategoryState(updated);
        saveCategoryState(sponsorId, updated);
    }

    const categories = DEFAULT_CATEGORIES;

    const filteredCategories = useMemo(() => {
        if (!filter.trim()) return categories;
        const f = filter.trim().toLowerCase();
        if (inexact) {
            return categories.filter(c => c.name.toLowerCase().includes(f) || c.query.toLowerCase().includes(f));
        }
        return categories.filter(c => c.name.toLowerCase() === f || c.query.toLowerCase() === f);
    }, [categories, filter, inexact]);

    const selectedCategory = useMemo(
        () => categories.find(c => c.key === selectedKey) || null,
        [selectedKey, categories]
    );

    const bestBuySearchUrl = (query) => `https://www.bestbuy.com/site/searchpage.jsp?st=${encodeURIComponent(query)}`;

    return (
        <div>
            <SponsorNavbar />
            <div className="container mt-4">
                <h2 className="mb-3">Sponsor Catalog by Category</h2>
                <p className="text-muted">Activate categories for your catalog. Click a card to explore items on Best Buy. Use the filter to find categories by name (exact or inexact).</p>

                <div className="d-flex gap-2 align-items-center mb-3">
                    <input
                        className="form-control"
                        placeholder="Filter by name (e.g., phone, keyboard)"
                        value={filter}
                        onChange={e => setFilter(e.target.value)}
                        style={{ maxWidth: 360 }}
                    />
                    <div className="form-check form-switch">
                        <input className="form-check-input" type="checkbox" id="inexactSwitch" checked={inexact} onChange={e => setInexact(e.target.checked)} />
                        <label className="form-check-label" htmlFor="inexactSwitch">Inexact match</label>
                    </div>
                </div>

                <div className="row g-3">
                    {filteredCategories.map(cat => {
                        const active = Boolean(categoryState[cat.key]?.active);
                        return (
                            <div className="col-12 col-sm-6 col-md-4 col-lg-3" key={cat.key}>
                                <div className="card h-100" style={{ cursor: 'pointer' }} onClick={() => setSelectedKey(cat.key)}>
                                    <div className="card-body d-flex flex-column">
                                        <div className="d-flex justify-content-between align-items-start mb-2">
                                            <div style={{ fontSize: 28 }} aria-hidden>{cat.emoji}</div>
                                            <span className={`badge ${active ? 'bg-success' : 'bg-secondary'}`}>{active ? 'Active' : 'Inactive'}</span>
                                        </div>
                                        <h5 className="card-title">{cat.name}</h5>
                                        <p className="card-text text-muted mb-3">Query: “{cat.query}”</p>
                                        <div className="mt-auto d-flex align-items-center justify-content-between">
                                            <a className="btn btn-outline-primary btn-sm" href={bestBuySearchUrl(cat.query)} target="_blank" rel="noreferrer">Open on BestBuy</a>
                                            <div className="form-check form-switch" onClick={e => e.stopPropagation()}>
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    id={`toggle-${cat.key}`}
                                                    checked={active}
                                                    onChange={() => toggleCategory(cat.key)}
                                                />
                                                <label className="form-check-label" htmlFor={`toggle-${cat.key}`}>Catalog</label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Details / drill-in panel */}
                {selectedCategory && (
                    <div className="card mt-4">
                        <div className="card-header d-flex justify-content-between align-items-center">
                            <strong>{selectedCategory.name}</strong>
                            <button className="btn btn-sm btn-outline-secondary" onClick={() => setSelectedKey(null)}>Close</button>
                        </div>
                        <div className="card-body">
                            <p className="mb-2">Explore items for “{selectedCategory.query}”. Add an optional term to refine the search:</p>
                            <CategorySearchLink baseQuery={selectedCategory.query} />
                            <hr />
                            <p className="text-muted mb-0">Tip: You can paste your Best Buy API key into localStorage as BESTBUY_API_KEY later if we decide to fetch actual products inline.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function CategorySearchLink({ baseQuery }) {
    const [term, setTerm] = useState('');
    const final = baseQuery + (term ? ` ${term}` : '');
    const url = `https://www.bestbuy.com/site/searchpage.jsp?st=${encodeURIComponent(final)}`;
    return (
        <div className="d-flex gap-2">
            <input className="form-control" style={{ maxWidth: 360 }} placeholder="Optional: inexact name filter (e.g., pro, wireless)" value={term} onChange={e=>setTerm(e.target.value)} />
            <a href={url} target="_blank" rel="noreferrer" className="btn btn-primary">Open Results</a>
        </div>
    );
}
