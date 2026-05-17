const STORAGE_KEY = "student-performance-tracker-db";
const TEACHER_LOGIN = {
  id: "TCH-001",
  username: "teacher"
};

const sampleRecords = [
  {
    id: "STU-1001",
    name: "Ayesha Khan",
    subject: "Mathematics",
    marks: 88,
    attendance: 94,
    updatedAt: "2026-05-17T09:00:00.000Z"
  },
  {
    id: "STU-1002",
    name: "Bilal Ahmed",
    subject: "Science",
    marks: 74,
    attendance: 86,
    updatedAt: "2026-05-17T09:05:00.000Z"
  },
  {
    id: "STU-1003",
    name: "Sara Malik",
    subject: "English",
    marks: 56,
    attendance: 71,
    updatedAt: "2026-05-17T09:10:00.000Z"
  }
];

let database = loadDatabase();
let selectedRole = "";
let currentSession = null;

const els = {
  portalView: document.querySelector("#portalView"),
  loginView: document.querySelector("#loginView"),
  appShell: document.querySelector("#appShell"),
  backToPortal: document.querySelector("#backToPortal"),
  loginForm: document.querySelector("#loginForm"),
  loginId: document.querySelector("#loginId"),
  loginUsername: document.querySelector("#loginUsername"),
  loginTitle: document.querySelector("#loginTitle"),
  loginEyebrow: document.querySelector("#loginEyebrow"),
  loginHelp: document.querySelector("#loginHelp"),
  sessionName: document.querySelector("#sessionName"),
  sessionRole: document.querySelector("#sessionRole"),
  logoutBtn: document.querySelector("#logoutBtn"),
  studentForm: document.querySelector("#studentForm"),
  recordsTable: document.querySelector("#recordsTable"),
  studentCount: document.querySelector("#studentCount"),
  classAverage: document.querySelector("#classAverage"),
  attendanceAverage: document.querySelector("#attendanceAverage"),
  searchForm: document.querySelector("#searchForm"),
  searchId: document.querySelector("#searchId"),
  studentResult: document.querySelector("#studentResult"),
  databaseJson: document.querySelector("#databaseJson"),
  importJson: document.querySelector("#importJson"),
  importBtn: document.querySelector("#importBtn"),
  exportBtn: document.querySelector("#exportBtn"),
  clearBtn: document.querySelector("#clearBtn"),
  loadSampleBtn: document.querySelector("#loadSampleBtn"),
  lastUpdated: document.querySelector("#lastUpdated"),
  toast: document.querySelector("#toast")
};

document.querySelectorAll("[data-role]").forEach((button) => {
  button.addEventListener("click", () => openLogin(button.dataset.role));
});

document.querySelectorAll(".nav-tab").forEach((tab) => {
  tab.addEventListener("click", () => switchPanel(tab.dataset.panel));
});

els.backToPortal.addEventListener("click", showPortal);
els.logoutBtn.addEventListener("click", showPortal);

els.loginForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const id = normalizeId(els.loginId.value);
  const username = normalizeName(els.loginUsername.value);

  if (selectedRole === "teacher") {
    if (id === TEACHER_LOGIN.id && username.toLowerCase() === TEACHER_LOGIN.username) {
      openDashboard({ role: "teacher", id, username: "Teacher" });
      return;
    }
    showToast("Teacher login failed. Use ID TCH-001 and username teacher.");
    return;
  }

  const student = database.records.find(
    (record) => record.id === id && record.name.toLowerCase() === username.toLowerCase()
  );
  if (!student) {
    showToast("Student login failed. ID and username must exist in the database.");
    return;
  }

  openDashboard({ role: "student", id: student.id, username: student.name });
});

els.studentForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const form = new FormData(els.studentForm);
  const record = {
    id: normalizeId(form.get("studentId")),
    name: normalizeName(form.get("studentName")),
    subject: normalizeName(form.get("subject")),
    marks: clampNumber(form.get("marks")),
    attendance: clampNumber(form.get("attendance")),
    updatedAt: new Date().toISOString()
  };

  if (!record.id || !record.name || !record.subject) {
    showToast("Please complete all student details.");
    return;
  }

  const existingIndex = database.records.findIndex((item) => item.id === record.id);
  if (existingIndex >= 0) {
    database.records[existingIndex] = record;
    showToast("Student record updated in database.");
  } else {
    database.records.push(record);
    showToast("Student record saved in database.");
  }

  saveDatabase();
  els.studentForm.reset();
  render();
});

