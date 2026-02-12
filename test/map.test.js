const request = require('supertest');
const app = require('../server');
const mongoose = require('mongoose');
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
    },
    location: {
        lat: 40.7128,
        lng: -74.0060
    }
});

describe('Map Endpoints', () => {
    let donorToken;
    let donorId;
    let volunteerToken;
    let volunteerId;
    let donationId;

    beforeEach(async () => {
        await User.deleteMany({});
        await Donation.deleteMany({});

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

        // Create volunteer
        const volunteerRes = await request(app)
            .post('/api/auth/register')
            .send({
                email: 'volunteer@example.com',
                password: 'password123',
                fullName: 'Volunteer User',
                phone: '5555555555',
                role: 'volunteer',
                address: '789 Volunteer Ave',
                city: 'Volunteer City',
                state: 'Volunteer State',
                pincode: '789456'
            });

        volunteerToken = volunteerRes.body.token;
        volunteerId = volunteerRes.body._id;

        // Create donation with location
        const donationRes = await request(app)
            .post('/api/donations')
            .set('Authorization', `Bearer ${donorToken}`)
            .send(getValidDonationData());

        donationId = donationRes.body.data._id;
    });

    describe('GET /api/map/donations', () => {
        it('should get all active donations with locations', async () => {
            const res = await request(app)
                .get('/api/map/donations')
                .set('Authorization', `Bearer ${volunteerToken}`);

            expect(res.statusCode).toEqual(200);
            expect(Array.isArray(res.body)).toBe(true);
        });

        it('should return donations with location data', async () => {
            const res = await request(app)
                .get('/api/map/donations')
                .set('Authorization', `Bearer ${volunteerToken}`);

            expect(res.statusCode).toEqual(200);

            if (res.body.length > 0) {
                const donation = res.body[0];
                expect(donation).toHaveProperty('id');
                expect(donation).toHaveProperty('foodName');
                expect(donation).toHaveProperty('location');
            }
        });

        it('should return 401 without token', async () => {
            const res = await request(app)
                .get('/api/map/donations');

            expect(res.statusCode).toEqual(401);
        });
    });

    describe('GET /api/map/volunteers', () => {
        it('should get available volunteers with locations', async () => {
            const res = await request(app)
                .get('/api/map/volunteers')
                .set('Authorization', `Bearer ${donorToken}`);

            expect(res.statusCode).toEqual(200);
            expect(Array.isArray(res.body)).toBe(true);
        });

        it('should return volunteer location data', async () => {
            const res = await request(app)
                .get('/api/map/volunteers')
                .set('Authorization', `Bearer ${donorToken}`);

            expect(res.statusCode).toEqual(200);
        });
    });

    describe('GET /api/map/ngos', () => {
        it('should get all NGO locations', async () => {
            const res = await request(app)
                .get('/api/map/ngos')
                .set('Authorization', `Bearer ${donorToken}`);

            expect(res.statusCode).toEqual(200);
            expect(Array.isArray(res.body)).toBe(true);
        });
    });

    describe('GET /api/map/active-assignments', () => {
        it('should get active assignments with route information', async () => {
            const res = await request(app)
                .get('/api/map/active-assignments')
                .set('Authorization', `Bearer ${volunteerToken}`);

            expect(res.statusCode).toEqual(200);
            expect(Array.isArray(res.body)).toBe(true);
        });
    });

    describe('POST /api/map/calculate-route', () => {
        it('should calculate route between two locations', async () => {
            const res = await request(app)
                .post('/api/map/calculate-route')
                .set('Authorization', `Bearer ${volunteerToken}`)
                .send({
                    pickupLocation: {
                        lat: 40.7128,
                        lng: -74.0060
                    },
                    deliveryLocation: {
                        lat: 40.7489,
                        lng: -73.9680
                    }
                });

            expect(res.statusCode).toEqual(200);
        });

        it('should return 400 with invalid locations', async () => {
            const res = await request(app)
                .post('/api/map/calculate-route')
                .set('Authorization', `Bearer ${volunteerToken}`)
                .send({
                    pickupLocation: { lat: 'invalid', lng: 'invalid' },
                    deliveryLocation: { lat: 'invalid', lng: 'invalid' }
                });

            expect(res.statusCode).toEqual(400);
        });
    });

    describe('GET /api/map/location-search', () => {
        it('should search for locations by query', async () => {
            const res = await request(app)
                .get('/api/map/location-search')
                .query({ q: 'Donor City' })
                .set('Authorization', `Bearer ${volunteerToken}`);

            expect(res.statusCode).toEqual(200);
            expect(Array.isArray(res.body)).toBe(true);
        });
    });

    describe('GET /api/map/nearby-donations', () => {
        it('should get nearby donations for a location', async () => {
            const res = await request(app)
                .get('/api/map/nearby-donations')
                .query({
                    lat: 40.7128,
                    lng: -74.0060,
                    radius: 5
                })
                .set('Authorization', `Bearer ${volunteerToken}`);

            expect(res.statusCode).toEqual(200);
            expect(Array.isArray(res.body)).toBe(true);
        });

        it('should return 400 without required parameters', async () => {
            const res = await request(app)
                .get('/api/map/nearby-donations')
                .set('Authorization', `Bearer ${volunteerToken}`);

            expect(res.statusCode).toEqual(400);
        });
    });

    describe('PUT /api/map/update-location', () => {
        it('should update volunteer location', async () => {
            const res = await request(app)
                .put('/api/map/update-location')
                .set('Authorization', `Bearer ${volunteerToken}`)
                .send({
                    lat: 40.7489,
                    lng: -73.9680
                });

            expect(res.statusCode).toEqual(200);
        });
    });
});
