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

    // Check if user is student
    if (decoded.role !== "student") {
      return res
        .status(403)
        .json({ error: "Access denied. Student role required." });
    }

    // Get certificates for the logged-in student with proper field mapping
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
        i.name as institution_name,
        u.username as student_username
      FROM certificates c
      JOIN institutions i ON c.institution_id = i.id
      JOIN users u ON c.student_id = u.id
      WHERE c.student_id = ?
      ORDER BY c.created_at DESC
    `,
      [decoded.id]
    );

    res.status(200).json({ certificates });
  } catch (error) {
    console.error("Error fetching student certificates:", error);
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ error: "Invalid token" });
    }
    res.status(500).json({ error: "Server error" });
  }
}