els.searchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  renderStudentResult(normalizeId(els.searchId.value));
});

els.loadSampleBtn.addEventListener("click", () => {
  database.records = mergeById(database.records, sampleRecords);
  saveDatabase();
  render();
  showToast("Sample database loaded.");
});

els.clearBtn.addEventListener("click", () => {
  const confirmed = window.confirm("Clear all saved student records?");
  if (!confirmed) return;
  database = createEmptyDatabase();
  saveDatabase();
  render();
  showToast("Database cleared.");
});

els.exportBtn.addEventListener("click", async () => {
  const json = JSON.stringify(database, null, 2);
  try {
    await navigator.clipboard.writeText(json);
    showToast("Database JSON copied to clipboard.");
  } catch {
    els.importJson.value = json;
    showToast("Clipboard blocked, JSON placed in import box.");
  }
});

els.importBtn.addEventListener("click", () => {
  try {
    const imported = JSON.parse(els.importJson.value);
    if (!Array.isArray(imported.records)) {
      throw new Error("Missing records array");
    }

    database = {
      records: imported.records.map(sanitizeRecord),
      lastUpdated: new Date().toISOString()
    };
    saveDatabase();
    render();
    showToast("Database imported.");
  } catch {
    showToast("Invalid JSON database.");
  }
});

els.recordsTable.addEventListener("click", (event) => {
  const button = event.target.closest("[data-delete-id]");
  if (!button) return;
  database.records = database.records.filter((record) => record.id !== button.dataset.deleteId);
  saveDatabase();
  render();
  showToast("Record deleted from database.");
});

function openLogin(role) {
  selectedRole = role;
  els.portalView.classList.add("hidden");
  els.loginView.classList.remove("hidden");
  els.appShell.classList.add("hidden");
  els.loginForm.reset();

  if (role === "teacher") {
    els.loginTitle.textContent = "Teacher Login";
    els.loginEyebrow.textContent = "Teacher Access";
    els.loginId.placeholder = "TCH-001";
    els.loginUsername.placeholder = "teacher";
    els.loginId.value = TEACHER_LOGIN.id;
    els.loginUsername.value = TEACHER_LOGIN.username;
    els.loginHelp.textContent = "Teacher demo: ID TCH-001, username teacher";
  } else {
    database.records = mergeById(database.records, sampleRecords);
    saveDatabase();
    render();
    els.loginTitle.textContent = "Student Login";
    els.loginEyebrow.textContent = "Student Access";
    els.loginId.placeholder = "STU-1001";
    els.loginUsername.placeholder = "Ayesha Khan";
    els.loginId.value = "STU-1001";
    els.loginUsername.value = "Ayesha Khan";
    els.loginHelp.textContent = "Student demo: ID STU-1001, username Ayesha Khan. Login is checked against the saved database.";
  }
}

function showPortal() {
  selectedRole = "";
  currentSession = null;
  els.portalView.classList.remove("hidden");
  els.loginView.classList.add("hidden");
  els.appShell.classList.add("hidden");
}

function openDashboard(session) {
  currentSession = session;
  els.portalView.classList.add("hidden");
  els.loginView.classList.add("hidden");
  els.appShell.classList.remove("hidden");
  els.sessionName.textContent = session.username;
  els.sessionRole.textContent = `${session.role.toUpperCase()} - ${session.id}`;
  document.body.dataset.role = session.role;

  if (session.role === "student") {
    els.searchId.value = session.id;
    switchPanel("studentPanel");
    renderStudentResult(session.id);
  } else {
    switchPanel("teacherPanel");
  }

  render();
  showToast(`${session.role === "teacher" ? "Teacher" : "Student"} dashboard opened.`);
}

function switchPanel(panelId) {
  document.querySelectorAll(".nav-tab").forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.panel === panelId);
  });
  document.querySelectorAll(".panel").forEach((panel) => {
    panel.classList.toggle("active", panel.id === panelId);
  });
}

function render() {
  renderTable();
  renderStats();
  renderDatabase();
  if (currentSession?.role === "student") {
    renderStudentResult(currentSession.id);
  } else if (els.searchId.value.trim()) {
    renderStudentResult(normalizeId(els.searchId.value));
  }
}

