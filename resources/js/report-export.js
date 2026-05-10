import { normalizeSelectedPath } from "./dialog-file-path.js";
import { translateReceivableStatus } from "./receivable-status-label.js";
import { translateSystemStatus } from "./system-status-label.js";

const REPORT_FILE_FILTERS = {
  csv: [{ name: "Arquivos CSV", extensions: ["csv"] }],
  excel: [{ name: "Arquivos Excel", extensions: ["xls"] }],
  pdf: [{ name: "Arquivos PDF", extensions: ["pdf"] }],
};

const REPORT_BUILDERS = {
  owners: {
    title: "Relatorio de proprietarios",
    columns: ["Nome", "Documento", "Telefone", "E-mail", "Observacoes"],
    rows: (snapshot) =>
      snapshot.owners.map((owner) => [
        owner.name,
        owner.document,
        owner.phone,
        owner.email,
        owner.notes,
      ]),
  },
  tenants: {
    title: "Relatorio de inquilinos",
    columns: ["Nome", "Documento", "Telefone", "E-mail", "Status"],
    rows: (snapshot) =>
      snapshot.tenants.map((tenant) => [
        tenant.name,
        tenant.document,
        tenant.phone,
        tenant.email,
        translateSystemStatus(tenant.status),
      ]),
  },
  properties: {
    title: "Relatorio de imoveis",
    columns: [
      "Codigo",
      "Nome",
      "Proprietario",
      "Endereco",
      "Cidade",
      "UF",
      "Aluguel",
      "Status",
    ],
    rows: (snapshot) =>
      snapshot.properties.map((property) => [
        property.code,
        property.title,
        property.owner_name,
        property.address,
        property.city,
        property.state,
        property.monthly_rent,
        translateSystemStatus(property.status),
      ]),
  },
  contracts: {
    title: "Relatorio de contratos",
    columns: [
      "Imovel",
      "Inquilino",
      "Inicio",
      "Fim",
      "Vencimento",
      "Aluguel",
      "Caucao",
      "Status",
    ],
    rows: (snapshot) =>
      snapshot.contracts.map((contract) => [
        [contract.property_code, contract.property_title]
          .filter(Boolean)
          .join(" · "),
        contract.tenant_name,
        contract.start_date,
        contract.end_date,
        contract.due_day,
        contract.rent_amount,
        contract.deposit_amount,
        translateSystemStatus(contract.status),
      ]),
  },
  receivables: {
    title: "Relatorio de recebiveis",
    columns: [
      "Referencia",
      "Imovel",
      "Inquilino",
      "Vencimento",
      "Valor",
      "Status",
    ],
    rows: (snapshot) =>
      snapshot.receivables.map((receivable) => [
        receivable.reference_month,
        [receivable.property_code, receivable.property_title]
          .filter(Boolean)
          .join(" · "),
        receivable.tenant_name,
        receivable.due_date,
        receivable.amount,
        translateReceivableStatus(receivable.status_label),
      ]),
  },
};

function getReportBuilder(route) {
  const builder = REPORT_BUILDERS[route];
  if (builder) {
    return builder;
  }
  throw new Error(
    `Rota de relatorio invalida: value="${route}" expected="owners|tenants|properties|contracts|receivables"`
  );
}

function reportDateStamp(today) {
  return today.toISOString().slice(0, 10);
}

function reportFileName(route, format, today) {
  return `imobiliaria-${route}-${reportDateStamp(today)}.${reportExtension(
    format
  )}`;
}

function reportExtension(format) {
  const map = { csv: "csv", excel: "xls", pdf: "pdf" };
  if (map[format]) {
    return map[format];
  }
  throw new Error(
    `Formato de relatorio invalido: value="${format}" expected="csv|excel|pdf"`
  );
}

function reportCell(value) {
  return String(value ?? "").replaceAll('"', '""');
}

function reportLine(values) {
  return values.map((value) => `"${reportCell(value)}"`).join(";");
}

function createCsvContent(columns, rows) {
  return [reportLine(columns)].concat(rows.map(reportLine)).join("\n");
}

