import jwt from "jsonwebtoken";
import pool from "../../utils/db";

export default async function handler(req, res) {
  if (req.method !== "POST") {
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

    const { certificateId } = req.body;

    if (!certificateId) {
      return res.status(400).json({ error: "Certificate ID is required" });
    }

    // Verify the certificate belongs to the admin's institution
    const [certificates] = await pool.query(
      `
      SELECT 
        c.id,
        c.certificate_hash,
        c.student_id,
        c.institution_id,
        c.status,
        i.admin_id
      FROM certificates c
      JOIN institutions i ON c.institution_id = i.id
      WHERE c.id = ? AND i.admin_id = ?
    `,
      [certificateId, decoded.id]
    );

    if (certificates.length === 0) {
      return res
        .status(404)
        .json({ error: "Certificate not found or access denied" });
    }

    const certificate = certificates[0];

    if (certificate.status === "revoked") {
      return res.status(400).json({ error: "Certificate is already revoked" });
    }

    // TODO: Call blockchain smart contract to revoke certificate
    // This would typically involve:
    // 1. Connecting to Ethereum network
    // 2. Calling the revokeCertificate function
    // 3. Getting transaction hash
    // For now, we'll simulate this step

    // Update certificate status in database
    await pool.query(
      `
      UPDATE certificates 
      SET status = 'revoked', updated_at = NOW() 
      WHERE id = ?
    `,
      [certificateId]
    );

    // Log the revocation action
    await pool.query(
      `
      INSERT INTO audit_logs (action, user_id, timestamp, details) 
      VALUES (?, ?, NOW(), ?)
    `,
      [
        "revoke_certificate",
        decoded.id,
        `Certificate ${certificate.certificate_hash.substring(
          0,
          8
        )}... revoked by admin ${decoded.username}`,
      ]
    );

    res.status(200).json({
      message: "Certificate revoked successfully",
      certificateId,
      status: "revoked",
    });
  } catch (error) {
    console.error("Error revoking certificate:", error);
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ error: "Invalid token" });
    }
    res.status(500).json({ error: "Server error" });
  }
}
