/* ═══════════════════════════════════════════════════════════════════════════
   SAKSHYA (साक्ष्य) : INTERACTIVE ENGINE & ANIMATIONS
   Section 63 & Section 57 Bharatiya Sakshya Adhiniyam (BSA) 2023 Compliance
   ═══════════════════════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

    /* ═══════════════════════════════════════════════
       1. DYNAMIC BRUTALIST GRID ANIMATION
    ═══════════════════════════════════════════════ */
    const gridContainer = document.getElementById('grid-container');

    function setupGrid() {
        if (!gridContainer) return;
        gridContainer.innerHTML = '';
        const cellSize = 50;
        const cols = Math.ceil(window.innerWidth / cellSize);
        const rows = Math.ceil(window.innerHeight / cellSize);
        gridContainer.style.gridTemplateColumns = `repeat(${cols}, ${cellSize}px)`;
        gridContainer.style.gridTemplateRows = `repeat(${rows}, ${cellSize}px)`;

        const totalCells = cols * rows;
        for (let i = 0; i < totalCells; i++) {
            const cell = document.createElement('div');
            cell.className = 'grid-cell';
            gridContainer.appendChild(cell);
        }
    }

    setupGrid();
    window.addEventListener('resize', () => {
        clearTimeout(window.resizeTimer);
        window.resizeTimer = setTimeout(setupGrid, 200);
    });

    setInterval(() => {
        const cells = document.querySelectorAll('.grid-cell');
        if (cells.length === 0) return;

        const numToSlide = Math.floor(Math.random() * 3) + 1;
        for (let i = 0; i < numToSlide; i++) {
            const randomIdx = Math.floor(Math.random() * cells.length);
            const cell = cells[randomIdx];

            if (cell.classList.contains('slide-right') || cell.classList.contains('slide-down')) continue;

            const dirClass = Math.random() > 0.5 ? 'slide-right' : 'slide-down';
            cell.classList.add(dirClass);

            setTimeout(() => {
                cell.classList.remove(dirClass);
            }, 2500);
        }
    }, 500);

    /* ═══════════════════════════════════════════════
       2. SCROLL REVEAL OBSERVER
    ═══════════════════════════════════════════════ */
    const reveals = document.querySelectorAll('.reveal');
    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                obs.unobserve(entry.target);
            }
        });
    }, { rootMargin: '0px 0px -40px 0px', threshold: 0.08 });

    reveals.forEach(el => observer.observe(el));

    /* ═══════════════════════════════════════════════
       3. 14 AGENT REGISTRY DATASET & FILTERING
    ═══════════════════════════════════════════════ */
    const AGENTS_DATA = [
        {
            id: "normalizer",
            name: "Normalizer Agent",
            tier: "A",
            tierName: "Ingestion (Always On)",
            desc: "Unifies PDF/PPTX/video/audio/image/chat into extraction units, recursively unpacking embedded sub-objects.",
            inputs: "PDF, PPTX, MP4, WAV, ZIP",
            outputs: "Extracted file units, Hash index",
            library: "Apache Tika, PyMuPDF, python-pptx",
            agentic: "Deterministic Tool"
        },
        {
            id: "ocr",
            name: "OCR Agent",
            tier: "A",
            tierName: "Ingestion (Always On)",
            desc: "Extracts readable text from images, scans, and chat screenshots, normalizing character noise for search.",
            inputs: "PNG, JPG, Screen Grabs",
            outputs: "Structured Text, Bounding Boxes",
            library: "Tesseract / EasyOCR",
            agentic: "Deterministic Tool"
        },
        {
            id: "metadata",
            name: "Metadata / EXIF Agent",
            tier: "A",
            tierName: "Ingestion (Always On)",
            desc: "Parses GPS coordinates, creation timestamps, camera models, and device serials across media formats.",
            inputs: "Raw media binary stream",
            outputs: "GeoJSON, ISO Timestamps, Serial IDs",
            library: "ExifTool / PyExif",
            agentic: "Deterministic Tool"
        },
        {
            id: "hashmatch",
            name: "Hash Match Agent",
            tier: "B",
            tierName: "Core Specialist",
            desc: "Known-content lookup against CSAM hash repositories (PDQ vs Project VIC / NCMEC / CAID lists).",
            inputs: "File Byte Stream",
            outputs: "Match Flag, Hash Distance",
            library: "PDQ Hash / SHA-256",
            agentic: "Deterministic Tool"
        },
        {
            id: "vision",
            name: "Vision Triage Agent",
            tier: "B",
            tierName: "Core Specialist",
            desc: "Risk-tiers unhashed media without requiring human viewing; applies automatic POCSO victim face masking.",
            inputs: "Unflagged Image / Video frames",
            outputs: "Risk Level (P0-P3), Blurred Preview",
            library: "Local VLM (Qwen2-VL / LLaVA)",
            agentic: "Deterministic Model"
        },
        {
            id: "face",
            name: "Face Correlation Agent",
            tier: "B",
            tierName: "Core Specialist",
            desc: "Cross-file identity clustering using ArcFace 512-d embeddings with calibrated cosine similarity thresholds.",
            inputs: "Cropped Face Image",
            outputs: "512-d Vector, Identity Node",
            library: "InsightFace (ArcFace) + FAISS",
            agentic: "Deterministic Math"
        },
        {
            id: "nlp",
            name: "NLP Correlation Agent",
            tier: "B",
            tierName: "Core Specialist",
            desc: "Alias and entity extraction, grooming-pattern detection across chat dumps; judges cross-file identity matches.",
            inputs: "Chat Logs, OCR Text",
            outputs: "Named Entities, Grooming Flags",
            library: "spaCy + Local LLM",
            agentic: "Agentic Judgment"
        },
        {
            id: "anpr",
            name: "ANPR Agent",
            tier: "B",
            tierName: "Core Specialist",
            desc: "Plate detection, OCR, and registration lookup against vehicle databases (VAHAN API integration ready).",
            inputs: "CCTV frames, Vehicle Photos",
            outputs: "Plate String, Vehicle Owner PII",
            library: "YOLOv8 + EasyOCR + VAHAN",
            agentic: "Deterministic Pipeline"
        },
        {
            id: "sec63",
            name: "Section 63 BSA Certificate Agent",
            tier: "C",
            tierName: "Legal & Compliance",
            desc: "Computes mandatory SHA-256 hashes and auto-populates the dual-part BSA Schedule certificate for IO signature.",
            inputs: "Flagged Evidence Node",
            outputs: "PDF Certificate (Part A & B)",
            library: "Python hashlib, ReportLab",
            agentic: "Deterministic Compliance"
        },
        {
            id: "watermark",
            name: "Watermark / IP Tracing Agent",
            tier: "D",
            tierName: "Intelligence Fusion",
            desc: "Reads hidden steganographic watermarks, correlating against IP logs to identify original seeders.",
            inputs: "Seized Image / Video",
            outputs: "Original Seeder IP, Downloader Graph",
            library: "zsteg / LSB-Analysis",
            agentic: "Deterministic Tool"
        },
        {
            id: "crypto",
            name: "Financial & Crypto Tracing Agent",
            tier: "D",
            tierName: "Intelligence Fusion",
            desc: "Extracts BTC, Monero addresses, UPI IDs, and cash handles; maps financial transactions into evidence network.",
            inputs: "Chat dumps, Text documents",
            outputs: "Crypto Node, Transaction Edge",
            library: "Regex Extraction + Chain APIs",
            agentic: "Deterministic + LLM"
        },
        {
            id: "drone",
            name: "Drone Telemetry Agent",
            tier: "D",
            tierName: "Intelligence Fusion",
            desc: "Extracts flight logs and GPS paths from seized drone storage; cross-references suspect phone GPS.",
            inputs: "DAT / BIN Drone Flight Logs",
            outputs: "Flight Path GeoJSON, Launch Point",
            library: "DJI / ArduPilot Parsers",
            agentic: "Deterministic Parser"
        },
        {
            id: "synthetic",
            name: "Synthetic / Nudify Detect Agent",
            tier: "D",
            tierName: "Intelligence Fusion",
            desc: "Flags diffusion artifacts and deepfake signatures; tags evidence REAL / SYNTHETIC to prioritize real-child safety.",
            inputs: "High-Risk Media",
            outputs: "Classification Label, Confidence",
            library: "FaceForensics++ CNN",
            agentic: "Deterministic Classifier"
        },
        {
            id: "risk",
            name: "Imminent-Danger Risk Scoring Agent",
            tier: "D",
            tierName: "Intelligence Fusion",
            desc: "Cross-agent rule engine combining proximity phrases and converging GPS signals to fire P0 immediate alerts.",
            inputs: "Graph Findings & Real-time GPS",
            outputs: "P0 Urgency Alert, Alert Push",
            library: "Convergence Rule Engine",
            agentic: "Rule Engine"
        },
        {
            id: "kidglove",
            name: "KidGlove Trend Exporter",
            tier: "E",
            tierName: "Prevention & Intake",
            desc: "Aggregates grooming tactics, strips PII, and exports anonymized trend reports for school awareness campaigns.",
            inputs: "Validated NLP Findings",
            outputs: "Anonymized Trend Brief",
            library: "LLM Anonymizer",
            agentic: "Generative Summary"
        },
        {
            id: "chargesheet",
            name: "Charge Sheet Compiler Agent",
            tier: "E",
            tierName: "Prevention & Intake",
            desc: "Drafts a chronological, legally formatted case summary from validated graph evidence for court submission.",
            inputs: "Approved Graph Subgraphs",
            outputs: "Legal Charge Sheet Draft",
            library: "LLM Template Engine",
            agentic: "Generative Compiler"
        }
    ];

    window.filterAgents = function(tier, ev) {
        const container = document.getElementById('agent-cards-container');
        if (!container) return;

        if (ev && ev.target) {
            document.querySelectorAll('.registry-tabs .tab-btn').forEach(btn => btn.classList.remove('active'));
            ev.target.classList.add('active');
        }

        const filtered = tier === 'all' ? AGENTS_DATA : AGENTS_DATA.filter(a => a.tier === tier);

        container.innerHTML = filtered.map(agent => `
            <div class="agent-card">
                <div>
                    <div class="agent-header">
                        <div class="agent-name">${agent.name}</div>
                        <div class="agent-tier-tag">Tier ${agent.tier}</div>
                    </div>
                    <div class="agent-desc">${agent.desc}</div>
                </div>
                <div class="agent-meta-box">
                    <div class="agent-meta-line">
                        <span class="agent-meta-label">Inputs:</span>
                        <span class="agent-meta-val">${agent.inputs}</span>
                    </div>
                    <div class="agent-meta-line">
                        <span class="agent-meta-label">Outputs:</span>
                        <span class="agent-meta-val">${agent.outputs}</span>
                    </div>
                    <div class="agent-meta-line">
                        <span class="agent-meta-label">Core Library:</span>
                        <span class="agent-meta-val" style="color:var(--accent-orange);">${agent.library}</span>
                    </div>
                    <div class="agent-meta-line" style="margin-top:0.4rem; padding-top:0.4rem; border-top:1px dashed #DDD;">
                        <span class="agent-meta-label">Classification:</span>
                        <span class="agent-meta-val">${agent.agentic}</span>
                    </div>
                </div>
            </div>
        `).join('');
    };

    filterAgents('all');

    /* ═══════════════════════════════════════════════
       4. INTERACTIVE SIMULATION & TERMINAL LOG ENGINE
    ═══════════════════════════════════════════════ */
    let simInterval = null;

    const PRESETS = {
        full: {
            name: "Full Investigation Preset",
            tasks: 54,
            nodesActive: ["normalizer", "ocr", "metadata", "hashmatch", "vision", "face", "nlp", "anpr", "sec63", "watermark", "crypto", "drone", "synthetic"],
            logs: [
                { type: "prompt", text: "$ python orchestrator.py --case-profile full_investigation" },
                { type: "muted", text: "[orchestrator] Initializing durable SQLite job table & Neo4j graph connection..." },
                { type: "reason", text: "Turn 1 : REASON: Unpack initial container PDF 'seizure_case_884.pdf'." },
                { type: "act", text: "Turn 1 : ACT: Normalizer_Agent(file='seizure_case_884.pdf')" },
                { type: "observe", text: "Turn 1 : OBSERVE: Unpacked 2 embedded PNGs (img_01.png, img_02.png) + 1 chat transcript." },
                { type: "reason", text: "Turn 2 : REASON: Check byte hashes against PDQ / NCMEC hash repository." },
                { type: "act", text: "Turn 2 : ACT: Hash_Match_Agent(files=['img_01.png', 'img_02.png'])" },
                { type: "alert", text: "Turn 2 : OBSERVE: KNOWN CONTENT MATCH! img_01.png SHA-256 = 71b70b91e28cc6d4..." },
                { type: "reason", text: "Turn 3 : REASON: Pre-fill Section 63 BSA certificate for matched evidence." },
                { type: "act", text: "Turn 3 : ACT: Sec63_BSA_Cert_Agent(file='img_01.png', hash='71b70b91e28cc6d4...')" },
                { type: "success", text: "Turn 3 : OBSERVE: Certificate pre-filled! BSA Schedule Part A & B generated." },
                { type: "reason", text: "Turn 4 : REASON: Extract suspect face embeddings from img_02.png & correlate." },
                { type: "act", text: "Turn 4 : ACT: Face_Correlation_Agent(file='img_02.png')" },
                { type: "observe", text: "Turn 4 : OBSERVE: Face vector generated. Cosine sim 0.68 vs Node 'Viper_09'. Auto-linked." },
                { type: "reason", text: "Turn 5 : REASON: Scan chat dump for financial transactions & crypto addresses." },
                { type: "act", text: "Turn 5 : ACT: Crypto_Financial_Agent(file='chat_log.txt')" },
                { type: "observe", text: "Turn 5 : OBSERVE: Found BTC Address 'bc1q9v8...'. Written to graph." },
                { type: "success", text: "[orchestrator] All 54 tasks completed cleanly in 3.62s. Job status: DONE." }
            ]
        },
        csam: {
            name: "CSAM ID Sprint Preset",
            tasks: 18,
            nodesActive: ["normalizer", "ocr", "metadata", "hashmatch", "vision", "synthetic"],
            logs: [
                { type: "prompt", text: "$ python orchestrator.py --case-profile csam_sprint" },
                { type: "muted", text: "[orchestrator] Preset: CSAM ID Sprint : Bypassing heavy network correlation." },
                { type: "reason", text: "Turn 1 : REASON: Fast hash triage on incoming batch of 18 images." },
                { type: "act", text: "Turn 1 : ACT: Hash_Match_Agent(batch_size=18)" },
                { type: "alert", text: "Turn 1 : OBSERVE: 3 Known Content Matches identified instantly." },
                { type: "reason", text: "Turn 2 : REASON: Run synthetic detection on unflagged media to filter AI noise." },
                { type: "act", text: "Turn 2 : ACT: Synthetic_Detect_Agent(files=15)" },
                { type: "observe", text: "Turn 2 : OBSERVE: 2 files flagged SYNTHETIC (diffusion artifacts). 13 REAL." },
                { type: "success", text: "[orchestrator] 18 tasks completed in 2.18s. CSAM Sprint Complete." }
            ]
        },
        network: {
            name: "Network Mapping Preset",
            tasks: 36,
            nodesActive: ["normalizer", "ocr", "metadata", "hashmatch", "face", "nlp", "anpr", "crypto", "watermark"],
            logs: [
                { type: "prompt", text: "$ python orchestrator.py --case-profile network_mapping" },
                { type: "muted", text: "[orchestrator] Executing cross-chunk entity resolution & identity clustering..." },
                { type: "act", text: "ACT: NLP_Correlation_Agent(query='Viper')" },
                { type: "observe", text: "OBSERVE: Found alias 'Viper_09' linked to phone +91-98765*****." },
                { type: "act", text: "ACT: ANPR_Agent(image='parking_cctv.jpg')" },
                { type: "observe", text: "OBSERVE: Plate 'KL-07-BX-4421' matched VAHAN owner record." },
                { type: "success", text: "[orchestrator] 36 network nodes and edges committed to Neo4j graph." }
            ]
        },
        drone: {
            name: "Drone-Linked Case Preset",
            tasks: 42,
            nodesActive: ["normalizer", "metadata", "drone", "face", "sec63"],
            logs: [
                { type: "prompt", text: "$ python orchestrator.py --case-profile drone_case" },
                { type: "muted", text: "[orchestrator] Ingesting seized DJI Mavic Pro SD Card storage..." },
                { type: "act", text: "ACT: Drone_Telemetry_Agent(file='FLY082.DAT')" },
                { type: "observe", text: "OBSERVE: Launch GPS 9.9816° N, 76.2999° E. Correlated with suspect phone location." },
                { type: "success", text: "[orchestrator] 42 tasks finished. Flight trajectory mapped." }
            ]
        }
    };

    window.runSimulation = function(profileKey) {
        const config = PRESETS[profileKey] || PRESETS.full;

        // Update active preset buttons
        document.querySelectorAll('.preset-btn').forEach(btn => btn.classList.remove('active'));
        const btn = document.getElementById(`btn-preset-${profileKey}`);
        if (btn) btn.classList.add('active');

        // Update Architecture Diagram active chips
        document.querySelectorAll('.arch-node-chip').forEach(chip => {
            const id = chip.id.replace('node-', '');
            if (config.nodesActive.includes(id) || ['normalizer', 'ocr', 'metadata'].includes(id)) {
                chip.classList.remove('disabled');
                chip.classList.add('active');
            } else {
                chip.classList.add('disabled');
                chip.classList.remove('active');
            }
        });

        // Stream terminal logs
        const terminalOutput = document.getElementById('terminal-output');
        if (!terminalOutput) return;
        terminalOutput.innerHTML = '';
        if (simInterval) clearInterval(simInterval);

        let i = 0;
        simInterval = setInterval(() => {
            if (i >= config.logs.length) {
                clearInterval(simInterval);
                return;
            }
            const log = config.logs[i];
            const div = document.createElement('div');
            if (log.type === 'prompt') div.className = 'prompt';
            else if (log.type === 'muted') div.className = 'muted';
            else if (log.type === 'reason') div.className = 'log-reason';
            else if (log.type === 'act') div.className = 'log-act';
            else if (log.type === 'observe') div.className = 'log-observe';
            else if (log.type === 'alert') div.className = 'log-alert';
            else if (log.type === 'success') div.className = 'log-success';

            div.innerText = log.text;
            terminalOutput.appendChild(div);
            terminalOutput.scrollTop = terminalOutput.scrollHeight;
            i++;
        }, 150);
    };

    window.simulateWorkerKill = function() {
        const terminalOutput = document.getElementById('terminal-output');
        if (!terminalOutput) return;
        const killLogs = [
            { type: "alert", text: "[SYSTEM] Sent SIGKILL to Worker process (PID 94102) at 48/54 tasks..." },
            { type: "muted", text: "[orchestrator] Heartbeat lost for worker-1 on task 'embedded_p1_0.png'. Task state: processing" },
            { type: "reason", text: "[orchestrator] Stale heartbeat detector triggered (timeout 90s). Reclaiming task..." },
            { type: "act", text: ">>> restarting worker process <<<" },
            { type: "success", text: "[worker-1-resumed] Startup: reclaimed 1 stale task(s) -> state set to queued" },
            { type: "act", text: "[worker-1-resumed] ACT: run 'normalizer' on embedded_p1_0.png" },
            { type: "success", text: "[orchestrator] Re-execution completed cleanly! 54/54 tasks done without touching 48 finished files." }
        ];

        let i = 0;
        const killInt = setInterval(() => {
            if (i >= killLogs.length) {
                clearInterval(killInt);
                return;
            }
            const log = killLogs[i];
            const div = document.createElement('div');
            div.className = log.type === 'alert' ? 'log-alert' : (log.type === 'success' ? 'log-success' : 'muted');
            div.innerText = log.text;
            terminalOutput.appendChild(div);
            terminalOutput.scrollTop = terminalOutput.scrollHeight;
            i++;
        }, 250);
    };

    window.clearTerminal = function() {
        const terminalOutput = document.getElementById('terminal-output');
        if (terminalOutput) terminalOutput.innerHTML = '<div class="muted">[terminal cleared]</div>';
    };

    // Run initial simulation
    runSimulation('full');

    /* ═══════════════════════════════════════════════
       5. MODAL WINDOW PREVIEW GENERATORS
    ═══════════════════════════════════════════════ */
    window.openCertModal = function() {
        const body = document.getElementById('cert-modal-body');
        if (body) {
            body.innerHTML = `
                <div style="font-family: var(--font-mono); font-size: 0.85rem; line-height: 1.8;">
                    <div style="border-bottom: 2px solid var(--border-hard); padding-bottom: 1rem; margin-bottom: 1.5rem; text-align: center;">
                        <h2 style="font-size: 1.3rem; text-transform: uppercase;">CERTIFICATE UNDER SECTION 63</h2>
                        <h3 style="font-size: 1rem; color: var(--accent-orange);">BHARATIYA SAKSHYA ADHINIYAM (BSA), 2023</h3>
                        <p style="color: var(--text-muted);">[ Schedule : Part A & Part B ]</p>
                    </div>

                    <div style="background: var(--bg-base); padding: 1rem; border: 1.5px solid var(--border-hard); margin-bottom: 1.5rem;">
                        <strong>PART A : HARDWARE & EXTRACTION IDENTIFIERS</strong><br>
                        • Case Ref: <code>SAKSHYA/FORENSIC/2026/EVD-884</code><br>
                        • Device Make / Model: Apple iPhone 15 Pro Max (Model A3106)<br>
                        • Serial / IMEI: <code>359281104829104</code> | MAC: <code>AC:DE:48:00:11:22</code><br>
                        • Forensic Clone Source: Bit-Stream Image <code>clone_drive_01.raw</code>
                    </div>

                    <div style="background: var(--bg-base); padding: 1rem; border: 1.5px solid var(--border-hard); margin-bottom: 1.5rem;">
                        <strong>PART B : CRYPTOGRAPHIC EVIDENCE VALIDATION BLOCK</strong><br>
                        • Target File Path: <code>/media/clone/var/mobile/Media/DCIM/100APPLE/IMG_8849.JPG</code><br>
                        • Cryptographic SHA-256 Hash:<br>
                        <code style="background:#FFF; padding:0.3rem; display:block; border:1px solid #111; margin:0.3rem 0; word-break:break-all; font-weight:bold; color:var(--accent-orange);">
                            71b70b91e28cc6d4fa8b21008c1e4590119f821a95c47890b21e001928471b8e
                        </code>
                        • Extraction Tool Engine: SAKSHYA Normalizer v1.2 (ALEAPP SQLite Parser Core)<br>
                        • Evidence Primary Status (Sec 57): Primary Evidence (Explanations 4 & 6 Cache Timeline Verified)
                    </div>

                    <div style="border-top: 2px dashed var(--border-hard); padding-top: 1rem; margin-top: 1.5rem;">
                        <p style="color: var(--accent-red); font-weight: bold;">
                            * MANDATORY LEGAL DISCLAIMER: Generated automatically by SAKSHYA Sec 63 Compliance Agent. Requires physical verification and signature by the Investigating Officer (IO). AI system cannot testify.
                        </p>
                        <div style="margin-top: 1.5rem; display: flex; justify-content: space-between; align-items: flex-end;">
                            <div>
                                <div>Date: <code>2026-08-13 22:41 IST</code></div>
                                <div>Location: Forensic Science Laboratory</div>
                            </div>
                            <div style="border-top: 1.5px solid #111; padding-top: 0.3rem; width: 220px; text-align: center; font-weight: bold;">
                                Signature of Investigating Officer<br>
                                (Name & Designation Seal)
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
        document.getElementById('cert-modal').classList.add('active');
    };

    window.closeCertModal = function() {
        document.getElementById('cert-modal').classList.remove('active');
    };

    window.openChargeSheetModal = function() {
        const body = document.getElementById('chargesheet-modal-body');
        if (body) {
            body.innerHTML = `
                <div style="font-family: var(--font-mono); font-size: 0.85rem; line-height: 1.8;">
                    <div style="background: var(--accent-navy); color: #FFF; padding: 1rem; border-radius: 6px; margin-bottom: 1.5rem;">
                        <span style="color: var(--accent-saffron); font-weight: bold;">AI-DRAFTED CHARGE SHEET SUMMARY (PENDING IO REVIEW)</span><br>
                        Case Ref: EVD-884 / Target: Alias 'Viper_09'<br>
                        Compiled From: 14 Validated Evidence Nodes & Neo4j Subgraph
                    </div>

                    <h4 style="font-weight: bold; text-transform: uppercase; margin-bottom: 0.5rem;">I. Chronological Narrative of Findings</h4>
                    <p style="color: var(--text-muted); margin-bottom: 1rem;">
                        1. On 2026-08-10 at 14:22:00, suspect using alias 'Viper_09' transmitted media artifact <code>IMG_8849.JPG</code> over Telegram chat (Ref: Chat Node #0912).<br>
                        2. EXIF Metadata Agent extracted embedded GPS coordinates <code>9.9816° N, 76.2999° E</code> (Ernakulam Beach House), created on iPhone 15 Pro.<br>
                        3. Face Correlation Agent matched face vector in <code>IMG_8849.JPG</code> against suspect identity node 'Viper_09' (ArcFace Cosine Similarity: 0.68).<br>
                        4. Financial Agent extracted BTC Wallet <code>bc1q9v8...</code> referenced in chat logs for illicit content transactions.
                    </p>

                    <h4 style="font-weight: bold; text-transform: uppercase; margin-bottom: 0.5rem;">II. Statutory Offenses & Admissible Exhibits</h4>
                    <div style="background: var(--bg-base); padding: 1rem; border: 1.5px solid var(--border-hard);">
                        • POCSO Act Section 14 / 15: Hash Matched CSAM Evidence (Exhibit A, SHA-256 Verified)<br>
                        • IT Act Section 67B: Transmission of Explicit Material (Exhibit B, Telegram Dump)<br>
                        • Section 63 BSA Certificate Ref: <code>CERT-BSA-2026-884-A</code>
                    </div>
                </div>
            `;
        }
        document.getElementById('chargesheet-modal').classList.add('active');
    };

    window.closeChargeSheetModal = function() {
        document.getElementById('chargesheet-modal-body');
        document.getElementById('chargesheet-modal').classList.remove('active');
    };

    // Close modals on background overlay click
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.classList.remove('active');
        });
    });
});

