(() => {
  const $ = (s, root = document) => root.querySelector(s);
  const content = $("#content"), dialog = $("#record-dialog"), form = $("#record-form");
  let page = "dashboard", classes = [], students = [], editing = null, toastTimer;
  const money = n => new Intl.NumberFormat("en-PK", { style: "currency", currency: "PKR", maximumFractionDigits: 0 }).format(Number(n || 0));
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
  const today = () => new Date().toISOString().slice(0,10);
  const month = () => today().slice(0,7);
  const toast = (msg, bad = false) => { const el = $("#toast"); el.textContent = msg; el.className = `toast show${bad ? " bad" : ""}`; clearTimeout(toastTimer); toastTimer = setTimeout(() => el.className = "toast", 3200); };
  const error = msg => `<div class="notice error-notice">${esc(msg)}</div>`;
  const empty = (title, text) => `<div class="empty-state"><div class="empty-icon">＋</div><strong>${title}</strong><p>${text}</p></div>`;
  const table = (heads, rows) => `<div class="table-wrap"><table><thead><tr>${heads.map(h=>`<th>${h}</th>`).join("")}</tr></thead><tbody>${rows || `<tr><td colspan="${heads.length}" class="empty-cell">No records found yet.</td></tr>`}</tbody></table></div>`;
  const sectionHead = (title, sub, action = "") => `<div class="section-head"><div><h2>${title}</h2><p>${sub}</p></div>${action}</div>`;
  const button = (text, attrs = "") => `<button class="btn btn-primary" ${attrs}>＋ ${text}</button>`;
  async function init() {
    try {
      const s = await AcademyAPI.session();
      const { data } = await AcademyAPI.client.auth.getUser();
      $("#admin-name").textContent = data?.user?.email || "Administrator";
      document.querySelectorAll(".nav-item[data-page]").forEach(b => b.addEventListener("click", () => { page = b.dataset.page; render(); $("#sidebar").classList.remove("open"); }));
      $("#logout-button").addEventListener("click", async () => { await AcademyAPI.client.auth.signOut(); location.href="/login.html"; });
      $("#mobile-menu").addEventListener("click", () => $("#sidebar").classList.toggle("open"));
      $("#dialog-close").addEventListener("click", closeDialog); $("#dialog-cancel").addEventListener("click", closeDialog);
      form.addEventListener("submit", saveDialog);
      await render();
    } catch (e) {
      content.innerHTML = `<div class="page-error"><h2>Could not load the portal</h2>${error(e.message)}<p>Check your Supabase setup and sign in again.</p><a class="btn btn-primary" href="/login.html">Go to login</a></div>`;
    }
  }
  async function render() {
    document.querySelectorAll(".nav-item[data-page]").forEach(b => b.classList.toggle("active", b.dataset.page === page));
    const titles = {dashboard:"Dashboard",students:"Students",classes:"Classes & Sections",fees:"Fee Management",expenses:"Expenses",reports:"Financial Reports"};
    $("#page-title").textContent = titles[page] || "Dashboard";
    content.innerHTML = `<div class="loading"><span class="spinner"></span> Loading records…</div>`;
    try {
      if (page === "dashboard") await dashboard();
      if (page === "students") await studentPage();
      if (page === "classes") await classPage();
      if (page === "fees") await feePage();
      if (page === "expenses") await expensePage();
      if (page === "reports") await reportPage();
    } catch (e) { content.innerHTML = error(e.message); }
  }
  async function dashboard() {
    const d = await AcademyAPI.get("/dashboard");
    content.innerHTML = `
      <div class="welcome-row"><div><p class="eyebrow blue">ACADEMY OVERVIEW</p><h2>Good to see you.</h2><p class="muted">Here’s what’s happening at your academy today.</p></div><div class="date-pill">${new Date().toLocaleDateString("en-PK",{day:"numeric",month:"short",year:"numeric"})}</div></div>
      <div class="stats-grid">
        ${stat("Total students",d.totalStudents,"♙","blue")}
        ${stat("Classes",d.totalClasses,"▤","violet")}
        ${stat("Sections",d.totalSections,"▦","teal")}
        ${stat("Fees collected",money(d.feesCollected),"₨","green")}
        ${stat("Pending fees (this month)",money(d.pendingFees),"◷","amber")}
        ${stat("Total expenses",money(d.expenses),"↗","red")}
        ${stat("Monthly income",money(d.monthlyIncome),"↗","blue")}
        ${stat("Net cash income",money(d.netIncome),"＝","green")}
      </div>
      <div class="panel dashboard-note"><div class="panel-icon">i</div><div><strong>Financial figures are based on saved records</strong><p>Pending fees are an estimate for the current month: active students’ monthly fees minus payments recorded for this month. Record each payment with the correct fee period for accurate history.</p></div></div>
      <div class="quick-grid"><button class="quick-card" data-go="students"><span>♙</span><strong>Add a student</strong><small>Create a new student record →</small></button><button class="quick-card" data-go="fees"><span>₨</span><strong>Record a payment</strong><small>Save a fee transaction →</small></button><button class="quick-card" data-go="expenses"><span>↗</span><strong>Add an expense</strong><small>Track academy spending →</small></button></div>`;
    content.querySelectorAll("[data-go]").forEach(b=>b.addEventListener("click",()=>{page=b.dataset.go;render();}));
  }
  function stat(label,value,icon,color){return `<div class="stat-card"><div class="stat-top"><span>${label}</span><span class="stat-icon ${color}">${icon}</span></div><strong class="stat-value">${value}</strong><span class="stat-caption">Updated from database</span></div>`;}
  async function loadClassesStudents() { [classes,students] = await Promise.all([AcademyAPI.get("/classes"),AcademyAPI.get("/students")]); }
  async function studentPage() {
    await loadClassesStudents();
    content.innerHTML = `${sectionHead("Student records","Manage enrollments, student details, and monthly fees.",button("Add student",'data-action="add-student"'))}
      <div class="toolbar"><label class="search-box"><span>⌕</span><input id="student-search" placeholder="Search name, father name, or student ID…" aria-label="Search students"></label><span class="record-count">${students.length} record${students.length===1?"":"s"}</span></div>
      <div id="student-table">${studentTable(students)}</div>`;
    $("#student-search").addEventListener("input", async e => {
      const q=e.target.value.trim(); const filtered=students.filter(s=>[s.full_name,s.father_name,s.student_code].some(v=>String(v||"").toLowerCase().includes(q.toLowerCase())));
      $("#student-table").innerHTML=studentTable(filtered);
    });
    content.querySelector('[data-action="add-student"]').addEventListener("click",()=>openStudent());
    $("#student-table").addEventListener("click",async e=>{
      const b=e.target.closest("button[data-action]"); if(!b)return;
      const s=students.find(x=>x.id===b.dataset.id); if(!s)return;
      if(b.dataset.action==="edit-student")openStudent(s);
      if(b.dataset.action==="student-challan")printChallan(s);
      if(b.dataset.action==="delete-student"&&confirm(`Delete student "${s.full_name}"? A student with fee transactions cannot be deleted.`)){
        try{await AcademyAPI.del(`/students/${s.id}`);toast("Student deleted.");await studentPage();}catch(err){toast(err.message,true);}
      }
    });
  }
  function studentTable(list){return table(["Student","Student ID","Class / Section","Monthly fee","Status","Actions"],list.map(s=>`<tr><td><strong>${esc(s.full_name)}</strong><small class="cell-sub">${esc(s.father_name)}</small></td><td>${esc(s.student_code)}</td><td>${esc(s.classes?.name||"—")} / ${esc(s.sections?.name||"—")}</td><td>${money(s.monthly_fee)}</td><td><span class="status ${s.status}">${esc(s.status)}</span></td><td class="actions"><button class="text-action" data-action="edit-student" data-id="${s.id}">Edit</button><button class="text-action" data-action="student-challan" data-id="${s.id}">Challan</button><button class="text-action danger-text" data-action="delete-student" data-id="${s.id}">Delete</button></td></tr>`).join(""));}
  async function classPage(){
    classes=await AcademyAPI.get("/classes");
    content.innerHTML=`${sectionHead("Classes & sections","Organize students by class and section.",button("Add class",'data-action="add-class"'))}
      <div class="class-grid">${classes.map(c=>`<article class="class-card"><div class="class-card-top"><span class="class-symbol">▤</span><div class="inline-actions"><button class="text-action" data-action="edit-class" data-id="${c.id}">Edit</button><button class="text-action danger-text" data-action="delete-class" data-id="${c.id}">Delete</button></div></div><h3>${esc(c.name)}</h3><p>${esc(c.description||"No description added.")}</p><div class="section-list"><div class="section-list-head"><strong>Sections</strong><button class="text-action" data-action="add-section" data-id="${c.id}">＋ Add</button></div>${(c.sections||[]).map(s=>`<div class="section-row"><span>${esc(s.name)}</span><span class="inline-actions"><button class="text-action" data-action="edit-section" data-id="${s.id}" data-name="${esc(s.name)}">Edit</button><button class="text-action danger-text" data-action="delete-section" data-id="${s.id}">×</button></span></div>`).join("")||'<p class="muted tiny">No sections yet.</p>'}</div></article>`).join("")||empty("No classes yet","Add the first class to get started.")}</div>`;
    content.querySelector('[data-action="add-class"]').addEventListener("click",()=>openDialog("Add class",[{name:"name",label:"Class name",required:true},{name:"description",label:"Description",type:"textarea"}],null,async v=>AcademyAPI.post("/classes",v)));
    content.addEventListener("click",async e=>{const b=e.target.closest("button[data-action]");if(!b)return;const c=classes.find(x=>x.id===b.dataset.id);
      try{
        if(b.dataset.action==="edit-class"&&c)openDialog("Edit class",[{name:"name",label:"Class name",required:true},{name:"description",label:"Description",type:"textarea"}],c,async v=>AcademyAPI.put(`/classes/${c.id}`,v));
        if(b.dataset.action==="delete-class"&&c&&confirm(`Delete class "${c.name}" and its sections? Students in this class will become unassigned.`)){await AcademyAPI.del(`/classes/${c.id}`);toast("Class deleted.");await classPage();}
        if(b.dataset.action==="add-section"&&c)openDialog("Add section",[{name:"name",label:"Section name",required:true}],null,async v=>AcademyAPI.post(`/classes/${c.id}/sections`,v));
        if(b.dataset.action==="edit-section")openDialog("Edit section",[{name:"name",label:"Section name",required:true}],{name:b.dataset.name},async v=>AcademyAPI.put(`/classes/sections/${b.dataset.id}`,v));
        if(b.dataset.action==="delete-section"&&confirm("Delete this section?")){await AcademyAPI.del(`/classes/sections/${b.dataset.id}`);toast("Section deleted.");await classPage();}
      }catch(err){toast(err.message,true);}
    },{once:true});
  }
  async function feePage(){
    [classes,students]=await Promise.all([AcademyAPI.get("/classes"),AcademyAPI.get("/students")]);
    const payments=await AcademyAPI.get("/fees");
    content.innerHTML=`${sectionHead("Fee management","Record fee payments and keep a searchable transaction history.",button("Record payment",'data-action="add-payment"'))}
      <div class="panel"><div class="panel-heading"><div><h3>Payment history</h3><p>Latest 500 transactions · print a challan or receipt from any payment</p></div><span class="count-chip">${payments.length} payments</span></div>
      ${table(["Student","Fee period","Paid on","Method","Amount","Receipt"],payments.map(p=>`<tr><td><strong>${esc(p.students?.full_name||"Student")}</strong><small class="cell-sub">${esc(p.students?.student_code||"")}</small></td><td>${esc(p.period)}</td><td>${esc(p.paid_on)}</td><td>${esc(p.method)}</td><td><strong>${money(p.amount)}</strong></td><td><button class="text-action" data-receipt="${p.id}">Print receipt</button></td></tr>`).join(""))}</div>`;
    content.querySelector('[data-action="add-payment"]').addEventListener("click",()=>openDialog("Record fee payment",[
      {name:"student_id",label:"Student",type:"select",options:students.map(s=>({value:s.id,label:`${s.full_name} (${s.student_code})` })),required:true},
      {name:"amount",label:"Amount (PKR)",type:"number",min:"0.01",step:"0.01",required:true},
      {name:"period",label:"Fee period (e.g. 2026-10)",value:month(),required:true},
      {name:"paid_on",label:"Payment date",type:"date",value:today(),required:true},
      {name:"method",label:"Payment method",type:"select",value:"cash",options:[{value:"cash",label:"Cash"},{value:"bank",label:"Bank"},{value:"online",label:"Online"},{value:"other",label:"Other"}]},
      {name:"reference",label:"Receipt / reference number"},{name:"note",label:"Notes",type:"textarea"}
    ],null,async v=>AcademyAPI.post("/fees",v)));
    content.addEventListener("click",e=>{const b=e.target.closest("[data-receipt]");if(!b)return;const p=payments.find(x=>x.id===b.dataset.receipt);if(p)printReceipt(p);});
  }
  function printChallan(s){
    const w=window.open("","_blank","width=720,height=700");if(!w){toast("Please allow pop-ups to print the challan.",true);return;}
    const period=month();
    w.document.write(`<!doctype html><html><head><title>Fee Challan</title><style>body{font:15px Arial;padding:35px;color:#17263c}h1{margin-bottom:4px}.muted{color:#68758a;font-size:12px}.row{display:flex;justify-content:space-between;padding:12px 0;border-bottom:1px solid #eee}.amount{font-size:25px;font-weight:bold;margin-top:8px}.copy{border:1px dashed #9ba8b8;padding:20px;margin-top:25px}@media print{button{display:none}}</style></head><body><h1>Doctors Academy Bhakkar</h1><p class="muted">Monthly fee challan · Student copy</p><hr/><div class="row"><span>Student name</span><strong>${esc(s.full_name)}</strong></div><div class="row"><span>Student ID</span><strong>${esc(s.student_code)}</strong></div><div class="row"><span>Father name</span><strong>${esc(s.father_name)}</strong></div><div class="row"><span>Class / Section</span><strong>${esc(s.classes?.name||"—")} / ${esc(s.sections?.name||"—")}</strong></div><div class="row"><span>Fee period</span><strong>${esc(period)}</strong></div><div class="row"><span>Due amount</span><strong class="amount">${money(s.monthly_fee)}</strong></div><p class="muted">Please retain this challan for your records. Payment is not recorded until the academy records a transaction in the portal.</p><button onclick="window.print()">Print challan</button></body></html>`);w.document.close();
  }
  function printReceipt(p){
    const w=window.open("","_blank","width=720,height=700");if(!w){toast("Please allow pop-ups to print the receipt.",true);return;}
    w.document.write(`<!doctype html><html><head><title>Fee Receipt</title><style>body{font:15px Arial;padding:35px;color:#17263c}h1{margin-bottom:4px}hr{border:0;border-top:1px solid #ddd;margin:24px 0}.row{display:flex;justify-content:space-between;padding:12px 0;border-bottom:1px solid #eee}.amount{font-size:24px;font-weight:bold}small{color:#68758a}</style></head><body><h1>Doctors Academy Bhakkar</h1><small>Fee payment receipt</small><hr/><div class="row"><span>Student</span><strong>${esc(p.students?.full_name)}</strong></div><div class="row"><span>Student ID</span><strong>${esc(p.students?.student_code)}</strong></div><div class="row"><span>Fee period</span><strong>${esc(p.period)}</strong></div><div class="row"><span>Payment date</span><strong>${esc(p.paid_on)}</strong></div><div class="row"><span>Method</span><strong>${esc(p.method)}</strong></div><div class="row"><span>Reference</span><strong>${esc(p.reference||"—")}</strong></div><hr/><p>Total paid</p><div class="amount">${money(p.amount)}</div><p><small>Generated from the academy management portal.</small></p><script>window.onload=()=>window.print()<\/script></body></html>`);w.document.close();
  }
  async function expensePage(){
    const expenses=await AcademyAPI.get("/expenses");
    content.innerHTML=`${sectionHead("Academy expenses","Track rent, utilities, supplies, salaries, and other spending.",button("Add expense",'data-action="add-expense"'))}
      <div class="panel"><div class="panel-heading"><div><h3>Expense records</h3><p>Saved spending records from your database</p></div><span class="count-chip">${money(expenses.reduce((s,x)=>s+Number(x.amount),0))} total</span></div>
      ${table(["Expense","Category","Date","Amount","Notes","Actions"],expenses.map(x=>`<tr><td><strong>${esc(x.title)}</strong></td><td>${esc(x.category)}</td><td>${esc(x.spent_on)}</td><td><strong>${money(x.amount)}</strong></td><td>${esc(x.note||"—")}</td><td class="actions"><button class="text-action" data-edit="${x.id}">Edit</button><button class="text-action danger-text" data-delete="${x.id}">Delete</button></td></tr>`).join(""))}</div>`;
    const fields=[{name:"title",label:"Expense title",required:true},{name:"category",label:"Category",required:true},{name:"amount",label:"Amount (PKR)",type:"number",min:"0.01",step:"0.01",required:true},{name:"spent_on",label:"Date",type:"date",value:today(),required:true},{name:"note",label:"Notes",type:"textarea"}];
    content.querySelector('[data-action="add-expense"]').addEventListener("click",()=>openDialog("Add expense",fields,null,v=>AcademyAPI.post("/expenses",v)));
    content.addEventListener("click",e=>{const edit=e.target.closest("[data-edit]"),del=e.target.closest("[data-delete]");if(edit){const x=expenses.find(y=>y.id===edit.dataset.edit);openDialog("Edit expense",fields,x,v=>AcademyAPI.put(`/expenses/${x.id}`,v));}if(del){const x=expenses.find(y=>y.id===del.dataset.delete);if(confirm(`Delete expense "${x.title}"?`))AcademyAPI.del(`/expenses/${x.id}`).then(()=>{toast("Expense deleted.");expensePage();}).catch(err=>toast(err.message,true));}});
  }
  async function reportPage(){
    const [d,payments,expenses]=await Promise.all([AcademyAPI.get("/dashboard"),AcademyAPI.get("/fees"),AcademyAPI.get("/expenses")]);
    content.innerHTML=`${sectionHead("Financial reports","A clear summary of recorded cash flow and outstanding fees.",'<button class="btn btn-secondary" id="print-report">Print report ↗</button>')}
      <div class="report-banner"><p class="eyebrow">NET CASH POSITION</p><strong>${money(d.netIncome)}</strong><p>All recorded payments minus all recorded expenses.</p></div>
      <div class="report-grid">${reportMetric("All-time fees collected",money(d.feesCollected),"Payments recorded in the database")}${reportMetric("Outstanding fees (current month)",money(d.pendingFees),"Estimated from active student monthly fees")}${reportMetric("All-time expenses",money(d.expenses),"All saved expense records")}${reportMetric("Income this month",money(d.monthlyIncome),"Payments received in the current month")}</div>
      <div class="panel"><div class="panel-heading"><div><h3>Recent payments</h3><p>Latest saved transactions</p></div></div>${table(["Student","Period","Date","Amount"],payments.slice(0,10).map(p=>`<tr><td>${esc(p.students?.full_name||"—")}</td><td>${esc(p.period)}</td><td>${esc(p.paid_on)}</td><td><strong>${money(p.amount)}</strong></td></tr>`).join(""))}</div>
      <div class="panel"><div class="panel-heading"><div><h3>Recent expenses</h3><p>Latest saved spending</p></div></div>${table(["Expense","Category","Date","Amount"],expenses.slice(0,10).map(x=>`<tr><td>${esc(x.title)}</td><td>${esc(x.category)}</td><td>${esc(x.spent_on)}</td><td><strong>${money(x.amount)}</strong></td></tr>`).join(""))}</div>`;
    $("#print-report").addEventListener("click",()=>window.print());
  }
  function reportMetric(label,value,caption){return `<div class="report-metric"><span>${label}</span><strong>${value}</strong><small>${caption}</small></div>`;}
  function openStudent(s=null){
    const fields=[
      {name:"student_code",label:"Student ID / roll number",required:true,value:s?.student_code||""},
      {name:"full_name",label:"Student full name",required:true,value:s?.full_name||""},
      {name:"father_name",label:"Father name",required:true,value:s?.father_name||""},
      {name:"phone",label:"Phone number",value:s?.phone||""},
      {name:"monthly_fee",label:"Monthly fee (PKR)",type:"number",min:"0",step:"0.01",required:true,value:s?.monthly_fee??0},
      {name:"class_id",label:"Class",type:"select",options:[{value:"",label:"Unassigned"},...classes.map(c=>({value:c.id,label:c.name}))],value:s?.class_id||""},
      {name:"section_id",label:"Section",type:"select",options:[{value:"",label:"Unassigned"},...classes.flatMap(c=>(c.sections||[]).map(sec=>({value:sec.id,label:`${c.name} — ${sec.name}`,classId:c.id})))],value:s?.section_id||""},
      {name:"status",label:"Status",type:"select",value:s?.status||"active",options:[{value:"active",label:"Active"},{value:"inactive",label:"Inactive"}]},
      {name:"enrolled_on",label:"Enrollment date",type:"date",value:s?.enrolled_on||today()}
    ];
    openDialog(s?"Edit student":"Add student",fields,s,async v=>s?AcademyAPI.put(`/students/${s.id}`,v):AcademyAPI.post("/students",v));
  }
  function openDialog(title,fields,record,save){
    editing={save}; $("#dialog-title").textContent=title;$("#dialog-error").textContent="";
    $("#dialog-fields").innerHTML=fields.map(f=>{const value=record?.[f.name]??f.value??"";
      if(f.type==="select")return `<label class="field"><span>${f.label}${f.required?' *':''}</span><select name="${f.name}" ${f.required?"required":""}>${(f.options||[]).map(o=>`<option value="${esc(o.value)}" ${String(o.value)===String(value)?"selected":""}>${esc(o.label)}</option>`).join("")}</select></label>`;
      if(f.type==="textarea")return `<label class="field field-wide"><span>${f.label}</span><textarea name="${f.name}" rows="3">${esc(value)}</textarea></label>`;
      return `<label class="field"><span>${f.label}${f.required?' *':''}</span><input name="${f.name}" type="${f.type||"text"}" value="${esc(value)}" ${f.min?`min="${f.min}"`:""} ${f.step?`step="${f.step}"`:""} ${f.required?"required":""}></label>`;
    }).join("");
    // If a section is chosen, ensure it belongs to the selected class.
    const classSelect=$("#dialog-fields [name=class_id]"), sectionSelect=$("#dialog-fields [name=section_id]");
    if(classSelect&&sectionSelect){const update=()=>{const cid=classSelect.value;[...sectionSelect.options].forEach(o=>{if(o.dataset.classId)o.hidden=!!cid&&o.dataset.classId!==cid;});if(sectionSelect.selectedOptions[0]?.hidden)sectionSelect.value="";};
      [...sectionSelect.options].forEach((o,i)=>{const f=fields.find(x=>x.name==="section_id");const opt=f?.options?.find(z=>String(z.value)===o.value);if(opt?.classId)o.dataset.classId=opt.classId;});classSelect.addEventListener("change",update);update();}
    dialog.showModal();
  }
  function closeDialog(){dialog.close();editing=null;form.reset();}
  async function saveDialog(e){
    e.preventDefault();if(!editing)return;
    const save=$("#dialog-save");save.disabled=true;save.textContent="Saving…";$("#dialog-error").textContent="";
    try{
      const data=Object.fromEntries(new FormData(form).entries());
      await editing.save(data);closeDialog();toast("Record saved successfully.");await render();
    }catch(err){$("#dialog-error").textContent=err.message||"Could not save this record.";}
    finally{save.disabled=false;save.textContent="Save record";}
  }
  init();
})();
