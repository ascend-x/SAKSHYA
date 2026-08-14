# ACPIA — Agentic Child Protection Investigation Assistant
## Master Plan v3 — Kerala Police Cyberdome HACKP 2026

---

## 1. The pitch in one paragraph

ACPIA is an **Intelligence Fusion layer**, not a replacement for Cellebrite, Griffeye, or Nuix. Real investigators already lose time exporting reports from three siloed proprietary tools and reading them side by side — ACPIA's orchestrator sits above those silos, reads their outputs, and autonomously correlates what each tool sees in isolation (a motorcycle in a Griffeye-flagged video, a chat mention in a Cellebrite export, a GPS point in a drone log). The reasoning layer is a single agentic ReAct loop; every capability under it — hashing, face-rec, OCR, financial tracing — is a deterministic tool the loop calls, built entirely on free/local software so it runs air-gapped and satisfies India's evidentiary chain-of-custody requirements from day one.

---

## 2. Legal and procedural grounding — the detail that proves you understand their world

**Chain of custody, as it actually happens:**
1. **Seizure & isolation** — device placed in a Faraday bag to block remote wipe.
2. **Bit-by-bit imaging** — a write-blocker creates a mathematically identical clone; the original device is never touched again.
3. **Hashing** — a SHA-256 hash of the clone is generated to prove it hasn't been altered.
4. **Analysis** — only the clone is ever fed into ACPIA or any AI tool.

**Section 63, Bharatiya Sakshya Adhiniyam (BSA) 2023** — replaced Section 65B of the Indian Evidence Act when the BSA came into force. This is a material legal shift: it is now a **statutory mandate**, not best practice, that the certificate submitted to court includes the exact cryptographic hash value of the electronic evidence.

**What AI can and cannot do here — say this explicitly in the pitch:**
- AI cannot testify. ACPIA never generates its own Section 63 certificate.
- ACPIA is an **accelerated search and hashing tool**: it points to evidence, computes the hash, and pre-fills the certificate. A human Investigating Officer still verifies the finding on the cloned drive and signs it.
- This distinction — AI accelerates, humans certify — is your strongest answer to the ethics/XAI judging criterion and to any senior IPS officer's first objection.

---

## 3. System architecture — the stable backbone

```
                 ┌──────────────────────────┐
                 │   Investigator console    │  live dashboard, toggle panel,
                 │  (goal input + review UI) │  async question feed, P0 alerts
                 └────────────┬──────────────┘
                              │ goal + case profile
                 ┌────────────▼──────────────┐
                 │   Orchestrator (agentic)   │  ReAct loop — LangGraph +
                 │  never changes as agents   │  local LLM via Ollama
                 │  are added                 │
                 └────────────┬──────────────┘
     ┌──────────────┬─────────┼─────────┬──────────────┬───────────────┐
┌────▼─────┐  ┌──────▼──────┐ ┌▼────────────┐ ┌─────────▼──────┐ ┌──────▼──────┐
│ Ingestion │  │ Core        │ │ Legal &     │ │ Intelligence   │ │ Prevention & │
│ (always)  │  │ specialist  │ │ compliance  │ │ fusion         │ │ export       │
├───────────┤  ├─────────────┤ ├─────────────┤ ├────────────────┤ ├──────────────┤
│ Normalizer│  │ Hash match  │ │ SHA-256 +   │ │ Watermark/IP   │ │ KidGlove     │
│ OCR       │  │ Vision      │ │ BSA Sec.63  │ │ tracing        │ │ trend export │
│ Metadata  │  │ triage      │ │ certificate │ │ Financial/     │ │ Charge sheet │
│ recursive │  │ Face corr.  │ │ generator   │ │ crypto tracing │ │ compiler     │
│ unpacker  │  │ NLP corr.   │ │             │ │ Drone telemetry│ │              │
│           │  │ ANPR        │ │             │ │ Synthetic/     │ │              │
│           │  │             │ │             │ │ nudify detect  │ │              │
│           │  │             │ │             │ │ Risk scoring   │ │              │
└───────────┘  └─────────────┘ └─────────────┘ └────────────────┘ └──────────────┘
                              │
                 ┌────────────▼──────────────┐
                 │  Durable job table (SQL)   │  crash-resumable, per-file
                 │  + shared graph (Neo4j)    │  checkpointing
                 │  + vector index (FAISS)    │
                 └────────────────────────────┘
                              ▲
                 ┌────────────┴──────────────┐
                 │ NCMEC/NCRB API ingestion   │  cases can start here,
                 │ (structured JSON intake)   │  before an IO opens the file
                 └────────────────────────────┘
```

