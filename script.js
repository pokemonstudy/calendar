const events = {
  "2026-03-02": [{ type: "event", title: "입학식 및 개학식", note: "새 학기 첫날, 학급 안내 확인" }],
  "2026-03-13": [{ type: "event", title: "동아리 오리엔테이션", note: "아틀라스 활동 계획 공유" }],
  "2026-04-10": [{ type: "exam", title: "영어 듣기평가", note: "학년별 시험 시간 확인" }],
  "2026-04-22": [{ type: "event", title: "과학의 날 행사", note: "체험 부스 및 탐구 활동" }],
  "2026-05-05": [{ type: "event", title: "어린이날", note: "공휴일" }],
  "2026-05-15": [{ type: "event", title: "스승의 날", note: "감사 편지 쓰기 활동" }],
  "2026-06-05": [{ type: "event", title: "진로 탐색 활동", note: "관심 분야 발표 준비" }],
  "2026-06-24": [{ type: "exam", title: "기말고사 준비 기간", note: "과목별 범위 확인" }],
  "2026-07-01": [{ type: "exam", title: "1학기 기말고사", note: "국어, 수학, 영어" }],
  "2026-07-02": [{ type: "exam", title: "1학기 기말고사", note: "사회, 과학, 역사" }],
  "2026-07-17": [{ type: "event", title: "여름방학식", note: "방학 생활 안내" }],
  "2026-08-20": [{ type: "event", title: "2학기 개학식", note: "정상 등교" }],
  "2026-09-18": [{ type: "event", title: "학교 축제", note: "공연 및 부스 운영" }],
  "2026-10-09": [{ type: "event", title: "한글날", note: "공휴일" }],
  "2026-10-23": [{ type: "event", title: "체육대회", note: "학급별 경기 일정 확인" }],
  "2026-11-11": [{ type: "exam", title: "2학기 수행평가 마감", note: "제출 과제 점검" }],
  "2026-12-14": [{ type: "exam", title: "2학기 기말고사", note: "전 학년 시험" }],
  "2026-12-31": [{ type: "event", title: "겨울방학식", note: "생활기록부 확인" }],
};

const meals = {
  1: ["현미밥", "소고기미역국", "닭갈비", "콩나물무침", "배추김치"],
  2: ["보리밥", "감자탕", "계란말이", "오이무침", "깍두기"],
  3: ["카레라이스", "유부장국", "치킨텐더", "샐러드", "요구르트"],
  4: ["흑미밥", "순두부찌개", "돼지불고기", "상추겉절이", "배추김치"],
  5: ["김치볶음밥", "어묵국", "만두튀김", "단무지", "과일"],
};

const defaultSubjectsByGrade = {
  1: ["국어", "수학", "영어", "과학", "사회", "체육"],
  2: ["수학", "영어", "역사", "국어", "기술가정", "미술"],
  3: ["영어", "과학", "수학", "국어", "사회", "음악"],
};

// Timetables are stored per "grade-class" key, and per weekday (0=일, 1=월 ... 6=토)
let timetables = JSON.parse(localStorage.getItem("atlas-timetables") || "null");
if (!timetables) {
  timetables = {};
  // initialize default for grades 1-3 and classes 1-4, weekdays 0-6
  for (let g = 1; g <= 3; g += 1) {
    for (let c = 1; c <= 4; c += 1) {
      const key = `${g}-${c}`;
      timetables[key] = {};
      for (let d = 0; d <= 6; d += 1) {
        // default: same subjects for all weekdays (you can change weekend defaults later)
        timetables[key][d] = defaultSubjectsByGrade[g].slice();
      }
    }
  }
  localStorage.setItem("atlas-timetables", JSON.stringify(timetables));
}

const calendarGrid = document.querySelector("#calendarGrid");
const monthLabel = document.querySelector("#monthLabel");
const selectedDateLabel = document.querySelector("#selectedDateLabel");
const eventList = document.querySelector("#eventList");
const timetableList = document.querySelector("#timetableList");
const mealList = document.querySelector("#mealList");
const mealTag = document.querySelector("#mealTag");
const classLabel = document.querySelector("#classLabel");
const gradeSelect = document.querySelector("#gradeSelect");
const classSelect = document.querySelector("#classSelect");
const searchInput = document.querySelector("#searchInput");
const reminderList = document.querySelector("#reminderList");
const editTimetableButton = document.querySelector("#editTimetable");

let currentDate = new Date(2026, 6, 1);
let selectedDate = new Date(2026, 6, 1);
let reminders = JSON.parse(localStorage.getItem("atlas-reminders") || "[]");

function toKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDate(date) {
  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });
}

