// Every request from the web app to the Finishline API goes through this file.
//
// The API address comes from VITE_API_URL. Vite copies it into the JavaScript at BUILD
// time, so after changing it the site must be built and deployed again.
// Without VITE_API_URL, `npm run dev` uses http://localhost:3000 and a production build
// runs the old offline demo (localStorage only).
const configuredUrl = import.meta.env.VITE_API_URL;

export const API_ENABLED = Boolean(configuredUrl || import.meta.env.DEV);
export const API_BASE = (configuredUrl || (import.meta.env.DEV ? 'http://localhost:3000' : '')).replace(/\/$/, '');

const TOKEN_KEY = 'finish_line_token';
export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = token => {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
};

// "/images/x.jpg" is served by the backend; full https:// addresses are used as they are.
export const resolveImage = url => (url && url.startsWith('/') ? `${API_BASE}${url}` : url || null);

const request = async (path, { method = 'GET', body } = {}) => {
  if (!API_ENABLED) {
    const error = new Error('No API configured: this build runs in offline demo mode.');
    error.status = 503;
    throw error;
  }

  const token = getToken();
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined
    });
  } catch {
    const error = new Error('Cannot reach the Finishline server. A free server may need a minute to wake up — please try again.');
    error.status = 0;
    throw error;
  }

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(payload?.error || `Request failed with status ${response.status}`);
    error.status = response.status;
    error.payload = payload;
    // A 401 while logged in means the token expired: AuthContext logs the user out.
    if (response.status === 401 && token) {
      window.dispatchEvent(new Event('finishline:session-expired'));
    }
    throw error;
  }
  return payload;
};

const normalizeProduct = product => ({
  ...product,
  sizes: Array.isArray(product.sizes) ? product.sizes : [8, 9, 10, 11, 12],
  colors: product.colors || ['Standard'],
  image: resolveImage(product.image_url || product.image)
});

const normalizeOrder = order => ({
  ...order,
  items: (order.items || []).map(item => ({ ...item, image: resolveImage(item.image) }))
});

const normalizePick = pick => ({ ...pick, shoe: normalizeProduct(pick.shoe) });

export const api = {
  baseUrl: API_BASE,

  checkHealth: () => request('/api/health'),

  // Auth
  login: (username, password) => request('/api/auth/login', { method: 'POST', body: { username, password } }),
  register: (username, password) => request('/api/auth/register', { method: 'POST', body: { username, password } }),
  getMe: () => request('/api/auth/me'),
  saveMySizes: (leftSize, rightSize) =>
    request('/api/auth/me/sizes', { method: 'PUT', body: { left_size: leftSize, right_size: rightSize } }),

  // Shoes
  async getProducts() {
    const shoes = await request('/api/shoes');
    return shoes.map(normalizeProduct);
  },
  async addProduct(product) {
    return normalizeProduct(await request('/api/shoes', { method: 'POST', body: product }));
  },
  async updateProduct(id, updates) {
    return normalizeProduct(await request(`/api/shoes/${id}`, { method: 'PUT', body: updates }));
  },
  deleteProduct: id => request(`/api/shoes/${id}`, { method: 'DELETE' }),

  // Orders: administrators see every order, clients only their own (decided by the server).
  async getOrders(isAdmin) {
    const orders = await request(isAdmin ? '/api/orders' : '/api/orders/mine');
    return orders.map(normalizeOrder);
  },
  async createOrder(customer, cartItems) {
    const order = await request('/api/orders', {
      method: 'POST',
      body: {
        customer: { name: customer.name, address: customer.address },
        // One bag line = one pair. Prices are NOT sent: the server reads them from the database.
        items: cartItems.map(item => ({
          id: item.id,
          quantity: 1,
          left_size: item.leftSize ?? item.selectedSize,
          right_size: item.rightSize ?? item.selectedSize
        }))
      }
    });
    return normalizeOrder(order);
  },
  async updateOrderStatus(id, status) {
    return normalizeOrder(await request(`/api/orders/${id}/status`, { method: 'PUT', body: { status } }));
  },

  // Support chat
  getMessages: () => request('/api/messages'),
  sendMessage: text => request('/api/messages', { method: 'POST', body: { text } }),

  // AI Fit Advisor. On a 503 the error's payload has `fallback_picks` (not AI-written).
  async getFitAdvice(input) {
    try {
      const advice = await request('/api/ai/fit-advice', { method: 'POST', body: input });
      return { ...advice, picks: advice.picks.map(normalizePick) };
    } catch (error) {
      if (error.payload?.fallback_picks) {
        error.payload.fallback_picks = error.payload.fallback_picks.map(normalizePick);
      }
      throw error;
    }
  }
};
