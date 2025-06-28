# 20Q Game

A modern implementation of the classic 20 Questions game with AI-powered responses, voice features, and multiplayer support.

## Features

- 🤖 AI-powered question answering using OpenAI
- 🎤 Text-to-speech using ElevenLabs
- 👥 Multiplayer support with real-time game state
- 🔐 User authentication with Supabase
- 🏆 Leaderboards and achievements
- 📱 Responsive web interface with modern UI components
- ☁️ Serverless deployment on AWS Lambda

## Tech Stack

### Backend
- **Framework**: FastAPI
- **Runtime**: Python 3.11
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **AI**: OpenAI API
- **TTS**: ElevenLabs API
- **Deployment**: AWS Lambda + Serverless Framework

### Frontend
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **UI Framework**: Bolt.new + shadcn/ui
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **State Management**: React Hooks
- **Component Library**: shadcn/ui (New York style)

## Prerequisites

- Python 3.11 or higher
- Node.js 18 or higher
- AWS CLI (for deployment)
- Supabase account
- OpenAI API key
- ElevenLabs API key

## Quick Start

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd 20q
   ```

2. **Set up Python environment**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   pip install -r ../dev-requirements.txt
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys and Supabase credentials
   ```

4. **Run the development server**
   ```bash
   uvicorn app:app --reload
   ```

### Frontend Setup

1. **Install dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Start development server**
   ```bash
   npm run dev
   ```

## Environment Variables

### Backend (.env)
```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_ANON_KEY=your_anon_key
OPENAI_API_KEY=your_openai_key
ELEVENLABS_API_KEY=your_elevenlabs_key
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:8000
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

## Testing

### Backend Tests
```bash
cd backend
python -m pytest tests/ -v
```

### Frontend Tests
```bash
cd frontend
npm test
```

## Deployment

### Backend (AWS Lambda)
```bash
cd backend
npx serverless deploy --stage prod
```

### Frontend (Vercel/Netlify)
```bash
cd frontend
npm run build
# Deploy the dist/ folder to your hosting provider
```

## API Documentation

Once the backend is running, visit:
- **Interactive API docs**: http://localhost:8000/docs
- **ReDoc documentation**: http://localhost:8000/redoc

## Frontend Architecture

The frontend is built with **Bolt.new**, a modern React starter that includes:

- **shadcn/ui**: High-quality, accessible UI components
- **Tailwind CSS**: Utility-first CSS framework
- **TypeScript**: Type-safe JavaScript
- **Vite**: Fast build tool and dev server
- **Lucide React**: Beautiful, customizable icons

### Component Structure
```
frontend/src/
├── components/
│   ├── ui/          # shadcn/ui components
│   ├── auth/        # Authentication components
│   ├── navigation/  # Navigation components
│   ├── screens/     # Page components
│   └── voice/       # Voice-related components
├── hooks/           # Custom React hooks
├── lib/             # Utility functions
└── types/           # TypeScript type definitions
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

This project is licensed under the GNU General Public License v3.0 - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- **Bolt.new** for the modern React starter template
- **shadcn/ui** for the beautiful UI components
- OpenAI for AI capabilities
- ElevenLabs for text-to-speech
- Supabase for backend-as-a-service
- FastAPI for the web framework