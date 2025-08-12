import pool from "../../utils/db";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Check users table
    const [users] = await pool.query(
      "SELECT id, username, email, role FROM users"
    );

    // Check institutions table
    const [institutions] = await pool.query(
      "SELECT id, name, admin_id FROM institutions"
    );

    // Check certificates table
    const [certificates] = await pool.query(
      "SELECT id, title, student_id, institution_id, status FROM certificates"
    );

    // Check audit_logs table
    const [auditLogs] = await pool.query(
      "SELECT id, action, user_id, details FROM audit_logs LIMIT 5"
    );

    res.status(200).json({
      users,
      institutions,
      certificates,
      auditLogs,
      message: "Database test completed",
    });
  } catch (error) {
    console.error("Database test error:", error);
    res
      .status(500)
      .json({ error: "Database test failed", details: error.message });
  }
}

