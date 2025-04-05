document.addEventListener('DOMContentLoaded', () => {
  // আগের কোডের শুরু
  document.querySelectorAll('*').forEach(el => {
    el.style.maxWidth = '100%';
    el.style.overflowX = 'hidden';
  });

  let timerInterval, hours, minutes, seconds;
  let savedHours = 0, savedMinutes = 0, savedSeconds = 0;
  const todayUsageEl = document.getElementById("todayUsage");
  const dailyAverageEl = document.getElementById("dailyAverage");
  const monthlyChartEl = document.getElementById("monthlyChart");

  let todayUsage = parseInt(localStorage.getItem("todayUsage")) || 0;
  let dailyAverage = parseFloat(localStorage.getItem("dailyAverage")) || 0;
  let monthlyUsage = JSON.parse(localStorage.getItem("monthlyUsage")) || Array(12).fill(0);
  let totalThisYearUsage = parseInt(localStorage.getItem("totalThisYearUsage")) || 0;
  let totalDays = parseInt(localStorage.getItem("totalDays")) || 0;
  let lastUpdatedDate = localStorage.getItem("lastUpdatedDate") || '';

  function loadTimerState() {
    hours = parseInt(localStorage.getItem("hours")) || 0;
    minutes = parseInt(localStorage.getItem("minutes")) || 0;
    seconds = parseInt(localStorage.getItem("seconds")) || 0;
  }

  function saveTimerState() {
    localStorage.setItem("hours", hours);
    localStorage.setItem("minutes", minutes);
    localStorage.setItem("seconds", seconds);
  }

  function updateTimerDisplay() {
    const timerDisplay = document.getElementById("timerDisplay");
    if (timerDisplay) {
      timerDisplay.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
  }

  function startTimer() {
    const startTime = new Date();
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      if (seconds > 0) seconds--;
      else if (minutes > 0) { minutes--; seconds = 59; }
      else if (hours > 0) { hours--; minutes = 59; seconds = 59; }
      else {
        clearInterval(timerInterval);
        document.getElementById("alarmSound").play();
        updateUsage(startTime);
      }
      saveTimerState();
      updateTimerDisplay();
    }, 1000);
  }

  function updateUsage(startTime) {
    const endTime = new Date();
    const sessionMinutes = Math.floor((endTime - startTime) / 60000);
    todayUsage += sessionMinutes;
    monthlyUsage[new Date().getMonth()] += sessionMinutes;
    totalThisYearUsage += sessionMinutes;

    localStorage.setItem("todayUsage", todayUsage);
    localStorage.setItem("monthlyUsage", JSON.stringify(monthlyUsage));
    localStorage.setItem("totalThisYearUsage", totalThisYearUsage);
    calculateDailyAverage();
    updateDashboard(sessionMinutes);
  }

  function calculateDailyAverage() {
    if (totalDays > 0) {
      dailyAverage = totalThisYearUsage / totalDays;
      localStorage.setItem("dailyAverage", dailyAverage.toFixed(2));
    }
  }

  function formatTime(totalMinutes) {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours} Hr ${minutes} Min`;
  }

  function updateDashboard(lastSession) {
    if (todayUsageEl) todayUsageEl.textContent = formatTime(todayUsage);
    if (dailyAverageEl) dailyAverageEl.textContent = formatTime(Math.round(dailyAverage));
    const lastSessionUsage = document.getElementById("lastSessionUsage");
    if (lastSessionUsage) lastSessionUsage.textContent = `Last Session: ${formatTime(lastSession)}`;
    if (monthlyChart) {
      monthlyChart.update();
    }
  }

  function checkNewDay() {
    const today = new Date().toDateString();
    if (lastUpdatedDate !== today) {
      monthlyUsage[new Date().getMonth()] += todayUsage;
      totalThisYearUsage += todayUsage;
      totalDays++;
      todayUsage = 0;

      localStorage.setItem("monthlyUsage", JSON.stringify(monthlyUsage));
      localStorage.setItem("totalThisYearUsage", totalThisYearUsage);
      localStorage.setItem("totalDays", totalDays);
      localStorage.setItem("todayUsage", todayUsage);
      localStorage.setItem("lastUpdatedDate", today);

      calculateDailyAverage();
      updateDashboard(0);
    }
  }

  const monthlyChart = new Chart(monthlyChartEl, {
    type: 'bar',
    data: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      datasets: [{
        label: 'Study Time (Minutes)',
        data: monthlyUsage,
        backgroundColor: 'rgba(0, 123, 255, 0.7)',
        borderColor: 'rgba(0, 123, 255, 1)',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'top' },
        tooltip: {
          callbacks: {
            label: function(context) {
              const totalMinutes = context.raw;
              return formatTime(totalMinutes);
            }
          }
        }
      }
    }
  });

  document.getElementById("startBtn").addEventListener("click", () => {
    if (hours === 0 && minutes === 0 && seconds === 0) {
      document.getElementById("timeModal").classList.remove("hidden");
    } else {
      startTimer();
    }
  });

  document.getElementById("setTimeBtn").addEventListener("click", () => {
    document.getElementById("timeModal").classList.remove("hidden");
  });

  document.getElementById("saveTimeBtn").addEventListener("click", () => {
    savedHours = parseInt(document.getElementById("hoursInput").value) || 0;
    savedMinutes = parseInt(document.getElementById("minutesInput").value) || 0;
    savedSeconds = parseInt(document.getElementById("secondsInput").value) || 0;
    hours = savedHours;
    minutes = savedMinutes;
    seconds = savedSeconds;
    saveTimerState();
    document.getElementById("timeModal").classList.add("hidden");
    updateTimerDisplay();
  });

  document.getElementById("closeModalBtn").addEventListener("click", () => {
    document.getElementById("timeModal").classList.add("hidden");
  });

  document.getElementById("dashboardBtn").addEventListener("click", () => {
    const dashboard = document.getElementById("dashboardModal");
    dashboard.classList.remove("hidden");
    dashboard.classList.add("flex", "items-center", "justify-center");
    updateDashboard(0);
  });

  document.getElementById("closeDashboardBtn").addEventListener("click", () => {
    document.getElementById("dashboardModal").classList.add("hidden");
  });

  document.getElementById("restartBtn").addEventListener("click", () => {
    clearInterval(timerInterval);
    loadTimerState();
    updateTimerDisplay();
  });

  setInterval(() => {
    const now = new Date();
    document.getElementById("realTime").textContent = искренೀ

    checkNewDay();
  }, 60000); 

  loadTimerState();
  checkNewDay();
  updateTimerDisplay();
  updateDashboard(0);
}); 