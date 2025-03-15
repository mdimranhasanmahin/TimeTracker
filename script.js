document.querySelectorAll('*').forEach(el => {
    el.style.maxWidth = '100%';
    el.style.overflowX = 'hidden';
  });

  let timerInterval, hours = 0, minutes = 0, seconds = 0;
  let savedHours = 0, savedMinutes = 0, savedSeconds = 0;
  const todayUsageEl = document.getElementById("todayUsage");
  const dailyAverageEl = document.getElementById("dailyAverage");
  const monthlyChartEl = document.getElementById("monthlyChart");
  
  let todayUsage = parseInt(localStorage.getItem("todayUsage")) || 0;
  let dailyAverage = parseFloat(localStorage.getItem("dailyAverage")) || 0;
  let monthlyUsage = JSON.parse(localStorage.getItem("monthlyUsage")) || Array(12).fill(0);
  
  function updateTimerDisplay() {
    document.getElementById("timerDisplay").textContent =
      `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
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
      updateTimerDisplay();
    }, 1000);
  }
  
  function updateUsage(startTime) {
    const endTime = new Date();
    const sessionMinutes = Math.floor((endTime - startTime) / 60000);
    todayUsage += sessionMinutes;
    monthlyUsage[new Date().getMonth()] += sessionMinutes;
    localStorage.setItem("todayUsage", todayUsage);
    localStorage.setItem("monthlyUsage", JSON.stringify(monthlyUsage));
    calculateDailyAverage();
    updateDashboard();
  }
  
  function calculateDailyAverage() {
    const totalDays = new Date().getDate();
    dailyAverage = todayUsage / totalDays;
    localStorage.setItem("dailyAverage", dailyAverage.toFixed(2));
  }
  
  function formatTime(totalMinutes) {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours} Hr ${minutes} Min`;
  }
  
  function updateDashboard() {
    todayUsageEl.textContent = formatTime(todayUsage);
    dailyAverageEl.textContent = formatTime(Math.round(dailyAverage));
    if (monthlyChart) {
      monthlyChart.update();
    }
  }
  
  // Update the Monthly Chart
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
    document.getElementById("timeModal").classList.add("hidden");
    updateTimerDisplay();
  });
  
  document.getElementById("closeModalBtn").addEventListener("click", () => {
    document.getElementById("timeModal").classList.add("hidden");
  });
  
  document.getElementById("dashboardBtn").addEventListener("click", () => {
    document.getElementById("dashboardModal").classList.remove("hidden");
    updateDashboard();
  });
  
  document.getElementById("closeDashboardBtn").addEventListener("click", () => {
    document.getElementById("dashboardModal").classList.add("hidden");
  });
  
  document.getElementById("restartBtn").addEventListener("click", () => {
    clearInterval(timerInterval);
    hours = savedHours;
    minutes = savedMinutes;
    seconds = savedSeconds;
    updateTimerDisplay();
  });
  
  setInterval(() => {
    const now = new Date();
    document.getElementById("realTime").textContent = now.toLocaleString();
  }, 1000);
