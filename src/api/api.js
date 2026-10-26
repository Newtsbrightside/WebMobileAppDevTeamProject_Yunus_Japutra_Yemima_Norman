export const API_ENABLED = Boolean(import.meta.env.VITE_API_URL || import.meta.env.DEV);
const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:3000' : '');

const getAuthHeaders = () => {
  const token = localStorage.getItem('finish_line_token');
  const role = localStorage.getItem('finish_line_role') || 'client';
  const headers = {
    'x-role': role
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

const request = async (path, options = {}) => {
  if (!API_ENABLED) {
    const error = new Error('API server unavailable in static hosting mode.');
    error.status = 503;
    throw error;
  }

  const headers = {
    ...getAuthHeaders(),
    ...(options.headers || {})
  };

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers
  });

  const payload = response.status === 204 ? null : await response.json();
  if (!response.ok) {
    const errorMsg = payload?.error || `API request failed with status ${response.status}`;
    const error = new Error(errorMsg);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }
  return payload;
};

const normalizeProduct = product => ({
  ...product,
  sizes: typeof product.sizes === 'string' ? JSON.parse(product.sizes) : (product.sizes || [8, 9, 10, 11, 12]),
  image: product.image_url || product.image
});

export const api = {
  baseUrl: API_BASE,

  async checkHealth() {
    return request('/api/health');
  },

  // Auth methods
  async login(username, password) {
    return request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
  },

  async register(username, password, role = 'client') {
    return request('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, role })
    });
  },

  async getProfile() {
    return request('/api/auth/me');
  },

  // Catalogue / Shoes methods
  async getProducts(params = {}) {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.category && params.category !== 'All') query.append('category', params.category);
    if (params.sort) query.append('sort', params.sort);

    const queryString = query.toString() ? `?${query.toString()}` : '';
    const shoes = await request(`/api/shoes${queryString}`);
    return shoes.map(normalizeProduct);
  },

  async getShoes(params = {}) {
    return this.getProducts(params);
  },

  async addProduct(product) {
    const created = await request('/api/shoes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product)
    });
    return normalizeProduct(created);
  },

  async updateProduct(id, updates) {
    const updated = await request(`/api/shoes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    return normalizeProduct(updated);
  },

  async updateProductImage(id, image) {
    return this.updateProduct(id, { image_url: image, image });
  },

  async deleteProduct(id) {
    return request(`/api/shoes/${id}`, { method: 'DELETE' });
  },

  // Orders methods
  async getOrders(role) {
    const isClient = role === 'client' || localStorage.getItem('finish_line_role') === 'client';
    // If client, prefer /mine; if admin, get all
    const path = isClient ? '/api/orders/mine' : '/api/orders';
    try {
      return await request(path);
    } catch {
      // Fallback to /api/orders if /mine isn't applicable
      return request('/api/orders');
    }
  },

  async createOrder(customer, items) {
    return request('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer,
        customer_name: customer?.name,
        delivery_address: customer?.address,
        items: items.map(item => ({
          id: item.id || item.shoe_id,
          name: item.name,
          selectedSize: item.selectedSize || item.size || '9',
          quantity: item.quantity || 1,
          price: item.price
        })),
        total: items.reduce((sum, item) => sum + Number(item.price || 0) * (item.quantity || 1), 0)
      })
    });
  },

  async updateOrderStatus(id, status) {
    return request(`/api/orders/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
  },

  // Messages methods
  async getMessages() {
    return request('/api/messages');
  },

  async sendMessage(text, sender = 'client', senderName = 'Client') {
    return request('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        sender_role: sender,
        sender,
        sender_name: senderName
      })
    });
  }
};
