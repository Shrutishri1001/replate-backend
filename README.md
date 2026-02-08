# FoodShare Backend API

Express.js backend with MongoDB for the FoodShare food redistribution platform.

## 🌟 Features

- **Authentication & Authorization**
  - JWT token-based authentication
  - Role-based access control (Donor, NGO, Volunteer, Admin)
  - Secure password hashing with bcrypt
  - User verification system (pending/approved status)

- **Admin Dashboard**
  - User management (CRUD operations)
  - Server-side pagination for user listings
  - Verification status management
  - Platform statistics and health monitoring
  - Role-specific filtering and search

- **User Management**
  - Multi-role user system with role-specific fields
  - Profile management
  - Status control (active/disabled)
  - Location-based data storage

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB (Local installation or Docker)
- npm or yarn package manager

## 🚀 Quick Start

### 1. Clone and Install

```bash
cd replate-backend
npm install
```

### 2. Configure Environment

Create a `.env` file in the project root:

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://admin:password123@localhost:27017/foodshare?authSource=admin
JWT_SECRET=your_jwt_secret_key_change_this_in_production
JWT_EXPIRE=30d
```

**⚠️ Important:** Change `JWT_SECRET` in production!

### 3. Start MongoDB

**Option A: Using Docker (Recommended)**
```bash
# From project root
docker-compose up -d
```

**Option B: Local MongoDB**
```bash
# Make sure MongoDB service is running
mongod --dbpath /path/to/data
```

**Verify MongoDB is running:**
```bash
docker ps | findstr foodshare_mongodb
```

### 4. Create Admin User

Before starting the server, create an admin account:

```bash
npm run create-admin
```

You'll be prompted to enter:
- Email address (for admin login)
- Password (minimum 6 characters)

**Example:**
```
✅ Connected to MongoDB
? Enter admin email: admin@foodshare.com
? Enter admin password: ******
✅ Admin user created successfully!
```

💡 **Tip:** You can create multiple admin accounts by running this command multiple times.

### 5. Start the Server

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

✅ Server will run on: `http://localhost:5000`

## 🔐 User Roles & Verification

### Role Types

#### 👤 **Admin**
- Full system access
- User management capabilities
- Platform monitoring
- Verification control
- Auto-approved on creation

#### 🤝 **Donor**
- Food donation management
- Organization details required
- Needs admin verification to access system

#### 🏢 **NGO**
- Request food from donors
- Registration number required
- Needs admin verification to access system

#### 🚴 **Volunteer**
- Delivery and logistics
- Needs admin verification to access system

### Verification Flow

1. **New User Registers** → Status: `pending`
2. **Admin Reviews** → Can approve/reject in dashboard
3. **User Approved** → Full system access granted
4. **Unverified Login Attempt** → Blocked with verification message

**Admin Override:** Admin-created users are automatically verified.

## 📡 API Endpoints

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
  "verificationStatus": "pending",
  "status": "active",
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
  "verificationStatus": "approved",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**🔒 Note:** Unverified users (except admins) will be blocked from accessing protected routes.

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <token>
```

### Admin Endpoints

All admin endpoints require authentication + admin role.

#### Get Dashboard Stats
```http
GET /api/admin/stats
Authorization: Bearer <token>
```

#### Get All Users (Paginated)
```http
GET /api/admin/users?page=1&limit=10&role=donor&search=john
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)
- `role` - Filter by role (donor/ngo/volunteer/admin)
- `search` - Search by name, email, or organization
- `status` - Filter by status (active/disabled)
- `verification` - Filter by verification status

#### Create User (Admin Only)
```http
POST /api/admin/users
Authorization: Bearer <token>
Content-Type: application/json

{
  "email": "newadmin@foodshare.com",
  "password": "password123",
  "fullName": "New Admin",
  "role": "admin"
}
```

**Note:** Admin can only create other admin users. Regular users must register via `/api/auth/register`.

