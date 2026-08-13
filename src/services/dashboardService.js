import { apiRequest } from "./api";

export async function getDashboard() {
  return apiRequest("/dashboard/");
}
