function isoDateLocal(date) {
  const copy = new Date(date);
  const year = copy.getFullYear();
  const month = String(copy.getMonth() + 1).padStart(2, "0");
  const day = String(copy.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function calendarItems() {
  const items = [];

  state.calendarEvents
    .filter((event) => event.status !== "cancelled")
    .forEach((event) => items.push({
      id: `manual:${event.id}`,
      sourceId: event.id,
      kind: "manual",
      date: event.event_date,
      title: event.title,
      detail: `${event.event_type}${event.location ? ` · ${event.location}` : ""}`,
      projectId: event.project_id,
      editable: ["admin", "editor"].includes(state.profile?.role),
    }));

  state.actionItems
    .filter((action) => !["completed", "cancelled"].includes(action.status))
    .forEach((action) => {
      const project = state.projects.find((item) => item.id === action.project_id);
      const projectLabel = project?.project_code || project?.project_name || "Project";
      if (action.due_date) items.push({
        id: `due:${action.id}`,
        kind: "action_due",
        date: action.due_date,
        title: `Due: ${action.title}`,
        detail: projectLabel,
        actionId: action.id,
        projectId: action.project_id,
      });
      if (action.reminder_date) items.push({
        id: `reminder:${action.id}`,
        kind: "reminder",
        date: action.reminder_date,
        title: `Reminder: ${action.title}`,
        detail: projectLabel,
        actionId: action.id,
        projectId: action.project_id,
      });
    });

  state.projects.forEach((project) => {
    const milestones = [
      ["sanction_date", "Sanction date"],
      ["appointed_date", "Appointed date"],
      ["scheduled_completion_date", "Scheduled completion"],
      ["actual_completion_date", "Actual completion"],
    ];
    milestones.forEach(([field, label]) => {
      if (!project[field]) return;
      items.push({
        id: `milestone:${project.id}:${field}`,
        kind: "milestone",
        date: project[field],
        title: `${label}: ${project.project_name}`,
        detail: project.project_code || "Project milestone",
        projectId: project.id,
      });
    });
  });

  return items.sort((a, b) => String(a.date).localeCompare(String(b.date)) || a.title.localeCompare(b.title));
}

function monthLabel(date) {
  return new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric" }).format(date);
}

function calendarMonthCells(viewDate) {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const first = new Date(year, month, 1);
  const gridStart = new Date(year, month, 1 - first.getDay());
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    return date;
  });
}

function calendarGrid(items) {
  const view = state.calendarViewDate;
  const todayIso = isoDateLocal(new Date());
  const cells = calendarMonthCells(view);
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return `<div class="calendar-grid">
    ${weekdays.map((day) => `<div class="calendar-weekday">${day}</div>`).join("")}
    ${cells.map((date) => {
      const iso = isoDateLocal(date);
      const events = items.filter((item) => item.date === iso);
      const outside = date.getMonth() !== view.getMonth();
      return `<div class="calendar-day ${outside ? "outside" : ""} ${iso === todayIso ? "today" : ""}">
        <span class="calendar-date-number">${date.getDate()}</span>
        ${events.slice(0, 4).map((item) => `<button class="calendar-event-chip ${item.kind}" data-calendar-item="${escapeHtml(item.id)}" title="${escapeHtml(item.title)}">${escapeHtml(item.title)}</button>`).join("")}
        ${events.length > 4 ? `<span class="field-help">+${events.length - 4} more</span>` : ""}
      </div>`;
    }).join("")}
  </div>`;
}

function calendarAgenda(items) {
  const view = state.calendarViewDate;
  const month = view.getMonth();
  const year = view.getFullYear();
  const monthItems = items.filter((item) => {
    const date = new Date(`${item.date}T00:00:00`);
    return date.getMonth() === month && date.getFullYear() === year;
  });
  if (!monthItems.length) return `<div class="empty-state">${icon("calendar",42)}<h3>No events this month</h3><p>Add a meeting, inspection, hearing or review.</p></div>`;
  return `<div class="calendar-agenda">${monthItems.map((item) => {
    const project = state.projects.find((project) => project.id === item.projectId);
    return `<article class="calendar-agenda-item" data-calendar-item-id="${escapeHtml(item.id)}">
      <div><strong>${formatDate(item.date)}</strong><span>${escapeHtml(item.kind.replace("_", " "))}</span></div>
      <div><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.detail || "")}${project ? ` · ${escapeHtml(project.project_name)}` : ""}</span></div>
      <div>${item.editable ? `<button class="btn secondary edit-calendar-event" data-event-id="${item.sourceId}">Edit</button>` : item.actionId ? `<button class="btn secondary open-calendar-action" data-action-id="${item.actionId}">Open exact action</button>` : item.projectId ? `<button class="btn secondary open-calendar-project" data-project-id="${item.projectId}">Open project</button>` : ""}</div>
    </article>`;
  }).join("")}</div>`;
}

