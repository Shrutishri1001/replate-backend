# Developer Guide - FoodShare Platform

This guide covers the setup, configuration, and running procedures for the FoodShare application (Frontend + Backend).

## 📋 Prerequisites

Ensure you have the following installed:
-   **Node.js** (v16.0.0 or higher) - [Download](https://nodejs.org/)
-   **MongoDB** (Local or Atlas) - [Download Community Server](https://www.mongodb.com/try/download/community)
-   **VS Code** (Recommended)

## 🛠️ Environment Configuration

### Backend (`/replate-backend`)
Create a `.env` file in the `replate-backend` directory with the following variables:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Connection
# If using local MongoDB:
MONGODB_URI=mongodb://localhost:27017/foodshare
# If using MongoDB Atlas:
# MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/foodshare

# Authentication Security
JWT_SECRET=your_super_secret_key_change_me_in_production
JWT_EXPIRE=30d
```

### Frontend (`/replate-frontend`)
Usually no `.env` is required for development as it proxies to `localhost:5000` by default.
If you need to change the API URL, creating a `.env` file:
```env
VITE_API_URL=http://localhost:5000/api
```

## 🚀 Installation & Running

It is recommended to run the backend and frontend in two separate terminals.

### 1. Setup Backend
```bash
cd replate-backend

# Install dependencies
npm install

# Start Development Server (with auto-reload)
npm run dev
```
*Expected Output:* `Server running in development mode on port 5000` and `MongoDB Connected`.

### 2. Setup Frontend
```bash
cd replate-frontend

# Install dependencies
npm install

# Start Development Server
npm run dev
```
*Expected Output:* `Local: http://localhost:5173/`

## 📂 Project Structure

```
root/
├── DEVELOPMENT.md          # This file
├── README.md               # Project Overview
├── replate-backend/        # Express API
│   ├── models/             # Database Schemas (User, Donation, Request)
│   ├── routes/             # API Endpoints
│   ├── controllers/        # Business Logic
│   └── test-backend.js     # Health Check Script
└── replate-frontend/       # React App
    ├── src/
    │   ├── components/     # Reusable UI (Navbar, Cards)
    │   ├── pages/          # Full Page Views (Login, Dashboard)
    │   └── context/        # Global State (AuthContext)
    └── public/             # Static Assets
```

## 🐞 Common Troubleshooting

**1. "MongoDB connection error"**
- Ensure MongoDB is running (`mongod` process).
- Check your `MONGODB_URI` in `.env`.

**2. "CORS Error" or API connection failed**
- Ensure Backend is running on port 5000.
- Check `replate-backend/server.js` cors settings allow request origin.

**3. Frontend "Module not found"**
- Try deleting `node_modules` and `package-lock.json` in frontend folder and run `npm install` again.
