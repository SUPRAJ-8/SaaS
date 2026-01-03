import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart, useDispatchCart } from './CartProvider';
import { getShopPath } from '../../themeUtils';
import './Cart.css';

const Cart = () => {
  const { items } = useCart();
  const dispatch = useDispatchCart();

  const handleRemove = (id) => {
    dispatch({ type: 'REMOVE_ITEM', payload: { id } });
  };

  const handleQuantityChange = (id, quantity) => {
    const numQuantity = Number(quantity);
    if (numQuantity > 0) {
      dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity: numQuantity } });
    } else {
      handleRemove(id);
    }
  };

  const [coupon, setCoupon] = useState('');

  const handleApplyCoupon = () => {
    // Here you would typically validate the coupon and apply the discount
    alert(`Coupon "${coupon}" applied!`);
  };

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="cart">
      <h2>Your Cart</h2>
      {items.length === 0 ? (
        <p>Your cart is empty.</p>
      ) : (
        <>
          <div className="cart-items">
            {items.map(item => (
              <div key={item.id} className="cart-item">
                <img src={item.image} alt={item.name} className="cart-item-image" />
                <div className="cart-item-info">
                  <h3>{item.name}</h3>
                  <p>Rs {item.price.toFixed(2)}</p>
                </div>
                <div className="cart-item-actions">
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                    min="1"
                  />
                  <button onClick={() => handleRemove(item.id)}>Remove</button>
                </div>
              </div>
            ))}
          </div>

          <div className="cart-summary">
            <div className="summary-item">
              <span>Sub-total:</span>
              <span>Rs. {total.toFixed(2)}</span>
            </div>
            <div className="summary-item">
              <span>Delivery Charge:</span>
              <span>FREE</span>
            </div>
            <div className="summary-item total">
              <span>Total:</span>
              <span>NPR {(total + 100).toFixed(2)}</span>
            </div>
            <div className="apply-coupon">
              <div className="coupon-header">
                <span className="coupon-icon"></span>
                <h4>Apply Coupon</h4>
              </div>
              <div className="coupon-body">
                <input
                  type="text"
                  placeholder="Enter coupon code"
                  value={coupon}
                  onChange={(e) => setCoupon(e.target.value)}
                />
                <button onClick={handleApplyCoupon}>Apply</button>
              </div>
            </div>
            <Link to={getShopPath('/checkout')}>
              <button className="checkout-btn">Proceed to Checkout</button>
            </Link>
          </div>
        </>
      )}
    </div>
  );
};

export default Cart;