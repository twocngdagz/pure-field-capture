import type { Report } from "./captureTypes";
import { buildReportPreviewModel } from "./reportView";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildReportPdfHtml(
  report: Report,
  options: { photoDataUri: string },
): string {
  const model = buildReportPreviewModel(report);
  const { photoDataUri } = options;

  const partialNotice =
    model.partialNotice !== null
      ? `<p>${escapeHtml(model.partialNotice)}</p>`
      : "";

  const sections = model.sections
    .map((section) => {
      const rows = section.rows
        .map(
          (row) =>
            `<tr><td>${escapeHtml(row.label)}</td><td>${escapeHtml(row.value)}</td></tr>`,
        )
        .join("");

      return `<h2>${escapeHtml(section.title)}</h2><table>${rows}</table>`;
    })
    .join("");

  return `
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body>
        <h1>${escapeHtml(model.title)}</h1>
        ${partialNotice}
        <img
          src="${photoDataUri}"
          alt="Captured photo"
          style="width: 100%; max-height: 420px; object-fit: contain;"
        />
        ${sections}
      </body>
    </html>
  `;
}
