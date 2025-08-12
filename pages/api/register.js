import bcrypt from "bcryptjs";
import pool from "../../utils/db";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { username, email, password, role, institutionName } = req.body;

  // Enhanced validation
  if (!username || !email || !password || !role) {
    return res.status(400).json({ error: "All fields are required" });
  }

  if (!["admin", "student", "employer"].includes(role)) {
    return res.status(400).json({ error: "Invalid role" });
  }

  // Validate username length
  if (username.length < 3) {
    return res
      .status(400)
      .json({ error: "Username must be at least 3 characters long" });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: "Invalid email format" });
  }

  // Validate password strength
  if (password.length < 8) {
    return res
      .status(400)
      .json({ error: "Password must be at least 8 characters long" });
  }

  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
  if (!passwordRegex.test(password)) {
    return res
      .status(400)
      .json({
        error:
          "Password must contain at least one lowercase letter, one uppercase letter, and one number",
      });
  }

  // Validate institution name for admins
  if (role === "admin" && (!institutionName || !institutionName.trim())) {
    return res
      .status(400)
      .json({ error: "Institution name is required for admin accounts" });
  }

  try {
    // Check if user already exists
    const [existingUsers] = await pool.query(
      "SELECT * FROM users WHERE username = ? OR email = ?",
      [username, email]
    );

    if (existingUsers.length > 0) {
      return res
        .status(400)
        .json({ error: "Username or email already exists" });
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Insert new user
    const [result] = await pool.query(
      "INSERT INTO users (username, email, password_hash, role, status) VALUES (?, ?, ?, ?, ?)",
      [username, email, passwordHash, role, "active"]
    );

    // If it's an institution admin, create institution record
    if (role === "admin") {
      await pool.query(
        "INSERT INTO institutions (name, admin_id, status) VALUES (?, ?, ?)",
        [institutionName.trim(), result.insertId, "active"]
      );
    }

    // Log registration
    await pool.query(
      "INSERT INTO audit_logs (action, user_id, timestamp, details) VALUES (?, ?, NOW(), ?)",
      [
        "register",
        result.insertId,
        `New ${role} user registered: ${username}${
          role === "admin" ? ` from ${institutionName}` : ""
        }`,
      ]
    );

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: result.insertId,
        username,
        email,
        role,
        status: "active",
        ...(role === "admin" && { institutionName }),
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Server error" });
  }
}
