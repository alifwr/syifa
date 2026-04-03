# Syifa API Polling System

A demonstration of the **Asynchronous Polling Pattern** used to handle long-running HTTP requests. This project consists of two microservices that work together to prevent client timeouts and handle heavy processing tasks gracefully.

## 🏗️ Architecture Overview

The system architecture follows this flow:
1. **Client** initiates a task via the **Polling API**.
2. **Polling API** acknowledges the request immediately with a `job_id`.
3. **Polling API** starts the heavy task by calling the **Slow API** in the background.
4. **Client** polls the status of the job at regular intervals.
5. Once the **Slow API** finished, the **Polling API** updates the job status to `completed`.

---

## 🚀 Services

### 1. Slow API (`/slow-api`)
Simulates a heavy-processing service with a 500-second delay.
- **Port:** `3000`
- **Endpoints:**
  - `GET /`: Health check.
  - `GET /slow`: Triggers the slow response.
  - `GET /api-docs`: **Swagger Interactive UI** 🚀

### 2. Polling API (`/syifa-api-polling`)
The gateway that manages background jobs and polling.
- **Port:** `3001`
- **Endpoints:**
  - `POST /jobs`: Initiates a new background task.
  - `GET /status/:job_id`: Checks the current status and returns result.
  - `GET /api-docs`: **Swagger Interactive UI** 🚀

---

## 🛠️ Getting Started

### Prerequisites
- Node.js (v18+ recommended)

### Installation
Install dependencies for both services:
```bash
# Install Slow API
cd slow-api
npm install

# Install Polling API
cd ../syifa-api-polling
npm install
```

### Running the Services
Open two terminal windows:

**Terminal 1 (Slow API):**
```bash
cd slow-api
node index.js
```

**Terminal 2 (Polling API):**
```bash
cd syifa-api-polling
node index.js
```

---

## 📝 Usage Example

### 1. Initiate a Job
Send a POST request to the Polling API:
```bash
curl -X POST http://localhost:3001/jobs
```
**Response:**
```json
{
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "pending"
}
```

### 2. Poll for Status
Use the `job_id` from the previous step:
```bash
curl http://localhost:3001/status/550e8400-e29b-41d4-a716-446655440000
```

**Response (Processing):**
```json
{
  "id": "...",
  "status": "processing",
  "result": null,
  "created_at": "..."
}
```

**Response (Completed):**
Once the 500s delay is up, the result will appear:
```json
{
  "id": "...",
  "status": "completed",
  "result": {
    "message": "Success!",
    "data": "This data was returned very slowly as requested.",
    "delay": "500 seconds"
  },
  "completed_at": "..."
}
```

---

## 💡 Troubleshooting
If you encounter a `refspec main does not match any` error during git push, it is likely because your local branch is named `master`. Try:
```bash
git push origin master
```
