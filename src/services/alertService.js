import { apiRequest } from "./api";

export async function getAlerts(unreadOnly = false) {
  const query = unreadOnly ? "?unread_only=true" : "";
  return apiRequest(`/alerts${query}`);
}

export async function refreshAlerts() {
  return apiRequest("/alerts/refresh", { method: "POST" });
}

export async function markAlertRead(alertId) {
  return apiRequest(`/alerts/${alertId}/read`, { method: "PUT" });
}

export async function markAllAlertsRead() {
  return apiRequest("/alerts/read-all", { method: "PUT" });
}
