const form = document.querySelector("#menu-form");
const prompt = document.querySelector("#prompt");
const status = document.querySelector("#status");
const submitButton = document.querySelector("#submit-button");
const addFoodButton = document.querySelector("#add-food");
const foodList = document.querySelector("#food-list");
const foodRowTemplate = document.querySelector("#food-row-template");
const planningTab = document.querySelector("#planning-tab");
const resultsTab = document.querySelector("#results-tab");
const planningPanel = document.querySelector("#planning-panel");
const resultsPanel = document.querySelector("#results-panel");
const mealResults = document.querySelector("#meal-results");
const backToPlanning = document.querySelector("#back-to-planning");
const exportPdfButton = document.querySelector("#export-pdf");
const printPlan = document.querySelector("#print-plan");
const printMeals = document.querySelector("#print-meals");

const STORAGE_KEY = "chefbot-saved-plan";

const apiUrl = (window.CHEFBOT_API_URL || "").replace(/\/$/, "");

function addFoodRow(name = "", status = "bisher") {
  const row = foodRowTemplate.content.firstElementChild.cloneNode(true);
  const nameInput = row.querySelector(".food-name");
  const statusSelect = row.querySelector(".food-status");

  nameInput.value = name;
  statusSelect.value = status;
  row.querySelector(".remove-food").addEventListener("click", () => {
    row.remove();
  });

  foodList.append(row);
  nameInput.focus();
}

addFoodRow();
addFoodButton.addEventListener("click", () => addFoodRow());

function escapeHtml(value) {
  const element = document.createElement("div");
  element.textContent = value;
  return element.innerHTML;
}

function switchTab(tabName) {
  const planningActive = tabName === "planning";
  planningTab.classList.toggle("active", planningActive);
  resultsTab.classList.toggle("active", !planningActive);
  planningTab.setAttribute("aria-selected", String(planningActive));
  resultsTab.setAttribute("aria-selected", String(!planningActive));
  planningPanel.classList.toggle("active", planningActive);
  resultsPanel.classList.toggle("active", !planningActive);
}

planningTab.addEventListener("click", () => switchTab("planning"));
resultsTab.addEventListener("click", () => switchTab("results"));
backToPlanning.addEventListener("click", () => switchTab("planning"));

function renderMealResults(meals) {
  const suggestions = [
    "Saisonale Gemüsepfanne mit Reis",
    "Linsensuppe mit Rote-Bete-Salat",
    "Brokkoli-Nudelauflauf",
    "Gerösteter Kürbis mit Kichererbsen",
    "Kartoffel-Lauch-Gratin",
    "Tofu-Gemüse-Pfanne",
    "Spinat-Ricotta-Pasta",
    "Kichererbsen-Curry",
  ];

  mealResults.innerHTML = "";
  meals.forEach((slot, index) => {
    const card = document.createElement("article");
    card.className = "meal-result-card";
    card.draggable = true;
    card.title = "Ziehen, um diesen Vorschlag mit einem anderen Platz zu tauschen";

    const title = document.createElement("p");
    title.className = "meal-result-slot";
    title.textContent = `${slot.day} · ${slot.meal === "mittag" ? "Mittag" : "Abend"}`;

    const handle = document.createElement("span");
    handle.className = "drag-handle";
    handle.textContent = "⋮⋮";
    handle.setAttribute("aria-label", "Mahlzeit ziehen");

    const suggestion = document.createElement("textarea");
    suggestion.className = "meal-suggestion";
    suggestion.rows = 2;
    suggestion.value = slot.suggestion || suggestions[index % suggestions.length];
    suggestion.setAttribute("aria-label", `${slot.day} ${slot.meal} Mahlzeit bearbeiten`);

    suggestion.addEventListener("input", saveCurrentPlan);

    card.append(handle, title, suggestion);
    mealResults.append(card);
  });

  let draggedCard = null;
  mealResults.querySelectorAll(".meal-result-card").forEach((card) => {
    card.addEventListener("dragstart", () => {
      draggedCard = card;
      card.classList.add("dragging");
    });
    card.addEventListener("dragend", () => {
      draggedCard = null;
      card.classList.remove("dragging");
    });
    card.addEventListener("dragover", (event) => {
      event.preventDefault();
      if (draggedCard && draggedCard !== card) card.classList.add("drop-target");
    });
    card.addEventListener("dragleave", () => card.classList.remove("drop-target"));
    card.addEventListener("drop", (event) => {
      event.preventDefault();
      card.classList.remove("drop-target");
      if (!draggedCard || draggedCard === card) return;

      const draggedSuggestion = draggedCard.querySelector(".meal-suggestion");
      const targetSuggestion = card.querySelector(".meal-suggestion");
      const draggedValue = draggedSuggestion.value;
      draggedSuggestion.value = targetSuggestion.value;
      targetSuggestion.value = draggedValue;
      saveCurrentPlan();
    });
  });
}

