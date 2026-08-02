function actionStatusLabel(status) {
  return ({ open: "Open", in_progress: "In Progress", awaiting_response: "Awaiting Response", completed: "Completed", cancelled: "Cancelled" })[status] || status || "Open";
}

const ACTION_STATUSES = [
  ["open", "Open"], ["in_progress", "In Progress"], ["awaiting_response", "Awaiting Response"],
  ["completed", "Completed"], ["cancelled", "Cancelled"],
];

const ACTION_PRIORITIES = [
  ["normal", "Normal"], ["low", "Low"], ["high", "High"], ["urgent", "Urgent"],
];

function actionUserName(userId) {
  const user = state.assignableUsers.find((item) => item.id === userId);
  return user?.full_name || "Unknown user";
}

function actionAssigneesFor(actionId) {
  return state.actionAssignees.filter((item) => item.action_id === actionId && item.is_active);
}

function actionUpdatesFor(actionId) {
  return state.actionProgressUpdates.filter((item) => item.action_id === actionId);
}

function jurisdictionUsersForProject(projectId) {
  const eligibleIds = new Set(state.projectJurisdictions
    .filter((item) => item.project_id === projectId && item.is_active && item.can_receive_actions)
    .map((item) => item.user_id));
  return state.assignableUsers.filter((user) => eligibleIds.has(user.id));
}

function actionTimingClass(item) {
  if (item.status === "completed") return "completed";
  if (!item.due_date) return "";
  const today = new Date(); today.setHours(0,0,0,0);
  const due = new Date(`${item.due_date}T00:00:00`);
  const days = Math.round((due - today) / 86400000);
  if (days < 0) return "overdue";
  if (days <= 3) return "due-soon";
  return "";
}

function canControlAction(item) {
  return state.profile?.role === "admin" || item.assigned_by === state.profile?.id || item.created_by === state.profile?.id;
}

function canSubmitProgress(item) {
  return actionAssigneesFor(item.id).some((assignment) => assignment.user_id === state.profile?.id);
}


const OFFICE_ACTION_TYPES = [
  ["execute_work","Execute work"],
  ["examine_report","Examine and report"],
  ["prepare_draft","Prepare draft reply"],
  ["financial_scrutiny","Financial scrutiny"],
  ["audit_scrutiny","Audit scrutiny"],
  ["submit_comments","Submit comments"],
  ["forward_subordinate","Forward to subordinate office"],
  ["submit_higher","Submit to higher office"],
  ["seek_clarification","Seek clarification"],
  ["compliance_report","Compliance report"],
  ["record_close","Record and close"],
];

const WORKFLOW_STAGES = [
  ["received","Received"],["under_examination","Under examination"],["draft_prepared","Draft prepared"],
  ["pending_approval","Pending approval"],["approved","Approved"],["forwarded","Forwarded"],
  ["awaiting_response","Awaiting subordinate response"],["response_received","Response received"],
  ["verified","Verified"],["closed","Closed"]
];

function officeActionTypeLabel(value){ return OFFICE_ACTION_TYPES.find(([key])=>key===value)?.[1] || value || "Execute work"; }
function workflowStageLabel(value){ return WORKFLOW_STAGES.find(([key])=>key===value)?.[1] || value || "Received"; }
function workflowEventsFor(actionId){ return state.actionWorkflowEvents.filter((event)=>event.action_id===actionId); }
function isPAUser(){ const d=(state.profile?.designation||"").toLowerCase(); return d.includes("personal assistant") || d.includes("(pa)"); }
function isInternalProcessor(){ const d=(state.profile?.designation||"").toLowerCase(); return d.includes("project officer") || d.includes("auditor") || d.includes("accountant") || isPAUser(); }
function canProcessOfficeAction(item){ return canControlAction(item) || canSubmitProgress(item) || isInternalProcessor(); }
function canForwardDownward(item){ return canControlAction(item) || (isPAUser() && item.approved_for_forwarding && item.movement_direction === "downward"); }
function canSubmitUpward(item){ return canControlAction(item) || state.profile?.id === item.competent_authority_id; }

function workflowHistory(item){
  const events=workflowEventsFor(item.id);
  if(!events.length) return "";
  return `<div class="workflow-history">${events.map((event)=>`<div class="workflow-event"><strong>${escapeHtml(actionUserName(event.performed_by))}</strong> · ${escapeHtml(event.event_type.replaceAll("_"," "))}${event.to_stage?` → ${escapeHtml(workflowStageLabel(event.to_stage))}`:""}${event.on_behalf_of?` · On behalf of ${escapeHtml(actionUserName(event.on_behalf_of))}`:""}${event.remarks?`<div>${escapeHtml(event.remarks)}</div>`:""}${event.draft_text?`<div><strong>${event.event_type === "action_updated" ? "Changes" : "Draft/Report"}:</strong> ${escapeHtml(event.draft_text).replaceAll("\n", "<br>")}</div>`:""}<small>${formatDateTime(event.created_at)}</small></div>`).join("")}</div>`;
}

function currentClaimedProgress(item) {
  const latest = actionUpdatesFor(item.id)[0];
  if (!latest) return Number(item.progress_percent ?? item.verified_progress_percent ?? 0);
  const claimedEdit = workflowEventsFor(item.id).find((event) =>
    event.event_type === "action_updated" && event.draft_text?.includes("Claimed progress:")
  );
  const actionUpdatedAt = new Date(claimedEdit?.created_at || 0).getTime();
  const progressSubmittedAt = new Date(latest.submitted_at || 0).getTime();
  return actionUpdatedAt > progressSubmittedAt
    ? Number(item.progress_percent ?? 0)
    : Number(latest.claimed_progress_percent ?? 0);
}

function canVerifyAction(item) {
  return state.profile?.role === "admin" || item.verifier_id === state.profile?.id || item.assigned_by === state.profile?.id || item.created_by === state.profile?.id;
}

function progressHistory(item) {
  const updates = actionUpdatesFor(item.id);
  if (!updates.length) return "";
  return `<div class="progress-history">${updates.map((update) => `<div class="progress-update ${update.verification_status}">
    <h4>${escapeHtml(actionUserName(update.submitted_by))} claimed ${update.claimed_progress_percent}% · ${escapeHtml(update.verification_status)}</h4>
    <p><strong>Work done:</strong> ${escapeHtml(update.work_done)}</p>
    ${update.remaining_work ? `<p><strong>Remaining:</strong> ${escapeHtml(update.remaining_work)}</p>` : ""}
    ${update.delay_reason ? `<p><strong>Delay/reason:</strong> ${escapeHtml(update.delay_reason)}</p>` : ""}
    ${update.verification_remarks ? `<p><strong>Verification:</strong> ${escapeHtml(update.verification_remarks)}</p>` : ""}
    ${update.verification_status === "pending" && canVerifyAction(item) ? `<div class="progress-update-actions"><button class="btn secondary verify-progress-button" data-update-id="${update.id}" data-action-id="${item.id}">Review update</button></div>` : ""}
  </div>`).join("")}</div>`;
}