function htmlCell(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function createExcelContent(title, columns, rows) {
  const headerCells = columns
    .map((value) => `<th>${htmlCell(value)}</th>`)
    .join("");
  const bodyRows = rows
    .map(
      (row) =>
        `<tr>${row.map((value) => `<td>${htmlCell(value)}</td>`).join("")}</tr>`
    )
    .join("");
  return `<!doctype html><html><head><meta charset="utf-8"><title>${htmlCell(title)}</title></head><body><table><thead><tr>${headerCells}</tr></thead><tbody>${bodyRows}</tbody></table></body></html>`;
}

function compactPdfCell(value) {
  const normalized = String(value ?? "")
    .replaceAll(/\s+/g, " ")
    .trim();
  return normalized.length > 18 ? `${normalized.slice(0, 15)}...` : normalized;
}

function escapePdfText(value) {
  return String(value)
    .replaceAll("\\", "\\\\")
    .replaceAll("(", "\\(")
    .replaceAll(")", "\\)");
}

function pdfLine(values) {
  return values.map(compactPdfCell).join(" | ");
}

function chunkPdfLines(lines, size = 42) {
  const pages = [];
  for (let index = 0; index < lines.length; index += size) {
    pages.push(lines.slice(index, index + size));
  }
  return pages;
}

function pdfStream(lines) {
  const body = lines
    .map((line) => `(${escapePdfText(line)}) Tj`)
    .join("\nT*\n");
  return `BT\n/F1 10 Tf\n40 800 Td\n14 TL\n${body}\nET`;
}

function pdfObject(number, body) {
  return `${number} 0 obj\n${body}\nendobj\n`;
}

function createPdfContent(title, columns, rows) {
  const lines = [title, "", pdfLine(columns)].concat(rows.map(pdfLine));
  const pages = chunkPdfLines(lines);
  const fontObjectId = 3 + pages.length * 2;
  const objects = [pdfObject(1, "<< /Type /Catalog /Pages 2 0 R >>")];
  const pageRefs = pages.map((_, index) => `${3 + index * 2} 0 R`).join(" ");
  objects.push(
    pdfObject(
      2,
      `<< /Type /Pages /Kids [${pageRefs}] /Count ${pages.length} >>`
    )
  );
  pages.forEach((pageLines, index) => {
    const pageObjectId = 3 + index * 2;
    const contentObjectId = pageObjectId + 1;
    const stream = pdfStream(pageLines);
    objects.push(
      pdfObject(
        pageObjectId,
        `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${fontObjectId} 0 R >> >> /Contents ${contentObjectId} 0 R >>`
      )
    );
    objects.push(
      pdfObject(
        contentObjectId,
        `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`
      )
    );
  });
  objects.push(
    pdfObject(
      fontObjectId,
      "<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>"
    )
  );
  return buildPdfFile(objects);
}

function buildPdfFile(objects) {
  let content = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object) => {
    offsets.push(content.length);
    content += object;
  });
  const startXref = content.length;
  content += `xref\n0 ${offsets.length}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    content += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  content += `trailer\n<< /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${startXref}\n%%EOF`;
  return new TextEncoder().encode(content).buffer;
}

function reportPayload(route, format, snapshot) {
  const builder = getReportBuilder(route);
  const rows = builder.rows(snapshot);
  if (format === "csv") {
    return createCsvContent(builder.columns, rows);
  }
  if (format === "excel") {
    return createExcelContent(builder.title, builder.columns, rows);
  }
  return createPdfContent(builder.title, builder.columns, rows);
}

async function saveReportPayload(neutralino, filePath, format, payload) {
  if (format === "pdf") {
    await neutralino.filesystem.writeBinaryFile(filePath, payload);
    return true;
  }
  await neutralino.filesystem.writeFile(filePath, payload);
  return true;
}

/**
 * Exports a route report as CSV, Excel or PDF using Neutralino dialogs.
 * Example: await exportRouteReport("owners", "csv", snapshot, Neutralino);
 */
export async function exportRouteReport(
  route,
  format,
  snapshot,
  neutralino,
  today = new Date()
) {
  const filePath = normalizeSelectedPath(
    await neutralino.os.showSaveDialog("Salvar relatorio", {
      defaultPath: reportFileName(route, format, today),
      filters: REPORT_FILE_FILTERS[format],
      forceOverwrite: true,
    })
  );
  if (!filePath) {
    return false;
  }
  const payload = reportPayload(route, format, snapshot);
  await saveReportPayload(neutralino, filePath, format, payload);
  return true;
}
