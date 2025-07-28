# Campus Nutrition App

Ever wondered what's actually in that dining hall food? This app helps college students make better food choices by showing real-time menus, tracking nutrition, and even getting personalized advice from an AI assistant.

I built this because navigating campus dining can be overwhelming - especially when you're trying to eat healthy or have dietary restrictions. Now you can see what's available, track your nutrition goals, and get recommendations all in one place.

## What it does

**Browse menus easily** - See what's available at different dining halls today, filter by meal times, and check out food stations like the grill or salad bar.

**Track your nutrition** - Add items to your virtual plate and watch your calories, protein, carbs, and fat add up in real-time with visual charts.

**Get smart recommendations** - The AI assistant can suggest meals based on your dietary goals, analyze ingredients, and even recommend alternatives if something doesn't fit your needs.

**Save your progress** - Create an account to track your eating habits over time, set preferences, and export your nutrition data.

**Handle dietary needs** - Everything is tagged for common restrictions like vegan, vegetarian, gluten-free, and more.

## How to run it

**Backend:**
```bash
cd backend
pip install -r requirements.txt
python main.py
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

Then open your browser and you're good to go!

## Built with

- **Frontend:** React, Tailwind CSS, and Recharts for the charts
- **Backend:** Python with FastAPI and MongoDB for data storage
- **Auth:** Google login integration for easy sign-in

The whole thing is designed to be fast and responsive, with optimizations for real-world usage.


