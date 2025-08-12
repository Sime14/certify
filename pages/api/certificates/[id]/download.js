import jwt from "jsonwebtoken";
import pool from "../../../../utils/db";
import fs from "fs/promises";
import path from "path";

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

    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ error: "Certificate ID is required" });
    }

    // Get certificate details and verify ownership
    const [certificates] = await pool.query(
      `
      SELECT 
        c.id,
        c.certificate_hash,
        c.title,
        c.issue_date,
        c.file_path,
        c.student_id,
        c.institution_id,
        u.username as student_username
      FROM certificates c
      JOIN users u ON c.student_id = u.id
      WHERE c.id = ? AND c.student_id = ?
    `,
      [id, decoded.id]
    );

    if (certificates.length === 0) {
      return res
        .status(404)
        .json({ error: "Certificate not found or access denied" });
    }

    const certificate = certificates[0];

    // Check if certificate file exists
    if (!certificate.file_path) {
      return res.status(404).json({ error: "Certificate file not found" });
    }

    // Construct file path
    const filePath = path.join(process.cwd(), "public", certificate.file_path);

    try {
      // Check if file exists
      await fs.access(filePath);
    } catch (error) {
      return res.status(404).json({ error: "Certificate file not accessible" });
    }

    // Read file
    const fileBuffer = await fs.readFile(filePath);

    // Set response headers for file download
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${certificate.title || "certificate"}-${
        certificate.issue_date
      }.pdf"`
    );
    res.setHeader("Content-Length", fileBuffer.length);

    // Log the download action
    await pool.query(
      `INSERT INTO audit_logs (action, user_id, timestamp, details) 
       VALUES (?, ?, NOW(), ?)`,
      [
        "download_certificate",
        decoded.id,
        `Certificate "${certificate.title}" downloaded by student ${certificate.student_username}`,
      ]
    );

    // Send the file
    res.status(200).send(fileBuffer);
  } catch (error) {
    console.error("Error downloading certificate:", error);
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ error: "Invalid token" });
    }
    res.status(500).json({ error: "Server error" });
  }
}






