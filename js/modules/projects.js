function projectMetrics(projects) {
  const construction = projects.filter((p) => p.status === "construction").length;
  const pending = projects.reduce((sum, p) => sum + Number(p.pending_actions_count || 0), 0);
  const completed = projects.filter((p) => ["completed", "closed", "maintenance"].includes(p.status)).length;
  return [
    ["folder", "Total Projects", projects.length, "blue"],
    ["construction", "Under Construction", construction, "teal"],
    ["clipboard", "Pending Actions", pending, "amber"],
    ["check", "Completed / Maintenance", completed, "green"],
  ];
}

function filteredProjects() {
  const { query, highway, status, office } = state.filters;
  return state.projects.filter((project) => {
    const searchText = `${project.project_name} ${project.project_code || ""} ${project.highway_number || ""}`.toLowerCase();
    return (!query || searchText.includes(query.toLowerCase()))
      && (highway === "all" || project.highway_number === highway)
      && (status === "all" || project.status === status)
      && (office === "all" || project.implementing_office_name === office);
  });
}

function progressBar(value) {
  const percentage = Math.min(100, Math.max(0, Number(value || 0)));
  return `<div class="progress-cell"><strong>${percentage.toFixed(0)}%</strong><div class="progress-track"><span style="width:${percentage}%"></span></div></div>`;
}

function projectRows(projects) {
  if (!projects.length) {
    return `<div class="empty-state">${icon("projects", 42)}<h3>No matching projects</h3><p>Adjust the filters or add a new project.</p></div>`;
  }
  return `<div class="table-scroll"><table class="data-table"><thead><tr><th>Project</th><th>Highway</th><th>Stage</th><th>Progress</th><th>Health</th><th>Updated</th><th></th></tr></thead><tbody>${projects.map((project) => `
    <tr data-project-id="${project.id}" tabindex="0">
      <td><strong>${escapeHtml(project.project_name)}</strong><span>${escapeHtml(project.project_code || project.description || "")}</span></td>
      <td>${escapeHtml(project.highway_number || "—")}</td>
      <td><strong>${escapeHtml(project.status_label || project.status)}</strong><span>${escapeHtml(project.mode || "")}</span></td>
      <td>${progressBar(project.physical_progress_pct)}</td>
      <td><span class="status-badge ${healthClass(project.health_label)}"><i></i>${escapeHtml(project.health_label || "In Progress")}</span></td>
      <td><strong>${formatDate(project.updated_at)}</strong><span>${escapeHtml(state.profile?.full_name || "MARGDARSHI")}</span></td>
      <td><button class="icon-button row-menu" aria-label="Project actions">${icon("menu")}</button></td>
    </tr>`).join("")}</tbody></table></div>`;
}

