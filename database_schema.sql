-- Database schema for Certificate Verification System
-- Run this script to create the necessary tables

-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS cert_verify_db;
USE cert_verify_db;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    photo_url VARCHAR(255),
    role ENUM('admin', 'student', 'employer') NOT NULL,
    status ENUM('active', 'pending', 'suspended') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_status (status)
);

-- Institutions table
CREATE TABLE IF NOT EXISTS institutions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    admin_id INT NOT NULL,
    status ENUM('active', 'pending', 'suspended') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_name (name),
    INDEX idx_admin_id (admin_id),
    INDEX idx_status (status)
);

-- Certificates table
CREATE TABLE IF NOT EXISTS certificates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    certificate_hash VARCHAR(255) UNIQUE NOT NULL,
    student_id INT NOT NULL,
    institution_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    issue_date DATE NOT NULL,
    expiry_date DATE,
    status ENUM('active', 'revoked', 'expired') DEFAULT 'active',
    blockchain_tx_hash VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE,
    INDEX idx_certificate_hash (certificate_hash),
    INDEX idx_student_id (student_id),
    INDEX idx_institution_id (institution_id),
    INDEX idx_status (status),
    INDEX idx_issue_date (issue_date)
);

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    action VARCHAR(100) NOT NULL,
    user_id INT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    details TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_action (action),
    INDEX idx_user_id (user_id),
    INDEX idx_timestamp (timestamp)
);

-- Certificate verification requests table
CREATE TABLE IF NOT EXISTS verification_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    certificate_hash VARCHAR(255) NOT NULL,
    requester_id INT NOT NULL,
    requester_type ENUM('student', 'employer') NOT NULL,
    status ENUM('pending', 'verified', 'rejected') DEFAULT 'pending',
    verification_date TIMESTAMP NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_certificate_hash (certificate_hash),
    INDEX idx_requester_id (requester_id),
    INDEX idx_status (status)
);

-- Insert default admin user (password: Admin123!)
INSERT INTO users (username, email, password_hash, role, status) VALUES 
('admin', 'admin@certify.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uK.G', 'admin', 'active');

-- Insert default institution for admin
INSERT INTO institutions (name, admin_id, status) VALUES 
('System Administration', 1, 'active');

-- Insert sample audit log
INSERT INTO audit_logs (action, user_id, timestamp, details) VALUES 
('system_init', 1, NOW(), 'System initialized with default admin user');
