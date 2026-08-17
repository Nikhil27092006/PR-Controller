import { apiRequest } from "./api";

export async function getReviewers() {
  return apiRequest("/reviewers/");
}

export async function updateReviewerCapacity(reviewerId, capacity) {
  return apiRequest(`/reviewers/${reviewerId}/capacity`, {
    method: "PUT",
    body: JSON.stringify({ capacity })
  });
}
