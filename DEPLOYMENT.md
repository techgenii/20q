# Deployment Guide

This guide explains how to deploy the 20Q Game API to AWS Lambda using GitHub Actions.

## Prerequisites

1. **AWS Account** with appropriate permissions
2. **GitHub Repository** with the 20Q codebase
3. **External Service API Keys** (Supabase, OpenAI, ElevenLabs)

## Setup Instructions

### 1. AWS Setup

#### Create IAM User for GitHub Actions
```bash
# Create a new IAM user
aws iam create-user --user-name github-actions-20q

# Create access keys
aws iam create-access-key --user-name github-actions-20q

# Attach necessary policies
aws iam attach-user-policy --user-name github-actions-20q --policy-arn arn:aws:iam::aws:policy/AdministratorAccess
```

**Note:** For production, use more restrictive policies. The minimum required permissions are:
- `AWSLambda_FullAccess`
- `IAMFullAccess` (for creating roles)
- `CloudWatchLogsFullAccess`
- `APIGatewayAdministrator`

### 2. GitHub Secrets Setup

Go to your GitHub repository → Settings → Secrets and variables → Actions, and add the following secrets:

#### AWS Credentials
- `AWS_ACCESS_KEY_ID` - Your AWS access key
- `AWS_SECRET_ACCESS_KEY` - Your AWS secret key

#### Supabase Configuration
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_KEY` - Your Supabase service role key
- `SUPABASE_ANON_KEY` - Your Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key

#### OpenAI Configuration
- `OPENAI_API_KEY` - Your OpenAI API key

#### ElevenLabs Configuration
- `ELEVENLABS_API_KEY` - Your ElevenLabs API key
- `ELEVENLABS_VOICE_ID` - Default voice ID (optional, defaults to `pNInz6obpgDQGcFmaJgB`)

### 3. Deployment Workflows

The repository includes two GitHub Actions workflows:

#### Production Deployment (`deploy.yml`)
- **Triggers:** Push to `main` branch
- **Environment:** Production (`prod` stage)
- **URL Pattern:** `https://[api-id].execute-api.us-east-1.amazonaws.com/prod/`

#### Staging Deployment (`deploy-staging.yml`)
- **Triggers:** Pull requests to `main`, push to `develop` or `staging` branches
- **Environment:** Staging (`staging` stage)
- **URL Pattern:** `https://[api-id].execute-api.us-east-1.amazonaws.com/staging/`

### 4. Manual Deployment

For local testing or manual deployment:

```bash
cd backend

# Set environment variables
export AWS_ACCESS_KEY_ID="your-key"
export AWS_SECRET_ACCESS_KEY="your-secret"
export SUPABASE_URL="your-url"
# ... (set all other required variables)

# Deploy to staging
./deploy.sh staging us-east-1

# Deploy to production
./deploy.sh prod us-east-1
```

## API Endpoints

Once deployed, your API will be available at:

### Production
```
https://[api-id].execute-api.us-east-1.amazonaws.com/prod/
```

### Staging
```
https://[api-id].execute-api.us-east-1.amazonaws.com/staging/
```

### Available Endpoints
- `POST /auth/signup` - User registration
- `POST /auth/login` - User login
- `POST /start_game` - Start a new game
- `POST /join_game` - Join an existing game
- `POST /ask_question` - Ask a question
- `POST /make_guess` - Make a guess
- `GET /game/{game_id}` - Get game information
- `POST /voice/text-to-speech` - Text-to-speech conversion
- `GET /voice/voices` - Get available voices

## Monitoring and Logs

### View Logs
```bash
# Production logs
npx serverless logs -f api --stage prod --region us-east-1

# Staging logs
npx serverless logs -f api --stage staging --region us-east-1
```

### CloudWatch Dashboard
- Logs are automatically sent to CloudWatch
- Create custom dashboards for monitoring
- Set up alarms for errors and performance metrics

## Troubleshooting

### Common Issues

1. **Environment Variables Missing**
   - Ensure all required secrets are set in GitHub
   - Check that variable names match exactly

2. **AWS Permissions**
   - Verify IAM user has necessary permissions
   - Check CloudTrail for permission denied errors

3. **Python Dependencies**
   - Ensure `requirements.txt` includes all dependencies
   - Check for version conflicts

4. **Lambda Timeout**
   - Increase timeout in `serverless.yml` if needed
   - Optimize code for faster execution

### Debugging

1. **Check GitHub Actions Logs**
   - Go to Actions tab in your repository
   - Click on the failed workflow
   - Review step-by-step logs

2. **Check AWS CloudWatch Logs**
   - Navigate to CloudWatch → Log groups
   - Find your Lambda function logs
   - Review recent log entries

3. **Test Locally**
   - Use the manual deployment script
   - Test with `serverless offline` for local development

## Security Considerations

1. **API Keys**
   - Never commit API keys to the repository
   - Use GitHub Secrets for all sensitive data
   - Rotate keys regularly

2. **AWS Permissions**
   - Use least privilege principle
   - Consider using AWS IAM roles instead of access keys
   - Enable CloudTrail for audit logging

3. **Environment Separation**
   - Use different API keys for staging/production
   - Separate Supabase projects for different environments
   - Use different OpenAI API keys per environment

## Cost Optimization

1. **Lambda Configuration**
   - Adjust memory allocation based on needs
   - Set appropriate timeout values
   - Use provisioned concurrency for consistent performance

2. **API Gateway**
   - Enable caching where appropriate
   - Use usage plans to control rate limits
   - Monitor usage and adjust limits

3. **Monitoring**
   - Set up billing alerts
   - Monitor Lambda execution times
   - Track API Gateway usage 