function calendarEventDialog() {
  return `<dialog id="calendar-event-dialog" class="modal compact-modal">
    <form id="calendar-event-form" class="modal-card" novalidate>
      <div class="modal-heading"><div><p class="eyebrow">Calendar</p><h2 id="calendar-event-title">Add event</h2><p>Schedule a meeting, inspection, hearing, submission or review.</p></div><button class="icon-button" type="button" data-dialog-close>${icon("close")}</button></div>
      <input id="calendar-event-id" type="hidden" />
      <div class="form-grid single">
        <label>Title *<input id="calendar-title" required /></label>
        <label>Project<select id="calendar-project"><option value="">Division-wide / No project</option>${state.projects.map((project) => `<option value="${project.id}">${escapeHtml(project.project_name)}</option>`).join("")}</select></label>
        <label>Event type<select id="calendar-type"><option value="meeting">Meeting</option><option value="inspection">Inspection</option><option value="hearing">Hearing</option><option value="submission">Submission</option><option value="review">Review</option><option value="other">Other</option></select></label>
        <label>Date *<input id="calendar-date" type="date" required /></label>
        <label>Start time<input id="calendar-start-time" type="time" /></label>
        <label>End time<input id="calendar-end-time" type="time" /></label>
        <label>Location<input id="calendar-location" /></label>
        <label>Status<select id="calendar-status"><option value="scheduled">Scheduled</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select></label>
        <label>Description<textarea id="calendar-description" rows="3"></textarea></label>
      </div>
      <p id="calendar-error" class="form-error"></p>
      <div class="modal-actions"><button class="btn secondary" type="button" data-dialog-close>Cancel</button><button class="btn primary" id="calendar-save-button" type="submit">Save event</button></div>
    </form>
  </dialog>`;
}

function calendarTemplate() {
  const items = calendarItems();
  const canEdit = ["admin", "editor"].includes(state.profile?.role);
  return `<div class="app-shell">${appHeader()}${sidebar("calendar")}
    <main class="main-content calendar-page">
      <div class="breadcrumb"><span>Dashboard</span><b>/</b>Calendar</div>
      <div class="calendar-toolbar">
        <div><h1 style="margin:0;font-size:35px;letter-spacing:-.035em;">Calendar</h1><p style="margin:8px 0 0;color:var(--muted);">Actions, reminders, project milestones and scheduled official events.</p></div>
        ${canEdit ? `<button class="btn primary" id="add-calendar-event">${icon("plus")}Add event</button>` : ""}
      </div>
      <section class="admin-card">
        <div class="admin-card-heading">
          <div class="calendar-nav"><button class="btn secondary" id="calendar-prev">Previous</button><h2>${monthLabel(state.calendarViewDate)}</h2><button class="btn secondary" id="calendar-next">Next</button><button class="btn secondary" id="calendar-today">Today</button></div>
        </div>
        <div style="padding:18px 20px;">${calendarGrid(items)}</div>
      </section>
      <section class="admin-card"><div class="admin-card-heading"><div><h2>Monthly agenda</h2><p>All events for ${monthLabel(state.calendarViewDate)}.</p></div></div><div style="padding:18px 20px;">${calendarAgenda(items)}</div></section>
      ${calendarEventDialog()}
    </main></div>`;
}

async function renderCalendar() {
  root.innerHTML = `<div class="loading-screen"><span class="spinner dark"></span><p>Loading calendar...</p></div>`;
  try {
    [state.calendarEvents, state.actionItems] = await Promise.all([getCalendarEvents(), getActionItems()]);
    root.innerHTML = calendarTemplate();
    bindCalendarEvents();
  } catch (error) {
    root.innerHTML = `<div class="loading-screen"><p>${escapeHtml(error.message)}</p></div>`;
  }
}

