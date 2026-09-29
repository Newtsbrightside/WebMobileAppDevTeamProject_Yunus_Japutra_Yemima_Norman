import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import ProductImage from '../components/ProductImage';
import { Plus, Trash2, Package, Filter } from 'lucide-react';

const AdminDashboard = () => {
  const { inventory, addShoe, updateShoe, deleteShoe, orders, updateOrderStatus } = useStore();
  const [activeTab, setActiveTab] = useState('inventory');
  
  // Inventory state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newShoe, setNewShoe] = useState({ name: '', price: '', category: '', stock: '' });
  const [sortBy, setSortBy] = useState('name');

  const handleAddSubmit = (e) => {
    e.preventDefault();
    addShoe({
      ...newShoe,
      price: parseFloat(newShoe.price),
      stock: parseInt(newShoe.stock),
      image: 'sneaker_casual_white.jpg', 
      sizes: [9, 10, 11]
    });
    setNewShoe({ name: '', price: '', category: '', stock: '' });
    setShowAddForm(false);
  };

  const sortedInventory = [...inventory].sort((a, b) => {
    if (sortBy === 'price') return b.price - a.price;
    if (sortBy === 'stock') return a.stock - b.stock; // lowest stock first
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2>Admin Dashboard</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Manage your inventory and fulfill orders.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            className={`btn ${activeTab === 'inventory' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('inventory')}
          >
            Inventory
          </button>
          <button 
            className={`btn ${activeTab === 'orders' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('orders')}
          >
            Orders ({orders.filter(o => o.status === 'Pending').length})
          </button>
        </div>
      </div>

      {activeTab === 'inventory' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <Filter size={18} color="var(--text-secondary)" />
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                style={{ padding: '0.5rem', borderRadius: '8px', background: 'var(--surface-color)', color: 'white', border: '1px solid var(--border-color)' }}
              >
                <option value="name">Sort by Name</option>
                <option value="price">Sort by Price (High to Low)</option>
                <option value="stock">Sort by Stock (Low to High)</option>
              </select>
            </div>
            <button className="btn btn-primary" onClick={() => setShowAddForm(!showAddForm)}>
              <Plus size={18} /> Add New Shoe
            </button>
          </div>

          {showAddForm && (
            <div className="card animate-fade-in" style={{ marginBottom: '2rem', borderLeft: '4px solid var(--primary-color)' }}>
              <h3 style={{ marginBottom: '1rem' }}>Add Product</h3>
              <form onSubmit={handleAddSubmit} className="grid grid-cols-2">
                <div className="form-group">
                  <label className="form-label">Name</label>
                  <input type="text" className="form-input" required value={newShoe.name} onChange={e => setNewShoe({...newShoe, name: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <input type="text" className="form-input" required value={newShoe.category} onChange={e => setNewShoe({...newShoe, category: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Price ($)</label>
                  <input type="number" step="0.01" className="form-input" required value={newShoe.price} onChange={e => setNewShoe({...newShoe, price: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Initial Stock</label>
                  <input type="number" className="form-input" required value={newShoe.stock} onChange={e => setNewShoe({...newShoe, stock: e.target.value})} />
                </div>
                <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowAddForm(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Save Product</button>
                </div>
              </form>
            </div>
          )}

          <div className="card" style={{ padding: 0, overflow: 'x-auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--surface-color-light)', borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '1rem' }}>Product</th>
                  <th style={{ padding: '1rem' }}>Category</th>
                  <th style={{ padding: '1rem' }}>Price (Edit)</th>
                  <th style={{ padding: '1rem' }}>Stock (Edit)</th>
                  <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedInventory.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                      <Package size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                      <p>No inventory found. Add some shoes.</p>
                    </td>
                  </tr>
                ) : sortedInventory.map(shoe => (
                  <tr key={shoe.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <ProductImage src={shoe.image} alt={shoe.name} style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '8px' }} />
                      <div>
                        <div style={{ fontWeight: '500' }}>{shoe.name}</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>ID: {shoe.id}</div>
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>{shoe.category}</td>
                    <td style={{ padding: '1rem' }}>
                      <input 
                        type="number" 
                        value={shoe.price}
                        onChange={(e) => updateShoe(shoe.id, { price: parseFloat(e.target.value) || 0 })}
                        style={{ width: '80px', padding: '0.4rem', background: 'var(--bg-color)', color: 'white', border: '1px solid var(--border-color)', borderRadius: '4px' }}
                      />
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <input 
                          type="number" 
                          value={shoe.stock}
                          onChange={(e) => updateShoe(shoe.id, { stock: parseInt(e.target.value) || 0 })}
                          style={{ width: '70px', padding: '0.4rem', background: 'var(--bg-color)', color: 'white', border: '1px solid var(--border-color)', borderRadius: '4px' }}
                        />
                        {shoe.stock <= 5 && <span style={{ color: '#e57373', fontSize: '0.8rem' }}>Low</span>}
                      </div>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      <button onClick={() => deleteShoe(shoe.id)} style={{ background: 'none', border: 'none', color: '#e57373', cursor: 'pointer', padding: '0.5rem' }}>
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {activeTab === 'orders' && (
        <div className="card animate-fade-in" style={{ padding: 0, overflow: 'x-auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--surface-color-light)', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '1rem' }}>Order ID</th>
                <th style={{ padding: '1rem' }}>Date</th>
                <th style={{ padding: '1rem' }}>Customer</th>
                <th style={{ padding: '1rem' }}>Items</th>
                <th style={{ padding: '1rem' }}>Total</th>
                <th style={{ padding: '1rem' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    <p>No orders yet.</p>
                  </td>
                </tr>
              ) : [...orders].reverse().map(order => (
                <tr key={order.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '1rem', fontWeight: 500 }}>{order.id}</td>
                  <td style={{ padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    {new Date(order.date).toLocaleDateString()} {new Date(order.date).toLocaleTimeString()}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div>{order.customer.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{order.customer.address}</div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.9rem' }}>
                      {order.items.map((item, idx) => (
                        <li key={idx}>{item.name} (Size {item.selectedSize})</li>
                      ))}
                    </ul>
                  </td>
                  <td style={{ padding: '1rem', fontWeight: 600, color: 'var(--primary-color)' }}>
                    ${order.total.toFixed(2)}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <select 
                      value={order.status}
                      onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                      style={{ 
                        padding: '0.4rem', 
                        borderRadius: '4px',
                        border: 'none',
                        backgroundColor: order.status === 'Pending' ? 'rgba(255, 167, 38, 0.2)' : 
                                       order.status === 'Shipped' ? 'rgba(66, 165, 245, 0.2)' : 
                                       'rgba(102, 187, 106, 0.2)',
                        color: order.status === 'Pending' ? '#ffa726' : 
                               order.status === 'Shipped' ? '#42a5f5' : 
                               '#66bb6a',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      <option value="Pending" style={{ color: 'black' }}>Pending</option>
                      <option value="Shipped" style={{ color: 'black' }}>Shipped</option>
                      <option value="Delivered" style={{ color: 'black' }}>Delivered</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
