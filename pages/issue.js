import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";

export default function IssueCertificate() {
  const [user, setUser] = useState(null);
  const [students, setStudents] = useState([]);
  const [formData, setFormData] = useState({
    studentId: "",
    title: "",
    description: "",
    issueDate: new Date().toISOString().split("T")[0],
    expiryDate: "",
    certificateFile: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (!token || !userData) {
      router.push("/login");
      return;
    }

    try {
      const userObj = JSON.parse(userData);
      if (userObj.role !== "admin") {
        router.push("/dashboard");
        return;
      }
      setUser(userObj);
      fetchStudents(token);
    } catch (error) {
      console.error("Error parsing user data:", error);
      router.push("/login");
    }
  }, [router]);

  const fetchStudents = async (token) => {
    try {
      const res = await fetch("/api/students", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStudents(data.students || []);
      }
    } catch (error) {
      console.error("Error fetching students:", error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === "application/pdf") {
      setFormData((prev) => ({
        ...prev,
        certificateFile: file,
      }));
      setError("");
    } else {
      setError("Please select a valid PDF file");
      setFormData((prev) => ({
        ...prev,
        certificateFile: null,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    if (!formData.studentId || !formData.title || !formData.certificateFile) {
      setError(
        "Please fill in all required fields and select a certificate file"
      );
      setIsLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const formDataToSend = new FormData();

      formDataToSend.append("studentId", formData.studentId);
      formDataToSend.append("title", formData.title);
      formDataToSend.append("description", formData.description);
      formDataToSend.append("issueDate", formData.issueDate);
      formDataToSend.append("expiryDate", formData.expiryDate);
      formDataToSend.append("certificateFile", formData.certificateFile);

      const res = await fetch("/api/issue", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formDataToSend,
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(
          "Certificate issued successfully! Hash: " +
            data.certificateHash.substring(0, 16) +
            "..."
        );
        setFormData({
          studentId: "",
          title: "",
          description: "",
          issueDate: new Date().toISOString().split("T")[0],
          expiryDate: "",
          certificateFile: null,
        });
        // Reset file input
        document.getElementById("certificateFile").value = "";
      } else {
        setError(data.error || "Failed to issue certificate");
      }
    } catch (error) {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Issue Certificate - Certificate Verification System</title>
        <meta name="description" content="Issue new academic certificates" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <nav className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <Link
                  href="/dashboard"
                  className="text-indigo-600 hover:text-indigo-500 mr-4"
                >
                  ← Back to Dashboard
                </Link>
                <h1 className="text-xl font-semibold text-gray-900">
                  Issue New Certificate
                </h1>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-700">
                  {user.username} (Institution Admin)
                </span>
              </div>
            </div>
          </div>
        </nav>

        <div className="max-w-3xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Issue Academic Certificate
              </h3>
              <p className="text-gray-600 mb-6">
                Upload a digital certificate file (PDF) for a student. The
                system will generate a unique hash and store it on the
                blockchain for verification.
              </p>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Student Selection */}
                <div>
                  <label
                    htmlFor="studentId"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Student *
                  </label>
                  <select
                    id="studentId"
                    name="studentId"
                    required
                    value={formData.studentId}
                    onChange={handleChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white"
                  >
                    <option value="">Select a student</option>
                    {students.map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.username} ({student.email})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Certificate Title */}
                <div>
                  <label
                    htmlFor="title"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Certificate Title *
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    required
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="e.g., Bachelor of Science in Computer Science"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white placeholder-gray-500"
                  />
                </div>

                {/* Description */}
                <div>
                  <label
                    htmlFor="description"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    rows={3}
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Additional details about the certificate..."
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white placeholder-gray-500"
                  />
                </div>

                {/* Issue Date */}
                <div>
                  <label
                    htmlFor="issueDate"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Issue Date *
                  </label>
                  <input
                    type="date"
                    id="issueDate"
                    name="issueDate"
                    required
                    value={formData.issueDate}
                    onChange={handleChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white"
                  />
                </div>

                {/* Expiry Date */}
                <div>
                  <label
                    htmlFor="expiryDate"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Expiry Date (Optional)
                  </label>
                  <input
                    type="date"
                    id="expiryDate"
                    name="expiryDate"
                    value={formData.expiryDate}
                    onChange={handleChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white"
                  />
                </div>

                {/* Certificate File Upload */}
                <div>
                  <label
                    htmlFor="certificateFile"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Certificate File (PDF) *
                  </label>
                  <input
                    type="file"
                    id="certificateFile"
                    name="certificateFile"
                    accept=".pdf"
                    required
                    onChange={handleFileChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Only PDF files are accepted. Maximum size: 10MB.
                  </p>
                </div>

                {/* Error and Success Messages */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                {success && (
                  <div className="bg-green-50 border border-green-200 rounded-md p-4">
                    <p className="text-sm text-green-600">{success}</p>
                  </div>
                )}

                {/* Submit Button */}
                <div className="flex justify-end space-x-3">
                  <Link
                    href="/dashboard"
                    className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md text-sm font-medium"
                  >
                    Cancel
                  </Link>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-6 py-2 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    {isLoading ? "Issuing..." : "Issue Certificate"}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Information Panel */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-md p-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2">
              How it works:
            </h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Upload the student's certificate PDF file</li>
              <li>• System generates a unique SHA-256 hash of the file</li>
              <li>• Hash is stored on the blockchain for immutability</li>
              <li>• Certificate metadata is saved in the database</li>
              <li>
                • Student can now share their certificate hash for verification
              </li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
