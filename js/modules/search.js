let globalSearchTimer=null;
let globalSearchActiveIndex=-1;

async function ensureGlobalSearchData(){
  const requests=[];
  if(!state.projects?.length) requests.push(getProjects().then(v=>state.projects=v));
  if(!state.correspondence?.length) requests.push(getCorrespondence().then(v=>state.correspondence=v));
  if(!state.actionItems?.length) requests.push(getActionItems().then(v=>state.actionItems=v));
  if(!state.inspections?.length) requests.push(getInspections().then(v=>state.inspections=v));
  if(requests.length) await Promise.all(requests);
}

function globalSearchItems(query){
  const q=query.trim().toLowerCase();
  if(q.length<2)return[];
  const includes=(...values)=>values.some(v=>String(v||"").toLowerCase().includes(q));
  const projectResults=(state.projects||[]).filter(p=>includes(p.project_name,p.project_code,p.status,p.mode)).map(p=>({
    type:"Project",title:p.project_name,detail:`${p.project_code||"No code"} · ${p.status||"—"}`,date:"",route:`#project/${p.id}`,recordId:p.id
  }));
  const correspondenceResults=(state.correspondence||[]).filter(c=>includes(c.subject,c.letter_number,c.from_party,c.to_party,c.status)).map(c=>({
    type:"Correspondence",title:c.subject||"Untitled correspondence",detail:`${c.letter_number||"No letter number"} · ${reportProjectName(c.project_id)}`,date:formatDate(c.letter_date),route:"#correspondence",recordId:c.id
  }));
  const actionResults=(state.actionItems||[]).filter(a=>includes(a.title,a.description,a.priority,a.status)).map(a=>({
    type:"Action",title:a.title,detail:`${reportProjectName(a.project_id)} · ${actionStatusLabel(a.status)}`,date:a.due_date?`Due ${formatDate(a.due_date)}`:"",route:`#action/${encodeURIComponent(a.id)}`,recordId:a.id
  }));
  const inspectionResults=(state.inspections||[]).filter(i=>includes(i.inspection_type,i.observations,i.location_description,i.severity,i.status,chainageLabel(i))).map(i=>({
    type:"Inspection",title:`${(i.inspection_type||"general").replaceAll("_"," ")} inspection`,detail:`${reportProjectName(i.project_id)} · ${chainageLabel(i)}`,date:formatDate(i.inspection_date),route:"#inspections",recordId:i.id
  }));
  return [...projectResults,...correspondenceResults,...actionResults,...inspectionResults].slice(0,24);
}


function highlightExactRecord(row){
  row.scrollIntoView({behavior:"smooth",block:"center"});
  row.classList.add("search-highlight");
  setTimeout(()=>row.classList.remove("search-highlight"),3500);
}

function openExactSearchRecord(type,id,options={}){
  if(!id){
    if(options.notifyOnFailure) dashboardNavigationFallback(options.fallbackRoute);
    return;
  }
  const attempts=12;
  let count=0;
  const tryOpen=()=>{
    count+=1;
    try{
      if(type==="Action"){
        const item=state.actionItems.find(record=>String(record.id)===String(id));
        if(item&&typeof openActionDetails==="function"){
          openActionDetails(id);
          return;
        }
        const row=[...document.querySelectorAll("[data-action-record-id]")].find(element=>String(element.dataset.actionRecordId)===String(id));
        if(row){
          highlightExactRecord(row);
          return;
        }
      }
      if(type==="Correspondence"){
        const item=state.correspondence.find(record=>String(record.id)===String(id));
        const editButton=[...document.querySelectorAll(".edit-correspondence-button[data-id]")].find(element=>String(element.dataset.id)===String(id));
        const row=[...document.querySelectorAll("[data-correspondence-id]")].find(element=>String(element.dataset.correspondenceId)===String(id));
        if(row){highlightExactRecord(row);return;}
        if(editButton){editButton.click();return;}
        if(item&&typeof openCorrespondenceModal==="function"){openCorrespondenceModal(item);return;}
      }
      if(type==="Inspection"){
        const editButton=[...document.querySelectorAll(".edit-inspection-button[data-id]")].find(element=>String(element.dataset.id)===String(id));
        const row=[...document.querySelectorAll("[data-inspection-id]")].find(element=>String(element.dataset.inspectionId)===String(id));
        if(row){highlightExactRecord(row);return;}
        if(editButton){editButton.click();return;}
        const item=state.inspections.find(record=>String(record.id)===String(id));
        if(item&&typeof openInspectionModal==="function"){openInspectionModal(item);return;}
      }
    }catch(error){}
    if(count<attempts){
      setTimeout(tryOpen,180);
      return;
    }
    if(options.notifyOnFailure) dashboardNavigationFallback(options.fallbackRoute);
  };
  setTimeout(tryOpen,120);
}

