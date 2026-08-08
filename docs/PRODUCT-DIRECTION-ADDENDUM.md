# MARGDARSHI Product Direction Addendum

## Status and scope

- Status: **Confirmed product direction**
- Source: Executive Engineer instructions received after completion of R6.0-A
- Classification: Product direction and future-workstream planning only
- Implementation status: Not started
- Release number: Not assigned
- Implementation date: Not assigned

This addendum records confirmed product direction without changing the completed [R6.0 Rahul Decision Checklist](R6.0-RAHUL-DECISION-CHECKLIST.md). It does not authorize or implement application code, database schema, Supabase, RLS, Storage, Auth, RPC, configuration, asset, or production-data changes.

The capabilities below are **post-R6.0 functional capabilities unless an implementation dependency is later approved**. R6.0 remains the prerequisite authorization and security foundation. Any dependency proposed for implementation during R6.0 must be separately identified, justified, approved, and reviewed; this addendum does not grant that approval.

## Assistance-first product principle

MARGDARSHI shall be an assistance-first platform intended to reduce existing administrative and engineering workload. It shall not create unnecessary additional reporting work, duplicate data entry, or rigid target pressure.

The product should help officers understand work, find records, prepare outputs, remember pending matters, and make informed decisions. Automation and reminders should remain proportionate to official responsibilities and should not turn routine use into aggressive target enforcement.

## Action module direction

The Action module shall remain the system for responsibility, pending matters, reminders, workflows, follow-up, and accountability. Its routine user experience shall emphasize awareness, prioritisation, assistance, and clear next steps rather than punitive or aggressive target language.

This direction does not remove due dates, workflow stages, verification, history, or accountability. It governs how those functions should assist officers in ordinary use.

## Project Digital Knowledge Base

Each project shall progressively become a complete authorised digital knowledge base. Subject to the R6.0 access model, the project record should bring together:

- project master data;
- agreements and contract records;
- tender documents;
- estimates;
- drawings;
- approvals and sanctions;
- correspondence;
- inspections and photographs;
- actions and workflow history;
- reports;
- legal and court-case relationships;
- applicable standards and references; and
- other authorised project records.

Content must retain its document type, project or office relationship, source, version, language, date, status, confidentiality classification, and other provenance required for reliable retrieval and audit.

## Standards & References knowledge module

A future **Standards & References** module shall provide an authorised knowledge collection for:

- Government Resolutions (GRs);
- departmental and government circulars;
- MoRTH, NHAI, IRC, PWD, and other approved guidelines;
- specifications, manuals, codes, and standard procedures; and
- other authorised reference documents.

The module should support Marathi, English, and other approved languages. Every item must retain its issuing authority, title, reference number, publication or effective date, version or amendment status, language, source location, and supersession relationship where available. Superseded material must remain distinguishable from material currently in force.

## AI Drafting Workspace

A future **AI Drafting Workspace** may, where authorised and available, study the following sources to prepare drafts from brief officer instructions:

- project master data;
- agreements;
- tender documents;
- estimates;
- drawings where their format and content are supported and usable;
- previous correspondence;
- standards and specifications;
- Government Resolutions (GRs) and circulars;
- relevant court-case information;
- inspections and reports; and
- other permitted project records.

Expected outputs may include official letters, notes, notices, replies, and other approved departmental formats. The workspace shall not imply that every drawing, document, scan, language, or file format can always be interpreted completely or accurately; unsupported or unusable content must be identified for officer review.

The workspace shall:

- use only information the active Officer context is authorised to access;
- distinguish officer instructions, retrieved facts, inferred wording, and missing information;
- preserve the sources used for each draft;
- allow the officer to review, correct, and complete the draft;
- avoid presenting an AI draft as an issued or approved departmental record; and
- require the existing competent officer workflow for review, approval, signature, dispatch, or issue.

AI shall prepare drafts but shall not automatically issue, sign, approve, or dispatch official correspondence.

## AI research modes

### Internal Research

**Internal Research** shall use only authorised MARGDARSHI sources available to the active Officer context. These may include project records, correspondence, agreements, inspections, reports, standards, court-case records, and other permitted internal documents.

### Deep Research

**Deep Research** may additionally use authoritative external or public sources. For official government work, it should prefer authoritative and official sources where available, including official Government, MoRTH, NHAI, Maharashtra PWD, court, statutory-body, and other competent-authority sources.

External retrieval must provide source traceability, distinguish external information from internal records, and identify the authority, document, URL or retrieval location, and retrieval date where available. External or public information must retain its provenance and must not automatically become verified departmental fact merely because an AI system discovered it.

Neither research mode may use content outside the user's effective authorization scope. External research must not expose internal query terms, confidential material, personal information, or protected documents to an external service unless a separately approved technical and legal design permits that specific transmission.

## Source provenance and human authority

AI-assisted research and drafting shall preserve source provenance. For an official draft, the officer should be able to see which internal documents and external sources were relied upon, which statements remain unsupported, and which required facts are missing or conflicting.

Generated content shall remain clearly labelled as a draft until an authorised officer completes the applicable review and approval process. AI output shall not become official merely because it was generated from official data.

## Office templates and departmental rendering

A future approved office-template system shall support Marathi and English letterheads and other authorised departmental formats. Templates should preserve approved office identity, headings, reference fields, date and subject placement, addressee structure, signature blocks, enclosures, copy lists, pagination, and print layout.

