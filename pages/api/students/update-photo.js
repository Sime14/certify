import { IncomingForm } from "formidable";
import fs from "fs";
import path from "path";
import pool from "../../../utils/db";

export const config = {
  api: {
    bodyParser: false,
  },
};

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
    const getString = (v) => (Array.isArray(v) ? v[0] : v || "");
    const studentId = getString(fields.studentId);
    const photo = files.photo;

    if (!studentId || !photo || photo.size === 0) {
      return res.status(400).json({ error: "Missing studentId or photo." });
    }

    // Save new photo
    const photoFilename = `photo-${Date.now()}-${photo.originalFilename}`;
    const photoDest = path.join(form.uploadDir, photoFilename);
    fs.renameSync(photo.filepath, photoDest);
    const photoPath = `/uploads/${photoFilename}`;

    // Update user record
    try {
      const [result] = await pool.query(
        "UPDATE users SET photo_url = ? WHERE username = ? OR id = ?",
        [photoPath, studentId, studentId]
      );
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Student not found." });
      }
      res.status(200).json({ message: "Photo updated successfully.", photo_url: photoPath });
    } catch (err) {
      console.error("DB error:", err);
      res.status(500).json({ error: "Database error." });
    }
  });
}
