const desktopCalendarDaysContainer = document.getElementById('desktop-calendar-days');
const mobileDayListContainer = document.getElementById('mobile-day-list');
const currentMonthYearSpan = document.getElementById('current-month-year');
const prevMonthBtn = document.getElementById('prev-month');
const nextMonthBtn = document.getElementById('next-month');
const pageTitle = document.getElementById('pageTitle');
const currentTurnDisplay = document.getElementById('current-turn-display');
const currentDateSpan = document.getElementById('current-date-span');
const currentPersonSpan = document.getElementById('current-person-span');
const themeToggle = document.getElementById('theme-toggle');
const moonIcon = document.getElementById('moon-icon');
const sunIcon = document.getElementById('sun-icon');

// Nombres y clases de color para los turnos
// Las clases de color son definidas en style.css y mapean a variables CSS
const names = ["Rhandall", "Mamá"];
const colors = ["rhandall", "mama"]; // Used to construct dynamic class names like 'person-rhandall-bg' 

const dayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

let currentYear = new Date().getFullYear();
let currentMonthIndex = new Date().getMonth(); // 0-indexed month

// --- Dark Mode Logic ---
// Check saved theme preference or default to system preference
if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
  document.documentElement.classList.add('dark');
  moonIcon.classList.add('hidden');
  sunIcon.classList.remove('hidden');
} else {
  document.documentElement.classList.remove('dark');
  moonIcon.classList.remove('hidden');
  sunIcon.classList.add('hidden');
}

themeToggle.addEventListener('click', () => {
  if (document.documentElement.classList.contains('dark')) {
    document.documentElement.classList.remove('dark');
    localStorage.theme = 'light';
    moonIcon.classList.remove('hidden');
    sunIcon.classList.add('hidden');
  } else {
    document.documentElement.classList.add('dark');
    localStorage.theme = 'dark';
    moonIcon.classList.add('hidden');
    sunIcon.classList.remove('hidden');
  }
});

// --- Turn Logic (Optimized) ---
// This logic ensures that the pattern (3 Rhandall, 3 Mamá) starts consistently from a known date.
// June 1, 2025 (day 152 of 2025) is Rhandall's turn.
// The cycle length is 6 days (3 for Rhandall, 3 for Mamá).
const june1st2025DayOfYear = 152; // Day of the year for June 1, 2025

function getTurn(date) {
  const year = date.getFullYear();
  const startOfYear = new Date(year, 0, 1);
  // Calculate day of the year (1-indexed)
  const dayOfYear = Math.ceil((date - startOfYear) / (1000 * 60 * 60 * 24)) + 1;

  // Calculate the offset from our reference date (June 1, 2025)
  const offset = dayOfYear - june1st2025DayOfYear;
  
  // Determine the cycle index based on the 6-day pattern
  // 0,1,2 (Rhandall) | 3,4,5 (Mamá)
  // (offset % 6 + 6) % 6 ensures positive modulo for negative offsets
  const cyclePosition = (offset % 6 + 6) % 6; 

  let turnIndex;
  if (cyclePosition >= 0 && cyclePosition <= 2) { // Days 0, 1, 2 in cycle are Rhandall
    turnIndex = 0; // Rhandall
  } else { // Days 3, 4, 5 in cycle are Mamá
    turnIndex = 1; // Mamá
  }

  return {
    person: names[turnIndex],
    colorClass: colors[turnIndex] // Return base name for class construction
  };
}

