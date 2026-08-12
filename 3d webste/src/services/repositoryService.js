import API_BASE_URL from "./api";

export async function getRepositories() {

    const response = await fetch(
        `${API_BASE_URL}/repositories`
    );

    return response.json();
}