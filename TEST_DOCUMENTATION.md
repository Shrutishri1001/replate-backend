# Replate (FINAL_SE) - Testing Documentation

This document outlines the testing strategy, frameworks, and coverage implemented for the **Replate (FINAL_SE)** backend. The testing suite ensures the reliability of authentication, donation management, volunteer assignment workflows, and business logic validation.

## 1. Testing Framework & Tools

*   **Test Runner**: `Jest`
    *   Used for running unit and integration tests.
    *   Provides powerful assertions and mocking capabilities.
*   **API Testing**: `Supertest`
    *   Used to simulate HTTP requests to the Express application.
    *   Allows testing API endpoints without running the server manually.
*   **Database Mocking**: `mongodb-memory-server`
    *   Spins up an in-memory MongoDB instance for tests.
    *   Ensures tests run in isolation and do not affect the main database.
*   **Environment**: Test-specific environment variables are loaded via `test/env.js`.

---

## 2. Test Structure

Tests are located in the `/test` directory.

### **File Organization**
*   `jest.config.js`: Main configuration file for Jest (timeouts, environment setup).
*   `test/setup.js`: Global setup/teardown logic (connecting/disconnecting in-memory DB).
*   `test/env.js`: Environment variables specifically for the test runtime.
*   `test/auth.test.js`: Validates all authentication flows.
*   `test/assignment.test.js`: Validates the volunteer assignment and matching logic.
*   `test/manual/`: Contains older manual test scripts (deprecated but kept for reference).

---

## 3. Test Coverage

### **3.1 Authentication Tests (`test/auth.test.js`)**
Verifies user registration, login, and token validation for all roles (Donor, NGO, Volunteer).

| Test Case | Description | Expected Outcome |
| :--- | :--- | :--- |
| **Register Donor** | Registers a new donor with unique email. | `201 Created` + JWT Token |
| **Register NGO** | Registers a new NGO with capacity details. | `201 Created` + JWT Token |
| **Duplicate Email** | Attempts to register with an existing email. | `400 Bad Request` |
| **Invalid Input** | Submits form with missing required fields. | `400 Bad Request` |
| **Login Success** | Logs in with valid credentials. | `200 OK` + JWT Token |
| **Login Failure** | Logs in with incorrect password/email. | `401 Unauthorized` |
| **Get Profile (Me)** | Fetches user profile using a valid token. | `200 OK` + Profile Data |
| **Unauth Access** | Accesses protected route without token. | `401 Unauthorized` |

### **3.2 Assignment & Matching Tests (`test/assignment.test.js`)**
Verifies the core business logic for matching donations to volunteers based on location, schedule, and capacity.

| Test Case | Description | Expected Outcome |
| :--- | :--- | :--- |
| **Claim Donation** | Volunteer claims an available donation. | `201 Created` + Status: `assigned` |
| **Claim Non-Existent** | Volunteer acts on invalid donation ID. | `404 Not Found` |
| **Capacity Check** | Volunteer capacity < Donation quantity. | `400 Bad Request` (Capacity Error) |
| **List Available** | Fetches available assignments for volunteer. | `200 OK` + List of Donations |
| **City Filtering** | Donation is in a different city than volunteer. | Donation **excluded** from list |
| **Map Data** | Fetches location data for tracking map. | `200 OK` + Lat/Lng Coordinates |

---

## 4. How to Run Tests

### **Prerequisites**
Ensure dependencies are installed:
```bash
npm install
```

### **Command**
Run the full test suite using the configured npm script:
```bash
npm test
```

### **Expected Output**
The console will display the status of each test suite (`PASS` or `FAIL`) along with a summary of the total tests run and time taken.

e.g.
```
PASS  test/auth.test.js
PASS  test/assignment.test.js

Test Suites: 2 passed, 2 total
Tests:       12 passed, 12 total
Snapshots:   0 total
Time:        4.23s
```

---

## 5. Mock Data Strategy

*   **Fresh State**: Before each test suite (`beforeEach`), the database is cleared using `User.deleteMany({})`, `Donation.deleteMany({})`, etc.
*   **Seed Data**: Helper functions create fresh Users (Donor, NGO, Volunteer) and Donations needed for specific tests inside the `beforeEach` block.
*   **Isolation**: This ensures that Test A (e.g., successful login) does not interfere with Test B (e.g., duplicate registration).

## 6. Future Test Areas
*   **Notification Testing**: Verify that notifications are triggered upon status changes.
*   **Delivery Completion**: Simulate the full `pick-up` -> `in-transit` -> `delivered` lifecycle.
*   **Admin Actions**: Test admin verification endpoints using an admin token.
