#!/usr/bin/env node

/**
 * Script to create an admin user in the database.
 * Usage: node scripts/createAdmin.js
 *
 * It will prompt for email and password interactively.
 */

const readline = require('readline');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load env vars from the backend root
dotenv.config({ path: require('path').resolve(__dirname, '..', '.env') });

const User = require('../models/User');
const connectDB = require('../config/db');

function prompt(question, hide = false) {
    return new Promise((resolve) => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });

        if (hide) {
            // Mask password input
            const stdin = process.stdin;
            const onData = (char) => {
                char = char.toString();
                if (char === '\n' || char === '\r' || char === '\u0004') {
                    stdin.removeListener('data', onData);
                } else if (char === '\u0003') {
                    // Ctrl+C
                    process.exit();
                } else {
                    // Clear the line and rewrite with asterisks
                    readline.clearLine(process.stdout, 0);
                    readline.cursorTo(process.stdout, 0);
                    process.stdout.write(question + '*'.repeat(rl.line.length));
                }
            };
            stdin.on('data', onData);
        }

        rl.question(question, (answer) => {
            rl.close();
            resolve(answer.trim());
        });
    });
}

async function main() {
    console.log('\n========================================');
    console.log('   Replate — Create Admin User');
    console.log('========================================\n');

    // Collect inputs
    const email = await prompt('Admin Email: ');
    if (!email) {
        console.error('❌ Email is required.');
        process.exit(1);
    }

    const password = await prompt('Admin Password: ', true);
    console.log(); // newline after hidden input
    if (!password || password.length < 6) {
        console.error('❌ Password is required and must be at least 6 characters.');
        process.exit(1);
    }

    const fullName = await prompt('Full Name (default: "Admin"): ') || 'Admin';
    const phone = await prompt('Phone (default: "0000000000"): ') || '0000000000';
    const address = await prompt('Address (default: "Admin Office"): ') || 'Admin Office';
    const city = await prompt('City (default: "Admin City"): ') || 'Admin City';
    const state = await prompt('State (default: "Admin State"): ') || 'Admin State';
    const pincode = await prompt('Pincode (default: "000000"): ') || '000000';

    // Connect to MongoDB
    console.log('\nConnecting to database...');
    await connectDB();

    // Check if admin already exists
    const existing = await User.findOne({ email });
    if (existing) {
        console.error(`\n❌ A user with email "${email}" already exists (role: ${existing.role}).`);
        await mongoose.connection.close();
        process.exit(1);
    }

    // Create admin user (password is auto-hashed by the User model pre-save hook)
    const admin = await User.create({
        email,
        password,
        fullName,
        phone,
        role: 'admin',
        status: 'active',
        verificationStatus: 'approved',
        address,
        city,
        state,
        pincode,
    });

    console.log('\n✅ Admin user created successfully!');
    console.log('   Email:', admin.email);
    console.log('   Role:', admin.role);
    console.log('   ID:', admin._id);

    await mongoose.connection.close();
    process.exit(0);
}

main().catch((err) => {
    console.error('\n❌ Error:', err.message);
    mongoose.connection.close().finally(() => process.exit(1));
});
