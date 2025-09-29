# Hackathon Starter

A quick-start project featuring three beginner-friendly AI-powered web applications with a Flask backend, static frontend, and optional payment integration. Includes asset optimization for performance.

## Features

- **Study Buddy**: Generate flashcards from notes using AI (currently mock; extensible to OpenAI).
- **Mood Journal**: Analyze sentiment of journal entries via Hugging Face API (with fallback to deterministic scoring).
- **Recipe Recommender**: Suggest recipes based on ingredients using OpenAI API (with fallback to simple templates).
- **Payments**: Integrate Paystack for Kenyan Shilling (KES) donations/support payments.
- **Asset Optimization**: Scripts to minify CSS/JS and convert images to WebP for faster loading.
- **Database**: SQLite by default; supports MySQL for production.
- **Security**: Rate limiting, CORS, security headers (HSTS, XSS protection).

## Technologies Used

- **Backend**: Python Flask, SQLAlchemy, Flask-CORS, python-dotenv, requests.
- **Frontend**: HTML5, CSS3, JavaScript (ES6+), Express.js for static serving.
- **AI Integrations**: Hugging Face (sentiment), OpenAI (recipes).
- **Payments**: Paystack API.
- **Optimization**: Node.js scripts for asset minification and image conversion.
- **Database**: SQLite/MySQL.
- **Other**: Git, npm, pip.

## Project Structure

```
hack1/
├── backend/
│   ├── app.py              # Flask app with API routes, rate limiting, security
│   ├── models.py           # SQLAlchemy models (JournalEntry, Flashcard, Recipe)
│   └── app.db              # SQLite database (auto-created)
├── assets/
│   ├── css/
│   │   ├── critical.css    # Critical CSS for above-the-fold
│   │   ├── style.css       # Main styles
│   │   ├── style2.css      # Additional styles
│   │   ├── style3.css
│   │   └── style4.css
│   ├── js/
│   │   ├── bundle.min.js   # Minified JS bundle
│   │   ├── main.js         # Main JS for API calls and UI
│   │   ├── menu-toggle.js  # Menu toggle functionality
│   │   └── payments.js     # Paystack payment handling
│   └── images/
│       ├── *.png/*.jpg     # Original images
│       ├── webp/           # Optimized WebP versions
│       └── icons/          # Social icons (GitHub, LinkedIn, WhatsApp)
├── index.html              # Landing page
├── study-buddy.html        # Flashcard generator
├── mood-journal.html       # Sentiment journal
├── recipe-recommender.html # Recipe suggestions
├── serve-static.js         # Node.js static file server
├── optimize-assets.js      # Asset optimization script
├── optimize_assets.bat     # Windows batch for optimization
├── package.json            # Node.js dependencies and scripts
├── requirements.txt        # Python dependencies
├── ENV_EXAMPLE.txt         # Environment template
├── check_env.py            # Environment checker script
├── TODO.md                 # Project tasks
└── README.md               # This file
```

## Prerequisites

- Python 3.8+ (for backend)
- Node.js 14+ and npm (for frontend serving and optimization)
- Git (for cloning)
- Optional: MySQL server, Hugging Face token, OpenAI API key, Paystack secret key.

## Installation and Setup

1. **Clone the repository**:
   ```bash
   git clone <repo-url>
   cd hack1
   ```

2. **Set up environment variables**:
   - Copy `ENV_EXAMPLE.txt` to `.env` and fill in values:
     ```bash
     cp ENV_EXAMPLE.txt .env
     ```
     Edit `.env` with your keys (leave empty for fallbacks):
     - `MYSQL_URL`: e.g., `mysql+pymysql://user:pass@localhost:3306/db`
     - `HUGGINGFACE_TOKEN`: From Hugging Face settings
     - `OPENAI_API_KEY`: From OpenAI platform
     - `PAYSTACK_SECRET_KEY`: From Paystack dashboard (for payments)

3. **Install Python dependencies and run backend**:
   ```bash
   python -m venv .venv
   .venv\Scripts\activate  # On Windows
   pip install -r requirements.txt
   python backend/app.py
   ```
   Backend runs on [http://localhost:5000](http://localhost:5000). It auto-creates `backend/app.db`.

4. **Install Node.js dependencies and serve frontend** (in a new terminal):
   ```bash
   npm install
   npm start  # Runs serve-static.js on http://localhost:3000
   ```

5. **Optimize assets** (optional, for production):
   ```bash
   node optimize-assets.js  # Or run optimize_assets.bat on Windows
   ```

## Usage

- Open [http://localhost:3000](http://localhost:3000) in your browser.
- Navigate to pages: Study Buddy, Mood Journal, Recipe Recommender.
- Interact with forms; they call backend APIs with fallbacks if keys are missing.
- For payments: Use the donation form (requires Paystack key) to test KES payments.
- Check backend health: Visit [http://localhost:5000/api/health](http://localhost:5000/api/health).

## API Endpoints

- `GET /api/health`: Health check.
- `POST /api/sentiment`: Analyze text sentiment (requires Hugging Face token).
- `POST /api/flashcards`: Generate flashcards (mock).
- `POST /api/recipes`: Suggest recipes (requires OpenAI key).
- `POST /create-payment`: Initialize Paystack payment.

## Environment Variables

- `MYSQL_URL`: Database URL (SQLite fallback).
- `HUGGINGFACE_TOKEN`: For sentiment API.
- `OPENAI_API_KEY`: For recipe suggestions.
- `PAYSTACK_SECRET_KEY`: For payment processing.
- Optional: `HUGGINGFACE_MODEL_URL`, `OPENAI_CHAT_URL`, `OPENAI_MODEL`.

## Next Steps

1. Fill `.env` with API keys for full functionality.
2. Test APIs: Use Postman or browser dev tools to call endpoints.
3. Add persistence views: Extend frontend to list saved entries/flashcards/recipes.
4. Customize UI: Edit CSS/JS in `assets/`.
5. Deploy:
   - Backend: Use Render, Fly.io, or Heroku.
   - Frontend: Host static files on Netlify/Vercel; update `API_BASE` in `assets/js/main.js`.
   - Database: Switch to MySQL for production.
6. Enhance: Add user auth, more AI features, or mobile responsiveness.

## Contributing

1. Fork the repo.
2. Create a feature branch: `git checkout -b feature-name`.
3. Commit changes: `git commit -m 'Add feature'`.
4. Push and open a PR.

## License

MIT License.
>>>>>>> 0ea085d (Initial commit)
