function correspondenceStatusLabel(status) {
  return ({ open: "Open", under_review: "Under Review", replied: "Replied", closed: "Closed", no_action: "No Action" })[status] || status || "Open";
}

function correspondenceList(records, projectMap = true) {
  if (!records.length) return `<div class="empty-state">${icon("mail",42)}<h3>No correspondence recorded</h3><p>Add the first incoming or outgoing letter.</p></div>`;
  return `<div class="correspondence-list">${records.map((item) => {
    const project = state.projects.find((p) => p.id === item.project_id);
    const partyText = item.direction === "incoming"
      ? `From: ${escapeHtml(item.from_party || "—")} · To: ${escapeHtml(item.to_party || "—")}`
      : `To: ${escapeHtml(item.to_party || "—")} · From: ${escapeHtml(item.from_party || "—")}`;
    return `<article class="correspondence-item" data-correspondence-id="${item.id}">
      <div class="correspondence-main">
        <div class="correspondence-topline">
          <span class="direction-pill ${item.direction}">${item.direction}</span>
          <span class="priority-pill ${item.priority || "normal"}">${item.priority || "normal"}</span>
          <span class="letter-status ${item.status || "open"}">${correspondenceStatusLabel(item.status)}</span>
          ${projectMap && project ? `<span class="status-pill approved">${escapeHtml(project.project_code || project.project_name)}</span>` : ""}
        </div>
        <h3>${escapeHtml(item.subject || "Untitled correspondence")}</h3>
        <div class="correspondence-meta">
          <span>Letter No.: ${escapeHtml(item.letter_number || "—")}</span>
          <span>Letter Date: ${formatDate(item.letter_date)}</span>
          <span>${item.direction === "incoming" ? "Received" : "Sent"}: ${formatDate(item.received_or_sent_date)}</span>
          ${item.due_date ? `<span>Due: ${formatDate(item.due_date)}</span>` : ""}
        </div>
        <p class="correspondence-parties">${partyText}</p>
        ${item.reference_details ? `<p class="correspondence-parties"><strong>Reference:</strong> ${escapeHtml(item.reference_details)}</p>` : ""}
        ${item.action_required ? `<p class="correspondence-parties"><strong>Action:</strong> ${escapeHtml(item.action_required)}</p>` : ""}
      </div>
      <div class="correspondence-side">
        <strong>${item.attachment_name ? escapeHtml(item.attachment_name) : "No attachment"}</strong>
        ${item.attachment_size_bytes ? `<span>${formatFileSize(item.attachment_size_bytes)} · ${escapeHtml(item.attachment_mime_type || "file")}</span>` : ""}
        <span>Updated ${formatDate(item.updated_at || item.created_at)}</span>
        <div class="attachment-actions">
          ${item.attachment_path ? `<button class="btn secondary open-attachment-button" data-id="${item.id}">Open attachment</button>` : ""}
          ${["admin","editor"].includes(state.profile?.role) ? `<button class="btn secondary edit-correspondence-button" data-id="${item.id}">Update status</button>` : ""}
        </div>
      </div>
    </article>`;
  }).join("")}</div>`;
}


function correspondenceOfficeOptions(selected = "") {
  const active = state.directoryEntities.filter((entity) => entity.is_active !== false);
  const frequent = active
    .filter((entity) => entity.is_frequent)
    .sort((a, b) => Number(a.display_order || 999) - Number(b.display_order || 999) || a.name.localeCompare(b.name));
  const others = active
    .filter((entity) => !entity.is_frequent)
    .sort((a, b) => a.name.localeCompare(b.name));

  const option = (entity) => `<option value="${escapeHtml(entity.name)}" ${selected === entity.name ? "selected" : ""}>${escapeHtml(entity.name)}</option>`;
  return `<option value="">Select office/organisation</option>
    ${frequent.length ? `<optgroup label="Frequently used">${frequent.map(option).join("")}</optgroup>` : ""}
    ${others.length ? `<optgroup label="Directory (A–Z)">${others.map(option).join("")}</optgroup>` : ""}
    <option value="__other__" ${selected === "__other__" ? "selected" : ""}>Other</option>`;
}

function bindOtherOfficeFields() {
  [["#corr-from-select", "#corr-from-other"], ["#corr-to-select", "#corr-to-other"]].forEach(([selectId, otherId]) => {
    const select = document.querySelector(selectId);
    const other = document.querySelector(otherId);
    if (!select || !other) return;
    const sync = () => {
      const isOther = select.value === "__other__";
      other.hidden = !isOther;
      const input = other.querySelector("input");
      if (input) {
        input.required = isOther;
        if (!isOther) input.value = "";
      }
    };
    select.addEventListener("change", sync);
    sync();
  });
}