// --- Calendar Rendering ---
function renderCalendar(year, monthIndex) {
  desktopCalendarDaysContainer.innerHTML = '';
  mobileDayListContainer.innerHTML = '';

  const firstDayOfMonth = new Date(year, monthIndex, 1);
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 for Sunday, 6 for Saturday

  // Update header and title
  currentMonthYearSpan.textContent = `${monthNames[monthIndex]} ${year}`;
  pageTitle.textContent = `Calendario de Turnos - ${monthNames[monthIndex]} ${year}`;

  // Add empty divs for days before the 1st of the month for desktop view
  for (let i = 0; i < startingDayOfWeek; i++) {
    const emptyDiv = document.createElement('div');
    desktopCalendarDaysContainer.appendChild(emptyDiv);
  }

  const today = new Date();
  const isCurrentMonthViewed = (year === today.getFullYear() && monthIndex === today.getMonth());
  const currentDayOfMonth = today.getDate();

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, monthIndex, day);
    const turnInfo = getTurn(date);

    // Desktop Calendar Day (Button for better accessibility)
    const dayButton = document.createElement('button');
    dayButton.setAttribute('role', 'gridcell');
    dayButton.setAttribute('aria-label', `Día ${day}, turno de ${turnInfo.person}`);
    dayButton.className = `rounded-2xl p-4 font-semibold shadow-md hover-scale-subtle cursor-pointer focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-${turnInfo.colorClass}-500`; // Tailwind ring class, might need adjustment
    dayButton.classList.add(`person-${turnInfo.colorClass}-bg`); // Custom background class from style.css

    if (isCurrentMonthViewed && day === currentDayOfMonth) {
      dayButton.classList.add('current-day');
    }

    dayButton.textContent = day;
    desktopCalendarDaysContainer.appendChild(dayButton);

    // Mobile List Item
    const listItem = document.createElement('li');
    listItem.setAttribute('role', 'listitem');
    listItem.setAttribute('aria-label', `Día ${day}, ${dayNames[date.getDay()]}, turno de ${turnInfo.person}`);
    listItem.className = `flex items-center justify-between rounded-xl p-4 shadow-md hover-scale-subtle cursor-pointer focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-${turnInfo.colorClass}-500`; // Tailwind ring class
    listItem.classList.add(`person-${turnInfo.colorClass}-bg`); // Custom background class from style.css

    if (isCurrentMonthViewed && day === currentDayOfMonth) {
      listItem.classList.add('current-day');
    }

    listItem.innerHTML = `<span class="font-semibold">${day} ${dayNames[date.getDay()]}</span><span>${turnInfo.person}</span>`;
    mobileDayListContainer.appendChild(listItem);
  }

  // Update the "Hoy es..." display based on the currently rendered month
  updateCurrentTurnDisplay();
}

// --- "Hoy es..." Display Logic ---
function updateCurrentTurnDisplay() {
  const today = new Date();
  const currentDay = today.getDate();
  const currentMonth = today.getMonth();
  const currentYearFull = today.getFullYear();

  // Check if the current calendar view matches today's date
  const isTodayInView = (currentYearFull === currentYear && currentMonth === currentMonthIndex);

  if (isTodayInView) {
    currentTurnDisplay.style.display = 'block'; // Show the display
    const todayDate = new Date(currentYearFull, currentMonth, currentDay);
    const turnInfo = getTurn(todayDate);
    currentDateSpan.textContent = `${currentDay} de ${monthNames[currentMonth]}`;
    currentPersonSpan.textContent = turnInfo.person;
  } else {
    currentTurnDisplay.style.display = 'none'; // Hide if not showing current month/day
  }
}

// --- Navigation Event Listeners ---
prevMonthBtn.addEventListener('click', () => {
  currentMonthIndex--;
  if (currentMonthIndex < 0) {
    currentMonthIndex = 11; // December
    currentYear--;
    if (currentYear < 2025) currentYear = 2025; // Limit to 2025 for now
  }
  renderCalendar(currentYear, currentMonthIndex);
});

nextMonthBtn.addEventListener('click', () => {
  currentMonthIndex++;
  if (currentMonthIndex > 11) {
    currentMonthIndex = 0; // January
    currentYear++;
    // You can add a max year limit if needed: if (currentYear > 2025) currentYear = 2025;
  }
  renderCalendar(currentYear, currentMonthIndex);
});

// Initial render for the current month when the page loads
renderCalendar(currentYear, currentMonthIndex);
