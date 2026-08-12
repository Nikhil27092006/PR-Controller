import API_BASE_URL from "./api";

export async function getReviewers() {

    const response = await fetch(
        `${API_BASE_URL}/reviewers`
    );

    return response.json();
}