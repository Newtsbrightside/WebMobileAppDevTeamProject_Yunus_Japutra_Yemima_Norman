import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import { initialShoes } from '../data/data';
import { api, API_ENABLED, resolveImage } from '../api/api';
import { useAuth } from './AuthContext';
import { sizeLabel } from '../utils/sizes';

const StoreContext = createContext();

export const useStore = () => useContext(StoreContext);

const loadLocal = (key, fallback) => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
};

// Offline demo only: bundled pictures get a new file name on every build, so re-apply them.
const seededImages = Object.fromEntries(initialShoes.map(shoe => [shoe.id, shoe.image]));
const withSeedImages = list => list.map(item => (seededImages[item.id] ? { ...item, image: seededImages[item.id] } : item));

const welcomeMessage = { id: 'welcome', sender: 'admin', text: 'Welcome to Finishline support. How can we help?', time: new Date().toISOString() };

/*
  Two modes:
  - API mode (VITE_API_URL set, or `npm run dev`): shoes, orders and messages come from the
    server after login. The server is the only source of truth; failures are shown, not hidden.
  - Offline demo (a static build without an API): everything lives in localStorage, as in Week 6.
  The bag, the wishlist and the demo wallet stay in localStorage in both modes.
*/
export const StoreProvider = ({ children }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'administrator';
  const userId = user?.id;

  const [inventory, setInventory] = useState(() => (API_ENABLED ? [] : withSeedImages(loadLocal('finish_line_inventory', initialShoes))));
  const [orders, setOrders] = useState(() => (API_ENABLED ? [] : loadLocal('finish_line_orders', [])));
  const [messages, setMessages] = useState(() => (API_ENABLED ? [] : loadLocal('finish_line_messages', [welcomeMessage])));
  const [cart, setCart] = useState(() => withSeedImages(loadLocal('finish_line_cart', [])));
  const [wishlist, setWishlist] = useState(() => withSeedImages(loadLocal('finish_line_wishlist', [])));
  const [wallet, setWallet] = useState(() => Number(localStorage.getItem('finish_line_wallet') || 0));

  // 'loading' | 'ready' | 'error' | 'offline'
  const [apiStatus, setApiStatus] = useState(API_ENABLED ? 'loading' : 'offline');
  const [apiError, setApiError] = useState('');

  // Load everything this user may see. Orders: the server decides whose they are.
  const reload = useCallback(async () => {
    if (!API_ENABLED) return;
    if (!userId) {
      // Logged out: forget the previous user's data.
      setOrders([]);
      setMessages([]);
      return;
    }
    setApiStatus('loading');
    setApiError('');
    try {
      const [products, remoteOrders, remoteMessages] = await Promise.all([
        api.getProducts(),
        api.getOrders(isAdmin),
        api.getMessages()
      ]);
      setInventory(products);
      setOrders([...remoteOrders].reverse()); // the screens expect oldest first
      setMessages(remoteMessages);
      setApiStatus('ready');
    } catch (err) {
      setApiError(err.message);
      setApiStatus('error');
    }
  }, [userId, isAdmin]);

  useEffect(() => {
    reload();
  }, [reload]);

  // A failed change is reported on screen, then the real data is loaded again.
  const fail = useCallback(err => {
    setApiError(err.message);
    reload();
  }, [reload]);

  useEffect(() => {
    localStorage.setItem('finish_line_cart', JSON.stringify(cart));
  }, [cart]);
  useEffect(() => {
    localStorage.setItem('finish_line_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);
  useEffect(() => {
    localStorage.setItem('finish_line_wallet', wallet.toString());
  }, [wallet]);
  useEffect(() => {
    if (API_ENABLED) return;
    localStorage.setItem('finish_line_inventory', JSON.stringify(inventory));
    localStorage.setItem('finish_line_orders', JSON.stringify(orders));
    localStorage.setItem('finish_line_messages', JSON.stringify(messages));
  }, [inventory, orders, messages]);

  /* ---------- Admin ---------- */

  const addShoe = async shoe => {
    if (!API_ENABLED) {
      setInventory(current => [...current, { ...shoe, id: 's' + Date.now(), image: shoe.image_url || null }]);
      return;
    }
    const created = await api.addProduct(shoe); // errors go back to the Add Shoe form
    setInventory(current => [...current, created]);
  };

  // The inventory table calls this on every key press, so wait until typing pauses
  // and send one PUT with all the changed fields.
  const pendingUpdates = useRef({});
  const updateShoe = (id, updates) => {
    setInventory(current => current.map(shoe => (shoe.id === id ? { ...shoe, ...updates } : shoe)));
    if (!API_ENABLED) return;
    const pending = pendingUpdates.current[id] || { fields: {} };
    clearTimeout(pending.timer);
    pending.fields = { ...pending.fields, ...updates };
    pending.timer = setTimeout(() => {
      delete pendingUpdates.current[id];
      api.updateProduct(id, pending.fields).catch(fail);
    }, 500);
    pendingUpdates.current[id] = pending;
  };

  const deleteShoe = id => {
    setInventory(current => current.filter(shoe => shoe.id !== id));
    if (API_ENABLED) api.deleteProduct(id).catch(fail);
  };

  // imageUrl is an https:// address. Files are not uploaded: the database keeps only the address.
  const updateProductImage = (id, imageUrl) => {
    if (!isAdmin) return false;
    const image = resolveImage(imageUrl);
    const apply = list => list.map(item => (item.id === id ? { ...item, image, image_url: imageUrl } : item));
    setInventory(apply);
    setCart(apply);
    setWishlist(apply);
    if (API_ENABLED) api.updateProduct(id, { image_url: imageUrl }).catch(fail);
    return true;
  };

  const updateOrderStatus = (orderId, status) => {
    setOrders(current => current.map(order => (order.id === orderId ? { ...order, status } : order)));
    if (API_ENABLED) api.updateOrderStatus(orderId, status).catch(fail);
  };

  /* ---------- Client ---------- */

  // sizes: { left, right } — or one number when both feet take the same size.
  const addToCart = (shoe, sizes) => {
    const { left, right } = typeof sizes === 'object' ? sizes : { left: sizes, right: sizes };
    setCart(current => [
      ...current,
      { ...shoe, leftSize: left, rightSize: right, selectedSize: sizeLabel(left, right), cartId: `${Date.now()}-${current.length}` }
    ]);
  };

  const removeFromCart = cartId => setCart(current => current.filter(item => item.cartId !== cartId));
  const clearCart = () => setCart([]);

  const toggleWishlist = shoe => {
    setWishlist(current => (current.some(item => item.id === shoe.id)
      ? current.filter(item => item.id !== shoe.id)
      : [...current, shoe]));
  };

  const addFunds = amount => setWallet(current => current + Number(amount));

  const sendMessage = (text, sender) => {
    if (!text.trim()) return;
    setMessages(current => [...current, { id: Date.now(), sender, text: text.trim(), time: new Date().toISOString() }]);
    if (API_ENABLED) api.sendMessage(text.trim()).catch(fail);
  };

  // Places the order and returns it. Throws with the server's message (e.g. a size sold out),
  // so the checkout form can show it.
  const checkout = async customerInfo => {
    if (cart.length === 0) return null;

    if (API_ENABLED) {
      const order = await api.createOrder(customerInfo, cart);
      setOrders(current => [...current, order]);
      clearCart();
      api.getProducts().then(setInventory).catch(() => {}); // stock went down
      return order;
    }

    const order = {
      id: 'ORD-' + Math.floor(100000 + Math.random() * 900000),
      date: new Date().toISOString(),
      customer: customerInfo,
      items: cart,
      total: cart.reduce((sum, item) => sum + Number(item.price), 0),
      status: 'Pending'
    };
    setInventory(current => current.map(shoe => {
      const pairs = cart.filter(item => item.id === shoe.id).length;
      return pairs ? { ...shoe, stock: Math.max(0, shoe.stock - pairs) } : shoe;
    }));
    setOrders(current => [...current, order]);
    clearCart();
    return order;
  };

  return (
    <StoreContext.Provider value={{
      inventory, addShoe, updateShoe, deleteShoe, updateProductImage,
      cart, addToCart, removeFromCart, clearCart,
      wishlist, toggleWishlist,
      orders, checkout, updateOrderStatus,
      wallet, addFunds, messages, sendMessage,
      apiStatus, apiError, reload, dismissApiError: () => setApiError(''),
      apiConnected: apiStatus === 'ready',
      apiLoading: apiStatus === 'loading'
    }}>
      {children}
    </StoreContext.Provider>
  );
};
