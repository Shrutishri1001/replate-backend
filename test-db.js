const mongoose = require('mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/replate', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(async () => {
        try {
            const db = mongoose.connection.useDb('replate');
            const donations = await db.collection('donations').find({}).limit(5).toArray();
            console.log('--- REPLATE DB ---');
            console.log(JSON.stringify(donations.map(d => ({ id: d._id, name: d.foodName, status: d.status })), null, 2));
        } catch (err) { console.error('Error querying replate db', err) }

        try {
            const db2 = mongoose.connection.useDb('test');
            const donations2 = await db2.collection('donations').find({}).limit(5).toArray();
            console.log('--- TEST DB ---');
            console.log(JSON.stringify(donations2.map(d => ({ id: d._id, name: d.foodName, status: d.status })), null, 2));
        } catch (err) { console.error('Error querying test db', err) }

        process.exit(0);
    })
    .catch(err => { console.error(err); process.exit(1); });
