import db from "../../../utils/db";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { studentId } = req.body;
  if (!studentId) {
    return res.status(400).json({ error: "Missing studentId" });
  }

  try {
    // Delete certificates for this student
    await db.query("DELETE FROM certificates WHERE student_id = ?", [
      studentId,
    ]);
    // Delete the student user
    await db.query("DELETE FROM users WHERE id = ? AND role = 'student'", [
      studentId,
    ]);
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error deleting student:", error);
    return res.status(500).json({ error: "Failed to delete student" });
  }
}
