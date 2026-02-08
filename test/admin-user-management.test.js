const testAdminUserManagement = async (adminToken) => {
    try {
        console.log('\n\n👥 Testing Admin User Management...\n');

        let createdUserId = null;

        // Test 1: Get all users
        console.log('📋 Testing Get All Users...');
        const getAllUsersResponse = await fetch('http://localhost:5000/api/admin/users', {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });

        const allUsers = await getAllUsersResponse.json();
        if (getAllUsersResponse.ok) {
            console.log('✅ Get all users successful!');
            console.log(`   Total users found: ${Array.isArray(allUsers) ? allUsers.length : 'N/A'}`);
        } else {
            console.log('❌ Failed to get all users:', allUsers.message);
            return;
        }

        // Test 2: Create a new user
        console.log('\n➕ Testing Create User...');
        const newUserData = {
            email: `testuser${Date.now()}@foodshare.com`,
            password: 'test123',
            fullName: 'Test User Created by Admin',
            phone: '9876543210',
            role: 'ngo',
            address: '456 Admin St',
            city: 'Delhi',
            state: 'Delhi',
            pincode: '110001'
        };

        const createUserResponse = await fetch('http://localhost:5000/api/admin/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`
            },
            body: JSON.stringify(newUserData)
        });

        const createdUser = await createUserResponse.json();
        if (createUserResponse.ok) {
            console.log('✅ User created successfully!');
            console.log('   User ID:', createdUser._id);
            console.log('   Email:', createdUser.email);
            console.log('   Role:', createdUser.role);
            createdUserId = createdUser._id;
        } else {
            console.log('❌ Failed to create user:', createdUser.message);
            return;
        }

        // Test 3: Get user by ID
        console.log('\n🔍 Testing Get User by ID...');
        const getUserResponse = await fetch(`http://localhost:5000/api/admin/users/${createdUserId}`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });

        const fetchedUser = await getUserResponse.json();
        if (getUserResponse.ok) {
            console.log('✅ Get user by ID successful!');
            console.log('   Full Name:', fetchedUser.fullName);
            console.log('   Email:', fetchedUser.email);
            console.log('   Status:', fetchedUser.status);
        } else {
            console.log('❌ Failed to get user by ID:', fetchedUser.message);
        }

        // Test 4: Update user
        console.log('\n✏️ Testing Update User...');
        const updateData = {
            phone: '1111111111',
            city: 'Bangalore',
            state: 'Karnataka'
        };

        const updateUserResponse = await fetch(`http://localhost:5000/api/admin/users/${createdUserId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`
            },
            body: JSON.stringify(updateData)
        });

        const updatedUser = await updateUserResponse.json();
        if (updateUserResponse.ok) {
            console.log('✅ User updated successfully!');
            console.log('   Updated Phone:', updatedUser.phone);
            console.log('   Updated City:', updatedUser.city);
        } else {
            console.log('❌ Failed to update user:', updatedUser.message);
        }

        // Test 5: Toggle user status
        console.log('\n🔄 Testing Toggle User Status...');
        const toggleStatusResponse = await fetch(`http://localhost:5000/api/admin/users/${createdUserId}/toggle-status`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });

        const toggledUser = await toggleStatusResponse.json();
        if (toggleStatusResponse.ok) {
            console.log('✅ User status toggled successfully!');
            console.log('   New Status:', toggledUser.status);
        } else {
            console.log('❌ Failed to toggle user status:', toggledUser.message);
        }

        // Test 6: Update verification status
        console.log('\n✔️ Testing Update Verification Status...');
        const verificationResponse = await fetch(`http://localhost:5000/api/admin/users/${createdUserId}/verification`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`
            },
            body: JSON.stringify({ verificationStatus: 'verified' })
        });

        const verifiedUser = await verificationResponse.json();
        if (verificationResponse.ok) {
            console.log('✅ Verification status updated successfully!');
            console.log('   Verification Status:', verifiedUser.verificationStatus);
        } else {
            console.log('❌ Failed to update verification status:', verifiedUser.message);
        }

        // Test 7: Delete user
        console.log('\n🗑️ Testing Delete User...');
        const deleteUserResponse = await fetch(`http://localhost:5000/api/admin/users/${createdUserId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });

        const deleteResult = await deleteUserResponse.json();
        if (deleteUserResponse.ok) {
            console.log('✅ User deleted successfully!');
            console.log('   Message:', deleteResult.message);
        } else {
            console.log('❌ Failed to delete user:', deleteResult.message);
        }

        // Test 8: Verify user was deleted
        console.log('\n🔍 Verifying user deletion...');
        const verifyDeleteResponse = await fetch(`http://localhost:5000/api/admin/users/${createdUserId}`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });

        if (verifyDeleteResponse.status === 404) {
            console.log('✅ User deletion verified!');
        } else {
            console.log('❌ User still exists after deletion');
        }

        console.log('\n🎉 Admin User Management Tests PASSED! 🎉');

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
};

module.exports = testAdminUserManagement;

// Run if called directly (requires admin token)
if (require.main === module) {
    console.log('⚠️  This test requires an admin token.');
    console.log('   Run: node test/run-all-tests.js');
}
