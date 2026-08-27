// Relative path — works because the backend now serves this page itself.
const API_BASE = '/api';

// Hard cap: attempts that don't finish within this window are not saved.
const MAX_TIME_MS = 2 * 60 * 1000; // 2 minutes

const screens = {
  id: document.getElementById('idScreen'),
  ready: document.getElementById('readyScreen'),
  game: document.getElementById('gameScreen'),
  timeUp: document.getElementById('timeUpScreen'),
  result: document.getElementById('resultScreen')
};

function showScreen(name) {
  Object.values(screens).forEach(s => s.classList.remove('active'));
  screens[name].classList.add('active');
}

let currentStudent = null;
let startTime = 0;
let timerInterval = null;

// ---------- Stage 1: look up player by roll number ----------
document.getElementById('idForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const roll = document.getElementById('rollInput').value.trim();
  const errEl = document.getElementById('idError');
  errEl.textContent = '';

  if (!roll) return;

  try {
    const res = await fetch(`${API_BASE}/students/lookup/${encodeURIComponent(roll)}`);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      errEl.textContent = body.error || 'Could not find that roll number.';
      return;
    }
    currentStudent = await res.json();
    document.getElementById('pName').textContent = currentStudent.name;
    document.getElementById('pMeta').textContent =
      `${currentStudent.rollNumber} · ${currentStudent.college} · ${currentStudent.branch} · Sec ${currentStudent.section}`;
    showScreen('ready');
  } catch (err) {
    errEl.textContent = 'Could not reach the server. Is the backend running?';
  }
});

// ---------- Stage 2: press Start ----------
document.getElementById('startBtn').addEventListener('click', () => {
  showScreen('game');
  startTime = performance.now();
  timerInterval = setInterval(updateTimerDisplay, 30);
});

function updateTimerDisplay() {
  const elapsed = performance.now() - startTime;

  if (elapsed >= MAX_TIME_MS) {
    timeUp();
    return;
  }

  document.getElementById('timer').textContent = (elapsed / 1000).toFixed(2) + 's';
}

// Ran out of time — stop the clock, do NOT call the API, so nothing
// is ever written to the database for a failed/over-time attempt.
function timeUp() {
  clearInterval(timerInterval);
  document.getElementById('timer').textContent = '2:00.00';
  showScreen('timeUp');
}

document.getElementById('tryAgainBtn').addEventListener('click', () => {
  showScreen('ready');
});

// ---------- Stage 3: press Stop ----------
document.getElementById('stopBtn').addEventListener('click', () => {
  finishGame();
});

async function finishGame() {
  clearInterval(timerInterval);
  const timeTakenMs = Math.round(performance.now() - startTime);

  // Safety net: even if Stop was clicked right at the boundary, never save
  // an attempt that reached or exceeded the 2-minute cap.
  if (timeTakenMs >= MAX_TIME_MS) {
    document.getElementById('timer').textContent = '2:00.00';
    showScreen('timeUp');
    return;
  }

  document.getElementById('resultTime').textContent = (timeTakenMs / 1000).toFixed(2) + 's';
  showScreen('result');

  try {
    await fetch(`${API_BASE}/scores`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rollNumber: currentStudent.rollNumber, timeTakenMs })
    });

    const lb = await fetch(`${API_BASE}/scores/leaderboard?limit=100`).then(r => r.json());
    const rank = lb.findIndex(row => row.rollNumber === currentStudent.rollNumber) + 1;
    document.getElementById('resultRank').textContent =
      rank > 0 ? `You're currently rank #${rank} on the leaderboard.` : '';
  } catch (err) {
    document.getElementById('resultRank').textContent = 'Score saved locally — could not reach the server for your rank.';
  }
}

document.getElementById('playAgainBtn').addEventListener('click', () => {
  showScreen('ready');
});

// Initial screen
showScreen('id');
