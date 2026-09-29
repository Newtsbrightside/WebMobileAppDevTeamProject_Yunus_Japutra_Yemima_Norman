import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { ShoppingCart, Heart, Share2, Ruler, CheckCircle2, MapPin, Search, Check } from 'lucide-react';
import confetti from 'canvas-confetti';
import { storeLocations } from '../data/data';
import ProductImage from '../components/ProductImage';

const ClientDashboard = () => {
  const { inventory, addToCart, cart, checkout, wishlist, toggleWishlist } = useStore();
  const [selectedShoe, setSelectedShoe] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [showSizeChart, setShowSizeChart] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Checkout form
  const [checkoutForm, setCheckoutForm] = useState({ name: '', address: '', card: '' });

  const categories = ['All', ...new Set(inventory.map(s => s.category))];
  
  const filteredInventory = inventory.filter(shoe => {
    const matchCategory = activeCategory === 'All' || shoe.category === activeCategory;
    const matchSearch = shoe.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCategory && matchSearch;
  });

  const cartTotal = cart.reduce((sum, item) => sum + item.price, 0);
  const freeShippingThreshold = 200;
  const progressPercent = Math.min((cartTotal / freeShippingThreshold) * 100, 100);

  const playCheckoutSound = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
      oscillator.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.1); // A5
      gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.5, audioCtx.currentTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 0.5);
    } catch {
    }
  };

  const handleAddToCart = () => {
    if (selectedSize && selectedShoe) {
      if (selectedShoe.stock <= 0) {
        alert("Sorry, this item is out of stock.");
        return;
      }
      addToCart(selectedShoe, selectedSize);
      setSelectedShoe(null); 
      setSelectedSize(null);
      setShowCart(true); // Auto open cart
    } else {
      alert("Please select a size first");
    }
  };

  const handleCheckout = (e) => {
    e.preventDefault();
    const order = checkout({ name: checkoutForm.name, address: checkoutForm.address });
    
    if (order) {
      setShowCheckout(false);
      setShowCart(false);
      
      // KidToys style flair
      playCheckoutSound();
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#e53935', '#ffffff', '#b71c1c']
      });
      
      alert(`Order Placed Successfully!\nOrder ID: ${order.id}\nYou can view this in the Admin Orders tab.`);
      setCheckoutForm({ name: '', address: '', card: '' });
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="animate-fade-in">
      
      {/* Search & Categories Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
          {categories.map(cat => (
            <button 
              key={cat} 
              className={`category-btn ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} color="var(--text-secondary)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder="Search shoes..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input"
              style={{ paddingLeft: '2.5rem', width: '250px', borderRadius: '999px' }}
            />
          </div>
          <button className="btn btn-secondary" style={{ borderRadius: '999px', padding: '0.5rem' }} onClick={() => setShowCart(true)}>
            <ShoppingCart size={18} />
            {cart.length > 0 && <span style={{ background: 'var(--primary-color)', color: 'white', borderRadius: '50%', padding: '2px 6px', fontSize: '0.7rem', position: 'absolute', top: '-5px', right: '-5px' }}>{cart.length}</span>}
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-3">
        {filteredInventory.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem 0', color: 'var(--text-secondary)' }}>
            <p>No shoes found matching your criteria.</p>
          </div>
        ) : filteredInventory.map(shoe => {
          const isWished = wishlist.some(w => w.id === shoe.id);
          return (
            <div key={shoe.id} className="card" style={{ padding: 0, overflow: 'hidden', cursor: 'pointer', position: 'relative' }}>
              <div style={{ height: '250px', overflow: 'hidden', position: 'relative' }} onClick={() => setSelectedShoe(shoe)}>
                <img 
                  src={shoe.image}
                  alt={shoe.name} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s', filter: shoe.stock === 0 ? 'grayscale(100%) opacity(0.7)' : 'none' }} 
                  onMouseOver={e => { if (shoe.stock > 0) e.currentTarget.style.transform = 'scale(1.05)' }}
                  onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                />
                {shoe.stock === 0 && (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', color: 'white', fontWeight: 'bold', fontSize: '1.2rem' }}>
                    OUT OF STOCK
                  </div>
                )}
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); toggleWishlist(shoe); }}
                style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'rgba(0,0,0,0.5)', border: 'none', padding: '0.5rem', borderRadius: '50%', backdropFilter: 'blur(4px)', cursor: 'pointer', zIndex: 10, transition: 'all 0.2s' }}
              >
                <Heart size={18} fill={isWished ? 'var(--primary-color)' : 'transparent'} color={isWished ? 'var(--primary-color)' : 'white'} />
              </button>
              
              <div style={{ padding: '1.5rem' }} onClick={() => setSelectedShoe(shoe)}>
                <div style={{ fontSize: '0.85rem', color: 'var(--primary-color)', fontWeight: '600', marginBottom: '0.25rem' }}>{shoe.category}</div>
                <h3 style={{ marginBottom: '0.5rem' }}>{shoe.name}</h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: '700' }}>${shoe.price.toFixed(2)}</div>
                  {shoe.stock > 0 && shoe.stock <= 5 && <span style={{ fontSize: '0.8rem', color: '#e57373' }}>Only {shoe.stock} left!</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Locations Section */}
      <div style={{ marginTop: '5rem', marginBottom: '2rem' }}>
        <h2 style={{ marginBottom: '1.5rem' }}>Our Stores</h2>
        <div className="grid grid-cols-3">
          {storeLocations.map(loc => (
            <div key={loc.id} className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '2rem' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'var(--surface-color-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                <MapPin size={24} color="var(--primary-color)" />
              </div>
              <h3 style={{ marginBottom: '0.5rem' }}>{loc.name}</h3>
              <p style={{ color: 'var(--text-secondary)' }}>{loc.address}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Product Modal */}
      {selectedShoe && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', backdropFilter: 'blur(5px)' }}>
          <div className="card animate-fade-in" style={{ maxWidth: '900px', width: '100%', display: 'flex', padding: 0, overflow: 'hidden', maxHeight: '90vh' }}>
            <div style={{ flex: 1, backgroundColor: '#000', position: 'relative' }}>
                <ProductImage src={selectedShoe.image} alt={selectedShoe.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              {/* Dummy thumbnails to simulate gallery */}
              <div style={{ position: 'absolute', bottom: '1rem', left: '1rem', right: '1rem', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                <div style={{ width: '50px', height: '50px', border: '2px solid white', borderRadius: '4px', overflow: 'hidden' }}><ProductImage src={selectedShoe.image} alt={`${selectedShoe.name} thumbnail`} style={{width: '100%', height: '100%', objectFit: 'cover'}}/></div>
                <div style={{ width: '50px', height: '50px', border: '2px solid transparent', borderRadius: '4px', overflow: 'hidden', opacity: 0.7 }}><ProductImage src={selectedShoe.image} alt={`${selectedShoe.name} thumbnail`} style={{width: '100%', height: '100%', objectFit: 'cover'}}/></div>
              </div>
            </div>
            
            <div style={{ flex: 1, padding: '3rem', overflowY: 'auto', position: 'relative' }}>
              <button onClick={() => { setSelectedShoe(null); setShowSizeChart(false); }} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
              
              <div style={{ color: 'var(--primary-color)', fontWeight: 600, marginBottom: '0.5rem' }}>{selectedShoe.category}</div>
              <h2 style={{ fontSize: '2.5rem', marginBottom: '0.5rem', lineHeight: 1.2 }}>{selectedShoe.name}</h2>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1.5rem' }}>${selectedShoe.price.toFixed(2)}</div>
              
              <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: 1.6 }}>{selectedShoe.description}</p>
              
              <div style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <span style={{ fontWeight: 500 }}>Select Size (US)</span>
                  <button onClick={() => setShowSizeChart(!showSizeChart)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer', textDecoration: 'underline' }}>
                    <Ruler size={14} /> Size Guide
                  </button>
                </div>
                
                {showSizeChart && (
                  <div className="animate-fade-in" style={{ padding: '1rem', background: 'var(--surface-color-light)', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem' }}>
                    <table style={{ width: '100%', textAlign: 'center' }}>
                      <thead><tr><th>US</th><th>UK</th><th>EU</th><th>CM</th></tr></thead>
                      <tbody>
                        <tr><td>8</td><td>7.5</td><td>41</td><td>26</td></tr>
                        <tr><td>9</td><td>8.5</td><td>42.5</td><td>27</td></tr>
                        <tr><td>10</td><td>9.5</td><td>44</td><td>28</td></tr>
                        <tr><td>11</td><td>10.5</td><td>45</td><td>29</td></tr>
                        <tr><td>12</td><td>11.5</td><td>46</td><td>30</td></tr>
                      </tbody>
                    </table>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {selectedShoe.sizes.map(size => (
                    <button 
                      key={size}
                      className={selectedSize === size ? 'btn btn-primary' : 'btn btn-secondary'}
                      style={{ padding: '0.5rem 1rem', flex: '1 0 calc(33.333% - 0.5rem)' }}
                      onClick={() => setSelectedSize(size)}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: 'auto' }}>
                <button 
                  className="btn btn-primary" 
                  style={{ flex: 2, padding: '1rem' }} 
                  onClick={handleAddToCart}
                  disabled={selectedShoe.stock === 0}
                >
                  {selectedShoe.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                </button>
                <button 
                  className="btn btn-secondary" 
                  style={{ flex: 1 }}
                  onClick={() => toggleWishlist(selectedShoe)}
                >
                  <Heart size={20} fill={wishlist.some(w => w.id === selectedShoe.id) ? 'var(--text-primary)' : 'transparent'} />
                </button>
                <button 
                  className="btn btn-secondary" 
                  style={{ flex: 1 }}
                  onClick={handleCopyLink}
                >
                  {copied ? <Check size={20} color="var(--success-color)" /> : <Share2 size={20} />}
                </button>
              </div>
              
              <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
                <CheckCircle2 size={12} style={{ display: 'inline', marginRight: '4px' }}/> Guaranteed Authentic & Child-Safe Materials (ASTM/EN71)
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Slide-out Cart Drawer */}
      {showCart && (
        <div className="drawer-overlay" onClick={() => setShowCart(false)}>
          <div className="drawer" onClick={e => e.stopPropagation()}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><ShoppingCart size={20} /> Your Bag</h2>
              <button onClick={() => setShowCart(false)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
            </div>
            
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', background: 'var(--surface-color-light)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                <span>Free Express Shipping</span>
                <span>{progressPercent >= 100 ? 'Unlocked!' : `$${(freeShippingThreshold - cartTotal).toFixed(2)} away`}</span>
              </div>
              <div style={{ height: '6px', background: 'var(--border-color)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${progressPercent}%`, height: '100%', background: progressPercent >= 100 ? 'var(--success-color)' : 'var(--primary-color)', transition: 'width 0.3s' }}></div>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
              {cart.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: '2rem' }}>Your bag is empty.</div>
              ) : (
                <div className="grid" style={{ gap: '1rem' }}>
                  {cart.map((item) => (
                    <div key={item.cartId} style={{ display: 'flex', gap: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
                      <ProductImage src={item.image} alt={item.name} style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px' }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600 }}>{item.name}</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Size: {item.selectedSize}</div>
                        <div style={{ fontWeight: 700, marginTop: '0.25rem' }}>${item.price.toFixed(2)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {cart.length > 0 && (
              <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border-color)', background: 'var(--surface-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontSize: '1.2rem', fontWeight: 700 }}>
                  <span>Subtotal</span>
                  <span>${cartTotal.toFixed(2)}</span>
                </div>
                <button className="btn btn-primary" style={{ width: '100%', padding: '1rem' }} onClick={() => { setShowCart(false); setShowCheckout(true); }}>
                  Proceed to Checkout
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {showCheckout && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', backdropFilter: 'blur(5px)' }}>
          <div className="card animate-fade-in" style={{ maxWidth: '500px', width: '100%', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3>Secure Checkout</h3>
              <button onClick={() => setShowCheckout(false)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
            </div>
            
            <form onSubmit={handleCheckout}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input type="text" className="form-input" required placeholder="John Doe" value={checkoutForm.name} onChange={e => setCheckoutForm({...checkoutForm, name: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Shipping Address</label>
                <input type="text" className="form-input" required placeholder="123 Street Name" value={checkoutForm.address} onChange={e => setCheckoutForm({...checkoutForm, address: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Credit Card</label>
                <input type="text" className="form-input" required placeholder="XXXX-XXXX-XXXX-XXXX" value={checkoutForm.card} onChange={e => setCheckoutForm({...checkoutForm, card: e.target.value})} />
              </div>

              <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: 'var(--surface-color-light)', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontWeight: 600 }}>
                  <span>Total Items:</span>
                  <span>{cart.length}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 700, color: 'var(--primary-color)' }}>
                  <span>Total Price:</span>
                  <span>${cartTotal.toFixed(2)}</span>
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                <CheckCircle2 size={18} /> Pay & Complete Order
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default ClientDashboard;