function projectRegisterTemplate() {
  const projects = filteredProjects();
  const metrics = projectMetrics(state.projects);
  const highwayOptions = [...new Set(state.projects.map((p) => p.highway_number).filter(Boolean))].sort();
  const officeOptions = [...new Set(state.projects.map((p) => p.implementing_office_name).filter(Boolean))].sort();
  const canEdit = ["admin", "editor"].includes(state.profile?.role);
  return `<div class="app-shell">${appHeader()}${sidebar("projects")}
    <main class="main-content register-page">
      <section class="content-column">
        <div class="breadcrumb"><span>Dashboard</span><b>/</b>Project Register</div>
        <div class="page-heading"><div><h1>Project Register</h1><p>View and manage projects under ${escapeHtml(currentOfficeName())}.</p></div>${canEdit ? `<button class="btn primary" id="add-project-button">${icon("plus")}Add Project</button>` : ""}</div>
        <div class="filter-card">
          <div class="search-input">${icon("search", 18)}<input id="project-search" value="${escapeHtml(state.filters.query)}" placeholder="Search projects..." /></div>
          <label class="select-field"><span>Highway</span><select id="highway-filter"><option value="all">All</option>${highwayOptions.map((v) => `<option ${state.filters.highway === v ? "selected" : ""}>${escapeHtml(v)}</option>`).join("")}</select></label>
          <label class="select-field"><span>Status</span><select id="status-filter"><option value="all">All</option>${[["planning","Planning"],["tender","Tender"],["awarded","Awarded"],["construction","Under Construction"],["maintenance","Maintenance"],["completed","Completed"],["held","On Hold"],["closed","Closed"]].map(([v,l]) => `<option value="${v}" ${state.filters.status === v ? "selected" : ""}>${l}</option>`).join("")}</select></label>
          <label class="select-field"><span>Office</span><select id="office-filter"><option value="all">All</option>${officeOptions.map((v) => `<option ${state.filters.office === v ? "selected" : ""}>${escapeHtml(v)}</option>`).join("")}</select></label>
          <button class="btn reset" id="reset-filters">${icon("reset", 18)}Reset</button>
        </div>
        <section class="table-card" id="project-table">${projectRows(projects)}<div class="table-footer">Showing ${projects.length} of ${state.projects.length} projects</div></section>
      </section>
      <aside class="insights-column">
        <section class="insight-card"><h2>Overview</h2>${metrics.map(([ic,label,value,tone]) => `<div class="metric-row"><div class="metric-icon ${tone}">${icon(ic)}</div><div><span>${label}</span><strong>${value}</strong></div></div>`).join("")}</section>
        <section class="insight-card"><div class="card-title-row"><h2>Pending Actions</h2><button>View all</button></div>${[["Land Acquisition",5,"amber"],["Contractor Submissions",4,"orange"],["Utility Clearances",3,"blue"],["Court / Legal",2,"red"],["Measurements",2,"teal"]].map(([label,count,tone]) => `<div class="action-row"><span><i class="dot ${tone}"></i>${label}</span><b>${count}</b>${icon("arrow",16)}</div>`).join("")}</section>
        ${state.demo ? `<section class="demo-banner"><strong>Preview mode</strong><p>This screen uses sample project data. Sign in to view the live Supabase database.</p><a href="./">Return to login</a></section>` : ""}
      </aside>
    </main>
    ${addProjectDialog()}
  </div>`;
}

function addProjectDialog() {
  return `<dialog id="project-dialog" class="modal">
    <form id="project-form" class="modal-card" novalidate>
      <div class="modal-heading"><div><p class="eyebrow">Project Register</p><h2>Add Project</h2><p>Create the basic record now; remaining details can be added later.</p></div><button class="icon-button" id="project-close-button" type="button" data-dialog-close aria-label="Close">${icon("close")}</button></div>
      <div class="form-section"><h3>Basic information</h3><div class="form-grid">
        <label class="wide">Project name *<input id="project-name" required placeholder="e.g. NH-753B Package-2: Nandurbar–Taloda" /></label>
        <label>Project code<input id="project-code" placeholder="e.g. NH753B-PKG2" /></label>
        <label>Mode<select id="project-mode"><option value="">Select</option>${["EPC","HAM","BOT","PBMC","STMC","DPR","Other"].map(v=>`<option>${v}</option>`).join("")}</select></label>
        <label>Highway *<select id="project-highway" required><option value="">Select highway</option>${state.highways.map(h=>`<option value="${h.id}">${escapeHtml(h.highway_number)}${h.highway_name ? ` — ${escapeHtml(h.highway_name)}` : ""}</option>`).join("")}</select></label>
        <label>Implementing office *<select id="project-office" required><option value="">Select office</option>${state.offices.map(o=>`<option value="${o.id}">${escapeHtml(o.name)}</option>`).join("")}</select></label>
        <label>Status *<select id="project-status" required><option value="planning">Planning</option><option value="tender">Tender</option><option value="awarded">Awarded</option><option value="construction">Under Construction</option><option value="maintenance">Maintenance</option><option value="completed">Completed</option><option value="held">On Hold</option><option value="closed">Closed</option></select></label>
      </div></div>
      <div class="form-section"><h3>Project details</h3><div class="form-grid">
        <label>Start chainage (km)<input id="project-start-chainage" type="number" min="0" step="0.001" /></label>
        <label>End chainage (km)<input id="project-end-chainage" type="number" min="0" step="0.001" /></label>
        <label>Sanctioned cost (₹ crore)<input id="project-cost" type="number" min="0" step="0.01" /></label>
        <label>Scheduled completion<input id="project-completion" type="date" /></label>
        <label class="wide">Description<textarea id="project-description" rows="3" placeholder="Brief scope and important context"></textarea></label>
      </div></div>
      <p id="project-error" class="form-error"></p>
      <div class="modal-actions"><button class="btn secondary" id="project-cancel-button" type="button" data-dialog-close>Cancel</button><button class="btn primary" id="save-project-button" type="submit">Save Project</button></div>
    </form>
  </dialog>`;
}