function selectedOfficeValue(selectId, otherInputId) {
  const select = document.querySelector(selectId);
  if (!select) return null;
  if (select.value === "__other__") {
    return document.querySelector(otherInputId)?.value?.trim() || null;
  }
  return select.value || null;
}

function correspondenceDialog(projectId = "") {
  return `<dialog id="correspondence-dialog" class="modal">
    <form id="correspondence-form" class="modal-card" novalidate>
      <div class="modal-heading"><div><p class="eyebrow">Correspondence</p><h2>Add letter</h2><p>Record incoming or outgoing official correspondence.</p></div><button class="icon-button" type="button" data-dialog-close>${icon("close")}</button></div>
      <div class="form-section"><h3>Letter details</h3><div class="form-grid">
        <label>Project *<select id="corr-project" required>${state.projects.map(p=>`<option value="${p.id}" ${projectId===p.id?"selected":""}>${escapeHtml(p.project_name)}</option>`).join("")}</select></label>
        <label>Direction *<select id="corr-direction" required><option value="incoming">Incoming</option><option value="outgoing">Outgoing</option></select></label>
        <label>Letter number<input id="corr-number" placeholder="Letter/reference number" /></label>
        <label>Letter date<input id="corr-letter-date" type="date" /></label>
        <label>Received/Sent date<input id="corr-movement-date" type="date" /></label>
        <label>Priority<select id="corr-priority"><option value="normal">Normal</option><option value="low">Low</option><option value="high">High</option><option value="urgent">Urgent</option></select></label>
        <label>From
          <select id="corr-from-select">${correspondenceOfficeOptions()}</select>
        </label>
        <label>To
          <select id="corr-to-select">${correspondenceOfficeOptions()}</select>
        </label>
        <label id="corr-from-other" class="wide other-office-field" hidden>Other sender/issuing authority
          <input id="corr-from-other-input" placeholder="Type office/organisation name" />
        </label>
        <label id="corr-to-other" class="wide other-office-field" hidden>Other recipient/addressee
          <input id="corr-to-other-input" placeholder="Type office/organisation name" />
        </label>
        <label class="wide">Subject *<textarea id="corr-subject" rows="2" required placeholder="Subject of the letter"></textarea></label>
        <label class="wide">Reference details<textarea id="corr-reference" rows="2" placeholder="Previous letter/order/circular references"></textarea></label>
        <label class="wide">Action required<textarea id="corr-action" rows="2" placeholder="Action to be taken"></textarea></label>
        <label>Due date<input id="corr-due-date" type="date" /></label>
        <label>Status<select id="corr-status"><option value="open">Open</option><option value="under_review">Under Review</option><option value="replied">Replied</option><option value="closed">Closed</option><option value="no_action">No Action</option></select></label>
        <label class="wide">Attachment
          <input id="corr-attachment-file" type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp" />
          <span class="attachment-help">Optional. PDF, JPG, PNG or WEBP only; maximum 10 MB. Files are stored privately and require an approved login to open.</span>
        </label>
        <label class="wide">Remarks<textarea id="corr-remarks" rows="2"></textarea></label>
      </div></div>
      <p id="correspondence-error" class="form-error"></p>
      <div class="modal-actions"><button class="btn secondary" type="button" data-dialog-close>Cancel</button><button class="btn primary" id="save-correspondence-button" type="submit">Save letter</button></div>
    </form>
  </dialog>`;
}

function projectCorrespondenceModule(project) {
  const records = state.correspondence.filter((item) => item.project_id === project.id);
  return `<div><div class="module-header"><div><h2>Correspondence</h2><p>Incoming and outgoing letters linked to this project.</p></div>${["admin","editor"].includes(state.profile?.role) ? `<button class="btn primary" id="add-project-correspondence">${icon("plus")}Add letter</button>` : ""}</div>${correspondenceList(records, false)}${correspondenceDialog(project.id)}</div>`;
}

function globalCorrespondenceTemplate() {
  const canEdit = ["admin","editor"].includes(state.profile?.role);
  return `<div class="app-shell">${appHeader()}${sidebar("correspondence")}
    <main class="main-content correspondence-page">
      <div class="breadcrumb"><span>Dashboard</span><b>/</b>Correspondence</div>
      <div class="admin-heading"><div><h1>Correspondence</h1><p>Division-wide register of incoming and outgoing letters.</p></div>${canEdit ? `<button class="btn primary" id="add-global-correspondence">${icon("plus")}Add letter</button>` : ""}</div>
      <section class="admin-card">
        <div class="admin-card-heading"><div><h2>Letter register</h2><p>${state.correspondence.length} record${state.correspondence.length===1?"":"s"} available.</p></div></div>
        <div style="padding:18px 20px;">${correspondenceList(state.correspondence, true)}</div>
      </section>
      ${correspondenceDialog("")}
    </main>
  </div>`;
}

