import pool from "../../utils/db";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  try {
    const [certs] = await pool.query(
      `SELECT id, student_id, institution_id, certificate_hash, title, issue_date, status, file_path FROM certificates ORDER BY id DESC`
    );
    res.status(200).json({ certificates: certs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
