const SESSION_KEY = "margdarshi.session";

function authHeaders(accessToken) {
  return {
    apikey: CONFIG.supabasePublishableKey,
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };
}

async function parseResponse(response) {
  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json") ? await response.json() : await response.text();
  if (!response.ok) {
    const message = payload?.msg || payload?.message || payload?.error_description || payload?.error || "Request failed";
    throw new Error(message);
  }
  return payload;
}

function getSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

function setSession(session) {
  if (!session) localStorage.removeItem(SESSION_KEY);
  else localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

async function signIn(email, password) {
  const response = await fetch(`${CONFIG.supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      apikey: CONFIG.supabasePublishableKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });
  const session = await parseResponse(response);
  setSession(session);
  return session;
}

async function signUp({ email, password, fullName, designation }) {
  const response = await fetch(`${CONFIG.supabaseUrl}/auth/v1/signup`, {
    method: "POST",
    headers: {
      apikey: CONFIG.supabasePublishableKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
      data: { full_name: fullName, designation },
    }),
  });
  const payload = await parseResponse(response);
  if (payload.access_token) setSession(payload);
  return payload;
}

async function sendEmailOtp({ email, fullName, designation }) {
  const response = await fetch(`${CONFIG.supabaseUrl}/auth/v1/otp`, {
    method: "POST",
    headers: {
      apikey: CONFIG.supabasePublishableKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      create_user: true,
      data: { full_name: fullName, designation },
    }),
  });
  return parseResponse(response);
}

async function verifyEmailOtp({ email, token }) {
  const response = await fetch(`${CONFIG.supabaseUrl}/auth/v1/verify`, {
    method: "POST",
    headers: {
      apikey: CONFIG.supabasePublishableKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, token, type: "email" }),
  });
  const payload = await parseResponse(response);
  if (payload.access_token) setSession(payload);
  return payload;
}

async function setVerifiedUserPassword({ session, password, fullName, designation }) {
  const response = await fetch(`${CONFIG.supabaseUrl}/auth/v1/user`, {
    method: "PUT",
    headers: authHeaders(session.access_token),
    body: JSON.stringify({
      password,
      data: { full_name: fullName, designation },
    }),
  });
  return parseResponse(response);
}

async function refreshSession(session) {
  if (!session?.refresh_token) return null;
  const response = await fetch(`${CONFIG.supabaseUrl}/auth/v1/token?grant_type=refresh_token`, {
    method: "POST",
    headers: {
      apikey: CONFIG.supabasePublishableKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refresh_token: session.refresh_token }),
  });
  const refreshed = await parseResponse(response);
  setSession(refreshed);
  return refreshed;
}

async function ensureSession() {
  let session = getSession();
  if (!session) return null;
  const expiresAtMs = (session.expires_at || 0) * 1000;
  if (expiresAtMs && expiresAtMs - Date.now() < 60_000) {
    try {
      session = await refreshSession(session);
    } catch {
      setSession(null);
      return null;
    }
  }
  return session;
}

async function signOut() {
  const session = getSession();
  if (session?.access_token) {
    await fetch(`${CONFIG.supabaseUrl}/auth/v1/logout`, {
      method: "POST",
      headers: authHeaders(session.access_token),
    }).catch(() => null);
  }
  setSession(null);
}

async function rest(path, options = {}) {
  const session = await ensureSession();
  if (!session?.access_token) throw new Error("Your session has expired. Please log in again.");
  const response = await fetch(`${CONFIG.supabaseUrl}/rest/v1/${path}`, {
    ...options,
    headers: {
      ...authHeaders(session.access_token),
      ...(options.headers || {}),
    },
  });
  return parseResponse(response);
}

async function getProfile() {
  const session = await ensureSession();
  const userId = session?.user?.id;
  if (!userId) return null;
  const rows = await rest(`profiles?id=eq.${encodeURIComponent(userId)}&select=id,full_name,designation,role,office_id,office_name`);
  return rows[0] || null;
}

function getProjects() {
  return rest("v_project_register?select=*&order=updated_at.desc");
}

async function getProject(id) {
  const rows = await rest(`v_project_register?id=eq.${encodeURIComponent(id)}&select=*`);
  return rows[0] || null;
}

function getHighways() {
  return rest("highways?select=id,highway_number,highway_name&order=highway_number.asc");
}

function getOffices() {
  return rest("offices?select=id,name,office_type&order=name.asc");
}








function getInspections(projectId = null) {
  const filter = projectId ? `&project_id=eq.${encodeURIComponent(projectId)}` : "";
  return rest(`inspections?select=id,project_id,inspection_date,inspection_type,start_chainage_km,end_chainage_km,location_description,inspected_by,responsible_entity,observations,required_compliance,compliance_due_date,status,severity,linked_action_id,created_by,created_at,updated_at&order=inspection_date.desc,created_at.desc${filter}`);
}
function getInspectionPhotos() {
  return rest("inspection_photos?select=id,inspection_id,storage_path,file_name,mime_type,size_bytes,caption,uploaded_by,uploaded_at&order=uploaded_at.desc");
}
async function createInspection(payload) {
  const session = await ensureSession();
  const rows = await rest("inspections", { method:"POST", headers:{Prefer:"return=representation"}, body:JSON.stringify({...payload,created_by:session?.user?.id||null,inspected_by:payload.inspected_by||session?.user?.id||null}) });
  return rows[0] || null;
}
async function updateInspection(id,payload) {
  const rows=await rest(`inspections?id=eq.${encodeURIComponent(id)}`,{method:"PATCH",headers:{Prefer:"return=representation"},body:JSON.stringify({...payload,updated_at:new Date().toISOString()})});
  return rows[0]||null;
}
async function createInspectionPhoto(payload) {
  const session=await ensureSession();
  const rows=await rest("inspection_photos",{method:"POST",headers:{Prefer:"return=representation"},body:JSON.stringify({...payload,uploaded_by:session?.user?.id||null})});
  return rows[0]||null;
}
async function uploadInspectionPhoto(file,projectId,inspectionId){
  if(!["image/jpeg","image/png","image/webp"].includes(file.type)) throw new Error("Only JPG, PNG and WEBP images are allowed.");
  if(file.size>10*1024*1024) throw new Error("Each image must not exceed 10 MB.");
  const session=await ensureSession();
  const filename=safeStorageFilename(file.name);
  const path=`${projectId}/${inspectionId}/${Date.now()}-${filename}`;
  const response=await fetch(`${CONFIG.supabaseUrl}/storage/v1/object/inspection-photos/${encodeURI(path)}`,{method:"POST",headers:{apikey:CONFIG.supabasePublishableKey,Authorization:`Bearer ${session.access_token}`,"Content-Type":file.type,"x-upsert":"false"},body:file});
  if(!response.ok){let message="Photo upload failed.";try{const result=await response.json();message=result.message||result.error||message;}catch{}throw new Error(message);}
  return {storage_path:path,file_name:file.name,mime_type:file.type,size_bytes:file.size};
}
async function openInspectionPhoto(photo){
  const session=await ensureSession();
  const response=await fetch(`${CONFIG.supabaseUrl}/storage/v1/object/authenticated/inspection-photos/${encodeURI(photo.storage_path)}`,{headers:{apikey:CONFIG.supabasePublishableKey,Authorization:`Bearer ${session.access_token}`}});
  if(!response.ok) throw new Error("Unable to open inspection photograph.");
  const blob=await response.blob();const url=URL.createObjectURL(blob);window.open(url,"_blank","noopener,noreferrer");setTimeout(()=>URL.revokeObjectURL(url),60000);
}
function getCalendarEvents() {
  return rest("calendar_events?select=id,project_id,title,event_type,event_date,start_time,end_time,location,description,status,created_by,created_at,updated_at&order=event_date.asc,start_time.asc.nullslast");
}

async function createCalendarEvent(payload) {
  const session = await ensureSession();
  const rows = await rest("calendar_events", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({ ...payload, created_by: session?.user?.id || null }),
  });
  return rows[0] || null;
}

async function updateCalendarEvent(id, payload) {
  const rows = await rest(`calendar_events?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({ ...payload, updated_at: new Date().toISOString() }),
  });
  return rows[0] || null;
}