function actionList(items, showProject = true) {
  if (!items.length) return `<div class="empty-state">${icon("clipboard",42)}<h3>No actions recorded</h3><p>Create the first action item and assign responsibility.</p></div>`;
  return `<div class="action-list">${items.map((item) => {
    const project = state.projects.find((p) => p.id === item.project_id);
    const correspondence = state.correspondence.find((c) => c.id === item.correspondence_id);
    const assignees = actionAssigneesFor(item.id);
    const assigneeText = assignees.length ? assignees.map((a) => `${a.responsibility_type === "lead" ? "Lead" : "Supporting"}: ${actionUserName(a.user_id)}`).join(" · ") : "Unassigned";
    return `<article class="action-item ${actionTimingClass(item)}" data-action-record-id="${item.id}">
      <div>
        <div class="action-topline">
          <span class="priority-pill ${item.priority || "normal"}">${item.priority || "normal"}</span>
          <span class="action-status ${item.status || "open"}">${actionStatusLabel(item.status)}</span>
          <span class="workflow-stage">${escapeHtml(workflowStageLabel(item.workflow_stage))}</span>
          <span class="workflow-direction ${item.movement_direction || "internal"}">${escapeHtml(item.movement_direction || "internal")}</span>
          ${showProject && project ? `<span class="status-pill approved">${escapeHtml(project.project_code || project.project_name)}</span>` : ""}
          ${correspondence ? `<span class="status-pill pending">Letter: ${escapeHtml(correspondence.letter_number || correspondence.subject || "Linked")}</span>` : ""}
        </div>
        <h3>${escapeHtml(item.title)}</h3>
        <div class="action-meta"><span>${escapeHtml(assigneeText)}</span>${item.verifier_id ? `<span>Verifier: ${escapeHtml(actionUserName(item.verifier_id))}</span>` : ""}${item.due_date ? `<span>Due: ${formatDate(item.due_date)}</span>` : `<span>No due date</span>`}</div>
        ${item.description ? `<p class="action-description">${escapeHtml(item.description)}</p>` : ""}
        <p class="action-description"><strong>Processing type:</strong> ${escapeHtml(officeActionTypeLabel(item.action_type))}${item.competent_authority_id ? ` · <strong>Competent authority:</strong> ${escapeHtml(actionUserName(item.competent_authority_id))}` : ""}</p>
        <div class="progress-track" aria-label="${Number(item.verified_progress_percent || 0)} percent verified"><span style="width:${Number(item.verified_progress_percent || 0)}%"></span></div>
        ${progressHistory(item)}
        ${workflowHistory(item)}
      </div>
      <div class="action-side">
        <strong>Claimed: ${currentClaimedProgress(item)}% | Verified: ${Number(item.verified_progress_percent || 0)}%</strong>
        <span>Only verified progress is treated as official.</span>
        <button class="btn secondary view-action-details" type="button" data-action-id="${item.id}" aria-label="View details for ${escapeHtml(item.title)}">View details</button>
        ${canControlAction(item) ? `<button class="btn secondary edit-action-button" data-action-id="${item.id}">Edit instruction</button>` : ""}
        ${canSubmitProgress(item) ? `<button class="btn primary submit-progress-button" data-action-id="${item.id}">Submit progress</button>` : ""}
        ${canProcessOfficeAction(item) ? `<button class="btn secondary process-office-action-button" data-action-id="${item.id}">Process / Forward</button>` : ""}
      </div>
    </article>`;
  }).join("")}</div>`;
}

function actionDialog(projectId = "") {
  return `<dialog id="action-dialog" class="modal"><form id="action-form" class="modal-card" novalidate>
    <div class="modal-heading"><div><p class="eyebrow">Action Instruction</p><h2 id="action-dialog-title">Issue action</h2><p>Only the issuer or administrator can change instruction, priority, dates and assignment.</p></div><button class="icon-button" type="button" data-dialog-close>${icon("close")}</button></div>
    <input id="action-id" type="hidden" />
    <div class="form-grid">
      <label>Project *<select id="action-project" required>${state.projects.map((p)=>`<option value="${p.id}" ${projectId===p.id?"selected":""}>${escapeHtml(p.project_name)}</option>`).join("")}</select></label>
      <label>Linked correspondence<select id="action-correspondence"><option value="">None</option>${state.correspondence.map((c)=>`<option value="${c.id}">${escapeHtml(c.letter_number || "No number")} — ${escapeHtml(c.subject || "Letter")}</option>`).join("")}</select></label>
      <label class="wide">Action title *<input id="action-title" required placeholder="Short action instruction" /></label>
      <label class="wide">Detailed instruction<textarea id="action-description" rows="3" placeholder="Exact work to be completed"></textarea></label>
      <label>Priority<select id="action-priority"><option value="normal">Normal</option><option value="low">Low</option><option value="high">High</option><option value="urgent">Urgent</option></select></label>
      <label>Status<select id="action-status"><option value="open">Open</option><option value="in_progress">In Progress</option><option value="awaiting_response">Awaiting Response</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select></label>
      <label>Due date<input id="action-due-date" type="date" /></label>
      <label>Reminder date<input id="action-reminder-date" type="date" /></label>
      <label>Responsibility mode<select id="action-mode"><option value="joint">Joint responsibility</option><option value="separate">Separate responsibilities</option></select></label>
      <label>Action / processing type<select id="action-type">${OFFICE_ACTION_TYPES.map(([value,label])=>`<option value="${value}">${label}</option>`).join("")}</select></label>
      <label>Movement direction<select id="action-direction"><option value="internal">Internal processing</option><option value="downward">Downward to subordinate office</option><option value="upward">Upward to higher office</option></select></label>
      <label>Competent authority<select id="action-authority"><option value="">Issuer / not specified</option>${state.assignableUsers.map((u)=>`<option value="${u.id}">${escapeHtml(u.full_name)} — ${escapeHtml(u.designation || "User")}</option>`).join("")}</select></label>
      <label>Verifying officer<select id="action-verifier"><option value="">Issuer will verify</option>${state.assignableUsers.map((u)=>`<option value="${u.id}">${escapeHtml(u.full_name)} — ${escapeHtml(u.designation || "User")}</option>`).join("")}</select></label>
      <label class="wide">Assign officers within project jurisdiction<div id="action-assignee-picker" class="assignee-picker"></div><span class="field-help">Only users having active jurisdiction for the selected project are shown. Select one lead officer and any supporting officers.</span></label>
      <label class="wide">Issuer note<textarea id="action-issuer-note" rows="2" placeholder="Optional administrative note"></textarea></label>
    </div>
    <p id="action-error" class="form-error"></p>
    <div class="modal-actions"><button class="btn secondary" type="button" data-dialog-close>Cancel</button><button class="btn primary" id="action-save-button" type="submit">Save instruction</button></div>
  </form></dialog>`;
}


