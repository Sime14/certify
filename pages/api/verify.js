import Web3 from "web3";
import { createHash } from "crypto";
import pool from "../../utils/db";
import formidable from "formidable";
import fs from "fs/promises";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Parse form data
    const form = formidable();
    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve([fields, files]);
      });
    });

    const { hash } = fields;
    const file = files.certificate;

    let certHash;

    if (file) {
      // If file is uploaded, generate hash from it
      const fileBuffer = await fs.readFile(file.filepath);
      certHash = createHash("sha256").update(fileBuffer).digest("hex");
      await fs.unlink(file.filepath); // Clean up
    } else if (hash) {
      // If hash is provided directly
      certHash = hash;
    } else {
      return res
        .status(400)
        .json({ error: "Either file or hash must be provided" });
    }

    // Initialize Web3 and contract
    const web3 = new Web3("http://127.0.0.1:7545");
    const contractAddress =
      process.env.CONTRACT_ADDRESS || "0xYourContractAddress";
    const contractABI = [
      {
        inputs: [{ internalType: "string", name: "certHash", type: "string" }],
        name: "verifyCertificate",
        outputs: [{ internalType: "bool", name: "", type: "bool" }],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [{ internalType: "string", name: "certHash", type: "string" }],
        name: "getCertificateInfo",
        outputs: [
          { internalType: "bool", name: "exists", type: "bool" },
          { internalType: "bool", name: "isRevoked", type: "bool" },
          { internalType: "uint256", name: "issueDate", type: "uint256" },
          { internalType: "string", name: "studentId", type: "string" },
        ],
        stateMutability: "view",
        type: "function",
      },
    ];

    const contract = new web3.eth.Contract(contractABI, contractAddress);

    // Verify certificate on blockchain
    const isValid = await contract.methods.verifyCertificate(certHash).call();

    if (!isValid) {
      return res.status(400).json({
        error: "Invalid or revoked certificate",
        hash: certHash,
        status: "invalid",
      });
    }

    // Get additional info from blockchain
    const certInfo = await contract.methods.getCertificateInfo(certHash).call();

    // Get certificate details from database
    const [rows] = await pool.query(
      `SELECT c.*, u.username as student_username, i.name as institution_name 
       FROM certificates c 
       JOIN users u ON c.student_id = u.id 
       JOIN institutions i ON c.institution_id = i.id 
       WHERE c.hash = ?`,
      [certHash]
    );

    if (!rows[0]) {
      return res.status(404).json({
        error: "Certificate not found in database",
        hash: certHash,
        blockchainStatus: "valid",
        databaseStatus: "not_found",
      });
    }

    const certificate = rows[0];

    // Log verification attempt
    await pool.query(
      "INSERT INTO audit_logs (action, user_id, timestamp, details) VALUES (?, ?, NOW(), ?)",
      ["verify", 0, `Certificate verified with hash ${certHash}`]
    );

    res.status(200).json({
      message: "Certificate is valid",
      hash: certHash,
      status: "valid",
      blockchainInfo: {
        exists: certInfo.exists,
        isRevoked: certInfo.isRevoked,
        issueDate: new Date(parseInt(certInfo.issueDate) * 1000).toISOString(),
        studentId: certInfo.studentId,
      },
      databaseInfo: {
        id: certificate.id,
        studentName: certificate.student_name,
        courseName: certificate.course_name,
        issueDate: certificate.issue_date,
        status: certificate.status,
        studentUsername: certificate.student_username,
        institutionName: certificate.institution_name,
        filePath: certificate.file_path,
      },
    });
  } catch (error) {
    console.error("Certificate verification error:", error);
    res.status(500).json({ error: "Server error: " + error.message });
  }
}
