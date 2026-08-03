# MARGDARSHI Roadmap

## Verified delivery sequence

The repository confirms this completed sequence:

1. **R5.5 — Dashboard Direct Navigation**: exact record navigation, keyboard activation, highlighting, and parent-register fallback.
2. **R5.6 — Action Detail View**: dedicated action route, responsive detail layout, exact action entry points, and not-found handling.
3. **R5.6.1 — Global Build Marker**: one shared build label rendered in the sidebar and application header.
4. **R5.7 — Action Register Filters**: quick views, detailed client-side filters, unique pending-verification counting, filter preservation, and mutually exclusive due-date categories.
5. **R5.8 — Action Editing and Status Update**: authorized detail-page editing, validation, confirmation, feedback, and workflow-history recording using existing data structures.
6. **R5.9 — Dashboard Branding and Login UX**: local-time greetings, organisation-neutral product branding, approved name expansion, dynamic office labeling, accessible collapsed-sidebar tooltips, and an accessible login About section.

## Completed technical task — application restructuring

- Status: Merged to `main` in pull request [#8](https://github.com/rahulcp07/margdarshi-web/pull/8)
- Main commit: `0bff033a9ce24dd0936cb998c5c3aaaacb037697`
- Classification: Architecture/refactor task; not a functional release
- Result: The R5.9 application is modularized as recorded in [ARCHITECTURE.md](ARCHITECTURE.md), with existing behavior and build identity preserved.

## R6.0-A — access-control design and existing schema audit

- Status: Documentation/design phase under review
- Classification: Audit and design only; not an implementation release
- Scope: Record current tables, relationships, assignments, roles, RLS, functions, module filtering, gaps, migration risks, and the recommended R6.0-B onward sequence.
- Constraint: No application, schema, RLS, Storage, RPC, or production-data changes in R6.0-A.
- Evidence rule: Unverified matters are marked **To be confirmed by Rahul**.

## R6.0-B onward

- Sequence: Begin only after R6.0-A review and the required access-model decisions.
- Recommended phases: test/migration foundation, canonical contexts, project-scope helpers, scoped RLS, action hierarchy, Storage enforcement, module adoption, and controlled rollout.
- Detailed plan: [R6.0 Implementation Plan](R6.0-IMPLEMENTATION-PLAN.md)
- Target dates and required reviewers: **To be confirmed by Rahul.**

## Unrecovered or uncommitted ideas

The repository does not establish an approved plan for the following areas:

- final product logo or brand asset: **To be confirmed by Rahul.**
- highway slideshow or other login imagery: **To be confirmed by Rahul.**
- automated CI/browser test infrastructure: **To be confirmed by Rahul.**
- deployment automation and hosting environment: **To be confirmed by Rahul.**
- implementation details not resolved by the R6.0-A audit: **To be confirmed by Rahul.**

No item in this section should be treated as approved scope until it is backed by a repository issue, decision record, or reviewed pull request.