function actionUpdateDialog(item) {
  return `<dialog id="action-update-dialog" class="modal"><form id="action-update-form" class="modal-card" novalidate>
    <div class="modal-heading"><div><p class="eyebrow">Action Detail</p><h2>Update Action</h2><p>Review the existing values and save only the fields that need to change.</p></div><button class="icon-button" type="button" data-dialog-close aria-label="Close update action dialog">${icon("close")}</button></div>
    <div class="form-grid">
      <label class="wide">Action title *<input id="action-update-title" required value="${escapeHtml(item.title || "")}" /></label>
      <label class="wide">Description<textarea id="action-update-description" rows="3">${escapeHtml(item.description || "")}</textarea></label>
      <label>Status *<select id="action-update-status" required>${ACTION_STATUSES.map(([value,label])=>`<option value="${value}" ${item.status===value?"selected":""}>${label}</option>`).join("")}</select></label>
      <label>Priority *<select id="action-update-priority" required>${ACTION_PRIORITIES.map(([value,label])=>`<option value="${value}" ${item.priority===value?"selected":""}>${label}</option>`).join("")}</select></label>
      <label>Due date<input id="action-update-due-date" type="date" value="${escapeHtml(item.due_date || "")}" /></label>
      <label>Claimed progress (%)<input id="action-update-claimed" type="number" min="0" max="100" step="1" required value="${currentClaimedProgress(item)}" aria-describedby="action-update-progress-help" /></label>
      <label>Verified progress (%)<input id="action-update-verified" type="number" min="0" max="100" step="1" required value="${Number(item.verified_progress_percent ?? 0)}" aria-describedby="action-update-progress-help" /></label>
      <label class="wide">Remarks<textarea id="action-update-remarks" rows="3" placeholder="Administrative remarks">${escapeHtml(item.issuer_note || "")}</textarea></label>
    </div>
    <p id="action-update-progress-help" class="field-help">Claimed progress records the reported position. Verified progress remains the official position.</p>
    <p id="action-update-error" class="form-error" role="alert"></p>
    <div class="modal-actions"><button class="btn secondary" type="button" data-dialog-close>Cancel</button><button class="btn primary" id="action-update-save" type="submit">Save changes</button></div>
  </form></dialog>`;
}

