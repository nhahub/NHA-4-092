export function readStoredProfile() {
    const savedProfile = localStorage.getItem("rb_profile");

    if (!savedProfile) {
        return {};
    }

    return JSON.parse(savedProfile);
}

export function getProfilePicture(profile) {
    if (profile.gender === "male") {
        return "/icons/man.svg";
    }

    return "/icons/woman.svg";
}