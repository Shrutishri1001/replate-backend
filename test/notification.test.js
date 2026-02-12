const request = require('supertest');
const app = require('../server');
const mongoose = require('mongoose');
const Notification = require('../models/Notification');
const User = require('../models/User');

describe('Notification Endpoints', () => {
    let token;
    let userId;
    let notificationId;

    beforeEach(async () => {
        await User.deleteMany({});
        await Notification.deleteMany({});

        // Create user
        const res = await request(app)
            .post('/api/auth/register')
            .send({
                email: 'user@example.com',
                password: 'password123',
                fullName: 'Test User',
                phone: '1234567890',
                role: 'donor',
                address: '123 Test St',
                city: 'Test City',
                state: 'Test State',
                pincode: '123456'
            });

        token = res.body.token;
        userId = res.body._id;

        // Create a notification
        const notification = await Notification.create({
            recipient: userId,
            title: 'Test Notification',
            message: 'This is a test notification',
            type: 'general',
            isRead: false
        });

        notificationId = notification._id;
    });

    describe('GET /api/notifications', () => {
        it('should get all notifications for user', async () => {
            const res = await request(app)
                .get('/api/notifications')
                .set('Authorization', `Bearer ${token}`);

            expect(res.statusCode).toEqual(200);
            expect(res.body).toBeDefined();
        });

        it('should return 401 without token', async () => {
            const res = await request(app)
                .get('/api/notifications');

            expect(res.statusCode).toEqual(401);
        });
    });

    describe('GET /api/notifications/unread-count', () => {
        it('should get unread notification count', async () => {
            const res = await request(app)
                .get('/api/notifications/unread-count')
                .set('Authorization', `Bearer ${token}`);

            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty('count');
            expect(typeof res.body.count).toBe('number');
        });
    });

    describe('PUT /api/notifications/:id/read', () => {
        it('should mark notification as read', async () => {
            const res = await request(app)
                .put(`/api/notifications/${notificationId}/read`)
                .set('Authorization', `Bearer ${token}`);

            expect(res.statusCode).toEqual(200);
        });

        it('should return 404 for non-existent notification', async () => {
            const fakeId = new mongoose.Types.ObjectId();

            const res = await request(app)
                .put(`/api/notifications/${fakeId}/read`)
                .set('Authorization', `Bearer ${token}`);

            expect(res.statusCode).toEqual(404);
        });
    });

    describe('DELETE /api/notifications/:id', () => {
        it('should delete notification', async () => {
            const res = await request(app)
                .delete(`/api/notifications/${notificationId}`)
                .set('Authorization', `Bearer ${token}`);

            expect(res.statusCode).toEqual(200);
        });
    });

    describe('PUT /api/notifications/mark-all-read', () => {
        it('should mark all notifications as read', async () => {
            const res = await request(app)
                .put('/api/notifications/mark-all-read')
                .set('Authorization', `Bearer ${token}`);

            expect(res.statusCode).toEqual(200);
        });
    });

    describe('DELETE /api/notifications/clear-all', () => {
        it('should clear all notifications', async () => {
            const res = await request(app)
                .delete('/api/notifications/clear-all')
                .set('Authorization', `Bearer ${token}`);

            expect(res.statusCode).toEqual(200);
        });
    });
});
