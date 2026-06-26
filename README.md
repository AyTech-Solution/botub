# Botub AI - Standalone Deployment Guide

This application is ready to be deployed on **Render** or any Node.js environment.

## Deployment to Render

1. **Connect your GitHub Repository** to Render.
2. **Environment Variables**: Add all variables from `.env.example` to your Render project settings.
   - For `FIREBASE_SERVICE_ACCOUNT`, you can download the JSON key from your Firebase Console (Project Settings > Service Accounts) and paste the ENTIRE JSON string as the value.
3. **Build Command**: `npm run build`
4. **Install Command**: `npm install`
5. **Output Directory**: `dist`

## Local Development
1. `npm install`
2. Create a `.env` file based on `.env.example`.
3. `npm run dev`
