export const API_ENABLED = Boolean(import.meta.env.VITE_API_URL || import.meta.env.DEV);
const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:3001' : '');

const request = async (path, options = {}) => {
  if (!API_ENABLED) throw new Error('API disabled in production demo mode.');
  const response = await fetch(`${API_BASE}${path}`, options);
  const payload = response.status === 204 ? null : await response.json();
  if (!response.ok) throw new Error(payload?.error || 'API request failed.');
  return payload;
};

const headersFor = role => ({ 'x-role': role || 'client' });

const normalizeProduct = product => ({
  ...product,
  image: product.image?.startsWith('/uploads/') || product.image?.startsWith('/seed/')
    ? `${API_BASE}${product.image}`
    : product.image
});

export const api = {
  baseUrl: API_BASE,
  async getProducts() {
    return (await request('/api/products')).map(normalizeProduct);
  },
  async getOrders(role) {
    return request('/api/orders', { headers: headersFor(role) });
  },
  async addProduct(product, role) {
    return normalizeProduct(await request('/api/products', {
      method: 'POST',
      headers: { ...headersFor(role), 'Content-Type': 'application/json' },
      body: JSON.stringify(product)
    }));
  },
  async updateProduct(id, updates, role) {
    return normalizeProduct(await request(`/api/products/${id}`, {
      method: 'PUT',
      headers: { ...headersFor(role), 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    }));
  },
  async updateProductImage(id, image, role) {
    if (image instanceof File) {
      const formData = new FormData();
      formData.append('image', image);
      return normalizeProduct(await request(`/api/products/${id}/image`, {
        method: 'PUT',
        headers: headersFor(role),
        body: formData
      }));
    }

    return normalizeProduct(await request(`/api/products/${id}`, {
      method: 'PUT',
      headers: { ...headersFor(role), 'Content-Type': 'application/json' },
      body: JSON.stringify({ image })
    }));
  },
  async deleteProduct(id, role) {
    return request(`/api/products/${id}`, { method: 'DELETE', headers: headersFor(role) });
  },
  async updateOrderStatus(id, status, role) {
    return request(`/api/orders/${id}`, {
      method: 'PUT',
      headers: { ...headersFor(role), 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
  },
  async createOrder(customer, items, role) {
    return request('/api/orders', {
      method: 'POST',
      headers: { ...headersFor(role), 'Content-Type': 'application/json' },
      body: JSON.stringify({ customer, items: items.map(item => ({ id: item.id, quantity: 1 })) })
    });
  }
};
