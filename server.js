const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const PORT = process.env.PORT ?? 5000;
// Load env vars
dotenv.config();

// Connect to database
// Connect to database (now handled conditionally)
// connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: false }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/user'));
app.use('/api/donations', require('./routes/donation'));
app.use('/api/requests', require('./routes/request'));
app.use('/api/assignments', require('./routes/assignment'));
app.use('/api/map', require('./routes/map'));
app.use('/api/notifications', require('./routes/notification'));
app.use('/api/admin', require('./routes/admin'));

// Basic route
app.get('/', (req, res) => {
    res.json({ message: 'FoodShare API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

// Only listen if run directly
if (require.main === module) {
    // Connect to database only when running server
    connectDB();

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    });
}

module.exports = app;