AI drafts may later be rendered into ready-to-review or ready-to-print departmental documents using an approved template. Rendering shall not bypass officer review, approval, signature, or dispatch controls. Template creation, approval, versioning, activation, and retirement must be auditable.

## Legal & Court Cases module

A future **Legal & Court Cases** module shall support authorised management of:

- case number, court, bench, jurisdiction, and case type;
- parties and their roles;
- related office, project, package, contract, correspondence, and action records;
- advocates and authorised contacts;
- petitions, affidavits, replies, filings, evidence, and other case documents;
- interim and final orders;
- current status;
- next-hearing information;
- responsibilities, reminders, and linked actions; and
- source and confirmation history.

Authorised officers may manually:

- create or enter a case;
- update case details;
- enter or change hearing dates;
- verify system-discovered information;
- confirm court status;
- correct incorrect or stale information; and
- attach or record supporting orders and documents.

Where technically and legally feasible, the module may support authorised retrieval from official Supreme Court, High Court, and other court sources. System-discovered information must remain visibly distinguishable from officer-confirmed information. The system shall record the retrieval source and time and shall not silently overwrite an officer-confirmed value.

The module must preserve a clear distinction between system-discovered information, manually entered information, and officer-confirmed information. Manual entry alone does not make information officer-confirmed unless the approved confirmation workflow records that status.

Confirmed hearing dates may feed the Calendar. A system-discovered hearing date may be shown as requiring verification but must not be treated as final confirmed departmental data until the approved workflow confirms it.

## AI Format Filler

A future **AI Format Filler** may assist with blank Excel, Word, and supported PDF formats received from higher offices. It should:

1. study the supplied blank format and identify requested fields, tables, calculations, instructions, and output constraints;
2. map requested fields to authorised MARGDARSHI data and identify the source used;
3. identify missing, ambiguous, conflicting, or unavailable information;
4. obtain user input or confirmation where necessary;
5. preserve formulas, layout, language, and required file type wherever technically possible; and
6. return the completed file for officer review in the required format wherever technically possible.

The AI must never fabricate an unavailable value. Missing information must remain blank, explicitly marked, or referred to the officer according to the approved format workflow.

## Ask MARGDARSHI

A future cross-module **Ask MARGDARSHI** capability shall allow authorised officers to query permitted information conversationally, including:

- pending matters and reminders;
- project history and current position;
- correspondence;
- standards and references;
- actions and workflow history;
- inspections and reports;
- legal and court cases; and
- other authorised information.

Answers should identify supporting records and distinguish confirmed facts, derived summaries, missing information, and external research. Conversational convenience must not weaken direct-record permissions, confidentiality, audit, or source traceability.

## Authorization and confidentiality boundary

All AI retrieval, research, drafting, file completion, court retrieval, and conversational answers must enforce the same Officer-context, project, office, explicit-grant, external-user, document, attachment, and confidentiality permissions established through R6.0.

The active Officer context and approved explicit grants shall determine operational access. Platform Administrator context must not become an AI bypass to project records, correspondence, actions, inspections, reports, court cases, attachments, standards restricted to particular users, or other operational information.

Authorization must be enforced at the data-retrieval boundary as well as in the interface. An AI component must not retrieve unauthorised content and then attempt to hide it after generation. Citations, previews, generated files, exports, caches, embeddings, indexes, logs, and conversation history must follow the same authorization and retention boundaries as their source records.

## Future workstream structure

The following structure is proposed for future planning. It does not assign a final public release number or implementation date.

1. **R6.0 authorization and security foundation** — complete and verify Officer contexts, project and office scope, explicit grants, external-user boundaries, typed-parent attachment access, audit, RLS, and security prerequisites before dependent capabilities are activated.
2. **Project Digital Knowledge Base** — define the project record taxonomy, document classes, metadata, provenance, versioning, multilingual content, ingestion, retrieval, and completeness approach.
3. **Standards & References** — establish authorised source acquisition, classification, version and amendment management, language handling, search, citation, and supersession controls.
4. **Office Templates and Drafting** — govern Marathi and English templates, source-grounded drafting, officer review, document rendering, and issue/dispatch boundaries.
5. **Research and Ask MARGDARSHI** — introduce Internal Research first, then separately governed Deep Research and cross-module conversational retrieval with citations and permission-aware indexing.
6. **Legal & Court Cases** — define case records, project and office relationships, official-source retrieval, officer confirmation, document handling, actions, reminders, and Calendar integration.
7. **AI Format Filler** — support approved Excel, Word, and PDF workflows with source mapping, missing-data handling, user confirmation, layout preservation, and output verification.
8. **Cross-cutting AI governance and assurance** — define model/provider approval, data-transmission boundaries, confidentiality, provenance, evaluation, human approval, prompt-injection resistance, audit, retention, incident response, cost controls, and fallback behavior.

Each workstream requires separate acceptance criteria, architecture and security review, test coverage, manual functional validation, rollout approval, and rollback planning before implementation or production activation.

## Product-direction boundaries

- R6.0 remains the prerequisite authorization and security foundation.
- These capabilities are post-R6.0 unless a specific implementation dependency is later approved through a separate decision and review.
- No final public release number is assigned by this addendum.
- No target implementation or production date is assigned by this addendum.
- No AI provider, external research service, court integration, file-processing library, hosting model, or storage design is approved by this addendum.
- Existing approved Rahul decisions remain unchanged.
- This addendum does not start R6.0-B or any implementation workstream.
