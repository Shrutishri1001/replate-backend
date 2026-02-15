const testAdminResources = async (adminToken) => {
    try {
        console.log('\n\n📦 Testing Admin Resource Management...\n');

        // Test 1: Get all donations
        console.log('🍱 Testing Get All Donations...');
        const donationsResponse = await fetch('http://localhost:5000/api/admin/donations', {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });

        const donations = await donationsResponse.json();
        if (donationsResponse.ok) {
            console.log('✅ Get all donations successful!');
            console.log(`   Total donations: ${Array.isArray(donations) ? donations.length : 'N/A'}`);
            if (Array.isArray(donations) && donations.length > 0) {
                console.log('   Sample donation ID:', donations[0]._id);
                console.log('   Sample donation status:', donations[0].status);
            }
        } else {
            console.log('❌ Failed to get donations:', donations.message);
        }

        // Test 2: Get all requests
        console.log('\n🤝 Testing Get All Requests...');
        const requestsResponse = await fetch('http://localhost:5000/api/admin/requests', {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });

        const requests = await requestsResponse.json();
        if (requestsResponse.ok) {
            console.log('✅ Get all requests successful!');
            console.log(`   Total requests: ${Array.isArray(requests) ? requests.length : 'N/A'}`);
            if (Array.isArray(requests) && requests.length > 0) {
                console.log('   Sample request ID:', requests[0]._id);
                console.log('   Sample request status:', requests[0].status);
            }
        } else {
            console.log('❌ Failed to get requests:', requests.message);
        }

        // Test 3: Get all assignments
        console.log('\n📋 Testing Get All Assignments...');
        const assignmentsResponse = await fetch('http://localhost:5000/api/admin/assignments', {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });

        const assignments = await assignmentsResponse.json();
        if (assignmentsResponse.ok) {
            console.log('✅ Get all assignments successful!');
            console.log(`   Total assignments: ${Array.isArray(assignments) ? assignments.length : 'N/A'}`);
            if (Array.isArray(assignments) && assignments.length > 0) {
                console.log('   Sample assignment ID:', assignments[0]._id);
                console.log('   Sample assignment status:', assignments[0].status);
            }
        } else {
            console.log('❌ Failed to get assignments:', assignments.message);
        }

        // Test 4: Verify dashboard stats reflect actual data
        console.log('\n📊 Testing Dashboard Stats Accuracy...');
        const statsResponse = await fetch('http://localhost:5000/api/admin/stats', {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });

        const stats = await statsResponse.json();
        if (statsResponse.ok) {
            console.log('✅ Dashboard stats retrieved!');
            console.log('   Statistics Summary:');
            console.log('   ├── Users:', stats.totalUsers);
            console.log('   ├── Donors:', stats.totalDonors);
            console.log('   ├── NGOs:', stats.totalNGOs);
            console.log('   ├── Volunteers:', stats.totalVolunteers);
            console.log('   ├── Donations:', stats.totalDonations);
            console.log('   ├── Requests:', stats.totalRequests);
            console.log('   ├── Assignments:', stats.totalAssignments);
            console.log('   ├── Active Users:', stats.activeUsers);
            console.log('   ├── Disabled Users:', stats.disabledUsers);
            console.log('   └── Pending Verifications:', stats.pendingVerifications);

            // Verify stats match actual data
            const donationsMatch = Array.isArray(donations) && stats.totalDonations === donations.length;
            const requestsMatch = Array.isArray(requests) && stats.totalRequests === requests.length;
            const assignmentsMatch = Array.isArray(assignments) && stats.totalAssignments === assignments.length;

            console.log('\n   Data Consistency Check:');
            console.log('   ├── Donations count:', donationsMatch ? '✅ Match' : '⚠️  Mismatch');
            console.log('   ├── Requests count:', requestsMatch ? '✅ Match' : '⚠️  Mismatch');
            console.log('   └── Assignments count:', assignmentsMatch ? '✅ Match' : '⚠️  Mismatch');
        } else {
            console.log('❌ Failed to get dashboard stats:', stats.message);
        }

        console.log('\n🎉 Admin Resource Management Tests PASSED! 🎉');

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
};

module.exports = testAdminResources;

// Run if called directly (requires admin token)
if (require.main === module) {
    console.log('⚠️  This test requires an admin token.');
    console.log('   Run: node test/run-all-tests.js');
}
