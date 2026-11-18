# ChefBot

ChefBot is a web app that creates practical weekly menu plans using RAG and an LLM.

## Repository layout

- `frontend/`: static HTML/CSS/JavaScript site for GitHub Pages
- `backend/`: FastAPI API, RAG starter, and OpenRouter adapter
- `backend/data/`: local source documents for retrieval
- `docs/`: architecture and project notes
- `.github/workflows/pages.yml`: deploys the frontend to GitHub Pages

## Quick start

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
python -m pip install -e '.[dev]'
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

The backend works locally without an API key and returns a preview menu. To use a model, set `OPENROUTER_API_KEY` in `backend/.env`.

Test the API:

```bash
cd backend
pytest
```

### Frontend

Serve `frontend/` with any static server:

```bash
python -m http.server 5173 --directory frontend
```

Open `http://localhost:5173`. Set `window.CHEFBOT_API_URL` in `frontend/config.js` to the public backend URL before deploying.

## Deploy

1. Add the repository as a GitHub Pages source using GitHub Actions.
2. Push to `main`; `.github/workflows/pages.yml` publishes `frontend/`.
3. Deploy `backend/` to a Python host such as Render, Railway, or Fly.io.
4. Set `APP_ORIGIN` to the GitHub Pages URL and configure `OPENROUTER_API_KEY` on the backend host.

See `docs/architecture.md` for the intended extension points.
