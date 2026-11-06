(() => {
  const apiUrl = (window.MEAL_API_URL || "").replace(/\/$/, "");
  const cachePrefix = "goseong-meals-";
  const mealsByDate = new Map();
  const loadingMonths = new Set();
  let loadError = "";

  function displayedMonth() {
    const label = document.querySelector("#monthLabel")?.textContent || "";
    const match = label.match(/(\d{4})년\s*(\d{1,2})월/);
    return match ? new Date(Number(match[1]), Number(match[2]) - 1, 1) : new Date();
  }

  function selectedDay() {
    const label = document.querySelector("#selectedDateLabel")?.textContent || "";
    const match = label.match(/(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일/);
    return match ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])) : new Date();
  }

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
      // Continue without a cache when browser storage is unavailable or full.
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
    if (!list || !tag) return;

    const date = selectedDay();
    const menu = mealsByDate.get(dateKey(date));
    const weekend = date.getDay() === 0 || date.getDay() === 6;
    tag.textContent = weekend ? "주말" : "중식 · 고성고등학교";

    list.replaceChildren();
    if (menu?.length) {
      menu.forEach((item) => {
        const li = document.createElement("li");
        const span = document.createElement("span");
        span.textContent = item;
        li.append(span);
        list.append(li);
      });
      return;
    }

    const li = document.createElement("li");
    li.className = "empty";
    li.textContent = !apiUrl
      ? "급식 API 주소를 설정해야 메뉴를 불러올 수 있습니다."
      : loadError || (weekend ? "급식이 없는 날입니다." : "등록된 급식이 없습니다.");
    list.append(li);
  }

  function paintCalendarMeals() {
    const grid = document.querySelector("#calendarGrid");
    if (!grid) return;
    const month = displayedMonth();
    const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
    const startDate = new Date(month.getFullYear(), month.getMonth(), 1 - firstDay.getDay());

    Array.from(grid.children).forEach((cell, index) => {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + index);
      const chips = cell.querySelector(".chips");
      if (!chips) return;
      chips.querySelectorAll(".chip.meal").forEach((chip) => chip.remove());
      if (mealsByDate.get(dateKey(date))?.length) {
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

  // Start on the user's actual current date rather than the old hard-coded demo date.
  const today = new Date();
  let visibleMonth = displayedMonth();
  const monthDifference = (today.getFullYear() - visibleMonth.getFullYear()) * 12
    + today.getMonth() - visibleMonth.getMonth();
  const navigationButton = document.querySelector(monthDifference < 0 ? "#prevMonth" : "#nextMonth");
  for (let index = 0; index < Math.abs(monthDifference); index += 1) navigationButton?.click();
  const todayCell = Array.from(document.querySelectorAll(".day-cell"))
    .find((cell) => !cell.classList.contains("other-month")
      && cell.querySelector(".day-number")?.textContent.trim() === String(today.getDate()));
  todayCell?.click();

  const originalCalendar = window.renderCalendar;
  if (typeof originalCalendar === "function") {
    window.renderCalendar = function (...args) {
      const result = originalCalendar.apply(this, args);
      loadMonth(displayedMonth());
      paintCalendarMeals();
      return result;
    };
  }

  const originalDetails = window.renderDetails;
  if (typeof originalDetails === "function") {
    window.renderDetails = function (...args) {
      const result = originalDetails.apply(this, args);
      loadMonth(selectedDay());
      paintMealList();
      return result;
    };
  }

  loadMonth(displayedMonth());
  paintMealList();
})();
