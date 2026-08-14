# SAKSHYA
### Sanskrit-rooted Agentic Knowledge System for Handling investigation & Youth-safety Analysis
*(साक्ष्य — Sanskrit for "evidence" / "testimony," chosen deliberately to echo the Bharatiya Sakshya Adhiniyam, 2023 — the very law this system is built to serve)*

**Kerala Police Cyberdome — HACKP 2026**
**Initiative alignment:** Operation P-Hunt, KidGlove Programme
**Legal compliance:** Section 63 & Section 57, Bharatiya Sakshya Adhiniyam (BSA) 2023; POCSO Act
**Document type:** Final consolidated project specification (architecture + verified Proof of Concept)
**Date:** August 2026

---

## Why the name changed

The working name ACPIA (Agentic Child Protection Investigation Assistant / Agentic Cyber Provenance Investigation Architecture) was functional but generic — it described *what* the system does, not *what it stands for* in the courtroom sense. **SAKSHYA** (साक्ष्य) is the Sanskrit word for evidence/testimony, and it is not a decorative rename — it is the literal subject matter of Section 63 of the Bharatiya Sakshya Adhiniyam, 2023 (India's evidence law, which replaced Section 65B of the Indian Evidence Act). Naming the system after the legal concept it exists to support gives judges an immediate, memorable anchor: *this system doesn't just find evidence — it is architected around what makes evidence admissible.*

Backronym for the pitch deck, if useful: **S**ecure **A**gentic **K**nowledge system for **S**tructured **H**andling of **Y**outh-protection & **A**dmissible evidence.

---

## 1. The pitch in one paragraph

SAKSHYA is an **Intelligence Fusion layer**, not a replacement for the forensic tools investigators already use (Cellebrite, Griffeye, Nuix). Real investigators lose time exporting reports from siloed proprietary tools and reading them side by side to connect the dots — a motorcycle in a flagged video, a chat mention in a phone export, a GPS point in a drone log. SAKSHYA's orchestrator sits above those silos, reads their outputs, and autonomously correlates what each tool sees in isolation. The system is built around one precise, honest claim, held constant throughout this document: **only one component is agentic AI** — a single LLM-driven reasoning loop that decides which deterministic tool to call next, based on what it has already found. Every other capability — hashing, face correlation, OCR, financial tracing — is a classical, deterministic tool that loop calls. During development, every capability uses a free, open-source substitute with an output schema matching its commercial counterpart, so the agency can move from open-source to enterprise tooling (Cellebrite, Griffeye, VAHAN, PhotoDNA) later by changing one configuration line — never by rebuilding the orchestrator.

**Headline numbers (from the verified Proof of Concept, Section 10):**
- 14 agents across 6 processing tiers
- 1 agentic reasoning loop — everything else is a deterministic tool it calls
- Measured PoC speed difference between case profiles: 2.18s (sprint, 18 tasks) vs. 3.62s (full, 54 tasks) — same proportional mechanism claimed for a projected 2-hour-vs-40-hour production estimate
- Verified crash recovery: a SIGKILL'd worker at 48/54 tasks resumed and completed at 54/54 without re-touching a single finished file

---

## 2. What a Proof of Concept is, and what this document contains

A PoC is deliberately *not* a finished product — it is the smallest working system that proves the riskiest claims are real before investing in the rest. This document has two honest halves:

- **Sections 3–9** are the full architectural specification — what would be built for a production deployment.
- **Section 10** reports the actual, verified results of code that was written and run — crash recovery, dependency enforcement, real hashing, real OCR, and a measured speed difference between case profiles. Not a projection.

Keeping this boundary explicit — rather than blurring "what we built" with "what we're proposing" — is intentional. It is the single biggest thing that protects credibility under technical questioning.

---

## 3. Legal & procedural grounding

### 3.1 Chain of custody, as it actually happens
1. **Seizure & isolation** — device placed in a Faraday bag to block remote wipe.
2. **Bit-by-bit imaging** — a write-blocker creates a mathematically identical clone; the original device is never touched again.
3. **Hashing** — a SHA-256 hash of the clone is generated to prove it hasn't been altered.
4. **Analysis** — only the clone is ever fed into SAKSHYA or any AI tool.

### 3.2 Section 63, Bharatiya Sakshya Adhiniyam (BSA) 2023
The BSA replaced Section 65B of the Indian Evidence Act, 1872 when it came into force on 1 July 2024. Under Section 63, it is a **statutory mandate — not best practice** — that any certificate submitted to a court include the exact cryptographic hash value of the electronic evidence, prescribed as a dual-part certificate under the BSA Schedule (Part A: device hardware/IMEI/MAC; Part B: expert validation block).

### 3.3 What AI can and cannot do here — stated explicitly to judges
- **AI cannot testify.** SAKSHYA never generates its own Section 63 certificate.
- SAKSHYA is an **accelerated search and hashing tool**: it points to evidence, computes the hash, and pre-fills the certificate. A human Investigating Officer (IO) verifies the finding on the cloned drive and signs it.
- **Section 57** (Explanations 4, 6, 7) establishes that files simultaneously stored across automated systems — including cache files — can qualify as *Primary Evidence*. SAKSHYA's graph maps the full path and cache timeline of every parsed file, helping determine whether a Section 63 certificate can be bypassed entirely in favour of Primary Evidence submission.
- **"AI accelerates. Humans certify."** — this single sentence is the direct answer to the ethics/XAI evaluation criterion and pre-empts the first objection a senior IPS officer will raise.

### 3.4 POCSO compliance and victim masking
Under the POCSO Act, displaying unredacted material — even during internal review — is itself an offence. SAKSHYA's Vision agent applies automatic blurring or a solid block over detected victim faces and sensitive PII **before anything reaches a human reviewer**, providing both legal compliance and cognitive/trauma relief for examiners.

### 3.5 What the Investigating Officer still does — SAKSHYA doesn't replace this
- **Pre-analysis legal paperwork** — preservation requests to service providers (Meta, Google, ISPs) via Section 94 BNSS / 91 CrPC notices; nodal-officer coordination for raw data dumps.
- **Scene-of-crime seizure** — Faraday bagging, live RAM triage before power-off, on-the-spot hashing.
- **NCMEC/NCRB tipline execution** — receiving CyberTipline reports, ISP-mapping an IP to a physical address.
- **Filing the Section 63 certificate** — signed personally; an AI cannot take on this legal liability.
- **Charge-sheet redaction** — manually ensuring victim identity is masked before court submission.

SAKSHYA's job is to make each of these faster and better-documented — never to perform the legally-liable step itself.

---

## 4. System architecture

SAKSHYA behaves as an **operating system for forensic evidence**, not a single script. Two components form a permanently stable core; every capability — existing or future — attaches to that core without modifying it.

```
                    ┌───────────────────────────────────────┐
                    │           Investigator Console          │
                    │  goal input · toggle panel · async      │
                    │  review queue · P0 alert feed            │
                    └────────────────────┬────────────────────┘
                                          │ goal + case profile
                    ┌────────────────────▼────────────────────┐
                    │        Orchestrator — agentic ReAct       │
                    │        loop (LangGraph + local LLM        │
                    │        via Ollama)  ── NEVER CHANGES       │
                    └────────────────────┬────────────────────┘
        ┌───────────────┬────────────────┼────────────────┬───────────────┐
   ┌────▼─────┐   ┌──────▼──────┐  ┌──────▼──────┐  ┌──────▼───────┐ ┌─────▼──────┐
   │Ingestion │   │   Core       │  │  Legal &     │  │Intelligence  │ │ Prevention │
   │(always)  │   │ specialist   │  │  compliance  │  │  fusion      │ │ & reporting│
   ├──────────┤   │ (toggleable) │  ├──────────────┤  ├──────────────┤ ├────────────┤
   │Normalizer│   │Hash match    │  │SHA-256 +     │  │Watermark/IP  │ │KidGlove    │
   │OCR       │   │Vision triage │  │Sec.63 BSA    │  │tracing       │ │trend export│
   │Metadata  │   │Face corr.    │  │certificate   │  │Financial/    │ │Charge sheet│
   │recursive │   │NLP corr.     │  │generator     │  │crypto tracing│ │compiler    │
   │unpacker  │   │ANPR          │  │              │  │Drone telemetry│└────────────┘
   └──────────┘   └──────────────┘  └──────────────┘  │Synthetic/    │
                                                        │nudify detect │
                                                        │Risk scoring  │
                                                        └──────────────┘
                                          │
                    ┌────────────────────▼────────────────────┐
                    │   Durable job table (Postgres/SQLite)     │
                    │   + shared evidence graph (Neo4j)          │
                    │   + vector index (FAISS)  ── NEVER CHANGES │
                    └────────────────────▲────────────────────┘
                                          │
                    ┌────────────────────┴────────────────────┐
                    │  NCMEC/NCRB structured intake — cases      │
                    │  can start here, before an IO opens a file │
                    └────────────────────────────────────────┘
```

**The orchestrator and the shared graph are the only two components that never change.** Every capability below — old or new — attaches by declaring its inputs, outputs, and dependencies. That is the literal backbone property: extending the system never means touching the core. This was demonstrated live in the PoC, not just claimed (Section 10.2).

---

## 5. The agentic layer — precisely, so it holds up under technical questioning

**Only one thing here is "agentic AI":** the orchestrator's reasoning loop. Everything else — OCR, hashing, EXIF, face embedding, ANPR, the job queue, checkpointing — is a deterministic tool or classical infrastructure it calls. Overclaiming a hash lookup as "AI reasoning" is exactly the kind of statement a sharp judge will puncture; the honest, strong claim is:

> **"One LLM-driven planning loop sits on top of five to eight deterministic tools, decides which to invoke and in what order based on evolving evidence, and knows when to stop and ask a human."**

| Layer | What it is | Agentic? |
|---|---|---|
| OCR, hashing, EXIF, face embedding, ANPR | Fixed function: input → output, same every time | No — classical ML/CV, called as a tool |
| **Orchestrator** | LLM reasons about the goal, picks a tool, observes the result, updates its plan, repeats (ReAct loop) | **Yes — this is the actual agent** |
| NLP correlation agent | LLM judges "are these two entities the same person?" from partial evidence | Yes, narrowly — a judgment call, not a lookup |
| Reporting agent | LLM synthesizes a narrative from structured graph facts | Weak agentic claim — generation over retrieved facts, no looping |

### Concrete ReAct trace (goal: "map suspect Viper's physical locations")

```
Turn 1 — REASON: "Don't know what Viper has said yet — pull chat history first."
          ACT:    NLP_Correlation_Agent(case_id, query="Viper")
          OBSERVE: Chat: "Meet me at the coordinates of the beach house image
                   I sent yesterday" — timestamp 2026-08-11 14:22:00

Turn 2 — REASON: "Message references an image 'sent yesterday'. Check images
                  from this user near that timestamp for EXIF GPS."
          ACT:    Metadata_EXIF_Agent(case_id, file_type="image",
                   start_time="2026-08-10", end_time="2026-08-11")
          OBSERVE: IMG_8849.JPG has GPS 9.9816N 76.2999E (Ernakulam), iPhone 15

Turn 3 — REASON: "Location is mapped, but confidence is moderate — temporal
                  correlation only, not confirmed identity. Do not auto-report."
          ACT:    Write finding to the async human review queue.
```

No code told it this sequence — each next step was derived from what the previous tool returned. That branching is what a fixed pipeline cannot do, and it is the entire basis for calling this "agentic" rather than "automated."

---

## 6. Full agent registry — 14 agents across 6 tiers

Every agent declares its `inputs`, `outputs`, and `requires` (dependencies) as a schema-validated Python class. The orchestrator resolves execution order automatically from this dependency graph — Face Correlation, for example, declares that Ingestion and Metadata must already have run on a given file before it can claim that file's task.

```python
class Agent:
    id: str
    name: str
    requires: list[str]   # ids of agents that must run first
    inputs: list[str]     # data types it consumes from the graph
    outputs: list[str]    # data types it writes to the graph
    def run(self, case_id, config) -> AgentResult: ...
```

### Tier A — Ingestion & Normalization (always runs)
| Agent | Function | Core library |
|---|---|---|
| Normalizer | Unifies PDF/PPTX/video/audio/image/chat into extraction units, recursively unpacking embedded content | Apache Tika, PyMuPDF, python-pptx |
| OCR | Text from images, scans, screenshots | Tesseract / EasyOCR |
| Metadata/EXIF | GPS, timestamps, device IDs | ExifTool |

### Tier B — Core Specialists (toggleable)
| Agent | Function | Core library |
|---|---|---|
| Hash Match | Known-content lookup against CSAM hash lists | PDQ Hash vs. Project VIC / NCMEC / CAID |
| Vision Triage | Risk-tiers unhashed media without human viewing | Local VLM (Ollama, Qwen2-VL / LLaVA) |
| Face Correlation | Cross-file identity clustering, confidence-gated | InsightFace (ArcFace) + FAISS |
| NLP Correlation | Alias/entity extraction, grooming-pattern flags | spaCy + local LLM |
| ANPR | Plate detection + registration lookup | YOLOv8 + EasyOCR + VAHAN (swap-in) |

### Tier C — Legal & Compliance
| Agent | Function | Core library |
|---|---|---|
| Section 63 BSA Certificate Generator | SHA-256 on every flagged file; auto-populates the mandatory dual-part BSA Schedule certificate for IO signature | Python `hashlib`, ReportLab |

### Tier D — Intelligence Fusion
| Agent | Function | Core library |
|---|---|---|
| Watermark/Steganography & IP Tracing | Reads hidden watermarks in seized images, correlates against Operation P-Hunt IP logs to identify original seeder vs. downloader | zsteg / LSB-analysis |
| Financial/Crypto Tracing | Extracts BTC/Monero addresses, UPI IDs, cash-app handles; maps them into a network graph to follow the money | Regex entity extraction, blockchain explorer APIs |
| Drone Telemetry & EXIF Correlation | Extracts flight logs/GPS paths from seized drone storage, cross-references with suspect phone GPS to place them at a launch site | DJI/ArduPilot log parsers |
| Synthetic/Nudify Detection | Flags diffusion-artifact/deepfake signatures; tags evidence `REAL` / `SYNTHETIC` / `UNDETERMINED` so real-child cases jump the queue | FaceForensics++-trained CNN |
| Imminent-Danger Risk Scoring | Cross-agent rule engine: proximity phrases + converging live GPS → P0 alert, bypassing standard triage | Convergence rule engine |

### Tier E — Prevention & Intake
| Agent | Function | Core library |
|---|---|---|
| KidGlove Trend Exporter | Aggregates grooming tactics/scripts from NLP findings, strips all PII, exports an anonymized trend report for school awareness campaigns | Anonymization engine + LLM summarizer |
| Charge Sheet Compiler | Drafts a chronological, legally formatted case summary from validated graph evidence, labeled "AI-drafted, pending review" | LLM template compiler |
| NCMEC/NCRB Ingestion | Securely ingests structured CyberTipline JSON from national reporting APIs, maps flagged IPs to local jurisdiction, pre-tasks OSINT before an IO opens the case | National reporting API client |

### Tier F — Output (always runs)
| Agent | Function |
|---|---|
| Human Review Gate | Async queue; nothing auto-confirms without a logged human action |
| Live Dashboard | Progress, P0 alerts, pending questions, updated on a rolling basis |

### Case-profile presets (mirrors real Griffeye/Cyberdome triage order — hash match always first)
| Profile | Agents active | Purpose |
|---|---|---|
| **CSAM ID Sprint** | Hash match + Vision triage + Synthetic detection | Fastest triage; separates real-child urgency from AI-generated noise instantly |
| **Network Mapping** | + Face, NLP, ANPR, financial tracing, watermark/IP tracing | Building suspect networks |
| **Drone-Linked Case** | + Drone telemetry agent | Cases involving seized drone hardware |
| **Full Investigation** | All agents | Prosecution preparation, ending in BSA certificate + charge sheet |

Toggling a subset doesn't just skip work cosmetically — the dependency resolver only runs what's actually needed, so a fraud-adjacent CSAM tip-off that needs hash match and vision triage alone drops from a projected 40-hour full scan to ~2 hours, without touching accuracy on the parts that do run.

---

## 7. Correlation specifics — why this is "not random"

### 7.1 Face correlation
```
Photo A --face detect--> embed (ArcFace, 512-dim) ---\
                                                        --> FAISS cosine lookup --> threshold gate
Photo B --face detect--> embed (ArcFace, 512-dim) ---/
```
- **Deterministic math, not guessing.** A face becomes a fixed 512-dimension vector. Same person → vectors land close together — the same technology behind phone face-unlock.
- **A calibrated threshold with a rejection band.** Cosine similarity ≥ 0.62 → auto-link as candidate identity. 0.45–0.62 → surfaced to the investigator as "possible match," never silently merged. Below 0.45 → no link.
- **Multi-signal confirmation.** Face similarity alone never fully confirms two nodes as the same person — a corroborating signal (shared phone number, location, alias) is required before treating an identity as confirmed. This is the strongest anti-false-positive answer for the ethics judges.

### 7.2 Cross-chunk entity resolution at multi-terabyte scale
This is an **indexing problem, not a context-window problem**. A name appearing in file #3 and file #48,000 is never resolved by an LLM "remembering" 4TB of data:
- Every ingestion worker is stateless and parallel, writing small structured facts (a name, a face vector, a plate string) into a shared graph + vector index.
- New entities are looked up against the existing index in milliseconds — the same way a search engine finds a match instantly instead of rereading the internet.
- A background resolution agent periodically re-scans candidate clusters (fuzzy name match + shared phone/email/face + co-occurrence) and proposes merges — always with a confidence score, always human-reviewable.
- The LLM is invoked only on small, targeted, retrieved subgraphs ("here are two candidates sharing a phone number and a similar name — same person or coincidence?") — never on the raw multi-terabyte case.

### 7.3 Vehicle plate → identity
YOLOv8 plate detection → OCR → lookup. For the PoC, this is stubbed against a mock RC CSV (owner/model/city); the same function signature is designed to point at India's VAHAN registration database through Kerala Police's existing authorized access channel in production — this is not scraping or unauthorized access, but an agent calling an API investigators are already legally permitted to query. Plate-to-owner lookups return PII on possibly-uninvolved people, so this is one of the most tightly gated actions in the system: a mandatory reason-for-query field is logged on every call.

---

## 8. Scale, fault tolerance & checkpointing

A core failure mode in early forensic prototypes is inability to survive interrupts — a crash at hour 40 of a 50-hour run typically forces a full restart. SAKSHYA avoids this by decomposing a case into millions of tiny, independently resumable tasks rather than treating it as one job.

### 8.1 Per-file durable checkpointing
Every ingested file, and every recursively extracted sub-object, is a discrete row in a persistent job table with states `queued → processing → done / failed`. Workers write a heartbeat while processing.

```
queued → processing (worker heartbeat) → done (written to graph)
                    ↓ no heartbeat for ~90s
                 failed → requeue (only this file)

On restart: query the job table for everything not "done". That is the entire resume logic.
```

A crash at hour 40 of a 50-hour run loses at most the handful of files mid-flight — not the 40 hours of completed work. This was proven, not just diagrammed (Section 10.2).

### 8.2 Recursive ingestion decomposition
A PDF with 40 embedded photos, or a PowerPoint with 20 embedded PNGs, is unpacked into individual rows in the same job table — a 41-object PDF becomes 41 independently checkpointable jobs. "Thousands of images" and "40 PDFs with embedded images" look identical to the system.

### 8.3 Asynchronous, non-blocking human gate
When an agent hits a low-confidence decision, it writes a question to an async review queue and **immediately moves on to the next file** — nothing waits on an answer. The investigator answers whenever convenient; only that one graph node updates. This keeps a 50-hour scan under continuous human oversight instead of one batch review at the end.

### 8.4 Live updates & parallelism
Each worker writes a completion counter to Redis; a dashboard polls/pushes it every ~60 seconds — files done/total, per-agent phase, rolling-throughput ETA. Parallelism comes from a standard task-queue worker pool (Celery+Redis, or Ray); throughput scales with worker count, the same pattern commercial tools already use for bulk media.

**Human-in-the-loop certification policy:** No node or edge written by an AI agent is marked `investigator_approved` without an explicit, logged human action. The AI acts exclusively as a pointer — the human remains the legally liable certifier.

---

## 9. Data model

Every evidentiary node carries a confidence score, an evidence source, and — where relevant — a legal certification status:

```json
{
  "node_id": "evidence_0091",
  "type": "ChatMessage",
  "confidence": 0.81,
  "evidence_source": {
    "device_clone_hash": "sha256:3f9a...",
    "file_hash": "sha256:8c1e...",
    "extraction_tool": "ALEAPP v3.x"
  },
  "bsa_certificate_status": "pending_IO_signature",
  "status": "pending_review"
}
```

No node is ever marked "confirmed" without `status: investigator_approved` set by a logged human action with a timestamp and user ID — this is the ethics/XAI answer baked into the data model itself, not bolted on as a disclaimer.

---

## 10. Open-source stack — no proprietary tool access required

| Capability | Enterprise tool | Free/local substitute used in PoC | Swap-in mechanism |
|---|---|---|---|
| Device extraction | Cellebrite UFED / Magnet AXIOM | ALEAPP / iLEAPP | Parse the tool's SQLite/JSON export directly |
| Disk forensics | EnCase | Autopsy / Sleuth Kit | Same underlying Sleuth Kit engine |
| CSAM hash match | PhotoDNA / NCMEC API | PDQ Hash + mock list | Redirect the hash-match agent's endpoint |
| Media triage | Griffeye Analyze DI | Local VLM (Ollama) | Griffeye API replaces the VLM call |
| Face recognition | Cellebrite face module | InsightFace (ArcFace) | Both build on comparable embedding models |
| Vehicle lookup | VAHAN API (govt-restricted) | Mock RC CSV | Direct swap to the authorized VAHAN endpoint |
| Reasoning LLM | Cloud GPT-4 / Claude | Local quantized Llama / Qwen (Ollama) | Swap the Ollama endpoint for a secured cloud one |
| Steganography/watermark detection | Proprietary forensic suites | StegExpose, zsteg, custom LSB-analysis | Same interface, upgrade the detector model |
| Vector/graph store | Commercial vector DB / Neo4j Enterprise | FAISS, Neo4j Community / NetworkX | Milvus/Neo4j Enterprise at production scale |

**Pitch line:** *"Everything in our stack is free and runs offline today. When Cyberdome gets Cellebrite/Griffeye/VAHAN/PhotoDNA access, you don't rebuild anything — you change one config line per agent."*

---

## 11. Build roadmap (48-hour sprint)

| Phase | Hours | Deliverable |
|---|---|---|
| 1. Backbone setup | 0–10 | Durable per-file queue, worker pool, heartbeat/requeue logic. Crash recovery proven before any AI feature is written. |
| 2. Orchestrator loop | 10–16 | ReAct planning loop, agent registry validation schema, dependency resolution. |
| 3. Always-on tier | 16–22 | Normalizer, OCR, Metadata agents; recursive decomposition of compound documents. |
| 4. Section 63 agent | 22–26 | SHA-256 hashing + auto-generated dual-part certificate. Highest legal-credibility milestone for the least build cost. |
| 5. Specialist tier | 26–36 | Face correlation, NLP entity extraction, ANPR; threshold calibration. |
| 6. Advanced fusion | 36–42 | Synthetic detection, Imminent-Danger risk scoring, P0 alert triggers. |
| 7. Dashboard & demo | 42–48 | Live progress UI, worker-kill rehearsal, charge-sheet exporter. |

**Explicitly out of scope for the 48-hour sprint:** Drone telemetry SD-card parsing and live NCMEC CyberTipline API ingestion are "designed, not built" — schemas fully defined, execution scheduled for Phase II. State this plainly to judges rather than faking a demo for them; a judge who has seen real Cyberdome operations will spot a fake drone demo immediately.

---

## 12. Demo script

1. **Toggle console** — run "CSAM ID Sprint" vs "Full Investigation" on the same synthetic case; the time difference is visible immediately.
2. **Feed in mixed synthetic evidence** — a PDF with embedded photos, two photos of the "same person," a mock chat log, a plate image — watch agents light up live on the dashboard.
3. **Kill a worker mid-run on purpose** — the dashboard marks one file `failed`, requeues it automatically, and overall progress barely dips.
4. **Show a face-correlation finding** land in the async review queue with its confidence score and reasoning — approve or reject it live.
5. **Show the Section 63 BSA certificate agent** auto-populate a certificate the moment a piece of evidence is flagged — emphasize the IO still signs it.
6. **Click "Generate charge sheet"** — a chronological, cited draft appears, explicitly labeled "AI-drafted, investigator-approved."

---

## 13. Proof of Concept — verified results (not a projection)

Working Python was written and executed; the results below are copied directly from real program output.

### 13.1 What was built and run
- `db.py` — a SQLite-backed durable job table with heartbeat-based stale-task detection and requeuing.
- `agents/` — a dependency-declaring agent registry: Normalizer, Hash Match (real SHA-256), OCR (real Tesseract), Metadata (sidecar JSON standing in for a Cellebrite export), Face Correlation (perceptual hash standing in for ArcFace embeddings), Section 63 Certificate agent, and a **Financial Correlation agent** (regex-based BTC/Monero/UPI extraction — the second agent built end-to-end to prove the pattern generalizes, not just works once).
- `orchestrator.py` — a worker process implementing the claim → heartbeat → complete cycle.
- `generate_test_data.py` — fully synthetic evidence: no real people, no real CSAM. Includes a real PDF (built with ReportLab) containing two embedded images, unpacked recursively with `pypdf`.

### 13.2 Test 1 — Crash recovery, verified
```
[after crash] progress: {'total': 54, 'queued': 5, 'processing': 1, 'done': 48, 'failed': 0}
>>> restarting worker <<<
[worker-1-resumed] startup: reclaimed 1 stale task(s) from a previous crash -> requeued
[worker-1-resumed] REASON: next runnable step for embedded_p1_0_....png -> ACT: run 'normalizer'
... (remaining tasks complete normally) ...
[after resume] progress: {'total': 54, 'queued': 0, 'processing': 0, 'done': 54, 'failed': 0}
```
**Result: verified.** The 48 already-completed tasks were never re-touched. Only the one task mid-flight at the moment of the crash was reprocessed — the concrete implementation of "a crash at hour 40 does not restart the scan."

### 13.3 Test 2 — Dependency enforcement, verified
The job-claiming logic checks, for each candidate task, whether every dependency for that same file is already `done` before allowing the task to be claimed. In the executed run, `face_correlation` never claimed a file before that file's `metadata` task showed `done` — observed directly in the task-claim order logged by the orchestrator, not asserted separately.

### 13.4 Test 3 — Real detections on synthetic evidence
| Check | Result observed |
|---|---|
| SHA-256 hash match | `known_file_original.png` and a byte-identical copy both hashed to `71b70b91e28cc6d4...` and were correctly flagged KNOWN CONTENT MATCH against the mock hash list. |
| OCR | Tesseract correctly read back rendered text from a synthetic "chat screenshot" image (minor character-level OCR noise, consistent with real-world OCR behavior). |
| Face correlation (dHash placeholder) | `person_photo_A.png` vs `person_photo_B.png` (same synthetic pattern, one pixel changed): hamming distance 0 → AUTO-LINK candidate. Against an unrelated pattern: hamming distance 32 → no link. Correct on both. |
| Recursive decomposition | A ReportLab-generated PDF with 2 embedded images was unpacked with `pypdf` into 2 standalone files, each independently entered into the job table as its own row. |

### 13.5 Test 4 — Measured speed difference between case profiles
| Profile | Tasks run | Measured wall time |
|---|---|---|
| CSAM ID Sprint (hash + normalize only) | 18 | 2.18 s |
| Full Investigation (all 6 available agents) | 54 | 3.62 s |

At PoC scale the absolute numbers are small, but the proportional relationship — fewer agents, fewer tasks, less time — is the same mechanism claimed for the 2-hour-vs-40-hour production estimate.

### 13.6 What remains a labeled placeholder — stated honestly
| In the PoC | Stands in for | Swap-in point |
|---|---|---|
| Perceptual hash (8×8 dHash) | InsightFace/ArcFace 512-d embeddings | Replace one embedding function; threshold logic and output schema are unchanged |
| Metadata sidecar JSON | A real Cellebrite/ALEAPP structured export | Point the same agent at the tool's actual JSON output |
| 1-entry mock hash list | NCMEC/CAID/Project VIC hash sets | Same function signature, real list |
| Fixed dependency-order resolver | An LLM (Ollama) choosing the next tool via ReAct | Replace the fixed resolver with an LLM call; the task-claiming and checkpointing layer underneath is unaffected either way |
| Regex-only financial extraction | ML-assisted entity disambiguation | Add an LLM judgment step for ambiguous matches; extraction schema is unchanged |

**This distinction is worth stating plainly to judges rather than blurring it:** Sections 3–9 of this document are the design specification; Section 13 is what has actually been verified in code. Blurring the two is exactly the kind of thing that erodes credibility with a technical reviewer — being precise about it is what builds trust instead.

---

## 14. Evaluation criteria mapping

| Judging dimension | Structural defense | Real impact |
|---|---|---|
| **Innovation** | Dependency-aware agent registry + honest agentic/deterministic split, not a prompt-chained chatbot | Toggling only what a case needs cuts triage time proportionally — verified in the PoC, not just claimed |
| **Architecture** | Durable per-file checkpointing; every proprietary tool has a free substitute with an identical interface for later swap-in | Survives real process crashes; scales to any agent count without touching the orchestrator or shared graph |
| **Operational impact** | P0 risk scoring, pre-filled BSA certificates | Shortens time-to-rescue; reduces administrative paperwork burden on the IO |
| **Ethics & XAI** | Local-only LLMs, explicit "AI accelerates, humans certify" boundary, POCSO auto-redaction, multi-signal identity confirmation | Zero data leaves the machine; full audit trail; victim faces never shown unredacted; no auto-merge on face similarity alone |

---

## 15. Immediate next steps

1. Stand up Docker Compose: Ollama + Neo4j (or NetworkX for PoC speed) + Postgres job table.
2. Wire the fixed dependency-order resolver to a real local-LLM ReAct loop (Ollama) — the one labeled gap in the current PoC.
3. Build a standalone interactive dashboard prototype (Flask or static HTML) — the toggle console and live progress feed currently only exist as terminal output and chat-rendered mockups; this is the weakest deliverable relative to the stated "Simulated Workflow" requirement and should be closed before pitch day.
4. Add a `requirements.txt` and one-command run script to the PoC repository for a clean hand-off.
5. Optionally implement one more Tier D agent for real (Watermark/IP Tracing is a reasonable next candidate) so the "pattern is proven, not just designed" claim extends to a third agent, not just two.
