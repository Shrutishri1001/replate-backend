const testData = {
    email: "test@foodshare.com",
    password: "test123",
    fullName: "Test User",
    phone: "1234567890",
    role: "volunteer",
    address: "123 Test Street",
    city: "Mumbai",
    state: "Maharashtra",
    pincode: "400001"
};

fetch('http://localhost:5000/api/auth/register', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify(testData)
})
    .then(res => res.json())
    .then(data => {
        console.log('✅ Registration successful!');
        console.log('User created:', data);
    })
    .catch(err => {
        console.error('❌ Error:', err.message);
    });
