function notificationStateFor(key) {
  return state.notificationStates.find((item) => item.notification_key === key) || null;
}

function buildNotifications() {
  const results = [];
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const currentUserId = state.profile?.id;

  state.actionItems.forEach((action) => {
    if (["completed", "cancelled"].includes(action.status)) return;
    const project = state.projects.find((item) => item.id === action.project_id);
    const projectLabel = project?.project_code || project?.project_name || "Project";
    const assignees = actionAssigneesFor(action.id);
    const assignedToMe = assignees.some((item) => item.user_id === currentUserId);

    if (assignedToMe) {
      results.push({
        key: `assigned:${action.id}:${currentUserId}`,
        type: "assigned",
        title: `Action assigned: ${action.title}`,
        message: `${projectLabel}${action.due_date ? ` · Due ${formatDate(action.due_date)}` : ""}`,
        actionId: action.id,
        projectId: action.project_id,
        sortDate: action.updated_at || action.created_at,
      });
    }

    if (action.due_date && (assignedToMe || canVerifyAction(action) || canControlAction(action))) {
      const due = new Date(`${action.due_date}T00:00:00`);
      const days = Math.round((due - today) / 86400000);
      if (days < 0) {
        results.push({
          key: `overdue:${action.id}:${action.due_date}`,
          type: "overdue",
          title: `Overdue action: ${action.title}`,
          message: `${projectLabel} · Due date was ${formatDate(action.due_date)}`,
          actionId: action.id,
          projectId: action.project_id,
          sortDate: action.due_date,
        });
      } else if (days <= 3) {
        results.push({
          key: `due-soon:${action.id}:${action.due_date}`,
          type: "due_soon",
          title: `Action due ${days === 0 ? "today" : `in ${days} day${days === 1 ? "" : "s"}`}: ${action.title}`,
          message: `${projectLabel} · Due ${formatDate(action.due_date)}`,
          actionId: action.id,
          projectId: action.project_id,
          sortDate: action.due_date,
        });
      }
    }
  });

  state.actionProgressUpdates
    .filter((update) => update.verification_status === "pending")
    .forEach((update) => {
      const action = state.actionItems.find((item) => item.id === update.action_id);
      if (!action || !canVerifyAction(action)) return;
      results.push({
        key: `verification:${update.id}`,
        type: "verification",
        title: `Progress verification pending: ${action.title}`,
        message: `${actionUserName(update.submitted_by)} claimed ${update.claimed_progress_percent}% progress.`,
        actionId: action.id,
        projectId: action.project_id,
        sortDate: update.submitted_at,
      });
    });

  return results
    .map((item) => ({ ...item, state: notificationStateFor(item.key) }))
    .filter((item) => !item.state?.dismissed_at)
    .sort((a, b) => String(b.sortDate || "").localeCompare(String(a.sortDate || "")));
}

function unreadNotificationCount() {
  return (state.notifications || []).filter((item) => !item.state?.read_at && !item.state?.dismissed_at).length;
}

function notificationTypeLabel(type) {
  return ({ assigned: "Assigned action", overdue: "Overdue", due_soon: "Due soon", verification: "Verification" })[type] || type;
}

function notificationIcon(type) {
  return type === "verification" ? "check" : type === "overdue" ? "bell" : type === "due_soon" ? "calendar" : "clipboard";
}

