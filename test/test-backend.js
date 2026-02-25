const testBackend = async () => {
    try {
        // Test 1: Check if server is running
        console.log('🔍 Testing Backend API...\n');

        const response = await fetch('http://localhost:5000');
        const data = await response.json();
        console.log('✅ Server Status:', data.message);

        // Test 2: Test registration endpoint
        console.log('\n📝 Testing Registration...');
        const registerData = {
            email: `test${Date.now()}@foodshare.com`,
            password: 'test123',
            fullName: 'Test User',
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
            body: JSON.stringify(registerData)
        });

        const registerResult = await registerResponse.json();
        if (registerResponse.ok) {
            console.log('✅ Registration successful!');
            console.log('   User ID:', registerResult._id);
            console.log('   Token received:', registerResult.token ? 'Yes' : 'No');

            // Test 3: Test login endpoint
            console.log('\n🔐 Testing Login...');
            const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: registerData.email,
                    password: registerData.password
                })
            });

            const loginResult = await loginResponse.json();
            if (loginResponse.ok) {
                console.log('✅ Login successful!');
                console.log('   Token received:', loginResult.token ? 'Yes' : 'No');

                // Test 4: Test profile endpoint
                console.log('\n👤 Testing Profile Fetch...');
                const profileResponse = await fetch('http://localhost:5000/api/users/me', {
                    headers: { 'Authorization': `Bearer ${loginResult.token}` }
                });

                const profileResult = await profileResponse.json();
                if (profileResponse.ok) {
                    console.log('✅ Profile fetch successful!');
                    console.log('   Name:', profileResult.fullName);
                    console.log('   Email:', profileResult.email);
                    console.log('   Role:', profileResult.role);

                    // Test 5: Test profile update
                    console.log('\n✏️ Testing Profile Update...');
                    const updateResponse = await fetch('http://localhost:5000/api/users/me', {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${loginResult.token}`
                        },
                        body: JSON.stringify({
                            phone: '9876543210',
                            city: 'Delhi'
                        })
                    });

                    const updateResult = await updateResponse.json();
                    if (updateResponse.ok) {
                        console.log('✅ Profile update successful!');
                        console.log('   Updated phone:', updateResult.phone);
                        console.log('   Updated city:', updateResult.city);

                        console.log('\n🎉 ALL TESTS PASSED! Backend is working perfectly! 🎉');
                    } else {
                        console.log('❌ Profile update failed:', updateResult.message);
                    }
                } else {
                    console.log('❌ Profile fetch failed:', profileResult.message);
                }
            } else {
                console.log('❌ Login failed:', loginResult.message);
            }
        } else {
            console.log('❌ Registration failed:', registerResult.message);
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
};

testBackend();
