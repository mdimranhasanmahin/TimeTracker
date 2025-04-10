document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('*').forEach(el => {
    el.style.maxWidth = '100%';
    el.style.overflowX = 'hidden';
  });

  let timerInterval, hours, minutes, seconds;
  let savedHours = 0, savedMinutes = 0, savedSeconds = 0;
  let soundEnabled = localStorage.getItem('soundEnabled') !== 'false';
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
        if (soundEnabled) document.getElementById("alarmSound").play();
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
    monthlyChart.data.datasets[0].data = monthlyUsage;
    monthlyChart.update();
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

  function countUp(element, targetMinutes, duration = 1000) {
    let start = 0;
    const stepTime = Math.abs(Math.floor(duration / targetMinutes)) || 10;
    const timer = setInterval(() => {
      start += 1;
      element.textContent = formatTime(start);
      if (start >= targetMinutes) {
        clearInterval(timer);
        element.textContent = formatTime(targetMinutes);
      }
    }, stepTime);
  }

  function updateDashboard(lastSession) {
    if (todayUsageEl) {
      setTimeout(() => countUp(todayUsageEl, todayUsage), 100);
    }
    if (dailyAverageEl) {
      setTimeout(() => countUp(dailyAverageEl, Math.round(dailyAverage)), 100);
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
      monthlyChart.data.datasets[0].data = monthlyUsage;
      monthlyChart.update();
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
      animation: { duration: 1000, easing: 'easeOutQuad', y: { from: 0 } },
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
      },
      scales: { y: { beginAtZero: true } }
    }
  });

  // QR Code and Scanner Logic
  function getLocalStorageData() {
    const data = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      data[key] = localStorage.getItem(key);
    }
    return JSON.stringify(data);
  }

  function setLocalStorageData(data) {
    const parsedData = JSON.parse(data);
    for (const key in parsedData) {
      localStorage.setItem(key, parsedData[key]);
    }
    todayUsage = parseInt(localStorage.getItem("todayUsage")) || 0;
    dailyAverage = parseFloat(localStorage.getItem("dailyAverage")) || 0;
    monthlyUsage = JSON.parse(localStorage.getItem("monthlyUsage")) || Array(12).fill(0);
    totalThisYearUsage = parseInt(localStorage.getItem("totalThisYearUsage")) || 0;
    totalDays = parseInt(localStorage.getItem("totalDays")) || 0;
    lastUpdatedDate = localStorage.getItem("lastUpdatedDate") || '';
    soundEnabled = localStorage.getItem('soundEnabled') !== 'false';
    loadTimerState();
    updateTimerDisplay();
    updateDashboard(0);
    monthlyChart.data.datasets[0].data = monthlyUsage;
    monthlyChart.update();
  }

  document.getElementById("generateQRBtn").addEventListener("click", () => {
    const qrCodeContainer = document.getElementById("qrCodeContainer");
    qrCodeContainer.innerHTML = '';
    qrCodeContainer.classList.remove("hidden");
    const data = getLocalStorageData();
    QRCode.toCanvas(data, { width: 200 }, (err, canvas) => {
      if (err) console.error(err);
      qrCodeContainer.appendChild(canvas);
    });
  });

  document.getElementById("scanQRBtn").addEventListener("click", () => {
    document.getElementById("qrFileInput").click();
  });

  document.getElementById("qrFileInput").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0, img.width, img.height);
        const imageData = ctx.getImageData(0, 0, img.width, img.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        if (code) {
          setLocalStorageData(code.data);
          alert("Data imported successfully!");
        } else {
          alert("No QR code found in the image.");
        }
      };
      img.src = URL.createObjectURL(file);
    }
  });

  // Event Listeners with Touch Support
  const settingsBtn = document.getElementById("settingsBtn");
  const dashboardBtn = document.getElementById("dashboardBtn");

  settingsBtn.addEventListener("click", openSettings);
  settingsBtn.addEventListener("touchend", openSettings);
  dashboardBtn.addEventListener("click", openDashboard);
  dashboardBtn.addEventListener("touchend", openDashboard);

  function openSettings() {
    const settingsModal = document.getElementById("settingsModal");
    settingsModal.classList.remove("hidden");
    document.getElementById("soundToggle").checked = soundEnabled;
  }

  function openDashboard() {
    const dashboard = document.getElementById("dashboardModal");
    dashboard.classList.remove("hidden");
    dashboard.classList.add("flex", "items-center", "justify-center");
    setTimeout(() => updateDashboard(0), 100);
    monthlyChart.data.datasets[0].data = monthlyUsage;
    monthlyChart.update();
  }

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

  document.getElementById("closeSettingsBtn").addEventListener("click", () => {
    document.getElementById("settingsModal").classList.add("hidden");
    document.getElementById("qrCodeContainer").classList.add("hidden");
  });

  document.getElementById("soundToggle").addEventListener("change", (e) => {
    soundEnabled = e.target.checked;
    localStorage.setItem("soundEnabled", soundEnabled);
  });

  const robotBtn = document.getElementById('robotBtn');
  const chatContainer = document.getElementById('chatContainer');
  const closeChat = document.getElementById('closeChat');

  robotBtn.addEventListener('click', () => {
    chatContainer.classList.toggle('hidden');
  });

  closeChat.addEventListener('click', () => {
    chatContainer.classList.add('hidden');
  });

  function updateRealTime() {
    const now = new Date();
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const day = String(now.getDate()).padStart(2, '0');
    const month = months[now.getMonth()];
    const year = now.getFullYear();
    document.getElementById("realClock").textContent = now.toLocaleTimeString();
    document.getElementById("realDate").textContent = `${day} ${month} ${year}`;
  }

  setInterval(updateRealTime, 1000);
  setInterval(checkNewDay, 60000);
  loadTimerState();
  checkNewDay();
  updateTimerDisplay();
  updateDashboard(0);
});