function notificationsTemplate() {
  const unread = unreadNotificationCount();
  return `<div class="app-shell">${appHeader()}${sidebar("")}
    <main class="main-content notification-page">
      <div class="breadcrumb"><span>Dashboard</span><b>/</b>Notifications</div>
      <div class="admin-heading"><div><h1>Notifications and Reminders</h1><p>Assigned actions, due dates, overdue items and progress awaiting verification.</p></div>${unread ? `<button class="btn secondary" id="mark-all-notifications-read">Mark all read</button>` : ""}</div>
      <section class="action-summary-grid">
        <div class="admin-metric"><span>Unread</span><strong>${unread}</strong></div>
        <div class="admin-metric"><span>Total active alerts</span><strong>${state.notifications.length}</strong></div>
        <div class="admin-metric"><span>Overdue alerts</span><strong>${state.notifications.filter((n)=>n.type==="overdue").length}</strong></div>
        <div class="admin-metric"><span>Verification alerts</span><strong>${state.notifications.filter((n)=>n.type==="verification").length}</strong></div>
      </section>
      <section class="admin-card"><div class="admin-card-heading"><div><h2>Notification centre</h2><p>Dismissed alerts remain hidden unless the underlying condition changes.</p></div></div>
        <div style="padding:18px 20px;">
          ${state.notifications.length ? `<div class="notification-list">${state.notifications.map((item) => `<article class="notification-item ${item.state?.read_at ? "" : "unread"}">
            <div class="notification-icon ${item.type}">${icon(notificationIcon(item.type))}</div>
            <div><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.message)}</p><small>${escapeHtml(notificationTypeLabel(item.type))}</small></div>
            <div class="notification-actions">
              ${!item.state?.read_at ? `<button class="btn secondary notification-read-button" data-key="${escapeHtml(item.key)}">Mark read</button>` : ""}
              <button class="btn primary notification-open-button" data-action-id="${item.actionId}" data-project-id="${item.projectId}">Open exact action</button>
              <button class="btn secondary notification-dismiss-button" data-key="${escapeHtml(item.key)}">Dismiss</button>
            </div>
          </article>`).join("")}</div>` : `<div class="empty-state">${icon("bell",42)}<h3>No active notifications</h3><p>You are up to date.</p></div>`}
        </div>
      </section>
    </main></div>`;
}

async function renderNotifications() {
  root.innerHTML = `<div class="loading-screen"><span class="spinner dark"></span><p>Loading notifications...</p></div>`;
  try {
    await loadActionData();
    state.notificationStates = await getNotificationStates();
    state.notifications = buildNotifications();
    root.innerHTML = notificationsTemplate();
    bindNotificationEvents();
  } catch (error) {
    root.innerHTML = `<div class="loading-screen"><p>${escapeHtml(error.message)}</p></div>`;
  }
}

function bindNotificationEvents() {
  bindCommonEvents();
  document.querySelectorAll(".notification-read-button").forEach((button) => button.addEventListener("click", async () => {
    setButtonLoading(button, true, "Saving...");
    try { await saveNotificationState(button.dataset.key, { read_at: new Date().toISOString(), dismissed_at: null }); await renderNotifications(); }
    catch (error) { showToast(error.message, "error"); }
  }));
  document.querySelectorAll(".notification-dismiss-button").forEach((button) => button.addEventListener("click", async () => {
    setButtonLoading(button, true, "Saving...");
    try { await saveNotificationState(button.dataset.key, { read_at: new Date().toISOString(), dismissed_at: new Date().toISOString() }); await renderNotifications(); }
    catch (error) { showToast(error.message, "error"); }
  }));
  document.querySelectorAll(".notification-open-button").forEach((button) => button.addEventListener("click", async () => {
    const actionId = button.dataset.actionId;
    await saveNotificationState(
      state.notifications.find((item) => item.actionId === actionId)?.key || `opened:${actionId}`,
      { read_at: new Date().toISOString(), dismissed_at: null }
    ).catch(() => {});
    openActionDetails(actionId);
  }));
  document.querySelector("#mark-all-notifications-read")?.addEventListener("click", async (event) => {
    const button = event.currentTarget;
    setButtonLoading(button, true, "Saving...");
    try {
      for (const item of state.notifications.filter((n) => !n.state?.read_at)) {
        await saveNotificationState(item.key, { read_at: new Date().toISOString(), dismissed_at: null });
      }
      await renderNotifications();
    } catch (error) { showToast(error.message, "error"); }
    finally { setButtonLoading(button, false); }
  });
}
