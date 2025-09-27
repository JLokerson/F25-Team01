import React from 'react';

export default function CartPage(){
  // read user from localStorage to determine availability
  let user = null;
  try { user = JSON.parse(localStorage.getItem('user')); } catch(e) { user = null; }
  const userType = user?.UserType ?? user?.accountType ?? null;

  if (userType !== 3) {
    return (
      <div className="container my-5">
        <h3>Cart</h3>
        <p>The cart is only available to drivers. If you believe this is an error, please contact an administrator.</p>
      </div>
    );
  }

  return (
    <div className="container my-5">
      <h3>Your Cart</h3>
      <p>Driver cart contents would be shown here.</p>
    </div>
  );
}
