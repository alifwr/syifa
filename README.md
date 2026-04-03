# Syifa API Bridge System

A demonstration of asynchronous patterns used to handle long-running HTTP requests. This project consists of three microservices that work together to prevent client timeouts and handle heavy processing tasks gracefully using two common patterns: **Polling** and **Webhooks**.

---

## 🏗️ Architecture Overview

The system supports two asynchronous communication patterns:

### 1. Polling Pattern (`syifa-api-polling`)
1. **Client** initiates a task.
2. **Bridge API** acknowledges immediately with a `job_id`.
3. **Bridge API** calls the **Slow API** in the background.
4. **Client** polls the status endpoint until the result is available.

### 2. Webhook Pattern (`syifa-api-webhook`)
1. **Client** initiates a task and provides a `callback_url`.
2. **Bridge API** acknowledges immediately with a `job_id`.
3. **Bridge API** calls the **Slow API** in the background.
4. Once completed, the **Bridge API** sends a POST request back to the client's `callback_url` with the result.

---

## 🚀 Services

### 1. Slow API (`/slow-api`)
Simulates a heavy-processing service with a configurable delay (default 500 seconds).
- **Port:** `3000`
- **Endpoints:**
  - `GET /`: Health check.
  - `GET /slow`: Triggers the slow response.
  - `GET /api-docs`: Swagger Interactive UI.

### 2. Polling API (`/syifa-api-polling`)
Bridge service using the **Polling** pattern.
- **Port:** `3001`
- **Endpoints:**
  - `POST /jobs`: Initiates a new background task.
  - `GET /status/:job_id`: Checks the current status and returns result.
  - `GET /api-docs`: Swagger Interactive UI.

### 3. Webhook API (`/syifa-api-webhook`)
Bridge service using the **Webhook** pattern.
- **Port:** `3002`
- **Endpoints:**
  - `POST /jobs`: Initiates a task with a `callback_url`.
  - `GET /api-docs`: Swagger Interactive UI.

---

## 🛠️ Getting Started

### Prerequisites
- Node.js (v18+ recommended)

### Installation
Install dependencies for all services:
```bash
# Install Slow API
cd slow-api
npm install

# Install Polling API
cd ../syifa-api-polling
npm install

# Install Webhook API
cd ../syifa-api-webhook
npm install
```

### Running the Services
Open separate terminal windows for each service:

**Terminal 1 (Slow API):**
```bash
cd slow-api
npm start
```

**Terminal 2 (Polling API):**
```bash
cd syifa-api-polling
npm start
```

**Terminal 3 (Webhook API):**
```bash
cd syifa-api-webhook
npm start
```

---

## 📝 Usage Examples

### Case A: Polling Method
1. **Initiate**: `curl -X POST http://localhost:3001/jobs`
2. **Poll**: `curl http://localhost:3001/status/<job_id>`

### Case B: Webhook Method
1. **Initiate**:
   ```bash
   curl -X POST http://localhost:3002/jobs \
     -H "Content-Type: application/json" \
     -d '{"callback_url": "http://localhost:3003/webhook-test"}'
   ```
2. **Receive**: Your server at `callback_url` will receive a POST request when the data is ready.

---

## 🔍 How to Demonstrate the Webhook Callback

If you're testing locally, you need a way to receive the callback. You have two options:

### Option 1: Use the included Listener Script
I've included a simple listener script for demonstration:
1. Open a new terminal.
2. Run: `node listener.js` (inside `syifa-api-webhook`).
3. It will listen at `http://localhost:3003/webhook-test`.
4. Use this URL when initiating a job.

### Option 2: Use Webhook.site (Public URL)
If you want to see the callback on a web interface:
1. Go to [Webhook.site](https://webhook.site/).
2. Copy "Your unique URL".
3. Use that URL when initiating the job.
4. Watch the request arrive live on the website!

---

## 💡 Troubleshooting
If you encounter a `refspec main does not match any` error during git push, it is likely because your local branch is named `master`. Try:
```bash
git push origin master
```