function validActionDate(value) {
  if (!value) return true;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function actionUpdateChanges(item, values) {
  const fields = [
    ["title", "Action title", item.title || "", values.title],
    ["description", "Description", item.description || null, values.description],
    ["status", "Status", item.status || "open", values.status],
    ["priority", "Priority", item.priority || "normal", values.priority],
    ["due_date", "Due date", item.due_date || null, values.due_date],
    ["progress_percent", "Claimed progress", currentClaimedProgress(item), values.progress_percent],
    ["verified_progress_percent", "Verified progress", Number(item.verified_progress_percent ?? 0), values.verified_progress_percent],
    ["issuer_note", "Remarks", item.issuer_note || null, values.issuer_note],
  ];
  return fields.filter(([, , before, after]) => before !== after).map(([key,label,before,after]) => ({ key, label, before, after }));
}

function actionHistoryValue(change, value) {
  if (value === null || value === "") return "Not set";
  if (change.key === "status") return actionStatusLabel(value);
  if (change.key === "priority") return ACTION_PRIORITIES.find(([key])=>key===value)?.[1] || value;
  if (change.key === "due_date") return formatDate(value);
  if (change.key.endsWith("progress_percent")) return `${value}%`;
  return String(value);
}

function officeProcessDialog(){
  return `<dialog id="office-process-dialog" class="modal compact-modal"><form id="office-process-form" class="modal-card" novalidate>
    <div class="modal-heading"><div><p class="eyebrow">Office Processing</p><h2>Process, approve or forward action</h2><p>PA may execute an approved downward forwarding, but upward submission requires the competent EE/SE/CE.</p></div><button class="icon-button" type="button" data-dialog-close>${icon("close")}</button></div>
    <input id="office-process-action-id" type="hidden" />
    <div class="form-grid single">
      <label>Processing outcome<select id="office-process-event"><option value="examination_started">Start examination</option><option value="report_submitted">Submit report / scrutiny note</option><option value="draft_prepared">Prepare draft for approval</option><option value="approval_requested">Send draft for approval</option><option value="approved">Approve draft / forwarding</option><option value="forwarded_downward">Forward to subordinate office</option><option value="submitted_upward">Submit to higher office</option><option value="response_received">Record subordinate response</option><option value="closed">Close action</option></select></label>
      <label>Next workflow stage<select id="office-process-stage">${WORKFLOW_STAGES.map(([value,label])=>`<option value="${value}">${label}</option>`).join("")}</select></label>
      <label>Forward/issue on behalf of<select id="office-process-on-behalf"><option value="">Not applicable</option>${state.assignableUsers.map((u)=>`<option value="${u.id}">${escapeHtml(u.full_name)} — ${escapeHtml(u.designation || "User")}</option>`).join("")}</select></label>
      <label>Report / draft text<textarea id="office-process-draft" rows="5" placeholder="Report, scrutiny comments, draft forwarding letter or draft reply"></textarea></label>
      <label>Remarks *<textarea id="office-process-remarks" rows="3" required></textarea></label>
      <label style="display:flex;grid-template-columns:auto 1fr;gap:9px;align-items:center;"><input id="office-process-authorize-pa" type="checkbox" style="width:auto;"/>Approve downward forwarding and authorize concerned PA</label>
    </div><p id="office-process-error" class="form-error"></p>
    <div class="modal-actions"><button class="btn secondary" type="button" data-dialog-close>Cancel</button><button class="btn primary" id="office-process-save" type="submit">Save processing</button></div>
  </form></dialog>`;
}

function progressDialog() {
  return `<dialog id="progress-dialog" class="modal compact-modal"><form id="progress-form" class="modal-card" novalidate>
    <div class="modal-heading"><div><p class="eyebrow">Progress Submission</p><h2>Submit progress for verification</h2><p>The verified progress will not change until the senior officer approves this update.</p></div><button class="icon-button" type="button" data-dialog-close>${icon("close")}</button></div>
    <input id="progress-action-id" type="hidden" />
    <div class="form-grid single">
      <label>Progress claimed (%) *<input id="progress-claimed" type="number" min="0" max="100" step="5" required /></label>
      <label>Work completed to reach this progress *<textarea id="progress-work-done" rows="4" required placeholder="Explain what work has actually been completed"></textarea></label>
      <label>Remaining work<textarea id="progress-remaining" rows="3"></textarea></label>
      <label>Reason for delay/difficulty<textarea id="progress-delay" rows="3"></textarea></label>
    </div><p id="progress-error" class="form-error"></p>
    <div class="modal-actions"><button class="btn secondary" type="button" data-dialog-close>Cancel</button><button class="btn primary" id="progress-submit-button" type="submit">Submit for verification</button></div>
  </form></dialog>`;
}

function verificationDialog() {
  return `<dialog id="verification-dialog" class="modal compact-modal"><form id="verification-form" class="modal-card" novalidate>
    <div class="modal-heading"><div><p class="eyebrow">Senior Verification</p><h2>Review progress update</h2><p>Approve, revise, return or reject the claimed progress.</p></div><button class="icon-button" type="button" data-dialog-close>${icon("close")}</button></div>
    <input id="verification-update-id" type="hidden" /><input id="verification-action-id" type="hidden" />
    <div class="form-grid single">
      <label>Decision<select id="verification-status"><option value="approved">Approve</option><option value="returned">Return for clarification</option><option value="rejected">Reject</option></select></label>
      <label>Verified progress (%)<input id="verification-percent" type="number" min="0" max="100" step="5" /></label>
      <label>Verification remarks *<textarea id="verification-remarks" rows="4" required></textarea></label>
    </div><p id="verification-error" class="form-error"></p>
    <div class="modal-actions"><button class="btn secondary" type="button" data-dialog-close>Cancel</button><button class="btn primary" id="verification-save-button" type="submit">Save verification</button></div>
  </form></dialog>`;
}

function pendingVerificationActionIds() {
  return new Set(state.actionProgressUpdates
    .filter((update) => update.verification_status === "pending")
    .map((update) => String(update.action_id)));
}

function actionIsOpen(item) {
  return !["completed", "cancelled"].includes(item.status);
}

function actionIsOverdue(item, today = null) {
  if (!item.due_date || !actionIsOpen(item)) return false;
  const currentDay = today || new Date();
  currentDay.setHours(0, 0, 0, 0);
  return new Date(`${item.due_date}T00:00:00`) < currentDay;
}

function actionMatchesDueDate(item, category) {
  if (category === "all") return true;
  if (!actionIsOpen(item)) return false;
  if (category === "no_due_date") return !item.due_date;
  if (!item.due_date) return false;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const due = new Date(`${item.due_date}T00:00:00`);
  if (category === "overdue") return actionIsOverdue(item, today);
  if (category === "today") return due.getTime() === today.getTime();
  if (category === "next_7_days") {
    const end = new Date(today); end.setDate(end.getDate() + 7);
    return due > today && due <= end;
  }
  if (category === "more_than_7_days") {
    const end = new Date(today); end.setDate(end.getDate() + 7);
    return due > end;
  }
  return true;
}

function filteredActionItems() {
  const filters = state.actionFilters;
  const pendingIds = pendingVerificationActionIds();
  const query = filters.query.trim().toLowerCase();
  return state.actionItems.filter((item) => {
    if (filters.quickView === "open" && !actionIsOpen(item)) return false;
    if (filters.quickView === "overdue" && !actionIsOverdue(item)) return false;
    if (filters.quickView === "pending_verification" && !pendingIds.has(String(item.id))) return false;
    if (filters.quickView === "completed" && item.status !== "completed") return false;
    if (filters.project !== "all" && String(item.project_id) !== filters.project) return false;
    if (filters.status !== "all" && item.status !== filters.status) return false;
    if (filters.priority !== "all" && (item.priority || "normal") !== filters.priority) return false;
    if (filters.workflowStage !== "all" && (item.workflow_stage || "received") !== filters.workflowStage) return false;
    if (filters.assignee !== "all" && !actionAssigneesFor(item.id).some((assignment) => String(assignment.user_id) === filters.assignee)) return false;
    if (!actionMatchesDueDate(item, filters.dueDate)) return false;
    if (query) {
      const project = state.projects.find((record) => String(record.id) === String(item.project_id));
      const assigneeNames = actionAssigneesFor(item.id).map((assignment) => actionUserName(assignment.user_id));
      const searchable = [
        item.title, item.description, item.issuer_note, item.office_processing_note,
        item.priority, actionStatusLabel(item.status), workflowStageLabel(item.workflow_stage),
        project?.project_code, project?.project_name, ...assigneeNames,
      ].map((value) => String(value || "").toLowerCase());
      if (!searchable.some((value) => value.includes(query))) return false;
    }
    return true;
  });
}

function actionSummary(items) {
  const pendingIds = pendingVerificationActionIds();
  return {
    all: items.length,
    open: items.filter(actionIsOpen).length,
    overdue: items.filter((item) => actionIsOverdue(item)).length,
    pending: items.filter((item) => pendingIds.has(String(item.id))).length,
    completed: items.filter((item) => item.status === "completed").length,
  };
}

function actionQuickViewsTemplate(summary) {
  const views = [
    ["all", "All Actions", summary.all],
    ["open", "Open", summary.open],
    ["overdue", "Overdue", summary.overdue],
    ["pending_verification", "Pending Verification", summary.pending],
    ["completed", "Completed", summary.completed],
  ];
  return `<div class="action-quick-views" role="group" aria-label="Action register quick views">${views.map(([value,label,count]) => `<button class="action-quick-view ${state.actionFilters.quickView===value?"active":""}" type="button" data-action-quick-view="${value}" aria-pressed="${state.actionFilters.quickView===value}"><span>${label}</span><strong>${count}</strong></button>`).join("")}</div>`;
}

function actionFiltersTemplate() {
  const filters = state.actionFilters;
  return `<div class="action-filter-panel">
    ${actionQuickViewsTemplate(actionSummary(state.actionItems))}
    <div class="action-filters">
      <label class="action-filter-search"><span>Search</span><input id="action-filter-search" value="${escapeHtml(filters.query)}" placeholder="Search actions, projects or assignees..." /></label>
      <label><span>Project</span><select id="action-filter-project"><option value="all">All projects</option>${state.projects.map((project) => `<option value="${project.id}" ${filters.project===String(project.id)?"selected":""}>${escapeHtml(project.project_code || project.project_name)}</option>`).join("")}</select></label>
      <label><span>Status</span><select id="action-filter-status"><option value="all">All statuses</option>${[["open","Open"],["in_progress","In Progress"],["awaiting_response","Awaiting Response"],["completed","Completed"],["cancelled","Cancelled"]].map(([value,label]) => `<option value="${value}" ${filters.status===value?"selected":""}>${label}</option>`).join("")}</select></label>
      <label><span>Priority</span><select id="action-filter-priority"><option value="all">All priorities</option>${[["urgent","Urgent"],["high","High"],["normal","Normal"],["low","Low"]].map(([value,label]) => `<option value="${value}" ${filters.priority===value?"selected":""}>${label}</option>`).join("")}</select></label>
      <label><span>Assignee</span><select id="action-filter-assignee"><option value="all">All assignees</option>${state.assignableUsers.map((user) => `<option value="${user.id}" ${filters.assignee===String(user.id)?"selected":""}>${escapeHtml(user.full_name)}</option>`).join("")}</select></label>
      <label><span>Workflow stage</span><select id="action-filter-workflow"><option value="all">All workflow stages</option>${WORKFLOW_STAGES.map(([value,label]) => `<option value="${value}" ${filters.workflowStage===value?"selected":""}>${escapeHtml(label)}</option>`).join("")}</select></label>
      <label><span>Due date</span><select id="action-filter-due"><option value="all">All due dates</option>${[["overdue","Overdue"],["today","Due today"],["next_7_days","Due in next 7 days"],["more_than_7_days","More than 7 days"],["no_due_date","No due date"]].map(([value,label]) => `<option value="${value}" ${filters.dueDate===value?"selected":""}>${label}</option>`).join("")}</select></label>
    </div>
    <div class="action-filter-actions"><span id="action-filter-summary"></span><button class="btn reset" id="reset-action-filters" type="button">${icon("reset",18)}Reset</button></div>
  </div>`;
}

function actionRegisterResultsTemplate(items = filteredActionItems()) {
  const total = state.actionItems.length;
  const content = items.length ? actionList(items, true) : total
    ? `<div class="empty-state action-filter-empty">${icon("search",42)}<h3>No actions match these filters</h3><p>Adjust the filters or use Reset to show the full register.</p></div>`
    : actionList(items, true);
  return content;
}

function openActionRegisterView(quickView = "all") {
  const allowed = new Set(["all", "open", "overdue", "pending_verification", "completed"]);
  state.actionFilters = { ...DEFAULT_ACTION_FILTERS, quickView: allowed.has(quickView) ? quickView : "all" };
  if (location.hash === "#actions") {
    renderActionPage();
    return;
  }
  location.hash = "#actions";
}

function actionPageTemplate() {
  const canCreate = ["admin","editor"].includes(state.profile?.role);
  return `<div class="app-shell">${appHeader()}${sidebar("actions")}<main class="main-content action-page">
    <div class="breadcrumb"><span>Dashboard</span><b>/</b>Action Tracking</div>
    <div class="admin-heading"><div><h1>Action Tracking</h1><p>Instruction, execution, progress submission and senior verification.</p></div>${canCreate?`<button class="btn primary" id="add-action-button">${icon("plus")}Issue action</button>`:""}</div>
    <section class="admin-card"><div class="admin-card-heading"><div><h2>Action register</h2><p>Filter the actions currently available to you.</p></div></div><div style="padding:18px 20px;">${actionFiltersTemplate()}<div id="action-register-results">${actionRegisterResultsTemplate()}</div></div></section>
    ${actionDialog("")}${officeProcessDialog()}${progressDialog()}${verificationDialog()}
  </main></div>`;
}

function openActionDetails(actionId) {
  const id = String(actionId || "").trim();
  if (!id) {
    location.hash = "#actions";
    return;
  }
  const target = `#action/${encodeURIComponent(id)}`;
  if (location.hash === target) {
    renderActionDetail(id);
    return;
  }
  location.hash = target;
}

function actionDetailNotFoundTemplate() {
  return `<div class="app-shell">${appHeader()}${sidebar("actions")}<main class="main-content action-detail-page">
    <div class="breadcrumb"><span>Dashboard</span><b>/</b><span>Action Tracking</span><b>/</b>Action not found</div>
    <section class="admin-card action-detail-empty">
      ${icon("clipboard",48)}
      <h1>Action not found</h1>
      <p>The requested action is unavailable, no longer exists, or is outside your current access.</p>
      <button class="btn primary" id="action-not-found-back" type="button">Return to Action Tracking</button>
    </section>
  </main></div>`;
}

function actionDetailTemplate(item) {
  const project = state.projects.find((record) => record.id === item.project_id);
  const correspondence = state.correspondence.find((record) => record.id === item.correspondence_id);
  const assignees = actionAssigneesFor(item.id);
  const updates = actionUpdatesFor(item.id);
  const claimedProgress = currentClaimedProgress(item);
  const verifiedProgress = Number(item.verified_progress_percent || 0);
  const projectLabel = project?.project_code || project?.project_name || "Project unavailable";
  const canEdit = canControlAction(item);
  const canSubmit = canSubmitProgress(item);
  const canProcess = canProcessOfficeAction(item);
  return `<div class="app-shell">${appHeader()}${sidebar("actions")}<main class="main-content action-detail-page">
    <div class="breadcrumb"><span>Dashboard</span><b>/</b><span>Action Tracking</span><b>/</b>${escapeHtml(item.title)}</div>
    <section class="action-detail-header">
      <button class="back-link" id="action-detail-back" type="button">${icon("back",16)}Back to Action Tracking</button>
      <div class="action-topline">
        <span class="priority-pill ${item.priority || "normal"}">${escapeHtml(item.priority || "normal")}</span>
        <span class="action-status ${item.status || "open"}">${escapeHtml(actionStatusLabel(item.status))}</span>
        <span class="workflow-stage">${escapeHtml(workflowStageLabel(item.workflow_stage))}</span>
        <span class="workflow-direction ${item.movement_direction || "internal"}">${escapeHtml(item.movement_direction || "internal")}</span>
      </div>
      <div class="action-detail-title-row">
        <div><h1>${escapeHtml(item.title)}</h1><p>${escapeHtml(item.description || "No detailed instruction has been recorded.")}</p></div>
        <div class="action-detail-actions">
          ${canEdit ? `<button class="btn secondary update-action-button" type="button" data-action-id="${item.id}">Edit Action</button>` : ""}
          ${canSubmit ? `<button class="btn primary submit-progress-button" type="button" data-action-id="${item.id}">Submit progress</button>` : ""}
          ${canProcess ? `<button class="btn secondary process-office-action-button" type="button" data-action-id="${item.id}">Process / Forward</button>` : ""}
        </div>
      </div>
    </section>
    <section class="action-detail-stats">
      <div class="action-detail-stat"><span>Project</span><strong>${escapeHtml(projectLabel)}</strong><small>${escapeHtml(project?.project_name || "Project record unavailable")}</small></div>
      <div class="action-detail-stat"><span>Due date</span><strong>${item.due_date ? formatDate(item.due_date) : "Not set"}</strong><small>${item.reminder_date ? `Reminder ${formatDate(item.reminder_date)}` : "No reminder date"}</small></div>
      <div class="action-detail-stat"><span>Claimed progress</span><strong>${claimedProgress}%</strong><small>${updates.length} submitted update${updates.length === 1 ? "" : "s"}</small></div>
      <div class="action-detail-stat"><span>Verified progress</span><strong>${verifiedProgress}%</strong><small>Only verified progress is official</small></div>
    </section>
    <div class="action-detail-grid">
      <section class="action-detail-panel">
        <h2>Instruction and processing</h2>
        <h3>Detailed instruction</h3>
        <p class="action-detail-copy">${escapeHtml(item.description || "No detailed instruction recorded.")}</p>
        <h3>Issuer note</h3>
        <p class="action-detail-copy">${escapeHtml(item.issuer_note || "No issuer note recorded.")}</p>
        <h3>Office processing note</h3>
        <p class="action-detail-copy">${escapeHtml(item.office_processing_note || "No office processing note recorded.")}</p>
        ${item.completion_note ? `<h3>Completion note</h3><p class="action-detail-copy">${escapeHtml(item.completion_note)}</p>` : ""}
      </section>
      <aside class="action-detail-panel">
        <h2>Responsibility and context</h2>
        <div class="action-detail-list">
          ${assignees.length ? assignees.map((assignment) => `<div><strong>${escapeHtml(actionUserName(assignment.user_id))}</strong><span>${assignment.responsibility_type === "lead" ? "Lead officer" : "Supporting officer"}</span>${assignment.responsibility_note ? `<small>${escapeHtml(assignment.responsibility_note)}</small>` : ""}</div>`).join("") : `<div><strong>Unassigned</strong><span>No active assignee is recorded.</span></div>`}
          <div><strong>${escapeHtml(officeActionTypeLabel(item.action_type))}</strong><span>Processing type</span><small>${escapeHtml(item.responsibility_mode || "joint")} responsibility</small></div>
          <div><strong>${escapeHtml(correspondence?.letter_number || correspondence?.subject || "No linked correspondence")}</strong><span>${correspondence ? escapeHtml(correspondence.subject || "Linked correspondence") : "Correspondence"}</span></div>
          <div><strong>${escapeHtml(item.competent_authority_id ? actionUserName(item.competent_authority_id) : "Not specified")}</strong><span>Competent authority</span></div>
          <div><strong>${escapeHtml(item.verifier_id ? actionUserName(item.verifier_id) : "Not specified")}</strong><span>Verifier</span></div>
        </div>
        ${project ? `<button class="btn secondary action-detail-project" type="button" data-project-id="${project.id}">Open project workspace</button>` : ""}
      </aside>
    </div>
    <div class="action-detail-grid">
      <section class="action-detail-panel"><h2>Progress history</h2>${progressHistory(item) || `<div class="dashboard-empty">No progress updates recorded.</div>`}</section>
      <section class="action-detail-panel"><h2>Workflow history</h2>${workflowHistory(item) || `<div class="dashboard-empty">No workflow events recorded.</div>`}</section>
    </div>
    ${actionUpdateDialog(item)}${actionDialog("")}${officeProcessDialog()}${progressDialog()}${verificationDialog()}
  </main></div>`;
}

function bindActionUpdateEvents(item, onSaved) {
  const dialog = document.querySelector("#action-update-dialog");
  document.querySelector(".update-action-button")?.addEventListener("click", () => {
    const current = state.actionItems.find((record) => record.id === item.id);
    if (!current || !canControlAction(current)) {
      showToast("You are not authorised to update this action.", "error");
      return;
    }
    dialog?.showModal();
  });
  document.querySelector("#action-update-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const error = document.querySelector("#action-update-error");
    const button = document.querySelector("#action-update-save");
    error.textContent = "";
    const current = state.actionItems.find((record) => record.id === item.id);
    if (!current || !canControlAction(current)) {
      error.textContent = "You are not authorised to update this action.";
      return;
    }
    const title = document.querySelector("#action-update-title").value.trim();
    const status = document.querySelector("#action-update-status").value;
    const priority = document.querySelector("#action-update-priority").value;
    const dueDateInput = document.querySelector("#action-update-due-date");
    const claimedInput = document.querySelector("#action-update-claimed");
    const verifiedInput = document.querySelector("#action-update-verified");
    const dueDate = dueDateInput.value;
    const claimed = Number(claimedInput.value);
    const verified = Number(verifiedInput.value);
    if (!title) { error.textContent = "Action title must not be blank."; return; }
    if (!ACTION_STATUSES.some(([value])=>value===status)) { error.textContent = "Select a valid action status."; return; }
    if (!ACTION_PRIORITIES.some(([value])=>value===priority)) { error.textContent = "Select a valid action priority."; return; }
    if (!claimedInput.value || !Number.isInteger(claimed) || claimed < 0 || claimed > 100) { error.textContent = "Claimed progress must be a whole number between 0 and 100."; return; }
    if (!verifiedInput.value || !Number.isInteger(verified) || verified < 0 || verified > 100) { error.textContent = "Verified progress must be a whole number between 0 and 100."; return; }
    if (!dueDateInput.validity.valid || !validActionDate(dueDate)) { error.textContent = "Enter a valid due date."; return; }
    const values = {
      title,
      description: document.querySelector("#action-update-description").value.trim() || null,
      status,
      priority,
      due_date: dueDate || null,
      progress_percent: claimed,
      verified_progress_percent: verified,
      issuer_note: document.querySelector("#action-update-remarks").value.trim() || null,
    };
    const changes = actionUpdateChanges(current, values);
    if (!changes.length) { error.textContent = "No changes to save."; return; }
    const confirmation = changes.map((change)=>`${change.label}: ${actionHistoryValue(change, change.before)} → ${actionHistoryValue(change, change.after)}`).join("\n");
    if (!window.confirm(`Save these action changes?\n\n${confirmation}`)) return;
    const payload = Object.fromEntries(changes.map((change)=>[change.key, change.after]));
    setButtonLoading(button, true, "Saving...");
    try {
      const updated = await updateActionItem(current.id, payload);
      if (!updated) throw new Error("The action could not be updated. It may be unavailable or you may not have permission.");
      try {
        await createActionWorkflowEvent({
          action_id: current.id,
          event_type: "action_updated",
          from_stage: current.workflow_stage || null,
          to_stage: current.workflow_stage || null,
          remarks: `${changes.length} field${changes.length===1?"":"s"} updated`,
          draft_text: confirmation,
        });
      } catch (historyError) {
        throw new Error(`Action values were saved, but workflow history could not be recorded: ${historyError.message}`);
      }
      dialog.close();
      showToast("Action updated successfully.");
      await onSaved();
    } catch (saveError) {
      error.textContent = saveError.message || "The action could not be updated.";
    } finally {
      setButtonLoading(button, false);
    }
  });
}