function getNotificationStates() {
  return rest("notification_states?select=id,user_id,notification_key,read_at,dismissed_at,updated_at&order=updated_at.desc");
}

async function saveNotificationState(notificationKey, payload) {
  const session = await ensureSession();
  const userId = session?.user?.id;
  if (!userId) throw new Error("Your session has expired.");
  const rows = await rest("notification_states?on_conflict=user_id,notification_key", {
    method: "POST",
    headers: { Prefer: "return=representation,resolution=merge-duplicates" },
    body: JSON.stringify({
      user_id: userId,
      notification_key: notificationKey,
      ...payload,
      updated_at: new Date().toISOString(),
    }),
  });
  return rows[0] || null;
}

function getActionItems(projectId = null) {
  const projectFilter = projectId ? `&project_id=eq.${encodeURIComponent(projectId)}` : "";
  return rest(`action_items?select=id,project_id,correspondence_id,title,description,assigned_to,assigned_by,priority,status,due_date,reminder_date,progress_percent,verified_progress_percent,completion_note,completed_at,created_by,created_at,updated_at,verifier_id,responsibility_mode,issuer_note,action_type,workflow_stage,movement_direction,competent_authority_id,approved_for_forwarding,forwarding_authorized_to,office_processing_note,closure_mode,closed_by,closed_at&order=due_date.asc.nullslast,created_at.desc${projectFilter}`);
}

