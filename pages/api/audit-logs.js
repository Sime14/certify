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

    // Get audit logs for the admin's institution
    const [logs] = await pool.query(
      `
      SELECT 
        al.id,
        al.action,
        al.user_id,
        al.timestamp,
        al.details,
        u.username as user_username,
        u.role as user_role
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE al.user_id IN (
        SELECT u2.id 
        FROM users u2 
        JOIN institutions i ON u2.id = i.admin_id 
        WHERE i.admin_id = ?
      ) OR al.user_id IS NULL
      ORDER BY al.timestamp DESC
      LIMIT 100
    `,
      [decoded.id]
    );

    res.status(200).json({ logs });
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ error: "Invalid token" });
    }
    res.status(500).json({ error: "Server error" });
  }
}