function bindActionDetailEvents(item) {
  bindActionEvents(() => renderActionDetail(item.id));
  bindActionUpdateEvents(item, () => renderActionDetail(item.id));
  document.querySelector("#action-detail-back")?.addEventListener("click", () => { location.hash = "#actions"; });
  document.querySelector(".action-detail-project")?.addEventListener("click", (event) => {
    location.hash = `#project/${event.currentTarget.dataset.projectId}`;
  });
}

async function renderActionDetail(actionId) {
  root.innerHTML = `<div class="loading-screen"><span class="spinner dark"></span><p>Loading action details...</p></div>`;
  try {
    await loadActionData();
    const item = state.actionItems.find((record) => String(record.id) === String(actionId));
    if (!item) {
      root.innerHTML = actionDetailNotFoundTemplate();
      bindCommonEvents();
      document.querySelector("#action-not-found-back")?.addEventListener("click", () => { location.hash = "#actions"; });
      return;
    }
    root.innerHTML = actionDetailTemplate(item);
    bindActionDetailEvents(item);
  } catch (error) {
    root.innerHTML = `<div class="loading-screen"><p>${escapeHtml(error.message)}</p><button class="btn primary" id="action-load-error-back" type="button">Return to Action Tracking</button></div>`;
    document.querySelector("#action-load-error-back")?.addEventListener("click", () => { location.hash = "#actions"; });
  }
}

