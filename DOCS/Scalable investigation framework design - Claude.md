









<!-- Start of picture text -->
Forensic import Normalization Hash match<br>Cellebrite, XRY, files Unify media, chat, meta PhotoDNA / NCMEC lists<br><!-- End of picture text -->



<!-- Start of picture text -->
Orchestrator agent<br>Plans, dispatches, tracks state<br>Shared evidence knowledge graph<br>Entities, timestamps, links, confidence<br>Vision triage Correlation agent Timeline / report + plug in more<br>Risk-tier novel media Aliases, geo, links Chronology, drafts<br>Human review gate<br>Investigator confirms every action<br>Investigator dashboard<br>Leads, report, audit trail<br><!-- End of picture text -->

That's the backbone: an orchestrator sitting on a shared evidence knowledge graph, with — agents plugging in as peers rather than a fixed pipeline. Judges care about scalability this is your answer to "what if you had more time": you just add a node. 

## The agent roster (what each one actually does) 

## Tier 0 — Ingestion & normalization (glue, not AI) 

Parses forensic exports (UFED/Cellebrite reports, WhatsApp DB dumps, image folders) into a common schema: {entity, timestamp, source_device, raw_ref} . Boring but — essential this is what makes everything downstream possible. 

## Tier 1 — Hash match (the safety-critical shortcut) 

- Every image/video hash is checked against NCMEC/PhotoDNA style hash databases before anything else touches it. Known material gets flagged instantly with zero AI risk, zero human viewing. This should be your first, most confident demo beat — it's real, " " - deployed tech, and it directly kills the terabytes of data problem for previously identified content. 

## Tier 2 — Vision triage agent (for novel/unhashed content) 

- Classifies unhashed media into risk tiers (e.g. benign / needs review / urgent) using a 

- — vision language model, writing only metadata and a risk score to the graph never surfacing raw imagery unnecessarily. This is your "cognitive relief" story: the investigator sees "12 items flagged urgent" not 12,000 files. 

## Tier 3 — Correlation agent 

Runs entity resolution across silos: same phone number appearing under different aliases, EXIF GPS clustering with chat-mentioned locations, username reuse across platforms. This is the "hidden connections" pitch line, and it's genuinely buildable with NER + fuzzy matching + a graph DB (Neo4j is perfect for a weekend build). 

## Tier 4 — Timeline & reporting agent 

Once the graph has enough entities/edges, this agent orders events chronologically and drafts an investigator-ready summary — always labeled "AI-drafted, pending review," never - auto filed. 

## - Human review gate (non negotiable, and your strongest ethics/XAI score) 

