import { useEffect, useState } from 'react'
import { getCart, updateQty, removeFromCart, clearCart, cartTotals } from '../hooks/useCart'

export default function Cart() {
  const [cart, setCart] = useState([])
  useEffect(() => {
    setCart(getCart())
    const onChange = () => setCart(getCart())
    window.addEventListener('cart:changed', onChange)
    return () => window.removeEventListener('cart:changed', onChange)
  }, [])

  const { points, usd } = cartTotals(cart)

  if (cart.length === 0) {
    return (
      <div className='container'>
        <h2 className='text-2xl font-bold mb-4'>Shopping Cart</h2>
        <div className='about-card text-center'>Your cart is empty.</div>
      </div>
    )
  }

  return (
    <div className='container'>
      <h2 className='text-2xl font-bold mb-4'>Shopping Cart</h2>
      <table className='w-full' style={{ borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid rgba(255,255,255,.1)' }}>
            <th className='text-left p-3'>Item</th>
            <th className='text-left p-3'>Price</th>
            <th className='text-left p-3'>Qty</th>
            <th className='text-left p-3'>Total</th>
            <th className='text-left p-3'>Action</th>
          </tr>
        </thead>
        <tbody>
          {cart.map(row => {
            const line = (Number(row.ITEM_PRICE) || 0) * (Number(row.qty) || 0)
            return (
              <tr key={row.ITEM_ID} style={{ borderBottom: '1px solid rgba(255,255,255,.06)' }}>
                <td className='p-3'>
                  <div className='flex items-center gap-3'>
                    <span>{row.ITEM_NAME}</span>
                    <span className='badge'>stock: {row.ITEM_STOCK}</span>
                  </div>
                </td>
                <td className='p-3'>{row.ITEM_PRICE} pts</td>
                <td className='p-3'>
                  <input
                    className='w-16 px-2 py-1 rounded bg-[#0e1524] border border-white/20'
                    type='number' min='1' value={row.qty}
                    onChange={e => setCart(updateQty(row.ITEM_ID, e.target.value))}
                  />
                </td>
                <td className='p-3'>{line} pts</td>
                <td className='p-3'>
                  <button className='btn btn--danger' onClick={() => setCart(removeFromCart(row.ITEM_ID))}>
                    Remove
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
        <tfoot>
          <tr style={{ borderTop: '1px solid rgba(255,255,255,.1)' }}>
            <td className='p-3 font-bold' colSpan={3}>Total</td>
            <td className='p-3 font-bold'>{points} pts (${usd})</td>
            <td className='p-3'>
              <button className='btn' onClick={() => setCart(clearCart())}>Clear cart</button>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}
