import jwt from "jsonwebtoken";
import pool from "../../../utils/db";

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

    // Get admin's institution
    const [institutions] = await pool.query(
      "SELECT id FROM institutions WHERE admin_id = ?",
      [decoded.id]
    );

    if (institutions.length === 0) {
      return res.status(404).json({ error: "Institution not found for admin" });
    }

    const institutionId = institutions[0].id;

    // Get all certificates for the admin's institution
    const [certificates] = await pool.query(
      `
      SELECT 
        c.id,
        c.certificate_hash as hash,
        c.title,
        c.description,
        c.issue_date,
        c.expiry_date,
        c.status,
        c.blockchain_tx_hash,
        c.created_at,
        u.username as student_username,
        u.email as student_email
      FROM certificates c
      JOIN users u ON c.student_id = u.id
      WHERE c.institution_id = ?
      ORDER BY c.created_at DESC
    `,
      [institutionId]
    );

    res.status(200).json({ certificates });
  } catch (error) {
    console.error("Error fetching certificates:", error);
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ error: "Invalid token" });
    }
    res.status(500).json({ error: "Server error" });
  }
}

