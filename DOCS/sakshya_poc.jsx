import { useState, useEffect, useRef } from "react";

const CASE = {
  id: "CY-2026-0841",
  suspect: "VIPER (alias)",
  device: "iPhone 15 Pro — IMEI 35xxxxxxx",
  cloneHash: "sha256:71b70b91e28cc6d4…",
  certStatus: "pending_IO_signature",
};

const EVIDENCE_FILES = [
  { id: "f001", name: "IMG_8849.JPG", type: "image", size: "4.2 MB", status: "done", agents: ["normalizer","metadata","face_corr","hash_match"], risk: "P1", flagged: true },
  { id: "f002", name: "chat_screenshot.png", type: "image", size: "820 KB", status: "done", agents: ["normalizer","ocr","nlp"], risk: "P0", flagged: true },
  { id: "f003", name: "invoice_aug.pdf", type: "pdf", size: "1.1 MB", status: "done", agents: ["normalizer","ocr","financial"], risk: "P2", flagged: false },
  { id: "f004", name: "known_file_copy.png", type: "image", size: "210 KB", status: "done", agents: ["normalizer","hash_match"], risk: "P0", flagged: true },
  { id: "f005", name: "plate_capture.mp4", type: "video", size: "22 MB", status: "processing", agents: ["normalizer","anpr"], risk: "—", flagged: false },
  { id: "f006", name: "voice_note.m4a", type: "audio", size: "3.4 MB", status: "queued", agents: [], risk: "—", flagged: false },
];

const REVIEW_QUEUE = [
  { id: "r001", type: "face_correlation", title: "Identity link — IMG_8849.JPG ↔ person_B.jpg", confidence: 0.68, detail: "Cosine similarity 0.68 — above auto-link threshold (0.62). Corroborating signal: shared GPS coordinates (Ernakulam, 9.98°N 76.29°E). Recommend: confirm identity and merge nodes.", status: "pending" },
  { id: "r002", type: "nlp", title: "Grooming pattern flag — chat_screenshot.png", confidence: 0.83, detail: "OCR text contains phrases matching grooming indicators (secrecy instruction, gift-offering pattern). POCSO relevance flagged. Recommend: include in charge sheet.", status: "pending" },
];

const REACT_TRACE = [
  { turn: 1, reason: "Don't know what Viper has said yet — pull chat history first.", act: "NLP_Correlation_Agent(case_id, query='Viper')", observe: "Chat: 'Meet me at the coordinates of the beach house image I sent yesterday' — timestamp 2026-08-11 14:22:00" },
  { turn: 2, reason: "Message references an image 'sent yesterday'. Check images from this user near that timestamp for EXIF GPS.", act: "Metadata_EXIF_Agent(case_id, file_type='image', start='2026-08-10', end='2026-08-11')", observe: "IMG_8849.JPG has GPS 9.9816N 76.2999E (Ernakulam), iPhone 15 Pro" },
  { turn: 3, reason: "Location mapped, but confidence is moderate — temporal correlation only, not confirmed identity. Do not auto-report.", act: "Write finding to async human review queue.", observe: "Review item r001 created. Confidence: 0.68. Awaiting IO decision." },
];

const CERT_FIELDS = {
  "Part A — Device": { "Device model": "iPhone 15 Pro", "IMEI": "35xxxxxxx", "MAC address": "A4:xx:xx:xx:xx", "Clone SHA-256": "71b70b91e28cc6d4…" },
  "Part B — Expert validation": { "File hash (evidence_0091)": "sha256:8c1e…", "Extraction tool": "ALEAPP v3.x", "Certificate status": "Pending IO signature", "IO name (to sign)": "________________" },
};

const PROFILES = [
  { id: "sprint", label: "CSAM ID Sprint", agents: ["normalizer","hash_match"], tasks: 18, eta: "~2 hrs", desc: "Hash match + normalizer only. Fastest path to known-content identification." },
  { id: "full", label: "Full investigation", agents: ["normalizer","hash_match","ocr","metadata","face_corr","nlp","anpr","financial","section63"], tasks: 54, eta: "~40 hrs", desc: "All agents. Ends with BSA certificate + charge sheet draft." },
];