function getAssignableUsers() {
  return rest("profiles?select=id,full_name,designation,email,office_name,role&account_status=eq.approved&is_active=eq.true&order=full_name.asc");
}

function getProjectJurisdictions() {
  return rest("project_user_access?select=id,project_id,user_id,access_type,can_receive_actions,effective_from,effective_to,is_active,created_at&is_active=eq.true&order=created_at.desc");
}

function getActionAssignees() {
  return rest("action_assignees?select=id,action_id,user_id,responsibility_type,responsibility_note,is_active,assigned_by,assigned_at&is_active=eq.true&order=responsibility_type.asc,assigned_at.asc");
}

function getActionProgressUpdates() {
  return rest("action_progress_updates?select=id,action_id,submitted_by,claimed_progress_percent,work_done,remaining_work,delay_reason,submitted_at,verification_status,verified_progress_percent,verification_remarks,verified_by,verified_at&order=submitted_at.desc");
}

function getActionWorkflowEvents() {
  return rest("action_workflow_events?select=id,action_id,event_type,from_stage,to_stage,performed_by,on_behalf_of,remarks,draft_text,created_at&order=created_at.desc");
}

async function createActionWorkflowEvent(payload) {
  const session = await ensureSession();
  const rows = await rest("action_workflow_events", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({ ...payload, performed_by: session?.user?.id || null }),
  });
  return rows[0] || null;
}

async function createActionItem(payload) {
  const session = await ensureSession();
  const rows = await rest("action_items", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({ ...payload, created_by: session?.user?.id || null, assigned_by: session?.user?.id || null }),
  });
  return rows[0] || null;
}

async function updateActionItem(id, payload) {
  const rows = await rest(`action_items?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({ ...payload, updated_at: new Date().toISOString() }),
  });
  return rows[0] || null;
}

async function createActionAssignee(payload) {
  const session = await ensureSession();
  const rows = await rest("action_assignees", {
    method: "POST",
    headers: { Prefer: "return=representation,resolution=merge-duplicates" },
    body: JSON.stringify({ ...payload, assigned_by: session?.user?.id || null }),
  });
  return rows[0] || null;
}

async function deactivateActionAssignees(actionId) {
  return rest(`action_assignees?action_id=eq.${encodeURIComponent(actionId)}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ is_active: false }),
  });
}

async function createProgressUpdate(payload) {
  const session = await ensureSession();
  const rows = await rest("action_progress_updates", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({ ...payload, submitted_by: session?.user?.id || null }),
  });
  return rows[0] || null;
}

async function verifyProgressUpdate(id, payload) {
  const session = await ensureSession();
  const rows = await rest(`action_progress_updates?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({ ...payload, verified_by: session?.user?.id || null, verified_at: new Date().toISOString() }),
  });
  return rows[0] || null;
}

async function createProjectJurisdiction(payload) {
  const session = await ensureSession();
  const rows = await rest("project_user_access", {
    method: "POST",
    headers: { Prefer: "return=representation,resolution=merge-duplicates" },
    body: JSON.stringify({ ...payload, created_by: session?.user?.id || null }),
  });
  return rows[0] || null;
}

async function deactivateProjectJurisdiction(id) {
  const rows = await rest(`project_user_access?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({ is_active: false, updated_at: new Date().toISOString() }),
  });
  return rows[0] || null;
}

function getDirectoryEntities(includeInactive = false) {
  const activeFilter = includeInactive ? "" : "&is_active=eq.true";
  return rest(`directory_entities?select=id,name,category,short_name,parent_entity_id,email,phone,address,is_frequent,display_order,is_active,remarks,created_at,updated_at&order=is_frequent.desc,display_order.asc,name.asc${activeFilter}`);
}

async function createDirectoryEntity(payload) {
  const session = await ensureSession();
  const rows = await rest("directory_entities", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({ ...payload, created_by: session?.user?.id || null }),
  });
  return rows[0] || null;
}

