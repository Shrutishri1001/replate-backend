# Test Engineer Guide - FoodShare Platform

As a Test Engineer for FoodShare, your goal is to ensure the platform is reliable, secure, and user-friendly.

## 🧪 1. Automated Testing (Backend)

We have built-in scripts to verify the core API health.

**Run Health Checks:**
```bash
cd replate-backend
node test-backend.js
```
*   **What it checks**: Server status, DB connection, Login, Profile Fetch.
*   **Success Criteria**: All checks passed with green checkmarks.

**Run Registration Flow:**
```bash
node test-register.js
```
*   **What it checks**: Can a new user register? Does it handle duplicate emails correctly?

---

## 🖐️ 2. Manual Testing Scenarios

Perform these actions in the browser (`http://localhost:5173`) to verify end-to-end functionality.

### **Scenario A: User Onboarding**
1.  **Register**: Go to `/register`. Sign up as a "Donor".
    *   *Check*: Are you redirected to Login?
2.  **Login**: Use the new credentials.
    *   *Check*: Do you see the "Welcome Back" dashboard? Is the "New Donation" button visible?
3.  **Logout**: Click "Logout" in the sidebar.
    *   *Check*: Are you redirected back to Login?

### **Scenario B: Donation Flow (Donor)**
1.  **Create Donation**: Click "Donate Food". Fill in details ("Rice", "Veg", "5kg", "Today").
2.  **Submit**: Click "Submit Donation".
    *   *Check*: Do you see the "Success" animation?
3.  **Verify**: Go to "My Donations".
    *   *Check*: Is the new item listed at the top? Is the status "Pending"?

### **Scenario C: Search & Filter**
1.  **Navigate**: Go to "My Donations".
2.  **Search**: Type "Rice" in the search bar.
    *   *Check*: Does the list filter down to only show the Rice item?
3.  **Filter**: Select "Delivered" from the dropdown.
    *   *Check*: Does the list show correct items (or empty state)?

### **Scenario D: UI/UX & Responsiveness**
1.  **Mobile View**: Press `F12` -> Toggle Device Toolbar -> Select "iPhone 12".
    *   *Check*: Is the Sidebar hidden/collapsible? Is the text readable?
2.  **Theme**: Verify the dark theme is consistent (no blinding white backgrounds).

---

## 🐞 3. Bug Reporting Format

If you find an issue, report it to the dev team using this format:

*   **Title**: [Short description, e.g., "Login button disabled on mobile"]
*   **Severity**: Critical / Major / Minor
*   **Steps to Reproduce**:
    1. Go to Login page
    2. Enter valid email
    3. Observer 'Sign In' button
*   **Expected**: Button should be green and clickable.
*   **Actual**: Button is gray and unclickable.
