function dashboardData(){const now=new Date();now.setHours(0,0,0,0);const week=new Date(now);week.setDate(week.getDate()+7);const projects=state.projects||[];const correspondence=state.correspondence||[];const actions=state.actionItems||[];const inspections=state.inspections||[];const events=state.calendarEvents||[];const openActions=actions.filter(a=>!["completed","cancelled"].includes(a.status));const overdue=openActions.filter(a=>a.due_date&&new Date(`${a.due_date}T00:00:00`)<now);return{projects,activeProjects:projects.filter(p=>!["completed","closed","cancelled"].includes(String(p.status||'').toLowerCase())),pendingCorrespondence:correspondence.filter(c=>!["closed","replied","disposed"].includes(String(c.status||'').toLowerCase())),openActions,overdue,openInspections:inspections.filter(i=>["open","under_compliance"].includes(i.status)),recentCorrespondence:[...correspondence].sort((a,b)=>new Date(b.created_at||b.letter_date)-new Date(a.created_at||a.letter_date)).slice(0,5),recentInspections:[...inspections].sort((a,b)=>new Date(b.updated_at||b.inspection_date)-new Date(a.updated_at||a.inspection_date)).slice(0,5),upcoming:events.filter(e=>{const d=new Date(e.start_date||e.event_date||e.start_time||e.date);return !isNaN(d)&&d>=now&&d<=week}).slice(0,6)};}
function dashProject(id){const p=state.projects.find(x=>x.id===id);return p?.project_code||p?.project_name||'Project';}
function dashDate(v){if(!v)return'—';const x=String(v).match(/^\d{4}-\d{2}-\d{2}/)?.[0]||v;return formatDate(x);}
function dashboardTemplate(){const d=dashboardData();const actions=[...d.overdue,...d.openActions.filter(a=>!d.overdue.some(o=>o.id===a.id))].slice(0,6);const projects=[...d.projects].sort((a,b)=>Number(a.physical_progress_pct||0)-Number(b.physical_progress_pct||0)).slice(0,6);const list=(items,kind)=>items.length?`<div class="dashboard-list">${items.map(i=>{if(kind==='correspondence')return`<div class="dashboard-list-item" data-dashboard-route="#correspondence"><div><strong>${escapeHtml(i.subject||'Untitled correspondence')}</strong><span>${escapeHtml(i.letter_number||'No letter number')} · ${escapeHtml(dashProject(i.project_id))}</span></div><div class="right"><strong>${escapeHtml(correspondenceStatusLabel(i.status))}</strong><small>${dashDate(i.letter_date)}</small></div></div>`;if(kind==='inspection')return`<div class="dashboard-list-item" data-dashboard-route="#inspections"><div><strong>${escapeHtml((i.inspection_type||'general').replaceAll('_',' '))} · ${escapeHtml(chainageLabel(i))}</strong><span>${escapeHtml(dashProject(i.project_id))}</span></div><div class="right"><strong>${escapeHtml(inspectionStatusLabel(i.status))}</strong><small>${dashDate(i.inspection_date)}</small></div></div>`;return`<div class="dashboard-list-item" data-dashboard-route="#calendar"><div><strong>${escapeHtml(i.title||i.event_title||'Calendar event')}</strong><span>${escapeHtml(i.description||i.event_type||'Calendar')}</span></div><div class="right"><strong>${dashDate(i.start_date||i.event_date||i.start_time||i.date)}</strong></div></div>`;}).join('')}</div>`:`<div class="dashboard-empty">No records available.</div>`;return`<div class="app-shell">${appHeader()}${sidebar('dashboard')}<main class="main-content dashboard-page"><div class="breadcrumb"><span>Dashboard</span></div><div class="dashboard-hero"><div><h1>${dashboardGreeting()}, ${escapeHtml((state.profile?.full_name||'User').split(' ')[0])}</h1><p>Live overview of ${escapeHtml(currentOfficeName())}.</p></div><div class="dashboard-actions"><button class="btn secondary" data-dashboard-route="#calendar">Open calendar</button><button class="btn primary" data-dashboard-route="#reports">Open reports</button></div></div><div class="dashboard-kpis"><div class="dashboard-kpi" data-dashboard-route="#projects"><span>Total projects</span><strong>${d.projects.length}</strong><small>${d.activeProjects.length} active/current</small></div><div class="dashboard-kpi" data-dashboard-route="#correspondence"><span>Pending correspondence</span><strong>${d.pendingCorrespondence.length}</strong><small>Open or awaiting disposal</small></div><div class="dashboard-kpi" data-dashboard-route="#actions"><span>Open actions</span><strong>${d.openActions.length}</strong><small>${d.overdue.length} overdue</small></div><div class="dashboard-kpi" data-dashboard-route="#inspections"><span>Open inspections</span><strong>${d.openInspections.length}</strong><small>Compliance/follow-up pending</small></div></div><div class="dashboard-grid"><section class="dashboard-card"><div class="dashboard-card-heading"><h2>Project progress</h2><span>${d.projects.length} projects</span></div>${projects.length?`<div class="dashboard-projects">${projects.map(p=>`<div class="dashboard-project-row" data-project-id="${p.id}"><header><div><strong>${escapeHtml(p.project_name)}</strong><span>${escapeHtml(p.project_code||'')} · ${escapeHtml(p.status||'—')}</span></div><strong>${Number(p.physical_progress_pct||0)}%</strong></header><div class="dashboard-progress"><i style="width:${Math.max(0,Math.min(100,Number(p.physical_progress_pct||0)))}%"></i></div></div>`).join('')}</div>`:`<div class="dashboard-empty">No projects available.</div>`}</section><section class="dashboard-card"><div class="dashboard-card-heading"><h2>Priority actions</h2><span>${d.overdue.length} overdue</span></div>${actions.length?`<div class="dashboard-list">${actions.map(a=>`<div class="dashboard-list-item" data-dashboard-route="#actions"><div><strong>${escapeHtml(a.title)}</strong><span>${escapeHtml(dashProject(a.project_id))}</span></div><div class="right"><strong>${escapeHtml(actionStatusLabel(a.status))}</strong><small>${a.due_date?'Due '+dashDate(a.due_date):'No due date'}</small></div></div>`).join('')}</div>`:`<div class="dashboard-empty">No open actions.</div>`}</section></div><div class="dashboard-grid"><section class="dashboard-card"><div class="dashboard-card-heading"><h2>Recent correspondence</h2><span>${d.pendingCorrespondence.length} pending</span></div>${list(d.recentCorrespondence,'correspondence')}</section><section class="dashboard-card"><div class="dashboard-card-heading"><h2>Upcoming 7 days</h2><span>${d.upcoming.length} items</span></div>${list(d.upcoming,'calendar')}</section></div><div class="dashboard-grid"><section class="dashboard-card"><div class="dashboard-card-heading"><h2>Recent inspections</h2><span>${d.openInspections.length} open</span></div>${list(d.recentInspections,'inspection')}</section><section class="dashboard-card"><div class="dashboard-card-heading"><h2>Quick links</h2><span>Common tasks</span></div><div class="quick-links">${[['#projects','Project Register','Open projects and packages'],['#correspondence','Correspondence','Incoming and outgoing letters'],['#actions','Action Tracking','Assignments and compliance'],['#inspections','Inspections','Site observations and photos'],['#calendar','Calendar','Milestones and reminders'],['#reports','Reports','Print and export summaries']].map(x=>`<button class="quick-link" data-dashboard-route="${x[0]}"><strong>${x[1]}</strong><span>${x[2]}</span></button>`).join('')}</div></section></div></main></div>`;}
async function renderDashboard(){root.innerHTML=`<div class="loading-screen"><span class="spinner dark"></span><p>Loading dashboard...</p></div>`;try{[state.correspondence,state.actionItems,state.actionAssignees,state.actionProgressUpdates,state.inspections,state.calendarEvents]=await Promise.all([getCorrespondence(),getActionItems(),getActionAssignees(),getActionProgressUpdates(),getInspections(),getCalendarEvents()]);root.innerHTML=dashboardTemplate();bindDashboardEvents();}catch(error){root.innerHTML=`<div class="loading-screen"><p>${escapeHtml(error.message)}</p></div>`;}}
function bindDashboardActivation(element,activate){
  element.setAttribute("role","link");
  element.tabIndex=0;
  if(!element.getAttribute("aria-label")) element.setAttribute("aria-label",`Open ${element.textContent.trim().replace(/\s+/g," ")}`);
  element.addEventListener("click",activate);
  element.addEventListener("keydown",(event)=>{
    if(event.key!=="Enter"&&event.key!==" ")return;
    event.preventDefault();
    activate();
  });
}