No agent output reaches a decision or leaves the system without investigator sign-off. Every graph edge the AI proposes carries a confidence score and a "why" (which source, which — ' rule/model fired) this is your explainability story, and it s cheap to implement: just log the reasoning trace. 

## Why this satisfies every evaluation criterion 

- 

- Innovation: multi agent orchestration over a shared graph, not prompt chaining. 

- Architecture: the orchestrator/graph split is exactly what lets you say "here's how we'd add a dark-web-crawl agent or a financial-forensics agent next" without a redesign. 

- 

- Impact: hash matching alone eliminates most manual triage; correlation agent demonstrates the "needle in the datacenter" story directly. 

- - 

- Ethics/XAI: hash match first avoids ever training on real CSAM; vision agent never displays raw content by default; hard human gate before any action; every graph edge has a traceable reasoning source. 

## For the weekend build 

Use synthetic data (public domain images, mock chat JSON you write yourselves) — never real or found CSAM-adjacent material, even for testing. Stack that's fast to stand up: Neo4j or even a simple graph JSON for the knowledge graph, LangGraph or a hand-rolled orchestrator loop for agent dispatch, any VLM API for triage, a lightweight dashboard (Streamlit or a React mockup) for the investigator view. 

Want me to sketch the agent-to-agent message schema (what a "finding" object looks like - - as it moves through the graph), or help you build a working proof of concept (e.g. the correlation agent linking a mock EXIF+chat dataset) to have actual code for the "working codebase" deliverable? 

i want this this system to be very realistic and novel and scalabel and also see in a investigation files types like pdf video ppt images multiple things are there but how lets suppose one face came in a photo and other one in b photo it should understnad and coreleate and it should be very specidfic not random and also  lets suppose the total data to be reviewed is nealy 4 tb how for such a huge amoun of data the context can be real lets suppose a name came in first chunk and another name came in last chink then too the relation to be found also like car number fetching from images and grabbing the degtals of teh car from public db 

Architected distributed pipeline for face correlation, entity resolution, and vehicle database integration 

Good — these are the three things that separate a real system from a hackathon toy, so let's get specific on each. 

# - " " 1. Multi format ingestion: normalize everything to the same unit 

- Every file type gets run through a type specific extractor, but they all output the same — shape of object into the graph an extraction unit with a source pointer, a type, and content: 

- PDF → text blocks (PyMuPDF), embedded images, tables 

- PPTX → slide text + embedded images + speaker notes (python-pptx) 

- — ' 

- Video → keyframes at scene cuts (ffmpeg scene detection, not every frame that s how you avoid exploding 1hr of video into 100k images), audio transcript (Whisper), and each keyframe run through face/object detectors 

- Images → faces, OCR'd text, EXIF, objects (plates, weapons, logos) 

- Chat exports → structured messages with timestamp/sender already 

The point: nobody ever "reads" a PPTX or "watches" a video as a monolith. Everything decomposes into small typed facts (a face, a sentence, a GPS coordinate, a plate string) tagged with exactly which file/page/frame/timestamp it came from. That decomposition is what makes correlation possible later — you're linking facts, not documents. 

# — 2. Face correlation specific, not random 

- This is a solved, well calibrated pipeline, not a fuzzy AI guess: 



<!-- Start of picture text -->
Photo A Photo B<br>Face detected Face detected<br>Embed (ArcFace) Embed (ArcFace)<br>512-dim vector 512-dim vector<br>Vector index (FAISS)<br>Cosine distance lookup<br>Threshold check<br>Similarity ≥ 0.62?<br>Merge into one identity node Flag for human review<br><!-- End of picture text -->

The specificity comes from three things, not one fuzzy AI call: 

- Deterministic math, not guessing. A face becomes a fixed 512-dimension vector (ArcFace or FaceNet). Same person → vectors land close together in that space. This is the same tech behind phone face-unlock — mature, well-benchmarked, not experimental. 

- A calibrated threshold with a rejection band. You don't auto-merge at any similarity. High similarity (say >0.62 cosine) → auto-link as same identity. Mid-range (0.45–0.62) → surfaced to the investigator as "possible match" with both source images side by side, never silently merged. Below that → not linked at all. This is what makes it "not random" — every merge has a number attached to it that an investigator can question. 

- ' 

- Multi signal confirmation, not face alone. The graph doesn t merge purely on face — 

- similarity it looks for corroborating signals (same phone number nearby, same location metadata, same alias in chat) before it treats two nodes as fully confirmed. Face similarity alone creates a "candidate identity," not a confirmed one. This is your - - — - - 

- strongest anti false positive story for the ethics judges a face only auto merge in a child protection case is exactly the kind of mistake that could wrongly implicate someone. 

# — - 3. The 4TB problem this is not a context window problem 

This is the key insight to get right, and it's worth stating plainly in your pitch: you never put 4TB, or even 4GB, into an LLM's context. If a name shows up in file #3 and file #48,000, you don't need an LLM to "remember" that — you need an index, not a memory. 

How it actually works at scale: 

- Every worker is stateless and parallel. Hundreds of ingestion workers process files — 

- independently (map step), each writing small structured facts a name, a face vector, a plate string, a phone number — into a shared, persistent store (graph DB + vector index). No worker needs to know what any other worker found. 

- Correlation happens in the index, not in a prompt. When file #48,000 produces the name "Ravi Kumar," it doesn't get compared against 47,999 prior files by rereading them. It gets embedded and looked up against the existing name/entity index in milliseconds — the same way a search engine finds a match instantly instead of rereading the internet. 

- A background resolution agent runs continuously, not once. As new entities stream - " " 

- in, it periodically re scans clusters of maybe same person candidates (fuzzy name match + shared phone/email/face + co-occurrence) and proposes merges — again, always with a confidence score, always reviewable. 

- LLM reasoning is invoked narrowly, only on small retrieved subgraphs — e.g. "here are two candidate profiles that share a phone number and a similar name, decide if they're the same person" — never on the raw 4TB. This is the difference between a system that's architecturally capable of scale and one that just says "we'll use a bigger context window." 

This is genuinely the same pattern production systems use for fraud detection and recommendation at scale (retrieval-augmented, index-first, LLM-narrow) — it'll read as credible to technical judges specifically because you're not claiming an LLM can "hold" 4TB. 

# 4. Vehicle plate → identity 

- ANPR pipeline: a detector (YOLO fine tuned for plates) locates the plate region in an image or video frame → OCR reads the string → the plate is written into the graph as a node linked to the source frame/location/timestamp. For lookup, the honest and correct framing for your pitch is: query India's VAHAN vehicle registration database through the police's existing authorized access channel — Kerala Police already has legal integration paths to - ' RC lookup (used in enforcement apps today), so you re not scraping or building unauthorized access; you're adding an agent that calls an API investigators are already legally allowed to query. For the demo, stub this with a small mock RC dataset so you can show the flow (plate detected → OCR'd → looked up → owner details appear behind the - human review gate) without needing real government API credentials. 

One thing worth flagging for your ethics slide: plate-to-owner lookups return personal data (name, address) on people who may be completely uninvolved — so this should be one of - - the most tightly gated actions in the system, logged with a mandatory reason for query - field, not a background auto lookup on every plate you see. 

Want me to sketch the entity node schema (what a "Person," "Vehicle," or "Face cluster" — ' node actually looks like in the graph, with its fields and confidence scores) that d give you something concrete to put in the "agent blueprints" deliverable? 

This is a powerful, high-st akes problem statement. Transforming massive, silo ed digital evidence into ac tionable intelligence requi res shifting from reacti… PASTED 



<!-- Start of picture text -->
PASTED<br><!-- End of picture text -->

the thing is is this is plug anf play system like lets suppose ht investion they can remove all the agents and use only ocr and required agents which will reduce the time also see how real investion goes like hasing what happens real now and see the existing tools and itegrate ther fetaures 

and also all the type in the world 

see teh pasted content and see all teh features and try to innovate 

Synthesized modular architecture with real forensic workflows and tool integration 

This is the right instinct, and it's actually a bigger architectural upgrade than it might sound — - - like most hackathon teams build one fixed pipeline. A true plug and play system needs three things the pasted blueprint doesn't have yet: an agent registry with a dependency graph, case-profile presets that mirror how investigations already run, and integration points into tools investigators already use instead of replacing them. Let me build that out. 

# 1. Agent registry: not a checklist, a dependency graph 

' — You can t let an investigator toggle agents totally freely some agents need another agent's output to function (Correlation needs Metadata + NLP done first). So every agent declares its inputs, outputs, and cost, and the orchestrator only runs what's needed to satisfy the investigator's selection: 

— " That toggle console is the actual innovation over the pasted blueprint it turns 4 fixed agents" into a registry where investigators pick only what a specific case needs, and the ' " - time estimate updates live. That s a genuinely strong pitch line: a fraud adjacent CSAM ' — tip-off doesn t need face correlation across 4TB it needs hash match and vision triage, and now it runs in 2 hours instead of 40." 

## Why this maps to how real investigations actually run 

' - — - This isn t a made up workflow it mirrors what Kerala Cyberdome adjacent units already do with tools like Griffeye Analyze DI (the industry standard for CSAM triage): the very first pass on seized media is always hash-match against known-content databases ' — (NCMEC, INTERPOL ICSE, India s own CAID Child Sexual Abuse Material Database run by NCRB), because it's instant and needs zero human viewing. Only unmatched " " - content goes to visual categorization. Your sprint preset literally reproduces that real world triage order — which is exactly the kind of detail that makes judges trust the design. 

## Integrate with existing tools, don't replace them 

— ' This is the other big shift the pasted content missed it assumed you re processing raw phone images from scratch. In reality, investigators already run Cellebrite UFED / Magnet AXIOM / XRY for extraction, and those tools output structured reports 

(XML/JSON/SQLite). ACPIA's ingestion agent should consume those reports as input, not reprocess raw device dumps — that's both more realistic and far less work to build: 

|Investigatorsalready use|Whatitgives you|WhatACPIA adds|
|---|---|---|
|Cellebrite/AXIOM/XRY|Structured extraction (chats,<br>calls, fles)|Cross-fle correlation, reasoning layer|
|Grifeye Analyze DI|Hashmatch+basic<br>categorization|Multi-agentfusionacross media+ text +<br>metadata|
|CAID/NCMEC/ICSE<br>hash lists|Known-content matching|Same lookup, wired into theshared graph|
|VAHAN/Sarathi<br>(MoRTH)|Vehicleregistration records|ANPR agentauto-queries via authorized<br>channel|
|Autopsy /Sleuth Kit|Disk imageparsing, fle carving|Feedsingestion tierfor unsupported<br>formats|
|ExifTool/Apache Tika|Metadata+document text<br>extraction|Wrapped ascallabletoolsby the<br>Metadata/OCR agents|



Pitching "we integrate with Griffeye and Cellebrite outputs" is far more credible to police judges than "we replace your forensic suite" — and it's genuinely less code for the weekend. 

## File type coverage ("all types in the world") 

Practically, everything reduces to five extractor families, each wrapping a proven library: 

- 

- Documents PDF, DOCX, PPTX, XLSX, TXT, RTF → Apache Tika / PyMuPDF / - 

- python pptx / openpyxl 

- Images — JPG, PNG, HEIC, RAW/CR2/NEF, BMP, WEBP → Pillow + ExifTool + OCR (Tesseract) 

- 

- Video/audio MP4, MOV, MKV, AVI, 3GP, raw CCTV (H.264/DAV), WAV, calls/voice notes → ffmpeg for keyframes/transcoding, Whisper for transcripts 

- 

- Communications WhatsApp (crypt12/14 decrypt), Telegram, Signal, Discord, SMS/MMS, email (PST/MBOX) → format-specific parsers already exist in Cellebrite/AXIOM exports, or open-source decrypters 

- 

- Archives & containers ZIP/RAR/7Z (recursive unpack), disk images (E01/DD), encrypted containers flagged for separate legal process 

- New format shows up mid hackathon? You add one extractor function that outputs the same "extraction unit" shape — nothing else in the system changes. That's your scalability 

answer for the judges' Q&A if they push on "what about format X." 

Want me to turn this into the actual repo skeleton next (folder structure, agent manifest JSON schema, and a working Python stub for the orchestrator's dependency resolver), so you have real code for the "working codebase" deliverable? 

but innitally i dont have teh access to the ht existing tools just i want their featues now generate a full plan about teh idea 

### - Architected open source forensic tool alternatives for hackathon project 

Since you won't have Cellebrite/Griffeye/VAHAN access for the hackathon, the right move - — is to build open source equivalents of the same capabilities same architecture, swappable backends, so it plugs straight into the real tools later without a redesign. Let me put together the full plan as a document you can use for your team and submission. 

Created a file, read a file 

— ' The core move is in section 2 of that doc every proprietary tool you don t have access to (Cellebrite, Griffeye, VAHAN, PhotoDNA) has a free, local, open-source substitute with the same interface, so your architecture stays real and swap-in-ready rather than a fake mockup pretending those integrations exist. 

A couple of things worth deciding next: 

- Do you want me to build the actual orchestrator skeleton (Python, dependency 

- resolver, agent registry JSON) so you have real code to run before the weekend? 

- Or would generating the synthetic test dataset (mock chat logs, dummy EXIF-tagged images, sample plate images) be more useful first, since every agent needs something to run against? 



Acpia full project plan 

Document · MD 

Download 

THIS FEELS VERY SIMPLE BUT IN REAL ECOSYSTEM THIS IS IMPOSSIBLE CAN THIS SYSTEM SCAN THOUSAND OF IMAGES FILES AND EVERYTHING AUDIO VIDEO  EMBEDDED IMAGES IN PDF 

AND LIKE EACH SCAN IS AROUND 40 HR OR 50 HRS BUT THE THING IS LETS SUPPOSE SOME ISSUE HAPPENED TEH SCAN GETS CANCELLED THIS WILL RESULTS IN SCAN RESTART 

AAND ALSO LIVE THING TO BE UPDATE AFTER EVERY SCANEVRY 1 MIN UPDATE AND LIVE QUESTION TO THE HUMAN\ 

- Architected distributed fault tolerant system with checkpointing and live progress tracking 

' — You re right to push on this this is exactly where hackathon demos fall apart in front of technical judges. "It works on 10 sample files" and "it survives a 50-hour run on a real case" are completely different engineering problems. Let me address each one directly, because all four are solvable with a specific, well-known pattern (this is standard practice in — ' production ETL/data pipelines not something you re inventing from scratch). 

# The core fix: stop thinking "one big scan," start thinking "millions of tiny, resumable tasks" 

The mistake that causes "restart from zero" is treating a case as one job. The fix is treating it as one task per file (and per embedded object inside a file), each with its own durable status — ' in a database not in memory, not in a script s local state. 

That's the mechanism: nothing lives only in memory. Every file's status is a row in a durable database, so a crash never loses more than the file that was mid-processing when it died. 

## 1. Scale to thousands of files, all formats, including nested content 

The trick is recursion, not special-casing. When the ingestion agent hits a PDF or PPTX, it ' — doesn t just extract text it walks the file, and any embedded image, video, or attachment - - it finds becomes a new row in the job table, same as a top level file. So a single 200 page - PDF with 40 embedded photos produces 41 job table entries, each independently scannable, checkpointable, and re-triable. A "thousand images" case and a "40 PDFs with embedded images" case look identical to the system — everything flattens to the same queue of atomic units. 

For throughput, this is a standard worker pool pattern: a task queue (Celery + Redis, or Ray for heavier parallelism) with N workers pulling from queued , each processing one file at a time, running across as many machines/cores as Cyberdome can allocate. More workers = proportionally faster, and this is exactly how commercial forensic tools (Griffeye, AXIOM) already handle bulk media — nothing exotic here. 

## — 2. Crash recovery no restart from zero 

This is the row directly in the diagram: every file has a status <mark>(</mark> queued → processing → - done <mark>,</mark> or failed ), and workers send a heartbeat while processing. If a worker dies mid file (crash, power loss, OOM), no heartbeat arrives for ~90 seconds, the orchestrator marks that one file failed , and requeues only that file. On a full system restart, the orchestrator's first " " — ' action is always: query the job table for everything not marked done that s the entire resume logic. A 50-hour scan that dies at hour 40 loses at most the handful of files midflight, not the 40 hours of completed work. This is the same pattern Airflow, Spark, and every serious ETL pipeline uses — it's a well-trodden problem, not something you're inventing under time pressure. 

One extra thing worth having: checkpoint the job table itself to disk (SQLite/Postgres, not - in memory) so even if the orchestrator process dies, not just a worker, the state survives. 

## 3. Live progress, updated every minute 

Each worker writes its completion count to a shared counter (Redis) as it finishes files. A lightweight dashboard process polls that counter every 60 seconds and pushes it to the ' - — investigator s screen via WebSocket or server sent events no need for anything fancier. Show: files done / total, current phase per agent, estimated time remaining based on rolling throughput. This is cheap to build and is exactly the kind of "boring but essential" detail that convinces judges you've thought past the demo. 

## — 4. Live questions to the human without blocking the scan 

This is the important design point: the review queue must be asynchronous, not a blocking prompt. If agent processing had to pause and wait for a human answer before continuing, one unanswered question would stall the entire 4TB scan. Instead: 

- Whenever an agent hits a low-confidence decision (e.g. a borderline face match), it writes a "question" record to a separate review queue and immediately moves on to the next file — nothing waits on it. 

- The investigator's dashboard shows incoming questions live as they arrive, and they can answer whenever convenient — the scan keeps running in parallel the whole time. When the investigator answers, that specific graph node gets updated ( status: — ' " " 

- investigator_approved or rejected ) it doesn t need to catch up the rest of the pipeline, because nothing else was waiting on it. 

This also directly strengthens your ethics/XAI pitch: human oversight becomes continuous - throughout a 50 hour scan, not a single batch review tacked onto the end. 

Want me to add a section to the plan doc covering this durability layer (job table schema, heartbeat/requeue logic, async question queue), so it's captured for your submission? 

HOW HERE TEH AGENTIC AI IS IMPLEMENTED HERE 

### Dissected agentic versus deterministic layers, mapped ReAct loop implementation 

Fair challenge — a lot of what we've built out so far (job queues, hashing, checkpointing) is - ' genuinely just solid distributed systems engineering, not AI at all. It s worth being precise about where the "agentic" part actually lives, because conflating the two will hurt you in front of technical judges. 

# The split: deterministic tools vs. the agentic reasoning loop 

Face embedding, OCR, hash-matching, ANPR — these are deterministic function calls. Feed in an image, get a vector or a string out. No reasoning, no decisions, same input always 

gives the same output. That's the "hands." 

## Agentic AI is specifically the loop that decides which hand to use, in what order, and 

— why and changes its plan based on what it finds along the way. That loop is called ReAct (Reason → Act → Observe → repeat), and it's the one piece of this whole system that's actually an LLM making decisions rather than a fixed pipeline running in sequence. " " — That loop is the entire agentic claim of the system everything else is plumbing that loop calls into. 

## Concretely, in the "Viper" example from your other document 

A fixed pipeline would hardcode: step 1 extract chats, step 2 extract metadata, step 3 correlate. That's not agentic — that's a script. 

— The agentic version looks like this instead the LLM decides each step based on what the previous step returned, not a pre-written sequence: 

- " 

- Turn 1 Reason: Goal is to find Viper's physical locations. I don't know what Viper has said yet. First step: pull chat history for that alias." Act: call nlp_extract_messages(alias="Viper") 

- 

- Turn 2 Observe: 340 messages returned, one mentions "meetup" with a date. Reason: "A meetup implies a location. I should check if any media file sent around that date has GPS data." 

   - Act: call metadata_agent(time_window=msg_timestamp ± 2hrs) 

- 

- Turn 3 Observe: one image found with EXIF GPS coordinates in Ernakulam. Reason: "I have a plausible link — but face and hash agents haven't run on this image yet. Low confidence to report as-is." 

   - Act: call vision_triage(image_id) to check what's actually in the photo 

- 

- Turn 4 Observe: no known-content match, benign risk tier. 

   - Reason: "Confidence is now moderate, not high. This is exactly the kind of link that needs a human, not an auto-report." 

   - Act: write finding to review queue, don't auto-confirm 

" " — No line of code told it after chats, check metadata the model decided that on its own from the goal and what it had learned so far. If turn 2 had come back empty, it would have reasoned differently (e.g. "no timestamp match, try searching for location names 

mentioned as text instead") — that adaptive branching is what a fixed pipeline can't do. 

## Where this shows up in your actual codebase 

- Orchestrator/Supervisor agent — this is where the ReAct loop lives. Built with LangGraph: an LLM node that emits a tool call, a tool-execution node, a router that feeds the result back to the LLM, looping until it decides to stop. 

- 

- NLP/Correlation agent also has a small reasoning step: given two candidate entities with partial evidence (shared phone number, similar alias spelling), the LLM judges "same person or coincidence?" — that's a judgment call, not a lookup. 

- — 

- Reporting agent synthesizes a narrative from structured graph data this is generation, arguably the weakest claim to "agentic" since it doesn't loop or decide, but it's still LLM reasoning over retrieved facts, not a template fill. 

— Everything else hashing, OCR, face embeddings, ANPR, the job queue, checkpointing — ' is not agentic AI at all. It s infrastructure and classical ML that the agent calls as tools. ' - " " Don t claim otherwise to the judges; claiming a hash lookup is AI reasoning is exactly the kind of overclaim that a sharp judge will puncture in Q&A. Your honest, strong claim is: "one LLM-driven planning loop sits on top of five to eight deterministic tools, decides which to invoke and in what order based on evolving evidence, and knows when to stop and ask a human." That's a real, defensible agentic system — smaller than it might sound, but architecturally correct, which is what will actually hold up under questioning. 

UPDATE EVERTHING WHOLE IDEA AND AND MAKE EVERYTHING NOVEL AND ALSO RFEASIBLE SYSTEM AND GENERATE THE WHOLE IDEA 

Synthesized architectural components into cohesive, novel system design 

— ' This is the right move let s consolidate everything into one definitive plan that captures every refinement (the agentic loop, the durability layer, the open-source substitutes, the toggle registry) as a single coherent, submission-ready document. 

Created a file, read a file 

' - This consolidates every piece we ve worked through into one submission ready document — the backbone architecture, the honest agentic/deterministic split, the durability engineering, the open-source substitutes, and the toggle registry, all with an explicit "what's novel" section up front so you and your team can lead with it on pitch day. 

A few things worth deciding next, since 48 hours won't fit everything: 

- If you had to cut scope, Section 6 (durability) and Section 4 (the honest agentic loop) 

- are the two that most differentiate you from other teams — I'd protect those over adding more agents. 

- Want me to write the actual orchestrator code (LangGraph skeleton with the 

- dependency resolver and job table) so you walk in with working code, not just the plan? 



Acpia master plan final Document · MD 

Download 

1. How Existing Tools are U sed (and Their Real-World Friction) Agencies world wide and in India do use a dvanced tools, but they ar e not magic wands. Tool… 

PASTED 

**I WANT THIS SYSTEM TO BE LIKE A BACKBONE IN WHICH MORE AGENT AI CAN BE IMPLEMETED AND CONNECTED** 

**ALSO THE THE THING IS WELL DESIGNED INFRA MOREFEATURES** 

**UPDATE** 

- **" - "** 

- **1. The Operation P Hunt Watermark Agent The Reality: The Kerala Police Cyberdome's Counter Child Sexual Exploitation -** 

- **(CCSE) Centre runs a massive, ongoing campaign called Operation P Hunt. To track suspects in closed messaging groups, investigators often use "Trojan " —** 

- **Horse tactics tracking the dissemination of digitally watermarked images to uncover the IP addresses of repeat offenders.** 

   - **How to Implement It:** 

- 

- **2. Create a Digital Watermark & IP Tracking Sub Agent.** 

**3. Instead of just scanning for illicit content, this agent actively reads hidden steganographic data or digital watermarks embedded in images found on a suspect's device.** 

**4. It then autonomously correlates those watermarks against known Operation -** 

**P Hunt IP address logs to map exactly who originally seeded the fle and who downloaded it.** 

- 

- **5. Automated Section 63 BSA Hash Value Generator** 

   - **The Reality: As of 2026, the old Section 65B of the Information Technology Act has been replaced by Section 63 of the Bharatiya Sakshya Adhiniyam (BSA). A massive legal shift just happened: Under the new Section 63, it is now a statutory mandate (not just a best practice) that the certifcate submitted to -** 

   - **the court contains the exact cryptographic hash value (e.g., SHA 256) of the digital evidence.** 

**How to Implement It:** 

**6. Build a Legal Compliance Agent.** 

**7. Whenever the Vision or NLP Agent fags a piece of evidence (like a chat log or -** 

**photo), the system automatically runs a SHA 256 hashing algorithm on the fle.** 

- 

- **8. The agent then automatically populates the mandatory Two Part Certifcate required under the BSA Section 63 Schedule, ensuring the Investigating -** 

- **Offcer has court ready paperwork instantly.** 

**9. Drone Telemetry & EXIF Correlation Agent** 

   - **The Reality: The Kerala Police Cyberdome operates a highly advanced Drone Forensic Lab & Research Centre. Drones are increasingly used by criminals for surveillance or smuggling, and they hold massive amounts of digital footprints. How to Implement It:** 

**10. Add a Flight Path & Telemetry Agent.** 

**11. If the system ingests data from a seized drone, this agent extracts the raw telemetry logs, GPS fight paths, and EXIF data from the drone's SD card.** 

- **'** 

- **12. It then cross references those fight coordinates with the suspect s mobile phone GPS history to prove the suspect was physically at the launch site, visually linking the drone to the offender on a map.** 

**13. "KidGlove" Preventative Intelligence Export** 

   - **The Reality: Cyberdome runs an initiative called KidGlove, which focuses on creating awareness among teachers and parents about online safety. Police don't just want to arrest offenders; they want to prevent grooming. How to Implement It:** 

**14. Implement an Anonymized Trend Exporter.** 

**15. When your NLP Agent analyzes chat logs to fnd predators, it also aggregates the tactics being used (e.g., what games predators are using to target kids, what specifc grooming scripts they use).** 

**16. The system strips all Personal Identifable Information (PII) and exports a "Grooming Trends Report" that can be handed directly to the KidGlove team for use in school awareness campaigns.** 

**1. Synthetic Content & "Nudify" Detection Agent The Reality: According to recent NCMEC data, there has been a massive - " "** 

**explosion in AI generated CSAM (Generative AI) and malicious nudify apps used for sextortion among peers. Investigators waste thousands of hours trying to determine if a horrifc image is a real child in danger or a deepfake. How to Implement It:** 

- 

- **2. Create a dedicated Synthetic Detection Sub Agent.** 

**3. Instead of just looking for illegal content, this agent uses local models -** 

**specifcally trained to detect diffusion model artifacts, unnatural pixel blending, and deepfake signatures.** 

**4. It tags evidence as REAL , SYNTHETIC , or UNDETERMINED , allowing investigators to prioritize cases where a real, physical child requires immediate rescue.** 

**5. The "Imminent Danger" Risk Scoring Engine** 

   - **The Reality: The NCMEC CyberTipline receives millions of reports a year from tech companies (ESPs). Cyber cells are overwhelmed. The biggest challenge is knowing which case to open frst.** 

**How to Implement It:** 

**6. Implement an Automated Threat Prioritization Matrix.** 

**7. As your agents scan chat logs and metadata, they assign a risk score. If the NLP Agent detects phrases indicating physical proximity (e.g., "I am waiting outside your school") or the Metadata Agent detects live GPS coordinates converging, the system triggers a P0 (Priority Zero) Imminent Danger Alert.** 

**8. This pushes the case to the very top of the investigator's dashboard, bypassing standard triage.** 

- 

- **9. Financial Intelligence & Crypto Wallet Tracing** 

   - **The Reality: Child exploitation is heavily monetized. Transnational criminal networks and sextortion rings operate using cryptocurrency. How to Implement It:** 

**10. Add a Financial Correlation Agent.** 

**11. When scanning a suspect's phone or cloud dump, this agent specifcally hunts -** 

**for Bitcoin/Monero wallet addresses, UPI IDs, or cash app handles hidden in chat logs or screenshots.** 

**12. It automatically maps these fnancial identifers into a network graph, allowing the Investigating Offcer (IO) to "follow the money" and arrest the ringleaders, -** 

**not just the low level offenders.** 

**13. Automated NCMEC / NCRB API Ingestion** 

   - **The Reality: Currently, a lot of police time is wasted manually downloading CyberTipline reports from the National Crime Records Bureau (NCRB) and** 

**uploading them into local forensic software. How to Implement It:** 

**14. Design your architecture to include an Automated Ingestion Pipeline.** 

**15. Show that your system can securely ingest structured JSON data directly from national reporting APIs.** 

**16. The moment a tech company fags an IP address in Kerala for uploading CSAM, your system automatically ingests the report, maps the IP to a local jurisdiction, and tasks the agents to begin the background OSINT (Open Source Intelligence) work before the IO even sits down at their desk.** 

**17. Automated "Charge Sheet" & Report Generation The Reality: Indian police offcers spend an enormous amount of time doing administrative paperwork. Writing the fnal Charge Sheet for a complex cybercrime case can take weeks.** 

   - **How to Implement It:** 

**18. Use the Supervisor Agent to act as a Report Compiler.** 

**19. Once the investigation is complete, the IO clicks "Generate Report." The LLM takes all the validated evidence (the fagged chats, the GPS map, the identifed aliases) and automatically drafts a chronological, legally formatted summary of the crime.** 

**20. You can explicitly pitch this as a tool that reduces administrative burden, allowing Kerala Police offcers to spend more time in the feld and less time typing in Microsoft Word.** 

Show more 

Architected modular agent framework integrating specialized forensic and legal compliance capabilities 

— - - This new material is exactly what turns this into a serious submission chain of custody realism, the Section 63 BSA update (correctly noting the July 2024 replacement of Section - 65B IEA), and nine concrete Cyberdome specific agents. Let me first show the backbone extensibility visually, then produce the complete updated master plan. ' " " — That s the structural proof of backbone the orchestrator and shared graph never change; every new capability, including everything below, plugs in as a peer. Now the full updated plan. 

Created a file, read a file 

Two things worth flagging about this version, since they're your strongest and riskiest points respectively: 

- Strongest new addition: Section 2's explicit "AI cannot testify, AI accelerates, humans certify" framing. That single sentence, said out loud to IPS officers, will do more for your credibility than any diagram — it shows you understand the actual legal bottleneck, not just the technical one. 

- Be careful in the roadmap: with 9 new agents on top of the original 8, you have more surface area than 48 hours can build. The roadmap in Section 10 already prioritizes the BSA certificate agent and risk scoring (high pitch value, low build cost) over drone 

- telemetry and NCMEC ingestion — say those two are "designed, not demoed" plainly 

on stage rather than faking them, since a judge who's seen real Cyberdome ops will spot a fake drone demo immediately. 

Want me to draft the actual Section 63 BSA certificate template (the two-part schedule structure) as a real document you could show in the demo, or start on the orchestrator code next? 





<!-- Start of picture text -->
Downloadownloadloadoadad<br><!-- End of picture text -->

Acpia master plan v3 Downloadownloadloadoadad Document · MD 



<!-- Start of picture text -->
is this project good<br><!-- End of picture text -->

### Identified strengths and credibility gaps requiring verification 

Overall: yes, this is genuinely strong — probably stronger than what most teams will bring to this hackathon. But there are a few things in here that could hurt you if a sharp judge (especially a technical one or a legal one) picks at them. Let me be direct about both sides. 

# What's excellent 

- POCSO auto-redaction and Section 57 primary evidence mapping are the two best new additions — they weren't in earlier drafts and they show real legal sophistication. - 

- Auto blurring victim faces before any human review is exactly the kind of detail that will land with senior IPS officers, because it's a real, serious legal obligation they deal with, not a generic "ethics" gesture. 

- — 

- The swap in substitution table is clean and specific this is your strongest architecture defense and it's presented well here. 

- The ReAct trace example is concrete and honest about confidence levels ("moderate — correlation based on temporal alignment") rather than overselling certainty. 

- " " — 

- The pointer dog, not certifier framing is a sharp, memorable line for judges keep that exact phrasing in the pitch. 

# What I'd flag before you present this to actual IPS officers 

- - 1. The hardware section is a real risk, not just a nice to have. Specifying a 70B model on an RTX 6000 Ada / Blackwell GPU sounds impressive, but for a 48-hour weekend hackathon you almost certainly won't have that hardware, and a technical judge will ask 

"what are you actually running the demo on right now?" A more defensible answer: an 8B- class local model (Llama 3 8B, Qwen 7B) handles a ReAct tool calling loop fine on a laptop GPU, and that's what you should say you're demoing on — with the 70B spec reframed explicitly as "production deployment target," not "what we built this weekend." As written, it invites a question you can't answer well live. 

2. Two numbers need a source or need to go. The "Rs 2254 Cr" NFIES figure and the "95% triage reduction" stat on the executive summary page — I don't have a way to verify either of these, and I'd treat both as unverified claims rather than facts, especially the named scheme ("National Forensic Infrastructure Enhancement Scheme"). Presenting an - invented sounding government figure to actual police officials is a genuine credibility risk if even one of them knows the real scheme names and funding — it can make the whole pitch look less trustworthy by association, even where the rest is solid. I'd either verify - these with a real citation or drop them and use your own honestly labeled estimate ("we project ~90% reduction in manual triage time based on the CSAM ID Sprint profile alone"). 

3. The VRAM matrix has an internal inconsistency. It lists FP8 baseline as "~80GB – 355GB" — that range doesn't hold together (FP8 of a 70B model should land around 7080GB, not up to 355GB) and a technical judge who knows quantization will catch this in - ' about five seconds. Worth fixing or simplifying to just the 4 bit number you re actually proposing to run. 

" " - 4. RAG system is used loosely. The Section 57 description calls the path/cache timeline tracer a "RAG system" — RAG technically means retrieval-augmented generation for LLM context, and what's described is graph traversal, not that. Minor, but precise terminology matters more in front of technical judges than in a first draft. 

5. Scope is now very large for 48 hours. 14 agents, dual-part certificates, POCSO redaction, hardware specs, drone telemetry — the roadmap already correctly marks two items "designed, not built," but even the remaining 12 agents plus orchestrator, durability layer, and dashboard is an aggressive build for a weekend team. This is a "nice problem to have" (you have too many good ideas), but I'd go in with a clear internal ranking of what gets cut — first if Saturday runs long my instinct: keep the backbone, BSA certificate agent, and POCSO redaction non-negotiable; treat financial tracing and watermark/IP tracing as the first things to demote to "designed, not built" if time runs short, since they're compelling but less central to the core pitch than legal compliance and crash resilience. 

- - Bottom line: the architecture and legal grounding are genuinely pitch ready. The main pre flight check is stripping out or sourcing the two unverified numbers and reframing the hardware section as a production target rather than a weekend claim — those are the two places a skeptical judge could do real damage, and both are easy fixes. 

Want me to produce a trimmed version with those fixes applied, so you have a version that's safe to hand out as-is? 

ok proof of concept 

Architected worker loop with task claiming and heartbeat monitoring 

Now the synthetic test data generator (real OCR-readable images, a real PDF with embedded images, mock metadata, and a duplicate to trigger hash-match): 

Generate fully synthetic, safe test evidence: OCR-readable images, duplicate for hash match, near-dupli… 

Now the demo script that ties it together — seeds the job table, runs a worker, intentionally - kills it mid scan, and shows resume: 

Validated system recovery and verified all processing components functioned flawlessly 

' - This is exactly the demo you need: a worker gets SIGKILL d mid scan (48/54 tasks done, 1 stuck "processing," 5 still queued), the restarted worker's very first log line is reclaimed 1 stale task(s) from a previous crash -> requeued <mark>,</mark> and it finishes cleanly to 54/54 — - ' done without ever touching the 48 already completed tasks. That s a real, working proof of the "restart at hour 40, not from zero" claim, not a diagram. 

Let me also confirm the CSAM ID Sprint preset actually runs faster (the toggle-console claim) with real numbers, then package everything up. 

### Ran a command 

— Confirmed with real timing on real files the sprint profile does fewer, cheaper tasks and - - finishes faster (this is proportionally the same story as the 2hr vs 40hr claim, just at PoC scale). Now let me package this up with a README explaining exactly what's real vs. placeholder, and copy it to outputs. 

Ran 2 commands, created a file, read a file 

— This is real, runnable code I ran it end to end, not just wrote it. What it actually proved on this run: 

- Crash recovery: killed a worker with SIGKILL at 48/54 tasks done, restarted a fresh process, saw reclaimed 1 stale task(s) from a previous crash -> requeued , — - 

- finished cleanly at 54/54 the 48 completed tasks were never re touched. 

- Dependency-aware registry actually enforced: face_correlation waits for 

- metadata per-file, verified by the job table, not just claimed in a diagram. 

- - 

- Real detections: SHA 256 correctly caught the byte identical duplicate file against the mock hash list; the face-correlation dHash correctly linked person_photo_A ↔ 

- person_photo_B (same synthetic identity, tiny pixel change) at hamming distance 0, 

- and correctly rejected the unrelated pattern. 

- Recursive decomposition: a real PDF built with ReportLab, unpacked with pypdf into 2 embedded images, each became its own job-table row and got processed independently. 

Measured speed difference: csam_id_sprint (18 tasks) finished in 2.18s vs. 

— full_investigation (54 tasks) in 3.62s on identical files same proportional story as - - the 2hr vs 40hr claim. 

The README is explicit about what's a labeled placeholder (face embeddings use a perceptual hash standing in for ArcFace, metadata reads a sidecar JSON standing in for a Cellebrite export) and exactly what line to change to swap in the real thing — this is the part to walk judges through if they ask "is this actually working or just a slide." 

One gap worth naming honestly: this doesn't include the ReAct LLM loop itself (no Ollama here) — the orchestrator uses a fixed dependency-order resolver instead. The README's - swap in table says exactly where an LLM call would replace that fixed order. If you want, I can wire in a real local-LLM ReAct loop next (would need Ollama installed, which isn't in — this sandbox) or help you get this running on your own machine with GPU access instead. 





<!-- Start of picture text -->
Downloadownloadloadoadad<br><!-- End of picture text -->

Acpia poc Downloadownloadloadoadad ZIP 

no i want to know what is poc and also generate a full pdf with entire project etails 

- - Architected HTML to PDF conversion strategy with professional styling 

— First quick answer, then the PDF. 

— ' A Proof of Concept (PoC) is not a finished product it s the smallest working version that proves the hard, risky parts of an idea actually work, before you invest in building the whole thing. For ACPIA specifically, the PoC I built doesn't have a UI, doesn't run all 14 agents, and doesn't use production forensic tools — but it proves the parts that are easy to claim and hard to actually do: that a crashed worker mid-scan can resume without restarting, that a dependency-aware registry actually enforces ordering, that toggling agents measurably changes runtime. If those core mechanics didn't work, no amount of — polish on the other 90% would matter so a good PoC deliberately proves the riskiest 10% first, in real code, rather than demoing the easy 90%. 

Now let me build the full project PDF. 

Ran a command 

I'll build this as a styled HTML document (so it can carry real headers/footers/tables like the reference doc you uploaded) and render it to PDF. 

Investigated PDF generation limitations and explored alternative solutions 

Let's visually check the rendering before finalizing. 

Ran a command, viewed a file 

Cover page looks clean. Let's check a content page with tables and code blocks. 

Check content page rendering with tables 

This renders cleanly. Let's check the verified PoC results page and the tables page too. 

Check PoC results page rendering 

Formatting is clean and professional throughout. Since footer page numbers weren't supported by this wkhtmltopdf build, let me add them via a quick pypdf overlay so the document has proper page numbering like the reference doc you uploaded. 

Ran 2 commands, viewed a file 

Footer with page numbers is now in place. Let's finalize and deliver. 

Ran a command, read a file 

- An 11 page, formatted PDF covering everything: legal grounding (chain of custody, Section 63/57 BSA, POCSO redaction), full architecture and ReAct trace, the complete 14-agent registry across 6 tiers, the scale/checkpointing design, the open-source substitution table, - — — the 48 hour roadmap, and critically Section 8, which reports the actual verified PoC results (real crash-recovery log output, real hash matches, real OCR, measured timing) rather than projected claims. 

One thing worth being upfront about if you hand this to judges: Section 8 is honestly - – — labeled as PoC verified while Sections 1 7 are the design specification that distinction is intentional and worth keeping when you present it, since blurring "what we built" with "what we're proposing" is exactly the kind of thing that erodes credibility with technical reviewers. 



Acpia full project report Document · PDF 

Download 

KERALA POLICE CYBER DOME HACKP 2026 AGE NTIC CHILD PROTECTIO N INVESTIGATION ASSIST ANT (ACPIA) Transformin g digital evidence into a… PASTED 



<!-- Start of picture text -->
PASTED<br><!-- End of picture text -->

is all the requiremntds full filles as a backnone win which more agentds can be connected 

Audited deliverables against criteria, identified UI gaps 

' — Let s go through this against the actual hackathon requirements line by line being honest about what's proven vs. what's still just described. 

# Against the three "what to build" asks 

|Requirement|Status|Evidence|
|---|---|---|
|Proofof Concept —core|✅|run_demo.py — real crash/resume, real SHA-256 matches,|
|logicworks on sample data|Done|real OCR, real dHash correlation,allverifedon synthetic data|
|Architectural Design —|✅|Full PDF: orchestrator/graph diagram,dependency registry, 14-|
|blueprint of howagents talk<br>toeachother|Done|agent tier tables,datamodelschema|
|Simulated Workfow —UI|⚠|The<br>run_demo.py terminaloutput isarealterminal|
|wireframeor terminaloutput|Partial|sequence,andthetoggle-consolewidget was showninchat —|
|showing investigator||but neitherhasbeendelivered asastandalone artifact youcan|
|interaction||putinfront of judgesindependent ofthisconversation|



# Against the three deliverables 

|Deliverable|Status|Gap,if any|
|---|---|---|
|Working|✅Done|Has real logic,but no<br>requirements.txt , no repo-level README|
|codebase||badge/structurepolish— fve-minutefx|
|Agent|✅Done|Strong—dependency-declared classes, tier tables, swap-in mechanism|
|blueprints||table|
|Interactive|⚠Weakest|Youhave aterminal demo (counts)and a chat-rendered dashboard|
|prototype|point|mockup (doesn'tcount —it's notafleyoucanhandover or run<br>standalone)|



# On the specific question — is the backbone/pluggability claim actually proven? 

— ' Yes, for the mechanism itself this is your strongest verified claim. The PoC didn t just diagram pluggability, it exercised it: adding a new agent means writing one class with an id , a requires list, and a run() method, and nothing in orchestrator.py or db.py changes. The dependency-enforcement test ( face_correlation waiting on metadata per-file) is real, observed behavior, not an assertion. 

But be precise about scope when you say this to judges: the backbone is proven for the - tool calling pattern with the 6 agents actually implemented. The other 8 agents in your registry (financial tracing, watermark/IP tracing, drone telemetry, risk scoring, etc.) are designed, not implemented — their tables exist, but no code has run 

FinancialTracingAgent.run() the way it has for HashMatchAgent . That's an honest and fine thing to say ("the pattern is proven; here are 8 more agents that plug into the identical pattern") — it becomes a problem only if you imply all 14 were built and tested. 

# What I'd close before pitch day, in priority order 

- 

- 1. Build a real, standalone interactive prototype even a simple Flask page or a static HTML mockup of the toggle console + live dashboard you can screen-share and click through, independent of this chat. This is currently your single weakest deliverable relative to what's asked. 

- — 

- 2. Add a requirements.txt and a one command run script to the PoC repo trivial, but "clean repository" is explicitly named in the deliverables. 

3. Optionally implement one more Tier D agent for real (Financial Tracing is probably the fastest — regex entity extraction, no ML model needed) so you can honestly say "the pattern is proven twice, not once." 

Want me to build the standalone interactive dashboard prototype next — that's the one actual gap against the stated requirements? 

is 3 not in the pdf 

Disambiguated reference ambiguity regarding PDF content inclusion 

Correct — you're right to flag it. Item 3, the "Simulated Workflow" (a UI wireframe or terminal sequence showing how the investigator actually interacts with the system), is not in the PDF as its own section. What's there instead: 

- The words "investigator console" appear only inside the architecture diagram (line 135) as a box label, not as an actual walkthrough. 

- "Dashboard" is mentioned only in the agent table and the roadmap — never shown. Section 8's terminal output (crash recovery logs) is real, but it's framed as engineering verification, not as "here is what an investigator sees and clicks through." 

So the PDF fully covers requirement 1 (architecture/blueprint) and reports on requirement — ' 2 (PoC/working logic), but it genuinely skips requirement 3 there s no dedicated section - - - putting a human investigator in the loop and showing their screen by screen or command by-command experience. That's the same gap I flagged earlier as your weakest deliverable, and it's confirmed absent here, not just underweighted. 

Want me to add a "Simulated Investigator Workflow" section to the PDF — a step-by-step narrated sequence (either dashboard screens or a CLI session) showing an investigator opening a case, picking a profile, watching an alert fire, and approving a finding — so all three requirements are actually represented in the document? 

1. Optionally implement one more Tier D agent for real (Financial Tracing is — 

probably the fastest regex entity extraction, no ML model needed) so you can honestly say "the pattern is proven twice, not once." 

add this to pdf and update the pdf with everything and change the name 

Architected financial tracing agent with regex patterns and verified implementation approach 

- Architected financial tracing agent with regex patterns and verified implementation approach. 

<sup>Edited __init__.py</sup> +35 -1 

- <sup>Done</sup> 

