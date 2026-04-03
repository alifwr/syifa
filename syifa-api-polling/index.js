const express = require('express');
const crypto = require('crypto');
const app = express();
const port = 3001;

// The URL of our slow API
const SLOW_API_URL = 'http://localhost:3000/slow';

app.use(express.json());

// In-memory store for tracking jobs and their results
// In a production app, this would be Redis or a database.
const jobs = {};

/**
 * 1. Initiation: Client sends a POST request to start a task.
 * Returns 202 Accepted with a unique job_id.
 */
app.post('/jobs', (req, res) => {
    // Generate a unique job ID
    const jobId = crypto.randomUUID();
    
    // Push the task to our in-memory store with status: "pending"
    jobs[jobId] = { 
        id: jobId, 
        status: 'pending', 
        result: null,
        created_at: new Date().toISOString()
    };
    
    console.log(`[Bridge] Job ${jobId} initiated. Returning 202.`);

    // Acknowledgment: return 202 immediately.
    res.status(202).json({
        job_id: jobId,
        status: 'pending'
    });

    // Start background processing without blocking the response.
    processSlowTask(jobId);
});

/**
 * 2. Polling: Client sends a GET request to /status/{job_id} at regular intervals.
 */
app.get('/status/:job_id', (req, res) => {
    const { job_id } = req.params;
    const job = jobs[job_id];

    if (!job) {
        return res.status(404).json({ error: 'Job not found' });
    }

    // Check current status and return it.
    // If the job is still running, it will be 'processing'.
    // If finished, it will be 'completed' with the result data.
    res.json(job);
});

/**
 * Background Task Worker:
 * This function simulates what a background worker would do.
 * It calls the slow External API and updates the job status upon completion.
 */
async function processSlowTask(jobId) {
    try {
        // Update job status to processing
        jobs[jobId].status = 'processing';
        console.log(`[Bridge] Job ${jobId} is now processing. Calling slow-api (500s delay)...`);

        // Use built-in fetch to call the slow external API
        // Node 18+ has fetch natively.
        const response = await fetch(SLOW_API_URL);

        if (!response.ok) {
            throw new Error(`External API responded with status: ${response.status}`);
        }

        const data = await response.json();

        // 3. Completion: Once the External API responds, update the status to "completed" and store the data.
        jobs[jobId].status = 'completed';
        jobs[jobId].result = data;
        jobs[jobId].completed_at = new Date().toISOString();
        
        console.log(`[Bridge] Job ${jobId} successfully completed!`);
    } catch (error) {
        // Handle failures (e.g. timeout, network issue)
        console.error(`[Bridge] Job ${jobId} failed: ${error.message}`);
        jobs[jobId].status = 'failed';
        jobs[jobId].error = error.message;
        jobs[jobId].failed_at = new Date().toISOString();
    }
}

app.listen(port, () => {
    console.log(`Bridge API (Polling Gateway) listening at http://localhost:${port}`);
    console.log(`- Initiation point: POST http://localhost:${port}/jobs`);
    console.log(`- Polling point: GET http://localhost:${port}/status/:job_id`);
});
