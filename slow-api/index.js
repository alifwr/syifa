const express = require('express');
const app = express();
const port = 3000;

// Root endpoint for simple health check
app.get('/', (req, res) => {
    res.json({ status: 'API is running' });
});

/**
 * Slow endpoint: returns data after 500 seconds.
 * 500 seconds = 500,000 milliseconds
 */
app.get('/slow', (req, res) => {
    const delayMs = 500 * 1000;
    console.log(`[${new Date().toISOString()}] Incoming request to /slow. Delaying for 500 seconds...`);
    
    setTimeout(() => {
        console.log(`[${new Date().toISOString()}] Sending response for /slow after 500 seconds delay.`);
        res.json({
            message: 'Success!',
            data: 'This data was returned very slowly as requested.',
            delay: '500 seconds',
            timestamp: new Date().toISOString()
        });
    }, delayMs);
});

app.listen(port, () => {
    console.log(`Slow API listening at http://localhost:${port}`);
    console.log(`- Health check: http://localhost:${port}/`);
    console.log(`- Slow endpoint: http://localhost:${port}/slow`);
});
