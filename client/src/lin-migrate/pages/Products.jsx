import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import SortBar from '../../components/SortBar'
import { api } from '../../lib/api'

export default function Products() {
  const [sp] = useSearchParams()
  const role = sp.get('role') === 'sponsor' ? 'sponsor' : 'driver'
  const sort = sp.get('sort') || (role === 'sponsor' ? 'rating_desc' : 'popular')
  const [products, setProducts] = useState([])
  const [err, setErr] = useState('')

  useEffect(() => {
    api.get('/api/products', { params: { sort } })
      .then(r => setProducts(r.data))
      .catch(e => setErr(String(e?.message || e)))
  }, [sort])

  async function handleClick(id) {
    try { await api.post(`/api/products/${id}/click`) } catch (_) {}
  }

  if (err) return <div className='container error-card'><h3>Error</h3><p className='muted'>{err}</p></div>

  return (
    <div className='container'>
      <div className='shop-header'>
        <h2>Catalog</h2>
        <div className='muted'>{products.length} item(s)</div>
      </div>
      <SortBar role={role} />
      <div className='amazon-grid'>
        {products.map(p => (
          <ProductCard key={p.ITEM_ID} product={p} onClick={() => handleClick(p.ITEM_ID)} />
        ))}
      </div>
    </div>
  )
}
