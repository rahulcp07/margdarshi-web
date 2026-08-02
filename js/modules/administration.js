const DESIGNATION_GROUPS = [
  ["Class I", ["Chief Engineer","Superintending Engineer","Executive Engineer","Assistant Executive Engineer","Deputy Engineer (PA), Class I","Sub-Divisional Engineer","Sub-Divisional Officer","Assistant Engineer Grade-I"]],
  ["Class II", ["Project Officer, Class II","Assistant Engineer Grade-II","Sectional Engineer","Junior Engineer"]],
  ["Ministerial and Supporting Staff", ["Personal Assistant","Auditor","Divisional Accountant","Senior Clerk","Junior Clerk","Data Entry Operator"]],
  ["External Users", ["Consultant / Authority Engineer","Contractor Representative","Other"]],
];

function designationOptions(selected = "") {
  return `<option value="">Select designation</option>${DESIGNATION_GROUPS.map(([group, values]) => `<optgroup label="${group}">${values.map((value) => `<option ${selected === value ? "selected" : ""}>${escapeHtml(value)}</option>`).join("")}</optgroup>`).join("")}`;
}

function officeOptions(selected = "") {
  return `<option value="">Select office</option>${state.offices.map((office) => `<option value="${office.id}" ${selected === office.id ? "selected" : ""}>${escapeHtml(office.name)}</option>`).join("")}`;
}

function roleOptions(selected = "viewer") {
  return [["viewer","Viewer"],["editor","Editor"],["admin","Administrator"]].map(([value,label]) => `<option value="${value}" ${selected === value ? "selected" : ""}>${label}</option>`).join("");
}

function statusOptions(selected = "pending") {
  return [["pending","Pending"],["approved","Approved"],["rejected","Rejected"]].map(([value,label]) => `<option value="${value}" ${selected === value ? "selected" : ""}>${label}</option>`).join("");
}

function assignmentSummary(userId) {
  const items = state.assignments.filter((item) => item.user_id === userId && item.is_active);
  if (!items.length) return "No post assigned";
  return items.map((item) => {
    const office = state.offices.find((office) => office.id === item.office_id)?.name || "Office";
    return `${item.is_primary ? "Primary" : "Additional"}: ${item.designation} — ${office}`;
  }).join(" · ");
}


const DIRECTORY_CATEGORIES = [
  ["departmental_office", "PWD / NH Office"],
  ["morth", "MoRTH"],
  ["revenue_cala", "CALA / Revenue Authority"],
  ["railways", "Railways"],
  ["consultant", "Consultant / Authority Engineer"],
  ["contractor", "Contractor"],
  ["court_legal", "Court / Legal"],
  ["utility", "Utility Department"],
  ["local_body", "Local Body"],
  ["other", "Other"],
];

function directoryCategoryLabel(value) {
  return DIRECTORY_CATEGORIES.find(([key]) => key === value)?.[1] || value || "Other";
}

function directoryEntityCards() {
  if (!state.directoryEntities.length) return `<div class="empty-state"><h3>No directory entries</h3><p>Add the first office or organisation.</p></div>`;
  return `<div class="directory-grid">${state.directoryEntities.map((entity) => `
    <article class="directory-card">
      <div class="directory-card-top">
        <div>
          <h3>${escapeHtml(entity.name)}</h3>
          <p>${escapeHtml(entity.short_name || "")}${entity.email ? ` · ${escapeHtml(entity.email)}` : ""}${entity.phone ? ` · ${escapeHtml(entity.phone)}` : ""}</p>
        </div>
        <div><span class="directory-category">${escapeHtml(directoryCategoryLabel(entity.category))}</span>${entity.is_frequent ? `<span class="directory-frequent">Frequent</span>` : ""}</div>
      </div>
      ${entity.address ? `<p>${escapeHtml(entity.address)}</p>` : ""}
      ${entity.remarks ? `<p>${escapeHtml(entity.remarks)}</p>` : ""}
      <div class="directory-actions">
        <button class="btn secondary edit-directory-button" data-directory-id="${entity.id}">Edit</button>
        <button class="btn secondary toggle-directory-button" data-directory-id="${entity.id}" data-next-active="${entity.is_active ? "false" : "true"}">${entity.is_active ? "Deactivate" : "Reactivate"}</button>
      </div>
    </article>`).join("")}</div>`;
}

