# MARGDARSHI Decision Log

This log records decisions observable in the current code or merged pull requests. It does not infer rationale that is absent from the repository.

## D-001 — Keep the application self-contained

- Status: Implemented
- Evidence: the R5.9 repository baseline contains `index.html` as the application source.
- Decision: HTML, CSS, and JavaScript are delivered together in one file.
- Unrecorded rationale: **To be confirmed by Rahul.**

## D-002 — Use browser-side Supabase integration

- Status: Implemented
- Evidence: `index.html` calls Supabase Auth, REST, and Storage endpoints using the shared configuration, publishable key, and authenticated bearer token.
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
- Evidence: `dashboardGreeting(new Date())` in `index.html`.
- Boundaries:
  - 05:00–11:59: Good morning
  - 12:00–16:59: Good afternoon
  - 17:00–20:59: Good evening
  - 21:00–04:59: Good night
