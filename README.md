# Campus Nutrition Calculator

A comprehensive full-stack web application that helps students make informed food choices at campus dining halls. The app features real-time menu browsing, nutritional tracking, dietary filtering, and an AI-powered nutrition assistant.

## 🎯 Features

### Core Functionality
- **Menu Browsing**: View real-time dining hall menus with detailed nutritional information
- **Nutrition Tracking**: Track daily macro and micronutrient intake with visual progress indicators
- **Dietary Filtering**: Filter menu items by dietary preferences, allergies, and restrictions
- **Meal Planning**: Create custom meals and track nutritional goals
- **Historical Analysis**: View nutrition trends over time with interactive charts

### User Management
- **Profile Management**: Customize dietary preferences, allergies, and nutrition goals
- **Authentication**: Secure JWT-based auth with OAuth integration
- **Progress Tracking**: Monitor weight goals and nutritional targets over time

## 🏗️ Architecture

### Frontend (React + Vite)
- **Framework**: React 18 with Vite build system
- **Styling**: Tailwind CSS for responsive design
- **State Management**: React Context + local state
- **Routing**: React Router v6
- **Charts**: Recharts for data visualization
- **Testing**: Playwright for end-to-end testing

### Backend (FastAPI + Python)
- **API Framework**: FastAPI with async support
- **Database**: MongoDB for flexible document storage
- **Authentication**: JWT tokens with OAuth providers
- **Web Scraping**: Selenium-based automated menu collection
- **File Storage**: Static file serving for profile images

### Data Pipeline
- **Menu Scraping**: Automated Selenium scraper for campus dining websites
- **Real-time Updates**: Incremental scraping for up-to-date menu information
- **Data Processing**: Nutritional analysis and categorization
- **Caching**: Efficient data retrieval and storage optimization

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Python 3.8+
- MongoDB database
- OpenAI API key (for AI features)

### Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Edit .env with your MongoDB connection string, API keys, etc.

# Start the server
python main.py
```

### Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000

## 🔧 Development

### Available Scripts

#### Frontend
```bash
npm run dev          # Start development server
npm run build        # Production build
npm run lint         # Run ESLint
npm run preview      # Preview production build
npm run test         # Run Playwright tests
npm run test:ui      # Run tests with UI
```

#### Backend
```bash
python main.py                    # Start FastAPI server
python menu_scraper.py           # Run menu scraper manually
python bulk_duplicate_foods.py   # Bulk duplicate food data
./run_incremental_scraper.sh     # Run incremental scraper with logging
```

### Project Structure
```
├── frontend/                 # React application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   │   ├── Dashboard.jsx
│   │   │   ├── NutrientTracker.jsx 
│   │   │   ├── ProfileSettings/
│   │   │   ├── nutritionHistory/
│   │   │   └── accountPage/
│   │   ├── images/          # Static assets
│   │   └── App.jsx         # Main application component
│   ├── public/             # Public assets
│   └── package.json
├── backend/                 # FastAPI application
│   ├── models/             # Pydantic data models
│   ├── ai_agent/           # LangGraph AI system
│   │   ├── agent.py
│   │   ├── tools/
│   │   ├── services/
│   │   └── nodes/
│   ├── static/             # File uploads
│   ├── menu_scraper.py     # Web scraping system
│   ├── main.py            # FastAPI entry point
│   └── requirements.txt
├── docs/                   # Documentation
└── README.md
```

## 🗄️ Database Schema

### Collections
- **foods**: Menu items with nutritional data and dining hall information
- **users**: User profiles, preferences, and authentication data
- **plates**: Historical meal tracking and nutrition logs

### Key Data Models
- **Food**: Nutritional information, dining hall, meal period, allergens
- **User**: Profile, dietary preferences, goals, authentication tokens
- **Plate**: Meal composition, timestamp, nutritional totals

## 🌐 Deployment

### Environment Variables
Create `.env` files in both frontend and backend directories:

#### Backend (.env)
```env
MONGODB_URI=your_mongodb_connection_string
MONGO_DB=nutritionapp
SECRET_KEY=your_jwt_secret_key
OPENAI_API_KEY=your_openai_api_key
TAVILY_API_KEY=your_tavily_api_key
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret
FRONTEND_URL=http://localhost:5173
```

### Production Deployment
The application is configured for deployment on platforms like Heroku, Railway, or Vercel:

- **Backend**: FastAPI with Uvicorn ASGI server
- **Frontend**: Static build deployment
- **Database**: MongoDB Atlas for cloud hosting
- **File Storage**: Static file serving or cloud storage integration

## 📊 Data Collection

### Menu Scraping System
- **Automated Collection**: Selenium-based scraper for campus dining websites
- **Incremental Updates**: Regular scraping to maintain current menu data
- **Error Handling**: Robust error recovery and logging system
- **Nutritional Parsing**: Automatic extraction and standardization of nutrition facts

### Supported Dining Halls
The scraper is configured for university dining hall websites and can be extended to support additional campus dining systems.

## 🧪 Testing

### Frontend Testing
- **Framework**: Playwright for end-to-end testing
- **Coverage**: Component rendering, user interactions, API integration
- **Commands**: `npm run test`, `npm run test:ui`, `npm run test:headed`

### Backend Testing
- **Manual Testing**: Development server testing
- **API Testing**: FastAPI automatic documentation at `/docs`

## 🙏 Acknowledgments

- Campus dining services for menu data
- The React and FastAPI communities for excellent frameworks
- MongoDB for flexible data storage solutions

---



