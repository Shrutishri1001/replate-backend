const request = require('supertest');
const app = require('../server');
const mongoose = require('mongoose');
const User = require('../models/User');

describe('Auth Endpoints', () => {
    // Clean up users before tests
    beforeEach(async () => {
        await User.deleteMany({});
    });

    const donorData = {
        email: 'donor@example.com',
        password: 'password123',
        fullName: 'Donor User',
        phone: '1234567890',
        role: 'donor',
        address: '123 Donor St',
        city: 'Donor City',
        state: 'Donor State',
        pincode: '123456',
        organizationName: 'Food Bank Inc',
        organizationType: 'Non-profit'
    };

    const ngoData = {
        email: 'ngo@example.com',
        password: 'password123',
        fullName: 'NGO User',
        phone: '0987654321',
        role: 'ngo',
        address: '456 NGO Rd',
        city: 'NGO City',
        state: 'NGO State',
        pincode: '654321',
        registrationNumber: 'NGO-123',
        dailyCapacity: 50
    };

    describe('POST /api/auth/register', () => {
        it('should register a new donor successfully', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send(donorData);

            expect(res.statusCode).toEqual(201);
            expect(res.body).toHaveProperty('token');
            expect(res.body.user).toBeUndefined(); // The controller returns user fields directly at top level + token
            expect(res.body.email).toEqual(donorData.email);
            expect(res.body.role).toEqual('donor');
        });

        it('should register a new NGO successfully', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send(ngoData);

            expect(res.statusCode).toEqual(201);
            expect(res.body.role).toEqual('ngo');
            expect(res.body.dailyCapacity).toEqual(ngoData.dailyCapacity);
        });

        it('should not register a user with existing email', async () => {
            // First registration
            await request(app).post('/api/auth/register').send(donorData);

            // Second registration with same email
            const res = await request(app)
                .post('/api/auth/register')
                .send(donorData);

            expect(res.statusCode).toEqual(400);
            expect(res.body.message).toContain('User already exists');
        });

        it('should validate required fields', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    email: 'test@test.com',
                    // Missing password and others
                });

            expect(res.statusCode).toEqual(400); // Controller likely returns 400 for validation errors
            expect(res.body).toHaveProperty('errors');
        });
    });

    describe('POST /api/auth/login', () => {
        beforeEach(async () => {
            // Create a user for login tests
            await request(app).post('/api/auth/register').send(donorData);
        });

        it('should login with correct credentials', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: donorData.email,
                    password: donorData.password
                });

            expect(res.statusCode).toEqual(200); // 200 implied as default
            expect(res.body).toHaveProperty('token');
            expect(res.body.email).toEqual(donorData.email);
        });

        it('should not login with incorrect password', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: donorData.email,
                    password: 'wrongpassword'
                });

            expect(res.statusCode).toEqual(401);
            expect(res.body.message).toEqual('Invalid email or password');
        });

        it('should not login with non-existent email', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'nonexistent@example.com',
                    password: 'password123'
                });

            expect(res.statusCode).toEqual(401);
        });
    });

    describe('GET /api/auth/me', () => {
        let token;

        beforeEach(async () => {
            const res = await request(app).post('/api/auth/register').send(donorData);
            token = res.body.token;
        });

        it('should return current user profile', async () => {
            const res = await request(app)
                .get('/api/auth/me')
                .set('Authorization', `Bearer ${token}`);

            expect(res.statusCode).toEqual(200);
            expect(res.body.email).toEqual(donorData.email);
        });

        it('should return 401 without token', async () => {
            const res = await request(app).get('/api/auth/me');
            expect(res.statusCode).toEqual(401);
        });
    });
});
