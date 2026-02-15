const request = require('supertest');
const app = require('../server');
const mongoose = require('mongoose');
const User = require('../models/User');

describe('User Endpoints', () => {
    let token;
    let userId;

    beforeEach(async () => {
        await User.deleteMany({});

        // Create and login a user
        const userData = {
            email: 'user@example.com',
            password: 'password123',
            fullName: 'Test User',
            phone: '1234567890',
            role: 'donor',
            address: '123 Test St',
            city: 'Test City',
            state: 'Test State',
            pincode: '123456'
        };

        const res = await request(app)
            .post('/api/auth/register')
            .send(userData);

        token = res.body.token;
        userId = res.body._id;
    });

    describe('GET /api/users/me', () => {
        it('should get current user profile', async () => {
            const res = await request(app)
                .get('/api/users/me')
                .set('Authorization', `Bearer ${token}`);

            expect(res.statusCode).toEqual(200);
            expect(res.body.email).toEqual('user@example.com');
            expect(res.body.fullName).toEqual('Test User');
            expect(res.body.role).toEqual('donor');
        });

        it('should return 401 without token', async () => {
            const res = await request(app)
                .get('/api/users/me');

            expect(res.statusCode).toEqual(401);
        });
    });

    describe('PUT /api/users/me', () => {
        it('should update user profile', async () => {
            const updateData = {
                fullName: 'Updated Name',
                phone: '9876543210',
                address: '456 New St'
            };

            const res = await request(app)
                .put('/api/users/me')
                .set('Authorization', `Bearer ${token}`)
                .send(updateData);

            expect(res.statusCode).toEqual(200);
            expect(res.body.fullName).toEqual('Updated Name');
            expect(res.body.phone).toEqual('9876543210');
        });

        it('should return 401 without token', async () => {
            const res = await request(app)
                .put('/api/users/me')
                .send({ fullName: 'Updated Name' });

            expect(res.statusCode).toEqual(401);
        });
    });

    describe('GET /api/users/search', () => {
        it('should search users by name', async () => {
            const res = await request(app)
                .get('/api/users/search')
                .query({ q: 'Test' })
                .set('Authorization', `Bearer ${token}`);

            expect(res.statusCode).toEqual(200);
            expect(Array.isArray(res.body)).toBe(true);
        });
    });

    describe('PUT /api/users/availability', () => {
        it('should update user availability', async () => {
            const res = await request(app)
                .put('/api/users/availability')
                .set('Authorization', `Bearer ${token}`)
                .send({ isAvailable: true });

            expect(res.statusCode).toEqual(200);
            expect(res.body.isAvailable).toEqual(true);
        });
    });

    describe('POST /api/users/volunteer-profile', () => {
        it('should create volunteer profile', async () => {
            const volunteerData = {
                vehicleType: 'car',
                maxDistanceKm: 10,
                yearsExperience: 2
            };

            const res = await request(app)
                .post('/api/users/volunteer-profile')
                .set('Authorization', `Bearer ${token}`)
                .send(volunteerData);

            expect(res.statusCode).toEqual(200);
        });
    });
});
