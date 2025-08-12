import jwt from "jsonwebtoken";
import pool from "../../utils/db";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Verify JWT token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your-secret-key-change-in-production"
    );

    // Check if user is admin
    if (decoded.role !== "admin") {
      return res
        .status(403)
        .json({ error: "Access denied. Admin role required." });
    }

    // Get institution details for the admin
    const [institutions] = await pool.query(
      `
      SELECT 
        i.id,
        i.name,
        i.status,
        i.created_at,
        i.updated_at
      FROM institutions i
      WHERE i.admin_id = ?
    `,
      [decoded.id]
    );

    if (institutions.length === 0) {
      return res.status(404).json({ error: "Institution not found" });
    }

    res.status(200).json({ institution: institutions[0] });
  } catch (error) {
    console.error("Error fetching institution details:", error);
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ error: "Invalid token" });
    }
    res.status(500).json({ error: "Server error" });
  }
}
