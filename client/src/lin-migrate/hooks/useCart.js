// localStorage-backed cart with simple helpers
const KEY = 'app:cart';

function read() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); }
  catch { return []; }
}

function write(next) {
  localStorage.setItem(KEY, JSON.stringify(next));
  try { window.dispatchEvent(new Event('cart:changed')); } catch {}
}

export function getCart() {
  return read();
}

export function addToCart(item) {
  const cart = read();
  const idx = cart.findIndex(x => x.ITEM_ID === item.ITEM_ID);
  if (idx >= 0) {
    const currentQty = Number(cart[idx].qty || 1);
    const maxQty = Number(cart[idx].ITEM_STOCK ?? item.ITEM_STOCK ?? Infinity);
    const nextQty = Math.min(currentQty + 1, maxQty);
    cart[idx].qty = nextQty;
  } else {
    const maxQty = Number(item.ITEM_STOCK ?? Infinity);
    const startQty = Math.min(1, maxQty);
    cart.push({ ...item, qty: startQty });
  }
  write(cart);
  return cart;
}

export function updateQty(itemId, qty) {
  const cart = read().map(x => {
    if (x.ITEM_ID !== itemId) return x;
    const desired = Math.max(1, Number(qty) || 1);
    const maxQty = Number(x.ITEM_STOCK ?? Infinity);
    return { ...x, qty: Math.min(desired, maxQty) };
  });
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

export function getQtyInCart(itemId) {
  const cart = read();
  const row = cart.find(x => x.ITEM_ID === itemId);
  return Number(row?.qty || 0);
}

export function qtyLeftFor(item) {
  const inCart = getQtyInCart(item.ITEM_ID);
  const stock = Number(item.ITEM_STOCK ?? 0);
  return Math.max(0, stock - inCart);
}
