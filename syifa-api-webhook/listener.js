const express = require('express');
const app = express();
const port = 3003;

app.use(express.json());

app.post('/webhook-test', (req, res) => {
    console.log(`[${new Date().toISOString()}] 🔔 Webhook Received!`);
    console.log('-------------------------------------------');
    console.log('Job ID:', req.body.job_id);
    console.log('Status:', req.body.status);
    console.log('Data:', JSON.stringify(req.body.data, null, 2));
    console.log('-------------------------------------------');
    res.status(200).send('Webhook acknowledged');
});

app.listen(port, () => {
    console.log(`\n🚀 Webhook Testing Listener is UP!`);
    console.log(`- Listening for callbacks at: http://localhost:${port}/webhook-test`);
    console.log(`- Keep this terminal open to see logs.\n`);
});
