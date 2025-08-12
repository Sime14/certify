import { IncomingForm } from "formidable";
import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import pool from "../../../utils/db";

export const config = {
  api: {
    bodyParser: false,
  },
};

const PLATFORM_DOMAIN = "gctu-system.org";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const form = new IncomingForm();
  form.uploadDir = path.join(process.cwd(), "public", "uploads");
  form.keepExtensions = true;

  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(400).json({ error: "Form parsing error" });
    }
    // Always extract as string (formidable fields can be string or array)
    const getString = (v) => (Array.isArray(v) ? v[0] : v || "");
    const studentName = getString(fields.studentName);
    const studentId = getString(fields.studentId);
    const personalEmail = getString(fields.personalEmail);
    const generatedEmail = getString(fields.generatedEmail);
    const defaultPassword = getString(fields.defaultPassword);
    const issueDate = getString(fields.issueDate);
    const title = getString(fields.title);
    const institutionId = getString(fields.institutionId) || 1;
    const photo = files.photo;
    const certificate = files.certificate;

    // Determine which email and password to use
    const emailToUse = personalEmail || generatedEmail;
    const passwordToUse = getString(fields.password) || defaultPassword;
    if (
      !studentName ||
      !studentId ||
      !emailToUse ||
      !passwordToUse ||
      !certificate ||
      !issueDate ||
      !title
    ) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    // Save photo and certificate files
    let photoPath = null;
    if (photo && photo.size > 0) {
      const photoFilename = `photo-${Date.now()}-${photo.originalFilename}`;
      const photoDest = path.join(form.uploadDir, photoFilename);
      fs.renameSync(photo.filepath, photoDest);
      photoPath = `/uploads/${photoFilename}`;
    }
    let certPath = null;
    if (certificate && certificate.size > 0) {
      const certFilename = `certificate-${Date.now()}-${
        certificate.originalFilename
      }`;
      const certDest = path.join(form.uploadDir, certFilename);
      fs.renameSync(certificate.filepath, certDest);
      certPath = `/uploads/${certFilename}`;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(passwordToUse, 10);
    let newUserId;
    // Create user in DB
    try {
      const [existing] = await pool.query(
        "SELECT * FROM users WHERE username = ? OR email = ?",
        [studentId, emailToUse]
      );
      if (existing.length > 0) {
        return res.status(409).json({ error: "User already exists." });
      }
      const [userResult] = await pool.query(
        "INSERT INTO users (username, password_hash, role, email, photo_url) VALUES (?, ?, 'student', ?, ?)",
        [studentId, hashedPassword, emailToUse, photoPath]
      );
      newUserId = userResult.insertId;
    } catch (err) {
      console.error("DB error:", err);
      return res.status(500).json({ error: "Database error." });
    }

    // Certificate hash, blockchain, and DB update (pseudo, replace with your logic)
    try {
      // Generate a simple hash for demo (replace with real logic)
      const certHash = require("crypto")
        .createHash("sha256")
        .update(certPath + String(Date.now()))
        .digest("hex");
      // Insert certificate record
      const [certResult] = await pool.query(
        `INSERT INTO certificates (student_id, institution_id, certificate_hash, title, issue_date, status, file_path) VALUES (?, ?, ?, ?, ?, 'active', ?)`,
        [newUserId, institutionId, certHash, title, issueDate, certPath]
      );
      if (!certResult.insertId) {
        throw new Error("Certificate insert failed");
      }
    } catch (err) {
      console.error("Certificate DB error:", err);
      return res.status(500).json({ error: "Certificate processing error." });
    }

    return res
      .status(200)
      .json({ message: "Certificate issued and student account created!" });
  });
}
