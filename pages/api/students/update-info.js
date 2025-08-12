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
    const username = getString(fields.username);
    const email = getString(fields.email);
  const photo = Array.isArray(files.photo) ? files.photo[0] : files.photo;

    if (!studentId || !username || !email) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    let photoPath = null;
    console.log('Received photo:', photo);
    if (photo && photo.size > 0) {
      const photoFilename = `photo-${Date.now()}-${photo.originalFilename}`;
      const photoDest = path.join(form.uploadDir, photoFilename);
      fs.renameSync(photo.filepath, photoDest);
      photoPath = `/uploads/${photoFilename}`;
      console.log('Saved photo to:', photoPath);
    }

    try {
      let query = "UPDATE users SET username = ?, email = ?";
      let params = [username, email];
      if (photoPath) {
        query += ", photo_url = ?";
        params.push(photoPath);
      }
      query += " WHERE id = ?";
      params.push(studentId);
      const [result] = await pool.query(query, params);
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Student not found." });
      }
      res.status(200).json({ message: "Student info updated successfully." });
    } catch (err) {
      console.error("DB error:", err);
      res.status(500).json({ error: "Database error." });
    }
  });
}
