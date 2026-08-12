import API_BASE_URL from "./api";

export async function getDashboard() {

    const response = await fetch(
        `${API_BASE_URL}/dashboard/`
    );

    if (!response.ok) {

        throw new Error(
            "Failed to load dashboard"
        );

    }

    return response.json();
}