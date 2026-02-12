# Backend API Tests

This directory contains unit tests for the Replate backend API using plain Node.js (no testing frameworks like Jest).

## Test Structure

- **admin-auth.test.js** - Admin authentication and authorization tests
- **admin-user-management.test.js** - Admin CRUD operations for users
- **admin-resources.test.js** - Admin access to donations, requests, and assignments
- **user-flows.test.js** - User registration, login, and profile management tests
- **run-all-tests.js** - Main test runner that executes all test suites

## Prerequisites

1. **Start the backend server:**
   ```bash
   npm start
   # or
   node server.js
   ```

2. **Create an admin user (required for admin tests):**
   ```bash
   node scripts/createAdmin.js
   ```
   
   Use the following credentials for testing:
   - Email: `admin@foodshare.com`
   - Password: `admin123`

## Running Tests

### Run All Tests
```bash
npm test
# or
node test/run-all-tests.js
```

### Run Individual Test Suites

**User Flows (Registration & Authentication):**
```bash
node test/user-flows.test.js
```

**Admin Authentication:**
```bash
node test/admin-auth.test.js
```

**Admin User Management:**
```bash
node test/run-all-tests.js
```
*Note: Admin tests require the admin token, so it's best to run through the main test runner*

## Test Coverage

### User Flow Tests
- ✅ Donor registration
- ✅ NGO registration
- ✅ Volunteer registration
- ✅ Profile retrieval for each role
- ✅ Profile updates

### Admin Authentication Tests
- ✅ Regular user blocked from admin routes
- ✅ Admin login
- ✅ Admin dashboard access
- ✅ Authorization verification

### Admin User Management Tests
- ✅ Get all users
- ✅ Create new user
- ✅ Get user by ID
- ✅ Update user
- ✅ Toggle user status
- ✅ Update verification status
- ✅ Delete user
- ✅ Verify deletion

### Admin Resource Management Tests
- ✅ Get all donations
- ✅ Get all requests
- ✅ Get all assignments
- ✅ Dashboard statistics accuracy

## Test Output

Tests provide detailed console output with:
- ✅ Success indicators
- ❌ Error messages
- 📊 Data summaries
- 🎉 Test completion status

## Notes

- Tests use the `fetch` API (Node.js 18+)
- No external testing frameworks required
- Tests create temporary test users
- Admin tests require pre-existing admin user
- Server must be running on `http://localhost:5000`

## Troubleshooting

**Error: "Server is not running"**
- Start the backend server: `npm start`

**Error: "Admin user does not exist"**
- Create admin user: `node scripts/createAdmin.js`

**Error: "fetch is not defined"**
- Upgrade to Node.js 18+ which includes fetch natively
- Or install node-fetch: `npm install node-fetch`