function renderGlobalSearchResults(items){
  const box=document.querySelector("#global-search-results");
  if(!box)return;
  globalSearchActiveIndex=-1;
  if(!items.length){
    box.innerHTML=`<div class="global-search-empty">No matching records found.</div>`;
    box.hidden=false;
    return;
  }
  const groups=["Project","Correspondence","Action","Inspection"];
  box.innerHTML=groups.map(group=>{
    const rows=items.filter(item=>item.type===group);
    if(!rows.length)return"";
    return`<div class="global-search-section">${group}</div>${rows.map(item=>`<button class="global-search-result" data-route="${item.route}" data-record-type="${item.type}" data-record-id="${item.recordId||""}"><div><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.detail)}</span></div><small>${escapeHtml(item.date||item.type)}</small></button>`).join("")}`;
  }).join("");
  box.hidden=false;
  box.querySelectorAll(".global-search-result").forEach(button=>button.addEventListener("click",()=>{
    const recordType=button.dataset.recordType;
    const recordId=button.dataset.recordId;
    box.hidden=true;
    document.querySelector("#global-search-input").value="";
    if(recordType==="Action"){
      openActionDetails(recordId);
      return;
    }
    location.hash=button.dataset.route;
    route();
    if(recordType!=="Project") openExactSearchRecord(recordType,recordId);
  }));
}

async function runGlobalSearch(){
  const input=document.querySelector("#global-search-input");
  const box=document.querySelector("#global-search-results");
  if(!input||!box)return;
  const query=input.value.trim();
  if(query.length<2){box.hidden=true;box.innerHTML="";return;}
  box.hidden=false;
  box.innerHTML=`<div class="global-search-empty">Searching...</div>`;
  try{
    await ensureGlobalSearchData();
    renderGlobalSearchResults(globalSearchItems(query));
  }catch(error){
    box.innerHTML=`<div class="global-search-empty">${escapeHtml(error.message)}</div>`;
  }
}

function bindGlobalSearch(){
  const input=document.querySelector("#global-search-input");
  const box=document.querySelector("#global-search-results");
  if(!input||!box)return;
  input.addEventListener("input",()=>{
    clearTimeout(globalSearchTimer);
    globalSearchTimer=setTimeout(runGlobalSearch,220);
  });
  input.addEventListener("keydown",(event)=>{
    const results=[...box.querySelectorAll(".global-search-result")];
    if(event.key==="ArrowDown"&&results.length){
      event.preventDefault();globalSearchActiveIndex=(globalSearchActiveIndex+1)%results.length;
    }else if(event.key==="ArrowUp"&&results.length){
      event.preventDefault();globalSearchActiveIndex=(globalSearchActiveIndex-1+results.length)%results.length;
    }else if(event.key==="Enter"&&globalSearchActiveIndex>=0&&results[globalSearchActiveIndex]){
      event.preventDefault();results[globalSearchActiveIndex].click();return;
    }else if(event.key==="Escape"){
      box.hidden=true;input.blur();return;
    }else{return;}
    results.forEach((item,index)=>item.classList.toggle("active",index===globalSearchActiveIndex));
    results[globalSearchActiveIndex]?.scrollIntoView({block:"nearest"});
  });
  document.addEventListener("click",(event)=>{
    if(!event.target.closest(".global-search")) box.hidden=true;
  },{once:true});
}
