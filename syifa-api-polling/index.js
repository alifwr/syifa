const express = require('express');
const crypto = require('crypto');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const app = express();
const port = 3001;

// The URL of our slow API
const SLOW_API_URL = 'http://localhost:3000/slow';

app.use(express.json());

// Swagger definition
const swaggerOptions = {
    swaggerDefinition: {
        openapi: '3.0.0',
        info: {
            title: 'Polling API (Bridge)',
            version: '1.0.0',
            description: 'Gateway that manages long-running tasks by polling the Slow API.',
        },
        servers: [
            {
                url: `http://localhost:${port}`,
            },
        ],
    },
    apis: ['index.js'], // Files containing annotations
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// In-memory store for tracking jobs and their results
const jobs = {};

/**
 * @swagger
 * /jobs:
 *   post:
 *     summary: Initiate a new background task
 *     responses:
 *       202:
 *         description: Job accepted and started in background
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 job_id:
 *                   type: string
 *                 status:
 *                   type: string
 */
app.post('/jobs', (req, res) => {
    const jobId = crypto.randomUUID();

    jobs[jobId] = {
        id: jobId,
        status: 'pending',
        result: null,
        created_at: new Date().toISOString()
    };

    console.log(`[Bridge] Job ${jobId} initiated. Returning 202.`);

    processSlowTask(jobId);

    res.status(202).json({
        job_id: jobId,
        status: 'pending'
    });
});

/**
 * @swagger
 * /status/{job_id}:
 *   get:
 *     summary: Get the status and result of a job
 *     parameters:
 *       - in: path
 *         name: job_id
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique ID of the job
 *     responses:
 *       200:
 *         description: Current job status and data
 *       404:
 *         description: Job not found
 */
app.get('/status/:job_id', (req, res) => {
    const { job_id } = req.params;
    const job = jobs[job_id];

    if (!job) {
        return res.status(404).json({ error: 'Job not found' });
    }

    res.json(job);
});

async function processSlowTask(jobId) {
    try {
        jobs[jobId].status = 'processing';
        console.log(`[Bridge] Job ${jobId} is now processing. Calling slow-api (500s delay)...`);

        const response = await fetch(SLOW_API_URL);

        if (!response.ok) {
            throw new Error(`External API responded with status: ${response.status}`);
        }

        const data = await response.json();

        jobs[jobId].status = 'completed';
        jobs[jobId].result = data;
        jobs[jobId].completed_at = new Date().toISOString();

        console.log(`[Bridge] Job ${jobId} successfully completed!`);
    } catch (error) {
        console.error(`[Bridge] Job ${jobId} failed: ${error.message}`);
        jobs[jobId].status = 'failed';
        jobs[jobId].error = error.message;
        jobs[jobId].failed_at = new Date().toISOString();
    }
}

app.listen(port, () => {
    console.log(`\n🚀 Polling API is UP and running!`);
    console.log(`- Base URL: http://localhost:${port}/`);
    console.log(`- Swagger UI: http://localhost:${port}/api-docs`);
    console.log(`- Initiation point: POST http://localhost:${port}/jobs`);
    console.log(`- Polling point: GET http://localhost:${port}/status/:job_id\n`);
}).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`\n❌ ERROR: Port ${port} is already in use.`);
        console.error(`Please close the existing process running on this port or use a different port.\n`);
    } else {
        console.error(`\n❌ Unexpected server error:`, err);
    }
    process.exit(1);
});
