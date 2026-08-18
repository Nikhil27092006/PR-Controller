import { apiRequest } from "./api";

export async function getRepositories() {
  return apiRequest("/repositories/");
}

export async function getRepositoryDetail(repositoryId) {
  return apiRequest(`/repositories/${repositoryId}`);
}

export async function syncRepository(repositoryId) {
  return apiRequest(`/repositories/${repositoryId}/sync`, {
    method: "POST"
  });
}

export async function addRepository(owner, name) {
  return apiRequest("/repositories/", {
    method: "POST",
    body: JSON.stringify({ owner, name })
  });
}

export async function deleteRepository(repositoryId) {
  return apiRequest(`/repositories/${repositoryId}`, {
    method: "DELETE"
  });
}

