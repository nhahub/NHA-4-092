function getToken() {
    return localStorage.getItem("rb_token") || localStorage.getItem("token");
}

export const focusService = {
    async getStats() {
        const response = await fetch("/api/focus/stats", {
            headers: {
                Authorization: `Bearer ${getToken()}`,
            },
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Could not load focus stats.");
        }

        return data;
    },

    async saveSession(seconds) {
        const response = await fetch("/api/focus/session", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${getToken()}`,
            },
            body: JSON.stringify({ seconds }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Could not save focus session.");
        }

        return data;
    },
};