async function renderGlobalCorrespondence() {
  root.innerHTML = `<div class="loading-screen"><span class="spinner dark"></span><p>Loading correspondence...</p></div>`;
  try {
    state.correspondence = await getCorrespondence();
    root.innerHTML = globalCorrespondenceTemplate();
    bindGlobalCorrespondenceEvents();
  } catch (error) {
    root.innerHTML = `<div class="loading-screen"><p>${escapeHtml(error.message)}</p></div>`;
  }
}

function bindCorrespondenceDialogEvents(onSaved) {
  bindOtherOfficeFields();
  const fileInput = document.querySelector("#corr-attachment-file");
  fileInput?.addEventListener("change", () => {
    const file = fileInput.files?.[0];
    try {
      validateCorrespondenceAttachment(file);
      fileInput.setCustomValidity("");
    } catch (error) {
      fileInput.value = "";
      fileInput.setCustomValidity(error.message);
      fileInput.reportValidity();
    }
  });
  const form = document.querySelector("#correspondence-form");
  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!form.checkValidity()) { form.reportValidity(); return; }
    const button = document.querySelector("#save-correspondence-button");
    const error = document.querySelector("#correspondence-error");
    const value = (id) => document.querySelector(id)?.value?.trim() || null;
    setButtonLoading(button, true, "Saving..."); error.textContent = "";
    try {
      const created = await createCorrespondence({
        project_id: value("#corr-project"),
        direction: value("#corr-direction"),
        letter_number: value("#corr-number"),
        letter_date: value("#corr-letter-date"),
        received_or_sent_date: value("#corr-movement-date"),
        priority: value("#corr-priority") || "normal",
        from_party: selectedOfficeValue("#corr-from-select", "#corr-from-other-input"),
        to_party: selectedOfficeValue("#corr-to-select", "#corr-to-other-input"),
        subject: value("#corr-subject"),
        reference_details: value("#corr-reference"),
        action_required: value("#corr-action"),
        due_date: value("#corr-due-date"),
        status: value("#corr-status") || "open",
        remarks: value("#corr-remarks"),
      });
      const file = document.querySelector("#corr-attachment-file")?.files?.[0] || null;
      if (file) {
        const attachment = await uploadCorrespondenceAttachment(file, created.project_id, created.id);
        await updateCorrespondence(created.id, attachment);
      }
      document.querySelector("#correspondence-dialog").close();
      showToast(file ? "Correspondence and attachment saved." : "Correspondence saved.");
      await onSaved();
    } catch (err) { error.textContent = err.message; }
    finally { setButtonLoading(button, false); }
  });
}

function bindGlobalCorrespondenceEvents() {
  bindCommonEvents();
  document.querySelector("#add-global-correspondence")?.addEventListener("click", () => document.querySelector("#correspondence-dialog").showModal());
  bindCorrespondenceDialogEvents(renderGlobalCorrespondence);
  bindCorrespondenceStatusButtons(renderGlobalCorrespondence);
}

function bindCorrespondenceStatusButtons(onSaved) {
  document.querySelectorAll(".open-attachment-button").forEach((button) => button.addEventListener("click", async () => {
    const record = state.correspondence.find((item) => item.id === button.dataset.id);
    if (!record) return;
    setButtonLoading(button, true, "Opening...");
    try { await openCorrespondenceAttachment(record); }
    catch (error) { showToast(error.message, "error"); }
    finally { setButtonLoading(button, false); }
  }));
  document.querySelectorAll(".edit-correspondence-button").forEach((button) => button.addEventListener("click", async () => {
    const record = state.correspondence.find((item) => item.id === button.dataset.id);
    if (!record) return;
    const next = record.status === "open" ? "under_review" : record.status === "under_review" ? "replied" : record.status === "replied" ? "closed" : "open";
    setButtonLoading(button, true, "Updating...");
    try {
      await updateCorrespondence(record.id, { status: next });
      showToast(`Status changed to ${correspondenceStatusLabel(next)}.`);
      await onSaved();
    } catch (error) { showToast(error.message, "error"); }
    finally { setButtonLoading(button, false); }
  }));
}
