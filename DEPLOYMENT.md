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
│   ├── app.py                   # FastAPI application entrypoint
│   ├── auth_routes.py           # Authentication and profile routes
│   ├── game_routes.py           # Game logic routes
│   ├── voice_routes.py          # Voice/AI routes
│   ├── models.py                # Pydantic models
│   ├── security.py              # Auth dependencies
│   ├── requirements.txt         # Production dependencies
│   ├── dev-requirements.txt     # Development dependencies
│   ├── pytest.ini               # Test configuration
│   └── tests/                   # Test files
├── frontend/                    # React frontend (Using Bolt.new)
└── .github/workflows/
    └── deploy-lambda.yml        # CI/CD workflow
```

> **Note:** All backend modules now use relative imports (e.g., `from .models import ...`) for compatibility with testing and deployment. The backend is split into modular routers for maintainability.

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
   > Note: This matches the Lambda handler (`app.handler`) and the use of absolute imports in the backend code. If you use a package structure, see the alternative command above.

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
- `POST /auth/logout` - User logout
- `GET /auth/me` - Get current user info
- `POST /auth/refresh` - Refresh access token
- `POST /auth/reset-password` - Send password reset email
- `PUT /profile` - Update user profile
- `POST /start_game` - Start a new game
- `POST /join_game` - Join an existing game
- `POST /ask_question` - Ask a question
- `POST /make_guess` - Make a guess
- `GET /game/{game_id}` - Get game information
- `POST /ask_question_voice` - Ask a question and get audio response
- `POST /voice/text-to-speech` - Text-to-speech conversion
- `GET /voice/voices` - Get available voices
- `POST /voice/speech-to-text` - Speech-to-text conversion
- `POST /game/{game_id}/voice-settings` - Update voice settings for a game

> **Testing Note:**
> Tests are now fully isolated, mock all external dependencies, and should be run from the project root or backend directory.

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
   - If using **absolute imports** (flattened backend for Lambda):
     ```bash
     cd backend
     uvicorn app:app --reload
     ```
   - If using **relative imports** (backend as a package):
     ```bash
     uvicorn backend.app:app --reload
     ```
   - For tests with absolute imports:
     ```bash
     PYTHONPATH=backend pytest
     ```

4. **Import Errors (Relative vs Absolute)**
   - If you see `ImportError: attempted relative import with no known parent package`, you are running the app as a script instead of as a module. Use the correct uvicorn command as above.
   - If you see `ModuleNotFoundError` for your own modules, check that your imports match your deployment structure (absolute for flattened, relative for package).

5. **Lambda Handler Issues**
   - If Lambda fails to start, check that your handler matches your file structure (e.g., `app.handler` for flattened, `backend/app.handler` for package).
   - Ensure all dependencies are included in your deployment package.

6. **Check for Missing Dependencies**
   - If you see `ModuleNotFoundError` for third-party packages, ensure they are in `requirements.txt` and installed in your deployment package.

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