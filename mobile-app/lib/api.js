// One helper sends every request to the Finishline API.
// The address comes from EXPO_PUBLIC_API_URL in mobile-app/.env — never from a screen.
// To use another server, change .env and restart `npx expo start`.
export const API_URL = (process.env.EXPO_PUBLIC_API_URL || '').replace(/\/$/, '');

const TIMEOUT_MS = 75000; // a free Render server can take about a minute to wake up

// A 401: the token is missing, expired or invalid. Screens log the user out and open login.
export class AuthError extends Error {}

export async function apiFetch(path, { method = 'GET', token, body } = {}) {
  if (!API_URL) {
    throw new Error('EXPO_PUBLIC_API_URL is not set. Copy mobile-app/.env.example to .env.');
  }

  const headers = {};
  if (body) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal
    });
  } catch {
    throw new Error('Cannot reach the Finishline server. Check your connection and try again.');
  } finally {
    clearTimeout(timer);
  }

  const data = await response.json().catch(() => ({}));
  if (response.status === 401) {
    throw new AuthError(data.error || 'Please log in again.');
  }
  if (!response.ok) {
    const error = new Error(data.error || `Request failed (${response.status})`);
    error.status = response.status;
    error.data = data; // e.g. fallback_picks when the AI is down
    throw error;
  }
  return data;
}

// Shoe pictures: "/images/x.jpg" lives on our backend; https:// addresses are used as they are.
export function imageUrl(path) {
  if (!path) return null;
  return path.startsWith('/') ? `${API_URL}${path}` : path;
}