function dashboardNavigationFallback(parentRoute){
  if(parentRoute&&location.hash!==parentRoute){
    location.hash=parentRoute;
  }
  showToast("The selected record is no longer available. Opened the parent register.","info");
}

function openExactDashboardCalendarRecord(recordId,parentRoute){
  if(!recordId){
    dashboardNavigationFallback(parentRoute);
    return;
  }
  let attempts=0;
  const tryOpen=()=>{
    attempts+=1;
    try{
      const item=calendarItems().find((entry)=>entry.kind==="manual"&&String(entry.sourceId)===String(recordId));
      if(item){
        const dialog=document.querySelector("#calendar-event-dialog");
        if(item.editable&&dialog){
          openCalendarItem(item,dialog);
          return;
        }
        const chip=[...document.querySelectorAll("[data-calendar-item]")].find((element)=>element.dataset.calendarItem===item.id);
        if(chip){
          chip.scrollIntoView({behavior:"smooth",block:"center"});
          chip.classList.add("calendar-target-highlight");
          setTimeout(()=>chip.classList.remove("calendar-target-highlight"),3500);
          return;
        }
      }
    }catch(error){}
    if(attempts<12){
      setTimeout(tryOpen,180);
      return;
    }
    dashboardNavigationFallback(parentRoute);
  };
  setTimeout(tryOpen,120);
}

