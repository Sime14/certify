import pool from "../../../../utils/db";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { hash } = req.query;

    if (!hash) {
      return res.status(400).json({ error: "Certificate hash is required" });
    }

    // Get certificate details by hash
    const [certificates] = await pool.query(
      `
      SELECT 
        c.id,
        c.certificate_hash,
        c.title,
        c.description,
        c.issue_date,
        c.expiry_date,
        c.status,
        c.blockchain_tx_hash,
        c.created_at,
        u.username as student_name,
        u.email as student_email,
        u.photo_url as student_photo_url,
        i.name as institution_name
      FROM certificates c
      JOIN users u ON c.student_id = u.id
      JOIN institutions i ON c.institution_id = i.id
      WHERE c.certificate_hash = ?
    `,
      [hash]
    );

    if (certificates.length === 0) {
      return res.status(404).json({ error: "Certificate not found" });
    }

    const certificate = certificates[0];

    // Check if certificate is expired
    let isExpired = false;
    if (certificate.expiry_date) {
      const expiryDate = new Date(certificate.expiry_date);
      const currentDate = new Date();
      isExpired = currentDate > expiryDate;
    }

    // Update status to expired if needed
    if (isExpired && certificate.status === "active") {
      await pool.query(
        "UPDATE certificates SET status = 'expired' WHERE id = ?",
        [certificate.id]
      );
      certificate.status = "expired";
    }

    // Log the verification attempt
    await pool.query(
      `INSERT INTO audit_logs (action, user_id, timestamp, details) 
       VALUES (?, ?, NOW(), ?)`,
      [
        "verify_certificate",
        null, // No specific user for public verification
        `Certificate "${certificate.title}" verified by hash ${hash.substring(
          0,
          8
        )}...`,
      ]
    );

    // Return certificate details (without sensitive information)
    res.status(200).json({
      certificate: {
        id: certificate.id,
        certificate_hash: certificate.certificate_hash,
        title: certificate.title,
        description: certificate.description,
        issue_date: certificate.issue_date,
        expiry_date: certificate.expiry_date,
        status: certificate.status,
        blockchain_tx_hash: certificate.blockchain_tx_hash,
        created_at: certificate.created_at,
        student_name: certificate.student_name,
        student_photo_url: certificate.student_photo_url || null,
        institution_name: certificate.institution_name,
        is_expired: isExpired,
        verification_timestamp: new Date().toISOString(),
      },
      verification: {
        valid: certificate.status === "active" && !isExpired,
        status: certificate.status,
        message:
          certificate.status === "active" && !isExpired
            ? "Certificate is valid and active"
            : certificate.status === "revoked"
            ? "Certificate has been revoked"
            : "Certificate has expired",
      },
    });
  } catch (error) {
    console.error("Error verifying certificate:", error);
    res.status(500).json({ error: "Server error" });
  }
}
