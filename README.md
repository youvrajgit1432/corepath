# CorePath

CorePath is a Next.js career guidance app that helps users explore career categories, take a career quiz, and see learning roadmaps and recommendations.

## Features

- Career category browsing and filtering
- Detailed career cards and career pages
- Interactive career quiz for personalized recommendations
- Learning roadmap and skill tree visualization
- AI impact indicators and career system guidance

## Project structure

- `app/` — Next.js application pages and API routes
- `components/` — Reusable UI components
- `data/` — Career, quiz, roadmap, and system configuration data
- `public/` — Static assets (if used)
- `package.json` — Project dependencies and scripts

## Getting started

### Prerequisites

- Node.js 18+ or newer
- npm installed

### Install dependencies

```bash
cd mnt/user-data/outputs/corepath-frontend
npm install
```

### Run locally

```bash
npm run dev
```

Open `http://localhost:3000` in your browser.

### Build for production

```bash
npm run build
npm run start
```

## Deployment

This app is ready to deploy on Vercel or any platform that supports Next.js.

### Vercel deployment

1. Push your repo to GitHub
2. Import the repo in Vercel
3. Use default Next.js settings and deploy

## Notes

- Make sure `package.json` and `next.config.js` match your environment
- If you add API routes or environment variables, include them in Vercel settings

