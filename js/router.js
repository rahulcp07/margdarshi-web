document.addEventListener("keydown",(event)=>{
  if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==="k"){
    event.preventDefault();
    const input=document.querySelector("#global-search-input");
    if(input){input.focus();input.select();}
  }
});

async function route() {
  const hash = location.hash || "#dashboard";
  if (hash === "#dashboard") return renderDashboard();
  if (hash === "#admin") return renderAdministration();
  if (hash === "#correspondence") return renderGlobalCorrespondence();
  if (hash === "#actions") return renderActionPage();
  if (hash === "#notifications") return renderNotifications();
  if (hash === "#calendar") return renderCalendar();
  if (hash === "#inspections") return renderInspections();
  if (hash === "#reports") return renderReports();
  const actionMatch = hash.match(/^#action\/(.+)$/);
  if (actionMatch) {
    try { return renderActionDetail(decodeURIComponent(actionMatch[1])); }
    catch (error) { return renderActionDetail(""); }
  }
  const match = hash.match(/^#project\/(.+)$/);
  if (match) return renderWorkspace(match[1]);
  renderRegister();
}

async function init() {
  root.innerHTML = `<div class="loading-screen"><span class="spinner dark"></span><p>Loading MARGDARSHI...</p></div>`;
  if (state.demo) {
    state.profile = DEMO_PROFILE;
    state.projects = DEMO_PROJECTS;
    state.highways = [];
    state.offices = [];
    state.loading = false;
    return route();
  }
  state.session = await ensureSession();
  if (!state.session) {
    root.innerHTML = loginTemplate();
    bindLoginEvents();
    return;
  }
  try {
    await loadAuthenticatedData();
    state.loading = false;
    route();
  } catch (error) {
    root.innerHTML = loginTemplate();
    bindLoginEvents();
    document.querySelector("#login-error").textContent = error.message;
  }
}

document.addEventListener("click", (event) => {
  const closeButton = event.target.closest("[data-dialog-close]");
  if (!closeButton) return;
  event.preventDefault();
  event.stopPropagation();
  const dialog = closeButton.closest("dialog");
  if (dialog) dialog.close();
}, true);

window.addEventListener("hashchange", () => { if (state.session || state.demo) route(); });
init();