const AGENT_MAP = { normalizer:"Normalizer", hash_match:"Hash Match", ocr:"OCR", metadata:"Metadata/EXIF", face_corr:"Face Correlation", nlp:"NLP Correlation", anpr:"ANPR", financial:"Financial Tracing", section63:"Section 63 BSA" };

const riskColor = { "P0":"#dc2626", "P1":"#d97706", "P2":"#2563eb", "—":"#9ca3af" };
const riskBg = { "P0":"#fef2f2", "P1":"#fffbeb", "P2":"#eff6ff", "—":"#f9fafb" };

const statusIcon = { done:"✓", processing:"◌", queued:"○", failed:"✗" };
const statusColor = { done:"#16a34a", processing:"#d97706", queued:"#9ca3af", failed:"#dc2626" };

function Badge({ text, color, bg }) {
  return <span style={{ fontSize:11, fontWeight:500, padding:"2px 8px", borderRadius:99, background:bg||"#f1f5f9", color:color||"#475569", border:"0.5px solid #e2e8f0" }}>{text}</span>;
}

function SectionHeader({ icon, title, sub }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
      <span style={{ fontSize:18 }}>{icon}</span>
      <div>
        <div style={{ fontWeight:500, fontSize:15, color:"#0f172a" }}>{title}</div>
        {sub && <div style={{ fontSize:12, color:"#64748b" }}>{sub}</div>}
      </div>
    </div>
  );
}

