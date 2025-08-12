import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Image from "next/image";

export default function ShareCertificate() {
  const [certificate, setCertificate] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();
  const { hash } = router.query;

  useEffect(() => {
    if (hash) {
      fetchCertificateDetails(hash);
    }
  }, [hash]);

  const fetchCertificateDetails = async (certificateHash) => {
    try {
      const res = await fetch(`/api/certificates/verify/${certificateHash}`);
      if (res.ok) {
        const data = await res.json();
        setCertificate(data.certificate);
      } else {
        const errorData = await res.json();
        setError(errorData.error || "Certificate not found");
      }
    } catch (error) {
      setError("Error fetching certificate details");
    } finally {
      setIsLoading(false);
    }
  };

  const generateQRCode = (url) => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
      url
    )}`;
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert("Link copied to clipboard!");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading certificate...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
          <button
            onClick={() => router.push("/")}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  if (!certificate) {
    return null;
  }

  const verificationUrl = `${window.location.origin}/verify/${hash}`;
  const qrCodeUrl = generateQRCode(verificationUrl);

  return (
    <>
      <Head>
        <title>Certificate Verification - {certificate.title}</title>
        <meta
          name="description"
          content="Verify academic certificate authenticity"
        />
      </Head>

      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Certificate Verification
            </h1>
            <p className="text-gray-600">
              Verify the authenticity of this academic certificate
            </p>
          </div>

          {/* Certificate Information Card */}
          <div className="bg-white shadow-lg rounded-lg overflow-hidden mb-8">
            <div className="px-6 py-4 bg-indigo-600">
              <h2 className="text-xl font-semibold text-white">
                {certificate.title}
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Certificate Details
                  </h3>
                  <dl className="space-y-3">
                    <div className="flex items-center space-x-5">
                      <img
                        src={
                          certificate.student_photo_url ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            certificate.student_name || "Student"
                          )}&background=4f46e5&color=fff&size=192`
                        }
                        alt="Student photo"
                        className="h-32 w-32 rounded-full object-cover border-4 border-indigo-200 shadow-lg"
                        style={{ background: '#f3f4f6' }}
                      />
                      <div>
                        <div className="text-lg font-semibold text-gray-900">
                          {certificate.student_name}
                        </div>
                        <div className="text-sm text-gray-500">
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
                        {new Date(certificate.issue_date).toLocaleDateString()}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">
                        Status
                      </dt>
                      <dd className="text-sm">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            certificate.status === "active"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {certificate.status}
                        </span>
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
                      <img
                        src={qrCodeUrl}
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

          {/* Verification Link Card */}
          <div className="bg-white shadow-lg rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Verification Link
            </h3>
            <div className="flex items-center space-x-3">
              <input
                type="text"
                value={verificationUrl}
                readOnly
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm font-mono bg-gray-50"
              />
              <button
                onClick={() => copyToClipboard(verificationUrl)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Copy Link
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Share this link with employers or institutions to verify the
              certificate authenticity
            </p>
          </div>

          {/* Security Notice */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-blue-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  Security Information
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>
                    This certificate is verified using blockchain technology.
                    The hash above is unique to this certificate and cannot be
                    altered without detection.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
