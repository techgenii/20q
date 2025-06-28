#!/bin/bash

# 20Q Game API Deployment Script
# Usage: ./deploy.sh [stage] [region]

set -e

# Default values
STAGE=${1:-dev}
REGION=${2:-us-east-1}

echo "🚀 Deploying 20Q Game API to AWS Lambda..."
echo "Stage: $STAGE"
echo "Region: $REGION"

# Check if required environment variables are set
required_vars=(
    "SUPABASE_URL"
    "SUPABASE_KEY" 
    "SUPABASE_ANON_KEY"
    "SUPABASE_SERVICE_ROLE_KEY"
    "OPENAI_API_KEY"
    "ELEVENLABS_API_KEY"
)

echo "🔍 Checking environment variables..."

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ Error: $var environment variable is not set"
        echo "Please set all required environment variables before deploying"
        exit 1
    fi
    echo "✅ $var is set"
done

# Optional variables with defaults
export ELEVENLABS_VOICE_ID=${ELEVENLABS_VOICE_ID:-"pNInz6obpgDQGcFmaJgB"}

echo "📦 Installing dependencies..."
npm install

echo "🔧 Deploying with Serverless Framework..."
npx serverless deploy --stage $STAGE --region $REGION --verbose

echo "✅ Deployment complete!"
echo ""
echo "🌐 Your API endpoints are available at:"
echo "   https://[api-id].execute-api.$REGION.amazonaws.com/$STAGE/"
echo ""
echo "📊 To view logs:"
echo "   npx serverless logs -f api --stage $STAGE --region $REGION"
echo ""
echo "🗑️  To remove deployment:"
echo "   npx serverless remove --stage $STAGE --region $REGION" 