#### Update User
```http
PUT /api/admin/users/:id
Authorization: Bearer <token>
```

#### Delete User
```http
DELETE /api/admin/users/:id
Authorization: Bearer <token>
```

#### Toggle User Status
```http
PUT /api/admin/users/:id/toggle-status
Authorization: Bearer <token>
```

#### Update Verification Status
```http
PUT /api/admin/users/:id/verification
Authorization: Bearer <token>
Content-Type: application/json

{
  "verificationStatus": "approved"
}
```

**Valid values:** `pending`, `under_review`, `approved`, `rejected`

## 📁 Project Structure

```
replate-backend/
├── config/
│   └── db.js                 # MongoDB connection
├── controllers/
│   ├── authController.js     # Authentication logic
│   ├── adminController.js    # Admin panel logic
│   ├── donationController.js # Donation management
│   ├── requestController.js  # NGO request handling
│   └── ...
├── middleware/
│   └── auth.js              # JWT verification & role checks
├── models/
│   ├── User.js              # User schema
│   ├── Donation.js          # Donation schema
│   ├── Request.js           # Request schema
│   └── Assignment.js        # Assignment schema
├── routes/
│   ├── auth.js              # Auth routes
│   ├── admin.js             # Admin routes
│   ├── donation.js          # Donation routes
│   └── ...
├── scripts/
│   └── createAdmin.js       # CLI tool for admin creation
├── .env                     # Environment variables
├── .gitignore
├── package.json
└── server.js                # Entry point
```

## 🐳 Docker Commands

```bash
# Start MongoDB
docker-compose up -d

# Stop MongoDB
docker-compose down

# View MongoDB logs
docker-compose logs -f mongodb

# Access MongoDB shell
docker exec -it foodshare_mongodb mongosh -u admin -p password123

# Restart MongoDB
docker-compose restart mongodb
```

## 🧪 Testing with cURL

### Register as Donor
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "donor@example.com",
    "password": "password123",
    "fullName": "Restaurant Owner",
    "phone": "1234567890",
    "role": "donor",
    "organizationName": "Food Paradise",
    "organizationType": "restaurant",
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
    "email": "admin@foodshare.com",
    "password": "yourpassword"
  }'
```

### Get Dashboard Stats (Admin)
```bash
curl -X GET http://localhost:5000/api/admin/stats \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🔧 Available Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start server in production mode |
| `npm run dev` | Start server with nodemon (auto-reload) |
| `npm run create-admin` | Create a new admin user (interactive) |

## 🛡️ Security Features

- **Password Hashing:** bcrypt with salt rounds
- **JWT Tokens:** Secure token generation with expiration
- **Role-Based Access:** Middleware protection for admin routes
- **Verification System:** Multi-level user approval process
- **Input Validation:** Express-validator for request validation
- **CORS Protection:** Configured for frontend origin

## 📝 Environment Variables Reference

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `5000` |
| `MONGODB_URI` | MongoDB connection string | (see .env) |
| `JWT_SECRET` | Secret key for JWT signing | (change in prod!) |
| `JWT_EXPIRE` | Token expiration time | `30d` |

## 🐛 Troubleshooting

### MongoDB Connection Issues
```bash
# Check if MongoDB container is running
docker ps

# Check MongoDB logs
docker logs foodshare_mongodb

# Restart MongoDB
docker-compose restart mongodb
```

### Port Already in Use
```bash
# Find process using port 5000 (Windows)
netstat -ano | findstr :5000

# Kill the process
taskkill /PID <PID> /F
```

### Admin Creation Fails
- Ensure MongoDB is running
- Check `.env` file has correct `MONGODB_URI`
- Verify admin email doesn't already exist

## 📚 Additional Resources

- [MongoDB Documentation](https://docs.mongodb.com/)
- [Express.js Guide](https://expressjs.com/)
- [JWT Best Practices](https://jwt.io/introduction)

## 📄 License

ISC