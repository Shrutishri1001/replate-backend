const testAdminAuth = async () => {
    try {
        console.log('🔐 Testing Admin Authentication...\n');

        // Test 1: Create regular user and verify they cannot access admin routes
        console.log('📝 Creating regular user...');
        const regularUserData = {
            email: `regularuser${Date.now()}@foodshare.com`,
            password: 'test123',
            fullName: 'Regular User',
            phone: '1234567890',
            role: 'volunteer',
            address: '123 Test St',
            city: 'Mumbai',
            state: 'Maharashtra',
            pincode: '400001'
        };

        const registerResponse = await fetch('http://localhost:5000/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(regularUserData)
        });

        const regularUser = await registerResponse.json();
        if (!registerResponse.ok) {
            console.log('❌ Failed to create regular user:', regularUser.message);
            return;
        }
        console.log('✅ Regular user created');

        // Test 2: Try to access admin route with regular user token
        console.log('\n🚫 Testing unauthorized admin access...');
        const unauthorizedResponse = await fetch('http://localhost:5000/api/admin/stats', {
            headers: { 'Authorization': `Bearer ${regularUser.token}` }
        });

        if (unauthorizedResponse.status === 403 || unauthorizedResponse.status === 401) {
            console.log('✅ Unauthorized access blocked correctly!');
        } else {
            console.log('❌ Security issue: Regular user accessed admin route!');
            return;
        }

        // Test 3: Login as admin (assumes admin exists or needs to be created)
        console.log('\n🔐 Testing Admin Login...');
        const adminLoginResponse = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin@foodshare.com',
                password: 'admin123'
            })
        });

        const adminLoginResult = await adminLoginResponse.json();
        if (!adminLoginResponse.ok) {
            console.log('⚠️  Admin user does not exist. Create one using: node scripts/createAdmin.js');
            console.log('   For testing, use email: admin@foodshare.com, password: admin123');
            return;
        }

        if (adminLoginResult.role !== 'admin') {
            console.log('❌ Logged in user is not an admin');
            return;
        }

        console.log('✅ Admin login successful!');
        console.log('   Admin ID:', adminLoginResult._id);
        console.log('   Role:', adminLoginResult.role);

        // Test 4: Access admin dashboard stats
        console.log('\n📊 Testing Admin Dashboard Access...');
        const statsResponse = await fetch('http://localhost:5000/api/admin/stats', {
            headers: { 'Authorization': `Bearer ${adminLoginResult.token}` }
        });

        const stats = await statsResponse.json();
        if (statsResponse.ok) {
            console.log('✅ Admin dashboard access successful!');
            console.log('   Total Users:', stats.totalUsers);
            console.log('   Total Donors:', stats.totalDonors);
            console.log('   Total NGOs:', stats.totalNGOs);
            console.log('   Total Volunteers:', stats.totalVolunteers);
            console.log('   Pending Verifications:', stats.pendingVerifications);
        } else {
            console.log('❌ Failed to access admin dashboard:', stats.message);
            return;
        }

        console.log('\n🎉 Admin Authentication Tests PASSED! 🎉');
        return adminLoginResult.token;

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
};

module.exports = testAdminAuth;

// Run if called directly
if (require.main === module) {
    testAdminAuth();
}
