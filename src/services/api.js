// Use the full backend URL directly to avoid proxy header-forwarding issues.
// In production, set VITE_API_URL to the real API origin.
//
// The fallback must also reject empty strings: `import.meta.env.VITE_API_URL`
// resolves to "" (not undefined) when the variable is declared but blank in
// .env, and `??` only falls back on null/undefined. An empty API_BASE_URL
// would make fetch() treat API paths as relative URLs against the current
// origin (Vite's dev server), which returns index.html for unknown routes
// and breaks every JSON-parsing call site with a "<!DOCTYPE" parse error.
const API_BASE_URL =
  import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL.trim()
    ? import.meta.env.VITE_API_URL
    : "http://localhost:8000";

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
let onUnauthorized = () => { };
let onNetworkError = () => { };

export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

export function setNetworkErrorHandler(handler) {
  onNetworkError = handler;
}

/**
 * Wrapper around fetch that:
 * - Prefixes API_BASE_URL
 * - Attaches the JWT as a Bearer token when present
 * - Sets JSON headers automatically for requests with a body
 * - Throws a readable Error on non-2xx responses
 * - Triggers onUnauthorized() on a 401 (expired/invalid token)
 * - Triggers onNetworkError() on network failure
 */
export async function apiRequest(path, options = {}) {
  const token = getToken();

  console.log(`[apiRequest] ${path} - token from storage:`, token ? token.substring(0, 20) + '...' : 'NO TOKEN')

  const headers = {
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers
  };

  console.log(`[apiRequest] ${path} - sending headers:`, headers)

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
      credentials: "include"
    });
  } catch (err) {
    // Network error (offline, DNS, etc.)
    console.error(`[apiRequest] Network error for ${path}:`, err)
    onNetworkError();
    throw new Error("Network error. Please check your connection.");
  }

  console.log(`[apiRequest] ${path} -> ${response.status} ${response.statusText}`, {
    contentType: response.headers.get('content-type'),
    url: response.url
  });

  if (response.status === 401) {
    clearToken();
    onUnauthorized();
    throw new Error("Session expired. Please log in again.");
  }

  if (!response.ok) {
    let detail = `Request failed (${response.status})`;

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      try {
        const body = await response.json();
        detail = body.detail || detail;
      } catch {
        // response wasn't valid JSON
      }
    } else {
      // Log the actual response for debugging
      const text = await response.text();
      console.error(`[apiRequest] Non-JSON response for ${path}:`, text.substring(0, 500));
      detail = `Server returned ${response.status} (${contentType || 'no content-type'})`;
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
