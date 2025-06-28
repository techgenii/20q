# Deployment Guide: Whisper Chase 20 Questions (AWS SAM)

This guide explains how to deploy the FastAPI backend to AWS Lambda using AWS SAM (Serverless Application Model).

## Prerequisites
- AWS CLI configured with credentials
- AWS SAM CLI installed
- Python 3.13 installed
- Node.js v22.17.0 or higher (for frontend)
- Supabase project set up

## Environment Variables
Set these as parameters in your SAM template or in the AWS Lambda environment:
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY
- SUPABASE_ANON_KEY
- OPENAI_API_KEY
- ELEVENLABS_API_KEY
- ELEVENLABS_VOICE_ID

## Build and Deploy

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt -t backend
   ```

2. **Build the SAM application:**
   ```bash
   sam build
   ```

3. **Deploy to AWS Lambda:**
   ```bash
   sam deploy --guided
   ```
   - The first time, SAM will prompt for stack name, region, and environment variables.
   - On subsequent deploys, you can use `sam deploy` to reuse the configuration.

## CI/CD with GitHub Actions
- The workflow `.github/workflows/sam-deploy.yml` will run tests and deploy automatically on push to `main`.
- All deployment is now handled via AWS SAM.

## Notes
- All infrastructure is defined in `template.yaml`.
- For local testing, use `sam local start-api`.

---

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
# View Lambda logs in CloudWatch
aws logs describe-log-groups
aws logs get-log-events --log-group-name /aws/lambda/<function-name> --log-stream-name <stream-name>
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
   - Increase timeout in your SAM template if needed
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
   - Use `sam local start-api` for local development

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