function renderCalendar() {
  const query = searchInput.value.trim().toLowerCase();
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const startDate = new Date(year, month, 1 - firstDay.getDay());

  monthLabel.textContent = `${year}년 ${month + 1}월`;
  calendarGrid.innerHTML = "";

  for (let index = 0; index < 42; index += 1) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + index);
    const key = toKey(date);
    const dayEvents = events[key] || [];
    const dayMeal = meals[date.getDay()];
    const searchable = [key, ...dayEvents.map((event) => `${event.title} ${event.note}`), ...(dayMeal || [])]
      .join(" ")
      .toLowerCase();
    const matches = !query || searchable.includes(query);

    const button = document.createElement("button");
    button.className = "day-cell";
    if (date.getMonth() !== month) button.classList.add("other-month");
    if (key === toKey(new Date())) button.classList.add("today");
    if (key === toKey(selectedDate)) button.classList.add("selected");
    if (!matches) button.style.opacity = "0.35";

    button.innerHTML = `
      <span class="day-number">${date.getDate()}</span>
      <span class="chips">
        ${dayEvents.map((event) => `<span class="chip ${event.type}">${event.title}</span>`).join("")}
        ${dayMeal ? '<span class="chip meal">급식</span>' : ""}
      </span>
    `;

    button.addEventListener("click", () => {
      selectedDate = date;
      currentDate = new Date(date.getFullYear(), date.getMonth(), 1);
      render();
    });

    calendarGrid.append(button);
  }
}

function renderDetails() {
  const key = toKey(selectedDate);
  const dayEvents = events[key] || [];
  selectedDateLabel.textContent = formatDate(selectedDate);

  eventList.innerHTML = dayEvents.length
    ? dayEvents
        .map((event) => `<div class="event-item"><strong>${event.title}</strong><span>${event.note}</span></div>`)
        .join("")
    : '<p class="empty">등록된 학교 일정이 없습니다.</p>';

  const grade = gradeSelect.value;
  const klass = classSelect.value;
  classLabel.textContent = `${grade}학년 ${klass}반`;

  // select timetable based on weekday
  const weekday = selectedDate.getDay(); // 0..6
  const ttKey = `${grade}-${klass}`;
  const timetable = (timetables[ttKey] && timetables[ttKey][weekday]) || defaultSubjectsByGrade[grade] || [];
  timetableList.innerHTML = timetable
    .map((subject, index) => `<li><b>${index + 1}교시</b><span>${subject}</span></li>`)
    .join("");

  const meal = meals[selectedDate.getDay()];
  mealTag.textContent = selectedDate.getDay() === 0 || selectedDate.getDay() === 6 ? "주말" : "중식";
  mealList.innerHTML = meal
    ? meal.map((item) => `<li><span>${item}</span></li>`).join("")
    : '<li class="empty">급식이 없는 날입니다.</li>';
}

function renderReminders() {
  reminderList.innerHTML = reminders.length
    ? reminders
        .map((item) => `<li><span>${item.date}</span><strong>${item.title}</strong></li>`)
        .join("")
    : '<li class="empty">설정된 알림이 없습니다.</li>';
}

function saveReminders() {
  localStorage.setItem("atlas-reminders", JSON.stringify(reminders));
}

function saveTimetables() {
  localStorage.setItem("atlas-timetables", JSON.stringify(timetables));
}

