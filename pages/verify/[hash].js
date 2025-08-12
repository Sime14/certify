import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";

export default function PublicVerifyCertificate() {
  const router = useRouter();
  const { hash } = router.query;

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [certificate, setCertificate] = useState(null);
  const [verification, setVerification] = useState(null);

  useEffect(() => {
    if (!hash) return;
    const run = async () => {
      setIsLoading(true);
      setError("");
      try {
        const res = await fetch(`/api/certificates/verify/${hash}`);
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Verification failed");
        }
        setCertificate(data.certificate);
        setVerification(data.verification);
      } catch (e) {
        setError(e.message || "Unable to verify certificate");
      } finally {
        setIsLoading(false);
      }
    };
    run();
  }, [hash]);

  const statusPill = (status) => (
    <span
      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
        status === "active"
          ? "bg-green-100 text-green-800"
          : status === "revoked"
          ? "bg-red-100 text-red-800"
          : "bg-yellow-100 text-yellow-800"
      }`}
    >
      {status}
    </span>
  );

  return (
    <>
      <Head>
        <title>Certificate Verification</title>
        <meta name="description" content="Verify certificate authenticity" />
      </Head>

      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Certificate Verification
            </h1>
            <p className="text-gray-600">
              Verify the authenticity of this academic certificate
            </p>
          </div>

          {isLoading && (
            <div className="bg-white shadow rounded-lg p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto" />
              <p className="mt-4 text-gray-600">Verifying...</p>
            </div>
          )}

          {!isLoading && error && (
            <div className="bg-white shadow rounded-lg p-8">
              <div className="bg-red-50 border border-red-200 rounded-md p-6">
                <p className="text-red-700 text-center">{error}</p>
                <div className="text-center mt-4">
                  <button
                    onClick={() => router.push("/")}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    Go Home
                  </button>
                </div>
              </div>
            </div>
          )}

          {!isLoading && !error && certificate && (
            <div className="bg-white shadow-lg rounded-lg overflow-hidden">
              <div className="px-6 py-4 bg-indigo-600">
                <h2 className="text-xl font-semibold text-white">
                  {certificate.title}
                </h2>
              </div>
              <div className="p-6">
                {/* Verification banner */}
                {verification && (
                  <div
                    className={`rounded-md p-4 mb-6 border ${
                      verification.valid
                        ? "bg-green-50 border-green-200"
                        : "bg-red-50 border-red-200"
                    }`}
                  >
                    <p
                      className={`text-sm font-medium ${
                        verification.valid ? "text-green-800" : "text-red-800"
                      }`}
                    >
                      {verification.valid
                        ? "Certificate is Valid and Authentic"
                        : verification.message ||
                          "Certificate could not be verified"}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Certificate Details
                    </h3>
                    <dl className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <img
                          src={
                            certificate.student_photo_url ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(
                              certificate.student_name || "Student"
                            )}&background=4f46e5&color=fff&size=96`
                          }
                          alt="Student photo"
                          className="h-16 w-16 rounded-full object-cover border"
                        />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {certificate.student_name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {certificate.institution_name}
                          </div>
                        </div>
                      </div>
                      <hr className="my-2" />
                      <div>
                        <dt className="text-sm font-medium text-gray-500">
                          Student
                        </dt>
                        <dd className="text-sm text-gray-900">
                          {certificate.student_name}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">
                          Institution
                        </dt>
                        <dd className="text-sm text-gray-900">
                          {certificate.institution_name}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">
                          Issue Date
                        </dt>
                        <dd className="text-sm text-gray-900">
                          {new Date(
                            certificate.issue_date
                          ).toLocaleDateString()}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">
                          Status
                        </dt>
                        <dd className="text-sm">
                          {statusPill(certificate.status)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">
                          Certificate Hash
                        </dt>
                        <dd className="text-sm text-gray-900 font-mono break-all">
                          {certificate.certificate_hash}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Verification QR Code
                    </h3>
                    <div className="text-center">
                      <div className="inline-block p-4 bg-white border-2 border-gray-200 rounded-lg">
                        {/* Using external QR code service for simplicity */}
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                            typeof window !== "undefined"
                              ? `${window.location.origin}/verify/${hash}`
                              : ""
                          )}`}
                          alt="Certificate Verification QR Code"
                          className="w-48 h-48"
                        />
                      </div>
                      <p className="text-sm text-gray-500 mt-2">
                        Scan to verify this certificate
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
