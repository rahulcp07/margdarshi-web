# MARGDARSHI Release Notes

## R5.9 — Dashboard Branding and Login UX

- Merged: 2026-07-31
- Main commit: `aff7bc0c5523c94e66542ca5affc97036f786a9f`
- Pull request: [#6](https://github.com/rahulcp07/margdarshi-web/pull/6)

Shipped:

- local-browser-time dashboard greetings, including Good night from 21:00 through 04:59;
- organisation-neutral product branding while retaining operational office names;
- the approved MARGDARSHI expansion below the login brand and in the About section;
- profile/linked-office display with `Organisation workspace` fallback;
- accessible names, native titles, and visible tooltips for collapsed sidebar navigation;
- accessible About MARGDARSHI content on the login page;
- Build R5.9 marker.

No logo, slideshow, temporary image asset, Supabase schema change, or database change was included.

## R5.8 — Action Editing and Status Update

- Merged: 2026-07-31
- Main commit: `549d8e8dc99ae2e0e6b85d50a61064cf03a87bf5`
- Pull request: [#5](https://github.com/rahulcp07/margdarshi-web/pull/5)

Shipped:

- authorized Edit Action workflow in Action Detail;
- current-value form loading for title, description, status, priority, due date, claimed progress, verified progress, and remarks;
- supported-value, date, progress-range, and nonblank-title validation;
- explicit before/after confirmation, success feedback, and meaningful error feedback;
- submit-time application permission checks in addition to control visibility;
- concise `action_updated` workflow-history entries containing changed fields only;
- Build R5.8 marker.

The release reused existing `action_items` and `action_workflow_events` data structures and did not include a Supabase schema change.

## R5.7 — Action Register Filters

- Merged: 2026-07-29
- Main commit: `9a7b670e09abc5e0a893238e9db2145f51d4c54a`
- Pull request: [#4](https://github.com/rahulcp07/margdarshi-web/pull/4)

Shipped:

- All Actions, Open, Overdue, Pending Verification, and Completed quick views;
- search, project, status, priority, assignee, workflow-stage, and due-date filters;
- result count, Reset control, responsive filter layout, and zero-result state;
- unique-action counting for Pending Verification;
- filter preservation through Action Detail during the same session;
- Dashboard Open Actions navigation to the Open quick view;
- mutually exclusive due-date buckets, including More than 7 days;
- Build R5.7 marker.

The release used already loaded action data and did not include a Supabase schema or policy change.

## R5.6.1 — Global Build Marker

- Merged: 2026-07-29
- Main commit: `fe2d42a8206d59662aa415a2a0cd445f8526ca0f`
- Pull request: [#3](https://github.com/rahulcp07/margdarshi-web/pull/3)

Shipped:

- one shared build label in configuration;
- the existing sidebar build marker retained;
- a compact, accessible, non-interactive build badge in the shared application header;
- build visibility across Dashboard, Project Register, Correspondence, Action Tracking, Action Detail, Inspections, Calendar, Reports, and Administration.

No Supabase change was included.

## R5.6 — Action Detail View

- Merged: 2026-07-29
- Main commit: `2115bd0fad12d7df2ba0c432e3df55bdfca40b41`
- Pull request: [#2](https://github.com/rahulcp07/margdarshi-web/pull/2)

Shipped:

- dedicated `#action/{id}` route and `renderActionDetail(id)`;
- shared `openActionDetails(id)` entry point;
- responsive detail layout for instruction, context, assignees, dates, claimed/verified progress, progress history, and workflow history;
- existing edit, progress, processing, and verification controls preserved;
- accessible View details controls on action cards;
- exact action entry points from dashboard, global search, notifications, calendar, and linked inspections;
- safe Action not found state with return-to-register control;
- Build R5.6 marker.

No Supabase schema, migration, authentication, REST-query, or storage change was included.

## R5.5 — Dashboard Direct Navigation

- Merged: 2026-07-29
- Main commit: `36c55d9afc534ac41d4eeadd0a3f909c1127804b`
- Pull request: [#1](https://github.com/rahulcp07/margdarshi-web/pull/1)

Shipped:

- direct dashboard navigation to exact action, correspondence, inspection, calendar, and project records;
- existing KPI and parent-module navigation preserved;
- keyboard activation, link semantics, accessible labels, and visible focus styling for interactive dashboard rows and KPIs;
- existing exact-record opening/highlighting paths reused;
- safe fallback to the appropriate parent register when an exact record cannot be opened;
- Build R5.5 marker.

No Supabase configuration, authentication, REST, storage, database, schema, or migration change was included.
