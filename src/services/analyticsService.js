import { apiRequest } from "./api";

export async function getEngineeringAnalytics(range = "6W", repositoryId) {
  const params = new URLSearchParams({ range });
  if (repositoryId) params.set("repository_id", repositoryId);

  return apiRequest(`/analytics/engineering?${params.toString()}`);
}