function projectActionsModule(project) {
  const items = state.actionItems.filter((item)=>item.project_id === project.id);
  const canCreate = ["admin","editor"].includes(state.profile?.role);
  return `<div><div class="module-header"><div><h2>Action Tracking</h2><p>Instructions and verified progress for this project.</p></div>${canCreate?`<button class="btn primary" id="add-project-action">${icon("plus")}Issue action</button>`:""}</div>${actionList(items,false)}${actionDialog(project.id)}${officeProcessDialog()}${progressDialog()}${verificationDialog()}</div>`;
}

async function loadActionData(projectId = null) {
  [state.actionItems, state.assignableUsers, state.correspondence, state.projectJurisdictions, state.actionAssignees, state.actionProgressUpdates, state.actionWorkflowEvents] = await Promise.all([
    getActionItems(projectId), getAssignableUsers(), getCorrespondence(projectId), getProjectJurisdictions(), getActionAssignees(), getActionProgressUpdates(), getActionWorkflowEvents()
  ]);
}

async function renderActionPage() {
  root.innerHTML = `<div class="loading-screen"><span class="spinner dark"></span><p>Loading actions...</p></div>`;
  try { await loadActionData(); root.innerHTML = actionPageTemplate(); bindActionEvents(renderActionPage); }
  catch (error) { root.innerHTML = `<div class="loading-screen"><p>${escapeHtml(error.message)}</p></div>`; }
}

function renderAssigneePicker(projectId, selected = []) {
  const picker = document.querySelector("#action-assignee-picker");
  if (!picker) return;
  const users = jurisdictionUsersForProject(projectId);
  picker.innerHTML = users.length ? users.map((user, index)=>{
    const existing = selected.find((item)=>item.user_id === user.id);
    return `<label class="assignee-option"><input type="checkbox" class="assignee-checkbox" value="${user.id}" ${existing?"checked":""}/><span><strong>${escapeHtml(user.full_name)} — ${escapeHtml(user.designation || "User")}</strong><span>${escapeHtml(user.office_name || "Office not specified")}</span><select class="assignee-role" data-user-id="${user.id}" ${existing?"":"disabled"}><option value="lead" ${existing?.responsibility_type === "lead"?"selected":""}>Lead</option><option value="supporting" ${existing?.responsibility_type !== "lead"?"selected":""}>Supporting</option></select><input class="assignee-note" data-user-id="${user.id}" placeholder="Individual responsibility" value="${escapeHtml(existing?.responsibility_note || "")}" ${existing?"":"disabled"}/></span></label>`;
  }).join("") : `<p class="form-error">No approved officer currently has jurisdiction for this project. Add project jurisdiction in Administration first.</p>`;
  picker.querySelectorAll(".assignee-checkbox").forEach((box)=>box.addEventListener("change",()=>{
    picker.querySelector(`.assignee-role[data-user-id="${box.value}"]`).disabled = !box.checked;
    picker.querySelector(`.assignee-note[data-user-id="${box.value}"]`).disabled = !box.checked;
  }));
}

