// services/prService.js

import API_BASE_URL from "./api";

export async function getPRs() {

    const response =
        await fetch(
            `${API_BASE_URL}/prs`
        );

    return response.json();
}