function projectDocumentsModule(project){
  const correspondenceDocs=state.correspondence
    .filter(item=>item.project_id===project.id&&item.attachment_path)
    .map(item=>({
      kind:"Correspondence attachment",
      title:item.attachment_name||item.subject||"Attachment",
      detail:`${item.letter_number||"No letter number"} · ${item.subject||"Correspondence"}`,
      date:item.letter_date||item.created_at,
      source:"correspondence",
      id:item.id,
      size:item.attachment_size_bytes,
      mime:item.attachment_mime_type
    }));
  const inspectionDocs=state.inspectionPhotos
    .filter(photo=>state.inspections.some(i=>i.id===photo.inspection_id&&i.project_id===project.id))
    .map(photo=>{
      const inspection=state.inspections.find(i=>i.id===photo.inspection_id);
      return{
        kind:"Inspection photograph",
        title:photo.file_name||"Inspection photograph",
        detail:`${(inspection?.inspection_type||"general").replaceAll("_"," ")} · ${chainageLabel(inspection||{})}`,
        date:photo.uploaded_at||inspection?.inspection_date,
        source:"inspection",
        id:photo.id,
        inspectionId:photo.inspection_id,
        size:photo.size_bytes,
        mime:photo.mime_type
      };
    });
  const docs=[...correspondenceDocs,...inspectionDocs].sort((a,b)=>new Date(b.date||0)-new Date(a.date||0));
  return`<div><div class="module-header"><div><h2>Documents</h2><p>Project-related correspondence attachments and inspection photographs.</p></div><span>${docs.length} file${docs.length===1?"":"s"}</span></div>
    ${docs.length?`<div class="project-documents">${docs.map(doc=>`<div class="project-document-row"><div><strong>${escapeHtml(doc.title)}</strong><span>${escapeHtml(doc.kind)} · ${escapeHtml(doc.detail)}</span><small>${formatDate(doc.date)}${doc.size?` · ${formatFileSize(doc.size)}`:""}${doc.mime?` · ${escapeHtml(doc.mime)}`:""}</small></div><div class="document-actions"><button class="btn secondary project-document-open" data-source="${doc.source}" data-id="${doc.id}" data-inspection-id="${doc.inspectionId||""}">Open</button></div></div>`).join("")}</div>`:`<div class="module-empty">${icon("document",42)}<h2>No project files yet</h2><p>Attachments added through Correspondence and photographs added through Inspections will appear here automatically.</p></div>`}
  </div>`;
}
function projectTimelineModule(project){
  const events=[];
  state.correspondence.filter(i=>i.project_id===project.id).forEach(i=>events.push({date:i.letter_date||i.created_at,title:i.subject||"Correspondence",detail:`${i.direction||"Correspondence"} · ${i.letter_number||"No letter number"}`,type:"Correspondence"}));
  state.actionItems.filter(i=>i.project_id===project.id).forEach(i=>events.push({date:i.created_at,title:i.title,detail:`Action issued · ${actionStatusLabel(i.status)}${i.due_date?` · Due ${formatDate(i.due_date)}`:""}`,type:"Action"}));
  state.inspections.filter(i=>i.project_id===project.id).forEach(i=>events.push({date:i.inspection_date||i.created_at,title:`${(i.inspection_type||"general").replaceAll("_"," ")} inspection`,detail:`${chainageLabel(i)} · ${inspectionStatusLabel(i.status)}`,type:"Inspection"}));
  (state.calendarEvents||[]).filter(i=>i.project_id===project.id).forEach(i=>events.push({date:i.start_date||i.event_date||i.start_time||i.date,title:i.title||i.event_title||"Calendar event",detail:i.description||i.event_type||"Milestone",type:"Calendar"}));
  const sorted=events.filter(e=>e.date).sort((a,b)=>new Date(b.date)-new Date(a.date));
  return`<div><div class="module-header"><div><h2>Project timeline</h2><p>Chronological history compiled from correspondence, actions, inspections, and calendar milestones.</p></div><span>${sorted.length} event${sorted.length===1?"":"s"}</span></div>
    ${sorted.length?`<div class="timeline-list">${sorted.map(e=>`<div class="timeline-item"><strong>${escapeHtml(e.title)}</strong><span>${escapeHtml(e.detail)}</span><small>${escapeHtml(e.type)} · ${formatDate(e.date)}</small></div>`).join("")}</div>`:`<div class="module-empty">${icon("timeline",42)}<h2>No timeline events yet</h2><p>Project activity will appear here automatically as records are added.</p></div>`}
  </div>`;
}
function bindProjectDocumentEvents(){
  document.querySelectorAll(".project-document-open").forEach(button=>button.addEventListener("click",async()=>{
    try{
      if(button.dataset.source==="correspondence"){
        const item=state.correspondence.find(i=>i.id===button.dataset.id);
        await openCorrespondenceAttachment(item);
      }else{
        const photo=state.inspectionPhotos.find(i=>i.id===button.dataset.id);
        await openInspectionPhoto(photo);
      }
    }catch(error){showToast(error.message,"error");}
  }));
}