function populateActionForm(item = null) {
  document.querySelector("#action-form")?.reset();
  document.querySelector("#action-id").value = item?.id || "";
  document.querySelector("#action-dialog-title").textContent = item ? "Edit action instruction" : "Issue action";
  const projectId = item?.project_id || document.querySelector("#action-project")?.value || state.projects[0]?.id || "";
  if (item) {
    document.querySelector("#action-project").value = item.project_id || "";
    document.querySelector("#action-correspondence").value = item.correspondence_id || "";
    document.querySelector("#action-title").value = item.title || "";
    document.querySelector("#action-description").value = item.description || "";
    document.querySelector("#action-priority").value = item.priority || "normal";
    document.querySelector("#action-status").value = item.status || "open";
    document.querySelector("#action-due-date").value = item.due_date || "";
    document.querySelector("#action-reminder-date").value = item.reminder_date || "";
    document.querySelector("#action-mode").value = item.responsibility_mode || "joint";
    document.querySelector("#action-type").value = item.action_type || "execute_work";
    document.querySelector("#action-direction").value = item.movement_direction || "internal";
    document.querySelector("#action-authority").value = item.competent_authority_id || "";
    document.querySelector("#action-verifier").value = item.verifier_id || "";
    document.querySelector("#action-issuer-note").value = item.issuer_note || "";
  }
  renderAssigneePicker(projectId, item ? actionAssigneesFor(item.id) : []);
}


function suggestedWorkflowStage(eventType) {
  return ({
    examination_started: "under_examination",
    report_submitted: "pending_approval",
    draft_prepared: "draft_prepared",
    approval_requested: "pending_approval",
    approved: "approved",
    forwarded_downward: "forwarded",
    submitted_upward: "forwarded",
    response_received: "response_received",
    closed: "closed",
  })[eventType] || "received";
}

