# MARGDARSHI Project Status

## Current stable baseline

- Stable build: **R5.9**
- Stable branch: `main`
- Current main commit: `0bff033a9ce24dd0936cb998c5c3aaaacb037697`
- R5.9 functional-release commit: `aff7bc0c5523c94e66542ca5affc97036f786a9f`
- Application source: `index.html`, `css/app.css`, `js/`, and `js/modules/`
- Application name expansion: **Monitoring Administration of Road Governance, Development And Reporting System for Highway Infrastructure**

The build number and expansion are defined in the shared `CONFIG` object. On the modular architecture branch, that object is located in `js/config.js`.

## Repository shape

R5.9 was originally delivered as one self-contained HTML file. The post-R5.9 architecture/refactor was subsequently merged to `main` in pull request [#8](https://github.com/rahulcp07/margdarshi-web/pull/8), preserving the R5.9 build identity while extracting the document shell to `index.html`, shared styles to `css/app.css`, shared configuration/data access/application/router responsibilities to `js/`, and feature responsibilities to `js/modules/`. See [ARCHITECTURE.md](ARCHITECTURE.md).

The modular application continues to connect directly from the browser to Supabase Auth, REST, and Storage endpoints using the existing publishable key and the authenticated user's bearer token.

No package manifest, build tool configuration, GitHub Actions workflow, or database migration directory is present. The modular baseline includes a focused correspondence-status regression test under `tests/`.

## Current design phase

**R6.0-A — Access-Control Design and Existing Schema Audit** is a documentation/audit phase only. It records the existing schema, RLS policies, helper functions, module filtering, proposed access model, gaps, migration risks, and recommended R6.0-B onward sequence.

R6.0-A does not change application behavior, Supabase schema, RLS policies, Storage, RPCs, or production data. See:

- [R6.0 Access-Control Specification](R6.0-ACCESS-CONTROL-SPEC.md)
- [R6.0 Schema Audit](R6.0-SCHEMA-AUDIT.md)
- [R6.0 Gap Analysis](R6.0-GAP-ANALYSIS.md)
- [R6.0 Migration Risks](R6.0-MIGRATION-RISKS.md)
- [R6.0 Implementation Plan](R6.0-IMPLEMENTATION-PLAN.md)

## Shipped application areas

The current hash router and shared sidebar expose these areas:

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

The application also contains login, signup, email OTP verification, password validation, logout, global search, responsive layouts, and demo-preview behavior.

## Current action-management baseline

Repository code and merged PRs verify the following:

- exact action navigation from the dashboard, search, notifications, calendar, and linked inspections;
- a dedicated Action Detail route with a safe not-found state;
- Action Register quick views and detailed client-side filters;
- filter preservation while opening and returning from Action Detail during the same session;
- issuer/creator/administrator control checks, assignee progress submission, office processing, and verifier checks;
- authorized detail-page updates for title, description, status, priority, due date, claimed progress, verified progress, and remarks;
- change-only workflow-history entries for action updates.

## Release chain

| Release | Main commit | Pull request | Status |
| --- | --- | --- | --- |
| R5.5 | `36c55d9afc534ac41d4eeadd0a3f909c1127804b` | [#1](https://github.com/rahulcp07/margdarshi-web/pull/1) | Merged |
| R5.6 | `2115bd0fad12d7df2ba0c432e3df55bdfca40b41` | [#2](https://github.com/rahulcp07/margdarshi-web/pull/2) | Merged |
| R5.6.1 | `fe2d42a8206d59662aa415a2a0cd445f8526ca0f` | [#3](https://github.com/rahulcp07/margdarshi-web/pull/3) | Merged |
| R5.7 | `9a7b670e09abc5e0a893238e9db2145f51d4c54a` | [#4](https://github.com/rahulcp07/margdarshi-web/pull/4) | Merged |
| R5.8 | `549d8e8dc99ae2e0e6b85d50a61064cf03a87bf5` | [#5](https://github.com/rahulcp07/margdarshi-web/pull/5) | Merged |
| R5.9 | `aff7bc0c5523c94e66542ca5affc97036f786a9f` | [#6](https://github.com/rahulcp07/margdarshi-web/pull/6) | Merged |

## Repository-backed status limits

- Production hosting target and deployment procedure: **To be confirmed by Rahul.**
- Supported browser/version matrix: **To be confirmed by Rahul.**
- Formal product owner, release approver, and support contacts: **To be confirmed by Rahul.**
- Any requirements maintained outside this repository: **To be confirmed by Rahul.**
