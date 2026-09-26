import React, { createContext, useState, useContext, useEffect } from 'react';
import { initialShoes } from '../data';

const StoreContext = createContext();

export const useStore = () => useContext(StoreContext);

export const StoreProvider = ({ children }) => {
  const [inventory, setInventory] = useState(() => {
    const saved = localStorage.getItem('finish_line_inventory');
    if (!saved) return initialShoes;
    const savedInventory = JSON.parse(saved);
    const seededImages = Object.fromEntries(initialShoes.map(shoe => [shoe.id, shoe.image]));
    return savedInventory.map(shoe => seededImages[shoe.id] ? { ...shoe, image: seededImages[shoe.id], brand: 'Finish Line' } : shoe);
  });
  
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('finish_line_cart');
    if (!saved) return [];
    const seededImages = Object.fromEntries(initialShoes.map(shoe => [shoe.id, shoe.image]));
    return JSON.parse(saved).map(item => seededImages[item.id] ? { ...item, image: seededImages[item.id], brand: 'Finish Line' } : item);
  });
  
  const [wishlist, setWishlist] = useState(() => {
    const saved = localStorage.getItem('finish_line_wishlist');
    if (!saved) return [];
    const seededImages = Object.fromEntries(initialShoes.map(shoe => [shoe.id, shoe.image]));
    return JSON.parse(saved).map(item => seededImages[item.id] ? { ...item, image: seededImages[item.id], brand: 'Finish Line' } : item);
  });
  
  const [orders, setOrders] = useState(() => {
    const saved = localStorage.getItem('finish_line_orders');
    return saved ? JSON.parse(saved) : [];
  });

  const [wallet, setWallet] = useState(() => Number(localStorage.getItem('finish_line_wallet') || 0));
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem('finish_line_messages');
    return saved ? JSON.parse(saved) : [{ id: 'welcome', sender: 'admin', text: 'Welcome to Finishline support. How can we help?', time: new Date().toISOString() }];
  });

  useEffect(() => {
    localStorage.setItem('finish_line_inventory', JSON.stringify(inventory));
  }, [inventory]);

  useEffect(() => {
    localStorage.setItem('finish_line_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('finish_line_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  useEffect(() => {
    localStorage.setItem('finish_line_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => localStorage.setItem('finish_line_wallet', wallet.toString()), [wallet]);
  useEffect(() => localStorage.setItem('finish_line_messages', JSON.stringify(messages)), [messages]);

  // Admin Methods
  const addShoe = (shoe) => {
    setInventory(current => [...current, { ...shoe, id: 's' + Date.now() }]);
  };

  const updateShoe = (id, updates) => {
    setInventory(current => current.map(shoe => shoe.id === id ? { ...shoe, ...updates } : shoe));
  };

  const deleteShoe = (id) => {
    setInventory(current => current.filter(s => s.id !== id));
  };
  
  const updateOrderStatus = (orderId, status) => {
    setOrders(current => current.map(order => order.id === orderId ? { ...order, status } : order));
  };

  // Client Methods
  const addToCart = (shoe, size) => {
    setCart(current => [...current, { ...shoe, selectedSize: size, cartId: Date.now() }]);
  };

  const removeFromCart = (cartId) => {
    setCart(current => current.filter(item => item.cartId !== cartId));
  };

  const clearCart = () => setCart([]);

  const toggleWishlist = (shoe) => {
    if (wishlist.find(item => item.id === shoe.id)) {
      setWishlist(current => current.filter(item => item.id !== shoe.id));
    } else {
      setWishlist(current => [...current, shoe]);
    }
  };

  const addFunds = amount => setWallet(current => current + Number(amount));

  const sendMessage = (text, sender) => {
    if (!text.trim()) return;
    setMessages(current => [...current, { id: Date.now(), sender, text: text.trim(), time: new Date().toISOString() }]);
  };

  const checkout = (customerInfo) => {
    if (cart.length === 0) return null;
    
    const newOrder = {
      id: 'ORD-' + Math.floor(Math.random() * 1000000),
      date: new Date().toISOString(),
      customer: customerInfo,
      items: cart,
      total: cart.reduce((sum, item) => sum + Number(item.price), 0),
      status: 'Pending'
    };
    
    // Deduct stock
    const updatedInventory = [...inventory];
    cart.forEach(cartItem => {
      const idx = updatedInventory.findIndex(s => s.id === cartItem.id);
      if (idx !== -1 && updatedInventory[idx].stock > 0) {
        updatedInventory[idx] = { ...updatedInventory[idx], stock: updatedInventory[idx].stock - 1 };
      }
    });
    
    setInventory(updatedInventory);
    setOrders(current => [...current, newOrder]);
    clearCart();
    return newOrder;
  };

  return (
    <StoreContext.Provider value={{ 
      inventory, addShoe, updateShoe, deleteShoe, 
      cart, addToCart, removeFromCart, clearCart,
      wishlist, toggleWishlist,
      orders, checkout, updateOrderStatus,
      wallet, addFunds, messages, sendMessage
    }}>
      {children}
    </StoreContext.Provider>
  );
};