function populateCalendarForm(event = null) {
  document.querySelector("#calendar-event-form")?.reset();
  document.querySelector("#calendar-event-id").value = event?.id || "";
  document.querySelector("#calendar-event-title").textContent = event ? "Edit event" : "Add event";
  document.querySelector("#calendar-title").value = event?.title || "";
  document.querySelector("#calendar-project").value = event?.project_id || "";
  document.querySelector("#calendar-type").value = event?.event_type || "meeting";
  document.querySelector("#calendar-date").value = event?.event_date || isoDateLocal(new Date());
  document.querySelector("#calendar-start-time").value = event?.start_time?.slice(0, 5) || "";
  document.querySelector("#calendar-end-time").value = event?.end_time?.slice(0, 5) || "";
  document.querySelector("#calendar-location").value = event?.location || "";
  document.querySelector("#calendar-status").value = event?.status || "scheduled";
  document.querySelector("#calendar-description").value = event?.description || "";
}


function openExactCalendarAction(actionId){
  openActionDetails(actionId);
}

function openCalendarItem(item,dialog){
  if(!item)return;
  if(item.kind==="manual"&&item.editable){
    const event=state.calendarEvents.find(entry=>entry.id===item.sourceId);
    populateCalendarForm(event);
    dialog.showModal();
    return;
  }
  if(item.actionId){
    openExactCalendarAction(item.actionId);
    return;
  }
  if(item.projectId){
    location.hash=`#project/${item.projectId}`;
    route();
  }
}

function bindCalendarEvents() {
  bindCommonEvents();
  document.querySelector("#calendar-prev")?.addEventListener("click", () => {
    state.calendarViewDate = new Date(state.calendarViewDate.getFullYear(), state.calendarViewDate.getMonth() - 1, 1);
    root.innerHTML = calendarTemplate(); bindCalendarEvents();
  });
  document.querySelector("#calendar-next")?.addEventListener("click", () => {
    state.calendarViewDate = new Date(state.calendarViewDate.getFullYear(), state.calendarViewDate.getMonth() + 1, 1);
    root.innerHTML = calendarTemplate(); bindCalendarEvents();
  });
  document.querySelector("#calendar-today")?.addEventListener("click", () => {
    state.calendarViewDate = new Date(); root.innerHTML = calendarTemplate(); bindCalendarEvents();
  });

  const dialog = document.querySelector("#calendar-event-dialog");
  document.querySelector("#add-calendar-event")?.addEventListener("click", () => { populateCalendarForm(); dialog.showModal(); });
  document.querySelectorAll(".edit-calendar-event").forEach((button) => button.addEventListener("click", () => {
    const event = state.calendarEvents.find((item) => item.id === button.dataset.eventId);
    if (!event) return;
    populateCalendarForm(event); dialog.showModal();
  }));
  document.querySelectorAll(".open-calendar-action").forEach((button) => button.addEventListener("click", () => {
    openExactCalendarAction(button.dataset.actionId);
  }));
  document.querySelectorAll(".open-calendar-project").forEach((button) => button.addEventListener("click", () => {
    location.hash=`#project/${button.dataset.projectId}`;
    route();
  }));
  document.querySelectorAll(".calendar-event-chip").forEach((button) => button.addEventListener("click", () => {
    const item = calendarItems().find((entry) => entry.id === button.dataset.calendarItem);
    openCalendarItem(item,dialog);
  }));

  document.querySelector("#calendar-event-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.checkValidity()) { form.reportValidity(); return; }
    const id = document.querySelector("#calendar-event-id").value;
    const payload = {
      title: document.querySelector("#calendar-title").value.trim(),
      project_id: document.querySelector("#calendar-project").value || null,
      event_type: document.querySelector("#calendar-type").value,
      event_date: document.querySelector("#calendar-date").value,
      start_time: document.querySelector("#calendar-start-time").value || null,
      end_time: document.querySelector("#calendar-end-time").value || null,
      location: document.querySelector("#calendar-location").value.trim() || null,
      status: document.querySelector("#calendar-status").value,
      description: document.querySelector("#calendar-description").value.trim() || null,
    };
    const button = document.querySelector("#calendar-save-button");
    const error = document.querySelector("#calendar-error");
    setButtonLoading(button, true, "Saving..."); error.textContent = "";
    try {
      if (id) await updateCalendarEvent(id, payload); else await createCalendarEvent(payload);
      dialog.close(); showToast(id ? "Calendar event updated." : "Calendar event added."); await renderCalendar();
    } catch (err) { error.textContent = err.message; }
    finally { setButtonLoading(button, false); }
  });
}