The orchestrator and shared graph are the **only two components that never change**. Every capability below — old or new — attaches by declaring its inputs, outputs, and dependencies, exactly like the original four-agent design did. That's the literal backbone property: extending the system never means touching the core.

---

## 4. The agentic layer (unchanged principle, now with more tools to call)

Only the orchestrator's reasoning loop is "agentic AI" — reason, call a tool, observe, replan, repeat until confident enough to act or ask a human. Every agent below, including all the new ones, is a deterministic tool the loop invokes; none of them "decide" anything on their own. This distinction matters more now that the roster has grown — a judge will ask "which of these 18 things is actually agentic," and the honest answer is still "one loop, many tools" and it does not shift.

---

## 5. Full agent registry

### Ingestion tier (always runs)
| Agent | Function |
|---|---|
| Normalizer | Unifies PDF/PPTX/video/audio/image/chat into extraction units, recursively unpacking embedded content |
| OCR | Text from images, scanned docs, screenshots |
| Metadata/EXIF | GPS, timestamps, device IDs |

### Core specialist tier (toggleable)
| Agent | Function |
|---|---|
| Hash match | PDQ hash vs. known-CSAM lists (Project VIC/NCMEC/CAID) |
| Vision triage | Risk-tiers unhashed media via local VLM |
| Face correlation | ArcFace + FAISS identity clustering, confidence-gated |
| NLP correlation | Alias/entity extraction, grooming-pattern flags |
| ANPR | Plate detection + registration lookup |

### Legal & compliance tier — **new**
| Agent | Function |
|---|---|
| **Section 63 BSA certificate agent** | Whenever any agent flags evidence, automatically runs SHA-256, populates the mandatory two-part BSA Schedule certificate, and queues it for IO signature — turns hours of paperwork into a pre-filled form |

### Intelligence fusion tier — **new**
| Agent | Function |
|---|---|
| **Watermark/steganography & IP tracing** | Reads hidden watermarks/steganographic data in seized images, correlates against Operation P-Hunt IP logs to identify original seeder vs. downloader |
| **Financial/crypto tracing** | Scans chats/screenshots for BTC/Monero addresses, UPI IDs, cash-app handles; maps them into a network graph to follow the money to ringleaders |
| **Drone telemetry & EXIF correlation** | Extracts flight logs/GPS paths from seized drone storage, cross-references with suspect phone GPS to place them at a launch site |
| **Synthetic/nudify detection** | Local model flags diffusion-artifact/deepfake signatures; tags evidence `REAL` / `SYNTHETIC` / `UNDETERMINED` so real-child cases jump the queue |
| **Imminent-danger risk scoring** | Cross-agent rule engine: NLP proximity phrases ("waiting outside your school") + converging live GPS → P0 alert, bypasses normal triage straight to the top of the dashboard |

### Prevention & reporting tier — **new**
| Agent | Function |
|---|---|
| **KidGlove trend exporter** | Aggregates grooming tactics/scripts from NLP findings, strips all PII, exports an anonymized trend report for the KidGlove schools programme |
| **Charge sheet compiler** | On IO command, drafts a chronological, legally formatted case summary from validated graph evidence — cuts weeks of paperwork to a review pass |

### Intake tier — **new**
| Agent | Function |
|---|---|
| **NCMEC/NCRB ingestion** | Securely ingests structured CyberTipline JSON directly from national reporting APIs, maps flagged IPs to local jurisdiction, and pre-tasks OSINT agents before an IO opens the case file |

### Output tier (always runs)
| Agent | Function |
|---|---|
| Human review gate | Async queue, nothing auto-confirms |
| Live dashboard | Progress, P0 alerts, pending questions |

---

## 6. Updated case profiles