function workspaceTemplate(project) {
  if (!project) return `<div class="app-shell">${appHeader()}${sidebar("projects")}<main class="main-content"><div class="empty-state"><h2>Project not found</h2><button class="btn primary" id="back-to-register">Back to Project Register</button></div></main></div>`;
  return `<div class="app-shell">${appHeader()}${sidebar("projects")}
    <main class="main-content workspace-page">
      <section class="workspace-header">
        <button class="back-link" id="back-to-register">${icon("back",18)}Project Register</button>
        <div class="workspace-title-row"><div><div class="workspace-meta"><span>${escapeHtml(project.highway_number || "National Highway")}</span><b>·</b><span>${escapeHtml(project.mode || "Project")}</span><b>·</b><span>${escapeHtml(project.status_label || project.status)}</span></div><h1>${escapeHtml(project.project_name)}</h1><p>${escapeHtml(project.description || "Project workspace for administration, monitoring and review readiness.")}</p></div><span class="status-badge ${healthClass(project.health_label)} large"><i></i>${escapeHtml(project.health_label || "In Progress")}</span></div>
        <div class="workspace-stat-grid">
          <div><span>Physical progress</span><strong>${Number(project.physical_progress_pct || 0).toFixed(0)}%</strong>${progressBar(project.physical_progress_pct)}</div>
          <div><span>Financial progress</span><strong>${Number(project.financial_progress_pct || 0).toFixed(0)}%</strong>${progressBar(project.financial_progress_pct)}</div>
          <div><span>Sanctioned cost</span><strong>${formatMoneyCrore(project.sanctioned_cost_crore)}</strong><small>Project value</small></div>
          <div><span>Pending actions</span><strong>${Number(project.pending_actions_count || 0)}</strong><small>Items requiring attention</small></div>
        </div>
      </section>
      <section class="workspace-body">
        <nav class="tabs" role="tablist">${[["overview","Overview","dashboard"],["correspondence","Correspondence","mail"],["actions","Actions","clipboard"],["inspections","Inspections","inspection"],["documents","Documents","document"],["timeline","Timeline","timeline"]].map(([key,label,ic],i)=>`<button class="tab ${i===0?"active":""}" data-tab="${key}">${icon(ic,18)}${label}</button>`).join("")}</nav>
        <div id="workspace-tab-content" class="tab-content">${workspaceOverview(project)}</div>
      </section>
    </main>
  </div>`;
}