async function updateDirectoryEntity(id, payload) {
  const rows = await rest(`directory_entities?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({ ...payload, updated_at: new Date().toISOString() }),
  });
  return rows[0] || null;
}


const CORRESPONDENCE_BUCKET = "correspondence-attachments";
const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;
const ALLOWED_ATTACHMENT_TYPES = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp"]);

function safeStorageFilename(filename) {
  const dot = filename.lastIndexOf(".");
  const base = (dot > 0 ? filename.slice(0, dot) : filename)
    .normalize("NFKD")
    .replace(/[^\w.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80) || "attachment";
  const ext = dot > 0 ? filename.slice(dot).toLowerCase().replace(/[^a-z0-9.]/g, "") : "";
  return `${base}${ext}`;
}

function validateCorrespondenceAttachment(file) {
  if (!file) return;
  if (!ALLOWED_ATTACHMENT_TYPES.has(file.type)) {
    throw new Error("Only PDF, JPG, PNG and WEBP files are allowed.");
  }
  if (file.size > MAX_ATTACHMENT_BYTES) {
    throw new Error("Attachment must not exceed 10 MB.");
  }
}

async function uploadCorrespondenceAttachment(file, projectId, correspondenceId) {
  validateCorrespondenceAttachment(file);
  const session = await ensureSession();
  if (!session?.access_token) throw new Error("Your session has expired. Please log in again.");
  const filename = safeStorageFilename(file.name);
  const path = `${projectId}/${correspondenceId}/${Date.now()}-${filename}`;
  const response = await fetch(`${CONFIG.supabaseUrl}/storage/v1/object/${CORRESPONDENCE_BUCKET}/${encodeURI(path)}`, {
    method: "POST",
    headers: {
      apikey: CONFIG.supabasePublishableKey,
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": file.type,
      "x-upsert": "false",
      "cache-control": "3600",
    },
    body: file,
  });
  if (!response.ok) {
    let message = "Attachment upload failed.";
    try {
      const result = await response.json();
      message = result.message || result.error || message;
    } catch {}
    throw new Error(message);
  }
  return {
    attachment_path: path,
    attachment_name: file.name,
    attachment_size_bytes: file.size,
    attachment_mime_type: file.type,
  };
}

async function openCorrespondenceAttachment(record) {
  if (!record?.attachment_path) return;
  const session = await ensureSession();
  if (!session?.access_token) throw new Error("Your session has expired. Please log in again.");
  const response = await fetch(`${CONFIG.supabaseUrl}/storage/v1/object/authenticated/${CORRESPONDENCE_BUCKET}/${encodeURI(record.attachment_path)}`, {
    headers: {
      apikey: CONFIG.supabasePublishableKey,
      Authorization: `Bearer ${session.access_token}`,
    },
  });
  if (!response.ok) {
    let message = "Unable to open attachment.";
    try {
      const result = await response.json();
      message = result.message || result.error || message;
    } catch {}
    throw new Error(message);
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const opened = window.open(url, "_blank", "noopener,noreferrer");
  if (!opened) {
    const link = document.createElement("a");
    link.href = url;
    link.download = record.attachment_name || "attachment";
    link.click();
  }
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

function formatFileSize(bytes) {
  const value = Number(bytes || 0);
  if (!value) return "";
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(0)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function getCorrespondence(projectId = null) {
  const projectFilter = projectId ? `&project_id=eq.${encodeURIComponent(projectId)}` : "";
  return rest(`correspondence?select=id,project_id,letter_number,letter_date,direction,from_party,to_party,subject,action_required,due_date,status,document_url,remarks,created_by,created_at,received_or_sent_date,reference_details,priority,attachment_name,attachment_path,attachment_size_bytes,attachment_mime_type,updated_at&order=letter_date.desc,created_at.desc${projectFilter}`);
}

async function createCorrespondence(payload) {
  const session = await ensureSession();
  const rows = await rest("correspondence", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({ ...payload, created_by: session?.user?.id || null, updated_by: session?.user?.id || null }),
  });
  return rows[0] || null;
}

async function updateCorrespondence(id, payload) {
  const session = await ensureSession();
  const rows = await rest(`correspondence?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({ ...payload, updated_by: session?.user?.id || null, updated_at: new Date().toISOString() }),
  });
  return rows[0] || null;
}

function getAdminUsers() {
  return rest("profiles?select=id,full_name,designation,email,role,office_id,office_name,account_status,is_active,approved_at,created_at&order=created_at.desc");
}

function getUserAssignments() {
  return rest("user_assignments?select=id,user_id,designation,office_id,assignment_type,is_primary,effective_from,effective_to,order_reference,is_active,created_at&order=is_primary.desc,created_at.desc");
}

async function updateAdminUser(userId, payload) {
  const rows = await rest(`profiles?id=eq.${encodeURIComponent(userId)}`, {
    method: "PATCH",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({ ...payload, updated_at: new Date().toISOString() }),
  });
  return rows[0] || null;
}

async function createUserAssignment(payload) {
  const session = await ensureSession();
  const rows = await rest("user_assignments", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({ ...payload, created_by: session?.user?.id || null }),
  });
  return rows[0] || null;
}

async function setAssignmentActive(id, isActive) {
  const rows = await rest(`user_assignments?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({ is_active: isActive, updated_at: new Date().toISOString() }),
  });
  return rows[0] || null;
}

async function createProject(payload) {
  const session = await ensureSession();
  const data = {
    ...payload,
    created_by: session?.user?.id || null,
  };
  const response = await rest("projects", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(data),
  });
  return response[0] || null;
}
