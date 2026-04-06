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
echo "VITE_BACKEND_URL=http://localhost:5001" > .env
```

Or manually create `frontend/.env`:

```env
VITE_BACKEND_URL=http://localhost:5001
```

> **Important:** The `VITE_BACKEND_URL` must match the `PORT` in your backend `.env` file.

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
VITE_BACKEND_URL=http://localhost:5002
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
