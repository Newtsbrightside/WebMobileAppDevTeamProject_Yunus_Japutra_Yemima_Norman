import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import confetti from 'canvas-confetti';
import {
  ArrowUpRight, Check, CreditCard, Heart, MessageCircle, Package,
  Plus, Search, Send, Share2, ShoppingBag, Trash2, X, Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';

const money = value => `$${Number(value || 0).toFixed(2)}`;

const EmptyState = ({ message }) => (
  <div className="empty-state">
    <Package size={24} />
    <p>{message}</p>
  </div>
);

/* ==========================================================
   PORTAL MODAL COMPONENT
   Mounted to document.body: Immune to ancestor transforms,
   stays fixed to device screen and follows on scroll.
   ========================================================== */
const Modal = ({ children, onClose, className = '' }) => {
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const baseClass = className.split(' ')[0] || 'default';

  return createPortal(
    <div
      className={`modal-backdrop modal-${baseClass}`}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`modal-card ${className}`}
        onClick={event => event.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body
  );
};

/* ==========================================================
   CHAT MODAL
   ========================================================== */
const Chat = ({ isAdmin, messages, sendMessage, onClose }) => {
  const [text, setText] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const submit = (event) => {
    event.preventDefault();
    if (!text.trim()) return;
    sendMessage(text, isAdmin ? 'admin' : 'client');
    setText('');
  };

  const quickPrompts = [
    'How does sizing fit on the AeroGlide?',
    'What is your return & exchange policy?',
    'When will my pending order ship?'
  ];

  return (
    <Modal onClose={onClose} className="chat-modal">
      <div className="modal-header">
        <div>
          <p className="eyebrow">
            <span className="live-status-dot" /> LIVE SUPPORT
          </p>
          <h2>{isAdmin ? 'Client Inbox' : 'Finishline Concierge'}</h2>
        </div>
        <button className="icon-button" onClick={onClose} aria-label="Close chat">
          <X size={18} />
        </button>
      </div>

      <div className="chat-messages">
        {messages.length === 0 ? (
          <EmptyState message="No messages yet. Send a note to start chatting." />
        ) : (
          messages.map(message => {
            const isMine = message.sender === (isAdmin ? 'admin' : 'client');
            return (
              <div key={message.id} className={`chat-bubble ${isMine ? 'mine' : ''}`}>
                <div className="chat-bubble-header">
                  <span className="chat-sender-label">
                    {message.sender === 'admin' ? 'Finishline Team' : 'Client'}
                  </span>
                  <span className="chat-time-label">
                    {new Date(message.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p>{message.text}</p>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {!isAdmin && (
        <div className="chat-quick-prompts">
          {quickPrompts.map(prompt => (
            <button
              key={prompt}
              type="button"
              className="quick-prompt-chip"
              onClick={() => setText(prompt)}
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      <form className="chat-form" onSubmit={submit}>
        <input
          value={text}
          onChange={event => setText(event.target.value)}
          placeholder="Type your message..."
          aria-label="Chat message"
        />
        <button
          className="btn btn-primary"
          type="submit"
          title="Send message"
          disabled={!text.trim()}
        >
          <Send size={15} />
        </button>
      </form>
    </Modal>
  );
};

/* ==========================================================
   PRODUCT DETAILS MODAL
   ========================================================== */
const ProductDetails = ({ shoe, onClose, onAdd, onWishlist, wished }) => {
  const [size, setSize] = useState(shoe.sizes[0] || '');
  const [showChart, setShowChart] = useState(false);
  const [shared, setShared] = useState(false);

  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
    } catch {
      /* clipboard fallback */
    }
    setShared(true);
    setTimeout(() => setShared(false), 1600);
  };

  return (
    <Modal onClose={onClose} className="product-modal">
      <div className="detail-image">
        <img src={shoe.image} alt={shoe.name} />
      </div>
      <div className="detail-content">
        <button className="modal-close icon-button" onClick={onClose} aria-label="Close product details">
          <X size={18} />
        </button>
        <span className="product-category">{shoe.category}</span>
        <h2>{shoe.name}</h2>
        <strong className="detail-price">{money(shoe.price)}</strong>
        <p className="detail-description">{shoe.description}</p>

        <div className="detail-row">
          <strong>Select Size (US)</strong>
          <button className="text-button" type="button" onClick={() => setShowChart(!showChart)}>
            {showChart ? 'Hide Size Chart' : 'View Size Chart'}
          </button>
        </div>

        {showChart && (
          <div className="size-chart animate-fade-in">
            <div className="size-chart-head">
              <span>US</span><span>UK</span><span>EU</span><span>CM</span>
            </div>
            {[[8, 7, 41, 26], [9, 8, 42, 27], [10, 9, 43, 28], [11, 10, 44, 29], [12, 11, 45, 30]].map(row => (
              <div key={row[0]}>
                {row.map(value => <span key={value}>{value}</span>)}
              </div>
            ))}
          </div>
        )}

        <div className="size-grid">
          {shoe.sizes.map(item => (
            <button
              key={item}
              type="button"
              className={String(size) === String(item) ? 'selected' : ''}
              onClick={() => setSize(item)}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="detail-actions">
          <button
            className="btn btn-primary"
            disabled={!size || shoe.stock === 0}
            onClick={() => onAdd(shoe, size)}
          >
            <ShoppingBag size={16} />
            {shoe.stock === 0 ? 'Sold Out' : `Add to Bag · US ${size}`}
          </button>
          <button
            className={`btn btn-light ${wished ? 'selected' : ''}`}
            onClick={() => onWishlist(shoe)}
            title={wished ? 'Remove from wishlist' : 'Save to wishlist'}
            aria-label="Wishlist toggle"
          >
            <Heart size={17} fill={wished ? 'currentColor' : 'none'} />
          </button>
          <button
            className="btn btn-light"
            onClick={share}
            title="Share shoe link"
            aria-label="Share link"
          >
            {shared ? <Check size={17} /> : <Share2 size={17} />}
          </button>
        </div>

        <div className="detail-meta-badges">
          <small className="detail-note">
            {shoe.stock > 0 ? `${shoe.stock} pairs available in stock` : 'Currently unavailable'}
          </small>
          <small className="detail-note">Free standard shipping on orders over $150</small>
        </div>
      </div>
    </Modal>
  );
};

/* ==========================================================
   CART DRAWER / MODAL
   ========================================================== */
const CartDrawer = ({ cart, removeFromCart, onClose, onCheckout }) => {
  const subtotal = cart.reduce((sum, item) => sum + Number(item.price), 0);
  const freeShippingThreshold = 150;
  const neededForFree = Math.max(0, freeShippingThreshold - subtotal);
  const shippingPercent = Math.min(100, Math.round((subtotal / freeShippingThreshold) * 100));

  return (
    <Modal onClose={onClose} className="cart-modal">
      <div className="modal-header">
        <div>
          <p className="eyebrow">YOUR SELECTION</p>
          <h2>Shopping Bag ({cart.length})</h2>
        </div>
        <button className="icon-button" onClick={onClose} aria-label="Close bag">
          <X size={18} />
        </button>
      </div>

      {cart.length === 0 ? (
        <div style={{ display: 'grid', gap: '16px', margin: 'auto 0' }}>
          <EmptyState message="Your bag is empty. Explore styles to add pairs." />
          <button className="btn btn-light full-button" onClick={onClose}>
            Browse Collection
          </button>
        </div>
      ) : (
        <>
          <div className="shipping-bar-wrap">
            <div className="shipping-bar-text">
              {neededForFree === 0 ? (
                <span className="free-shipping-unlocked">
                  <Check size={14} /> You've unlocked Free Express Shipping!
                </span>
              ) : (
                <span>Add <strong>{money(neededForFree)}</strong> more for Free Shipping</span>
              )}
            </div>
            <div className="shipping-progress-track">
              <div className="shipping-progress-fill" style={{ width: `${shippingPercent}%` }} />
            </div>
          </div>

          <div className="cart-items">
            {cart.map(item => (
              <div className="cart-item" key={item.cartId}>
                <img src={item.image} alt={item.name} />
                <div className="cart-item-info">
                  <strong>{item.name}</strong>
                  <div className="cart-item-meta">
                    <span className="cart-size-pill">Size {item.selectedSize}</span>
                    <span className="cart-cat-pill">{item.category}</span>
                  </div>
                  <b>{money(item.price)}</b>
                </div>
                <button
                  className="icon-button danger"
                  onClick={() => removeFromCart(item.cartId)}
                  title="Remove item"
                  aria-label="Remove item"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>

          <div className="cart-footer">
            <div className="cart-summary-breakdown">
              <div className="cart-summary-line">
                <span>Subtotal</span>
                <strong>{money(subtotal)}</strong>
              </div>
              <div className="cart-summary-line">
                <span>Shipping</span>
                <span>{neededForFree === 0 ? 'FREE' : money(12)}</span>
              </div>
              <div className="cart-summary-line total-line">
                <span>Total</span>
                <strong>{money(subtotal + (neededForFree === 0 ? 0 : 12))}</strong>
              </div>
            </div>

            <button className="btn btn-primary full-button" onClick={onCheckout}>
              Proceed to Checkout <ArrowUpRight size={16} />
            </button>
          </div>
        </>
      )}
    </Modal>
  );
};

/* ==========================================================
   WISHLIST MODAL
   ========================================================== */
const WishlistModal = ({ wishlist, toggleWishlist, onAddToCart, onClose }) => {
  return (
    <Modal onClose={onClose} className="wishlist-modal">
      <div className="modal-header">
        <div>
          <p className="eyebrow"><Heart size={14} fill="currentColor" /> SAVED FOR LATER</p>
          <h2>Your Wishlist ({wishlist.length})</h2>
        </div>
        <button className="icon-button" onClick={onClose} aria-label="Close wishlist">
          <X size={18} />
        </button>
      </div>

      {wishlist.length === 0 ? (
        <div style={{ display: 'grid', gap: '16px', margin: 'auto 0' }}>
          <EmptyState message="Your wishlist is empty. Tap the heart on any shoe to save it." />
          <button className="btn btn-light full-button" onClick={onClose}>
            Explore Styles
          </button>
        </div>
      ) : (
        <>
          <div className="wishlist-items">
            {wishlist.map(shoe => (
              <div className="wishlist-item-row" key={shoe.id}>
                <img src={shoe.image} alt={shoe.name} />
                <div className="cart-item-info">
                  <span className="product-category">{shoe.category}</span>
                  <strong>{shoe.name}</strong>
                  <div className="cart-item-meta">
                    <span className="stock-status-pill">
                      {shoe.stock > 0 ? `${shoe.stock} in stock` : 'Out of stock'}
                    </span>
                  </div>
                  <b>{money(shoe.price)}</b>
                </div>
                <div className="wishlist-row-actions">
                  <button
                    className="btn btn-primary btn-sm"
                    disabled={shoe.stock === 0}
                    onClick={() => {
                      onAddToCart(shoe, shoe.sizes[0] || 9);
                      toggleWishlist(shoe);
                    }}
                    title="Move to shopping bag"
                  >
                    <ShoppingBag size={13} /> Bag
                  </button>
                  <button
                    className="icon-button danger"
                    onClick={() => toggleWishlist(shoe)}
                    title="Remove from wishlist"
                    aria-label="Remove from wishlist"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="cart-footer">
            <p className="wishlist-summary-text">
              {wishlist.length} item{wishlist.length !== 1 ? 's' : ''} saved in your session
            </p>
            <button className="btn btn-light full-button" onClick={onClose}>
              Continue Browsing
            </button>
          </div>
        </>
      )}
    </Modal>
  );
};

/* ==========================================================
   CHECKOUT MODAL (CENTERED IN DEVICE SCREEN)
   ========================================================== */
const Checkout = ({ cart, wallet, onClose, onSubmit }) => {
  const [form, setForm] = useState({ name: '', address: '', card: '' });
  const total = cart.reduce((sum, item) => sum + Number(item.price), 0);
  const update = event => setForm({ ...form, [event.target.name]: event.target.value });

  return (
    <Modal onClose={onClose} className="checkout-modal">
      <div className="modal-header">
        <div>
          <p className="eyebrow"><Sparkles size={13} /> FINAL STEP</p>
          <h2>Complete Order</h2>
        </div>
        <button className="icon-button" onClick={onClose} aria-label="Close checkout">
          <X size={18} />
        </button>
      </div>

      <div className="checkout-summary-box">
        <div className="checkout-summary-header">
          <span>Order Items ({cart.length})</span>
          <strong>{money(total)}</strong>
        </div>
        <div className="checkout-mini-items">
          {cart.map((item, idx) => (
            <div key={item.cartId || idx} className="checkout-mini-item">
              <img src={item.image} alt="" />
              <div>
                <div>{item.name}</div>
                <small style={{ color: 'var(--muted)' }}>Size {item.selectedSize} · {money(item.price)}</small>
              </div>
            </div>
          ))}
        </div>
      </div>

      <form className="checkout-form" onSubmit={event => { event.preventDefault(); onSubmit(form); }}>
        <label>
          Full Name
          <input
            name="name"
            value={form.name}
            onChange={update}
            required
            placeholder="Alex Morgan"
            autoComplete="name"
          />
        </label>
        <label>
          Delivery Address
          <input
            name="address"
            value={form.address}
            onChange={update}
            required
            placeholder="123 Fashion Blvd, Suite 400"
            autoComplete="street-address"
          />
        </label>
        <label>
          Payment Card
          <input
            name="card"
            value={form.card}
            onChange={update}
            required
            placeholder="4242 •••• •••• 4242"
            autoComplete="cc-number"
          />
        </label>

        <div className="wallet-note">
          <CreditCard size={16} />
          <span>Wallet Balance: <strong>{money(wallet)}</strong></span>
        </div>

        <button className="btn btn-primary full-button checkout-submit-btn" type="submit">
          Authorize & Place Order · {money(total)} <Check size={16} />
        </button>
      </form>
    </Modal>
  );
};

/* ==========================================================
   ORDER CONFIRMATION MODAL
   ========================================================== */
const Complete = ({ order, onClose }) => (
  <Modal onClose={onClose} className="complete-modal">
    <div className="complete-icon">
      <Check size={32} />
    </div>
    <p className="eyebrow">ORDER CONFIRMED</p>
    <h2>You are on your way.</h2>
    <p className="muted">
      Order <strong>{order.id}</strong> has been successfully placed and routed to fulfillment.
    </p>
    <div className="complete-summary">
      <span>Total Paid</span>
      <strong>{money(order.total)}</strong>
    </div>
    <button className="btn btn-primary full-button" onClick={onClose}>
      Continue Shopping
    </button>
  </Modal>
);

/* ==========================================================
   TOP UP MODAL
   ========================================================== */
const TopUp = ({ onClose, onTopUp }) => {
  const [amount, setAmount] = useState(50);
  return (
    <Modal onClose={onClose} className="small-modal">
      <div className="modal-header">
        <div>
          <p className="eyebrow">FINISHLINE WALLET</p>
          <h2>Top Up Balance</h2>
        </div>
        <button className="icon-button" onClick={onClose} aria-label="Close top-up">
          <X size={18} />
        </button>
      </div>
      <p className="muted">Simulated funds for demonstration purposes. No real card will be charged.</p>
      <div className="amount-options">
        {[25, 50, 100].map(value => (
          <button
            key={value}
            type="button"
            className={amount === value ? 'selected' : ''}
            onClick={() => setAmount(value)}
          >
            {money(value)}
          </button>
        ))}
      </div>
      <button className="btn btn-primary full-button" onClick={() => onTopUp(amount)}>
        Add {money(amount)} <Plus size={16} />
      </button>
    </Modal>
  );
};

/* ==========================================================
   ADMIN COMPONENT
   ========================================================== */
const Admin = ({ inventory, orders, messages, updateShoe, deleteShoe, updateOrderStatus, onChat }) => {
  const [tab, setTab] = useState('inventory');
  const lowStock = inventory.filter(shoe => shoe.stock <= 12).length;

  return (
    <main className="page-shell animate-fade-in">
      <header className="page-heading">
        <div>
          <p className="eyebrow">CONTROL ROOM / 01</p>
          <h1>Store <em>command.</em></h1>
          <p className="muted">Manage live styles, fulfill client orders, and respond via live chat.</p>
        </div>
        <div className="admin-actions">
          <button className="btn btn-light" onClick={onChat}>
            <MessageCircle size={16} /> Chat
            {messages.filter(item => item.sender === 'client').length > 0 && (
              <span className="nav-count">{messages.filter(item => item.sender === 'client').length}</span>
            )}
          </button>
          <a className="btn btn-primary" href="/add-shoe">
            Add New Shoe <ArrowUpRight size={17} />
          </a>
        </div>
      </header>

      <section className="stat-grid">
        <div className="stat-card">
          <span>Live Styles</span>
          <strong>{inventory.length}</strong>
          <small>Editable in real time</small>
        </div>
        <div className="stat-card accent">
          <span>Low Stock Alert</span>
          <strong>{lowStock}</strong>
          <small>12 pairs or fewer</small>
        </div>
        <div className="stat-card">
          <span>Total Orders</span>
          <strong>{orders.length}</strong>
          <small>Track fulfillment status</small>
        </div>
      </section>

      <div className="admin-tabs">
        <button className={tab === 'inventory' ? 'active' : ''} onClick={() => setTab('inventory')}>
          Inventory ({inventory.length})
        </button>
        <button className={tab === 'orders' ? 'active' : ''} onClick={() => setTab('orders')}>
          Orders <span>{orders.filter(order => order.status === 'Pending').length}</span>
        </button>
      </div>

      {tab === 'inventory' ? (
        <section className="section-block">
          <div className="section-title">
            <div>
              <p className="eyebrow">COLLECTION / {inventory.length}</p>
              <h2>Inventory Registry</h2>
            </div>
            <span className="status-dot">
              <i /> Changes sync locally
            </span>
          </div>

          <div className="inventory-table">
            <div className="table-head">
              <span>Product</span>
              <span>Category</span>
              <span>Price (USD)</span>
              <span>Stock Count</span>
              <span />
            </div>

            {inventory.length === 0 ? (
              <EmptyState message="Inventory is empty. Add a shoe to begin." />
            ) : (
              inventory.map(shoe => (
                <div className="table-row admin-row" key={shoe.id}>
                  <div className="product-cell">
                    <img src={shoe.image} alt={shoe.name} />
                    <span>
                      <strong>{shoe.name}</strong>
                      <small>{shoe.id}</small>
                    </span>
                  </div>
                  <input
                    aria-label={`${shoe.name} category`}
                    value={shoe.category}
                    onChange={event => updateShoe(shoe.id, { category: event.target.value })}
                  />
                  <input
                    aria-label={`${shoe.name} price`}
                    type="number"
                    min="0"
                    step="0.01"
                    value={shoe.price}
                    onChange={event => updateShoe(shoe.id, { price: Number(event.target.value) })}
                  />
                  <input
                    aria-label={`${shoe.name} stock`}
                    type="number"
                    min="0"
                    value={shoe.stock}
                    onChange={event => updateShoe(shoe.id, { stock: Number(event.target.value) })}
                  />
                  <button
                    className="icon-button danger"
                    title="Remove shoe"
                    onClick={() => deleteShoe(shoe.id)}
                    aria-label={`Delete ${shoe.name}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        </section>
      ) : (
        <section className="orders-panel">
          <div className="section-title">
            <div>
              <p className="eyebrow">FULFILLMENT DESK</p>
              <h2>Client Orders ({orders.length})</h2>
            </div>
          </div>

          {orders.length === 0 ? (
            <EmptyState message="No orders recorded yet." />
          ) : (
            <div className="order-list">
              {[...orders].reverse().map(order => (
                <div className="order-card" key={order.id}>
                  <div>
                    <strong>{order.id}</strong>
                    <small>{new Date(order.date).toLocaleString()}</small>
                  </div>
                  <div>
                    <strong>{order.customer.name}</strong>
                    <small>{order.items?.length || 1} item(s) · {order.customer.address}</small>
                  </div>
                  <strong>{money(order.total)}</strong>
                  <select
                    value={order.status}
                    onChange={event => updateOrderStatus(order.id, event.target.value)}
                  >
                    <option>Pending</option>
                    <option>Processing</option>
                    <option>Shipped</option>
                    <option>Delivered</option>
                  </select>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </main>
  );
};

/* ==========================================================
   CLIENT DASHBOARD COMPONENT
   ========================================================== */
const Client = ({
  inventory, wishlist, toggleWishlist, cart, addToCart,
  removeFromCart, orders, wallet, addFunds, checkout,
  messages, sendMessage
}) => {
  const [sortBy, setSortBy] = useState('default');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [selected, setSelected] = useState(null);
  const [showCart, setShowCart] = useState(false);
  const [showWishlist, setShowWishlist] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showTopUp, setShowTopUp] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [completed, setCompleted] = useState(null);

  // Listen to Navbar triggers
  useEffect(() => {
    const handleOpenWishlist = () => setShowWishlist(true);
    const handleOpenCart = () => setShowCart(true);

    window.addEventListener('open-wishlist-modal', handleOpenWishlist);
    window.addEventListener('open-cart-modal', handleOpenCart);

    return () => {
      window.removeEventListener('open-wishlist-modal', handleOpenWishlist);
      window.removeEventListener('open-cart-modal', handleOpenCart);
    };
  }, []);

  const categories = ['All', ...new Set(inventory.map(shoe => shoe.category))];
  const products = inventory.filter(shoe =>
    (category === 'All' || shoe.category === category) &&
    shoe.name.toLowerCase().includes(query.toLowerCase())
  );
  const sortedProducts = [...products].sort((a, b) => {
    if (sortBy === 'price-asc') return a.price - b.price;
    if (sortBy === 'price-desc') return b.price - a.price;
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    return 0;
  });

  const placeOrder = (info) => {
    const order = checkout(info);
    if (!order) return;

    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.6);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.6);
    } catch {
      /* audio gesture restriction */
    }

    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#fb5d3b', '#d9f25b', '#121211', '#ffffff']
      });
    } catch {
      /* confetti fallback */
    }

    setShowCheckout(false);
    setCompleted(order);
  };

  return (
    <main className="page-shell animate-fade-in">
      <header className="page-heading client-heading">
        <div>
          <p className="eyebrow">THE NEW SEASON / 2026</p>
          <h1>Find your <em>pace.</em></h1>
          <p className="muted">Engineered athletic footwear curated for speed, lifestyle, and everyday comfort.</p>
        </div>

        <div className="client-tools">
          <button className="wallet-pill" onClick={() => setShowTopUp(true)} title="Simulated Wallet">
            <CreditCard size={15} />
            <span>{money(wallet)}</span>
            <Plus size={13} />
          </button>
          <button
            className="btn btn-light tool-btn"
            onClick={() => setShowWishlist(true)}
            title="View saved items"
          >
            <Heart size={15} fill={wishlist.length > 0 ? 'currentColor' : 'none'} />
            <span className="tool-btn-label">Wishlist</span>
            {wishlist.length > 0 && <span className="nav-count">{wishlist.length}</span>}
          </button>
          <button
            className="btn btn-light tool-btn"
            onClick={() => setShowChat(true)}
            title="Chat with Concierge"
          >
            <MessageCircle size={15} />
            <span className="tool-btn-label">Support</span>
          </button>
          <button
            className="bag-button"
            onClick={() => setShowCart(true)}
            title="Open Shopping Bag"
          >
            <ShoppingBag size={16} />
            <span className="tool-btn-label">Bag</span>
            <span className="bag-badge">{cart.length}</span>
          </button>
        </div>
      </header>

      {/* Search & Categories Bar */}
      <div className="search-filter">
        <div className="search-box">
          <Search size={16} />
          <input
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder="Search shoes by model or style..."
            aria-label="Search shoes"
          />
        </div>

        <div className="category-tabs">
          {categories.map(item => (
            <button
              key={item}
              className={category === item ? 'active' : ''}
              onClick={() => setCategory(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div style={{ margin: '0 0 1rem' }}>
        <select
          value={sortBy}
          onChange={event => setSortBy(event.target.value)}
          style={{ padding: '0.6rem 1rem' }}
          aria-label="Sort products"
        >
          <option value="default">Sort by</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
          <option value="name">Name: A-Z</option>
        </select>
      </div>

      {/* Product Grid */}
      <section className="product-grid">
        {sortedProducts.length === 0 ? (
          <EmptyState message="No styles match your search criteria. Try a different query." />
        ) : (
          sortedProducts.map(shoe => {
            const isWished = wishlist.some(item => item.id === shoe.id);
            return (
              <article className="product-card" key={shoe.id}>
                <div className="product-image" onClick={() => setSelected(shoe)}>
                  <img src={shoe.image} alt={shoe.name} loading="lazy" />
                  <button
                    className={`heart-button ${isWished ? 'selected' : ''}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      toggleWishlist(shoe);
                    }}
                    title={isWished ? 'Remove from wishlist' : 'Save to wishlist'}
                    aria-label={`Toggle wishlist for ${shoe.name}`}
                  >
                    <Heart size={16} fill={isWished ? 'currentColor' : 'none'} />
                  </button>
                  {shoe.stock === 0 && <span className="sold-out">Sold Out</span>}
                </div>

                <div className="product-info">
                  <div>
                    <span className="product-category">{shoe.category}</span>
                    <h3>{shoe.name}</h3>
                  </div>
                  <strong>{money(shoe.price)}</strong>
                </div>

                <p>{shoe.description}</p>

                <button className="details-button" onClick={() => setSelected(shoe)}>
                  View details <ArrowUpRight size={14} />
                </button>

                <div className="product-meta">
                  <span>{shoe.stock > 0 ? `${shoe.stock} pairs left` : 'Out of stock'}</span>
                  <span>{shoe.colors[0]}</span>
                </div>
              </article>
            );
          })
        )}
      </section>

      {/* Saved for Later Section */}
      <section className="wishlist-section" id="wishlist">
        <div className="section-title">
          <div>
            <p className="eyebrow"><Heart size={14} fill="currentColor" /> SAVED FOR LATER</p>
            <h2>Your Wishlist</h2>
          </div>
          <div className="section-actions">
            <span className="result-count">{wishlist.length} saved</span>
            {wishlist.length > 0 && (
              <button className="text-button" onClick={() => setShowWishlist(true)}>
                View drawer <ArrowUpRight size={13} />
              </button>
            )}
          </div>
        </div>

        {wishlist.length === 0 ? (
          <EmptyState message="Your saved list is empty. Tap the heart icon on any pair to keep track." />
        ) : (
          <div className="wishlist-strip">
            {wishlist.map(shoe => (
              <div className="wishlist-item" key={shoe.id}>
                <img src={shoe.image} alt={shoe.name} />
                <div>
                  <strong>{shoe.name}</strong>
                  <small>{money(shoe.price)}</small>
                </div>
                <button
                  className="icon-button danger"
                  onClick={() => toggleWishlist(shoe)}
                  title="Remove from wishlist"
                  aria-label="Remove item"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Recent Orders Section */}
      <section className="order-history">
        <div className="section-title">
          <div>
            <p className="eyebrow">YOUR ACTIVITY</p>
            <h2>Recent Orders</h2>
          </div>
        </div>

        {orders.length === 0 ? (
          <EmptyState message="Orders you place will appear here." />
        ) : (
          <div className="mini-orders">
            {orders.slice(-3).reverse().map(order => (
              <div key={order.id}>
                <strong>{order.id}</strong>
                <span>{order.status}</span>
                <b>{money(order.total)}</b>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Modals rendered cleanly via Portal */}
      {selected && (
        <ProductDetails
          shoe={selected}
          onClose={() => setSelected(null)}
          onAdd={(shoe, size) => {
            addToCart(shoe, size);
            setSelected(null);
            setShowCart(true);
          }}
          onWishlist={toggleWishlist}
          wished={wishlist.some(item => item.id === selected.id)}
        />
      )}

      {showCart && (
        <CartDrawer
          cart={cart}
          removeFromCart={removeFromCart}
          onClose={() => setShowCart(false)}
          onCheckout={() => {
            setShowCart(false);
            setShowCheckout(true);
          }}
        />
      )}

      {showWishlist && (
        <WishlistModal
          wishlist={wishlist}
          toggleWishlist={toggleWishlist}
          onAddToCart={(shoe, size) => {
            addToCart(shoe, size);
            setShowCart(true);
          }}
          onClose={() => setShowWishlist(false)}
        />
      )}

      {showCheckout && (
        <Checkout
          cart={cart}
          wallet={wallet}
          onClose={() => setShowCheckout(false)}
          onSubmit={placeOrder}
        />
      )}

      {completed && (
        <Complete
          order={completed}
          onClose={() => setCompleted(null)}
        />
      )}

      {showTopUp && (
        <TopUp
          onClose={() => setShowTopUp(false)}
          onTopUp={amount => {
            addFunds(amount);
            setShowTopUp(false);
          }}
        />
      )}

      {showChat && (
        <Chat
          isAdmin={false}
          messages={messages}
          sendMessage={sendMessage}
          onClose={() => setShowChat(false)}
        />
      )}
    </main>
  );
};

/* ==========================================================
   MAIN DASHBOARD ROUTE EXPORT
   ========================================================== */
const Dashboard = () => {
  const { user } = useAuth();
  const store = useStore();
  const [showChat, setShowChat] = useState(false);

  if (user?.role === 'administrator') {
    return (
      <>
        <Admin {...store} onChat={() => setShowChat(true)} />
        {showChat && (
          <Chat
            isAdmin
            messages={store.messages}
            sendMessage={store.sendMessage}
            onClose={() => setShowChat(false)}
          />
        )}
      </>
    );
  }

  return <Client {...store} />;
};

export default Dashboard;
