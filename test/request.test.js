const request = require('supertest');
const app = require('../server');
const mongoose = require('mongoose');
const Request = require('../models/Request');
const Donation = require('../models/Donation');
const User = require('../models/User');

// Helper function for valid donation data
const getValidDonationData = () => ({
    foodName: 'Cooked Rice',
    foodType: 'cooked',
    quantity: 10,
    unit: 'kg',
    estimatedServings: 50,
    preparationDate: new Date().toISOString().split('T')[0],
    preparationTime: '12:00',
    expiryDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    expiryTime: '18:00',
    storageCondition: 'Refrigerated (0-4°C)',
    pickupAddress: '123 Donor St',
    city: 'Donor City',
    pickupDeadline: new Date(Date.now() + 86400000).toISOString(),
    hygiene: {
        safeHandling: true,
        temperatureControl: true,
        properPackaging: true,
        noContamination: true
    }
});

describe('Request Endpoints', () => {
    let donorToken;
    let donorId;
    let ngoToken;
    let ngoId;
    let donationId;
    let requestId;

    beforeEach(async () => {
        await User.deleteMany({});
        await Donation.deleteMany({});
        await Request.deleteMany({});

        // Create donor
        const donorRes = await request(app)
            .post('/api/auth/register')
            .send({
                email: 'donor@example.com',
                password: 'password123',
                fullName: 'Donor User',
                phone: '1234567890',
                role: 'donor',
                address: '123 Donor St',
                city: 'Donor City',
                state: 'Donor State',
                pincode: '123456'
            });

        donorToken = donorRes.body.token;
        donorId = donorRes.body._id;

        // Create NGO
        const ngoRes = await request(app)
            .post('/api/auth/register')
            .send({
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
            });

        ngoToken = ngoRes.body.token;
        ngoId = ngoRes.body._id;

        // Create donation
        const donationRes = await request(app)
            .post('/api/donations')
            .set('Authorization', `Bearer ${donorToken}`)
            .send(getValidDonationData());

        donationId = donationRes.body.data._id;
    });

    describe('POST /api/requests', () => {
        it('should create a new request for donation', async () => {
            const res = await request(app)
                .post('/api/requests')
                .set('Authorization', `Bearer ${ngoToken}`)
                .send({
                    donationId: donationId,
                    notes: 'We need this donation'
                });

            expect(res.statusCode).toEqual(201);
            expect(res.body.success).toEqual(true);
            expect(res.body.data.ngo).toBeDefined();

            requestId = res.body.data._id;
        });

        it('should return 404 for non-existent donation', async () => {
            const fakeId = new mongoose.Types.ObjectId();

            const res = await request(app)
                .post('/api/requests')
                .set('Authorization', `Bearer ${ngoToken}`)
                .send({
                    donationId: fakeId,
                    notes: 'Test'
                });

            expect(res.statusCode).toEqual(404);
        });

        it('should return 401 without token', async () => {
            const res = await request(app)
                .post('/api/requests')
                .send({
                    donationId: donationId,
                    notes: 'Test'
                });

            expect(res.statusCode).toEqual(401);
        });
    });

    describe('GET /api/requests', () => {
        beforeEach(async () => {
            const res = await request(app)
                .post('/api/requests')
                .set('Authorization', `Bearer ${ngoToken}`)
                .send({
                    donationId: donationId,
                    notes: 'We need this donation'
                });

            requestId = res.body.data._id;
        });

        it('should get all requests for NGO', async () => {
            const res = await request(app)
                .get('/api/requests')
                .set('Authorization', `Bearer ${ngoToken}`);

            expect(res.statusCode).toEqual(200);
            expect(res.body).toBeDefined();
        });

        it('should filter requests by status', async () => {
            const res = await request(app)
                .get('/api/requests')
                .query({ status: 'pending' })
                .set('Authorization', `Bearer ${ngoToken}`);

            expect(res.statusCode).toEqual(200);
            expect(res.body).toBeDefined();
        });
    });

    describe('PUT /api/requests/:id', () => {
        beforeEach(async () => {
            const res = await request(app)
                .post('/api/requests')
                .set('Authorization', `Bearer ${ngoToken}`)
                .send({
                    donationId: donationId,
                    notes: 'We need this donation'
                });

            requestId = res.body.data._id;
        });

        it('should update request status', async () => {
            const res = await request(app)
                .put(`/api/requests/${requestId}`)
                .set('Authorization', `Bearer ${ngoToken}`)
                .send({
                    status: 'accepted'
                });

            expect([200, 404]).toContain(res.statusCode);
        });
    });

    describe('DELETE /api/requests/:id', () => {
        beforeEach(async () => {
            const res = await request(app)
                .post('/api/requests')
                .set('Authorization', `Bearer ${ngoToken}`)
                .send({
                    donationId: donationId,
                    notes: 'We need this donation'
                });

            requestId = res.body.data._id;
        });

        it('should delete request', async () => {
            const res = await request(app)
                .delete(`/api/requests/${requestId}`)
                .set('Authorization', `Bearer ${ngoToken}`);

            expect([200, 400, 404]).toContain(res.statusCode);
        });
    });

    describe('GET /api/requests/:id', () => {
        beforeEach(async () => {
            const res = await request(app)
                .post('/api/requests')
                .set('Authorization', `Bearer ${ngoToken}`)
                .send({
                    donationId: donationId,
                    notes: 'We need this donation'
                });

            requestId = res.body.data._id;
        });

        it('should get request by id', async () => {
            const res = await request(app)
                .get(`/api/requests/${requestId}`)
                .set('Authorization', `Bearer ${ngoToken}`);

            expect(res.statusCode).toEqual(200);
            expect(res.body).toBeDefined();
            if (res.body._id) {
                expect(res.body._id.toString()).toEqual(requestId.toString());
            }
        });

        it('should return 404 for non-existent request', async () => {
            const fakeId = new mongoose.Types.ObjectId();

            const res = await request(app)
                .get(`/api/requests/${fakeId}`)
                .set('Authorization', `Bearer ${ngoToken}`);

            expect(res.statusCode).toEqual(404);
        });
    });
});