function syncActionFilterControls() {
  const filters = state.actionFilters;
  const values = {
    "#action-filter-search": filters.query,
    "#action-filter-project": filters.project,
    "#action-filter-status": filters.status,
    "#action-filter-priority": filters.priority,
    "#action-filter-assignee": filters.assignee,
    "#action-filter-workflow": filters.workflowStage,
    "#action-filter-due": filters.dueDate,
  };
  Object.entries(values).forEach(([selector,value]) => {
    const control = document.querySelector(selector);
    if (control && control.value !== value) control.value = value;
  });
  document.querySelectorAll("[data-action-quick-view]").forEach((button) => {
    const active = button.dataset.actionQuickView === filters.quickView;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  const summary = document.querySelector("#action-filter-summary");
  if (summary) {
    const shown = filteredActionItems().length;
    const total = state.actionItems.length;
    summary.innerHTML = `<strong>${shown}</strong> of <strong>${total}</strong> action${total===1?"":"s"} shown`;
  }
}

function bindActionCardEvents(scope = document) {
  const actionDialogElement = document.querySelector("#action-dialog");
  const progressDialogElement = document.querySelector("#progress-dialog");
  const verificationDialogElement = document.querySelector("#verification-dialog");
  const officeProcessDialogElement = document.querySelector("#office-process-dialog");
  scope.querySelectorAll(".view-action-details").forEach((button)=>button.addEventListener("click",()=>openActionDetails(button.dataset.actionId)));
  scope.querySelectorAll(".edit-action-button").forEach((button)=>button.addEventListener("click",()=>{ const item=state.actionItems.find((action)=>action.id===button.dataset.actionId); if(item){populateActionForm(item); actionDialogElement?.showModal();} }));
  scope.querySelectorAll(".submit-progress-button").forEach((button)=>button.addEventListener("click",()=>{ document.querySelector("#progress-form")?.reset(); document.querySelector("#progress-action-id").value=button.dataset.actionId; progressDialogElement?.showModal(); }));
  scope.querySelectorAll(".process-office-action-button").forEach((button)=>button.addEventListener("click",()=>{
    document.querySelector("#office-process-form")?.reset();
    document.querySelector("#office-process-action-id").value=button.dataset.actionId;
    const outcome = document.querySelector("#office-process-event");
    const stage = document.querySelector("#office-process-stage");
    if (outcome && stage) stage.value = suggestedWorkflowStage(outcome.value);
    officeProcessDialogElement?.showModal();
  }));
  scope.querySelectorAll(".verify-progress-button").forEach((button)=>button.addEventListener("click",()=>{ const update=state.actionProgressUpdates.find((item)=>item.id===button.dataset.updateId); document.querySelector("#verification-form")?.reset(); document.querySelector("#verification-update-id").value=button.dataset.updateId; document.querySelector("#verification-action-id").value=button.dataset.actionId; document.querySelector("#verification-percent").value=update?.claimed_progress_percent ?? 0; verificationDialogElement?.showModal(); }));
}

function renderFilteredActionResults(onSaved) {
  const results = document.querySelector("#action-register-results");
  if (!results) return;
  results.innerHTML = actionRegisterResultsTemplate();
  syncActionFilterControls();
  bindActionCardEvents(results);
}

function bindActionFilterEvents(onSaved) {
  if (!document.querySelector("#action-filter-search")) return;
  const update = (key,value) => {
    state.actionFilters = { ...state.actionFilters, [key]: value };
    renderFilteredActionResults(onSaved);
  };
  document.querySelector("#action-filter-search")?.addEventListener("input", (event) => update("query", event.target.value));
  [
    ["#action-filter-project","project"],
    ["#action-filter-status","status"],
    ["#action-filter-priority","priority"],
    ["#action-filter-assignee","assignee"],
    ["#action-filter-workflow","workflowStage"],
    ["#action-filter-due","dueDate"],
  ].forEach(([selector,key]) => document.querySelector(selector)?.addEventListener("change", (event) => update(key, event.target.value)));
  document.querySelectorAll("[data-action-quick-view]").forEach((button) => button.addEventListener("click", () => update("quickView", button.dataset.actionQuickView)));
  document.querySelector("#reset-action-filters")?.addEventListener("click", () => {
    state.actionFilters = { ...DEFAULT_ACTION_FILTERS };
    syncActionFilterControls();
    renderFilteredActionResults(onSaved);
    document.querySelector("#action-filter-search")?.focus();
  });
  syncActionFilterControls();
}

function bindActionEvents(onSaved) {
  bindCommonEvents();
  const actionDialogElement = document.querySelector("#action-dialog");
  const progressDialogElement = document.querySelector("#progress-dialog");
  const verificationDialogElement = document.querySelector("#verification-dialog");
  const officeProcessDialogElement = document.querySelector("#office-process-dialog");
  const officeOutcomeSelect = document.querySelector("#office-process-event");
  const officeStageSelect = document.querySelector("#office-process-stage");
  officeOutcomeSelect?.addEventListener("change", () => {
    if (officeStageSelect) officeStageSelect.value = suggestedWorkflowStage(officeOutcomeSelect.value);
  });
  const openNew = () => { populateActionForm(null); actionDialogElement.showModal(); };
  document.querySelector("#add-action-button")?.addEventListener("click", openNew);
  document.querySelector("#add-project-action")?.addEventListener("click", openNew);
  bindActionCardEvents();
  bindActionFilterEvents(onSaved);
  document.querySelector("#action-project")?.addEventListener("change", (event)=>renderAssigneePicker(event.target.value, []));

  document.querySelector("#action-form")?.addEventListener("submit", async (event)=>{
    event.preventDefault(); const form=event.currentTarget; if(!form.checkValidity()){form.reportValidity();return;}
    const id=document.querySelector("#action-id").value;
    const existingAction=id?state.actionItems.find((item)=>item.id===id):null;
    if(id && (!existingAction || !canControlAction(existingAction))){document.querySelector("#action-error").textContent="You are not authorised to update this action.";return;}
    const selected=[...document.querySelectorAll(".assignee-checkbox:checked")].map((box)=>({user_id:box.value,responsibility_type:document.querySelector(`.assignee-role[data-user-id="${box.value}"]`).value,responsibility_note:document.querySelector(`.assignee-note[data-user-id="${box.value}"]`).value.trim()||null}));
    if(!selected.length){document.querySelector("#action-error").textContent="Select at least one officer having project jurisdiction.";return;}
    if(selected.filter((item)=>item.responsibility_type==="lead").length!==1){document.querySelector("#action-error").textContent="Select exactly one lead officer.";return;}
    const payload={project_id:document.querySelector("#action-project").value,correspondence_id:document.querySelector("#action-correspondence").value||null,title:document.querySelector("#action-title").value.trim(),description:document.querySelector("#action-description").value.trim()||null,priority:document.querySelector("#action-priority").value,status:document.querySelector("#action-status").value,due_date:document.querySelector("#action-due-date").value||null,reminder_date:document.querySelector("#action-reminder-date").value||null,responsibility_mode:document.querySelector("#action-mode").value,action_type:document.querySelector("#action-type").value,movement_direction:document.querySelector("#action-direction").value,competent_authority_id:document.querySelector("#action-authority").value||null,workflow_stage:id?(state.actionItems.find((item)=>item.id===id)?.workflow_stage||"received"):"received",verifier_id:document.querySelector("#action-verifier").value||null,issuer_note:document.querySelector("#action-issuer-note").value.trim()||null};
    const button=document.querySelector("#action-save-button"); const error=document.querySelector("#action-error"); setButtonLoading(button,true,"Saving..."); error.textContent="";
    try { const action=id ? await updateActionItem(id,payload) : await createActionItem(payload); await deactivateActionAssignees(action.id); for(const assignment of selected) await createActionAssignee({action_id:action.id,...assignment,is_active:true}); actionDialogElement.close(); showToast(id?"Action instruction updated.":"Action issued."); await onSaved(); }
    catch(err){error.textContent=err.message;} finally{setButtonLoading(button,false);}
  });

  document.querySelector("#office-process-form")?.addEventListener("submit", async (event)=>{
    event.preventDefault(); const form=event.currentTarget; if(!form.checkValidity()){form.reportValidity();return;}
    const actionId=document.querySelector("#office-process-action-id").value;
    const action=state.actionItems.find((item)=>item.id===actionId); if(!action)return;
    const eventType=document.querySelector("#office-process-event").value;
    const nextStage=document.querySelector("#office-process-stage").value;
    const onBehalf=document.querySelector("#office-process-on-behalf").value||null;
    const authorizePA=document.querySelector("#office-process-authorize-pa").checked;
    const error=document.querySelector("#office-process-error"); const button=document.querySelector("#office-process-save"); error.textContent="";
    if(eventType==="forwarded_downward" && !canForwardDownward(action)){ error.textContent="Downward forwarding requires recorded approval or issuer/administrator authority."; return; }
    if(eventType==="submitted_upward" && !canSubmitUpward(action)){ error.textContent="Upward submission can only be made by the competent EE/SE/CE or authorised issuer."; return; }
    if(isPAUser() && eventType==="submitted_upward"){ error.textContent="PA may prepare the draft, but cannot independently submit correspondence to a higher office."; return; }
    setButtonLoading(button,true,"Saving...");
    try{
      const updatePayload={workflow_stage:nextStage,office_processing_note:document.querySelector("#office-process-remarks").value.trim()};
      if(authorizePA){ updatePayload.approved_for_forwarding=true; updatePayload.forwarding_authorized_to=onBehalf; }
      if(eventType==="closed"){ updatePayload.status="completed"; updatePayload.closure_mode="office_processing"; updatePayload.closed_by=state.profile?.id||null; updatePayload.closed_at=new Date().toISOString(); }
      if(eventType==="forwarded_downward" || eventType==="submitted_upward") updatePayload.workflow_stage="forwarded";
      await updateActionItem(actionId,updatePayload);
      await createActionWorkflowEvent({action_id:actionId,event_type:eventType,from_stage:action.workflow_stage||null,to_stage:updatePayload.workflow_stage||nextStage,on_behalf_of:onBehalf,remarks:document.querySelector("#office-process-remarks").value.trim(),draft_text:document.querySelector("#office-process-draft").value.trim()||null});
      officeProcessDialogElement.close(); showToast("Office processing recorded."); await onSaved();
    }catch(err){error.textContent=err.message;}finally{setButtonLoading(button,false);}
  });

  document.querySelector("#progress-form")?.addEventListener("submit", async (event)=>{
    event.preventDefault(); const form=event.currentTarget; if(!form.checkValidity()){form.reportValidity();return;}
    const button=document.querySelector("#progress-submit-button"); const error=document.querySelector("#progress-error"); setButtonLoading(button,true,"Submitting..."); error.textContent="";
    try { await createProgressUpdate({action_id:document.querySelector("#progress-action-id").value,claimed_progress_percent:Number(document.querySelector("#progress-claimed").value),work_done:document.querySelector("#progress-work-done").value.trim(),remaining_work:document.querySelector("#progress-remaining").value.trim()||null,delay_reason:document.querySelector("#progress-delay").value.trim()||null}); progressDialogElement.close(); showToast("Progress submitted for senior verification."); await onSaved(); }
    catch(err){error.textContent=err.message;} finally{setButtonLoading(button,false);}
  });

  document.querySelector("#verification-form")?.addEventListener("submit", async (event)=>{
    event.preventDefault(); const form=event.currentTarget; if(!form.checkValidity()){form.reportValidity();return;}
    const status=document.querySelector("#verification-status").value; const verifiedPercent=Number(document.querySelector("#verification-percent").value||0); const actionId=document.querySelector("#verification-action-id").value;
    const button=document.querySelector("#verification-save-button"); const error=document.querySelector("#verification-error"); setButtonLoading(button,true,"Saving..."); error.textContent="";
    try { await verifyProgressUpdate(document.querySelector("#verification-update-id").value,{verification_status:status,verified_progress_percent:status==="approved"?verifiedPercent:null,verification_remarks:document.querySelector("#verification-remarks").value.trim()}); if(status==="approved") await updateActionItem(actionId,{verified_progress_percent:verifiedPercent,progress_percent:verifiedPercent,status:verifiedPercent>=100?"completed":"in_progress",completed_at:verifiedPercent>=100?new Date().toISOString():null}); verificationDialogElement.close(); showToast("Progress verification saved."); await onSaved(); }
    catch(err){error.textContent=err.message;} finally{setButtonLoading(button,false);}
  });
}
