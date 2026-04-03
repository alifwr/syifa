const express = require('express');
const crypto = require('crypto');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const app = express();
const port = 3002;

// The URL of our slow API
const SLOW_API_URL = 'http://localhost:3000/slow';

app.use(express.json());

// Swagger definition
const swaggerOptions = {
    swaggerDefinition: {
        openapi: '3.0.0',
        info: {
            title: 'Webhook API (Bridge)',
            version: '1.0.0',
            description: 'Gateway that manages long-running tasks by using webhooks to notify the client.',
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

/**
 * @swagger
 * /jobs:
 *   post:
 *     summary: Initiate a new background task with a callback URL
 *     parameters:
 *       - in: body
 *         name: body
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             callback_url:
 *               type: string
 *               example: "https://your-client-site.com/webhooks/receive-data"
 *     responses:
 *       202:
 *         description: Job accepted and will be processed in the background
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
    const { callback_url } = req.body;

    if (!callback_url) {
        return res.status(400).json({ error: 'callback_url is required' });
    }

    const jobId = crypto.randomUUID();
    
    console.log(`[Webhook Bridge] Job ${jobId} initiated. Returning 202.`);
    console.log(`[Webhook Bridge] Result will be sent to: ${callback_url}`);

    res.status(202).json({
        job_id: jobId,
        status: 'accepted'
    });

    // Start background processing
    processSlowTask(jobId, callback_url);
});

async function processSlowTask(jobId, callbackUrl) {
    try {
        console.log(`[Webhook Bridge] Job ${jobId} is processing. Calling slow-api (500s delay)...`);

        const response = await fetch(SLOW_API_URL);

        if (!response.ok) {
            throw new Error(`External API responded with status: ${response.status}`);
        }

        const data = await response.json();

        console.log(`[Webhook Bridge] Job ${jobId} successfully completed! Preparing to send callback...`);

        // Prepare payload for callback
        const payload = {
            job_id: jobId,
            status: 'completed',
            data: data,
            completed_at: new Date().toISOString()
        };

        // Send the callback
        const callbackResponse = await fetch(callbackUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (callbackResponse.ok) {
            console.log(`[Webhook Bridge] Callback for job ${jobId} successfully delivered to ${callbackUrl}. Status: ${callbackResponse.status}`);
        } else {
            console.warn(`[Webhook Bridge] Callback for job ${jobId} failed with status: ${callbackResponse.status} from client.`);
        }

    } catch (error) {
        console.error(`[Webhook Bridge] Job ${jobId} failed: ${error.message}`);
        
        // Optionally notify client about failure
        try {
            await fetch(callbackUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    job_id: jobId,
                    status: 'failed',
                    error: error.message,
                    failed_at: new Date().toISOString()
                })
            });
            console.log(`[Webhook Bridge] Failure notification sent to client for job ${jobId}.`);
        } catch (callbackError) {
            console.error(`[Webhook Bridge] Could not send failure notification to client: ${callbackError.message}`);
        }
    }
}

app.listen(port, () => {
    console.log(`\n🚀 Webhook API is UP and running!`);
    console.log(`- Base URL: http://localhost:${port}/`);
    console.log(`- Swagger UI: http://localhost:${port}/api-docs`);
    console.log(`- Initiation point: POST http://localhost:${port}/jobs`);
}).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`\n❌ ERROR: Port ${port} is already in use.`);
        console.error(`Please close the existing process running on this port or use a different port.\n`);
    } else {
        console.error(`\n❌ Unexpected server error:`, err);
    }
    process.exit(1);
});