function directoryDialog() {
  return `<dialog id="directory-dialog" class="modal compact-modal">
    <form id="directory-form" class="modal-card" novalidate>
      <div class="modal-heading"><div><p class="eyebrow">Official Directory</p><h2 id="directory-dialog-title">Add office / organisation</h2><p>Entries automatically appear in correspondence From and To dropdowns.</p></div><button class="icon-button" type="button" data-dialog-close>${icon("close")}</button></div>
      <input id="directory-id" type="hidden" />
      <div class="form-grid single">
        <label>Name *<input id="directory-name" required placeholder="Full official name" /></label>
        <label>Short name<input id="directory-short-name" placeholder="e.g. RO MoRTH Mumbai" /></label>
        <label>Category *<select id="directory-category" required>${DIRECTORY_CATEGORIES.map(([value,label])=>`<option value="${value}">${label}</option>`).join("")}</select></label>
        <label>Email<input id="directory-email" type="email" placeholder="Official email, if available" /></label>
        <label>Phone<input id="directory-phone" placeholder="Official contact number" /></label>
        <label>Address<textarea id="directory-address" rows="2"></textarea></label>
        <label>Display priority<input id="directory-order" type="number" min="1" step="1" value="999" /></label>
        <label style="display:flex;grid-template-columns:auto 1fr;align-items:center;gap:10px;"><input id="directory-frequent" type="checkbox" style="width:auto;" />Show under frequently used</label>
        <label style="display:flex;grid-template-columns:auto 1fr;align-items:center;gap:10px;"><input id="directory-active" type="checkbox" style="width:auto;" checked />Active</label>
        <label>Remarks<textarea id="directory-remarks" rows="2"></textarea></label>
      </div>
      <p id="directory-error" class="form-error"></p>
      <div class="modal-actions"><button class="btn secondary" type="button" data-dialog-close>Cancel</button><button class="btn primary" id="directory-save" type="submit">Save entry</button></div>
    </form>
  </dialog>`;
}