function openTimetableEditor() {
  const grade = gradeSelect.value;
  const klass = classSelect.value;
  const key = `${grade}-${klass}`;

  // default weekday is the currently selected date's weekday
  const defaultWeekday = selectedDate.getDay();

  // get current subjects for that weekday (or default)
  const currentWeekSubjects = (timetables[key] && timetables[key][defaultWeekday])
    ? timetables[key][defaultWeekday].slice()
    : defaultSubjectsByGrade[grade].slice();

  // build editor UI inside timetableList
  timetableList.innerHTML = "";

  const editorForm = document.createElement("div");
  editorForm.style.display = "grid";
  editorForm.style.gap = "8px";

  // weekday selector
  const weekdayWrap = document.createElement("div");
  weekdayWrap.style.display = "flex";
  weekdayWrap.style.gap = "8px";
  weekdayWrap.style.alignItems = "center";
  weekdayWrap.innerHTML = `<label style=\"font-weight:800;color:#647083;\">요일:</label>`;
  const weekdaySelect = document.createElement("select");
  const dayNames = ["일", "월", "화", "수", "목", "금", "토"];
  for (let d = 0; d <= 6; d += 1) {
    const opt = document.createElement("option");
    opt.value = String(d);
    opt.textContent = dayNames[d];
    if (d === defaultWeekday) opt.selected = true;
    weekdaySelect.appendChild(opt);
  }
  weekdayWrap.appendChild(weekdaySelect);

  // checkbox: apply to all weekdays
  const applyAllWrap = document.createElement("label");
  applyAllWrap.style.display = "inline-flex";
  applyAllWrap.style.alignItems = "center";
  applyAllWrap.style.gap = "8px";
  const applyAllCheckbox = document.createElement("input");
  applyAllCheckbox.type = "checkbox";
  applyAllCheckbox.id = "applyAllWeekdays";
  applyAllWrap.appendChild(applyAllCheckbox);
  const applyAllText = document.createElement("span");
  applyAllText.textContent = "모든 요일에 적용";
  applyAllText.style.color = "#647083";
  applyAllText.style.fontWeight = "800";
  applyAllWrap.appendChild(applyAllText);

  const topRow = document.createElement("div");
  topRow.style.display = "flex";
  topRow.style.gap = "12px";
  topRow.style.alignItems = "center";
  topRow.appendChild(weekdayWrap);
  topRow.appendChild(applyAllWrap);
  editorForm.appendChild(topRow);

  // scope select (this class / same grade all classes / all classes)
  const scopeWrap = document.createElement("div");
  scopeWrap.style.display = "flex";
  scopeWrap.style.gap = "8px";
  scopeWrap.style.alignItems = "center";
  scopeWrap.innerHTML = `
    <label style=\"font-weight:800;color:#647083;\">적용 범위:</label>
  `;
  const scopeSelect = document.createElement("select");
  scopeSelect.innerHTML = `
    <option value="this">현재 반만</option>
    <option value="grade">같은 학년 전체</option>
    <option value="all">모든 반</option>
  `;
  scopeWrap.appendChild(scopeSelect);
  editorForm.appendChild(scopeWrap);

  // inputs for periods (initially for the selected weekday)
  const periodContainer = document.createElement("div");
  periodContainer.style.display = "grid";
  periodContainer.style.gap = "8px";
  function buildPeriodInputs(subjectsArray) {
    periodContainer.innerHTML = "";
    subjectsArray.forEach((subj, idx) => {
      const row = document.createElement("div");
      row.style.display = "flex";
      row.style.gap = "8px";

      const label = document.createElement("b");
      label.textContent = `${idx + 1}교시`;
      label.style.minWidth = "56px";
      const input = document.createElement("input");
      input.value = subj;
      input.style.flex = "1";
      input.dataset.period = idx;

      row.appendChild(label);
      row.appendChild(input);
      periodContainer.appendChild(row);
    });
  }

  buildPeriodInputs(currentWeekSubjects);
  editorForm.appendChild(periodContainer);

  // action buttons
  const actions = document.createElement("div");
  actions.style.display = "flex";
  actions.style.gap = "8px";

  const saveBtn = document.createElement("button");
  saveBtn.textContent = "저장";
  saveBtn.className = "primary-button";

  const cancelBtn = document.createElement("button");
  cancelBtn.textContent = "취소";
  cancelBtn.className = "text-button";

  actions.appendChild(saveBtn);
  actions.appendChild(cancelBtn);
  editorForm.appendChild(actions);

  timetableList.appendChild(editorForm);

  // when weekday selection changes, load that weekday's subjects into inputs
  weekdaySelect.addEventListener("change", () => {
    const wd = Number(weekdaySelect.value);
    const subs = (timetables[key] && timetables[key][wd]) ? timetables[key][wd].slice() : defaultSubjectsByGrade[grade].slice();
    buildPeriodInputs(subs);
  });

  cancelBtn.addEventListener("click", () => {
    renderDetails();
  });

  saveBtn.addEventListener("click", () => {
    // collect values
    const inputs = periodContainer.querySelectorAll('input[data-period]');
    const newSubjects = Array.from(inputs).map((inp) => (inp.value || "").trim());
    const scope = scopeSelect.value;
    const applyAll = applyAllCheckbox.checked;
    const chosenWeekday = Number(weekdaySelect.value);

    function applyToKey(g, c) {
      const target = `${g}-${c}`;
      if (!timetables[target]) timetables[target] = {};
      if (applyAll) {
        for (let d = 0; d <= 6; d += 1) {
          timetables[target][d] = newSubjects.slice();
        }
      } else {
        timetables[target][chosenWeekday] = newSubjects.slice();
      }
    }

    if (scope === "this") {
      applyToKey(grade, klass);
    } else if (scope === "grade") {
      const classOptions = Array.from(classSelect.querySelectorAll('option')).map((o) => o.value);
      classOptions.forEach((c) => applyToKey(grade, c));
    } else if (scope === "all") {
      const classOptions = Array.from(classSelect.querySelectorAll('option')).map((o) => o.value);
      for (let g = 1; g <= 3; g += 1) {
        classOptions.forEach((c) => applyToKey(g, c));
      }
    }

    saveTimetables();
    renderDetails();
  });
}

function render() {
  renderCalendar();
  renderDetails();
  renderReminders();
}

document.querySelector("#prevMonth").addEventListener("click", () => {
  currentDate.setMonth(currentDate.getMonth() - 1);
  renderCalendar();
});

document.querySelector("#nextMonth").addEventListener("click", () => {
  currentDate.setMonth(currentDate.getMonth() + 1);
  renderCalendar();
});

document.querySelector("#reminderButton").addEventListener("click", () => {
  const key = toKey(selectedDate);
  const title = events[key]?.[0]?.title || "개인 일정 확인";
  if (!reminders.some((item) => item.date === key && item.title === title)) {
    reminders.push({ date: key, title });
    saveReminders();
    renderReminders();
  }
});

document.querySelector("#clearReminders").addEventListener("click", () => {
  reminders = [];
  saveReminders();
  renderReminders();
});

gradeSelect.addEventListener("change", renderDetails);
classSelect.addEventListener("change", renderDetails);
searchInput.addEventListener("input", renderCalendar);
editTimetableButton.addEventListener("click", openTimetableEditor);

render();
