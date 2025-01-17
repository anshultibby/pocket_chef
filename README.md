# Kitchen Elf - UI/UX Testing Setup Guide

## Prerequisites

1. Install Node.js
   - Download Node.js 18.x LTS from: https://nodejs.org/
   - During installation, check "Automatically install necessary tools"

## Setup Steps

1. Clone the Repository

   ```bash
   git clone https://github.com/your-repo/kitchen-elf.git
   ```

2. Frontend Setup

   ```bash
   cd frontend
   npm install
   ```

3. Create Mock Environment File
   Create `.env.local` file in the frontend directory:
   ```bash
   NEXT_PUBLIC_API_URL=http://localhost:3000/api
   NEXT_PUBLIC_MOCK_MODE=true
   ```

## Running the Application

1. Start the development server:

   ```bash
   npm run dev
   ```

2. Open [http://localhost:3000](http://localhost:3000) in your browser

## UI/UX Testing Areas

1. Core Features

   - Pantry Management
   - Recipe Generation
   - Receipt Processing
   - Form Interactions
   - Navigation Flow

2. User Interface Elements

   ```typescript:frontend/src/app/page.tsx
   startLine: 51
   endLine: 120
   ```

3. Responsive Design
   - Test on different screen sizes
   - Check mobile navigation
   - Verify form layouts
   - Test touch interactions

## Development Tools (Recommended)

1. VS Code Extensions:

   - ESLint
   - Prettier
   - TypeScript and JavaScript Language Features

2. Browser Tools:
   - Chrome/Firefox DevTools (F12)
   - React Developer Tools browser extension
   - Device Toolbar for responsive testing

## Common Issues

1. Port 3000 Already in Use

   ```bash
   # Check if port is in use
   netstat -ano | findstr :3000

   # Kill the process (replace <PID> with actual process ID)
   taskkill /PID <PID> /F
   ```

2. Node Modules Issues
   ```bash
   # Remove node_modules and reinstall
   rm -rf node_modules
   npm install
   ```

## Need Help?

1. Check the logs:

   - Browser console (F12)
   - Terminal running Next.js

2. Project Structure Reference:

   ```system_diagram.txt
   startLine: 1
   endLine: 42
   ```

3. Styling Reference:
   ```css:frontend/src/app/globals.css
   startLine: 1
   endLine: 22
   ```

IOS stuff

```
1. Create dist and add ios app
npm run add-ios

2. Run the app
launch xcode and try the app



```
