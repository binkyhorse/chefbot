from pathlib import Path


DATA_DIR = Path(__file__).resolve().parent.parent / "data"


def retrieve_context(query: str, limit: int = 3) -> list[str]:
    """Small lexical RAG starter. Replace with embeddings/vector search later."""
    terms = {term.lower() for term in query.split() if len(term) > 2}
    matches: list[tuple[int, str]] = []

    for path in DATA_DIR.glob("*.txt"):
        text = path.read_text(encoding="utf-8").strip()
        score = sum(term in text.lower() for term in terms)
        if text:
            matches.append((score, text))

    matches.sort(key=lambda item: item[0], reverse=True)
    return [text for _, text in matches[:limit]]