- **CSAM ID sprint** — hash match + vision triage + synthetic detection. Fastest triage; separates real-child urgency from AI-generated noise immediately.
- **Network mapping** — + face, NLP, ANPR, financial tracing, watermark/IP tracing.
- **Drone-linked case** — + drone telemetry agent, layered onto network mapping.
- **Full investigation + prosecution prep** — everything, ending in the Section 63 certificate agent and charge sheet compiler.

Each profile still declares only which agents run — the dependency resolver and the durability layer underneath (Section 7) are completely unaffected by which profile is chosen.

---

## 7. Scale and fault tolerance (unchanged — this is the part that doesn't get more complex as agents are added)

One row per file/embedded object in a durable job table (`queued → processing → done`, heartbeat-based failure detection, requeue only the failed file). A crash at hour 40 of a 50-hour run loses minutes, not days. Live dashboard updates every ~60 seconds via Redis counters. Human questions go to an async queue — the scan never blocks waiting for an answer. Adding 9 new agents does not change any of this; they're just more rows of work flowing through the same job table.

---

## 8. Data model — now carries legal chain-of-custody fields

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
Every node that could end up in court carries its own hash and a certificate status field — this is the concrete implementation of "AI accelerates, humans certify."

---

## 9. Open-source stack, updated

| Capability | Free/local tool |
|---|---|
| Steganography/watermark detection | StegExpose, zsteg, or a custom LSB-analysis model |
| Deepfake/synthetic detection | Open forensic CNN models (e.g. FaceForensics++-trained detectors) |
| Crypto address extraction | Regex + entity patterns for BTC/Monero/UPI, open blockchain-explorer APIs for tracing |
| Drone telemetry parsing | DJI/ArduPilot open log parsers (.DAT/.BIN format readers) |
| SHA-256 hashing/certificate | Python `hashlib` + a templated BSA Schedule form generator |
| Everything from the prior stack | Unchanged — ALEAPP/Autopsy, InsightFace, Tesseract, Ollama, FAISS, Neo4j |

---

## 10. Build roadmap (48 hours, re-prioritized)

| Phase | Hours | Deliverable |
|---|---|---|
| Setup + durability backbone | 0–10 | Job table, worker pool, crash recovery — proven before any AI feature |
| Orchestrator loop | 10–16 | ReAct loop, dependency resolver, agent registry |
| Ingestion + OCR + Metadata + Hash | 16–22 | Always-on tier |
| Section 63 BSA certificate agent | 22–26 | High pitch value, low build cost — do this early |
| Face + NLP correlation | 26–32 | Core fusion story |
| Synthetic detection + risk scoring | 32–37 | P0 alert demo is a strong pitch beat |
| Financial tracing + watermark/IP agent | 37–42 | Pick whichever has better synthetic test data ready |
| Charge sheet compiler + dashboard polish | 42–48 | Closing demo beat |

Drone telemetry and NCMEC ingestion are strong pitch talking points but reasonable to leave as "designed, not built" for the weekend — say so plainly rather than faking a demo for them.

---

## 11. Demo script (updated)

1. Toggle console: run "CSAM ID sprint" — hash match, vision triage, and synthetic detection flag a mix of real/synthetic synthetic-test images, sorting by urgency instantly.
2. Feed in mixed evidence; show a P0 imminent-danger alert fire when a mock chat message with proximity language coincides with converging GPS — jump straight to the top of the dashboard.
3. Show the Section 63 BSA certificate agent auto-populate a certificate the moment a piece of evidence is flagged — emphasize the IO still signs it.
4. Kill a worker mid-run — dashboard shows the one failed file requeue, overall progress barely dips.
5. Click "Generate charge sheet" — a chronological, cited draft appears, explicitly labeled for IO review.

---

## 12. Evaluation criteria mapping

- **Innovation** — Intelligence Fusion above existing silos (Cellebrite/Griffeye/Nuix), not a replacement; nine domain-specific agents tied to real Cyberdome programmes (P-Hunt, KidGlove, Drone Forensic Lab).
- **Architecture** — backbone proven extensible without touching the core; durability layer scales identically regardless of agent count.
- **Impact** — P0 risk scoring shortens time-to-rescue; charge sheet compiler and BSA certificate agent directly cut investigator paperwork time.
- **Ethics/XAI** — explicit, stated boundary that AI accelerates and humans certify; every evidentiary node carries a hash and certificate status; KidGlove export is PII-stripped by design.
