const CONFIG = Object.freeze({
  supabaseUrl: "https://aegdytymgucgxxdgzsij.supabase.co",
  supabasePublishableKey: "sb_publishable_hYB33w3ZowZunNnnJv3OkQ_GbKe2OhE",
  appName: "MARGDARSHI",
  appExpansion: "Monitoring Administration of Road Governance, Development And Reporting System for Highway Infrastructure",
  officeFallback: "Organisation workspace",
  buildLabel: "R5.9",
});

const paths = {
  dashboard: '<path d="M3 11.5 12 4l9 7.5"/><path d="M5 10.5V20h14v-9.5"/><path d="M9 20v-6h6v6"/>',
  projects: '<path d="m12 3-9 5 9 5 9-5-9-5Z"/><path d="m3 12 9 5 9-5"/><path d="m3 16 9 5 9-5"/>',
  mail: '<rect width="18" height="14" x="3" y="5" rx="2"/><path d="m3 7 9 6 9-6"/>',
  calendar: '<rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  reports: '<path d="M4 19V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z"/><path d="M8 17v-5M12 17V7M16 17v-8"/>',
  settings: '<path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.12 2.12-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V20.3h-3v-.08a1.7 1.7 0 0 0-1.03-1.56 1.7 1.7 0 0 0-1.88.34l-.06.06-2.12-2.12.06-.06A1.7 1.7 0 0 0 7.02 15a1.7 1.7 0 0 0-1.56-1.03H5.4v-3h.06A1.7 1.7 0 0 0 7.02 9a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.12-2.12.06.06A1.7 1.7 0 0 0 10.68 5a1.7 1.7 0 0 0 1.03-1.56V3.4h3v.04A1.7 1.7 0 0 0 15.74 5a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.12 2.12-.06.06A1.7 1.7 0 0 0 19.4 9a1.7 1.7 0 0 0 1.56 1.03h.04v3h-.04A1.7 1.7 0 0 0 19.4 15Z"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
  bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  reset: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>',
  folder: '<path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z"/>',
  construction: '<path d="M4 20h16M6 20V8l6-4 6 4v12M9 20v-6h6v6M8 10h8"/>',
  clipboard: '<rect width="14" height="18" x="5" y="3" rx="2"/><path d="M9 3V1h6v2M9 8h6M9 12h6M9 16h4"/>',
  check: '<circle cx="12" cy="12" r="9"/><path d="m8 12 2.5 2.5L16 9"/>',
  logout: '<path d="M10 17l5-5-5-5M15 12H3"/><path d="M14 3h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5"/>',
  arrow: '<path d="m9 18 6-6-6-6"/>',
  back: '<path d="m15 18-6-6 6-6"/>',
  document: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M8 13h8M8 17h8"/>',
  inspection: '<path d="M9 11 11 13 15 9"/><path d="M6 3h12a2 2 0 0 1 2 2v16l-4-2-4 2-4-2-4 2V5a2 2 0 0 1 2-2Z"/>',
  timeline: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  menu: '<circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/>',
};

function icon(name, size = 20, className = "") {
  return `<svg class="icon ${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || ""}</svg>`;
}

const DEMO_PROFILE = {
  full_name: "Rahul Potdar",
  designation: "Sectional Engineer",
  role: "admin",
  office_name: "National Highway Division, Dhule",
};

const DEMO_PROJECTS = [
  { id: "demo-1", project_code: "NH753B-PKG1-BAL", project_name: "NH-753B Package-1 Balance Works", highway_number: "NH-753B", mode: "EPC", status: "construction", status_label: "Under Construction", physical_progress_pct: 0, financial_progress_pct: 0, health_label: "In Progress", pending_actions_count: 2, implementing_office_name: "National Highway Division, Dhule", updated_at: "2026-07-25T08:00:00Z", description: "Balance works and approaches under Package-1." },
  { id: "demo-2", project_code: "NH753B-PKG1-MAIN", project_name: "NH-753B Package-1 Main Project", highway_number: "NH-753B", mode: "EPC", status: "maintenance", status_label: "Maintenance", physical_progress_pct: 100, financial_progress_pct: 92, health_label: "Attention", pending_actions_count: 4, implementing_office_name: "National Highway Division, Dhule", updated_at: "2026-07-24T09:00:00Z", description: "Main project currently under maintenance obligations." },
  { id: "demo-3", project_code: "NH753B-PKG2", project_name: "NH-753B Package-2: Nandurbar–Taloda", highway_number: "NH-753B", mode: "EPC", status: "awarded", status_label: "Awarded", physical_progress_pct: 0, financial_progress_pct: 0, health_label: "In Progress", pending_actions_count: 5, implementing_office_name: "National Highway Division, Dhule", updated_at: "2026-07-23T10:00:00Z", description: "Four-laning of Nandurbar–Taloda section." },
  { id: "demo-4", project_code: "NH753B-PKG3", project_name: "NH-753B Package-3: Taloda–Akkalkuva", highway_number: "NH-753B", mode: "EPC", status: "awarded", status_label: "Awarded", physical_progress_pct: 0, financial_progress_pct: 0, health_label: "Attention", pending_actions_count: 6, implementing_office_name: "National Highway Division, Dhule", updated_at: "2026-07-22T11:00:00Z", description: "Four-laning of Taloda–Akkalkuva section." },
  { id: "demo-5", project_code: "NH753F-SILLOD", project_name: "NH-753F Nillod Phata–Sillod Section", highway_number: "NH-753F", mode: "EPC", status: "construction", status_label: "Under Construction", physical_progress_pct: 55, financial_progress_pct: 49, health_label: "Delayed", pending_actions_count: 3, implementing_office_name: "National Highway Division, Dhule", updated_at: "2026-07-21T12:00:00Z", description: "Four-lane concrete road including Purna river bridge." },
  { id: "demo-6", project_code: "NH753J-PKG1", project_name: "NH-753J Package-1: Jalgaon–Bhadgaon", highway_number: "NH-753J", mode: "EPC", status: "maintenance", status_label: "Maintenance", physical_progress_pct: 100, financial_progress_pct: 100, health_label: "Healthy", pending_actions_count: 1, implementing_office_name: "National Highway Division, Dhule", updated_at: "2026-07-20T13:00:00Z", description: "Completed EPC package now under maintenance management." },
  { id: "demo-7", project_code: "NH753J-PKG2", project_name: "NH-753J Package-2: Bhadgaon–Chalisgaon", highway_number: "NH-753J", mode: "EPC", status: "maintenance", status_label: "Maintenance", physical_progress_pct: 100, financial_progress_pct: 100, health_label: "Healthy", pending_actions_count: 0, implementing_office_name: "National Highway Division, Dhule", updated_at: "2026-07-19T14:00:00Z", description: "Completed EPC package now under maintenance management." },
];
