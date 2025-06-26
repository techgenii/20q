# Deployment Guide for 20Q Game

This guide covers setting up CI/CD deployment to AWS using GitHub Actions.

## Prerequisites

1. **AWS Account** with appropriate permissions
2. **GitHub Repository** with your 20Q code
3. **AWS CLI** configured locally (for initial setup)

## AWS Infrastructure Setup

### 1. Create AWS Lambda Function

```bash
# Create the Lambda function
aws lambda create-function \
  --function-name 20q-backend \
  --runtime python3.11 \
  --role arn:aws:iam::YOUR_ACCOUNT_ID:role/lambda-execution-role \
  --handler app.handler \
  --zip-file fileb://lambda-deployment.zip \
  --timeout 30 \
  --memory-size 512
```

### 2. Create S3 Bucket for Frontend

```bash
# Create S3 bucket for static website hosting
aws s3 mb s3://your-20q-frontend-bucket
aws s3 website s3://your-20q-frontend-bucket --index-document index.html --error-document index.html
```

### 3. Create CloudFront Distribution

```bash
# Create CloudFront distribution for the S3 bucket
aws cloudfront create-distribution \
  --distribution-config file://cloudfront-config.json
```

### 4. Set up IAM Roles

Create an IAM user with the following permissions:
- Lambda: Full access
- API Gateway: Full access
- S3: Full access to your bucket
- CloudFront: Full access
- IAM: Limited permissions for role assumption

## GitHub Secrets Configuration

Add the following secrets to your GitHub repository (Settings > Secrets and variables > Actions):

### AWS Credentials
- `AWS_ACCESS_KEY_ID`: Your AWS access key
- `AWS_SECRET_ACCESS_KEY`: Your AWS secret key
- `AWS_ACCOUNT_ID`: Your AWS account ID

### Application Secrets
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key
- `SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `ELEVENLABS_API_KEY`: Your ElevenLabs API key
- `ELEVENLABS_VOICE_ID`: Your ElevenLabs voice ID
- `ELEVENLABS_BASE_URL`: ElevenLabs API base URL
- `OPENAI_API_KEY`: Your OpenAI API key

### Frontend Configuration
- `S3_BUCKET_NAME`: Your S3 bucket name for frontend hosting
- `CLOUDFRONT_DISTRIBUTION_ID`: Your CloudFront distribution ID
- `VITE_API_URL`: Your API Gateway URL

## Deployment Process

### 1. Initial Setup

1. Push your code to the `main` branch
2. GitHub Actions will automatically:
   - Run tests
   - Build the backend
   - Deploy to AWS Lambda
   - Set up API Gateway
   - Deploy frontend to S3
   - Invalidate CloudFront cache

### 2. Manual Deployment

To deploy manually:

```bash
# Backend deployment
cd backend
pip install -r requirements.txt -t .
zip -r ../lambda-deployment.zip . -x "*.pyc" "__pycache__/*" "tests/*" "*.md"

aws lambda update-function-code \
  --function-name 20q-backend \
  --zip-file fileb://lambda-deployment.zip

# Frontend deployment
cd frontend
npm run build
aws s3 sync dist/ s3://your-bucket-name --delete
aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"
```

## Environment Variables

### Backend (Lambda)
The following environment variables are automatically set by the CI/CD pipeline:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ANON_KEY`
- `ELEVENLABS_API_KEY`
- `ELEVENLABS_VOICE_ID`
- `ELEVENLABS_BASE_URL`
- `OPENAI_API_KEY`

### Frontend
The frontend uses the `VITE_API_URL` environment variable to connect to the backend API.

## Monitoring and Logs

### Lambda Logs
```bash
aws logs describe-log-groups --log-group-name-prefix "/aws/lambda/20q-backend"
aws logs tail /aws/lambda/20q-backend --follow
```

### API Gateway Logs
Enable CloudWatch logging for API Gateway to monitor API requests and responses.

### CloudFront Logs
Enable access logging for CloudFront to monitor frontend usage.

## Troubleshooting

### Common Issues

1. **Lambda Timeout**: Increase timeout in Lambda configuration
2. **Memory Issues**: Increase memory allocation for Lambda
3. **CORS Issues**: Configure CORS in API Gateway
4. **Environment Variables**: Ensure all secrets are properly set in GitHub

### Debugging

1. Check GitHub Actions logs for deployment errors
2. Monitor Lambda CloudWatch logs
3. Test API endpoints directly
4. Verify environment variables are set correctly

## Security Considerations

1. **IAM Roles**: Use least privilege principle
2. **Secrets**: Never commit secrets to version control
3. **HTTPS**: Always use HTTPS for production
4. **CORS**: Configure CORS properly for your domain
5. **Rate Limiting**: Consider implementing rate limiting

## Cost Optimization

1. **Lambda**: Monitor execution time and memory usage
2. **API Gateway**: Consider caching strategies
3. **CloudFront**: Use appropriate cache settings
4. **S3**: Use lifecycle policies for old files

## Backup and Recovery

1. **Database**: Set up automated backups for Supabase
2. **Code**: Use Git tags for version management
3. **Configuration**: Document all configuration changes
4. **Rollback**: Keep previous Lambda versions for quick rollback 