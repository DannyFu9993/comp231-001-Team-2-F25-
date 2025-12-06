const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

module.exports = function (pool, verifyToken) {
  const router = express.Router();

  // ============================================================
  // 1️⃣  SETUP UPLOAD DIRECTORY + MULTER FIRST (MUST BE FIRST!)
  // ============================================================

  const uploadDir = path.join(__dirname, "..", "public", "uploads");
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

  const storage = multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, cb) => {
      const safeEmail = req.userEmail.replace(/[^a-z0-9]/gi, "_").toLowerCase();
      cb(null, `${safeEmail}_avatar${path.extname(file.originalname)}`);
    }
  });

  const upload = multer({ storage });

  // ============================================================
  // 2️⃣  GET PROFILE
  // ============================================================

  router.get("/", verifyToken, async (req, res) => {
    try {
      const [rows] = await pool.execute(
        `
        SELECT email, full_name, phone, address, avatar, birthday
        FROM users
        WHERE email = ?
        LIMIT 1
      `,
        [req.userEmail]
      );

      if (!rows.length) {
        return res.status(404).json({ message: "User not found" });
      }

      const u = rows[0];

      res.json({
        email: u.email,
        fullName: u.full_name || "",
        phone: u.phone || "",
        address: u.address || "",
        avatar: u.avatar || "",
        birthday: u.birthday ? u.birthday.toISOString().split("T")[0] : ""
      });
    } catch (err) {
      console.error("Profile GET error:", err);
      res.status(500).json({ message: "Server error while loading profile." });
    }
  });

  // ============================================================
  // 3️⃣  UPDATE PROFILE (TEXT + OPTIONAL FILE)
  // ============================================================

  router.put("/", verifyToken, upload.single("avatarFile"), async (req, res) => {
    try {
      console.log("BODY RECEIVED:", req.body);
      console.log("FILE RECEIVED:", req.file);

      const fullName = req.body.fullName || null;
      const phone = req.body.phone || null;
      const address = req.body.address || null;
      const birthday = req.body.birthday ? new Date(req.body.birthday) : null;

      let avatar = req.body.avatarUrl || null;

      if (req.file) {
        avatar = `/uploads/${req.file.filename}`;
      }

      await pool.execute(
        `
        UPDATE users
        SET
          full_name = ?,
          phone = ?,
          address = ?,
          avatar = COALESCE(?, avatar),
          birthday = ?
        WHERE email = ?
      `,
        [fullName, phone, address, avatar, birthday, req.userEmail]
      );

      res.json({ message: "Profile updated successfully." });
    } catch (err) {
      console.error("Profile UPDATE error:", err);
      res
        .status(500)
        .json({ message: "Server error while updating profile." });
    }
  });

  // ============================================================
  // 4️⃣  CHANGE PASSWORD
  // ============================================================

  router.put("/password", verifyToken, async (req, res) => {
    try {
      const { oldPassword, newPassword } = req.body;

      if (!oldPassword || !newPassword) {
        return res.status(400).json({
          message: "Old password and new password are required."
        });
      }

      const [rows] = await pool.execute(
        "SELECT password FROM users WHERE email = ?",
        [req.userEmail]
      );

      if (!rows.length) {
        return res.status(404).json({ message: "User not found." });
      }

      const currentPassword = rows[0].password;

      if (currentPassword !== oldPassword) {
        return res.status(401).json({ message: "Old password incorrect." });
      }

      await pool.execute(
        "UPDATE users SET password = ? WHERE email = ?",
        [newPassword, req.userEmail]
      );

      res.json({ message: "Password updated." });
    } catch (err) {
      console.error("Password UPDATE error:", err);
      res.status(500).json({ message: "Server error changing password." });
    }
  });

  return router;
};
