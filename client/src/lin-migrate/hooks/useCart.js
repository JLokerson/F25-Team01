// localStorage-backed cart with simple helpers
const KEY = 'app:cart';

function read() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); }
  catch { return []; }
}

function write(next) {
  localStorage.setItem(KEY, JSON.stringify(next));
}

export function getCart() {
  return read();
}

export function addToCart(item) {
  const cart = read();
  const idx = cart.findIndex(x => x.ITEM_ID === item.ITEM_ID);
  if (idx >= 0) {
    cart[idx].qty = (cart[idx].qty || 1) + 1;
  } else {
    cart.push({ ...item, qty: 1 });
  }
  write(cart);
  return cart;
}

export function updateQty(itemId, qty) {
  const cart = read().map(x => x.ITEM_ID === itemId ? { ...x, qty: Math.max(1, Number(qty) || 1) } : x);
  write(cart);
  return cart;
}

export function removeFromCart(itemId) {
  const cart = read().filter(x => x.ITEM_ID !== itemId);
  write(cart);
  return cart;
}

export function clearCart() {
  write([]);
  return [];
}

export function cartTotals(cart = read()) {
  const points = cart.reduce((acc, x) => acc + (Number(x.ITEM_PRICE) || 0) * (Number(x.qty) || 0), 0);
  const usd = (points / 100).toFixed(2);
  return { points, usd };
}
