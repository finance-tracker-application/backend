# Fin Tracker Backend API

A comprehensive financial tracking backend API with advanced security features, transaction management, and budget planning capabilities. This API provides everything needed to build a full-featured personal finance management application.

## 🚀 Features

### 🔐 Security & Authentication

- **JWT Authentication** with refresh tokens
- **Advanced Security Headers** (CSP, CORS, Helmet)
- **Rate Limiting** (100 requests/15min general, 5 requests/15min auth)
- **Speed Limiting** (slows down after 50 requests/15min)
- **Input Validation** & Sanitization
- **XSS Protection** & NoSQL Injection Prevention

### 💰 Financial Management

- **Transaction Tracking** (Income, Expense, Transfer)
- **Budget Planning** with real-time tracking
- **Recurring Transactions** automation
- **Multi-Currency Support** (USD, EUR, GBP, INR, CAD, AUD)
- **Advanced Analytics** & Insights
- **Bulk Import/Export** functionality

### 📊 Analytics & Insights

- **Spending Patterns** analysis
- **Category Breakdowns** with visualizations
- **Budget Utilization** tracking
- **Monthly/Yearly Trends**
- **Smart Alerts** & Notifications

## 🛠️ Technology Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT + Refresh Tokens
- **Security**: Helmet, CORS, Rate Limiting
- **Validation**: Custom middleware
- **Testing**: Jest + Supertest

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or cloud)
- npm or yarn

## ⚙️ Installation & Setup

### 1. Clone and Install

```bash
git clone <repository-url>
cd backend
npm install
```

### 2. Environment Configuration

Create a `.env` file in the root directory:

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

# Email Configuration (for password reset)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Security
NODE_ENV=development
```

### 3. Start the Server

```bash
# Development mode
npm run dev

# Production mode
npm start
```

The API will be available at: `http://localhost:9000/fin-tracker/v1`

## 🔌 API Endpoints

### Base URL

```
http://localhost:9000/fin-tracker/v1
```

### Authentication Header

For protected endpoints, include:

```
Authorization: Bearer <your_jwt_token>
```

---

## 🔐 Authentication Endpoints

### POST `/auth/signup`

**Purpose**: Register a new user account