function navigateToDashboardRecord(recordType,recordId,parentRoute){
  if(recordType==="Action"){
    openActionDetails(recordId);
    return;
  }
  if(recordType==="Calendar"){
    const event=state.calendarEvents.find((item)=>String(item.id)===String(recordId));
    if(event?.event_date) state.calendarViewDate=new Date(`${event.event_date}T00:00:00`);
  }
  const routeUnchanged=location.hash===parentRoute;
  location.hash=parentRoute;
  if(routeUnchanged) route();
  if(recordType==="Calendar"){
    openExactDashboardCalendarRecord(recordId,parentRoute);
    return;
  }
  openExactSearchRecord(recordType,recordId,{fallbackRoute:parentRoute,notifyOnFailure:true});
}

function bindDashboardEvents(){
  bindCommonEvents();
  const data=dashboardData();
  const actionRecords=[...data.overdue,...data.openActions.filter((item)=>!data.overdue.some((overdue)=>overdue.id===item.id))].slice(0,6);
  const recordGroups=[
    ['.dashboard-list-item[data-dashboard-route="#actions"]',actionRecords,"Action"],
    ['.dashboard-list-item[data-dashboard-route="#correspondence"]',data.recentCorrespondence,"Correspondence"],
    ['.dashboard-list-item[data-dashboard-route="#inspections"]',data.recentInspections,"Inspection"],
    ['.dashboard-list-item[data-dashboard-route="#calendar"]',data.upcoming,"Calendar"],
  ];
  recordGroups.forEach(([selector,records,type])=>{
    document.querySelectorAll(selector).forEach((element,index)=>{
      const record=records[index];
      if(!record)return;
      element.dataset.dashboardRecordType=type;
      element.dataset.dashboardRecordId=record.id;
    });
  });
  document.querySelectorAll("[data-dashboard-route]").forEach((element)=>{
    const activate=()=>{
      const recordType=element.dataset.dashboardRecordType;
      if(recordType){
        navigateToDashboardRecord(recordType,element.dataset.dashboardRecordId,element.dataset.dashboardRoute);
        return;
      }
      if(element.matches('.dashboard-kpi[data-dashboard-route="#actions"]')){
        openActionRegisterView("open");
        return;
      }
      if(element.matches('.quick-link[data-dashboard-route="#actions"]')){
        openActionRegisterView("all");
        return;
      }
      location.hash=element.dataset.dashboardRoute;
      route();
    };
    if(element.matches(".dashboard-kpi,.dashboard-list-item")) bindDashboardActivation(element,activate);
    else element.addEventListener("click",activate);
  });
  document.querySelectorAll("[data-project-id]").forEach((element)=>{
    bindDashboardActivation(element,()=>{
      location.hash=`#project/${element.dataset.projectId}`;
      route();
    });
  });
}
