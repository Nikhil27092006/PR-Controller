import { apiRequest } from "./api";

export async function getReviewers() {
  return apiRequest("/reviewers/");
}
