// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract CertificateVerifier {
    address public owner;
    mapping(string => bool) public certificates;
    mapping(string => bool) public revoked;
    mapping(string => uint256) public issueDates;
    mapping(string => string) public studentIds;

    event CertificateIssued(string indexed certHash, string studentId, uint256 timestamp);
    event CertificateRevoked(string indexed certHash, uint256 timestamp);

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    function issueCertificate(string memory certHash, string memory studentId) public onlyOwner {
        require(bytes(certHash).length > 0, "Invalid hash");
        require(bytes(studentId).length > 0, "Invalid student ID");
        require(!certificates[certHash], "Certificate already exists");
        
        certificates[certHash] = true;
        revoked[certHash] = false;
        issueDates[certHash] = block.timestamp;
        studentIds[certHash] = studentId;
        
        emit CertificateIssued(certHash, studentId, block.timestamp);
    }

    function verifyCertificate(string memory certHash) public view returns (bool) {
        return certificates[certHash] && !revoked[certHash];
    }

    function revokeCertificate(string memory certHash) public onlyOwner {
        require(certificates[certHash], "Certificate does not exist");
        require(!revoked[certHash], "Certificate already revoked");
        
        revoked[certHash] = true;
        emit CertificateRevoked(certHash, block.timestamp);
    }

    function getCertificateInfo(string memory certHash) public view returns (
        bool exists,
        bool isRevoked,
        uint256 issueDate,
        string memory studentId
    ) {
        return (
            certificates[certHash],
            revoked[certHash],
            issueDates[certHash],
            studentIds[certHash]
        );
    }

    function transferOwnership(address newOwner) public onlyOwner {
        require(newOwner != address(0), "Invalid new owner");
        owner = newOwner;
    }
} 