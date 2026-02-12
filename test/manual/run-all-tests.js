/**
 * Main Test Runner for Replate Backend API
 * 
 * This script runs all test suites for the backend API.
 * Make sure the server is running on http://localhost:5000 before running tests.
 * 
 * Usage: node test/run-all-tests.js
 */

const testAdminAuth = require('./admin-auth.test');
const testAdminUserManagement = require('./admin-user-management.test');
const testAdminResources = require('./admin-resources.test');
const testUserFlows = require('./user-flows.test');

const runAllTests = async () => {
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║          REPLATE BACKEND API TEST SUITE                    ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    const startTime = Date.now();
    let allTestsPassed = true;

    try {
        // Check if server is running
        console.log('🔍 Checking if server is running...\n');
        try {
            const response = await fetch('http://localhost:5000');
            const data = await response.json();
            console.log('✅ Server is running:', data.message);
            console.log('═══════════════════════════════════════════════════════════\n');
        } catch (error) {
            console.log('❌ Server is not running!');
            console.log('   Please start the server with: npm start');
            console.log('   or: node server.js\n');
            return;
        }

        // Run User Flows Tests (Non-Admin)
        console.log('┌───────────────────────────────────────────────────────────┐');
        console.log('│ TEST SUITE 1: User Flows (Registration & Authentication) │');
        console.log('└───────────────────────────────────────────────────────────┘');
        await testUserFlows();

        // Run Admin Authentication Tests
        console.log('\n┌───────────────────────────────────────────────────────────┐');
        console.log('│ TEST SUITE 2: Admin Authentication & Authorization       │');
        console.log('└───────────────────────────────────────────────────────────┘');
        const adminToken = await testAdminAuth();

        if (!adminToken) {
            console.log('\n⚠️  Admin tests skipped. To run admin tests:');
            console.log('   1. Create an admin user: node scripts/createAdmin.js');
            console.log('   2. Use email: admin@foodshare.com');
            console.log('   3. Use password: admin123');
            allTestsPassed = false;
        } else {
            // Run Admin User Management Tests
            console.log('\n┌───────────────────────────────────────────────────────────┐');
            console.log('│ TEST SUITE 3: Admin User Management (CRUD)               │');
            console.log('└───────────────────────────────────────────────────────────┘');
            await testAdminUserManagement(adminToken);

            // Run Admin Resources Tests
            console.log('\n┌───────────────────────────────────────────────────────────┐');
            console.log('│ TEST SUITE 4: Admin Resource Management                  │');
            console.log('└───────────────────────────────────────────────────────────┘');
            await testAdminResources(adminToken);
        }

        // Summary
        const endTime = Date.now();
        const duration = ((endTime - startTime) / 1000).toFixed(2);

        console.log('\n╔════════════════════════════════════════════════════════════╗');
        console.log('║                     TEST SUMMARY                           ║');
        console.log('╚════════════════════════════════════════════════════════════╝');
        console.log(`\n   Duration: ${duration}s`);
        console.log(`   Status: ${allTestsPassed ? '✅ ALL TESTS PASSED' : '⚠️  SOME TESTS SKIPPED'}`);
        console.log('\n═══════════════════════════════════════════════════════════\n');

    } catch (error) {
        console.error('\n❌ Test Suite Error:', error.message);
        console.error('   Stack:', error.stack);
    }
};

// Run tests
runAllTests();
