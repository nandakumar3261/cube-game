// Relative path — works because the backend now serves this page itself
// at /admin, so /api resolves back to the same server.
const API_BASE = '/api';

function getToken() { return sessionStorage.getItem('cubeAdminToken'); }
function setToken(token, username) {
  sessionStorage.setItem('cubeAdminToken', token);
  sessionStorage.setItem('cubeAdminUser', username);
}
function authHeaders() {
  return { 'Authorization': `Bearer ${getToken()}`, 'Content-Type': 'application/json' };
}

// ================= login.html =================
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const errEl = document.getElementById('loginError');
    errEl.textContent = '';

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const body = await res.json();
      if (!res.ok) {
        errEl.textContent = body.error || 'Login failed.';
        return;
      }
      setToken(body.token, body.username);
      window.location.href = 'dashboard.html';
    } catch (err) {
      errEl.textContent = 'Could not reach the server. Is the backend running?';
    }
  });
}

// ================= dashboard.html =================
const studentBody = document.getElementById('studentBody');
if (studentBody) {

  if (!getToken()) {
    window.location.href = 'login.html';
  }

  document.getElementById('logoutBtn').addEventListener('click', () => {
    sessionStorage.clear();
    window.location.href = 'login.html';
  });

  async function loadStudents() {
    studentBody.innerHTML = '<tr><td colspan="6">Loading…</td></tr>';
    const res = await fetch(`${API_BASE}/students`, { headers: authHeaders() });
    if (res.status === 401) { window.location.href = 'login.html'; return; }
    const students = await res.json();

    if (!students.length) {
      studentBody.innerHTML = '<tr><td colspan="6">No students added yet.</td></tr>';
      return;
    }

    studentBody.innerHTML = students.map(s => `
      <tr data-id="${s._id}">
        <td>${escapeHtml(s.rollNumber)}</td>
        <td>${escapeHtml(s.name)}</td>
        <td>${escapeHtml(s.college)}</td>
        <td>${escapeHtml(s.branch)}</td>
        <td>${escapeHtml(s.section)}</td>
        <td><button class="delete-btn">Remove</button></td>
      </tr>
    `).join('');

    studentBody.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.target.closest('tr').dataset.id;
        if (!confirm('Remove this student?')) return;
        await fetch(`${API_BASE}/students/${id}`, { method: 'DELETE', headers: authHeaders() });
        loadStudents();
      });
    });
  }

  document.getElementById('refreshBtn').addEventListener('click', loadStudents);

  // Add single student
  document.getElementById('addForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const payload = Object.fromEntries(new FormData(form).entries());
    const statusEl = document.getElementById('addStatus');

    const res = await fetch(`${API_BASE}/students`, {
      method: 'POST', headers: authHeaders(), body: JSON.stringify(payload)
    });
    const body = await res.json();

    if (!res.ok) {
      statusEl.textContent = body.error || 'Could not add student.';
      statusEl.style.color = 'var(--red)';
    } else {
      statusEl.textContent = `Added ${body.name}.`;
      statusEl.style.color = 'var(--green)';
      form.reset();
      loadStudents();
    }
  });

  // Bulk CSV import
  document.getElementById('importBtn').addEventListener('click', async () => {
    const fileInput = document.getElementById('csvFile');
    const statusEl = document.getElementById('importStatus');
    const file = fileInput.files[0];
    if (!file) { statusEl.textContent = 'Choose a CSV file first.'; return; }

    const text = await file.text();
    const rows = parseCsv(text);
    if (!rows.length) { statusEl.textContent = 'No rows found in that CSV.'; return; }

    statusEl.textContent = 'Importing…';
    const res = await fetch(`${API_BASE}/students/bulk`, {
      method: 'POST', headers: authHeaders(), body: JSON.stringify({ students: rows })
    });
    const body = await res.json();
    statusEl.textContent = `Inserted ${body.inserted}. Skipped ${body.skipped.length}.`;
    loadStudents();
  });

  // Clear all scores
  document.getElementById('clearScoresBtn').addEventListener('click', async () => {
    if (!confirm('This clears every recorded score. Continue?')) return;
    const statusEl = document.getElementById('clearStatus');
    await fetch(`${API_BASE}/scores`, { method: 'DELETE', headers: authHeaders() });
    statusEl.textContent = 'All scores cleared.';
  });

  loadStudents();
}

// ---------- helpers ----------
function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  const headers = lines[0].split(',').map(h => h.trim());
  return lines.slice(1).filter(Boolean).map(line => {
    const cells = line.split(',').map(c => c.trim());
    const obj = {};
    headers.forEach((h, i) => { obj[h] = cells[i] || ''; });
    return obj;
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