function jurisdictionSection() {
  return `<section class="admin-card"><div class="admin-card-heading"><div><h2>Project jurisdiction</h2><p>Only officers mapped here can receive actions for that project.</p></div><button class="btn primary" id="add-jurisdiction-button">${icon("plus")}Add jurisdiction</button></div><div class="jurisdiction-list" style="padding:18px 20px;">${state.projectJurisdictions.length ? state.projectJurisdictions.map((item)=>{const user=state.adminUsers.find((u)=>u.id===item.user_id);const project=state.projects.find((p)=>p.id===item.project_id);return `<div class="jurisdiction-row"><div><strong>${escapeHtml(user?.full_name||"User")} — ${escapeHtml(project?.project_name||"Project")}</strong><span>${escapeHtml(item.access_type)} · ${item.can_receive_actions?"Can receive actions":"View only"}</span></div><button class="btn secondary remove-jurisdiction-button" data-id="${item.id}">Remove</button></div>`;}).join("") : `<div class="empty-state"><h3>No project jurisdiction mapped</h3><p>Add officers to the projects under their jurisdiction.</p></div>`}</div></section>
  <dialog id="jurisdiction-dialog" class="modal compact-modal"><form id="jurisdiction-form" class="modal-card" novalidate><div class="modal-heading"><div><p class="eyebrow">Project jurisdiction</p><h2>Add officer jurisdiction</h2></div><button class="icon-button" type="button" data-dialog-close>${icon("close")}</button></div><div class="form-grid single"><label>Officer<select id="jurisdiction-user" required>${state.adminUsers.filter((u)=>u.account_status==="approved"&&u.is_active).map((u)=>`<option value="${u.id}">${escapeHtml(u.full_name)} — ${escapeHtml(u.designation||"User")}</option>`).join("")}</select></label><label>Project<select id="jurisdiction-project" required>${state.projects.map((p)=>`<option value="${p.id}">${escapeHtml(p.project_name)}</option>`).join("")}</select></label><label>Access type<select id="jurisdiction-type"><option value="jurisdiction">Regular jurisdiction</option><option value="additional_charge">Additional charge</option><option value="explicit">Explicit project access</option></select></label><label style="display:flex;grid-template-columns:auto 1fr;gap:9px;align-items:center;"><input id="jurisdiction-can-receive" type="checkbox" checked style="width:auto;"/>Can receive actions</label></div><p id="jurisdiction-error" class="form-error"></p><div class="modal-actions"><button class="btn secondary" type="button" data-dialog-close>Cancel</button><button class="btn primary" id="jurisdiction-save" type="submit">Save jurisdiction</button></div></form></dialog>`;
}
function administrationTemplate() {
  const users = state.adminUsers;
  const pending = users.filter((user) => user.account_status === "pending").length;
  const active = users.filter((user) => user.is_active).length;
  const admins = users.filter((user) => user.role === "admin").length;
  const additional = state.assignments.filter((item) => item.is_active && !item.is_primary).length;
  return `<div class="app-shell">${appHeader()}${sidebar("admin")}
    <main class="main-content admin-page">
      <div class="breadcrumb"><span>Dashboard</span><b>/</b>Administration</div>
      <div class="admin-heading"><div><h1>Administration</h1><p>Approve users, assign access levels, offices and additional-charge posts.</p></div></div>
      <section class="admin-metrics">
        <div class="admin-metric"><span>Total users</span><strong>${users.length}</strong></div>
        <div class="admin-metric"><span>Pending approval</span><strong>${pending}</strong></div>
        <div class="admin-metric"><span>Active users</span><strong>${active}</strong></div>
        <div class="admin-metric"><span>Additional charges</span><strong>${additional}</strong></div>
      </section>
      <section class="admin-card">
        <div class="admin-card-heading"><div><h2>User access and approval</h2><p>Changes take effect the next time the user refreshes or signs in.</p></div><span class="status-pill approved">${admins} administrator${admins === 1 ? "" : "s"}</span></div>
        <div class="admin-table-scroll"><table class="admin-table"><thead><tr><th>User</th><th>Designation</th><th>Office</th><th>Access role</th><th>Approval</th><th>Active</th><th>Posts</th><th>Actions</th></tr></thead><tbody>
          ${users.map((user) => `<tr data-user-row="${user.id}">
            <td><strong>${escapeHtml(user.full_name || "New User")}</strong><span>${escapeHtml(user.email || "Email unavailable")}</span></td>
            <td><select data-field="designation">${designationOptions(user.designation || "")}</select></td>
            <td><select data-field="office_id">${officeOptions(user.office_id || "")}</select></td>
            <td><select data-field="role">${roleOptions(user.role)}</select></td>
            <td><select data-field="account_status">${statusOptions(user.account_status)}</select><span class="status-pill ${user.account_status}">${user.account_status}</span></td>
            <td><input data-field="is_active" type="checkbox" ${user.is_active ? "checked" : ""} aria-label="Active user" /></td>
            <td><span>${escapeHtml(assignmentSummary(user.id))}</span></td>
            <td><div class="admin-actions"><button class="btn primary save-user-button" data-user-id="${user.id}">Save</button><button class="btn secondary add-charge-button" data-user-id="${user.id}" data-user-name="${escapeHtml(user.full_name || "User")}">Add post</button></div></td>
          </tr>`).join("")}
        </tbody></table></div>
      </section>
      <section class="admin-card">
        <div class="admin-card-heading"><div><h2>Current post assignments</h2><p>Primary and additional-charge assignments retained for audit and role switching.</p></div></div>
        <div class="assignment-list" style="padding:18px 20px;">
          ${state.assignments.length ? state.assignments.map((item) => {
            const user = users.find((user) => user.id === item.user_id);
            const office = state.offices.find((office) => office.id === item.office_id);
            return `<div class="assignment-item"><div><strong>${escapeHtml(user?.full_name || "User")} — ${escapeHtml(item.designation)}</strong><span>${escapeHtml(office?.name || "Office")} · ${item.is_primary ? "Primary/Substantive" : "Additional charge"}${item.effective_from ? ` · From ${formatDate(item.effective_from)}` : ""}${item.effective_to ? ` to ${formatDate(item.effective_to)}` : ""}${item.order_reference ? ` · Order: ${escapeHtml(item.order_reference)}` : ""}</span></div><button class="btn secondary assignment-toggle" data-assignment-id="${item.id}" data-next-active="${item.is_active ? "false" : "true"}">${item.is_active ? "Deactivate" : "Reactivate"}</button></div>`;
          }).join("") : `<div class="empty-state"><h3>No assignments recorded</h3><p>Add a primary or additional-charge post from the user table.</p></div>`}
        </div>
      </section>
      <section class="admin-card">
        <div class="admin-card-heading"><div><h2>Official office and organisation directory</h2><p>Frequently used entries appear first in correspondence dropdowns; all others are alphabetical.</p></div><button class="btn primary" id="add-directory-button">${icon("plus")}Add entry</button></div>
        <div style="padding:18px 20px;">${directoryEntityCards()}</div>
      </section>
      ${jurisdictionSection()}
    </main>
    ${directoryDialog()}
    <dialog id="assignment-dialog" class="modal compact-modal"><form id="assignment-form" class="modal-card" novalidate>
      <div class="modal-heading"><div><p class="eyebrow">User assignment</p><h2>Add post / additional charge</h2><p id="assignment-user-label"></p></div><button class="icon-button" type="button" data-dialog-close>${icon("close")}</button></div>
      <input type="hidden" id="assignment-user-id" />
      <div class="form-grid single">
        <label>Designation<select id="assignment-designation" required>${designationOptions()}</select></label>
        <label>Office<select id="assignment-office" required>${officeOptions()}</select></label>
        <label>Assignment type<select id="assignment-type" required><option value="additional">Additional charge</option><option value="substantive">Substantive/Primary</option><option value="temporary">Temporary duty</option></select></label>
        <label>Effective from<input id="assignment-from" type="date" /></label>
        <label>Effective to<input id="assignment-to" type="date" /></label>
        <label>Order/reference<input id="assignment-order" placeholder="Order number or reference" /></label>
      </div>
      <p id="assignment-error" class="form-error"></p>
      <div class="modal-actions"><button class="btn secondary" type="button" data-dialog-close>Cancel</button><button class="btn primary" id="assignment-save" type="submit">Save assignment</button></div>
    </form></dialog>
  </div>`;
}

