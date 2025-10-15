# Blinker Count Frontend

React + Vite + Tailwind CSS frontend for the Blinker Count application.

## Setup Instructions

### 1. Install Dependencies

\`\`\`bash
cd frontEnd
npm install
\`\`\`

### 2. Environment Configuration

Create a `.env` file in the `frontEnd` directory:

\`\`\`bash
cp .env.example .env
\`\`\`

The default configuration points to `http://localhost:5000/api` for local development.

### 3. Run the Development Server

\`\`\`bash
npm run dev
\`\`\`

The frontend will run on `http://localhost:5173`

## Important Notes

- **Backend Required**: The frontend needs the Python backend running on port 5000
- **CORS**: The backend has CORS enabled to allow requests from the frontend
- **API Service**: All backend communication is handled through `src/services/api.js`

## Project Structure

\`\`\`
frontEnd/
├── src/
│   ├── pages/
│   │   └── BlinkerPage.jsx    # Main blinker button page
│   ├── services/
│   │   └── api.js             # Backend API communication
│   ├── App.jsx                # Root component
│   ├── main.jsx               # Entry point
│   └── index.css              # Global styles + animations
├── .env.example               # Environment variables template
└── package.json
\`\`\`

## Features

- Engaging 3D-style button with animations
- Particle effects on click
- Real-time counter updates
- Responsive design
- Error handling with user feedback
- Smooth transitions and hover effects

## Building for Production

\`\`\`bash
npm run build
\`\`\`

Update the `VITE_API_URL` in your `.env` file to point to your production backend URL.
