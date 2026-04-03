const express = require('express');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const app = express();
const port = 3000;

// Swagger definition
const swaggerOptions = {
    swaggerDefinition: {
        openapi: '3.0.0',
        info: {
            title: 'Slow API',
            version: '1.0.0',
            description: 'A mock server that returns responses with a significant delay.',
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
 * /:
 *   get:
 *     summary: Health check endpoint
 *     responses:
 *       200:
 *         description: API is running
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 */
app.get('/', (req, res) => {
    res.json({ status: 'API is running' });
});

/**
 * @swagger
 * /slow:
 *   get:
 *     summary: Triggers a slow response (500s delay)
 *     responses:
 *       200:
 *         description: Success response after delay
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: string
 *                 delay:
 *                   type: string
 *                 timestamp:
 *                   type: string
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

// Error handling for port conflict and other startup issues
const server = app.listen(port, () => {
    console.log(`\n🚀 Slow API is UP and running!`);
    console.log(`- Base URL: http://localhost:${port}/`);
    console.log(`- Swagger UI: http://localhost:${port}/api-docs`);
    console.log(`- Slow endpoint: http://localhost:${port}/slow\n`);
}).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`\n❌ ERROR: Port ${port} is already in use.`);
        console.error(`Please close the existing process running on this port or use a different port.\n`);
    } else {
        console.error(`\n❌ Unexpected server error:`, err);
    }
    process.exit(1);
});
