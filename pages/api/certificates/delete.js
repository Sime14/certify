import db from "../../../utils/db";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  const { certificateId } = req.body;
  if (!certificateId) {
    return res.status(400).json({ error: "Certificate ID is required." });
  }
  try {
    await db.query("DELETE FROM certificates WHERE id = ?", [certificateId]);
    return res
      .status(200)
      .json({ message: "Certificate deleted successfully." });
  } catch (err) {
    console.error("Error deleting certificate:", err);
    return res.status(500).json({ error: "Failed to delete certificate." });
  }
}
