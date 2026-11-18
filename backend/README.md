# ChefBot backend

## Run locally

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
python -m pip install -e '.[dev]'
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

With no `OPENROUTER_API_KEY`, the API returns a deterministic local preview. Add the key to call OpenRouter.

## Test

```bash
cd backend
pytest
```