const initialMeals = Array.from(document.querySelectorAll('input[name="meal"]:checked'))
  .map((checkbox) => {
    const [day, meal] = checkbox.value.split("|");
    return { day, meal };
  });

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  submitButton.disabled = true;
  status.textContent = "Deine Woche wird geplant …";
  status.className = "status";

  const foods = Array.from(foodList.querySelectorAll(".food-row"))
    .map((row) => ({
      name: row.querySelector(".food-name").value.trim(),
      status: row.querySelector(".food-status").value,
    }))
    .filter((food) => food.name.length > 0);

  const meals = Array.from(document.querySelectorAll('input[name="meal"]:checked'))
    .map((checkbox) => {
      const [day, meal] = checkbox.value.split("|");
      return { day, meal };
    });

  try {
    const response = await fetch(`${apiUrl}/api/menu-plan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: prompt.value.trim(), foods, meals }),
    });

    const body = await response.json();
    if (!response.ok) throw new Error(body.detail || "Der Menüservice ist derzeit nicht verfügbar.");

    status.textContent = "Der Wochenplan ist fertig.";
    renderMealResults(meals);
    saveCurrentPlan();
    switchTab("results");
  } catch (error) {
    status.textContent = error.message;
    status.className = "status status-error";
  } finally {
    submitButton.disabled = false;
  }
});

function getCurrentPlan() {
  return Array.from(mealResults.querySelectorAll(".meal-result-card")).map((card) => {
    const slot = card.querySelector(".meal-result-slot").textContent.split(" · ");
    const mealLabel = slot[1] === "Mittag" ? "mittag" : "abend";
    return {
      day: slot[0],
      meal: mealLabel,
      suggestion: card.querySelector(".meal-suggestion").value.trim(),
    };
  });
}

function saveCurrentPlan() {
  const plan = getCurrentPlan();
  if (plan.length === 0) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    savedAt: new Date().toISOString(),
    meals: plan,
  }));
}

function loadSavedPlan() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(saved?.meals) ? saved.meals : null;
  } catch {
    return null;
  }
}

function preparePrintPlan() {
  const plan = getCurrentPlan();
  printMeals.innerHTML = "";

  const dayOrder = ["Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag", "Montag", "Dienstag"];

  dayOrder.forEach((day) => {
    const daySlots = plan.filter((slot) => slot.day === day);
    if (daySlots.length === 0) return;

    const row = document.createElement("article");
    row.className = "print-day-row";

    const dayLabel = document.createElement("strong");
    dayLabel.className = "print-day";
    dayLabel.textContent = day;

    const lunch = daySlots.find((slot) => slot.meal === "mittag");
    const dinner = daySlots.find((slot) => slot.meal === "abend");

    const lunchItem = document.createElement("div");
    lunchItem.className = "print-meal";
    lunchItem.innerHTML = "<b>Mittag</b><span></span>";
    lunchItem.querySelector("span").textContent = lunch?.suggestion || "—";

    const dinnerItem = document.createElement("div");
    dinnerItem.className = "print-meal";
    dinnerItem.innerHTML = "<b>Abend</b><span></span>";
    dinnerItem.querySelector("span").textContent = dinner?.suggestion || "—";

    row.append(dayLabel, lunchItem, dinnerItem);
    printMeals.append(row);
  });
}

exportPdfButton.addEventListener("click", () => {
  saveCurrentPlan();
  preparePrintPlan();
  printPlan.setAttribute("aria-hidden", "false");
  window.print();
});

window.addEventListener("afterprint", () => {
  printPlan.setAttribute("aria-hidden", "true");
});

const savedPlan = loadSavedPlan();
renderMealResults(savedPlan || initialMeals);
