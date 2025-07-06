# Fin Tracker Backend

A complete Node.js backend application with JWT authentication, refresh tokens, and user management.

## Features

- ✅ JWT Authentication with Refresh Tokens
- ✅ User Registration and Login
- ✅ Password Reset via Email
- ✅ User Profile Management
- ✅ Input Validation
- ✅ Security Middleware (CORS, Rate Limiting, Helmet, XSS Protection)
- ✅ Error Handling
- ✅ MongoDB Integration

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

Create a `.env` file in the root directory with the following variables:

```env
# Database Configuration
MONGOdb=mongodb://localhost:27017/fin_tracker

# Server Configuration
PORT=9000

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random
secret=your_super_secret_jwt_key_here_make_it_long_and_random
expirationOption=24h

# CORS Configuration
allowedorigin=http://localhost:3000,http://localhost:3001

# Application URLs
applicationUrl=http://localhost:3000

# Email Configuration (if using nodemailer)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Security
NODE_ENV=development
```

### 3. Start the Server

```bash
npm start
```

## API Endpoints

### Authentication Routes

#### POST `/fin-tracker/v1/auth/signup`

Register a new user

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "userName": "johndoe",
  "password": "Password123"
}
```

#### POST `/fin-tracker/v1/auth/login`

Login user

```json
{
  "userName": "johndoe",
  "password": "Password123"
}
```

#### POST `/fin-tracker/v1/auth/logout`

Logout user (requires authentication)

#### POST `/fin-tracker/v1/auth/forgotPassword`

Request password reset

```json
{
  "userName": "johndoe"
}
```

#### PUT `/fin-tracker/v1/auth/resetPassword/:passwordResetToken`

Reset password using token

### User Management Routes

#### GET `/fin-tracker/v1/users/profile`

Get user profile (requires authentication)

#### PUT `/fin-tracker/v1/users/profile`

Update user profile (requires authentication)

```json
{
  "name": "John Updated",
  "email": "john.updated@example.com",
  "userName": "johnupdated"
}
```

#### DELETE `/fin-tracker/v1/users/profile`

Delete user profile (requires authentication)

#### GET `/fin-tracker/v1/users/settings`

Get user settings (requires authentication)

#### PUT `/fin-tracker/v1/users/settings`

Update user settings (requires authentication)

```json
{
  "role": "admin"
}
```

#### PUT `/fin-tracker/v1/users/change-password`

Change password (requires authentication)

```json
{
  "currentPassword": "OldPassword123",
  "newPassword": "NewPassword123"
}
```

### JWT Refresh Token Routes

#### POST `/fin-tracker/v1/auth/refresh`

Get new access token using refresh token

```json
{
  "refreshToken": "your_refresh_token_here"
}
```

## Authentication

### JWT Token

- Access tokens expire in 24 hours (configurable)
- Include in Authorization header: `Bearer <token>`

### Refresh Token

- Refresh tokens expire in 7 days
- Stored securely in database
- Used to get new access tokens when they expire

## Security Features

- **CORS Protection**: Configured for specific origins
- **Rate Limiting**: 100 requests per 15 minutes
- **Helmet**: Security headers
- **XSS Protection**: Cross-site scripting protection
- **MongoDB Sanitization**: Prevents NoSQL injection
- **HPP Protection**: HTTP Parameter Pollution protection
- **Input Validation**: Comprehensive validation for all inputs
- **Password Hashing**: Bcrypt with salt rounds

## Validation Rules

### Username

- 3-20 characters
- Alphanumeric and underscore only

### Email

- Valid email format

### Password

- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number

### Name

- 2-50 characters

## Error Handling

The application includes comprehensive error handling:

- Global error handler
- Custom error classes
- Async error catching
- Proper HTTP status codes

## Testing

Run tests:

```bash
npm test
```

Run tests with coverage:

```bash
npm run coverage
```

## Project Structure

```
├── controllers/          # Route controllers
├── middleware/           # Custom middleware
├── models/              # Database models
├── routes/              # API routes
├── utils/               # Utility functions
├── config/              # Configuration files
├── __tests__/           # Test files
├── app.js               # Express app configuration
├── server.js            # Server entry point
└── package.json         # Dependencies and scripts
```

## Dependencies

### Production

- express: Web framework
- mongoose: MongoDB ODM
- jsonwebtoken: JWT handling
- bcryptjs: Password hashing
- cors: CORS middleware
- helmet: Security headers
- express-rate-limit: Rate limiting
- nodemailer: Email sending

### Development

- jest: Testing framework
- nodemon: Development server
- supertest: API testing

## License

ISC
