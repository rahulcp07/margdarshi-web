const DEFAULT_ACTION_FILTERS = Object.freeze({
  query: "",
  project: "all",
  status: "all",
  priority: "all",
  assignee: "all",
  workflowStage: "all",
  dueDate: "all",
  quickView: "all",
});

const root = document.querySelector("#app");
const state = {
  session: null,
  profile: null,
  projects: [],
  highways: [],
  offices: [],
  adminUsers: [],
  assignments: [],
  correspondence: [],
  directoryEntities: [],
  actionItems: [],
  assignableUsers: [],
  projectJurisdictions: [],
  actionAssignees: [],
  actionProgressUpdates: [],
  actionWorkflowEvents: [],
  notificationStates: [],
  notifications: [],
  calendarEvents: [],
  calendarViewDate: new Date(),
  inspections: [],
  inspectionPhotos: [],
  reportProjectId: '',
  reportFromDate: '',
  reportToDate: '',
  demo: new URLSearchParams(location.search).get("demo") === "1",
  loading: true,
  filters: { query: "", highway: "all", status: "all", office: "all" },
  actionFilters: { ...DEFAULT_ACTION_FILTERS },
};

function escapeHtml(value = "") {
  return String(value).replace(/[&<>'"]/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;",
  })[char]);
}

function formatDate(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

function formatDateTime(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  }).format(new Date(value));
}

function formatMoneyCrore(value) {
  if (value === null || value === undefined || value === "") return "—";
  return `₹${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(Number(value))} crore`;
}

function healthClass(label) {
  const normalized = (label || "").toLowerCase();
  if (normalized.includes("healthy") || normalized.includes("completed")) return "healthy";
  if (normalized.includes("delay") || normalized.includes("critical")) return "delayed";
  if (normalized.includes("attention") || normalized.includes("pending")) return "attention";
  if (normalized.includes("draft") || normalized.includes("not started")) return "draft";
  return "progress";
}

function showToast(message, type = "success") {
  document.querySelector(".toast")?.remove();
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add("visible"));
  setTimeout(() => {
    toast.classList.remove("visible");
    setTimeout(() => toast.remove(), 250);
  }, 3200);
}

function setButtonLoading(button, loading, label = "Please wait...") {
  if (!button) return;
  if (loading) {
    button.dataset.original = button.innerHTML;
    button.disabled = true;
    button.innerHTML = `<span class="spinner"></span>${label}`;
  } else {
    button.disabled = false;
    button.innerHTML = button.dataset.original || button.innerHTML;
  }
}

function currentOfficeName() {
  const profileOffice = String(state.profile?.office_name || "").trim();
  if (profileOffice) return profileOffice;
  const linkedOffice = state.offices.find((office) => office.id === state.profile?.office_id);
  return String(linkedOffice?.name || linkedOffice?.office_name || "").trim() || CONFIG.officeFallback;
}

function dashboardGreeting(date = new Date()) {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) return "Good morning";
  if (hour >= 12 && hour < 17) return "Good afternoon";
  if (hour >= 17 && hour < 21) return "Good evening";
  return "Good night";
}

