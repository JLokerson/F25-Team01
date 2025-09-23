import { addToCart, qtyLeftFor } from '../hooks/useCart'

export default function ProductCard({ product }) {
  const left = qtyLeftFor(product)
  const out = Number(left) <= 0
  return (
    <div className={`product-card ${out ? 'opacity-60 grayscale' : ''}`}>
      <img src={product.ITEM_IMG} alt={product.ITEM_NAME} />
      <div className='pc-body'>
        <h3 className='font-bold'>{product.ITEM_NAME}</h3>
        <p className='pc-desc'>{product.ITEM_DES}</p>
        <div className='pc-price'>
          <span className='font-bold'>{product.ITEM_PRICE} pts</span>
          {out ? <span className='badge'>Out of stock</span> : <span className='badge'>{left} left</span>}
        </div>
        <div className='pc-actions'>
          <button
            className='btn btn--primary'
            disabled={out}
            onClick={() => addToCart(product)}
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  )
}