function workspaceOverview(project) {
  return `<div class="overview-layout"><section class="panel"><div class="panel-heading"><h2>Project overview</h2><button class="text-button">Edit details</button></div><dl class="detail-list">
    <div><dt>Project code</dt><dd>${escapeHtml(project.project_code || "—")}</dd></div><div><dt>Highway</dt><dd>${escapeHtml(project.highway_number || "—")}</dd></div><div><dt>Mode</dt><dd>${escapeHtml(project.mode || "—")}</dd></div><div><dt>Implementing office</dt><dd>${escapeHtml(project.implementing_office_name || "—")}</dd></div><div><dt>Start chainage</dt><dd>${project.start_chainage_km ?? "—"}</dd></div><div><dt>End chainage</dt><dd>${project.end_chainage_km ?? "—"}</dd></div><div><dt>Scheduled completion</dt><dd>${formatDate(project.scheduled_completion_date)}</dd></div><div><dt>Last updated</dt><dd>${formatDate(project.updated_at)}</dd></div>
  </dl></section><aside class="panel"><div class="panel-heading"><h2>Immediate attention</h2></div><div class="attention-list"><div><i class="dot amber"></i><span><strong>Land acquisition review</strong><small>Update village-wise readiness and possession.</small></span></div><div><i class="dot blue"></i><span><strong>Latest correspondence</strong><small>Check replies due to higher offices.</small></span></div><div><i class="dot teal"></i><span><strong>Progress update</strong><small>Record the latest physical and financial status.</small></span></div></div></aside></div>`;
}

function emptyModule(title, description, iconName) {
  return `<div class="module-empty">${icon(iconName,42)}<h2>${title}</h2><p>${description}</p><button class="btn primary">Add first record</button></div>`;
}

async function renderWorkspace(projectId) {
  root.innerHTML = `<div class="loading-screen"><span class="spinner dark"></span><p>Opening project workspace...</p></div>`;
  let project;
  if (state.demo) project = state.projects.find((item) => item.id === projectId);
  else {
    try {
      [project, state.correspondence, state.actionItems, state.assignableUsers, state.projectJurisdictions, state.actionAssignees, state.actionProgressUpdates, state.actionWorkflowEvents, state.inspections, state.inspectionPhotos, state.calendarEvents] = await Promise.all([getProject(projectId), getCorrespondence(projectId), getActionItems(projectId), getAssignableUsers(), getProjectJurisdictions(), getActionAssignees(), getActionProgressUpdates(), getActionWorkflowEvents(), getInspections(projectId), getInspectionPhotos(), getCalendarEvents()]);
    } catch (error) { showToast(error.message, "error"); }
  }
  root.innerHTML = workspaceTemplate(project);
  bindCommonEvents();
  document.querySelector("#back-to-register")?.addEventListener("click", () => { location.hash = "#projects"; });
  document.querySelectorAll(".tab").forEach((button) => button.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((tab) => tab.classList.remove("active"));
    button.classList.add("active");
    const target = document.querySelector("#workspace-tab-content");
    const key = button.dataset.tab;
    target.innerHTML = key === "overview" ? workspaceOverview(project)
      : key === "correspondence" ? projectCorrespondenceModule(project)
      : key === "actions" ? projectActionsModule(project)
      : key === "inspections" ? projectInspectionsModule(project)
      : key === "documents" ? projectDocumentsModule(project)
      : projectTimelineModule(project);
    if (key === "documents") bindProjectDocumentEvents();
    if (key === "inspections") { bindInspectionEvents(async()=>{[state.inspections,state.inspectionPhotos]=await Promise.all([getInspections(project.id),getInspectionPhotos()]);document.querySelector("#workspace-tab-content").innerHTML=projectInspectionsModule(project);bindInspectionEvents(async()=>{location.hash=`#project/${project.id}`;});}); }
    if (key === "actions") {
      bindActionEvents(async () => {
        state.actionItems = await getActionItems(project.id);
        document.querySelector("#workspace-tab-content").innerHTML = projectActionsModule(project);
        bindActionEvents(async () => { location.hash = `#project/${project.id}`; });
      });
    }
    if (key === "correspondence") {
      document.querySelector("#add-project-correspondence")?.addEventListener("click", () => document.querySelector("#correspondence-dialog").showModal());
      bindCorrespondenceDialogEvents(async () => {
        state.correspondence = await getCorrespondence(project.id);
        document.querySelector("#workspace-tab-content").innerHTML = projectCorrespondenceModule(project);
        document.querySelector("#add-project-correspondence")?.addEventListener("click", () => document.querySelector("#correspondence-dialog").showModal());
        bindCorrespondenceDialogEvents(async () => { location.hash = `#project/${project.id}`; });
        bindCorrespondenceStatusButtons(async () => { location.hash = `#project/${project.id}`; });
      });
      bindCorrespondenceStatusButtons(async () => {
        state.correspondence = await getCorrespondence(project.id);
        document.querySelector("#workspace-tab-content").innerHTML = projectCorrespondenceModule(project);
      });
    }
  }));
}




