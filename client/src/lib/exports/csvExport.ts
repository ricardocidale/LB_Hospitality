/**
 * csvExport.ts — Simple CSV file download utility
 *
 * Creates a Blob from a pre-built CSV string, generates a temporary object URL,
 * and triggers a browser download. The caller is responsible for building the
 * CSV content (headers and rows); this function only handles the download
 * mechanics.
 */

/** Download a CSV string as a file in the user's browser. Returns true on success. */
export function downloadCSV(content: string, filename: string): boolean {
  try {
    const safeFilename = filename.replace(/[/\\:*?"<>|]/g, "_");
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = safeFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return true;
  } catch (e) {
    console.error("CSV download failed:", e);
    return false;
  }
}
