# 20Q - Multi Player Game

[![Built with Bolt](https://img.shields.io/badge/Built%20with-Bolt-blue?style=flat-square)](https://bolt.new)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![Python](https://img.shields.io/badge/python-3.8+-blue.svg)](https://www.python.org/downloads/)
[![TypeScript](https://img.shields.io/badge/typescript-4.0+-blue.svg)](https://www.typescriptlang.org/)

A modern, multiplayer implementation of the classic "20 Questions" game where players think of an object and others try to guess it using yes/no questions.

## 🎮 Features

- **Multiplayer Support**: Play with friends in real-time
- **Intelligent AI**: AI-powered question suggestions and object recognition
- **Web Interface**: Clean, responsive web UI built with modern technologies
- **Real-time Communication**: Live game updates and chat functionality
- **Question History**: Track questions and answers throughout the game
- **Scoring System**: Points-based gameplay with leaderboards

## 🚀 Quick Start

### Prerequisites

- Python 3.8 or higher
- Node.js 16 or higher
- npm or yarn
- Supabase account and project

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/techgenii/20q.git
   cd 20q
   ```

2. **Set up Supabase**
   ```bash
   # Configure your Supabase project
   # Add your Supabase URL and API key to environment variables
   ```

3. **Install Python dependencies**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

4. **Install Node.js dependencies**
   ```bash
   cd frontend
   npm install
   ```

5. **Run database migrations**
   ```bash
   # Apply Supabase migrations
   supabase db push
   ```

6. **Start the development servers**
   ```bash
   # Start the backend server (from backend directory)
   python main.py
   
   # In another terminal, start the frontend (from frontend directory)
   npm run dev
   ```

5. **Open your browser**
   ```
   Navigate to http://localhost:3000
   ```

## 🎯 How to Play

1. **Create or Join a Game**: Start a new game or join an existing room
2. **Think of an Object**: One player thinks of any object, person, or concept
3. **Ask Questions**: Other players take turns asking yes/no questions
4. **Make Guesses**: Try to guess the object within 20 questions
5. **Score Points**: Earn points for correct guesses and clever questions

## 🛠️ Technology Stack

- **Backend**: Python with modern web framework
- **Frontend**: TypeScript/JavaScript with modern web frameworks
- **Database**: Supabase (PostgreSQL) for real-time data and authentication
- **Real-time**: Supabase real-time subscriptions for live gameplay
- **Testing**: pytest for backend testing
- **Development**: VS Code configuration included

## 📁 Project Structure

```
20q/
├── backend/          # Python backend server
│   ├── data/         # Game data and assets
│   ├── tests/        # Backend test files
│   └── __pycache__/  # Python cache files
├── frontend/         # TypeScript/JavaScript frontend
│   ├── src/          # Source code
│   └── node_modules/ # Node.js dependencies
├── supabase/         # Supabase configuration
│   └── migrations/   # Database migration files
├── htmlcov/          # Coverage reports
└── .vscode/          # VS Code configuration
```

## 🎲 Game Rules

- Players have up to 20 yes/no questions to guess the object
- Questions should be answerable with "Yes", "No", or "Sometimes/Maybe"
- The thinking player should answer honestly
- Guessing the object correctly within 20 questions wins the round
- Points are awarded based on efficiency and creativity

## 🧪 Testing

Run the backend tests:

```bash
cd backend
pytest
```

View test coverage:
```bash
# Generate coverage report
pytest --cov=. --cov-report=html
# Open htmlcov/index.html in your browser
```

- Players have up to 20 yes/no questions to guess the object
- Questions should be answerable with "Yes", "No", or "Sometimes/Maybe"
- The thinking player should answer honestly
- Guessing the object correctly within 20 questions wins the round
- Points are awarded based on efficiency and creativity

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the GNU General Public License v3.0 - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- [Live Demo](https://your-demo-link.com) *(if available)*
- [Documentation](https://github.com/techgenii/20q/wiki)
- [Report Issues](https://github.com/techgenii/20q/issues)
- [Discussions](https://github.com/techgenii/20q/discussions)

## 🙏 Acknowledgments

- Classic 20 Questions game inspiration
- Open source community for tools and libraries
- Contributors and testers

## 📊 Stats

![GitHub last commit](https://img.shields.io/github/last-commit/techgenii/20q)
![GitHub issues](https://img.shields.io/github/issues/techgenii/20q)
![GitHub pull requests](https://img.shields.io/github/issues-pr/techgenii/20q)

---

**Made with ❤️ by [TechGenii](https://github.com/techgenii)**