# Architecture

- `frontend/`: framework-free static site, deployed by GitHub Pages.
- `backend/`: FastAPI API, lexical RAG starter, and OpenRouter adapter.
- `backend/data/`: source documents used by RAG.
- `backend/app/rag.py`: replace the lexical search with embeddings/vector search as the corpus grows.
- `backend/app/llm.py`: keep provider details behind one function; later providers can be swapped independently.

The frontend calls `POST /api/menu-plan`. The backend retrieves source text, constructs a grounded prompt, calls the configured model provider, and returns the menu plus source snippets.
