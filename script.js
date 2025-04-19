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
  let stream = null;

  // Real-Time Clock Update
  function updateRealTime() {
    const now = new Date();
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const day = String(now.getDate()).padStart(2, '0');
    const month = months[now.getMonth()];
    const year = now.getFullYear();
    const realClock = document.getElementById("realClock");
    const realDate = document.getElementById("realDate");
    if (realClock && realDate) {
      realClock.textContent = now.toLocaleTimeString();
      realDate.textContent = `${day} ${month} ${year}`;
    }
  }
  setInterval(updateRealTime, 1000);
  updateRealTime();

  // Initialize modals to hidden state
  function initializeModals() {
    const modals = ['timeModal', 'dashboardModal', 'settingsModal', 'scannerModal'];
    modals.forEach(id => {
      const modal = document.getElementById(id);
      if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('active');
      }
    });
  }

  // Show a modal
  function showModal(modalId) {
    initializeModals();
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.style.display = 'flex';
      modal.classList.add('active');
    }
  }

  // Hide a modal
  function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.style.display = 'none';
      modal.classList.remove('active');
    }
  }

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
    if (sessionMinutes > 0) {
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
  }

  function calculateDailyAverage() {
    if (totalDays > 0) {
      dailyAverage = totalThisYearUsage / totalDays;
      localStorage.setItem("dailyAverage", dailyAverage.toFixed(2));
    } else {
      dailyAverage = 0;
      localStorage.setItem("dailyAverage", "0");
    }
  }

  function formatTime(totalMinutes) {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.round(totalMinutes % 60);
    return `${hours} Hr ${minutes} Min`;
  }

  function countUp(element, targetMinutes, duration = 1000) {
    let start = 0;
    const stepTime = Math.abs(Math.floor(duration / (targetMinutes || 1))) || 10;
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
    if (todayUsageEl) countUp(todayUsageEl, todayUsage);
    if (dailyAverageEl) countUp(dailyAverageEl, Math.round(dailyAverage));
  }

  function checkNewDay() {
    const today = new Date().toDateString();
    if (lastUpdatedDate !== today) {
      if (todayUsage > 0) {
        monthlyUsage[new Date().getMonth()] += todayUsage;
        totalThisYearUsage += todayUsage;
        totalDays++;
        localStorage.setItem("monthlyUsage", JSON.stringify(monthlyUsage));
        localStorage.setItem("totalThisYearUsage", totalThisYearUsage);
        localStorage.setItem("totalDays", totalDays);
      }
      todayUsage = 0;
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
    try {
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
      calculateDailyAverage();
      updateDashboard(0);
      monthlyChart.data.datasets[0].data = monthlyUsage;
      monthlyChart.update();
    } catch (e) {
      console.error("Error parsing QR code data:", e);
      alert("Invalid QR code data.");
    }
  }

  document.getElementById("generateQRBtn").addEventListener("click", () => {
    const qrCodeContainer = document.getElementById("qrCodeContainer");
    qrCodeContainer.innerHTML = '';
    qrCodeContainer.style.display = 'block';
    const data = getLocalStorageData();
    QRCode.toCanvas(data, { width: 200 }, (err, canvas) => {
      if (err) console.error(err);
      qrCodeContainer.appendChild(canvas);
    });
  });

  async function startScanner() {
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      const video = document.getElementById("scannerVideo");
      video.srcObject = stream;
      video.play();
      scanQRCode();
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Unable to access camera. Please check permissions.");
      hideModal("scannerModal");
    }
  }

  function stopScanner() {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      stream = null;
    }
  }

  function scanQRCode() {
    const video = document.getElementById("scannerVideo");
    const canvas = document.getElementById("scannerCanvas");
    const ctx = canvas.getContext("2d");

    function tick() {
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.height = video.videoHeight;
        canvas.width = video.videoWidth;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        if (code) {
          setLocalStorageData(code.data);
          alert("Data imported successfully!");
          stopScanner();
          hideModal("scannerModal");
          return;
        }
      }
      requestAnimationFrame(tick);
    }
    tick();
  }

  document.getElementById("scanQRBtn").addEventListener("click", () => {
    showModal("scannerModal");
    startScanner();
  });

  document.getElementById("closeScannerBtn").addEventListener("click", () => {
    stopScanner();
    hideModal("scannerModal");
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

  document.getElementById("startBtn").addEventListener("click", () => {
    if (hours === 0 && minutes === 0 && seconds === 0) {
      showModal("timeModal");
    } else {
      startTimer();
    }
  });

  document.getElementById("setTimeBtn").addEventListener("click", () => {
    showModal("timeModal");
  });

  document.getElementById("saveTimeBtn").addEventListener("click", () => {
    savedHours = parseInt(document.getElementById("hoursInput").value) || 0;
    savedMinutes = parseInt(document.getElementById("minutesInput").value) || 0;
    savedSeconds = parseInt(document.getElementById("secondsInput").value) || 0;
    hours = savedHours;
    minutes = savedMinutes;
    seconds = savedSeconds;
    saveTimerState();
    hideModal("timeModal");
    updateTimerDisplay();
  });

  document.getElementById("closeModalBtn").addEventListener("click", () => {
    hideModal("timeModal");
  });

  document.getElementById("dashboardBtn").addEventListener("click", () => {
    showModal("dashboardModal");
    calculateDailyAverage(); // Ensure average is recalculated
    updateDashboard(0);
    monthlyChart.data.datasets[0].data = monthlyUsage;
    monthlyChart.update();
  });

  document.getElementById("closeDashboardBtn").addEventListener("click", () => {
    hideModal("dashboardModal");
  });

  const settingsBtn = document.getElementById("settingsBtn");
  settingsBtn.addEventListener("click", (e) => {
    showModal("settingsModal");
    document.getElementById("soundToggle").checked = soundEnabled;
  });
  settingsBtn.addEventListener("touchstart", (e) => {
    e.preventDefault();
    showModal("settingsModal");
    document.getElementById("soundToggle").checked = soundEnabled;
  });

  document.getElementById("closeSettingsBtn").addEventListener("click", () => {
    hideModal("settingsModal");
    document.getElementById("qrCodeContainer").style.display = "none";
  });

  document.getElementById("soundToggle").addEventListener("change", (e) => {
    soundEnabled = e.target.checked;
    localStorage.setItem("soundEnabled", soundEnabled);
  });

  // Chat Button Logic
  const robotBtn = document.getElementById('robotBtn');
  const chatContainer = document.getElementById('chatContainer');
  const closeChat = document.getElementById('closeChat');

  robotBtn.addEventListener('click', () => {
    chatContainer.classList.toggle('hidden');
  });
  robotBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    chatContainer.classList.toggle('hidden');
  });

  closeChat.addEventListener('click', () => {
    chatContainer.classList.add('hidden');
  });
  closeChat.addEventListener('touchstart', (e) => {
    e.preventDefault();
    chatContainer.classList.add('hidden');
  });

  // Restart Button Logic
  document.getElementById("restartBtn").addEventListener("click", () => {
    hours = savedHours;
    minutes = savedMinutes;
    seconds = savedSeconds;
    clearInterval(timerInterval);
    saveTimerState();
    updateTimerDisplay();
  });

  setInterval(checkNewDay, 60000);

  // Initialize state
  initializeModals();
  loadTimerState();
  checkNewDay();
  updateTimerDisplay();
});