function loginTemplate() {
  return `
    <main class="auth-page">
      <section class="auth-brand-panel">
        <div class="brand-lockup auth-brand">
          <div class="emblem">M</div>
          <div><strong>${CONFIG.appName}</strong><span>${CONFIG.appExpansion}</span></div>
        </div>
        <div class="auth-intro">
          <p class="eyebrow">Digital infrastructure governance</p>
          <h1>Project administration, correspondence and field monitoring—together.</h1>
          <p>MARGDARSHI gives infrastructure teams a single, secure workspace for projects, actions, inspections, documents and review readiness.</p>
          <div class="auth-feature-grid">
            <div>${icon("projects", 22)}<span>Project workspaces</span></div>
            <div>${icon("mail", 22)}<span>Action tracking</span></div>
            <div>${icon("inspection", 22)}<span>Field inspections</span></div>
            <div>${icon("reports", 22)}<span>Review reports</span></div>
          </div>
        </div>
        <p class="auth-department">Secure project delivery workspace</p>
      </section>

      <section class="auth-form-panel">
        <div class="auth-card">
          <div class="auth-card-heading">
            <div class="mobile-brand"><div class="emblem">M</div><strong>MARGDARSHI</strong></div>
            <p class="eyebrow">Secure access</p>
            <h2>Welcome back</h2>
            <p>Sign in with your approved MARGDARSHI account.</p>
          </div>
          <form id="login-form" novalidate>
            <label>Email address<input id="login-email" type="email" autocomplete="email" placeholder="name@mahapwd.gov.in" required /></label>
            <label>Password
              <div class="password-field">
                <input id="login-password" type="password" autocomplete="current-password" placeholder="Enter your password" minlength="6" required />
                <button class="password-toggle" id="toggle-login-password" type="button" aria-label="Show password">Show</button>
              </div>
            </label>
            <p id="login-error" class="form-error" role="alert"></p>
            <button class="btn primary full" id="login-button" type="submit">Sign in</button>
          </form>
          <div class="auth-divider"><span>First-time setup</span></div>
          <button class="btn secondary full" id="open-signup" type="button">Create an account</button>
          <button class="preview-link" id="preview-button" type="button">Preview the approved interface</button>
          <p class="auth-security">Access is protected by Supabase authentication and row-level security.</p>
          <section class="auth-about" aria-labelledby="about-margdarshi-title">
            <h3 id="about-margdarshi-title">About MARGDARSHI</h3>
            <p>${CONFIG.appExpansion}.</p>
            <p>A role-aware workspace for coordinated project delivery, accountable follow-up and evidence-based review.</p>
          </section>
        </div>
      </section>
    </main>
    <dialog id="signup-dialog" class="modal compact-modal">
      <form id="signup-form" class="modal-card" novalidate>
        <div class="modal-heading"><div><p class="eyebrow">Initial access</p><h2>Create account</h2><p>Your account will require administrator approval for editing rights.</p></div><button class="icon-button" id="signup-close-button" type="button" data-dialog-close aria-label="Close">${icon("close")}</button></div>
        <div class="form-grid single">
          <label>Full name<input id="signup-name" required placeholder="Your full name" /></label>
          <label>Designation
            <select id="signup-designation" required>
              <option value="">Select designation</option>
              <optgroup label="Class I">
                <option>Chief Engineer</option>
                <option>Superintending Engineer</option>
                <option>Executive Engineer</option>
                <option>Assistant Executive Engineer</option>
                <option>Deputy Engineer (PA), Class I</option>
                <option>Sub-Divisional Engineer</option>
                <option>Sub-Divisional Officer</option>
                <option>Assistant Engineer Grade-I</option>
              </optgroup>
              <optgroup label="Class II">
                <option>Project Officer, Class II</option>
                <option>Assistant Engineer Grade-II</option>
                <option>Sectional Engineer</option>
                <option>Junior Engineer</option>
              </optgroup>
              <optgroup label="Ministerial and Supporting Staff">
                <option>Divisional Accountant</option>
                <option>Senior Clerk</option>
                <option>Junior Clerk</option>
                <option>Data Entry Operator</option>
              </optgroup>
              <optgroup label="External Users">
                <option>Consultant / Authority Engineer</option>
                <option>Contractor Representative</option>
                <option>Other</option>
              </optgroup>
            </select>
          </label>
          <label>Email address
            <input id="signup-email" type="email" required placeholder="Official email address" autocomplete="email" />
          </label>
          <button class="btn secondary full" id="send-otp-button" type="button">Send verification code</button>
          <div id="otp-section" hidden>
            <div class="otp-label">
              <span>Verification code</span>
              <div class="otp-boxes" id="signup-otp-boxes" role="group" aria-label="Verification code">
                ${Array.from({ length: 8 }, (_, index) => `<input class="otp-box" type="text" inputmode="numeric" maxlength="1" aria-label="Digit ${index + 1}" ${index === 0 ? 'autocomplete="one-time-code"' : ''} />`).join("")}
              </div>
              <input id="signup-otp" type="hidden" />
            </div>
            <button class="btn secondary full" id="verify-otp-button" type="button">Verify email</button>
          </div>
          <p id="email-verification-status" class="field-help">Verify your email before creating a password.</p>
          <label class="password-field">Password
            <input id="signup-password" type="password" required minlength="8" autocomplete="new-password" placeholder="Minimum 8 characters" aria-describedby="password-rules" disabled />
            <button class="password-toggle" id="toggle-signup-password" type="button" aria-pressed="false" disabled>Show</button>
          </label>
          <small id="password-rules" class="field-help">Use at least 8 characters with uppercase, lowercase, number and special character.</small>
          <label class="password-field">Re-enter password
            <input id="signup-password-confirm" type="password" required minlength="8" autocomplete="new-password" placeholder="Re-enter your password" disabled />
            <button class="password-toggle" id="toggle-signup-password-confirm" type="button" aria-pressed="false" disabled>Show</button>
          </label>
        </div>
        <p id="signup-error" class="form-error"></p>
        <div class="modal-actions"><button class="btn secondary" id="signup-cancel-button" type="button" data-dialog-close>Cancel</button><button class="btn primary" id="signup-button" type="submit" disabled>Create account</button></div>
      </form>
    </dialog>`;
}