function bindRegisterEvents() {
  bindCommonEvents();
  const rerenderRows = () => {
    document.querySelector("#project-table").innerHTML = `${projectRows(filteredProjects())}<div class="table-footer">Showing ${filteredProjects().length} of ${state.projects.length} projects</div>`;
    bindRowEvents();
  };
  document.querySelector("#project-search")?.addEventListener("input", (event) => { state.filters.query = event.target.value; rerenderRows(); });
  document.querySelector("#highway-filter")?.addEventListener("change", (event) => { state.filters.highway = event.target.value; rerenderRows(); });
  document.querySelector("#status-filter")?.addEventListener("change", (event) => { state.filters.status = event.target.value; rerenderRows(); });
  document.querySelector("#office-filter")?.addEventListener("change", (event) => { state.filters.office = event.target.value; rerenderRows(); });
  document.querySelector("#reset-filters")?.addEventListener("click", () => {
    state.filters = { query: "", highway: "all", status: "all", office: "all" };
    renderRegister();
  });
  document.querySelector("#add-project-button")?.addEventListener("click", () => document.querySelector("#project-dialog").showModal());
  const projectDialog = document.querySelector("#project-dialog");
  const closeProject = (event) => { event.preventDefault(); event.stopPropagation(); projectDialog?.close(); };
  document.querySelector("#project-close-button")?.addEventListener("click", closeProject);
  document.querySelector("#project-cancel-button")?.addEventListener("click", closeProject);
  document.querySelector("#project-form")?.addEventListener("submit", handleCreateProject);
  bindRowEvents();
}

function bindRowEvents() {
  document.querySelectorAll("tr[data-project-id]").forEach((row) => {
    const open = (event) => {
      if (event.target.closest("button")) return;
      location.hash = `#project/${row.dataset.projectId}`;
    };
    row.addEventListener("click", open);
    row.addEventListener("keydown", (event) => { if (event.key === "Enter") open(event); });
  });
}

async function handleCreateProject(event) {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.checkValidity()) { form.reportValidity(); return; }
  const button = document.querySelector("#save-project-button");
  const error = document.querySelector("#project-error");
  setButtonLoading(button, true, "Saving...");
  error.textContent = "";
  try {
    const valueOrNull = (id) => document.querySelector(id)?.value?.trim() || null;
    await createProject({
      project_name: valueOrNull("#project-name"), project_code: valueOrNull("#project-code"), mode: valueOrNull("#project-mode"),
      highway_id: valueOrNull("#project-highway"), implementing_office_id: valueOrNull("#project-office"), status: valueOrNull("#project-status"),
      start_chainage_km: valueOrNull("#project-start-chainage"), end_chainage_km: valueOrNull("#project-end-chainage"),
      sanctioned_cost_crore: valueOrNull("#project-cost"), scheduled_completion_date: valueOrNull("#project-completion"), description: valueOrNull("#project-description"),
    });
    document.querySelector("#project-dialog").close();
    state.projects = await getProjects();
    renderRegister();
    showToast(`Project “${valueOrNull("#project-name") || "New project"}” was created successfully.`);
  } catch (err) {
    error.textContent = err.message;
  } finally { setButtonLoading(button, false); }
}

function renderRegister() {
  root.innerHTML = projectRegisterTemplate();
  bindRegisterEvents();
}
