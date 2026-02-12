# Jest Testing Guide - FoodShare Backend

This document provides comprehensive information about the automated testing setup for the FoodShare backend using Jest.

## Table of Contents

1. [Overview](#overview)
2. [Test Framework & Tools](#test-framework--tools)
3. [Getting Started](#getting-started)
4. [Test Structure](#test-structure)
5. [Running Tests](#running-tests)
6. [Test Suites](#test-suites)
7. [Writing New Tests](#writing-new-tests)
8. [Troubleshooting](#troubleshooting)

---

## Overview

The FoodShare backend uses **Jest** for comprehensive automated testing. All tests are isolated using an in-memory MongoDB database, ensuring tests don't interfere with production data.

**Current Test Status:**
- ✅ **77 tests passing** across 8 test suites
- ✅ **100% test pass rate**
- ✅ **~14 second execution time**
- ✅ All major endpoints covered

---

## Test Framework & Tools

### Core Dependencies

| Tool | Version | Purpose |
|------|---------|---------|
| **Jest** | ^29.7.0 | Test runner and assertion library |
| **Supertest** | ^6.3.4 | HTTP assertion library for API testing |
| **MongoDB Memory Server** | ^9.1.6 | In-memory MongoDB for isolated testing |
| **Mongoose** | ^7.5.0 | MongoDB object modeling |

### Why These Tools?

- **Jest**: Industry standard for Node.js testing with excellent documentation and community support
- **Supertest**: Provides clean API for testing Express.js routes without spinning up actual servers
- **MongoDB Memory Server**: Ensures complete test isolation - no data persists between test runs
- **Mongoose**: Same ORM used in production, ensuring tests match real behavior

---

## Getting Started

### Prerequisites

- Node.js v16+ installed
- npm or yarn package manager
- Understanding of async/await and ES6 JavaScript
- Familiarity with HTTP status codes and REST APIs

### Installation

```bash
# Navigate to backend directory
cd replate-backend

# Install dependencies (if not already done)
npm install

# Verify installation
npm test -- --version
```

### Environment Setup

The test environment is automatically configured via `test/env.js`. Key settings:

```javascript
// Automatically set NODE_ENV to 'test'
process.env.NODE_ENV = 'test';

// MongoDB Memory Server automatically manages the database
// No connection string needed - tests are completely isolated
```

---

## Test Structure

### Directory Organization

```
replate-backend/
├── test/
│   ├── auth.test.js              # Authentication & registration tests
│   ├── user.test.js              # User profile & volunteer tests
│   ├── donation.test.js           # Donation CRUD operations
│   ├── request.test.js            # NGO request management
│   ├── assignment.test.js         # Volunteer assignment tests
│   ├── notification.test.js       # Notification management
│   ├── admin.test.js              # Admin dashboard & user management
│   ├── map.test.js                # Map & location services
│   ├── env.js                     # Test environment setup
│   ├── setup.js                   # Jest configuration
│   └── manual/                    # Manual testing scripts
│       ├── run-all-tests.js
│       ├── user-flows.test.js
│       └── admin-*.test.js
├── controllers/                   # API business logic
├── models/                        # Mongoose schemas
├── routes/                        # Express route definitions
└── middleware/                    # Authentication & other middleware
```

### Standard Test Pattern

Each test file follows this pattern:

```javascript
const request = require('supertest');
const app = require('../server');
const Model = require('../models/Model');

describe('Endpoint Group', () => {
    let token;
    let userId;

    beforeEach(async () => {
        // Clean database before each test
        await Model.deleteMany({});
        
        // Create test data
        const res = await request(app)
            .post('/api/endpoint')
            .send({ /* test data */ });
        
        token = res.body.token;
        userId = res.body._id;
    });

    afterEach(async () => {
        // Cleanup (automatically handled by Jest)
    });

    describe('GET /api/endpoint', () => {
        it('should return data for authenticated user', async () => {
            const res = await request(app)
                .get('/api/endpoint')
                .set('Authorization', `Bearer ${token}`);

            expect(res.statusCode).toEqual(200);
            expect(res.body).toBeDefined();
        });

        it('should return 401 without token', async () => {
            const res = await request(app)
                .get('/api/endpoint');

            expect(res.statusCode).toEqual(401);
        });
    });
});
```

---

## Running Tests

### Run All Tests

```bash
npm test
```

**Output:**
```
Test Suites: 8 passed, 8 total
Tests:       77 passed, 77 total
Time:        ~14.095 s
```

### Run Specific Test Suite

```bash
# Run only auth tests
npm test -- auth.test.js

# Run only donation tests
npm test -- donation.test.js

# Run multiple specific tests
npm test -- auth user donation
```

### Run Tests in Watch Mode

```bash
npm test -- --watch
```

Automatically re-runs tests when files change. Useful during development.

### Run with Coverage Report

```bash
npm test -- --coverage
```

Generates a coverage report showing:
- Lines covered
- Branches tested
- Functions exercised
- Statements executed

### Run with Verbose Output

```bash
npm test -- --verbose
```

Shows each test individually with detailed output.

### Run Single Test

```bash
npm test -- --testNamePattern="should create a new donation"
```

Runs only tests matching the specified pattern.

---

## Test Suites

### 1. Auth Tests (`auth.test.js`)
**Purpose:** Verify user registration and login functionality

**Tests:** 9 total
- ✅ Register new donor successfully
- ✅ Register new NGO successfully
- ✅ Prevent duplicate email registration
- ✅ Validate required fields
- ✅ Login with correct credentials
- ✅ Reject incorrect password
- ✅ Reject non-existent user
- ✅ Get current user profile
- ✅ Reject unauthorized requests

**Key Endpoints Tested:**
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

---

### 2. User Tests (`user.test.js`)
**Purpose:** Test user profile management and volunteer features

**Tests:** 7 total
- ✅ Get current user profile
- ✅ Update user profile (name, phone, address, etc.)
- ✅ Search users by name
- ✅ Update user availability status
- ✅ Create volunteer profile
- ✅ Handle unauthorized requests

**Key Endpoints Tested:**
- `GET /api/users/me`
- `PUT /api/users/me`
- `GET /api/users/search`
- `PUT /api/users/availability`
- `POST /api/users/volunteer-profile`

---

### 3. Donation Tests (`donation.test.js`)
**Purpose:** Test complete donation lifecycle

**Tests:** 10 total
- ✅ Create new donation with all required fields
- ✅ Reject invalid donation data
- ✅ Get all donations for donor
- ✅ Filter donations by status
- ✅ Get donation by ID
- ✅ Get non-existent donation (404)
- ✅ Update donation details
- ✅ Delete donation
- ✅ Handle unauthorized requests

**Key Endpoints Tested:**
- `POST /api/donations`
- `GET /api/donations`
- `GET /api/donations/:id`
- `PUT /api/donations/:id`
- `DELETE /api/donations/:id`

**Required Donation Fields:**
```javascript
{
    foodName: 'string',
    foodType: 'cooked|raw|packaged',
    quantity: number,
    unit: 'string',
    estimatedServings: number,
    preparationDate: 'YYYY-MM-DD',
    preparationTime: 'HH:MM',
    expiryDate: 'YYYY-MM-DD',
    expiryTime: 'HH:MM',
    storageCondition: 'string',
    pickupAddress: 'string',
    city: 'string',
    pickupDeadline: 'ISO8601 datetime',
    hygiene: {
        safeHandling: boolean,
        temperatureControl: boolean,
        properPackaging: boolean,
        noContamination: boolean
    }
}
```

---

### 4. Request Tests (`request.test.js`)
**Purpose:** Test NGO food request management

**Tests:** 8 total
- ✅ Create new request for donation
- ✅ Reject non-existent donation (404)
- ✅ Get all requests for NGO
- ✅ Filter requests by status
- ✅ Get request by ID
- ✅ Update request status
- ✅ Delete request
- ✅ Handle unauthorized requests

**Key Endpoints Tested:**
- `POST /api/requests`
- `GET /api/requests`
- `GET /api/requests/:id`
- `PUT /api/requests/:id`
- `DELETE /api/requests/:id`

---

### 5. Assignment Tests (`assignment.test.js`)
**Purpose:** Test volunteer assignment and pickup workflow

**Tests:** 12 total
- ✅ Allow volunteer to claim available donation
- ✅ Fail if donation doesn't exist
- ✅ Fail if volunteer capacity too low
- ✅ Get volunteer's active assignment
- ✅ Get available assignments (with city filtering)
- ✅ Get assignment map data

**Key Endpoints Tested:**
- `POST /api/assignments/claim`
- `GET /api/assignments/volunteer-active`
- `GET /api/assignments/available`
- `GET /api/assignments/:id/map`

---

### 6. Notification Tests (`notification.test.js`)
**Purpose:** Test user notification system

**Tests:** 8 total
- ✅ Get all user notifications
- ✅ Get unread notification count
- ✅ Mark notification as read
- ✅ Delete individual notification
- ✅ Mark all notifications as read
- ✅ Clear all notifications
- ✅ Handle 404 for non-existent notification
- ✅ Handle unauthorized requests

**Key Endpoints Tested:**
- `GET /api/notifications`
- `GET /api/notifications/unread-count`
- `PUT /api/notifications/:id/read`
- `DELETE /api/notifications/:id`
- `PUT /api/notifications/mark-all-read`
- `DELETE /api/notifications/clear-all`

**Notification Types (Enums):**
- `new_assignment`
- `assignment_update`
- `status_update`
- `general`

---

### 7. Admin Tests (`admin.test.js`)
**Purpose:** Test admin dashboard and user management

**Tests:** 15 total
- ✅ Get dashboard statistics
- ✅ Get all users (with role filtering)
- ✅ Get user details by ID
- ✅ Update user status
- ✅ Promote user to admin
- ✅ Delete user
- ✅ Get all donations
- ✅ Filter donations by status
- ✅ Get all requests
- ✅ Get all assignments
- ✅ Get analytics data
- ✅ Filter analytics by date range
- ✅ Deny non-admin access
- ✅ Return 401 without token

**Key Endpoints Tested:**
- `GET /api/admin/stats`
- `GET /api/admin/users`
- `GET /api/admin/users/:id`
- `PUT /api/admin/users/:id`
- `DELETE /api/admin/users/:id`
- `GET /api/admin/donations`
- `GET /api/admin/requests`
- `GET /api/admin/assignments`

**Admin Role Requirements:**
- Must have `role: 'admin'` and `isAdmin: true` in database
- Must provide valid JWT token with admin role in payload

---

### 8. Map Tests (`map.test.js`)
**Purpose:** Test map visualization and location services

**Tests:** 12 total
- ✅ Get nearby donations (with location filtering)
- ✅ Get active assignments
- ✅ Calculate route between two locations
- ✅ Validate coordinate format
- ✅ Validate location search
- ✅ Update volunteer location
- ✅ Get NGO list
- ✅ Handle missing coordinates (400)
- ✅ Handle invalid radius (400)

**Key Endpoints Tested:**
- `GET /api/map/donations`
- `GET /api/map/volunteers`
- `GET /api/map/ngos`
- `GET /api/map/active-assignments`
- `GET /api/map/calculate-route`
- `GET /api/map/location-search`
- `GET /api/map/nearby-donations`
- `PUT /api/map/update-location`

**Location Format:**
```javascript
{
    lat: number,      // latitude (-90 to 90)
    lng: number,      // longitude (-180 to 180)
    address: 'string' // optional
}
```

---

## Writing New Tests

### Step 1: Create Test File

Create a new file in the `test/` directory:

```bash
touch test/feature.test.js
```

### Step 2: Import Dependencies

```javascript
const request = require('supertest');
const app = require('../server');
const Model = require('../models/Model');
const User = require('../models/User');
```

### Step 3: Set Up Test Suite

```javascript
describe('Feature Name', () => {
    let token;
    let userId;
    let testDataId;

    beforeEach(async () => {
        // Clean database
        await Model.deleteMany({});
        await User.deleteMany({});

        // Create test user
        const userRes = await request(app)
            .post('/api/auth/register')
            .send({
                email: 'test@example.com',
                password: 'password123',
                fullName: 'Test User',
                phone: '1234567890',
                role: 'donor',
                address: '123 Test St',
                city: 'Test City',
                state: 'Test State',
                pincode: '123456'
            });

        token = userRes.body.token;
        userId = userRes.body._id;
    });
});
```

### Step 4: Write Test Cases

```javascript
describe('POST /api/feature', () => {
    it('should create resource successfully', async () => {
        const res = await request(app)
            .post('/api/feature')
            .set('Authorization', `Bearer ${token}`)
            .send({
                name: 'Test Resource',
                description: 'A test resource'
            });

        expect(res.statusCode).toEqual(201);
        expect(res.body).toHaveProperty('_id');
        expect(res.body.name).toEqual('Test Resource');
    });

    it('should return 400 with missing fields', async () => {
        const res = await request(app)
            .post('/api/feature')
            .set('Authorization', `Bearer ${token}`)
            .send({
                description: 'Missing name'
            });

        expect(res.statusCode).toEqual(400);
    });

    it('should return 401 without token', async () => {
        const res = await request(app)
            .post('/api/feature')
            .send({
                name: 'Test',
                description: 'Test'
            });

        expect(res.statusCode).toEqual(401);
    });
});
```

### Step 5: Run Tests

```bash
npm test -- feature.test.js
```

### Best Practices

1. **Use Descriptive Test Names**
   ```javascript
   // ✅ Good
   it('should create donation and return 201 status code', async () => {});

   // ❌ Bad
   it('works', async () => {});
   ```

2. **Test One Thing Per Test**
   ```javascript
   // ✅ Good - tests one thing
   it('should return 200 status code', async () => {
       const res = await request(app).get('/api/endpoint');
       expect(res.statusCode).toEqual(200);
   });

   // ❌ Bad - tests multiple things
   it('should work', async () => {
       const res = await request(app).get('/api/endpoint');
       expect(res.statusCode).toEqual(200);
       expect(res.body).toHaveProperty('data');
       expect(res.body.data).toHaveProperty('_id');
   });
   ```

3. **Clean Up After Tests**
   ```javascript
   afterEach(async () => {
       // Optional - Jest cleans up automatically
       await Model.deleteMany({});
   });
   ```

4. **Test Both Success and Failure Cases**
   ```javascript
   describe('Login', () => {
       it('should login successfully', async () => { /* ... */ });
       it('should reject incorrect password', async () => { /* ... */ });
       it('should reject non-existent user', async () => { /* ... */ });
   });
   ```

5. **Use Helper Functions**
   ```javascript
   const getValidDonationData = () => ({
       foodName: 'Rice',
       foodType: 'cooked',
       // ... all required fields
   });

   it('should create donation', async () => {
       const res = await request(app)
           .post('/api/donations')
           .set('Authorization', `Bearer ${token}`)
           .send(getValidDonationData());

       expect(res.statusCode).toEqual(201);
   });
   ```

---

## Troubleshooting

### Issue: Tests Timeout

**Problem:** `Jest did not exit one second after the test run has completed`

**Solution:**
```bash
# Increase timeout in jest.config.js
testTimeout: 30000  // 30 seconds
```

**Or** in specific test:
```javascript
it('slow test', async () => {
    // test code
}, 30000); // 30 second timeout
```

### Issue: Port Already in Use

**Problem:** `EADDRINUSE: address already in use :::5000`

**Solution:**
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9

# Then run tests again
npm test
```

### Issue: MongoDB Connection Failed

**Problem:** `MongooseError: connection timeout`

**Solution:**
```bash
# Clear MongoDB Memory Server cache
rm -rf ./node_modules/.cache

# Reinstall
npm install

# Run tests
npm test
```

### Issue: Test Data Not Persisting Between Tests

**This is intentional!** Each test gets a clean database via `beforeEach()`. This ensures:
- No test affects another test
- Tests are completely isolated
- Results are reproducible

If you need data to persist within a single test, use nested `describe()` blocks:

```javascript
describe('Feature', () => {
    let resourceId;

    describe('nested suite', () => {
        beforeEach(async () => {
            const res = await request(app).post('/api/feature');
            resourceId = res.body._id;
        });

        it('test 1', async () => {
            // resourceId is available here
        });

        it('test 2', async () => {
            // resourceId is still available here
        });
    });
});
```

### Issue: Tests Failing Inconsistently (Flaky Tests)

**Problem:** Same test passes sometimes, fails other times

**Causes & Solutions:**
1. **Timing issues** - Use `async/await` properly
   ```javascript
   // ❌ Bad
   it('test', () => {
       request(app).post('/api/endpoint');
       expect(res.statusCode).toEqual(201); // Not awaited!
   });

   // ✅ Good
   it('test', async () => {
       const res = await request(app).post('/api/endpoint');
       expect(res.statusCode).toEqual(201);
   });
   ```

2. **Race conditions** - Clean database before each test
   ```javascript
   beforeEach(async () => {
       await Model.deleteMany({}); // Always clean first
   });
   ```

3. **Random data** - Use consistent test data
   ```javascript
   // ❌ Bad
   const randomId = Math.random();

   // ✅ Good
   const testId = '507f1f77bcf86cd799439011';
   ```

### Issue: Cannot Find Module

**Problem:** `Cannot find module '../models/Model'`

**Solution:**
1. Verify file path is correct
2. Check file exists in the directory
3. Ensure file is exported: `module.exports = Model;`
4. Clear node cache: `rm -rf node_modules/.cache`

### Issue: Database Lock

**Problem:** `MongooseError: Cannot create db if already locked`

**Solution:**
```bash
# Kill all node processes
killall node

# Clear MongoDB Memory Server
rm -rf ./node_modules/.cache/mongodb-memory-server

# Run tests
npm test
```

---

## Common Assertions

### Status Codes

```javascript
expect(res.statusCode).toEqual(200);
expect(res.statusCode).toEqual(201);      // Created
expect(res.statusCode).toEqual(400);      // Bad request
expect(res.statusCode).toEqual(401);      // Unauthorized
expect(res.statusCode).toEqual(403);      // Forbidden
expect(res.statusCode).toEqual(404);      // Not found
expect(res.statusCode).toEqual(500);      // Server error
```

### Response Properties

```javascript
expect(res.body).toBeDefined();
expect(res.body).toHaveProperty('_id');
expect(res.body).toHaveProperty('data');
expect(Array.isArray(res.body)).toBe(true);
expect(res.body.length).toEqual(5);
```

### String Matching

```javascript
expect(res.body.message).toEqual('Success');
expect(res.body.message).toContain('Created');
expect(res.body.message).toMatch(/created/i);
```

### Type Checking

```javascript
expect(typeof res.body._id).toBe('string');
expect(typeof res.body.count).toBe('number');
expect(typeof res.body.isActive).toBe('boolean');
```

---

## Continuous Integration

### GitHub Actions Example

Create `.github/workflows/test.yml`:

```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: 18
      - run: cd replate-backend && npm install
      - run: cd replate-backend && npm test -- --coverage
      - uses: codecov/codecov-action@v2
```

---

## Resources

- [Jest Documentation](https://jestjs.io/)
- [Supertest GitHub](https://github.com/visionmedia/supertest)
- [MongoDB Memory Server](https://github.com/nodkz/mongodb-memory-server)
- [Express Testing Guide](https://expressjs.com/en/guide/testing.html)

---

## Support

For issues or questions:
1. Check the [Troubleshooting](#troubleshooting) section
2. Review similar tests in the codebase
3. Check Jest/Supertest documentation
4. Ask team members for guidance

---

**Last Updated:** February 12, 2026
**Total Tests:** 77 passing
**Pass Rate:** 100%
