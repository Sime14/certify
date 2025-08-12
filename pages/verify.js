import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";

export default function VerifyCertificate() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [verificationMethod, setVerificationMethod] = useState("file"); // 'file' or 'hash'
  const router = useRouter();

  const [formData, setFormData] = useState({
    file: null,
    hash: "",
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (!token || !userData) {
      router.push("/");
      return;
    }

    try {
      const userObj = JSON.parse(userData);
      if (userObj.role !== "employer") {
        router.push("/dashboard");
        return;
      }
      setUser(userObj);
    } catch (error) {
      console.error("Error parsing user data:", error);
      router.push("/");
    }
  }, [router]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === "application/pdf") {
      setFormData((prev) => ({ ...prev, file }));
      setError("");
    } else {
      setError("Please select a valid PDF file");
      setFormData((prev) => ({ ...prev, file: null }));
    }
  };

  const handleHashChange = (e) => {
    setFormData((prev) => ({ ...prev, hash: e.target.value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setResult(null);
    setError("");

    try {
      const formDataToSend = new FormData();

      if (verificationMethod === "file") {
        if (!formData.file) {
          setError("Please select a certificate file");
          setIsLoading(false);
          return;
        }
        formDataToSend.append("certificate", formData.file);
      } else {
        if (!formData.hash.trim()) {
          setError("Please enter a certificate hash");
          setIsLoading(false);
          return;
        }
        formDataToSend.append("hash", formData.hash.trim());
      }

      const res = await fetch("/api/verify", {
        method: "POST",
        body: formDataToSend,
      });

      const data = await res.json();

      if (res.ok) {
        setResult(data);
      } else {
        setError(data.error || "Verification failed");
      }
    } catch (error) {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ file: null, hash: "" });
    setResult(null);
    setError("");
    setVerificationMethod("file");
    // Reset file input
    const fileInput = document.getElementById("certificate");
    if (fileInput) fileInput.value = "";
  };

  if (!user) {
    return null;
  }

  return (
    <>
      <Head>
        <title>Verify Certificate - Certificate Verification System</title>
        <meta name="description" content="Verify certificate authenticity" />
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
                  Verify Certificate
                </h1>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-700">
                  Welcome, {user.username} (Employer)
                </span>
              </div>
            </div>
          </div>
        </nav>

        <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-6">
                Verify Certificate Authenticity
              </h3>

              {/* Verification Method Toggle */}
              <div className="mb-6">
                <div className="flex space-x-4">
                  <button
                    onClick={() => setVerificationMethod("file")}
                    className={`px-4 py-2 rounded-md text-sm font-medium ${
                      verificationMethod === "file"
                        ? "bg-indigo-100 text-indigo-700 border border-indigo-300"
                        : "bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200"
                    }`}
                  >
                    Upload Certificate File
                  </button>
                  <button
                    onClick={() => setVerificationMethod("hash")}
                    className={`px-4 py-2 rounded-md text-sm font-medium ${
                      verificationMethod === "hash"
                        ? "bg-indigo-100 text-indigo-700 border border-indigo-300"
                        : "bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200"
                    }`}
                  >
                    Enter Certificate Hash
                  </button>
                </div>
              </div>

              {error && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-5 w-5 text-red-400"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-red-800">
                        {error}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Verification Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {verificationMethod === "file" ? (
                  <div>
                    <label
                      htmlFor="certificate"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Certificate File (PDF)
                    </label>
                    <input
                      type="file"
                      id="certificate"
                      name="certificate"
                      accept=".pdf"
                      onChange={handleFileChange}
                      required
                      className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      Upload the PDF certificate file to verify its authenticity
                    </p>
                  </div>
                ) : (
                  <div>
                    <label
                      htmlFor="hash"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Certificate Hash
                    </label>
                    <input
                      type="text"
                      id="hash"
                      name="hash"
                      value={formData.hash}
                      onChange={handleHashChange}
                      required
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm font-mono"
                      placeholder="Enter the 64-character SHA-256 hash"
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      Enter the certificate hash to verify its authenticity
                    </p>
                  </div>
                )}

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md text-sm font-medium"
                  >
                    Reset
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    {isLoading ? "Verifying..." : "Verify Certificate"}
                  </button>
                </div>
              </form>

              {/* Verification Result */}
              {result && (
                <div className="mt-8">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">
                    Verification Result
                  </h4>

                  {result.status === "valid" ? (
                    <div className="bg-green-50 border border-green-200 rounded-md p-6">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg
                            className="h-5 w-5 text-green-400"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <h5 className="text-sm font-medium text-green-800">
                            Certificate is Valid ✓
                          </h5>
                          <p className="mt-1 text-sm text-green-700">
                            This certificate has been verified on the blockchain
                            and is authentic.
                          </p>
                        </div>
                      </div>

                      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h6 className="text-sm font-medium text-gray-900 mb-2">
                            Blockchain Information
                          </h6>
                          <dl className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <dt className="text-gray-600">Hash:</dt>
                              <dd className="font-mono text-gray-900">
                                {result.hash}
                              </dd>
                            </div>
                            <div className="flex justify-between">
                              <dt className="text-gray-600">
                                Blockchain Status:
                              </dt>
                              <dd className="text-green-600 font-medium">
                                Valid
                              </dd>
                            </div>
                            <div className="flex justify-between">
                              <dt className="text-gray-600">
                                Issue Date (Blockchain):
                              </dt>
                              <dd className="text-gray-900">
                                {new Date(
                                  result.blockchainInfo.issueDate
                                ).toLocaleDateString()}
                              </dd>
                            </div>
                          </dl>
                        </div>

                        <div>
                          <h6 className="text-sm font-medium text-gray-900 mb-2">
                            Certificate Details
                          </h6>
                          <dl className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <dt className="text-gray-600">Student Name:</dt>
                              <dd className="text-gray-900">
                                {result.databaseInfo.studentName}
                              </dd>
                            </div>
                            <div className="flex justify-between">
                              <dt className="text-gray-600">Course:</dt>
                              <dd className="text-gray-900">
                                {result.databaseInfo.courseName}
                              </dd>
                            </div>
                            <div className="flex justify-between">
                              <dt className="text-gray-600">Institution:</dt>
                              <dd className="text-gray-900">
                                {result.databaseInfo.institutionName}
                              </dd>
                            </div>
                            <div className="flex justify-between">
                              <dt className="text-gray-600">Issue Date:</dt>
                              <dd className="text-gray-900">
                                {new Date(
                                  result.databaseInfo.issueDate
                                ).toLocaleDateString()}
                              </dd>
                            </div>
                          </dl>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-red-50 border border-red-200 rounded-md p-6">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg
                            className="h-5 w-5 text-red-400"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <h5 className="text-sm font-medium text-red-800">
                            Certificate is Invalid ✗
                          </h5>
                          <p className="mt-1 text-sm text-red-700">
                            {result.error ||
                              "This certificate could not be verified."}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
