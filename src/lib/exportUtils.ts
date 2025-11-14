import { Invitation } from "@/components/userDashboard/invitations/Invitations";
import { format } from "date-fns";

/**
 * Export invitations to CSV format
 */
export const exportToCSV = (invitations: Invitation[], filename = "invitations.csv") => {
  // Define CSV headers
  const headers = [
    "Name",
    "Email",
    "Phone",
    "Status",
    "RSVP",
    "Sent Via Email",
    "Sent Via WhatsApp",
    "Expires At",
    "Created At",
  ];

  // Convert invitations to CSV rows
  const rows = invitations.map((inv) => [
    inv.name || "",
    inv.email || "",
    inv.phone || "",
    inv.status || "",
    inv.rsvp || "No Response",
    inv.sentViaEmail ? "Yes" : "No",
    inv.sentViaWhatsApp ? "Yes" : "No",
    inv.expiresAt ? format(new Date(inv.expiresAt), "yyyy-MM-dd HH:mm:ss") : "",
    inv.createdAt ? format(new Date(inv.createdAt), "yyyy-MM-dd HH:mm:ss") : "",
  ]);

  // Combine headers and rows
  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")),
  ].join("\n");

  // Create blob and download
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
};

/**
 * Export invitations to PDF format (using HTML and print)
 */
export const exportToPDF = (invitations: Invitation[], memorialName?: string) => {
  // Create a styled HTML document
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>${memorialName ? `${memorialName} - ` : ""}Guest List</title>
        <style>
          @media print {
            @page {
              size: A4;
              margin: 20mm;
            }
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
          }

          body {
            font-family: Arial, sans-serif;
            padding: 20px;
            max-width: 1200px;
            margin: 0 auto;
          }

          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
          }

          .header h1 {
            margin: 0 0 10px 0;
            color: #333;
          }

          .header p {
            margin: 5px 0;
            color: #666;
          }

          .stats {
            display: flex;
            justify-content: space-around;
            margin-bottom: 30px;
            padding: 15px;
            background-color: #f5f5f5;
            border-radius: 8px;
          }

          .stat-item {
            text-align: center;
          }

          .stat-item .number {
            font-size: 24px;
            font-weight: bold;
            color: #333;
          }

          .stat-item .label {
            font-size: 12px;
            color: #666;
            text-transform: uppercase;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }

          th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #ddd;
          }

          th {
            background-color: #333;
            color: white;
            font-weight: 600;
            text-transform: uppercase;
            font-size: 12px;
          }

          tr:hover {
            background-color: #f5f5f5;
          }

          .badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
          }

          .badge-sent {
            background-color: #e8f5e9;
            color: #2e7d32;
          }

          .badge-pending {
            background-color: #fff3e0;
            color: #e65100;
          }

          .badge-delivered {
            background-color: #e3f2fd;
            color: #1565c0;
          }

          .badge-yes {
            background-color: #e8f5e9;
            color: #2e7d32;
          }

          .badge-no {
            background-color: #ffebee;
            color: #c62828;
          }

          .badge-maybe {
            background-color: #fff3e0;
            color: #ef6c00;
          }

          .icon {
            display: inline-block;
            width: 16px;
            height: 16px;
            margin-right: 4px;
          }

          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            text-align: center;
            color: #666;
            font-size: 12px;
          }

          @media print {
            .no-print {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${memorialName ? `${memorialName}` : "Memorial"} - Guest List</h1>
          <p>Generated on ${format(new Date(), "MMMM dd, yyyy 'at' HH:mm")}</p>
          <p>Total Invitations: ${invitations.length}</p>
        </div>

        <div class="stats">
          <div class="stat-item">
            <div class="number">${invitations.filter((i) => i.status === "pending" || i.status === "accepted").length}</div>
            <div class="label">Sent</div>
          </div>
          <div class="stat-item">
            <div class="number">${invitations.filter((i) => i.rsvp === "yes").length}</div>
            <div class="label">Accepted</div>
          </div>
          <div class="stat-item">
            <div class="number">${invitations.filter((i) => i.sentViaEmail).length}</div>
            <div class="label">Email</div>
          </div>
          <div class="stat-item">
            <div class="number">${invitations.filter((i) => i.sentViaWhatsApp).length}</div>
            <div class="label">WhatsApp</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Contact</th>
              <th>Status</th>
              <th>RSVP</th>
              <th>Delivery</th>
              <th>Expires</th>
            </tr>
          </thead>
          <tbody>
            ${invitations
              .map(
                (inv) => `
              <tr>
                <td><strong>${inv.name || "N/A"}</strong></td>
                <td>
                  ${inv.email ? `📧 ${inv.email}<br/>` : ""}
                  ${inv.phone ? `📱 ${inv.phone}` : ""}
                </td>
                <td>
                  <span class="badge badge-${inv.status}">${inv.status}</span>
                </td>
                <td>
                  ${
                    inv.rsvp
                      ? `<span class="badge badge-${inv.rsvp}">${inv.rsvp}</span>`
                      : "No Response"
                  }
                </td>
                <td>
                  ${inv.sentViaEmail ? "✉️ Email" : ""}
                  ${inv.sentViaEmail && inv.sentViaWhatsApp ? "<br/>" : ""}
                  ${inv.sentViaWhatsApp ? "💬 WhatsApp" : ""}
                </td>
                <td>
                  ${inv.expiresAt ? format(new Date(inv.expiresAt), "MMM dd, yyyy") : "N/A"}
                </td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>

        <div class="footer">
          <p>Forever Pages - Memorial Invitation Management System</p>
          <p>This is a confidential document. Please handle with care.</p>
        </div>

        <div class="no-print" style="margin-top: 20px; text-align: center;">
          <button onclick="window.print()" style="padding: 10px 20px; font-size: 16px; cursor: pointer;">
            Print / Save as PDF
          </button>
          <button onclick="window.close()" style="padding: 10px 20px; font-size: 16px; cursor: pointer; margin-left: 10px;">
            Close
          </button>
        </div>
      </body>
    </html>
  `;

  // Open in new window and trigger print dialog
  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();

    // Wait for content to load before printing
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
      }, 250);
    };
  }
};

/**
 * Export analytics data to CSV
 */
export const exportAnalyticsToCSV = (
  analytics: {
    totalSent: number;
    delivered: number;
    opened: number;
    accepted: number;
    declined: number;
    pending: number;
    emailDelivery: number;
    whatsappDelivery: number;
    averageResponseTime: number;
  },
  filename = "invitation-analytics.csv"
) => {
  const headers = ["Metric", "Value"];
  const rows = [
    ["Total Sent", analytics.totalSent],
    ["Delivered", analytics.delivered],
    ["Opened", analytics.opened],
    ["Accepted (RSVP Yes)", analytics.accepted],
    ["Declined (RSVP No)", analytics.declined],
    ["Pending", analytics.pending],
    ["Email Delivery", analytics.emailDelivery],
    ["WhatsApp Delivery", analytics.whatsappDelivery],
    ["Average Response Time (hours)", analytics.averageResponseTime.toFixed(2)],
  ];

  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
};
