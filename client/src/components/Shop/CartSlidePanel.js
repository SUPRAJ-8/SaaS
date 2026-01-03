import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCart, useDispatchCart } from './CartProvider';
import { FaTimes, FaTrash, FaMinus, FaPlus } from 'react-icons/fa';
import { getShopPath } from '../../themeUtils';
import './CartSlidePanel.css';

const CartSlidePanel = ({ isOpen, onClose }) => {
    const { items } = useCart();
    const dispatch = useDispatchCart();

    const handleRemove = (id, variant) => {
        dispatch({ type: 'REMOVE_ITEM', payload: { id, variant } });
    };

    const handleIncrement = (id, variant, currentQuantity) => {
        dispatch({ type: 'UPDATE_QUANTITY', payload: { id, variant, quantity: currentQuantity + 1 } });
    };

    const handleDecrement = (id, variant, currentQuantity) => {
        if (currentQuantity > 1) {
            dispatch({ type: 'UPDATE_QUANTITY', payload: { id, variant, quantity: currentQuantity - 1 } });
        }
    };

    const subtotal = items.reduce((sum, item) => {
        const price = Number(item.price) || 0;
        const quantity = Number(item.quantity) || 0;
        return sum + (price * quantity);
    }, 0);

    // Listen for global cart open/close events
    useEffect(() => {
        const handleOpen = () => {
            // We need to call a function that sets isOpen to true
            // Since we receive onClose, we need a different approach
            window.cartPanelControl = { open: true };
        };

        window.addEventListener('openCartPanel', handleOpen);

        return () => {
            window.removeEventListener('openCartPanel', handleOpen);
        };
    }, []);

    // Check for cart control flag
    useEffect(() => {
        if (window.cartPanelControl?.open && !isOpen) {
            // Trigger parent to open
            const event = new CustomEvent('requestCartOpen');
            window.dispatchEvent(event);
            window.cartPanelControl = { open: false };
        }
    }, [isOpen]);

    // Auto-close cart when it becomes empty
    useEffect(() => {
        if (items.length === 0 && isOpen) {
            setTimeout(() => {
                onClose();
            }, 500);
        }
    }, [items.length, isOpen, onClose]);

    return (
        <>
            <div className={`cart-overlay ${isOpen ? 'active' : ''}`} onClick={onClose}></div>
            <div className={`cart-slide-panel ${isOpen ? 'open' : ''}`}>
                <div className="cart-panel-header">
                    <h2>Your Cart <span className="cart-count-badge">{items.length} items</span></h2>
                    <button className="close-cart-btn" onClick={onClose}>
                        <FaTimes />
                    </button>
                </div>

                <div className="cart-panel-body">
                    {items.length === 0 ? (
                        <div className="empty-cart">
                            <p>Your cart is empty</p>
                        </div>
                    ) : (
                        items.map((item, index) => (
                            <div key={`${item.id}-${item.variant || index}`} className="cart-slide-item">
                                <img src={item.image} alt={item.name} className="cart-slide-item-image" />

                                <div className="cart-slide-item-details">
                                    <h4>{item.name}</h4>
                                    {item.variant && <span className="item-variant-label">{item.variant}</span>}
                                    <div className="quantity-controls">
                                        <button onClick={() => handleDecrement(item.id, item.variant, item.quantity)}>
                                            <FaMinus />
                                        </button>
                                        <span>{item.quantity}</span>
                                        <button onClick={() => handleIncrement(item.id, item.variant, item.quantity)}>
                                            <FaPlus />
                                        </button>
                                    </div>
                                </div>

                                <div className="cart-slide-item-right">
                                    <p className="cart-slide-item-price">NPR {((Number(item.price) || 0) * (Number(item.quantity) || 0)).toLocaleString()}</p>
                                    <button className="remove-item-btn" onClick={() => handleRemove(item.id, item.variant)}>
                                        <FaTrash />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {items.length > 0 && (
                    <div className="cart-panel-footer">
                        <div className="cart-subtotal">
                            <span>Subtotal</span>
                            <span className="subtotal-amount">NPR {subtotal.toLocaleString()}</span>
                        </div>
                        <p className="shipping-note">Shipping will be calculated at checkout.</p>
                        <Link to={getShopPath('/checkout')} onClick={onClose}>
                            <button className="checkout-btn-slide">Checkout</button>
                        </Link>
                    </div>
                )}
            </div>
        </>
    );
};

export default CartSlidePanel;
