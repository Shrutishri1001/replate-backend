const request = require('supertest');
const app = require('../server');
const mongoose = require('mongoose');
const User = require('../models/User');
const Donation = require('../models/Donation');
const Assignment = require('../models/Assignment');

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

describe('Assignment Endpoints', () => {
    let donorToken, ngoToken, volunteerToken;
    let donorId, ngoId, volunteerId;
    let donationId;

    beforeEach(async () => {
        await User.deleteMany({});
        await Donation.deleteMany({});
        await Assignment.deleteMany({});

        // Create Donor
        const donorRes = await request(app).post('/api/auth/register').send({
            email: 'donor@test.com',
            password: 'password123',
            fullName: 'Donor One',
            phone: '1234567890',
            role: 'donor',
            address: '123 Donor St',
            city: 'Test City',
            state: 'Test State',
            pincode: '123456',
            organizationName: 'Donor Org',
            organizationType: 'Restaurant'
        });
        donorToken = donorRes.body.token;
        donorId = donorRes.body._id || donorRes.body.user?._id; // Adjust based on auth response structure

        // Create NGO
        const ngoRes = await request(app).post('/api/auth/register').send({
            email: 'ngo@test.com',
            password: 'password123',
            fullName: 'NGO One',
            phone: '0987654321',
            role: 'ngo',
            address: '456 NGO Rd',
            city: 'Test City',
            state: 'Test State',
            pincode: '654321',
            registrationNumber: 'NGO-123',
            dailyCapacity: 100
        });
        ngoToken = ngoRes.body.token;
        ngoId = ngoRes.body._id;

        // Create Volunteer
        const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
        const today = days[new Date().getDay()];

        // Construct availability schedule where today is active
        const availabilitySchedule = {};
        days.forEach(day => {
            availabilitySchedule[day] = { active: true, slots: [{ start: '09:00', end: '17:00' }] };
        });

        const volunteerRes = await request(app).post('/api/auth/register').send({
            email: 'volunteer@test.com',
            password: 'password123',
            fullName: 'Volunteer One',
            phone: '1122334455',
            role: 'volunteer',
            address: '789 Vol St',
            city: 'Test City',
            state: 'Test State',
            pincode: '123456',
            volunteerProfile: {
                vehicleType: 'two_wheeler',
                maxWeight: 50,
                availabilitySchedule: availabilitySchedule
            }
        });
        volunteerToken = volunteerRes.body.token;
        volunteerId = volunteerRes.body._id;

        // Verify we captured IDs correctly (auth endpoint returns _id at top level based on previous check)
        if (!donorId) donorId = await User.findOne({ email: 'donor@test.com' }).then(u => u._id);
        if (!ngoId) ngoId = await User.findOne({ email: 'ngo@test.com' }).then(u => u._id);
        if (!volunteerId) volunteerId = await User.findOne({ email: 'volunteer@test.com' }).then(u => u._id);

        // Create a Donation (accepted by NGO)
        const donation = await Donation.create({
            donor: donorId,
            foodName: 'Test Food',
            foodType: 'cooked',
            quantity: 10,
            unit: 'kg',
            estimatedServings: 25,
            preparationDate: new Date().toISOString().split('T')[0],
            preparationTime: '12:00',
            expiryDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
            expiryTime: '18:00',
            storageCondition: 'Refrigerated (0-4°C)',
            pickupAddress: '123 Donor St',
            city: 'Test City',
            pickupDeadline: new Date(Date.now() + 86400000).toISOString(),
            hygiene: {
                safeHandling: true,
                temperatureControl: true,
                properPackaging: true,
                noContamination: true
            },
            status: 'accepted',
            acceptedBy: ngoId
        });
        donationId = donation._id;
    });

    describe('POST /api/assignments/claim', () => {
        it('should allow volunteer to claim an available donation', async () => {
            const res = await request(app)
                .post('/api/assignments/claim')
                .set('Authorization', `Bearer ${volunteerToken}`)
                .send({ donationId: donationId });

            expect(res.statusCode).toEqual(201);
            expect(res.body.status).toEqual('accepted'); // Assignment status
            expect(res.body.volunteer._id).toEqual(volunteerId.toString());
            expect(res.body.donation._id).toEqual(donationId.toString());

            // Verify Donation updated
            const updatedDonation = await Donation.findById(donationId);
            expect(updatedDonation.status).toEqual('assigned');
            expect(updatedDonation.assignedTo.toString()).toEqual(volunteerId.toString());
        });

        it('should fail if donation does not exist', async () => {
            const res = await request(app)
                .post('/api/assignments/claim')
                .set('Authorization', `Bearer ${volunteerToken}`)
                .send({ donationId: new mongoose.Types.ObjectId() });

            expect(res.statusCode).toEqual(404);
        });

        it('should fail if volunteer capacity is too low', async () => {
            // Update donation to exceed volunteer capacity
            await Donation.findByIdAndUpdate(donationId, { quantity: 100 }); // Vol max is 50

            const res = await request(app)
                .post('/api/assignments/claim')
                .set('Authorization', `Bearer ${volunteerToken}`)
                .send({ donationId: donationId });

            expect(res.statusCode).toEqual(400);
            expect(res.body.message).toMatch(/capacity/i);
        });
    });

    describe('GET /api/assignments/available', () => {
        it('should list available assignments for volunteer', async () => {
            const res = await request(app)
                .get('/api/assignments/available')
                .set('Authorization', `Bearer ${volunteerToken}`);

            expect(res.statusCode).toEqual(200);
            expect(Array.isArray(res.body)).toBeTruthy();
            expect(res.body.length).toBeGreaterThan(0);
            expect(res.body[0]._id).toEqual(donationId.toString());
        });

        it('should filter out assignments in different cities', async () => {
            // Change donation city
            await Donation.findByIdAndUpdate(donationId, { city: 'Other City' });

            const res = await request(app)
                .get('/api/assignments/available')
                .set('Authorization', `Bearer ${volunteerToken}`);

            expect(res.statusCode).toEqual(200);
            expect(res.body.length).toEqual(0);
        });
    });

    // Test map endpoints (from assignmentRoutes.js)
    describe('GET /api/assignments/:id/map', () => {
        let assignmentId;

        beforeEach(async () => {
            // Create assignment first
            const assignment = await Assignment.create({
                donation: donationId,
                volunteer: volunteerId,
                donor: donorId,
                status: 'accepted'
            });
            assignmentId = assignment._id;

            // Link donation to acceptedBy (User ID needed for map/consumer fetch)
            // It's already linked in beforeEach setup (acceptedBy: ngoId)
        });

        it('should return map data for valid assignment', async () => {
            // Using protected route? The file routes/assignmentRoutes.js doesn't seem to have middleware applied directly!
            // Wait, server.js: app.use("/api/assignments", assignmentRoutes);
            // assignmentRoutes.js: const authMiddleware = require("../middleware/auth.js"); but DOES NOT USE IT on routes.
            // Oh, checking routes/assignmentRoutes.js content again.
            // It imports authMiddleware but doesn't call `router.use(protect)`.
            // Wait, lines 13 and 19 do NOT have auth middleware attached.
            // This might mean they are public? Or maybe `server.js` applies it? No.
            // Let's check if the existing tests had tokens.
            // If they are public, this is a security issue, but I am writing tests for what exists.

            const res = await request(app)
                .get(`/api/assignments/${assignmentId}/map`);

            // If it returns 200 without token, then it's public.
            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty('volunteerLocation');
            expect(res.body).toHaveProperty('consumerLocation');
        });
    });
});
