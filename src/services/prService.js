import { apiRequest } from "./api";

export async function getPRs(repositoryId) {
  const query = repositoryId ? `?repository_id=${repositoryId}` : "";

  return apiRequest(`/prs${query}`);
}
