# MARGDARSHI Roadmap

## Verified delivery sequence

The repository confirms this completed sequence:

1. **R5.5 — Dashboard Direct Navigation**: exact record navigation, keyboard activation, highlighting, and parent-register fallback.
2. **R5.6 — Action Detail View**: dedicated action route, responsive detail layout, exact action entry points, and not-found handling.
3. **R5.6.1 — Global Build Marker**: one shared build label rendered in the sidebar and application header.
4. **R5.7 — Action Register Filters**: quick views, detailed client-side filters, unique pending-verification counting, filter preservation, and mutually exclusive due-date categories.
5. **R5.8 — Action Editing and Status Update**: authorized detail-page editing, validation, confirmation, feedback, and workflow-history recording using existing data structures.
6. **R5.9 — Dashboard Branding and Login UX**: local-time greetings, organisation-neutral product branding, approved name expansion, dynamic office labeling, accessible collapsed-sidebar tooltips, and an accessible login About section.

## Approved next technical task — application restructuring

- Status: Implemented on the dedicated architecture/refactor branch; pending review and regression approval
- Classification: Architecture/refactor task; not a functional release
- Sequence: Begin after documentation PR #7 is reviewed and merged.
- Scope: Split and modularize the R5.9 single-file `index.html` implementation in a dedicated restructuring branch. The resulting structure is recorded in [ARCHITECTURE.md](ARCHITECTURE.md).
- Compatibility requirement: Preserve all existing R5.9 functionality and permissions.
- Validation requirement: Complete full regression testing before the restructuring task is considered complete.
- Delivery gate: Complete restructuring before new feature development begins.
- Versioning: Do not assign R6.0 to this task. R6.0 is reserved for the next functional release after restructuring.

## Next functional release

- Reserved release number: **R6.0**
- Sequence: after the approved architecture/refactor task is complete
- Functional scope and acceptance criteria: **To be confirmed by Rahul.**
- Target date: **To be confirmed by Rahul.**
- Required reviewers: **To be confirmed by Rahul.**

## Unrecovered or uncommitted ideas

The repository does not establish an approved plan for the following areas:

- final product logo or brand asset: **To be confirmed by Rahul.**
- highway slideshow or other login imagery: **To be confirmed by Rahul.**
- automated CI/browser test infrastructure: **To be confirmed by Rahul.**
- deployment automation and hosting environment: **To be confirmed by Rahul.**
- future Supabase schema or policy work: **To be confirmed by Rahul.**

No item in this section should be treated as approved scope until it is backed by a repository issue, decision record, or reviewed pull request.