**Request Body:**

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "userName": "johndoe",
  "password": "Password123"
}
```

**Response:**

```json
{
  "status": "success",
  "data": {
    "_id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "userName": "johndoe",
    "role": "user",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Frontend Usage**: Registration form, user onboarding

---

### POST `/auth/login`

**Purpose**: Authenticate user and receive access/refresh tokens

**Request Body:**

```json
{
  "userName": "johndoe",
  "password": "Password123"
}
```

**Response:**

```json
{
  "status": "success",
  "data": {
    "_id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "userName": "johndoe",
    "role": "user",
    "token": "jwt_token_here",
    "refreshToken": "refresh_token_here"
  }
}
```

**Frontend Usage**: Login form, store tokens in secure storage

---

### POST `/auth/refresh`

**Purpose**: Get new access token when current one expires

**Request Body:**

```json
{
  "refreshToken": "your_refresh_token"
}
```

**Response:**

```json
{
  "status": "success",
  "data": {
    "accessToken": "new_jwt_token",
    "refreshToken": "new_refresh_token"
  }
}
```

**Frontend Usage**: Automatic token refresh, intercept 401 responses

---

### POST `/auth/logout`

**Purpose**: Logout user and invalidate refresh token

**Headers**: `Authorization: Bearer <token>`

**Response:**

```json
{
  "status": "success",
  "data": {
    "message": "Logged out successfully"
  }
}
```

**Frontend Usage**: Logout button, clear local storage

---

### POST `/auth/forgotPassword`

**Purpose**: Request password reset email

**Request Body:**

```json
{
  "userName": "johndoe"
}
```

**Frontend Usage**: Forgot password form

---

### PUT `/auth/resetPassword/:passwordResetToken`

**Purpose**: Reset password using token from email

**Request Body:**

```json
{
  "password": "NewPassword123"
}
```

**Frontend Usage**: Password reset form

---

## 👤 User Management Endpoints

### GET `/users/profile`

**Purpose**: Get current user profile

**Headers**: `Authorization: Bearer <token>`

**Response:**

```json
{
  "status": "success",
  "data": {
    "_id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "userName": "johndoe",
    "role": "user",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Frontend Usage**: User profile page, header user info

---

### PUT `/users/profile`

**Purpose**: Update user profile information

**Headers**: `Authorization: Bearer <token>`

**Request Body:**

```json
{
  "name": "John Updated",
  "email": "john.updated@example.com",
  "userName": "johnupdated"
}
```

**Frontend Usage**: Profile edit form

---

### DELETE `/users/profile`

**Purpose**: Delete user account permanently

**Headers**: `Authorization: Bearer <token>`

**Frontend Usage**: Account deletion confirmation

---

### GET `/users/settings`

**Purpose**: Get user settings and preferences

**Headers**: `Authorization: Bearer <token>`

**Response:**

```json
{
  "status": "success",
  "data": {
    "role": "user",
    "memberSince": "2024-01-01T00:00:00.000Z",
    "accountStatus": "active"
  }
}
```

**Frontend Usage**: Settings page

---

### PUT `/users/change-password`

**Purpose**: Change user password

**Headers**: `Authorization: Bearer <token>`

**Request Body:**

```json
{
  "currentPassword": "OldPassword123",
  "newPassword": "NewPassword123"
}
```

**Frontend Usage**: Password change form

---

## 💰 Transaction Management Endpoints

### POST `/transactions`

**Purpose**: Create a new transaction

**Headers**: `Authorization: Bearer <token>`

**Request Body:**

```json
{
  "type": "expense",
  "category": "food",
  "amount": 25.5,
  "currency": "USD",
  "description": "Lunch at restaurant",
  "tags": ["food", "lunch"],
  "location": "Downtown Restaurant",
  "date": "2024-01-01T12:00:00.000Z",
  "isRecurring": false,
  "recurringPattern": {
    "frequency": "monthly",
    "interval": 1,
    "endDate": "2024-12-31T23:59:59.000Z"
  }
}
```

**Transaction Types**: `income`, `expense`, `transfer`

**Categories**:

- **Income**: `salary`, `freelance`, `investment`, `business`, `other_income`
- **Expense**: `food`, `transport`, `entertainment`, `shopping`, `bills`, `health`, `education`, `travel`, `other_expense`
- **Transfer**: `bank_transfer`, `cash_transfer`, `investment_transfer`

**Currencies**: `USD`, `EUR`, `GBP`, `INR`, `CAD`, `AUD`

**Frontend Usage**: Add transaction form, quick add buttons

---

### GET `/transactions`

**Purpose**: Get all transactions with filtering and pagination

**Headers**: `Authorization: Bearer <token>`

**Query Parameters**:

- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20)
- `type` (string): Filter by transaction type
- `category` (string): Filter by category
- `startDate` (string): Filter from date (ISO format)
- `endDate` (string): Filter to date (ISO format)
- `minAmount` (number): Minimum amount
- `maxAmount` (number): Maximum amount
- `tags` (string): Comma-separated tags
- `sortBy` (string): Sort field (default: 'date')
- `sortOrder` (string): Sort order - 'asc' or 'desc' (default: 'desc')

**Response:**

```json
{
  "status": "success",
  "data": {
    "transactions": [
      {
        "_id": "transaction_id",
        "type": "expense",
        "category": "food",
        "amount": 25.5,
        "currency": "USD",
        "description": "Lunch at restaurant",
        "tags": ["food", "lunch"],
        "location": "Downtown Restaurant",
        "date": "2024-01-01T12:00:00.000Z",
        "formattedAmount": "$25.50",
        "month": 1,
        "year": 2024,
        "createdAt": "2024-01-01T12:00:00.000Z",
        "updatedAt": "2024-01-01T12:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "pages": 5
    }
  }
}
```

**Frontend Usage**: Transaction list, transaction history, filtering interface

---

### GET `/transactions/analytics`

**Purpose**: Get comprehensive transaction analytics and insights

**Headers**: `Authorization: Bearer <token>`

**Query Parameters**:

- `startDate` (string): Start date for analysis
- `endDate` (string): End date for analysis
- `groupBy` (string): Grouping - 'month', 'week', 'day' (default: 'month')

**Response:**

```json
{
  "status": "success",
  "data": {
    "summary": {
      "totalIncome": 5000,
      "totalExpense": 3000,
      "totalTransfer": 500,
      "transactionCount": 50,
      "averageAmount": 100,
      "netSavings": 2000
    },
    "categoryBreakdown": [
      {
        "_id": "food",
        "total": 800,
        "count": 32,
        "avgAmount": 25
      }
    ],
    "monthlyTrends": [
      {
        "_id": {
          "year": 2024,
          "month": 1,
          "type": "expense"
        },
        "total": 1500,
        "count": 25
      }
    ],
    "topSpendingCategories": [
      {
        "_id": "food",
        "total": 800
      }
    ]
  }
}
```

**Frontend Usage**: Dashboard charts, analytics page, spending insights

---

### POST `/transactions/bulk-import`

**Purpose**: Import multiple transactions at once

**Headers**: `Authorization: Bearer <token>`

**Request Body:**

```json
{
  "transactions": [
    {
      "type": "expense",
      "category": "food",
      "amount": 25.5,
      "description": "Lunch"
    },
    {
      "type": "income",
      "category": "salary",
      "amount": 3000,
      "description": "Monthly salary"
    }
  ]
}
```

**Frontend Usage**: CSV import, bulk transaction entry

---

### GET `/transactions/export`

**Purpose**: Export transactions in various formats

**Headers**: `Authorization: Bearer <token>`

**Query Parameters**:

- `format` (string): Export format - 'json' or 'csv' (default: 'json')
- `startDate` (string): Start date for export
- `endDate` (string): End date for export

**Frontend Usage**: Export functionality, data backup

---

### GET `/transactions/:id`

**Purpose**: Get specific transaction by ID

**Headers**: `Authorization: Bearer <token>`

**Frontend Usage**: Transaction detail view, edit form

---

### PUT `/transactions/:id`

**Purpose**: Update specific transaction

**Headers**: `Authorization: Bearer <token>`

**Frontend Usage**: Transaction edit form

---

### DELETE `/transactions/:id`

**Purpose**: Delete specific transaction

**Headers**: `Authorization: Bearer <token>`

**Frontend Usage**: Delete confirmation, transaction list

---

## 📊 Budget Management Endpoints

### POST `/budgets`

**Purpose**: Create a new budget

**Headers**: `Authorization: Bearer <token>`

**Request Body:**

```json
{
  "name": "Monthly Budget January 2024",
  "type": "monthly",
  "period": {
    "startDate": "2024-01-01T00:00:00.000Z",
    "endDate": "2024-01-31T23:59:59.000Z"
  },
  "categories": [
    {
      "category": "food",
      "allocatedAmount": 300,
      "color": "#EF4444"
    },
    {
      "category": "transport",
      "allocatedAmount": 150,
      "color": "#3B82F6"
    }
  ],
  "currency": "USD",
  "notifications": {
    "enabled": true,
    "threshold": 80,
    "emailAlerts": true,
    "pushAlerts": true
  },
  "tags": ["monthly", "personal"],
  "notes": "Monthly budget for January"
}
```

**Budget Types**: `monthly`, `yearly`, `custom`

**Frontend Usage**: Budget creation form, budget setup wizard

---

### GET `/budgets`

**Purpose**: Get all budgets with pagination

**Headers**: `Authorization: Bearer <token>`

**Query Parameters**:

- `status` (string): Filter by status - 'active', 'completed', 'cancelled'
- `type` (string): Filter by type - 'monthly', 'yearly', 'custom'
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10)

**Response:**

```json
{
  "status": "success",
  "data": {
    "budgets": [
      {
        "_id": "budget_id",
        "name": "Monthly Budget January 2024",
        "type": "monthly",
        "period": {
          "startDate": "2024-01-01T00:00:00.000Z",
          "endDate": "2024-01-31T23:59:59.000Z"
        },
        "categories": [...],
        "totalBudget": 2000,
        "totalSpent": 1500,
        "remainingBudget": 500,
        "utilizationPercentage": 75,
        "budgetStatus": "warning",
        "status": "active",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 5,
      "pages": 1
    }
  }
}
```

**Frontend Usage**: Budget list, budget overview page

---

### GET `/budgets/overview`

**Purpose**: Get overview of all active budgets

**Headers**: `Authorization: Bearer <token>`

**Response:**

```json
{
  "status": "success",
  "data": {
    "totalBudgets": 3,
    "totalAllocated": 5000,
    "totalSpent": 3500,
    "totalRemaining": 1500,
    "averageUtilization": 70,
    "budgets": [
      {
        "id": "budget_id",
        "name": "Monthly Budget",
        "type": "monthly",
        "totalBudget": 2000,
        "totalSpent": 1500,
        "remainingBudget": 500,
        "utilizationPercentage": 75,
        "status": "warning",
        "period": {
          "startDate": "2024-01-01T00:00:00.000Z",
          "endDate": "2024-01-31T23:59:59.000Z"
        }
      }
    ]
  }
}
```

**Frontend Usage**: Dashboard overview, budget summary cards

---

### POST `/budgets/template`

**Purpose**: Create budget from predefined template

**Headers**: `Authorization: Bearer <token>`

**Request Body:**

```json
{
  "template": "monthly",
  "period": {
    "startDate": "2024-01-01T00:00:00.000Z",
    "endDate": "2024-01-31T23:59:59.000Z"
  }
}
```

**Available Templates**: `monthly`, `yearly`

**Frontend Usage**: Quick budget setup, template selection

---

### GET `/budgets/:id`

**Purpose**: Get specific budget by ID

**Headers**: `Authorization: Bearer <token>`

**Frontend Usage**: Budget detail view, budget management

---

### PUT `/budgets/:id`

**Purpose**: Update specific budget

**Headers**: `Authorization: Bearer <token>`

**Frontend Usage**: Budget edit form

---

### DELETE `/budgets/:id`

**Purpose**: Delete specific budget

**Headers**: `Authorization: Bearer <token>`

**Frontend Usage**: Budget deletion confirmation

---

### GET `/budgets/:id/analytics`

**Purpose**: Get detailed analytics for specific budget

**Headers**: `Authorization: Bearer <token>`

**Response:**

```json
{
  "status": "success",
  "data": {
    "budget": {
      "id": "budget_id",
      "name": "Monthly Budget",
      "type": "monthly",
      "period": {
        "startDate": "2024-01-01T00:00:00.000Z",
        "endDate": "2024-01-31T23:59:59.000Z"
      },
      "totalBudget": 2000,
      "totalSpent": 1500,
      "remainingBudget": 500,
      "utilizationPercentage": 75,
      "status": "warning"
    },
    "categoryBreakdown": [
      {
        "category": "food",
        "allocated": 300,
        "spent": 250,
        "remaining": 50,
        "percentage": 83.33,
        "status": "warning"
      }
    ],
    "recentTransactions": [...],
    "alerts": [
      {
        "type": "warning",
        "message": "Budget \"Monthly Budget\" is at 75.0% utilization",
        "category": "overall"
      }
    ]
  }
}
```

**Frontend Usage**: Budget analytics page, progress tracking, alerts display

---

### POST `/budgets/:id/duplicate`

**Purpose**: Duplicate existing budget

**Headers**: `Authorization: Bearer <token>`

**Request Body:**

```json
{
  "name": "Monthly Budget February 2024",
  "period": {
    "startDate": "2024-02-01T00:00:00.000Z",
    "endDate": "2024-02-29T23:59:59.000Z"
  }
}
```

**Frontend Usage**: Budget duplication, quick setup for new periods

---

## 🎨 Frontend Development Guide

### Recommended Frontend Stack

- **Framework**: React.js, Vue.js, or Angular
- **State Management**: Redux, Zustand, or Vuex
- **UI Library**: Material-UI, Ant Design, or Tailwind CSS
- **Charts**: Chart.js, D3.js, or Recharts
- **HTTP Client**: Axios or Fetch API

### Key Frontend Features to Implement

#### 1. **Authentication Flow**

- Login/Register forms
- Token storage (localStorage/sessionStorage)
- Automatic token refresh
- Protected routes
- Logout functionality

#### 2. **Dashboard**

- Financial overview cards
- Recent transactions
- Budget progress
- Quick action buttons
- Charts and analytics

#### 3. **Transaction Management**

- Add transaction form
- Transaction list with filtering
- Transaction details/edit
- Bulk import/export
- Recurring transaction setup

#### 4. **Budget Management**

- Budget creation wizard
- Budget overview with progress bars
- Category-wise breakdown
- Budget templates
- Budget duplication

#### 5. **Analytics & Reports**

- Spending charts
- Category breakdowns
- Monthly/yearly trends
- Budget vs actual comparisons
- Export functionality

#### 6. **User Profile**

- Profile information
- Settings management
- Password change
- Account deletion

### Error Handling

All endpoints return consistent error responses:

```json
{
  "status": "error",
  "message": "Error description",
  "statusCode": 400
}
```

### Rate Limiting

- **General endpoints**: 100 requests per 15 minutes
- **Authentication endpoints**: 5 requests per 15 minutes
- **Speed limiting**: Slows down after 50 requests per 15 minutes

### Security Considerations

- Store tokens securely
- Implement automatic token refresh
- Handle 401/403 responses
- Validate all inputs
- Implement proper error handling

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run coverage
```

## 📚 Additional Resources

- **API Documentation**: See `API_DOCUMENTATION.md` for detailed endpoint documentation
- **Environment Setup**: Copy `env.example` to `.env` and configure
- **Database Schema**: Check `models/` directory for data structures

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

ISC License

---

**This API provides everything needed to build a comprehensive personal finance management application with enterprise-level security and advanced features.**
