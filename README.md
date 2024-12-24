# Kitchen Elf - Windows Installation Guide

## Prerequisites

1. Install Git

   - Download from: https://git-scm.com/download/windows
   - During installation, select "Use Git from Git Bash only"

2. Install Node.js

   - Download Node.js 18.x LTS from: https://nodejs.org/
   - During installation, check "Automatically install necessary tools"

3. Install Python

   - Download Python 3.11 from: https://www.python.org/downloads/
   - During installation, check "Add Python to PATH"
   - Check "Install pip"

4. Install Docker Desktop
   - Download from: https://www.docker.com/products/docker-desktop/
   - During installation, ensure "WSL 2" option is selected

## Setup Steps

1. Clone the Repository
   git clone https://github.com/your-repo/kitchen-elf.git

2. Create Environment Files
   Create `.env` file in the root directory:

bash
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_JWT_SECRET=your_jwt_secret
ANTHROPIC_API_KEY=your_claude_api_key
GOOGLE_APPLICATION_CREDENTIALS=C:/path/to/your/gcp-key.json

3. Frontend Setup
   bash
   cd frontend
   npm install

4. Backend Setup
   bash
   cd backend
   python -m venv venv
   .\venv\Scripts\activate
   pip install -r requirements.txt

## Running the Application

## Method 2: Docker (Recommended)

1. Start Docker Desktop
2. Run the application:

bash
docker-compose up --build

## Accessing the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

## Common Windows Issues

1. Python Path Issues

   - Solution: Ensure Python is added to PATH
   - Open Command Prompt as admin and run:

   ```bash
   setx PATH "%PATH%;C:\Users\YourUsername\AppData\Local\Programs\Python\Python311"
   ```

2. Node.js Permission Issues

   - Solution: Run PowerShell as administrator and execute:

   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```

3. Docker Issues

   - Ensure WSL 2 is installed:

   ```powershell
   wsl --install
   ```

   - Restart computer after WSL installation

4. Port Conflicts
   - Check if ports 3000 or 8000 are in use:
   ```powershell
   netstat -ano | findstr :3000
   netstat -ano | findstr :8000
   ```
   - To kill a process using a port:
   ```powershell
   taskkill /PID <PID> /F
   ```

## Database Setup

1. Create a Supabase account and project
2. Run the initialization SQL from:

sql:backend/app/db/init.sql
startLine: 14
endLine: 234

## Verification

1. Check Backend Health:

   - Visit http://localhost:8000/health
   - Should see status: "healthy"

2. Check Frontend:
   - Visit http://localhost:3000
   - Should see the login page

## Development Tools (Recommended)

1. VS Code Extensions:

   - Python
   - ESLint
   - Prettier
   - Docker
   - TypeScript and JavaScript Language Features

2. Database Tools:
   - TablePlus or DBeaver for database management

## Need Help?

1. Check the logs:

   - Frontend: Check the browser console (F12)
   - Backend: Check the terminal running uvicorn
   - Docker: `docker-compose logs -f`

2. Common error solutions:
   - `python not found`: Restart terminal after Python installation
   - `npm not found`: Restart terminal after Node.js installation
   - Docker errors: Ensure Docker Desktop is running and WSL 2 is installed
