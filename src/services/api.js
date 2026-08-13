const API_BASE_URL = "http://localhost:8000";

const TOKEN_STORAGE_KEY = "prflow_token";

export function getToken() {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
}

// Called by AppContext so a 401 anywhere in the app can trigger a
// logout instead of leaving the UI stuck on a failed request.
let onUnauthorized = () => {};

export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

/**
 * Wrapper around fetch that:
 * - Prefixes API_BASE_URL
 * - Attaches the JWT as a Bearer token when present
 * - Sets JSON headers automatically for requests with a body
 * - Throws a readable Error on non-2xx responses
 * - Triggers onUnauthorized() on a 401 (expired/invalid token)
 */
export async function apiRequest(path, options = {}) {
  const token = getToken();

  const headers = {
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers
  };

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers
  });

  if (response.status === 401) {
    clearToken();
    onUnauthorized();
    throw new Error("Session expired. Please log in again.");
  }

  if (!response.ok) {
    let detail = `Request failed (${response.status})`;

    try {
      const body = await response.json();
      detail = body.detail || detail;
    } catch {
      // response wasn't JSON — keep the generic message
    }

    throw new Error(detail);
  }

  // DELETE endpoints may return no content
  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export default API_BASE_URL;
