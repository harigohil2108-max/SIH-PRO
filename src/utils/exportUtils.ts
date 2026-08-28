// src/utils/exportUtils.ts
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface GrievanceExportItem {
  _id?: string;
  grievanceId?: string;
  title?: string;
  category?: string;
  subcategory?: string;
  priority?: string;
  status?: string;
  department?: any;
  assignedOfficer?: any;
  location?: { city?: string; state?: string; address?: string };
  aiAnalysis?: {
    priorityScore?: number;
    summary?: string;
    category?: string;
    department?: string;
  };
  sla?: { dueAt?: string; breached?: boolean };
  createdAt?: string;
}

const getDeptName = (dept: any) =>
  typeof dept === "object" ? dept?.name || dept?.code || "Unassigned" : dept || "Unassigned";

const getOfficerName = (officer: any) =>
  typeof officer === "object" ? officer?.name || officer?.email || "Unassigned" : officer || "Unassigned";

// ─── Export to CSV ────────────────────────────────────────────────────────────
export function exportGrievancesToCSV(grievances: GrievanceExportItem[], filename = "all_grievances.csv") {
  if (!grievances || grievances.length === 0) {
    alert("No grievances available to export.");
    return;
  }

  const headers = [
    "Grievance ID",
    "Title",
    "Category",
    "Priority",
    "AI Priority Score",
    "AI Summary",
    "Department",
    "Assigned Officer",
    "Location",
    "Status",
    "SLA Status",
    "Created Date",
  ];

  const escapeCSV = (str: any) => {
    if (str === null || str === undefined) return '""';
    const value = String(str).replace(/"/g, '""');
    return `"${value}"`;
  };

  const rows = grievances.map((g) => {
    const slaStatus = g.sla?.breached ? "Breached" : g.sla?.dueAt ? "Active" : "Not Set";
    const locationStr = [g.location?.city, g.location?.state].filter(Boolean).join(", ") || "Not provided";

    return [
      escapeCSV(g.grievanceId || g._id),
      escapeCSV(g.title || "Untitled"),
      escapeCSV(g.category || "Uncategorized"),
      escapeCSV(g.priority || "MEDIUM"),
      escapeCSV(g.aiAnalysis?.priorityScore ?? "N/A"),
      escapeCSV(g.aiAnalysis?.summary || "N/A"),
      escapeCSV(getDeptName(g.department)),
      escapeCSV(getOfficerName(g.assignedOfficer)),
      escapeCSV(locationStr),
      escapeCSV(g.status || "SUBMITTED"),
      escapeCSV(slaStatus),
      escapeCSV(g.createdAt ? new Date(g.createdAt).toLocaleDateString("en-IN") : "—"),
    ].join(",");
  });

  const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows].join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// ─── Export to PDF (Styled Report) ────────────────────────────────────────────
export function exportGrievancesToPDF(grievances: GrievanceExportItem[], filename = "all_grievances_report.pdf") {
  if (!grievances || grievances.length === 0) {
    alert("No grievances available to export.");
    return;
  }

  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });

  // 1. Header Banner
  doc.setFillColor(15, 43, 78); // Nivara Navy #0f2b4e
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), 60, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("NIVARA CIVIC PLATFORM — GRIEVANCE REPORT", 40, 36);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Generated: ${new Date().toLocaleString("en-IN")}`, doc.internal.pageSize.getWidth() - 200, 36);

  // 2. Summary Subheading
  doc.setTextColor(51, 65, 85);
  doc.setFontSize(10);
  doc.text(`Total Records: ${grievances.length}`, 40, 80);

  // 3. Format Table Data
  const tableData = grievances.map((g) => [
    g.grievanceId || g._id || "—",
    g.title ? (g.title.length > 25 ? g.title.substring(0, 25) + "..." : g.title) : "Untitled",
    g.category || "Uncategorized",
    g.priority || "MEDIUM",
    g.aiAnalysis?.priorityScore !== undefined ? `${g.aiAnalysis.priorityScore}/100` : "—",
    getDeptName(g.department),
    getOfficerName(g.assignedOfficer),
    g.location?.city || "—",
    g.status || "SUBMITTED",
    g.createdAt ? new Date(g.createdAt).toLocaleDateString("en-IN") : "—",
  ]);

  autoTable(doc, {
    startY: 95,
    head: [
      [
        "Grievance ID",
        "Title",
        "Category",
        "Priority",
        "AI Score",
        "Department",
        "Officer",
        "City",
        "Status",
        "Date",
      ],
    ],
    body: tableData,
    theme: "striped",
    headStyles: {
      fillColor: [15, 43, 78],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: "bold",
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { left: 30, right: 30 },
  });

  doc.save(filename);
}