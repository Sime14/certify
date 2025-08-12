import Web3 from "web3";
import multer from "multer";
import { createHash } from "crypto";
import path from "path";
import fs from "fs/promises";
import jwt from "jsonwebtoken";
import pool from "../../utils/db";

// Configure multer for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: async (req, file, cb) => {
      const uploadDir = path.join(process.cwd(), "public", "uploads");
      try {
        await fs.mkdir(uploadDir, { recursive: true });
        cb(null, uploadDir);
      } catch (error) {
        cb(error);
      }
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, `certificate-${uniqueSuffix}.pdf`);
    },
  }),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"));
    }
  },
});

// Helper function to run multer
const runMiddleware = (req, res, middleware) => {
  return new Promise((resolve, reject) => {
    middleware(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Verify JWT token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your-secret-key-change-in-production"
    );

    // Check if user is admin
    if (decoded.role !== "admin") {
      return res
        .status(403)
        .json({ error: "Access denied. Admin role required." });
    }

    // Handle file upload
    await runMiddleware(req, res, upload.single("certificateFile"));

    const { studentId, title, description, issueDate, expiryDate } = req.body;
    const certificateFile = req.file;

    // Validate required fields
    if (!studentId || !title || !certificateFile) {
      return res
        .status(400)
        .json({
          error: "Student ID, title, and certificate file are required",
        });
    }

    // Validate student exists and is actually a student
    const [students] = await pool.query(
      "SELECT id, username FROM users WHERE id = ? AND role = 'student'",
      [studentId]
    );

    if (students.length === 0) {
      return res
        .status(400)
        .json({ error: "Invalid student ID or student not found" });
    }

    // Get admin's institution
    const [institutions] = await pool.query(
      "SELECT id FROM institutions WHERE admin_id = ?",
      [decoded.id]
    );

    if (institutions.length === 0) {
      return res.status(400).json({ error: "Institution not found for admin" });
    }

    const institutionId = institutions[0].id;

    // Generate SHA-256 hash of the uploaded file
    const fileBuffer = await fs.readFile(certificateFile.path);
    const certificateHash = createHash("sha256")
      .update(fileBuffer)
      .digest("hex");

    // Check if certificate hash already exists
    const [existingCertificates] = await pool.query(
      "SELECT id FROM certificates WHERE certificate_hash = ?",
      [certificateHash]
    );

    if (existingCertificates.length > 0) {
      // Remove uploaded file if hash already exists
      await fs.unlink(certificateFile.path);
      return res
        .status(400)
        .json({ error: "Certificate with this hash already exists" });
    }

    // TODO: Store certificate hash on blockchain
    // This would typically involve:
    // 1. Connecting to Ethereum network
    // 2. Calling the issueCertificate smart contract function
    // 3. Getting transaction hash
    // For now, we'll simulate this step

    let blockchainTxHash = null;
    try {
      // Initialize Web3 (you'll need to configure this for your network)
      const web3 = new Web3(
        process.env.ETHEREUM_RPC_URL || "http://127.0.0.1:7545"
      );

      // Your smart contract ABI and address would go here
      // const contractAddress = process.env.CONTRACT_ADDRESS;
      // const contractABI = [...]; // Your contract ABI

      // For now, we'll just simulate the blockchain interaction
      blockchainTxHash = "0x" + "0".repeat(64); // Placeholder transaction hash

      console.log("Blockchain integration would happen here");
    } catch (blockchainError) {
      console.error("Blockchain integration error:", blockchainError);
      // Continue without blockchain for now
    }

    // Save certificate to database
    const [result] = await pool.query(
      `INSERT INTO certificates (
        certificate_hash, 
        student_id, 
        institution_id, 
        title, 
        description, 
        issue_date, 
        expiry_date, 
        blockchain_tx_hash,
        status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        certificateHash,
        studentId,
        institutionId,
        title,
        description || null,
        issueDate,
        expiryDate || null,
        blockchainTxHash,
        "active",
      ]
    );

    // Log the issuance action
    await pool.query(
      `INSERT INTO audit_logs (action, user_id, timestamp, details) 
       VALUES (?, ?, NOW(), ?)`,
      [
        "issue_certificate",
        decoded.id,
        `Certificate "${title}" issued to student ${
          students[0].username
        } with hash ${certificateHash.substring(0, 8)}...`,
      ]
    );

    res.status(201).json({
      message: "Certificate issued successfully",
      certificateId: result.insertId,
      certificateHash,
      blockchainTxHash,
      filePath: `/uploads/${certificateFile.filename}`,
      student: students[0].username,
      title,
      issueDate,
    });
  } catch (error) {
    console.error("Certificate issuance error:", error);

    // Clean up uploaded file if there was an error
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (cleanupError) {
        console.error("Error cleaning up file:", cleanupError);
      }
    }

    if (error.code === "LIMIT_FILE_SIZE") {
      return res
        .status(400)
        .json({ error: "File size too large. Maximum size is 10MB." });
    }

    if (error.message === "Only PDF files are allowed") {
      return res.status(400).json({ error: "Only PDF files are allowed" });
    }

    res.status(500).json({ error: "Server error" });
  }
}

// Configure API to handle file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};
