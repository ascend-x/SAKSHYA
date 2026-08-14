/* ═══════════════════════════════════════════════════════════════════════════
   SAKSHYA (साक्ष्य) : STANDALONE INVESTIGATOR WORKSTATION DASHBOARD ENGINE (/demo)
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
       2. WORKSTATION DASHBOARD STATE & LOGIC
    ═══════════════════════════════════════════════ */
    let wsCurrentWalkStep = 0;
    let wsSelectedProfile = 'sprint';
    let wsScanRunning = false;
    let wsScanInterval = null;
    let wsScanProgress = 0;
    let wsScanTotal = 18;
    let wsPendingReviewsCount = 2;

    const WS_WALK_STEPS = [
        {
            title: "Step 1: Open a case",
            tab: "dashboard",
            text: "This is your case overview. All seized devices, clone hashes, Faraday isolation records, and legal status at a glance. The IO starts every investigation here."
        },
        {
            title: "Step 2: Choose a scan profile",
            tab: "scan",
            text: "Toggle between CSAM ID Sprint (hash-only, ~2 hrs) and Full Investigation (~40 hrs). SAKSHYA only runs the agents you actually need — fewer agents, fewer tasks, less time."
        },
        {
            title: "Step 3: Watch agents run live & crash recovery",
            tab: "scan",
            text: "Start a scan and watch tasks complete in real time. Try killing the worker process to test crash recovery — SAKSHYA resumes automatically without re-touching finished files."
        },
        {
            title: "Step 4: Review & inspect evidence files",
            tab: "evidence",
            text: "Every P0 and P1 finding lands here. Click 'Inspect Artifact' on any file to view real EXIF GPS data, ArcFace vectors, hash values, and POCSO victim face privacy redactions."
        },
        {
            title: "Step 5: Approve or reject findings",
            tab: "review",
            text: "Face correlation and NLP flags show their confidence score and agent detail before you decide. Approve to write node edges to Neo4j graph, reject to discard."
        },
        {
            title: "Step 6: Sign the BSA Section 63 certificate",
            tab: "certificate",
            text: "Section 63, BSA 2023 requires your personal signature. SAKSHYA auto-populates every cryptographic field — enter your IO details and sign. AI accelerates; humans certify."
        },
        {
            title: "Step 7: Generate the charge sheet draft",
            tab: "chargesheet",
            text: "One click. SAKSHYA drafts a chronological, evidence-cited document — always labelled 'AI-drafted, investigator-approved' for court submission."
        }
    ];

    window.goWsWalkStep = function(stepIdx) {
        if (stepIdx < 0 || stepIdx >= WS_WALK_STEPS.length) return;
        wsCurrentWalkStep = stepIdx;
        const step = WS_WALK_STEPS[stepIdx];

        // Update step buttons
        document.querySelectorAll('.ws-step-btn').forEach((btn, i) => {
            if (i === stepIdx) btn.classList.add('active');
            else btn.classList.remove('active');
        });

        // Update hint text
        const titleEl = document.getElementById('ws-hint-step-title');
        const textEl = document.getElementById('ws-hint-step-text');
        if (titleEl) titleEl.innerText = step.title;
        if (textEl) textEl.innerText = step.text;

        // Update prev/next button states
        const prevBtn = document.getElementById('ws-prev-btn');
        const nextBtn = document.getElementById('ws-next-btn');
        if (prevBtn) prevBtn.disabled = stepIdx === 0;
        if (nextBtn) nextBtn.disabled = stepIdx === WS_WALK_STEPS.length - 1;

        // Switch workstation tab
        switchWsTab(step.tab);
    };

    window.nextWsWalkStep = function() {
        goWsWalkStep(wsCurrentWalkStep + 1);
    };

    window.prevWsWalkStep = function() {
        goWsWalkStep(wsCurrentWalkStep - 1);
    };

    window.switchWsTab = function(tabId) {
        // Update nav tab active class
        document.querySelectorAll('.ws-tab-btn').forEach(btn => {
            if (btn.id === `ws-tab-${tabId}`) btn.classList.add('active');
            else btn.classList.remove('active');
        });

        // Update panel active class
        document.querySelectorAll('.ws-panel').forEach(panel => {
            if (panel.id === `ws-panel-${tabId}`) panel.classList.add('active');
            else panel.classList.remove('active');
        });
    };

    window.selectWsProfile = function(profId) {
        if (wsScanRunning) return;
        wsSelectedProfile = profId;
        wsScanTotal = profId === 'sprint' ? 18 : 54;
        wsScanProgress = 0;

        document.querySelectorAll('.ws-profile-card').forEach(card => card.classList.remove('active'));
        const activeCard = document.getElementById(`ws-prof-${profId}`);
        if (activeCard) activeCard.classList.add('active');

        // Reset progress bar
        const bar = document.getElementById('ws-progress-bar');
        const text = document.getElementById('ws-progress-text');
        if (bar) bar.style.width = '0%';
        if (text) text.innerText = `0 / ${wsScanTotal} tasks completed (0%)`;

        const alertBox = document.getElementById('ws-crash-alert-box');
        if (alertBox) alertBox.style.display = 'none';
    };

    window.startWsScan = function() {
        if (wsScanRunning) return;
        wsScanRunning = true;
        wsScanProgress = 0;

        const startBtn = document.getElementById('ws-btn-start');
        const killBtn = document.getElementById('ws-btn-kill');
        if (startBtn) { startBtn.disabled = true; startBtn.innerText = 'Running Scan...'; }
        if (killBtn) { killBtn.disabled = false; killBtn.style.opacity = '1'; }

        const alertBox = document.getElementById('ws-crash-alert-box');
        if (alertBox) alertBox.style.display = 'none';

        if (wsScanInterval) clearInterval(wsScanInterval);

        wsScanInterval = setInterval(() => {
            wsScanProgress += Math.floor(Math.random() * 3) + 1;
            if (wsScanProgress >= wsScanTotal) {
                wsScanProgress = wsScanTotal;
                clearInterval(wsScanInterval);
                wsScanRunning = false;
                if (startBtn) { startBtn.disabled = false; startBtn.innerText = '▶ Start Live Scan'; }
                if (killBtn) { killBtn.disabled = true; killBtn.style.opacity = '0.5'; }
            }

            const pct = Math.round((wsScanProgress / wsScanTotal) * 100);
            const bar = document.getElementById('ws-progress-bar');
            const text = document.getElementById('ws-progress-text');
            if (bar) bar.style.width = `${pct}%`;
            if (text) text.innerText = `${wsScanProgress} / ${wsScanTotal} tasks completed (${pct}%)`;
        }, 200);
    };

    window.killWsWorker = function() {
        if (!wsScanRunning) return;
        clearInterval(wsScanInterval);

        const savedTasks = wsScanProgress;
        const alertBox = document.getElementById('ws-crash-alert-box');
        const startBtn = document.getElementById('ws-btn-start');
        const killBtn = document.getElementById('ws-btn-kill');

        if (alertBox) {
            alertBox.style.display = 'block';
            alertBox.innerHTML = `
                <div style="background: #FEF2F2; border: 1.5px solid #FCA5A5; padding: 0.85rem; border-radius: 6px; font-size: 0.82rem; color: #991B1B; font-family: var(--font-mono);">
                    <strong>⚡ SIGKILL SENT:</strong> Worker process terminated at ${savedTasks}/${wsScanTotal} tasks.<br>
                    • Heartbeat lost for task <code>embedded_chunk_04.png</code><br>
                    • ${savedTasks} finished tasks preserved in SQLite job table state <code>done</code>.
                </div>
            `;
        }

        setTimeout(() => {
            if (alertBox) {
                alertBox.innerHTML = `
                    <div style="background: #FFFBEB; border: 1.5px solid #FDE68A; padding: 0.85rem; border-radius: 6px; font-size: 0.82rem; color: #92400E; font-family: var(--font-mono);">
                        <strong>◌ RECOVERY DAEMON:</strong> Restarting worker... Reclaimed 1 stale task from 90s timeout queue.<br>
                        • Resuming scan execution without re-processing ${savedTasks} completed files.
                    </div>
                `;
            }

            let done = savedTasks;
            wsScanInterval = setInterval(() => {
                done += Math.floor(Math.random() * 2) + 1;
                if (done >= wsScanTotal) {
                    done = wsScanTotal;
                    clearInterval(wsScanInterval);
                    wsScanRunning = false;
                    if (startBtn) { startBtn.disabled = false; startBtn.innerText = '▶ Start Live Scan'; }
                    if (killBtn) { killBtn.disabled = true; killBtn.style.opacity = '0.5'; }

                    if (alertBox) {
                        alertBox.innerHTML = `
                            <div style="background: #ECFDF5; border: 1.5px solid #86EFAC; padding: 0.85rem; border-radius: 6px; font-size: 0.82rem; color: #14532D; font-family: var(--font-mono);">
                                <strong>✓ CRASH RECOVERY VERIFIED:</strong> All ${wsScanTotal} tasks complete.<br>
                                • Requeued stale task finished cleanly. ${savedTasks} previously completed tasks were never re-touched.
                            </div>
                        `;
                    }
                }

                wsScanProgress = done;
                const pct = Math.round((done / wsScanTotal) * 100);
                const bar = document.getElementById('ws-progress-bar');
                const text = document.getElementById('ws-progress-text');
                if (bar) bar.style.width = `${pct}%`;
                if (text) text.innerText = `${done} / ${wsScanTotal} tasks completed (${pct}%)`;
            }, 220);
        }, 1800);
    };

    /* ═══════════════════════════════════════════════
       3. CUSTOM REACT REASONING CONSOLE ENGINE
    ═══════════════════════════════════════════════ */
    const PRESET_QUERIES = {
        grooming: {
            reason: "Suspect chats indicate potential grooming patterns. Scan OCR text and chat transcripts for secrecy phrases.",
            act: "NLP_Correlation_Agent(case_id='CY-2026-0841', pattern='grooming_secrecy')",
            observe: "Flagged 'chat_screenshot.png': Contains secrecy instruction ('don't tell anyone') + meeting request. NLP confidence: 83%. POCSO relevance flagged."
        },
        gps: {
            reason: "User references 'the beach house image'. Pull image EXIF records created between Aug 10 and Aug 11.",
            act: "Metadata_EXIF_Agent(case_id='CY-2026-0841', start_date='2026-08-10', end_date='2026-08-11')",
            observe: "Extracted EXIF from 'IMG_8849.JPG': GPS 9.9816° N, 76.2999° E (Ernakulam Beach House). Device: iPhone 15 Pro."
        },
        face: {
            reason: "Extract suspect face embeddings from seized photos and compare with reference profile 'person_B.jpg'.",
            act: "Face_Correlation_Agent(target='IMG_8849.JPG', ref='person_B.jpg')",
            observe: "ArcFace 512-d embedding distance: Cosine similarity 0.68 (Above 0.62 candidate link threshold). Node queued for IO review."
        },
        crypto: {
            reason: "Scan document and chat streams for financial addresses (BTC, Monero, UPI handles).",
            act: "Financial_Crypto_Agent(case_id='CY-2026-0841', target='chat_dump.txt')",
            observe: "Found BTC address 'bc1q9v8371x92...' referenced in chat log. Node edge written to Neo4j Evidence Graph."
        }
    };

    const WS_REACT_TRACES = [
        PRESET_QUERIES.grooming,
        PRESET_QUERIES.gps,
        PRESET_QUERIES.face
    ];

    window.switchWsTrace = function(traceIdx) {
        document.querySelectorAll('#ws-panel-scan .preset-btn').forEach((btn, i) => {
            if (i === traceIdx) btn.classList.add('active');
            else btn.classList.remove('active');
        });

        const trace = WS_REACT_TRACES[traceIdx] || WS_REACT_TRACES[0];
        renderTraceBox(trace);
    };

    function renderTraceBox(trace) {
        const box = document.getElementById('ws-trace-content-box');
        if (box) {
            box.innerHTML = `
                <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                    <div style="background: #F0FDF4; border: 1.5px solid #86EFAC; padding: 0.85rem; border-radius: 6px; font-size: 0.85rem; color: #14532D;">
                        <strong>REASON:</strong> ${trace.reason}
                    </div>
                    <div style="background: #EFF6FF; border: 1.5px solid #93C5FD; padding: 0.85rem; border-radius: 6px; font-size: 0.85rem; font-family: var(--font-mono); color: #1E3A8A;">
                        <strong>ACT:</strong> ${trace.act}
                    </div>
                    <div style="background: #FFF; border: 1.5px solid var(--border-hard); padding: 0.85rem; border-radius: 6px; font-size: 0.85rem; color: var(--text-dark);">
                        <strong>OBSERVE:</strong> ${trace.observe}
                    </div>
                </div>
            `;
        }
    }

    window.runCustomReactQuery = function(type) {
        const input = document.getElementById('react-custom-input');
        const queryText = type ? type : (input ? input.value : '');

        let trace = PRESET_QUERIES.grooming;
        if (type === 'gps' || queryText.toLowerCase().includes('gps') || queryText.toLowerCase().includes('location')) trace = PRESET_QUERIES.gps;
        else if (type === 'face' || queryText.toLowerCase().includes('face') || queryText.toLowerCase().includes('suspect')) trace = PRESET_QUERIES.face;
        else if (type === 'crypto' || queryText.toLowerCase().includes('btc') || queryText.toLowerCase().includes('money')) trace = PRESET_QUERIES.crypto;
        else if (queryText.trim().length > 0) {
            trace = {
                reason: `Analyzing natural language query: "${queryText}". Determining optimal agent tool sequence.`,
                act: `LangGraph_Orchestrator(query="${queryText}")`,
                observe: `Retrieved sub-graph: Matched 3 entity nodes (Suspect Viper, Telegram dump, Ernakulam GPS). Confidence: 88%.`
            };
        }

        renderTraceBox(trace);
    };

    // Render initial trace
    switchWsTrace(0);

    /* ═══════════════════════════════════════════════
       4. REAL FORENSIC ARTIFACT INSPECTOR MODAL
    ═══════════════════════════════════════════════ */
    const ARTIFACT_DATABASE = {
        "IMG_8849.JPG": {
            name: "IMG_8849.JPG",
            type: "JPEG Image (Exif 2.32)",
            size: "4.2 MB (4,404,019 bytes)",
            sha256: "71b70b91e28cc6d4fa8b21008c1e4590119f821a95c47890b21e001928471b8e",
            md5: "8f1e29c011948194a28bc01129481920",
            pdqHash: "f8c2e190b4a1120e84c9e12048f0e1a8",
            risk: "P1 (High)",
            flagged: true,
            camera: "Apple iPhone 15 Pro Max (Lens 24mm f/1.78)",
            timestamp: "2026-08-11 14:22:00 IST",
            gps: "9.9816° N, 76.2999° E (Ernakulam Beach House)",
            arcface: "512-d Vector [0.124, -0.481, 0.992, 0.041, -0.119, ...]",
            arcfaceSim: "0.68 Cosine Sim vs Node 'Viper_09'",
            pocsoRedacted: true,
            ocrText: "N/A (Image photo artifact)",
            nlpFlags: ["Geographic proximity match", "Biometric face correlation"]
        },
        "chat_screenshot.png": {
            name: "chat_screenshot.png",
            type: "PNG Screenshot (1170 x 2532)",
            size: "820 KB (839,680 bytes)",
            sha256: "4a28b109e48bc119f0018c4590118210948b2100918471928471920049182910",
            md5: "3c91e0018274b1094819281749104819",
            pdqHash: "N/A (Text screenshot)",
            risk: "P0 (Imminent Danger)",
            flagged: true,
            camera: "iOS Screen Capture Engine",
            timestamp: "2026-08-10 14:22:00 IST",
            gps: "Extracted from message text",
            arcface: "N/A",
            pocsoRedacted: true,
            ocrText: "\"Meet me at the coordinates of the beach house image I sent yesterday. Don't tell anyone about this or bring anyone else.\"",
            nlpFlags: ["Secrecy instruction indicator (P0)", "Meeting location request", "Grooming risk flag (83%)"]
        },
        "known_file_copy.png": {
            name: "known_file_copy.png",
            type: "PNG Image",
            size: "210 KB (215,040 bytes)",
            sha256: "71b70b91e28cc6d4fa8b21008c1e4590119f821a95c47890b21e001928471b8e",
            md5: "8f1e29c011948194a28bc01129481920",
            pdqHash: "71b70b91e28cc6d4 (NCMEC Match)",
            risk: "P0 (Imminent Danger)",
            flagged: true,
            camera: "Unknown",
            timestamp: "2026-08-11 16:40:00 IST",
            gps: "N/A",
            arcface: "N/A",
            pocsoRedacted: true,
            ocrText: "N/A",
            nlpFlags: ["Known CSAM Hash List Match (NCMEC #71b70b...)"]
        },
        "invoice_aug.pdf": {
            name: "invoice_aug.pdf",
            type: "PDF Document (v1.7)",
            size: "1.1 MB (1,153,433 bytes)",
            sha256: "9182948102948102948102948102948102948102948102948102948102948102",
            md5: "1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d",
            pdqHash: "N/A",
            risk: "P2 (Medium)",
            flagged: false,
            camera: "N/A",
            timestamp: "2026-08-05 09:15:00 IST",
            gps: "N/A",
            arcface: "N/A",
            pocsoRedacted: false,
            ocrText: "Invoice #INV-2026-0841. Payment received via UPI handle merchant@pay. Transaction ID: 948102948102.",
            nlpFlags: ["Financial transaction node", "UPI handle merchant@pay"]
        }
    };

    window.openArtifactModal = function(fileName) {
        const file = ARTIFACT_DATABASE[fileName] || ARTIFACT_DATABASE["IMG_8849.JPG"];
        const modal = document.getElementById('artifact-modal');
        const body = document.getElementById('artifact-modal-body');

        if (body) {
            body.innerHTML = `
                <div style="font-family: var(--font-mono); font-size: 0.85rem; line-height: 1.7;">
                    <div style="background: var(--accent-navy); color: #FFF; padding: 1rem 1.25rem; border-radius: 6px; margin-bottom: 1.25rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap;">
                        <div>
                            <span style="color: var(--accent-saffron); font-weight: bold; text-transform: uppercase;">FORENSIC ARTIFACT INSPECTOR</span><br>
                            <span style="font-size: 1.1rem; font-weight: bold;">${file.name}</span>
                        </div>
                        <span class="badge" style="background: ${file.risk.includes('P0') ? '#FEF2F2' : '#FFFBEB'}; color: ${file.risk.includes('P0') ? '#DC2626' : '#D97706'}; font-weight: bold;">
                            ${file.risk}
                        </span>
                    </div>

                    <!-- Simulated Visual Frame with POCSO Redaction -->
                    <div style="background: #111; border: 2px solid var(--border-hard); border-radius: 8px; padding: 1.5rem; text-align: center; margin-bottom: 1.25rem; position: relative;">
                        <div style="border: 2px dashed var(--accent-orange); background: rgba(255, 84, 0, 0.15); border-radius: 6px; padding: 2rem 1rem; color: #FFF;">
                            <div style="font-size: 2rem; margin-bottom: 0.5rem;">🔒 [ POCSO PRIVACY REDACTED ]</div>
                            <span style="font-size: 0.8rem; color: #CBD5E1; background: #000; padding: 0.3rem 0.8rem; border-radius: 4px;">
                                ArcFace 512-d Bounding Box: [X:142, Y:88, W:210, H:260] · Face Vector Masked
                            </span>
                        </div>
                    </div>

                    <!-- Cryptographic Block -->
                    <div style="background: var(--bg-base); padding: 1rem; border: 1.5px solid var(--border-hard); border-radius: 6px; margin-bottom: 1rem;">
                        <strong style="color: var(--accent-navy); text-transform: uppercase;">CRYPTOGRAPHIC HASH BLOCK</strong><br>
                        • SHA-256 Hash:<br>
                        <code style="background:#FFF; padding:0.3rem; display:block; border:1px solid #111; margin:0.3rem 0; word-break:break-all; font-weight:bold; color:var(--accent-orange);">
                            ${file.sha256}
                        </code>
                        • MD5: <code>${file.md5}</code><br>
                        • PDQ CSAM Hash: <code>${file.pdqHash}</code>
                    </div>

                    <!-- EXIF Geo-Metadata -->
                    <div style="background: var(--bg-base); padding: 1rem; border: 1.5px solid var(--border-hard); border-radius: 6px; margin-bottom: 1rem;">
                        <strong style="color: var(--accent-navy); text-transform: uppercase;">EXIF & HARDWARE METADATA</strong><br>
                        • Device / Lens: ${file.camera}<br>
                        • Timestamp: <code>${file.timestamp}</code><br>
                        • Embedded GPS Pin: <strong style="color: var(--accent-orange);">${file.gps}</strong><br>
                        • ArcFace Vector Signal: <code>${file.arcfaceSim || file.arcface}</code>
                    </div>

                    <!-- OCR & NLP Extracted Text -->
                    ${file.ocrText !== "N/A" ? `
                    <div style="background: #EFF6FF; border: 1.5px solid #93C5FD; padding: 1rem; border-radius: 6px; color: #1E3A8A;">
                        <strong>EXTRACTED OCR TEXT & NLP FLAGS:</strong><br>
                        <em>"${file.ocrText}"</em><br><br>
                        <strong>NLP Grooming Indicators:</strong> ${file.nlpFlags.map(f => `<span class="badge" style="background:#FFF; color:#1E40AF; margin-right:4px;">${f}</span>`).join('')}
                    </div>
                    ` : ''}
                </div>
            `;
        }

        if (modal) modal.classList.add('active');
    };

    window.closeArtifactModal = function() {
        const modal = document.getElementById('artifact-modal');
        if (modal) modal.classList.remove('active');
    };

    /* ═══════════════════════════════════════════════
       5. HUMAN REVIEW QUEUE APPROVAL / REJECTION
    ═══════════════════════════════════════════════ */
    window.approveWsReview = function(reviewId) {
        const actionBox = document.getElementById(`ws-review-action-${reviewId}`);
        if (actionBox) {
            actionBox.innerHTML = `
                <div style="background: #ECFDF5; border: 1.5px solid #059669; padding: 0.6rem 1rem; border-radius: 6px; color: #047857; font-size: 0.82rem; font-weight: bold; width: 100%;">
                    ✓ APPROVED BY IO — Node relationship edge committed to Neo4j graph & charge sheet.
                </div>
            `;
        }
        updateReviewCount();
    };

    window.rejectWsReview = function(reviewId) {
        const actionBox = document.getElementById(`ws-review-action-${reviewId}`);
        if (actionBox) {
            actionBox.innerHTML = `
                <div style="background: #FEF2F2; border: 1.5px solid #DC2626; padding: 0.6rem 1rem; border-radius: 6px; color: #991B1B; font-size: 0.82rem; font-weight: bold; width: 100%;">
                    ✗ REJECTED BY IO — Finding discarded (No edge committed to graph).
                </div>
            `;
        }
        updateReviewCount();
    };

    function updateReviewCount() {
        if (wsPendingReviewsCount > 0) wsPendingReviewsCount--;
        const badge = document.getElementById('ws-review-count-badge');
        const statVal = document.getElementById('ws-stat-review-val');
        if (badge) badge.innerText = wsPendingReviewsCount;
        if (statVal) statVal.innerText = wsPendingReviewsCount;
    }

    /* ═══════════════════════════════════════════════
       6. SECTION 63 BSA CERTIFICATE IO SIGNATURE FORM
    ═══════════════════════════════════════════════ */
    window.signWsCertificate = function() {
        const nameInput = document.getElementById('io-name-input');
        const rankInput = document.getElementById('io-rank-input');
        const stationInput = document.getElementById('io-station-input');
        const badgeInput = document.getElementById('io-badge-input');

        const ioName = (nameInput && nameInput.value.trim()) ? nameInput.value.trim() : "IO Ramesh Kumar";
        const ioRank = (rankInput && rankInput.value.trim()) ? rankInput.value.trim() : "Inspector of Police";
        const ioStation = (stationInput && stationInput.value.trim()) ? stationInput.value.trim() : "Kerala Police Cyberdome";
        const ioBadge = (badgeInput && badgeInput.value.trim()) ? badgeInput.value.trim() : "KB-9481";

        const sigArea = document.getElementById('ws-cert-signature-area');
        if (sigArea) {
            sigArea.innerHTML = `
                <div style="background: #ECFDF5; border: 2px solid #059669; border-radius: 8px; padding: 1.25rem; text-align: center;">
                    <div style="color: #047857; font-weight: 700; font-size: 1.1rem; text-transform: uppercase; margin-bottom: 0.3rem;">
                        ✓ Certificate Digitally Signed & Certified Under Section 63 BSA 2023
                    </div>
                    <div style="font-family: var(--font-mono); font-size: 0.85rem; color: #065F46; line-height: 1.8;">
                        Certified By: <strong>${ioName} (${ioRank}, Badge #${ioBadge})</strong><br>
                        Station Authority: <strong>${ioStation}</strong><br>
                        Signed Timestamp: <code>2026-08-14 10:18:14 IST</code> | Verification SHA-256 Hash Verified
                    </div>
                </div>
            `;
        }

        const badge = document.getElementById('ws-cert-status-badge');
        const statVal = document.getElementById('ws-stat-cert-val');
        const statSub = document.getElementById('ws-stat-cert-sub');

        if (badge) {
            badge.innerText = 'Signed';
            badge.style.background = 'var(--accent-green)';
        }
        if (statVal) {
            statVal.innerText = 'Signed';
            statVal.style.color = 'var(--accent-green)';
        }
        if (statSub) {
            statSub.innerText = `Verified by ${ioName}`;
        }
    };

    window.generateWsChargeSheet = function() {
        const area = document.getElementById('ws-chargesheet-content-area');
        if (area) {
            area.innerHTML = `
                <div class="ws-card">
                    <div style="background: #FEF2F2; border: 1.5px solid #FCA5A5; border-radius: 6px; padding: 0.75rem 1rem; font-size: 0.82rem; color: #991B1B; font-weight: bold; margin-bottom: 1.5rem;">
                        ⚠ AI-DRAFTED CHARGE SHEET SUMMARY — PENDING FINAL INVESTIGATING OFFICER SUBMISSION
                    </div>

                    <div style="margin-bottom: 1.5rem; border-bottom: 1.5px solid var(--border-hard); padding-bottom: 1rem;">
                        <h4 style="font-size: 1.1rem; font-weight: bold; text-transform: uppercase; color: var(--accent-navy);">Case CY-2026-0841 — Charge Sheet Narrative</h4>
                        <div style="font-family: var(--font-mono); font-size: 0.8rem; color: var(--text-muted); margin-top: 0.25rem;">
                            Compiled: 2026-08-14 · Target Suspect: VIPER (alias) · Statutory Sections: POCSO Act Sec 14/15, IT Act Sec 67B, Sec 63 BSA 2023
                        </div>
                    </div>

                    <div style="display: flex; flex-direction: column; gap: 1rem; margin-bottom: 1.5rem;">
                        <div style="display: flex; gap: 1rem; border-bottom: 1px dashed #DDD; padding-bottom: 1rem; flex-wrap: wrap;">
                            <div style="width: 140px; font-family: var(--font-mono); font-size: 0.78rem; color: var(--accent-orange); font-weight: bold;">2026-08-10 14:22</div>
                            <div style="flex: 1; font-size: 0.85rem;">
                                <strong>Communication & Grooming Evidence:</strong> <code>chat_screenshot.png</code> OCR text contains instructions consistent with POCSO Section 11 grooming indicators. NLP Confidence: 83%. IO Approved on 2026-08-14.
                            </div>
                        </div>

                        <div style="display: flex; gap: 1rem; border-bottom: 1px dashed #DDD; padding-bottom: 1rem; flex-wrap: wrap;">
                            <div style="width: 140px; font-family: var(--font-mono); font-size: 0.78rem; color: var(--accent-orange); font-weight: bold;">2026-08-11 14:22</div>
                            <div style="flex: 1; font-size: 0.85rem;">
                                <strong>Geographic & Biometric Placement:</strong> <code>IMG_8849.JPG</code> EXIF GPS extracted: 9.9816° N, 76.2999° E (Ernakulam). ArcFace cosine similarity 0.68 matched suspect identity node. IO Approved on 2026-08-14.
                            </div>
                        </div>

                        <div style="display: flex; gap: 1rem; padding-bottom: 0.5rem; flex-wrap: wrap;">
                            <div style="width: 140px; font-family: var(--font-mono); font-size: 0.78rem; color: var(--accent-orange); font-weight: bold;">2026-08-11 16:40</div>
                            <div style="flex: 1; font-size: 0.85rem;">
                                <strong>Known CSAM Media Possession:</strong> <code>known_file_copy.png</code> SHA-256 hash matches NCMEC repository list entry <code>71b70b91...</code>. Deterministic hash match verified. Section 63 BSA Certificate signed.
                            </div>
                        </div>
                    </div>

                    <div style="background: #ECFDF5; border: 1.5px solid #86EFAC; border-radius: 6px; padding: 1rem; font-size: 0.85rem; color: #14532D; font-weight: bold;">
                        ✓ Charge Sheet Draft Complete. All evidence nodes carry cryptographic hash citations and verified IO approval seals. Ready for court filing.
                    </div>
                </div>
            `;
        }
    };

    // Close artifact modal on background click
    const artifactModal = document.getElementById('artifact-modal');
    if (artifactModal) {
        artifactModal.addEventListener('click', (e) => {
            if (e.target === artifactModal) closeArtifactModal();
        });
    }
});
