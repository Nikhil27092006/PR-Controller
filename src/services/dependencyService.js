import API_BASE_URL from "./api";

export async function analyzeDependencies(
    prBody
) {

    const response = await fetch(
        `${API_BASE_URL}/dependencies`,
        {
            method: "POST",

            headers: {
                "Content-Type":
                "application/json"
            },

            body: JSON.stringify({
                pr_body: prBody
            })
        }
    );

    return response.json();
}