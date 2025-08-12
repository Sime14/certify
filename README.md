# Certificate Verification System

A blockchain-based academic certificate verification system built with Next.js, Hardhat, and MySQL.

## Features

- **User Registration & Authentication**: Support for students, employers, and institution admins
- **Secure Certificate Management**: Blockchain-verified academic certificates
- **Role-Based Access Control**: Different permissions for different user types
- **Audit Logging**: Complete traceability of all system actions
- **Modern UI**: Beautiful, responsive interface built with Tailwind CSS

## System Architecture

### User Roles

1. **Students**: Can view and manage their own certificates
2. **Employers**: Can verify certificates submitted by job applicants
3. **Institution Admins**: Can issue and manage certificates for their institution

### Registration Process

1. **Access Registration Page**: Users visit `/create-account` from the homepage
2. **Fill Registration Form**:
   - Username (minimum 3 characters)
   - Email (valid format required)
   - Password (minimum 8 characters, must contain uppercase, lowercase, and number)
   - Role selection (student, employer, or admin)
   - Institution name (required for admin users)
3. **Client-Side Validation**: Real-time form validation with helpful error messages
4. **Submit Form**: Data sent to backend registration API
5. **Backend Processing**:
   - Username/email uniqueness verification
   - Password hashing with bcrypt
   - User creation in database
   - Institution creation for admin users
   - Audit logging for traceability
6. **Completion**: Success message and redirect to login page

## Prerequisites

- Node.js 18+
- MySQL 8.0+
- Git

## Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd certify
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:

   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=cert_verify_db
   JWT_SECRET=your_jwt_secret_key
   ```

4. **Set up the database**

   ```bash
   # Run the database schema script
   mysql -u root -p < database_schema.sql
   ```

5. **Start the development server**

   ```bash
   npm run dev
   ```

6. **Access the application**
   Open [http://localhost:3000](http://localhost:3000) in your browser

## Database Schema

The system uses the following main tables:

- **users**: User accounts with role-based access
- **institutions**: Educational institutions managed by admin users
- **certificates**: Academic certificates with blockchain verification
- **audit_logs**: Complete system activity tracking
- **verification_requests**: Certificate verification requests

## API Endpoints

- `POST /api/register` - User registration
- `POST /api/login` - User authentication
- `POST /api/issue` - Issue new certificates (admin only)
- `POST /api/verify` - Verify certificate authenticity
- `POST /api/revoke` - Revoke certificates (admin only)

## Smart Contracts

The system includes Ethereum smart contracts for:

- Certificate verification
- Immutable record keeping
- Decentralized trust

## Security Features

- Password hashing with bcrypt (12 salt rounds)
- JWT-based authentication
- Input validation and sanitization
- SQL injection prevention with parameterized queries
- Comprehensive audit logging

## Development

- **Frontend**: Next.js with Tailwind CSS
- **Backend**: Next.js API routes
- **Database**: MySQL with connection pooling
- **Blockchain**: Hardhat development environment
- **Authentication**: JWT tokens

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For support and questions, please open an issue in the repository.
