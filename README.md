# CCS Profiling System

A full-stack web application for managing student and faculty profiles, schedules, skills and events.

## Prerequisites

- **Node.js** v18 or higher
- **npm** (comes with Node.js)
- **MongoDB** (local installation or MongoDB Atlas account)

---

## Quick Start

### 1. Install Dependencies

```bash
# Install backend dependencies
cd backend
npm install


# Install frontend dependencies
cd ../frontend
npm install

```


### 2. Configure Environment Variables

#### Backend Setup (`backend/.env`)

Create a `.env` file in the `backend` folder:

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` with your configuration:

```env
# Server port
PORT=5001

# MongoDB Connection String
# For Local MongoDB:
MONGODB_URI=mongodb://localhost:27017/ccs-profiling-system

# For MongoDB Atlas (Cloud):
# MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/ccs-profiling-system?retryWrites=true&w=majority
```

#### Frontend Setup (`frontend/.env`)

Create a `.env` file in the `frontend` folder:

```bash
cd frontend
echo "VITE_API_URL=http://localhost:5001" > .env
```

Or manually create `frontend/.env`:

```env
VITE_API_URL=http://localhost:5001
```

> **Important:** The `VITE_API_URL` must match the `PORT` in your backend `.env` file.
> For backward compatibility, `VITE_BACKEND_URL` is also supported.

---


### Access the Application

Open your browser and navigate to: **http://localhost:5173**

---

## Changing Ports

If you need to change the backend port:

### 1. Update Backend Port

Edit `backend/.env`:
```env
PORT=5002
```

### 2. Update Frontend Proxy

Edit `frontend/.env`:
```env
VITE_API_URL=http://localhost:5002
```

### 3. Restart Both Servers

```bash
# Stop both servers (Ctrl+C) and restart
cd backend && npm start
cd ../frontend && npm run dev
```

## Development Commands

### Backend

```bash
npm start          # Start the server
npm test           # Run tests (if configured)
```

### Frontend

```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run preview    # Preview production build
```

### Deployment notes

Do not commit real connection strings, JWT signing keys, or seed passwords. Set them only in the environment for each deployment (for example Render/Heroku env vars or a private `.env` that is gitignored).

Edit `backend/.env` (example values — replace with your own secrets):

```env
PORT=5000
MONGODB_URI=mongodb+srv://YOUR_DB_USER:YOUR_DB_PASSWORD@YOUR_CLUSTER.mongodb.net/YOUR_DB_NAME?retryWrites=true&w=majority
JWT_SECRET=generate-a-long-random-string-and-store-it-only-in-secrets
```

Edit `frontend/.env`:

```env
# Local development
VITE_API_URL=http://localhost:5000

# Production — use your deployed API base URL
VITE_API_URL=https://your-api.example.com
```

### Render (recommended for this repo)

This project has two deploy targets:

- API service from `backend`
- Static frontend from `frontend`

If only one service is deployed (or wrong root directory is used), many pages will show `404`/`Failed to fetch`.

Use the included `render.yaml` blueprint to create both services together.

#### Required environment variables

For API service (`backend`):

```env
MONGODB_URI=<your mongodb uri>
JWT_SECRET=<your jwt secret>
# Include your frontend domain(s), comma-separated
CORS_ORIGINS=https://<your-frontend>.onrender.com
```

For frontend service (`frontend`):

```env
VITE_API_URL=https://<your-api-service>.onrender.com
```

#### Post-deploy verification

Open these URLs after deployment:

- `https://<your-api-service>.onrender.com/api/health` -> should return `{"ok":true,...}`
- `https://<your-api-service>.onrender.com/api/auth/login` (POST only) -> should not be `404`
- `https://<your-api-service>.onrender.com/api/events` -> should return API response (or auth error), not `Cannot GET`

If `api/students` works but `api/events` / `api/syllabi` / `api/scheduling` are `404`, you are pointing to an older or different backend service.



## Install faker.js for generating fake data
```bash
npm install @faker-js/faker --save-dev --legacy-peer-deps
```

## Seed all of the users
```bash
npm run seed:master
```