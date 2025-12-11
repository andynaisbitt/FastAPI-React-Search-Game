# JFGI - Just Fucking Google It 🎮

> A modern full-stack URL shortening game that challenges users to find the original URL through timed Google searches. Built with React, Python FastAPI, and WebSockets for real-time leaderboards.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Python](https://img.shields.io/badge/python-3.11+-green.svg)
![React](https://img.shields.io/badge/react-18.3+-blue.svg)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-teal.svg)

## 🌟 Features

- **🔗 URL Shortening** - Create short URLs with custom difficulty levels
- **⏱️ Timed Challenges** - Race against the clock to find the original URL
- **🎯 Difficulty Levels** - Simple, Medium, Hard, Expert with varying time limits
- **💡 Smart Hints** - Progressive hint system with time penalties
- **🏆 Global Leaderboards** - Real-time leaderboards with WebSocket updates
- **🎨 Modern UI** - Beautiful React frontend with Framer Motion animations
- **🔥 Roasting System** - Bart Simpson-style chalkboard messages
- **🛡️ Profanity Filter** - AI-powered content filtering
- **📊 Analytics** - Track completion rates, average times, and player stats
- **🎮 Game Mechanics** - Score calculation, hints, time bonuses, and penalties

## 🏗️ Architecture

### Modern Stack (Primary)

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│  React Frontend │─────>│  Python FastAPI │─────>│  SQLite Database│
│  (Vite + TS)    │<─────│   Backend API   │<─────│   (Dev Mode)    │
│  Port: 5173     │  WS  │   Port: 8002    │      │                 │
└─────────────────┘      └─────────────────┘      └─────────────────┘
```

**Frontend** (`frontend/`):
- **React 18.3** with TypeScript
- **Vite** for blazing-fast dev server
- **Framer Motion** for animations
- **Axios** for API calls
- **WebSocket** support for real-time updates

**Backend** (`backend/`):
- **FastAPI** (Python 3.11+) - Modern async REST API
- **SQLAlchemy** - ORM for database interactions
- **SQLite** (dev) / **PostgreSQL** (prod) - Database
- **WebSocket Manager** - Real-time leaderboard updates
- **Uvicorn** - ASGI server

### Legacy Stack (Archived)

The `legacy/` folder contains the original Node.js/Express server-side rendered version. This has been preserved for reference but is not actively maintained.

## 🚀 Quick Start

### Prerequisites

- **Python 3.11+**
- **Node.js 18+**
- **npm or yarn**

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/andynaisbitt/FastAPI-React-Search-Game.git
   cd FastAPI-React-Search-Game
   ```

2. **Set up the backend**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Set up the frontend**
   ```bash
   cd frontend
   npm install
   cp .env.example .env
   # Edit .env with your configuration
   ```

### Running the Application

**Terminal 1 - Backend API:**
```bash
cd backend
source venv/bin/activate
python -m uvicorn app.main:app --host 127.0.0.1 --port 8002 --reload
```

**Terminal 2 - Frontend Dev Server:**
```bash
cd frontend
npm run dev
```

**Access the application:**
- Frontend: http://localhost:5173
- Backend API Docs: http://localhost:8002/docs
- Backend Health Check: http://localhost:8002/health

## 📖 Usage

### Creating a Challenge

1. Navigate to http://localhost:5173
2. Click "Create New Challenge"
3. Enter a URL (e.g., https://www.github.com)
4. Select difficulty level
5. (Optional) Add custom challenge text
6. Click "Shorten URL"
7. Share the shortened URL with friends!

### Playing a Challenge

1. Click or navigate to a shortened JFGI URL
2. Read the challenge on the chalkboard
3. Use the search bar to find the answer
4. Click on a search result to submit your answer
5. Beat the timer to get on the leaderboard!

## 🎮 Game Mechanics

### Difficulty Levels

| Difficulty | Time Limit | Max Hints | Search Help |
|-----------|-----------|-----------|-------------|
| 😊 Simple  | 300s (5min) | 5 hints | Auto-fill + Operators |
| 😐 Medium  | 180s (3min) | 3 hints | Operators shown |
| 😰 Hard    | 120s (2min) | 2 hints | No help |
| 💀 Expert  | 60s (1min)  | 1 hint  | No help |

### Scoring System

```
Final Score = Base Points + Time Bonus - Hint Penalty

- Base Points: Based on difficulty (Simple: 100, Expert: 500)
- Time Bonus: (Time Remaining / Time Limit) * Base Points
- Hint Penalty: Hints Used * 50 points + (Hints * 10 seconds)
```

## 🛠️ Tech Stack

### Frontend
- **React** 18.3 - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **Axios** - HTTP client

### Backend
- **FastAPI** - Web framework
- **SQLAlchemy** - ORM
- **Uvicorn** - ASGI server
- **Pydantic** - Data validation
- **Python-Dotenv** - Environment management

### Database
- **SQLite** (development)
- **PostgreSQL** (production ready)

## 📁 Project Structure

```
jfgi/
├── backend/               # Python FastAPI backend
│   ├── app/
│   │   ├── api/          # API routes
│   │   ├── core/         # Config & database
│   │   ├── models/       # SQLAlchemy models
│   │   ├── services/     # Business logic
│   │   └── utils/        # Utilities
│   ├── requirements.txt
│   └── .env.example
├── frontend/             # React frontend
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── pages/        # Page components
│   │   ├── services/     # API client
│   │   ├── hooks/        # Custom hooks
│   │   └── utils/        # Utilities
│   ├── package.json
│   └── .env.example
├── legacy/               # Archived Node.js version
├── docs/                 # Project documentation
├── config/               # Configuration files
├── Dockerfile            # Docker configuration
├── docker-compose.yml    # Docker Compose setup
└── README.md            # You are here!
```

## 🔧 Configuration

### Backend Environment Variables

Create `backend/.env`:
```env
# Database
DATABASE_URL=sqlite:///./jfgi_dev.db
# or for production:
# DATABASE_URL=postgresql://user:password@localhost/jfgi

# API Settings
ENVIRONMENT=development
ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173

# Optional: Google Custom Search
GOOGLE_SEARCH_API_KEY=your_api_key_here
GOOGLE_SEARCH_CX=your_search_engine_id
```

### Frontend Environment Variables

Create `frontend/.env`:
```env
VITE_API_BASE_URL=http://localhost:8002
```

## 🐳 Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up --build

# Access:
# Frontend: http://localhost:5173
# Backend: http://localhost:8002
```

## 📊 API Documentation

Once the backend is running, visit:
- **Swagger UI**: http://localhost:8002/docs
- **ReDoc**: http://localhost:8002/redoc

### Key Endpoints

- `POST /api/v1/urls/` - Create shortened URL
- `GET /api/v1/game/{shortCode}/initialize` - Initialize game
- `POST /api/v1/game/{shortCode}/search` - Perform search
- `POST /api/v1/game/{shortCode}/check-answer` - Check answer
- `GET /api/v1/game/global/leaderboard` - Global leaderboard
- `GET /api/v1/game/{shortCode}/leaderboard` - Per-URL leaderboard

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👤 Author

**Andy Naisbitt** ([@TheITApprentice](https://github.com/TheITApprentice))

## 🙏 Acknowledgments

- Inspired by the classic "Let Me Google That For You"
- Chalkboard design inspired by The Simpsons opening sequence
- Built as a portfolio project to demonstrate full-stack development skills

## 📞 Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Contact: [your-email@example.com]

---

**Made with ❤️ and a lot of Googling** 🔍
