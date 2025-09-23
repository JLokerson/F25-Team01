import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../lib/api'

export default function ProductsPage({ role = 'driver' }) {
  const [sp] = useSearchParams()
  const sort = sp.get('sort') || (role === 'sponsor' ? 'rating_desc' : 'popular')
  const [items, setItems] = useState([])

  useEffect(() => {
    api.get('/api/products', { params: { sort } })
      .then(r => setItems(r.data))
      .catch(() => setItems([]))
  }, [sort])

  async function handleClick(id) {
    try { await api.post(`/api/products/${id}/click`) } catch (_) {}
  }

  return (
    <div>
      <ul className='grid'>
        {items.map(p => (
          <li key={p.ITEM_ID} className='card' onClick={() => handleClick(p.ITEM_ID)}>
            <img src={p.ITEM_IMG} alt={p.ITEM_NAME} />
            <h3>{p.ITEM_NAME}</h3>
            <p>{p.ITEM_DES}</p>
            <p>${(p.ITEM_PRICE/100).toFixed(2)}</p>
            <p>stock: {p.ITEM_STOCK}</p>
            <small>rating: {p.rating ?? 0} • pop: {p.popularity ?? 0} • sales: {p.sales ?? 0}</small>
          </li>
        ))}
      </ul>
    </div>
  )
}


