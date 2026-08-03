# MARGDARSHI Application Architecture

## Architecture baseline

This document records the modular application structure merged to `main` in pull request [#8](https://github.com/rahulcp07/margdarshi-web/pull/8). The refactor retains the **R5.9** build identity and does not introduce a functional release.

MARGDARSHI remains a browser-delivered static application with no package build step. `index.html` provides the document shell and loads one shared stylesheet followed by ordered classic JavaScript files. Existing browser-global bindings are retained so the refactor does not change route, event, permission, authentication, or data-access behavior.

## File structure

```text
index.html
css/
  app.css
js/
  config.js
  api.js
  app.js
  router.js
  modules/
    actions.js
    administration.js
    auth.js
    calendar.js
    correspondence.js
    dashboard.js
    inspections.js
    notifications.js
    projects.js
    reports.js
    search.js
```

## Responsibilities

| File | Responsibility |
| --- | --- |
| `index.html` | Document metadata, application mount point, stylesheet reference, and ordered script loading. |
| `css/app.css` | Shared visual system, module layouts, responsive breakpoints, accessibility states, and print rules. |
| `js/config.js` | Shared configuration, R5.9 build identity, icon definitions, and existing demo data. |
| `js/api.js` | Existing Supabase Auth, REST, and Storage requests and session handling. |
| `js/app.js` | Shared state, formatting and UI helpers, login/application shell templates, and common navigation bindings. |
| `js/router.js` | Existing hash-route dispatch, initialization, direct-route handling, browser history events, and shared dialog closing. |
| `js/modules/auth.js` | Login, signup, OTP, and password-control event handling plus authenticated-data loading. |
| `js/modules/projects.js` | Project Register, project creation, project workspace, project documents, and timeline behavior. |
| `js/modules/dashboard.js` | Dashboard rendering, direct navigation, keyboard activation, highlighting, and safe parent fallback. |
| `js/modules/correspondence.js` | Global/project correspondence rendering, attachments, editing, and status controls. |
| `js/modules/actions.js` | Action Register, filters and quick views, Action Detail, editing, workflow, progress, verification, and permissions. |
| `js/modules/inspections.js` | Inspection registers, forms, photographs, compliance, and linked actions. |
| `js/modules/calendar.js` | Calendar views, event forms, exact-record navigation, and linked actions. |
| `js/modules/reports.js` | Report rendering, filters, printing, and CSV export. |
| `js/modules/notifications.js` | Notification derivation, state, rendering, and exact-record navigation. |
| `js/modules/administration.js` | User administration, assignments, directory entities, and project jurisdiction controls. |
| `js/modules/search.js` | Global search indexing, rendering, keyboard interaction, and exact-record navigation. |

## Load-order contract

Scripts are loaded synchronously in the order listed in `index.html`. `js/config.js`, `js/api.js`, and `js/app.js` establish shared configuration, data access, state, and helpers before feature modules load. `js/router.js` loads last and calls `init()` only after every module is available.

This ordered classic-script contract is deliberate for the current refactor. Converting the application to native ES modules or adding a build tool would be a separate architecture decision and is not part of this branch.

## Data and security boundary

The refactor moves the existing browser-side Supabase integration into `js/api.js` without changing request paths, tables, columns, buckets, authentication flows, payloads, permission predicates, schema, policies, storage configuration, RPCs, or data.

Application-level role and record checks remain in their existing feature modules. Database-enforced authorization continues to depend on the existing Supabase configuration.

R6.0-A documents the current access-control boundary without changing it. See the [access-control specification](R6.0-ACCESS-CONTROL-SPEC.md) and [existing schema audit](R6.0-SCHEMA-AUDIT.md).

## Routing contract

The hash router preserves these direct routes:

| Area | Route |
| --- | --- |
| Dashboard | `#dashboard` |
| Project Register | `#projects` |
| Project workspace | `#project/{id}` |
| Correspondence | `#correspondence` |
| Action Tracking | `#actions` |
| Action Detail | `#action/{id}` |
| Inspections | `#inspections` |
| Calendar | `#calendar` |
| Reports | `#reports` |
| Notifications | `#notifications` |
| Administration | `#admin` |
