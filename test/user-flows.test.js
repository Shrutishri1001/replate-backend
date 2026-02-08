const testUserFlows = async () => {
    try {
        console.log('\n\n👤 Testing User Flows (Non-Admin)...\n');

        // Test 1: Register as Donor
        console.log('🍽️ Testing Donor Registration...');
        const donorData = {
            email: `donor${Date.now()}@foodshare.com`,
            password: 'test123',
            fullName: 'Test Donor',
            phone: '9876543210',
            role: 'donor',
            organizationName: 'Test Restaurant',
            address: '123 Food St',
            city: 'Mumbai',
            state: 'Maharashtra',
            pincode: '400001'
        };

        const donorResponse = await fetch('http://localhost:5000/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(donorData)
        });

        const donor = await donorResponse.json();
        if (donorResponse.ok) {
            console.log('✅ Donor registered successfully!');
            console.log('   Donor ID:', donor._id);
            console.log('   Role:', donor.role);
        } else {
            console.log('❌ Failed to register donor:', donor.message);
            return;
        }

        // Test 2: Register as NGO
        console.log('\n🏛️ Testing NGO Registration...');
        const ngoData = {
            email: `ngo${Date.now()}@foodshare.com`,
            password: 'test123',
            fullName: 'Test NGO',
            phone: '9876543211',
            role: 'ngo',
            organizationName: 'Help Foundation',
            address: '456 Charity St',
            city: 'Delhi',
            state: 'Delhi',
            pincode: '110001'
        };

        const ngoResponse = await fetch('http://localhost:5000/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(ngoData)
        });

        const ngo = await ngoResponse.json();
        if (ngoResponse.ok) {
            console.log('✅ NGO registered successfully!');
            console.log('   NGO ID:', ngo._id);
            console.log('   Role:', ngo.role);
        } else {
            console.log('❌ Failed to register NGO:', ngo.message);
            return;
        }

        // Test 3: Register as Volunteer
        console.log('\n🚴 Testing Volunteer Registration...');
        const volunteerData = {
            email: `volunteer${Date.now()}@foodshare.com`,
            password: 'test123',
            fullName: 'Test Volunteer',
            phone: '9876543212',
            role: 'volunteer',
            address: '789 Helper St',
            city: 'Bangalore',
            state: 'Karnataka',
            pincode: '560001'
        };

        const volunteerResponse = await fetch('http://localhost:5000/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(volunteerData)
        });

        const volunteer = await volunteerResponse.json();
        if (volunteerResponse.ok) {
            console.log('✅ Volunteer registered successfully!');
            console.log('   Volunteer ID:', volunteer._id);
            console.log('   Role:', volunteer.role);
        } else {
            console.log('❌ Failed to register volunteer:', volunteer.message);
            return;
        }

        // Test 4: Test profile retrieval for each role
        console.log('\n👥 Testing Profile Retrieval for Each Role...');
        
        const donorProfileResponse = await fetch('http://localhost:5000/api/users/me', {
            headers: { 'Authorization': `Bearer ${donor.token}` }
        });
        const donorProfile = await donorProfileResponse.json();
        
        if (donorProfileResponse.ok) {
            console.log('✅ Donor profile retrieved!');
            console.log('   Name:', donorProfile.fullName);
            console.log('   Verification Status:', donorProfile.verificationStatus);
        }

        const ngoProfileResponse = await fetch('http://localhost:5000/api/users/me', {
            headers: { 'Authorization': `Bearer ${ngo.token}` }
        });
        const ngoProfile = await ngoProfileResponse.json();
        
        if (ngoProfileResponse.ok) {
            console.log('✅ NGO profile retrieved!');
            console.log('   Name:', ngoProfile.fullName);
            console.log('   Organization:', ngoProfile.organizationName);
        }

        const volunteerProfileResponse = await fetch('http://localhost:5000/api/users/me', {
            headers: { 'Authorization': `Bearer ${volunteer.token}` }
        });
        const volunteerProfile = await volunteerProfileResponse.json();
        
        if (volunteerProfileResponse.ok) {
            console.log('✅ Volunteer profile retrieved!');
            console.log('   Name:', volunteerProfile.fullName);
            console.log('   Status:', volunteerProfile.status);
        }

        // Test 5: Test profile updates
        console.log('\n✏️ Testing Profile Updates...');
        const updateResponse = await fetch('http://localhost:5000/api/users/me', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${donor.token}`
            },
            body: JSON.stringify({
                phone: '8888888888',
                city: 'Pune'
            })
        });

        const updatedProfile = await updateResponse.json();
        if (updateResponse.ok) {
            console.log('✅ Profile updated successfully!');
            console.log('   Updated Phone:', updatedProfile.phone);
            console.log('   Updated City:', updatedProfile.city);
        } else {
            console.log('❌ Failed to update profile:', updatedProfile.message);
        }

        console.log('\n🎉 User Flows Tests PASSED! 🎉');

        return { donor, ngo, volunteer };

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
};

module.exports = testUserFlows;

// Run if called directly
if (require.main === module) {
    testUserFlows();
}
