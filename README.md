# SAKSHYA (साक्ष्य) : Agentic Knowledge System for Youth-Safety Analysis & Legal Evidence Compliance

> **S**ecure **A**gentic **K**nowledge system for **S**tructured **H**andling of **Y**outh-protection & **A**dmissible evidence

[![Bharatiya Sakshya Adhiniyam](https://img.shields.io/badge/Compliance-BSA%202023%20Sec%2063%20%26%2057-FF6B00?style=for-the-badge)](https://github.com/ascend-x/SAKSHYA)
[![Trauma & Ethics](https://img.shields.io/badge/Ethics-POCSO%20Victim%20Face%20Masking-059669?style=for-the-badge)](https://github.com/ascend-x/SAKSHYA)
[![Architecture](https://img.shields.io/badge/Architecture-14%20Agents%20%7C%206%20Tiers-0D1B2A?style=for-the-badge)](https://github.com/ascend-x/SAKSHYA)
[![Offline Sovereignty](https://img.shields.io/badge/Security-100%25%20Offline%20Air--Gapped%20LLM-DC2626?style=for-the-badge)](https://github.com/ascend-x/SAKSHYA)

---

## 🏛️ Executive Summary

**SAKSHYA (साक्ष्य)** is an offline, Sanskrit-rooted **Intelligence Fusion Layer** designed for Law Enforcement Agencies (LEAs) and Investigating Officers (IOs) handling child protection, youth-safety analysis, and digital forensic investigations under India's **Bharatiya Sakshya Adhiniyam (BSA), 2023** (Sections 63 and 57) and the **POCSO Act**.

Rather than replacing existing proprietary forensic tools (such as Cellebrite UFED, Magnet AXIOM, or Griffeye), SAKSHYA sits above them as an orchestrator. It ingests parsed outputs and executes autonomous, dependency-aware **ReAct reasoning loops** to correlate cross-tool findings (e.g. connecting a chat handle in a phone dump to an EXIF location in an image and a vehicle registration in a CCTV clip).

> **Core Legal & Ethical Anchor:** *"AI Accelerates. Humans Certify."* — SAKSHYA never generates unverified legal testimony. It computes cryptographic SHA-256 evidence blocks and pre-fills Section 63 BSA certificates, leaving the physical certified authority in the hands of the human Investigating Officer.

---

## ⚡ Key Features

- **🎯 Interactive Investigator Workstation PoC (`/demo`)**: Standalone web workstation featuring case overview dashboards, live agent scan execution, per-file SQLite job table crash recovery, confidence-scored review queues, and Section 63 BSA signature tools.
- **🛡️ Bharatiya Sakshya Adhiniyam (BSA) 2023 Compliance**:
  - **Section 63 BSA**: Mandatory Part A (Hardware/IMEI) & Part B (Cryptographic SHA-256 validation block) certificate generation.
  - **Section 57 BSA**: Explanation 4, 6 & 7 primary evidence cache timeline verification.
- **🔒 POCSO Victim Protection**: Automatic ArcFace/VLM face blurring and PII redaction over high-risk media before display to human reviewers.
- **🧠 LangGraph + Ollama Offline Reasoning**: 100% local quantized LLMs (Qwen2-VL, Llama 3) guaranteeing zero evidence data exfiltration to third-party cloud APIs.
- **🔄 Per-File Durable Checkpointing & SIGKILL Recovery**: State-machine job tracking (`queued` → `processing` → `done`/`failed` with a 90s heartbeat daemon). Survived SIGKILL process crashes resume instantly without re-analyzing completed files.
- **📐 Calibrated Biometric Gates**: 512-dimension ArcFace cosine distance lookups (`≥0.62` auto-link candidate identity, `0.45–0.62` human review queue, `<0.45` link rejection).
- **📋 AI-Drafted Charge Sheet Compiler**: Drafts chronological legal narratives citing validated Neo4j graph subgraphs and exhibit numbers.

---

## 🤖 14-Agent Registry Across 6 Tiers

| Tier | Agent Name | Inputs | Outputs | Core Tech / Library |
| :--- | :--- | :--- | :--- | :--- |
| **Tier A** | **Normalizer Agent** | PDF, PPTX, MP4, WAV, ZIP | Extracted file units, Hash index | Apache Tika, PyMuPDF |
| **Tier A** | **OCR Agent** | PNG, JPG, Screen Grabs | Structured Text, Bounding Boxes | Tesseract / EasyOCR |
| **Tier A** | **Metadata / EXIF Agent** | Raw media binary stream | GeoJSON, ISO Timestamps, Serial IDs | ExifTool / PyExif |
| **Tier B** | **Hash Match Agent** | File Byte Stream | Match Flag, Hash Distance | PDQ Hash / SHA-256 |
| **Tier B** | **Vision Triage Agent** | Unflagged Image / Video | Risk Level (P0–P3), Blurred Preview | Qwen2-VL / LLaVA |
| **Tier B** | **Face Correlation Agent** | Cropped Face Image | 512-d Vector, Identity Node | InsightFace (ArcFace) + FAISS |
| **Tier B** | **NLP Correlation Agent** | Chat Logs, OCR Text | Named Entities, Grooming Flags | spaCy + Local LLM |
| **Tier B** | **ANPR Agent** | CCTV frames, Vehicle Photos | Plate String, Vehicle Owner PII | YOLOv8 + EasyOCR + VAHAN |
| **Tier C** | **Section 63 BSA Agent** | Flagged Evidence Node | PDF Certificate (Part A & B) | hashlib, ReportLab |
| **Tier D** | **Watermark / IP Tracing** | Seized Image / Video | Original Seeder IP, Downloader Graph | zsteg / LSB-Analysis |
| **Tier D** | **Financial & Crypto Tracing** | Chat dumps, Text documents | Crypto Node, Transaction Edge | Regex + Chain APIs |
| **Tier D** | **Drone Telemetry Agent** | DAT / BIN Drone Logs | Flight Path GeoJSON, Launch Point | DJI / ArduPilot Parsers |
| **Tier D** | **Synthetic / Deepfake Detect**| High-Risk Media | Classification Label, Confidence | FaceForensics++ CNN |
| **Tier D** | **Imminent Risk Scoring** | Graph Findings & GPS | P0 Urgency Alert, Alert Push | Convergence Rule Engine |

---

## 🚀 Quick Start & Local Running

### Prerequisites
- Python 3.9+
- Node.js / Modern Browser (for interactive dashboard)

### 1. Clone the Repository
```bash
git clone https://github.com/ascend-x/SAKSHYA.git
cd SAKSHYA
```

### 2. Start the Local Server
```bash
python3 -m http.server 8000
```

### 3. Open in Browser
- **Landing Page & System Architecture**: [http://localhost:8000](http://localhost:8000)
- **Investigator Workstation PoC**: [http://localhost:8000/demo](http://localhost:8000/demo)

---

## 📊 Proof of Concept (PoC) Verification Benchmarks

| Case Profile Preset | Tasks Executed | Measured Wall Time | Primary Target |
| :--- | :---: | :---: | :--- |
| **CSAM ID Sprint** | 18 | **2.18 s** | Known-content hash identification |
| **Network Mapping** | 36 | **2.84 s** | Cross-chunk entity resolution & Neo4j graph commit |
| **Drone-Linked Case** | 42 | **3.12 s** | Drone DAT telemetry trajectory mapping |
| **Full Investigation** | 54 | **3.62 s** | All 14 agents + BSA Section 63 Certificate pre-fill |

---

## ⚖️ Legal & Statutory Compliance

- **Bharatiya Sakshya Adhiniyam (BSA), 2023**: Replaced Section 65B of the Indian Evidence Act on 1 July 2024. SAKSHYA pre-fills Part A & Part B schedules while enforcing physical IO certification.
- **POCSO Act Section 14 / 15**: Automatic victim face blurring prevents trauma and illegal disclosure during investigative review.

---

## 📄 License & Attribution

Developed for **Kerala Police Cyberdome / HACKP 2026**.
Released under the **MIT License**.
