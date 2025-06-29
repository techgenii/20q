# Deployment Guide: Whisper Chase 20 Questions

This guide explains how to deploy the FastAPI backend to AWS Lambda using direct AWS CLI deployment (without SAM).

## Prerequisites
- AWS CLI configured with credentials
- Python 3.13 installed
- Node.js v22.17.0 or higher (for frontend)
- Supabase project set up
- Required API keys (OpenAI, ElevenLabs)

## Environment Variables
Set these environment variables for your deployment:
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY
- SUPABASE_ANON_KEY
- OPENAI_API_KEY
- ELEVENLABS_API_KEY
- ELEVENLABS_VOICE_ID

## Project Structure
```
20q/
├── backend/
│   ├── requirements.txt          # Production dependencies
│   ├── dev-requirements.txt      # Development dependencies
│   ├── pytest.ini               # Test configuration
│   ├── app.py                   # FastAPI application
│   └── tests/                   # Test files
├── frontend/                    # React frontend
└── .github/workflows/
    └── deploy-lambda.yml        # CI/CD workflow
```

## Local Development

1. **Install backend dependencies:**
   ```bash
   cd backend
   pip install -r requirements.txt
   pip install -r dev-requirements.txt
   cd ..
   ```

2. **Run tests:**
   ```bash
   cd backend
   pytest tests/
   cd ..
   ```

3. **Start the development server:**
   ```bash
   cd backend
   uvicorn app:app --reload --host 0.0.0.0 --port 8000
   ```

## Automated Deployment (GitHub Actions)

The project uses GitHub Actions for automated deployment to AWS Lambda. The workflow `.github/workflows/deploy-lambda.yml` handles:

1. **Testing:** Runs all tests before deployment
2. **Packaging:** Creates a Lambda deployment package
3. **Deployment:** Deploys to AWS Lambda and sets up API Gateway

### Required GitHub Secrets

Set these secrets in your GitHub repository:

- `AWS_ACCESS_KEY_ID` - Your AWS access key
- `AWS_SECRET_ACCESS_KEY` - Your AWS secret key
- `AWS_REGION` - AWS region (e.g., us-west-2)
- `LAMBDA_FUNCTION_NAME` - Name for your Lambda function
- `LAMBDA_ROLE_ARN` - IAM role ARN for Lambda execution
- `API_GATEWAY_NAME` - Name for your API Gateway (optional)

### Deployment Process

The workflow automatically:
1. Runs tests on the backend code
2. Creates a deployment package with dependencies
3. Creates or updates the Lambda function
4. Sets up API Gateway with HTTP API
5. Configures Lambda permissions for API Gateway

## Manual Deployment

If you prefer to deploy manually:

1. **Build the deployment package:**
   ```bash
   # Create build directory
   mkdir -p build
   cp -r backend/* build/
   
   # Install dependencies
   python -m venv venv
   source venv/bin/activate
   pip install -r backend/requirements.txt -t build/
   deactivate
   
   # Create ZIP file
   cd build
   zip -r ../lambda-deploy.zip .
   cd ..
   ```

2. **Deploy to Lambda:**
   ```bash
   # Create or update function
   aws lambda create-function \
     --function-name your-function-name \
     --runtime python3.13 \
     --role your-role-arn \
     --handler main.handler \
     --zip-file fileb://lambda-deploy.zip
   
   # Or update existing function
   aws lambda update-function-code \
     --function-name your-function-name \
     --zip-file fileb://lambda-deploy.zip
   ```

3. **Set up API Gateway:**
   ```bash
   # Create HTTP API
   API_ID=$(aws apigatewayv2 create-api \
     --name "YourAPI" \
     --protocol-type HTTP \
     --target arn:aws:lambda:region:account:function:your-function-name \
     --query "ApiId" --output text)
   
   # Add Lambda permissions
   aws lambda add-permission \
     --function-name your-function-name \
     --statement-id apigateway-access \
     --action lambda:InvokeFunction \
     --principal apigateway.amazonaws.com \
     --source-arn arn:aws:execute-api:region:account:$API_ID/*/*/
   ```

## API Endpoints

Once deployed, your API will be available at:

### Production
```
https://[api-id].execute-api.[region].amazonaws.com/
```

### API Documentation
```
https://[api-id].execute-api.[region].amazonaws.com/docs
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
aws logs get-log-events --log-group-name /aws/lambda/YourFunctionName --log-stream-name <stream-name>
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
   - Ensure `backend/requirements.txt` includes all dependencies
   - Check for version conflicts
   - Use Python 3.13 for best compatibility

4. **Lambda Timeout**
   - Increase timeout in Lambda configuration if needed
   - Optimize code for faster execution

5. **CORS Issues**
   - API Gateway and FastAPI both have CORS configured
   - Check browser network tab for CORS errors

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
   - Run `uvicorn app:app --reload` for local development
   - Run tests with `cd backend && pytest tests/`

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