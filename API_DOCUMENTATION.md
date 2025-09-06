# Fin Tracker API Documentation

## Overview

A comprehensive financial tracking API with advanced security features, transaction management, and budget planning capabilities.

## Base URL

```
http://localhost:9000/fin-tracker/v1
```

## Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## Security Features

- **CSP (Content Security Policy)**: Prevents XSS attacks
- **CORS**: Configurable cross-origin resource sharing
- **Rate Limiting**: 100 requests per 15 minutes (general), 5 requests per 15 minutes (auth)
- **Speed Limiting**: Slows down requests after 50 requests per 15 minutes
- **Helmet**: Security headers
- **XSS Protection**: Cross-site scripting protection
- **MongoDB Sanitization**: Prevents NoSQL injection
- **HPP Protection**: HTTP Parameter Pollution protection

---

## Authentication Endpoints

### POST `/auth/signup`

Register a new user account.

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

### POST `/auth/login`

Authenticate user and receive tokens.

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

### POST `/auth/refresh`

Get new access token using refresh token.

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

### POST `/auth/logout`

Logout user and invalidate refresh token.

**Headers:** `Authorization: Bearer <token>`

**Response:**

```json
{
  "status": "success",
  "data": {
    "message": "Logged out successfully"
  }
}
```

---

## User Management Endpoints

### GET `/users/profile`

Get current user profile.

**Headers:** `Authorization: Bearer <token>`

### PUT `/users/profile`

Update user profile.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**

```json
{
  "name": "John Updated",
  "email": "john.updated@example.com",
  "userName": "johnupdated"
}
```

### DELETE `/users/profile`

Delete user account.

**Headers:** `Authorization: Bearer <token>`

### PUT `/users/change-password`

Change user password.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**

```json
{
  "currentPassword": "OldPassword123",
  "newPassword": "NewPassword123"
}
```

---

## Transaction Management Endpoints

### POST `/transactions`

Create a new transaction.

**Headers:** `Authorization: Bearer <token>`

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
  "isRecurring": false
}
```

**Transaction Types:** `income`, `expense`, `transfer`

**Categories:**

- Income: `salary`, `freelance`, `investment`, `business`, `other_income`
- Expense: `food`, `transport`, `entertainment`, `shopping`, `bills`, `health`, `education`, `travel`, `other_expense`
- Transfer: `bank_transfer`, `cash_transfer`, `investment_transfer`

### GET `/transactions`

Get all transactions with filtering and pagination.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**

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
    "transactions": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "pages": 5
    }
  }
}
```

### GET `/transactions/analytics`

Get transaction analytics and insights.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**

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
    "categoryBreakdown": [...],
    "monthlyTrends": [...],
    "topSpendingCategories": [...]
  }
}
```

### POST `/transactions/bulk-import`

Import multiple transactions at once.

**Headers:** `Authorization: Bearer <token>`

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

### GET `/transactions/export`

Export transactions in various formats.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**

- `format` (string): Export format - 'json' or 'csv' (default: 'json')
- `startDate` (string): Start date for export
- `endDate` (string): End date for export

### GET `/transactions/:id`

Get specific transaction by ID.

**Headers:** `Authorization: Bearer <token>`

### PUT `/transactions/:id`

Update specific transaction.

**Headers:** `Authorization: Bearer <token>`

### DELETE `/transactions/:id`

Delete specific transaction.

**Headers:** `Authorization: Bearer <token>`

---

## Budget Management Endpoints

### POST `/budgets`

Create a new budget.

**Headers:** `Authorization: Bearer <token>`

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
  }
}
```

### GET `/budgets`

Get all budgets with pagination.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**

- `status` (string): Filter by status - 'active', 'completed', 'cancelled'
- `type` (string): Filter by type - 'monthly', 'yearly', 'custom'
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10)

### GET `/budgets/overview`

Get overview of all active budgets.

**Headers:** `Authorization: Bearer <token>`

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
    "budgets": [...]
  }
}
```

### POST `/budgets/template`

Create budget from predefined template.

**Headers:** `Authorization: Bearer <token>`

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

**Available Templates:** `monthly`, `yearly`

### GET `/budgets/:id`

Get specific budget by ID.

**Headers:** `Authorization: Bearer <token>`

### PUT `/budgets/:id`

Update specific budget.

**Headers:** `Authorization: Bearer <token>`

### DELETE `/budgets/:id`

Delete specific budget.

**Headers:** `Authorization: Bearer <token>`

### GET `/budgets/:id/analytics`

Get detailed analytics for specific budget.

**Headers:** `Authorization: Bearer <token>`

**Response:**

```json
{
  "status": "success",
  "data": {
    "budget": {
      "id": "budget_id",
      "name": "Monthly Budget",
      "totalBudget": 2000,
      "totalSpent": 1500,
      "remainingBudget": 500,
      "utilizationPercentage": 75,
      "status": "warning"
    },
    "categoryBreakdown": [...],
    "recentTransactions": [...],
    "alerts": [...]
  }
}
```

### POST `/budgets/:id/duplicate`

Duplicate existing budget.

**Headers:** `Authorization: Bearer <token>`

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

---

## Error Responses

All endpoints return consistent error responses:

```json
{
  "status": "error",
  "message": "Error description",
  "statusCode": 400
}
```

**Common Status Codes:**

- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `409`: Conflict
- `429`: Too Many Requests
- `500`: Internal Server Error

---

## Rate Limiting

- **General endpoints**: 100 requests per 15 minutes
- **Authentication endpoints**: 5 requests per 15 minutes
- **Speed limiting**: Slows down after 50 requests per 15 minutes

When rate limited, you'll receive:

```json
{
  "error": "Too many requests",
  "message": "Too many requests from this IP",
  "retryAfter": 900
}
```

---

## Unique Features

### 1. **Recurring Transactions**

Automatically create future transactions based on patterns:

```json
{
  "isRecurring": true,
  "recurringPattern": {
    "frequency": "monthly",
    "interval": 1,
    "endDate": "2024-12-31T23:59:59.000Z"
  }
}
```

### 2. **Budget Templates**

Quick setup with predefined budget templates for monthly and yearly planning.

### 3. **Advanced Analytics**

Comprehensive financial insights with category breakdowns, trends, and spending patterns.

### 4. **Multi-Currency Support**

Support for USD, EUR, GBP, INR, CAD, AUD with automatic formatting.

### 5. **Smart Budget Tracking**

Real-time budget utilization with alerts and notifications.

### 6. **Bulk Operations**

Import/export transactions and duplicate budgets for efficiency.

### 7. **Enhanced Security**

Comprehensive security with CSP, rate limiting, and input validation.
