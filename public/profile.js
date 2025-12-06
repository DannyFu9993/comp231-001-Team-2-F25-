document.addEventListener("DOMContentLoaded", async () => {
    const token = localStorage.getItem("token");
    if (!token) {
        window.location.href = "login.html";
        return;
    }

    const avatarImg = document.getElementById("profileAvatar");
    const emailField = document.getElementById("profileEmail");
    const fullNameField = document.getElementById("profileName");
    const phoneField = document.getElementById("profilePhone");
    const addressField = document.getElementById("profileAddress");
    const birthdayField = document.getElementById("profileBirthday");

    try {
        const res = await fetch("/api/profile", {
            headers: { Authorization: `Bearer ${token}` }
        });

        const data = await res.json();

        if (!res.ok) {
            console.error("Profile fetch failed:", data);
            return;
        }

        emailField.textContent = data.email || "";
        fullNameField.textContent = data.fullName || "";
        phoneField.textContent = data.phone || "";
        addressField.textContent = data.address || "";

        birthdayField.textContent = data.birthday
            ? data.birthday.split("T")[0]
            : "";

        if (data.avatar) {
            avatarImg.src = data.avatar;
        }
    } catch (err) {
        console.error("Profile load error:", err);
    }
});
