# Deployment Guide for Insurance Lead Tracker

This guide will walk you through deploying the Insurance Lead Tracker application to Render.com.

## Prerequisites

1. Create a [Render.com](https://render.com) account if you don't have one.
2. Make sure you have access to your database credentials (the application uses PostgreSQL with Drizzle ORM).

## Deployment Steps

### 1. Push your code to a Git repository (GitHub, GitLab, etc.)

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-git-repo-url>
git push -u origin main
```

### 2. Deploy to Render.com

#### Manual Deployment:

1. Log in to your [Render Dashboard](https://dashboard.render.com)
2. Click on "New" and select "Web Service"
3. Connect your Git repository
4. Fill in the following details:
   - Name: `insurance-lead-tracker`
   - Environment: `Node`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
   - Plan: Choose Free or Starter based on your needs

5. Add the required environment variables:
   - `NODE_ENV`: production
   - `DATABASE_URL`: Your PostgreSQL connection string
   - Add any other environment variables your app needs (Twilio, Ringba, etc.)

6. Click "Create Web Service"

#### Blueprint Deployment (recommended):

1. Add the `render.yaml` file to your repository (already created)
2. Go to your Render Dashboard and select "Blueprints"
3. Click "New Blueprint Instance"
4. Connect to your repository
5. Configure environment variables
6. Deploy!

### 3. Database Setup

If you're using a new database instance:

1. Create a PostgreSQL database on Render or use an existing one
2. Update your `DATABASE_URL` environment variable
3. After deployment, run database migrations with:

```
npm run db:push
```

### 4. Verify Deployment

1. Once deployment is complete, Render will provide a URL for your application
2. Visit the URL to ensure your application is working correctly
3. Test the quote page functionality by navigating to `/quote/{qfCode}`

## Troubleshooting

- Check Render logs if you encounter any issues
- Ensure all environment variables are properly set
- Verify your database connection string is correct
