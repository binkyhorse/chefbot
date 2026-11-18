import httpx

from .config import settings


async def create_menu_plan(
    prompt: str,
    context: list[str],
    foods: list | None = None,
    meals: list | None = None,
) -> str:
    foods = foods or []
    meals = meals or []
    if not settings.openrouter_api_key:
        return generate_local_preview(prompt, context, foods, meals)

    system_prompt = (
        "You are ChefBot, a practical weekly menu planner. Use the supplied "
        "context, respect dietary constraints, and produce only the explicitly selected "
        "meal slots."
    )
    existing = [food.name for food in foods if food.status == "bisher"]
    new = [food.name for food in foods if food.status == "neu"]
    food_context = (
        f"Existing foods to use: {', '.join(existing)}\n" if existing else ""
    ) + (f"New foods to try: {', '.join(new)}\n" if new else "")
    meal_context = "Selected meal slots:\n" + "; ".join(
        f"{slot.day} - {slot.meal}" for slot in meals
    ) if meals else ""
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": f"Request: {prompt}\n{food_context}{meal_context}\nRelevant context:\n" + "\n\n".join(context)},
    ]

    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post(
            f"{settings.openrouter_base_url.rstrip('/')}/chat/completions",
            headers={
                "Authorization": f"Bearer {settings.openrouter_api_key}",
                "Content-Type": "application/json",
                "HTTP-Referer": "https://github.com/",
                "X-Title": "ChefBot",
            },
            json={"model": settings.openrouter_model, "messages": messages},
        )

    if response.is_error:
        raise RuntimeError(f"LLM provider returned HTTP {response.status_code}")

    data = response.json()
    try:
        return data["choices"][0]["message"]["content"]
    except (KeyError, IndexError, TypeError) as exc:
        raise RuntimeError("LLM provider returned an unexpected response") from exc


def generate_local_preview(
    prompt: str,
    context: list[str],
    foods: list | None = None,
    meals: list | None = None,
) -> str:
    foods = foods or []
    meals = meals or []
    context_note = " Context will be used once the provider is configured." if context else ""
    existing = [food.name for food in foods if food.status == "bisher"]
    new = [food.name for food in foods if food.status == "neu"]
    food_note = ""
    if existing:
        food_note += f"\nVorhanden: {', '.join(existing)}"
    if new:
        food_note += f"\nNeu ausprobieren: {', '.join(new)}"
    meal_note = ""
    if meals:
        meal_note = "\nGeplante Mahlzeiten: " + "; ".join(
            f"{slot.day} {slot.meal}" for slot in meals
        )
    return (
        "# Wochenplan-Vorschau\n"
        "Mittwoch: Saisonale Gemüsepfanne\nDonnerstag: Nudeln und Gemüse\n"
        "Freitag: Suppe und Sauerteigbrot\nSamstag: Tacos\nSonntag: Getreide-Salat\n"
        "Montag: Stir-Fry\nDienstag: Geröstetes Gemüse und Bohnen\n\n"
        f"Anfrage: {prompt}{food_note}{meal_note}{context_note}"
    )
