import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import IssueCertificateForm from "./IssueCertificateForm";

export default function Dashboard() {
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editStudent, setEditStudent] = useState(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhoto, setEditPhoto] = useState(null);
  const editPhotoInput = useRef();
  const openEditModal = (student) => {
    setEditStudent(student);
    setEditName(student.username);
    setEditEmail(student.email);
    setEditPhoto(null);
    setEditModalOpen(true);
  };

  const closeEditModal = () => {
    setEditModalOpen(false);
    setEditStudent(null);
    setEditName("");
    setEditEmail("");
    setEditPhoto(null);
    if (editPhotoInput.current) editPhotoInput.current.value = "";
  };

  const handleEditPhotoChange = (e) => {
    setEditPhoto(e.target.files[0]);
  };

  const handleEditStudentSubmit = async (e) => {
    e.preventDefault();
    if (!editStudent) return;
    const formData = new FormData();
    formData.append("studentId", editStudent.id);
    formData.append("username", editName);
    formData.append("email", editEmail);
    if (editPhoto) formData.append("photo", editPhoto);
    try {
      const res = await fetch("/api/students/update-info", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        alert("Student info updated successfully.");
        closeEditModal();
        const token = localStorage.getItem("token");
        fetchAllStudents(token);
      } else {
        alert(data.error || "Failed to update student info.");
      }
    } catch (err) {
      alert("Server error. Please try again.");
    }
  };
  const [user, setUser] = useState(null);
  const [certificates, setCertificates] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [institution, setInstitution] = useState(null);
  const [students, setStudents] = useState([]); // Add state for students
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (!token || !userData) {
      router.push("/");
      return;
    }

    try {
      const userObj = JSON.parse(userData);
      setUser(userObj);

      if (userObj.role === "student") {
        fetchStudentCertificates(token);
      } else if (userObj.role === "admin") {
        fetchAllCertificates(token);
        fetchAuditLogs(token);
        fetchInstitutionDetails(token);
        fetchAllStudents(token); // Fetch students for admin
      } else if (userObj.role === "employer") {
        fetchVerificationHistory(token);
      }
    } catch (error) {
      console.error("Error parsing user data:", error);
      router.push("/");
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  const fetchStudentCertificates = async (token) => {
    try {
      const res = await fetch("/api/certificates/student", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCertificates(data.certificates || []);
      }
    } catch (error) {
      console.error("Error fetching certificates:", error);
    }
  };

  const fetchAllCertificates = async (token) => {
    try {
      const res = await fetch("/api/certificates/all", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCertificates(data.certificates || []);
      }
    } catch (error) {
      console.error("Error fetching certificates:", error);
    }
  };

  const fetchAuditLogs = async (token) => {
    try {
      const res = await fetch("/api/audit-logs", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data.logs || []);
      }
    } catch (error) {
      console.error("Error fetching audit logs:", error);
    }
  };

  const fetchInstitutionDetails = async (token) => {
    try {
      const res = await fetch("/api/institution", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setInstitution(data.institution);
      }
    } catch (error) {
      console.error("Error fetching institution details:", error);
    }
  };

  const fetchVerificationHistory = async (token) => {
    try {
      const res = await fetch("/api/verification/history", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCertificates(data.verifications || []);
      }
    } catch (error) {
      console.error("Error fetching verification history:", error);
    }
  };

  const fetchAllStudents = async (token) => {
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

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/");
  };

  const handleRevokeCertificate = async (certificateId) => {
    if (
      !confirm(
        "Are you sure you want to revoke this certificate? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/revoke", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ certificateId }),
      });

      if (res.ok) {
        // Refresh certificates and audit logs
        fetchAllCertificates(token);
        fetchAuditLogs(token);
        alert("Certificate revoked successfully");
      } else {
        const error = await res.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error("Error revoking certificate:", error);
      alert("Error revoking certificate");
    }
  };

  const handleShareCertificate = (certificate) => {
    const shareUrl = `${window.location.origin}/share/${certificate.hash}`;
    window.open(shareUrl, "_blank");
  };

  const handleDownloadCertificate = async (certificate) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/certificates/${certificate.id}/download`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const blob = await res.blob();
        const filename = `${certificate.title || certificate.course_name}-${
          certificate.issue_date.split("T")[0]
        }.pdf`;
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        alert("Certificate downloaded successfully!");
      } else {
        const error = await res.json();
        alert(`Error downloading certificate: ${error.error}`);
      }
    } catch (error) {
      console.error("Error downloading certificate:", error);
      alert("Error downloading certificate");
    }
  };

  const handleDeleteCertificate = async (certificateId) => {
    if (
      !confirm(
        "Are you sure you want to permanently delete this certificate? This cannot be undone."
      )
    ) {
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/certificates/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ certificateId }),
      });
      if (res.ok) {
        fetchAllCertificates(token);
        alert("Certificate deleted successfully");
      } else {
        const error = await res.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error("Error deleting certificate:", error);
      alert("Error deleting certificate");
    }
  };

  const handleDeleteStudent = async (studentId) => {
    if (
      !confirm(
        "Are you sure you want to permanently delete this student and all their certificates? This cannot be undone."
      )
    ) {
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/students/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ studentId }),
      });
      if (res.ok) {
        fetchAllStudents(token);
        alert("Student deleted successfully");
      } else {
        const error = await res.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error("Error deleting student:", error);
      alert("Error deleting student");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const getRoleDisplayName = (role) => {
    switch (role) {
      case "admin":
        return "Institution Admin";
      case "student":
        return "Student";
      case "employer":
        return "Employer";
      default:
        return role;
    }
  };

  return (
    <>
      <Head>
        <title>Dashboard - Certificate Verification System</title>
        <meta
          name="description"
          content="User dashboard for certificate management"
        />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <nav className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <h1 className="text-xl font-semibold text-gray-900">
                  Certificate Verification System
                </h1>
                {user.role === "admin" && institution && (
                  <span className="ml-4 text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                    {institution.name}
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-700">
                  Welcome, {user.username} ({getRoleDisplayName(user.role)})
                </span>
                <button
                  onClick={handleLogout}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {/* Navigation Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab("overview")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "overview"
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Overview
              </button>
              {user.role === "admin" && (
                <>
                  <button
                    onClick={() => setActiveTab("issue")}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === "issue"
                        ? "border-indigo-500 text-indigo-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    Issue Certificate
                  </button>
                  <button
                    onClick={() => setActiveTab("audit")}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === "audit"
                        ? "border-indigo-500 text-indigo-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    Audit Logs
                  </button>
                  <button
                    onClick={() => setActiveTab("institution")}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === "institution"
                        ? "border-indigo-500 text-indigo-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    Institution
                  </button>
                  <button
                    onClick={() => setActiveTab("students")}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === "students"
                        ? "border-indigo-500 text-indigo-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    Students
                  </button>
                </>
              )}
              {user.role === "employer" && (
                <button
                  onClick={() => setActiveTab("verify")}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "verify"
                      ? "border-indigo-500 text-indigo-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  Verify Certificate
                </button>
              )}
              <button
                onClick={() => setActiveTab("certificates")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "certificates"
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {user.role === "admin"
                  ? "All Certificates"
                  : "Your Certificates"}
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="bg-white shadow rounded-lg">
            {activeTab === "overview" && (
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Welcome to your Dashboard
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-900">Role</h4>
                    <p className="text-blue-700">
                      {getRoleDisplayName(user.role)}
                    </p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-medium text-green-900">Status</h4>
                    <p className="text-green-700">Active</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h4 className="font-medium text-purple-900">Email</h4>
                    <p className="text-purple-700">{user.email}</p>
                  </div>
                </div>

                {user.role === "admin" && (
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-indigo-50 p-4 rounded-lg">
                      <h4 className="font-medium text-indigo-900">
                        Total Certificates
                      </h4>
                      <p className="text-indigo-700 text-2xl font-bold">
                        {certificates.length}
                      </p>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <h4 className="font-medium text-yellow-900">
                        Active Certificates
                      </h4>
                      <p className="text-yellow-700 text-2xl font-bold">
                        {
                          certificates.filter((c) => c.status === "active")
                            .length
                        }
                      </p>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg">
                      <h4 className="font-medium text-red-900">
                        Revoked Certificates
                      </h4>
                      <p className="text-red-700 text-2xl font-bold">
                        {
                          certificates.filter((c) => c.status === "revoked")
                            .length
                        }
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "issue" && user.role === "admin" && (
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Issue New Certificate
                </h3>
                <IssueCertificateForm
                  institutionId={institution ? institution.id : undefined}
                />
              </div>
            )}

            {activeTab === "audit" && user.role === "admin" && (
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Audit Logs
                </h3>
                <p className="text-gray-600 mb-4">
                  Complete transparency and compliance tracking for all system
                  actions.
                </p>
                {auditLogs.length === 0 ? (
                  <p className="text-gray-500">No audit logs found.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Action
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            User
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Timestamp
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Details
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {auditLogs.map((log) => (
                          <tr key={log.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                {log.action}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {log.user_id || "System"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(log.timestamp).toLocaleString()}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              {log.details}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === "institution" && user.role === "admin" && (
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Institution Management
                </h3>
                {institution ? (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">
                      Current Institution Details
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Institution Name
                        </label>
                        <p className="mt-1 text-sm text-gray-900">
                          {institution.name}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Status
                        </label>
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          {institution.status}
                        </span>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Created
                        </label>
                        <p className="mt-1 text-sm text-gray-900">
                          {new Date(
                            institution.created_at
                          ).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <button className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium">
                      Edit Institution Details
                    </button>
                  </div>
                ) : (
                  <p className="text-gray-500">
                    Loading institution details...
                  </p>
                )}
              </div>
            )}

            {activeTab === "verify" && user.role === "employer" && (
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Verify Certificate
                </h3>
                <Link
                  href="/verify"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Verify Certificate
                </Link>
              </div>
            )}

            {activeTab === "certificates" && (
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  {user.role === "admin"
                    ? "All Certificates"
                    : "Your Certificates"}
                </h3>
                {certificates.length === 0 ? (
                  <p className="text-gray-500">No certificates found.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          {user.role === "admin" && (
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Student
                            </th>
                          )}
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {user.role === "admin" ? "Course" : "Certificate"}
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Issue Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Hash
                          </th>
                          {user.role === "student" && (
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Actions
                            </th>
                          )}
                          {user.role === "admin" && (
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Actions
                            </th>
                          )}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {certificates.map((cert) => (
                          <tr key={cert.id}>
                            {user.role === "admin" && (
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {cert.student_username ||
                                  cert.student_username ||
                                  "N/A"}
                              </td>
                            )}
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {cert.title || cert.course_name || "N/A"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(cert.issue_date).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  cert.status === "active"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {cert.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                              {cert.hash
                                ? cert.hash.substring(0, 8) + "..."
                                : "N/A"}
                            </td>
                            {user.role === "student" && (
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                <button
                                  onClick={() => handleShareCertificate(cert)}
                                  className="text-blue-600 hover:text-blue-900 bg-blue-100 hover:bg-blue-200 px-2 py-1 rounded text-xs"
                                  title="Share Certificate"
                                >
                                  Share
                                </button>
                              </td>
                            )}
                            {user.role === "admin" && (
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                {cert.status === "active" && (
                                  <button
                                    onClick={() =>
                                      handleRevokeCertificate(cert.id)
                                    }
                                    className="text-red-600 hover:text-red-900 bg-red-100 hover:bg-red-200 px-2 py-1 rounded text-xs"
                                  >
                                    Revoke
                                  </button>
                                )}
                                <button
                                  onClick={() =>
                                    handleDeleteCertificate(cert.id)
                                  }
                                  className="text-gray-600 hover:text-white bg-gray-200 hover:bg-red-600 px-2 py-1 rounded text-xs border border-gray-300 hover:border-red-700 transition"
                                >
                                  Delete
                                </button>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === "students" && user.role === "admin" && (
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Student Users
                </h3>
                {students.length === 0 ? (
                  <p className="text-gray-500">No students found.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Username
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Email
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {students.map((student) => (
                          <tr key={student.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {student.username}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {student.email}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                              <button
                                onClick={() => openEditModal(student)}
                                className="text-indigo-600 hover:text-white bg-indigo-100 hover:bg-indigo-600 px-2 py-1 rounded text-xs border border-indigo-300 hover:border-indigo-700 transition"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteStudent(student.id)}
                                className="text-gray-600 hover:text-white bg-gray-200 hover:bg-red-600 px-2 py-1 rounded text-xs border border-gray-300 hover:border-red-700 transition"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Edit Student Modal */}
                {editModalOpen && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
                    <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md relative">
                      <button
                        onClick={closeEditModal}
                        className="absolute top-2 right-2 text-gray-400 hover:text-gray-700"
                        aria-label="Close"
                      >
                        &times;
                      </button>
                      <h4 className="text-lg font-semibold mb-4 text-indigo-800">Edit Student Info</h4>
                      <form onSubmit={handleEditStudentSubmit} className="space-y-4">
                        <div>
                          <label className="block font-bold text-gray-900 mb-1">Username</label>
                          <input
                            type="text"
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            required
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-gray-900 mb-1">Email</label>
                          <input
                            type="email"
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white"
                            value={editEmail}
                            onChange={(e) => setEditEmail(e.target.value)}
                            required
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-gray-900 mb-1">Update Photo</label>
                          <input
                            type="file"
                            accept="image/*"
                            className="mt-1 block w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white"
                            onChange={handleEditPhotoChange}
                            ref={editPhotoInput}
                          />
                        </div>
                        <div className="flex justify-end">
                          <button
                            type="submit"
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-md text-base font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                          >
                            Save Changes
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
