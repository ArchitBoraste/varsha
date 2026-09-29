const escapeCell = (value) => {
  const text = String(value ?? '');
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
};

/** RFC 4180 CSV from `columns` ({ header, value(row) }) and rows. */
export const toCsv = (columns, rows) =>
  [columns.map((column) => column.header), ...rows.map((row) => columns.map((column) => column.value(row)))]
    .map((cells) => cells.map(escapeCell).join(','))
    .join('\r\n');

/** Saves text as a file through a temporary download link. */
export function downloadText(filename, text, type = 'text/csv;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  // Revoke after the browser has started the download.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
