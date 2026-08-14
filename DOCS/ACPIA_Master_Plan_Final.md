# ACPIA — Agentic Child Protection Investigation Assistant
## Master Plan — Kerala Police Cyberdome HACKP 2026

---

## 1. The pitch in one paragraph

ACPIA is not a CSAM detector and not a chatbot. It is a **planning layer** — one LLM-driven reasoning loop that decides, case by case, which of a registry of deterministic forensic tools to run, in what order, and when to stop and ask a human — sitting on top of a **crash-resumable, terabyte-scale processing backbone** built entirely from free, local, offline tools. The novelty is not any single AI capability (face-rec, OCR, hashing all already exist); it's the **orchestration, correlation, and fault-tolerant scale layer that doesn't exist yet** in the investigator's toolkit, wired so real commercial tools (Cellebrite, Griffeye, VAHAN) slot in later without a redesign.

---

## 2. What's actually novel here — say this explicitly to judges

Most competing pitches will show a chatbot wrapped around a vision model. Your differentiation is three specific engineering choices most teams won't make:

1. **A dependency-aware agent registry with case-profile presets** (Section 5) — investigators toggle only the agents a case needs, cutting a 40-hour scan to 2 hours for a CSAM-ID-only case. This mirrors real Griffeye/Cyberdome triage order (hash-match always runs first) instead of inventing a new workflow.
2. **Per-file durable checkpointing** (Section 6) — a crash at hour 40 of a 50-hour scan loses minutes, not days. This is the single detail that separates a hackathon toy from something Cyberdome could actually run on a live case.
3. **An explicit, honest separation of "agentic" from "automated"** (Section 4) — one real ReAct planning loop drives tool selection; everything else is classical ML/ETL called as tools. This precision under judge questioning is worth more than overclaiming.

---

## 3. System architecture

```
                 ┌──────────────────────────┐
                 │   Investigator console    │  live dashboard, toggle panel,
                 │  (goal input + review UI) │  async question feed
                 └────────────┬──────────────┘
                              │ goal + case profile
                 ┌────────────▼──────────────┐
                 │   Orchestrator (agentic)   │  ReAct loop — LangGraph +
                 │  plans, calls tools, asks  │  local LLM via Ollama
                 └────────────┬──────────────┘
     ┌────────────────────────┼────────────────────────┐
┌────▼─────┐          ┌───────▼────────┐        ┌───────▼────────┐
│ Ingestion │          │ Specialist tier │        │  Output tier    │
│ (always)  │          │  (toggleable)   │        │  (always)       │
├───────────┤          ├────────────────┤        ├─────────────────┤
│ Normalizer│          │ Hash match      │        │ Human review    │
│ OCR       │          │ Vision triage   │        │ gate (async)    │
│ Metadata  │          │ Face correlation│        │ Report generator│
│ recursive │          │ NLP correlation │        │ Live dashboard  │
│ unpacker  │          │ ANPR + RC lookup│        └─────────────────┘
└───────────┘          │ Timeline builder│
                        └────────────────┘
                              │
                 ┌────────────▼──────────────┐
                 │  Durable job table (SQL)   │  1 row per file/embedded
                 │  + shared graph (Neo4j)    │  object — checkpointed
                 │  + vector index (FAISS)    │  state, resumable on crash
                 └────────────────────────────┘
```

---

## 4. The agentic layer — precisely, so it holds up under questioning

**Only one thing here is "agentic AI":** the orchestrator's reasoning loop. Everything else is a deterministic tool it calls.

| Layer | What it is | Agentic? |
|---|---|---|
| OCR, hashing, EXIF, face embedding, ANPR | Fixed function: input → output, same every time | No — classical ML/CV, called as tools |
| Orchestrator | LLM reasons about the goal, picks a tool, observes the result, updates its plan, repeats (ReAct loop) | **Yes** — this is the actual agent |
| NLP correlation agent | LLM judges "are these two entities the same person?" from partial evidence | Yes, narrowly — a judgment call, not a lookup |
| Reporting agent | LLM synthesizes a narrative from structured graph facts | Weak agentic claim — generation over retrieved facts, no looping |

