import { useEffect, useState } from 'react'
import { api } from '../lib/api'

export default function TopSales() {
  const [items, setItems] = useState([])
  useEffect(() => {
    api.get('/api/products/top-sales', { params: { limit: 10 } })
      .then(r => setItems(r.data))
      .catch(() => setItems([]))
  }, [])
  return (
    <div>
      <h2>top sales</h2>
      <ol>
        {items.map(p => (
          <li key={p.ITEM_ID}>
            {p.ITEM_NAME} — sales: {p.sales ?? 0}
          </li>
        ))}
      </ol>
    </div>
  )
}


