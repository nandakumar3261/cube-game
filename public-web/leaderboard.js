const API_BASE = '/api';
const AUTO_REFRESH_MS = 10000;

let currentFilters = { college: '', branch: '', section: '' };

async function loadLeaderboard() {
  const tbody = document.getElementById('lbBody');

  const params = new URLSearchParams({ limit: '50' });
  if (currentFilters.college) params.set('college', currentFilters.college);
  if (currentFilters.branch) params.set('branch', currentFilters.branch);
  if (currentFilters.section) params.set('section', currentFilters.section);

  try {
    const rows = await fetch(`${API_BASE}/scores/leaderboard?${params}`).then(r => r.json());

    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="5">No scores yet — be the first to play!</td></tr>';
      return;
    }

    tbody.innerHTML = rows.map((row, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${escapeHtml(row.name)}</td>
        <td>${escapeHtml(row.rollNumber)}</td>
        <td>${escapeHtml(row.college)} / ${escapeHtml(row.branch)} / ${escapeHtml(row.section)}</td>
        <td>${(row.bestTimeMs / 1000).toFixed(2)}s</td>
      </tr>
    `).join('');
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="5">Could not reach the server.</td></tr>';
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

document.getElementById('filterForm').addEventListener('submit', (e) => {
  e.preventDefault();
  currentFilters = {
    college: document.getElementById('fCollege').value.trim(),
    branch: document.getElementById('fBranch').value.trim(),
    section: document.getElementById('fSection').value.trim()
  };
  loadLeaderboard();
});

document.getElementById('clearFiltersBtn').addEventListener('click', () => {
  document.getElementById('filterForm').reset();
  currentFilters = { college: '', branch: '', section: '' };
  loadLeaderboard();
});

loadLeaderboard();
setInterval(loadLeaderboard, AUTO_REFRESH_MS);