**Concrete trace** (goal: "map Viper's physical locations"):
1. *Reason:* "Don't know what Viper has said yet — pull chat history first." → calls NLP tool.
2. *Observe:* messages mention a "meetup" with a timestamp. *Reason:* "Check media sent near that time for GPS." → calls Metadata tool.
3. *Observe:* one image has EXIF GPS in Ernakulam. *Reason:* "Confidence is moderate, not high — this needs a human, not an auto-report." → writes to the async review queue instead of confirming.

No code told it this sequence — it derived each next step from what the previous tool returned. That branching is what a fixed pipeline cannot do, and it's the whole basis for calling this "agentic" rather than "automated."

---

## 5. Plug-and-play agent registry + case profiles

Every agent declares `requires` (which other agents must run first), so the orchestrator can safely run any subset the investigator picks — this is what makes toggling safe rather than just a UI gimmick.

| Agent | Requires | Free/local tool | Time (per file, rough) |
|---|---|---|---|
| Ingestion/normalizer | — | Apache Tika, PyMuPDF, python-pptx | fast |
| OCR | Ingestion | Tesseract / EasyOCR | fast |
| Metadata/EXIF | Ingestion | ExifTool | fast |
| Hash match | Ingestion | PDQ hash + mock/real hash-list | fast |
| Vision triage | Ingestion | Local VLM via Ollama (Qwen2-VL/LLaVA) | moderate |
| Face correlation | Metadata | InsightFace (ArcFace) + FAISS | moderate |
| NLP correlation | OCR | Local LLM (Ollama) + spaCy NER | moderate |
| ANPR | Vision triage | YOLOv8 plate detector + EasyOCR + mock RC CSV | moderate |
| Timeline + report | Metadata, NLP | Rule-based + LLM summary | fast |

**Case profiles** (mirrors real triage order — hash-match always first, exactly like Griffeye workflows):
- **CSAM ID sprint** → hash match + vision triage only. Fastest, for a raw tip-off.
- **Network mapping** → hash, metadata, face, NLP, ANPR. For building suspect networks.
- **Full investigation** → everything. For case-building toward prosecution.

---

## 6. Scale and fault tolerance — the part that makes this real

**The fix for "restart from zero":** never treat a case as one job. Treat it as **one row per file** (and one row per embedded object recursively extracted from PDFs/PPTX/archives) in a durable job table — SQLite for the hackathon, Postgres for production.

```
queued → processing (worker heartbeat) → done (written to graph)
                    ↓ no heartbeat for 90s
                 failed → requeue (only this file)

On any restart: query the job table for everything not "done". That's the entire resume logic.
```

- A crash at hour 40 of a 50-hour run loses at most the handful of files mid-flight, not the 40 hours of completed work.
- **Parallelism** — a task queue (Celery+Redis, or Ray) runs N workers pulling from `queued`; throughput scales with worker count, same pattern commercial tools already use for bulk media.
- **Recursive decomposition handles every file type uniformly** — a PDF with 40 embedded photos produces 41 job-table rows, each independently checkpointable. "Thousands of images" and "40 PDFs with embedded images" look identical to the system.

**Live updates:** each worker writes a completion counter to Redis; a dashboard polls/pushes it via WebSocket every ~60 seconds — files done/total, per-agent phase, rolling-throughput ETA.

**Live human questions, non-blocking:** when an agent hits a low-confidence decision, it writes a question to an async review queue and immediately moves to the next file — nothing waits on an answer. The investigator answers whenever convenient; only that one graph node updates. This keeps a 50-hour scan under continuous human oversight instead of one batch review at the end.

---

## 7. Correlation specifics (the "not random" parts)

**Face correlation:** detect → embed (ArcFace, 512-dim) → FAISS similarity lookup → threshold gate. Above ~0.62 cosine similarity, auto-link as candidate identity; 0.45–0.62, surface as "possible match" for human review; below, no link. Auto-merges additionally require a corroborating signal (shared phone/location/alias) before being treated as confirmed — face similarity alone never silently merges two people.

**Cross-chunk entity resolution at 4TB scale:** this is an indexing problem, not a context-window problem. Every ingestion worker is stateless and writes small structured facts into the shared graph/vector index; a background resolution agent periodically re-scans candidate clusters (fuzzy name + shared contact + co-occurrence) and proposes merges with a confidence score. A name in file #3 and file #48,000 correlate through an index lookup, not by an LLM "remembering" 4TB.

