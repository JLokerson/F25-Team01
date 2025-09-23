import { useEffect, useState } from 'react'
import ProductCard from '../components/ProductCard'

export default function Products() {
  const [products, setProducts] = useState([])
  const [err, setErr] = useState('')

  useEffect(() => {
    fetch('/products.json')
      .then(r => r.ok ? r.json() : Promise.reject(r.statusText))
      .then(setProducts)
      .catch(e => setErr(String(e)))
  }, [])

  if (err) return <div className='container error-card'><h3>Error</h3><p className='muted'>{err}</p></div>

  return (
    <div className='container'>
      <div className='shop-header'>
        <h2>Catalog</h2>
        <div className='muted'>{products.length} item(s)</div>
      </div>
      <div className='amazon-grid'>
        {products.map(p => <ProductCard key={p.ITEM_ID} product={p} />)}
      </div>
    </div>
  )
}
