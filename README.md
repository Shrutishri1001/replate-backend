# FoodShare Backend API

Express.js backend with MongoDB for the FoodShare platform.

## Features

- User authentication (Register/Login)
- JWT token-based authorization
- Role-based user system (Donor, NGO, Volunteer)
- Password hashing with bcrypt
- Input validation
- MongoDB database

## Prerequisites

- Node.js (v14 or higher)
- Docker & Docker Compose
- MongoDB (via Docker)

## Quick Start

### 1. Start MongoDB with Docker

From the project root directory:

```bash
docker-compose up -d
```

This will start MongoDB in a container named `foodshare_mongodb` on port 27017.

**Verify MongoDB is running:**
```bash
docker ps | findstr foodshare_mongodb
```

### 2. Install Dependencies

```bash
cd replate-backend
npm install
```

### 3. Configure Environment

The `.env` file is already configured with:
- MongoDB connection string
- JWT secret
- Port configuration

**Important:** Change `JWT_SECRET` in production!

### 4. Start the Server

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

Server will run on: `http://localhost:5000`

## API Endpoints

### Authentication

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "fullName": "John Doe",
  "phone": "+1234567890",
  "role": "donor",
  "organizationName": "Food Restaurant",
  "organizationType": "restaurant",
  "address": "123 Main St",
  "city": "New York",
  "state": "NY",
  "pincode": "10001"
}
```

**Response:** 201 Created
```json
{
  "_id": "...",
  "email": "user@example.com",
  "fullName": "John Doe",
  "role": "donor",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Login User
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:** 200 OK
```json
{
  "_id": "...",
  "email": "user@example.com",
  "fullName": "John Doe",
  "role": "donor",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <token>
```

**Response:** 200 OK
```json
{
  "_id": "...",
  "email": "user@example.com",
  "fullName": "John Doe",
  "role": "donor",
  ...
}
```

## User Roles

### Donor
Required fields:
- email, password, fullName, phone, role
- organizationName, organizationType
- address, city, state, pincode

### NGO
Required fields:
- email, password, fullName, phone, role
- organizationName, organizationType
- registrationNumber, dailyCapacity
- address, city, state, pincode

### Volunteer
Required fields:
- email, password, fullName, phone, role
- address, city, state, pincode

## Project Structure

```
replate-backend/
├── config/
│   └── db.js              # MongoDB connection
├── controllers/
│   └── authController.js  # Auth logic
├── middleware/
│   └── auth.js            # JWT verification
├── models/
│   └── User.js            # User schema
├── routes/
│   └── auth.js            # Auth routes
├── .env                   # Environment variables
├── .gitignore
├── package.json
└── server.js              # Entry point
```

## Docker Commands

```bash
# Start MongoDB
docker-compose up -d

# Stop MongoDB
docker-compose down

# View MongoDB logs
docker-compose logs -f mongodb

# Access MongoDB shell
docker exec -it foodshare_mongodb mongosh -u admin -p password123
```

## Environment Variables

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://admin:password123@localhost:27017/foodshare?authSource=admin
JWT_SECRET=your_jwt_secret_key_change_this_in_production
JWT_EXPIRE=30d
```

## Testing with cURL

### Register
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "fullName": "Test User",
    "phone": "1234567890",
    "role": "volunteer",
    "address": "123 Main St",
    "city": "New York",
    "state": "NY",
    "pincode": "10001"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

## License

ISC