**Vehicle plates:** YOLOv8 plate detection → OCR → lookup against a mock RC CSV for the demo (owner/model/city), architected so the same function signature later points at VAHAN through Cyberdome's authorized access channel. Plate-to-owner lookups return PII on possibly-uninvolved people — gate this more tightly than other agent actions, with a mandatory reason-for-query field, logged.

---

## 8. Data model — confidence and evidence on every node

```json
{
  "node_id": "face_0091",
  "type": "Identity",
  "confidence": 0.81,
  "evidence": [
    {"source_file": "IMG_4045.jpg", "detector": "InsightFace-buffalo_l"},
    {"source_file": "IMG_5210.jpg", "detector": "InsightFace-buffalo_l"}
  ],
  "reasoning": "Cosine similarity 0.81 between face embeddings",
  "status": "pending_review"
}
```
No node reaches `status: investigator_approved` without a logged human action — this is the data-model-level answer to the ethics/XAI evaluation criterion, not a bolted-on disclaimer.

---

## 9. Open-source stack (no proprietary tool access needed)

| Capability | Free substitute used now | Swap-in later |
|---|---|---|
| Device/disk extraction | ALEAPP/iLEAPP, Autopsy/Sleuth Kit | Cellebrite/AXIOM export as input |
| CSAM hash matching | PDQ hash + mock hash-list | Real NCMEC/CAID/ICSE hash sets |
| Media triage | Local VLM (Ollama) | Griffeye API |
| Face recognition | InsightFace (ArcFace) | Same — already industry standard under the hood |
| OCR | Tesseract/EasyOCR | Same |
| Vehicle lookup | Mock RC CSV | VAHAN via authorized police channel |
| Reasoning LLM | Local via Ollama (Llama 3/Mistral/Qwen) | Optional cloud LLM for non-sensitive text only |
| Vector/graph store | FAISS, Neo4j Community/NetworkX | Milvus/Neo4j Enterprise at production scale |

Everything runs offline — the strongest "chain of custody" argument for senior police officials in the room.

---

## 10. Build roadmap (48 hours)

| Phase | Hours | Deliverable |
|---|---|---|
| Setup | 0–3 | Docker Compose (Ollama, Neo4j/FAISS, Postgres job table), synthetic test dataset (documented as synthetic in the README) |
| Durability backbone | 3–10 | Job table, worker pool, heartbeat/requeue logic — prove crash recovery first, before any AI feature |
| Orchestrator loop | 10–16 | LangGraph ReAct loop, agent registry, dependency resolver |
| Ingestion + OCR + Metadata | 16–22 | Always-on tier, recursive embedded-object extraction |
| Hash match + Vision triage | 22–28 | PDQ hashing, local VLM risk-tiering |
| Face correlation + NLP | 28–36 | InsightFace/FAISS pipeline, chat entity extraction |
| ANPR + Timeline + Report | 36–42 | Plate detection, mock RC lookup, draft report generation |
| Dashboard, live updates, rehearsal | 42–48 | Toggle console, progress feed, async question queue, demo script |

---

## 11. Demo script

1. Toggle console: run "CSAM ID sprint" vs "Full investigation" on the same synthetic case — visible time difference.
2. Feed in mixed synthetic evidence (PDF with embedded photos, two photos of the "same person," mock chat log, a plate image) — watch agents light up live.
3. Kill a worker mid-run on purpose — show the dashboard mark one file `failed`, requeue it automatically, and the overall progress barely dips.
4. Show a face-correlation finding land in the async review queue with its confidence score and evidence — approve or reject it live.
5. End on the generated report — timestamped, source-cited, flagged "AI-drafted, investigator-approved."

---

## 12. Evaluation criteria mapping

- **Innovation** — dependency-aware toggleable registry + honest agentic/deterministic split, not a prompt-chained chatbot.
- **Architecture** — durable per-file checkpointing and open-source substitutes with identical interfaces to commercial tools prove this scales beyond a demo.
- **Impact** — case profiles cut real processing time; async review keeps a 50-hour scan under continuous, not batch, human oversight.
- **Ethics/XAI** — every graph node carries confidence + evidence + reasoning; local-only LLMs mean no data leaves the machine; nothing auto-confirms.