export default function SAKSHYA() {
  const [tab, setTab] = useState("dashboard");
  const [profile, setProfile] = useState("sprint");
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState({ done:0, total:0 });
  const [crashDemo, setCrashDemo] = useState(null);
  const [queue, setQueue] = useState(REVIEW_QUEUE);
  const [traceStep, setTraceStep] = useState(0);
  const [certApproved, setCertApproved] = useState(false);
  const [chargeSheet, setChargeSheet] = useState(false);
  const [walkStep, setWalkStep] = useState(0);
  const intervalRef = useRef(null);

  const selectedProfile = PROFILES.find(p=>p.id===profile);

  function startScan() {
    const total = selectedProfile.tasks;
    setProgress({ done:0, total });
    setRunning(true);
    setCrashDemo(null);
    let done = 0;
    intervalRef.current = setInterval(() => {
      done += Math.floor(Math.random()*3)+1;
      if (done >= total) { done = total; clearInterval(intervalRef.current); setRunning(false); }
      setProgress({ done, total });
    }, 180);
  }

  function killWorker() {
    if (!running) return;
    clearInterval(intervalRef.current);
    const saved = progress.done;
    setCrashDemo({ phase:"crashed", saved });
    setTimeout(() => {
      setCrashDemo({ phase:"resuming", saved });
      let done = saved;
      const total = progress.total;
      intervalRef.current = setInterval(() => {
        done += Math.floor(Math.random()*2)+1;
        if (done >= total) { done = total; clearInterval(intervalRef.current); setRunning(false); setCrashDemo({ phase:"recovered", saved }); }
        setProgress({ done, total });
      }, 220);
    }, 1800);
  }

  function approveReview(id) { setQueue(q=>q.map(r=>r.id===id?{...r,status:"approved"}:r)); }
  function rejectReview(id) { setQueue(q=>q.map(r=>r.id===id?{...r,status:"rejected"}:r)); }

  const WALK_STEPS = [
    { label:"Open a case", tab:"dashboard", hint:"This is your case overview. All devices, clone hashes, and legal status at a glance. The IO starts every investigation here." },
    { label:"Choose a scan profile", tab:"scan", hint:"Toggle between Sprint (hash-only, ~2 hrs) and Full Investigation (~40 hrs). SAKSHYA only runs the agents you actually need — fewer agents, fewer tasks, less time." },
    { label:"Watch agents run live", tab:"scan", hint:"Start a scan and watch tasks complete in real time. Try killing the worker to see crash recovery — SAKSHYA resumes without re-touching completed files." },
    { label:"Review flagged evidence", tab:"evidence", hint:"Every P0 and P1 finding lands here. Low-confidence results wait in your review queue — SAKSHYA never auto-merges an identity without your approval." },
    { label:"Approve or reject findings", tab:"review", hint:"Face correlation and NLP flags show their confidence score and reasoning before you decide. Approve to add to the graph, reject to discard." },
    { label:"Sign the BSA certificate", tab:"certificate", hint:"Section 63, BSA 2023 requires your signature. SAKSHYA auto-populates every field — you verify and sign. AI accelerates. Humans certify." },
    { label:"Generate the charge sheet", tab:"chargesheet", hint:"One click. SAKSHYA drafts a chronological, evidence-cited document — always labelled 'AI-drafted, investigator-approved'." },
  ];

  function goWalkStep(i) {
    setWalkStep(i);
    setTab(WALK_STEPS[i].tab);
  }

  return (
    <div style={{ fontFamily:"system-ui,-apple-system,sans-serif", background:"#f8fafc", minHeight:600, display:"flex", flexDirection:"column" }}>
      {/* Top bar */}
      <div style={{ background:"#fff", borderBottom:"0.5px solid #e2e8f0", padding:"10px 20px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:28, height:28, borderRadius:6, background:"#0f172a", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <span style={{ color:"#fff", fontSize:13, fontWeight:600 }}>SA</span>
          </div>
          <div>
            <span style={{ fontWeight:600, fontSize:14, color:"#0f172a" }}>SAKSHYA</span>
            <span style={{ fontSize:11, color:"#64748b", marginLeft:8 }}>साक्ष्य · Kerala Police Cyberdome</span>
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <Badge text="Case CY-2026-0841" color="#1e40af" bg="#eff6ff" />
          <Badge text="POCSO / BSA 2023" color="#7c3aed" bg="#f5f3ff" />
          <Badge text={running?"● Scan running":"● Ready"} color={running?"#16a34a":"#64748b"} bg={running?"#f0fdf4":"#f8fafc"} />
        </div>
      </div>

      {/* Walkthrough banner */}
      <div style={{ background:"#fffbeb", borderBottom:"0.5px solid #fde68a", padding:"8px 20px", display:"flex", alignItems:"center", gap:12 }}>
        <span style={{ fontSize:12, color:"#92400e", fontWeight:500 }}>Walkthrough:</span>
        <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
          {WALK_STEPS.map((s,i)=>(
            <button key={i} onClick={()=>goWalkStep(i)} style={{ fontSize:11, padding:"3px 10px", borderRadius:99, border:`1px solid ${walkStep===i?"#d97706":"#e2e8f0"}`, background:walkStep===i?"#fef3c7":"#fff", color:walkStep===i?"#92400e":"#475569", cursor:"pointer", fontWeight:walkStep===i?500:400 }}>{i+1}. {s.label}</button>
          ))}
        </div>
      </div>
      {WALK_STEPS[walkStep] && (
        <div style={{ background:"#fff7ed", borderBottom:"0.5px solid #fed7aa", padding:"6px 20px", fontSize:12, color:"#9a3412" }}>
          <strong>Step {walkStep+1}:</strong> {WALK_STEPS[walkStep].hint}
          <span style={{ float:"right", display:"flex", gap:8 }}>
            {walkStep>0&&<button onClick={()=>goWalkStep(walkStep-1)} style={{ fontSize:11, border:"0.5px solid #fdba74", background:"#fff", borderRadius:4, padding:"2px 8px", cursor:"pointer", color:"#9a3412" }}>← Prev</button>}
            {walkStep<WALK_STEPS.length-1&&<button onClick={()=>goWalkStep(walkStep+1)} style={{ fontSize:11, border:"0.5px solid #fdba74", background:"#fff", borderRadius:4, padding:"2px 8px", cursor:"pointer", color:"#9a3412" }}>Next →</button>}
          </span>
        </div>
      )}

      {/* Nav */}
      <div style={{ background:"#fff", borderBottom:"0.5px solid #e2e8f0", padding:"0 20px", display:"flex", gap:0 }}>
        {[["dashboard","Case overview"],["scan","Scan console"],["evidence","Evidence files"],["review","Review queue"],["certificate","BSA certificate"],["chargesheet","Charge sheet"]].map(([id,label])=>(
          <button key={id} onClick={()=>setTab(id)} style={{ padding:"10px 14px", border:"none", borderBottom:`2px solid ${tab===id?"#0f172a":"transparent"}`, background:"transparent", fontSize:13, color:tab===id?"#0f172a":"#64748b", cursor:"pointer", fontWeight:tab===id?500:400 }}>{label}</button>
        ))}
      </div>

      {/* Body */}
      <div style={{ flex:1, padding:"20px", overflowY:"auto" }}>

        {/* === DASHBOARD === */}
        {tab==="dashboard" && (
          <div>
            <SectionHeader icon="🗂" title="Case CY-2026-0841" sub="Suspect: VIPER (alias) · Opened 2026-08-11 · Assigned to IO Ramesh Kumar" />
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))", gap:12, marginBottom:20 }}>
              {[["Total files","6"],["P0 alerts","2"],["Pending review","2"],["BSA cert status","Unsigned"]].map(([l,v])=>(
                <div key={l} style={{ background:"#f1f5f9", borderRadius:8, padding:"12px 14px" }}>
                  <div style={{ fontSize:12, color:"#64748b", marginBottom:4 }}>{l}</div>
                  <div style={{ fontSize:22, fontWeight:500, color:"#0f172a" }}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{ background:"#fff", border:"0.5px solid #e2e8f0", borderRadius:12, padding:"14px 18px", marginBottom:16 }}>
              <div style={{ fontSize:13, fontWeight:500, marginBottom:10, color:"#0f172a" }}>Device & chain of custody</div>
              <table style={{ width:"100%", fontSize:12, borderCollapse:"collapse" }}>
                <tbody>
                  {[["Device",CASE.device],["Clone SHA-256",CASE.cloneHash],["Write-blocker","Used — original never touched"],["Faraday isolation","Confirmed at seizure"],["Analysis target","Clone only"]].map(([k,v])=>(
                    <tr key={k}><td style={{ color:"#64748b", padding:"5px 0", width:160 }}>{k}</td><td style={{ color:"#0f172a", fontFamily:"monospace", fontSize:11 }}>{v}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ background:"#fef2f2", border:"0.5px solid #fca5a5", borderRadius:8, padding:"10px 14px", fontSize:12, color:"#991b1b" }}>
              <strong>⚠ P0 alert:</strong> 2 files matched known CSAM hash list. Requires immediate review and IO sign-off before disclosure.
            </div>
          </div>
        )}

        {/* === SCAN CONSOLE === */}
        {tab==="scan" && (
          <div>
            <SectionHeader icon="⚙" title="Scan console" sub="Choose a profile and run. Only selected agents execute — unused tiers never claim tasks." />
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:20 }}>
              {PROFILES.map(p=>(
                <div key={p.id} onClick={()=>{ if(!running) setProfile(p.id); }} style={{ background:"#fff", border:`1.5px solid ${profile===p.id?"#0f172a":"#e2e8f0"}`, borderRadius:12, padding:"14px 16px", cursor:running?"not-allowed":"pointer" }}>
                  <div style={{ fontWeight:500, fontSize:14, color:"#0f172a", marginBottom:4 }}>{p.label}</div>
                  <div style={{ fontSize:12, color:"#64748b", marginBottom:10 }}>{p.desc}</div>
                  <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                    {p.agents.map(a=><Badge key={a} text={AGENT_MAP[a]||a} color="#1e40af" bg="#eff6ff" />)}
                  </div>
                  <div style={{ marginTop:10, fontSize:12, color:"#475569" }}>Tasks: <strong>{p.tasks}</strong> · ETA: <strong>{p.eta}</strong></div>
                </div>
              ))}
            </div>

            <div style={{ display:"flex", gap:10, marginBottom:16 }}>
              <button onClick={startScan} disabled={running} style={{ padding:"8px 18px", background:running?"#e2e8f0":"#0f172a", color:running?"#94a3b8":"#fff", border:"none", borderRadius:6, fontSize:13, cursor:running?"not-allowed":"pointer", fontWeight:500 }}>
                {running?"Running…":"▶ Start scan"}
              </button>
              <button onClick={killWorker} disabled={!running} style={{ padding:"8px 18px", background:running?"#fef2f2":"#f8fafc", color:running?"#dc2626":"#94a3b8", border:`0.5px solid ${running?"#fca5a5":"#e2e8f0"}`, borderRadius:6, fontSize:13, cursor:running?"pointer":"not-allowed" }}>
                ✗ Kill worker (demo crash)
              </button>
            </div>

            {progress.total > 0 && (
              <div style={{ background:"#fff", border:"0.5px solid #e2e8f0", borderRadius:12, padding:"14px 18px", marginBottom:16 }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                  <span style={{ fontSize:13, fontWeight:500, color:"#0f172a" }}>Progress</span>
                  <span style={{ fontSize:13, color:"#64748b" }}>{progress.done} / {progress.total} tasks</span>
                </div>
                <div style={{ background:"#f1f5f9", borderRadius:99, height:8, overflow:"hidden" }}>
                  <div style={{ width:`${(progress.done/progress.total)*100}%`, height:"100%", background:"#0f172a", borderRadius:99, transition:"width 0.2s" }} />
                </div>
                {crashDemo && (
                  <div style={{ marginTop:10, fontSize:12, padding:"8px 12px", borderRadius:6,
                    background: crashDemo.phase==="crashed"?"#fef2f2": crashDemo.phase==="resuming"?"#fffbeb":"#f0fdf4",
                    color: crashDemo.phase==="crashed"?"#991b1b": crashDemo.phase==="resuming"?"#92400e":"#14532d",
                    border:`0.5px solid ${crashDemo.phase==="crashed"?"#fca5a5":crashDemo.phase==="resuming"?"#fde68a":"#86efac"}`
                  }}>
                    {crashDemo.phase==="crashed" && `✗ Worker killed. ${crashDemo.saved} tasks already done — preserved in job table.`}
                    {crashDemo.phase==="resuming" && `◌ Restarting worker… reclaiming 1 stale task. ${crashDemo.saved} completed tasks untouched.`}
                    {crashDemo.phase==="recovered" && `✓ Recovered. All ${progress.total} tasks complete. ${crashDemo.saved} tasks were never re-touched.`}
                  </div>
                )}
              </div>
            )}

            <div style={{ background:"#fff", border:"0.5px solid #e2e8f0", borderRadius:12, padding:"14px 18px" }}>
              <div style={{ fontSize:13, fontWeight:500, marginBottom:10, color:"#0f172a" }}>Orchestrator — ReAct reasoning trace</div>
              <div style={{ display:"flex", gap:8, marginBottom:12 }}>
                {REACT_TRACE.map((_,i)=><button key={i} onClick={()=>setTraceStep(i)} style={{ padding:"4px 12px", borderRadius:99, border:`0.5px solid ${traceStep===i?"#0f172a":"#e2e8f0"}`, background:traceStep===i?"#0f172a":"#fff", color:traceStep===i?"#fff":"#475569", fontSize:12, cursor:"pointer" }}>Turn {i+1}</button>)}
              </div>
              {(() => { const t = REACT_TRACE[traceStep]; return (
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  <div style={{ background:"#f0fdf4", border:"0.5px solid #86efac", borderRadius:6, padding:"8px 12px", fontSize:12 }}>
                    <span style={{ color:"#15803d", fontWeight:500 }}>REASON: </span><span style={{ color:"#14532d" }}>{t.reason}</span>
                  </div>
                  <div style={{ background:"#eff6ff", border:"0.5px solid #93c5fd", borderRadius:6, padding:"8px 12px", fontSize:12, fontFamily:"monospace" }}>
                    <span style={{ color:"#1d4ed8", fontWeight:500 }}>ACT: </span><span style={{ color:"#1e3a8a" }}>{t.act}</span>
                  </div>
                  <div style={{ background:"#fafafa", border:"0.5px solid #e2e8f0", borderRadius:6, padding:"8px 12px", fontSize:12 }}>
                    <span style={{ color:"#475569", fontWeight:500 }}>OBSERVE: </span><span style={{ color:"#0f172a" }}>{t.observe}</span>
                  </div>
                </div>
              ); })()}
              <div style={{ marginTop:10, fontSize:11, color:"#94a3b8" }}>No code told it this sequence — each step is derived from what the previous tool returned.</div>
            </div>
          </div>
        )}

        {/* === EVIDENCE === */}
        {tab==="evidence" && (
          <div>
            <SectionHeader icon="📁" title="Evidence files" sub="Sorted by risk. POCSO auto-redaction applied to all P0/P1 media before display." />
            <div style={{ background:"#fff", border:"0.5px solid #e2e8f0", borderRadius:12, overflow:"hidden" }}>
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
                <thead>
                  <tr style={{ background:"#f8fafc", borderBottom:"0.5px solid #e2e8f0" }}>
                    {["File","Type","Size","Status","Agents","Risk","Flagged"].map(h=><th key={h} style={{ padding:"8px 12px", textAlign:"left", color:"#64748b", fontWeight:500 }}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {EVIDENCE_FILES.sort((a,b)=>{"P0P1P2—".indexOf(a.risk)-"P0P1P2—".indexOf(b.risk)}).map((f,i)=>(
                    <tr key={f.id} style={{ borderBottom:"0.5px solid #f1f5f9", background:i%2===0?"#fff":"#fafafa" }}>
                      <td style={{ padding:"8px 12px", fontFamily:"monospace", color:"#0f172a" }}>{f.name}</td>
                      <td style={{ padding:"8px 12px", color:"#475569" }}>{f.type}</td>
                      <td style={{ padding:"8px 12px", color:"#475569" }}>{f.size}</td>
                      <td style={{ padding:"8px 12px" }}>
                        <span style={{ color:statusColor[f.status], fontWeight:500 }}>{statusIcon[f.status]} {f.status}</span>
                      </td>
                      <td style={{ padding:"8px 12px" }}>
                        <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                          {f.agents.map(a=><Badge key={a} text={AGENT_MAP[a]||a} />)}
                          {f.agents.length===0&&<span style={{ color:"#94a3b8" }}>—</span>}
                        </div>
                      </td>
                      <td style={{ padding:"8px 12px" }}>
                        <span style={{ fontSize:11, fontWeight:600, color:riskColor[f.risk], background:riskBg[f.risk], padding:"2px 8px", borderRadius:99 }}>{f.risk}</span>
                      </td>
                      <td style={{ padding:"8px 12px" }}>
                        {f.flagged ? <span style={{ color:"#dc2626" }}>⚑ Yes</span> : <span style={{ color:"#94a3b8" }}>—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* === REVIEW QUEUE === */}
        {tab==="review" && (
          <div>
            <SectionHeader icon="🔍" title="Review queue" sub="Low-confidence findings — SAKSHYA never auto-merges. You approve or reject each one." />
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {queue.map(r=>(
                <div key={r.id} style={{ background:"#fff", border:`0.5px solid ${r.status==="approved"?"#86efac":r.status==="rejected"?"#fca5a5":"#e2e8f0"}`, borderRadius:12, padding:"16px 18px" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                    <div>
                      <div style={{ fontWeight:500, fontSize:13, color:"#0f172a", marginBottom:4 }}>{r.title}</div>
                      <Badge text={r.type==="face_correlation"?"Face correlation":"NLP flag"} color="#7c3aed" bg="#f5f3ff" />
                    </div>
                    <div style={{ textAlign:"right" }}>
                      <div style={{ fontSize:11, color:"#64748b" }}>Confidence</div>
                      <div style={{ fontSize:20, fontWeight:500, color: r.confidence>=0.8?"#16a34a":r.confidence>=0.62?"#d97706":"#dc2626" }}>{(r.confidence*100).toFixed(0)}%</div>
                    </div>
                  </div>
                  <div style={{ background:"#f8fafc", borderRadius:6, padding:"8px 12px", fontSize:12, color:"#475569", marginBottom:12 }}>{r.detail}</div>
                  {r.status==="pending" ? (
                    <div style={{ display:"flex", gap:8 }}>
                      <button onClick={()=>approveReview(r.id)} style={{ padding:"6px 16px", background:"#f0fdf4", border:"0.5px solid #86efac", borderRadius:6, color:"#15803d", fontSize:12, cursor:"pointer", fontWeight:500 }}>✓ Approve & add to graph</button>
                      <button onClick={()=>rejectReview(r.id)} style={{ padding:"6px 16px", background:"#fef2f2", border:"0.5px solid #fca5a5", borderRadius:6, color:"#dc2626", fontSize:12, cursor:"pointer" }}>✗ Reject</button>
                    </div>
                  ) : (
                    <div style={{ fontSize:12, fontWeight:500, color:r.status==="approved"?"#15803d":"#dc2626" }}>
                      {r.status==="approved"?"✓ Approved — node added to evidence graph":"✗ Rejected — finding discarded"}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* === CERTIFICATE === */}
        {tab==="certificate" && (
          <div>
            <SectionHeader icon="📜" title="Section 63 BSA certificate" sub="Auto-populated by the SHA-256 agent. Requires IO signature — AI cannot certify." />
            <div style={{ background:"#fff", border:"0.5px solid #e2e8f0", borderRadius:12, padding:"18px 20px", marginBottom:16 }}>
              {Object.entries(CERT_FIELDS).map(([section, fields])=>(
                <div key={section} style={{ marginBottom:16 }}>
                  <div style={{ fontSize:12, fontWeight:500, color:"#7c3aed", marginBottom:8, borderBottom:"0.5px solid #e2e8f0", paddingBottom:6 }}>{section}</div>
                  <table style={{ width:"100%", fontSize:12 }}>
                    <tbody>
                      {Object.entries(fields).map(([k,v])=>(
                        <tr key={k}><td style={{ color:"#64748b", padding:"5px 0", width:200 }}>{k}</td><td style={{ fontFamily:"monospace", color:"#0f172a" }}>{v}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
              <div style={{ background:"#fffbeb", border:"0.5px solid #fde68a", borderRadius:6, padding:"10px 14px", fontSize:12, color:"#92400e", marginBottom:16 }}>
                <strong>⚠ Statutory requirement (Section 63, BSA 2023):</strong> This certificate must be personally signed by the Investigating Officer. The AI has pre-populated every field — you verify and sign.
              </div>
              {!certApproved ? (
                <button onClick={()=>setCertApproved(true)} style={{ padding:"8px 20px", background:"#0f172a", color:"#fff", border:"none", borderRadius:6, fontSize:13, cursor:"pointer", fontWeight:500 }}>
                  ✓ IO sign-off — I have verified all fields
                </button>
              ) : (
                <div style={{ display:"flex", alignItems:"center", gap:10, background:"#f0fdf4", border:"0.5px solid #86efac", borderRadius:6, padding:"10px 14px" }}>
                  <span style={{ color:"#15803d", fontWeight:500, fontSize:13 }}>✓ Certificate signed by IO — logged with timestamp 2026-08-13 14:32 IST</span>
                </div>
              )}
            </div>
            <div style={{ fontSize:12, color:"#94a3b8", fontStyle:"italic" }}>
              "AI accelerates. Humans certify." — This single sentence is SAKSHYA's answer to every ethics question a judge will raise.
            </div>
          </div>
        )}

        {/* === CHARGE SHEET === */}
        {tab==="chargesheet" && (
          <div>
            <SectionHeader icon="📋" title="Charge sheet draft" sub="AI-drafted from evidence graph. Always labelled — always IO-approved before filing." />
            {!chargeSheet ? (
              <button onClick={()=>setChargeSheet(true)} style={{ padding:"8px 20px", background:"#0f172a", color:"#fff", border:"none", borderRadius:6, fontSize:13, cursor:"pointer", fontWeight:500 }}>
                Generate charge sheet draft ↗
              </button>
            ) : (
              <div style={{ background:"#fff", border:"0.5px solid #e2e8f0", borderRadius:12, padding:"18px 20px" }}>
                <div style={{ background:"#fef2f2", border:"0.5px solid #fca5a5", borderRadius:6, padding:"8px 14px", fontSize:11, color:"#991b1b", marginBottom:16, fontWeight:500 }}>
                  ⚠ AI-DRAFTED — INVESTIGATOR MUST REVIEW AND APPROVE BEFORE FILING
                </div>
                <div style={{ fontSize:14, fontWeight:500, marginBottom:4, color:"#0f172a" }}>Case CY-2026-0841 — Charge sheet (draft)</div>
                <div style={{ fontSize:12, color:"#64748b", marginBottom:16 }}>Generated: 2026-08-13 · Suspect: VIPER (alias) · Sections: POCSO Act, IT Act 67B</div>
                {[
                  ["2026-08-10 14:22","Communication evidence","chat_screenshot.png (OCR-extracted) contains instructions consistent with POCSO Section 11 (grooming). NLP confidence: 83%. Flagged by NLP Correlation agent. IO approved 2026-08-13."],
                  ["2026-08-11 14:22","Location evidence","IMG_8849.JPG EXIF GPS: 9.9816°N 76.2999°E (Ernakulam). Face correlation with person_B.jpg: confidence 68%, approved by IO. Placed suspect at scene."],
                  ["2026-08-11","Known CSAM content","known_file_copy.png: SHA-256 matches NCMEC hash list entry 71b70b91…. Hash match deterministic — no AI inference involved. Section 63 BSA certificate signed by IO."],
                ].map(([ts,label,detail])=>(
                  <div key={ts} style={{ display:"flex", gap:14, marginBottom:14, paddingBottom:14, borderBottom:"0.5px solid #f1f5f9" }}>
                    <div style={{ width:140, flexShrink:0 }}>
                      <div style={{ fontSize:11, fontFamily:"monospace", color:"#475569" }}>{ts}</div>
                      <div style={{ fontSize:11, color:"#7c3aed", fontWeight:500, marginTop:2 }}>{label}</div>
                    </div>
                    <div style={{ fontSize:12, color:"#0f172a", lineHeight:1.6 }}>{detail}</div>
                  </div>
                ))}
                <div style={{ background:"#f0fdf4", border:"0.5px solid #86efac", borderRadius:6, padding:"10px 14px", fontSize:12, color:"#14532d" }}>
                  ✓ Charge sheet ready for IO review. All evidence nodes carry confidence scores and source citations. Filing requires IO sign-off.
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ background:"#fff", borderTop:"0.5px solid #e2e8f0", padding:"8px 20px", fontSize:11, color:"#94a3b8", display:"flex", justifyContent:"space-between" }}>
        <span>SAKSHYA POC · HACKP 2026 · Kerala Police Cyberdome</span>
        <span>Local-only LLM · Zero data leaves the machine · Fully air-gapped</span>
      </div>
    </div>
  );
}
