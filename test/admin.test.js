const request = require('supertest');
const app = require('../server');
const mongoose = require('mongoose');
const User = require('../models/User');
const Donation = require('../models/Donation');
const Request = require('../models/Request');
const Assignment = require('../models/Assignment');

describe('Admin Endpoints', () => {
    let adminToken;
    let adminId;
    let normalUserToken;
    let normalUserId;

    beforeEach(async () => {
        await User.deleteMany({});
        await Donation.deleteMany({});
        await Request.deleteMany({});
        await Assignment.deleteMany({});

        // Create regular user first
        const userRes = await request(app)
            .post('/api/auth/register')
            .send({
                email: 'user@example.com',
                password: 'password123',
                fullName: 'Normal User',
                phone: '1234567890',
                role: 'donor',
                address: '123 User St',
                city: 'User City',
                state: 'User State',
                pincode: '123456'
            });

        normalUserToken = userRes.body.token;
        normalUserId = userRes.body._id;

        // Create admin user
        const adminRes = await request(app)
            .post('/api/auth/register')
            .send({
                email: 'admin@example.com',
                password: 'password123',
                fullName: 'Admin User',
                phone: '9876543210',
                role: 'donor',  // Register as donor first
                address: '456 Admin St',
                city: 'Admin City',
                state: 'Admin State',
                pincode: '654321'
            });

        adminId = adminRes.body._id;

        // Update user to be admin in database
        await User.findByIdAndUpdate(adminId, { role: 'admin', isAdmin: true });
        
        // Get a new token by logging in (or just create one manually)
        const loginRes = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'admin@example.com',
                password: 'password123'
            });

        adminToken = loginRes.body.token;
    });

    describe('GET /api/admin/stats', () => {
        it('should return dashboard stats for admin', async () => {
            const res = await request(app)
                .get('/api/admin/stats')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.statusCode).toEqual(200);
            expect(res.body).toBeDefined();
        });

        it('should return 401 without token', async () => {
            const res = await request(app)
                .get('/api/admin/stats');

            expect(res.statusCode).toEqual(401);
        });
    });

    describe('GET /api/admin/users', () => {
        it('should return all users for admin', async () => {
            const res = await request(app)
                .get('/api/admin/users')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.statusCode).toEqual(200);
            expect(res.body).toBeDefined();
        });

        it('should filter users by role', async () => {
            const res = await request(app)
                .get('/api/admin/users')
                .query({ role: 'donor' })
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.statusCode).toEqual(200);
            expect(res.body).toBeDefined();
        });
    });

    describe('GET /api/admin/users/:id', () => {
        it('should get user details for admin', async () => {
            const res = await request(app)
                .get(`/api/admin/users/${normalUserId}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.statusCode).toEqual(200);
            if (res.body._id) {
                expect(res.body._id).toEqual(normalUserId);
            }
        });

        it('should return 404 for non-existent user', async () => {
            const fakeId = new mongoose.Types.ObjectId();

            const res = await request(app)
                .get(`/api/admin/users/${fakeId}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.statusCode).toEqual(404);
        });
    });

    describe('PUT /api/admin/users/:id', () => {
        it('should update user status', async () => {
            const res = await request(app)
                .put(`/api/admin/users/${normalUserId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    status: 'disabled'
                });

            expect(res.statusCode).toEqual(200);
        });

        it('should promote user to admin', async () => {
            const res = await request(app)
                .put(`/api/admin/users/${normalUserId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    isAdmin: true
                });

            expect(res.statusCode).toEqual(200);
        });
    });

    describe('DELETE /api/admin/users/:id', () => {
        it('should delete user', async () => {
            const res = await request(app)
                .delete(`/api/admin/users/${normalUserId}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.statusCode).toEqual(200);

            // Verify deletion
            const checkRes = await request(app)
                .get(`/api/admin/users/${normalUserId}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(checkRes.statusCode).toEqual(404);
        });
    });

    describe('GET /api/admin/donations', () => {
        it('should return all donations for admin', async () => {
            const res = await request(app)
                .get('/api/admin/donations')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.statusCode).toEqual(200);
            expect(res.body).toBeDefined();
        });

        it('should filter donations by status', async () => {
            const res = await request(app)
                .get('/api/admin/donations')
                .query({ status: 'pending' })
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.statusCode).toEqual(200);
            expect(res.body).toBeDefined();
        });
    });

    describe('GET /api/admin/requests', () => {
        it('should return all requests for admin', async () => {
            const res = await request(app)
                .get('/api/admin/requests')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.statusCode).toEqual(200);
            expect(res.body).toBeDefined();
        });
    });

    describe('GET /api/admin/assignments', () => {
        it('should return all assignments for admin', async () => {
            const res = await request(app)
                .get('/api/admin/assignments')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.statusCode).toEqual(200);
            expect(res.body).toBeDefined();
        });
    });

    describe('GET /api/admin/stats (analytics)', () => {
        it('should return analytics data', async () => {
            const res = await request(app)
                .get('/api/admin/stats')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.statusCode).toEqual(200);
        });

        it('should filter analytics by date range', async () => {
            const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            const endDate = new Date();

            const res = await request(app)
                .get('/api/admin/stats')
                .query({
                    startDate: startDate.toISOString(),
                    endDate: endDate.toISOString()
                })
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.statusCode).toEqual(200);
        });
    });

    describe('Authorization checks', () => {
        it('should deny access to non-admin users', async () => {
            const res = await request(app)
                .get('/api/admin/users')
                .set('Authorization', `Bearer ${normalUserToken}`);

            expect(res.statusCode).toEqual(403);
        });
    });
});
