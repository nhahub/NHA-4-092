function getToken() {
    return localStorage.getItem("rb_token") || localStorage.getItem("token");
}

async function readResponse(response) {
    const text = await response.text();

    if (!text) {
        return {};
    }

    return JSON.parse(text);
}

export const achievementService = {
    async getUnlockedIds() {
        const response = await fetch("/api/achievements", {
            headers: {
                Authorization: `Bearer ${getToken()}`,
            },
        });

        const data = await readResponse(response);

        if (!response.ok) {
            throw new Error(data.error || "Could not load achievements.");
        }

        return data.unlockedIds || [];
    },

    async unlockAchievements(achievementIds) {
        const response = await fetch("/api/achievements/unlock", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${getToken()}`,
            },
            body: JSON.stringify({ achievementIds }),
        });

        const data = await readResponse(response);

        if (!response.ok) {
            throw new Error(data.error || "Could not unlock achievements.");
        }

        return data.unlockedIds || [];
    },
};