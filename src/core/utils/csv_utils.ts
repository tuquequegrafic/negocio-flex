/**
 * Utilidades para Exportación Segura de CSV
 * Prevención contra Formula Injection / CSV Injection (CWE-1236)
 * Negocio Flex - Fase 8
 */

/**
 * Sanitiza un valor de celda para evitar que hojas de cálculo (Excel, LibreOffice, Google Sheets)
 * lo interpreten como una fórmula ejecutable si comienza con '=', '+', '-', '@', '\t', '\r'.
 */
export function sanitizeCsvCell(value: unknown): string {
  if (value === null || value === undefined) {
    return '""';
  }

  let str = String(value);

  // Caracteres que pueden disparar ejecución de fórmulas en hojas de cálculo
  const FORMULA_TRIGGERS = ['=', '+', '-', '@', '\t', '\r'];

  // Si el valor inicia con cualquiera de los caracteres desencadenantes, anteponer comilla simple para forzar texto literal
  if (FORMULA_TRIGGERS.some(char => str.startsWith(char))) {
    str = `'${str}`;
  }

  // Escapar comillas dobles internas duplicándolas (" -> "")
  const escaped = str.replace(/"/g, '""');

  return `"${escaped}"`;
}

/**
 * Genera el string completo del archivo CSV con cabeceras y filas sanitizadas en UTF-8 con BOM.
 */
export function generateCsvString(
  headers: string[],
  rows: (string | number | boolean | null | undefined)[][]
): string {
  const sanitizedHeaders = headers.map(h => sanitizeCsvCell(h)).join(',');
  const sanitizedRows = rows.map(row => row.map(cell => sanitizeCsvCell(cell)).join(',')).join('\n');
  return '\uFEFF' + sanitizedHeaders + '\n' + sanitizedRows;
}

/**
 * Genera y descarga un archivo CSV con cabeceras y filas sanitizadas en UTF-8 con BOM en el navegador.
 */
export function exportToCsv(filename: string, headers: string[], rows: (string | number | boolean | null | undefined)[][]): void {
  const csvContent = generateCsvString(headers, rows);
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Alias seguro para exportación rápida en componentes UI (headers, rows, filename)
 */
export function exportSafeCsv(
  headers: string[],
  rows: (string | number | boolean | null | undefined)[][],
  filename: string
): void {
  exportToCsv(filename, headers, rows);
}

/**
 * Alias de sanitización para celdas
 */
export const sanitizeForCsv = sanitizeCsvCell;

/**
 * Genera representación CSV para clientes asegurando mitigación CWE-1236
 */
export function generateCustomersCsv(customers: Array<{
  name: string;
  phone: string;
  email?: string | null;
  address?: string | null;
  reference?: string | null;
  total_orders?: number;
  total_spent?: number;
  last_order_date?: string | null;
  last_order_number?: string | null;
}>): string {
  const headers = ['Nombre', 'Teléfono', 'Email', 'Dirección', 'Referencia', 'Órdenes', 'LTV (Gasto Total)', 'Última Orden'];
  const rows = customers.map(c => [
    c.name,
    c.phone,
    c.email || '',
    c.address || '',
    c.reference || '',
    c.total_orders ?? 0,
    c.total_spent ?? 0,
    c.last_order_number || c.last_order_date || '',
  ]);
  return generateCsvString(headers, rows);
}

/**
 * Parsea un texto CSV respetando comillas, comas interiores y saltos de línea (RFC 4180)
 */
export function parseCustomersCsv(csvContent: string): Array<{
  name: string;
  phone: string;
  email?: string;
  address?: string;
}> {
  const clean = csvContent.replace(/^\uFEFF/, '').trim();
  if (!clean) return [];

  const lines: string[] = [];
  let currentLine = '';
  let insideQuote = false;

  for (let i = 0; i < clean.length; i++) {
    const char = clean[i];
    if (char === '"') {
      insideQuote = !insideQuote;
      currentLine += char;
    } else if ((char === '\n' || char === '\r') && !insideQuote) {
      if (currentLine.trim()) {
        lines.push(currentLine);
      }
      currentLine = '';
      if (char === '\r' && clean[i + 1] === '\n') {
        i++; // skip \n in CRLF
      }
    } else {
      currentLine += char;
    }
  }
  if (currentLine.trim()) {
    lines.push(currentLine);
  }

  if (lines.length < 2) return [];

  const parseLine = (line: string): string[] => {
    const values: string[] = [];
    let curVal = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        if (inQuotes && line[i + 1] === '"') {
          curVal += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (c === ',' && !inQuotes) {
        values.push(curVal.trim());
        curVal = '';
      } else {
        curVal += c;
      }
    }
    values.push(curVal.trim());
    return values;
  };

  const dataRows = lines.slice(1);
  return dataRows.map(rowStr => {
    const cols = parseLine(rowStr);
    return {
      name: cols[0] || '',
      phone: cols[1] || '',
      email: cols[2] || undefined,
      address: cols[3] || undefined,
    };
  });
}
