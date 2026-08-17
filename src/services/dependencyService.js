import { apiRequest } from "./api";

export async function analyzeDependencies(prBody) {
  return apiRequest("/dependencies/", {
    method: "POST",
    body: JSON.stringify({ pr_body: prBody })
  });
}

// Returns { nodes, edges } already shaped for reactflow.
export async function getDependencyGraph() {
  return apiRequest("/dependencies/graph");
}
