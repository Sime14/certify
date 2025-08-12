import { useState, useRef } from "react";

const DEFAULT_PASSWORD = "ChangeMe123";

export default function IssueCertificateForm({ institutionId }) {
  const [studentName, setStudentName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [personalEmail, setPersonalEmail] = useState("");
  const [photo, setPhoto] = useState(null);
  const [certificate, setCertificate] = useState(null);
  const [issueDate, setIssueDate] = useState("");
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const photoInput = useRef();
  const certInput = useRef();

  const handlePhotoChange = (e) => {
    setPhoto(e.target.files[0]);
  };
  const handleCertChange = (e) => {
    setCertificate(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess("");
    setError("");
    try {
      const formData = new FormData();
      formData.append("studentName", studentName);
      formData.append("studentId", studentId);
      formData.append("personalEmail", personalEmail);
      formData.append("defaultPassword", DEFAULT_PASSWORD);
      formData.append("photo", photo);
      formData.append("certificate", certificate);
      formData.append("issueDate", issueDate);
      formData.append("title", title);
      if (institutionId) {
        formData.append("institutionId", institutionId);
      }

      const res = await fetch("/api/certificates/issue", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(
          data.message || "Certificate issued and student account created!"
        );
        setStudentName("");
        setStudentId("");
        setPersonalEmail("");
        setPhoto(null);
        setCertificate(null);
        setIssueDate("");
        setTitle("");
        if (photoInput.current) photoInput.current.value = "";
        if (certInput.current) certInput.current.value = "";
      } else {
        setError(data.error || "Failed to issue certificate.");
      }
    } catch (err) {
      setError("Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-8 max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-lg border border-gray-200"
    >
      {/* Student Info Section */}
      <div className="bg-white border border-gray-100 rounded-lg p-6 mb-4 shadow-sm">
        <h4 className="text-lg font-semibold text-indigo-800 mb-4">
          Student Information
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block font-bold text-gray-900 mb-1">
              Student Name
            </label>
            <input
              type="text"
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 placeholder-gray-400 bg-white"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              required
              placeholder="e.g. Aisha Bello"
            />
          </div>
          <div>
            <label className="block font-bold text-gray-900 mb-1">
              Student ID
            </label>
            <input
              type="text"
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 placeholder-gray-400 bg-white"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              required
              placeholder="e.g. GCTU-2023-001"
            />
          </div>
          <div>
            <label className="block font-bold text-gray-900 mb-1">Email</label>
            <input
              type="email"
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 placeholder-gray-400 bg-white"
              value={personalEmail}
              onChange={(e) => setPersonalEmail(e.target.value)}
              required
              placeholder="e.g. aisha@gmail.com"
            />
          </div>
          <div>
            <label className="block font-bold text-gray-900 mb-1">
              Default Password
            </label>
            <input
              type="text"
              className="mt-1 block w-full border-gray-200 rounded-md bg-gray-100 text-gray-900 cursor-not-allowed"
              value={DEFAULT_PASSWORD}
              readOnly
            />
          </div>
          <div>
            <label className="block font-bold text-gray-900 mb-1">
              Add Photo
            </label>
            <input
              type="file"
              accept="image/*"
              className="mt-1 block w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white"
              onChange={handlePhotoChange}
              ref={photoInput}
            />
          </div>
        </div>
      </div>
      {/* Certificate Info Section */}
      <div className="bg-white border border-gray-100 rounded-lg p-6 mb-4 shadow-sm">
        <h4 className="text-lg font-semibold text-indigo-800 mb-4">
          Certificate Information
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block font-bold text-gray-900 mb-1">
              Certificate Title
            </label>
            <input
              type="text"
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 placeholder-gray-400 bg-white"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="e.g. BSc Computer Science"
            />
          </div>
          <div>
            <label className="block font-bold text-gray-900 mb-1">
              Certificate PDF
            </label>
            <input
              type="file"
              accept="application/pdf"
              className="mt-1 block w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white"
              onChange={handleCertChange}
              ref={certInput}
              required
            />
          </div>
          <div>
            <label className="block font-bold text-gray-900 mb-1">
              Issue Date
            </label>
            <input
              type="date"
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white"
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
              required
            />
          </div>
        </div>
      </div>
      <div className="flex justify-end">
        <button
          type="submit"
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-md text-base font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          disabled={loading}
        >
          {loading ? "Processing..." : "Issue Certificate & Create Student"}
        </button>
      </div>
      {success && (
        <p className="text-green-600 mt-4 text-center font-medium">{success}</p>
      )}
      {error && (
        <p className="text-red-600 mt-4 text-center font-medium">{error}</p>
      )}
    </form>
  );
}
