(() => {
  const apiUrl = (window.MEAL_API_URL || "").replace(/\/$/, "");
  const cachePrefix = "goseong-meals-";
  const mealsByDate = new Map();
  const loadingMonths = new Set();
  let loadError = "";

  function dateKey(date) {
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${date.getFullYear()}-${month}-${day}`;
  }

  function monthKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  }

  function cachedMonth(key) {
    try {
      return JSON.parse(localStorage.getItem(cachePrefix + key) || "null");
    } catch {
      return null;
    }
  }

  function saveMonth(key, meals) {
    try {
      localStorage.setItem(cachePrefix + key, JSON.stringify(meals));
    } catch {
      // The app still works if browser storage is disabled or full.
    }
  }

  function rememberMeals(meals) {
    Object.entries(meals || {}).forEach(([key, menu]) => {
      if (Array.isArray(menu)) mealsByDate.set(key, menu);
    });
  }

  function paintMealList() {
    const list = document.querySelector("#mealList");
    const tag = document.querySelector("#mealTag");
    if (!list || !tag || !window.selectedDate) return;

    const date = window.selectedDate;
    const menu = mealsByDate.get(dateKey(date));
    const weekend = date.getDay() === 0 || date.getDay() === 6;
    tag.textContent = weekend ? "주말" : "중식 · 고성고등학교";

    if (menu) {
      list.innerHTML = "";
      menu.forEach((item) => {
        const li = document.createElement("li");
        const span = document.createElement("span");
        span.textContent = item;
        li.append(span);
        list.append(li);
      });
    } else {
      const message = !apiUrl
        ? "급식 연동 주소를 설정하면 메뉴를 표시합니다."
        : loadError || (weekend ? "급식이 없는 날입니다." : "등록된 급식이 없습니다.");
      list.innerHTML = "";
      const li = document.createElement("li");
      li.className = "empty";
      li.textContent = message;
      list.append(li);
    }
  }

  function paintCalendarMeals() {
    const grid = document.querySelector("#calendarGrid");
    if (!grid || !window.currentDate) return;
    const year = window.currentDate.getFullYear();
    const month = window.currentDate.getMonth();
    const first = new Date(year, month, 1);
    const start = new Date(year, month, 1 - first.getDay());

    Array.from(grid.children).forEach((cell, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      const chips = cell.querySelector(".chips");
      if (!chips) return;
      chips.querySelectorAll(".chip.meal").forEach((chip) => chip.remove());
      if (mealsByDate.has(dateKey(date)) && mealsByDate.get(dateKey(date)).length) {
        const chip = document.createElement("span");
        chip.className = "chip meal";
        chip.textContent = "급식";
        chips.append(chip);
      }
    });
  }

  async function loadMonth(date) {
    const key = monthKey(date);
    const cached = cachedMonth(key);
    if (cached) rememberMeals(cached);
    paintCalendarMeals();
    paintMealList();
    if (!apiUrl || loadingMonths.has(key)) return;

    loadingMonths.add(key);
    loadError = "";
    try {
      const response = await fetch(`${apiUrl}/meals?month=${encodeURIComponent(key)}`);
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || `급식 정보를 가져오지 못했습니다 (${response.status}).`);
      rememberMeals(body.meals);
      saveMonth(key, body.meals || {});
      paintCalendarMeals();
      paintMealList();
    } catch (error) {
      loadError = error.message || "급식 정보를 불러오지 못했습니다.";
      paintMealList();
    } finally {
      loadingMonths.delete(key);
    }
  }

  // Original calendar code stays intact; these wrappers refresh only the meal UI.
  const originalCalendar = window.renderCalendar;
  if (typeof originalCalendar === "function") {
    window.renderCalendar = function () {
      originalCalendar();
      if (window.currentDate) loadMonth(window.currentDate);
      paintCalendarMeals();
    };
  }

  const originalDetails = window.renderDetails;
  if (typeof originalDetails === "function") {
    window.renderDetails = function () {
      originalDetails();
      paintMealList();
    };
  }

  if (window.currentDate) loadMonth(window.currentDate);
})();