async function renderAdministration() {
  if (state.profile?.role !== "admin") {
    showToast("Administrator access is required.", "error");
    location.hash = "#projects";
    return;
  }
  root.innerHTML = `<div class="loading-screen"><span class="spinner dark"></span><p>Loading administration...</p></div>`;
  try {
    [state.adminUsers, state.assignments, state.directoryEntities, state.projectJurisdictions] = await Promise.all([getAdminUsers(), getUserAssignments(), getDirectoryEntities(true), getProjectJurisdictions()]);
    root.innerHTML = administrationTemplate();
    bindAdministrationEvents();
  } catch (error) {
    root.innerHTML = `<div class="loading-screen"><p>${escapeHtml(error.message)}</p><button class="btn primary" id="back-admin-error">Back to projects</button></div>`;
    document.querySelector("#back-admin-error")?.addEventListener("click", () => location.hash = "#projects");
  }
}

function bindAdministrationEvents() {
  bindCommonEvents();
  document.querySelectorAll(".save-user-button").forEach((button) => button.addEventListener("click", async () => {
    const row = button.closest("tr");
    const userId = button.dataset.userId;
    const officeId = row.querySelector('[data-field="office_id"]').value || null;
    const officeName = state.offices.find((office) => office.id === officeId)?.name || null;
    const payload = {
      designation: row.querySelector('[data-field="designation"]').value || null,
      office_id: officeId,
      office_name: officeName,
      role: row.querySelector('[data-field="role"]').value,
      account_status: row.querySelector('[data-field="account_status"]').value,
      is_active: row.querySelector('[data-field="is_active"]').checked,
    };
    if (payload.account_status === "approved") {
      payload.approved_at = new Date().toISOString();
      payload.approved_by = state.session?.user?.id || null;
    }
    setButtonLoading(button, true, "Saving...");
    try {
      await updateAdminUser(userId, payload);
      showToast("User access updated.");
      await renderAdministration();
    } catch (error) { showToast(error.message, "error"); }
    finally { setButtonLoading(button, false); }
  }));

  const dialog = document.querySelector("#assignment-dialog");
  document.querySelectorAll(".add-charge-button").forEach((button) => button.addEventListener("click", () => {
    document.querySelector("#assignment-user-id").value = button.dataset.userId;
    document.querySelector("#assignment-user-label").textContent = `Assigning a post to ${button.dataset.userName}`;
    document.querySelector("#assignment-form").reset();
    document.querySelector("#assignment-user-id").value = button.dataset.userId;
    dialog.showModal();
  }));

  document.querySelector("#assignment-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.checkValidity()) { form.reportValidity(); return; }
    const button = document.querySelector("#assignment-save");
    const error = document.querySelector("#assignment-error");
    const type = document.querySelector("#assignment-type").value;
    setButtonLoading(button, true, "Saving..."); error.textContent = "";
    try {
      await createUserAssignment({
        user_id: document.querySelector("#assignment-user-id").value,
        designation: document.querySelector("#assignment-designation").value,
        office_id: document.querySelector("#assignment-office").value,
        assignment_type: type,
        is_primary: type === "substantive",
        effective_from: document.querySelector("#assignment-from").value || null,
        effective_to: document.querySelector("#assignment-to").value || null,
        order_reference: document.querySelector("#assignment-order").value.trim() || null,
        is_active: true,
      });
      dialog.close(); showToast("Post assignment saved."); await renderAdministration();
    } catch (err) { error.textContent = err.message; }
    finally { setButtonLoading(button, false); }
  });

  document.querySelectorAll(".assignment-toggle").forEach((button) => button.addEventListener("click", async () => {
    setButtonLoading(button, true, "Saving...");
    try { await setAssignmentActive(button.dataset.assignmentId, button.dataset.nextActive === "true"); showToast("Assignment updated."); await renderAdministration(); }
    catch (error) { showToast(error.message, "error"); }
    finally { setButtonLoading(button, false); }
  }));

  const directoryDialogElement = document.querySelector("#directory-dialog");
  const resetDirectoryForm = () => {
    document.querySelector("#directory-form")?.reset();
    document.querySelector("#directory-id").value = "";
    document.querySelector("#directory-dialog-title").textContent = "Add office / organisation";
    document.querySelector("#directory-order").value = "999";
    document.querySelector("#directory-active").checked = true;
    document.querySelector("#directory-error").textContent = "";
  };

  document.querySelector("#add-directory-button")?.addEventListener("click", () => {
    resetDirectoryForm();
    directoryDialogElement.showModal();
  });

  document.querySelectorAll(".edit-directory-button").forEach((button) => button.addEventListener("click", () => {
    const entity = state.directoryEntities.find((item) => item.id === button.dataset.directoryId);
    if (!entity) return;
    resetDirectoryForm();
    document.querySelector("#directory-dialog-title").textContent = "Edit office / organisation";
    document.querySelector("#directory-id").value = entity.id;
    document.querySelector("#directory-name").value = entity.name || "";
    document.querySelector("#directory-short-name").value = entity.short_name || "";
    document.querySelector("#directory-category").value = entity.category || "other";
    document.querySelector("#directory-email").value = entity.email || "";
    document.querySelector("#directory-phone").value = entity.phone || "";
    document.querySelector("#directory-address").value = entity.address || "";
    document.querySelector("#directory-order").value = entity.display_order ?? 999;
    document.querySelector("#directory-frequent").checked = Boolean(entity.is_frequent);
    document.querySelector("#directory-active").checked = Boolean(entity.is_active);
    document.querySelector("#directory-remarks").value = entity.remarks || "";
    directoryDialogElement.showModal();
  }));

  document.querySelector("#directory-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.checkValidity()) { form.reportValidity(); return; }
    const button = document.querySelector("#directory-save");
    const error = document.querySelector("#directory-error");
    const id = document.querySelector("#directory-id").value;
    const value = (selector) => document.querySelector(selector)?.value?.trim() || null;
    const payload = {
      name: value("#directory-name"),
      short_name: value("#directory-short-name"),
      category: value("#directory-category") || "other",
      email: value("#directory-email"),
      phone: value("#directory-phone"),
      address: value("#directory-address"),
      display_order: Number(document.querySelector("#directory-order").value || 999),
      is_frequent: document.querySelector("#directory-frequent").checked,
      is_active: document.querySelector("#directory-active").checked,
      remarks: value("#directory-remarks"),
    };
    setButtonLoading(button, true, "Saving..."); error.textContent = "";
    try {
      if (id) await updateDirectoryEntity(id, payload);
      else await createDirectoryEntity(payload);
      directoryDialogElement.close();
      showToast(id ? "Directory entry updated." : "Directory entry added.");
      await renderAdministration();
    } catch (err) { error.textContent = err.message; }
    finally { setButtonLoading(button, false); }
  });

  document.querySelectorAll(".toggle-directory-button").forEach((button) => button.addEventListener("click", async () => {
    setButtonLoading(button, true, "Saving...");
    try { await updateDirectoryEntity(button.dataset.directoryId, { is_active: button.dataset.nextActive === "true" }); showToast("Directory entry updated."); await renderAdministration(); }
    catch (error) { showToast(error.message, "error"); } finally { setButtonLoading(button, false); }
  }));

  const jurisdictionDialog = document.querySelector("#jurisdiction-dialog");
  document.querySelector("#add-jurisdiction-button")?.addEventListener("click",()=>jurisdictionDialog.showModal());
  document.querySelector("#jurisdiction-form")?.addEventListener("submit",async(event)=>{event.preventDefault();const form=event.currentTarget;if(!form.checkValidity()){form.reportValidity();return;}const button=document.querySelector("#jurisdiction-save");const error=document.querySelector("#jurisdiction-error");setButtonLoading(button,true,"Saving...");error.textContent="";try{await createProjectJurisdiction({user_id:document.querySelector("#jurisdiction-user").value,project_id:document.querySelector("#jurisdiction-project").value,access_type:document.querySelector("#jurisdiction-type").value,can_receive_actions:document.querySelector("#jurisdiction-can-receive").checked,is_active:true});jurisdictionDialog.close();showToast("Project jurisdiction saved.");await renderAdministration();}catch(err){error.textContent=err.message;}finally{setButtonLoading(button,false);}});
  document.querySelectorAll(".remove-jurisdiction-button").forEach((button)=>button.addEventListener("click",async()=>{setButtonLoading(button,true,"Removing...");try{await deactivateProjectJurisdiction(button.dataset.id);showToast("Jurisdiction removed.");await renderAdministration();}catch(error){showToast(error.message,"error");}finally{setButtonLoading(button,false);}}));
}
