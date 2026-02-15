# API Testing Guide

This document outlines the API testing procedures using the provided Postman collection (`Replate_API_Collection.postman_collection.json`).

## 📥 Setup

1.  **Install Postman**: Download and install [Postman](https://www.postman.com/downloads/).
2.  **Import Collection**:
    *   Open Postman.
    *   Click **Import** in the top left.
    *   Drag and drop the `Replate_API_Collection.postman_collection.json` file.
3.  **Environment Variables**:
    *   The collection uses `{{base_url}}`.
    *   Ensure your backend server is running locally on port `5001`.
    *   Create a Postman Environment with `base_url` set to `http://localhost:5001`, OR simply find-and-replace `{{base_url}}` with `http://localhost:5001` in the collection.

## 🧪 Scenarios & Endpoints

### 1. Authentication (`/api/auth`)
Testing the user lifecycle and security.

| Request Name | Method | Endpoint | Description |
| :--- | :--- | :--- | :--- |
| **Register - Donor** | `POST` | `/register` | Creates a new Donor. Saves token to `{{donor_token}}`. |
| **Register - NGO** | `POST` | `/register` | Creates a new NGO. Saves token to `{{ngo_token}}`. |
| **Register - Volunteer** | `POST` | `/register` | Creates a new Volunteer. Saves token to `{{volunteer_token}}`. |
| **Login** | `POST` | `/login` | Authenticates user options. Returns JWT token. |
| **Get Current User** | `GET` | `/me` | Validates token and returns profile data. |

### 2. Donation Workflow (`/api/donations`)
Main flow: Donor creates donation -> NGO sees it.

| Request Name | Method | Endpoint | Description |
| :--- | :--- | :--- | :--- |
| **Create Donation** | `POST` | `/` | (Donor) Lists a new food item. |
| **Get All Donations** | `GET` | `/` | (Donor) Views their own history. |
| **Get Available Donations** | `GET` | `/available` | (NGO) Lists unclaimed donations. |
| **Get Single Donation** | `GET` | `/:id` | Fetch details of a specific donation. |
| **Update Donation** | `PUT` | `/:id` | (Donor) Edits donation details. |
| **Delete Donation** | `DELETE` | `/:id` | (Donor) Removes a donation. |

### 3. Request Workflow (`/api/requests`)
Main flow: NGO claims a donation.

| Request Name | Method | Endpoint | Description |
| :--- | :--- | :--- | :--- |
| **Create Request** | `POST` | `/` | (NGO) Claims an available donation. |
| **Get My Requests** | `GET` | `/my-requests` | (NGO) Views their active requests. |

### 4. Assignment Workflow (`/api/assignments`)
Main flow: Volunteer accepts task -> Picks up -> Delivers.

| Request Name | Method | Endpoint | Description |
| :--- | :--- | :--- | :--- |
| **Get Available Assignments** | `GET` | `/available` | (Volunteer) Shows pending pickups. |
| **Accept Assignment** | `POST` | `/:id/accept` | (Volunteer) Claims a pickup task. |
| **Update Status** | `PUT` | `/:id/status` | Updates status (Accepted -> Picked Up -> Delivered). |

### 5. Admin Operations (`/api/admin`)

| Request Name | Method | Endpoint | Description |
| :--- | :--- | :--- | :--- |
| **Get All Users** | `GET` | `/users` | Lists all platform users. |
| **Get Dashboard Stats** | `GET` | `/stats` | System-wide statistics. |
| **Verify NGO** | `PUT` | `/verify-ngo/:id` | Approves NGO verification status. |

## 🔄 End-to-End Testing Flow

To test the complete lifecycle, run these requests in order:

1.  **Register a Donor** -> Copy Token.
2.  **Register an NGO** -> Copy Token.
3.  **Register a Volunteer** -> Copy Token.
4.  **Create Donation** (as Donor).
5.  **Get Available Donations** (as NGO) -> Copy `donationId`.
6.  **Create Request** (as NGO) using `donationId`.
7.  **Verify Donation Status** is now "claimed" or "pending".
8.  **Get Available Assignments** (as Volunteer).
9.  **Accept Assignment** (as Volunteer).
10. **Update Status** to `picked_up`, then `delivered`.

## ✅ Status Codes

-   `200 OK`: Success.
-   `201 Created`: Resource created successfully.
-   `400 Bad Request`: Validation error or missing data.
-   `401 Unauthorized`: Missing or invalid JWT token.
-   `403 Forbidden`: User does not have the required role (e.g., Donor trying to access Admin route).
-   `404 Not Found`: Resource does not exist.
-   `500 Server Error`: Backend crash or logic error.
