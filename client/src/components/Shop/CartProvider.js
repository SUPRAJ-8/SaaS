import React, { createContext, useReducer, useContext, useEffect } from 'react';

const CartStateContext = createContext();
const CartDispatchContext = createContext();

const cartReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_ITEM': {
      const { id, variant, quantity } = action.payload;
      const itemExists = state.items.find(item => item.id === id && item.variant === variant);

      if (itemExists) {
        // If item with the same variant exists, update its quantity
        return {
          ...state,
          items: state.items.map(item =>
            (item.id === id && item.variant === variant)
              ? { ...item, quantity: item.quantity + quantity }
              : item
          ),
        };
      } else {
        // If it's a new item or a new variant, add it to the cart
        return {
          ...state,
          items: [...state.items, action.payload],
        };
      }
    }
    case 'REMOVE_FROM_CART': {
      const { id, variant } = action.payload;
      return {
        ...state,
        items: state.items.filter(item => !(item.id === id && item.variant === variant)),
      };
    }
    case 'UPDATE_QUANTITY': {
      const { id, variant, quantity } = action.payload;
      return {
        ...state,
        items: state.items.map(item =>
          (item.id === id && item.variant === variant)
            ? { ...item, quantity: quantity }
            : item
        ),
      };
    }
    case 'REMOVE_ITEM': {
      const { id, variant } = action.payload;
      return {
        ...state,
        items: state.items.filter(item => !(item.id === id && item.variant === variant)),
      };
    }
    case 'CLEAR_CART':
      return { ...state, items: [] };
    default:
      throw new Error(`Unknown action: ${action.type}`);
  }
};

export const CartProvider = ({ children }) => {
  const initialState = {
    items: JSON.parse(localStorage.getItem('cartItems')) || [],
  };

  const [state, dispatch] = useReducer(cartReducer, initialState);

  useEffect(() => {
    localStorage.setItem('cartItems', JSON.stringify(state.items));
  }, [state.items]);

  return (
    <CartDispatchContext.Provider value={dispatch}>
      <CartStateContext.Provider value={state}>
        {children}
      </CartStateContext.Provider>
    </CartDispatchContext.Provider>
  );
};

export const useCart = () => {
  const state = useContext(CartStateContext);
  const dispatch = useContext(CartDispatchContext);
  return { ...state, dispatch };
};
export const useDispatchCart = () => useContext(CartDispatchContext);