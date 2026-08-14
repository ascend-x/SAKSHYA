# ACPIA — Agentic Child Protection Investigation Assistant
## Full Project Plan — Kerala Police Cyberdome HACKP 2026

---

## 1. The one-line pitch

A **plug-and-play multi-agent backbone** that turns terabytes of mixed digital evidence into correlated, investigator-verified intelligence — built entirely on **free, local, open-source tools** so it can run air-gapped on police servers from day one, and swap in commercial-grade tools (Cellebrite, Griffeye, VAHAN, PhotoDNA) later without touching the architecture.

The thing you are actually building is not a CSAM detector or a face-rec model. **You are building the orchestration and correlation layer that doesn't exist yet.** Every individual capability (OCR, face embeddings, hashing, NLP) already has a mature open-source implementation — your innovation is wiring them into agents that plan, correlate, and hand off to a human, at scale.

---

## 2. Why "no tool access" is not a blocker

Every proprietary tool in a real investigator's stack has a free, local, offline equivalent that does 80% of the job — good enough for a proof of concept, and architected so the *interface* stays identical when the real tool becomes available later.

| Capability | Proprietary tool (unavailable) | Open-source substitute (use this) | Swap-in later |
|---|---|---|---|
| Phone/device extraction | Cellebrite UFED, Magnet AXIOM | **ALEAPP / iLEAPP** (parses Android/iOS artifact dumps) | Point ingestion agent at Cellebrite's XML/JSON export instead |
| Disk imaging & carving | EnCase | **Autopsy / Sleuth Kit** (free, industry-recognized, court-admissible) | Same tool — Autopsy is already used by many agencies |
| CSAM hash matching | PhotoDNA, NCMEC hash API | **PDQ hash** (Facebook's open-source perceptual hash) + a self-built mock hash-list for demo data | Point hash-match agent at real NCMEC/CAID/ICSE hash sets |
| Media triage/categorization | Griffeye Analyze DI | **Your own Vision Triage agent** (open VLM via Ollama, e.g. LLaVA/Qwen-VL) | Griffeye API call replaces the local VLM call |
| Face recognition | Cellebrite Physical Analyzer face module | **InsightFace (buffalo_l / ArcFace)** — free, state-of-the-art, runs locally | Same — this is already what most vendors use under the hood |
| OCR | ABBYY FineReader | **Tesseract / EasyOCR** | Same |
| Chat decryption | Cellebrite | **WhatsApp Viewer / open crypt12-14 decrypters** for demo data | Cellebrite export becomes the input instead |
| Vehicle registration lookup | VAHAN API (police-only access) | **Mock RC database** (CSV you create: plate → owner/model/city) | Swap mock for real VAHAN call — same function signature |
| Reasoning / correlation LLM | GPT-4/Claude cloud API | **Local LLM via Ollama** (Llama 3, Mistral, Qwen) — zero data leaves the machine | Optional cloud LLM for non-sensitive reasoning only |
| Vector similarity search | Commercial vector DB | **FAISS** (Meta, free, runs on a laptop) | Milvus/Pinecone for production scale |
| Graph storage | Neo4j Enterprise | **Neo4j Community Edition** (free) or **NetworkX** for hackathon scale | Same — Community scales fine for a POC |

**Pitch line for judges:** *"Everything in our stack is free and runs offline today. The architecture is designed so that when Cyberdome gets Cellebrite/Griffeye/VAHAN access, you don't rebuild anything — you change one config line per agent."*

---

## 3. System architecture (recap + build-ready detail)

```
                    ┌─────────────────────────┐
                    │   Investigator Console   │  (web dashboard / CLI)
                    └────────────┬─────────────┘
                                 │ goal + agent selection
                    ┌────────────▼─────────────┐
                    │    Orchestrator Agent     │  (LangGraph, Python)
                    │  plans, dispatches, tracks│
                    └────────────┬─────────────┘
              ┌──────────────────┼──────────────────┐
   ┌──────────▼─────┐  ┌─────────▼────────┐  ┌───────▼────────┐
   │ Ingestion tier  │  │  Specialist tier │  │  Output tier    │
   │ (always runs)   │  │ (toggle on/off)  │  │ (always runs)   │
   ├─────────────────┤  ├──────────────────┤  ├─────────────────┤
   │ File normalizer │  │ Hash-match       │  │ Human review    │
   │ OCR extractor   │  │ Vision triage    │  │ gate            │
   │ Metadata/EXIF   │  │ Face correlation │  │ Report generator│
   └─────────────────┘  │ NLP correlation  │  │ Case dashboard  │
                          │ ANPR + RC lookup │  └─────────────────┘
                          │ Timeline builder │
                          └──────────────────┘
                                 │
                    ┌────────────▼─────────────┐
                    │  Shared evidence graph    │  (Neo4j / NetworkX)
                    │  + vector index (FAISS)   │
                    └───────────────────────────┘
```

**Local LLM setup:** Ollama running Llama 3 8B (fast, runs on a laptop GPU) for reasoning/correlation text, and a local VLM (Qwen2-VL or LLaVA) for vision triage. Both fully offline — this is your strongest "chain of custody" argument to senior police officials.

---

## 4. Agent roster — build spec

Each agent is a **Python class with a declared input schema, output schema, and a `run()` method** that the orchestrator calls. This is what makes the toggle console real, not just a UI mockup.

```python
class Agent:
    id: str
    name: str
    requires: list[str]   # ids of agents that must run first
    inputs: list[str]     # data types it consumes from the graph
    outputs: list[str]    # data types it writes to the graph
    def run(self, case_id, config) -> AgentResult: ...
```

| Agent | Requires | Core library | Output written to graph |
|---|---|---|---|
| Ingestion/normalizer | — | Apache Tika, python-pptx, PyMuPDF | `ExtractionUnit` nodes |
| OCR | Ingestion | Tesseract / EasyOCR | Text spans with source refs |
| Metadata/EXIF | Ingestion | ExifTool | GPS, timestamp, device nodes |
| Hash match | Ingestion | PDQ hash + mock hash-list | `KnownContent` flag, zero human view |
| Vision triage | Ingestion | Local VLM (Ollama) | Risk-tier score per media file |
| Face correlation | Metadata | InsightFace + FAISS | `Identity` cluster nodes, confidence score |
| NLP correlation | OCR | Local LLM (Ollama) + spaCy NER | Alias/entity edges, grooming-pattern flags |
| ANPR | Vision triage | YOLOv8 plate detector + EasyOCR + mock RC CSV | `Vehicle` node linked to owner record |
| Timeline builder | Metadata, NLP | Rule-based chronology + LLM summarizer | Ordered event list |
| Reporting | Timeline | LLM (local) template fill | Draft investigator report (flagged "AI-drafted") |

---

## 5. Data model (what actually goes in the graph)

Every fact is a node with a **confidence score and a source pointer** — this is your XAI/ethics answer baked into the data model itself, not bolted on:

```json
{
  "node_id": "face_0091",
  "type": "Identity",
  "confidence": 0.81,
  "evidence": [
    {"source_file": "IMG_4045.jpg", "detector": "InsightFace-buffalo_l"},
    {"source_file": "IMG_5210.jpg", "detector": "InsightFace-buffalo_l"}
  ],
  "reasoning": "Cosine similarity 0.81 between face embeddings in both images",
  "status": "pending_review"
}
```

No node is ever marked "confirmed" without `status: investigator_approved` set by a human action logged with a timestamp and user ID — that's your audit trail.

---

## 6. Build roadmap (weekend timeline)

| Phase | Hours | Deliverable |
|---|---|---|
| Setup | 0–3 | Repo skeleton, Docker Compose (Ollama + Neo4j/FAISS + Python env), sample synthetic dataset (never real/found CSAM-adjacent data — generate mock chats, stock photos, dummy EXIF) |
| Core backbone | 3–10 | Orchestrator with dependency resolver, agent registry JSON, shared graph read/write |
| Ingestion + OCR + Metadata | 10–16 | These three always-on agents fully working end to end |
| Hash match + Vision triage | 16–22 | PDQ hashing against mock list; local VLM risk-tiering |
| Face correlation | 22–30 | InsightFace embeddings → FAISS lookup → threshold-gated identity clusters |
| NLP correlation + ANPR | 30–38 | Chat entity extraction; plate detection + mock RC lookup |
| Timeline + reporting + human gate | 38–44 | Draft report generation, review UI |
| Dashboard/CLI polish + rehearsal | 44–48 | Toggle console, demo script, slide deck |

---

## 7. Demo script for pitch day

1. **Open with the toggle console** — show a "CSAM ID sprint" preset running in seconds vs. a "Full investigation" preset, to make the time-savings argument visceral immediately.
2. **Feed in synthetic multi-format evidence** (a PDF, two photos of the "same person," a mock chat log, one image with a vehicle plate) and watch agents light up in the dashboard as they process.
3. **Show the face correlation catch**: two unrelated-looking photos get linked, with the confidence score and reasoning shown — not asserted, shown.
4. **Show the human review gate** rejecting or approving a proposed link — prove the system cannot act without a human.
5. **End on the generated report** — a clean, timestamped, source-cited investigator summary.

---

## 8. Evaluation criteria — how this plan answers each one

- **Innovation** — dependency-aware agent registry + toggle console, not a fixed pipeline.
- **Architecture** — every "unavailable" tool has a clearly scoped substitute with an identical interface for later swap-in; this is the detail that proves the architecture, not just the demo, is real.
- **Impact** — case-profile presets mirror real triage order (hash-match first, exactly like Griffeye workflows).
- **Ethics/XAI** — every graph node carries confidence + evidence + reasoning; nothing auto-confirms; local-only LLMs mean no data ever leaves the machine.

---

## 9. Immediate next steps

1. Stand up Docker Compose: Ollama + Neo4j (or NetworkX for speed) + Python service.
2. Generate synthetic test dataset (mock names, stock photos of different "identities," dummy chat JSON, sample plate images) — document that this is synthetic in your repo README for the judges.
3. Build the orchestrator's dependency resolver first — everything else plugs into it.
4. Wire one agent fully end-to-end (recommend: OCR or Hash-match, both are fast wins) before touching the others, to prove the pattern works.
