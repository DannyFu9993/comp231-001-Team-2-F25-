document.addEventListener("DOMContentLoaded", async () => {
    const token = localStorage.getItem("token");
    if (!token) {
        window.location.href = "login.html";
        return;
    }

    // FORM INPUTS
    const fullNameInput = document.getElementById("fullName");
    const phoneInput = document.getElementById("phone");
    const addressInput = document.getElementById("address");
    const avatarUrlInput = document.getElementById("avatarUrl");
    const birthdayInput = document.getElementById("birthday");
    const avatarFileInput = document.getElementById("avatarFile");
    const avatarPreview = document.getElementById("avatarPreview");

    const profileMsg = document.getElementById("profileMsg");
    const passwordMsg = document.getElementById("passwordMsg");

    // ---------- LOAD PROFILE ----------
    try {
        const res = await fetch("/api/profile", {
            headers: { Authorization: `Bearer ${token}` }
        });

        const data = await res.json();

        if (res.ok) {
            fullNameInput.value = data.fullName || "";
            phoneInput.value = data.phone || "";
            addressInput.value = data.address || "";
            avatarUrlInput.value = data.avatar || "";

            if (data.birthday) {
                birthdayInput.value = data.birthday.split("T")[0]; // format YYYY-MM-DD
            }

            if (data.avatar) {
                avatarPreview.src = data.avatar;
            }
        }
    } catch (err) {
        console.error("Failed to load profile:", err);
    }

    // ---------- FILE PREVIEW ----------
    avatarFileInput.addEventListener("change", () => {
        if (avatarFileInput.files.length > 0) {
            const file = avatarFileInput.files[0];
            avatarPreview.src = URL.createObjectURL(file);
        }
    });

    // ---------- SAVE PROFILE ----------
    document.getElementById("profileForm").addEventListener("submit", async (e) => {
        e.preventDefault();

        const formData = new FormData();

        formData.append("fullName", fullNameInput.value);
        formData.append("phone", phoneInput.value);
        formData.append("address", addressInput.value);
        formData.append("avatarUrl", avatarUrlInput.value);
        formData.append("birthday", birthdayInput.value);

        // MUST MATCH multer field name: avatarFile
        if (avatarFileInput.files.length > 0) {
            formData.append("avatarFile", avatarFileInput.files[0]);
        }

        try {
            const res = await fetch("/api/profile", {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,
                    // DO NOT set Content-Type; browser sets boundary automatically
                },
                body: formData
            });

            const data = await res.json();

            if (!res.ok) {
                profileMsg.textContent = data.message || "Server error while updating profile";
                profileMsg.style.color = "red";
                return;
            }

            profileMsg.textContent = "Profile updated successfully!";
            profileMsg.style.color = "green";

        } catch (error) {
            console.error("Profile update error:", error);
            profileMsg.textContent = "Server error.";
            profileMsg.style.color = "red";
        }
    });

    // ---------- CHANGE PASSWORD ----------
    document.getElementById("passwordForm").addEventListener("submit", async (e) => {
        e.preventDefault();
        passwordMsg.textContent = "";

        const oldPassword = document.getElementById("oldPassword").value.trim();
        const newPassword = document.getElementById("newPassword").value.trim();

        if (!oldPassword || !newPassword) {
            passwordMsg.textContent = "Both fields required";
            passwordMsg.style.color = "red";
            return;
        }

        try {
            const res = await fetch("/api/profile/password", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ oldPassword, newPassword })
            });

            const data = await res.json();

            if (!res.ok) {
                passwordMsg.textContent = data.message || "Password change failed";
                passwordMsg.style.color = "red";
                return;
            }

            passwordMsg.textContent = "Password updated successfully!";
            passwordMsg.style.color = "green";

        } catch (err) {
            console.error("Password error:", err);
            passwordMsg.textContent = "Server error";
            passwordMsg.style.color = "red";
        }
    });
});
