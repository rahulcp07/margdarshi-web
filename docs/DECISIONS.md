# MARGDARSHI Decision Log

This log records decisions observable in the current code or merged pull requests. It does not infer rationale that is absent from the repository.

## D-001 — Preserve R5.9 behavior while modularizing the application

- Status: Implemented and merged in pull request [#8](https://github.com/rahulcp07/margdarshi-web/pull/8)
- Evidence: the R5.9 repository baseline contains `index.html` as the application source.
- Baseline: R5.9 delivers HTML, CSS, and JavaScript together in one file.
- Decision: the single-file structure is not a permanent architecture constraint.
- Decision: modularization is performed in a dedicated restructuring branch with `index.html` as the document shell, `css/app.css` as the shared stylesheet, shared JavaScript under `js/`, and feature files under `js/modules/`.
- Decision: ordered classic scripts retain the existing browser-global execution model; conversion to native ES modules or a build tool is outside this refactor.
- Constraint: restructuring must preserve existing functionality and complete full regression testing before new feature development resumes.
- Release numbering: the restructuring task is an architecture/refactor task and will not use the R6.0 feature number; R6.0 remains reserved for the next functional release after restructuring.

## D-002 — Use browser-side Supabase integration

- Status: Implemented
- Evidence: `js/api.js` calls Supabase Auth, REST, and Storage endpoints using the shared configuration, publishable key, and authenticated bearer token.
- Decision: the current client accesses existing Supabase services directly.
- Database provisioning and migration process: **To be confirmed by Rahul.**

## D-003 — Use hash-based application routing

- Status: Implemented
- Evidence: `route()` dispatches hash routes and handles `#project/{id}` and `#action/{id}` directly.
- Decision: browser navigation and direct URLs use hash routes.

## D-004 — Prefer exact-record navigation with safe parent fallback

- Status: Implemented in R5.5
- Evidence: merged PR [#1](https://github.com/rahulcp07/margdarshi-web/pull/1).
- Decision: dashboard record rows attempt to open the exact record; missing or unavailable records fall back to the parent register.
- Accessibility: dashboard KPIs and record rows support keyboard activation and accessible labeling.

## D-005 — Give actions a dedicated detail route

- Status: Implemented in R5.6
- Evidence: merged PR [#2](https://github.com/rahulcp07/margdarshi-web/pull/2).
- Decision: `#action/{id}` and `renderActionDetail(id)` are the exact-record action view, while `#actions` remains the register.
- Decision: `openActionDetails(id)` is the common navigation entry point where an action ID exists.

## D-006 — Define the build label once

- Status: Implemented in R5.6.1
- Evidence: merged PR [#3](https://github.com/rahulcp07/margdarshi-web/pull/3) and `CONFIG.buildLabel`.
- Decision: the sidebar and shared header reuse one build label.

## D-007 — Keep Action Register filters client-side and session-local

- Status: Implemented in R5.7
- Evidence: merged PR [#4](https://github.com/rahulcp07/margdarshi-web/pull/4).
- Decision: Action Register search, field filters, due-date filters, and quick views operate on already loaded action data.
- Decision: filter state is independent of Project Register filters and may reset on full browser refresh.
- Decision: Pending Verification counts unique action IDs.

## D-008 — Reuse existing action data and workflow history for edits

- Status: Implemented in R5.8
- Evidence: merged PR [#5](https://github.com/rahulcp07/margdarshi-web/pull/5).
- Decision: detail-page action editing reuses `action_items`, `action_workflow_events`, existing dialogs/patterns, and existing permission predicates.
- Decision: application-level authorization is checked when the edit control is shown and again when a save is submitted.
- Decision: workflow history records only fields that actually changed.
- Constraint: action update and workflow-event creation are separate client requests; an atomic database operation is not present in the repository.

## D-009 — Separate product branding from operational office data

- Status: Implemented in R5.9
- Evidence: merged PR [#6](https://github.com/rahulcp07/margdarshi-web/pull/6).
- Decision: product branding is organisation-neutral, while legitimate office names remain in profiles, projects, offices, and demo operational data.
- Decision: the signed-in office label uses the profile office name, then the linked office record, then `Organisation workspace`.
- Decision: the approved expansion is **Monitoring Administration of Road Governance, Development And Reporting System for Highway Infrastructure**.

## D-010 — Use local browser time for the dashboard greeting

- Status: Implemented in R5.9
- Evidence: `dashboardGreeting(new Date())` in `js/app.js`, rendered by `js/modules/dashboard.js`.
- Boundaries:
  - 05:00–11:59: Good morning
  - 12:00–16:59: Good afternoon
  - 17:00–20:59: Good evening
  - 21:00–04:59: Good night

## D-011 — Treat R6.0-A as audit and design only

- Status: Approved documentation phase; implementation pending later review
- Decision: R6.0-A records the current schema, policies, functions, module filtering, proposed access model, gaps, migration risks, and implementation sequence.
- Decision: R6.0-A does not modify application behavior, Supabase schema, RLS policies, Storage, RPCs, or production data.
- Decision: Unverified information is marked **To be confirmed by Rahul** rather than inferred.
- Decision: Schema, policy, data, Storage, and application enforcement work begins only in separately reviewed R6.0-B onward phases.
- Evidence: [R6.0 Access-Control Specification](R6.0-ACCESS-CONTROL-SPEC.md), [Schema Audit](R6.0-SCHEMA-AUDIT.md), [Gap Analysis](R6.0-GAP-ANALYSIS.md), [Migration Risks](R6.0-MIGRATION-RISKS.md), and [Implementation Plan](R6.0-IMPLEMENTATION-PLAN.md).
