from typing import Literal

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from .config import settings
from .rag import retrieve_context
from .llm import create_menu_plan


app = FastAPI(title="ChefBot API", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in settings.app_origin.split(",") if origin.strip()],
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)


class FoodEntry(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    status: Literal["bisher", "neu"]


class MealSlot(BaseModel):
    day: Literal[
        "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag", "Montag", "Dienstag"
    ]
    meal: Literal["mittag", "abend"]


class PlanRequest(BaseModel):
    prompt: str = Field(min_length=3, max_length=2000)
    foods: list[FoodEntry] = Field(default_factory=list)
    meals: list[MealSlot] = Field(default_factory=list)


class PlanResponse(BaseModel):
    menu: str
    sources: list[str]


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/menu-plan", response_model=PlanResponse)
async def menu_plan(request: PlanRequest) -> PlanResponse:
    context = retrieve_context(request.prompt)
    try:
        menu = await create_menu_plan(request.prompt, context, request.foods, request.meals)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    return PlanResponse(menu=menu, sources=context)