function renderTable() {
  if (!database.records.length) {
    els.recordsTable.innerHTML = `
      <tr>
        <td colspan="7" class="empty-state">No records yet. Add a student from the teacher panel.</td>
      </tr>
    `;
    return;
  }

  els.recordsTable.innerHTML = database.records
    .map((record) => {
      const grade = calculateGrade(record.marks);
      return `
        <tr>
          <td>${escapeHtml(record.id)}</td>
          <td>${escapeHtml(record.name)}</td>
          <td>${escapeHtml(record.subject)}</td>
          <td>${record.marks}%</td>
          <td>${record.attendance}%</td>
          <td><span class="grade-pill">${grade}</span></td>
          <td><button class="delete-row" type="button" data-delete-id="${escapeHtml(record.id)}">Delete</button></td>
        </tr>
      `;
    })
    .join("");
}

function renderStats() {
  const total = database.records.length;
  const marksAverage = total ? average(database.records.map((record) => record.marks)) : 0;
  const attendanceAverage = total ? average(database.records.map((record) => record.attendance)) : 0;

  els.studentCount.textContent = total;
  els.classAverage.textContent = `${marksAverage}%`;
  els.attendanceAverage.textContent = `${attendanceAverage}%`;
}

function renderDatabase() {
  els.databaseJson.textContent = JSON.stringify(database, null, 2);
  els.lastUpdated.textContent = database.lastUpdated
    ? `Last updated ${new Date(database.lastUpdated).toLocaleString()}`
    : "No updates yet";
}

function renderStudentResult(studentId) {
  const record = database.records.find((item) => item.id === studentId);
  if (!record) {
    els.studentResult.className = "student-result empty-state";
    els.studentResult.textContent = `No student found for ID ${studentId || "provided"}.`;
    return;
  }

  els.studentResult.className = "student-result";
  els.studentResult.innerHTML = `
    <strong>${escapeHtml(record.name)} (${escapeHtml(record.id)})</strong>
    <div class="student-card-grid">
      <div class="metric"><span>Subject</span><strong>${escapeHtml(record.subject)}</strong></div>
      <div class="metric"><span>Marks</span><strong>${record.marks}%</strong></div>
      <div class="metric"><span>Attendance</span><strong>${record.attendance}%</strong></div>
      <div class="metric"><span>Grade</span><strong>${calculateGrade(record.marks)}</strong></div>
    </div>
  `;
}

function calculateGrade(marks) {
  if (marks >= 80) return "A";
  if (marks >= 60) return "B";
  return "C";
}

function average(values) {
  const sum = values.reduce((total, value) => total + value, 0);
  return Math.round(sum / values.length);
}

function clampNumber(value) {
  const number = Number(value);
  if (Number.isNaN(number)) return 0;
  return Math.min(100, Math.max(0, Math.round(number)));
}

function normalizeId(value) {
  return String(value).trim().toUpperCase();
}

function normalizeName(value) {
  return String(value).trim().replace(/\s+/g, " ");
}

function mergeById(currentRecords, incomingRecords) {
  const records = [...currentRecords];
  incomingRecords.forEach((incoming) => {
    const index = records.findIndex((record) => record.id === incoming.id);
    if (index >= 0) {
      records[index] = sanitizeRecord(incoming);
    } else {
      records.push(sanitizeRecord(incoming));
    }
  });
  return records;
}

function sanitizeRecord(record) {
  return {
    id: normalizeId(record.id),
    name: normalizeName(record.name || ""),
    subject: normalizeName(record.subject || ""),
    marks: clampNumber(record.marks),
    attendance: clampNumber(record.attendance),
    updatedAt: record.updatedAt || new Date().toISOString()
  };
}

function createEmptyDatabase() {
  return {
    records: [],
    lastUpdated: ""
  };
}

function createInitialDatabase() {
  return {
    records: sampleRecords.map(sanitizeRecord),
    lastUpdated: new Date().toISOString()
  };
}

function loadDatabase() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (stored && Array.isArray(stored.records)) {
      return {
        records: stored.records.map(sanitizeRecord),
        lastUpdated: stored.lastUpdated || ""
      };
    }
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
  const initialDatabase = createInitialDatabase();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(initialDatabase));
  return initialDatabase;
}

function saveDatabase() {
  database.lastUpdated = new Date().toISOString();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(database));
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => els.toast.classList.remove("show"), 2400);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

render();
