import { apiRequest, setToken, clearToken } from "./api";

export async function register(username, email, password) {
  const data = await apiRequest("/auth/register", {
    method: "POST",
    body: JSON.stringify({ username, email, password })
  });

  setToken(data.access_token);

  return data.user;
}

export async function login(email, password) {
  const data = await apiRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password })
  });

  setToken(data.access_token);

  return data.user;
}

export async function getCurrentUser() {
  return apiRequest("/auth/me");
}

export function logout() {
  clearToken();
}