function sidebar(active = "projects") {
  const items = [
    ["dashboard", "dashboard", "Dashboard"],
    ["projects", "projects", "Project Register"],
    ["mail", "correspondence", "Correspondence"],
    ["clipboard", "actions", "Action Tracking"],
    ["inspection", "inspections", "Inspections"],
    ["calendar", "calendar", "Calendar"],
    ["reports", "reports", "Reports"],
    ["settings", "admin", "Administration"],
  ];
  return `<aside class="sidebar">
    <nav aria-label="Primary navigation">${items.map(([ic, key, label]) => `<button class="nav-item ${active === key ? "active" : ""}" data-nav="${key}" data-tooltip="${label}" aria-label="${label}" title="${label}">${icon(ic)}<span>${label}</span>${key === "admin" ? icon("arrow", 16) : ""}</button>`).join("")}</nav>
    <div class="sidebar-footer"><div class="road-mark">M</div><strong>Infrastructure Governance</strong><span>Projects, actions and assurance · Build ${CONFIG.buildLabel}</span></div>
  </aside>`;
}

function appHeader() {
  const name = escapeHtml(state.profile?.full_name || "MARGDARSHI User");
  const designation = escapeHtml(state.profile?.designation || "Authorised User");
  const officeName = escapeHtml(currentOfficeName());
  const initials = name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  return `<header class="topbar">
    <div class="brand-lockup"><div class="emblem">M</div><div><strong>MARGDARSHI</strong><span>${officeName}</span></div></div>
    <div class="global-search">${icon("search", 19)}<input id="global-search-input" aria-label="Global search" autocomplete="off" placeholder="Search projects, letters, actions, inspections..." /><kbd>Ctrl K</kbd><div id="global-search-results" class="global-search-results" hidden></div></div>
    <div class="topbar-actions"><span class="app-build-marker" aria-label="Current application build ${CONFIG.buildLabel}">Build ${CONFIG.buildLabel}</span><button class="notification-button" id="notification-button" aria-label="Notifications">${icon("bell")}<span class="${unreadNotificationCount() ? "" : "notification-zero"}">${unreadNotificationCount()}</span></button><div class="user-menu"><div class="avatar">${initials}</div><div><strong>${name}</strong><span>${designation}</span></div></div><button class="icon-button" id="logout-button" title="Sign out">${icon("logout")}</button></div>
  </header>`;
}



function bindCommonEvents() {
  bindGlobalSearch();
  document.querySelector("#notification-button")?.addEventListener("click", () => { location.hash = "#notifications"; });
  document.querySelector("#logout-button")?.addEventListener("click", async () => {
    if (state.demo) { location.href = "./"; return; }
    await signOut();
    location.hash = "";
    await init();
  });
  const activeRoutes = {
    dashboard: "#dashboard",
    projects: "#projects",
    correspondence: "#correspondence",
    actions: "#actions",
    inspections: "#inspections",
    calendar: "#calendar",
    reports: "#reports",
  };

  document.querySelectorAll(".nav-item").forEach((button) => {
    button.addEventListener("click", () => {
      const nav = button.dataset.nav;
      if (nav === "admin") {
        if (state.profile?.role !== "admin") {
          showToast("Administrator access is required.", "error");
          return;
        }
        location.hash = "#admin";
        return;
      }
      if (nav === "actions") {
        openActionRegisterView("all");
        return;
      }
      if (activeRoutes[nav]) {
        location.hash = activeRoutes[nav];
        route();
        return;
      }
      showToast(`${button.textContent.trim()} will be activated in the next module.`, "info");
    });
  });
}
