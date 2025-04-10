# Deploying Budget Buddy to Vercel

This guide provides instructions for deploying the Budget Buddy application to Vercel.

## Prerequisites

1. A [Vercel account](https://vercel.com/signup) (you can sign up with your GitHub account)
2. Git repository with your Budget Buddy code
3. MongoDB Atlas database (already set up)

## Environment Variables

Make sure to set the following environment variables in your Vercel project settings:

### Required Variables

- `MONGODB_URI`: Your MongoDB connection string (mongodb+srv://budgetbuddy:Katakunc12345@cluster0.ugjb4yk.mongodb.net/budget-buddy?retryWrites=true&w=majority)
- `SESSION_SECRET`: A secret key for session management (e.g., budgetbuddysecretkey2025)
- `NODE_ENV`: Set to "production"

### Google OAuth (if using Google login)

- `GOOGLE_CLIENT_ID`: Your Google OAuth client ID
- `GOOGLE_CLIENT_SECRET`: Your Google OAuth client secret

## Deployment Steps

### Option 1: Deploy from GitHub

1. Push your code to GitHub
2. Log in to your Vercel account
3. Click "New Project"
4. Import your GitHub repository
5. Configure the project:
   - Build Command: `npm install && npm run build`
   - Output Directory: Leave blank (default)
   - Install Command: `npm install`
6. Add the environment variables mentioned above
7. Click "Deploy"

### Option 2: Deploy using Vercel CLI

1. Install Vercel CLI: `npm i -g vercel`
2. Log in to Vercel: `vercel login`
3. Navigate to your project directory
4. Run: `vercel`
5. Follow the prompts to configure your project
6. For production deployment, run: `vercel --prod`

## Verifying Deployment

After deployment, Vercel will provide you with a URL for your application. Visit this URL to ensure everything is working correctly.

## Troubleshooting

If you encounter issues:

1. Check the Vercel deployment logs
2. Verify your environment variables are set correctly
3. Make sure your MongoDB Atlas database is accessible from Vercel's servers
4. Check that your application is properly configured for Vercel deployment

## Updating Your Deployment

To update your deployment:

1. Push changes to your GitHub repository (if using GitHub deployment)
2. Vercel will automatically redeploy your application
3. Or, run `vercel --prod` again if using the CLI
